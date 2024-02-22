import { Document, MongoClient } from 'mongodb';
import { StoredAuctionItem } from './types';
import { ItemCategory, ItemFamily, ItemType } from './constants';
import { findRequiredLvl1Attributes, toLvl1Attributes } from './util';
import logger from './logger';

export enum DbCollections {
    ITEM = 'item',
    HISTORY = 'history',
}

const client = new MongoClient(Bun.env.MONGO_URI as string);
await client
    .connect()
    .then(() => logger.info('Connected to database', undefined, true));

const db = client.db('kuudra');

db.createIndex(DbCollections.ITEM, { uuid: 1 }, { unique: true });
db.createIndex(DbCollections.ITEM, { id: 1 });
db.createIndex(DbCollections.ITEM, { end: 1 });
db.createIndex(DbCollections.ITEM, { price: 1 });
db.createIndex(DbCollections.ITEM, { 'attributes.$**': 1 });
db.createIndex(DbCollections.HISTORY, { id: 1 });
db.createIndex(DbCollections.HISTORY, { 'attributes.$**': 1 });

export const getItemUpgrade = async (
    item_id: string,
    attribute: string,
    start: number,
    end: number,
    category: ItemCategory,
    type?: ItemType,
    family?: ItemFamily,
): Promise<{
    totalCost: number;
    upgrades: Record<string, Record<string, any>[]>;
}> => {
    const pipeline: Document[] = [
        {
            $match: {
                $or: [
                    {
                        $and: [
                            { attributes: { $exists: true, $ne: null } },
                            { [`attributes.${attribute}`]: { $lt: end } },
                            { category: category },
                            { type: type },
                        ],
                    },
                    {
                        $and: [
                            { attributes: { $exists: true, $ne: null } },
                            { [`attributes.${attribute}`]: { $lt: end } },
                            { id: 'ATTRIBUTE_SHARD' },
                        ],
                    },
                ],
            },
        },
        { $sort: { price: 1 } },
        { $project: { _id: 0, uuid: 1, id: 1, price: 1, attributes: 1 } },
    ];

    if (family) {
        pipeline[0].$match.$or[0].$and.push({ family: family });
    } else {
        pipeline[0].$match.$or[0].$and.push({ id: item_id });
    }

    const result = await db
        .collection<StoredAuctionItem>(DbCollections.ITEM)
        .aggregate(pipeline)
        .toArray()
        .then((res) => {
            console.log('got item upgrade data');
            return res;
        })
        .catch((err) => {
            console.log(err);
            return [];
        });

    const sorted = result.sort(
        (a, b) =>
            a.price / toLvl1Attributes(a.attributes[attribute]) -
            b.price / toLvl1Attributes(b.attributes[attribute]),
    );

    const upgrades: Record<string, Record<string, any>[]> = {};

    for (let i = start; i < end; i++) {
        upgrades[i + 1] = [];
        const upgradesNeeded = findRequiredLvl1Attributes(i, i + 1);
        let upgradesRemaining = upgradesNeeded;
        for (let j = 0; j < sorted.length; j++) {
            const lvl1Attributes = toLvl1Attributes(
                sorted[j].attributes[attribute],
            );
            if (upgradesRemaining - lvl1Attributes >= 0) {
                const item = sorted[j];
                upgrades[i + 1].push({
                    id: item.id,
                    price: item.price,
                    uuid: item.uuid,
                    attribute_level: item.attributes[attribute],
                });
                upgradesRemaining -= lvl1Attributes;
                sorted.splice(j, 1);
            }
        }
        upgrades[i + 1] = upgrades[i + 1].sort(
            (a, b) => a.attribute_level - b.attribute_level,
        );
    }

    return {
        totalCost: Object.values(upgrades)
            .flat()
            .reduce((acc, cur) => acc + cur.price, 0),
        upgrades,
    };
};

