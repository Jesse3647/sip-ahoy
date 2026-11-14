import { useEffect, useRef, type ReactNode } from "react";
import { Martini, X } from "lucide-react";
import { useMobileSheet } from "./useMobileSheet";

/** Inputs for ModalShell. */
type ModalShellProps = {
  /** Visible heading and accessible dialog name. */
  title: string;
  /** Requests dismissal; the parent unmounts the dialog. */
  onClose: () => void;
  /** Dialog body, usually a focused form. */
  children: ReactNode;
  className?: string;
  id?: string;
  /** Enables a real draggable handle on phone-sized navigation sheets. */
  mobileSheet?: boolean;
  sheetLabel?: string;
};

/** Uses the native modal dialog for focus handling and reports Escape/backdrop dismissal to its owner. */
export function ModalShell({
  title,
  onClose,
  children,
  className,
  id,
  mobileSheet = false,
  sheetLabel = "navigation menu",
}: ModalShellProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const sheet = useMobileSheet(ref, onClose);
  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const scrollY = window.scrollY;
    const previous = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    ref.current?.showModal();
    return () => {
      Object.assign(document.body.style, previous);
      window.scrollTo({ top: scrollY, behavior: "instant" });
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={className}
      id={id}
      style={mobileSheet ? sheet.style : undefined}
      data-sheet={
        mobileSheet ? (sheet.expanded ? "expanded" : "compact") : undefined
      }
      data-dragging={mobileSheet && sheet.dragging ? "true" : undefined}
      data-closing={mobileSheet && sheet.closing ? "true" : undefined}
      onTransitionEnd={mobileSheet ? sheet.onTransitionEnd : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (!mobileSheet && e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-head">
        {mobileSheet && (
          <button
            type="button"
            className="sheet-handle"
            aria-label={
              sheet.expanded ? `Collapse ${sheetLabel}` : `Expand ${sheetLabel}`
            }
            aria-expanded={sheet.expanded}
            title="Drag up to expand; pull down one-third of the menu to close"
            {...sheet.handleProps}
          >
            <span />
          </button>
        )}
        <div>
          <h2 tabIndex={-1} autoFocus>
            {title}
          </h2>
        </div>
        <button
          className="icon-btn"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {mobileSheet ? <div className="sheet-content">{children}</div> : children}
    </dialog>
  );
}
/** Inputs for Field. */
type FieldProps = {
  /** Visible and accessible description of the enclosed control. */
  label: string;
  /** Form control rendered inside the label. */
  children: ReactNode;
};

/** Associates a visible label with its enclosed form control. */
export function Field({ label, children }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
/** Inputs for Stat. */
type StatProps = {
  /** Short metric name. */
  label: string;
  /** Already-formatted metric value. */
  value: string;
  /** Context that explains the displayed number. */
  detail: string;
  /** Decorative metric icon. */
  icon: ReactNode;
};

/** Displays one overview metric and its supporting context. */
export function Stat({ label, value, detail, icon }: StatProps) {
  return (
    <article className="stat">
      <div>
        <span className="eyebrow">{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
/** Inputs for SectionTitle. */
type SectionTitleProps = {
  /** Section heading text. */
  title: string;
  /** Optional button or link next to the heading. */
  action?: ReactNode;
};

/** Pairs a section heading with an optional action. */
export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
/** Inputs for Empty. */
type EmptyProps = {
  /** Explanation appropriate to the current empty state. */
  text: string;
};

/** Displays explanatory text when a list has no matching items. */
export function Empty({ text }: EmptyProps) {
  return (
    <div className="empty">
      <Martini size={30} />
      <p>{text}</p>
    </div>
  );
}
