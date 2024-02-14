import { ApplicationCommandType, ApplicationCommandOptionType } from 'discord-api-types/v10'

export const DISCORD_COMMANDS = [
    {
        name: 'attribute-price',
        type: ApplicationCommandType.ChatInput,
        description: 'Get the price of an attribute',
        options: [
            {
                name: 'attribute1', 
                type: ApplicationCommandOptionType.String, 
                description: 'The first attribute you\'d like to query', 
                required: true
            },
            {
                name: 'attribute2', 
                type: ApplicationCommandOptionType.String, 
                description: 'The second attribute you\'d like to query', 
                required: false
            }
        ]
    }
]