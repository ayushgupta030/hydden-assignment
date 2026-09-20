package store

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
)

// Reset deletes the database at path, along with its write-ahead log and
// shared-memory sidecars, so that every run starts from an empty schema.
//
// Do not alter or remove this function, or its call in main.go. The data in
// this exercise is deliberately ephemeral and is regenerated on every start.
// That is what lets you add, rename or drop fields on Person freely: the table
// is recreated from your struct instead of migrated onto an older shape.
func Reset(path string) error {
	for _, p := range []string{path, path + "-wal", path + "-shm"} {
		if err := os.Remove(p); err != nil && !errors.Is(err, fs.ErrNotExist) {
			return fmt.Errorf("reset %s: %w", p, err)
		}
	}
	return nil
}
