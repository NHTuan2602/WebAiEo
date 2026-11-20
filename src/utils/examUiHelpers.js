/**
 * Pure presentation helpers for Computer-Delivered IELTS ExamMode UI.
 * Supports question numbering, matching-matrix grouping, passage block parsing,
 * inline highlight segmentation, and dynamic question range labels.
 */
import { extractBlankNumbers, isInlineClozeQuestion } from './clozeHelpers';

const STANDARD_VERDICT_OPTIONS = new Set(['TRUE', 'FALSE', 'YES', 'NO', 'NOT GIVEN']);

/** Extract canonical numeric label for a question (blankNum -> leading regex -> fallback). */
export function getQuestionDisplayNumber(question, fallbackNum = 1) {
  const explicitQuestionNum = Number(question?.questionNumber);
  if (Number.isFinite(explicitQuestionNum) && explicitQuestionNum > 0) {
    return explicitQuestionNum;
  }
  if (typeof question?.blankNum === 'number' && question.blankNum > 0) {
    return question.blankNum;
  }
  const raw = String(question?.question || '').trim();
  const match = raw.match(/^(?:(?:câu|questions?|q)\s*)?(\d+)(?:\s*[-–—]\s*\d+)?(?:\s*[.):\-–—]\s*|\s+|$)/i);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallbackNum;
}

/** Strip redundant leading question number prefix when rendered inside a boxed number badge. */
export function stripLeadingQuestionNumber(questionText = '') {
  const raw = String(questionText || '').trim();
  return raw.replace(/^(?:(?:câu|questions?|q)\s*)?\d+(?:\s*[-–—]\s*\d+)?(?:\s*[.):\-–—]\s*|\s+)/i, '');
}

