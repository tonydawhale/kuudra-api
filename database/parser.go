package main

import (
	"bytes"
	"compress/gzip"
	"encoding/base64"
	"io"
	"kuudra-api/db/itemInfo"
	"sync"

	"github.com/Tnze/go-mc/nbt"
)

func parseWorker(jobs <-chan HypixelAhAuction, results chan<- *StoredAuction, wg *sync.WaitGroup) {
	for job := range jobs {
		var nbt SkyblockItemNBT

		if err := decodeNBT(job.ItemBytes, &nbt, false); err != nil {
			panic(err)
		}

		results <- &StoredAuction{
			Uuid:        job.Uuid,
			Attributes:  nbt.I[0].Tag.ExtraAttributes.Attributes,
			Id:          nbt.I[0].Tag.ExtraAttributes.Id,
			Price:       job.StartingBid,
			LastUpdated: job.LastUpdated,
			End:         job.End,
		}
		wg.Done()
	}
}

func parseItems(unparsedItems []HypixelAhAuction) []StoredAuction {
	numWorkers := 50

	jobs := make(chan HypixelAhAuction, len(unparsedItems))
	results := make(chan *StoredAuction, len(unparsedItems))
	var wg sync.WaitGroup

	for w := 0; w < numWorkers; w++ {
		go parseWorker(jobs, results, &wg)
	}

	wg.Add(len(unparsedItems))
	for _, item := range unparsedItems {
		jobs <- item
	}
	close(jobs)
	wg.Wait()

	items := []StoredAuction{}

	for range unparsedItems {
		item := <-results
		
		if item.Attributes != nil && item.Id != "" {
			itemInfo := itemInfo.ItemMetadataMap[item.Id]

			if itemInfo.Category != "" {
				item.Category = string(itemInfo.Category)
			}
			if itemInfo.Type != "" {
				item.Type = string(itemInfo.Type)
			}
			if itemInfo.Family != "" {
				item.Family = string(itemInfo.Family)
			}

			items = append(items, *item)
		}
	}

	return items
}

func decodeNBT(in any, data *SkyblockItemNBT, isBytes bool) error {
	var z []byte
	if !isBytes {
		z, _ = base64.StdEncoding.DecodeString(in.(string))
	} else {
		z = in.([]byte)
	}
	reader := bytes.NewReader(z)
	gzreader := new(gzip.Reader)
	// defer gzipReaderPool.Put(gzreader)

	// Set the underlying reader for the Gzip Reader
	if err := gzreader.Reset(reader); err != nil {
		return err
	}

	// Reuse the buffer for ReadAll
	output, err := io.ReadAll(gzreader)
	if err != nil {
		return err
	}

	if err := nbt.Unmarshal(output, &data); err != nil {
		return err
	}

	return nil
}
