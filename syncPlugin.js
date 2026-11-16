// Built-in Realtime Sync Relay Middleware for Vite Dev & Production Node Server
// Enables cross-browser & cross-device sync (Lobby, Chat, Đua Top Scores, Exams, Avatars).
import fs from 'node:fs';
import path from 'node:path';
import {
  buildSpeakingExaminerPrompt,
  cleanAudioMimeType,
  inferAudioExtension,
  normalizeSpeakingEvaluation,
  simulateAISpeakingGrading
} from './src/utils/speakingAiEngine.js';

export const LOBBY_CHAT_RESET_MS = 10 * 60 * 1000;
const GEMINI_AUDIO_PREFERRED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-flash-latest'
];

function getServerChatMsgTs(msg) {
  const rawTs = Number(msg?.createdAt ?? msg?.id);
  return Number.isFinite(rawTs) && rawTs > 1_000_000_000_000 ? rawTs : 0;
}

export function pruneServerRoomChat(raw = {}, now = Date.now()) {
  const baseChats = Array.isArray(raw?.chatMessages) ? raw.chatMessages : [];
  const baseLobby = raw?.lobbyPlayers && typeof raw.lobbyPlayers === 'object' ? { ...raw.lobbyPlayers } : {};

  if (baseChats.length === 0) {
    return { chatMessages: [], chatCycleStartedAt: null, lobbyPlayers: baseLobby };
  }

  let cycleStart = Number(raw?.chatCycleStartedAt);
  if (!Number.isFinite(cycleStart) || cycleStart <= 1_000_000_000_000) {
    const oldestTs = baseChats.map(getServerChatMsgTs).find(ts => ts > 0);
    cycleStart = oldestTs || now;
  }

  const clearLobbyChatBubbles = (playersMap) => {
    const next = {};
    Object.entries(playersMap).forEach(([uname, p]) => {
      if (!p) return;
      next[uname] = (p.chat || p.chatAt) ? { ...p, chat: '', chatAt: null } : p;
    });
    return next;
  };

  if (now - cycleStart >= LOBBY_CHAT_RESET_MS) {
    return {
      chatMessages: [],
      chatCycleStartedAt: null,
      lobbyPlayers: clearLobbyChatBubbles(baseLobby)
    };
  }

  const validChats = baseChats
    .filter(msg => {
      const ts = getServerChatMsgTs(msg);
      return ts === 0 || now - ts < LOBBY_CHAT_RESET_MS;
    })
    .slice(-50);

  if (validChats.length === 0) {
    return {
      chatMessages: [],
      chatCycleStartedAt: null,
      lobbyPlayers: clearLobbyChatBubbles(baseLobby)
    };
  }

  return {
    chatMessages: validChats,
    chatCycleStartedAt: cycleStart,
    lobbyPlayers: baseLobby
  };
}

export function normalizeServerRoom(raw = {}, pinKey = '', now = Date.now()) {
  const pin = String(raw?.pin || pinKey || '').trim();
  const prunedChat = pruneServerRoomChat(raw, now);
  const rawRoundSize = Number(raw?.roundSize);
  return {
    pin,
    name: raw?.name || `Phòng Từ Vựng #${pin || '686868'}`,
    pass: raw?.pass ?? 'ielts',
    teacher: raw?.teacher || 'teacher_ielts',
    status: raw?.status === 'PLAYING' || raw?.status === 'ENDED' ? raw.status : 'LOBBY',
    maxPlayers: Number(raw?.maxPlayers) || 30,
    roundSize: Number.isFinite(rawRoundSize) && rawRoundSize >= 2 ? Math.min(8, Math.round(rawRoundSize)) : 4,
    speedMode: ['relaxed', 'normal', 'turbo'].includes(raw?.speedMode) ? raw.speedMode : 'normal',
    startedAt: raw?.startedAt || null,
    lobbyPlayers: prunedChat.lobbyPlayers,
    liveMatch: raw?.liveMatch && typeof raw.liveMatch === 'object' ? { ...raw.liveMatch } : {},
    chatMessages: prunedChat.chatMessages,
    chatCycleStartedAt: prunedChat.chatCycleStartedAt,
    rawVocab: typeof raw?.rawVocab === 'string' ? raw.rawVocab : '',
    players: raw?.players && typeof raw.players === 'object' ? { ...raw.players } : {}
  };
}

