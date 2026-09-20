// Package person holds the record this service produces and the pipeline that
// produces it. This package is yours: fill it in.
package person

import (
	"context"
	"fmt"
	"sync"
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
	DB          *gorm.DB
	Producers   int // number of producer goroutines (defaults to 4)
	BatchSize   int // batch size for DB inserts (defaults to 500)
	ChannelSize int // buffered channel capacity (defaults to 2000)
}

// NewGenerator returns a Generator with sensible concurrency defaults.
func NewGenerator(db *gorm.DB) *Generator {
	return &Generator{
		DB:          db,
		Producers:   4,
		BatchSize:   500,
		ChannelSize: 2000,
	}
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
	if n <= 0 {
		return nil
	}

	producers := g.Producers
	if producers <= 0 {
		producers = 4
	}
	batchSize := g.BatchSize
	if batchSize <= 0 {
		batchSize = 500
	}
	channelSize := g.ChannelSize
	if channelSize <= 0 {
		channelSize = 2000
	}

	// Create a child context to signal producers immediately if consumer errors.
	parentCtx := ctx
	ctx, cancel := context.WithCancel(parentCtx)
	defer cancel()

	ch := make(chan Person, channelSize)

	// Distribute work among producers.
	quota := n / producers
	remainder := n % producers

	var wg sync.WaitGroup
	for i := 0; i < producers; i++ {
		count := quota
		if i < remainder {
			count++
		}
		if count == 0 {
			continue
		}

		wg.Add(1)
		go func(toProduce int) {
			defer wg.Done()
			for j := 0; j < toProduce; j++ {
				if ctx.Err() != nil {
					return
				}
				p := generateRandomPerson()
				select {
				case <-ctx.Done():
					return
				case ch <- p:
				}
			}
		}(count)
	}

	// Closer goroutine: closes the channel once all producers have finished.
	go func() {
		wg.Wait()
		close(ch)
	}()

	// Single consumer: receives from ch and performs batched database writes.
	batch := make([]Person, 0, batchSize)
	var writeErr error

	for p := range ch {
		batch = append(batch, p)
		if len(batch) >= batchSize {
			if err := g.DB.WithContext(ctx).Create(&batch).Error; err != nil {
				writeErr = fmt.Errorf("batch insert: %w", err)
				cancel() // signal all producers to exit immediately
				break
			}
			batch = batch[:0]
		}
	}

	// Drain any remaining items to ensure no producer blocks if loop exited early.
	for range ch {
	}

	// If no DB error occurred and parent context wasn't cancelled, flush any remaining records.
	if writeErr == nil && parentCtx.Err() == nil && len(batch) > 0 {
		if err := g.DB.WithContext(ctx).Create(&batch).Error; err != nil {
			writeErr = fmt.Errorf("flush remaining batch: %w", err)
		}
	}

	if parentCtx.Err() != nil {
		return parentCtx.Err()
	}
	if writeErr != nil {
		return writeErr
	}
	return nil
}
