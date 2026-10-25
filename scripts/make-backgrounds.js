// Generates the note background pictures (assets/backgrounds/*.png) with no dependencies.
// Run: node scripts/make-backgrounds.js
// Each picture is drawn at 2x size and shrunk, which smooths the edges.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const W = 480;
const H = 320;
const S = 2;

// ---------- tiny PNG writer ----------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter type 0 (none) for every row
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- drawing ----------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function canvas(bg) {
  const w = W * S;
  const h = H * S;
  const px = Buffer.alloc(w * h * 4);
  const [r, g, b] = hex(bg);
  for (let i = 0; i < w * h; i++) {
    px[i * 4] = r;
    px[i * 4 + 1] = g;
    px[i * 4 + 2] = b;
    px[i * 4 + 3] = 255;
  }
  // blend one pixel of colour c over what is there, with opacity a
  const put = (x, y, c, a) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    for (let k = 0; k < 3; k++) px[i + k] = Math.round(px[i + k] * (1 - a) + c[k] * a);
  };

  const api = {
    rect(x, y, rw, rh, col, a = 1) {
      const c = hex(col);
      for (let yy = Math.floor(y * S); yy < (y + rh) * S; yy++)
        for (let xx = Math.floor(x * S); xx < (x + rw) * S; xx++) put(xx, yy, c, a);
    },
    circle(cx, cy, rad, col, a = 1) {
      const c = hex(col);
      const R = rad * S;
      for (let yy = Math.floor(cy * S - R); yy <= cy * S + R; yy++)
        for (let xx = Math.floor(cx * S - R); xx <= cx * S + R; xx++)
          if ((xx - cx * S) ** 2 + (yy - cy * S) ** 2 <= R * R) put(xx, yy, c, a);
    },
    ring(cx, cy, rad, thick, col, a = 1) {
      const c = hex(col);
      const R = rad * S;
      const T = thick * S;
      for (let yy = Math.floor(cy * S - R - T); yy <= cy * S + R + T; yy++)
        for (let xx = Math.floor(cx * S - R - T); xx <= cx * S + R + T; xx++) {
          const d = Math.hypot(xx - cx * S, yy - cy * S);
          if (d <= R && d >= R - T) put(xx, yy, c, a);
        }
    },
    // filled polygon (even-odd), points in logical coordinates
    poly(pts, col, a = 1) {
      const c = hex(col);
      const P = pts.map(([x, y]) => [x * S, y * S]);
      const minY = Math.floor(Math.min(...P.map((p) => p[1])));
      const maxY = Math.ceil(Math.max(...P.map((p) => p[1])));
      for (let yy = minY; yy <= maxY; yy++) {
        const xs = [];
        for (let i = 0; i < P.length; i++) {
          const [x1, y1] = P[i];
          const [x2, y2] = P[(i + 1) % P.length];
          if ((y1 <= yy && y2 > yy) || (y2 <= yy && y1 > yy)) xs.push(x1 + ((yy - y1) / (y2 - y1)) * (x2 - x1));
        }
        xs.sort((p, q) => p - q);
        for (let i = 0; i + 1 < xs.length; i += 2)
          for (let xx = Math.ceil(xs[i]); xx <= xs[i + 1]; xx++) put(xx, yy, c, a);
      }
    },
    line(x1, y1, x2, y2, thick, col, a = 1) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = ((-dy / len) * thick) / 2;
      const ny = ((dx / len) * thick) / 2;
      api.poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], col, a);
    },
    // rectangle rw x rh, rotated by ang, centred on (cx, cy)
    rrect(cx, cy, rw, rh, ang, col, a = 1) {
      const cs = Math.cos(ang);
      const sn = Math.sin(ang);
      const pts = [[-rw / 2, -rh / 2], [rw / 2, -rh / 2], [rw / 2, rh / 2], [-rw / 2, rh / 2]].map(([x, y]) => [
        cx + x * cs - y * sn,
        cy + x * sn + y * cs,
      ]);
      api.poly(pts, col, a);
    },
    toPng() {
      // shrink 2x -> 1x by averaging each 2x2 block
      const out = Buffer.alloc(W * H * 4);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
          for (let k = 0; k < 4; k++) {
            let sum = 0;
            for (let dy = 0; dy < S; dy++)
              for (let dx = 0; dx < S; dx++) sum += px[((y * S + dy) * w + (x * S + dx)) * 4 + k];
            out[(y * W + x) * 4 + k] = Math.round(sum / (S * S));
          }
      return encodePng(W, H, out);
    },
  };
  return api;
}

