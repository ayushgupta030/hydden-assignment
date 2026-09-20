package person_test

import (
	"path/filepath"
	"testing"
	"time"

	"dataprocessing/internal/person"
	"dataprocessing/internal/store"

	"github.com/google/uuid"
)

func TestPersonAutoMigrateAndStore(t *testing.T) {
	path := filepath.Join(t.TempDir(), "test_person.db")
	if err := store.Reset(path); err != nil {
		t.Fatalf("reset: %v", err)
	}

	db, err := store.Open(path, &person.Person{})
	if err != nil {
		t.Fatalf("open: %v", err)
	}

	id1 := uuid.New()
	id2 := uuid.New()

	p1 := person.Person{
		ID:         id1,
		Name:       "Alice Smith",
		Role:       "Engineer",
		Department: "Engineering",
		Country:    "United States",
		Age:        30,
		Salary:     120000.0,
		JoinedAt:   time.Now().UTC().Truncate(time.Second),
		Active:     true,
	}

	p2 := person.Person{
		ID:         id2,
		Name:       "Bob Jones",
		Role:       "Manager",
		Department: "Sales",
		Country:    "United Kingdom",
		Age:        45,
		Salary:     110000.0,
		JoinedAt:   time.Now().UTC().Truncate(time.Second),
		Active:     false,
	}

	if err := db.Create(&[]person.Person{p1, p2}).Error; err != nil {
		t.Fatalf("create: %v", err)
	}

	// Verify GroupCount
	countryCounts, err := store.GroupCount(db, &person.Person{}, "country")
	if err != nil {
		t.Fatalf("group count country: %v", err)
	}
	if countryCounts["United States"] != 1 || countryCounts["United Kingdom"] != 1 {
		t.Fatalf("unexpected country counts: %v", countryCounts)
	}

	// Verify Page
	page, err := store.Page[person.Person](db, "id", "", 10)
	if err != nil {
		t.Fatalf("page: %v", err)
	}
	if len(page) != 2 {
		t.Fatalf("expected 2 people, got %d", len(page))
	}

	// Verify pagination cursor
	cursor := page[0].ID.String()
	secondPage, err := store.Page[person.Person](db, "id", cursor, 10)
	if err != nil {
		t.Fatalf("second page: %v", err)
	}
	if len(secondPage) != 1 {
		t.Fatalf("expected 1 person on second page, got %d", len(secondPage))
	}
	if secondPage[0].ID != page[1].ID {
		t.Fatalf("expected person %v, got %v", page[1].ID, secondPage[0].ID)
	}
}

func TestPersonPaginationWalk(t *testing.T) {
	path := filepath.Join(t.TempDir(), "test_person_walk.db")
	if err := store.Reset(path); err != nil {
		t.Fatalf("reset: %v", err)
	}

	db, err := store.Open(path, &person.Person{})
	if err != nil {
		t.Fatalf("open: %v", err)
	}

	const total = 50
	records := make([]person.Person, total)
	for i := 0; i < total; i++ {
		records[i] = person.Person{
			ID:         uuid.New(),
			Name:       "Test Person",
			Country:    "Germany",
			Department: "Engineering",
			Role:       "Developer",
			Age:        25 + (i % 30),
			Salary:     90000.0,
			JoinedAt:   time.Now().UTC(),
			Active:     i%2 == 0,
		}
	}

	if err := db.Create(&records).Error; err != nil {
		t.Fatalf("seed: %v", err)
	}

	seen := make(map[uuid.UUID]bool)
	cursor := ""
	for pages := 0; ; pages++ {
		if pages > 10 {
			t.Fatal("pagination loop exceeded expected pages")
		}
		page, err := store.Page[person.Person](db, "id", cursor, 15)
		if err != nil {
			t.Fatalf("page: %v", err)
		}
		for _, p := range page {
			if seen[p.ID] {
				t.Fatalf("duplicate person %s", p.ID)
			}
			seen[p.ID] = true
		}
		if len(page) < 15 {
			break
		}
		cursor = page[len(page)-1].ID.String()
	}

	if len(seen) != total {
		t.Fatalf("expected %d unique people, walked %d", total, len(seen))
	}
}
