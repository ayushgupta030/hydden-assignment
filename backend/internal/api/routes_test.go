package api_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"dataprocessing/internal/api"
	"dataprocessing/internal/person"
	"dataprocessing/internal/store"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	path := filepath.Join(t.TempDir(), "test_api.db")
	if err := store.Reset(path); err != nil {
		t.Fatalf("reset: %v", err)
	}
	db, err := store.Open(path, &person.Person{})
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	return db
}

func seedPeople(t *testing.T, db *gorm.DB) []person.Person {
	t.Helper()
	people := []person.Person{
		{
			ID:         uuid.New(),
			Name:       "Alice Dev",
			Country:    "United States",
			Department: "Engineering",
			Role:       "Software Engineer",
			Age:        28,
			Salary:     105000,
			JoinedAt:   time.Now().UTC(),
			Active:     true,
		},
		{
			ID:         uuid.New(),
			Name:       "Bob Lead",
			Country:    "United States",
			Department: "Engineering",
			Role:       "Engineering Manager",
			Age:        40,
			Salary:     155000,
			JoinedAt:   time.Now().UTC(),
			Active:     true,
		},
		{
			ID:         uuid.New(),
			Name:       "Charlie Sales",
			Country:    "United Kingdom",
			Department: "Sales",
			Role:       "Account Executive",
			Age:        35,
			Salary:     95000,
			JoinedAt:   time.Now().UTC(),
			Active:     false,
		},
	}
	if err := db.Create(&people).Error; err != nil {
		t.Fatalf("seed: %v", err)
	}
	return people
}

func TestRoutes_Filtering(t *testing.T) {
	db := setupTestDB(t)
	seedPeople(t, db)
	handler := api.Routes(db)

	// Filter by Department=Engineering
	req := httptest.NewRequest("GET", "/api/people?department=Engineering", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var res struct {
		People []person.Person `json:"people"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&res); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(res.People) != 2 {
		t.Fatalf("expected 2 engineering people, got %d", len(res.People))
	}
	for _, p := range res.People {
		if p.Department != "Engineering" {
			t.Fatalf("unexpected department: %s", p.Department)
		}
	}

	// Filter by Active=false
	req = httptest.NewRequest("GET", "/api/people?active=false", nil)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	var resActive struct {
		People []person.Person `json:"people"`
	}
	json.NewDecoder(rec.Body).Decode(&resActive)
	if len(resActive.People) != 1 || resActive.People[0].Name != "Charlie Sales" {
		t.Fatalf("expected 1 inactive person (Charlie), got %v", resActive.People)
	}
}

func TestRoutes_Produce(t *testing.T) {
	db := setupTestDB(t)
	handler := api.Routes(db)

	// Initially 0 people
	var count int64
	db.Model(&person.Person{}).Count(&count)
	if count != 0 {
		t.Fatalf("expected 0 people initially, got %d", count)
	}

	// POST /api/produce with count=50
	body, _ := json.Marshal(map[string]int{"count": 50})
	req := httptest.NewRequest("POST", "/api/produce", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	db.Model(&person.Person{}).Count(&count)
	if count != 50 {
		t.Fatalf("expected 50 people after produce, got %d", count)
	}

	// Second produce adds to existing population
	body2, _ := json.Marshal(map[string]int{"count": 25})
	req2 := httptest.NewRequest("POST", "/api/produce", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req2)

	db.Model(&person.Person{}).Count(&count)
	if count != 75 {
		t.Fatalf("expected 75 people after second produce, got %d", count)
	}
}

func TestRoutes_Stats(t *testing.T) {
	db := setupTestDB(t)
	seedPeople(t, db)
	handler := api.Routes(db)

	req := httptest.NewRequest("GET", "/api/people/stats", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var stats map[string]map[string]int64
	if err := json.NewDecoder(rec.Body).Decode(&stats); err != nil {
		t.Fatalf("decode stats: %v", err)
	}

	if stats["_total"]["count"] != 3 {
		t.Fatalf("expected total 3, got %d", stats["_total"]["count"])
	}
	if stats["department"]["Engineering"] != 2 {
		t.Fatalf("expected 2 in engineering, got %d", stats["department"]["Engineering"])
	}
}
