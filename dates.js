const pad = (n) => String(n).padStart(2, '0');

export function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d, n) {
  const r = startOfDay(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function makeDate(year, month, day) {
  const r = new Date(year, month, day);
  return r.getFullYear() === year && r.getMonth() === month && r.getDate() === day ? r : null;
}

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toHHMM(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fromDateAndTime(isoDate, hhmm) {
  const [h, min] = hhmm.split(':').map(Number);
  const d = fromISODate(isoDate);
  d.setHours(h, min, 0, 0);
  return d;
}

export function toLocalDateTime(d) {
  return `${toISODate(d)}T${toHHMM(d)}:00`;
}

export function formatTime(h, m) {
  return `${pad(h)}:${pad(m)}`;
}
