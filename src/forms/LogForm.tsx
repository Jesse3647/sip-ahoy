import { useState } from "react";
import { Check } from "lucide-react";
import {
  categories,
  uid,
  parseMoney,
  type Data,
  type Drink,
  type Entry,
  type Sailing,
  type Traveler,
} from "../model";
import { compareRecency, drinkPrice, drinkIdentity } from "../catalog";
import { DrinkPicker } from "../DrinkPicker";
import { dateLabel, localDate } from "../formatting";
import { Field } from "../components/ui";

/** Inputs for LogForm. */
type LogFormProps = {
  /** Active trip, including its ship namespace and valid dates. */
  sailing: Sailing;
  /** Travelers belonging to the active sailing. */
  crew: Traveler[];
  /** Resolved ship menu, including local overrides and optional community items. */
  drinks: Drink[];
  /** Venues scoped to the active ship catalog. */
  venues: Data["venues"];
  /** Existing log to edit; preserves identity, timestamp, and historical snapshots. */
  entry?: Entry;
  /** Explicit repeat seed; creates a new serving using current menu pricing when known. */
  repeat?: Entry;
  /** Disables submission while the parent persists changes. */
  busy: boolean;
  /** Active-sailing logs used only for recent traveler/venue context and shortcuts. */
  history: Entry[];
  /** Whether drinks reported on other ships may appear in the picker. */
  allShips: boolean;
  /** Updates fleetwide browsing in the parent without changing the sailing ship. */
  onAllShips: (v: boolean) => void;
  /** Whether the bundled catalog has a source profile for this ship. */
  hasShipMenu: boolean;
  /** Receives the form result; the parent validates the journal, persists it, and closes the dialog. */
  onSave: (e: Entry, drink: Drink) => void;
};

