// H!TisOP Online-Server: liefert das Spiel (dist/index.html) aus UND vermittelt Online-Kämpfe per WebSocket.
// Der Server kennt keine Spielregeln: er koppelt zwei Spieler (Raum-Code oder Schnellsuche) und reicht deren Nachrichten 1:1 weiter.
// Gerechnet wird auf beiden Geräten gleichzeitig (Lockstep, siehe src/core/netplay.js) – der Server hat dadurch kaum Last.
// Start: `npm start` (oder `node server/server.js`); Port aus der Umgebungsvariable PORT (Render setzt sie selbst), sonst 3000.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // ohne I und O (Verwechslung mit 1 / 0)
export const LIMITS = { maxPayload: 4096, ratePerSec: 400, burst: 600, maxSockets: 600, maxRooms: 300, idleUnpairedMs: 15 * 60 * 1000, heartbeatMs: 20000 };

export function startServer({ port = 3000, host = '0.0.0.0', distDir = path.join(ROOT, 'dist'), quiet = false, limits = {} } = {}) {
  const LIM = { ...LIMITS, ...limits };   // Tests dürfen die Grenzen anheben (sie rechnen schneller als in Echtzeit)
  const log = quiet ? () => {} : (...a) => console.log('[H!TisOP]', ...a);
  const rooms = new Map();      // code -> { host, guest, born }
  let queue = [];               // wartende Schnellsuche-Spieler
  const socks = new Set();
  const stats = { pairs: 0, started: Date.now() };

  // ---------- HTTP: Spiel ausliefern ----------
  const cache = { tag: '', raw: null, br: null, gz: null, building: null };
  async function loadGame() {
    const file = path.join(distDir, 'index.html');
    if (!fs.existsSync(file)) return null;
    const st = fs.statSync(file), tag = `"${st.size.toString(16)}-${Math.round(st.mtimeMs).toString(16)}"`;
    if (cache.tag === tag && cache.raw) return cache;
    if (cache.building) return cache.building;
    cache.building = (async () => {
      const raw = fs.readFileSync(file);
      const [br, gz] = await Promise.all([
        new Promise((res, rej) => zlib.brotliCompress(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } }, (e, b) => e ? rej(e) : res(b))),
        new Promise((res, rej) => zlib.gzip(raw, { level: 6 }, (e, b) => e ? rej(e) : res(b)))]);
      Object.assign(cache, { tag, raw, br, gz, building: null });
      return cache;
    })();
    return cache.building;
  }
  const http_ = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x'), p = url.pathname;
      if (p === '/healthz') { res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); return res.end(JSON.stringify({ ok: true, rooms: rooms.size, queue: queue.length, sockets: socks.size, pairs: stats.pairs, uptimeS: Math.round((Date.now() - stats.started) / 1000) })); }
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
      if (p === '/' || p === '/index.html' || p === '/hitisop.html') {
        const g = await loadGame();
        if (!g) { res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('dist/index.html fehlt – bitte zuerst bauen: npm run build'); }
        if (req.headers['if-none-match'] === g.tag) { res.writeHead(304, { etag: g.tag }); return res.end(); }
        const ae = String(req.headers['accept-encoding'] || ''), enc = /\bbr\b/.test(ae) ? 'br' : /\bgzip\b/.test(ae) ? 'gzip' : '';
        const body = enc === 'br' ? g.br : enc === 'gzip' ? g.gz : g.raw;
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': body.length, etag: g.tag, 'cache-control': 'no-cache', vary: 'accept-encoding', ...(enc ? { 'content-encoding': enc } : {}) });
        return res.end(req.method === 'HEAD' ? undefined : body);
      }
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('Nicht gefunden');
    } catch (e) { try { res.writeHead(500); res.end('Fehler'); } catch (_) {} }
  });

  // ---------- WebSocket: Raum / Schnellsuche / Relay ----------
  const wss = new WebSocketServer({ server: http_, path: '/ws', maxPayload: LIM.maxPayload });
  const send = (s, o) => { if (s.readyState === 1) s.send(typeof o === 'string' ? o : JSON.stringify(o)); };
  const newCode = () => { for (let k = 0; k < 200; k++) { let c = ''; for (let i = 0; i < 4; i++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]; if (!rooms.has(c)) return c; } return null; };

  function unqueue(s) { queue = queue.filter(q => q !== s); }
  function closeRoom(s) {   // s war Gastgeber eines noch offenen Raums
    if (s.room && rooms.get(s.room) && rooms.get(s.room).host === s && !rooms.get(s.room).guest) rooms.delete(s.room);
    if (!s.peer) s.room = null;
  }
  function pair(host, guest, code) {
    host.peer = guest; guest.peer = host; host.role = 'host'; guest.role = 'guest'; host.room = guest.room = code || null; host.since = guest.since = Date.now(); stats.pairs++;
    send(host, { t: 'paired', role: 'host', code: code || null }); send(guest, { t: 'paired', role: 'guest', code: code || null });
    log('Paar gebildet', code || '(Schnellsuche)');
  }
  function unpair(s, notify = true) {   // beendet die Verbindung zum Gegner; beide Sockets bleiben offen und dürfen neu suchen
    const o = s.peer; if (!o) return;
    s.peer = null; o.peer = null; s.role = o.role = null;
    if (s.room) { rooms.delete(s.room); s.room = null; } if (o.room) { rooms.delete(o.room); o.room = null; }
    if (notify) send(o, { t: 'left' });
  }

  wss.on('connection', (ws, req) => {
    if (socks.size >= LIM.maxSockets) { ws.close(1013, 'voll'); return; }
    ws.alive = true; ws.peer = null; ws.room = null; ws.role = null; ws.tokens = LIM.burst; ws.tAt = Date.now(); ws.since = Date.now();
    socks.add(ws);
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', (data, isBinary) => {
      if (isBinary) return;
      const now = Date.now(); ws.tokens = Math.min(LIM.burst, ws.tokens + (now - ws.tAt) * LIM.ratePerSec / 1000); ws.tAt = now;
      if (--ws.tokens < 0) { ws.close(1008, 'zu schnell'); return; }
      const raw = data.toString();
      let m; try { m = JSON.parse(raw); } catch (e) { return; }
      if (!m || typeof m.t !== 'string') return;
      switch (m.t) {
        case 'x': if (ws.peer) send(ws.peer, raw); return;   // Spiel-Nachricht 1:1 an den Gegner (Server wertet nichts aus)
        case 'ping': send(ws, { t: 'pong', ts: m.ts }); return;
        case 'host': {
          if (ws.peer || ws.room || queue.includes(ws)) return send(ws, { t: 'err', code: 'busy', msg: 'Du bist schon in einem Raum oder in der Suche.' });
          if (rooms.size >= LIM.maxRooms) return send(ws, { t: 'err', code: 'full', msg: 'Der Server ist gerade voll.' });
          const code = newCode(); if (!code) return send(ws, { t: 'err', code: 'full', msg: 'Kein Raum-Code frei.' });
          rooms.set(code, { host: ws, guest: null, born: Date.now() }); ws.room = code; ws.role = 'host';
          return send(ws, { t: 'hosted', code });
        }
        case 'join': {
          if (ws.peer || ws.room || queue.includes(ws)) return send(ws, { t: 'err', code: 'busy', msg: 'Du bist schon in einem Raum oder in der Suche.' });
          const code = String(m.code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4), r = rooms.get(code);
          if (!r || r.host.readyState !== 1) return send(ws, { t: 'err', code: 'noroom', msg: 'Diesen Raum gibt es nicht (mehr).' });
          if (r.guest) return send(ws, { t: 'err', code: 'taken', msg: 'In diesem Raum ist schon jemand.' });
          if (r.host === ws) return;
          r.guest = ws; pair(r.host, ws, code); return;
        }
        case 'quick': {
          if (ws.peer || ws.room || queue.includes(ws)) return send(ws, { t: 'err', code: 'busy', msg: 'Du bist schon in einem Raum oder in der Suche.' });
          queue = queue.filter(q => q.readyState === 1);
          const o = queue.shift();
          if (o) pair(o, ws, null); else { queue.push(ws); send(ws, { t: 'queued' }); }
          return;
        }
        case 'cancel': unqueue(ws); closeRoom(ws); if (ws.room && !ws.peer) ws.room = null; send(ws, { t: 'idle' }); return;
        case 'bye': unpair(ws); send(ws, { t: 'idle' }); return;
      }
    });
    ws.on('close', () => { socks.delete(ws); unqueue(ws); closeRoom(ws); unpair(ws); });
    ws.on('error', () => {});
    send(ws, { t: 'hello', v: 1 });
  });

  const beat = setInterval(() => {   // Lebenszeichen (hält auch Render-Proxys wach) + tote Verbindungen / ewig Wartende aufräumen
    const now = Date.now();
    for (const s of socks) {
      if (!s.alive) { s.terminate(); continue; }
      s.alive = false; try { s.ping(); } catch (e) {}
      if (!s.peer && now - s.since > LIM.idleUnpairedMs) s.close(1000, 'Zeit abgelaufen');
    }
  }, LIM.heartbeatMs);
  beat.unref();

  return new Promise((resolve) => {
    http_.listen(port, host, () => {
      const addr = http_.address();
      log(`läuft auf Port ${addr.port}`);
      resolve({ port: addr.port, http: http_, wss, rooms, stats, close: () => new Promise(r => { clearInterval(beat); for (const s of socks) s.terminate(); wss.close(); http_.close(() => r()); }) });
    });
  });
}

export function lanUrls(port) {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const i of list || []) if (i.family === 'IPv4' && !i.internal) out.push(`http://${i.address}:${port}`);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = +process.env.PORT || 3000;
  startServer({ port }).then(s => {
    console.log(`\n  H!TisOP Online-Server läuft.\n  Dieser Rechner:      http://localhost:${s.port}`);
    const l = lanUrls(s.port); if (l.length) console.log(`  Anderes Gerät (WLAN): ${l.join('   ')}\n`);
    const stop = () => { s.close().then(() => process.exit(0)); setTimeout(() => process.exit(0), 1500).unref(); };
    process.on('SIGTERM', stop); process.on('SIGINT', stop);
  });
}
