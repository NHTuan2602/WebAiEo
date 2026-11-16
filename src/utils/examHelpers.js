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
  const headers = ['Học viên', 'Tài khoản', 'Đề thi', 'Phân loại', 'Ngày nộp', 'Listening', 'Reading', 'Writing', 'Speaking', 'Overall', 'Chuyển Tab', 'Trạng thái'];
  const csvEscape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(csvEscape).join(','),
    ...attemptRows.map(att => {
      const lBand = att.scores?.listening?.band ?? '-';
      const rBand = att.scores?.reading?.band ?? '-';
      const wBand = att.scores?.writing?.overallBand ?? '-';
      const sBand = att.scores?.speaking?.band ?? '-';
      const overall = att.overallBand ?? '-';
      const modeTag = att.testMode === 'single_skill' ? `Kỹ năng: ${(att.focusSkill || '').toUpperCase()}` : 'Đề Gộp L·R·W';
      const statusLabel = att.teacherGraded ? (att.aiGraded ? 'AI Đã Chấm' : 'GV Đã Chấm') : 'Chờ Chấm';
      return [
        att.studentName || '',
        att.studentId || '',
        att.testTitle || '',
        modeTag,
        att.submittedAt || '',
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
    const username = (parts[0] || '').trim().replace(/\s+/g, '_');
    const name = (parts[1] || username).trim();
    const pass = (parts[2] || '123').trim();
    const rawBand = parseFloat((parts[3] || '7.0').trim());
    const targetBand = Number.isFinite(rawBand)
      ? Math.min(9.0, Math.max(4.0, Math.round(rawBand * 2) / 2))
      : 7.0;
    return { username, name, pass, targetBand };
  }).filter(u => u.username && u.pass);
}

export function parseRawVocabText(rawText) {
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
    item.distractors = pool.sort(() => Math.random() - 0.5).slice(0, 4);
  });

  return parsedItems;
}

export function compressAvatarImageFile(file, targetSize = 160) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Không thể xử lý định dạng ảnh này.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
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
    startedAt: room?.startedAt || null,
    lobbyPlayers: prunedChat.lobbyPlayers,
    liveMatch: room?.liveMatch || {},
    chatMessages: prunedChat.chatMessages,
    chatCycleStartedAt: prunedChat.chatCycleStartedAt,
    rawVocab: room?.rawVocab || DEFAULT_VOCAB_TEXT,
    players: room?.players || {}
  };
}
