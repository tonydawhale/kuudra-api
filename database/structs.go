package main

type HypixelAhResponse struct {
	Success       bool               `json:"success"`
	LastUpdated   int                `json:"lastUpdated"`
	TotalAuctions int                `json:"totalAuctions"`
	Page          int                `json:"page"`
	TotalPages    int                `json:"totalPages"`
	Auctions      []HypixelAhAuction `json:"auctions"`
	Cause         string             `json:"cause"`
}

type HypixelAhAuction struct {
	Bin         bool   `json:"bin"`
	Claimed     bool   `json:"claimed"`
	End         int    `json:"end"`
	ItemBytes   string `json:"item_bytes"`
	LastUpdated int    `json:"last_updated"`
	Start       int    `json:"start"`
	StartingBid int    `json:"starting_bid"`
	Uuid        string `json:"uuid"`
}

type HypixelAhRecentlyEndedResponse struct {
	Success     bool                          `json:"success"`
	Cause       string                        `json:"cause"`
	LastUpdated int                           `json:"lastUpdated"`
	Auctions    []HypixelRecentlyEndedAuction `json:"auctions"`
}

type HypixelRecentlyEndedAuction struct {
	AuctionId string `json:"auction_id"`
	ItemBytes string `json:"item_bytes"`
	Price     int    `json:"price"`
	Bin       bool   `json:"bin"`
	Timestamp int    `json:"timestamp"`
}

type SkyblockItemNBT struct {
	I []struct {
		Tag struct {
			ExtraAttributes struct {
				Id         string         `nbt:"id"`
				Attributes map[string]int `nbt:"attributes"`
			} `nbt:"ExtraAttributes"`
		} `nbt:"tag"`
	} `nbt:"i"`
}

type StoredAuction struct {
	Uuid        string         `json:"uuid" bson:"uuid"`
	Attributes  map[string]int `json:"attributes" bson:"attributes"`
	Id          string         `json:"id" bson:"id"`
	Price       int            `json:"price" bson:"price"`
	LastUpdated int            `json:"last_updated" bson:"last_updated"`
	End         int            `json:"end" bson:"end"`
	Category    string         `json:"category" bson:"category"`
	Type        string         `json:"type,omitempty" bson:"type,omitempty"`
	Family      string         `json:"family,omitempty" bson:"family,omitempty"`
}
