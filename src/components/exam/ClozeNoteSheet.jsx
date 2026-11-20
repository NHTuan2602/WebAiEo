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
      /^Questions?\s+\d+/i.test(plain) &&
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
      l => l.kind === 'heading' || l.kind === 'bullet' || l.segments.some(seg => seg.type === 'blank')
    );
    const preambleLines = firstBodyIdx > 0 ? filteredLines.slice(0, firstBodyIdx) : [];
    const boxLines = firstBodyIdx > 0 ? filteredLines.slice(firstBodyIdx) : filteredLines;

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
                className={`min-w-[138px] max-w-[240px] h-[34px] px-2.5 pr-7 rounded-[4px] text-[14px] font-bold transition-all outline-none border cursor-pointer ${
                  isDragOver
                    ? 'bg-blue-50 dark:bg-blue-500/25 text-[#111827] dark:text-white border-[#2563EB] ring-2 ring-[#2563EB]/50'
                    : isActive
                    ? 'bg-[#FFFDF7] dark:bg-[#23262E] text-[#111827] dark:text-white border-[#A16207] dark:border-[#EAB308] ring-1 ring-[#CA8A04]/45'
                    : resolvedChoiceVal
                    ? 'bg-blue-50/70 dark:bg-[#1E2A40] text-[#111827] dark:text-white border-[#2563EB] dark:border-[#60A5FA]'
                    : 'bg-white dark:bg-[#2D3038] text-[#111827] dark:text-[#E5E7EB] border-[#767676] dark:border-[#5D5F66] hover:border-[#111827] dark:hover:border-[#9CA3AF]'
                }`}
              >
                <option value="">{seg.blankNum} — Chọn từ</option>
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
              placeholder={String(seg.blankNum)}
              aria-label={`Câu ${seg.blankNum}`}
              onFocus={() => onBlankFocus?.(seg.blankNum, qId)}
              onChange={e => {
                if (readOnlyPreview || !qId) return;
                onAnswerChange?.(qId, e.target.value);
              }}
              className={`w-40 sm:w-52 h-[34px] px-3 rounded-[3px] text-center text-[15px] font-bold transition-all outline-none border ${
                isActive
                  ? 'bg-[#FFFDF7] dark:bg-[#23262E] text-[#111827] dark:text-white border-[#A16207] dark:border-[#EAB308] ring-1 ring-[#CA8A04]/45'
                  : resolvedChoiceVal
                  ? 'bg-white dark:bg-[#2A2F3D] text-[#111827] dark:text-white border-[#2563EB] dark:border-[#60A5FA]'
                  : 'bg-white dark:bg-[#3A3B40] text-[#111827] dark:text-white border-[#767676] dark:border-[#5D5F66] hover:border-[#111827] dark:hover:border-[#9CA3AF]'
              } placeholder:text-[#111827] dark:placeholder:text-[#E5E7EB] placeholder:font-bold`}
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
      if (line.kind === 'heading') {
        return (
          <h4
            key={line.id}
            className="text-[16px] font-bold text-center text-[#111827] dark:text-white pt-2 pb-1"
          >
            {renderSegments(line.segments)}
          </h4>
        );
      }
      if (line.kind === 'subheading') {
        return (
          <h5 key={line.id} className="text-[16px] font-bold text-[#111827] dark:text-white pt-1.5">
            {renderSegments(line.segments)}
          </h5>
        );
      }
      if (line.kind === 'bullet') {
        return (
          <div
            key={line.id}
            className={`flex items-start gap-2.5 ${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[2.1] pl-0.5`}
          >
            <span className="mt-2.5 text-[14px] leading-none text-[#111827] dark:text-[#D1D5DB] shrink-0">•</span>
            <div className="flex-1 leading-[2.1]">{renderSegments(line.segments)}</div>
          </div>
        );
      }
      return (
        <p key={line.id} className={`${fontSizeClass} text-[#111827] dark:text-[#EDEDED] leading-[2.1]`}>
          {renderSegments(line.segments)}
        </p>
      );
    };

    return (
      <div key={`cloze-sec-${sectionIdx}`} className="space-y-3">
        {preambleLines.length > 0 && (
          <div className="space-y-1.5">
            {preambleLines.map(line =>
              line.kind === 'spacer' ? (
                <div key={line.id} className="h-1" />
              ) : (
                <p
                  key={line.id}
                  className={
                    /^Questions?\s+\d+/i.test(line.segments.map(s => s.value || '').join(''))
                      ? 'font-bold text-[#111827] dark:text-white text-[18px] pb-1'
                      : 'text-[15px] font-normal text-[#111827] dark:text-[#E5E7EB] leading-[1.6]'
                  }
                >
                  {renderSegments(line.segments)}
                </p>
              )
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
            readOnlyPreview
              ? 'rounded-lg border border-slate-200 dark:border-[#343434] bg-white dark:bg-[#191919] p-4 sm:p-6 space-y-2'
              : 'space-y-1.5'
          }
        >
          {boxLines.map(renderLine)}
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
