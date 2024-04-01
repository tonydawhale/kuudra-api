import { Elysia } from 'elysia';
import logger from './logger';
import db from './database';
import { RouteAnalytics } from './types';

export const setDefaults = (app: Elysia) =>
    app
        .onError((handler) => {
            if (handler.code === 'NOT_FOUND') {
                handler.set.status = 404;
                return {
                    message: 'Not Found',
                    status: 404,
                };
            } else if (handler.code === 'VALIDATION') {
                handler.set.status = 400;
                return handler.error.message;
            } else {
                handler.set.status ||= 500;

                console.log('errored');

                if (handler.set.status === 400) {
                    return {
                        message: 'Unable to process request',
                        status: 400,
                    };
                }
                return 'Service unavailable. Please come back later.';
            }
        })
        .onResponse(async (handler) => {
            if (Bun.env.NODE_ENV !== 'test') {
                logger.info(
                    `[${handler.request.method}] ${handler.request.url} - ${(handler.set.status ||= 500)}`,
                );

                await db.collection<RouteAnalytics>('analytics').updateOne(
                    { route: new URL(handler.request.url).pathname },
                    {
                        $inc: {
                            'analytics.total': 1,
                            [`analytics.per_status.${handler.set.status}`]: 1,
                        }
                    },
                    { upsert: true },
                );
            }
        });
