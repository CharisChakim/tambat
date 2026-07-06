import { useState } from "react";
import type { AuthType, Host } from "../types";

interface Props {
  initial: Host | null;
  onSave: (host: Host) => void;
  onClose: () => void;
}

const EMPTY: Host = {
  id: "",
  label: "",
  host: "",
  port: 22,
  username: "",
  authType: "password",
  keyPath: "",
};

export default function HostForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<Host>(initial ?? EMPTY);
  const [err, setErr] = useState("");

  const set = <K extends keyof Host>(k: K, v: Host[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    // Buang skema URL (http://, ssh://) dan path agar tersimpan hostname/IP murni
    const host = form.host.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/[/?#].*$/, "");
    if (!host) return setErr("Alamat host wajib diisi.");
    if (!form.username.trim()) return setErr("Username wajib diisi.");
    if (form.authType === "key" && !(form.keyPath ?? "").trim())
      return setErr("Path private key wajib diisi untuk auth key.");
    onSave({
      ...form,
      label: form.label.trim() || host,
      host,
      username: form.username.trim(),
      keyPath: form.authType === "key" ? (form.keyPath ?? "").trim() : null,
    });
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{initial ? "Ubah host" : "Host baru"}</h2>

        <label className="field">
          <span>Label</span>
          <input
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="mis. web-prod"
            autoFocus
          />
        </label>

        <div className="field-row">
          <label className="field" style={{ flex: 3 }}>
            <span>Host / IP</span>
            <input
              value={form.host}
              onChange={(e) => set("host", e.target.value)}
              placeholder="192.168.1.10 atau example.com"
            />
          </label>
          <label className="field" style={{ flex: 1 }}>
            <span>Port</span>
            <input
              type="number"
              value={form.port}
              min={1}
              max={65535}
              onChange={(e) => set("port", Number(e.target.value) || 22)}
            />
          </label>
        </div>

        <label className="field">
          <span>Username</span>
          <input
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            placeholder="root"
          />
        </label>

        <label className="field">
          <span>Autentikasi</span>
          <select
            value={form.authType}
            onChange={(e) => set("authType", e.target.value as AuthType)}
          >
            <option value="password">Password (diminta saat konek)</option>
            <option value="key">Private key</option>
            <option value="agent">SSH agent</option>
          </select>
        </label>

        {form.authType === "key" && (
          <label className="field">
            <span>Path private key</span>
            <input
              value={form.keyPath ?? ""}
              onChange={(e) => set("keyPath", e.target.value)}
              placeholder="~/.ssh/id_ed25519"
            />
          </label>
        )}

        {err && <div className="form-err">{err}</div>}

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn--primary" onClick={submit}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
