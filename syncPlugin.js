// Built-in Realtime Sync Relay Middleware for Vite Dev & Preview Servers
// Enables cross-browser sync (Chrome <-> Edge <-> Incognito <-> LAN devices) for Game Lobby, Chat, Scores, and Exams.

function normalizeServerRoom(raw = {}, pinKey = '') {
  const pin = String(raw?.pin || pinKey || '').trim();
  const baseChats = Array.isArray(raw?.chatMessages) ? raw.chatMessages : [];
  return {
    pin,
    name: raw?.name || `Phòng Từ Vựng #${pin || '686868'}`,
    pass: raw?.pass ?? 'ielts',
    teacher: raw?.teacher || 'teacher_ielts',
    status: raw?.status === 'PLAYING' || raw?.status === 'ENDED' ? raw.status : 'LOBBY',
    maxPlayers: Number(raw?.maxPlayers) || 30,
    startedAt: raw?.startedAt || null,
    lobbyPlayers: raw?.lobbyPlayers && typeof raw.lobbyPlayers === 'object' ? { ...raw.lobbyPlayers } : {},
    liveMatch: raw?.liveMatch && typeof raw.liveMatch === 'object' ? { ...raw.liveMatch } : {},
    chatMessages: baseChats.slice(-50),
    rawVocab: typeof raw?.rawVocab === 'string' ? raw.rawVocab : '',
    players: raw?.players && typeof raw.players === 'object' ? { ...raw.players } : {}
  };
}

