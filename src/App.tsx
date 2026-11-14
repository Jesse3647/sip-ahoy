import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Anchor,
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  LayoutDashboard,
  Martini,
  Plus,
  Search,
  Settings,
  Ship,
  Trash2,
  Users,
  Wine,
} from "lucide-react";
import { catalogForShip, shipVenueInfo, filterDrinks } from "./catalog";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  categories,
  days,
  demoData,
  emptyData,
  money,
  shipCatalog,
  travelerStats,
  uid,
  type Data,
  type Drink,
  type Entry,
  type Sailing,
  type Traveler,
} from "./model";
import { read, write, type Snapshot } from "./storage";
import { SailingForm } from "./forms/SailingForm";
import { TravelerForm } from "./forms/TravelerForm";
import { LogForm } from "./forms/LogForm";
import { DrinkForm } from "./forms/DrinkForm";
import { BackupForm } from "./forms/BackupForm";
import { ModalShell, Stat, SectionTitle, Empty } from "./components/ui";
import { LogRow, PackageCards } from "./components/JournalSummary";
import { drinkIcon } from "./components/DrinkIcon";
import { dateLabel } from "./formatting";
import { DrinkDescription } from "./components/DrinkDescription";
/** Available journal views; navigation state is local to this browser session. */
type Page =
  | "Overview"
  | "Drink log"
  | "Drink passport"
  | "Menus & prices"
  | "Sailing & crew";
/** Exactly one parent-owned editor can be open; its optional record determines create versus edit. */
type Modal =
  | { type: "sailing"; sailing?: Sailing }
  | { type: "traveler"; traveler?: Traveler }
  | { type: "log"; entry?: Entry; repeat?: Entry }
  | { type: "drink"; drink?: Drink }
  | { type: "backup" }
  | null;
