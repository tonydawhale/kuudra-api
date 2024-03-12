package main

import (
	"context"
	"kuudra-api/db/logger"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

var MongoClient *mongo.Client

func init() {
	client, err := mongo.Connect(
		context.TODO(),
		options.Client().ApplyURI(MongoURI),
	)
	if err != nil {
		logger.Fatal("Failed to initialize mongo client")
	}
	if err := client.Ping(context.TODO(), readpref.Primary()); err != nil {
		logger.Fatal("Failed to ping mongo client, error: " + err.Error())
	}
	logger.Info("Successfully initialized and pinged mongo client")
	MongoClient = client

	setupIndexes()
}

func setupIndexes() {
	MongoClient.Database(MongoDatabase).Collection(MongoCollection).Indexes().CreateMany(
		context.TODO(),
		[]mongo.IndexModel{
			{
				Keys: map[string]interface{}{
					"uuid": 1,
				},
				Options: options.Index().SetUnique(true),
			},
			{
				Keys: map[string]interface{}{
					"id": 1,
				},
			},
			{
				Keys: map[string]interface{}{
					"end": 1,
				},
			},
			{
				Keys: map[string]interface{}{
					"price": 1,
				},
			},
			{
				Keys: map[string]interface{}{
					"attributes.$**": 1,
				},
			},
		},
	)

	MongoClient.Database(MongoDatabase).Collection(MongoHistoryCollection).Indexes().CreateMany(
		context.TODO(),
		[]mongo.IndexModel{
			{
				Keys: map[string]interface{}{
					"id": 1,
				},
			},
			{
				Keys: map[string]interface{}{
					"attributes.$**": 1,
				},
			},
		},
	)

	logger.Info("Indexes created")
}

func bulkWriteUpdate(models []mongo.WriteModel, col string) (*mongo.BulkWriteResult, error) {
	database := MongoClient.Database(MongoDatabase)
	collection := database.Collection(col)

	res, err := collection.BulkWrite(
		context.TODO(),
		models,
		options.BulkWrite().SetOrdered(true),
	)
	return res, err
}
