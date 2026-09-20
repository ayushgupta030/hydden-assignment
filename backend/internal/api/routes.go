// Package api wires the HTTP surface. This package is yours: fill in the
// handlers.
package api

import (
	"net/http"

	"gorm.io/gorm"
)

// Routes returns the API.
//
// People are read and deleted, never created or edited over HTTP: there is no
// POST or PATCH for a Person, by design.
func Routes(db *gorm.DB) http.Handler {
	mux := http.NewServeMux()

	// List People. This must be paginated -- the population can reach six
	// figures, and sending all of it to the browser is the failure this
	// exercise is watching for. store.Page does keyset pagination for you.
	mux.HandleFunc("GET /api/people", func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "not implemented", http.StatusNotImplemented)
	})

	// Return one Person, with every field.
	mux.HandleFunc("GET /api/people/{id}", func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "not implemented", http.StatusNotImplemented)
	})

	// Delete one Person. Deleting a Person that is already gone is not an error.
	mux.HandleFunc("DELETE /api/people/{id}", func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "not implemented", http.StatusNotImplemented)
	})

	// Suggested, for the trend view: aggregate counts per field, computed by
	// the database rather than in the browser. See store.GroupCount.
	//
	//	mux.HandleFunc("GET /api/people/stats", ...)

	// Bonus: trigger another production run from the UI. This appends to the
	// population, it never replaces it. It is a control endpoint rather than a
	// write to a Person, so POST is fine here.
	//
	//	mux.HandleFunc("POST /api/produce", ...)

	return mux
}
