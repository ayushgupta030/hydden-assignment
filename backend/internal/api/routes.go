// Package api wires the HTTP surface.
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

type produceRequest struct {
	Count int `json:"count"`
}

type produceResponse struct {
	Status    string `json:"status"`
	Generated int    `json:"generated"`
}

// applyFilters extracts query filters and applies them as database WHERE conditions.
func applyFilters(db *gorm.DB, r *http.Request) *gorm.DB {
	q := db.Model(&person.Person{})
	if dept := r.URL.Query().Get("department"); dept != "" {
		q = q.Where("department = ?", dept)
	}
	if role := r.URL.Query().Get("role"); role != "" {
		q = q.Where("role = ?", role)
	}
	if country := r.URL.Query().Get("country"); country != "" {
		q = q.Where("country = ?", country)
	}
	if act := r.URL.Query().Get("active"); act != "" {
		if act == "true" {
			q = q.Where("active = ?", true)
		} else if act == "false" {
			q = q.Where("active = ?", false)
		}
	}
	return q
}

// Routes returns the API.
//
// People are read and deleted, never created or edited over HTTP: there is no
// POST or PATCH for a Person, by design.
func Routes(db *gorm.DB) http.Handler {
	mux := http.NewServeMux()

	// List People. This is paginated using keyset pagination with database-level filtering.
	mux.HandleFunc("GET /api/people", func(w http.ResponseWriter, r *http.Request) {
		cursor := r.URL.Query().Get("cursor")
		limit := 50
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
				limit = parsed
			}
		}

		filteredDB := applyFilters(db, r)
		rows, err := store.Page[person.Person](filteredDB, "id", cursor, limit)
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

	// Aggregate counts per field, computed by the database over the whole population or filtered query.
	mux.HandleFunc("GET /api/people/stats", func(w http.ResponseWriter, r *http.Request) {
		columns := []string{"country", "department", "role", "active"}

		filteredDB := applyFilters(db, r)

		result := make(map[string]map[string]int64)
		for _, col := range columns {
			counts, err := store.GroupCount(filteredDB, &person.Person{}, col)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			result[col] = counts
		}

		// Include total count matching the query
		var total int64
		filteredDB.Count(&total)
		result["_total"] = map[string]int64{"count": total}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	})

	// Trigger another production run from the UI. This appends to the
	// population, it never replaces it.
	mux.HandleFunc("POST /api/produce", func(w http.ResponseWriter, r *http.Request) {
		req := produceRequest{Count: 1000}
		if r.Body != nil && r.ContentLength > 0 {
			_ = json.NewDecoder(r.Body).Decode(&req)
		}

		count := req.Count
		if count <= 0 {
			count = 1000
		}
		if count > 50000 {
			count = 50000
		}

		gen := person.NewGenerator(db)
		if err := gen.Generate(r.Context(), count); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(produceResponse{
			Status:    "ok",
			Generated: count,
		})
	})

	return mux
}
