package main

import "fmt"

const boardName = "Garden menu"

type Course string

const (
	Starter Course = "starter"
	Main    Course = "main"
)

type Entry struct {
	Title  string
	Price  float64
	Course Course
}

// Describe formats an entry; hover it or request signature help at its call.
func Describe(entry Entry, quantity int) string {
	total := entry.Price * float64(quantity)
	return fmt.Sprintf("%s: %.2f", entry.Title, total)
}

func main() {
	soup := Entry{Title: "Soup", Price: 12.5, Course: Starter}
	entries := map[string][]Entry{"lunch": {soup}}
	for name, items := range entries {
		fmt.Println(boardName, name, Describe(items[0], 2))
	}
}
