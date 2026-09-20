// Package api wires the HTTP surface. This package is yours: fill in the
// handlers.
package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"dataprocessing/internal/person"
	"dataprocessing/internal/store"

	"gorm.io/gorm"
)

// peoplePage is the JSON envelope for paginated People.
type peoplePage struct {
	People []person.Person `json:"people"`
	Next   string          `json:"next,omitempty"`
}

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
		cursor := r.URL.Query().Get("cursor")
		limit := 50
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
				limit = parsed
			}
		}

		rows, err := store.Page[person.Person](db, "id", cursor, limit)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		resp := peoplePage{People: rows}
		if len(rows) == 0 {
			resp.People = []person.Person{} // ensure JSON array, not null
		}
		if len(rows) == limit {
			resp.Next = rows[len(rows)-1].ID.String()
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Return one Person, with every field.
	mux.HandleFunc("GET /api/people/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		var p person.Person
		if err := db.First(&p, "id = ?", id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(p)
	})

	// Delete one Person. Deleting a Person that is already gone is not an error.
	mux.HandleFunc("DELETE /api/people/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")

		if err := db.Delete(&person.Person{}, "id = ?", id).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	})

	// Aggregate counts per field, computed by the database rather than in the
	// browser. See store.GroupCount.
	mux.HandleFunc("GET /api/people/stats", func(w http.ResponseWriter, r *http.Request) {
		columns := []string{"country", "department", "role", "active"}

		result := make(map[string]map[string]int64)
		for _, col := range columns {
			counts, err := store.GroupCount(db, &person.Person{}, col)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			result[col] = counts
		}

		// Also include total count
		var total int64
		db.Model(&person.Person{}).Count(&total)
		result["_total"] = map[string]int64{"count": total}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	})

	// Bonus: trigger another production run from the UI. This appends to the
	// population, it never replaces it. It is a control endpoint rather than a
	// write to a Person, so POST is fine here.
	//
	//	mux.HandleFunc("POST /api/produce", ...)

	return mux
}
