// The numbers behind the slides: counted from the full record of the working
// sessions (every message, including those sent while Claude was working,
// not the summaries) and from the trip's own data. Days only, local time.

// Per day: Pablo's messages and words; Claude's words of reply and actions
// (reading files, editing them, running commands, looking at screenshots).
export const DAYS = [
  { d: "2026-09-23", m: 5, w: 400, cw: 2498, a: 124 },
  { d: "2026-09-25", m: 2, w: 782, cw: 2547, a: 139 },
  { d: "2026-09-26", m: 1, w: 64, cw: 1894, a: 170 },
  { d: "2026-09-28", m: 3, w: 506, cw: 2621, a: 159 },
  { d: "2026-09-29", m: 6, w: 3200, cw: 4086, a: 219 },
  { d: "2026-09-30", m: 3, w: 165, cw: 2984, a: 113 },
  { d: "2026-10-02", m: 1, w: 23, cw: 1252, a: 125 },
  { d: "2026-10-03", m: 2, w: 168, cw: 818, a: 59 },
  { d: "2026-10-04", m: 1, w: 208, cw: 1442, a: 150 },
  { d: "2026-10-15", m: 7, w: 323, cw: 3806, a: 375 },
  { d: "2026-10-19", m: 6, w: 1272, cw: 2968, a: 178 },
];
export const FIRST = "2026-09-23", LAST = "2026-10-19";
export const TOTAL = {
  messages: DAYS.reduce((s, x) => s + x.m, 0), words: DAYS.reduce((s, x) => s + x.w, 0),
  claudeWords: DAYS.reduce((s, x) => s + x.cw, 0), actions: DAYS.reduce((s, x) => s + x.a, 0),
  answers: 3, approvals: 2, // (answers to Claude's own questions; plans approved)
  perPage: 500, // words on an A4 page, typed
  reads: 319, edits: 411, commands: 875, looked: 172, code: 11000, days: DAYS.length,
};
// Lengths of prose, in words (the usual bounds).
export const FORMS = [
  { name: "microrrelato", from: 100, to: 1000 },
  { name: "cuento", from: 1000, to: 7500 },
  { name: "relato largo", from: 7500, to: 17500 },
  { name: "novela corta", from: 17500, to: 40000 },
  { name: "novela", from: 40000, to: 150000 },
];
// The sources, as they were.
export const SOURCES = {
  videos: 1094, photos: 778, diaryDays: 21, rides: 24, stays: 12,
  tracks: [5, 4.4, 20.3, 19.3, 4.1, 23, 19.7, 10.3, 6.1, 6.9, 3.6, 16.6, 14.5, 4.5], // km each
  kept: 803,
};