function createInitialStore() {
  return {
    version: 0,
    seeded: false,
    rooms: {},
    tests: [],
    attempts: [],
    teacherNotes: {},
    users: {}
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    const MAX_BYTES = 12 * 1024 * 1024;
    req.on('data', chunk => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function getSnapshot(store) {
  return {
    version: store.version,
    seeded: store.seeded,
    serverTime: Date.now(),
    rooms: store.rooms,
    tests: store.tests,
    attempts: store.attempts,
    teacherNotes: store.teacherNotes,
    users: store.users
  };
}

function applySyncAction(store, type, payload = {}) {
  let changed = false;

  switch (type) {
    case 'SEED_DEFAULTS': {
      if (!store.seeded) {
        if (payload.rooms && typeof payload.rooms === 'object') {
          Object.entries(payload.rooms).forEach(([pin, r]) => {
            store.rooms[pin] = normalizeServerRoom(r, pin);
          });
        }
        if (Array.isArray(payload.tests)) {
          store.tests = payload.tests;
        }
        if (Array.isArray(payload.attempts)) {
          store.attempts = payload.attempts;
        }
        if (payload.teacherNotes && typeof payload.teacherNotes === 'object') {
          store.teacherNotes = { ...payload.teacherNotes };
        }
        if (payload.users && typeof payload.users === 'object') {
          store.users = { ...payload.users };
        }
        store.seeded = true;
        changed = true;
      } else {
        // Merge only missing custom users or newly created local rooms if server didn't know about them
        if (payload.users && typeof payload.users === 'object') {
          Object.entries(payload.users).forEach(([uname, u]) => {
            if (!store.users[uname]) {
              store.users[uname] = u;
              changed = true;
            }
          });
        }
      }
      break;
    }

    case 'UPSERT_ROOM': {
      const cleanPin = String(payload.pin || '').trim();
      const oldPin = payload.oldPin ? String(payload.oldPin).trim() : '';
      if (!cleanPin) break;

      const sourceRoom = oldPin && oldPin !== cleanPin && store.rooms[oldPin]
        ? store.rooms[oldPin]
        : store.rooms[cleanPin];

      const base = normalizeServerRoom(sourceRoom || {}, cleanPin);
      const merged = normalizeServerRoom(
        {
          ...base,
          ...(payload.updates || {}),
          pin: cleanPin,
          lobbyPlayers: { ...base.lobbyPlayers, ...(payload.updates?.lobbyPlayers || {}) },
          liveMatch: { ...base.liveMatch, ...(payload.updates?.liveMatch || {}) },
          players: { ...base.players, ...(payload.updates?.players || {}) },
          chatMessages: Array.isArray(payload.updates?.chatMessages) ? payload.updates.chatMessages : base.chatMessages
        },
        cleanPin
      );

      if (oldPin && oldPin !== cleanPin && store.rooms[oldPin]) {
        delete store.rooms[oldPin];
      }
      store.rooms[cleanPin] = merged;
      store.seeded = true;
      changed = true;
      break;
    }

    case 'JOIN_LOBBY': {
      const cleanPin = String(payload.pin || '').trim();
      const player = payload.player;
      if (!cleanPin || !player?.username) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      const existingPlayer = base.lobbyPlayers[player.username];
      base.lobbyPlayers[player.username] = {
        ...(existingPlayer || {}),
        ...player
      };
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'UPDATE_LOBBY_PLAYER': {
      const cleanPin = String(payload.pin || '').trim();
      const username = payload.username;
      if (!cleanPin || !username) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      const current = base.lobbyPlayers[username] || payload.fallbackPlayer;
      if (!current) break;
      base.lobbyPlayers[username] = {
        ...current,
        ...(payload.patch || {})
      };
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'LEAVE_LOBBY': {
      const cleanPin = String(payload.pin || '').trim();
      const username = payload.username;
      if (!cleanPin || !username || !store.rooms[cleanPin]) break;
      const base = normalizeServerRoom(store.rooms[cleanPin], cleanPin);
      if (base.lobbyPlayers[username]) {
        delete base.lobbyPlayers[username];
        store.rooms[cleanPin] = base;
        changed = true;
      }
      break;
    }

    case 'SEND_LOBBY_CHAT': {
      const cleanPin = String(payload.pin || '').trim();
      const message = payload.message;
      if (!cleanPin || !message?.username || !message?.text) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      const player = base.lobbyPlayers[message.username] || payload.fallbackPlayer || {
        username: message.username,
        name: message.name || message.username,
        role: message.role || 'student',
        colorId: message.colorId || 'cyan',
        ready: true,
        joinedAt: Date.now()
      };
      base.lobbyPlayers[message.username] = {
        ...player,
        chat: message.text,
        chatAt: message.id || Date.now()
      };
      const prevChats = Array.isArray(base.chatMessages) ? base.chatMessages : [];
      if (!prevChats.some(m => m.id === message.id)) {
        base.chatMessages = [...prevChats, message].slice(-50);
      }
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'START_GAME': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      base.status = 'PLAYING';
      base.startedAt = payload.startedAt || Date.now();
      const freshLive = {};
      Object.values(base.lobbyPlayers || {}).forEach(lp => {
        if (lp && lp.role !== 'teacher') {
          freshLive[lp.username] = {
            username: lp.username,
            name: lp.name || lp.username,
            role: lp.role || 'student',
            colorId: lp.colorId || 'cyan',
            avatarUrl: lp.avatarUrl || store.users?.[lp.username]?.avatarUrl || '',
            score: 0,
            streak: 0,
            lives: 3,
            round: 1,
            progressText: 'Đang vào Vòng 1',
            finished: false,
            outcome: null,
            updatedAt: Date.now()
          };
        }
      });
      base.liveMatch = freshLive;
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'RESET_LOBBY': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      base.status = 'LOBBY';
      base.startedAt = null;
      base.liveMatch = {};
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'UPDATE_LIVE_SCORE': {
      const cleanPin = String(payload.pin || '').trim();
      const username = payload.username;
      const entry = payload.entry;
      if (!cleanPin || !username || !entry) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      const prevEntry = base.liveMatch[username] || {};
      base.liveMatch[username] = {
        ...prevEntry,
        ...entry,
        username,
        updatedAt: Date.now()
      };
      const scoreVal = Number(entry.score) || 0;
      if (scoreVal > 0 || entry.finished) {
        const prevRec = base.players[username];
        const bestScore = prevRec ? Math.max(Number(prevRec.score) || 0, scoreVal) : scoreVal;
        base.players[username] = {
          name: entry.name || prevEntry.name || username,
          score: bestScore,
          status: entry.progressText || `Vòng ${entry.round || 1}`,
          streak: Number(entry.streak) || 0,
          missed: Array.isArray(entry.missed) ? entry.missed : [],
          updatedAt: new Date().toLocaleTimeString('vi-VN')
        };
      }
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'UPDATE_SCORE': {
      const cleanPin = String(payload.pin || '').trim();
      const username = payload.username;
      const record = payload.record;
      if (!cleanPin || !username || !record) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      const prevRec = base.players[username];
      const bestScore = prevRec ? Math.max(Number(prevRec.score) || 0, Number(record.score) || 0) : (Number(record.score) || 0);
      base.players[username] = {
        ...record,
        score: bestScore
      };
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'UPSERT_TEST': {
      const test = payload.test;
      if (!test?.id) break;
      const idx = store.tests.findIndex(t => t.id === test.id);
      if (idx >= 0) {
        store.tests[idx] = test;
      } else {
        store.tests = [test, ...store.tests];
      }
      changed = true;
      break;
    }

    case 'DELETE_TEST': {
      const testId = payload.testId;
      if (!testId) break;
      store.tests = store.tests.filter(t => t.id !== testId);
      changed = true;
      break;
    }

    case 'TOGGLE_TEST_ANSWERS': {
      const testId = payload.testId;
      if (!testId) break;
      store.tests = store.tests.map(t => (t.id === testId ? { ...t, allowViewAnswers: !t.allowViewAnswers } : t));
      changed = true;
      break;
    }

    case 'UPSERT_ATTEMPT': {
      const attempt = payload.attempt;
      if (!attempt?.id) break;
      const idx = store.attempts.findIndex(a => a.id === attempt.id);
      if (idx >= 0) {
        store.attempts[idx] = attempt;
      } else {
        store.attempts = [attempt, ...store.attempts];
      }
      changed = true;
      break;
    }

    case 'UPSERT_NOTE': {
      if (!payload.username) break;
      store.teacherNotes[payload.username] = payload.text || '';
      changed = true;
      break;
    }

    case 'UPSERT_USER': {
      if (!payload.username || !payload.user) break;
      store.users[payload.username] = payload.user;
      // Propagate updated avatarUrl & display name into any active room lobbies / live races
      Object.entries(store.rooms).forEach(([_pin, r]) => {
        if (r?.lobbyPlayers?.[payload.username]) {
          r.lobbyPlayers[payload.username] = {
            ...r.lobbyPlayers[payload.username],
            name: payload.user.name || r.lobbyPlayers[payload.username].name,
            avatarUrl: payload.user.avatarUrl ?? r.lobbyPlayers[payload.username].avatarUrl
          };
        }
        if (r?.liveMatch?.[payload.username]) {
          r.liveMatch[payload.username] = {
            ...r.liveMatch[payload.username],
            name: payload.user.name || r.liveMatch[payload.username].name,
            avatarUrl: payload.user.avatarUrl ?? r.liveMatch[payload.username].avatarUrl
          };
        }
      });
      changed = true;
      break;
    }

    default:
      break;
  }

  if (changed) {
    store.version += 1;
  }
  return changed;
}

function attachSyncMiddleware(middlewares, store, sseClients) {
  const broadcast = () => {
    const dataStr = `event: sync\ndata: ${JSON.stringify(getSnapshot(store))}\n\n`;
    for (const res of sseClients) {
      try {
        res.write(dataStr);
      } catch (_err) {
        sseClients.delete(res);
      }
    }
  };

  middlewares.use('/api/sync', async (req, res, next) => {
    const reqUrl = (req.url || '/').split('?')[0];

    if (req.method === 'GET' && reqUrl === '/state') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(getSnapshot(store)));
      return;
    }

    if (req.method === 'GET' && reqUrl === '/stream') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      sseClients.add(res);
      res.write(`event: sync\ndata: ${JSON.stringify(getSnapshot(store))}\n\n`);

      const keepAlive = setInterval(() => {
        try {
          res.write(': keepalive\n\n');
        } catch (_err) {
          clearInterval(keepAlive);
          sseClients.delete(res);
        }
      }, 15000);

      req.on('close', () => {
        clearInterval(keepAlive);
        sseClients.delete(res);
      });
      return;
    }

    if (req.method === 'POST' && reqUrl === '/action') {
      try {
        const body = await readJsonBody(req);
        const changed = applySyncAction(store, body.type, body.payload);
        if (changed) broadcast();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, snapshot: getSnapshot(store) }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Invalid request' }));
      }
      return;
    }

    next();
  });
}

export function lexiprepSyncPlugin() {
  const store = createInitialStore();
  const sseClients = new Set();

  return {
    name: 'lexiprep-realtime-sync',
    configureServer(server) {
      attachSyncMiddleware(server.middlewares, store, sseClients);
    },
    configurePreviewServer(server) {
      attachSyncMiddleware(server.middlewares, store, sseClients);
    }
  };
}