export const getShardPrice = async (
    attribute: string,
    level: number,
    limit: number = 1,
) => {
    const pipeline: Document[] = [
        {
            $match: {
                $and: [
                    { attributes: { $exists: true, $ne: null } },
                    { [`attributes.${attribute}`]: level },
                    { id: 'ATTRIBUTE_SHARD' },
                ],
            },
        },
        {
            $sort: { price: 1 }, // Sort by cheapest starting_bid
        },
        {
            $limit: limit,
        },
        {
            $project: {
                _id: 0,
                uuid: 1,
                id: 1,
                price: 1,
            },
        },
    ];

    const result = await db
        .collection<StoredAuctionItem>(DbCollections.ITEM)
        .aggregate(pipeline)
        .toArray()
        .catch((err) => {
            throw new Error(err);
        });

    if (result.length === 0) {
        const historyPipleine: Document[] = [
            {
                $match: {
                    $and: [
                        { attributes: { $exists: true, $ne: null } },
                        { [`attributes.${attribute}`]: level },
                        { id: 'ATTRIBUTE_SHARD' },
                    ],
                },
            },
            {
                $addFields: {
                    latestHistory: {
                        $arrayElemAt: [{ $slice: ['$history', -1] }, 0],
                    },
                },
            },
            {
                $addFields: {
                    latestPrice: '$latestHistory.price',
                    latestTimestamp: '$latestHistory.timestamp',
                },
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    id: 1, // Include id field
                    price: '$latestPrice', // Include latestPrice field as price
                    timestamp: '$latestTimestamp', // Include latestTimestamp field
                },
            },
        ];

        const historyResult = await db
            .collection<StoredAuctionItem>(DbCollections.HISTORY)
            .aggregate(historyPipleine)
            .toArray()
            .catch((err) => {
                throw new Error(err);
            });

        if (historyResult.length === 0) return [];
        else return historyResult;
    }
    return result;
};

export const getItemPrice = async (
    item: string,
    attr1: { name: string; level: number },
    attr2: { name: string; level: number },
) => {
    const pipeline: Document[] = [
        {
            $match: {
                $and: [
                    { attributes: { $exists: true, $ne: null } },
                    { [`attributes.${attr1.name}`]: attr1.level },
                    { [`attributes.${attr2.name}`]: attr2.level },
                    { id: item.toUpperCase() },
                ],
            },
        },
        {
            $sort: { price: 1 }, // Sort by cheapest starting_bid
        },
        {
            $limit: 1,
        },
        {
            $project: {
                _id: 0,
                uuid: 1,
                id: 1,
                price: 1,
            },
        },
    ];

    const result = await db
        .collection<StoredAuctionItem>(DbCollections.ITEM)
        .aggregate(pipeline)
        .toArray()
        .catch((err) => {
            throw new Error(err);
        });

    if (result.length === 0) {
        const historyPipleine: Document[] = [
            {
                $match: {
                    $and: [
                        { attributes: { $exists: true, $ne: null } },
                        { [`attributes.${attr1.name}`]: attr1.level },
                        { [`attributes.${attr2.name}`]: attr2.level },
                        ,
                        { id: item.toUpperCase() },
                    ],
                },
            },
            {
                $addFields: {
                    latestHistory: {
                        $arrayElemAt: [{ $slice: ['$history', -1] }, 0],
                    },
                },
            },
            {
                $addFields: {
                    latestPrice: '$latestHistory.price',
                    latestTimestamp: '$latestHistory.timestamp',
                },
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    id: 1, // Include id field
                    price: '$latestPrice', // Include latestPrice field as price
                    timestamp: '$latestTimestamp', // Include latestTimestamp field
                },
            },
        ];

        const historyResult = await db
            .collection<StoredAuctionItem>(DbCollections.HISTORY)
            .aggregate(historyPipleine)
            .toArray()
            .catch((err) => {
                throw new Error(err);
            });

        if (historyResult.length === 0) return [];
        else return historyResult;
    }

    return result;
};

export default db;
