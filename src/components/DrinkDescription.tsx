import type { Drink } from "../model";
import { descriptionForDrink } from "../drinkDescriptions";

/** Inputs for the shared ingredient/style note. */
type DrinkDescriptionProps = {
  /** Menu item whose exact identity and optional local override determine the description. */
  drink: Drink;
};

/** Displays an editable user note or a reviewed reference description; missing notes add no clutter. */
export function DrinkDescription({ drink }: DrinkDescriptionProps) {
  const description = descriptionForDrink(drink);
  return description ? (
    <span className="drink-description">{description.text}</span>
  ) : null;
}
