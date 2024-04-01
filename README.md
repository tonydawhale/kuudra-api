# tdw-kuudra-api

A scalable and self-sufficient api that tracks and stores data regarding [Crimson Isle](https://wiki.hypixel.net/Kuudra) Kuudra items found auction house prices on the [Hypixel Skyblock](https://hypixel.net/) game using the public [Hypixel API](https://api.hypixel.net/). The Golang database worker uses concurrency to request and parse the [Hypixel Skyblock Auction House](https://wiki.hypixel.net/Auction_House) API, parse the data, and store it in a MongoDB database in under 2 seconds.
Used by the [Skytils](http://skytils.gg) mod for the kuudra price feature.

### Hosted Versions
* Live Instance: [kuudra.dev/api](https://kuudra.dev/api)

## Installation
### Prerequisites
* [Docker](https://docker.com/)
* [Bun](https://bun.sh/)
* [Golang](https://golang.org/)

### Setup
1. After cloning the repository, copy the .env.example using the following command:
```bash
cp .env.example .env
```

2. Fill in the .env file with the required information with the webhook url being a discord webhook url.

### Development

1. For optimal speed, it is recommended to use a locally hosted MongoDB instance. To do so, run the following command:
```bash
docker-compose up -d mongo
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
* [Golang](https://golang.org/)
* [MongoDB](https://www.mongodb.com/)
* [Docker](https://www.docker.com/)
* [Cloudflare Tunnels](https://www.cloudflare.com/products/tunnel/)
