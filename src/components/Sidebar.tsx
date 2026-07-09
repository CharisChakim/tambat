import { useMemo, useState } from "react";
import type { Host } from "../types";

interface Props {
  hosts: Host[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onConnect: (host: Host) => void;
  onEdit: (host: Host) => void;
  onDelete: (host: Host) => void;
  onAdd: () => void;
}

/** Huruf awal label (atau host) untuk lencana rail. */
const initialOf = (h: Host) => (h.label || h.host).trim().charAt(0).toUpperCase() || "?";

export default function Sidebar({
  hosts,
  collapsed,
  onToggleCollapse,
  onConnect,
  onEdit,
  onDelete,
  onAdd,
}: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return hosts;
    return hosts.filter((h) =>
      [h.label, h.host, h.username].some((v) => v.toLowerCase().includes(needle)),
    );
  }, [hosts, q]);

  // Rail sempit: hanya lencana inisial tiap host (tetap bisa diklik untuk
  // menyambung), tombol perluas di atas, dan tombol tambah host di bawah.
  if (collapsed) {
    return (
      <aside className="sidebar sidebar--rail">
        <button className="rail-toggle" title="Perluas daftar host" onClick={onToggleCollapse}>
          ›
        </button>
        <div className="host-list host-list--rail">
          {hosts.map((h) => (
            <button
              key={h.id}
              className="host-rail"
              title={`Sambungkan ke ${h.username}@${h.host}`}
              onClick={() => onConnect(h)}
            >
              {initialOf(h)}
            </button>
          ))}
        </div>
        <button className="btn btn--primary rail-add" title="Host baru" onClick={onAdd}>
          +
        </button>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-text">
          <span className="brand-mark">tambat</span>
          <span className="brand-cursor">_</span>
        </span>
        {/* Logo "Tambat": jangkar miring, tali melilit batangnya lalu menambat
            ke sebuah server (titik hijau = online) — sesi ditautkan ke seberang. */}
        <svg
          className="brand-logo"
          viewBox="0 0 46 32"
          aria-hidden="true"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <g transform="rotate(-20 14 16)">
            <g stroke="currentColor" strokeWidth="2.1">
              <circle cx="14" cy="5" r="2.2" />
              <line x1="14" y1="7.2" x2="14" y2="25" />
              <line x1="8.4" y1="10.2" x2="19.6" y2="10.2" />
              <path d="M5 17.4C5 23.8 9.2 26.6 14 26.6 18.8 26.6 23 23.8 23 17.4" />
              <path d="M5 17.4 2.4 16.3M5 17.4 4.7 20.2" />
              <path d="M23 17.4 25.6 16.3M23 17.4 23.3 20.2" />
            </g>
            <path
              d="M9.6 12.4C9.6 10.8 18.4 10.8 18.4 12.8 18.4 14.8 9.6 14.8 9.6 16.8 9.6 18.6 18.4 18.6 18.4 16.9"
              stroke="#d9a86b"
              strokeWidth="1.8"
            />
          </g>
          <path d="M23 23.4C28 27 31.5 22.5 35 24.2" stroke="#d9a86b" strokeWidth="1.9" />
          <g stroke="currentColor" strokeWidth="1.7">
            <rect x="34" y="19.5" width="9" height="10" rx="1.8" />
            <line x1="36" y1="22.6" x2="41" y2="22.6" />
            <line x1="36" y1="26.4" x2="41" y2="26.4" />
          </g>
          <circle cx="37" cy="24.5" r="0.85" fill="#4fbf8b" />
        </svg>
        <button className="rail-toggle" title="Ciutkan daftar host" onClick={onToggleCollapse}>
          ‹
        </button>
      </div>

      <input
        className="search"
        placeholder="Cari host…  ( / )"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setQ("");
        }}
        id="host-search"
      />

      <div className="host-list">
        {filtered.length === 0 && (
          <div className="empty">
            {hosts.length === 0
              ? "Belum ada host. Tambahkan tambatan pertamamu."
              : "Tidak ada yang cocok."}
          </div>
        )}
        {filtered.map((h) => (
          <div
            key={h.id}
            className="host-item"
            onClick={() => onConnect(h)}
            title={`Sambungkan ke ${h.username}@${h.host}`}
          >
            <div className="host-main">
              <div className="host-label">{h.label || h.host}</div>
              <div className="host-sub">
                {h.username}@{h.host}
                {h.port !== 22 ? `:${h.port}` : ""}
                <span className="host-auth"> · {h.authType}</span>
              </div>
            </div>
            <div className="host-actions" onClick={(e) => e.stopPropagation()}>
              <button className="icon-btn" title="Ubah" onClick={() => onEdit(h)}>
                ✎
              </button>
              <button
                className="icon-btn icon-btn--danger"
                title="Hapus"
                onClick={() => onDelete(h)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn--primary add-btn" onClick={onAdd}>
        + Host baru
      </button>
    </aside>
  );
}
