// Helpers for Inline Cloze / Note Completion ("Đục Lỗ") and Question Mapping

const BLANK_TOKEN_REGEX = /(\{\{\s*\d+\s*\}\}|\[\s*\d+\s*\]|\(__+\s*\d+\s*__+\))/g;
const BLANK_NUM_CAPTURE = /(?:\{\{\s*(\d+)\s*\}\}|\[\s*(\d+)\s*\]|\(__+\s*(\d+)\s*__+\))/;

export function parseBlankNumberFromToken(token = '') {
  const match = String(token).match(BLANK_NUM_CAPTURE);
  if (!match) return null;
  const rawNum = match[1] || match[2] || match[3];
  const parsed = Number(rawNum);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function extractBlankNumbers(clozeText = '') {
  if (!clozeText) return [];
  const matches = String(clozeText).match(BLANK_TOKEN_REGEX) || [];
  const seen = new Set();
  const ordered = [];
  for (const token of matches) {
    const num = parseBlankNumberFromToken(token);
    if (num && !seen.has(num)) {
      seen.add(num);
      ordered.push(num);
    }
  }
  return ordered;
}

export function splitLineIntoClozeSegments(line = '') {
  const segments = [];
  const str = String(line);
  let lastIdx = 0;
  const regex = new RegExp(BLANK_TOKEN_REGEX.source, 'g');
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: 'text', value: str.slice(lastIdx, match.index) });
    }
    const blankNum = parseBlankNumberFromToken(match[0]);
    if (blankNum !== null) {
      segments.push({ type: 'blank', blankNum, raw: match[0] });
    } else {
      segments.push({ type: 'text', value: match[0] });
    }
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < str.length) {
    segments.push({ type: 'text', value: str.slice(lastIdx) });
  }
  return segments;
}

function cleanParagraphText(text = '') {
  return String(text || '')
    .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
    .replace(/\band\s*,\s*/gi, ', and ')
    .replace(/,\s*and\s*,/gi, ', and')
    .replace(/\s+([,.:;?!])/g, '$1')
    .replace(/([,.:;?!])(?=[A-Za-z])/g, '$1 ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function parseClozeLines(clozeText = '') {
  if (!clozeText) return [];
  const rawLines = String(clozeText).replace(/\r\n/g, '\n').split('\n');
  const parsedItems = [];

  for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
    const rawLine = rawLines[lineIdx];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      parsedItems.push({ id: lineIdx, kind: 'spacer', segments: [] });
      continue;
    }

    // Markdown bold heading: **HIRING A PUBLIC ROOM** or clean heading without blanks
    const boldHeadingMatch = trimmed.match(/^\*\*(.+)\*\*$/);
    if (boldHeadingMatch) {
      parsedItems.push({
        id: lineIdx,
        kind: 'heading',
        segments: splitLineIntoClozeSegments(boldHeadingMatch[1].trim())
      });
      continue;
    }

    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
      parsedItems.push({
        id: lineIdx,
        kind: 'subheading',
        segments: splitLineIntoClozeSegments(trimmed.replace(/^#{2,3}\s+/, ''))
      });
      continue;
    }

    // Question group header: e.g. "Questions 18-21 Complete the summary below:"
    if (/^Questions?\s+\d+/i.test(trimmed)) {
      parsedItems.push({
        id: lineIdx,
        kind: 'groupHeader',
        segments: splitLineIntoClozeSegments(trimmed)
      });
      continue;
    }

    // Word limit directive line: e.g. "Write ONE WORD ONLY from the passage for each answer."
    if (/(?:write|choose)\s+(?:one|two|three|no\s+more)\s+words?/i.test(trimmed)) {
      parsedItems.push({
        id: lineIdx,
        kind: 'wordLimit',
        segments: splitLineIntoClozeSegments(trimmed)
      });
      continue;
    }

    if (/^[•\-*]\s+/.test(trimmed)) {
      parsedItems.push({
        id: lineIdx,
        kind: 'bullet',
        segments: splitLineIntoClozeSegments(trimmed.replace(/^[•\-*]\s+/, ''))
      });
      continue;
    }

    // Short uppercase line with no blank token -> section title
    const hasBlank = Boolean(trimmed.match(BLANK_TOKEN_REGEX));
    if (!hasBlank && trimmed.length <= 64 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      parsedItems.push({
        id: lineIdx,
        kind: 'heading',
        segments: [{ type: 'text', value: trimmed }]
      });
      continue;
    }

    parsedItems.push({
      id: lineIdx,
      kind: 'paragraph',
      rawText: trimmed
    });
  }

  // Merge consecutive 'paragraph' lines into unified prose paragraphs with natural reflow
  const mergedLines = [];
  let currentParagraph = null;

  for (const item of parsedItems) {
    if (item.kind === 'paragraph') {
      if (!currentParagraph) {
        currentParagraph = {
          id: item.id,
          kind: 'paragraph',
          rawText: item.rawText
        };
      } else {
        const prevText = currentParagraph.rawText;
        const nextText = item.rawText;
        if (/^[,.:;?!]/.test(nextText)) {
          currentParagraph.rawText = prevText.trimEnd() + nextText;
        } else if (prevText.endsWith('-')) {
          currentParagraph.rawText = prevText.slice(0, -1) + nextText;
        } else {
          currentParagraph.rawText = prevText.trimEnd() + ' ' + nextText;
        }
      }
    } else {
      if (currentParagraph) {
        const cleaned = cleanParagraphText(currentParagraph.rawText);
        mergedLines.push({
          id: currentParagraph.id,
          kind: 'paragraph',
          segments: splitLineIntoClozeSegments(cleaned)
        });
        currentParagraph = null;
      }
      mergedLines.push(item);
    }
  }

  if (currentParagraph) {
    const cleaned = cleanParagraphText(currentParagraph.rawText);
    mergedLines.push({
      id: currentParagraph.id,
      kind: 'paragraph',
      segments: splitLineIntoClozeSegments(cleaned)
    });
  }

  return mergedLines;
}

