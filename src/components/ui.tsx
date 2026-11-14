import { useEffect, useRef, type ReactNode } from "react";
import { Martini, X } from "lucide-react";

/** Inputs for ModalShell. */
type ModalShellProps = {
  /** Visible heading and accessible dialog name. */
  title: string;
  /** Requests dismissal; the parent unmounts the dialog. */
  onClose: () => void;
  /** Dialog body, usually a focused form. */
  children: ReactNode;
};

/** Uses the native modal dialog for focus handling and reports Escape/backdrop dismissal to its owner. */
export function ModalShell({ title, onClose, children }: ModalShellProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-head">
        <div>
          <h2>{title}</h2>
        </div>
        <button
          className="icon-btn"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {children}
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
