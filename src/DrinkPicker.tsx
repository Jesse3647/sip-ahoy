import { useState } from "react";
import { Check, Clock3, Plus, Search } from "lucide-react";
import { categories, money, type Drink, type Entry } from "./model";
import { drinkPrice, filterDrinks, recentDrinks } from "./catalog";
import { DrinkDescription } from "./components/DrinkDescription";
/** Inputs for DrinkPicker. */
type DrinkPickerProps = {
  /** Resolved ship menu, including local overrides and optional community items. */
  drinks: Drink[];
  /** Sailing-scoped history used for traveler-specific recent drinks. */
  entries: Entry[];
  /** Traveler whose recent selections should be shown. */
  travelerId: string;
  /** Venue used to resolve current price suggestions. */
  venueId: string;
  /** Venue label used to filter community menu evidence. */
  venueName: string;
  /** Explicitly selected item, or null for a fresh empty selection. */
  selected: Drink | null;
  /** Passes the selected catalog item to the log form. */
  onSelect: (d: Drink) => void;
  /** Requests a custom-drink draft using the current search text. */
  onAddCustom: (name: string) => void;
  /** Whether the picker includes menu references from other ships. */
  allShips: boolean;
  /** Updates the parent’s fleetwide-menu toggle. */
  onAllShips: (v: boolean) => void;
  /** Whether this ship has a bundled community-menu profile. */
  hasShipMenu: boolean;
};

/** Shows recents and searchable menu choices; selection always requires an explicit user action. */
export function DrinkPicker({
  drinks,
  entries,
  travelerId,
  venueId,
  venueName,
  selected,
  onSelect,
  onAddCustom,
  allShips,
  onAllShips,
  hasShipMenu,
}: DrinkPickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [atVenue, setAtVenue] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [limit, setLimit] = useState(12);
  const recent = recentDrinks(entries, travelerId, drinks);
  const results = filterDrinks(
    drinks,
    query,
    category,
    atVenue ? venueName : undefined,
  );
  /** Accepts an explicit choice, then resets browsing without preselecting another item. */
  function pick(d: Drink) {
    onSelect(d);
    setBrowsing(false);
    setQuery("");
    setCategory("all");
    setLimit(12);
  }
  const price = (d: Drink) => {
    const p = drinkPrice(d, venueId);
    return p === null ? "Enter price" : money(p);
  };
  return (
    <section className="drink-picker" aria-label="Choose a drink">
      {recent.length > 0 && (
        <div className="recent-drinks">
          <div className="picker-label">
            <Clock3 size={14} />
            <strong>Recent for this sailor</strong>
          </div>
          <div className="recent-chips">
            {recent.map((e) => {
              const d = drinks.find((d) => d.id === e.drinkId)!;
              return (
                <button
                  type="button"
                  key={d.id}
                  aria-label={`Recent ${d.name}`}
                  aria-pressed={selected?.id === d.id}
                  onClick={() => pick(d)}
                >
                  <span>{d.name}</span>
                  <small>{price(d)}</small>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {selected ? (
        <div className="selected-drink">
          <div>
            <small>SELECTED DRINK</small>
            <strong>{selected.name}</strong>
            <DrinkDescription drink={selected} />
            <span>
              {selected.category} · {price(selected)}
            </span>
          </div>
          <Check size={18} />
        </div>
      ) : (
        <p className="drink-selection-prompt">
          Select a drink from your recents or search the menu.
        </p>
      )}
      <div className="search picker-search">
        <Search size={17} />
        <input
          type="search"
          aria-label="Search drinks"
          placeholder="Search drinks, brands, or bars…"
          value={query}
          onFocus={() => setBrowsing(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(30);
            setBrowsing(true);
          }}
        />
        <button
          type="button"
          className="plain"
          aria-expanded={browsing}
          onClick={() => setBrowsing(!browsing)}
        >
          {browsing ? "Close" : "Browse"}
        </button>
      </div>
      {browsing && (
        <div className="drink-browser">
          <div className="picker-filters">
            <label>
              <span className="sr-only">Drink category</span>
              <select
                aria-label="Drink category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setLimit(30);
                }}
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="picker-checkbox">
              <input
                type="checkbox"
                checked={atVenue}
                onChange={(e) => setAtVenue(e.target.checked)}
              />{" "}
              At this venue
            </label>
          </div>
          <label className="picker-checkbox all-ships">
            <input
              type="checkbox"
              checked={allShips}
              onChange={(e) => onAllShips(e.target.checked)}
            />{" "}
            Include community drinks from other ships
          </label>
          {!hasShipMenu && (
            <p className="footnote">
              No sourced menu is available for this ship yet. Browse other ships
              or add a drink.
            </p>
          )}
          <div className="picker-results" aria-label="Drink search results">
            {results.slice(0, limit).map((d) => (
              <button
                type="button"
                key={d.id}
                aria-label={`Select ${d.name}`}
                aria-pressed={selected?.id === d.id}
                onClick={() => pick(d)}
              >
                <span>
                  <strong>{d.name}</strong>
                  <DrinkDescription drink={d} />
                  <small>
                    {d.category}
                    {d.community && !d.community.reportedForShip
                      ? " · Reported on other ships"
                      : ""}
                  </small>
                </span>
                <span>{price(d)}</span>
              </button>
            ))}
            {!results.length && (
              <p className="empty-search">
                No matching drinks. Add yours below.
              </p>
            )}
          </div>
          {results.length > limit && (
            <button
              type="button"
              className="plain show-more"
              onClick={() => setLimit(limit + 30)}
            >
              Show more ({results.length} matches)
            </button>
          )}
          <button
            type="button"
            className="button secondary full"
            onClick={() => {
              setBrowsing(false);
              onAddCustom(query);
            }}
          >
            <Plus size={15} />
            {query.trim()
              ? `Add “${query.trim().slice(0, 40)}” as a new drink`
              : "Add a missing drink"}
          </button>
          <p className="footnote picker-source">
            Community menu references; availability and prices vary by sailing.
            Your saved prices take precedence.
          </p>
        </div>
      )}
    </section>
  );
}
