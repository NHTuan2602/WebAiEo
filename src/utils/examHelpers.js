import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  DEFAULT_VOCAB_TEXT,
  FALLBACK_DISTRACTORS,
  FALLBACK_LEXICAL_POOL,
  GAME_ROUND_TIME_LIMITS,
  GAME_SPEED_OFFSETS,
  VOCAB_LEXICAL_RELATIONS
} from '../constants/seedData.js';
import { isWebpBufferAnimated } from '../constants/profileCustomization.js';

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

/** Round IELTS Writing/Speaking individual criterion band (or Speaking overall) strictly to whole integer 1..9 (0 if empty). */
export function roundWholeBand(score) {
  const num = Number(score);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(9, Math.max(1, Math.round(num)));
}

/** Round IELTS Writing band strictly DOWN to nearest 0.5 step (e.g. 6.66 -> 6.5, 6.25 -> 6.0). */
export function roundDownIeltsHalfBand(score) {
  const num = Number(score);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(9.0, Math.floor((num + 1e-9) * 2) / 2);
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

/** Compute official IELTS Writing band ((Task 1 + Task 2 * 2) / 3, rounded DOWN to nearest 0.5 step). */
export function calculateWritingBand(task1Band, task2Band) {
  const t1 = Math.min(9.0, Math.max(0, Number(task1Band) || 0));
  const t2 = Math.min(9.0, Math.max(0, Number(task2Band) || 0));
  if (t1 === 0 && t2 === 0) return 0;
  return roundDownIeltsHalfBand((t1 + t2 * 2) / 3);
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

// Canonical Reading (11 IELTS formats) & Listening (6 IELTS formats) question catalog
export const READING_QUESTION_TYPES = [
  { id: 'mcq', label: '1. Multiple Choice (Trắc nghiệm ABCD)', shortLabel: 'Multiple Choice', answerKind: 'choice', defaultOptions: ['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C', 'D. Đáp án D'] },
  { id: 'tfng', label: '2. True / False / Not Given (hoặc Y/N/NG)', shortLabel: 'T / F / NG', answerKind: 'choice', defaultOptions: ['TRUE', 'FALSE', 'NOT GIVEN'] },
  { id: 'matching_headings', label: '3. Matching Headings (Nối tiêu đề i, ii, iii...)', shortLabel: 'Matching Headings', answerKind: 'choice', defaultOptions: ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'] },
  { id: 'matching_information', label: '4. Matching Information (Nối đoạn A, B, C...)', shortLabel: 'Matching Info', answerKind: 'choice', defaultOptions: ['A', 'B', 'C', 'D', 'E', 'F'] },
  { id: 'matching_features', label: '5. Matching Features (Nối đặc điểm / tên A-E)', shortLabel: 'Matching Features', answerKind: 'choice', defaultOptions: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'summary_box', label: '6. Summary Completion (Summary Box - Chọn từ)', shortLabel: 'Summary Box', answerKind: 'hybrid', defaultOptions: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], wordLimit: 'CHỌN ĐÁP ÁN TRONG HỘP (A–H)' },
  { id: 'summary_nobox', label: '7. Summary Completion – No Box (Điền từ tóm tắt)', shortLabel: 'Summary (No Box)', answerKind: 'text', defaultOptions: [], wordLimit: 'ONE WORD ONLY' },
  { id: 'correct_ending', label: '8. Matching Sentence Endings (Correct Ending)', shortLabel: 'Correct Ending', answerKind: 'choice', defaultOptions: ['A. Ending A', 'B. Ending B', 'C. Ending C', 'D. Ending D', 'E. Ending E'] },
  { id: 'fill', label: '9. Fill in the Blank (Điền từ vào chỗ trống)', shortLabel: 'Fill in the Blank', answerKind: 'text', defaultOptions: [], wordLimit: 'ONE WORD AND/OR A NUMBER' },
  { id: 'diagram_label', label: '10. Diagram Label Completion (Điền nhãn sơ đồ)', shortLabel: 'Diagram Label', answerKind: 'hybrid', defaultOptions: [], wordLimit: 'NO MORE THAN TWO WORDS' },
  { id: 'short_answer', label: '11. Short Answer Questions (Trả lời câu hỏi ngắn)', shortLabel: 'Short Answer', answerKind: 'text', defaultOptions: [], wordLimit: 'NO MORE THAN THREE WORDS AND/OR A NUMBER' },
  { id: 'flowchart_completion', label: '12. Flow-chart Completion (Lưu đồ điền từ / Hộp A–H)', shortLabel: 'Flow-chart', answerKind: 'hybrid', defaultOptions: [], wordLimit: 'NO MORE THAN TWO WORDS' }
];

export const LISTENING_QUESTION_TYPES = [
  { id: 'form_completion', label: '1. Form / Note Completion (Hoàn thành biểu mẫu)', shortLabel: 'Form Completion', answerKind: 'text', defaultOptions: [], wordLimit: 'ONE WORD AND/OR A NUMBER' },
  { id: 'flowchart_completion', label: '2. Flow-chart Completion (Lưu đồ điền từ / Hộp A–H)', shortLabel: 'Flow-chart', answerKind: 'hybrid', defaultOptions: [], wordLimit: 'CHỌN TỪ HỘP A–H HOẶC ĐIỀN TỪ' },
  { id: 'mcq', label: '3. Multiple Choice (Trắc nghiệm)', shortLabel: 'Multiple Choice', answerKind: 'choice', defaultOptions: ['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C'] },
  { id: 'matching', label: '4. Matching (Nối thông tin A–H)', shortLabel: 'Matching', answerKind: 'choice', defaultOptions: ['A', 'B', 'C', 'D', 'E', 'F'] },
  { id: 'map_diagram', label: '5. Map / Plan / Diagram Labelling (Dán nhãn bản đồ A–I)', shortLabel: 'Map / Diagram', answerKind: 'hybrid', defaultOptions: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], wordLimit: 'CHỌN CHỮ CÁI TRÊN BẢN ĐỒ' },
  { id: 'short_answer', label: '6. Short Answer Questions (Trả lời câu hỏi ngắn)', shortLabel: 'Short Answer', answerKind: 'text', defaultOptions: [], wordLimit: 'NO MORE THAN TWO WORDS AND/OR A NUMBER' },
  { id: 'summary_box', label: '7. Summary / Word-Box Completion (Chọn từ trong hộp A–H)', shortLabel: 'Word Box', answerKind: 'hybrid', defaultOptions: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], wordLimit: 'CHỌN ĐÁP ÁN TRONG HỘP (A–H)' }
];

