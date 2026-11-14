/** Original ingredient summaries, kept separate from the factual price snapshot. */
import type { Drink } from "./model";
import { drinkIdentity, drinkKey } from "./drinkIdentity";

/** Description displayed to the user, with optional evidence for the reference summary. */
export type Description = {
  /** Short ingredient/style note; not a complete recipe or an allergen declaration. */
  text: string;
  /** Supporting menu, producer page, or photographed-menu report. */
  sourceUrl?: string;
  /** Date the reference was reviewed; absent for user-entered text and general coffee definitions. */
  checkedAt?: string;
};

const sources = {
  caribbean: "https://www.royalcaribbean.com/guides/caribbean-drinks",
  schooner:
    "https://www.royalcaribbeanblog.com/2023/09/01/royal-caribbean-revamps-nautical-themed-bar-new-menu",
  icon: "https://www.royalcaribbeanincentives.com/content/uploads/IC-Bar-Nightlife-Infographic.pdf",
  lime: "https://www.royalcaribbean.com/content/dam/royal/resources/menus/the-lime-and-coconut-menu-sample.pdf",
  chandon: "https://www.chandon.com/en-int/chandon-garden-spritz",
  aperol: "https://www.aperol.com/en-us/aperol-spritz-cocktail/",
  margarita: "https://iba-world.com/iba-cocktail/margarita/",
};

type Reference = {
  /** Exact reviewed menu names; normalization handles punctuation and accents only. */
  names: string[];
  /** Category guard prevents, for example, a coffee definition being assigned to an alcoholic namesake. */
  category: Drink["category"];
  /** Original concise summary of factual ingredients or a standard preparation. */
  text: string;
  /** Evidence source; omitted only for general coffee definitions. */
  source?: keyof typeof sources;
};

