import type { DirEntry } from "../types";

export type AskState =
  | { kind: "rename"; entry: DirEntry; value: string }
  | { kind: "mkdir"; value: string }
  | { kind: "delete"; entry: DirEntry };

interface Props {
  ask: AskState;
  onChange: (ask: AskState) => void;
  onClose: () => void;
  onSubmit: () => void;
}

/** Dialog kecil dipakai menu klik kanan panel file: ganti nama / folder baru / konfirmasi hapus. */
export default function FileAskDialog({ ask, onChange, onClose, onSubmit }: Props) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--narrow">
        {ask.kind === "delete" ? (
          <>
            <h2 className="modal-title">Hapus {ask.entry.isDir ? "folder" : "file"}?</h2>
            <p className="modal-text">
              "{ask.entry.name}" akan dihapus permanen dari server
              {ask.entry.isDir ? " beserta seluruh isinya" : ""}.
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={onClose}>
                Batal
              </button>
              <button className="btn btn--danger" onClick={onSubmit}>
                Hapus
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="modal-title">
              {ask.kind === "rename" ? `Ganti nama "${ask.entry.name}"` : "Folder baru"}
            </h2>
            <label className="field">
              <input
                value={ask.value}
                autoFocus
                spellCheck={false}
                placeholder={ask.kind === "mkdir" ? "nama folder" : "nama baru"}
                onChange={(e) => onChange({ ...ask, value: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && ask.value.trim() && onSubmit()}
              />
            </label>
            <div className="modal-actions">
              <button className="btn" onClick={onClose}>
                Batal
              </button>
              <button className="btn btn--primary" disabled={!ask.value.trim()} onClick={onSubmit}>
                {ask.kind === "rename" ? "Ganti nama" : "Buat"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
