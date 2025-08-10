package main

import (
	"fmt"
	"log"
	"net/http"

	api "suroimd.io/module/api"
)

func main() {
	config, err := api.LoadConfig("../common/scripts/config/config.json")
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

	if config.API.Host.UseHTTPS {
		if config.API.Host.CertFile == "" || config.API.Host.KeyFile == "" {
			log.Fatal("HTTPS enabled but no cert_file or key_file specified in config")
		}
		err = http.ListenAndServeTLS(addr, config.API.Host.CertFile, config.API.Host.KeyFile, nil)
	} else {
		err = http.ListenAndServe(addr, nil)
	}

	if err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