const ALL_QUESTION_TYPE_MAP = new Map(
  [...READING_QUESTION_TYPES, ...LISTENING_QUESTION_TYPES].map(item => [item.id, item])
);

export function getQuestionTypesForSkill(skill = 'reading') {
  return skill === 'listening' ? LISTENING_QUESTION_TYPES : READING_QUESTION_TYPES;
}

export function getQuestionTypeMeta(type = 'mcq', skill = 'reading') {
  const list = getQuestionTypesForSkill(skill);
  return list.find(t => t.id === type) || ALL_QUESTION_TYPE_MAP.get(type) || READING_QUESTION_TYPES[0];
}

export function buildDefaultQuestionFields(type = 'mcq', skill = 'reading', prevOptions = null) {
  const meta = getQuestionTypeMeta(type, skill);
  if (meta.answerKind === 'text') {
    return {
      type: meta.id,
      options: [],
      correctAnswer: '',
      correctAnswers: [],
      requiredSelections: 1,
      wordLimit: meta.wordLimit || ''
    };
  }
  const hasCustomOpts =
    Array.isArray(prevOptions) &&
    prevOptions.length >= 2 &&
    (meta.id === 'mcq' || meta.id === 'flowchart_completion' || meta.id === 'summary_box' || meta.id === 'matching');
  const nextOptions = hasCustomOpts ? [...prevOptions] : [...(meta.defaultOptions || [])];
  return {
    type: meta.id,
    options: nextOptions,
    correctAnswer: nextOptions[0] || '',
    correctAnswers: meta.id === 'mcq' && nextOptions[0] ? [nextOptions[0]] : [],
    requiredSelections: 1,
    wordLimit: meta.wordLimit || ''
  };
}

const ROMAN_CODE_PATTERN = '(?:xii|xi|ix|x|viii|vii|vi|iv|v|iii|ii|i)';

export function extractLeadingOptionCode(val = '', { allowSpaceSeparated = false } = {}) {
  const str = String(val || '').trim();
  if (!str) return '';
  const punctuated = str.match(new RegExp(`^(${ROMAN_CODE_PATTERN}|[A-Za-z])(?:\\s*[.):\\-–]\\s+|\\s*$)`, 'i'));
  if (punctuated) return punctuated[1].toLowerCase();
  if (allowSpaceSeparated) {
    // IELTS word-box style: "A drawings", "D original plans", "ii The history..."
    const spaced = str.match(new RegExp(`^(${ROMAN_CODE_PATTERN}|[A-Z])\\s+\\S`));
    if (spaced) return spaced[1].toLowerCase();
  }
  return '';
}

export function stripLeadingOptionCode(val = '', { allowSpaceSeparated = false } = {}) {
  const str = String(val || '').trim();
  if (!str) return '';
  const punctuated = str.match(new RegExp(`^(?:${ROMAN_CODE_PATTERN}|[A-Za-z])\\s*[.):\\-–]\\s*(.+)$`, 'i'));
  if (punctuated) return punctuated[1].trim();
  if (allowSpaceSeparated) {
    const spaced = str.match(new RegExp(`^(?:${ROMAN_CODE_PATTERN}|[A-Z])\\s+(.+)$`));
    if (spaced) return spaced[1].trim();
  }
  return str;
}

export function optionsUseSpaceSeparatedCodes(options = []) {
  if (!Array.isArray(options) || options.length < 2) return false;
  const codes = new Set();
  let matchedCount = 0;
  for (const opt of options) {
    const code = extractLeadingOptionCode(opt, { allowSpaceSeparated: true });
    if (code) {
      matchedCount += 1;
      codes.add(code);
    }
  }
  return matchedCount >= 2 && codes.size === matchedCount && matchedCount >= Math.ceil(options.length * 0.75);
}

/**
 * Resolve a raw answer value (e.g. "H", "H.", "future", "H future") to the exact canonical
 * option string inside `options` (e.g. "H future") when unambiguous.
 */
export function matchChoiceOption(rawValue, options = []) {
  const raw = String(rawValue ?? '').trim();
  if (!raw || !Array.isArray(options) || options.length === 0) return '';
  const normalizedRaw = raw.replace(/\s+/g, ' ').toLowerCase();
  const cleanOptions = options.map(opt => String(opt || '').trim()).filter(Boolean);

  const exact = cleanOptions.find(opt => opt.replace(/\s+/g, ' ').toLowerCase() === normalizedRaw);
  if (exact) return exact;

  const allowSpaced = optionsUseSpaceSeparatedCodes(cleanOptions);
  const rawCode = extractLeadingOptionCode(raw, { allowSpaceSeparated: allowSpaced });
  const rawBody = stripLeadingOptionCode(raw, { allowSpaceSeparated: allowSpaced })
    .replace(/\s+/g, ' ')
    .toLowerCase();

  if (rawCode && normalizedRaw === rawCode) {
    const byCode = cleanOptions.find(opt => extractLeadingOptionCode(opt, { allowSpaceSeparated: allowSpaced }) === rawCode);
    if (byCode) return byCode;
  }

  if (rawCode) {
    const byCodeAndBody = cleanOptions.find(opt => {
      const optCode = extractLeadingOptionCode(opt, { allowSpaceSeparated: allowSpaced });
      const optBody = stripLeadingOptionCode(opt, { allowSpaceSeparated: allowSpaced }).replace(/\s+/g, ' ').toLowerCase();
      return optCode === rawCode && (!rawBody || !optBody || optBody === rawBody);
    });
    if (byCodeAndBody) return byCodeAndBody;
  }

  // Match by option body text when answer key gives the word itself (e.g. "future" -> "H future")
  const bodyMatches = cleanOptions.filter(opt => {
    const optBody = stripLeadingOptionCode(opt, { allowSpaceSeparated: allowSpaced }).replace(/\s+/g, ' ').toLowerCase();
    return optBody && optBody === normalizedRaw;
  });
  if (bodyMatches.length === 1) return bodyMatches[0];

  return '';
}

