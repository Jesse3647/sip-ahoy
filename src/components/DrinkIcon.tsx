import { Coffee, Wine, Martini, GlassWater } from "lucide-react";

/** Selects a category icon; unrecognized categories use the generic glass. */
export const drinkIcon = (category: string) =>
  category === "Coffee" ? (
    <Coffee />
  ) : category === "Wine" ? (
    <Wine />
  ) : category === "Cocktail" ? (
    <Martini />
  ) : (
    <GlassWater />
  );
