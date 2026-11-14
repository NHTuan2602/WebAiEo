import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  DEFAULT_VOCAB_TEXT,
  FALLBACK_DISTRACTORS,
  GAME_ROUND_TIME_LIMITS,
  GAME_SPEED_OFFSETS
} from '../constants/seedData';

export function calculateAutoBand(raw, total) {
  if (total === 0) return 0;
  const percentage = raw / total;
  if (percentage >= 0.9) return 9.0;
  if (percentage >= 0.8) return 8.0;
  if (percentage >= 0.7) return 7.0;
  if (percentage >= 0.6) return 6.5;
  if (percentage >= 0.5) return 6.0;
  if (percentage >= 0.4) return 5.5;
  if (percentage >= 0.3) return 5.0;
  return 4.0;
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

export function roundIeltsBand(score) {
  return Math.round(score * 2) / 2;
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
  const headers = ['Học viên', 'Tài khoản', 'Đề thi', 'Ngày nộp', 'Listening', 'Reading', 'Writing', 'Overall', 'Chuyển Tab', 'Trạng thái'];
  const csvEscape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(csvEscape).join(','),
    ...attemptRows.map(att => {
      const lBand = att.scores?.listening?.band ?? '-';
      const rBand = att.scores?.reading?.band ?? '-';
      const wBand = att.scores?.writing?.overallBand ?? '-';
      const overall = att.overallBand ?? '-';
      const statusLabel = att.teacherGraded ? (att.aiGraded ? 'AI Đã Chấm' : 'GV Đã Chấm') : 'Chờ Chấm Writing';
      return [
        att.studentName || '',
        att.studentId || '',
        att.testTitle || '',
        att.submittedAt || '',
        lBand,
        rBand,
        wBand,
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
  link.download = `lexiprep-bang-diem-${new Date().toISOString().slice(0, 10)}.csv`;
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

export function normalizeRoomObject(room, pinKey) {
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
    lobbyPlayers: room?.lobbyPlayers || {},
    liveMatch: room?.liveMatch || {},
    chatMessages: Array.isArray(room?.chatMessages) ? room.chatMessages.slice(-50) : [],
    rawVocab: room?.rawVocab || DEFAULT_VOCAB_TEXT,
    players: room?.players || {}
  };
}