function getComparableChoiceKey(value, options = []) {
  const matched = matchChoiceOption(value, options);
  const target = matched || value;
  const allowSpaced = optionsUseSpaceSeparatedCodes(options);
  const normalized = String(target || '').trim().replace(/\s+/g, ' ').toLowerCase();
  return extractLeadingOptionCode(target, { allowSpaceSeparated: allowSpaced }) || normalized;
}

function uniqueChoiceAnswers(values = [], options = []) {
  const seen = new Set();
  return values.filter(value => {
    const key = getComparableChoiceKey(value, options);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getQuestionCorrectAnswers(question) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const explicitAnswers = Array.isArray(question?.correctAnswers)
    ? question.correctAnswers.map(answer => String(answer ?? '').trim()).filter(Boolean)
    : [];
  if (explicitAnswers.length > 0) return uniqueChoiceAnswers(explicitAnswers, options);

  const singleAnswer = String(question?.correctAnswer ?? '').trim();
  if (!singleAnswer) return [];
  if (question?.type !== 'mcq' || !/[,;|/&]|\band\b/i.test(singleAnswer)) return [singleAnswer];

  const parts = singleAnswer.split(/\s*(?:,|;|\||\/|&|\band\b)\s*/i).filter(Boolean);
  const allPartsMatchOptions = parts.length > 1 && parts.every(part =>
    options.some(option => getComparableChoiceKey(option, options) === getComparableChoiceKey(part, options))
  );
  return allPartsMatchOptions ? uniqueChoiceAnswers(parts, options) : [singleAnswer];
}

export function getObjectiveAnswerMaxScore(question) {
  const expectedAnswers = getQuestionCorrectAnswers(question);
  return question?.type === 'mcq' && expectedAnswers.length > 1 ? expectedAnswers.length : 1;
}

function normalizeTfngAlias(val = '') {
  const clean = String(val ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (clean === 't' || clean === 'true') return 'true';
  if (clean === 'f' || clean === 'false') return 'false';
  if (clean === 'ng' || clean === 'not given' || clean === 'notgiven' || clean === 'n/g') return 'not given';
  if (clean === 'y' || clean === 'yes') return 'yes';
  if (clean === 'n' || clean === 'no') return 'no';
  return clean;
}

function isTfngLikeQuestion(question, options = []) {
  if (question?.type === 'tfng') return true;
  if (!Array.isArray(options) || options.length < 2) return false;
  const upperOpts = options.map(o => String(o || '').trim().toUpperCase());
  return upperOpts.includes('NOT GIVEN') && (upperOpts.includes('TRUE') || upperOpts.includes('YES'));
}

function isSingleObjectiveAnswerCorrect(question, userRaw) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const expectedAnswers = getQuestionCorrectAnswers(question);
  const rawKey = expectedAnswers.length === 1
    ? expectedAnswers[0]
    : (question?.correctAnswer ?? expectedAnswers.join('|') ?? '');

  const normalizedUser = String(userRaw ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const normalizedKey = String(rawKey).trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalizedUser || !normalizedKey) return false;

  if (normalizedUser === normalizedKey) return true;

  if (isTfngLikeQuestion(question, options)) {
    if (normalizeTfngAlias(normalizedUser) === normalizeTfngAlias(normalizedKey)) {
      return true;
    }
  }

  const hasVariants = /[|/]/.test(normalizedKey);
  if (hasVariants && question?.type !== 'mcq' && question?.type !== 'tfng') {
    const acceptedVariants = normalizedKey
      .split(/[|/]/)
      .map(part => part.trim().replace(/\s+/g, ' '))
      .filter(Boolean);
    if (acceptedVariants.includes(normalizedUser)) return true;
    if (options.length > 0) {
      const matchedUser = matchChoiceOption(userRaw, options);
      if (matchedUser && acceptedVariants.some(variant => matchChoiceOption(variant, options) === matchedUser)) {
        return true;
      }
    }
  }

  // Canonical match against question.options (handles "H" <-> "H future" <-> "future")
  if (options.length > 0) {
    const matchedUser = matchChoiceOption(userRaw, options);
    const matchedKey = matchChoiceOption(rawKey, options);
    if (matchedUser && matchedKey && matchedUser === matchedKey) {
      return true;
    }
  }

  // Fallback code shorthand (e.g. key "B" matches selected option "B. Heading Two" or "B plantings")
  const allowSpaced = optionsUseSpaceSeparatedCodes(options) || options.length === 0;
  const userCode = extractLeadingOptionCode(userRaw, { allowSpaceSeparated: allowSpaced });
  const keyCode = extractLeadingOptionCode(rawKey, { allowSpaceSeparated: allowSpaced });
  if (
    userCode &&
    keyCode &&
    userCode === keyCode &&
    (normalizedKey === keyCode || normalizedUser === userCode)
  ) {
    return true;
  }
  return false;
}

export function getObjectiveAnswerScore(question, userRaw) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const expectedAnswers = getQuestionCorrectAnswers(question);
  if (question?.type === 'mcq' && expectedAnswers.length > 1) {
    const expectedKeys = new Set(expectedAnswers.map(ans => getComparableChoiceKey(ans, options)));
    const selectedAnswers = uniqueChoiceAnswers(Array.isArray(userRaw) ? userRaw : userRaw ? [userRaw] : [], options);
    const selectedKeys = selectedAnswers.map(ans => getComparableChoiceKey(ans, options));
    if (selectedKeys.length > expectedKeys.size) return 0;
    return selectedKeys.filter(key => expectedKeys.has(key)).length;
  }
  return isSingleObjectiveAnswerCorrect(question, userRaw) ? 1 : 0;
}

// Shared answer checker supporting multi-variant keys and exact multi-select answers.
export function isObjectiveAnswerCorrect(question, userRaw) {
  return getObjectiveAnswerScore(question, userRaw) === getObjectiveAnswerMaxScore(question);
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

function buildDefaultLexicalCollocation(word, example = '') {
  const lowerW = String(word || '').trim().toLowerCase();
  if (lowerW.includes(' ') && lowerW.split(/\s+/).filter(Boolean).length >= 2) {
    return lowerW;
  }
  const cleanEx = String(example || '').trim();
  if (cleanEx && !cleanEx.startsWith('Ghi nhớ cách dùng từ')) {
    const words = cleanEx.replace(/[.,!?;:"'()]/g, '').split(/\s+/).filter(Boolean);
    const idx = words.findIndex(w => w.toLowerCase() === lowerW);
    if (idx !== -1) {
      const start = Math.max(0, idx - 1);
      const end = Math.min(words.length, idx + 3);
      const phrase = words.slice(start, end).join(' ');
      if (phrase.split(/\s+/).length >= 2) return phrase;
    }
  }
  return lowerW || `effectively apply ${lowerW}`;
}

export function normalizeRound4AnswerText(val) {
  return String(val || '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]{}]/g, '')
    .replace(/[-–—_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractAcceptedRound4Answers(item) {
  const rawList = [];
  if (Array.isArray(item?.v4AcceptedAnswers)) {
    item.v4AcceptedAnswers.forEach(a => rawList.push(a));
  }
  if (rawList.length === 0 && typeof item?.collocation === 'string' && item.collocation.trim()) {
    item.collocation.split(/\s*;;\s*|\s*\/\s*/).forEach(part => {
      if (part.trim()) rawList.push(part.trim());
    });
  }
  if (rawList.length === 0 && item?.answer) {
    rawList.push(item.answer);
  }
  if (rawList.length === 0 && item?.word) {
    rawList.push(String(item.word).toLowerCase());
  }
  const seen = new Set();
  const deduped = [];
  rawList.forEach(entry => {
    const clean = String(entry || '').trim().replace(/\s+/g, ' ');
    const norm = normalizeRound4AnswerText(clean);
    if (!clean || !norm || seen.has(norm)) return;
    seen.add(norm);
    deduped.push(clean);
  });
  return deduped;
}

export function buildAutoV4BlankSentence(item) {
  const customSentence = String(item?.v4CustomSentence || '').trim();
  if (customSentence) return customSentence;

  const accepted = extractAcceptedRound4Answers(item);
  const primaryAns = accepted[0] || String(item?.word || '').trim().toLowerCase();
  const exampleText = String(item?.example || '').trim();
  const isRealExample = exampleText.length > 0 && !exampleText.startsWith('Ghi nhớ cách dùng từ');

  if (isRealExample) {
    const candidates = [
      ...accepted,
      String(item?.word || '').trim()
    ].filter(Boolean);
    for (const cand of candidates) {
      const escaped = cand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const regex = new RegExp(`\\b${escaped}[a-z]*\\b`, 'i');
      if (regex.test(exampleText)) {
        return exampleText.replace(regex, '____________');
      }
    }
  }

  const promptText = String(item?.prompt || '').trim();
  const wordCount = primaryAns ? primaryAns.split(/\s+/).filter(Boolean).length : 1;
  if (promptText) {
    return `Điền ${wordCount > 1 ? `cụm từ (${wordCount} từ)` : 'từ vựng'} tiếng Anh có nghĩa là "${promptText}" vào chỗ trống: ____________`;
  }
  return 'Điền từ / cụm từ tiếng Anh chính xác vào chỗ trống: ____________';
}

export function matchRound4TypingAnswer(typedText, acceptedAnswers = []) {
  const normTyped = normalizeRound4AnswerText(typedText);
  const candidates = (Array.isArray(acceptedAnswers) ? acceptedAnswers : [acceptedAnswers])
    .map(ans => String(ans || '').trim())
    .filter(Boolean);

  if (candidates.length === 0) {
    return { matched: false, matchedAnswer: '', bestCandidate: '', matchRatio: 0 };
  }

  let bestCandidate = candidates[0];
  let bestRatio = 0;

  for (const cand of candidates) {
    const normCand = normalizeRound4AnswerText(cand);
    if (!normCand) continue;
    if (normTyped && normTyped === normCand) {
      return { matched: true, matchedAnswer: cand, bestCandidate: cand, matchRatio: 1 };
    }
    if (normTyped) {
      let prefixLen = 0;
      const maxLen = Math.min(normTyped.length, normCand.length);
      while (prefixLen < maxLen && normTyped[prefixLen] === normCand[prefixLen]) {
        prefixLen += 1;
      }
      const ratio = normCand.length > 0 ? Math.min(0.95, prefixLen / normCand.length) : 0;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestCandidate = cand;
      }
    }
  }

  return { matched: false, matchedAnswer: '', bestCandidate, matchRatio: bestRatio };
}

export function serializeVocabItemsToRawText(items = []) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item, idx) => {
      if (!item || typeof item !== 'object') return '';
      const cleanWord = String(item.word || '').trim().toUpperCase();
      const cleanPrompt = String(item.prompt || '').trim();
      const cleanIpa = String(item.ipa || '').trim();
      const cleanExample = String(item.example || '').trim();
      const cleanSyn = String(item.syn || '').trim().toUpperCase();
      const cleanAnt = String(item.ant || '').trim().toUpperCase();
      const v3CustomMode = item.v3CustomMode === 'mcq' ? 'mcq' : 'syn_ant';
      const v3CustomQuestion = String(item.v3CustomQuestion || '').trim();
      const v3CustomChoices = Array.isArray(item.v3CustomChoices)
        ? item.v3CustomChoices.map(c => String(c || '').trim()).filter(Boolean)
        : [];
      const v3CustomAnswer = String(item.v3CustomAnswer || '').trim();
      const v4CustomSentence = String(item.v4CustomSentence || '').trim();
      const v4AcceptedAnswers = extractAcceptedRound4Answers(item);
      const timeSec = Math.max(0, Math.min(120, Math.round(Number(item.timeSec) || 0)));

      const effectiveWord =
        cleanWord ||
        (v3CustomAnswer ? v3CustomAnswer.toUpperCase() : '') ||
        (v4AcceptedAnswers[0] ? v4AcceptedAnswers[0].toUpperCase() : '') ||
        `ITEM_${idx + 1}`;
      const effectivePrompt = cleanPrompt || v4CustomSentence || v3CustomQuestion || effectiveWord;

      const needsJson =
        v3CustomMode === 'mcq' ||
        Boolean(v3CustomQuestion) ||
        v3CustomChoices.length > 0 ||
        Boolean(v4CustomSentence) ||
        v4AcceptedAnswers.length > 1 ||
        timeSec > 0 ||
        [effectiveWord, effectivePrompt, cleanIpa, cleanExample, cleanSyn, cleanAnt, v4AcceptedAnswers[0] || '']
          .some(s => String(s).includes('|') || String(s).includes('\n'));

      if (needsJson) {
        const payload = {
          id: item.id || `gq_${idx + 1}`,
          word: effectiveWord,
          prompt: effectivePrompt,
          ...(cleanIpa ? { ipa: cleanIpa } : {}),
          ...(cleanExample ? { example: cleanExample } : {}),
          ...(cleanSyn ? { syn: cleanSyn } : {}),
          ...(cleanAnt ? { ant: cleanAnt } : {}),
          ...(v3CustomMode === 'mcq' ? { v3CustomMode: 'mcq' } : {}),
          ...(v3CustomQuestion ? { v3CustomQuestion } : {}),
          ...(v3CustomChoices.length > 0 ? { v3CustomChoices } : {}),
          ...(v3CustomAnswer ? { v3CustomAnswer } : {}),
          ...(v4CustomSentence ? { v4CustomSentence } : {}),
          ...(v4AcceptedAnswers.length > 0 ? { v4AcceptedAnswers } : {}),
          ...(timeSec > 0 ? { timeSec } : {})
        };
        return `@QJSON:${JSON.stringify(payload)}`;
      }

      const primaryColloc = v4AcceptedAnswers[0] || String(item.collocation || '').trim();
      const cols = [effectiveWord, effectivePrompt, cleanIpa, cleanExample, cleanSyn, cleanAnt, primaryColloc];
      while (cols.length > 2 && !cols[cols.length - 1]) {
        cols.pop();
      }
      return cols.join(' | ');
    })
    .filter(Boolean)
    .join('\n');
}

export function parseRawVocabText(rawText, seedStr = null) {
  const lines = String(rawText || '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
  const parsedItems = [];
  const seenWords = new Set();

  lines.forEach((line, lineIdx) => {
    if (line.startsWith('@QJSON:')) {
      try {
        const obj = JSON.parse(line.slice(7));
        if (!obj || typeof obj !== 'object') return;
        const v4Answers = extractAcceptedRound4Answers(obj);
        const v3Choices = Array.isArray(obj.v3CustomChoices)
          ? obj.v3CustomChoices.map(c => String(c || '').trim()).filter(Boolean)
          : [];
        const v3Answer = String(obj.v3CustomAnswer || v3Choices[0] || '').trim();
        const rawWord = String(obj.word || v3Answer || v4Answers[0] || '').trim().toUpperCase();
        const cleanPrompt = String(obj.prompt || obj.v4CustomSentence || obj.v3CustomQuestion || rawWord).trim();
        if (!rawWord) return;
        const dict = VOCAB_LEXICAL_RELATIONS[rawWord] || null;
        const cleanExample = String(obj.example || '').trim();
        const exampleText = cleanExample || `Ghi nhớ cách dùng từ "${rawWord}" trong bài thi IELTS.`;
        const cleanSyn = String(obj.syn || '').trim().toUpperCase();
        const cleanAnt = String(obj.ant || '').trim().toUpperCase();
        const primaryColloc = v4Answers[0] || String(obj.collocation || '').trim() || dict?.collocation || buildDefaultLexicalCollocation(rawWord, exampleText);
        const finalV4Answers = v4Answers.length > 0 ? v4Answers : [primaryColloc];
        const v3Mode = obj.v3CustomMode === 'mcq' || (obj.v3CustomQuestion && v3Choices.length >= 2) ? 'mcq' : 'syn_ant';

        parsedItems.push({
          id: String(obj.id || `gq_${lineIdx + 1}`),
          word: rawWord,
          prompt: cleanPrompt,
          ipa: String(obj.ipa || '').trim(),
          example: exampleText,
          syn: cleanSyn || dict?.syn || '',
          ant: cleanAnt || dict?.ant || '',
          def: String(obj.def || '').trim() || dict?.def || `Relating accurately to: ${cleanPrompt}`,
          collocation: primaryColloc,
          v3CustomMode: v3Mode,
          v3CustomQuestion: String(obj.v3CustomQuestion || '').trim(),
          v3CustomChoices: v3Choices,
          v3CustomAnswer: v3Answer,
          v4CustomSentence: String(obj.v4CustomSentence || '').trim(),
          v4AcceptedAnswers: finalV4Answers,
          timeSec: Math.max(0, Math.min(120, Math.round(Number(obj.timeSec) || 0))),
          distractors: [],
          synDistractors: [],
          antDistractors: [],
          defDistractors: [],
          collocationDistractors: []
        });
      } catch (_err) {
        // Ignore malformed JSON line safely
      }
      return;
    }

    let parts;
    if (line.includes('|')) parts = line.split('|');
    else if (line.includes('\t')) parts = line.split('\t');
    else if (line.includes(';')) parts = line.split(';');
    else if (line.includes(':')) parts = line.split(':');
    else if (/\s+[-–—]\s+/.test(line)) parts = line.split(/\s+[-–—]\s+/);
    else return;

    const firstCol = (parts[0] || '').trim();
    const secondCol = (parts[1] || '').trim();

    // Shortcut support: "Sentence with ____ | answer1 ;; answer2"
    if (/_{3,}/.test(firstCol) && secondCol) {
      const answers = secondCol.split(/\s*;;\s*|\s*\/\s*/).map(s => s.trim()).filter(Boolean);
      const primaryAns = answers[0] || secondCol;
      const cleanWord = primaryAns.toUpperCase();
      const dict = VOCAB_LEXICAL_RELATIONS[cleanWord] || null;
      const cleanPrompt = (parts[2] || '').trim() || firstCol;
      const pipeSyn = (parts[3] || '').trim().toUpperCase();
      const pipeAnt = (parts[4] || '').trim().toUpperCase();
      parsedItems.push({
        id: `gq_${lineIdx + 1}`,
        word: cleanWord,
        prompt: cleanPrompt,
        ipa: '',
        example: firstCol.replace(/_{3,}/, primaryAns),
        syn: pipeSyn || dict?.syn || '',
        ant: pipeAnt || dict?.ant || '',
        def: dict?.def || cleanPrompt,
        collocation: primaryAns,
        v3CustomMode: 'syn_ant',
        v3CustomQuestion: '',
        v3CustomChoices: [],
        v3CustomAnswer: '',
        v4CustomSentence: firstCol,
        v4AcceptedAnswers: answers.length > 0 ? answers : [primaryAns],
        timeSec: 0,
        distractors: [],
        synDistractors: [],
        antDistractors: [],
        defDistractors: [],
        collocationDistractors: []
      });
      return;
    }

    const cleanWord = firstCol.toUpperCase();
    const cleanPrompt = secondCol;
    const cleanIpa = (parts[2] || '').trim();
    const cleanExample = (parts[3] || '').trim();
    const pipeSyn = (parts[4] || '').trim().toUpperCase();
    const pipeAnt = (parts[5] || '').trim().toUpperCase();
    const pipeColloc = (parts[6] || '').trim();
    const pipeCol8 = (parts[7] || '').trim();

    if (cleanWord && cleanPrompt && !seenWords.has(cleanWord)) {
      seenWords.add(cleanWord);
      const dict = VOCAB_LEXICAL_RELATIONS[cleanWord] || null;
      const exampleText = cleanExample || `Ghi nhớ cách dùng từ "${cleanWord}" trong bài thi IELTS.`;
      const multiColloc = pipeColloc
        ? pipeColloc.split(/\s*;;\s*/).map(s => s.trim()).filter(Boolean)
        : [];
      const primaryColloc = multiColloc[0] || dict?.collocation || buildDefaultLexicalCollocation(cleanWord, exampleText);
      const v4AcceptedAnswers = multiColloc.length > 0 ? multiColloc : [primaryColloc];
      const v4CustomSentence = /_{3,}/.test(pipeCol8) ? pipeCol8 : '';
      const pipeDef = v4CustomSentence ? '' : pipeCol8;

      parsedItems.push({
        id: `gq_${lineIdx + 1}`,
        word: cleanWord,
        prompt: cleanPrompt,
        ipa: cleanIpa || '',
        example: exampleText,
        syn: pipeSyn || dict?.syn || '',
        ant: pipeAnt || dict?.ant || '',
        def: pipeDef || dict?.def || `Relating accurately to: ${cleanPrompt}`,
        collocation: primaryColloc,
        v3CustomMode: 'syn_ant',
        v3CustomQuestion: '',
        v3CustomChoices: [],
        v3CustomAnswer: '',
        v4CustomSentence,
        v4AcceptedAnswers,
        timeSec: 0,
        distractors: [],
        synDistractors: [],
        antDistractors: [],
        defDistractors: [],
        collocationDistractors: []
      });
    }
  });

  const allWords = parsedItems.map(item => item.word);
  const allSyns = parsedItems.map(item => item.syn).filter(Boolean);
  const allAnts = parsedItems.map(item => item.ant).filter(Boolean);
  const allDefs = parsedItems.map(item => item.def).filter(Boolean);
  const allCollocs = parsedItems.map(item => item.collocation).filter(Boolean);

  parsedItems.forEach((item, idx) => {
    const orderList = (pool, tag) =>
      seedStr
        ? shuffleArrayWithSeed(pool, `${seedStr}:${tag}:${item.word}:${idx}`)
        : [...pool].sort(() => Math.random() - 0.5);

    let wordPool = allWords.filter(w => w !== item.word);
    for (const fb of FALLBACK_DISTRACTORS) {
      if (wordPool.length >= 8) break;
      if (fb !== item.word && !wordPool.includes(fb)) wordPool.push(fb);
    }
    item.distractors = orderList(wordPool, 'dist').slice(0, 4);

    let synPool = [...new Set([...allSyns, ...allWords, ...(FALLBACK_LEXICAL_POOL.synonyms || [])])].filter(
      s => s && s !== item.syn && s !== item.word
    );
    item.synDistractors = orderList(synPool, 'syn').slice(0, 3);

    let antPool = [...new Set([...allAnts, ...allWords, ...(FALLBACK_LEXICAL_POOL.antonyms || [])])].filter(
      s => s && s !== item.ant && s !== item.word
    );
    item.antDistractors = orderList(antPool, 'ant').slice(0, 3);

    let defPool = [...new Set([...allDefs, ...(FALLBACK_LEXICAL_POOL.definitions || [])])].filter(
      d => d && d !== item.def
    );
    item.defDistractors = orderList(defPool, 'def').slice(0, 3);

    let collocPool = [...new Set([...allCollocs, ...(FALLBACK_LEXICAL_POOL.collocations || [])])].filter(
      c => c && c !== item.collocation && !c.toLowerCase().includes(item.word.toLowerCase())
    );
    item.collocationDistractors = orderList(collocPool, 'col').slice(0, 3);

    item._idx = idx;
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
    const mime = String(file?.type || '').toLowerCase();
    if (!file || !mime.startsWith('image/') || mime === 'image/svg+xml') {
      reject(new Error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP, GIF).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

export async function detectAnimatedImageFile(file) {
  const mime = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  if (mime === 'image/gif' || mime === 'image/apng' || name.endsWith('.gif') || name.endsWith('.apng')) {
    return true;
  }
  if (mime === 'image/webp' || name.endsWith('.webp')) {
    try {
      const buf = await file.slice(0, 64).arrayBuffer();
      return isWebpBufferAnimated(new Uint8Array(buf));
    } catch {
      return false;
    }
  }
  return false;
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

export const GAME_TEAM_META = {
  A: {
    id: 'A',
    name: 'Team Đỏ (A)',
    short: 'Team A',
    dot: '🔴',
    badgeCls: 'bg-rose-600 text-white border-rose-400',
    pillCls: 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-200 border-rose-300 dark:border-rose-500/40',
    cardCls: 'bg-rose-50/85 dark:bg-rose-950/25 border-rose-300/80 dark:border-rose-500/40'
  },
  B: {
    id: 'B',
    name: 'Team Xanh (B)',
    short: 'Team B',
    dot: '🔵',
    badgeCls: 'bg-blue-600 text-white border-blue-400',
    pillCls: 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-200 border-blue-300 dark:border-blue-500/40',
    cardCls: 'bg-blue-50/85 dark:bg-blue-950/25 border-blue-300/80 dark:border-blue-500/40'
  },
  C: {
    id: 'C',
    name: 'Team Lục (C)',
    short: 'Team C',
    dot: '🟢',
    badgeCls: 'bg-emerald-600 text-white border-emerald-400',
    pillCls: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-200 border-emerald-300 dark:border-emerald-500/40',
    cardCls: 'bg-emerald-50/85 dark:bg-emerald-950/25 border-emerald-300/80 dark:border-emerald-500/40'
  },
  D: {
    id: 'D',
    name: 'Team Vàng (D)',
    short: 'Team D',
    dot: '🟡',
    badgeCls: 'bg-amber-500 text-slate-950 border-amber-400',
    pillCls: 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-500/40',
    cardCls: 'bg-amber-50/85 dark:bg-amber-950/25 border-amber-300/80 dark:border-amber-500/40'
  }
};

export function getActiveTeamIds(teamCount = 0) {
  const cnt = Number(teamCount) || 0;
  if (cnt < 2) return [];
  return ['A', 'B', 'C', 'D'].slice(0, Math.min(4, Math.max(2, Math.round(cnt))));
}

export function pickBalancedTeamId(lobbyPlayers = {}, teamCount = 0, roomMode = 'teacher_live', excludeUsername = '') {
  const activeIds = getActiveTeamIds(teamCount);
  if (activeIds.length === 0) return '';
  const counts = {};
  activeIds.forEach(id => { counts[id] = 0; });
  Object.values(lobbyPlayers || {}).forEach(lp => {
    if (!lp || !lp.username || lp.username === excludeUsername) return;
    if (roomMode !== 'friend_vip' && lp.role === 'teacher') return;
    const tid = activeIds.includes(lp.teamId) ? lp.teamId : '';
    if (tid) counts[tid] += 1;
  });
  let bestId = activeIds[0];
  let minCount = Infinity;
  activeIds.forEach(id => {
    if (counts[id] < minCount) {
      minCount = counts[id];
      bestId = id;
    }
  });
  return bestId;
}

export function computeRoomTeamStandings(roomInput = {}) {
  const teamCount = Number(roomInput?.teamCount) || 0;
  const activeIds = getActiveTeamIds(teamCount);
  if (activeIds.length === 0) return [];
  const buckets = {};
  activeIds.forEach(tid => {
    buckets[tid] = {
      teamId: tid,
      meta: GAME_TEAM_META[tid],
      totalScore: 0,
      members: [],
      finishedCount: 0
    };
  });

  const liveMap = roomInput?.liveMatch && typeof roomInput.liveMatch === 'object' ? roomInput.liveMatch : {};
  const lobbyMap = roomInput?.lobbyPlayers && typeof roomInput.lobbyPlayers === 'object' ? roomInput.lobbyPlayers : {};
  const playersMap = roomInput?.players && typeof roomInput.players === 'object' ? roomInput.players : {};

  const seenUsers = new Set();
  const addMember = (entry, fallbackTeam) => {
    if (!entry?.username || seenUsers.has(entry.username)) return;
    if (roomInput?.roomMode !== 'friend_vip' && entry.role === 'teacher') return;
    seenUsers.add(entry.username);
    const tid = activeIds.includes(entry.teamId)
      ? entry.teamId
      : activeIds.includes(fallbackTeam)
      ? fallbackTeam
      : activeIds[(seenUsers.size - 1) % activeIds.length];
    const score = Number(entry.score) || 0;
    buckets[tid].totalScore += score;
    if (entry.finished) buckets[tid].finishedCount += 1;
    buckets[tid].members.push({
      username: entry.username,
      name: entry.name || entry.username,
      score,
      finished: Boolean(entry.finished),
      lives: entry.lives ?? 3
    });
  };

  Object.values(liveMap).forEach(lm => addMember(lm, lobbyMap[lm?.username]?.teamId));
  Object.values(lobbyMap).forEach(lp => {
    if (!seenUsers.has(lp?.username)) {
      const pScore = playersMap[lp?.username]?.score || 0;
      addMember({ ...lp, score: pScore }, lp?.teamId);
    }
  });

  return Object.values(buckets).sort((a, b) => b.totalScore - a.totalScore || b.members.length - a.members.length);
}

export function normalizeRoomObject(room, pinKey, now = Date.now()) {
  const prunedChat = pruneExpiredRoomChat(room, now);
  const rawMax = Number(room?.maxPlayers);
  const maxPlayers = Number.isFinite(rawMax) && rawMax >= 2 ? Math.min(30, Math.round(rawMax)) : 30;
  const rawTeams = Number(room?.teamCount);
  const teamCount = [2, 3, 4].includes(Math.round(rawTeams)) ? Math.round(rawTeams) : 0;
  return {
    pin: String(room?.pin || pinKey || ''),
    name: room?.name || `Phòng Đấu Từ Vựng #${room?.pin || pinKey}`,
    pass: room?.pass ?? 'ielts',
    teacher: room?.teacher || 'teacher_ielts',
    roomMode: room?.roomMode === 'friend_vip' ? 'friend_vip' : 'teacher_live',
    hostUsername: String(room?.hostUsername || ''),
    hostName: String(room?.hostName || ''),
    status: room?.status || 'LOBBY',
    maxPlayers,
    teamCount,
    roundSize: Math.max(1, Math.min(200, Number(room?.roundSize) || 4)),
    selectedWords: Array.isArray(room?.selectedWords)
      ? room.selectedWords.map(w => String(w || '').trim().toUpperCase()).filter(Boolean).slice(0, 200)
      : [],
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

export function decorateV3Question(item, idx, seedStr) {
  const customChoices = Array.isArray(item?.v3CustomChoices)
    ? item.v3CustomChoices.map(c => String(c || '').trim()).filter(Boolean)
    : [];
  const customQ = String(item?.v3CustomQuestion || '').trim();
  const customAns = String(item?.v3CustomAnswer || '').trim();

  // Teacher-authored 4-choice contextual MCQ (Screenshot 4 style)
  if ((item?.v3CustomMode === 'mcq' || customQ) && customChoices.length >= 2 && customAns) {
    const ensuredChoices = customChoices.some(c => c.toLowerCase() === customAns.toLowerCase())
      ? customChoices
      : [customAns, ...customChoices].slice(0, 4);
    const shuffled = shuffleArrayWithSeed(ensuredChoices, `${seedStr}:v3mcq:${item.word}:${idx}`);
    return {
      ...item,
      v3Mode: 'mcq',
      v3Badge: 'TRẮC NGHIỆM NGỮ CẢNH (MCQ)',
      v3Question: customQ || `Chọn từ phù hợp nhất cho nghĩa "${item.prompt}"`,
      v3Target: customAns,
      v3Choices: shuffled
    };
  }

  // Round 3 is strictly Synonym / Antonym (Đồng nghĩa / Trái nghĩa)
  const hasValidSyn = Boolean(item?.syn && item.syn.trim().toUpperCase() !== String(item?.word || '').trim().toUpperCase());
  const hasValidAnt = Boolean(item?.ant && item.ant.trim().toUpperCase() !== String(item?.word || '').trim().toUpperCase());

  let mode = 'syn';
  if (hasValidSyn && hasValidAnt) {
    mode = idx % 2 === 0 ? 'syn' : 'ant';
  } else if (hasValidAnt) {
    mode = 'ant';
  } else {
    mode = 'syn';
  }

  if (mode === 'ant' && hasValidAnt) {
    const choices = shuffleArrayWithSeed([item.ant, ...(item.antDistractors || []).slice(0, 3)], `${seedStr}:v3c:${item.word}:${idx}`);
    return {
      ...item,
      v3Mode: 'ant',
      v3Badge: 'TRÁI NGHĨA (ANTONYM)',
      v3Question: `Chọn từ TRÁI NGHĨA với "${item.word}" (${item.prompt})`,
      v3Target: item.ant,
      v3Choices: choices
    };
  }

  if (hasValidSyn) {
    const choices = shuffleArrayWithSeed([item.syn, ...(item.synDistractors || []).slice(0, 3)], `${seedStr}:v3c:${item.word}:${idx}`);
    return {
      ...item,
      v3Mode: 'syn',
      v3Badge: 'ĐỒNG NGHĨA (SYNONYM)',
      v3Question: `Chọn từ ĐỒNG NGHĨA với "${item.word}" (${item.prompt})`,
      v3Target: item.syn,
      v3Choices: choices
    };
  }

  // Fallback if custom item has neither syn nor ant filled yet: match target word from meaning prompt
  const fallbackChoices = shuffleArrayWithSeed([item.word, ...(item.distractors || []).slice(0, 3)], `${seedStr}:v3fb:${item.word}:${idx}`);
  return {
    ...item,
    v3Mode: 'syn',
    v3Badge: 'ĐỒNG NGHĨA · TỪ VỰNG',
    v3Question: `Chọn từ tiếng Anh tương ứng với nghĩa: "${item.prompt}"`,
    v3Target: item.word,
    v3Choices: fallbackChoices
  };
}

export function decorateV4Question(item) {
  const acceptedAnswers = extractAcceptedRound4Answers(item);
  const primaryAns = acceptedAnswers[0] || String(item?.collocation || item?.word || '').trim();
  const sentencePrompt = buildAutoV4BlankSentence({ ...item, v4AcceptedAnswers: acceptedAnswers });
  return {
    ...item,
    v4Question: sentencePrompt,
    v4Answers: acceptedAnswers.length > 0 ? acceptedAnswers : [primaryAns],
    v4Target: primaryAns.toUpperCase(),
    v4Display: primaryAns,
    v4HintMeaning: String(item?.prompt || '').trim()
  };
}

export function buildSeededRoundQueues(roomInput, pinKey = '', username = '', fallbackVocab = DEFAULT_VOCAB_TEXT) {
  const room = normalizeRoomObject(roomInput || { rawVocab: fallbackVocab }, pinKey);
  const baseSeed = room.startedAt ? `${room.pin || pinKey}:${room.startedAt}` : `${room.pin || pinKey}:preview`;
  const seed = room.shufflePerPlayer
    ? `${baseSeed}:player:${String(username || 'guest')}`
    : `${baseSeed}:shared`;
  const fullVocabList = parseRawVocabText(room.rawVocab || fallbackVocab, seed);
  const selectedSet = new Set((room.selectedWords || []).map(w => String(w || '').trim().toUpperCase()).filter(Boolean));
  const vocabList = selectedSet.size > 0
    ? fullVocabList.filter(item => selectedSet.has(String(item.word || '').toUpperCase()))
    : fullVocabList;
  const effectivePool = vocabList.length > 0 ? vocabList : fullVocabList;
  if (effectivePool.length === 0) {
    return { 1: [], 2: [], 3: [], 4: [] };
  }
  const desiredPerRound = selectedSet.size > 0
    ? Math.min(200, effectivePool.length)
    : Math.max(1, Math.min(200, Number(room.roundSize) || 4));
  const pickRoundSlice = (roundNum) => {
    const shuffled = shuffleArrayWithSeed(effectivePool, `${seed}:r${roundNum}`);
    const takeCount = Math.min(desiredPerRound, shuffled.length);
    return shuffled.slice(0, takeCount);
  };

  return {
    1: pickRoundSlice(1),
    2: pickRoundSlice(2),
    3: pickRoundSlice(3).map((item, idx) => decorateV3Question(item, idx, seed)),
    4: pickRoundSlice(4).map(item => decorateV4Question(item))
  };
}

export function buildPracticeRoundQueues({ rawVocab = DEFAULT_VOCAB_TEXT, roundSize = 4, selectedWords = [], seedStr = '' } = {}) {
  const seed = seedStr || `practice:${Date.now()}`;
  const fullVocabList = parseRawVocabText(rawVocab || DEFAULT_VOCAB_TEXT, seed);
  const selectedSet = new Set(
    (Array.isArray(selectedWords) ? selectedWords : []).map(w => String(w || '').trim().toUpperCase()).filter(Boolean)
  );
  const filtered = selectedSet.size > 0
    ? fullVocabList.filter(item => selectedSet.has(String(item.word || '').toUpperCase()))
    : fullVocabList;
  const effectivePool = filtered.length > 0 ? filtered : fullVocabList;
  if (effectivePool.length === 0) {
    return { 1: [], 2: [], 3: [], 4: [] };
  }
  const desiredPerRound = selectedSet.size > 0
    ? Math.min(200, effectivePool.length)
    : Math.max(1, Math.min(200, Number(roundSize) || effectivePool.length));
  const pickRoundSlice = (roundNum) => {
    const shuffled = shuffleArrayWithSeed(effectivePool, `${seed}:r${roundNum}`);
    const takeCount = Math.min(desiredPerRound, shuffled.length);
    return shuffled.slice(0, takeCount);
  };
  return {
    1: pickRoundSlice(1),
    2: pickRoundSlice(2),
    3: pickRoundSlice(3).map((item, idx) => decorateV3Question(item, idx, seed)),
    4: pickRoundSlice(4).map(item => decorateV4Question(item))
  };
}
