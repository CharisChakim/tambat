import { useState } from "react";
import type { Host, SaveMode } from "../types";

interface Props {
  host: Host;
  kind: "password" | "passphrase";
  onSubmit: (secret: string, mode: SaveMode) => void;
  onClose: () => void;
}

const MODES: Array<{ value: SaveMode; label: string }> = [
  { value: "session", label: "Ingat selama aplikasi berjalan (tidak disimpan ke disk)" },
  { value: "disk", label: "Simpan di keyring sistem — konek berikutnya langsung tersambung" },
  { value: "once", label: "Jangan ingat, tanya setiap kali" },
];

export default function SecretPrompt({ host, kind, onSubmit, onClose }: Props) {
  const [secret, setSecret] = useState("");
  const [mode, setMode] = useState<SaveMode>("session");

  const label =
    kind === "password"
      ? `Password untuk ${host.username}@${host.host}`
      : `Passphrase key untuk ${host.label || host.host}`;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--narrow">
        <h2 className="modal-title">{label}</h2>
        <label className="field">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit(secret, mode)}
            autoFocus
            placeholder={kind === "password" ? "Masukkan password" : "Kosongkan jika key tanpa passphrase"}
          />
        </label>
        <div className="mode-group">
          {MODES.map((m) => (
            <label key={m.value} className="check">
              <input
                type="radio"
                name="save-mode"
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
              />
              <span>{m.label}</span>
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn--primary" onClick={() => onSubmit(secret, mode)}>
            Sambungkan
          </button>
        </div>
      </div>
    </div>
  );
}
