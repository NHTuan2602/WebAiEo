import { useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { parseClozeLines, resolveQuestionForBlank } from '../../utils/clozeHelpers';
import {
  extractLeadingOptionCode,
  matchChoiceOption,
  optionsUseSpaceSeparatedCodes,
  stripLeadingOptionCode
} from '../../utils/examHelpers';

function getLinePlainText(line) {
  return (line?.segments || []).map(s => (s.type === 'text' ? s.value : '')).join('').trim();
}

function splitClozeSections(parsedLines = []) {
  const sections = [];
  let current = [];
  for (const line of parsedLines) {
    const plain = getLinePlainText(line);
    const isNewQuestionHeader =
      line.kind !== 'spacer' &&
      (line.kind === 'groupHeader' || /^Questions?\s+\d+/i.test(plain)) &&
      current.some(item => item.kind !== 'spacer');
    if (isNewQuestionHeader) {
      sections.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) sections.push(current);
  return sections;
}

function isRedundantOptionBoxLine(line, optionList = []) {
  if (!optionList.length || line.kind === 'spacer') return false;
  if (line.segments.some(seg => seg.type === 'blank')) return false;
  const plain = getLinePlainText(line).toLowerCase().replace(/\s+/g, ' ');
  if (!plain || plain.length > 260) return false;
  // Exact single option line match (e.g. "A ask questions" or "A. ask questions")
  if (
    optionList.some(opt => {
      const cleanOpt = String(opt || '').trim().toLowerCase().replace(/\s+/g, ' ');
      return cleanOpt && (plain === cleanOpt || plain.replace(/^([a-l])[.):\-–]\s+/i, '$1 ') === cleanOpt.replace(/^([a-l])[.):\-–]\s+/i, '$1 '));
    })
  ) {
    return true;
  }
  let hits = 0;
  for (const opt of optionList) {
    const clean = String(opt || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (clean.length >= 2 && plain.includes(clean)) hits += 1;
  }
  return hits >= Math.min(3, optionList.length);
}

/**
 * Fallback recovery for existing/legacy exams where AI left the A-H option list
 * as raw lines inside clozeText (e.g. "A ask questions\nB complete a worksheet...")
 * without attaching `options` to the blank questions.
 */
function recoverInlineWordBoxFromSectionLines(sectionLines = []) {
  const optionLineIndices = [];
  const extracted = [];
  for (let i = 0; i < sectionLines.length; i += 1) {
    const line = sectionLines[i];
    if (line.kind === 'spacer' || line.kind === 'table' || line.kind === 'flowArrow') continue;
    if (line.segments.some(seg => seg.type === 'blank')) continue;
    const plain = getLinePlainText(line);
    if (/^[A-L](?:[.):\-–]|\s+)\s*\S+/.test(plain) && plain.length <= 120 && !/^Questions?\s+\d+/i.test(plain)) {
      const code = plain[0].toUpperCase();
      if (extracted.length === 0 && code !== 'A') continue;
      optionLineIndices.push(i);
      extracted.push(plain.replace(/\s+/g, ' ').trim());
    } else if (extracted.length > 0 && extracted.length < 3) {
      optionLineIndices.length = 0;
      extracted.length = 0;
    } else if (extracted.length >= 3) {
      break;
    }
  }
  if (extracted.length >= 3) {
    return {
      recoveredOptions: extracted,
      optionLineIndexSet: new Set(optionLineIndices)
    };
  }
  return { recoveredOptions: [], optionLineIndexSet: new Set() };
}

