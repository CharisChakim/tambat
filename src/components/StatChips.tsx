import type { JSX, ReactNode } from "react";
import { levelOf, SIG_LABEL, usageCls } from "../format";

// ── Ikon chip (16x16, currentColor) ──
export const IC_RAM = (
  <svg viewBox="0 0 16 16">
    <rect x="1.5" y="4.5" width="13" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4 4.5v-2M8 4.5v-2M12 4.5v-2M4 13.5v-2M8 13.5v-2M12 13.5v-2" stroke="currentColor" strokeWidth="1.2" />
    <rect x="4" y="6.7" width="2.2" height="2.6" fill="currentColor" />
    <rect x="7.2" y="6.7" width="2.2" height="2.6" fill="currentColor" />
  </svg>
);
export const IC_DISK = (
  <svg viewBox="0 0 16 16">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="6" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="6" cy="8" r="0.7" fill="currentColor" />
    <path d="M11.8 5.4v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="11.8" cy="10.6" r="0.8" fill="currentColor" />
  </svg>
);
export const IC_TEMP = (
  <svg viewBox="0 0 16 16">
    <path
      d="M6.8 2.8a1.2 1.2 0 0 1 2.4 0v6a3 3 0 1 1-2.4 0z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <circle cx="8" cy="11.4" r="1.4" fill="currentColor" />
    <path d="M8 10.2V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
export const IC_BAT = (
  <svg viewBox="0 0 16 16">
    <rect x="1.5" y="5" width="11.5" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <path d="M14.5 7v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="3.2" y="6.7" width="3.4" height="2.6" fill="currentColor" />
  </svg>
);
export const IC_UPTIME = (
  <svg viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <path d="M8 4.6V8l2.4 1.6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export function Chip({
  icon,
  text,
  pct,
  fillCls,
  title,
  onClick,
}: {
  icon: JSX.Element;
  text: ReactNode;
  pct?: number;
  fillCls?: string;
  title: string;
  onClick?: () => void;
}) {
  return (
    <div className={"chip" + (onClick ? " chip--btn" : "")} title={title} onClick={onClick}>
      <span className="chip-icon">{icon}</span>
      <span className="chip-body">
        <span className="chip-text">{text}</span>
        {pct !== undefined && (
          <span className="chip-bar">
            <span
              className={"chip-fill " + (fillCls ?? usageCls(pct))}
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </span>
        )}
      </span>
    </div>
  );
}

/** Chip sinyal: bar 4-tingkat + latensi "xx ms". Ping ke 1.1.1.1. */
export function PingChip({ ms }: { ms: number | null }) {
  const level = levelOf(ms);
  const cls = level >= 3 ? " sig--ok" : level === 2 ? " sig--warn" : " sig--bad";
  return (
    <div
      className="chip"
      title={`Ping 1.1.1.1: ${ms === null ? "timeout" : `${ms.toFixed(1)} ms`} — sinyal ${SIG_LABEL[level]}`}
    >
      <span className={"chip-icon sig" + cls}>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={"sig-bar" + (i <= level ? " sig-bar--on" : "")}
            style={{ height: 3 + i * 3 }}
          />
        ))}
      </span>
      <span className="chip-body">
        <span className="chip-text">{ms === null ? "timeout" : `${Math.round(ms)} ms`}</span>
      </span>
    </div>
  );
}
