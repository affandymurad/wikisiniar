import { useEffect, useRef, useState } from "react";

const ICONS = {
  system: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
      {ICONS[name]}
    </svg>
  );
}

const OPTIONS = [
  ["system", "themeSystem"],
  ["light", "themeLight"],
  ["dark", "themeDark"],
];

export default function ThemeMenu({ value, onChange, t }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = OPTIONS.find(([v]) => v === value) || OPTIONS[0];

  return (
    <div className="dropdown" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="tool-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("themeLabel")}: ${t(current[1])}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name={current[0]} />
        <span className="tool-btn-text">{t(current[1])}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="ico chev">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="menu" role="menu" aria-label={t("themeLabel")}>
          {OPTIONS.map(([v, key]) => (
            <button
              key={v}
              type="button"
              role="menuitemradio"
              aria-checked={v === value}
              className={`menu-item${v === value ? " active" : ""}`}
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
            >
              <Icon name={v} />
              <span>{t(key)}</span>
              {v === value && (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="ico check">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
