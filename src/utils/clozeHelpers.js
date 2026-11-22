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

function isMarkdownTableSeparatorLine(line = '') {
  const clean = String(line || '').trim().replace(/^\|/, '').replace(/\|$/, '').trim();
  if (!clean) return false;
  return clean.split('|').every(cell => /^:?-{2,}:?$/.test(cell.trim()));
}

function splitPipeRowCells(line = '') {
  const trimmed = String(line || '').trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map(cell => cell.trim());
}

function parseCellLines(cellText = '') {
  const normalized = String(cellText || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\s+•\s+/g, '\n• ')
    .trim();
  if (!normalized) return [];
  return normalized.split('\n').map(raw => {
    const t = raw.trim();
    const isBullet = /^[•\-*]\s+/.test(t);
    const body = isBullet ? t.replace(/^[•\-*]\s+/, '') : t;
    return { isBullet, segments: splitLineIntoClozeSegments(body) };
  }).filter(item => item.segments.length > 0);
}

/** Auto-split single-line flattened AI pipe tables (e.g. "Col1 | Col2 Row1 | Val {{8}} Row2 | Val") into rows. */
function expandFlattenedPipeLine(line = '') {
  const trimmed = String(line || '').trim();
  const pipeCount = (trimmed.match(/\|/g) || []).length;
  if (pipeCount < 2) return [trimmed];
  // If already a normal 1-row markdown table "| A | B | C |" with leading & trailing pipes and no repeated inner headers, keep single row
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) return [trimmed];
  // Heuristic: only split if there are >= 3 pipes and text resembles repeated "Label | Body" pairs on one line
  if (pipeCount < 3) return [trimmed];
  const parts = trimmed.split('|').map(p => p.trim());
  // For 2-column flattened tables: parts = [H1, "H2 Row1Key", "Row1Val Row2Key", ..., LastVal]
  // Keep original if unsure, otherwise split when segments clearly start a new capitalized row label
  const rows = [];
  if (parts.length >= 4) {
    let col0 = parts[0];
    for (let i = 1; i < parts.length - 1; i++) {
      const mid = parts[i];
      // Look for transition from previous value (ending with sentence/word/blank) into a short capitalized label before the next '|'
      const splitMatch = mid.match(/^(.+?)\s+([A-Z][A-Za-z0-9/() -]{1,34})$/);
      if (splitMatch) {
        rows.push(`${col0} | ${splitMatch[1].trim()}`);
        col0 = splitMatch[2].trim();
      } else {
        // Fallback: cannot safely split, return as single multi-column row
        return [trimmed];
      }
    }
    rows.push(`${col0} | ${parts[parts.length - 1]}`);
    if (rows.length >= 2) return rows;
  }
  return [trimmed];
}

