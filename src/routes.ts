import { Context } from 'elysia';

import * as db from './database';
import { StoredAuctionItem } from './types';
import {
    ATTRIBUTE_NICKNAME_MAPPINGS,
    ITEM_EMOJIS,
    ITEM_METADATA,
    MISC_EMOJIS,
} from './constants';
import { Document } from 'mongodb';
import logger from './logger';

export const regex = /^([a-zA-Z]+(?:_[a-zA-Z]+)*)(?:\s*_?(\d{1,2}))?$/;

export const getShardPrice = async (ctx: Context) => {
    let { attr } = ctx.query;

    if (!attr) {
        ctx.set.status = 400;
        return { error: 'missing required query parameters' };
    }

    if (!regex.test(attr)) {
        ctx.set.status = 400;
        return { error: 'invalid attribute format' };
    }

    let [_, attrName, attrValue] = attr.match(regex)!;

    if (!attrValue) {
        ctx.set.status = 400;
        return { error: 'missing attribute level' };
    }
    if (parseInt(attrValue) > 3) {
        ctx.set.status = 400;
        return { error: 'attribute level cannot be greater than 3' };
    }

    attrName = attrName.toLowerCase();

    if (attrName in ATTRIBUTE_NICKNAME_MAPPINGS)
        attrName =
            ATTRIBUTE_NICKNAME_MAPPINGS[
                attrName as keyof typeof ATTRIBUTE_NICKNAME_MAPPINGS
            ];

    const data = await db
        .getShardPrice(attrName, parseInt(attrValue))
        .catch((err) => {
            logger.webhook(err, true);
            return [];
        });

    if (data.length === 0) {
        ctx.set.status = 404;
        return { error: 'no results found' };
    }

    return data[0];
};

export const getItemPrice = async (ctx: Context) => {
    let { item, attr1, attr2 } = ctx.query;

    if (!item || !attr1 || !attr2) {
        ctx.set.status = 400;
        return { error: 'missing required query parameters' };
    }

    // Check if the item is a shard in which case they can only have one attribute therefore we modify the query
    if (item.toUpperCase() === 'ATTRIBUTE_SHARD') {
        ctx.set.status = 400;
        return {
            error: 'shards are not supported on this endpoint. please use /api/shard_price',
        };
    }

    if (!regex.test(attr1) || !regex.test(attr2)) {
        ctx.set.status = 400;
        return { error: 'invalid attribute format' };
    }

    let [_, attr1Name, attr1Value] = attr1.match(regex)!;
    let [__, attr2Name, attr2Value] = attr2.match(regex)!;
    attr1Name = attr1Name.toLowerCase();
    attr2Name = attr2Name.toLowerCase();

    if (attr1Name in ATTRIBUTE_NICKNAME_MAPPINGS)
        attr1Name =
            ATTRIBUTE_NICKNAME_MAPPINGS[
                attr1Name as keyof typeof ATTRIBUTE_NICKNAME_MAPPINGS
            ];
    if (attr2Name in ATTRIBUTE_NICKNAME_MAPPINGS)
        attr2Name =
            ATTRIBUTE_NICKNAME_MAPPINGS[
                attr2Name as keyof typeof ATTRIBUTE_NICKNAME_MAPPINGS
            ];

    const data = await db
        .getItemPrice(
            item,
            { name: attr1Name, level: parseInt(attr1Value) },
            { name: attr2Name, level: parseInt(attr2Value) },
        )
        .catch((err) => {
            logger.webhook(err, true);
            return [];
        });

    if (data.length === 0) {
        ctx.set.status = 404;
        return { error: 'no results found' };
    }

    return data[0];
};

