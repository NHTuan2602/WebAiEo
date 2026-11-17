import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  DEFAULT_VOCAB_TEXT,
  FALLBACK_DISTRACTORS,
  GAME_ROUND_TIME_LIMITS,
  GAME_SPEED_OFFSETS
} from '../constants/seedData';

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

/**
 * Convert raw objective score to official IELTS 0.0 - 9.0 band scale (in 0.5 steps).
 * Returns 0 when 0 answers are correct (did not attempt / blank submission).
 */
export function calculateAutoBand(raw, total, skill = 'reading') {
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

/** Round an IELTS score to the nearest 0.5 band (.25 -> .5, .75 -> next integer). */
export function roundIeltsBand(score) {
  const num = Number(score);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(9.0, Math.round((num + 1e-9) * 2) / 2);
}

/** Generate a collision-free attempt ID across concurrent multi-student submissions. */
export function createUniqueAttemptId(prefix = 'att', username = 'std') {
  const cleanPrefix = String(prefix || 'att').replace(/[^a-zA-Z0-9_-]/g, '') || 'att';
  const cleanUser = String(username || 'std').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'std';
  const rand =
    typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${cleanPrefix}-${cleanUser}-${Date.now()}-${rand}`;
}

/** Compute official IELTS Writing band (Task 2 weighted 2x Task 1, rounded to 0.5). */
export function calculateWritingBand(task1Band, task2Band) {
  const t1 = Math.min(9.0, Math.max(0, Number(task1Band) || 0));
  const t2 = Math.min(9.0, Math.max(0, Number(task2Band) || 0));
  if (t1 === 0 && t2 === 0) return 0;
  return roundIeltsBand((t1 + t2 * 2) / 3);
}

/** Compute official IELTS Overall band from active tested skill bands (rounded to 0.5). */
export function calculateOverallIeltsBand(skillBands = []) {
  const valid = skillBands
    .map(b => Number(b))
    .filter(b => Number.isFinite(b) && b >= 0);
  if (valid.length === 0) return 0;
  const avg = valid.reduce((sum, b) => sum + Math.min(9.0, b), 0) / valid.length;
  return roundIeltsBand(avg);
}

export function countExtensionCheatSignals(antiCheatLogs = []) {
  if (!Array.isArray(antiCheatLogs)) return 0;
  return antiCheatLogs.filter(l => l?.category === 'extension' || l?.severity === 'high').length;
}

export function getRiskAssessment(tabSwitchCount = 0, antiCheatLogs = []) {
  const extCount = countExtensionCheatSignals(antiCheatLogs);
  if (extCount > 0 || tabSwitchCount >= 3) {
    return {
      label: extCount > 0 ? 'Phát hiện lách luật / Extension' : 'Gian lận cao',
      color: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
      icon: ShieldAlert
    };
  }
  if (tabSwitchCount === 0 && (!Array.isArray(antiCheatLogs) || antiCheatLogs.length === 0)) {
    return { label: 'An toàn', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle };
  }
  return { label: 'Nghi vấn nhẹ', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', icon: AlertTriangle };
}

export function getWordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getSpeedAdjustedTimeLimit(roundNum, speedMode = 'normal') {
  const base = GAME_ROUND_TIME_LIMITS[roundNum] || 20;
  const offset = GAME_SPEED_OFFSETS[speedMode] ?? 0;
  return Math.max(8, base + offset);
}

// Shared answer checker supporting multi-variant IELTS fill-in-the-blank keys (e.g. "15 | fifteen" or "color / colour")
export function isObjectiveAnswerCorrect(question, userRaw) {
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

export function buildRoomInviteLink(pin) {
  const cleanPin = String(pin || '').trim();
  if (!cleanPin || typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('pin', cleanPin);
  return url.toString();
}

export function exportAttemptsToCsv(attemptRows = []) {
  const headers = ['Học viên', 'Tài khoản', 'Đề thi', 'Phân loại', 'Bắt đầu lúc', 'Ngày nộp', 'Thời lượng (giây)', 'Trạng thái hạn', 'Listening', 'Reading', 'Writing', 'Speaking', 'Overall', 'Chuyển Tab', 'Trạng thái'];
  const csvEscape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(csvEscape).join(','),
    ...attemptRows.map(att => {
      const lBand = att.scores?.listening?.band ?? '-';
      const rBand = att.scores?.reading?.band ?? '-';
      const wBand = att.scores?.writing?.overallBand ?? '-';
      const sBand = att.scores?.speaking?.band ?? '-';
      const overall = att.overallBand ?? '-';
      const modeTag = att.testMode === 'single_skill' ? `Bài tập ${(att.focusSkill || '').toUpperCase()}` : 'Đề Thi IELTS';
      const statusLabel = att.teacherGraded ? (att.aiGraded ? 'AI Đã Chấm' : 'GV Đã Chấm') : 'Chờ Chấm';
      const timelinessLabel = att.timelinessStatus === 'late'
        ? `Nộp muộn${att.lateByMinutes ? ` (${att.lateByMinutes}p)` : ''}`
        : att.timelinessStatus === 'on_time'
        ? 'Đúng hạn'
        : 'Tự do';
      return [
        att.studentName || '',
        att.studentId || '',
        att.testTitle || '',
        modeTag,
        att.startedAt || '',
        att.submittedAt || '',
        Number(att.durationSeconds) > 0 ? Number(att.durationSeconds) : '',
        timelinessLabel,
        lBand,
        rBand,
        wBand,
        sBand,
        overall,
        att.tabSwitchCount || 0,
        statusLabel
      ].map(csvEscape).join(',');
    })
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = `ielts-nhatrang-msnhu-bang-diem-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export function parseBulkStudentsText(rawText) {
  const lines = String(rawText || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  return lines.map(line => {
    const parts = line.includes('|') ? line.split('|') : line.split(',');
    const username = (parts[0] || '').trim().replace(/^@+/, '').replace(/\s+/g, '_');
    const name = (parts[1] || username).trim();
    const pass = (parts[2] || '123').trim();
    const rawBand = parseFloat((parts[3] || '7.0').trim());
    const targetBand = Number.isFinite(rawBand)
      ? Math.min(9.0, Math.max(4.0, Math.round(rawBand * 2) / 2))
      : 7.0;
    return { username, name, pass, targetBand };
  }).filter(u => u.username && u.pass);
}

function hashStringSeed(seedStr) {
  let h = 2166136261 >>> 0;
  const str = String(seedStr || 'ielts-seed');
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffleArrayWithSeed(items, seedStr) {
  const arr = Array.isArray(items) ? [...items] : [];
  if (arr.length <= 1) return arr;
  let state = hashStringSeed(seedStr) || 1;
  const nextRand = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function parseRawVocabText(rawText, seedStr = null) {
  const lines = String(rawText || '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
  const parsedItems = [];
  const seenWords = new Set();

  lines.forEach(line => {
    let parts;
    if (line.includes('|')) parts = line.split('|');
    else if (line.includes('\t')) parts = line.split('\t');
    else if (line.includes(';')) parts = line.split(';');
    else if (line.includes(':')) parts = line.split(':');
    else return;

    const cleanWord = (parts[0] || '').trim().toUpperCase();
    const cleanPrompt = (parts[1] || '').trim();
    const cleanIpa = (parts[2] || '').trim();
    const cleanExample = (parts[3] || '').trim();

    if (cleanWord && cleanPrompt && !seenWords.has(cleanWord)) {
      seenWords.add(cleanWord);
      parsedItems.push({
        word: cleanWord,
        prompt: cleanPrompt,
        ipa: cleanIpa || '',
        example: cleanExample || `Ghi nhớ cách dùng từ "${cleanWord}" trong bài thi IELTS.`,
        distractors: []
      });
    }
  });

  const allWords = parsedItems.map(item => item.word);
  parsedItems.forEach(item => {
    let pool = allWords.filter(w => w !== item.word);
    for (let fb of FALLBACK_DISTRACTORS) {
      if (pool.length >= 8) break;
      if (fb !== item.word && !pool.includes(fb)) pool.push(fb);
    }
    const orderedPool = seedStr
      ? shuffleArrayWithSeed(pool, `${seedStr}:dist:${item.word}`)
      : [...pool].sort(() => Math.random() - 0.5);
    item.distractors = orderedPool.slice(0, 4);
  });

  return parsedItems;
}

export const MAX_CROP_DATA_URL_LENGTH = 450_000;

export function clampCropZoom(zoom) {
  const num = Number(zoom);
  if (!Number.isFinite(num)) return 1;
  return Math.min(4, Math.max(1, num));
}

export function clampCropPan(pan) {
  const num = Number(pan);
  if (!Number.isFinite(num)) return 0;
  return Math.min(1, Math.max(-1, num));
}

export function normalizeCropRotation(rotation) {
  const num = Number(rotation) || 0;
  const snapped = Math.round(num / 90) * 90;
  return ((snapped % 360) + 360) % 360;
}

export function computeCropLayout(imgWidth, imgHeight, targetWidth, targetHeight, cropOptions = {}) {
  const safeImgW = Math.max(1, Number(imgWidth) || 1);
  const safeImgH = Math.max(1, Number(imgHeight) || 1);
  const safeTargetW = Math.max(1, Number(targetWidth) || 1);
  const safeTargetH = Math.max(1, Number(targetHeight) || 1);

  const rot = normalizeCropRotation(cropOptions.rotation);
  const effW = rot === 90 || rot === 270 ? safeImgH : safeImgW;
  const effH = rot === 90 || rot === 270 ? safeImgW : safeImgH;

  const baseScale = Math.max(safeTargetW / effW, safeTargetH / effH);
  const zoom = clampCropZoom(cropOptions.zoom);
  const scale = baseScale * zoom;

  const drawW = safeImgW * scale;
  const drawH = safeImgH * scale;
  const boundW = effW * scale;
  const boundH = effH * scale;

  const maxOffsetX = Math.max(0, (boundW - safeTargetW) / 2);
  const maxOffsetY = Math.max(0, (boundH - safeTargetH) / 2);
  const panX = clampCropPan(cropOptions.panX);
  const panY = clampCropPan(cropOptions.panY);
  const offsetX = panX * maxOffsetX;
  const offsetY = panY * maxOffsetY;

  return {
    rot,
    effW,
    effH,
    baseScale,
    zoom,
    scale,
    drawW,
    drawH,
    boundW,
    boundH,
    maxOffsetX,
    maxOffsetY,
    panX,
    panY,
    offsetX,
    offsetY,
    centerX: safeTargetW / 2 + offsetX,
    centerY: safeTargetH / 2 + offsetY,
  };
}

export function drawCroppedImageToContext(ctx, img, targetWidth, targetHeight, cropOptions = {}) {
  if (!ctx || !img) return null;
  const imgW = img.naturalWidth || img.width || 1;
  const imgH = img.naturalHeight || img.height || 1;
  const layout = computeCropLayout(imgW, imgH, targetWidth, targetHeight, cropOptions);

  ctx.save();
  ctx.fillStyle = cropOptions.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.translate(layout.centerX, layout.centerY);
  if (layout.rot) {
    ctx.rotate((layout.rot * Math.PI) / 180);
  }
  ctx.drawImage(img, -layout.drawW / 2, -layout.drawH / 2, layout.drawW, layout.drawH);
  ctx.restore();
  return layout;
}

export function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !src) {
      reject(new Error('Không thể xử lý hình ảnh ngoài trình duyệt.'));
      return;
    }
    const img = new window.Image();
    if (!String(src).startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onerror = () => reject(new Error('Không thể xử lý định dạng ảnh này.'));
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function encodeCanvasWithinLimit(canvas, initialQuality = 0.84, maxLength = MAX_CROP_DATA_URL_LENGTH) {
  const candidates = [initialQuality, 0.78, 0.7, 0.6, 0.5]
    .filter((q, idx, arr) => q <= initialQuality && arr.indexOf(q) === idx);
  let lastDataUrl = '';
  for (const q of candidates) {
    lastDataUrl = canvas.toDataURL('image/jpeg', q);
    if (lastDataUrl.length <= maxLength) {
      return lastDataUrl;
    }
  }
  const scaled = document.createElement('canvas');
  scaled.width = Math.max(120, Math.round(canvas.width * 0.8));
  scaled.height = Math.max(120, Math.round(canvas.height * 0.8));
  const sCtx = scaled.getContext('2d');
  if (sCtx) {
    sCtx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
    return scaled.toDataURL('image/jpeg', 0.72);
  }
  return lastDataUrl;
}

export async function exportCroppedImageDataUrl(src, {
  targetWidth = 240,
  targetHeight = 240,
  zoom = 1,
  panX = 0,
  panY = 0,
  rotation = 0,
  initialQuality = 0.85,
} = {}) {
  const img = await loadImageElement(src);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Trình duyệt không hỗ trợ xử lý khung vẽ ảnh.');
  }
  drawCroppedImageToContext(ctx, img, targetWidth, targetHeight, { zoom, panX, panY, rotation });
  try {
    return encodeCanvasWithinLimit(canvas, initialQuality, MAX_CROP_DATA_URL_LENGTH);
  } catch {
    throw new Error('Không thể cắt trực tiếp ảnh từ liên kết ngoài. Vui lòng tải tệp ảnh từ máy lên.');
  }
}

export async function compressAvatarImageFile(file, targetSize = 160) {
  const dataUrl = await readImageFileAsDataUrl(file);
  return exportCroppedImageDataUrl(dataUrl, {
    targetWidth: targetSize,
    targetHeight: targetSize,
    initialQuality: 0.84,
  });
}

export async function compressBannerImageFile(file, targetWidth = 1200, targetHeight = 420) {
  const dataUrl = await readImageFileAsDataUrl(file);
  return exportCroppedImageDataUrl(dataUrl, {
    targetWidth,
    targetHeight,
    initialQuality: 0.82,
  });
}

export const LOBBY_CHAT_RESET_MS = 10 * 60 * 1000;

export function getChatMessageTimestamp(msg) {
  const rawTs = Number(msg?.createdAt ?? msg?.id);
  return Number.isFinite(rawTs) && rawTs > 1_000_000_000_000 ? rawTs : 0;
}

export function pruneExpiredRoomChat(room, now = Date.now()) {
  const rawChats = Array.isArray(room?.chatMessages) ? room.chatMessages : [];
  const baseLobbyPlayers = room?.lobbyPlayers && typeof room.lobbyPlayers === 'object' ? { ...room.lobbyPlayers } : {};

  if (rawChats.length === 0) {
    return { chatMessages: [], chatCycleStartedAt: null, lobbyPlayers: baseLobbyPlayers };
  }

  let cycleStart = Number(room?.chatCycleStartedAt);
  if (!Number.isFinite(cycleStart) || cycleStart <= 1_000_000_000_000) {
    const oldestTs = rawChats.map(getChatMessageTimestamp).find(ts => ts > 0);
    cycleStart = oldestTs || now;
  }

  const resetChatPlayers = (playersMap) => {
    const cleaned = {};
    Object.entries(playersMap).forEach(([uname, p]) => {
      if (!p) return;
      if (p.chat || p.chatAt) {
        cleaned[uname] = { ...p, chat: '', chatAt: null };
      } else {
        cleaned[uname] = p;
      }
    });
    return cleaned;
  };

  if (now - cycleStart >= LOBBY_CHAT_RESET_MS) {
    return {
      chatMessages: [],
      chatCycleStartedAt: null,
      lobbyPlayers: resetChatPlayers(baseLobbyPlayers)
    };
  }

  const validChats = rawChats
    .filter(msg => {
      const ts = getChatMessageTimestamp(msg);
      return ts === 0 || now - ts < LOBBY_CHAT_RESET_MS;
    })
    .slice(-50);

  if (validChats.length === 0) {
    return {
      chatMessages: [],
      chatCycleStartedAt: null,
      lobbyPlayers: resetChatPlayers(baseLobbyPlayers)
    };
  }

  return {
    chatMessages: validChats,
    chatCycleStartedAt: cycleStart,
    lobbyPlayers: baseLobbyPlayers
  };
}

export function normalizeRoomObject(room, pinKey, now = Date.now()) {
  const prunedChat = pruneExpiredRoomChat(room, now);
  return {
    pin: String(room?.pin || pinKey || ''),
    name: room?.name || `Phòng Đấu Từ Vựng #${room?.pin || pinKey}`,
    pass: room?.pass ?? 'ielts',
    teacher: room?.teacher || 'teacher_ielts',
    status: room?.status || 'LOBBY',
    maxPlayers: room?.maxPlayers || 30,
    roundSize: Math.max(2, Math.min(8, Number(room?.roundSize) || 4)),
    speedMode: ['relaxed', 'normal', 'turbo'].includes(room?.speedMode) ? room.speedMode : 'normal',
    shufflePerPlayer: Boolean(room?.shufflePerPlayer),
    startedAt: room?.startedAt || null,
    lobbyPlayers: prunedChat.lobbyPlayers,
    liveMatch: room?.liveMatch || {},
    questionSolves: room?.questionSolves && typeof room.questionSolves === 'object' ? { ...room.questionSolves } : {},
    chatMessages: prunedChat.chatMessages,
    chatCycleStartedAt: prunedChat.chatCycleStartedAt,
    rawVocab: room?.rawVocab || DEFAULT_VOCAB_TEXT,
    players: room?.players || {}
  };
}

export function buildSeededRoundQueues(roomInput, pinKey = '', username = '', fallbackVocab = DEFAULT_VOCAB_TEXT) {
  const room = normalizeRoomObject(roomInput || { rawVocab: fallbackVocab }, pinKey);
  const baseSeed = room.startedAt ? `${room.pin || pinKey}:${room.startedAt}` : `${room.pin || pinKey}:preview`;
  const seed = room.shufflePerPlayer
    ? `${baseSeed}:player:${String(username || 'guest')}`
    : `${baseSeed}:shared`;
  const vocabList = parseRawVocabText(room.rawVocab || fallbackVocab, seed);
  const ordered = shuffleArrayWithSeed(vocabList, `${seed}:words`);
  const total = ordered.length;
  const desiredPerRound = Math.max(2, Math.min(8, Number(room.roundSize) || 4));
  const perRound = Math.max(1, Math.min(desiredPerRound, Math.floor(total / 3) || 1));
  return {
    1: ordered.slice(0, perRound),
    2: ordered.slice(perRound, perRound * 2),
    3: ordered.slice(perRound * 2, perRound * 3)
  };
}