/** Handles new servings, explicit repeats, and edits while preserving historical timestamps and values. */
export function LogForm({
  sailing,
  crew,
  drinks,
  venues,
  entry,
  repeat,
  busy,
  history,
  allShips,
  onAllShips,
  hasShipMenu,
  onSave,
}: LogFormProps) {
  const latest = [...history].sort(compareRecency)[0];
  // A fresh log reuses person/venue context, but only an edit or explicit repeat seeds a drink.
  const seed = entry ?? repeat;
  const context = seed ?? latest;
  const [drinkId, setDrinkId] = useState(seed?.drinkId ?? "");
  const [travelerId, setTravelerId] = useState(
    context?.travelerId ?? crew[0]?.id ?? "",
  );
  const [venueId, setVenueId] = useState(
    context?.venueId ?? venues[0]?.id ?? "",
  );
  const [priceText, setPrice] = useState(() => {
    if (!seed) return "";
    if (entry) return (entry.priceCents / 100).toFixed(2);
    const d = drinks.find((d) => d.id === seed.drinkId);
    const p = d ? drinkPrice(d, context?.venueId ?? venues[0]?.id) : null;
    return p === null
      ? (seed.priceCents / 100).toFixed(2)
      : (p / 100).toFixed(2);
  });
  const [coverageText, setCoverage] = useState(
    entry ? (entry.coveredCents / 100).toFixed(2) : "",
  );
  const [hasManualCoverage, setManual] = useState(!!entry);
  const [errorMessage, setErr] = useState("");
  const [custom, setCustom] = useState<Drink | null>(null);
  const [chosenDrink, setChosenDrink] = useState<Drink | null>(
    seed ? (drinks.find((d) => d.id === seed.drinkId) ?? null) : null,
  );
  const drink = custom ?? drinks.find((d) => d.id === drinkId) ?? chosenDrink;
  const traveler = crew.find((t) => t.id === travelerId)!;
  let proposedCoverageCents = 0;
  try {
    proposedCoverageCents =
      traveler?.hasPackage && drink?.eligible
        ? Math.min(parseMoney(priceText), traveler.limitCents ?? Infinity)
        : 0;
  } catch {
    // An incomplete amount is normal while typing; submit reports the validation error.
  }
  /** Refreshes the price suggestion after a venue change and returns coverage to automatic mode. */
  function updatePrice(nextDrinkId: string, nextVenueId: string) {
    const item =
      custom?.id === nextDrinkId
        ? custom
        : (drinks.find((x) => x.id === nextDrinkId) ??
          (chosenDrink?.id === nextDrinkId ? chosenDrink : undefined));
    const p = item ? drinkPrice(item, nextVenueId) : null;
    setPrice(p === null ? "" : (p / 100).toFixed(2));
    setManual(false);
  }
  const today = localDate();
  const defaultDate =
    entry?.sailingDate ??
    (today < sailing.start
      ? sailing.start
      : today > sailing.end
        ? sailing.end
        : today);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
          if (!drink) throw new Error("Select a drink before saving.");
          if (!drink.name.trim()) throw new Error("Enter a drink name.");
          if (
            custom &&
            drinks.some(
              (d) =>
                drinkIdentity(d.name, d.category) ===
                drinkIdentity(custom.name, custom.category),
            )
          )
            throw new Error(
              "This drink is already in your menu. Search and select the existing drink.",
            );
          const priceCents = parseMoney(priceText);
          const coveredCents = hasManualCoverage
            ? parseMoney(coverageText)
            : proposedCoverageCents;
          if (coveredCents > priceCents)
            throw new Error("Covered value cannot exceed the menu price.");
          const selectedDate = String(formData.get("date"));
          if (selectedDate < sailing.start || selectedDate > sailing.end)
            throw new Error("Choose a date within this sailing.");
          // Capture Save time, not form-open time. Editing keeps the original serving timestamp.
          const recordedAt = new Date().toISOString();
          onSave(
            {
              id: entry?.id ?? uid(),
              sailingId: sailing.id,
              travelerId,
              drinkId: drink.id,
              venueId,
              venueName: venues.find((v) => v.id === venueId)!.name,
              name:
                entry && entry.drinkId === drinkId ? entry.name : drink.name,
              category:
                entry && entry.drinkId === drinkId
                  ? entry.category
                  : drink.category,
              sailingDate: selectedDate,
              time: entry?.time ?? recordedAt,
              createdAt: entry?.createdAt ?? recordedAt,
              priceCents,
              coveredCents,
              notes: String(formData.get("notes") ?? "").trim(),
            },
            custom ? { ...custom, priceCents, priceSource: "user" } : drink,
          );
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
      <DrinkPicker
        drinks={drinks}
        entries={history}
        travelerId={travelerId}
        venueId={venueId}
        venueName={venues.find((v) => v.id === venueId)?.name ?? ""}
        selected={drink}
        allShips={allShips}
        onAllShips={onAllShips}
        hasShipMenu={hasShipMenu}
        onSelect={(d) => {
          setCustom(null);
          setChosenDrink(d);
          setDrinkId(d.id);
          const p = drinkPrice(d, venueId);
          setPrice(p === null ? "" : (p / 100).toFixed(2));
          setManual(false);
        }}
        onAddCustom={(name) => {
          setCustom({
            id: uid(),
            shipId: sailing.shipId,
            name: name.slice(0, 100),
            category: "Cocktail",
            priceCents: null,
            eligible: true,
            venuePrices: {},
            priceSource: "user",
          });
          setPrice("");
          setManual(false);
        }}
      />
      {custom && (
        <div className="custom-drink">
          <Field label="New drink name">
            <input
              required
              maxLength={100}
              value={custom.name}
              onChange={(e) => setCustom({ ...custom, name: e.target.value })}
            />
          </Field>
          <Field label="New drink category">
            <select
              value={custom.category}
              onChange={(e) =>
                setCustom({
                  ...custom,
                  category: e.target.value as Drink["category"],
                })
              }
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <p className="footnote">
            Saved to this ship’s menu when you log the drink.
          </p>
        </div>
      )}
      {drink?.community && (
        <p className="footnote selected-source">
          {drink.priceSource === "user"
            ? "Your edited price."
            : "Community reference price."}{" "}
          Retrieved {dateLabel(drink.community.retrievedAt)}.{" "}
          <a href={drink.community.sourceUrl} target="_blank" rel="noreferrer">
            View menu source
          </a>
          {!drink.community.reportedForShip
            ? " · Not confirmed for this ship."
            : ""}
        </p>
      )}
      <div className="form-grid">
        <Field label="For whom?">
          <select
            value={travelerId}
            onChange={(e) => {
              setTravelerId(e.target.value);
              setManual(false);
            }}
          >
            {crew.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Where?">
          <select
            value={venueId}
            onChange={(e) => {
              setVenueId(e.target.value);
              updatePrice(drinkId, e.target.value);
            }}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Menu price · USD">
          <input
            inputMode="decimal"
            value={priceText}
            onChange={(e) => {
              setPrice(e.target.value);
              setManual(false);
            }}
            required
          />
        </Field>
        <Field label="Date">
          <input
            name="date"
            type="date"
            required
            min={sailing.start}
            max={sailing.end}
            defaultValue={defaultDate}
          />
        </Field>
      </div>
      <p className="footnote">
        Time is recorded automatically when you save. Change the date for an
        earlier day.
      </p>
      <details className="log-extras" open={!!entry}>
        <summary>Coverage & notes (optional)</summary>
        <Field label="Covered by package · USD">
          <input
            inputMode="decimal"
            value={
              hasManualCoverage
                ? coverageText
                : (proposedCoverageCents / 100).toFixed(2)
            }
            onChange={(e) => {
              setManual(true);
              setCoverage(e.target.value);
            }}
            required
          />
        </Field>
        <p className="footnote">
          Calculated from package eligibility and cap. You can adjust coverage
          for exclusions.
        </p>
        <Field label="Notes (optional)">
          <textarea
            name="notes"
            placeholder="Sunset on the pool deck…"
            rows={2}
            maxLength={500}
            defaultValue={entry?.notes ?? ""}
          />
        </Field>
      </details>
      <button className="button primary full" disabled={busy || !drink}>
        {busy ? "Saving…" : entry ? "Save changes" : "Save drink"}
        <Check size={17} />
      </button>
    </form>
  );
}
