import { MongoClient } from 'mongodb';

export enum DbCollections {
    ITEM = 'item',
    HISTORY = 'history'
}

const client = new MongoClient(Bun.env.MONGO_URI as string);
await client.connect();

const db = client.db('kuudra')

db.createIndex(DbCollections.ITEM, { uuid: 1 }, { unique: true })
db.createIndex(DbCollections.ITEM, { id: 1 })
db.createIndex(DbCollections.ITEM, { end: 1 })
db.createIndex(DbCollections.ITEM, { price: 1 })
db.createIndex(DbCollections.ITEM, { 'attributes.$**': 1 })

db.createIndex(DbCollections.HISTORY, { id: 1 })
db.createIndex(DbCollections.HISTORY, { 'attributes.$**': 1 })

export default db;