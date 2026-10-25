const pad = (n) => String(n).padStart(2, "0");

export function formatReminder(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Local-time pieces for the reminder form: "2026-10-26" and "08:00"
export function toDateInput(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeInput(ts) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "2026-10-26" + "08:00" -> timestamp, or null if it isn't a valid date/time
export function parseDateTime(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const dt = new Date(y, m - 1, d, h, min);
  const valid =
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d && h < 24 && min < 60;
  return valid ? dt.getTime() : null;
}

export function atHour(daysFromNow, hour) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}
