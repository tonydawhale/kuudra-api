package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"kuudra-api/db/logger"
)

var httpClient = &http.Client{}

type fetchJob struct {
	URL string
}

func worker(jobs <-chan fetchJob, results chan<- *[]HypixelAhAuction, wg *sync.WaitGroup) {
	for job := range jobs {
		resp, _ := httpClient.Get(job.URL)
		var data HypixelAhResponse
		_ = json.NewDecoder(resp.Body).Decode(&data)
		results <- &data.Auctions
		wg.Done()
	}
}

func fetchAllAuctions() []HypixelAhAuction {
	var maxPage = 1
	var currentPage = 0

	resp, err := fetchAhPage(currentPage)
	if err != nil {
		logger.Fatal("Error fetching page 0: " + err.Error())
	}

	maxPage = resp.TotalPages

	urls := make([]string, maxPage)
	for i := 0; i < maxPage; i++ {
		urls[i] = "http://api.hypixel.net/v2/skyblock/auctions?page=" + strconv.FormatInt(int64(i), 10)
	}
	numWorkers := 15

	jobs := make(chan fetchJob, len(urls))
	results := make(chan *[]HypixelAhAuction, len(urls))
	var wg sync.WaitGroup

	for w := 0; w < numWorkers; w++ {
		go worker(jobs, results, &wg)
	}

	wg.Add(len(urls))
	for _, url := range urls {
		jobs <- fetchJob{URL: url}
	}
	close(jobs)
	wg.Wait()

	items := []HypixelAhAuction{}

	for i := 0; i < len(urls); i++ {
		items = append(items, *<-results...)
	}

	binItems := []HypixelAhAuction{}

	for _, item := range items {
		if item.Bin {
			binItems = append(binItems, item)
		}
	}

	return binItems
}

func fetchAhPage(page int) (*HypixelAhResponse, error) {
	start := time.Now()
	response, err := httpClient.Get("https://api.hypixel.net/v2/skyblock/auctions?page=" + fmt.Sprint(page))
	if err != nil {
		return nil, err
	}
	var data HypixelAhResponse
	if err := json.NewDecoder(response.Body).Decode(&data); err != nil {
		return nil, err
	}
	logger.Log("Fetched page " + fmt.Sprint(page) + " in " + time.Since(start).String())
	return &data, nil
}

func fetchRecentlyEnded() (*HypixelAhRecentlyEndedResponse, error) {
	start := time.Now()
	response, err := httpClient.Get("https://api.hypixel.net/v2/skyblock/auctions_ended")
	if err != nil {
		return nil, err
	}
	var data HypixelAhRecentlyEndedResponse
	if err := json.NewDecoder(response.Body).Decode(&data); err != nil {
		return nil, err
	}
	logger.Log("Fetched recently ended auctions in " + time.Since(start).String())
	return &data, nil
}