export default function ClozeNoteSheet({
  activeBlankNum = null,
  answers = {},
  bookmarkedQuestions = {},
  clozeText = '',
  fontSizeClass = 'text-[16px] leading-[1.6]',
  inputRefs = null,
  onAnswerChange,
  onBlankFocus,
  onPassageTextSelect,
  onToggleBookmark,
  onZoomImage = null,
  questions = [],
  readOnlyPreview = false,
  renderText = null,
  scopeField = 'trackIdx',
  scopeIdx = 0
}) {
  const [dragOverBlank, setDragOverBlank] = useState(null);
  const parsedLines = parseClozeLines(clozeText);
  if (parsedLines.length === 0) return null;

  const nonClozeScopeQuestions = (Array.isArray(questions) ? questions : []).filter(q => {
    if (!q || typeof q.blankNum === 'number') return false;
    if (typeof q[scopeField] === 'number' && typeof scopeIdx === 'number' && q[scopeField] !== scopeIdx) {
      return false;
    }
    return true;
  });
  const nonClozeNumSet = new Set(
    nonClozeScopeQuestions
      .map(q => Number(q?.questionNumber))
      .filter(n => Number.isFinite(n) && n > 0)
  );
  const isRedundantNonClozeStemLine = (line) => {
    if (!line || line.kind === 'spacer' || line.segments.some(seg => seg.type === 'blank')) return false;
    if (nonClozeNumSet.size === 0) return false;
    const plain = getLinePlainText(line);
    if (!plain) return false;
    // Detect flattened stem dump like "15 Information Centre 16 Library 17 Museum 18 Art Gallery 19 Restaurant 20 BBQ"
    const numTokens = [...plain.matchAll(/\b(\d{1,2})\s+[A-Za-z]/g)].map(m => Number(m[1]));
    const matchingNonClozeHits = numTokens.filter(n => nonClozeNumSet.has(n)).length;
    if (matchingNonClozeHits >= 2) return true;
    // Detect single numbered stem line matching a non-cloze question (e.g. "15 Information Centre")
    const singleMatch = plain.match(/^(\d{1,2})[.):\-–\s]+(.+)$/);
    if (singleMatch && nonClozeNumSet.has(Number(singleMatch[1]))) {
      const stem = singleMatch[2].trim().toLowerCase();
      const matchedQ = nonClozeScopeQuestions.find(q => Number(q.questionNumber) === Number(singleMatch[1]));
      const qText = String(matchedQ?.question || '').replace(/^\d{1,2}[.):\-–\s]+/, '').trim().toLowerCase();
      if (qText && (stem === qText || qText.startsWith(stem) || stem.startsWith(qText))) {
        return true;
      }
    }
    return false;
  };

  const cleanedParsedLines = parsedLines.filter(line => !isRedundantNonClozeStemLine(line));
  if (cleanedParsedLines.length === 0) return null;

  const sections = splitClozeSections(cleanedParsedLines);

  const renderSection = (sectionLines, sectionIdx) => {
    // Collect choice-based blanks (e.g. summary_box with A-I Word Box) in this section
    const sectionBlankLinks = [];
    const seenBlanks = new Set();
    sectionLines.forEach(line => {
      line.segments.forEach(seg => {
        if (seg.type !== 'blank' || seenBlanks.has(seg.blankNum)) return;
        seenBlanks.add(seg.blankNum);
        const linkedQ = resolveQuestionForBlank(questions, seg.blankNum, scopeField, scopeIdx);
        sectionBlankLinks.push({ blankNum: seg.blankNum, linkedQ });
      });
    });

    if (
      sectionBlankLinks.length === 0 &&
      nonClozeScopeQuestions.length > 0 &&
      !sectionLines.some(l => l.kind === 'table' || l.kind === 'flowArrow')
    ) {
      return null;
    }

    const choiceBlanks = sectionBlankLinks.filter(
      item => Array.isArray(item.linkedQ?.options) && item.linkedQ.options.length > 0
    );
    const sharedWordBoxOptions = [];
    const seenOpts = new Set();
    choiceBlanks.forEach(({ linkedQ }) => {
      linkedQ.options.forEach(rawOpt => {
        const clean = String(rawOpt || '').trim();
        if (clean && !seenOpts.has(clean)) {
          seenOpts.add(clean);
          sharedWordBoxOptions.push(clean);
        }
      });
    });

    // Runtime safety net: recover inline A-H word-bank lines if options were missing on legacy tests
    let recoveredOptionLineIndexSet = new Set();
    if (sharedWordBoxOptions.length === 0) {
      const recovered = recoverInlineWordBoxFromSectionLines(sectionLines);
      if (recovered.recoveredOptions.length >= 3) {
        recovered.recoveredOptions.forEach(opt => {
          if (!seenOpts.has(opt)) {
            seenOpts.add(opt);
            sharedWordBoxOptions.push(opt);
          }
        });
        recoveredOptionLineIndexSet = recovered.optionLineIndexSet;
      }
    }

    const effectiveChoiceBlanks =
      sharedWordBoxOptions.length > 0 ? sectionBlankLinks : choiceBlanks;

    const sectionImageUrl = sectionBlankLinks.find(item => item.linkedQ?.imageUrl)?.linkedQ?.imageUrl || '';

    const filteredLines = sharedWordBoxOptions.length > 0
      ? sectionLines.filter(
          (line, lIdx) =>
            !recoveredOptionLineIndexSet.has(lIdx) &&
            !isRedundantOptionBoxLine(line, sharedWordBoxOptions)
        )
      : sectionLines;

    const firstBodyIdx = filteredLines.findIndex(
      l =>
        l.kind === 'table' ||
        l.kind === 'flowArrow' ||
        l.kind === 'example' ||
        l.kind === 'heading' ||
        l.kind === 'bullet' ||
        l.kind === 'noteLine' ||
        l.segments.some(seg => seg.type === 'blank')
    );
    const preambleLines = firstBodyIdx > 0 ? filteredLines.slice(0, firstBodyIdx) : [];
    const boxLines = firstBodyIdx > 0 ? filteredLines.slice(firstBodyIdx) : filteredLines;

    const preambleJoined = preambleLines.map(getLinePlainText).join(' ').toLowerCase();
    const hasTableBlock = boxLines.some(l => l.kind === 'table');
    const hasFlowArrow = boxLines.some(l => l.kind === 'flowArrow');
    const isFlowchartSection = hasFlowArrow || /flow[\s-]?chart/i.test(preambleJoined);
    const isNoteSection = !hasTableBlock && !isFlowchartSection && (
      /complete the notes|complete the form/i.test(preambleJoined) ||
      boxLines.some(l => l.kind === 'example' || l.kind === 'noteLine' || l.kind === 'heading')
    );
    const sectionKindLabel = hasTableBlock
      ? 'Table Completion'
      : isFlowchartSection
      ? 'Flow-chart Completion'
      : isNoteSection
      ? 'Note Completion'
      : sharedWordBoxOptions.length > 0
      ? 'Summary Completion (Box)'
      : 'Summary Completion';

    const blankNumbers = sectionBlankLinks
      .map(item => Number(item.blankNum))
      .filter(num => Number.isFinite(num) && num > 0);
    const minBlank = blankNumbers.length ? Math.min(...blankNumbers) : null;
    const maxBlank = blankNumbers.length ? Math.max(...blankNumbers) : null;
    const questionRangeLabel = minBlank
      ? minBlank === maxBlank
        ? `Question ${minBlank}`
        : `Questions ${minBlank}–${maxBlank}`
      : '';

    const hasPreambleHeader =
      preambleLines.some(l => l.kind === 'groupHeader' || /^Questions?\s+\d+/i.test(getLinePlainText(l))) ||
      boxLines.some(l => l.kind === 'groupHeader');
    const hasPreambleWordLimit =
      preambleLines.some(l => l.kind === 'wordLimit' || /(?:write\s+|choose\s+)?(?:one|two|three|no\s+more)\s+words?/i.test(getLinePlainText(l))) ||
      boxLines.some(l => l.kind === 'wordLimit');
    const linkedWordLimit = sectionBlankLinks.find(item => item.linkedQ?.wordLimit)?.linkedQ?.wordLimit || '';
    const linkedInstruction = sectionBlankLinks.find(item => item.linkedQ?.instruction)?.linkedQ?.instruction || '';

    const allowSpacedCodes = optionsUseSpaceSeparatedCodes(sharedWordBoxOptions);
    const usedByMap = new Map();
    effectiveChoiceBlanks.forEach(({ blankNum, linkedQ }) => {
      const rawAns = readOnlyPreview ? (linkedQ?.correctAnswer || '') : (linkedQ?.id ? (answers?.[linkedQ.id] || '') : '');
      const canonical = matchChoiceOption(rawAns, sharedWordBoxOptions) || String(rawAns || '').trim();
      if (!canonical) return;
      const list = usedByMap.get(canonical) || [];
      list.push(blankNum);
      usedByMap.set(canonical, list);
    });

    const handleWordChipClick = (optionVal) => {
      if (readOnlyPreview || effectiveChoiceBlanks.length === 0) return;
      const activeTarget = effectiveChoiceBlanks.find(
        item => Number(item.blankNum) === Number(activeBlankNum) && item.linkedQ?.id
      );
      const firstEmptyTarget = effectiveChoiceBlanks.find(
        item => item.linkedQ?.id && !String(answers?.[item.linkedQ.id] || '').trim()
      );
      const target = activeTarget || firstEmptyTarget || effectiveChoiceBlanks[0];
      if (!target?.linkedQ?.id) return;
      onAnswerChange?.(target.linkedQ.id, optionVal);

      // Advance focus to the next unanswered choice blank in this section
      const nextEmpty = effectiveChoiceBlanks.find(
        item =>
          item.blankNum !== target.blankNum &&
          item.linkedQ?.id &&
          !String(answers?.[item.linkedQ.id] || '').trim()
      );
      if (nextEmpty) {
        onBlankFocus?.(nextEmpty.blankNum, nextEmpty.linkedQ.id);
      } else {
        onBlankFocus?.(target.blankNum, target.linkedQ.id);
      }
    };

    const renderSegments = (segments) =>
      segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <span key={idx}>{typeof renderText === 'function' ? renderText(seg.value) : seg.value}</span>;
        }

        const linkedQ = resolveQuestionForBlank(questions, seg.blankNum, scopeField, scopeIdx);
        const qId = linkedQ?.id;
        const ownOptions = Array.isArray(linkedQ?.options)
          ? linkedQ.options.map(opt => String(opt || '').trim()).filter(Boolean)
          : [];
        const optionList = ownOptions.length > 0 ? ownOptions : sharedWordBoxOptions;
        const isChoiceBlank = optionList.length > 0;
        const rawValue = readOnlyPreview ? (linkedQ?.correctAnswer || '') : (qId ? (answers?.[qId] || '') : '');
        const resolvedChoiceVal = isChoiceBlank
          ? (matchChoiceOption(rawValue, optionList) || String(rawValue || '').trim())
          : String(rawValue || '');
        const isActive = Number(activeBlankNum) === Number(seg.blankNum);
        const isDragOver = Number(dragOverBlank) === Number(seg.blankNum);
        const isFlagged = Boolean(qId && bookmarkedQuestions?.[qId]);

        if (isChoiceBlank) {
          const selectedCode = extractLeadingOptionCode(resolvedChoiceVal, {
            allowSpaceSeparated: allowSpacedCodes
          });
          return (
            <span
              key={`blank-${seg.blankNum}-${idx}`}
              onDragOver={e => {
                if (readOnlyPreview || !qId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                if (dragOverBlank !== seg.blankNum) setDragOverBlank(seg.blankNum);
              }}
              onDragLeave={() => {
                if (dragOverBlank === seg.blankNum) setDragOverBlank(null);
              }}
              onDrop={e => {
                e.preventDefault();
                setDragOverBlank(null);
                if (readOnlyPreview || !qId) return;
                const dropped = e.dataTransfer.getData('text/plain');
                if (!dropped) return;
                const canonical = matchChoiceOption(dropped, optionList) || dropped;
                onAnswerChange?.(qId, canonical);
                onBlankFocus?.(seg.blankNum, qId);
              }}
              className="inline-flex items-center align-baseline mx-1.5 my-1 gap-1.5"
            >
              <span
                className={`inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-full text-[12px] font-extrabold border shrink-0 ${
                  isActive
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : resolvedChoiceVal
                    ? 'bg-blue-100 dark:bg-[#1E2A40] text-[#1D4ED8] dark:text-[#93C5FD] border-[#93C5FD] dark:border-[#3B82F6]/50'
                    : 'bg-slate-100 dark:bg-[#23262E] text-[#111827] dark:text-[#E5E7EB] border-slate-300 dark:border-[#4A4D57]'
                }`}
              >
                {seg.blankNum}
              </span>
              <select
                ref={el => {
                  if (inputRefs?.current && el) {
                    inputRefs.current[seg.blankNum] = el;
                  }
                }}
                disabled={readOnlyPreview}
                value={resolvedChoiceVal}
                aria-label={`Câu ${seg.blankNum}`}
                onFocus={() => onBlankFocus?.(seg.blankNum, qId)}
                onClick={() => onBlankFocus?.(seg.blankNum, qId)}
                onChange={e => {
                  if (readOnlyPreview || !qId) return;
                  onAnswerChange?.(qId, e.target.value);
                  onBlankFocus?.(seg.blankNum, qId);
                }}
                title={resolvedChoiceVal || `Chọn đáp án câu ${seg.blankNum}`}
                className={`min-w-[82px] max-w-[220px] h-[34px] px-2.5 rounded-lg text-[14px] font-extrabold text-center transition-all outline-none border cursor-pointer ${
                  isDragOver
                    ? 'bg-blue-50 dark:bg-blue-500/25 text-[#111827] dark:text-white border-[#2563EB] ring-2 ring-[#2563EB]/50'
                    : isActive
                    ? 'bg-[#FFFDF7] dark:bg-[#23262E] text-[#111827] dark:text-white border-[#A16207] dark:border-[#EAB308] ring-1 ring-[#CA8A04]/45'
                    : resolvedChoiceVal
                    ? 'bg-blue-50/70 dark:bg-[#1E2A40] text-[#111827] dark:text-white border-[#2563EB] dark:border-[#60A5FA]'
                    : 'bg-[#F1F5F9] dark:bg-[#252830] text-[#111827] dark:text-[#E5E7EB] border-[#CBD5E1] dark:border-[#4A4D57] hover:border-[#111827] dark:hover:border-[#9CA3AF]'
                }`}
              >
                <option value="">— Chọn —</option>
                {optionList.map((opt, optIdx) => {
                  const optCode = extractLeadingOptionCode(opt, { allowSpaceSeparated: allowSpacedCodes });
                  const optBody = optCode ? stripLeadingOptionCode(opt, { allowSpaceSeparated: allowSpacedCodes }) : '';
                  const displayLabel =
                    optCode && optBody && optBody !== opt
                      ? `${optCode.toUpperCase()} — ${optBody}`
                      : optCode
                      ? optCode.toUpperCase()
                      : opt;
                  return (
                    <option key={optIdx} value={opt}>
                      {displayLabel}
                    </option>
                  );
                })}
              </select>
              {selectedCode && !isFlowchartSection && (
                <span className="sr-only">{selectedCode}</span>
              )}
              {!readOnlyPreview && resolvedChoiceVal && qId && (
                <button
                  type="button"
                  onClick={() => {
                    onAnswerChange?.(qId, '');
                    onBlankFocus?.(seg.blankNum, qId);
                  }}
                  title={`Xóa đáp án câu ${seg.blankNum}`}
                  className="p-0.5 rounded text-slate-400 hover:text-rose-500 dark:text-neutral-400 dark:hover:text-rose-400 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {!readOnlyPreview && onToggleBookmark && qId && (
                <button
                  type="button"
                  onClick={() => onToggleBookmark(qId)}
                  title={isFlagged ? `Bỏ đánh dấu câu ${seg.blankNum}` : `Đánh dấu xem lại câu ${seg.blankNum}`}
                  className={`p-0.5 rounded transition ${
                    isFlagged
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-slate-400 dark:text-neutral-500 hover:text-amber-500'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
                </button>
              )}
            </span>
          );
        }

        return (
          <span key={`blank-${seg.blankNum}-${idx}`} className="inline-flex items-center align-baseline mx-1.5 my-1 gap-1">
            <input
              ref={el => {
                if (inputRefs?.current && el) {
                  inputRefs.current[seg.blankNum] = el;
                }
              }}
              type="text"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              readOnly={readOnlyPreview}
              value={resolvedChoiceVal}
              placeholder={`(${seg.blankNum})`}
              aria-label={`Câu ${seg.blankNum}`}
              onFocus={() => onBlankFocus?.(seg.blankNum, qId)}
              onChange={e => {
                if (readOnlyPreview || !qId) return;
                onAnswerChange?.(qId, e.target.value);
              }}
              className={`w-28 sm:w-36 h-[32px] px-2.5 rounded-md text-center text-[14px] font-extrabold transition-all outline-none ${
                isActive
                  ? 'border border-[#A16207] dark:border-[#EAB308] bg-[#FFFDF7] dark:bg-[#23262E] text-[#111827] dark:text-white ring-1 ring-[#CA8A04]/45'
                  : resolvedChoiceVal
                  ? 'border border-[#2563EB] dark:border-[#60A5FA] bg-white dark:bg-[#2A2F3D] text-[#111827] dark:text-white'
                  : 'border border-dashed border-[#94A3B8] dark:border-[#64748B] bg-[#F1F5F9]/90 dark:bg-[#2A2D36] text-[#111827] dark:text-white hover:border-[#475569] dark:hover:border-[#9CA3AF]'
              } placeholder:text-[#111827] dark:placeholder:text-[#F3F4F6] placeholder:font-extrabold`}
            />
            {!readOnlyPreview && onToggleBookmark && qId && (
              <button
                type="button"
                onClick={() => onToggleBookmark(qId)}
                title={isFlagged ? `Bỏ đánh dấu câu ${seg.blankNum}` : `Đánh dấu xem lại câu ${seg.blankNum}`}
                className={`p-0.5 rounded transition ${
                  isFlagged
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-slate-400 dark:text-neutral-500 hover:text-amber-500'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
              </button>
            )}
          </span>
        );
      });

    const renderLine = (line) => {
      if (line.kind === 'spacer') {
        return <div key={line.id} className="h-2" />;
      }
      if (line.kind === 'flowArrow') {
        return (
          <div key={line.id} className="flex justify-center py-0.5 text-slate-600 dark:text-zinc-300 font-bold text-base select-none">
            ↓
          </div>
        );
      }
      if (line.kind === 'table') {
        return (
          <div key={line.id} className="overflow-x-auto border-[1.5px] border-slate-800 dark:border-slate-400 bg-white dark:bg-[#14161B] my-2">
            <table className="w-full border-collapse text-left">
              {line.hasHeader && line.headerRow && (
                <thead>
                  <tr className="border-b-[1.5px] border-slate-800 dark:border-slate-400 bg-white dark:bg-[#1A1D24]">
                    {line.headerRow.cells.map((cellLines, cIdx) => (
                      <th
                        key={cIdx}
                        className="py-3.5 px-4 text-[14px] font-extrabold text-[#111827] dark:text-white align-middle text-left"
                      >
                        {cellLines.map((cl, lIdx) => (
                          <div key={lIdx}>{renderSegments(cl.segments)}</div>
                        ))}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {(line.bodyRows || []).map((row, rIdx) => (
                  <tr
                    key={row.id ?? rIdx}
                    className="border-b-[1.5px] last:border-b-0 border-slate-800 dark:border-slate-400 align-top"
                  >
                    {row.cells.map((cellLines, cIdx) => (
                      <td
                        key={cIdx}
                        className={`py-4 px-4 ${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[1.85]`}
                      >
                        {cellLines.length === 0 ? (
                          <span>&nbsp;</span>
                        ) : (
                          <div className="space-y-2">
                            {cellLines.map((cl, lIdx) =>
                              cl.isBullet ? (
                                <div key={lIdx} className="flex items-start gap-2.5">
                                  <span className="mt-2 text-[14px] leading-none text-[#111827] dark:text-zinc-200 shrink-0">•</span>
                                  <div className="flex-1">{renderSegments(cl.segments)}</div>
                                </div>
                              ) : (
                                <div key={lIdx}>{renderSegments(cl.segments)}</div>
                              )
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      if (line.kind === 'groupHeader') {
        return (
          <div key={line.id} className="flex flex-wrap items-center gap-2 pt-2 pb-1 border-b border-slate-200 dark:border-[#32353E]">
            <h4 className="text-[17px] font-extrabold text-[#111827] dark:text-white">
              {renderSegments(line.segments)}
            </h4>
            <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/35">
              {sectionKindLabel}
            </span>
          </div>
        );
      }
      if (line.kind === 'wordLimit') {
        return (
          <div key={line.id} className="pt-1 pb-1">
            <span className="inline-block px-2.5 py-1 rounded text-xs font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 uppercase tracking-wide">
              {renderSegments(line.segments)}
            </span>
          </div>
        );
      }
      if (line.kind === 'example') {
        return (
          <p key={line.id} className={`${fontSizeClass} italic text-slate-700 dark:text-zinc-300 leading-[1.8]`}>
            {renderSegments(line.segments)}
          </p>
        );
      }
      if (line.kind === 'heading') {
        return (
          <h4
            key={line.id}
            className="text-[16px] font-bold text-center text-[#111827] dark:text-white pt-1.5 pb-1"
          >
            {renderSegments(line.segments)}
          </h4>
        );
      }
      if (line.kind === 'subheading') {
        return (
          <h5 key={line.id} className="text-[15px] font-extrabold text-[#111827] dark:text-white pt-2">
            {renderSegments(line.segments)}
          </h5>
        );
      }
      if (line.kind === 'noteLine') {
        if (isFlowchartSection) {
          return (
            <div
              key={line.id}
              className={`rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#191B21] px-5 py-3.5 text-center ${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[1.9] shadow-2xs`}
            >
              {renderSegments(line.segments)}
            </div>
          );
        }
        return (
          <div key={line.id} className={`${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[2.05] py-0.5`}>
            {renderSegments(line.segments)}
          </div>
        );
      }
      if (line.kind === 'bullet') {
        if (isFlowchartSection) {
          return (
            <div
              key={line.id}
              className={`rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#191B21] px-5 py-3.5 text-center ${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[1.9] shadow-2xs`}
            >
              {renderSegments(line.segments)}
            </div>
          );
        }
        return (
          <div
            key={line.id}
            className={`flex items-start gap-2.5 ${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[2.05] pl-0.5`}
          >
            <span className="mt-2.5 text-[14px] leading-none text-[#111827] dark:text-[#D1D5DB] shrink-0">•</span>
            <div className="flex-1 leading-[2.05]">{renderSegments(line.segments)}</div>
          </div>
        );
      }
      if (isFlowchartSection && line.segments.some(s => s.type === 'blank')) {
        return (
          <div
            key={line.id}
            className={`rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#191B21] px-5 py-3.5 text-center ${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[1.9] shadow-2xs`}
          >
            {renderSegments(line.segments)}
          </div>
        );
      }
      return (
        <p key={line.id} className={`${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[2.05]`}>
          {renderSegments(line.segments)}
        </p>
      );
    };

    return (
      <div key={`cloze-sec-${sectionIdx}`} className="space-y-3">
        {!hasPreambleHeader && questionRangeLabel && (
          <div className="space-y-1.5 pb-2 border-b border-slate-200 dark:border-[#32353E]">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-[17px] font-extrabold text-[#111827] dark:text-white">
                {questionRangeLabel}
              </h4>
              <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/35">
                {sectionKindLabel}
              </span>
            </div>
            <p className="text-[15px] font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
              {linkedInstruction || (sharedWordBoxOptions.length > 0 ? 'Complete the summary using the list of words, A-I, below.' : 'Complete the summary below:')}
            </p>
            {sharedWordBoxOptions.length === 0 && (
              <div>
                <span className="inline-block px-2.5 py-1 rounded text-xs font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 uppercase tracking-wide">
                  Write {linkedWordLimit || 'ONE WORD ONLY'} from the passage for each answer.
                </span>
              </div>
            )}
          </div>
        )}

        {preambleLines.length > 0 && (
          <div className="space-y-1.5 pb-1">
            {preambleLines.map(line => {
              if (line.kind === 'spacer') {
                return <div key={line.id} className="h-1" />;
              }
              if (line.kind === 'groupHeader' || /^Questions?\s+\d+/i.test(getLinePlainText(line))) {
                return (
                  <div key={line.id} className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-200 dark:border-[#32353E]">
                    <h4 className="text-[17px] font-extrabold text-[#111827] dark:text-white">
                      {renderSegments(line.segments)}
                    </h4>
                    <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/35">
                      {sectionKindLabel}
                    </span>
                  </div>
                );
              }
              if (line.kind === 'wordLimit' || /(?:write|choose)\s+(?:one|two|three|no\s+more)\s+words?/i.test(getLinePlainText(line))) {
                return (
                  <div key={line.id} className="pt-0.5">
                    <span className="inline-block px-2.5 py-1 rounded text-xs font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 uppercase tracking-wide">
                      {renderSegments(line.segments)}
                    </span>
                  </div>
                );
              }
              return (
                <p key={line.id} className="text-[15px] font-medium text-[#111827] dark:text-[#E5E7EB] leading-[1.6]">
                  {renderSegments(line.segments)}
                </p>
              );
            })}
            {hasPreambleHeader && !hasPreambleWordLimit && linkedWordLimit && sharedWordBoxOptions.length === 0 && (
              <div>
                <span className="inline-block px-2.5 py-1 rounded text-xs font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 uppercase tracking-wide">
                  Write {linkedWordLimit} from the passage for each answer.
                </span>
              </div>
            )}
          </div>
        )}

        {sectionImageUrl && (
          <div className="rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#141414] p-3 max-w-2xl">
            <img
              src={sectionImageUrl}
              alt="Bản đồ / Lưu đồ / Sơ đồ câu hỏi"
              onClick={() => onZoomImage?.(sectionImageUrl)}
              className={`w-full max-h-[420px] object-contain rounded mx-auto ${onZoomImage ? 'cursor-zoom-in' : ''}`}
            />
            {onZoomImage && (
              <button
                type="button"
                onClick={() => onZoomImage(sectionImageUrl)}
                className="mt-2 mx-auto block text-xs font-bold text-[#2563EB] hover:underline"
              >
                Bấm vào ảnh để phóng to bản đồ / sơ đồ
              </button>
            )}
          </div>
        )}

        {/* Shared Interactive Cambridge Legend Box + Body (Side-by-Side for Phrase Flow-charts matching Screenshot, Stacked 2-Col for Short Words) */}
        {(() => {
          const parsedBoxItems = sharedWordBoxOptions.map(opt => {
            const code = extractLeadingOptionCode(opt, { allowSpaceSeparated: allowSpacedCodes });
            const labelText = code ? stripLeadingOptionCode(opt, { allowSpaceSeparated: allowSpacedCodes }) : opt;
            return {
              opt,
              code: code ? code.toUpperCase() : '',
              labelText: labelText || opt,
              usedBy: usedByMap.get(opt) || []
            };
          });
          const hasPhraseOptions = parsedBoxItems.some(item => item.labelText.length > 14);
          const useSideBySideFlowchart = isFlowchartSection && parsedBoxItems.length > 0 && hasPhraseOptions;
          const useTwoColTable =
            !useSideBySideFlowchart &&
            parsedBoxItems.length >= 6 &&
            parsedBoxItems.every(item => item.labelText.length <= 28);
          const halfCount = Math.ceil(parsedBoxItems.length / 2);

          const wordBoxNode = parsedBoxItems.length > 0 ? (
            <div
              className={
                useSideBySideFlowchart
                  ? 'rounded-xl border border-slate-300 dark:border-[#3A3D46] bg-white dark:bg-[#1A1C22] p-2.5 shadow-2xs lg:sticky lg:top-4 self-start'
                  : `mx-auto my-3 rounded-xl border border-slate-300 dark:border-[#3A3D46] bg-white dark:bg-[#1A1C22] p-2 shadow-2xs ${useTwoColTable ? 'max-w-md' : 'max-w-xl'}`
              }
            >
              {useSideBySideFlowchart && (
                <div className="px-3 py-1.5 mb-1 border-b border-slate-200 dark:border-[#2C2F36] flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Bảng Đáp Án (A–{parsedBoxItems[parsedBoxItems.length - 1]?.code || 'H'})
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Bấm hoặc kéo thả vào ô
                  </span>
                </div>
              )}
              {useTwoColTable ? (
                <table className="w-full border-collapse text-left text-[14px]">
                  <tbody>
                    {Array.from({ length: halfCount }).map((_, rowIdx) => {
                      const leftItem = parsedBoxItems[rowIdx];
                      const rightItem = parsedBoxItems[rowIdx + halfCount];
                      return (
                        <tr
                          key={`wb-row-${rowIdx}`}
                          className="border-b last:border-b-0 border-slate-200 dark:border-[#2C2F36]"
                        >
                          {[leftItem, rightItem].map((cellItem, colIdx) => {
                            if (!cellItem) {
                              return <td key={colIdx} className="py-2 px-3" />;
                            }
                            const isUsed = cellItem.usedBy.length > 0;
                            return (
                              <td
                                key={colIdx}
                                draggable={!readOnlyPreview}
                                onDragStart={e => {
                                  e.dataTransfer.setData('text/plain', cellItem.opt);
                                  e.dataTransfer.effectAllowed = 'copy';
                                }}
                                onClick={() => handleWordChipClick(cellItem.opt)}
                                className={`py-2 px-3.5 ${colIdx === 0 ? 'border-r border-slate-200 dark:border-[#2C2F36]' : ''} transition ${
                                  readOnlyPreview ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-[#23262F]'
                                } ${isUsed ? 'bg-blue-50/60 dark:bg-[#1E2A40]/70' : ''}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-3 min-w-0">
                                    {cellItem.code && (
                                      <span className="font-extrabold text-[#111827] dark:text-white w-4 shrink-0">
                                        {cellItem.code}
                                      </span>
                                    )}
                                    <span className="text-[#1F2937] dark:text-[#E5E7EB] font-medium truncate">
                                      {cellItem.labelText}
                                    </span>
                                  </span>
                                  {isUsed && (
                                    <span className="shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#2563EB] text-white tabular-nums">
                                      {cellItem.usedBy.join(',')}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-[#2C2F36]">
                  {parsedBoxItems.map((item, optIdx) => {
                    const isUsed = item.usedBy.length > 0;
                    return (
                      <div
                        key={`${item.opt}-${optIdx}`}
                        draggable={!readOnlyPreview}
                        onDragStart={e => {
                          e.dataTransfer.setData('text/plain', item.opt);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => handleWordChipClick(item.opt)}
                        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-[14.5px] transition ${
                          readOnlyPreview ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-[#23262F]'
                        } ${isUsed ? 'bg-blue-50/60 dark:bg-[#1E2A40]/70' : ''}`}
                      >
                        <span className="flex items-center gap-3.5 min-w-0">
                          {item.code && item.labelText !== item.opt ? (
                            <>
                              <span className="shrink-0 w-5 font-extrabold text-[#111827] dark:text-white">
                                {item.code}
                              </span>
                              <span className="font-medium text-[#1F2937] dark:text-[#E5E7EB]">
                                {item.labelText}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-[#111827] dark:text-white">{item.opt}</span>
                          )}
                        </span>
                        {isUsed && (
                          <span className="shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#2563EB] text-white tabular-nums">
                            {item.usedBy.join(',')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null;

          const bodyNode = (
            <div
              className={
                hasTableBlock
                  ? 'space-y-2'
                  : isFlowchartSection
                  ? useSideBySideFlowchart
                    ? 'rounded-xl border border-slate-300 dark:border-[#343434] bg-white dark:bg-[#16181E] p-4 sm:p-5 space-y-1.5 shadow-2xs'
                    : 'space-y-1.5 max-w-2xl mx-auto'
                  : isNoteSection || readOnlyPreview
                  ? 'rounded-xl border border-slate-200 dark:border-[#343434] bg-white dark:bg-[#191919] p-4 sm:p-6 space-y-2 shadow-2xs'
                  : 'space-y-1.5'
              }
            >
              {isFlowchartSection && hasFlowArrow ? (
                (() => {
                  const flowSteps = [];
                  let currentStepLines = [];
                  let flowchartTitleLine = null;
                  const bodyForFlow = [...boxLines];

                  // Extract standalone Flowchart heading (e.g. "Plan for last lesson") before the first step
                  if (bodyForFlow.length >= 2) {
                    const firstL = bodyForFlow[0];
                    const firstPlain = getLinePlainText(firstL);
                    const secondL = bodyForFlow[1];
                    const isHeadingCandidate =
                      (firstL.kind === 'heading' || firstL.kind === 'subheading') ||
                      (!firstL.segments.some(s => s.type === 'blank') &&
                        firstL.kind !== 'flowArrow' &&
                        secondL.kind !== 'flowArrow' &&
                        firstPlain.length > 0 &&
                        firstPlain.length <= 64 &&
                        !/^\(/.test(firstPlain));
                    if (isHeadingCandidate) {
                      flowchartTitleLine = bodyForFlow.shift();
                    }
                  }

                  bodyForFlow.forEach(line => {
                    if (line.kind === 'flowArrow') {
                      if (currentStepLines.length > 0) {
                        flowSteps.push({ type: 'step', lines: currentStepLines });
                        currentStepLines = [];
                      }
                      flowSteps.push({ type: 'arrow', id: line.id });
                    } else if (line.kind !== 'spacer') {
                      currentStepLines.push(line);
                    }
                  });
                  if (currentStepLines.length > 0) {
                    flowSteps.push({ type: 'step', lines: currentStepLines });
                  }
                  return (
                    <>
                      {flowchartTitleLine && (
                        <h4 className="text-[17px] font-extrabold text-center text-[#111827] dark:text-white pb-2">
                          {renderSegments(flowchartTitleLine.segments)}
                        </h4>
                      )}
                      {flowSteps.map((stepItem, sIdx) =>
                        stepItem.type === 'arrow' ? (
                          <div
                            key={`fc-arr-${stepItem.id || sIdx}`}
                            className="flex justify-center py-0.5 text-slate-600 dark:text-zinc-300 font-bold text-base select-none"
                          >
                            ↓
                          </div>
                        ) : (
                          <div
                            key={`fc-step-${sIdx}`}
                            className={`rounded-md border border-slate-200 dark:border-[#343434] bg-white dark:bg-[#191B21] px-5 py-3.5 text-center ${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[1.85] space-y-1 shadow-2xs`}
                          >
                            {stepItem.lines.map(l => (
                              <div key={l.id}>{renderSegments(l.segments)}</div>
                            ))}
                          </div>
                        )
                      )}
                    </>
                  );
                })()
              ) : (
                boxLines.map((line, lIdx) => {
                  const rendered = renderLine(line);
                  const nextLine = boxLines[lIdx + 1];
                  const needsAutoArrow =
                    isFlowchartSection &&
                    !hasFlowArrow &&
                    line.kind !== 'spacer' &&
                    line.kind !== 'heading' &&
                    line.kind !== 'subheading' &&
                    nextLine &&
                    nextLine.kind !== 'spacer' &&
                    nextLine.kind !== 'flowArrow';
                  if (needsAutoArrow) {
                    return (
                      <div key={`fc-wrap-${line.id}`}>
                        {rendered}
                        <div className="flex justify-center py-0.5 text-slate-500 dark:text-zinc-400 font-bold text-base select-none">
                          ↓
                        </div>
                      </div>
                    );
                  }
                  return rendered;
                })
              )}
            </div>
          );

          if (useSideBySideFlowchart) {
            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pt-1">
                <div className="lg:col-span-5">{wordBoxNode}</div>
                <div className="lg:col-span-7">{bodyNode}</div>
              </div>
            );
          }

          return (
            <>
              {wordBoxNode}
              {bodyNode}
            </>
          );
        })()}
      </div>
    );
  };

  return (
    <div
      onMouseUp={onPassageTextSelect}
      data-exam-copy-source={readOnlyPreview ? undefined : 'true'}
      className="font-exam space-y-6 select-text text-left"
    >
      {sections.map((sectionLines, idx) => renderSection(sectionLines, idx))}
    </div>
  );
}
