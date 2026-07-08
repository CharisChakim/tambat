import { useMemo, useState } from "react";
import type { Host } from "../types";

interface Props {
  hosts: Host[];
  onConnect: (host: Host) => void;
  onEdit: (host: Host) => void;
  onDelete: (host: Host) => void;
  onAdd: () => void;
}

export default function Sidebar({ hosts, onConnect, onEdit, onDelete, onAdd }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return hosts;
    return hosts.filter((h) =>
      [h.label, h.host, h.username].some((v) => v.toLowerCase().includes(needle)),
    );
  }, [hosts, q]);

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-text">
          <span className="brand-mark">tambat</span>
          <span className="brand-cursor">_</span>
        </span>
        <svg className="brand-logo" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="3.4" r="1.4" fill="currentColor" />
          <path d="M8 4.9V13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M5.4 6.6h5.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path
            d="M4 9.2a4 4 0 0 0 8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
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
