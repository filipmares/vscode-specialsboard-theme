// Hover Entry and use signature help on describe with a Rust language server.
const BOARD_NAME: &str = "Garden menu";

#[derive(Clone, Copy)]
enum Course {
    Starter,
    Main,
}

struct Entry {
    title: &'static str,
    price: f64,
    course: Course,
}

/// Format an entry with the requested number of portions.
fn describe(entry: &Entry, quantity: u32) -> String {
    let total = entry.price * f64::from(quantity);
    format!("{}: {:.2}", entry.title, total)
}

fn main() {
    let soup = Entry { title: "Soup", price: 12.5, course: Course::Starter };
    let mut entries = vec![soup];
    entries.push(Entry { title: "Salad", price: 10.0, course: Course::Main });
    let nested = [(entries.as_slice(), [1, 2])];
    for (items, portions) in nested {
        if let Some(entry) = items.first() {
            let course = match entry.course {
                Course::Starter => "starter",
                Course::Main => "main",
            };
            println!("{} - {}: {}", BOARD_NAME, course, describe(entry, portions[0]));
        }
    }
}
