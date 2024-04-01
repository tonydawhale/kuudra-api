import { Elysia } from 'elysia';
import logger from './logger';
import db from './database';
import { RouteAnalytics } from './types';

const resolveUserAgent = (userAgent: string): string => {
    if (userAgent.includes('Skytils/')) return 'skytils';
    if (userAgent == 'kuudra-dev/bot') return 'bot';
    if (userAgent == 'kuudra-dev/website') return 'website';
    return 'other';
}

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
                            'total': 1,
                            [`status.${handler.set.status}`]: 1,
                            [`user_agents.${resolveUserAgent(handler.request.headers.get('User-Agent') ?? '')}`]: 1,
                        }
                    },
                    { upsert: true },
                );
            }
        });