// Do not infer a specialty recipe from a similar name. Add reviewed names explicitly.
const references: Reference[] = [
  {
    names: ["Aperol Spritz"],
    category: "Cocktail",
    text: "A bubbly, bittersweet aperitif made with Aperol, prosecco and soda.",
    source: "aperol",
  },
  {
    names: ["Margarita", "Classic Margarita"],
    category: "Cocktail",
    text: "A tequila sour with orange liqueur and lime; often served with a salted rim.",
    source: "margarita",
  },
  {
    names: ["Piña Colada"],
    category: "Cocktail",
    text: "Frozen rum drink with pineapple and coconut cream.",
    source: "caribbean",
  },
  {
    names: ["Mojito"],
    category: "Cocktail",
    text: "Mint-and-lime rum cooler with sugar and soda.",
    source: "caribbean",
  },
  {
    names: ["Rum Punch"],
    category: "Cocktail",
    text: "Rum mixed with tropical fruit juices; the fruit blend varies.",
    source: "caribbean",
  },
  {
    names: ["Bahama Mama"],
    category: "Cocktail",
    text: "Coconut-rum cocktail with orange and pineapple.",
    source: "caribbean",
  },
  {
    names: ["Painkiller"],
    category: "Cocktail",
    text: "Dark-rum cocktail with coconut cream, orange and pineapple.",
    source: "caribbean",
  },
  {
    names: ["Daiquiri"],
    category: "Cocktail",
    text: "Rum sour made with lime and sugar.",
    source: "caribbean",
  },
  {
    names: ["Dark 'N Stormy", "Dark N' Stormy", "Dark & Stormy"],
    category: "Cocktail",
    text: "Dark rum and ginger beer, finished with lime.",
    source: "caribbean",
  },
  {
    names: ["Planter's Punch"],
    category: "Cocktail",
    text: "Aged-rum punch with fruit juices and bitters.",
    source: "caribbean",
  },
  {
    names: ["Goombay Smash"],
    category: "Cocktail",
    text: "Spiced and coconut rums with apricot brandy and fruit juices.",
    source: "caribbean",
  },
  {
    names: ["Cuba Libre"],
    category: "Cocktail",
    text: "Rum and cola with lime.",
    source: "caribbean",
  },
  {
    names: ["Lime & Coconut"],
    category: "Cocktail",
    text: "Coconut-rum cooler with coconut milk, coconut and guava syrups, and lime.",
    source: "lime",
  },
  {
    names: ["Lavender Daiquiri"],
    category: "Cocktail",
    text: "Floral rum sour featuring lavender syrup and lemon.",
    source: "schooner",
  },
  {
    names: ["Parrot Punch"],
    category: "Cocktail",
    text: "Spiced-rum punch: Campari, pineapple and lemon.",
    source: "schooner",
  },
  {
    names: ["Tropic Rye"],
    category: "Cocktail",
    text: "Rye whiskey with passion fruit, guava, pineapple and citrus.",
    source: "schooner",
  },
  {
    names: ["Desert Pear Margarita"],
    category: "Cocktail",
    text: "Tequila sour with desert pear syrup and lime.",
    source: "schooner",
  },
  {
    names: ["'Rol and Rye"],
    category: "Cocktail",
    text: "Rye-whiskey sour with Aperol and lemon.",
    source: "schooner",
  },
  {
    names: ["Peanut Butter Tropic"],
    category: "Cocktail",
    text: "Peanut-butter whiskey with pineapple, lemon and bitters.",
    source: "schooner",
  },
  {
    names: ["Kentucky Summer"],
    category: "Cocktail",
    text: "Bourbon with elderflower, mango, mint and lime.",
    source: "schooner",
  },
  {
    names: ["Sea & T"],
    category: "Cocktail",
    text: "Gin-and-tonic variation with Lagoon Bay liqueur and lemon.",
    source: "schooner",
  },
  {
    names: ["Irish Peach"],
    category: "Cocktail",
    text: "Irish-whiskey cocktail with peach, lemon, bitters and black pepper.",
    source: "schooner",
  },
  {
    names: ["Southern Belle"],
    category: "Cocktail",
    text: "Bourbon cooler with blueberry, mint, lemon and soda.",
    source: "schooner",
  },
  {
    names: ["Tropical Sidecar"],
    category: "Cocktail",
    text: "Cognac sour with orange liqueur, passion fruit and lemon.",
    source: "schooner",
  },
  {
    names: ["Toasted Marshmallow Old Fashioned"],
    category: "Cocktail",
    text: "Bourbon stirred with marshmallow syrup and chocolate bitters.",
    source: "icon",
  },
  {
    names: ["Rum Old Fashioned"],
    category: "Cocktail",
    text: "Aged rum stirred with coconut syrup and bitters.",
    source: "schooner",
  },
  {
    names: ["Strawberry Blonde"],
    category: "Cocktail",
    text: "Vodka sour with elderflower, strawberry, mint and lemon.",
    source: "icon",
  },
  {
    names: ["Joropo"],
    category: "Cocktail",
    text: "Coconut-rum sour with coconut water, lime, syrup and aquafaba.",
    source: "icon",
  },
  {
    names: ["Sweet Home Alabama"],
    category: "Cocktail",
    text: "Vodka-spiked iced tea with peach and lemon.",
    source: "icon",
  },
  {
    names: ["Lavender Haze"],
    category: "Cocktail",
    text: "Gin sour with lavender, honey and lemon.",
    source: "icon",
  },
  {
    names: ["Passion Fruit Guava Sangria"],
    category: "Cocktail",
    text: "White-wine sangria featuring passion fruit, guava, pineapple and lime.",
    source: "icon",
  },
  {
    names: ["Coffee Boulevardier"],
    category: "Cocktail",
    text: "Bourbon-and-Campari cocktail with coffee liqueur.",
    source: "icon",
  },
  {
    names: ["Overlook Spritz"],
    category: "Cocktail",
    text: "Sparkling rosé with coconut rum, Lagoon Bay liqueur, coconut syrup and lime.",
    source: "icon",
  },
  {
    names: ["Stout Espresso Martini"],
    category: "Cocktail",
    text: "Vodka and coffee liqueur with cold brew, syrup and stout.",
    source: "icon",
  },
  {
    names: ["Chandon Garden Spritz"],
    category: "Wine",
    text: "Sparkling-wine aperitif flavored with orange peel and spices.",
    source: "chandon",
  },
  {
    names: ["Chandon Garden Spritz"],
    category: "Cocktail",
    text: "Sparkling-wine aperitif flavored with orange peel and spices.",
    source: "chandon",
  },
  {
    names: ["Espresso"],
    category: "Coffee",
    text: "A concentrated shot of coffee brewed under pressure.",
  },
  {
    names: ["Cappuccino"],
    category: "Coffee",
    text: "Espresso topped with steamed milk and a layer of milk foam.",
  },
  {
    names: ["Café Americano"],
    category: "Coffee",
    text: "Espresso diluted with hot water for a longer black coffee.",
  },
  {
    names: ["Iced Café Americano"],
    category: "Coffee",
    text: "Espresso and water served over ice.",
  },
  {
    names: ["Café Latte", "Cafe Latte"],
    category: "Coffee",
    text: "Espresso with steamed milk and a light layer of foam.",
  },
  {
    names: ["Iced Café Latte"],
    category: "Coffee",
    text: "Espresso and milk served over ice.",
  },
  {
    names: ["Café Mocha", "Cafe Mocha"],
    category: "Coffee",
    text: "An espresso-and-milk drink flavored with chocolate.",
  },
  {
    names: ["Iced Café Mocha"],
    category: "Coffee",
    text: "Espresso, milk and chocolate served over ice.",
  },
  {
    names: ["White Chocolate Mocha"],
    category: "Coffee",
    text: "An espresso-and-milk drink flavored with white chocolate.",
  },
];

const byIdentity = new Map<string, Description>();
for (const reference of references) {
  for (const name of reference.names) {
    byIdentity.set(
      `${reference.category}:${drinkIdentity(name, reference.category)}`,
      {
        text: reference.text,
        ...(reference.source
          ? { sourceUrl: sources[reference.source], checkedAt: "2026-11-14" }
          : {}),
      },
    );
  }
}

/** Returns only a reviewed match; unknown specialty names deliberately have no inferred recipe. */
export function referenceDescription(drink: Drink): Description | undefined {
  // Explicit coffee serving sizes do not change the base drink definition. Other qualifiers stay intact.
  const key =
    drink.category === "Coffee"
      ? drinkIdentity(
          drink.name.replace(/\s*\((small|medium|large)\)$/i, ""),
          drink.category,
        )
      : drinkKey(drink);
  return byIdentity.get(`${drink.category}:${key}`);
}

/** User text wins, including an intentional empty string that hides a reference description. */
export function descriptionForDrink(drink: Drink): Description | undefined {
  return drink.description !== undefined
    ? drink.description.trim()
      ? { text: drink.description }
      : undefined
    : referenceDescription(drink);
}
