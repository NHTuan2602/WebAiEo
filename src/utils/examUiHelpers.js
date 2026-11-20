/**
 * Pure presentation helpers for Computer-Delivered IELTS ExamMode UI.
 * Supports question numbering, matching-matrix grouping, passage block parsing,
 * inline highlight segmentation, and dynamic question range labels.
 */
import { extractBlankNumbers, isInlineClozeQuestion } from './clozeHelpers.js';

const STANDARD_VERDICT_OPTIONS = new Set(['TRUE', 'FALSE', 'YES', 'NO', 'NOT GIVEN']);

/** Extract lettered paragraphs (e.g. A, B, C, D, E, F, G) from passage text if present. */
export function extractPassageParagraphLetters(passageText = '') {
  const text = String(passageText || '').replace(/\r\n/g, '\n');
  if (!text.trim()) return [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const found = new Set();
  for (const line of lines) {
    const m = line.match(/^(?:\[?([A-I])\]?[\s.)\t]|paragraph\s+([A-I])\b)/i);
    if (m) {
      found.add((m[1] || m[2]).toUpperCase());
    }
  }
  const sorted = Array.from(found).sort();
  if (sorted.length >= 2 && sorted[0] === 'A') {
    return sorted;
  }
  return [];
}

/** Returns standard official Cambridge IELTS instructions for a question group when missing. */
export function getStandardGroupInstruction(question, options = []) {
  if (question?.instruction) return question.instruction;
  const type = question?.type;
  if (type === 'matching_information' || type === 'matching_info') {
    return 'Which paragraph contains the following information?';
  }
  if (type === 'matching_headings') {
    return 'Choose the correct heading for each paragraph from the list of headings below.';
  }
  if (type === 'matching_features') {
    return 'Match each statement with the correct item from the list below.';
  }
  if (type === 'summary_box') {
    return 'Complete the summary using the list of words, A-I, below.';
  }
  if (type === 'summary_nobox' || type === 'fill') {
    const limit = question?.wordLimit || 'ONE WORD ONLY';
    return `Complete the summary below. Write ${limit} from the passage for each answer.`;
  }
  if (type === 'tfng') {
    const isYesNo = Array.isArray(options) && options.some(o => /YES|NO/i.test(o));
    if (isYesNo) {
      return 'Choose YES if the statement agrees with the claims of the writer, choose NO if the statement contradicts the claims of the writer, or NOT GIVEN if it is impossible to say what the writer thinks about this.';
    }
    return 'Do the following statements agree with the information given in the Reading Passage? Choose TRUE, FALSE, or NOT GIVEN.';
  }
  if (type === 'mcq') {
    const count = Number(question?.requiredSelections) || 1;
    if (count > 1) {
      return `Choose ${count} letters from the options below.`;
    }
    return 'Choose the correct letter, A, B, C or D.';
  }
  if (type === 'correct_ending') {
    return 'Complete each sentence with the correct ending from the list below.';
  }
  return '';
}

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
          instruction: q.instruction || getStandardGroupInstruction(q, opts),
          hasNB: Boolean(q.hasNB || /NB\b/i.test(q.instruction || '') || /NB\b/i.test(q.question || '')),
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
    const isMatchingInfoType =
      q?.type === 'matching_information' ||
      q?.type === 'matching_info' ||
      (q?.type === 'matching' && (!opts.length || isShortMatrixOptionList(opts)));
    const effectiveMatrixOpts =
      opts.length > 0
        ? opts
        : isMatchingInfoType
        ? ['A', 'B', 'C', 'D', 'E', 'F']
        : [];
    const signature =
      (MATRIX_ELIGIBLE_TYPES.has(q?.type) || isMatchingInfoType) && isShortMatrixOptionList(effectiveMatrixOpts)
        ? effectiveMatrixOpts.join('||')
        : null;
    if (signature) {
      let j = i + 1;
      while (j < questions.length) {
        const nextQ = questions[j];
        const nextOpts = Array.isArray(nextQ?.options) ? nextQ.options.map(o => String(o || '').trim()).filter(Boolean) : [];
        const nextEffectiveOpts =
          nextOpts.length > 0
            ? nextOpts
            : isMatchingInfoType && (nextQ?.type === 'matching_information' || nextQ?.type === 'matching_info' || nextQ?.type === 'matching')
            ? ['A', 'B', 'C', 'D', 'E', 'F']
            : [];
        if (
          (MATRIX_ELIGIBLE_TYPES.has(nextQ?.type) || isMatchingInfoType) &&
          nextEffectiveOpts.join('||') === signature
        ) {
          j++;
        } else {
          break;
        }
      }

      if (j - i >= 3) {
        groups.push({
          kind: 'matrix',
          key: `matrix-${q.id}`,
          groupType: q.type,
          options: effectiveMatrixOpts,
          instruction: q.instruction || getStandardGroupInstruction(q, effectiveMatrixOpts),
          hasNB: Boolean(q.hasNB || isMatchingInfoType || /NB\b/i.test(q.instruction || '') || /NB\b/i.test(q.question || '')),
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
          instruction: q.instruction || getStandardGroupInstruction(q, opts),
          hasNB: Boolean(q.hasNB || /NB\b/i.test(q.instruction || '') || /NB\b/i.test(q.question || '')),
          items: questions.slice(i, j).map((item, idx) => ({
            question: item,
            displayNum: getQuestionDisplayNumber(item, baseOffset + i + idx + 1)
          }))
        });
        i = j;
        continue;
      }
    }

    // 4. Consecutive questions of the same type (e.g. 2+ tfng questions or 2+ mcq questions sharing option style)
    if (q?.type === 'tfng' || q?.type === 'mcq') {
      let j = i + 1;
      while (j < questions.length) {
        const nextQ = questions[j];
        if (nextQ?.type === q.type) {
          j++;
        } else {
          break;
        }
      }
      if (j - i >= 2) {
        groups.push({
          kind: 'questionGroup',
          key: `qgroup-${q.id}`,
          groupType: q.type,
          instruction: q.instruction || getStandardGroupInstruction(q, opts),
          hasNB: Boolean(q.hasNB || /NB\b/i.test(q.instruction || '') || /NB\b/i.test(q.question || '')),
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
    const rawPassageQuestions = safeQuestions.filter(q => {
      if (typeof q?.passageIdx === 'number') return q.passageIdx === passageIdx;
      if (hasScopedQuestions) return passageIdx === 0;
      return showAll ? passageIdx === 0 : true;
    });

    // Auto-repair matching_information options from passage text, and propagate matching_features/matching_headings options
    const passageText = safePassages[passageIdx]?.passageText || '';
    const passageLetters = extractPassageParagraphLetters(passageText);
    const defaultParagraphLetters = passageLetters.length >= 2 ? passageLetters : ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

    const passageQuestions = rawPassageQuestions.map(q => {
      const qCopy = { ...q };
      const opts = Array.isArray(qCopy.options) ? qCopy.options.map(o => String(o || '').trim()).filter(Boolean) : [];
      if (qCopy.type === 'matching_information' && opts.length === 0) {
        qCopy.options = defaultParagraphLetters;
        if (!qCopy.instruction) qCopy.instruction = 'Which paragraph contains the following information?';
        qCopy.hasNB = true;
      }
      return qCopy;
    });

    for (let k = 0; k < passageQuestions.length; k++) {
      const curr = passageQuestions[k];
      if (curr.type === 'matching_features' || curr.type === 'matching_headings') {
        const currOpts = Array.isArray(curr.options) ? curr.options.filter(Boolean) : [];
        if (currOpts.length === 0) {
          let donor = null;
          for (let m = k - 1; m >= 0 && passageQuestions[m].type === curr.type; m--) {
            if (Array.isArray(passageQuestions[m].options) && passageQuestions[m].options.length > 0) {
              donor = passageQuestions[m];
              break;
            }
          }
          if (!donor) {
            for (let m = k + 1; m < passageQuestions.length && passageQuestions[m].type === curr.type; m++) {
              if (Array.isArray(passageQuestions[m].options) && passageQuestions[m].options.length > 0) {
                donor = passageQuestions[m];
                break;
              }
            }
          }
          if (donor) {
            curr.options = [...donor.options];
            if (!curr.instruction && donor.instruction) curr.instruction = donor.instruction;
            if (donor.hasNB) curr.hasNB = true;
          }
        }
      }
    }
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