export const INLINE_CLOZE_QUESTION_TYPES = new Set([
  'fill',
  'summary_box',
  'summary_nobox',
  'diagram_label',
  'form_completion',
  'flowchart_completion'
]);

export function isInlineClozeQuestion(question = {}) {
  const type = String(question?.type || '').toLowerCase().trim();
  return INLINE_CLOZE_QUESTION_TYPES.has(type) || typeof question?.blankNum === 'number';
}

export function formatInlineBlankPlaceholders(text = '') {
  return String(text || '').replace(new RegExp(BLANK_TOKEN_REGEX.source, 'g'), token => {
    const num = parseBlankNumberFromToken(token);
    return num ? `____(${num})____` : '________';
  });
}

export function filterQuestionsByScope(questions = [], scopeField, scopeIdx) {
  if (!Array.isArray(questions)) return [];
  if (!scopeField || typeof scopeIdx !== 'number') return questions;
  const hasAnyScoped = questions.some(q => typeof q?.[scopeField] === 'number');
  if (!hasAnyScoped) return questions;
  return questions.filter(q => typeof q?.[scopeField] !== 'number' || q[scopeField] === scopeIdx);
}

export function resolveQuestionForBlank(questions = [], blankNum, scopeField, scopeIdx) {
  const scoped = filterQuestionsByScope(questions, scopeField, scopeIdx);
  const targetNum = Number(blankNum);

  // 1. Explicit blankNum match inside scope (or unscoped legacy questions)
  const byBlankScoped = scoped.find(q => Number(q?.blankNum) === targetNum);
  if (byBlankScoped) return byBlankScoped;

  // 2. Explicit printed questionNumber match for any inline-capable question (incl. summary_box)
  const byQuestionNumber = scoped.find(
    q => Number(q?.questionNumber) === targetNum && isInlineClozeQuestion(q)
  );
  if (byQuestionNumber) return byQuestionNumber;

  // 3. Fallback: inline-capable question inside scope whose title starts with "<blankNum>." or "Câu <blankNum>"
  const numRegex = new RegExp(`^(?:(?:câu|questions?|q)\\s*)?${targetNum}(?:[.)\\s:]|$)`, 'i');
  return scoped.find(q => isInlineClozeQuestion(q) && numRegex.test(String(q.question || '').trim())) || null;
}

export function getQuestionOrigin(question = {}) {
  if (question?.source === 'ai') return 'ai';
  if (question?.source === 'cloze') return 'cloze';
  if (question?.source === 'manual') return 'manual';
  const idStr = String(question?.id || '');
  if (idStr.includes('_ai_')) return 'ai';
  if (typeof question?.blankNum === 'number') return 'cloze';
  return 'manual';
}

export function isAutoGeneratedQuestion(question = {}) {
  const origin = getQuestionOrigin(question);
  return origin === 'ai' || origin === 'cloze';
}

