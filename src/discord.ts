import { Context } from "elysia";
import { DISCORD_COMMANDS } from "./commands";
import { APIInteraction, InteractionType } from "discord-api-types/v10";
import { InteractionResponseType } from "discord-interactions";

const initCommands = async () => {
    await fetch(`https://discord.com/api/v10/applications/${Bun.env.DISCORD_CLIENT_ID}/commands`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bot ${Bun.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(DISCORD_COMMANDS)
    })
        .then(() => {
            console.log('Commands initialized');
        })
        .catch((err) => {
            console.error(err);
        })
}

const handleInteraction = async ({ body }: Context & { body: APIInteraction }) => {
    if (body.type === InteractionType.Ping) {
        return {
            type: InteractionResponseType.PONG,
        }
    }
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: 'Hello, world!',
        }
    }
}

export default handleInteraction;

initCommands();