import { invoke } from "@tauri-apps/api/core";
import type { ConnectParams, DirListing, Host, ServerStats, Tab } from "./types";

/** Parameter koneksi dari sebuah tab: kredensial yang dikirim tergantung authType-nya. */
export function connectParamsFor(tab: Tab, cols: number, rows: number): ConnectParams {
  return {
    host: tab.host.host,
    port: tab.host.port,
    username: tab.host.username,
    authType: tab.host.authType,
    password: tab.host.authType === "password" ? tab.secret : undefined,
    keyPath: tab.host.keyPath ?? undefined,
    keyPassphrase: tab.host.authType === "key" ? tab.secret : undefined,
    cols,
    rows,
  };
}

// ---- SSH ----
export const sshConnect = (id: string, params: ConnectParams) =>
  invoke<void>("ssh_connect", { id, params });

export const sshSend = (id: string, dataB64: string) =>
  invoke<void>("ssh_send", { id, dataB64 });

export const sshResize = (id: string, cols: number, rows: number) =>
  invoke<void>("ssh_resize", { id, cols, rows });

export const sshDisconnect = (id: string) =>
  invoke<void>("ssh_disconnect", { id });

// ---- Panel (SFTP + statistik) ----
export const panelOpen = (id: string, params: ConnectParams) =>
  invoke<void>("panel_open", { id, params });

export const panelList = (id: string, path: string) =>
  invoke<DirListing>("panel_list", { id, path });

export const panelStats = (id: string) =>
  invoke<ServerStats>("panel_stats", { id });

export const panelOpenFile = (id: string, path: string, textEditor = false) =>
  invoke<void>("panel_open_file", { id, path, textEditor });

export const panelTransfer = (id: string, src: string, destDir: string, mv: boolean) =>
  invoke<void>("panel_transfer", { id, src, destDir, mv });

export const panelMkdir = (id: string, dir: string, name: string) =>
  invoke<void>("panel_mkdir", { id, dir, name });

export const panelRename = (id: string, src: string, newName: string) =>
  invoke<void>("panel_rename", { id, src, newName });

export const panelDelete = (id: string, path: string) =>
  invoke<void>("panel_delete", { id, path });

/** Unduh ke folder Unduhan; mengembalikan path lokal hasil unduhan. */
export const panelDownload = (id: string, path: string) =>
  invoke<string>("panel_download", { id, path });

export const panelClose = (id: string) => invoke<void>("panel_close", { id });

// ---- Rahasia tersimpan (keyring sistem) ----
export const secretSet = (id: string, secret: string) =>
  invoke<void>("secret_set", { id, secret });

export const secretGet = (id: string) =>
  invoke<string | null>("secret_get", { id });

export const secretDelete = (id: string) =>
  invoke<void>("secret_delete", { id });

// ---- Hosts ----
export const hostsList = () => invoke<Host[]>("hosts_list");
export const hostsSave = (host: Host) => invoke<Host[]>("hosts_save", { host });
export const hostsDelete = (id: string) =>
  invoke<Host[]>("hosts_delete", { id });

// ---- Base64 <-> bytes ----
export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function strToB64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/** Cache rahasia per host, hanya di memori selama aplikasi berjalan. */
export const secretCache = new Map<string, string>();
