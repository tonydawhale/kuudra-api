import { Elysia } from 'elysia';
import logger from './logger';

export const setDefaults = (app: Elysia) => 
    app
        .onResponse((handler) => {
            if (Bun.env.NODE_ENV !== 'test') {
                logger.info(`[${handler.request.method}] ${handler.request.url} - ${handler.set.status ||= 500}`)
            }
        })
        .onError((handler) => {
            if (handler.code === 'NOT_FOUND') {
                handler.set.status = 404
                return {
                    message: 'Not Found',
                    status: 404
                }
            } else {
                handler.set.status ||= 500;

                if (handler.set.status === 400) {
                    return {
                        message: 'Unable to process request',
                        status: 400
                    };
                }
                return 'Service unavailable. Please come back later.'
            }
        })