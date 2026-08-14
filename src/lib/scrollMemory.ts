// Simpan posisi scroll terakhir per chapter di localStorage (client-side saja, tanpa DB).
// Supaya user tidak kehilangan jejak baca kalau tab ke-refresh di tengah chapter panjang.

const STORAGE_KEY = 'chapterScrollPositions';
const MAX_ENTRIES = 50;
const MIN_SCROLL_TO_SAVE = 80; // jangan simpan kalau baru geser dikit dari atas

type ScrollEntry = { y: number; updatedAt: number };
type ScrollMap = Record<string, ScrollEntry>;

function getKey(novelId: string | number, chapter: string | number): string {
  return `${novelId}:${chapter}`;
}

function readMap(): ScrollMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScrollMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: ScrollMap): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage penuh/nonaktif (mode privat) - abaikan, bukan fitur kritis
  }
}

export function getSavedScrollPosition(novelId: string | number, chapter: string | number): number | null {
  const entry = readMap()[getKey(novelId, chapter)];
  return entry ? entry.y : null;
}

export function saveScrollPosition(novelId: string | number, chapter: string | number, y: number): void {
  const map = readMap();
  const key = getKey(novelId, chapter);

  if (y < MIN_SCROLL_TO_SAVE) {
    if (key in map) {
      delete map[key];
      writeMap(map);
    }
    return;
  }

  map[key] = { y, updatedAt: Date.now() };

  const keys = Object.keys(map);
  if (keys.length > MAX_ENTRIES) {
    const oldestFirst = keys.sort((a, b) => map[a].updatedAt - map[b].updatedAt);
    for (const staleKey of oldestFirst.slice(0, keys.length - MAX_ENTRIES)) {
      delete map[staleKey];
    }
  }

  writeMap(map);
}

export function clearSavedScrollPosition(novelId: string | number, chapter: string | number): void {
  const map = readMap();
  const key = getKey(novelId, chapter);
  if (key in map) {
    delete map[key];
    writeMap(map);
  }
}
