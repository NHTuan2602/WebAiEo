// Built-in Realtime Sync Relay Middleware for Vite Dev & Production Node Server
// Enables cross-browser & cross-device sync (Lobby, Chat, Đua Top Scores, Exams, Avatars).
import crypto from 'node:crypto';
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
const SUPER_ADMIN_USERNAME = 'tuanpro123s';
const SUPER_ADMIN_DEFAULT_PASS = process.env.SUPER_ADMIN_PASS || '0938899046';
const SESSION_COOKIE_NAME = 'ielts_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 15;
const MAX_AUDIO_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_AUDIO_MIMES = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/x-m4a', 'audio/flac']);

const GEMINI_AUDIO_PREFERRED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-flash-latest'
];

const LISTENING_40_THRESHOLDS = [
  [39, 9.0], [37, 8.5], [35, 8.0], [32, 7.5], [30, 7.0],
  [26, 6.5], [23, 6.0], [18, 5.5], [16, 5.0], [13, 4.5],
  [10, 4.0], [6, 3.5], [4, 3.0], [2, 2.0], [1, 1.0]
];

const ACADEMIC_READING_40_THRESHOLDS = [
  [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5], [30, 7.0],
  [27, 6.5], [23, 6.0], [19, 5.5], [15, 5.0], [13, 4.5],
  [10, 4.0], [8, 3.5], [6, 3.0], [4, 2.5], [2, 2.0], [1, 1.0]
];

function hashPassword(rawPassword) {
  const clean = String(rawPassword ?? '');
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(clean, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(rawPassword, userRecord) {
  if (!userRecord || typeof userRecord !== 'object') return false;
  const candidate = String(rawPassword ?? '');
  if (typeof userRecord.passwordHash === 'string' && userRecord.passwordHash.startsWith('scrypt$')) {
    const parts = userRecord.passwordHash.split('$');
    if (parts.length !== 3) return false;
    try {
      const salt = parts[1];
      const expectedBuf = Buffer.from(parts[2], 'hex');
      const actualBuf = crypto.scryptSync(candidate, salt, 64);
      return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }
  if (typeof userRecord.pass === 'string' && userRecord.pass.length > 0) {
    const a = Buffer.from(candidate);
    const b = Buffer.from(userRecord.pass);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  return false;
}

function signToken(payloadObj, secret) {
  const encoded = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || !secret || typeof token !== 'string') return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (parsed?.exp && Date.now() > Number(parsed.exp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const out = {};
  const raw = String(req?.headers?.cookie || '');
  if (!raw) return out;
  raw.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx <= 0) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) {
      try {
        out[k] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    }
  });
  return out;
}

function resolveSessionUser(req, store) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token || !store?._authSecret) return null;
  const payload = verifyToken(token, store._authSecret);
  if (!payload?.username) return null;
  const user = store.users?.[payload.username];
  if (!user) return null;
  if ((user.tokenVersion || 1) !== (payload.tokenVersion || 1)) return null;
  return user;
}

