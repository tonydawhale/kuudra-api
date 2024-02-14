# tdw-kuudra-api

A scalable and self-sufficient api that tracks and stores data regarding [Crimson Isle](https://wiki.hypixel.net/Kuudra) Kuudra items found auction house prices on the [Hypixel Skyblock](https://hypixel.net/) game using the public [Hypixel API](https://api.hypixel.net/). In addition, has a discord bot built using the [Discord Interactions Endpoint](https://discord.com/developers/docs/interactions/application-commands) and the [Discord Interactions JS Package](https://github.com/discord/discord-interactions-js).  
Used by the [Skytils](http://skytils.gg) mod for the kuudra price feature.

### Hosted Versions
* Live Instance: [kuudra.dev/api](https://kuudra.dev/api)
* Beta Version: [s.kuudra.dev/api](https://s.kuudra.dev/api)

## API Usage

* ``

## Discord Bot Usage

## Installation
### Prerequisites
* [Docker](https://docker.com/)
* [Bun](https://bun.sh/)

### Setup
1. After cloning the repository, copy the .env.example using the following command:
```bash
cp .env.example .env
```

2. Fill in the .env file with the required information with the webhook url being a discord webhook url.

### Development

1. For optimal speed, it is recommended to use a locally hosted MongoDB instance. To do so, run the following command:
```bash
docker-compose up -d db
```
If you would like to use a remote MongoDB instance, use the remote URI in the .env file. Otherwise, the default URI is `mongodb://localhost:20001`

2. Run the following command to start the development server:
```bash
bun dev
```

### Production

1. Run the following command to start the production server:
```bash
docker-compose up -d
```

2. 

## Technologies Used
* [TypeScript](https://www.typescriptlang.org/)
* [Bun](https://bun.sh/)
* [ElysiaJS](https://elysiajs.com/)
* [MongoDB](https://www.mongodb.com/)
* [Docker](https://www.docker.com/)
* [Cloudflare Tunnels](https://www.cloudflare.com/products/tunnel/)
