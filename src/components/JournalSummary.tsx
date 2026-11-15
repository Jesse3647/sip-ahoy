import {
  money,
  travelerStats,
  type Entry,
  type Traveler,
  type Sailing,
} from "../model";
import { PricingBreakdown } from "../PackagePricing";
import { dateLabel } from "../formatting";
import { drinkIcon } from "./DrinkIcon";
import { Empty } from "./ui";
import { characterFor } from "../characters";
import { CharacterPortrait } from "./CharacterPortrait";

/** Inputs for LogRow. */
type LogRowProps = {
  /** Saved serving; its name, venue, price, and time are historical snapshots. */
  entry: Entry;
  /** Current display information for the linked traveler, when available. */
  traveler?: Traveler;
  /** Opens the parent-owned log editor. */
  onClick: () => void;
};

/** Displays historical drink snapshots and opens the entry when selected. */
export function LogRow({ entry, traveler, onClick }: LogRowProps) {
  return (
    <button className="log-row" onClick={onClick}>
      <span
        className={
          "drink-icon " + entry.category.toLowerCase().replace(" ", "-")
        }
      >
        {drinkIcon(entry.category)}
      </span>
      <div className="log-description">
        <h3>{entry.name}</h3>
        <p>
          {traveler?.name} <span>·</span> {entry.venueName}
        </p>
      </div>
      <div className="log-price">
        <strong>{money(entry.priceCents)}</strong>
        <small>
          {dateLabel(entry.sailingDate)} ·{" "}
          {new Date(entry.time).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </small>
      </div>
    </button>
  );
}
/** Inputs for PackageCards. */
type PackageCardsProps = {
  /** Travelers belonging to the active sailing. */
  crew: Traveler[];
  /** Active trip, including its ship namespace and valid dates. */
  sailing: Sailing;
  /** Historical servings, scoped again by travelerStats to the supplied sailing. */
  entries: Entry[];
};

/** Compares each traveler’s logged covered value with their drink-only package cost. */
export function PackageCards({ crew, sailing, entries }: PackageCardsProps) {
  return (
    <div className="package-list">
      {crew.map((traveler) => {
        const stats = travelerStats(traveler, sailing, entries);
        const progress =
          stats.cost === 0
            ? 100
            : stats.cost
              ? Math.min((stats.covered / stats.cost) * 100, 100)
              : 0;
        return (
          <div className="package-person" key={traveler.id}>
            <div className="package-top">
              <span className="avatar sailor-avatar">
                <CharacterPortrait
                  characterId={characterFor(traveler)}
                  decorative
                />
              </span>
              <div>
                <strong>{traveler.name}</strong>
                <small>
                  {traveler.hasPackage ? "Drink package" : "Pay as you go"}
                </small>
              </div>
              <span>
                {traveler.hasPackage
                  ? money(stats.covered)
                  : money(stats.outOfPocket)}
                <small>
                  {traveler.hasPackage ? "covered value" : "out of pocket"}
                </small>
              </span>
            </div>
            {traveler.hasPackage ? (
              <>
                <div
                  className="progress"
                  aria-label={
                    stats.cost !== null
                      ? `${Math.round(progress)}% of package cost covered`
                      : "Package cost unknown"
                  }
                >
                  <span style={{ width: `${progress}%` }} />
                </div>
                <div className="package-numbers">
                  <span>
                    {stats.cost === null
                      ? (stats.pricing?.incompleteReason ??
                        "Package cost not entered")
                      : `${money(stats.covered)} of ${money(stats.cost)} drink-only cost`}
                  </span>
                  <strong>
                    {stats.net === null
                      ? "Comparison unavailable"
                      : stats.net >= 0
                        ? `${money(stats.net)} above cost${stats.pricing?.estimated ? " (estimate)" : ""}`
                        : `${money(-stats.net)} to break even${stats.pricing?.estimated ? " (estimate)" : ""}`}
                  </strong>
                </div>
                {stats.pricing && (
                  <details className="package-detail">
                    <summary>View cost breakdown</summary>
                    <PricingBreakdown pricing={stats.pricing} compact />
                  </details>
                )}
              </>
            ) : (
              <p className="package-note">
                {stats.count} drinks · no package cost to compare
              </p>
            )}
          </div>
        );
      })}
      {!crew.length && <Empty text="Add a sailor to start the comparison." />}
    </div>
  );
}
