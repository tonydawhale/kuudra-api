import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    APIChatInputApplicationCommandInteraction,
    APIApplicationCommandInteractionDataStringOption,
    APIApplicationCommandInteractionDataIntegerOption,
    InteractionResponseType,
    APIInteractionResponse,
    APIEmbed,
    APIEmbedField,
} from 'discord-api-types/v10';

import { regex as AttributeRegex } from './routes';
import {
    ATTRIBUTE_NICKNAME_MAPPINGS,
    ITEM_EMOJIS,
    ITEM_METADATA,
    ITEM_NAME_MAPPINGS,
    MISC_EMOJIS,
} from './constants';
import * as db from './database';
import { formatNumber } from './util';

export const DISCORD_COMMANDS_DATA = [
    {
        name: 'attribute-price',
        type: ApplicationCommandType.ChatInput,
        description: 'Get the price of an attribute',
        options: [
            {
                name: 'attribute1',
                type: ApplicationCommandOptionType.String,
                description: "The first attribute you'd like to query",
                required: true,
            },
            {
                name: 'attribute2',
                type: ApplicationCommandOptionType.String,
                description: "The second attribute you'd like to query",
                required: false,
            },
        ],
    },
    {
        name: 'attribute-upgrade',
        type: ApplicationCommandType.ChatInput,
        description: 'Get the cheapest way to upgrade an attribute',
        options: [
            {
                name: 'item',
                type: ApplicationCommandOptionType.String,
                description: "The item you'd like to upgrade",
                required: true,
            },
            {
                name: 'attribute',
                type: ApplicationCommandOptionType.String,
                description: "The attribute you'd like to upgrade",
                required: true,
            },
            {
                name: 'start',
                type: ApplicationCommandOptionType.Integer,
                description: 'The starting level of the attribute',
                required: true,
            },
            {
                name: 'end',
                type: ApplicationCommandOptionType.Integer,
                description: 'The ending level of the attribute',
                required: true,
            },
        ],
    },
    {
        name: 'au',
        type: ApplicationCommandType.ChatInput,
        description: 'Get the cheapest way to upgrade an attribute',
        options: [
            {
                name: 'item',
                type: ApplicationCommandOptionType.String,
                description: "The item you'd like to upgrade",
                required: true,
            },
            {
                name: 'attribute',
                type: ApplicationCommandOptionType.String,
                description: "The attribute you'd like to upgrade",
                required: true,
            },
            {
                name: 'start',
                type: ApplicationCommandOptionType.Integer,
                description: 'The starting level of the attribute',
                required: true,
            },
            {
                name: 'end',
                type: ApplicationCommandOptionType.Integer,
                description: 'The ending level of the attribute',
                required: true,
            },
        ],
    },
    {
        name: 'shard-price',
        type: ApplicationCommandType.ChatInput,
        description: 'Get the prices of a shard',
        options: [
            {
                name: 'attribute',
                type: ApplicationCommandOptionType.String,
                description: "The attribute you'd like to upgrade",
                required: true,
            },
        ],
    },
];

const attributeUpgrade = async (
    interaction: APIChatInputApplicationCommandInteraction,
): Promise<APIInteractionResponse> => {
    const item = (
        interaction.data.options?.find(
            (option) => option.name === 'item',
        ) as APIApplicationCommandInteractionDataStringOption
    ).value;
    let attribute = (
        interaction.data.options?.find(
            (option) => option.name === 'attribute',
        ) as APIApplicationCommandInteractionDataStringOption
    ).value.replace(/ /g, '_');
    const start = (
        interaction.data.options?.find(
            (option) => option.name === 'start',
        ) as APIApplicationCommandInteractionDataIntegerOption
    ).value;
    const end = (
        interaction.data.options?.find(
            (option) => option.name === 'end',
        ) as APIApplicationCommandInteractionDataIntegerOption
    ).value;

    if (!AttributeRegex.test(attribute)) {
        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: 1 << 6,
                content: 'Invalid attribute format!',
            },
        };
    }

    let [_, attrName] = attribute.match(AttributeRegex)!;
    attribute = attrName.toLowerCase();
    if (attribute in ATTRIBUTE_NICKNAME_MAPPINGS)
        attribute =
            ATTRIBUTE_NICKNAME_MAPPINGS[
                attribute as keyof typeof ATTRIBUTE_NICKNAME_MAPPINGS
            ];

    const itemNameMappings = Object.fromEntries(
        Object.entries(ITEM_NAME_MAPPINGS).map(([key, value]) => [
            key.toLowerCase(),
            value,
        ]),
    );
    if (!(item.toLowerCase() in itemNameMappings)) {
        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: 1 << 6,
                content:
                    'Failed to find an item name mapping for the given item!',
            },
        };
    }
    const itemId = itemNameMappings[item.toLowerCase()];

    if (!(itemId.toUpperCase() in ITEM_METADATA)) {
        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                flags: 1 << 6,
                content: 'Failed to find item metadata for the given item!',
            },
        };
    }
    const itemMetadata = ITEM_METADATA[itemId.toUpperCase()];

    const itemPretty = Object.entries(ITEM_NAME_MAPPINGS).find(
        ([_, value]) => value === itemId,
    )![0];

    const result = await db.getItemUpgrade(
        itemId,
        attribute,
        start,
        end,
        itemMetadata.category,
        itemMetadata.type,
        itemMetadata.family,
    );

    const embed: APIEmbed = {
        title: `Cheapest way to upgrade \`${attribute}\` on your ${ITEM_EMOJIS[itemId]} \`${itemPretty}\` from level \`${start}\` to \`${end}\``,
        description: `Total cost: ${MISC_EMOJIS.COIN} \`${formatNumber(result.totalCost)}\``,
        color: 4365240,
        timestamp: new Date().toISOString(),
        footer: {
            text: `What the Kuudra v${require('../package.json').version}`,
            icon_url:
                'https://cdn.discordapp.com/avatars/1202396296913100880/1e03d7f2473b0811d9cd2fbe29afdf23.png',
        },
    };

    const fields: APIEmbedField[] = [];
    for (const [level, upgrades] of Object.entries(result.upgrades)) {
        let fieldIndex = 0;
        const levelFields: APIEmbedField[] = [
            {
                name: `Upgrade to Level ${level} | \`${formatNumber(upgrades.reduce((acc, cur) => acc + cur.price, 0))}\` ${MISC_EMOJIS.COIN}`,
                value: '',
                inline: false,
            },
        ];
        for (const upgrade of upgrades) {
            const line = `**${upgrade.attribute_level}** ${ITEM_EMOJIS[upgrade.id]} - \`/viewauction ${upgrade.uuid}\` for **${formatNumber(upgrade.price)}**\n`;
            if (levelFields.at(fieldIndex)!.value.length + line.length > 1024) {
                fieldIndex++;
                levelFields.push({
                    name: `Upgrade to Level ${level} Cont'd`,
                    value: '',
                    inline: false,
                });
            }
            levelFields.at(fieldIndex)!.value += line;
        }
        fields.push(...levelFields);
    }
    embed.fields = fields;

    return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            embeds: [embed],
        },
    };
};

const attributePrice = async (
    interaction: APIChatInputApplicationCommandInteraction,
): Promise<APIInteractionResponse> => {
    return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: 'attributePrice',
        },
    };
};

const shardPrice = async (
    interaction: APIChatInputApplicationCommandInteraction,
): Promise<APIInteractionResponse> => {
    return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
            content: 'shardPrice',
        },
    };
};

const commandsHandler = {
    attributeUpgrade,
    attributePrice,
    shardPrice,
};

export default commandsHandler;
