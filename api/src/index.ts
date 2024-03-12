import { Elysia, t } from 'elysia';
import cors from '@elysiajs/cors';
import { html } from '@elysiajs/html';
import { verifyKey } from 'discord-interactions';

import './database';
import './discord';
import logger from './logger';
import { setDefaults } from './hooks';
import * as routes from './routes';
import handleInteraction from './discord';

export const app = new Elysia()
    .use(cors())
    .use(setDefaults)
    .onRequest(({ set }) => {
        set.headers['Access-Control-Allow-Origin'] = '*';
        set.headers['Access-Control-Allow-Headers'] = '*';
        set.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
        set.headers['Access-Control-Max-Age'] = '86400';
        set.headers['Cache-Control'] = 'public, max-age=60 s-maxage=60';
        set.headers['X-Powered-By'] = 'tdw-kuudra-api';
    })
    .use(html())
    .group('/api', (app) =>
        app
            .get(
                '/',
                () => `
                <html lang='en'>
                    <head>
                        <title>tdw kuudra api</title>
                    </head>
                    <body>
                        <h1>tdw kuudra api</h1>
                        <p>kuudra api finds the cheapest auction for a given item with the specified attributes.</p>
                        <h2>Usage</h2>
                        <p>attributes are formatted as <code>{attribute name with underscores as spaces}</code></p>
                        <p>if you would like to specify a specific attribute value, append an underscore and the value to the attribute name</p>
                        <p>eg: <code>mana_regeneration_5</code></p>
                        <ul>
                            <li><code>/api/item?item=ITEM_ID&attr1=ATTRIBUTE&attr2=ATTRIBUTE</code></li>
                            <li><code>/api/attribute_price?item=ITEM_ID&attr1=ATTRIBUTE&attr2=ATTRIBUTE</code></li>
                            <li><code>/api/attribute_upgrade?item=ITEM_ID&attribute=ATTRIBUTE&start=START&end=END</code></li>
                        </ul>
                    </body>
                </html>`,
            )
            .get('/item_price', routes.getItemPrice)
            .get('/shard_price', routes.getShardPrice)
            .get('/attribute_price', routes.getAttributePrice)
            .post('/interactions', handleInteraction, {
                beforeHandle: async ({ set, request, body }) => {
                    if (!Bun.env.DISCORD_CLIENT_PUBLIC_KEY)
                        throw new Error('DISCORD_CLIENT_PUBLIC_KEY is not set');
                    const signature = request.headers.get(
                        'X-Signature-Ed25519',
                    );
                    const timestamp = request.headers.get(
                        'X-Signature-Timestamp',
                    );
                    if (!signature || !timestamp)
                        throw new Error('Invalid request');
                    const isValidRequest = verifyKey(
                        JSON.stringify(body),
                        signature,
                        timestamp,
                        Bun.env.DISCORD_CLIENT_PUBLIC_KEY,
                    );
                    if (!isValidRequest) {
                        set.status = 401;
                        return { error: 'Invalid request' };
                    }
                },
            })
            .group('/upgrade', (app) =>
                app
                    .onBeforeHandle(({ set, request }) => {
                        if (
                            request.headers.get('Authorization') !=
                            Bun.env.KUUDRA_DEV_API_KEY
                        ) {
                            set.status = 401;
                            return { error: 'Unauthorized' };
                        }
                    })
                    .get('/attribute', routes.getAttributeUpgrade),
            )
            .group('/stored', (app) =>
                app
                    .get('/items', routes.getStoredItems)
                    .get('/attributes', routes.getStoredAttributes)
                    .get('/emojis', routes.getStoredEmojis),
            ),
    )
    .listen(Bun.env.PORT || 3000, ({ port }) =>
        logger.info(`kuudra api listening on port ${port}`, undefined, true),
    );

process.on('unhandledRejection', (err) => {
    console.log(err);
});

process.on('uncaughtException', (err) => {
    console.log(err);
});