const BOARD: &str = "Garden menu";

#[derive(Clone, Copy)]
struct Special {
    title: &'static str,
    price: f64,
}

/// Format a seasonal entry and its total.
fn describe(item: &Special, portions: u32) -> String {
    let total = item.price * f64::from(portions);
    format!("{}: {:.2}", item.title, total)
}

fn main() {
    let soup = Special {
        title: "Garden soup",
        price: 12.5,
    };
    let entries = vec![soup];
    for item in &entries {
        println!("{} | {}", BOARD, describe(item, 2));
    }
}
