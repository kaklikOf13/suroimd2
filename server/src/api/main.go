package main

import (
	"fmt"
	"log"
	"net/http"

	api "suroimd.io/module/api"
)

func main() {
	config, err := api.LoadConfig("configs/config.json")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	apiServer, err := api.NewApiServer(config.Database.Files.Accounts, config)
	if err != nil {
		log.Fatalf("Failed to start API server: %v", err)
	}

	apiServer.HandleFunctions()

	addr := fmt.Sprintf(":%d", config.API.Host.Port)
	log.Printf("API server listening on %s", addr)
	err = http.ListenAndServe(addr, nil)
	if err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
