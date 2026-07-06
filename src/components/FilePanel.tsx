import { useEffect, useRef, useState } from "react";
import type { JSX, ReactNode } from "react";
import {
  panelClose,
  panelList,
  panelOpen,
  panelOpenFile,
  panelStats,
  panelTransfer,
} from "../api";
import type { DirEntry, DirListing, DiskUsage, ServerStats, Tab } from "../types";
import FileIcon from "./FileIcon";

const POLL_MS = 5000;

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ["KiB", "MiB", "GiB", "TiB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

/** Format ringkas untuk chip: 3.4G, 512M, 98G */
function fmtShort(kb: number): string {
  const units = ["K", "M", "G", "T"];
  let v = kb;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)}${units[i]}`;
}

const BAT_STATUS: Record<string, string> = {
  Charging: "mengisi",
  Discharging: "melepas",
  Full: "penuh",
  "Not charging": "tidak mengisi",
};

function joinPath(dir: string, name: string) {
  return dir === "/" ? `/${name}` : `${dir}/${name}`;
}

/** Partisi yang memuat `path`: mount dengan prefix terpanjang. */
function diskOfPath(disks: DiskUsage[], path: string): DiskUsage | null {
  let best: DiskUsage | null = null;
  for (const d of disks) {
    const m = d.mount.endsWith("/") ? d.mount.slice(0, -1) : d.mount;
    if (path === m || m === "" || path.startsWith(m + "/")) {
      if (!best || m.length > best.mount.length) best = d;
    }
  }
  return best ?? disks[0] ?? null;
}

const usageCls = (pct: number) =>
  pct >= 90 ? "chip-fill--crit" : pct >= 70 ? "chip-fill--warn" : "";

// ── Ikon chip (16x16, currentColor) ──
const IC_RAM = (
  <svg viewBox="0 0 16 16">
    <rect x="1.5" y="4.5" width="13" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4 4.5v-2M8 4.5v-2M12 4.5v-2M4 13.5v-2M8 13.5v-2M12 13.5v-2" stroke="currentColor" strokeWidth="1.2" />
    <rect x="4" y="6.7" width="2.2" height="2.6" fill="currentColor" />
    <rect x="7.2" y="6.7" width="2.2" height="2.6" fill="currentColor" />
  </svg>
);
const IC_DISK = (
  <svg viewBox="0 0 16 16">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="6" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <circle cx="6" cy="8" r="0.7" fill="currentColor" />
    <path d="M11.8 5.4v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="11.8" cy="10.6" r="0.8" fill="currentColor" />
  </svg>
);
const IC_TEMP = (
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
const IC_BAT = (
  <svg viewBox="0 0 16 16">
    <rect x="1.5" y="5" width="11.5" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <path d="M14.5 7v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="3.2" y="6.7" width="3.4" height="2.6" fill="currentColor" />
  </svg>
);

function Chip({
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

/** Level sinyal dari latensi: 4=sangat bagus … 1=lemah, 0=timeout. */
function levelOf(ms: number | null): 0 | 1 | 2 | 3 | 4 {
  if (ms === null) return 0;
  if (ms <= 30) return 4;
  if (ms <= 80) return 3;
  if (ms <= 200) return 2;
  return 1;
}

function PingRow({ label, ms }: { label: string; ms: number | null }) {
  const level = levelOf(ms);
  const cls = level >= 3 ? " sig--ok" : level === 2 ? " sig--warn" : " sig--bad";
  return (
    <div className="ping-row">
      <span className="stat-label">{label}</span>
      <span className={"ping-right" + cls}>
        <span className="sig" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={"sig-bar" + (i <= level ? " sig-bar--on" : "")}
              style={{ height: 3 + i * 2.5 }}
            />
          ))}
        </span>
        <span className="ping-val">{ms === null ? "timeout" : `${ms.toFixed(1)} ms`}</span>
      </span>
    </div>
  );
}

interface Props {
  tab: Tab;
  active: boolean;
}

/** Panel ala MobaXterm: file browser SFTP + statistik server (RAM, disk,
 *  suhu, baterai, ping). Memakai sesi SSH kedua, terpisah dari terminal. */
export default function FilePanel({ tab, active }: Props) {
  const panelId = `panel-${tab.tabId}-${tab.attempt}`;
  const [listing, setListing] = useState<DirListing | null>(null);
  const [pathInput, setPathInput] = useState("");
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  /** null = otomatis (ikuti folder yang sedang dibuka) */
  const [diskSel, setDiskSel] = useState<string | null>(null);
  const [diskMenu, setDiskMenu] = useState(false);
  /** klik kanan: posisi menu + entri yang diklik (null = area kosong) */
  const [menu, setMenu] = useState<{ x: number; y: number; entry: DirEntry | null } | null>(null);
  /** "clipboard" salin/potong file remote, per tab */
  const [clip, setClip] = useState<{ path: string; mv: boolean } | null>(null);
  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;
    setListing(null);
    setStats(null);
    setError(null);

    (async () => {
      try {
        await panelOpen(panelId, {
          host: tab.host.host,
          port: tab.host.port,
          username: tab.host.username,
          authType: tab.host.authType,
          password: tab.host.authType === "password" ? tab.secret : undefined,
          keyPath: tab.host.keyPath ?? undefined,
          keyPassphrase: tab.host.authType === "key" ? tab.secret : undefined,
          cols: 80,
          rows: 24,
        });
        if (disposed) {
          panelClose(panelId).catch(() => {});
          return;
        }
        const l = await panelList(panelId, ".");
        if (disposed) return;
        setListing(l);
        setPathInput(l.path);

        const poll = async () => {
          if (!activeRef.current) return;
          try {
            const s = await panelStats(panelId);
            if (!disposed) setStats(s);
          } catch {
            // statistik gagal sesaat (mis. koneksi lambat) — biarkan nilai lama
          }
        };
        await poll();
        if (!disposed) timer = window.setInterval(poll, POLL_MS);
      } catch (e) {
        if (!disposed) setError(String(e));
      }
    })();

    return () => {
      disposed = true;
      if (timer) window.clearInterval(timer);
      panelClose(panelId).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelId, retry]);

  const navigate = async (p: string) => {
    setLoading(true);
    try {
      const l = await panelList(panelId, p);
      setListing(l);
      setPathInput(l.path);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (en: DirEntry) => {
    if (!listing) return;
    setBusyMsg(`membuka ${en.name}…`);
    try {
      await panelOpenFile(panelId, joinPath(listing.path, en.name));
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyMsg(null);
    }
  };

  const paste = async () => {
    if (!clip || !listing) return;
    setBusyMsg(clip.mv ? "memindahkan…" : "menyalin…");
    try {
      await panelTransfer(panelId, clip.path, listing.path, clip.mv);
      if (clip.mv) setClip(null);
      setError(null);
      await navigate(listing.path);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyMsg(null);
    }
  };

  const copyText = (s: string) => {
    navigator.clipboard?.writeText(s).catch(() => {});
  };

  if (error && !listing) {
    return (
      <aside className="fpanel">
        <div className="fpanel-msg">
          <p className="fpanel-err">{error}</p>
          <button className="btn" onClick={() => setRetry((r) => r + 1)}>
            Coba lagi
          </button>
        </div>
      </aside>
    );
  }

  const memUsed = stats ? stats.memTotalKb - stats.memAvailKb : 0;
  const disk = stats
    ? (diskSel && stats.disks.find((d) => d.mount === diskSel)) ||
      diskOfPath(stats.disks, listing?.path ?? "/")
    : null;

  return (
    <aside className="fpanel">
      <div className="fpanel-nav">
        <button
          className="icon-btn"
          title="Kembali (folder induk)"
          disabled={!listing}
          onClick={() => listing && navigate(`${listing.path}/..`)}
        >
          ←
        </button>
        <button className="icon-btn" title="Folder home" onClick={() => navigate(".")}>
          ⌂
        </button>
        <button
          className="icon-btn"
          title="Muat ulang"
          disabled={!listing}
          onClick={() => listing && navigate(listing.path)}
        >
          ⟳
        </button>
        {(loading || busyMsg) && <span className="fpanel-busy">{busyMsg ?? "…"}</span>}
      </div>

      <input
        className="fpanel-path"
        value={pathInput}
        placeholder="/path/folder"
        spellCheck={false}
        onChange={(e) => setPathInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate(pathInput.trim() || ".");
        }}
      />
      {error && <div className="fpanel-err fpanel-err--inline">{error}</div>}

      <div
        className="fpanel-list"
        onContextMenu={(e) => {
          e.preventDefault();
          if (listing) setMenu({ x: e.clientX, y: e.clientY, entry: null });
        }}
      >
        {!listing && !error && <div className="fpanel-msg">memuat…</div>}
        {listing?.entries.length === 0 && <div className="fpanel-msg">folder kosong</div>}
        {listing?.entries.map((en) => (
          <div
            key={en.name}
            className={
              "fentry" +
              (en.isDir ? " fentry--dir" : " fentry--file") +
              (en.name.startsWith(".") ? " fentry--hidden" : "")
            }
            title={en.name}
            onClick={() => en.isDir && navigate(joinPath(listing.path, en.name))}
            onDoubleClick={() => !en.isDir && openFile(en)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenu({ x: e.clientX, y: e.clientY, entry: en });
            }}
          >
            <FileIcon name={en.name} isDir={en.isDir} />
            <span className="fentry-name">{en.name}</span>
            {!en.isDir && <span className="fentry-size">{fmtBytes(en.size)}</span>}
          </div>
        ))}
      </div>

      {menu && listing && (
        <div
          className="ctx-overlay"
          onClick={() => setMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu(null);
          }}
        >
          <div
            className="ctx-menu"
            style={{
              left: Math.min(menu.x, window.innerWidth - 190),
              top: Math.min(menu.y, window.innerHeight - 230),
            }}
          >
            {menu.entry && (
              <>
                <div
                  className="ctx-item"
                  onClick={() => {
                    const en = menu.entry!;
                    setMenu(null);
                    if (en.isDir) navigate(joinPath(listing.path, en.name));
                    else openFile(en);
                  }}
                >
                  Buka
                </div>
                <div
                  className="ctx-item"
                  onClick={() => {
                    setClip({ path: joinPath(listing.path, menu.entry!.name), mv: false });
                    setMenu(null);
                  }}
                >
                  Salin
                </div>
                <div
                  className="ctx-item"
                  onClick={() => {
                    setClip({ path: joinPath(listing.path, menu.entry!.name), mv: true });
                    setMenu(null);
                  }}
                >
                  Potong
                </div>
                <div
                  className="ctx-item"
                  onClick={() => {
                    copyText(joinPath(listing.path, menu.entry!.name));
                    setMenu(null);
                  }}
                >
                  Salin path
                </div>
                <div
                  className="ctx-item"
                  onClick={() => {
                    copyText(menu.entry!.name);
                    setMenu(null);
                  }}
                >
                  Salin nama
                </div>
                <div className="ctx-sep" />
              </>
            )}
            {!menu.entry && (
              <div
                className="ctx-item"
                onClick={() => {
                  copyText(listing.path);
                  setMenu(null);
                }}
              >
                Salin path folder
              </div>
            )}
            <div
              className={"ctx-item" + (clip ? "" : " ctx-item--dis")}
              onClick={() => {
                if (!clip) return;
                setMenu(null);
                paste();
              }}
            >
              Tempel
              {clip ? ` — ${clip.path.split("/").pop()}${clip.mv ? " (pindah)" : ""}` : ""}
            </div>
            <div
              className="ctx-item"
              onClick={() => {
                setMenu(null);
                navigate(listing.path);
              }}
            >
              Muat ulang
            </div>
          </div>
        </div>
      )}

      <div className="fpanel-stats">
        {!stats && <div className="fpanel-msg">menunggu statistik…</div>}
        {stats && (
          <>
            <div className="chip-row">
              {stats.memTotalKb > 0 && (
                <Chip
                  icon={IC_RAM}
                  text={`${fmtShort(memUsed)}/${fmtShort(stats.memTotalKb)}`}
                  pct={(memUsed / stats.memTotalKb) * 100}
                  title={`RAM terpakai ${fmtBytes(memUsed * 1024)} dari ${fmtBytes(stats.memTotalKb * 1024)}`}
                />
              )}
              {disk && (
                <Chip
                  icon={IC_DISK}
                  text={
                    <>
                      <span className="chip-mount">{disk.mount}</span>{" "}
                      {`${fmtShort(disk.usedKb)}/${fmtShort(disk.totalKb)}`}
                    </>
                  }
                  pct={(disk.usedKb / disk.totalKb) * 100}
                  title={
                    `Partisi ${disk.mount}: ${fmtBytes(disk.usedKb * 1024)} dari ${fmtBytes(disk.totalKb * 1024)}` +
                    (diskSel ? " (dipilih manual — klik untuk ganti)" : " (otomatis, ikuti folder — klik untuk ganti)")
                  }
                  onClick={() => setDiskMenu((v) => !v)}
                />
              )}
              {stats.tempC !== null && (
                <Chip
                  icon={IC_TEMP}
                  text={`${Math.round(stats.tempC)}°C`}
                  pct={stats.tempC}
                  fillCls={stats.tempC >= 85 ? "chip-fill--crit" : stats.tempC >= 70 ? "chip-fill--warn" : ""}
                  title={`Suhu CPU ${stats.tempC.toFixed(1)}°C`}
                />
              )}
              {stats.battery && (
                <Chip
                  icon={IC_BAT}
                  text={`${stats.battery.capacity}%`}
                  pct={stats.battery.capacity}
                  fillCls={
                    stats.battery.capacity <= 15
                      ? "chip-fill--crit"
                      : stats.battery.capacity <= 35
                        ? "chip-fill--warn"
                        : ""
                  }
                  title={`Baterai ${stats.battery.capacity}% · ${
                    BAT_STATUS[stats.battery.status] ?? stats.battery.status
                  }`}
                />
              )}
            </div>

            {diskMenu && (
              <div className="disk-menu">
                <div
                  className={"disk-item" + (diskSel === null ? " disk-item--sel" : "")}
                  onClick={() => {
                    setDiskSel(null);
                    setDiskMenu(false);
                  }}
                >
                  <span className="disk-mount">Otomatis — ikuti folder</span>
                </div>
                {stats.disks.map((d) => (
                  <div
                    key={d.mount}
                    className={"disk-item" + (diskSel === d.mount ? " disk-item--sel" : "")}
                    onClick={() => {
                      setDiskSel(d.mount);
                      setDiskMenu(false);
                    }}
                  >
                    <span className="disk-mount">{d.mount}</span>
                    <span className="disk-usage">
                      {fmtShort(d.usedKb)}/{fmtShort(d.totalKb)} ·{" "}
                      {Math.round((d.usedKb / d.totalKb) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            <PingRow label="1.1.1.1" ms={stats.pingCfMs} />
            <PingRow label="8.8.8.8" ms={stats.pingGoogleMs} />
          </>
        )}
      </div>
    </aside>
  );
}
