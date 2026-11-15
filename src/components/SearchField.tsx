import { useRef, type ReactNode } from "react";
import { Search, X } from "lucide-react";

export function SearchField({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  className = "",
  children,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  className?: string;
  children?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={`search ${className}`}>
      <Search size={17} aria-hidden="true" />
      <input
        ref={input}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
      />
      {value.length > 0 && (
        <button
          type="button"
          className="search-clear"
          aria-label="Clear search"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onChange("");
            input.current?.focus();
          }}
        >
          <X size={17} aria-hidden="true" />
        </button>
      )}
      {children}
    </div>
  );
}
