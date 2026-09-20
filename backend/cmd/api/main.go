// Command api serves the data_processing exercise backend.
package main

import (
	"context"
	"log"
	"net/http"

	"dataprocessing/internal/api"
	"dataprocessing/internal/person"
	"dataprocessing/internal/store"
)

const (
	dbPath = "data.db"

	// The frontend dev server proxies /api here. Keep this port, or change
	// vite.config.ts to match.
	addr = ":8080"
)

func main() {
	// Do not alter or remove this call. See the comment on store.Reset: the
	// data here is ephemeral so that the schema can follow your Person struct.
	if err := store.Reset(dbPath); err != nil {
		log.Fatal(err)
	}

	db, err := store.Open(dbPath, &person.Person{})
	if err != nil {
		log.Fatal(err)
	}

	// Generate your Person structs here.
	gen := person.NewGenerator(db)
	if err := gen.Generate(context.Background(), 1000); err != nil {
		log.Fatalf("generate initial population: %v", err)
	}

	// Start your HTTP server here. internal/api.Routes has the routes stubbed
	// out, and the frontend expects them on addr.

	_ = db // remove this once you use db
	log.Printf("listening on %s", addr)
	if err := http.ListenAndServe(addr, api.Routes(db)); err != nil {
		log.Fatal(err)
	}
}
