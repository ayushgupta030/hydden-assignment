// Package person holds the record this service produces and the pipeline that
// produces it. This package is yours: fill it in.
package person

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Person is the record the pipeline produces.
//
// The database schema is generated from this struct, so add whatever fields
// you want and restart -- the table is recreated to match. Include at least
// one of each kind of value so that the UI has something to find trends in:
//
//	categorical  e.g. Country, Department, Role
//	numeric      e.g. Age, Salary (assuming in dollars for simplifying the task)
//	temporal     e.g. JoinedAt
//	boolean      e.g. Active
type Person struct {
	ID         uuid.UUID `gorm:"primaryKey" json:"id"`
	Name       string    `gorm:"not null" json:"name"`
	Country    string    `gorm:"not null;index" json:"country"`
	Department string    `gorm:"not null;index" json:"department"`
	Role       string    `gorm:"not null;index" json:"role"`
	Age        int       `gorm:"not null;index" json:"age"`
	Salary     float32   `gorm:"not null;index" json:"salary"` // In $ for simplification of task
	JoinedAt   time.Time `gorm:"not null;index" json:"joinedAt"`
	Active     bool      `gorm:"not null;index" json:"active"`
}

// Generator produces People and writes them to the database.
type Generator struct {
	DB *gorm.DB
	// producer count, channel size, batch size -- your call
}

// Generate runs the pipeline until n People have been stored, or until ctx is
// cancelled.
//
// Shape it as several producer goroutines fanning into a single consumer:
//
//	producers --> chan Person --> one consumer --> batched writes
//
// One consumer, not several: the sink is a single database, so one writer
// batching inserts is both simpler and faster than many writers contending.
//
// It must terminate cleanly, write everything the producers sent, and stop
// early when ctx is cancelled -- with no deadlock and no leaked goroutines.
func (g *Generator) Generate(ctx context.Context, n int) error {
	// implement generation here
	return nil
}
