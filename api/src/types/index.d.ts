type StoredAuctionItem = {
    uuid: string;
    attributes: Record<string, number>;
    id: string;
    price: number;
    last_updated: number;
    end: number;
    category: ItemCategory;
    type?: ItemType;
};

type StoredAuctionItemHistory = {
    id: string;
    attributes: Record<string, number>;
    last_updated: number;
    history: {
        timestamp: number;
        price: number;
    }[];
};

type HypixelAhResponse = {
    success: boolean;
    cause?: string;
    totalPages: number;
    totalAuctions: number;
    lastUpdated: number;
    auctions: HypixelAhItem[];
};

type HypixelRecentlyEndedResponse = {
    success: boolean;
    cause?: string;
    lastUpdated: number;
    auctions: {
        auction_id: string;
        item_bytes: string;
        price: number;
        bin: boolean;
        timestamp: number;
    }[];
};

type HypixelAhItem = {
    bin: boolean;
    claimed: boolean;
    end: number;
    item_bytes: string;
    last_updated: number;
    start: number;
    starting_bid: number;
    uuid: string;
};

type RouteAnalytics = {
    route: string;
    analytics: {
        total: number;
        per_status: Record<number, number>;
    }
}

export {
    HypixelAhItem,
    HypixelAhResponse,
    HypixelRecentlyEndedResponse,
    StoredAuctionItem,
    StoredAuctionItemHistory,
    RouteAnalytics,
};
