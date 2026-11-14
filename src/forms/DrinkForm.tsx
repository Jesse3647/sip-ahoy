import { useState } from "react";
import { Check } from "lucide-react";
import { categories, uid, parseMoney, type Data, type Drink } from "../model";
import { dateLabel } from "../formatting";
import { Field } from "../components/ui";
import {
  descriptionForDrink,
  referenceDescription,
} from "../drinkDescriptions";

/** Inputs for DrinkForm. */
type DrinkFormProps = {
  /** Record being edited; omit to create a new record. */
  existing?: Drink;
  /** Persistent ship-catalog namespace for this menu item. */
  shipId: string;
  /** Venues scoped to the active ship catalog. */
  venues: Data["venues"];
  /** Disables submission while the parent persists changes. */
  busy: boolean;
  /** Receives the form result; the parent validates the journal, persists it, and closes the dialog. */
  onSave: (d: Drink) => void;
};

/** Edits menu defaults and venue prices without rewriting previous drink logs. */
export function DrinkForm({
  existing,
  shipId,
  venues,
  busy,
  onSave,
}: DrinkFormProps) {
  const [errorMessage, setErr] = useState("");
  const reference = existing ? referenceDescription(existing) : undefined;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
          const enteredDescription = String(
            formData.get("description") ?? "",
          ).trim();
          // Keep an unchanged bundled note as a reference, so future reference updates can still apply.
          const description =
            enteredDescription === reference?.text
              ? existing?.description
              : enteredDescription;
          const venuePrices: Record<string, number> = {};
          for (const v of venues) {
            const raw = String(formData.get("venue-" + v.id) ?? "");
            if (raw) venuePrices[v.id] = parseMoney(raw);
          }
          onSave({
            id: existing?.id ?? uid(),
            shipId,
            name: String(formData.get("name")).trim(),
            description,
            category: String(formData.get("category")) as Drink["category"],
            priceCents: String(formData.get("price")).trim()
              ? parseMoney(String(formData.get("price")))
              : null,
            priceSource: "user",
            community: existing?.community,
            aliases: existing?.aliases,
            eligible: formData.get("eligible") === "on",
            venuePrices,
          });
        } catch (e) {
          setErr((e as Error).message);
        }
      }}
    >
      {errorMessage && (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      )}
      {existing?.community && (
        <p className="form-note">
          Community menu reference, retrieved{" "}
          {dateLabel(existing.community.retrievedAt)}.{" "}
          <a
            href={existing.community.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            View source
          </a>
          . Confirm onboard prices before logging.
        </p>
      )}
      <Field label="Drink name">
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={existing?.name}
        />
      </Field>
      <Field label="Description (optional)">
        <textarea
          aria-label="Description (optional)"
          name="description"
          maxLength={500}
          rows={3}
          placeholder="Ingredients, flavors, or what this drink is like"
          defaultValue={
            existing ? (descriptionForDrink(existing)?.text ?? "") : ""
          }
        />
      </Field>
      {reference?.sourceUrl && (
        <p className="form-note">
          <a href={reference.sourceUrl} target="_blank" rel="noreferrer">
            Reference description source
          </a>{" "}
          · checked {dateLabel(reference.checkedAt!)}. Recipes can vary by ship
          and venue.
        </p>
      )}
      <div className="form-grid">
        <Field label="Category">
          <select
            name="category"
            defaultValue={existing?.category ?? "Cocktail"}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Default price · USD">
          <input
            name="price"
            inputMode="decimal"
            placeholder="Leave blank if unknown"
            defaultValue={
              existing?.priceCents == null ? "" : existing.priceCents / 100
            }
          />
        </Field>
      </div>
      <label className="check-field">
        <input
          type="checkbox"
          name="eligible"
          defaultChecked={existing?.eligible ?? true}
        />{" "}
        Eligible for package coverage
      </label>
      <h3 className="form-subtitle">Venue prices (optional)</h3>
      <p className="footnote">Leave blank to use the default price.</p>
      <div className="form-grid">
        {venues.map((v) => (
          <Field key={v.id} label={v.name + " · USD"}>
            <input
              name={"venue-" + v.id}
              inputMode="decimal"
              placeholder="Default price"
              defaultValue={
                existing?.venuePrices[v.id] === undefined
                  ? ""
                  : existing.venuePrices[v.id] / 100
              }
            />
          </Field>
        ))}
      </div>
      <button className="button primary full" disabled={busy}>
        Save menu drink <Check size={16} />
      </button>
    </form>
  );
}
