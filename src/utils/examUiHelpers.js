/**
 * Pure presentation helpers for Computer-Delivered IELTS ExamMode UI.
 * Supports question numbering, matching-matrix grouping, passage block parsing,
 * inline highlight segmentation, and dynamic question range labels.
 */

const STANDARD_VERDICT_OPTIONS = new Set(['TRUE', 'FALSE', 'YES', 'NO', 'NOT GIVEN']);

/** Extract canonical numeric label for a question (blankNum -> leading regex -> fallback). */
export function getQuestionDisplayNumber(question, fallbackNum = 1) {
  if (typeof question?.blankNum === 'number' && question.blankNum > 0) {
    return question.blankNum;
  }
  const raw = String(question?.question || '').trim();
  const match = raw.match(/^(?:Câu\s*|Q\s*)?(\d+)(?:\s*[.):\-–]|\s+)/i);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallbackNum;
}

/** Strip redundant leading question number prefix when rendered inside a boxed number badge. */
export function stripLeadingQuestionNumber(questionText = '') {
  const raw = String(questionText || '').trim();
  return raw.replace(/^(?:Câu\s*|Q\s*)?\d+\s*[.):\-–]\s*/i, '');
}

/** Compute dynamic question range label (e.g. "1–13" or "14–26") for a part/passage. */
export function getQuestionRangeText(questions = [], globalOffset = 0) {
  if (!Array.isArray(questions) || questions.length === 0) return '';
  const nums = questions.map((q, idx) => getQuestionDisplayNumber(q, globalOffset + idx + 1));
  const minNum = Math.min(...nums);
  const maxNum = Math.max(...nums);
  return minNum === maxNum ? `${minNum}` : `${minNum}–${maxNum}`;
}

/** Determine whether a question's options form a compact matching-matrix header (e.g. A–I, i–viii). */
function isShortMatrixOptionList(options) {
  if (!Array.isArray(options) || options.length < 3 || options.length > 12) return false;
  const trimmed = options.map(opt => String(opt || '').trim()).filter(Boolean);
  if (trimmed.length !== options.length) return false;
  if (trimmed.every(opt => STANDARD_VERDICT_OPTIONS.has(opt.toUpperCase()))) return false;
  return trimmed.every(opt => opt.length <= 12);
}

/**
 * Group consecutive questions into standard cards or Computer-Delivered matrix grid tables
 * when 3+ consecutive MCQ questions share identical compact options (e.g., A–I, i–viii).
 */
export function groupQuestionsForRendering(questions = [], baseOffset = 0) {
  if (!Array.isArray(questions) || questions.length === 0) return [];
  const groups = [];
  let i = 0;

  while (i < questions.length) {
    const q = questions[i];
    const opts = Array.isArray(q?.options) ? q.options.map(o => String(o || '').trim()) : [];
    const signature = q?.type === 'mcq' && isShortMatrixOptionList(opts) ? opts.join('||') : null;

    if (signature) {
      let j = i + 1;
      while (j < questions.length) {
        const nextQ = questions[j];
        const nextOpts = Array.isArray(nextQ?.options) ? nextQ.options.map(o => String(o || '').trim()) : [];
        if (nextQ?.type === 'mcq' && nextOpts.join('||') === signature) {
          j++;
        } else {
          break;
        }
      }

      if (j - i >= 3) {
        groups.push({
          kind: 'matrix',
          key: `matrix-${q.id}`,
          options: opts,
          items: questions.slice(i, j).map((item, idx) => ({
            question: item,
            displayNum: getQuestionDisplayNumber(item, baseOffset + i + idx + 1)
          }))
        });
        i = j;
        continue;
      }
    }

    groups.push({
      kind: 'single',
      key: `single-${q.id}`,
      question: q,
      displayNum: getQuestionDisplayNumber(q, baseOffset + i + 1)
    });
    i++;
  }

  return groups;
}

