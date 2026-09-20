package store_test

import (
	"fmt"
	"path/filepath"
	"testing"

	"dataprocessing/internal/store"
	"gorm.io/gorm"
)

// widget stands in for your Person: any struct works, the table is generated
// from it. These tests double as usage examples for the package.
type widget struct {
	WidgetID string `gorm:"primaryKey"`
	Colour   string
}

func open(t *testing.T) *gorm.DB {
	t.Helper()
	path := filepath.Join(t.TempDir(), "test.db")
	if err := store.Reset(path); err != nil {
		t.Fatalf("reset: %v", err)
	}
	db, err := store.Open(path, &widget{})
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	return db
}

func TestShouldPageWithoutRepeatingOrSkippingRowsWhenWalkingTheWholeTable(t *testing.T) {
	db := open(t)

	rows := make([]widget, 0, 25)
	for i := range 25 {
		rows = append(rows, widget{WidgetID: fmt.Sprintf("id-%02d", i), Colour: "red"})
	}
	if err := db.Create(&rows).Error; err != nil {
		t.Fatalf("seed: %v", err)
	}

	seen := map[string]bool{}
	cursor := ""
	for pages := 0; ; pages++ {
		if pages > 10 {
			t.Fatal("pagination did not terminate")
		}
		page, err := store.Page[widget](db, "widget_id", cursor, 10)
		if err != nil {
			t.Fatalf("page: %v", err)
		}
		for _, w := range page {
			if seen[w.WidgetID] {
				t.Fatalf("row %s returned twice", w.WidgetID)
			}
			seen[w.WidgetID] = true
		}
		if len(page) < 10 {
			break
		}
		cursor = page[len(page)-1].WidgetID
	}

	if len(seen) != 25 {
		t.Fatalf("walked %d rows, want 25", len(seen))
	}
}

func TestShouldCountPerDistinctValueWhenGrouping(t *testing.T) {
	db := open(t)

	if err := db.Create(&[]widget{
		{WidgetID: "a", Colour: "red"},
		{WidgetID: "b", Colour: "red"},
		{WidgetID: "c", Colour: "blue"},
	}).Error; err != nil {
		t.Fatalf("seed: %v", err)
	}

	counts, err := store.GroupCount(db, &widget{}, "colour")
	if err != nil {
		t.Fatalf("group: %v", err)
	}
	if counts["red"] != 2 || counts["blue"] != 1 {
		t.Fatalf("got %v, want red=2 blue=1", counts)
	}
}

func TestShouldRejectColumnNameWhenItIsNotAPlainIdentifier(t *testing.T) {
	db := open(t)

	if _, err := store.GroupCount(db, &widget{}, "colour; drop table widgets"); err == nil {
		t.Fatal("expected an error for a non-identifier column")
	}
}