function pruneExpiredStoreChats(store, now = Date.now()) {
  let prunedAny = false;
  Object.entries(store.rooms || {}).forEach(([pin, r]) => {
    const prevLen = Array.isArray(r?.chatMessages) ? r.chatMessages.length : 0;
    const normalized = normalizeServerRoom(r, pin, now);
    if (
      normalized.chatMessages.length !== prevLen ||
      normalized.chatCycleStartedAt !== (r?.chatCycleStartedAt ?? null)
    ) {
      store.rooms[pin] = normalized;
      prunedAny = true;
    }
  });
  if (prunedAny) {
    store.version += 1;
  }
  return prunedAny;
}

function createInitialStore(audioDir = '') {
  return {
    version: 0,
    seeded: false,
    seededTags: {},
    deletedTestIds: [],
    deletedUserIds: [],
    rooms: {},
    tests: [],
    attempts: [],
    teacherNotes: {},
    users: {},
    customVocabTopics: [],
    aiConfig: { geminiApiKey: '' },
    _audioDir: audioDir,
    _audioMem: new Map()
  };
}

function sanitizeAudioId(raw = '') {
  const cleaned = String(raw || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned.length >= 4 && cleaned.length <= 120 ? cleaned : '';
}

function getEffectiveGeminiKey(store, clientOverride = '') {
  return String(
    store?.aiConfig?.geminiApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    clientOverride ||
    ''
  ).trim().replace(/^['"]|['"]$/g, '');
}

function saveAudioRecord(store, { audioId, mimeType, dataBase64, username = '', attemptId = '', questionId = '' }) {
  const safeId = sanitizeAudioId(audioId) || `spk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const cleanMime = cleanAudioMimeType(mimeType);
  const rawB64 = String(dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(rawB64, 'base64');
  const ext = inferAudioExtension(cleanMime);
  const meta = {
    audioId: safeId,
    mimeType: cleanMime,
    ext,
    sizeBytes: buffer.length,
    username,
    attemptId,
    questionId,
    createdAt: Date.now()
  };

  if (store._audioDir) {
    fs.mkdirSync(store._audioDir, { recursive: true });
    fs.writeFileSync(path.join(store._audioDir, `${safeId}.bin`), buffer);
    fs.writeFileSync(path.join(store._audioDir, `${safeId}.meta.json`), JSON.stringify(meta), 'utf8');
  } else {
    store._audioMem.set(safeId, { buffer, meta });
  }
  return meta;
}

function loadAudioRecord(store, rawId) {
  const safeId = sanitizeAudioId(rawId);
  if (!safeId) return null;
  if (store._audioDir) {
    const binPath = path.join(store._audioDir, `${safeId}.bin`);
    const metaPath = path.join(store._audioDir, `${safeId}.meta.json`);
    if (fs.existsSync(binPath)) {
      let meta = { audioId: safeId, mimeType: 'audio/webm', ext: 'webm' };
      try {
        if (fs.existsSync(metaPath)) {
          meta = { ...meta, ...JSON.parse(fs.readFileSync(metaPath, 'utf8')) };
        }
      } catch (_err) {}
      const buffer = fs.readFileSync(binPath);
      return { buffer, meta };
    }
  }
  return store._audioMem?.get(safeId) || null;
}

/**
 * Create a sync store optionally backed by a JSON file on disk (debounced writes).
 * Keeps existing in-memory behavior when `persistFile` is empty.
 */
export function createPersistentSyncStore(persistFile = '') {
  const audioDir = persistFile ? path.join(path.dirname(persistFile), 'audio') : '';
  const store = createInitialStore(audioDir);

  if (persistFile) {
    try {
      if (fs.existsSync(persistFile)) {
        const parsed = JSON.parse(fs.readFileSync(persistFile, 'utf8'));
        if (parsed && typeof parsed === 'object') {
          store.version = Number(parsed.version) || 0;
          store.seeded = Boolean(parsed.seeded);
          if (parsed.seededTags && typeof parsed.seededTags === 'object') {
            store.seededTags = { ...parsed.seededTags };
          }
          if (Array.isArray(parsed.deletedTestIds)) {
            store.deletedTestIds = parsed.deletedTestIds;
          }
          if (Array.isArray(parsed.deletedUserIds)) {
            store.deletedUserIds = parsed.deletedUserIds;
          }
          if (parsed.rooms && typeof parsed.rooms === 'object') {
            Object.entries(parsed.rooms).forEach(([pin, r]) => {
              store.rooms[pin] = normalizeServerRoom(r, pin);
            });
          }
          if (Array.isArray(parsed.tests)) store.tests = parsed.tests;
          if (Array.isArray(parsed.attempts)) store.attempts = parsed.attempts;
          if (parsed.teacherNotes && typeof parsed.teacherNotes === 'object') {
            store.teacherNotes = parsed.teacherNotes;
          }
          if (parsed.users && typeof parsed.users === 'object') {
            store.users = parsed.users;
            if (store.users.teacher_ielts?.name === 'Thầy Minh IELTS Master') {
              store.users.teacher_ielts = {
                ...store.users.teacher_ielts,
                name: 'Ms. Như — IELTS Nha Trang'
              };
            }
          }
          if (Array.isArray(parsed.customVocabTopics)) {
            store.customVocabTopics = parsed.customVocabTopics.filter(t => t?.id && t?.label && typeof t?.text === 'string');
          }
          if (parsed.aiConfig && typeof parsed.aiConfig === 'object') {
            store.aiConfig = {
              geminiApiKey: String(parsed.aiConfig.geminiApiKey || '').trim()
            };
          }
        }
      }
    } catch {
      // Fall back cleanly to a fresh in-memory store if state file is corrupt or unreadable
    }
  }

  let writeTimer = null;
  const schedulePersist = () => {
    if (!persistFile) return;
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      writeTimer = null;
      try {
        fs.mkdirSync(path.dirname(persistFile), { recursive: true });
        const tmpFile = `${persistFile}.tmp`;
        const { _audioDir, _audioMem, ...serializableStore } = store;
        fs.writeFileSync(tmpFile, JSON.stringify(serializableStore), 'utf8');
        fs.renameSync(tmpFile, persistFile);
      } catch {
        // Ignore read-only filesystem errors so realtime relay never crashes
      }
    }, 200);
    writeTimer.unref?.();
  };

  return { store, schedulePersist };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    const MAX_BYTES = 24 * 1024 * 1024;
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
  pruneExpiredStoreChats(store, Date.now());
  return {
    version: store.version,
    seeded: store.seeded,
    serverTime: Date.now(),
    aiConfigured: Boolean(getEffectiveGeminiKey(store)),
    deletedUserIds: store.deletedUserIds,
    rooms: store.rooms,
    tests: store.tests,
    attempts: store.attempts,
    teacherNotes: store.teacherNotes,
    users: store.users,
    customVocabTopics: store.customVocabTopics
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
          payload.tests.forEach(t => {
            if (t?.seedTag) store.seededTags[t.seedTag] = true;
          });
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
        if (Array.isArray(payload.customVocabTopics)) {
          store.customVocabTopics = payload.customVocabTopics.filter(t => t?.id && t?.label && typeof t?.text === 'string');
        }
        store.seeded = true;
        changed = true;
      } else {
        // Merge only missing custom users or newly released tagged default tests
        if (payload.users && typeof payload.users === 'object') {
          Object.entries(payload.users).forEach(([uname, u]) => {
            if (!store.users[uname] && !store.deletedUserIds.includes(uname)) {
              store.users[uname] = u;
              changed = true;
            }
          });
        }
        if (Array.isArray(payload.customVocabTopics) && store.customVocabTopics.length === 0) {
          const validTopics = payload.customVocabTopics.filter(t => t?.id && t?.label && typeof t?.text === 'string');
          if (validTopics.length > 0) {
            store.customVocabTopics = validTopics;
            changed = true;
          }
        }
        if (store.users?.teacher_ielts?.name === 'Thầy Minh IELTS Master') {
          store.users.teacher_ielts = {
            ...store.users.teacher_ielts,
            name: 'Ms. Như — IELTS Nha Trang'
          };
          changed = true;
        }
        if (Array.isArray(payload.defaultTests)) {
          payload.defaultTests.forEach(dt => {
            if (!dt?.id || !dt?.seedTag) return;
            if (store.seededTags[dt.seedTag]) return;
            store.seededTags[dt.seedTag] = true;
            if (!store.deletedTestIds.includes(dt.id) && !store.tests.some(t => t.id === dt.id)) {
              store.tests = [dt, ...store.tests];
            }
            changed = true;
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
      const now = Date.now();
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin, now);
      const player = base.lobbyPlayers[message.username] || payload.fallbackPlayer || {
        username: message.username,
        name: message.name || message.username,
        role: message.role || 'student',
        colorId: message.colorId || 'cyan',
        animalId: message.animalId || 'cat',
        accessoryId: message.accessoryId || 'crown',
        ready: true,
        joinedAt: now
      };
      base.lobbyPlayers[message.username] = {
        ...player,
        chat: message.text,
        chatAt: message.id || now
      };
      const prevChats = Array.isArray(base.chatMessages) ? base.chatMessages : [];
      if (!prevChats.some(m => m.id === message.id)) {
        base.chatMessages = [...prevChats, message].slice(-50);
      }
      if (!base.chatCycleStartedAt || prevChats.length === 0) {
        base.chatCycleStartedAt = getServerChatMsgTs(message) || now;
      }
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'CLEAR_LOBBY_CHAT': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin || !store.rooms[cleanPin]) break;
      const now = Date.now();
      const base = normalizeServerRoom(store.rooms[cleanPin], cleanPin, now);
      const beforeTs = Number(payload.beforeTs);
      const prevLen = base.chatMessages.length;

      if (Number.isFinite(beforeTs) && beforeTs > 0) {
        base.chatMessages = base.chatMessages.filter(m => {
          const ts = getServerChatMsgTs(m);
          return ts > beforeTs;
        });
      } else {
        base.chatMessages = [];
      }

      if (base.chatMessages.length === 0) {
        base.chatCycleStartedAt = null;
        Object.keys(base.lobbyPlayers || {}).forEach(uname => {
          const lp = base.lobbyPlayers[uname];
          if (lp && (lp.chat || lp.chatAt)) {
            base.lobbyPlayers[uname] = { ...lp, chat: '', chatAt: null };
          }
        });
      } else {
        base.chatCycleStartedAt = getServerChatMsgTs(base.chatMessages[0]) || now;
      }

      if (prevLen !== base.chatMessages.length || (prevLen === 0 && store.rooms[cleanPin]?.chatCycleStartedAt)) {
        store.rooms[cleanPin] = base;
        changed = true;
      }
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
            animalId: lp.animalId || 'cat',
            accessoryId: lp.accessoryId || 'none',
            avatarUrl: lp.avatarUrl || store.users?.[lp.username]?.avatarUrl || '',
            score: 0,
            streak: 0,
            lives: 3,
            round: 1,
            progressText: 'Đang vào Vòng 1',
            finished: false,
            outcome: null,
            missed: [],
            updatedAt: Date.now()
          };
        }
      });
      base.liveMatch = freshLive;
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'FINISH_ROOM_MATCH': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin || !store.rooms[cleanPin]) break;
      const base = normalizeServerRoom(store.rooms[cleanPin], cleanPin);
      base.status = 'ENDED';
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'KICK_LOBBY_PLAYER': {
      const cleanPin = String(payload.pin || '').trim();
      const username = payload.username;
      if (!cleanPin || !username || !store.rooms[cleanPin]) break;
      const base = normalizeServerRoom(store.rooms[cleanPin], cleanPin);
      let touched = false;
      if (base.lobbyPlayers[username]) {
        delete base.lobbyPlayers[username];
        touched = true;
      }
      if (base.liveMatch[username]) {
        delete base.liveMatch[username];
        touched = true;
      }
      if (touched) {
        store.rooms[cleanPin] = base;
        changed = true;
      }
      break;
    }

    case 'DELETE_ROOM': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin || !store.rooms[cleanPin] || Object.keys(store.rooms).length <= 1) break;
      delete store.rooms[cleanPin];
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
      if (!store.deletedTestIds.includes(testId)) {
        store.deletedTestIds.push(testId);
      }
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

    case 'TOGGLE_TEST_VISIBILITY': {
      const testId = payload.testId;
      if (!testId) break;
      store.tests = store.tests.map(t =>
        t.id === testId
          ? { ...t, visibility: (t.visibility || 'public') === 'private' ? 'public' : 'private' }
          : t
      );
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

    case 'DELETE_ATTEMPT': {
      const attemptId = payload.attemptId;
      if (!attemptId) break;
      const prevLen = store.attempts.length;
      store.attempts = store.attempts.filter(a => a.id !== attemptId);
      if (store.attempts.length !== prevLen) {
        changed = true;
      }
      break;
    }

    case 'UPSERT_NOTE': {
      if (!payload.username) break;
      store.teacherNotes[payload.username] = payload.text || '';
      changed = true;
      break;
    }

    case 'UPSERT_USER': {
      const uname = payload.username || payload.user?.username;
      if (!uname || !payload.user) break;
      store.deletedUserIds = store.deletedUserIds.filter(id => id !== uname);
      store.users[uname] = payload.user;
      // Propagate updated avatarUrl & display name into any active room lobbies / live races
      Object.entries(store.rooms).forEach(([_pin, r]) => {
        if (r?.lobbyPlayers?.[uname]) {
          r.lobbyPlayers[uname] = {
            ...r.lobbyPlayers[uname],
            name: payload.user.name || r.lobbyPlayers[uname].name,
            avatarUrl: payload.user.avatarUrl ?? r.lobbyPlayers[uname].avatarUrl
          };
        }
        if (r?.liveMatch?.[uname]) {
          r.liveMatch[uname] = {
            ...r.liveMatch[uname],
            name: payload.user.name || r.liveMatch[uname].name,
            avatarUrl: payload.user.avatarUrl ?? r.liveMatch[uname].avatarUrl
          };
        }
      });
      changed = true;
      break;
    }

    case 'DELETE_USER': {
      const uname = payload.username;
      if (!uname) break;
      if (!store.deletedUserIds.includes(uname)) {
        store.deletedUserIds.push(uname);
      }
      const existed = Boolean(store.users[uname]);
      delete store.users[uname];
      delete store.teacherNotes[uname];
      Object.values(store.rooms).forEach(r => {
        if (r?.lobbyPlayers?.[uname]) delete r.lobbyPlayers[uname];
        if (r?.liveMatch?.[uname]) delete r.liveMatch[uname];
      });
      if (existed) {
        changed = true;
      }
      break;
    }

    case 'UPSERT_VOCAB_TOPIC': {
      const topic = payload.topic;
      if (!topic?.id || !topic?.label || typeof topic?.text !== 'string') break;
      const list = Array.isArray(store.customVocabTopics) ? store.customVocabTopics : [];
      const idx = list.findIndex(t => t.id === topic.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...topic };
        store.customVocabTopics = [...list];
      } else {
        store.customVocabTopics = [...list, topic];
      }
      changed = true;
      break;
    }

    case 'DELETE_VOCAB_TOPIC': {
      const topicId = payload.topicId;
      if (!topicId) break;
      const list = Array.isArray(store.customVocabTopics) ? store.customVocabTopics : [];
      const filtered = list.filter(t => t.id !== topicId);
      if (filtered.length !== list.length) {
        store.customVocabTopics = filtered;
        changed = true;
      }
      break;
    }

    case 'SET_AI_CONFIG': {
      const nextKey = String(payload.geminiApiKey ?? '').trim().replace(/^['"]|['"]$/g, '');
      const prevKey = String(store.aiConfig?.geminiApiKey || '');
      if (nextKey !== prevKey) {
        store.aiConfig = { ...(store.aiConfig || {}), geminiApiKey: nextKey };
        changed = true;
      }
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

async function discoverServerGeminiModels(cleanKey) {
  const ordered = [];
  const pushUnique = (id) => {
    if (id && !ordered.includes(id)) ordered.push(id);
  };
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`);
    if (res.ok) {
      const data = await res.json();
      const ids = (data?.models || [])
        .filter(m => {
          const methods = m?.supportedGenerationMethods || [];
          const name = String(m?.name || '').toLowerCase();
          return (
            methods.includes('generateContent') &&
            !name.includes('embedding') &&
            !name.includes('imagen') &&
            !name.includes('tts') &&
            !name.includes('aqa')
          );
        })
        .map(m => String(m.name || '').replace(/^models\//, ''));
      GEMINI_AUDIO_PREFERRED_MODELS.forEach(p => { if (ids.includes(p)) pushUnique(p); });
      ids.filter(id => id.includes('flash')).forEach(pushUnique);
      ids.filter(id => id.includes('gemini')).forEach(pushUnique);
    }
  } catch (_err) {}
  GEMINI_AUDIO_PREFERRED_MODELS.forEach(pushUnique);
  return ordered;
}

async function gradeSpeakingWithGeminiServer({ apiKey, store, testTitle, partMode, recordings }) {
  const parts = [];
  const preparedRecordings = recordings.map(rec => {
    let audioBuffer = null;
    let resolvedMime = cleanAudioMimeType(rec.mimeType);

    if (rec.audioId) {
      const saved = loadAudioRecord(store, rec.audioId);
      if (saved?.buffer?.length > 0) {
        audioBuffer = saved.buffer;
        resolvedMime = cleanAudioMimeType(saved.meta?.mimeType || resolvedMime);
      }
    }
    if (!audioBuffer && rec.inlineAudioBase64) {
      const rawB64 = String(rec.inlineAudioBase64).replace(/^data:[^;]+;base64,/, '');
      if (rawB64) audioBuffer = Buffer.from(rawB64, 'base64');
    }

    const hasAudioBinary = Boolean(audioBuffer && audioBuffer.length > 256);
    if (hasAudioBinary) {
      parts.push({
        inlineData: {
          mimeType: resolvedMime,
          data: audioBuffer.toString('base64')
        }
      });
    }
    return { ...rec, hasAudioBinary, mimeType: resolvedMime };
  });

  const meaningfulCount = preparedRecordings.filter(
    r => (Number(r.durationSec) || 0) >= 1 && (r.hasAudioBinary || String(r.clientTranscript || '').trim().length >= 3)
  ).length;
  if (meaningfulCount === 0) {
    return simulateAISpeakingGrading({ testTitle, partMode, recordings: preparedRecordings });
  }

  const promptText = buildSpeakingExaminerPrompt({
    testTitle,
    partMode,
    recordings: preparedRecordings
  });
  const requestParts = [{ text: promptText }, ...parts];
  const models = await discoverServerGeminiModels(apiKey);
  let lastErr = null;

  for (const modelId of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: requestParts }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastErr = new Error('AI không trả về JSON hợp lệ.');
        continue;
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return normalizeSpeakingEvaluation({
        parsed,
        recordings: preparedRecordings,
        usedModel: modelId,
        gradedMode: 'gemini_audio'
      });
    }

    const errText = await response.text();
    if (response.status === 404 || /not found|not supported/i.test(errText)) {
      lastErr = new Error(errText);
      continue;
    }
    throw new Error(`Gemini API lỗi (${response.status}): ${errText.slice(0, 220)}`);
  }

  throw lastErr || new Error('Không tìm thấy model Gemini hỗ trợ chấm Speaking audio.');
}

export function attachSyncMiddleware(middlewares, store, sseClients, onChanged = null) {
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

  // Sweep expired 10-minute room chats automatically and broadcast updates
  const chatSweepTimer = setInterval(() => {
    if (pruneExpiredStoreChats(store, Date.now())) {
      onChanged?.(store);
      broadcast();
    }
  }, 10000);
  chatSweepTimer.unref?.();

  middlewares.use('/api/sync', async (req, res, next) => {
    const reqUrl = (req.url || '/').split('?')[0];

    if (req.method === 'POST' && reqUrl === '/audio') {
      try {
        const body = await readJsonBody(req);
        if (!body?.dataBase64) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Missing audio data' }));
          return;
        }
        const meta = saveAudioRecord(store, body);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({
          ok: true,
          audioId: meta.audioId,
          audioUrl: `/api/sync/audio/${meta.audioId}`,
          mimeType: meta.mimeType,
          sizeBytes: meta.sizeBytes
        }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Audio upload failed' }));
      }
      return;
    }

    if (req.method === 'GET' && reqUrl.startsWith('/audio/')) {
      const rawId = decodeURIComponent(reqUrl.slice('/audio/'.length));
      const record = loadAudioRecord(store, rawId);
      if (!record) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Audio recording not found' }));
        return;
      }
      const totalLen = record.buffer.length;
      const mime = record.meta?.mimeType || 'audio/webm';
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      const rangeHeader = req.headers?.range;
      if (rangeHeader && /^bytes=\d*-\d*$/i.test(rangeHeader)) {
        const [startStr, endStr] = rangeHeader.replace(/^bytes=/i, '').split('-');
        const start = startStr ? Math.min(totalLen - 1, Math.max(0, parseInt(startStr, 10))) : 0;
        const end = endStr ? Math.min(totalLen - 1, Math.max(start, parseInt(endStr, 10))) : totalLen - 1;
        const slice = record.buffer.subarray(start, end + 1);
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalLen}`);
        res.setHeader('Content-Length', String(slice.length));
        res.end(slice);
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Length', String(totalLen));
        res.end(record.buffer);
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/grade-speaking') {
      try {
        const body = await readJsonBody(req);
        const recordings = Array.isArray(body?.recordings) ? body.recordings : [];
        const testTitle = body?.testTitle || 'IELTS Speaking Test';
        const partMode = body?.partMode || 'full';
        const effectiveKey = getEffectiveGeminiKey(store, body?.clientApiKey || '');

        let evaluation = null;
        let warning = '';

        if (effectiveKey) {
          try {
            evaluation = await gradeSpeakingWithGeminiServer({
              apiKey: effectiveKey,
              store,
              testTitle,
              partMode,
              recordings
            });
          } catch (geminiErr) {
            warning = geminiErr?.message || 'Gemini API failed, fallback used';
          }
        }

        if (!evaluation) {
          const enriched = recordings.map(r => {
            const saved = r.audioId ? loadAudioRecord(store, r.audioId) : null;
            return { ...r, hasAudioBinary: Boolean(saved?.buffer?.length > 256 || r.inlineAudioBase64) };
          });
          evaluation = simulateAISpeakingGrading({ testTitle, partMode, recordings: enriched });
          if (warning) evaluation._fallbackReason = warning;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, evaluation }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Speaking grading failed' }));
      }
      return;
    }

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
      res.setHeader('X-Accel-Buffering', 'no');
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
        if (changed) {
          onChanged?.(store);
          broadcast();
        }
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

export function lexiprepSyncPlugin({ persistFile = process.env.SYNC_STATE_FILE || '' } = {}) {
  const { store, schedulePersist } = createPersistentSyncStore(persistFile);
  const sseClients = new Set();

  return {
    name: 'lexiprep-realtime-sync',
    configureServer(server) {
      attachSyncMiddleware(server.middlewares, store, sseClients, schedulePersist);
    },
    configurePreviewServer(server) {
      attachSyncMiddleware(server.middlewares, store, sseClients, schedulePersist);
    }
  };
}