export function syncClozeBlanksWithQuestions({
  clozeText = '',
  existingQuestions = [],
  scopeField = 'trackIdx',
  scopeIdx = 0,
  skill = 'listening',
  defaultSource = 'cloze'
}) {
  const blankNums = extractBlankNumbers(clozeText);
  if (blankNums.length === 0) return existingQuestions;

  const lines = String(clozeText).replace(/\r\n/g, '\n').split('\n');
  const findContextForBlank = (num) => {
    const tokenRegex = new RegExp(`(?:\\{\\{\\s*${num}\\s*\\}\\}|\\[\\s*${num}\\s*\\]|\\(__+\\s*${num}\\s*__+\\))`);
    const matchedLine = lines.find(l => tokenRegex.test(l));
    if (!matchedLine) return `${num}. Điền vào chỗ trống (${num})`;
    const cleanContext = matchedLine
      .replace(/^[•\-*\s#]+/, '')
      .replace(/\*\*/g, '')
      .replace(new RegExp(BLANK_TOKEN_REGEX.source, 'g'), m => {
        const parsed = parseBlankNumberFromToken(m);
        return parsed ? `(${parsed})____` : '____';
      })
      .trim();
    return `${num}. ${cleanContext}`;
  };

  const nextQuestions = [...existingQuestions];

  blankNums.forEach(num => {
    const existing = resolveQuestionForBlank(nextQuestions, num, scopeField, scopeIdx);
    if (existing) {
      const idx = nextQuestions.findIndex(q => q.id === existing.id);
      if (idx >= 0) {
        const current = nextQuestions[idx];
        const preserveChoiceBlank =
          (current.type === 'summary_box' || current.type === 'diagram_label') &&
          Array.isArray(current.options) &&
          current.options.length > 0;
        nextQuestions[idx] = {
          ...current,
          type: preserveChoiceBlank ? current.type : 'fill',
          blankNum: num,
          questionNumber: Number(current.questionNumber) || num,
          source: current.source || defaultSource,
          options: preserveChoiceBlank ? current.options : [],
          [scopeField]: scopeIdx
        };
      }
    } else {
      nextQuestions.push({
        id: `${skill[0]}q_${Date.now()}_${num}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'fill',
        source: defaultSource,
        blankNum: num,
        [scopeField]: scopeIdx,
        question: findContextForBlank(num),
        options: [],
        correctAnswer: ''
      });
    }
  });

  // Sort fill questions with blankNum sensibly when mixed
  return nextQuestions;
}

export function parseAnswerKeyText(rawText = '') {
  const lines = String(rawText || '').replace(/\r\n/g, '\n').split('\n');
  const map = new Map();
  let sequentialCursor = 1;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Supports: "1. Hills", "1) 250", "Q1: park", "1 - morning", "1 full"
    const numberedMatch = line.match(/^(?:q(?:uestion)?\s*)?(\d+)\s*[.):\-–]\s*(.+)$/i);
    if (numberedMatch) {
      const num = Number(numberedMatch[1]);
      const ans = numberedMatch[2].trim();
      if (num > 0 && ans) {
        map.set(num, ans);
        sequentialCursor = num + 1;
      }
      continue;
    }

    const spaceMatch = line.match(/^(\d+)\s+(.+)$/);
    if (spaceMatch) {
      const num = Number(spaceMatch[1]);
      const ans = spaceMatch[2].trim();
      if (num > 0 && ans) {
        map.set(num, ans);
        sequentialCursor = num + 1;
      }
      continue;
    }

    // Bare line fallback -> assign sequentially 1, 2, 3...
    map.set(sequentialCursor, line);
    sequentialCursor++;
  }

  return map;
}

export function applyAnswerKeyTextToQuestions(rawKeyText = '', existingQuestions = [], scopeField, scopeIdx) {
  const keyMap = parseAnswerKeyText(rawKeyText);
  if (keyMap.size === 0) return { updated: existingQuestions, matchedCount: 0 };

  let matchedCount = 0;
  let scopedCounter = 0;
  const hasScoped = existingQuestions.some(q => typeof q?.[scopeField] === 'number');

  const updated = existingQuestions.map(q => {
    const inScope = !hasScoped || typeof q?.[scopeField] !== 'number' || q[scopeField] === scopeIdx;
    if (!inScope) return q;
    scopedCounter++;

    const numMatch = String(q.question || '').trim().match(/^(?:câu\s*)?(\d+)(?:[.):\s]|$)/i);
    const numKey = typeof q.blankNum === 'number'
      ? q.blankNum
      : numMatch
      ? Number(numMatch[1])
      : scopedCounter;

    if (!keyMap.has(numKey)) return q;
    const rawAns = keyMap.get(numKey);
    matchedCount++;

    if ((q.type === 'mcq' || q.type === 'tfng') && Array.isArray(q.options) && q.options.length > 0) {
      const rawParts = q.type === 'mcq'
        ? rawAns.split(/\s*(?:,|;|\/|&|\band\b)\s*/i).filter(Boolean)
        : [rawAns];
      const matchedAnswers = rawParts.map(part => {
        const partNorm = part.trim().toUpperCase();
        return q.options.find(opt => String(opt).trim().toUpperCase().startsWith(`${partNorm}.`) || String(opt).trim().toUpperCase() === partNorm) || part;
      });
      return q.type === 'mcq'
        ? {
            ...q,
            correctAnswers: matchedAnswers,
            correctAnswer: matchedAnswers[0] || '',
            requiredSelections: Math.max(1, matchedAnswers.length)
          }
        : { ...q, correctAnswer: matchedAnswers[0] || rawAns };
    }

    return { ...q, correctAnswer: rawAns };
  });

  return { updated, matchedCount };
}
