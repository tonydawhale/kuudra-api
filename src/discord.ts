import { Context } from 'elysia';
import handler, { DISCORD_COMMANDS_DATA } from './commands';
import * as discordApiTypes from 'discord-api-types/v10';
import logger from './logger';

const initCommands = async () => {
    await fetch(
        `https://discord.com/api/v10/applications/${Bun.env.DISCORD_CLIENT_ID}/commands`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bot ${Bun.env.DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(DISCORD_COMMANDS_DATA),
        },
    )
        .then(() => {
            logger.info('Discord commands initialized', undefined, true);
        })
        .catch((err) => {
            console.error(err);
        });
};

const handleInteraction = async ({
    body,
}: Context & { body: discordApiTypes.APIInteraction }) => {
    switch (body.type) {
        case discordApiTypes.InteractionType.ApplicationCommand:
            return handleCommand(body);
        default:
            return {
                type: discordApiTypes.InteractionResponseType.Pong,
            };
    }
};

const handleCommand = async (body: discordApiTypes.APIInteraction) => {
    body = body as discordApiTypes.APIChatInputApplicationCommandInteraction;

    switch (body.data.name) {
        case 'attribute-upgrade':
        case 'au': {
            return await handler.attributeUpgrade(body);
        }
        case 'attribute-price': {
            return await handler.attributePrice(body);
        }
    }
};

export default handleInteraction;

initCommands();
