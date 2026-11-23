/**
 * Auto-repair question numbering for Reading exams extracted from a PDF by AI.
 *
 * Gemini sometimes returns question numbers that are missing, duplicated, restarted
 * per passage (Passage 2 = 1..13 instead of 14..26) or inline cloze gaps ({{N}}) that
 * do not match any fill question. Instead of rejecting the whole PDF, we repair what can
 * be repaired deterministically and report warnings so the teacher can review.
 */

import { isInlineClozeQuestion } from './clozeHelpers.js';
import { matchChoiceOption } from './examHelpers.js';
import { extractPassageParagraphLetters } from './examUiHelpers.js';

const CLOZE_TOKEN_REGEX = /\{\{\s*(\d+)\s*\}\}|\[\s*(\d+)\s*\]|\(__+\s*(\d+)\s*__+\)/g;
const LEADING_NUMBER_REGEX = /^(\s*(?:(?:câu|questions?|q)\s*)?)(\d{1,3})(\s*[-–—]\s*\d{1,3})?(?=\s*[.):\-–—]|\s|$)/i;

function toPositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function getEnd(question) {
  const start = question.questionNumber;
  const end = toPositiveInt(question.questionEndNumber);
  return end && end > start ? end : start;
}

export function listClozeNumbers(clozeText = '') {
  const seen = new Set();
  const ordered = [];
  String(clozeText || '').replace(CLOZE_TOKEN_REGEX, (token, a, b, c) => {
    const num = toPositiveInt(a || b || c);
    if (num && !seen.has(num)) {
      seen.add(num);
      ordered.push(num);
    }
    return token;
  });
  return ordered;
}

export function remapClozeNumbers(clozeText = '', mapFn) {
  return String(clozeText || '').replace(CLOZE_TOKEN_REGEX, (token, a, b, c) => {
    const num = toPositiveInt(a || b || c);
    if (!num) return token;
    const next = mapFn(num);
    if (!toPositiveInt(next) || next === num) return token;
    return token.replace(String(num), String(next));
  });
}

function normalizePrompt(text = '') {
  return String(text || '')
    .replace(LEADING_NUMBER_REGEX, '')
    .replace(/^[\s.):\-–—]+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9à-ỹ]+/gi, ' ')
    .trim();
}

function rewriteLeadingNumber(text, start, end) {
  const raw = String(text || '');
  const match = raw.match(LEADING_NUMBER_REGEX);
  if (!match) return raw;
  const label = end && end > start ? `${start}-${end}` : `${start}`;
  return raw.replace(LEADING_NUMBER_REGEX, `${match[1]}${label}`);
}

function hasAnswer(question) {
  return Boolean(String(question.correctAnswer || '').trim()) ||
    (Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0);
}

function shiftQuestion(question, delta) {
  if (!delta) return question;
  const next = { ...question, questionNumber: question.questionNumber + delta };
  if (toPositiveInt(question.questionEndNumber)) next.questionEndNumber = question.questionEndNumber + delta;
  if (toPositiveInt(question.blankNum)) next.blankNum = question.blankNum + delta;
  return next;
}

function formatNumberList(nums) {
  const sorted = Array.from(new Set(nums)).sort((a, b) => a - b);
  return sorted.length > 12 ? `${sorted.slice(0, 12).join(', ')}…` : sorted.join(', ');
}

/**
 * Build a { number: [answers] } lookup from an optional AI answerKey array/object.
 */
export function buildAnswerKeyMap(rawAnswerKey) {
  const map = new Map();
  const add = (numValue, answersValue) => {
    const num = toPositiveInt(numValue);
    if (!num) return;
    const answers = (Array.isArray(answersValue) ? answersValue : [answersValue])
      .map(answer => String(answer ?? '').trim())
      .filter(Boolean);
    if (answers.length) map.set(num, answers);
  };
  if (Array.isArray(rawAnswerKey)) {
    rawAnswerKey.forEach(entry => {
      if (!entry || typeof entry !== 'object') return;
      add(entry.questionNumber ?? entry.number ?? entry.num, entry.answers ?? entry.answer ?? entry.correctAnswer);
    });
  } else if (rawAnswerKey && typeof rawAnswerKey === 'object') {
    Object.entries(rawAnswerKey).forEach(([key, value]) => add(key, value));
  }
  return map;
}

