// Package store is provided complete and working. Do not modify it.
//
// It exists so that you can spend your time on the generation pipeline and the
// UI instead of on persistence. The schema is driven by your Go types: pass
// your models to Open and the database is migrated to match them, so you can
// reshape Person whenever you like without writing any SQL.
package store

import (
	"fmt"
	"regexp"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// identifier matches a safe SQL identifier. Column names reaching GroupCount
// may come from a query parameter, so they are checked before interpolation.
var identifier = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

// Open opens the SQLite database at path and migrates it to match models.
//
//	db, err := store.Open("data.db", &person.Person{})
func Open(path string, models ...any) (*gorm.DB, error) {
	dsn := path + "?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_pragma=synchronous(NORMAL)"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("open %s: %w", path, err)
	}
	if err := db.AutoMigrate(models...); err != nil {
		return nil, fmt.Errorf("migrate %s: %w", path, err)
	}
	return db, nil
}

// Page returns up to limit rows ordered by idColumn, starting strictly after
// the value in after. Pass "" for the first page.
//
// This is keyset pagination: each page is anchored to the last id of the
// previous one rather than to an offset, so it stays correct while rows are
// being inserted and deleted underneath it, and it stays fast at any depth.
// The cursor for the next page is the id of the last row you got back. When
// len(rows) < limit you are on the last page.
//
//	rows, err := store.Page[person.Person](db, "person_id", cursor, 50)
func Page[T any](db *gorm.DB, idColumn, after string, limit int) ([]T, error) {
	if !identifier.MatchString(idColumn) {
		return nil, fmt.Errorf("invalid id column %q", idColumn)
	}
	if limit <= 0 {
		limit = 50
	}

	var rows []T
	q := db.Order(idColumn + " ASC").Limit(limit)
	if after != "" {
		q = q.Where(idColumn+" > ?", after)
	}
	if err := q.Find(&rows).Error; err != nil {
		return nil, fmt.Errorf("page by %s: %w", idColumn, err)
	}
	return rows, nil
}

// GroupCount returns how many rows fall into each distinct value of column,
// for the table backing model. It is the cheap way to build the trend view:
// the database does the aggregation over the whole population, so the browser
// never has to see more than a handful of rows.
//
//	counts, err := store.GroupCount(db, &person.Person{}, "country")
func GroupCount(db *gorm.DB, model any, column string) (map[string]int64, error) {
	if !identifier.MatchString(column) {
		return nil, fmt.Errorf("invalid column %q", column)
	}

	var rows []struct {
		Value string
		Total int64
	}
	err := db.Model(model).
		Select(column + " AS value, count(*) AS total").
		Group(column).
		Order("total DESC").
		Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("group by %s: %w", column, err)
	}

	counts := make(map[string]int64, len(rows))
	for _, r := range rows {
		counts[r.Value] = r.Total
	}
	return counts, nil
}
