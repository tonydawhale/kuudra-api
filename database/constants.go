package main

import (
	"kuudra-api/db/logger"
	"log"
	"os"

	// "github.com/joho/godotenv"
)

var (
	MongoURI               string
	MongoDatabase          string
	MongoCollection        string
	MongoHistoryCollection string

	DiscordWebhook string
)

func init() {
	// if err := godotenv.Load(); err != nil {
	// 	panic(err)
	// }

	MongoURI = getEnv("MONGO_URI")
	MongoDatabase = getEnv("MONGO_DB")
	MongoCollection = getEnv("MONGO_COLLECTION")
	MongoHistoryCollection = getEnv("MONGO_HISTORY_COLLECTION")

	DiscordWebhook = getEnv("DISCORD_WEBHOOK_URL")

	logger.Info("Environment variables loaded")
}

func getEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatal("Environment variable " + key + " not set")
	}
	return val
}
