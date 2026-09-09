package main

import "fmt"

const board = "Garden menu"

type Special struct {
	Title string
	Price float64
}

// Describe formats a seasonal entry and its total.
func Describe(item Special, portions int) string {
	total := item.Price * float64(portions)
	return fmt.Sprintf("%s: %.2f", item.Title, total)
}

func main() {
	soup := Special{
		Title: "Garden soup",
		Price: 12.5,
	}
	for _, item := range []Special{soup} {
		fmt.Println(board, Describe(item, 2))
	}
}
