import { joinPath } from "../format";
import type { DirEntry, DirListing } from "../types";
import type { AskState } from "./FileAskDialog";

interface Props {
  menu: { x: number; y: number; entry: DirEntry | null };
  listing: DirListing;
  clip: { path: string; mv: boolean } | null;
  onClose: () => void;
  navigate: (path: string) => void;
  openFile: (entry: DirEntry, textEditor?: boolean) => void;
  download: (entry: DirEntry) => void;
  copyText: (s: string) => void;
  setClip: (clip: { path: string; mv: boolean }) => void;
  setAsk: (ask: AskState) => void;
  paste: () => void;
}

/** Menu klik kanan panel file: buka/salin/potong/ganti nama/hapus entri, atau aksi folder kosong. */
export default function FileContextMenu({
  menu,
  listing,
  clip,
  onClose,
  navigate,
  openFile,
  download,
  copyText,
  setClip,
  setAsk,
  paste,
}: Props) {
  return (
    <div
      className="ctx-overlay"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className="ctx-menu"
        style={{
          left: Math.min(menu.x, window.innerWidth - 210),
          top: Math.min(menu.y, window.innerHeight - 380),
        }}
      >
        {menu.entry && (
          <>
            <div
              className="ctx-item"
              onClick={() => {
                const en = menu.entry!;
                onClose();
                if (en.isDir) navigate(joinPath(listing.path, en.name));
                else openFile(en);
              }}
            >
              Buka
            </div>
            {!menu.entry.isDir && (
              <>
                <div
                  className="ctx-item"
                  onClick={() => {
                    const en = menu.entry!;
                    onClose();
                    openFile(en, true);
                  }}
                >
                  Buka dengan editor teks
                </div>
                <div
                  className="ctx-item"
                  onClick={() => {
                    const en = menu.entry!;
                    onClose();
                    download(en);
                  }}
                >
                  Unduh ke folder Unduhan
                </div>
              </>
            )}
            <div className="ctx-sep" />
            <div
              className="ctx-item"
              onClick={() => {
                setClip({ path: joinPath(listing.path, menu.entry!.name), mv: false });
                onClose();
              }}
            >
              Salin
            </div>
            <div
              className="ctx-item"
              onClick={() => {
                setClip({ path: joinPath(listing.path, menu.entry!.name), mv: true });
                onClose();
              }}
            >
              Potong
            </div>
            <div
              className="ctx-item"
              onClick={() => {
                copyText(joinPath(listing.path, menu.entry!.name));
                onClose();
              }}
            >
              Salin path
            </div>
            <div
              className="ctx-item"
              onClick={() => {
                copyText(menu.entry!.name);
                onClose();
              }}
            >
              Salin nama
            </div>
            <div className="ctx-sep" />
            <div
              className="ctx-item"
              onClick={() => {
                const en = menu.entry!;
                onClose();
                setAsk({ kind: "rename", entry: en, value: en.name });
              }}
            >
              Ganti nama…
            </div>
            <div
              className="ctx-item ctx-item--danger"
              onClick={() => {
                const en = menu.entry!;
                onClose();
                setAsk({ kind: "delete", entry: en });
              }}
            >
              Hapus…
            </div>
            <div className="ctx-sep" />
          </>
        )}
        {!menu.entry && (
          <>
            <div
              className="ctx-item"
              onClick={() => {
                onClose();
                setAsk({ kind: "mkdir", value: "" });
              }}
            >
              Folder baru…
            </div>
            <div
              className="ctx-item"
              onClick={() => {
                copyText(listing.path);
                onClose();
              }}
            >
              Salin path folder
            </div>
          </>
        )}
        <div
          className={"ctx-item" + (clip ? "" : " ctx-item--dis")}
          onClick={() => {
            if (!clip) return;
            onClose();
            paste();
          }}
        >
          Tempel
          {clip ? ` — ${clip.path.split("/").pop()}${clip.mv ? " (pindah)" : ""}` : ""}
        </div>
        <div
          className="ctx-item"
          onClick={() => {
            onClose();
            navigate(listing.path);
          }}
        >
          Muat ulang
        </div>
      </div>
    </div>
  );
}
