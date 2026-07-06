# Tambat

SSH client desktop yang ringan dan sederhana — alternatif Termius/MobaXterm.
Dibangun dengan **Tauri 2** (backend Rust + `ssh2`) dan **React + xterm.js**.

*Tambat* (bahasa Indonesia): menambatkan — seperti kapal yang ditambatkan ke dermaga.

## Fitur (v0.1)

- Session manager: simpan daftar host (label, alamat, port, user), cari cepat dengan `/`
- Autentikasi: password (diminta saat konek), private key (+passphrase), dan SSH agent
- Terminal penuh via xterm.js (xterm-256color, scrollback 8000 baris, klik URL)
- Multi-tab dengan indikator status koneksi, tutup tab dengan `Ctrl+Shift+W`
- File panel (SFTP) per tab: jelajah folder, buka file dengan aplikasi default,
  salin/pindah file antar folder di server
- Statistik server di panel: RAM, disk, baterai, suhu CPU, ping ke 1.1.1.1/8.8.8.8
- Password/passphrase: pilih per host — tanya setiap kali, ingat di memori selama
  aplikasi berjalan, atau simpan permanen di **keyring sistem** (Secret Service /
  Credential Manager / Keychain). Tidak pernah ditulis ke file biasa.
- Daftar host disimpan sebagai JSON di direktori data aplikasi
  (Linux: `~/.local/share/app.tambat.desktop/hosts.json`)

## Prasyarat build

**Linux (Debian/Ubuntu):**

```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev pkg-config
```

**Rust** (butuh 1.77.2+ untuk Tauri 2):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Node.js** 18+ (untuk frontend).

Untuk target Windows/macOS, lihat prasyarat resmi Tauri:
https://tauri.app/start/prerequisites/

## Menjalankan

```bash
npm install
npm run tauri dev      # mode pengembangan (hot reload)
npm run tauri build    # build rilis: .deb, .rpm, dan AppImage di src-tauri/target/release/bundle/
```

Build pertama mengompilasi banyak crate Rust — bisa beberapa menit. Build
berikutnya jauh lebih cepat.

## Arsitektur singkat

```
Frontend (React + TS)                Backend (Rust)
┌─────────────────────┐   invoke    ┌──────────────────────────┐
│ App / Sidebar / Tab │ ──────────► │ ssh_connect / send /     │
│ TermView (xterm.js) │             │ resize / disconnect      │
│                     │ ◄────────── │ hosts_list / save / del  │
└─────────────────────┘   event     └──────────────────────────┘
                       ssh-data-{id}      │ satu thread IO per koneksi
                       ssh-exit-{id}      ▼
                                    ssh2 (libssh2) → server
```

- Setiap koneksi berjalan di thread sendiri dengan session non-blocking:
  membaca output server → dikirim ke frontend sebagai event base64;
  input keyboard / resize / disconnect masuk lewat kanal `mpsc`.
- `src-tauri/src/ssh.rs` — seluruh logika SSH terminal.
- `src-tauri/src/panel.rs` — sesi SSH kedua per tab untuk file browser (SFTP)
  dan statistik server, agar tidak mengganggu aliran data terminal.
- `src-tauri/src/secrets.rs` — simpan/baca password di keyring sistem.
- `src-tauri/src/hosts.rs` — CRUD daftar host (JSON).
- `src/components/TermView.tsx` — siklus hidup terminal per tab.
- `src/components/FilePanel.tsx` — file browser + statistik server.

## Test

```bash
cd src-tauri
cargo test                    # test unit (parsing statistik, dll.)

# Test E2E butuh mock sshd (paramiko) di 127.0.0.1:2222 + Secret Service aktif:
python3 tests/mock_sshd.py &
cargo test -- --ignored
```

## Roadmap yang disarankan

1. **Verifikasi host key** — saat ini host key server belum diverifikasi
   (known_hosts). Tambahkan `sess.known_hosts()` + dialog konfirmasi
   fingerprint sebelum dipakai di jaringan yang tidak dipercaya.
2. **Upload/download** antara mesin lokal dan server di file panel
   (saat ini baru jelajah, buka, dan salin/pindah antar folder remote).
3. Split pane, snippet/command palette, port forwarding UI, jump host,
   grup/folder host, tema terang.

## Lisensi

[MIT](LICENSE)
