package itemInfo

type ItemCategory string

const (
	Shard     ItemCategory = "SHARD"
	Armor     ItemCategory = "ARMOR"
	Weapon    ItemCategory = "WEAPON"
	Sword     ItemCategory = "SWORD"
	Bow       ItemCategory = "BOW"
	Equipment ItemCategory = "EQUIPMENT"
	Rod       ItemCategory = "ROD"
)

type ItemFamily string

const (
	Kuudra     ItemFamily = "KUUDRA"
	Molten     ItemFamily = "MOLTEN"
	Vanquished ItemFamily = "VANQUISHED"
)

type ItemType string

const (
	Helmet     ItemType = "HELMET"
	Chestplate ItemType = "CHESTPLATE"
	Leggings   ItemType = "LEGGINGS"
	Boots      ItemType = "BOOTS"
	Necklace   ItemType = "NECKLACE"
	Cloak      ItemType = "CLOAK"
	Belt       ItemType = "BELT"
	Gloves     ItemType = "GLOVES"
	Bracelet   ItemType = "BRACELET"
)

type ItemMetadata struct {
	Category ItemCategory
	Type     ItemType
	Family   ItemFamily
}

var ItemMetadataMap = map[string]ItemMetadata{
	"ATTRIBUTE_SHARD": {
		Category: Shard,
	},
	"AURORA_BOOTS": {
		Category: Armor,
		Type:     Boots,
		Family:   Kuudra,
	},
	"AURORA_CHESTPLATE": {
		Category: Armor,
		Type:     Chestplate,
		Family:   Kuudra,
	},
	"AURORA_HELMET": {
		Category: Armor,
		Type:     Helmet,
		Family:   Kuudra,
	},
	"AURORA_LEGGINGS": {
		Category: Armor,
		Type:     Leggings,
		Family:   Kuudra,
	},
	"BERSERKER_BOOTS": {
		Category: Armor,
		Type:     Boots,
	},
	"BERSERKER_CHESTPLATE": {
		Category: Armor,
		Type:     Chestplate,
	},
	"BERSERKER_HELMET": {
		Category: Armor,
		Type:     Helmet,
	},
	"BERSERKER_LEGGINGS": {
		Category: Armor,
		Type:     Leggings,
	},
	"BLADE_OF_THE_VOLCANO": {
		Category: Weapon,
	},
	"BLAZE_BELT": {
		Category: Equipment,
		Type:     Belt,
	},
	"CRIMSON_BOOTS": {
		Category: Armor,
		Type:     Boots,
		Family:   Kuudra,
	},
	"CRIMSON_CHESTPLATE": {
		Category: Armor,
		Type:     Chestplate,
		Family:   Kuudra,
	},
	"CRIMSON_HELMET": {
		Category: Armor,
		Type:     Helmet,
		Family:   Kuudra,
	},
	"CRIMSON_LEGGINGS": {
		Category: Armor,
		Type:     Leggings,
		Family:   Kuudra,
	},
	"DELIRIUM_NECKLACE": {
		Category: Equipment,
		Type:     Necklace,
	},
	"FERVOR_BOOTS": {
		Category: Armor,
		Type:     Boots,
		Family:   Kuudra,
	},
	"FERVOR_CHESTPLATE": {
		Category: Armor,
		Type:     Chestplate,
		Family:   Kuudra,
	},
	"FERVOR_HELMET": {
		Category: Armor,
		Type:     Helmet,
		Family:   Kuudra,
	},
	"FERVOR_LEGGINGS": {
		Category: Armor,
		Type:     Leggings,
		Family:   Kuudra,
	},
	"FIRE_FREEZE_STAFF": {
		Category: Weapon,
	},
	"FIRE_FURY_STAFF": {
		Category: Weapon,
	},
	"FIRE_VEIL_WAND": {
		Category: Weapon,
	},
	"FLAMING_CHESTPLATE": {
		Category: Armor,
		Type:     Chestplate,
	},
	"FLAMING_FIST": {
		Category: Weapon,
		Type:     Gloves,
	},
	"GUANTLET_OF_CONTAGION": {
		Category: Equipment,
		Type:     Gloves,
	},
	"GHAST_CLOAK": {
		Category: Equipment,
		Type:     Cloak,
	},
	"GLOWSTONE_GUANTLET": {
		Category: Equipment,
		Type:     Gloves,
	},
	"HELLFIRE_ROD": {
		Category: Rod,
	},
	"HOLLOW_BOOTS": {
		Category: Armor,
		Type:     Boots,
		Family:   Kuudra,
	},
	"HOLLOW_CHESTPLATE": {
		Category: Armor,
		Type:     Chestplate,
		Family:   Kuudra,
	},
	"HOLLOW_HELMET": {
		Category: Armor,
		Type:     Helmet,
		Family:   Kuudra,
	},
	"HOLLOW_LEGGINGS": {
		Category: Armor,
		Type:     Leggings,
		Family:   Kuudra,
	},
	"HOLLOW_WAND": {
		Category: Weapon,
	},
	"IMPLOSION_BELT": {
		Category: Equipment,
		Type:     Belt,
	},
	"INFERNO_ROD": {
		Category: Rod,
	},
	"LAVA_SHELL_NECKLACE": {
		Category: Equipment,
		Type:     Necklace,
	},
	"MAGMA_LORD_HELMET": {
		Category: Armor,
		Type:     Helmet,
	},
	"MAGMA_LORD_CHESTPLATE": {
		Category: Armor,
		Type:     Chestplate,
	},
	"MAGMA_LORD_LEGGINGS": {
		Category: Armor,
		Type:     Leggings,
	},
	"MAGMA_LORD_BOOTS": {
		Category: Armor,
		Type:     Boots,
	},
	"MAGMA_NECKLACE": {
		Category: Equipment,
		Type:     Necklace,
	},
	"MAGMA_ROD": {
		Category: Rod,
	},
	"MOLTEN_BELT": {
		Category: Equipment,
		Type:     Belt,
		Family:   Molten,
	},
	"MOLTEN_BRACELET": {
		Category: Equipment,
		Type:     Bracelet,
		Family:   Molten,
	},
	"MOLTEN_CLOAK": {
		Category: Equipment,
		Type:     Cloak,
		Family:   Molten,
	},
	"MOLTEN_NECKLACE": {
		Category: Equipment,
		Type:     Necklace,
		Family:   Molten,
	},
	"MOOGMA_LEGGINGS": {
		Category: Armor,
		Type:     Leggings,
	},
	"RAGNAROCK_AXE": {
		Category: Weapon,
	},
	"SCOURGE_CLOAK": {
		Category: Equipment,
		Type:     Cloak,
	},
	"SCOVILLE_BELT": {
		Category: Equipment,
		Type:     Belt,
	},
	"SHIMMERING_LIGHT_HOOD": {
		Category: Armor,
		Type:     Helmet,
	},
	"SHIMMERING_LIGHT_SLIPPERS": {
		Category: Armor,
		Type:     Boots,
	},
	"SHIMMERING_LIGHT_TROUSERS": {
		Category: Armor,
		Type:     Leggings,
	},
	"SHIMMERING_LIGHT_TUNIC": {
		Category: Armor,
		Type:     Chestplate,
	},
	"SLUG_BOOTS": {
		Category: Armor,
		Type:     Boots,
	},
	"STAFF_OF_THE_VOLCANO": {
		Category: Weapon,
	},
	"SULPHUR_BOW": {
		Category: Bow,
	},
	"SWORD_OF_BAD_HEALTH": {
		Category: Weapon,
	},
	"TAURUS_HELMET": {
		Category: Armor,
		Type:     Helmet,
	},
	"TERROR_BOOTS": {
		Category: Armor,
		Type:     Boots,
		Family:  Kuudra,
	},
	"TERROR_CHESTPLATE": {
		Category: Armor,
		Type:     Chestplate,
		Family:  Kuudra,
	},
	"TERROR_HELMET": {
		Category: Armor,
		Type:     Helmet,
		Family:  Kuudra,
	},
	"TERROR_LEGGINGS": {
		Category: Armor,
		Type:     Leggings,
		Family:  Kuudra,
	},
	"THUNDERBOLT_NECKLACE": {
		Category: Equipment,
		Type:     Necklace,
	},
	"THUNDER_BOOTS": {
		Category: Armor,
		Type:     Boots,
	},
	"THUNDER_CHESTPLATE": {
		Category: Armor,
		Type:     Chestplate,
	},
	"THUNDER_HELMET": {
		Category: Armor,
		Type:     Helmet,
	},
	"THUNDER_LEGGINGS": {
		Category: Armor,
		Type:     Leggings,
	},
	"VANQUISHED_BLAZE_BELT": {
		Category: Equipment,
		Type:     Belt,
		Family:   Vanquished,
	},
	"VANQUISHED_GHAST_CLOAK": {
		Category: Equipment,
		Type:     Cloak,
		Family:   Vanquished,
	},
	"VANQUISHED_GLOWSTONE_GAUNTLET": {
		Category: Equipment,
		Type:     Gloves,
		Family:   Vanquished,
	},
	"VANQUISHED_MAGMA_NECKLACE": {
		Category: Equipment,
		Type:     Necklace,
		Family:   Vanquished,
	},
	"WAND_OF_STRENGTH": {
		Category: Weapon,
	},
}
