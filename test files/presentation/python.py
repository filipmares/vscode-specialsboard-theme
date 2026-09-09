from dataclasses import dataclass
import re


@dataclass
class Special:
    """A seasonal entry and a formatted total."""
    title: str
    price: float

    def describe(self, portions: int = 1) -> str:
        total = self.price * portions
        return f"{self.title}: {total:.2f}"


# Named groups, classes, escapes and repetition.
pattern = re.compile(r"^(?P<name>[A-Z]\w+)\s+\d+$")
soup = Special("Garden soup", 12.5)
print(soup.describe(2))
print(pattern.fullmatch("Soup 25") is not None)