function looksLikeStandaloneNoteLine(trimmed = '', prevRawText = '') {
  if (!trimmed) return false;
  if (/^example\b/i.test(trimmed)) return true;
  if (/^[A-Za-z0-9][A-Za-z0-9 /()'-]{1,42}:\s*/.test(trimmed)) return true;
  if (/^\(\d+\)|^\d+\s*[.)]/.test(trimmed)) return true;
  // Previous line already looks like a discrete key: value note field -> don't glue next line onto it
  if (prevRawText && /^[A-Za-z0-9][A-Za-z0-9 /()'-]{1,42}:\s*/.test(prevRawText)) return true;
  return false;
}

export function parseClozeLines(clozeText = '') {
  if (!clozeText) return [];
  const rawInputLines = String(clozeText).replace(/\r\n/g, '\n').split('\n');
  const rawLines = [];
  for (const rl of rawInputLines) {
    const t = rl.trim();
    if (t.includes('|') && !isMarkdownTableSeparatorLine(t)) {
      const expanded = expandFlattenedPipeLine(t);
      rawLines.push(...expanded);
    } else {
      rawLines.push(rl);
    }
  }

  const parsedItems = [];

  for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
    const rawLine = rawLines[lineIdx];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      parsedItems.push({ id: lineIdx, kind: 'spacer', segments: [] });
      continue;
    }

    // Flowchart connector arrow line: "↓", "⬇", "->", "-->", "v"
    if (/^(?:↓|⬇|▼|->|-->|=>)$/.test(trimmed)) {
      parsedItems.push({ id: lineIdx, kind: 'flowArrow', segments: [] });
      continue;
    }

    // Markdown / Pipe table row
    if (trimmed.includes('|')) {
      if (isMarkdownTableSeparatorLine(trimmed)) {
        parsedItems.push({ id: lineIdx, kind: 'tableSep', segments: [] });
        continue;
      }
      const rawCells = splitPipeRowCells(trimmed);
      if (rawCells.length >= 2) {
        parsedItems.push({
          id: lineIdx,
          kind: 'tableRow',
          rawCells,
          cells: rawCells.map(parseCellLines),
          segments: splitLineIntoClozeSegments(trimmed)
        });
        continue;
      }
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

    // Italic / Example line: "*Example: ...*" or "Example: ..."
    const italicExampleMatch = trimmed.match(/^\*(Example[:\s].*)\*$/i);
    if (italicExampleMatch || /^Example\s*:/i.test(trimmed) || /^Example$/i.test(trimmed)) {
      const cleanEx = italicExampleMatch ? italicExampleMatch[1].trim() : trimmed;
      parsedItems.push({
        id: lineIdx,
        kind: 'example',
        segments: splitLineIntoClozeSegments(cleanEx)
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

  // Group consecutive tableRow / tableSep items into structured 'table' blocks,
  // and keep discrete Note lines separate while naturally reflowing running summary prose.
  const mergedLines = [];
  let currentParagraph = null;
  let idx = 0;

  const flushParagraph = () => {
    if (!currentParagraph) return;
    const cleaned = cleanParagraphText(currentParagraph.rawText);
    mergedLines.push({
      id: currentParagraph.id,
      kind: currentParagraph.isNoteLine ? 'noteLine' : 'paragraph',
      segments: splitLineIntoClozeSegments(cleaned)
    });
    currentParagraph = null;
  };

  while (idx < parsedItems.length) {
    const item = parsedItems[idx];

    if (item.kind === 'tableRow' || item.kind === 'tableSep') {
      flushParagraph();
      const rows = [];
      const startId = item.id;
      let explicitHeaderSep = false;
      while (idx < parsedItems.length && (parsedItems[idx].kind === 'tableRow' || parsedItems[idx].kind === 'tableSep')) {
        if (parsedItems[idx].kind === 'tableSep') {
          if (rows.length === 1) explicitHeaderSep = true;
        } else {
          rows.push(parsedItems[idx]);
        }
        idx++;
      }
      if (rows.length >= 2) {
        const colCount = Math.max(...rows.map(r => r.cells.length));
        const normalizedRows = rows.map(r => {
          const padded = [...r.cells];
          while (padded.length < colCount) padded.push([]);
          return { id: r.id, cells: padded };
        });
        const firstRowHasBlank = normalizedRows[0].cells.some(cLines =>
          cLines.some(cl => cl.segments.some(seg => seg.type === 'blank'))
        );
        const hasHeader = explicitHeaderSep || !firstRowHasBlank;
        const allSegments = rows.flatMap(r => r.segments);
        mergedLines.push({
          id: startId,
          kind: 'table',
          hasHeader,
          headerRow: hasHeader ? normalizedRows[0] : null,
          bodyRows: hasHeader ? normalizedRows.slice(1) : normalizedRows,
          segments: allSegments
        });
      } else if (rows.length === 1) {
        mergedLines.push({
          id: rows[0].id,
          kind: 'noteLine',
          segments: rows[0].segments
        });
      }
      continue;
    }

    if (item.kind === 'paragraph') {
      const standalone = looksLikeStandaloneNoteLine(item.rawText, currentParagraph?.rawText || '');
      if (!currentParagraph) {
        currentParagraph = {
          id: item.id,
          kind: 'paragraph',
          isNoteLine: standalone,
          rawText: item.rawText
        };
      } else if (standalone) {
        flushParagraph();
        currentParagraph = {
          id: item.id,
          kind: 'paragraph',
          isNoteLine: true,
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
      idx++;
      continue;
    }

    flushParagraph();
    mergedLines.push(item);
    idx++;
  }

  flushParagraph();
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
