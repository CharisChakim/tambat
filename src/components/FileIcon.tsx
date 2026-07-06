import type { JSX } from "react";

type Cat = "folder" | "code" | "img" | "arc" | "doc" | "cfg" | "med" | "db" | "def";

const BY_EXT: Record<string, Cat> = {};
const daftar: Array<[Cat, string]> = [
  ["code", "js jsx ts tsx py rs go c h cpp hpp cc java kt rb php sh bash zsh fish pl lua swift cs vue svelte"],
  ["cfg", "json yaml yml toml ini conf cfg env lock xml service"],
  ["img", "png jpg jpeg gif svg webp ico bmp avif tiff"],
  ["arc", "zip tar gz tgz bz2 xz zst 7z rar deb rpm appimage iso img"],
  ["med", "mp3 wav flac ogg opus m4a mp4 mkv avi mov webm"],
  ["doc", "md txt pdf doc docx odt rtf log csv xls xlsx ppt pptx html htm"],
  ["db", "db sqlite sqlite3 sql"],
];
for (const [cat, exts] of daftar) for (const e of exts.split(" ")) BY_EXT[e] = cat;

function categoryOf(name: string, isDir: boolean): Cat {
  if (isDir) return "folder";
  const dot = name.lastIndexOf(".");
  // Dotfile tanpa extension lain (.bashrc, .gitignore) hampir selalu berkas konfigurasi
  if (dot === 0) return "cfg";
  if (dot < 0) return "def";
  return BY_EXT[name.slice(dot + 1).toLowerCase()] ?? "def";
}

/** Kerangka berkas dengan lipatan sudut; `inner` = simbol kategori di dalamnya. */
const berkas = (inner?: JSX.Element) => (
  <>
    <path
      d="M4 1.5h5.2L13 5.3V13.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path d="M9.2 1.5v3.8H13" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {inner}
  </>
);

const ICONS: Record<Cat, JSX.Element> = {
  folder: (
    <path
      d="M1.5 3.6a1 1 0 0 1 1-1h3.4l1.5 1.7h6.1a1 1 0 0 1 1 1v7.1a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V3.6z"
      fill="currentColor"
    />
  ),
  code: berkas(
    <path
      d="M6.4 8l-1.6 1.6 1.6 1.6M9.6 8l1.6 1.6-1.6 1.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  ),
  img: berkas(
    <>
      <circle cx="6.2" cy="8.2" r="1" fill="currentColor" />
      <path d="M4.5 12.5l2.3-2.3 1.4 1.2 2-2.4 1.3 1.8v1.7z" fill="currentColor" />
    </>
  ),
  arc: berkas(
    <path
      d="M7.9 6.5h1.4M7.9 8.2h1.4M7.9 9.9h1.4M7.9 11.6h1.4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  ),
  doc: berkas(
    <path
      d="M5 8h6M5 10h6M5 12h4"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  ),
  cfg: berkas(
    <>
      <circle cx="8" cy="10" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M8 7.2v1.1M8 11.7v1.1M5.6 10h1.1M9.3 10h1.1"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </>
  ),
  med: berkas(<path d="M6.6 7.6l4 2.4-4 2.4z" fill="currentColor" />),
  db: (
    <>
      <ellipse cx="8" cy="3.8" rx="5" ry="2.1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3 3.8v8.4c0 1.2 2.2 2.1 5 2.1s5-.9 5-2.1V3.8M3 8c0 1.2 2.2 2.1 5 2.1s5-.9 5-2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </>
  ),
  def: berkas(),
};

interface Props {
  name: string;
  isDir: boolean;
}

export default function FileIcon({ name, isDir }: Props) {
  const cat = categoryOf(name, isDir);
  const hidden = name.startsWith(".");
  return (
    <svg
      className={`fi fi--${cat}` + (hidden ? " fi--hidden" : "")}
      viewBox="0 0 16 16"
      width="15"
      height="15"
      aria-hidden="true"
    >
      {ICONS[cat]}
    </svg>
  );
}