// small seeded random numbers, so every run draws the same pictures
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// a jittered grid of points, so scattered items never pile up
function scatter(rand, cols, rows, margin = 30) {
  const pts = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      pts.push([
        margin + (c + 0.2 + rand() * 0.6) * ((W - 2 * margin) / cols),
        margin + (r + 0.2 + rand() * 0.6) * ((H - 2 * margin) / rows),
      ]);
  return pts;
}

// ---------- the nine pictures ----------
const themes = {
  groceries(c) {
    const rand = rng(1);
    scatter(rand, 6, 4).forEach(([x, y], i) => {
      if (i % 3 === 0) {
        // apple
        c.circle(x, y, 15, "#e57368", 0.9);
        c.circle(x - 5, y - 5, 4, "#ffffff", 0.35);
        c.line(x, y - 14, x + 3, y - 22, 2.5, "#7a5a3a");
        c.poly([[x + 3, y - 20], [x + 14, y - 24], [x + 9, y - 14]], "#6fae5b", 0.95);
      } else if (i % 3 === 1) {
        // carrot
        c.poly([[x - 9, y - 14], [x + 9, y - 14], [x, y + 20]], "#f0a04b", 0.95);
        c.poly([[x - 6, y - 14], [x, y - 26], [x + 6, y - 14]], "#6fae5b", 0.95);
      } else {
        // lemon
        c.circle(x, y, 13, "#f5d44d", 0.95);
        c.circle(x - 4, y - 4, 3, "#ffffff", 0.4);
      }
    });
  },
  food(c) {
    const rand = rng(2);
    scatter(rand, 5, 3, 40).forEach(([x, y], i) => {
      c.circle(x, y, 27, "#ffffff", 0.85);
      c.ring(x, y, 27, 2, "#e8c9a0", 0.9);
      c.circle(x, y, 17, i % 2 ? "#e57368" : "#f0b45b", 0.9);
      for (let k = 0; k < 4; k++) c.circle(x + (rand() - 0.5) * 20, y + (rand() - 0.5) * 20, 3, "#7bb369", 0.95);
    });
  },
  music(c) {
    const rand = rng(3);
    [60, 200].forEach((top) => {
      for (let i = 0; i < 5; i++) c.line(0, top + i * 10, W, top + i * 10, 1.4, "#b9a5e0", 0.9);
    });
    for (let n = 0; n < 11; n++) {
      const x = 30 + n * 40;
      const top = n % 2 ? 200 : 60;
      const y = top + Math.floor(rand() * 5) * 10;
      c.circle(x, y, 7, "#7e5bc2", 0.9);
      c.line(x + 6, y, x + 6, y - 30, 2.2, "#7e5bc2", 0.9);
      if (n % 3 === 0) c.poly([[x + 6, y - 30], [x + 18, y - 22], [x + 6, y - 20]], "#7e5bc2", 0.9);
    }
  },
  recipes(c) {
    // gingham tablecloth
    for (let x = 0; x < W; x += 56) c.rect(x, 0, 28, H, "#ee9b8f", 0.32);
    for (let y = 0; y < H; y += 56) c.rect(0, y, W, 28, "#ee9b8f", 0.32);
    scatter(rng(4), 4, 3, 50).forEach(([x, y]) => {
      c.circle(x, y, 9, "#ffffff", 0.7);
      c.circle(x, y, 5, "#e0825f", 0.85);
    });
  },
  notes(c) {
    // notebook paper
    for (let y = 40; y < H; y += 28) c.line(0, y, W, y, 1.3, "#bcd3ea", 0.95);
    c.line(64, 0, 64, H, 1.8, "#f0a0a0", 0.9);
    [50, 160, 270].forEach((y) => c.circle(26, y, 8, "#ffffff", 0.9));
    c.line(100, 150, 330, 150, 3, "#8ea9c9", 0.35);
    c.line(100, 178, 270, 178, 3, "#8ea9c9", 0.35);
  },
  places(c) {
    // a little map: blocks, roads and pins
    [
      [20, 20, 130, 90, "#e3f1d6"], [190, 30, 110, 70, "#f6f1e2"], [340, 20, 120, 100, "#e3f1d6"],
      [30, 170, 150, 110, "#f6f1e2"], [220, 160, 100, 120, "#e3f1d6"], [350, 170, 110, 110, "#f6f1e2"],
    ].forEach(([x, y, w, h, col]) => c.rect(x, y, w, h, col, 0.95));
    [135, 315].forEach((x) => c.rect(x, 0, 18, H, "#ffffff", 0.95));
    [125, 285].forEach((y) => c.rect(0, y - 8, W, 18, "#ffffff", 0.95));
    c.line(0, 20, 300, H, 14, "#ffffff", 0.9);
    [[110, 90], [300, 235], [415, 85]].forEach(([x, y]) => {
      c.poly([[x - 9, y - 4], [x + 9, y - 4], [x, y + 16]], "#e0594d");
      c.circle(x, y - 10, 12, "#e0594d");
      c.circle(x, y - 10, 4.5, "#ffffff");
    });
  },
  travel(c) {
    const cloud = (x, y, s) => {
      [[0, 0, 16], [18, -6, 20], [38, 0, 15], [20, 6, 18]].forEach(([dx, dy, r]) =>
        c.circle(x + dx * s, y + dy * s, r * s, "#ffffff", 0.95)
      );
    };
    [[40, 50, 1], [250, 30, 1.2], [370, 120, 0.9], [90, 210, 1.1], [300, 250, 1]].forEach(([x, y, s]) => cloud(x, y, s));
    // dotted flight path ending in a paper plane
    for (let t = 0; t <= 1; t += 0.05) c.circle(40 + t * 400, 280 - Math.sin(t * Math.PI) * 170, 3, "#ffffff", 0.9);
    c.poly([[430, 108], [455, 118], [430, 128], [436, 118]], "#5b8fd1");
  },
  video(c) {
    // film strips top and bottom, play buttons in the middle
    c.rect(0, 0, W, 38, "#6a5fa0", 0.45);
    c.rect(0, H - 38, W, 38, "#6a5fa0", 0.45);
    for (let x = 8; x < W; x += 28) {
      c.rect(x, 10, 14, 18, "#ffffff", 0.85);
      c.rect(x, H - 28, 14, 18, "#ffffff", 0.85);
    }
    scatter(rng(5), 4, 2, 60).forEach(([x, y]) => {
      c.circle(x, y + 10, 24, "#ffffff", 0.7);
      c.poly([[x - 8, y - 4], [x - 8, y + 24], [x + 14, y + 10]], "#8a7cc4", 0.95);
    });
  },
  celebration(c) {
    const rand = rng(6);
    const colors = ["#f9c74f", "#90be6d", "#4d96ff", "#f94144", "#b565d8", "#ffffff"];
    for (let i = 0; i < 70; i++) {
      const x = rand() * W;
      const y = rand() * H;
      const col = colors[Math.floor(rand() * colors.length)];
      if (i % 3 === 0) c.circle(x, y, 3 + rand() * 3, col, 0.95);
      else c.rrect(x, y, 10 + rand() * 6, 5, rand() * Math.PI, col, 0.95);
    }
    // two streamers
    for (let k = 0; k < 2; k++)
      for (let t = 0; t <= 1; t += 0.012)
        c.circle(t * W, 70 + k * 150 + Math.sin(t * 14 + k) * 14, 2.4, k ? "#f94144" : "#4d96ff", 0.85);
  },
};

const base = {
  groceries: "#dcefd2",
  food: "#fdebd0",
  music: "#e6dcf7",
  recipes: "#fff3d6",
  notes: "#fff7c2",
  places: "#d6e9ef",
  travel: "#cfe6fa",
  video: "#dcd6ee",
  celebration: "#fbd7e6",
};

const dir = path.join(__dirname, "..", "assets", "backgrounds");
fs.mkdirSync(dir, { recursive: true });
for (const [name, draw] of Object.entries(themes)) {
  const c = canvas(base[name]);
  draw(c);
  fs.writeFileSync(path.join(dir, `${name}.png`), c.toPng());
  console.log("wrote", `${name}.png`);
}
