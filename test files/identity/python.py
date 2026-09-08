from dataclasses import dataclass
import re

# A quiet italic comment beside ordinary executable code.
@dataclass
class Special:
    """A docstring is documentation, not a vivid string literal."""
    name: str
    price: float

    def label(self, count: int = 3) -> str:
        available = True
        message = f"{self.name}: {count}\n"
        return message if available and count > 0 else "sold out"


pattern = re.compile(r"^(?P<name>[A-Z]\w+)\s+\d{2,4}$")
special = Special("Soup", 12.5)
print(special.label(), len(special.name))
