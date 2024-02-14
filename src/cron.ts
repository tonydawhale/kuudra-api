import { cron } from '@elysiajs/cron';
import Elysia from 'elysia';
import { promisify } from 'util';
import { parse, simplify } from 'prismarine-nbt';
import db, { DbCollections } from './database';
import logger from './logger';
import type { HypixelAhItem, HypixelAhResponse, HypixelRecentlyEndedResponse, StoredAuctionItem, StoredAuctionItemHistory } from './types';
import { AnyBulkWriteOperation } from 'mongodb';
import { ITEM_METADATA } from './constants';

const parseNbt = promisify(parse);

export const setupCron = (app: Elysia) =>
    app
        .use(
            cron({
                name: 'clearEndedAuctions',
                timezone: 'America/New_York',
                pattern: '*/30 * * * * *',
                run: clearAuctions
            })
        )
        .use(
            cron({
                name: 'refreshAuctions',
                timezone: 'America/New_York',
                pattern: '* * * * *',
                run: refreshAuctions
            })
        )

const clearAuctions = async () => {
    const start = Date.now();

    let recentlyEnded = await hypixelRequest<HypixelRecentlyEndedResponse>('v2/skyblock/auctions_ended');

    if (!recentlyEnded || !recentlyEnded.success) {
        logger.webhook(`failed to fetch recently ended auctions: ${recentlyEnded?.cause}`, true);
        return;
    }

    const currItems = await db.collection<StoredAuctionItem>(DbCollections.ITEM).distinct('uuid');

    recentlyEnded.auctions = recentlyEnded.auctions.filter(a => currItems.includes(a.auction_id));

    let operations: AnyBulkWriteOperation<StoredAuctionItem>[] = [];
    let historyOperations: AnyBulkWriteOperation<StoredAuctionItemHistory>[] = [];

    for (const { auction_id, item_bytes, price, timestamp } of recentlyEnded.auctions) {
        const { attributes, id } = await parseNbt(Buffer.from(item_bytes, 'base64'))
            .then(d => simplify(d))
            .then(d => d.i[0].tag.ExtraAttributes)
            .catch(err => {
                logger.webhook(`failed to parse nbt for ${auction_id}: ${err}`, true);
                return null;
            });

        if (attributes && id) {
            historyOperations.push(
                {
                    updateOne: {
                        filter: { id, 'attributes': attributes },
                        update: {
                            $setOnInsert: {
                                id,
                                attributes,
                                last_updated: recentlyEnded.lastUpdated,
                                history: []
                            }
                        },
                        upsert: true,
                    }
                },
                {
                    updateOne: {
                        filter: { id, 'attributes': attributes },
                        update: {
                            $push: {
                                history: {
                                    timestamp,
                                    price
                                }
                            }
                        }
                    }
                }
            )
        }

        operations.push({
            deleteOne: {
                filter: { uuid: auction_id }
            }
        })
    }

    operations.push({
        deleteMany: {
            filter: { end: { $lte: Date.now() } }
        }
    })

    await db.collection<StoredAuctionItem>(DbCollections.ITEM).bulkWrite(operations)
        .then(result => logger.webhook(`deleted ${result.deletedCount} items in ${(Date.now() - start)/1000}s`))
        .catch(err => logger.webhook(`failed to delete items: ${err}`, true));

    if (historyOperations.length) await db.collection<StoredAuctionItemHistory>(DbCollections.HISTORY).bulkWrite(historyOperations)
        .then(result => logger.webhook(`updated ${result.modifiedCount + result.upsertedCount} history items in ${(Date.now() - start)/1000}s`))
        .catch(err => logger.webhook(`failed to update history items: ${err}`, true));
}

const refreshAuctions = async () => {
    const start = Date.now();

    let maxPage = 1;
    let currentPage = 0;
    let items: HypixelAhItem[] = [];
    
    do {
        const data = await fetchAhPage(currentPage);
        maxPage = data.totalPages;
        items = items.concat(data.auctions);
        currentPage++;
    } while (currentPage < maxPage);

    let operations: AnyBulkWriteOperation<StoredAuctionItem>[] = [];

    for (const item of items) {
        const { bin, claimed, end, item_bytes, last_updated, starting_bid: price, uuid } = item;

        if (end <= Date.now() || !item_bytes || !bin || claimed) continue;

        const { attributes, id } = await parseNbt(Buffer.from(item_bytes, 'base64'))
            .then(d => simplify(d))
            .then(d => d.i[0].tag.ExtraAttributes)
            .catch(err => {
                logger.webhook(`failed to parse nbt for ${item.uuid}: ${err}`, true);
                return null;
            });

        if (attributes && id) {
            operations.push({
                updateOne: {
                    filter: { uuid: item.uuid },
                    update: {
                        $set: {
                            id,
                            last_updated,
                            price,
                            uuid,
                            attributes,
                            end,
                            ...ITEM_METADATA[id]
                        }
                    },
                    upsert: true,
                }
            })
        }
    }

    await db.collection<StoredAuctionItem>(DbCollections.ITEM).bulkWrite(operations)
        .then(result => logger.webhook(`updated ${result.modifiedCount + result.upsertedCount} items in ${(Date.now() - start)/1000}s`))
        .catch(err => logger.webhook(`failed to update items: ${err}`, true));
}

const fetchAhPage = async (page: number): Promise<HypixelAhResponse> => {
    const data = await hypixelRequest<HypixelAhResponse>(`v2/skyblock/auctions?page=${page}`);

    if (!data || !data.success) {
        throw new Error(data?.cause);
    }

    return data!;
}

export const hypixelRequest = async <ResponseType = unknown>(path: string): Promise<ResponseType | null> => {
    return await fetch(`https://api.hypixel.net/${path}`)
        .then(res => res.json() as Promise<ResponseType>)
        .catch(err => {
            logger.webhook(`failed to fetch hypixel endpoint: ${path}: ${err}`, true)
            return null;
        })
}