export const getAttributePrice = async (ctx: Context) => {
    const { attr1, attr2, limit } = ctx.query;

    if (!attr1) {
        ctx.set.status = 400;
        return { error: 'missing required at least one attribute' };
    }

    if (!regex.test(attr1) && attr2 && !regex.test(attr2)) {
        ctx.set.status = 400;
        return { error: 'invalid attribute format' };
    }

    let match: Document[] = [];

    let [_, attr1Name, attr1Value] = attr1.match(regex)!;
    attr1Name = attr1Name.toLowerCase();
    if (attr1Name in ATTRIBUTE_NICKNAME_MAPPINGS)
        attr1Name =
            ATTRIBUTE_NICKNAME_MAPPINGS[
                attr1Name as keyof typeof ATTRIBUTE_NICKNAME_MAPPINGS
            ];
    match.push({ [`attributes.${attr1Name}`]: { $exists: true } });
    if (attr1Value)
        match.push({ [`attributes.${attr1Name}`]: parseInt(attr1Value) });
    else match.push({ [`attributes.${attr1Name}`]: { $gt: 0 } });

    if (attr2) {
        let [__, attr2Name, attr2Value] = attr2.match(regex)!;
        attr2Name = attr2Name.toLowerCase();
        if (attr2Name in ATTRIBUTE_NICKNAME_MAPPINGS)
            attr2Name =
                ATTRIBUTE_NICKNAME_MAPPINGS[
                    attr2Name as keyof typeof ATTRIBUTE_NICKNAME_MAPPINGS
                ];
        match.push({ [`attributes.${attr2Name}`]: { $exists: true } });
        if (attr2Value)
            match.push({ [`attributes.${attr2Name}`]: parseInt(attr2Value) });
        else match.push({ [`attributes.${attr1Name}`]: { $gt: 0 } });
    }

    const pipeline: Document[] = [
        {
            $match: {
                $and: [{ attributes: { $exists: true, $ne: null } }, ...match],
            },
        },
        {
            $sort: {
                price: 1,
            },
        },
        {
            $group: {
                _id: {
                    id: '$id',
                    category: '$category',
                    type: '$type',
                    attributeLevel: { $objectToArray: '$attributes' },
                },
                document: { $first: '$$ROOT' },
            },
        },
        {
            $replaceRoot: { newRoot: '$document' },
        },
        {
            $project: {
                _id: 0,
                uuid: 1,
                id: 1,
                price: 1,
                attributes: 1,
                category: 1,
                type: 1,
            },
        },
    ];

    const result = await db.default
        .collection<StoredAuctionItem>(db.DbCollections.ITEM)
        .aggregate(pipeline)
        .toArray()
        .catch((err) => {
            console.log(err);
            return [];
        });

    if (result.length === 0) {
        ctx.set.status = 404;
        return { error: 'no results found' };
    }

    return result;
};

export const getStoredAttributes = async (ctx: Context) => {
    const pipeline: Document[] = [
        {
            $group: {
                _id: null,
                keys: { $addToSet: { $objectToArray: '$attributes' } },
            },
        },
        {
            $project: {
                _id: 0,
                keys: {
                    $reduce: {
                        input: '$keys',
                        initialValue: [],
                        in: { $setUnion: ['$$this.k', '$$value'] },
                    },
                },
            },
        },
    ];

    const result = await db.default
        .collection<StoredAuctionItem>(db.DbCollections.ITEM)
        .aggregate(pipeline)
        .toArray()
        .then((res) => res[0].keys as string[])
        .catch((err) => {
            console.log(err);
            return [];
        });

    if (result.length === 0) {
        ctx.set.status = 404;
        return { error: 'no results found' };
    }

    return result;
};

export const getStoredItems = async (ctx: Context) => {
    const pipeline: Document[] = [
        {
            $group: {
                _id: null,
                keys: { $addToSet: '$id' },
            },
        },
        {
            $project: {
                _id: 0,
                keys: 1,
            },
        },
    ];

    const result = await db.default
        .collection<StoredAuctionItem>(db.DbCollections.ITEM)
        .aggregate(pipeline)
        .toArray()
        .then((res) => res[0].keys as string[])
        .catch((err) => {
            console.log(err);
            return [];
        });

    if (result.length === 0) {
        ctx.set.status = 404;
        return { error: 'no results found' };
    }

    return result.sort((a, b) => a.localeCompare(b));
};

export const getStoredEmojis = async (ctx: Context) => {
    return {
        ...ITEM_EMOJIS,
        ...MISC_EMOJIS,
    };
};

export const getAttributeUpgrade = async (ctx: Context) => {
    const { attribute, item, start, end } = ctx.query;

    if (!attribute || !start || !end || !item) {
        ctx.set.status = 400;
        return { error: 'missing required query parameters' };
    }

    if (!regex.test(attribute)) {
        ctx.set.status = 400;
        return { error: 'invalid attribute format' };
    }

    let [_, attrName] = attribute.match(regex)!;
    attrName = attrName.toLowerCase();

    if (attrName in ATTRIBUTE_NICKNAME_MAPPINGS)
        attrName =
            ATTRIBUTE_NICKNAME_MAPPINGS[
                attrName as keyof typeof ATTRIBUTE_NICKNAME_MAPPINGS
            ];
    if (!(item.toUpperCase() in ITEM_METADATA)) {
        ctx.set.status = 400;
        return { error: 'invalid item' };
    }

    const result = await db
        .getItemUpgrade(
            item.toUpperCase(),
            attrName,
            parseInt(start),
            parseInt(end),
            ITEM_METADATA[item.toUpperCase()].category,
            ITEM_METADATA[item.toUpperCase()].type,
            ITEM_METADATA[item.toUpperCase()].family,
        )
        .catch(console.error);

    return result;
};