function buildSessionCookieHeader(req, tokenValue, maxAgeSec) {
  const isHttps = Boolean(
    req?.socket?.encrypted ||
    String(req?.headers?.['x-forwarded-proto'] || '').toLowerCase().includes('https')
  );
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(tokenValue)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`
  ];
  if (isHttps) parts.push('Secure');
  return parts.join('; ');
}

function ensureProtectedAccounts(store) {
  let changed = false;
  if (!store._authSecret || typeof store._authSecret !== 'string') {
    store._authSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
    changed = true;
  }
  if (!store.users || typeof store.users !== 'object') {
    store.users = {};
  }
  Object.entries(store.users).forEach(([uname, u]) => {
    if (!u || typeof u !== 'object') return;
    if (typeof u.pass === 'string' && u.pass.length > 0 && !u.passwordHash) {
      u.passwordHash = hashPassword(u.pass);
      changed = true;
    }
    if ('pass' in u) {
      delete u.pass;
      changed = true;
    }
    if (!u.tokenVersion) {
      u.tokenVersion = 1;
    }
    if (uname !== SUPER_ADMIN_USERNAME && (u.isSuperAdmin || u.hiddenFromTeacher)) {
      delete u.isSuperAdmin;
      delete u.hiddenFromTeacher;
      changed = true;
    }
    if (uname === 'teacher_ielts' && (!u.avatarUrl || u.avatarUrl === '/brand-avatar.jpg')) {
      u.avatarUrl = '/brand-avatar.jpg?v=2';
      changed = true;
    }
  });

  if (Array.isArray(store.deletedUserIds) && store.deletedUserIds.includes(SUPER_ADMIN_USERNAME)) {
    store.deletedUserIds = store.deletedUserIds.filter(id => id !== SUPER_ADMIN_USERNAME);
    changed = true;
  }

  const existingSuper = store.users[SUPER_ADMIN_USERNAME];
  if (!existingSuper) {
    store.users[SUPER_ADMIN_USERNAME] = {
      username: SUPER_ADMIN_USERNAME,
      name: 'Quản Trị Hệ Thống',
      role: 'teacher',
      isSuperAdmin: true,
      hiddenFromTeacher: true,
      targetBand: 9.0,
      joinedDate: '2026-01-01',
      tokenVersion: 1,
      passwordHash: hashPassword(SUPER_ADMIN_DEFAULT_PASS)
    };
    changed = true;
  } else {
    if (!existingSuper.passwordHash) {
      existingSuper.passwordHash = hashPassword(SUPER_ADMIN_DEFAULT_PASS);
      changed = true;
    }
    if (!existingSuper.isSuperAdmin || !existingSuper.hiddenFromTeacher || existingSuper.role !== 'teacher') {
      existingSuper.role = 'teacher';
      existingSuper.isSuperAdmin = true;
      existingSuper.hiddenFromTeacher = true;
      changed = true;
    }
  }
  return changed;
}

function getClientIp(req) {
  const xff = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req?.socket?.remoteAddress || 'local';
}

function checkRateLimit(bucketMap, key, limit = LOGIN_MAX_ATTEMPTS, windowMs = LOGIN_RATE_WINDOW_MS) {
  const now = Date.now();
  if (bucketMap.size > 500) {
    for (const [k, rec] of bucketMap.entries()) {
      if (now - rec.start > windowMs) bucketMap.delete(k);
    }
  }
  const existing = bucketMap.get(key);
  if (!existing || now - existing.start > windowMs) {
    bucketMap.set(key, { count: 1, start: now });
    return true;
  }
  if (existing.count >= limit) {
    return false;
  }
  existing.count += 1;
  return true;
}

function sanitizeUserForViewer(user, viewer) {
  if (!user || typeof user !== 'object') return null;
  if ((user.isSuperAdmin || user.hiddenFromTeacher || user.username === SUPER_ADMIN_USERNAME) && !viewer?.isSuperAdmin) {
    return null;
  }
  const safe = {
    username: user.username,
    name: user.name || user.username,
    role: user.role === 'teacher' ? 'teacher' : 'student',
    targetBand: user.targetBand ?? (user.role === 'teacher' ? 9.0 : 7.5),
    studyGoal: user.studyGoal || '',
    joinedDate: user.joinedDate || '',
    avatarUrl: user.avatarUrl || ''
  };
  if (viewer?.isSuperAdmin && user.isSuperAdmin) {
    safe.isSuperAdmin = true;
    safe.hiddenFromTeacher = true;
  }
  return safe;
}

function stripQuestionSecrets(questions) {
  return questions.map(q => {
    if (!q || typeof q !== 'object') return q;
    const nextQ = { ...q };
    delete nextQ.correctAnswer;
    delete nextQ.acceptableAnswers;
    delete nextQ.explanation;
    return nextQ;
  });
}

function stripAnswerKeysFromTest(test) {
  if (!test || typeof test !== 'object') return test;
  const clone = { ...test };
  if (clone.listening && Array.isArray(clone.listening.questions)) {
    clone.listening = {
      ...clone.listening,
      questions: stripQuestionSecrets(clone.listening.questions)
    };
  }
  if (clone.reading && Array.isArray(clone.reading.questions)) {
    clone.reading = {
      ...clone.reading,
      questions: stripQuestionSecrets(clone.reading.questions)
    };
  }
  if (clone.writing) {
    clone.writing = {
      ...clone.writing,
      task1: clone.writing.task1 ? { ...clone.writing.task1, modelAnswer: '' } : undefined,
      task2: clone.writing.task2 ? { ...clone.writing.task2, modelAnswer: '' } : undefined
    };
  }
  return clone;
}

function sanitizeAttemptForPeer(att) {
  if (!att || typeof att !== 'object') return att;
  return {
    id: att.id,
    testId: att.testId,
    testTitle: att.testTitle,
    testMode: att.testMode,
    focusSkill: att.focusSkill,
    speakingPartMode: att.speakingPartMode,
    studentId: att.studentId,
    studentName: att.studentName,
    submittedAt: att.submittedAt,
    teacherGraded: Boolean(att.teacherGraded),
    aiGraded: Boolean(att.aiGraded),
    overallBand: att.overallBand ?? null,
    scores: att.scores || {}
  };
}

function calculateAutoBandServer(raw, total, skill = 'reading') {
  const cleanTotal = Number(total);
  const cleanRaw = Number(raw);
  if (!Number.isFinite(cleanTotal) || cleanTotal <= 0 || !Number.isFinite(cleanRaw) || cleanRaw <= 0) {
    return 0;
  }
  const equiv40 = (Math.min(cleanRaw, cleanTotal) / cleanTotal) * 40 + 1e-9;
  const table = skill === 'listening' ? LISTENING_40_THRESHOLDS : ACADEMIC_READING_40_THRESHOLDS;
  for (const [minRaw, band] of table) {
    if (equiv40 >= minRaw) return band;
  }
  return 1.0;
}

function roundIeltsBandServer(score) {
  const num = Number(score);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(9.0, Math.round((num + 1e-9) * 2) / 2);
}

function isObjectiveAnswerCorrectServer(question, userRaw) {
  const normalizedUser = String(userRaw ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const normalizedKey = String(question?.correctAnswer ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalizedUser || !normalizedKey) return false;
  if (question?.type === 'mcq' || question?.type === 'tfng' || !/[|/]/.test(normalizedKey)) {
    return normalizedUser === normalizedKey;
  }
  const acceptedVariants = normalizedKey
    .split(/[|/]/)
    .map(part => part.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
  return acceptedVariants.includes(normalizedUser);
}

function evaluateObjectiveScoresForAttempt(test, answers = {}) {
  if (!test || typeof test !== 'object') return null;
  const cfgMode = test.testMode === 'single_skill' ? 'single_skill' : 'full_exam';
  const focusSkill = cfgMode === 'single_skill' ? (test.focusSkill || 'reading') : null;
  const scores = {};

  if (cfgMode !== 'single_skill' || focusSkill === 'listening') {
    const qs = Array.isArray(test.listening?.questions) ? test.listening.questions : [];
    const raw = qs.reduce((acc, q) => (isObjectiveAnswerCorrectServer(q, answers?.[q.id]) ? acc + 1 : acc), 0);
    scores.listening = {
      raw,
      total: qs.length,
      band: calculateAutoBandServer(raw, qs.length, 'listening')
    };
  }

  if (cfgMode !== 'single_skill' || focusSkill === 'reading') {
    const qs = Array.isArray(test.reading?.questions) ? test.reading.questions : [];
    const raw = qs.reduce((acc, q) => (isObjectiveAnswerCorrectServer(q, answers?.[q.id]) ? acc + 1 : acc), 0);
    scores.reading = {
      raw,
      total: qs.length,
      band: calculateAutoBandServer(raw, qs.length, 'reading')
    };
  }

  let overallBand = null;
  let teacherGraded = false;
  if (cfgMode === 'single_skill' && (focusSkill === 'listening' || focusSkill === 'reading')) {
    overallBand = scores[focusSkill]?.band ?? 0;
    teacherGraded = true;
  } else if (cfgMode !== 'single_skill') {
    teacherGraded = false;
    overallBand = null;
  }

  return { scores, overallBand, teacherGraded, roundIeltsBandServer };
}

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
  const store = {
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
    _authSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    _rateLimits: new Map(),
    _audioDir: audioDir,
    _audioMem: new Map()
  };
  ensureProtectedAccounts(store);
  return store;
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
          if (typeof parsed._authSecret === 'string' && parsed._authSecret.length >= 32) {
            store._authSecret = parsed._authSecret;
          }
        }
      }
    } catch {
      // Fall back cleanly to a fresh in-memory store if state file is corrupt or unreadable
    }
  }
  ensureProtectedAccounts(store);

  let writeTimer = null;
  const schedulePersist = () => {
    if (!persistFile) return;
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      writeTimer = null;
      try {
        fs.mkdirSync(path.dirname(persistFile), { recursive: true });
        const tmpFile = `${persistFile}.tmp`;
        const { _audioDir, _audioMem, _rateLimits, ...serializableStore } = store;
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

function getSnapshotForViewer(store, viewer = null) {
  pruneExpiredStoreChats(store, Date.now());
  const basePayload = {
    authenticated: Boolean(viewer),
    version: store.version,
    seeded: store.seeded,
    serverTime: Date.now(),
    aiConfigured: Boolean(getEffectiveGeminiKey(store))
  };

  if (!viewer) {
    return {
      ...basePayload,
      deletedUserIds: [],
      rooms: {},
      tests: [],
      attempts: [],
      teacherNotes: {},
      users: {},
      customVocabTopics: []
    };
  }

  const sanitizedUsers = {};
  Object.entries(store.users || {}).forEach(([uname, u]) => {
    const clean = sanitizeUserForViewer(u, viewer);
    if (clean) sanitizedUsers[uname] = clean;
  });

  if (viewer.role === 'teacher') {
    const sanitizedRooms = {};
    Object.entries(store.rooms || {}).forEach(([pin, r]) => {
      sanitizedRooms[pin] = r;
    });
    return {
      ...basePayload,
      deletedUserIds: (store.deletedUserIds || []).filter(id => id !== SUPER_ADMIN_USERNAME),
      rooms: sanitizedRooms,
      tests: store.tests || [],
      attempts: store.attempts || [],
      teacherNotes: store.teacherNotes || {},
      users: sanitizedUsers,
      customVocabTopics: store.customVocabTopics || []
    };
  }

  // Strict student view: hide private tests, strip keys before viewing answers allowed, redact peer details & room passwords
  const viewerAttempts = (store.attempts || []).filter(
    a => a.studentId === viewer.username || a.studentUsername === viewer.username
  );
  const submittedTestIds = new Set(viewerAttempts.map(a => a.testId).filter(Boolean));

  const studentTests = (store.tests || [])
    .filter(t => (t?.visibility || 'public') !== 'private')
    .map(t => {
      const canSeeKeys = Boolean(t?.allowViewAnswers) && submittedTestIds.has(t.id);
      return canSeeKeys ? t : stripAnswerKeysFromTest(t);
    });

  const studentAttempts = (store.attempts || []).map(att => {
    const isMine = att.studentId === viewer.username || att.studentUsername === viewer.username;
    return isMine ? att : sanitizeAttemptForPeer(att);
  });

  const studentRooms = {};
  Object.entries(store.rooms || {}).forEach(([pin, r]) => {
    if (!r) return;
    const { pass: _hiddenPass, ...rest } = r;
    studentRooms[pin] = { ...rest, hasPassword: Boolean(_hiddenPass) };
  });

  const myNote = store.teacherNotes?.[viewer.username];

  return {
    ...basePayload,
    deletedUserIds: [],
    rooms: studentRooms,
    tests: studentTests,
    attempts: studentAttempts,
    teacherNotes: myNote !== undefined ? { [viewer.username]: myNote } : {},
    users: sanitizedUsers,
    customVocabTopics: store.customVocabTopics || []
  };
}

function authorizeSyncAction(store, type, payload = {}, viewer = null) {
  if (type === 'SEED_DEFAULTS') {
    if (!store.seeded) return { allowed: true };
    // After initial seed, only authenticated users can append newly tagged seed tests
    if (!viewer) return { allowed: false, status: 401, error: 'Vui lòng đăng nhập để đồng bộ.' };
    return { allowed: true };
  }

  if (!viewer) {
    return { allowed: false, status: 401, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };
  }

  const isTeacher = viewer.role === 'teacher';
  const isSuperAdmin = Boolean(viewer.isSuperAdmin && viewer.username === SUPER_ADMIN_USERNAME);

  const teacherOnlyActions = new Set([
    'UPSERT_ROOM',
    'CLEAR_LOBBY_CHAT',
    'START_GAME',
    'FINISH_ROOM_MATCH',
    'KICK_LOBBY_PLAYER',
    'DELETE_ROOM',
    'RESET_LOBBY',
    'UPSERT_TEST',
    'DELETE_TEST',
    'TOGGLE_TEST_ANSWERS',
    'TOGGLE_TEST_VISIBILITY',
    'DELETE_ATTEMPT',
    'UPSERT_NOTE',
    'UPSERT_VOCAB_TOPIC',
    'DELETE_VOCAB_TOPIC',
    'SET_AI_CONFIG'
  ]);

  if (teacherOnlyActions.has(type)) {
    if (!isTeacher) {
      return { allowed: false, status: 403, error: 'Chỉ Giáo viên mới có quyền thực hiện thao tác này.' };
    }
    return { allowed: true };
  }

  switch (type) {
    case 'RESET_USER_PASSWORD': {
      const targetUsername = String(payload?.username || '').trim();
      const targetUser = store.users?.[targetUsername];
      if (!targetUsername || !targetUser) {
        return { allowed: false, status: 404, error: 'Không tìm thấy tài khoản.' };
      }
      if (!isTeacher) {
        return { allowed: false, status: 403, error: 'Không có quyền đặt lại mật khẩu.' };
      }
      if ((targetUser.isSuperAdmin || targetUsername === SUPER_ADMIN_USERNAME) && !isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Không có quyền thao tác trên tài khoản Quản trị hệ thống.' };
      }
      if (targetUser.role === 'teacher' && targetUsername !== viewer.username && !isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Chỉ Quản trị hệ thống mới có thể đổi mật khẩu của tài khoản Giáo viên khác.' };
      }
      return { allowed: true };
    }

    case 'DELETE_USER': {
      if (!isTeacher) {
        return { allowed: false, status: 403, error: 'Chỉ Giáo viên mới được xóa tài khoản.' };
      }
      const targetUsername = String(payload?.username || '').trim();
      const targetUser = store.users?.[targetUsername];
      if (!targetUsername || targetUsername === SUPER_ADMIN_USERNAME || targetUser?.isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Không thể xóa tài khoản Quản trị hệ thống.' };
      }
      if (targetUsername === viewer.username) {
        return { allowed: false, status: 403, error: 'Không thể tự xóa tài khoản đang đăng nhập.' };
      }
      return { allowed: true };
    }

    case 'UPSERT_USER': {
      const uname = String(payload?.username || payload?.user?.username || '').trim();
      if (!uname || !payload?.user) {
        return { allowed: false, status: 400, error: 'Thiếu thông tin tài khoản.' };
      }
      const targetExisting = store.users?.[uname];
      if ((targetExisting?.isSuperAdmin || uname === SUPER_ADMIN_USERNAME) && !isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Không thể chỉnh sửa tài khoản Quản trị hệ thống.' };
      }
      if (!isTeacher) {
        if (uname !== viewer.username) {
          return { allowed: false, status: 403, error: 'Học viên không được phép sửa tài khoản người khác.' };
        }
        if (payload.user.role === 'teacher' || payload.user.isSuperAdmin) {
          return { allowed: false, status: 403, error: 'Không có quyền nâng cấp vai trò tài khoản.' };
        }
        return { allowed: true };
      }
      return { allowed: true };
    }

    case 'UPSERT_ATTEMPT': {
      const att = payload?.attempt;
      if (!att?.id) return { allowed: false, status: 400, error: 'Thiếu thông tin bài làm.' };
      if (!isTeacher) {
        const existingAtt = (store.attempts || []).find(a => a.id === att.id);
        if (existingAtt && existingAtt.studentId !== viewer.username) {
          return { allowed: false, status: 403, error: 'Không được phép sửa bài nộp của học viên khác.' };
        }
        if (existingAtt?.teacherGraded) {
          return { allowed: false, status: 403, error: 'Bài đã chấm điểm không thể tự ý chỉnh sửa.' };
        }
        const test = (store.tests || []).find(t => t.id === att.testId);
        if (test && Number(test.maxAttempts) > 0 && !existingAtt) {
          const prevCount = (store.attempts || []).filter(
            a => a.testId === test.id && (a.studentId === viewer.username || a.studentUsername === viewer.username)
          ).length;
          if (prevCount >= Number(test.maxAttempts)) {
            return { allowed: false, status: 403, error: `Bạn đã dùng hết ${test.maxAttempts} lượt làm bài thi này.` };
          }
        }
      }
      return { allowed: true };
    }

    case 'JOIN_LOBBY': {
      const cleanPin = String(payload?.pin || '').trim();
      const room = store.rooms?.[cleanPin];
      if (!cleanPin || !room) {
        return { allowed: false, status: 404, error: 'Không tìm thấy phòng đấu.' };
      }
      if (!isTeacher) {
        if (payload?.player?.username && payload.player.username !== viewer.username) {
          return { allowed: false, status: 403, error: 'Không thể vào phòng dưới tên người khác.' };
        }
        const alreadyIn = Boolean(room.lobbyPlayers?.[viewer.username]);
        if (!alreadyIn && room.pass && String(payload?.roomPass || '').trim() !== String(room.pass).trim()) {
          return { allowed: false, status: 403, error: 'Mật khẩu phòng không chính xác.' };
        }
      }
      return { allowed: true };
    }

    case 'UPDATE_LOBBY_PLAYER':
    case 'LEAVE_LOBBY':
    case 'UPDATE_LIVE_SCORE':
    case 'UPDATE_SCORE': {
      const targetUname = payload?.username;
      if (!isTeacher && targetUname && targetUname !== viewer.username) {
        return { allowed: false, status: 403, error: 'Không thể thao tác dữ liệu game của người chơi khác.' };
      }
      return { allowed: true };
    }

    case 'SEND_LOBBY_CHAT': {
      const msgUname = payload?.message?.username;
      if (!isTeacher && msgUname && msgUname !== viewer.username) {
        return { allowed: false, status: 403, error: 'Không thể gửi tin nhắn dưới danh nghĩa người khác.' };
      }
      return { allowed: true };
    }

    default:
      return { allowed: false, status: 400, error: 'Yêu cầu đồng bộ không hợp lệ.' };
  }
}

function applySyncAction(store, type, payload = {}, viewer = null) {
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
          Object.entries(payload.users).forEach(([uname, u]) => {
            if (!u || uname === SUPER_ADMIN_USERNAME) return;
            const clean = { ...u };
            if (clean.pass && !clean.passwordHash) {
              clean.passwordHash = hashPassword(clean.pass);
            }
            delete clean.pass;
            delete clean.isSuperAdmin;
            delete clean.hiddenFromTeacher;
            clean.tokenVersion = clean.tokenVersion || 1;
            store.users[uname] = clean;
          });
        }
        if (Array.isArray(payload.customVocabTopics)) {
          store.customVocabTopics = payload.customVocabTopics.filter(t => t?.id && t?.label && typeof t?.text === 'string');
        }
        ensureProtectedAccounts(store);
        store.seeded = true;
        changed = true;
      } else {
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
      let attempt = payload.attempt;
      if (!attempt?.id) break;
      const isTeacher = viewer?.role === 'teacher';
      if (!isTeacher && viewer) {
        const testObj = (store.tests || []).find(t => t.id === attempt.testId);
        const serverObjEval = evaluateObjectiveScoresForAttempt(testObj, attempt.answers || {});
        const isSpeakingMode = attempt.testMode === 'single_skill' && attempt.focusSkill === 'speaking';
        const validTicket = isSpeakingMode && attempt.aiGradingTicket
          ? verifyToken(attempt.aiGradingTicket, store._authSecret)
          : null;
        const ticketOk = Boolean(
          validTicket &&
          validTicket.kind === 'speaking_eval' &&
          validTicket.username === viewer.username &&
          validTicket.testTitle === attempt.testTitle
        );

        let sanitizedScores = {
          listening: attempt.scores?.listening || { raw: 0, total: 0, band: null },
          reading: attempt.scores?.reading || { raw: 0, total: 0, band: null },
          writing: { task1Band: null, task2Band: null, overallBand: null }
        };
        let finalOverallBand = null;
        let finalTeacherGraded = false;
        let finalAiGraded = false;
        let finalFeedback = '';

        if (serverObjEval) {
          if (serverObjEval.scores.listening) sanitizedScores.listening = serverObjEval.scores.listening;
          if (serverObjEval.scores.reading) sanitizedScores.reading = serverObjEval.scores.reading;
          finalOverallBand = serverObjEval.overallBand;
          finalTeacherGraded = serverObjEval.teacherGraded;
        }

        if (isSpeakingMode && ticketOk && typeof validTicket.band === 'number') {
          sanitizedScores = {
            ...sanitizedScores,
            speaking: { band: validTicket.band, criteria: validTicket.criteria || {} }
          };
          finalOverallBand = validTicket.band;
          finalTeacherGraded = true;
          finalAiGraded = true;
          finalFeedback = typeof validTicket.overallFeedback === 'string' ? validTicket.overallFeedback : '';
        }

        attempt = {
          ...attempt,
          studentId: viewer.username,
          studentName: viewer.name || attempt.studentName,
          scores: sanitizedScores,
          overallBand: finalOverallBand,
          teacherGraded: finalTeacherGraded,
          aiGraded: finalAiGraded,
          teacherFeedback: finalFeedback
        };
        delete attempt.aiGradingTicket;
      }

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

    case 'RESET_USER_PASSWORD': {
      const uname = String(payload.username || '').trim();
      const nextPass = String(payload.password || '').trim();
      const target = store.users?.[uname];
      if (!uname || !target || !nextPass) break;
      const updated = {
        ...target,
        passwordHash: hashPassword(nextPass),
        tokenVersion: (target.tokenVersion || 1) + 1
      };
      delete updated.pass;
      store.users[uname] = updated;
      changed = true;
      break;
    }

    case 'UPSERT_USER': {
      const uname = String(payload.username || payload.user?.username || '').trim();
      if (!uname || !payload.user) break;
      const prevUser = store.users?.[uname];
      const isTeacher = viewer?.role === 'teacher';
      const isSuperAdmin = Boolean(viewer?.isSuperAdmin && viewer.username === SUPER_ADMIN_USERNAME);

      if (!isTeacher && prevUser) {
        // Student may only update non-privilege profile fields on own account
        const cleanSelf = {
          ...prevUser,
          name: typeof payload.user.name === 'string' && payload.user.name.trim() ? payload.user.name.trim() : prevUser.name,
          avatarUrl: payload.user.avatarUrl ?? prevUser.avatarUrl,
          targetBand: payload.user.targetBand ?? prevUser.targetBand,
          studyGoal: payload.user.studyGoal ?? prevUser.studyGoal
        };
        store.users[uname] = cleanSelf;
      } else {
        const incoming = { ...payload.user, username: uname };
        if (incoming.pass && String(incoming.pass).trim()) {
          incoming.passwordHash = hashPassword(String(incoming.pass).trim());
        } else if (prevUser?.passwordHash) {
          incoming.passwordHash = prevUser.passwordHash;
        }
        delete incoming.pass;
        incoming.tokenVersion = prevUser?.tokenVersion || 1;
        if (uname === SUPER_ADMIN_USERNAME && isSuperAdmin) {
          incoming.isSuperAdmin = true;
          incoming.hiddenFromTeacher = true;
          incoming.role = 'teacher';
        } else {
          delete incoming.isSuperAdmin;
          delete incoming.hiddenFromTeacher;
          incoming.role = incoming.role === 'teacher' ? 'teacher' : 'student';
        }
        store.deletedUserIds = store.deletedUserIds.filter(id => id !== uname);
        store.users[uname] = incoming;
      }

      const savedUser = store.users[uname];
      // Propagate updated avatarUrl & display name into any active room lobbies / live races
      Object.entries(store.rooms).forEach(([_pin, r]) => {
        if (r?.lobbyPlayers?.[uname]) {
          r.lobbyPlayers[uname] = {
            ...r.lobbyPlayers[uname],
            name: savedUser.name || r.lobbyPlayers[uname].name,
            avatarUrl: savedUser.avatarUrl ?? r.lobbyPlayers[uname].avatarUrl
          };
        }
        if (r?.liveMatch?.[uname]) {
          r.liveMatch[uname] = {
            ...r.liveMatch[uname],
            name: savedUser.name || r.liveMatch[uname].name,
            avatarUrl: savedUser.avatarUrl ?? r.liveMatch[uname].avatarUrl
          };
        }
      });
      changed = true;
      break;
    }

    case 'DELETE_USER': {
      const uname = payload.username;
      if (!uname || uname === SUPER_ADMIN_USERNAME || store.users?.[uname]?.isSuperAdmin) break;
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
  const sseClientUsers = new WeakMap();
  const broadcast = () => {
    for (const res of sseClients) {
      try {
        const uname = sseClientUsers.get(res);
        const viewer = uname ? store.users?.[uname] || null : null;
        const dataStr = `event: sync\ndata: ${JSON.stringify(getSnapshotForViewer(store, viewer))}\n\n`;
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
    const viewer = resolveSessionUser(req, store);

    if (req.method === 'POST' && reqUrl === '/auth/login') {
      try {
        const body = await readJsonBody(req);
        const username = String(body?.username || '').trim();
        const password = String(body?.password || '').trim();
        const ip = getClientIp(req);

        if (!checkRateLimit(store._rateLimits, `login:${ip}:${username}`)) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Thử đăng nhập sai quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.' }));
          return;
        }

        const user = username ? store.users?.[username] : null;
        if (!user || !verifyPassword(password, user)) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Sai tên đăng nhập hoặc mật khẩu!' }));
          return;
        }

        const token = signToken(
          {
            username: user.username,
            role: user.role,
            isSuperAdmin: Boolean(user.isSuperAdmin),
            tokenVersion: user.tokenVersion || 1,
            exp: Date.now() + SESSION_TTL_MS
          },
          store._authSecret
        );
        res.setHeader('Set-Cookie', buildSessionCookieHeader(req, token, SESSION_TTL_MS / 1000));
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: true,
            user: sanitizeUserForViewer(user, user),
            snapshot: getSnapshotForViewer(store, user)
          })
        );
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Đăng nhập thất bại.' }));
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/auth/logout') {
      res.setHeader('Set-Cookie', buildSessionCookieHeader(req, '', 0));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === 'GET' && reqUrl === '/auth/session') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          authenticated: Boolean(viewer),
          user: viewer ? sanitizeUserForViewer(viewer, viewer) : null,
          snapshot: getSnapshotForViewer(store, viewer)
        })
      );
      return;
    }

    if (req.method === 'POST' && reqUrl === '/game/join') {
      if (!viewer) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để tham gia phòng đấu.' }));
        return;
      }
      try {
        const body = await readJsonBody(req);
        const cleanPin = String(body?.pin || '').trim();
        const cleanPass = String(body?.pass || '').trim();
        const ip = getClientIp(req);
        if (!checkRateLimit(store._rateLimits, `room:${ip}:${viewer.username}`, 25, 5 * 60 * 1000)) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Nhập sai mã/mật khẩu phòng quá nhiều lần. Vui lòng đợi lát nữa.' }));
          return;
        }
        const targetRoom = cleanPin ? store.rooms?.[cleanPin] : null;
        if (!targetRoom) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: `Không tìm thấy phòng "${cleanPin}". Hãy kiểm tra lại mã phòng.` }));
          return;
        }
        const normRoom = normalizeServerRoom(targetRoom, cleanPin);
        if (normRoom.status === 'ENDED') {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Phòng đấu này đã kết thúc. Vui lòng xin mã phòng mới.' }));
          return;
        }
        if (viewer.role !== 'teacher' && normRoom.pass && String(normRoom.pass).trim() !== cleanPass) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Mật khẩu phòng không chính xác. Vui lòng thử lại.' }));
          return;
        }
        const alreadyJoined = Boolean(normRoom.lobbyPlayers?.[viewer.username]);
        if (normRoom.status === 'PLAYING' && !alreadyJoined && viewer.role !== 'teacher') {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Trận đấu đang diễn ra! Hãy bảo Giáo viên bấm Mở Sảnh Mới.' }));
          return;
        }

        const pilot = body?.pilot || {};
        const existingPlayer = normRoom.lobbyPlayers?.[viewer.username];
        normRoom.lobbyPlayers[viewer.username] = {
          ...(existingPlayer || {}),
          username: viewer.username,
          name: viewer.name || viewer.username,
          role: viewer.role,
          colorId: pilot.colorId || existingPlayer?.colorId || 'cyan',
          animalId: pilot.animalId || existingPlayer?.animalId || 'cat',
          accessoryId: pilot.accessoryId || existingPlayer?.accessoryId || 'crown',
          avatarUrl: viewer.avatarUrl || '',
          ready: viewer.role === 'teacher' ? true : Boolean(existingPlayer?.ready),
          chat: existingPlayer?.chat || '',
          chatAt: existingPlayer?.chatAt || 0,
          joinedAt: existingPlayer?.joinedAt || Date.now()
        };
        store.rooms[cleanPin] = normRoom;
        store.version += 1;
        onChanged?.(store);
        broadcast();

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, room: getSnapshotForViewer(store, viewer).rooms[cleanPin], snapshot: getSnapshotForViewer(store, viewer) }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Không thể vào phòng.' }));
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/audio') {
      if (!viewer) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để tải file ghi âm.' }));
        return;
      }
      try {
        const body = await readJsonBody(req);
        if (!body?.dataBase64) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Missing audio data' }));
          return;
        }
        const rawMime = String(body.mimeType || '').split(';')[0].trim().toLowerCase();
        if (rawMime && !ALLOWED_AUDIO_MIMES.has(rawMime)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Định dạng audio không hợp lệ.' }));
          return;
        }
        const cleanMime = cleanAudioMimeType(body.mimeType);
        if (!ALLOWED_AUDIO_MIMES.has(cleanMime.split(';')[0])) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Định dạng audio không hợp lệ.' }));
          return;
        }
        const rawB64 = String(body.dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
        const approxBytes = Math.ceil((rawB64.length * 3) / 4);
        if (approxBytes > MAX_AUDIO_UPLOAD_BYTES) {
          res.statusCode = 413;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'File ghi âm vượt quá giới hạn 15MB.' }));
          return;
        }
        const meta = saveAudioRecord(store, { ...body, username: viewer.username });
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
      if (!viewer) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để nghe audio.' }));
        return;
      }
      const rawId = decodeURIComponent(reqUrl.slice('/audio/'.length));
      const record = loadAudioRecord(store, rawId);
      if (!record) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Audio recording not found' }));
        return;
      }
      if (viewer.role !== 'teacher' && record.meta?.username && record.meta.username !== viewer.username) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Bạn không có quyền truy cập bản ghi âm này.' }));
        return;
      }
      const totalLen = record.buffer.length;
      const rawStoredMime = String(record.meta?.mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
      const mime = ALLOWED_AUDIO_MIMES.has(rawStoredMime) ? rawStoredMime : 'audio/webm';
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', mime);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=3600');

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
      if (!viewer) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để sử dụng AI chấm Speaking.' }));
        return;
      }
      try {
        const body = await readJsonBody(req);
        const recordings = Array.isArray(body?.recordings) ? body.recordings : [];
        const testTitle = body?.testTitle || 'IELTS Speaking Test';
        const partMode = body?.partMode || 'full';
        const clientOverrideKey = viewer.role === 'teacher' ? (body?.clientApiKey || '') : '';
        const effectiveKey = getEffectiveGeminiKey(store, clientOverrideKey);

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

        const aiGradingTicket = signToken(
          {
            kind: 'speaking_eval',
            username: viewer.username,
            testTitle,
            band: evaluation.overallBand,
            criteria: evaluation.criteria || {},
            overallFeedback: evaluation.overallFeedback || '',
            exp: Date.now() + 30 * 60 * 1000
          },
          store._authSecret
        );

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, evaluation: { ...evaluation, aiGradingTicket } }));
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
      res.end(JSON.stringify(getSnapshotForViewer(store, viewer)));
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
      sseClientUsers.set(res, viewer?.username || null);
      res.write(`event: sync\ndata: ${JSON.stringify(getSnapshotForViewer(store, viewer))}\n\n`);

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
        const authCheck = authorizeSyncAction(store, body.type, body.payload, viewer);
        if (!authCheck.allowed) {
          res.statusCode = authCheck.status || 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: authCheck.error || 'Không có quyền thực hiện.' }));
          return;
        }
        const changed = applySyncAction(store, body.type, body.payload, viewer);
        if (changed) {
          onChanged?.(store);
          broadcast();
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, snapshot: getSnapshotForViewer(store, viewer) }));
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
