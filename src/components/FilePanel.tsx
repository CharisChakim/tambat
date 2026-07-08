import { useEffect, useRef, useState } from "react";
import {
  connectParamsFor,
  panelClose,
  panelDelete,
  panelDownload,
  panelList,
  panelMkdir,
  panelOpen,
  panelOpenFile,
  panelRename,
  panelStats,
  panelTransfer,
} from "../api";
import { BAT_STATUS, diskOfPath, fmtBytes, fmtShort, fmtUptime, joinPath } from "../format";
import type { DirEntry, DirListing, ServerStats, Tab } from "../types";
import FileAskDialog, { type AskState } from "./FileAskDialog";
import FileContextMenu from "./FileContextMenu";
import FileIcon from "./FileIcon";
import { Chip, IC_BAT, IC_DISK, IC_RAM, IC_TEMP, IC_UPTIME, PingChip } from "./StatChips";

const POLL_MS = 5000;

interface Props {
  tab: Tab;
  active: boolean;
  /** direktori kerja shell saat ini (dari OSC 7 terminal); panel mengikutinya */
  cwd?: string;
}

/** Panel ala MobaXterm: file browser SFTP + statistik server (RAM, disk,
 *  suhu, baterai, ping). Memakai sesi SSH kedua, terpisah dari terminal. */
export default function FilePanel({ tab, active, cwd }: Props) {
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
  /** dialog kecil: ganti nama / folder baru / konfirmasi hapus */
  const [ask, setAsk] = useState<AskState | null>(null);
  /** pesan sukses sementara (mis. lokasi hasil unduhan) */
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);
  const showNotice = (s: string) => {
    setNotice(s);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 6000);
  };
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);
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
        await panelOpen(panelId, connectParamsFor(tab, 80, 24));
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

  // Ikuti pwd terminal: setiap `cwd` berubah (atau begitu listing awal siap),
  // pindah ke sana kalau belum di situ.
  useEffect(() => {
    if (!cwd || !listing || cwd === listing.path) return;
    navigate(cwd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cwd, listing]);

  const openFile = async (en: DirEntry, textEditor = false) => {
    if (!listing) return;
    setBusyMsg(`membuka ${en.name}…`);
    try {
      await panelOpenFile(panelId, joinPath(listing.path, en.name), textEditor);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyMsg(null);
    }
  };

  const download = async (en: DirEntry) => {
    if (!listing) return;
    setBusyMsg(`mengunduh ${en.name}…`);
    try {
      const local = await panelDownload(panelId, joinPath(listing.path, en.name));
      setError(null);
      showNotice(`Tersimpan di ${local}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyMsg(null);
    }
  };

  /** Eksekusi dialog `ask` (ganti nama / folder baru / hapus). */
  const submitAsk = async () => {
    if (!ask || !listing) return;
    const a = ask;
    setAsk(null);
    setBusyMsg(
      a.kind === "rename"
        ? "mengganti nama…"
        : a.kind === "mkdir"
          ? "membuat folder…"
          : `menghapus ${a.entry.name}…`,
    );
    try {
      if (a.kind === "rename") {
        await panelRename(panelId, joinPath(listing.path, a.entry.name), a.value.trim());
      } else if (a.kind === "mkdir") {
        await panelMkdir(panelId, listing.path, a.value.trim());
      } else {
        await panelDelete(panelId, joinPath(listing.path, a.entry.name));
      }
      setError(null);
      await navigate(listing.path);
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
      {notice && <div className="fpanel-note">{notice}</div>}

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
        <FileContextMenu
          menu={menu}
          listing={listing}
          clip={clip}
          onClose={() => setMenu(null)}
          navigate={navigate}
          openFile={openFile}
          download={download}
          copyText={copyText}
          setClip={setClip}
          setAsk={setAsk}
          paste={paste}
        />
      )}

      {ask && (
        <FileAskDialog ask={ask} onChange={setAsk} onClose={() => setAsk(null)} onSubmit={submitAsk} />
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
              {!stats.battery && stats.uptimeS > 0 && (
                <Chip
                  icon={IC_UPTIME}
                  text={fmtUptime(stats.uptimeS)}
                  title={
                    `Server menyala ${fmtUptime(stats.uptimeS)}` +
                    (stats.load1 !== null ? ` · load 1 menit ${stats.load1}` : "")
                  }
                />
              )}
              <PingChip ms={stats.pingCfMs} />
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

          </>
        )}
      </div>
    </aside>
  );
}