/**
 * @param {Array<{title, passageText, clozeText, questions}>} rawPassages passages in PDF order.
 *   Each question may carry questionNumber / questionEndNumber / blankNum (possibly wrong or missing).
 * @param {{ answerKey?: Map<number, string[]> }} options
 * @returns {{ passages: Array, warnings: string[] }}
 */
export function repairReadingPdfNumbering(rawPassages = [], { answerKey = new Map() } = {}) {
  const warnings = [];
  const inferred = [];
  const renumbered = [];

  // 1. Fill in missing printed numbers using neighbouring questions (keeping AI/PDF order).
  let passages = rawPassages.map((passage, passageIdx) => {
    const list = (Array.isArray(passage.questions) ? passage.questions : []).map(q => {
      const questionNumber = toPositiveInt(q.questionNumber) || toPositiveInt(q.blankNum);
      return { ...q, questionNumber: questionNumber || null };
    });
    list.forEach((q, idx) => {
      if (q.questionNumber) return;
      let guess = null;
      for (let back = idx - 1; back >= 0; back -= 1) {
        if (list[back].questionNumber) {
          guess = getEnd(list[back]) + (idx - back);
          break;
        }
      }
      if (!guess) {
        for (let fwd = idx + 1; fwd < list.length; fwd += 1) {
          if (list[fwd].questionNumber && !list[fwd]._inferred) {
            guess = Math.max(1, list[fwd].questionNumber - (fwd - idx));
            break;
          }
        }
      }
      q.questionNumber = guess || idx + 1;
      q._inferred = true;
      inferred.push(q.questionNumber);
    });
    return { ...passage, _order: passageIdx, questions: list };
  });

  // 2. Put passages in printed order when their ranges are disjoint; otherwise keep PDF order.
  const ranges = passages.map(p => {
    const nums = p.questions.map(q => q.questionNumber);
    return nums.length ? { min: Math.min(...nums), max: Math.max(...p.questions.map(getEnd)) } : null;
  });
  const disjoint = ranges.every((range, i) =>
    !range || ranges.every((other, j) => i === j || !other || range.max < other.min || other.max < range.min)
  );
  if (disjoint) {
    passages = passages
      .map((p, i) => ({ p, key: ranges[i]?.min ?? Number.POSITIVE_INFINITY, i }))
      .sort((a, b) => a.key - b.key || a.i - b.i)
      .map(item => item.p);
  }

  // 3. Per passage: merge exact duplicates, then bump colliding numbers into the next free slot.
  passages = passages.map(passage => {
    const sorted = passage.questions
      .map((q, idx) => ({ q, idx }))
      .sort((a, b) => a.q.questionNumber - b.q.questionNumber || a.idx - b.idx)
      .map(item => item.q);
    const result = [];
    let lastEnd = 0;
    sorted.forEach(q => {
      const prev = result[result.length - 1];
      if (prev && q.questionNumber <= lastEnd) {
        const samePrompt = normalizePrompt(prev.question) === normalizePrompt(q.question) ||
          !normalizePrompt(q.question);
        const sameSlot = q.questionNumber >= prev.questionNumber && q.questionNumber <= getEnd(prev);
        if (samePrompt && sameSlot) {
          if (!hasAnswer(prev) && hasAnswer(q)) {
            prev.correctAnswer = q.correctAnswer;
            if (q.correctAnswers) prev.correctAnswers = q.correctAnswers;
          }
          return;
        }
        const width = getEnd(q) - q.questionNumber;
        const from = q.questionNumber;
        q.questionNumber = lastEnd + 1;
        if (width > 0) q.questionEndNumber = q.questionNumber + width;
        if (q.blankNum) q.blankNum = q.questionNumber;
        renumbered.push(`${from}→${q.questionNumber}`);
      }
      result.push(q);
      lastEnd = Math.max(lastEnd, getEnd(q));
    });
    return { ...passage, questions: result };
  });

  // 4. Passages that restarted numbering (e.g. Passage 2 printed as 1..13) continue from the previous one.
  let prevMaxEnd = 0;
  passages = passages.map((passage, passageIdx) => {
    if (passage.questions.length === 0) return passage;
    const minStart = Math.min(...passage.questions.map(q => q.questionNumber));
    let next = passage;
    if (minStart <= prevMaxEnd) {
      const delta = prevMaxEnd + 1 - minStart;
      const oldNumbers = new Set(passage.questions.flatMap(q => [q.questionNumber, q.blankNum].filter(Boolean)));
      const clozeNums = listClozeNumbers(passage.clozeText);
      const clozeFollowsQuestions = clozeNums.length > 0 && clozeNums.every(n => oldNumbers.has(n));
      next = {
        ...passage,
        clozeText: clozeFollowsQuestions
          ? remapClozeNumbers(passage.clozeText, n => n + delta)
          : passage.clozeText,
        questions: passage.questions.map(q => shiftQuestion(q, delta))
      };
      warnings.push(
        `Passage ${passageIdx + 1}: AI đánh lại số từ ${minStart}, đã tự nối tiếp thành ${minStart + delta}–${Math.max(...next.questions.map(getEnd))}.`
      );
    }
    prevMaxEnd = Math.max(prevMaxEnd, ...next.questions.map(getEnd));
    return next;
  });

  // 5. Link inline cloze gaps {{N}} to fill / summary_box / summary_nobox / diagram_label questions; repair or create missing ones.
  const created = [];
  passages = passages.map((passage, passageIdx) => {
    const clozeNums = listClozeNumbers(passage.clozeText);
    if (clozeNums.length === 0) return passage;
    let clozeText = passage.clozeText;
    let questions = passage.questions.map(q => ({ ...q }));
    const linkedClozeNumbers = () =>
      new Set(
        questions
          .filter(q => isInlineClozeQuestion(q))
          .map(q => q.blankNum || q.questionNumber)
      );

    // 5a. Match existing questions by printed number: keep summary_box/choice options intact, convert plain text questions to fill.
    clozeNums.forEach(n => {
      const target = questions.find(q => q.questionNumber === n);
      if (!target) return;
      if (isInlineClozeQuestion(target)) {
        target.blankNum = n;
        return;
      }
      if ((!Array.isArray(target.options) || target.options.length === 0) && target.type !== 'tfng') {
        target.type = 'fill';
        target.blankNum = n;
        delete target.correctAnswers;
        delete target.requiredSelections;
      }
    });

    // 5b. Cloze uses a different numbering than the inline blank questions -> map by order.
    let unlinked = clozeNums.filter(n => !linkedClozeNumbers().has(n));
    if (unlinked.length > 0) {
      const clozeSet = new Set(clozeNums);
      const orphanBlanks = questions
        .filter(q => isInlineClozeQuestion(q) && !clozeSet.has(q.blankNum || q.questionNumber))
        .map(q => q.blankNum || q.questionNumber)
        .sort((a, b) => a - b);
      if (orphanBlanks.length === unlinked.length) {
        const mapping = new Map(unlinked.map((n, i) => [n, orphanBlanks[i]]));
        clozeText = remapClozeNumbers(clozeText, n => mapping.get(n) ?? n);
        warnings.push(
          `Passage ${passageIdx + 1}: số ô trống trong bảng/ghi chú (${formatNumberList(unlinked)}) đã được khớp lại theo câu ${formatNumberList(orphanBlanks)}.`
        );
        unlinked = [];
      }
    }

    // 5c. Still missing -> create a fill question only when no question with that number exists.
    unlinked.forEach(n => {
      if (questions.some(q => q.questionNumber === n)) return;
      const answers = answerKey.get(n) || [];
      questions.push({
        type: 'fill',
        blankNum: n,
        questionNumber: n,
        question: `${n}. Ô trống số ${n}`,
        options: [],
        wordLimit: '',
        correctAnswer: answers[0] || '',
        ...(answers.length > 1 ? { correctAnswers: answers } : {})
      });
      created.push(n);
    });

    return { ...passage, clozeText, questions };
  });

  // 6. Answers from the answer key, canonical option matching, consistent blankNum, matching printed prefix, final sort.
  passages = passages.map(passage => {
    const clozeSet = new Set(listClozeNumbers(passage.clozeText));
    const passageLetters = extractPassageParagraphLetters(passage.passageText);
    const defaultParagraphLetters = passageLetters.length >= 2 ? passageLetters : ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

    const sortedRaw = [...passage.questions].sort((a, b) => a.questionNumber - b.questionNumber);

    // Propagate shared options across consecutive matching / word-box / flowchart questions
    for (let k = 0; k < sortedRaw.length; k++) {
      const curr = sortedRaw[k];
      if (
        curr.type === 'matching_features' ||
        curr.type === 'matching_headings' ||
        curr.type === 'matching' ||
        curr.type === 'flowchart_completion' ||
        curr.type === 'summary_box'
      ) {
        const currOpts = Array.isArray(curr.options) ? curr.options.filter(Boolean) : [];
        if (currOpts.length === 0) {
          let donor = null;
          for (let m = k - 1; m >= 0 && sortedRaw[m].type === curr.type; m--) {
            if (Array.isArray(sortedRaw[m].options) && sortedRaw[m].options.length > 0) {
              donor = sortedRaw[m];
              break;
            }
          }
          if (!donor) {
            for (let m = k + 1; m < sortedRaw.length && sortedRaw[m].type === curr.type; m++) {
              if (Array.isArray(sortedRaw[m].options) && sortedRaw[m].options.length > 0) {
                donor = sortedRaw[m];
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

    return {
      ...passage,
      questions: sortedRaw
        .map(q => {
          const next = { ...q };
          delete next._inferred;
          if (next.type === 'fill' || (isInlineClozeQuestion(next) && clozeSet.has(next.questionNumber))) {
            next.blankNum = next.questionNumber;
          } else {
            delete next.blankNum;
          }
          const end = getEnd(next);
          if (end > next.questionNumber) next.questionEndNumber = end;
          else delete next.questionEndNumber;

          // Auto-repair matching_information options if empty
          if (next.type === 'matching_information') {
            const currentOpts = Array.isArray(next.options) ? next.options.filter(Boolean) : [];
            if (currentOpts.length === 0) {
              next.options = defaultParagraphLetters;
              if (!next.instruction) next.instruction = 'Which paragraph contains the following information?';
              next.hasNB = true;
            }
          }

          if (!hasAnswer(next)) {
            const keyed = answerKey.get(next.questionNumber);
            if (keyed?.length) {
              next.correctAnswer = keyed[0];
              if (next.type === 'mcq') next.correctAnswers = keyed;
            }
          }
          if (Array.isArray(next.options) && next.options.length > 0) {
            if (next.correctAnswer) {
              const canonical = matchChoiceOption(next.correctAnswer, next.options);
              if (canonical) next.correctAnswer = canonical;
            }
            if (Array.isArray(next.correctAnswers) && next.correctAnswers.length > 0) {
              next.correctAnswers = Array.from(
                new Set(next.correctAnswers.map(ans => matchChoiceOption(ans, next.options) || ans))
              );
              if (!next.correctAnswer && next.correctAnswers[0]) {
                next.correctAnswer = next.correctAnswers[0];
              }
            }
          }
          next.question = rewriteLeadingNumber(next.question, next.questionNumber, next.questionEndNumber);
          return next;
        })
        .sort((a, b) => a.questionNumber - b.questionNumber)
    };
  }).map(({ _order, ...passage }) => passage);

  if (inferred.length) {
    warnings.push(`AI không đọc được số của câu ${formatNumberList(inferred)} nên đã tự suy ra theo câu liền kề.`);
  }
  if (renumbered.length) {
    warnings.push(`Đã sửa số câu bị trùng: ${renumbered.slice(0, 8).join(', ')}${renumbered.length > 8 ? '…' : ''}.`);
  }
  if (created.length) {
    warnings.push(`Đã tạo thêm câu điền cho ô trống ${formatNumberList(created)} (AI bỏ sót) — hãy kiểm tra đáp án.`);
  }

  // 7. Report gaps (do not block import).
  const covered = new Set();
  passages.forEach(p => p.questions.forEach(q => {
    for (let n = q.questionNumber; n <= getEnd(q); n += 1) covered.add(n);
  }));
  const maxNum = covered.size ? Math.max(...covered) : 0;
  const missing = [];
  for (let n = 1; n <= maxNum; n += 1) if (!covered.has(n)) missing.push(n);
  if (missing.length) {
    warnings.push(`Đề còn thiếu câu ${formatNumberList(missing)} — hãy bổ sung bằng tay nếu PDF có các câu này.`);
  }

  return { passages, warnings };
}
