package suroimd_api

import (
	"encoding/json"
	"fmt"
	"os"
)

type HostConfig struct {
	Port int `json:"port"`
}

type GameConfigInner struct {
	DeenableFeast bool `json:"deenable_feast"`
	GameTps       int  `json:"gameTps"`
	MaxPlayers    int  `json:"maxPlayers"`
	NetTps        int  `json:"netTps"`
	TeamSize      int  `json:"teamSize"`
}

type GameConfig struct {
	MaxGames int             `json:"max_games"`
	Config   GameConfigInner `json:"config"`
	Host     HostConfig      `json:"host"`
}

type RegionDef struct {
	Host string `json:"host"`
	Port int    `json:"port"`
}

type DatabaseFiles struct {
	Accounts string `json:"accounts"`
}

type DatabaseConfig struct {
	Enabled bool          `json:"enabled"`
	Files   DatabaseFiles `json:"files"`
	ApiKey  string        `json:"api_key"`
}

type ShopConfig struct {
	Skins map[int]int `json:"skins"`
}

type Config struct {
	API struct {
		Host   HostConfig `json:"host"`
		Global string     `json:"global"`
	} `json:"api"`
	Game     GameConfig           `json:"game"`
	Regions  map[string]RegionDef `json:"regions"`
	Database DatabaseConfig       `json:"database"`
	Shop     ShopConfig           `json:"shop"`
}

func LoadConfig(path string) (*Config, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg Config

	type rawConfig struct {
		API struct {
			Host   HostConfig `json:"host"`
			Global string     `json:"global"`
		} `json:"api"`
		Game     GameConfig           `json:"game"`
		Regions  map[string]RegionDef `json:"regions"`
		Database DatabaseConfig       `json:"database"`
		Shop     struct {
			Skins map[string]int `json:"skins"`
		} `json:"shop"`
	}

	var raw rawConfig
	if err := json.Unmarshal(b, &raw); err != nil {
		return nil, err
	}

	cfg.API = raw.API
	cfg.Game = raw.Game
	cfg.Regions = raw.Regions
	cfg.Database = raw.Database
	cfg.Shop.Skins = make(map[int]int, len(raw.Shop.Skins))

	for k, v := range raw.Shop.Skins {
		var keyInt int
		fmt.Sscanf(k, "%d", &keyInt)
		cfg.Shop.Skins[keyInt] = v
	}

	return &cfg, nil
}
