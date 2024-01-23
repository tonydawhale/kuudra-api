package main

import (
	"bytes"
	"compress/gzip"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/Tnze/go-mc/nbt"
)

type SkyblockItemNBT struct {
	I []struct {
		Tag struct {
			ExtraAttributes struct {
				Id         string              `nbt:"id"`
				Attributes map[string]int `nbt:"attributes"`
			} `nbt:"ExtraAttributes"`
		} `nbt:"tag"`
	} `nbt:"i"`
}

type AuctionItem struct {
	Uuid        string `json:"uuid"`
	End         int64  `json:"end"`
	StartingBid int64  `json:"starting_bid"`
	ItemBytes   string `json:"item_bytes"`
	Bin         bool   `json:"bin"`
}

type AuctionPage struct {
	Success       bool          `json:"success"`
	Page          int           `json:"page"`
	TotalPages    int           `json:"totalPages"`
	TotalAuctions int           `json:"totalAuctions"`
	LastUpdated   int64         `json:"lastUpdated"`
	Auctions      []AuctionItem `json:"auctions"`
}

var (
	wg sync.WaitGroup
	gzipReaderPool sync.Pool
)

func init() {
	gzipReaderPool.New = func() interface{} {
		return new(gzip.Reader)
	}
}

func main() {
	items := make([]AuctionItem, 0)

	fmt.Println("fetching ah")
	start := time.Now()
	page, err := getAhPage(0)
	if err != nil {
		panic(err)
	}
	items = append(items, page.Auctions...)

	for i := 1; i < page.TotalPages; i++ {
		page, err := getAhPage(i)
		if err != nil {
			panic(err)
		}
		items = append(items, page.Auctions...)
	}

	fmt.Println("ah fetched in ", time.Since(start))

	fmt.Println("decoding nbt")
	start = time.Now()
	for _, auction := range items {
		wg.Add(1)
		var item SkyblockItemNBT
		go DecodeNBT(auction.ItemBytes, &item, false)
	}

	wg.Wait()
	fmt.Println("decoded nbt in ", time.Since(start))
}

func getAhPage(page int) (*AuctionPage, error) {
	response, err := http.Get("http://api.hypixel.net/v2/skyblock/auctions?page=" + fmt.Sprint(page))
	if err != nil {
		return nil, err
	}
	var data AuctionPage
	if err := json.NewDecoder(response.Body).Decode(&data); err != nil {
		return nil, err
	}
	return &data, nil
}

func DecodeNBT(in any, data *SkyblockItemNBT, isBytes bool) error {
	defer wg.Done()
	var z []byte
	if !isBytes {
		z, _ = base64.StdEncoding.DecodeString(in.(string))
	} else {
		z = in.([]byte)
	}
	reader := bytes.NewReader(z)
	gzreader := gzipReaderPool.Get().(*gzip.Reader)
	defer gzipReaderPool.Put(gzreader)

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