/** Compute dynamic question range label (e.g. "1–13" or "14–26") for a part/passage. */
export function getQuestionRangeText(questions = [], globalOffset = 0) {
  if (!Array.isArray(questions) || questions.length === 0) return '';
  const nums = questions.map((q, idx) => {
    const start = getQuestionDisplayNumber(q, globalOffset + idx + 1);
    const explicitEnd = Number(q?.questionEndNumber);
    return {
      start,
      end: Number.isFinite(explicitEnd) && explicitEnd >= start ? explicitEnd : start
    };
  });
  const minNum = Math.min(...nums.map(item => item.start));
  const maxNum = Math.max(...nums.map(item => item.end));
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

const MATRIX_ELIGIBLE_TYPES = new Set([
  'mcq',
  'matching_headings',
  'matching_information',
  'matching_features',
  'summary_box',
  'correct_ending',
  'matching',
  'map_diagram',
  'diagram_label'
]);

const WORD_BOX_GROUP_TYPES = new Set([
  'summary_box',
  'matching_headings',
  'matching_information',
  'matching_features',
  'correct_ending',
  'matching',
  'map_diagram',
  'diagram_label'
]);

function isWordBoxOptionList(options) {
  if (!Array.isArray(options) || options.length < 2 || options.length > 16) return false;
  const trimmed = options.map(opt => String(opt || '').trim()).filter(Boolean);
  if (trimmed.length !== options.length) return false;
  if (trimmed.every(opt => STANDARD_VERDICT_OPTIONS.has(opt.toUpperCase()))) return false;
  return trimmed.every(opt => opt.length <= 160);
}

/**
 * Group consecutive questions into:
 * - Computer-Delivered matrix grid tables (3+ consecutive questions sharing compact A–I / i–viii codes)
 * - Shared Word-Box / Summary-Box groups (2+ consecutive summary_box or matching questions sharing a word/phrase list)
 * - Standard single question cards
 */
export function groupQuestionsForRendering(questions = [], baseOffset = 0) {
  if (!Array.isArray(questions) || questions.length === 0) return [];
  const groups = [];
  let i = 0;

  while (i < questions.length) {
    const q = questions[i];
    const opts = Array.isArray(q?.options) ? q.options.map(o => String(o || '').trim()).filter(Boolean) : [];

    // 1. Summary Box with shared options (prefer inline word-box flow over repeated radios or tight matrix)
    const isSummaryBox = q?.type === 'summary_box' && isWordBoxOptionList(opts);
    if (isSummaryBox) {
      const sig = opts.join('||');
      let j = i + 1;
      while (j < questions.length) {
        const nextQ = questions[j];
        const nextOpts = Array.isArray(nextQ?.options) ? nextQ.options.map(o => String(o || '').trim()).filter(Boolean) : [];
        if (nextQ?.type === 'summary_box' && nextOpts.join('||') === sig) {
          j++;
        } else {
          break;
        }
      }
      if (j - i >= 2) {
        groups.push({
          kind: 'wordBoxGroup',
          key: `wordbox-${q.id}`,
          groupType: 'summary_box',
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

    // 2. Compact matching-matrix grid table (A-I, i-viii)
    const signature = MATRIX_ELIGIBLE_TYPES.has(q?.type) && isShortMatrixOptionList(opts) ? opts.join('||') : null;
    if (signature) {
      let j = i + 1;
      while (j < questions.length) {
        const nextQ = questions[j];
        const nextOpts = Array.isArray(nextQ?.options) ? nextQ.options.map(o => String(o || '').trim()).filter(Boolean) : [];
        if (MATRIX_ELIGIBLE_TYPES.has(nextQ?.type) && nextOpts.join('||') === signature) {
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

    // 3. Shared Word/Phrase Box for matching_headings, matching_features, correct_ending, etc.
    //    when options have full text (e.g. "A drawings", "D original plans") and are repeated across 2+ questions
    if (WORD_BOX_GROUP_TYPES.has(q?.type) && opts.length >= 3 && isWordBoxOptionList(opts) && !isShortMatrixOptionList(opts)) {
      const sig = opts.join('||');
      let j = i + 1;
      while (j < questions.length) {
        const nextQ = questions[j];
        const nextOpts = Array.isArray(nextQ?.options) ? nextQ.options.map(o => String(o || '').trim()).filter(Boolean) : [];
        if (nextQ?.type === q.type && nextOpts.join('||') === sig) {
          j++;
        } else {
          break;
        }
      }
      if (j - i >= 2) {
        groups.push({
          kind: 'wordBoxGroup',
          key: `wordbox-${q.id}`,
          groupType: q.type,
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
    const scopedQuestions = hasScopedQs
      ? allQuestions.filter(q =>
          typeof q?.[scopeField] === 'number'
            ? q[scopeField] === idx
            : idx === 0
        )
      : allQuestions;
    const partQs = scopedQuestions
      .map((question, questionIdx) => ({ question, questionIdx }))
      .sort((a, b) => {
        const aNum = getQuestionDisplayNumber(a.question, runningOffset + a.questionIdx + 1);
        const bNum = getQuestionDisplayNumber(b.question, runningOffset + b.questionIdx + 1);
        return aNum - bNum || a.questionIdx - b.questionIdx;
      })
      .map(item => item.question);
    const navQuestions = partQs.flatMap((question, questionIdx) => {
      const start = getQuestionDisplayNumber(question, runningOffset + questionIdx + 1);
      const explicitEnd = Number(question?.questionEndNumber);
      const end = Number.isFinite(explicitEnd) && explicitEnd >= start ? explicitEnd : start;
      const rangeSize = Math.min(40, end - start + 1);
      return Array.from({ length: rangeSize }, (_, offset) => {
        const number = start + offset;
        return {
          id: `${question.id || `q-${questionIdx}`}__nav_${number}`,
          answerId: question.id,
          question,
          num: question.num ?? number,
          answered: question.answered,
          questionNumber: number,
          ...(end > start ? { questionEndNumber: end } : {}),
          blankNum: question.blankNum
        };
      });
    });
    parts.push({
      idx,
      offset: runningOffset,
      label: items.length > 1 ? `${multiLabelPrefix} ${idx + 1}` : singleLabel,
      questions: partQs,
      navQuestions
    });
    runningOffset += navQuestions.length;
  }

  return parts;
}

/** Build the visible Reading question stream, interleaving cloze sheets by their printed question numbers. */
export function buildReadingDisplayBlocks({
  passages = [],
  questions = [],
  activePassageIdx = 0,
  showAll = false
}) {
  const safePassages = Array.isArray(passages) ? passages : [];
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const hasScopedQuestions = safeQuestions.some(q => typeof q?.passageIdx === 'number');
  const passageIndices = showAll
    ? safePassages.map((_, idx) => idx)
    : [Math.max(0, Math.min(activePassageIdx, safePassages.length - 1))];
  const blocks = [];
  let fallbackOffset = showAll || !hasScopedQuestions
    ? 0
    : safeQuestions.filter(q => typeof q?.passageIdx === 'number' && q.passageIdx < passageIndices[0]).length;

  passageIndices.forEach(passageIdx => {
    const passageQuestions = safeQuestions.filter(q => {
      if (typeof q?.passageIdx === 'number') return q.passageIdx === passageIdx;
      if (hasScopedQuestions) return passageIdx === 0;
      return showAll ? passageIdx === 0 : true;
    });
    const numberedQuestions = passageQuestions
      .map((question, idx) => ({
        question,
        originalIdx: idx,
        displayNum: getQuestionDisplayNumber(question, fallbackOffset + idx + 1),
        baseOffset: fallbackOffset + idx
      }))
      .sort((a, b) => a.displayNum - b.displayNum || a.originalIdx - b.originalIdx);
    const clozeText = String(safePassages[passageIdx]?.clozeText || '').trim();
    const clozeNumbers = new Set(extractBlankNumbers(clozeText));
    const items = [];

    if (clozeText) {
      const firstClozeNum = clozeNumbers.size ? Math.min(...clozeNumbers) : Number.POSITIVE_INFINITY;
      items.push({ kind: 'cloze', passageIdx, clozeText, displayNum: firstClozeNum });
    }

    numberedQuestions.forEach(item => {
      const isRenderedInCloze =
        isInlineClozeQuestion(item.question) &&
        clozeNumbers.has(item.displayNum);
      if (!isRenderedInCloze) {
        items.push({
          kind: 'question',
          passageIdx,
          question: item.question,
          displayNum: item.displayNum,
          baseOffset: item.baseOffset,
          originalIdx: item.originalIdx
        });
      }
    });

    items.sort((a, b) =>
      a.displayNum - b.displayNum ||
      (a.kind === 'cloze' ? -1 : b.kind === 'cloze' ? 1 : a.originalIdx - b.originalIdx)
    );

    if (showAll && safePassages.length > 1 && items.length > 0) {
      blocks.push({
        kind: 'passageHeading',
        key: `passage-heading-${passageIdx}`,
        passageIdx,
        title: String(safePassages[passageIdx]?.title || `Passage ${passageIdx + 1}`)
      });
    }

    let pendingQuestions = [];
    const flushQuestions = () => {
      if (pendingQuestions.length === 0) return;
      blocks.push({
        kind: 'questions',
        key: `passage-questions-${passageIdx}-${pendingQuestions[0].question.id || pendingQuestions[0].displayNum}`,
        passageIdx,
        questions: pendingQuestions.map(item => item.question),
        baseOffset: pendingQuestions[0].baseOffset
      });
      pendingQuestions = [];
    };

    items.forEach(item => {
      if (item.kind === 'question') {
        pendingQuestions.push(item);
        return;
      }
      flushQuestions();
      blocks.push({
        ...item,
        key: `passage-cloze-${passageIdx}-${item.displayNum}`
      });
    });
    flushQuestions();
    fallbackOffset += passageQuestions.length;
  });

  return blocks;
}
