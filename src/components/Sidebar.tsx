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
        <span className="brand-mark">tambat</span>
        <span className="brand-cursor">_</span>
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