const icons: Record<Page, typeof Anchor> = {
  Overview: LayoutDashboard,
  "Drink log": Martini,
  "Drink passport": Compass,
  "Menus & prices": BookOpen,
  "Sailing & crew": Users,
};
/** Coordinates journal loading/saving, sailing-scoped views, navigation, and editor lifecycles. */
export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    revision: 0,
    data: emptyData(),
  });
  const [loaded, setLoaded] = useState(false);
  const [fatal, setFatal] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState<Page>("Overview");
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [allShips, setAllShips] = useState(false);
  const [menuLimit, setMenuLimit] = useState(36);
  /** Notifies other local tabs to reload; persistence remains in IndexedDB. */
  const channel = useRef<BroadcastChannel | null>(null);
  // A ref blocks duplicate saves immediately, before React renders the busy state.
  const saving = useRef(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onOfflineReady() {
      setOfflineReady(true);
    },
    onRegisterError() {
      setNotice(
        "Offline cache is unavailable. Your journal can still save on this device.",
      );
    },
  });
  // Load once, then keep connection status and other-tab saves reflected in the UI.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => setOfflineReady(true));
    }
    read()
      .then((v) => {
        setSnapshot(v);
        setLoaded(true);
      })
      .catch((e) => {
        setError(e.message);
        setFatal(true);
        setLoaded(true);
      });
    const updateOnlineStatus = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    channel.current = new BroadcastChannel("sipahoy");
    channel.current.onmessage = () => {
      if (!saving.current)
        read()
          .then(setSnapshot)
          .catch((e) => setError(e.message));
    };
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      channel.current?.close();
    };
  }, []);
  // Reset before the new page can receive input, so a delayed effect cannot erase its first search.
  useLayoutEffect(() => {
    setSearch("");
    setFilter("all");
    setMenuLimit(36);
  }, [page, snapshot.data.activeSailingId]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  // Scope shared journal records to the active sailing before deriving menus and analytics.
  const data = snapshot.data;
  const sailing =
    data.sailings.find((s) => s.id === data.activeSailingId) ??
    data.sailings[0];
  const crew = data.travelers.filter((t) => t.sailingId === sailing?.id);
  const entries = data.entries
    .filter((e) => e.sailingId === sailing?.id)
    .sort((a, b) => b.time.localeCompare(a.time));
  const localDrinks = data.drinks.filter((d) => d.shipId === sailing?.shipId);
  const localVenues = data.venues.filter((v) => v.shipId === sailing?.shipId);
  const catalog = sailing
    ? catalogForShip(
        sailing.ship,
        sailing.shipId,
        localDrinks,
        localVenues,
        allShips,
      )
    : {
        drinks: [],
        venues: [],
        hasShipMenu: false,
        sourceUrl: null,
        reportedCount: 0,
      };
  const drinks = catalog.drinks;
  const venues = catalog.venues;
  /** Persists the whole next journal; publishes UI state and cross-tab notifications only after success. */
  async function save(next: Data, message = "Saved to your journal") {
    if (saving.current || fatal) return false;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const value = await write(next, snapshot.revision);
      setSnapshot(value);
      channel.current?.postMessage("updated");
      setNotice(message);
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.name === "ZodError"
            ? "Check the form fields. Names and valid sailing dates are required."
            : e.message
          : "Unable to save.",
      );
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  /** Saves an editor result and closes its dialog only if persistence succeeds. */
  async function commit(next: Data, message?: string) {
    if (await save(next, message)) setModal(null);
  }
  const retail = entries.reduce((n, e) => n + e.priceCents, 0);
  const covered = entries.reduce((n, e) => n + e.coveredCents, 0);
  const unique = new Set(entries.map((e) => e.drinkId)).size;
  const selectedEntries = entries.filter(
    (e) =>
      (filter === "all" || e.travelerId === filter) &&
      [e.name, e.venueName, e.notes]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );
  const today = new Date().toLocaleDateString("en-CA");
  const catalogMatches = filterDrinks(drinks, search, filter);
  const discoveredIds = new Set(entries.map((e) => e.drinkId));
  /** Renders the shared search/category controls used by the menu and passport views. */
  function renderCatalogControls(label: string) {
    return (
      <div className="toolbar catalog-toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label={label}
            placeholder="Find a drink, brand, or bar…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMenuLimit(36);
            }}
          />
        </div>
        <select
          aria-label="Catalog category"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setMenuLimit(36);
          }}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="muted small">{catalogMatches.length} drinks</span>
      </div>
    );
  }
  /** Supplies sailing context and atomically saves a serving with any newly used catalog records. */
  function renderLogForm(entry?: Entry, repeat?: Entry) {
    return (
      <LogForm
        key={entry?.id ?? repeat?.id ?? "new"}
        sailing={sailing!}
        crew={crew}
        drinks={drinks}
        venues={venues}
        entry={entry}
        repeat={repeat}
        busy={busy}
        history={entries}
        allShips={allShips}
        onAllShips={setAllShips}
        hasShipMenu={catalog.hasShipMenu}
        onSave={(e, selectedDrink) =>
          commit(
            {
              ...data,
              drinks: data.drinks.some((d) => d.id === selectedDrink.id)
                ? data.drinks
                : [...data.drinks, selectedDrink],
              venues: [
                ...data.venues,
                ...venues.filter(
                  (v) =>
                    !data.venues.some((x) => x.id === v.id) &&
                    (v.id === e.venueId ||
                      Object.hasOwn(selectedDrink.venuePrices, v.id)),
                ),
              ],
              entries: entry
                ? data.entries.map((x) => (x.id === e.id ? e : x))
                : [...data.entries, e],
            },
            "Drink saved",
          )
        }
      />
    );
  }
  if (!loaded)
    return (
      <div className="loading">
        <Anchor size={40} />
        <h1>SipAhoy</h1>
        <p>Opening your journal…</p>
      </div>
    );
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Overview");
          }}
        >
          <span className="brand-icon">
            <Martini />
          </span>
          SipAhoy
        </a>
        <div className="sidebar-label">CRUISE DRINK TRACKER</div>
        <nav aria-label="Main navigation">
          {(Object.keys(icons) as Page[]).map((p) => {
            const Icon = icons[p];
            return (
              <button
                key={p}
                aria-label={p}
                aria-current={page === p ? "page" : undefined}
                className={page === p ? "active" : ""}
                onClick={() => setPage(p)}
              >
                <Icon size={19} />
                {p}
                {p === "Drink log" && entries.length > 0 && (
                  <span className="nav-count" aria-hidden="true">
                    {entries.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="plain"
            onClick={() => setModal({ type: "backup" })}
          >
            <ArrowDownToLine size={17} /> Backups & exports
          </button>
          <div className="storage-label">
            <span className="status-dot" /> Saved on this device
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span className="breadcrumb">
            Your journal <span>/</span> <strong>{page}</strong>
          </span>
          <div className="top-actions">
            <span className="connection">
              <span className={"status-dot " + (!online ? "gold" : "")} />
              {!online
                ? "Offline"
                : offlineReady
                  ? "Ready for offline"
                  : "Local journal"}
            </span>
            <button
              className="icon-btn"
              aria-label="Backups and exports"
              onClick={() => setModal({ type: "backup" })}
            >
              <Settings size={19} />
            </button>
            <div className="avatar mini">SA</div>
          </div>
        </header>
        <div className="content">
          {error && (
            <div className="banner error" role="alert">
              {error} <button onClick={() => location.reload()}>Reload</button>
            </div>
          )}
          {needRefresh && (
            <div className="banner">
              A new version is ready. Save any open form before updating.{" "}
              <button onClick={() => updateServiceWorker(true)}>
                Update app
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <h1>{page}</h1>
              <p>
                {page === "Overview"
                  ? "Drink totals and package comparisons for this sailing."
                  : page === "Drink passport"
                    ? "See which drinks you’ve tried."
                    : page === "Drink log"
                      ? "Review, repeat, or edit logged drinks."
                      : page === "Menus & prices"
                        ? "Search community menus and update your prices."
                        : "Manage sailings, travelers, and drink packages."}
              </p>
            </div>
            {sailing && (
              <button
                className="button primary"
                disabled={
                  busy ||
                  !crew.length ||
                  !drinks.length ||
                  !venues.length ||
                  fatal
                }
                onClick={() => setModal({ type: "log" })}
              >
                <Plus size={18} /> Log a drink
              </button>
            )}
          </div>
          {!sailing ? (
            <section className="empty-onboard">
              <div className="nautical">
                <Ship size={64} />
              </div>
              <h2>Create a sailing</h2>
              <p>
                Add your ship, sailing dates, and travelers to start logging
                drinks.
              </p>
              <button
                className="button primary"
                disabled={fatal}
                onClick={() => setModal({ type: "sailing" })}
              >
                <Plus size={18} /> Create your first sailing
              </button>
              <button
                className="plain demo"
                disabled={busy || fatal}
                onClick={() =>
                  save(
                    demoData(),
                    "Sample sailing loaded — all prices and logs are examples.",
                  )
                }
              >
                Take a look with sample data <ArrowRight size={16} />
              </button>
              <p className="small">
                No account needed. Your journal stays on this device.
              </p>
            </section>
          ) : (
            <>
              <div className="sailing-switch">
                <Ship size={17} />
                <select
                  aria-label="Active sailing"
                  value={sailing.id}
                  disabled={busy}
                  onChange={(e) =>
                    save(
                      { ...data, activeSailingId: e.target.value },
                      "Sailing switched",
                    )
                  }
                >
                  {data.sailings.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.ship}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
                <button
                  className="plain"
                  onClick={() => setModal({ type: "sailing" })}
                >
                  <Plus size={15} /> New sailing
                </button>
              </div>
              {crew.length === 0 && (
                <div className="banner">
                  Add your first traveler to start logging.{" "}
                  <button onClick={() => setModal({ type: "traveler" })}>
                    Add traveler
                  </button>
                </div>
              )}
              {page === "Overview" && (
                <>
                  <section className="hero">
                    <div className="hero-copy">
                      <span className="pill">
                        <span /> YOUR SAILING
                      </span>
                      <h2>{sailing.name}</h2>
                      <p>
                        <Ship size={16} />
                        {sailing.ship}
                        <i /> {dateLabel(sailing.start)} –{" "}
                        {dateLabel(sailing.end)}
                      </p>
                      <div className="hero-bottom">
                        <div className="avatar-stack">
                          {crew.slice(0, 4).map((t) => (
                            <span
                              className="avatar"
                              style={{ background: t.color }}
                              key={t.id}
                            >
                              {t.name.slice(0, 1)}
                            </span>
                          ))}
                        </div>
                        <span>
                          {crew.length}{" "}
                          {crew.length === 1 ? "traveler" : "travelers"} ·{" "}
                          {days(sailing)} calendar days
                        </span>
                        <button onClick={() => setPage("Sailing & crew")}>
                          View sailing <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="sun" />
                      <svg viewBox="0 0 420 230">
                        <g
                          fill="none"
                          stroke="#c5d8cd"
                          strokeWidth="1.2"
                          opacity=".5"
                        >
                          <path d="M35 185Q110 160 185 185t160 0M5 210Q80 185 155 210t180 0" />
                        </g>
                        <path d="M105 133h244l-29 39H137z" fill="#dce5d7" />
                        <path d="M154 83h142l24 50H129z" fill="#f4f1de" />
                        <path d="M185 58h89v24h-89z" fill="#dce5d7" />
                        <path d="M210 40h23v18h-23z" fill="#e7aa8c" />
                        <g fill="#2f6265">
                          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                            <rect
                              key={i}
                              x={156 + i * 20}
                              y="109"
                              width="10"
                              height="8"
                              rx="2"
                            />
                          ))}
                        </g>
                        <path
                          d="M84 175q28-17 56 0t56 0t56 0t56 0t56 0"
                          fill="none"
                          stroke="#97b8ad"
                          strokeWidth="4"
                        />
                      </svg>
                    </div>
                  </section>
                  <section
                    className="stat-grid"
                    aria-label="Sailing statistics"
                  >
                    <Stat
                      label="DRINKS LOGGED"
                      value={entries.length.toString()}
                      detail={`${entries.filter((e) => e.sailingDate === today).length} logged today`}
                      icon={<Martini />}
                    />
                    <Stat
                      label="MENU VALUE"
                      value={money(retail)}
                      detail="At the prices you logged"
                      icon={<Wine />}
                    />
                    <Stat
                      label="COVERED BY PACKAGES"
                      value={money(covered)}
                      detail="Before package costs"
                      icon={<Check />}
                    />
                    <Stat
                      label="DRINKS DISCOVERED"
                      value={unique.toString()}
                      detail="Different drinks logged"
                      icon={<Compass />}
                    />
                  </section>
                  <div className="dashboard-grid">
                    <section className="card">
                      <SectionTitle
                        title="Recent drinks"
                        action={
                          <button
                            className="plain"
                            onClick={() => setPage("Drink log")}
                          >
                            View all <ArrowRight size={15} />
                          </button>
                        }
                      />
                      {entries.length ? (
                        entries
                          .slice(0, 4)
                          .map((e) => (
                            <LogRow
                              key={e.id}
                              entry={e}
                              traveler={crew.find((t) => t.id === e.travelerId)}
                              onClick={() =>
                                setModal({ type: "log", entry: e })
                              }
                            />
                          ))
                      ) : (
                        <Empty text="No drinks logged yet." />
                      )}
                    </section>
                    <section className="card package-card">
                      <SectionTitle title="Package comparison" />
                      <PackageCards
                        crew={crew}
                        sailing={sailing}
                        entries={entries}
                      />
                      <p className="footnote">
                        <CircleHelp size={13} /> Comparison uses the full
                        sailing’s package cost.
                      </p>
                    </section>
                  </div>
                  <section className="card daily-card">
                    <SectionTitle title="Drinks by day" />
                    <div className="daily-chart">
                      {Array.from(
                        { length: Math.min(days(sailing), 60) },
                        (_, i) => {
                          const day = new Date(
                            Date.parse(sailing.start) + i * 86400000,
                          )
                            .toISOString()
                            .slice(0, 10);
                          const logs = entries.filter(
                            (e) => e.sailingDate === day,
                          );
                          const max = Math.max(
                            1,
                            ...Array.from(
                              new Set(entries.map((e) => e.sailingDate)),
                            ).map(
                              (d) =>
                                entries.filter((e) => e.sailingDate === d)
                                  .length,
                            ),
                          );
                          return (
                            <div className="day-column" key={day}>
                              <span>{logs.length || "–"}</span>
                              <div className="bar-track">
                                <div
                                  style={{
                                    height: `${(logs.length / max) * 100}%`,
                                  }}
                                />
                              </div>
                              <strong>{dateLabel(day)}</strong>
                            </div>
                          );
                        },
                      )}
                    </div>
                    {days(sailing) > 60 && (
                      <p className="footnote">Showing the first 60 days.</p>
                    )}
                  </section>
                </>
              )}
              {page === "Drink log" && (
                <section className="card">
                  <div className="toolbar log-toolbar">
                    <div className="search">
                      <Search size={17} aria-hidden="true" />
                      <input
                        type="search"
                        aria-label="Search drink log"
                        placeholder="Find a drink, venue, or note…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Filter by traveler"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All travelers</option>
                      {crew.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <span className="muted small">
                      {selectedEntries.length} drinks
                    </span>
                  </div>
                  {selectedEntries.length ? (
                    selectedEntries.map((e) => (
                      <div className="log-with-actions" key={e.id}>
                        <LogRow
                          entry={e}
                          traveler={crew.find((t) => t.id === e.travelerId)}
                          onClick={() => setModal({ type: "log", entry: e })}
                        />
                        <button
                          className="icon-btn"
                          aria-label={`Repeat ${e.name}`}
                          onClick={() => setModal({ type: "log", repeat: e })}
                        >
                          <Plus size={17} />
                        </button>
                        <button
                          className="icon-btn danger"
                          aria-label={`Delete ${e.name}`}
                          onClick={() => {
                            if (confirm(`Delete ${e.name} from the journal?`))
                              save(
                                {
                                  ...data,
                                  entries: data.entries.filter(
                                    (x) => x.id !== e.id,
                                  ),
                                },
                                "Drink removed",
                              );
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <Empty text="No matching drink logs." />
                  )}
                </section>
              )}
              {page === "Drink passport" && (
                <>
                  <div className="passport-banner">
                    <Compass size={38} />
                    <div>
                      <h2>{unique} drinks tried</h2>
                      <p>Your logged drinks and community menu references.</p>
                    </div>
                    <span>
                      {unique} / {drinks.length} on your menu
                    </span>
                  </div>
                  {renderCatalogControls("Search drink passport")}
                  <div className="passport-grid">
                    {[...catalogMatches]
                      .sort(
                        (a, b) =>
                          Number(discoveredIds.has(b.id)) -
                          Number(discoveredIds.has(a.id)),
                      )
                      .slice(0, menuLimit)
                      .map((d) => {
                        const logs = entries.filter((e) => e.drinkId === d.id);
                        return (
                          <article
                            className={
                              "passport-stamp " +
                              (!logs.length ? "untried" : "")
                            }
                            key={d.id}
                          >
                            <div className="stamp-icon">
                              {drinkIcon(d.category)}
                            </div>
                            <span className="eyebrow">{d.category}</span>
                            <h3>{d.name}</h3>
                            <DrinkDescription drink={d} />
                            <p>
                              {logs.length
                                ? `${logs.length} ${logs.length === 1 ? "drink" : "drinks"} · First tried ${dateLabel(logs[logs.length - 1].sailingDate)}`
                                : "Not logged yet"}
                            </p>
                            <span className="stamp-label">
                              {logs.length ? (
                                <>
                                  <Check size={13} /> DISCOVERED
                                </>
                              ) : (
                                "NOT TRIED"
                              )}
                            </span>
                          </article>
                        );
                      })}
                  </div>
                  {catalogMatches.length > menuLimit && (
                    <button
                      className="button secondary full"
                      onClick={() => setMenuLimit(menuLimit + 36)}
                    >
                      Show more drinks
                    </button>
                  )}
                </>
              )}
              {page === "Menus & prices" && (
                <>
                  <div className="banner subtle">
                    <CircleHelp size={17} />
                    <span>
                      Community menus are references, not live inventory.
                      Confirm prices onboard. Your edits take precedence; past
                      logs keep their recorded prices.
                    </span>
                  </div>
                  <div className="section-heading">
                    <h2>{sailing.ship} menu</h2>
                    <button
                      className="button secondary"
                      onClick={() => setModal({ type: "drink" })}
                    >
                      <Plus size={16} /> Add a drink
                    </button>
                  </div>
                  <p className="footnote catalog-attribution">
                    {catalog.hasShipMenu
                      ? `${catalog.reportedCount} named drinks reported for ${sailing.ship}.`
                      : "No ship-specific community menu is available yet."}{" "}
                    {catalog.sourceUrl && (
                      <a
                        href={catalog.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View community source
                      </a>
                    )}
                  </p>
                  <label className="picker-checkbox all-ships">
                    <input
                      type="checkbox"
                      checked={allShips}
                      onChange={(e) => {
                        setAllShips(e.target.checked);
                        setMenuLimit(36);
                      }}
                    />{" "}
                    Include community drinks from other ships
                  </label>
                  {renderCatalogControls("Search ship menu")}
                  <div className="menu-grid">
                    {catalogMatches.slice(0, menuLimit).map((d) => (
                      <button
                        className="menu-item"
                        key={d.id}
                        onClick={() => setModal({ type: "drink", drink: d })}
                      >
                        <span className="drink-icon">
                          {drinkIcon(d.category)}
                        </span>
                        <div>
                          <h3>{d.name}</h3>
                          <DrinkDescription drink={d} />
                          <p>
                            {d.category} ·{" "}
                            {Object.keys(d.venuePrices).length
                              ? `${Object.keys(d.venuePrices).length} venue prices`
                              : "Default price"}
                          </p>
                          <small>
                            {d.community
                              ? d.priceSource === "user"
                                ? "Your price · community drink"
                                : `Community reference · retrieved ${dateLabel(d.community.retrievedAt)}`
                              : "Your saved menu"}
                            {d.community && !d.community.reportedForShip
                              ? " · Other ship"
                              : ""}
                          </small>
                        </div>
                        <strong>
                          {d.priceCents === null
                            ? "Enter price"
                            : money(d.priceCents)}
                        </strong>
                      </button>
                    ))}
                  </div>
                  {catalogMatches.length > menuLimit && (
                    <button
                      className="button secondary full"
                      onClick={() => setMenuLimit(menuLimit + 36)}
                    >
                      Show more drinks
                    </button>
                  )}
                  {!catalogMatches.length && (
                    <Empty text="No matching drinks. Add a drink to your menu." />
                  )}
                  <section className="card venues-card">
                    <SectionTitle title="Venues" />
                    {shipVenueInfo[sailing.ship] && (
                      <p className="footnote venue-source">
                        Includes ship venues without published drink menus.{" "}
                        <a
                          href={shipVenueInfo[sailing.ship].sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View official ship venues
                        </a>
                      </p>
                    )}
                    <div className="venue-chips">
                      {venues.map((v) => (
                        <span key={v.id}>
                          <Anchor size={14} />
                          {v.name}
                        </span>
                      ))}
                    </div>
                    <form
                      className="inline-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const name = String(
                          new FormData(form).get("name"),
                        ).trim();
                        if (
                          name &&
                          !venues.some(
                            (v) => v.name.toLowerCase() === name.toLowerCase(),
                          )
                        )
                          save(
                            {
                              ...data,
                              venues: [
                                ...data.venues,
                                { id: uid(), shipId: sailing.shipId, name },
                              ],
                            },
                            "Venue added",
                          ).then((ok) => {
                            if (ok) form.reset();
                          });
                        else setError("Enter a unique venue name.");
                      }}
                    >
                      <input
                        name="name"
                        aria-label="New venue name"
                        placeholder="Another favorite spot…"
                        required
                        maxLength={100}
                      />
                      <button className="button secondary" disabled={busy}>
                        <Plus size={16} /> Add venue
                      </button>
                    </form>
                  </section>
                </>
              )}
              {page === "Sailing & crew" && (
                <>
                  <section className="card sailing-detail">
                    <div>
                      <span className="eyebrow">CURRENT SAILING</span>
                      <h2>{sailing.name}</h2>
                      <p>
                        {sailing.ship} · {dateLabel(sailing.start)} –{" "}
                        {dateLabel(sailing.end)} · {days(sailing)} calendar days
                      </p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => setModal({ type: "sailing", sailing })}
                    >
                      Edit sailing
                    </button>
                  </section>
                  <div className="section-heading">
                    <div>
                      <h2>Travelers</h2>
                      <p className="muted">
                        Manage each traveler’s drink package and costs.
                      </p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => setModal({ type: "traveler" })}
                    >
                      <Plus size={16} /> Add traveler
                    </button>
                  </div>
                  <div className="crew-grid">
                    {crew.map((t) => {
                      const stats = travelerStats(t, sailing, entries);
                      return (
                        <button
                          className="card crew-card"
                          key={t.id}
                          onClick={() =>
                            setModal({ type: "traveler", traveler: t })
                          }
                        >
                          <span
                            className="avatar"
                            style={{ background: t.color }}
                          >
                            {t.name.slice(0, 1)}
                          </span>
                          <h3>{t.name}</h3>
                          <p>
                            {t.hasPackage
                              ? "Drink package"
                              : "No drink package"}
                            {t.hasPackage && stats.cost !== null
                              ? ` · ${money(stats.cost)} drink-only cost${stats.pricing?.estimated ? " (estimate)" : ""}`
                              : ""}
                          </p>
                          <div>
                            <span>{stats.count} drinks logged</span>
                            <strong>{money(stats.retail)} menu value</strong>
                          </div>
                          <small>
                            Edit traveler & package <ArrowRight size={12} />
                          </small>
                        </button>
                      );
                    })}
                  </div>
                  <section className="card">
                    <SectionTitle title="Package comparisons" />
                    <PackageCards
                      crew={crew}
                      sailing={sailing}
                      entries={entries}
                    />
                    <p className="footnote">
                      Coverage is recorded per drink. Comparisons use your
                      drink-only cost after gratuities, fees, and bundled-extra
                      deductions. Unknown amounts show no break-even result.
                    </p>
                  </section>
                </>
              )}
            </>
          )}
          <footer>
            <span>
              <Anchor size={14} /> SipAhoy
            </span>
            <span>
              Data is saved on this device.{" "}
              <button onClick={() => setModal({ type: "backup" })}>
                Export a backup <ArrowRight size={12} />
              </button>
            </span>
          </footer>
        </div>
      </main>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {modal && (
        <ModalShell
          title={
            modal.type === "sailing"
              ? modal.sailing
                ? "Edit sailing"
                : "Create sailing"
              : modal.type === "traveler"
                ? modal.traveler
                  ? "Edit traveler"
                  : "Add traveler"
                : modal.type === "log"
                  ? modal.entry
                    ? "Edit drink log"
                    : "Log a drink"
                  : modal.type === "drink"
                    ? modal.drink
                      ? "Edit menu drink"
                      : "Add menu drink"
                    : "Backups & exports"
          }
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          {error && (
            <div role="alert" className="banner error">
              {error}
            </div>
          )}
          {modal.type === "sailing" && (
            <SailingForm
              existing={modal.sailing}
              busy={busy}
              onSave={(s) => {
                const old = modal.sailing;
                let next = {
                  ...data,
                  activeSailingId: s.id,
                  sailings: old
                    ? data.sailings.map((x) => (x.id === s.id ? s : x))
                    : [...data.sailings, s],
                };
                if (!old) {
                  const existingShip = data.sailings.find(
                    (x) => x.ship.toLowerCase() === s.ship.toLowerCase(),
                  );
                  if (existingShip) {
                    s.shipId = existingShip.shipId;
                  } else {
                    const c = shipCatalog(s.shipId);
                    next = {
                      ...next,
                      drinks: [...data.drinks, ...c.drinks],
                      venues: [...data.venues, ...c.venues],
                    };
                  }
                }
                if (
                  data.entries.some(
                    (e) =>
                      e.sailingId === s.id &&
                      (e.sailingDate < s.start || e.sailingDate > s.end),
                  )
                ) {
                  setError(
                    "These dates would exclude an existing drink log. Keep the logged dates within the sailing.",
                  );
                  return;
                }
                commit(next, "Sailing saved");
              }}
            />
          )}
          {modal.type === "traveler" && sailing && (
            <TravelerForm
              existing={modal.traveler}
              defaults={modal.traveler ? undefined : crew.at(-1)}
              sailing={sailing}
              busy={busy}
              onSave={(t) =>
                commit(
                  {
                    ...data,
                    travelers: modal.traveler
                      ? data.travelers.map((x) => (x.id === t.id ? t : x))
                      : [...data.travelers, t],
                  },
                  "Traveler saved",
                )
              }
            />
          )}
          {modal.type === "log" &&
            sailing &&
            renderLogForm(modal.entry, modal.repeat)}
          {modal.type === "drink" && sailing && (
            <DrinkForm
              existing={modal.drink}
              shipId={sailing.shipId}
              venues={venues}
              busy={busy}
              onSave={(d) =>
                commit(
                  {
                    ...data,
                    drinks: data.drinks.some((x) => x.id === d.id)
                      ? data.drinks.map((x) => (x.id === d.id ? d : x))
                      : [...data.drinks, d],
                    venues: [
                      ...data.venues,
                      ...venues.filter(
                        (v) =>
                          !data.venues.some((x) => x.id === v.id) &&
                          Object.hasOwn(d.venuePrices, v.id),
                      ),
                    ],
                  },
                  "Menu saved",
                )
              }
            />
          )}
          {modal.type === "backup" && (
            <BackupForm
              data={data}
              busy={busy || fatal}
              onRestore={(d) => commit(d, "Backup restored successfully")}
            />
          )}
        </ModalShell>
      )}
    </div>
  );
}
