import chalk from 'chalk';

class Logger {
    time() {
        return new Date().toLocaleTimeString([], {
            calendar: 'gregory',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    }
    info(message: any, error?: boolean, webhook: boolean = false) {
        if (webhook) this.webhook(message, error);
        return console.log(
            error
                ? chalk.bgWhiteBright.red(`ERROR [${this.time()}] INFO >`)
                : chalk.bgWhiteBright.black(`[${this.time()}] INFO >`),
            ' ',
            chalk.blueBright(message),
        );
    }
    webhook(message: string, error?: boolean) {
        fetch(Bun.env.DISCORD_WEBHOOK_URL as string, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [
                    {
                        description: message,
                        color: error ? 0xff0000 : 0x00ff00,
                        timestamp: new Date().toISOString(),
                        footer: {
                            text: `tdw kuudra api v${require('../package.json').version}`,
                        },
                    },
                ],
                allowed_mentions: {
                    users: ['244181430085746688'],
                },
                content: error ? '<@!244181430085746688>' : undefined,
            }),
        });
    }
}

const logger = new Logger();
export default logger;
