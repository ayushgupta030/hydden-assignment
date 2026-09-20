package person_test

import (
	"context"
	"errors"
	"path/filepath"
	"testing"
	"time"

	"dataprocessing/internal/person"
	"dataprocessing/internal/store"

	"github.com/google/uuid"
)

func TestGenerator_NormalExecution(t *testing.T) {
	path := filepath.Join(t.TempDir(), "gen_normal.db")
	if err := store.Reset(path); err != nil {
		t.Fatalf("reset: %v", err)
	}

	db, err := store.Open(path, &person.Person{})
	if err != nil {
		t.Fatalf("open: %v", err)
	}

	gen := person.NewGenerator(db)
	const targetCount = 2500

	start := time.Now()
	if err := gen.Generate(context.Background(), targetCount); err != nil {
		t.Fatalf("generate: %v", err)
	}
	t.Logf("generated %d people in %v", targetCount, time.Since(start))

	var total int64
	if err := db.Model(&person.Person{}).Count(&total).Error; err != nil {
		t.Fatalf("count: %v", err)
	}
	if total != targetCount {
		t.Fatalf("got %d rows, want %d", total, targetCount)
	}

	// Verify uniqueness and validity
	var sample []person.Person
	if err := db.Limit(100).Find(&sample).Error; err != nil {
		t.Fatalf("find: %v", err)
	}
	seen := make(map[uuid.UUID]bool)
	for _, p := range sample {
		if p.ID == uuid.Nil {
			t.Fatal("found nil UUID")
		}
		if seen[p.ID] {
			t.Fatalf("duplicate UUID: %s", p.ID)
		}
		seen[p.ID] = true
		if p.Name == "" || p.Country == "" || p.Department == "" || p.Role == "" {
			t.Fatalf("incomplete person record: %+v", p)
		}
		if p.Age < 20 || p.Age > 70 {
			t.Fatalf("unexpected age %d", p.Age)
		}
		if p.Salary <= 0 {
			t.Fatalf("invalid salary %f", p.Salary)
		}
	}
}

func TestGenerator_RemainderBatchFlush(t *testing.T) {
	path := filepath.Join(t.TempDir(), "gen_remainder.db")
	if err := store.Reset(path); err != nil {
		t.Fatalf("reset: %v", err)
	}

	db, err := store.Open(path, &person.Person{})
	if err != nil {
		t.Fatalf("open: %v", err)
	}

	gen := &person.Generator{
		DB:          db,
		Producers:   3,
		BatchSize:   20,
		ChannelSize: 50,
	}

	// 73 is not divisible by 20 (batch size) nor by 3 (producers)
	const target = 73
	if err := gen.Generate(context.Background(), target); err != nil {
		t.Fatalf("generate: %v", err)
	}

	var count int64
	if err := db.Model(&person.Person{}).Count(&count).Error; err != nil {
		t.Fatalf("count: %v", err)
	}
	if count != target {
		t.Fatalf("got %d rows, want %d", count, target)
	}
}

func TestGenerator_Cancellation(t *testing.T) {
	path := filepath.Join(t.TempDir(), "gen_cancel.db")
	if err := store.Reset(path); err != nil {
		t.Fatalf("reset: %v", err)
	}

	db, err := store.Open(path, &person.Person{})
	if err != nil {
		t.Fatalf("open: %v", err)
	}

	gen := person.NewGenerator(db)
	ctx, cancel := context.WithCancel(context.Background())

	// Cancel after a short delay so pipeline is actively running
	go func() {
		time.Sleep(30 * time.Millisecond)
		cancel()
	}()

	done := make(chan error, 1)
	go func() {
		done <- gen.Generate(ctx, 100000)
	}()

	select {
	case err := <-done:
		if err == nil {
			t.Fatal("expected error on cancelled context, got nil")
		}
		if !errors.Is(err, context.Canceled) {
			t.Logf("got error on cancellation: %v (expected context.Canceled)", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("generator did not terminate promptly upon cancellation")
	}
}

func TestGenerator_ZeroAndNegative(t *testing.T) {
	path := filepath.Join(t.TempDir(), "gen_zero.db")
	if err := store.Reset(path); err != nil {
		t.Fatalf("reset: %v", err)
	}

	db, err := store.Open(path, &person.Person{})
	if err != nil {
		t.Fatalf("open: %v", err)
	}

	gen := person.NewGenerator(db)
	if err := gen.Generate(context.Background(), 0); err != nil {
		t.Fatalf("expected nil on n=0, got %v", err)
	}
	if err := gen.Generate(context.Background(), -100); err != nil {
		t.Fatalf("expected nil on n=-100, got %v", err)
	}

	var count int64
	db.Model(&person.Person{}).Count(&count)
	if count != 0 {
		t.Fatalf("expected 0 rows, got %d", count)
	}
}
