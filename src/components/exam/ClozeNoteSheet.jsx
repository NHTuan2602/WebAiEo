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
  let hits = 0;
  for (const opt of optionList) {
    const clean = String(opt || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (clean.length >= 2 && plain.includes(clean)) hits += 1;
  }
  return hits >= Math.min(3, optionList.length);
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
  questions = [],
  readOnlyPreview = false,
  renderText = null,
  scopeField = 'trackIdx',
  scopeIdx = 0
}) {
  const [dragOverBlank, setDragOverBlank] = useState(null);
  const parsedLines = parseClozeLines(clozeText);
  if (parsedLines.length === 0) return null;

  const sections = splitClozeSections(parsedLines);

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

    const filteredLines = sharedWordBoxOptions.length > 0
      ? sectionLines.filter(line => !isRedundantOptionBoxLine(line, sharedWordBoxOptions))
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
    choiceBlanks.forEach(({ blankNum, linkedQ }) => {
      const rawAns = readOnlyPreview ? (linkedQ?.correctAnswer || '') : (linkedQ?.id ? (answers?.[linkedQ.id] || '') : '');
      const canonical = matchChoiceOption(rawAns, sharedWordBoxOptions) || String(rawAns || '').trim();
      if (!canonical) return;
      const list = usedByMap.get(canonical) || [];
      list.push(blankNum);
      usedByMap.set(canonical, list);
    });

    const handleWordChipClick = (optionVal) => {
      if (readOnlyPreview || choiceBlanks.length === 0) return;
      const activeTarget = choiceBlanks.find(
        item => Number(item.blankNum) === Number(activeBlankNum) && item.linkedQ?.id
      );
      const firstEmptyTarget = choiceBlanks.find(
        item => item.linkedQ?.id && !String(answers?.[item.linkedQ.id] || '').trim()
      );
      const target = activeTarget || firstEmptyTarget || choiceBlanks[0];
      if (!target?.linkedQ?.id) return;
      onAnswerChange?.(target.linkedQ.id, optionVal);

      // Advance focus to the next unanswered choice blank in this section
      const nextEmpty = choiceBlanks.find(
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
        const optionList = Array.isArray(linkedQ?.options)
          ? linkedQ.options.map(opt => String(opt || '').trim()).filter(Boolean)
          : [];
        const isChoiceBlank = optionList.length > 0;
        const rawValue = readOnlyPreview ? (linkedQ?.correctAnswer || '') : (qId ? (answers?.[qId] || '') : '');
        const resolvedChoiceVal = isChoiceBlank
          ? (matchChoiceOption(rawValue, optionList) || String(rawValue || '').trim())
          : String(rawValue || '');
        const isActive = Number(activeBlankNum) === Number(seg.blankNum);
        const isDragOver = Number(dragOverBlank) === Number(seg.blankNum);
        const isFlagged = Boolean(qId && bookmarkedQuestions?.[qId]);

        if (isChoiceBlank) {
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
              className="inline-flex items-center align-baseline mx-1.5 my-1 gap-1"
            >
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
                className={`min-w-[82px] max-w-[220px] h-[34px] px-2.5 pr-7 rounded-md text-[14px] font-bold transition-all outline-none border cursor-pointer ${
                  isDragOver
                    ? 'bg-blue-50 dark:bg-blue-500/25 text-[#111827] dark:text-white border-[#2563EB] ring-2 ring-[#2563EB]/50'
                    : isActive
                    ? 'bg-[#FFFDF7] dark:bg-[#23262E] text-[#111827] dark:text-white border-[#A16207] dark:border-[#EAB308] ring-1 ring-[#CA8A04]/45'
                    : resolvedChoiceVal
                    ? 'bg-blue-50/70 dark:bg-[#1E2A40] text-[#111827] dark:text-white border-[#2563EB] dark:border-[#60A5FA]'
                    : 'bg-[#F1F5F9] dark:bg-[#2D3038] text-[#111827] dark:text-[#E5E7EB] border-[#CBD5E1] dark:border-[#5D5F66] hover:border-[#111827] dark:hover:border-[#9CA3AF]'
                }`}
              >
                <option value="">{isFlowchartSection ? '—' : `(${seg.blankNum}) —`}</option>
                {optionList.map((opt, optIdx) => (
                  <option key={optIdx} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
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
              className={`w-28 sm:w-36 h-[32px] px-2.5 rounded-md text-center text-[14px] font-bold transition-all outline-none border ${
                isActive
                  ? 'bg-[#FFFDF7] dark:bg-[#23262E] text-[#111827] dark:text-white border-[#A16207] dark:border-[#EAB308] ring-1 ring-[#CA8A04]/45'
                  : resolvedChoiceVal
                  ? 'bg-white dark:bg-[#2A2F3D] text-[#111827] dark:text-white border-[#2563EB] dark:border-[#60A5FA]'
                  : 'bg-[#F1F5F9]/90 dark:bg-[#2E313A] text-[#111827] dark:text-white border-[#CBD5E1] dark:border-[#525662] hover:border-[#64748B] dark:hover:border-[#9CA3AF]'
              } placeholder:text-[#475569] dark:placeholder:text-[#CBD5E1] placeholder:font-bold`}
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
          <div key={line.id} className="flex justify-center py-0.5 text-slate-500 dark:text-zinc-400 font-bold text-base select-none">
            ↓
          </div>
        );
      }
      if (line.kind === 'table') {
        return (
          <div key={line.id} className="overflow-x-auto rounded-md border border-slate-400 dark:border-zinc-600 bg-white dark:bg-[#14161B] my-2">
            <table className="w-full border-collapse text-left">
              {line.hasHeader && line.headerRow && (
                <thead>
                  <tr className="bg-[#F1F5F9] dark:bg-[#1F232C] border-b border-slate-400 dark:border-zinc-600">
                    {line.headerRow.cells.map((cellLines, cIdx) => (
                      <th
                        key={cIdx}
                        className="py-3 px-3.5 text-[14px] font-extrabold text-[#111827] dark:text-white border-r last:border-r-0 border-slate-300 dark:border-zinc-600 align-middle text-center"
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
                    className="border-b last:border-b-0 border-slate-300 dark:border-zinc-700 align-top"
                  >
                    {row.cells.map((cellLines, cIdx) => (
                      <td
                        key={cIdx}
                        className={`py-3 px-3.5 border-r last:border-r-0 border-slate-300 dark:border-zinc-700 ${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[1.85]`}
                      >
                        {cellLines.length === 0 ? (
                          <span>&nbsp;</span>
                        ) : (
                          <div className="space-y-1.5">
                            {cellLines.map((cl, lIdx) =>
                              cl.isBullet ? (
                                <div key={lIdx} className="flex items-start gap-2">
                                  <span className="mt-1.5 text-[13px] leading-none text-slate-700 dark:text-zinc-300 shrink-0">•</span>
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

        {/* Shared Interactive Word Bank Box for Summary Completion with Box (A-I) */}
        {sharedWordBoxOptions.length > 0 && (
          <div className="rounded-lg border border-slate-300 dark:border-[#3A3D46] bg-slate-50/90 dark:bg-[#1A1C22] p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Hộp Từ Gợi Ý ({sharedWordBoxOptions.length} lựa chọn)
              </span>
              {!readOnlyPreview && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Bấm để điền vào ô đang chọn, kéo thả vào ô trống hoặc chọn trực tiếp ở danh sách
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sharedWordBoxOptions.map((opt, optIdx) => {
                const code = extractLeadingOptionCode(opt, { allowSpaceSeparated: allowSpacedCodes });
                const labelText = code ? stripLeadingOptionCode(opt, { allowSpaceSeparated: allowSpacedCodes }) : opt;
                const usedBy = usedByMap.get(opt) || [];
                const isUsed = usedBy.length > 0;
                return (
                  <button
                    key={`${opt}-${optIdx}`}
                    type="button"
                    disabled={readOnlyPreview}
                    draggable={!readOnlyPreview}
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', opt);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => handleWordChipClick(opt)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border text-left text-[14px] transition ${
                      readOnlyPreview ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    } ${
                      isUsed
                        ? 'bg-blue-50/75 dark:bg-[#1E2A40] border-[#2563EB]/60 dark:border-[#60A5FA]/50 text-[#111827] dark:text-white'
                        : 'bg-white dark:bg-[#23262F] border-slate-200 dark:border-[#373B45] text-[#111827] dark:text-[#F3F4F6] hover:border-[#2563EB] dark:hover:border-[#60A5FA]'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {code && labelText && labelText !== opt ? (
                        <>
                          <span className="shrink-0 w-6 h-6 rounded bg-slate-100 dark:bg-[#2F3340] border border-slate-300 dark:border-[#494E5E] text-xs font-extrabold uppercase inline-flex items-center justify-center text-[#111827] dark:text-white">
                            {code.toUpperCase()}
                          </span>
                          <span className="font-medium truncate">{labelText}</span>
                        </>
                      ) : (
                        <span className="font-semibold truncate">{opt}</span>
                      )}
                    </span>
                    {isUsed && (
                      <span className="shrink-0 text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-[#2563EB] text-white tabular-nums">
                        {usedBy.join(',')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div
          className={
            hasTableBlock
              ? 'space-y-2'
              : isFlowchartSection
              ? 'space-y-1.5 max-w-2xl mx-auto'
              : isNoteSection || readOnlyPreview
              ? 'rounded-xl border border-slate-200 dark:border-[#343434] bg-white dark:bg-[#191919] p-4 sm:p-6 space-y-2 shadow-2xs'
              : 'space-y-1.5'
          }
        >
          {boxLines.map((line, lIdx) => {
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
          })}
        </div>
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
