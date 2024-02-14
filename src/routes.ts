import { Context } from "elysia";

import db, { DbCollections } from "./database";
import { StoredAuctionItem } from "./types";
import { ATTRIBUTE_MAPPINGS } from "./constants";
import { Document } from "mongodb";

const regex = /^([a-zA-Z]+(?:_[a-zA-Z]+)*)(?:\s*_?(\d{1,2}))?$/;

export const getItemPrice = async (ctx: Context) => {
  let { item, attr1, attr2 } = ctx.query;

  if (!item || !attr1) {
    ctx.set.status = 400;
    return { error: 'missing required query parameters' };
  }

  // Check if the item is a shard in which case they can only have one attribute therefore we modify the query
  if (item.toUpperCase() === 'ATTRIBUTE_SHARD' && attr1) {
    attr2 = attr1;
  }

  if (!attr2) {
    ctx.set.status = 400;
    return { error: 'missing required query parameters' };
  }

  if (!regex.test(attr1) || !regex.test(attr2)) {
    ctx.set.status = 400;
    return { error: 'invalid attribute format' };
  }

  let [_, attr1Name, attr1Value] = attr1.match(regex)!;
  let [__, attr2Name, attr2Value] = attr2.match(regex)!;
  attr1Name = attr1Name.toLowerCase();
  attr2Name = attr2Name.toLowerCase();

  if (attr1Name in ATTRIBUTE_MAPPINGS) attr1Name = ATTRIBUTE_MAPPINGS[attr1Name as keyof typeof ATTRIBUTE_MAPPINGS];
  if (attr2Name in ATTRIBUTE_MAPPINGS) attr2Name = ATTRIBUTE_MAPPINGS[attr2Name as keyof typeof ATTRIBUTE_MAPPINGS];

  const pipeline: Document[] = [
    {
      $match: {
        $and: [
          { 'attributes': { $exists: true, $ne: null } },
          { [`attributes.${attr1Name}`]: parseInt(attr1Value) },
          { [`attributes.${attr2Name}`]: parseInt(attr2Value) },
          { 'id': item.toUpperCase() }
        ]
      }
    },
    {
      $sort: { 'price': 1 } // Sort by cheapest starting_bid
    },
    {
      $limit: 1
    },
    {
      $project: {
        _id: 0,
        uuid: 1,
        id: 1,
        price: 1,
      }
    }
  ];

  const result = await db.collection<StoredAuctionItem>(DbCollections.ITEM).aggregate(pipeline).toArray()
    .catch(err => {
      console.log(err);
      return [];
    });

  if (result.length === 0) {
    const historyPipleine: Document[] = [
      {
        $match: {
          $and: [
            { 'attributes': { $exists: true, $ne: null } },
            { [`attributes.${attr1Name}`]: parseInt(attr1Value) },
            { [`attributes.${attr2Name}`]: parseInt(attr2Value) },
            { 'id': item.toUpperCase() }
          ]
        }
      },
      {
        $addFields: {
          'latestHistory': {
            $arrayElemAt: [{ $slice: ["$history", -1] }, 0]
          }
        }
      },
      {
        $addFields: {
          'latestPrice': '$latestHistory.price',
          'latestTimestamp': '$latestHistory.timestamp'
        }
      },
      {
        $project: {
          '_id': 0, // Exclude _id field
          'id': 1, // Include id field
          'price': '$latestPrice', // Include latestPrice field as price
          'timestamp': '$latestTimestamp' // Include latestTimestamp field
        }
      }
    ];

    const historyResult = await db.collection<StoredAuctionItem>(DbCollections.HISTORY).aggregate(historyPipleine).toArray()
      .catch(err => {
        console.log(err);
        return [];
      });

    if (historyResult.length === 0) {
      ctx.set.status = 404;
      return { error: 'no results found' };
    }

    return historyResult[0];
  }

  return result[0];
}

export const getAttributePrice = async (ctx: Context) => {
  const { attr1, attr2, limit } = ctx.query;

  if (!attr1) {
    ctx.set.status = 400;
    return { error: 'missing required at least one attribute' };
  }


  if (!regex.test(attr1) && (attr2 && !regex.test(attr2))) {
    ctx.set.status = 400;
    return { error: 'invalid attribute format' };
  }

  let match: Document[] = [];

  let [_, attr1Name, attr1Value] = attr1.match(regex)!;
  attr1Name = attr1Name.toLowerCase();
  if (attr1Name in ATTRIBUTE_MAPPINGS) attr1Name = ATTRIBUTE_MAPPINGS[attr1Name as keyof typeof ATTRIBUTE_MAPPINGS];
  match.push({ [`attributes.${attr1Name}`]: { $exists: true } });
  if (attr1Value) match.push({ [`attributes.${attr1Name}`]: parseInt(attr1Value) });
  else match.push({ [`attributes.${attr1Name}`]: { $gt: 0 } });

  if (attr2) {
    let [__, attr2Name, attr2Value] = attr2.match(regex)!;
    attr2Name = attr2Name.toLowerCase();
    if (attr2Name in ATTRIBUTE_MAPPINGS) attr2Name = ATTRIBUTE_MAPPINGS[attr2Name as keyof typeof ATTRIBUTE_MAPPINGS];
    match.push({ [`attributes.${attr2Name}`]: { $exists: true } });
    if (attr2Value) match.push({ [`attributes.${attr2Name}`]: parseInt(attr2Value) });
    else match.push({ [`attributes.${attr1Name}`]: { $gt: 0 } });
  }

  const pipeline: Document[] = [
    {
      $match: {
        $and: [
          { 'attributes': { $exists: true, $ne: null } },
          ...match,
        ]
      }
    },
    {
      $sort: {
        'price': 1,
      }
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
      }
    }
  ];


  const result = await db.collection<StoredAuctionItem>(DbCollections.ITEM).aggregate(pipeline).toArray()
    .catch(err => {
      console.log(err);
      return [];
    });

  if (result.length === 0) {
    ctx.set.status = 404;
    return { error: 'no results found' };
  }

  return result;
}

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
        keys: { $reduce: { input: '$keys', initialValue: [], in: { $setUnion: ['$$this.k', '$$value'] } } },
      },
    },
  ];

  const result = await db.collection<StoredAuctionItem>(DbCollections.ITEM).aggregate(pipeline).toArray()
    .then(res => res[0].keys as string[])
    .catch(err => {
      console.log(err);
      return [];
    });

  if (result.length === 0) {
    ctx.set.status = 404;
    return { error: 'no results found' };
  }

  return result;
}