/** Split text cleanly into plain and <mark>-highlighted runs for XSS-safe passage rendering. */
export function segmentTextWithHighlights(text = '', highlights = []) {
  const source = String(text || '');
  if (!source) return [{ text: '', color: null, highlightId: null }];
  const validHighlights = (Array.isArray(highlights) ? highlights : [])
    .filter(h => h?.text && String(h.text).trim().length >= 2)
    .map(h => ({ id: h.id ?? null, phrase: String(h.text).trim(), color: h.color || '#fef08a' }));

  if (validHighlights.length === 0) {
    return [{ text: source, color: null, highlightId: null }];
  }

  const runs = [];
  let cursor = 0;

  while (cursor < source.length) {
    let earliestIdx = -1;
    let matched = null;

    for (const h of validHighlights) {
      const idx = source.indexOf(h.phrase, cursor);
      if (
        idx !== -1 &&
        (earliestIdx === -1 || idx < earliestIdx || (idx === earliestIdx && h.phrase.length > matched.phrase.length))
      ) {
        earliestIdx = idx;
        matched = h;
      }
    }

    if (earliestIdx === -1 || !matched) {
      runs.push({ text: source.slice(cursor), color: null, highlightId: null });
      break;
    }

    if (earliestIdx > cursor) {
      runs.push({ text: source.slice(cursor, earliestIdx), color: null, highlightId: null });
    }
    runs.push({ text: matched.phrase, color: matched.color, highlightId: matched.id });
    cursor = earliestIdx + matched.phrase.length;
  }

  return runs;
}

/**
 * Parse reading passage text into structured blocks (boxed numbered section headers like "14",
 * italic lead lines like "*...*", bold paragraph letters like "A ...", and clean prose).
 */
export function parseReadingPassageBlocks(passageText = '') {
  const raw = String(passageText || '').replace(/\r\n/g, '\n');
  if (!raw.trim()) return [];
  const chunks = raw.split(/\n+/).map(line => line.trim()).filter(Boolean);

  return chunks.map((line, idx) => {
    const numberBoxMatch = line.match(/^\[?(\d{1,2})\]?$/);
    if (numberBoxMatch) {
      return { id: idx, kind: 'numberBox', label: numberBoxMatch[1], text: '' };
    }

    const italicLeadMatch = line.match(/^(?:\*(.+)\*|_(.+)_)$/);
    if (italicLeadMatch && idx <= 1) {
      return { id: idx, kind: 'lead', label: '', text: (italicLeadMatch[1] || italicLeadMatch[2] || '').trim() };
    }

    const numberedInlineMatch = line.match(/^\[?(\d{1,2})\]\s+(.+)$/);
    if (numberedInlineMatch) {
      return { id: idx, kind: 'numberedParagraph', label: numberedInlineMatch[1], text: numberedInlineMatch[2] };
    }

    const letteredMatch = line.match(/^([A-Z])\s{1,}(.{15,})$/);
    if (letteredMatch) {
      return { id: idx, kind: 'letterParagraph', label: letteredMatch[1], text: letteredMatch[2] };
    }

    return { id: idx, kind: 'paragraph', label: '', text: line };
  });
}

/** Build immutable part/passage navigator descriptors with cumulative fallback question offsets. */
export function buildScopedNavParts({
  items = [],
  allQuestions = [],
  hasScopedQs = false,
  scopeField = 'passageIdx',
  multiLabelPrefix = 'PASSAGE',
  singleLabel = 'READING'
}) {
  const parts = [];
  let runningOffset = 0;

  for (let idx = 0; idx < items.length; idx++) {
    const partQs = hasScopedQs
      ? allQuestions.filter(q => typeof q?.[scopeField] !== 'number' || q[scopeField] === idx)
      : allQuestions;
    parts.push({
      idx,
      offset: runningOffset,
      label: items.length > 1 ? `${multiLabelPrefix} ${idx + 1}` : singleLabel,
      questions: partQs
    });
    runningOffset += partQs.length;
  }

  return parts;
}
