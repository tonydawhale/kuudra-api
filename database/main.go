package main

import (
	"kuudra-api/db/logger"
	"strconv"
	"time"

	"github.com/go-co-op/gocron/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

var scheduler gocron.Scheduler

func main() {
	var scheduleErr error
	scheduler, scheduleErr = gocron.NewScheduler()
	if scheduleErr != nil {
		logger.Fatal("Error creating scheduler: " + scheduleErr.Error())
	}

	scheduler.NewJob(
		gocron.CronJob("* * * * *", false),
		gocron.NewTask(
			refreshAuctions,
		),
	)

	scheduler.NewJob(
		gocron.CronJob("* * * * *", false),
		gocron.NewTask(
			clearAuctions,
		),
	)

	scheduler.Start()

	select {}
}

func refreshAuctions() {
	start := time.Now()

	items := fetchAllAuctions()

	parsed := parseItems(items)

	updateTime := time.Now()

	itemModels := []mongo.WriteModel{}

	for _, item := range parsed {
		itemModels = append(itemModels,
			mongo.NewUpdateOneModel().
				SetFilter(bson.M{"uuid": item.Uuid}).
				SetUpdate(
					bson.M{
						"$set": item,
					},
				).
				SetUpsert(true),
		)
	}

	res, err := bulkWriteUpdate(itemModels, MongoCollection)
	if err != nil {
		logger.Error("Error bulk writing auctions: " + err.Error())
		return
	}

	logger.Log("Successfully updated " + strconv.Itoa(int(res.ModifiedCount+res.UpsertedCount)) + " auctions to database in: " + time.Since(updateTime).String() + " (total: " + time.Since(start).String() + ")")
}

func clearAuctions() {
	start := time.Now()

	res, err := fetchRecentlyEnded()
	if err != nil || !res.Success {
		logger.Error("Error fetching recently ended auctions: " + err.Error() + " " + res.Cause)
		return
	}

	itemModels := []mongo.WriteModel{}
	historyModels := []mongo.WriteModel{}

	for _, item := range res.Auctions {
		var nbt SkyblockItemNBT

		if err := decodeNBT(item.ItemBytes, &nbt, false); err != nil {
			logger.Error("Error decoding NBT: " + err.Error())
		}

		if item.Price > 0 && nbt.I[0].Tag.ExtraAttributes.Id != "" && nbt.I[0].Tag.ExtraAttributes.Attributes != nil {
			historyModels = append(historyModels,
				mongo.NewUpdateOneModel().
					SetFilter(bson.M{
						"id":         nbt.I[0].Tag.ExtraAttributes.Id,
						"attributes": nbt.I[0].Tag.ExtraAttributes.Attributes,
					}).
					SetUpdate(
						bson.M{
							"$setOnInsert": bson.M{
								"id":           nbt.I[0].Tag.ExtraAttributes.Id,
								"attributes":   nbt.I[0].Tag.ExtraAttributes.Attributes,
								"last_updated": res.LastUpdated,
								"history":      []bson.M{},
							},
						},
					).SetUpsert(true),
				mongo.NewUpdateOneModel().
					SetFilter(bson.M{
						"id":         nbt.I[0].Tag.ExtraAttributes.Id,
						"attributes": nbt.I[0].Tag.ExtraAttributes.Attributes,
					}).
					SetUpdate(
						bson.M{
							"$push": bson.M{
								"history": bson.M{
									"price":     item.Price,
									"timestamp": item.Timestamp,
								},
							},
						}),
			)
		}

		itemModels = append(itemModels,
			mongo.NewDeleteOneModel().
				SetFilter(bson.M{"uuid": item.AuctionId}),
		)
	}

	itemModels = append(itemModels,
		mongo.NewDeleteManyModel().
			SetFilter(bson.M{"end": bson.M{"$lt": int(time.Now().UnixMilli())}}),
	)

	dbWrite, err := bulkWriteUpdate(itemModels, MongoCollection)
	if err != nil {
		logger.Error("Error bulk deleting auctions: " + err.Error())
		return
	}

	logger.Log("Successfully deleted " + strconv.Itoa(int(dbWrite.DeletedCount)) + " auctions from database in: " + time.Since(start).String())

	historyWrite, err := bulkWriteUpdate(historyModels, MongoHistoryCollection)
	if err != nil {
		logger.Error("Error bulk writing history: " + err.Error())
		return
	}

	logger.Log("Successfully updated " + strconv.Itoa(int(historyWrite.ModifiedCount+historyWrite.UpsertedCount)) + " history entries to database in: " + time.Since(start).String())
}
