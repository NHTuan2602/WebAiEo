import { useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { formatInlineBlankPlaceholders } from '../../utils/clozeHelpers';
import {
  extractLeadingOptionCode,
  getQuestionCorrectAnswers,
  getQuestionTypeMeta,
  matchChoiceOption,
  optionsUseSpaceSeparatedCodes,
  stripLeadingOptionCode
} from '../../utils/examHelpers';
import {
  getStandardGroupInstruction,
  groupQuestionsForRendering,
  stripLeadingQuestionNumber
} from '../../utils/examUiHelpers';

const INLINE_SLOT_REGEX = /(\{\{\s*\d+\s*\}\}|\[\s*\d+\s*\]|\(__+\s*\d+\s*__+\)|_{4,})/g;

function splitPromptWithInlineSlot(promptText = '') {
  const str = String(promptText || '');
  const parts = [];
  let lastIdx = 0;
  let foundSlot = false;
  const regex = new RegExp(INLINE_SLOT_REGEX.source, 'g');
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', value: str.slice(lastIdx, match.index) });
    }
    if (!foundSlot) {
      parts.push({ type: 'slot', raw: match[0] });
      foundSlot = true;
    } else {
      parts.push({ type: 'text', value: '________' });
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < str.length) {
    parts.push({ type: 'text', value: str.slice(lastIdx) });
  }
  return { parts, foundSlot };
}

function questionNeedsMultipleSelections(question) {
  return question?.type === 'mcq' && getRequiredSelectionCount(question) > 1;
}

function getRequiredSelectionCount(question) {
  return Math.max(
    1,
    Number(question?.requiredSelections) || 0,
    getQuestionCorrectAnswers(question).length
  );
}

function toggleSelectedOption(currentAnswer, option) {
  const selected = Array.isArray(currentAnswer)
    ? currentAnswer
    : currentAnswer
    ? [currentAnswer]
    : [];
  return selected.includes(option)
    ? selected.filter(value => value !== option)
    : [...selected, option];
}

/**
 * Renders Reading/Listening questions in authentic Computer-Delivered IELTS styles:
 * - Matching Matrix Grid Table (A-I / i-viii columns) when 3+ consecutive questions share short options
 * - Minimalist high-contrast single cards with boxed question numbers, Bookmark flag, and crisp radios/inputs
 */
export default function ExamQuestionList({
  activeQuestionId,
  answers = {},
  baseOffset = 0,
  bookmarkedQuestions = {},
  fontSizeClass = 'text-[15px]',
  onAnswerChange,
  onSelectQuestion,
  onSwitchScope,
  onTextSelect = null,
  onToggleBookmark,
  onZoomImage = null,
  questionCardRefs,
  questions = [],
  renderText = null,
  scopeLabelPrefix = '',
  scopeType = 'reading',
  showScopeBadge = false
}) {
  const [dragOverQuestionId, setDragOverQuestionId] = useState(null);
  const formatText = (val) => (typeof renderText === 'function' ? renderText(val) : val);
  if (!Array.isArray(questions) || questions.length === 0) return null;

  const grouped = groupQuestionsForRendering(questions, baseOffset);

  const renderScopeJumpChip = (q) => {
    if (!showScopeBadge) return null;
    if (scopeType === 'listening' && typeof q.trackIdx === 'number') {
      return (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onSwitchScope?.(q.trackIdx);
          }}
          className="shrink-0 text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#3A3A3A] hover:border-[#2563EB]"
        >
          {scopeLabelPrefix || 'Part'} {q.trackIdx + 1}
        </button>
      );
    }
    if (scopeType === 'reading' && typeof q.passageIdx === 'number') {
      return (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onSwitchScope?.(q.passageIdx);
          }}
          className="shrink-0 text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#3A3A3A] hover:border-[#2563EB]"
        >
          {scopeLabelPrefix || 'Passage'} {q.passageIdx + 1}
        </button>
      );
    }
    return null;
  };

  const renderSingleQuestionCard = (q, displayNum, { insideGroup = false, groupImageUrl = '' } = {}) => {
    const isActive = activeQuestionId === q.id;
    const isFlagged = Boolean(bookmarkedQuestions?.[q.id]);
    const cleanPrompt = formatInlineBlankPlaceholders(stripLeadingQuestionNumber(q.question) || q.question);
    const typeMeta = getQuestionTypeMeta(q.type, scopeType);
    let optionList = Array.isArray(q.options) ? q.options.map(o => String(o || '').trim()).filter(Boolean) : [];
    if (
      optionList.length === 0 &&
      (q.type === 'matching_information' || q.type === 'matching_info' || (q.type === 'matching' && !q.wordLimit))
    ) {
      optionList = ['A', 'B', 'C', 'D', 'E', 'F'];
    }
    const hasChoiceOptions = optionList.length > 0;
    const multiSelect = questionNeedsMultipleSelections(q);
    const expectedSelectionCount = getRequiredSelectionCount(q);
    const wordLimitHint = String(q.wordLimit || '').trim();
    const explicitEndNum = Number(q.questionEndNumber);
    const effectiveEndNum =
      Number.isFinite(explicitEndNum) && explicitEndNum > displayNum
        ? explicitEndNum
        : multiSelect && expectedSelectionCount > 1
        ? displayNum + expectedSelectionCount - 1
        : displayNum;
    const rangeLabel = effectiveEndNum > displayNum ? `${displayNum}–${effectiveEndNum}` : `${displayNum}`;
    const multiSelectInstruction =
      q.instruction ||
      (expectedSelectionCount === 2
        ? 'Choose TWO correct answers.'
        : expectedSelectionCount === 3
        ? 'Choose THREE correct answers.'
        : `Choose ${expectedSelectionCount} correct answers.`);

    return (
      <div
        key={`card-${q.id}`}
        ref={el => {
          if (el && questionCardRefs?.current) {
            questionCardRefs.current[q.id] = el;
          }
        }}
        onClick={() => onSelectQuestion?.(q)}
        className={`py-3 transition ${
          isActive
            ? 'bg-[#F1F5F9]/45 dark:bg-[#1E232D]/70 rounded-md px-2.5 -mx-2.5'
            : 'px-0'
        }`}
      >
        {!insideGroup && (multiSelect || q.instruction) && (
          <div className="mb-2.5 pb-1.5 border-b border-slate-200 dark:border-[#32353E] space-y-1">
            {multiSelect && (
              <h4 className="text-[15px] sm:text-base font-extrabold text-[#111827] dark:text-white">
                Questions {rangeLabel}
              </h4>
            )}
            <p className="text-[15px] font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
              {formatText(multiSelect ? multiSelectInstruction : q.instruction)}
            </p>
            {q.hasNB && (
              <p className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                NB You may use any letter more than once.
              </p>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2.5 min-w-0">
            {!multiSelect && (
              <span
                className={`shrink-0 min-w-[28px] h-[28px] px-1.5 rounded-full text-[13px] font-extrabold inline-flex items-center justify-center border shadow-2xs mt-0.5 ${
                  isActive
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white dark:bg-[#23252C] text-[#111827] dark:text-white border-[#CBD5E1] dark:border-[#4A4A4A]'
                }`}
              >
                {displayNum}
              </span>
            )}
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {!insideGroup && !multiSelect && q.type && q.type !== 'mcq' && q.type !== 'fill' && q.type !== 'tfng' && (
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/35">
                    {typeMeta.shortLabel}
                  </span>
                )}
                {wordLimitHint && (
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                    {wordLimitHint}
                  </span>
                )}
                {insideGroup && multiSelect && (
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                    Questions {rangeLabel} • Chọn {expectedSelectionCount} đáp án
                  </span>
                )}
              </div>
              <p className={`font-bold text-[#111827] dark:text-[#F3F4F6] ${fontSizeClass}`}>
                {formatText(cleanPrompt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {renderScopeJumpChip(q)}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onToggleBookmark?.(q.id);
              }}
              title={isFlagged ? 'Bỏ đánh dấu xem lại' : 'Đánh dấu xem lại câu này'}
              className={`p-1 rounded transition ${
                isFlagged
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-slate-400 dark:text-neutral-500 hover:text-amber-500'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {q.imageUrl && (!insideGroup || q.imageUrl !== groupImageUrl) && (
          <div className="mb-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 max-w-2xl">
            <img
              src={q.imageUrl}
              alt={`Hình ảnh câu ${displayNum}`}
              onClick={e => {
                e.stopPropagation();
                onZoomImage?.(q.imageUrl);
              }}
              className="w-full max-h-80 object-contain rounded mx-auto cursor-zoom-in"
            />
          </div>
        )}

        {hasChoiceOptions ? (
          <div className={`space-y-2 ${multiSelect ? 'pl-1 pt-1' : 'pl-8 pt-0.5'}`}>
            {optionList.map((opt, optIdx) => {
              const currentAnswer = answers?.[q.id];
              const isSelected = Array.isArray(currentAnswer)
                ? currentAnswer.includes(opt)
                : currentAnswer === opt;
              const selectionCount = Array.isArray(currentAnswer)
                ? currentAnswer.length
                : currentAnswer
                ? 1
                : 0;
              const selectionLimitReached = multiSelect && !isSelected && selectionCount >= expectedSelectionCount;
              return (
                <label
                  key={optIdx}
                  className={`flex items-start gap-3 px-2.5 py-1.5 rounded-md transition ${
                    selectionLimitReached ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-[#DBEAFE]/80 dark:bg-[#2563EB]/25 text-[#111827] dark:text-white font-semibold'
                      : 'text-[#1F2937] dark:text-[#E5E7EB] hover:bg-[#F1F5F9]/60 dark:hover:bg-[#232323]'
                  }`}
                >
                  <input
                    type={multiSelect ? 'checkbox' : 'radio'}
                    name={`${scopeType}_q_${q.id}`}
                    value={opt}
                    checked={isSelected}
                    disabled={selectionLimitReached}
                    onChange={e => {
                      const nextVal = multiSelect
                        ? toggleSelectedOption(currentAnswer, e.target.value)
                        : e.target.value;
                      onAnswerChange?.(q.id, nextVal);
                      if (Array.isArray(q.linkedQuestionIds) && q.linkedQuestionIds.length > 1) {
                        q.linkedQuestionIds.forEach(linkedId => {
                          if (linkedId && linkedId !== q.id) {
                            onAnswerChange?.(linkedId, nextVal);
                          }
                        });
                      }
                    }}
                    className="mt-1 w-4 h-4 accent-[#2563EB] shrink-0"
                  />
                  <span className={`${fontSizeClass}`}>
                    {formatText(opt)}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="pl-8 pt-1">
            <input
              type="text"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              placeholder={wordLimitHint ? `(${displayNum}) ${wordLimitHint}` : `(${displayNum})`}
              value={answers?.[q.id] || ''}
              onChange={e => onAnswerChange?.(q.id, e.target.value)}
              className="w-56 sm:w-72 h-[34px] px-3 rounded-md text-center text-[15px] font-extrabold transition outline-none border border-dashed bg-[#F1F5F9]/90 dark:bg-[#2A2D36] text-[#111827] dark:text-white border-[#94A3B8] dark:border-[#64748B] focus:border-solid focus:bg-[#FFFDF7] dark:focus:bg-[#23262E] focus:border-[#A16207] dark:focus:border-[#EAB308] placeholder:text-[#111827] dark:placeholder:text-slate-200 placeholder:text-xs placeholder:font-extrabold"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div onMouseUp={onTextSelect || undefined} data-exam-copy-source="true" className="font-exam space-y-4 select-text">
      {grouped.map(block => {
        if (block.kind === 'matrix') {
          const firstNum = block.items[0]?.displayNum;
          const lastNum = block.items[block.items.length - 1]?.displayNum;
          const groupMeta = getQuestionTypeMeta(block.groupType || 'matching_information', scopeType);
          const isMapDiagram =
            block.groupType === 'map_diagram' ||
            block.groupType === 'diagram_label' ||
            (scopeType === 'listening' && Boolean(block.imageUrl));
          const isMatchingInfo =
            !isMapDiagram &&
            (block.groupType === 'matching_information' ||
              block.groupType === 'matching_info' ||
              (scopeType === 'reading' &&
                Array.isArray(block.options) &&
                block.options.every(opt => /^[A-I]$/i.test(opt))));
          const firstOpt = block.options?.[0] || 'A';
          const lastOpt = block.options?.[block.options.length - 1] || 'I';
          const rangeLabel = firstNum === lastNum ? `${firstNum}` : `${firstNum}–${lastNum}`;
          const defaultMapInstruction = `Label the map below. Choose the correct letter, ${firstOpt}–${lastOpt}, next to questions ${rangeLabel}.`;
          const instructionText =
            block.instruction ||
            (isMapDiagram
              ? defaultMapInstruction
              : isMatchingInfo
              ? 'Which paragraph contains the following information?'
              : getStandardGroupInstruction(block.items[0]?.question, block.options));
          const showNB = Boolean(block.hasNB || isMatchingInfo);

          return (
            <div key={block.key} className="space-y-3">
              <div className="space-y-1.5 pb-1.5 border-b border-slate-200 dark:border-[#32353E]">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-[15px] sm:text-base font-extrabold text-[#111827] dark:text-white">
                    Questions {rangeLabel}
                  </h4>
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/35">
                    {groupMeta.shortLabel}
                  </span>
                </div>
                {instructionText && (
                  <p className="text-[15px] font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
                    {formatText(instructionText)}
                  </p>
                )}
                {showNB && (
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                      NB You may use any letter more than once.
                    </span>
                  </div>
                )}
              </div>

              <div className={block.imageUrl ? 'grid grid-cols-1 md:grid-cols-12 gap-5 items-start' : ''}>
                {block.imageUrl && (
                  <div className="md:col-span-5 rounded-xl border border-[#CBD5E1] dark:border-[#343434] bg-white dark:bg-[#141414] p-3 shadow-2xs">
                    <img
                      src={block.imageUrl}
                      alt={`Bản đồ / Sơ đồ câu ${rangeLabel}`}
                      onClick={() => onZoomImage?.(block.imageUrl)}
                      className="w-full max-h-[460px] object-contain rounded mx-auto cursor-zoom-in"
                    />
                    {onZoomImage && (
                      <button
                        type="button"
                        onClick={() => onZoomImage(block.imageUrl)}
                        className="mt-2 mx-auto block text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        Bấm vào ảnh để phóng to bản đồ / sơ đồ
                      </button>
                    )}
                  </div>
                )}
                <div className={`${block.imageUrl ? 'md:col-span-7 ' : ''}rounded-xl border border-[#CBD5E1] dark:border-[#343434] overflow-x-auto bg-white dark:bg-[#141414] shadow-2xs`}>
                  <table className="w-full border-collapse text-left min-w-[460px]">
                    <thead>
                      <tr className="bg-[#F8FAFC] dark:bg-[#1E2028] text-[#111827] dark:text-white border-b border-[#CBD5E1] dark:border-[#343434]">
                        <th className="py-2.5 px-3.5 text-[13px] font-extrabold border-r border-[#E2E8F0] dark:border-[#2C2C2C] min-w-[180px]">
                          Question
                        </th>
                        {block.options.map(opt => (
                          <th
                            key={opt}
                            className="py-2.5 px-2 text-center text-[13px] font-extrabold border-r last:border-r-0 border-[#E2E8F0] dark:border-[#2C2C2C] w-9"
                          >
                            {opt}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.items.map(({ question: q, displayNum }) => {
                        const isActive = activeQuestionId === q.id;
                        const isFlagged = Boolean(bookmarkedQuestions?.[q.id]);
                        const selectedVal = answers?.[q.id] || '';
                        const cleanPrompt = stripLeadingQuestionNumber(q.question) || q.question;

                        return (
                          <tr
                            key={q.id}
                            ref={el => {
                              if (el && questionCardRefs?.current) {
                                questionCardRefs.current[q.id] = el;
                              }
                            }}
                            onClick={() => onSelectQuestion?.(q)}
                            className={`border-t border-[#E2E8F0] dark:border-[#2C2C2C] transition-colors ${
                              isActive
                                ? 'bg-[#EFF6FF]/80 dark:bg-[#1E2430]'
                                : 'hover:bg-slate-50 dark:hover:bg-[#1B1B1B]'
                            }`}
                          >
                            <td className="py-3 px-3.5 border-r border-[#E2E8F0] dark:border-[#2C2C2C] align-middle">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className={`shrink-0 min-w-[26px] h-6 px-1.5 rounded text-xs font-extrabold inline-flex items-center justify-center border ${
                                      isActive
                                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                                        : 'bg-slate-100 dark:bg-[#262626] text-[#111827] dark:text-white border-[#CBD5E1] dark:border-[#404040]'
                                    }`}
                                  >
                                    {displayNum}
                                  </span>
                                  <span className={`${fontSizeClass} leading-snug text-[#1F2937] dark:text-[#E5E7EB] font-medium`}>
                                    {formatText(cleanPrompt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {renderScopeJumpChip(q)}
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      onToggleBookmark?.(q.id);
                                    }}
                                    title={isFlagged ? 'Bỏ đánh dấu câu này' : 'Đánh dấu xem lại'}
                                    className={`p-1 rounded transition ${
                                      isFlagged
                                        ? 'text-amber-500 dark:text-amber-400'
                                        : 'text-slate-400 dark:text-neutral-500 hover:text-amber-500'
                                    }`}
                                  >
                                    <Bookmark className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                              </div>
                              {questionNeedsMultipleSelections(q) && (
                                <p className="mt-1 pl-9 text-xs font-bold text-amber-700 dark:text-amber-300">
                                  Chọn {getRequiredSelectionCount(q)} đáp án
                                </p>
                              )}
                            </td>
                            {block.options.map(opt => {
                              const multiSelect = questionNeedsMultipleSelections(q);
                              const checked = Array.isArray(selectedVal)
                                ? selectedVal.includes(opt)
                                : selectedVal === opt;
                              const selectionCount = Array.isArray(selectedVal)
                                ? selectedVal.length
                                : selectedVal
                                ? 1
                                : 0;
                              const selectionLimitReached = multiSelect && !checked && selectionCount >= getRequiredSelectionCount(q);
                              return (
                                <td
                                  key={opt}
                                  onClick={e => {
                                    e.stopPropagation();
                                    onSelectQuestion?.(q);
                                    if (selectionLimitReached) return;
                                    onAnswerChange?.(
                                      q.id,
                                      multiSelect ? toggleSelectedOption(selectedVal, opt) : opt
                                    );
                                  }}
                                  className={`py-3 px-1.5 text-center border-r last:border-r-0 border-[#E2E8F0] dark:border-[#2C2C2C] transition ${
                                    selectionLimitReached ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                  } ${
                                    checked ? 'bg-blue-50/70 dark:bg-blue-500/15' : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                                  }`}
                                >
                                  <span
                                    className={`inline-flex w-[18px] h-[18px] ${multiSelect ? 'rounded-sm' : 'rounded-full'} items-center justify-center border-2 transition ${
                                      checked
                                        ? 'border-[#2563EB] dark:border-[#60A5FA] bg-[#2563EB] dark:bg-[#3B82F6]'
                                        : 'border-slate-300 dark:border-neutral-500 bg-transparent'
                                    }`}
                                  >
                                    {checked && (
                                      <span
                                        className={`w-2 h-2 ${multiSelect ? 'rounded-[1px]' : 'rounded-full'} bg-white`}
                                      />
                                    )}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        }

        if (block.kind === 'wordBoxGroup') {
          const firstNum = block.items[0]?.displayNum;
          const lastNum = block.items[block.items.length - 1]?.displayNum;
          const groupMeta = getQuestionTypeMeta(block.groupType, scopeType);
          const allowSpacedCodes = optionsUseSpaceSeparatedCodes(block.options);
          const isFlowchartBoxGroup = block.groupType === 'flowchart_completion';
          const usedByMap = new Map();
          block.items.forEach(({ question: itemQ, displayNum }) => {
            const rawVal = answers?.[itemQ.id] || '';
            const canonical = matchChoiceOption(rawVal, block.options) || String(rawVal || '').trim();
            if (!canonical) return;
            const list = usedByMap.get(canonical) || [];
            list.push(displayNum);
            usedByMap.set(canonical, list);
          });

          const handleGroupChipClick = (optionVal) => {
            const activeItem = block.items.find(({ question: itemQ }) => itemQ.id === activeQuestionId);
            const firstEmpty = block.items.find(
              ({ question: itemQ }) => !String(answers?.[itemQ.id] || '').trim()
            );
            const target = activeItem || firstEmpty || block.items[0];
            if (!target) return;
            onAnswerChange?.(target.question.id, optionVal);
            const nextEmpty = block.items.find(
              ({ question: itemQ }) =>
                itemQ.id !== target.question.id && !String(answers?.[itemQ.id] || '').trim()
            );
            onSelectQuestion?.(nextEmpty ? nextEmpty.question : target.question);
          };

          const firstItem = block.items[0]?.question;
          const instructionText =
            block.instruction ||
            getStandardGroupInstruction(firstItem, block.options) ||
            'Complete the summary using the list of words, A-I, below.';

          const parsedBoxItems = block.options.map(opt => {
            const code = extractLeadingOptionCode(opt, { allowSpaceSeparated: allowSpacedCodes });
            const labelText = code ? stripLeadingOptionCode(opt, { allowSpaceSeparated: allowSpacedCodes }) : opt;
            return {
              opt,
              code: code ? code.toUpperCase() : '',
              labelText: labelText || opt,
              usedBy: usedByMap.get(opt) || []
            };
          });
          const useTwoColTable =
            parsedBoxItems.length >= 6 &&
            parsedBoxItems.every(item => item.labelText.length <= 28);
          const halfCount = Math.ceil(parsedBoxItems.length / 2);

          return (
            <div key={block.key} className="space-y-3.5">
              <div className="space-y-1 pb-1.5 border-b border-slate-200 dark:border-[#32353E]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[15px] sm:text-base font-extrabold text-[#111827] dark:text-white">
                      Questions {firstNum}–{lastNum}
                    </h4>
                    <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/35">
                      {groupMeta.shortLabel}
                    </span>
                  </div>
                </div>
                {instructionText && (
                  <p className="text-[15px] font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
                    {formatText(instructionText)}
                  </p>
                )}
                {block.hasNB && (
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                      NB You may use any letter more than once.
                    </span>
                  </div>
                )}
              </div>

              <div className={block.imageUrl ? 'grid grid-cols-1 md:grid-cols-12 gap-5 items-start' : 'space-y-4'}>
                {block.imageUrl && (
                  <div className="md:col-span-5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#141414] p-3 shadow-2xs">
                    <img
                      src={block.imageUrl}
                      alt={`Hình ảnh câu ${firstNum}–${lastNum}`}
                      onClick={() => onZoomImage?.(block.imageUrl)}
                      className="w-full max-h-[420px] object-contain rounded mx-auto cursor-zoom-in"
                    />
                  </div>
                )}

                <div className={`${block.imageUrl ? 'md:col-span-7 ' : ''}space-y-4`}>
                  {/* Shared Cambridge Legend Box (1-column for sentence options A-C, 2-column for compact words A-H) */}
                  <div className={`mx-auto rounded-xl border border-slate-300 dark:border-[#3A3D46] bg-white dark:bg-[#1A1C22] p-2 shadow-2xs ${useTwoColTable ? 'max-w-md' : 'max-w-xl'}`}>
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
                                      draggable
                                      onDragStart={e => {
                                        e.dataTransfer.setData('text/plain', cellItem.opt);
                                        e.dataTransfer.effectAllowed = 'copy';
                                      }}
                                      onClick={() => handleGroupChipClick(cellItem.opt)}
                                      className={`py-2 px-3.5 ${colIdx === 0 ? 'border-r border-slate-200 dark:border-[#2C2F36]' : ''} transition cursor-pointer hover:bg-slate-50 dark:hover:bg-[#23262F] ${
                                        isUsed ? 'bg-blue-50/60 dark:bg-[#1E2A40]/70' : ''
                                      }`}
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
                              draggable
                              onDragStart={e => {
                                e.dataTransfer.setData('text/plain', item.opt);
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onClick={() => handleGroupChipClick(item.opt)}
                              className={`flex items-center justify-between gap-3 px-4 py-2.5 text-[14px] transition cursor-pointer hover:bg-slate-50 dark:hover:bg-[#23262F] ${
                                isUsed ? 'bg-blue-50/60 dark:bg-[#1E2A40]/70' : ''
                              }`}
                            >
                              <span className="flex items-center gap-4 min-w-0">
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

                  {/* Clean per-question rows (Cambridge Matching rows with circular number badge + compact [ — ▾ ] dropdown, OR Flow-chart step boxes with ↓ arrows) */}
                  <div className={isFlowchartBoxGroup ? 'space-y-1.5 max-w-2xl mx-auto' : 'space-y-2.5'}>
                    {block.items.map(({ question: q, displayNum }, itemIdx) => {
                      const isActive = activeQuestionId === q.id;
                      const isFlagged = Boolean(bookmarkedQuestions?.[q.id]);
                      const isDragOver = dragOverQuestionId === q.id;
                      const cleanPrompt = stripLeadingQuestionNumber(q.question) || q.question;
                      const { parts, foundSlot } = splitPromptWithInlineSlot(cleanPrompt);
                      const rawVal = answers?.[q.id] || '';
                      const selectedVal = matchChoiceOption(rawVal, block.options) || String(rawVal || '').trim();

                      const slotControl = (
                        <span
                          onDragOver={e => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';
                            if (dragOverQuestionId !== q.id) setDragOverQuestionId(q.id);
                          }}
                          onDragLeave={() => {
                            if (dragOverQuestionId === q.id) setDragOverQuestionId(null);
                          }}
                          onDrop={e => {
                            e.preventDefault();
                            setDragOverQuestionId(null);
                            const dropped = e.dataTransfer.getData('text/plain');
                            if (!dropped) return;
                            const canonical = matchChoiceOption(dropped, block.options) || dropped;
                            onAnswerChange?.(q.id, canonical);
                            onSelectQuestion?.(q);
                          }}
                          className="inline-flex items-center gap-1 align-baseline mx-1 my-0.5"
                        >
                          <select
                            value={selectedVal}
                            aria-label={`Câu ${displayNum}`}
                            title={selectedVal || `Chọn đáp án câu ${displayNum}`}
                            onFocus={() => onSelectQuestion?.(q)}
                            onClick={e => {
                              e.stopPropagation();
                              onSelectQuestion?.(q);
                            }}
                            onChange={e => {
                              onAnswerChange?.(q.id, e.target.value);
                              onSelectQuestion?.(q);
                            }}
                            className={`min-w-[74px] max-w-[200px] h-[36px] px-3 rounded-lg text-[14px] font-extrabold text-center transition outline-none border cursor-pointer ${
                              isDragOver
                                ? 'bg-blue-50 dark:bg-blue-500/25 text-[#111827] dark:text-white border-[#2563EB] ring-2 ring-[#2563EB]/50'
                                : isActive
                                ? 'bg-[#FFFDF7] dark:bg-[#23262E] text-[#111827] dark:text-white border-[#A16207] dark:border-[#EAB308] ring-1 ring-[#CA8A04]/45'
                                : selectedVal
                                ? 'bg-blue-50/70 dark:bg-[#1E2A40] text-[#111827] dark:text-white border-[#2563EB] dark:border-[#60A5FA]'
                                : 'bg-[#F1F5F9] dark:bg-[#252830] text-[#111827] dark:text-[#E5E7EB] border-[#CBD5E1] dark:border-[#4A4D57] hover:border-[#111827] dark:hover:border-[#9CA3AF]'
                            }`}
                          >
                            <option value="">—</option>
                            {block.options.map((opt, optIdx) => {
                              const optCode = extractLeadingOptionCode(opt, { allowSpaceSeparated: allowSpacedCodes });
                              return (
                                <option key={optIdx} value={opt}>
                                  {optCode ? optCode.toUpperCase() : opt}
                                </option>
                              );
                            })}
                          </select>
                          {selectedVal && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                onAnswerChange?.(q.id, '');
                                onSelectQuestion?.(q);
                              }}
                              title={`Xóa đáp án câu ${displayNum}`}
                              className="p-0.5 rounded text-slate-400 hover:text-rose-500 dark:text-neutral-400 dark:hover:text-rose-400 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>
                      );

                      if (isFlowchartBoxGroup) {
                        return (
                          <div key={q.id}>
                            <div
                              ref={el => {
                                if (el && questionCardRefs?.current) {
                                  questionCardRefs.current[q.id] = el;
                                }
                              }}
                              onClick={() => onSelectQuestion?.(q)}
                              className={`rounded-md border px-6 py-4 text-center transition-colors shadow-2xs ${
                                isActive
                                  ? 'border-[#2563EB] bg-[#EFF6FF]/65 dark:bg-[#1E2430]'
                                  : 'border-slate-200 dark:border-[#343434] bg-white dark:bg-[#191B21]'
                              }`}
                            >
                              <div className={`${fontSizeClass} leading-[1.85] text-[#111827] dark:text-[#F3F4F6]`}>
                                {foundSlot ? (
                                  parts.map((part, partIdx) =>
                                    part.type === 'slot' ? (
                                      <span key={partIdx}>{slotControl}</span>
                                    ) : (
                                      <span key={partIdx}>{formatText(part.value)}</span>
                                    )
                                  )
                                ) : (
                                  <span>
                                    <span className="font-medium">{formatText(cleanPrompt)}</span> {slotControl}
                                  </span>
                                )}
                              </div>
                            </div>
                            {itemIdx < block.items.length - 1 && (
                              <div className="flex justify-center py-0.5 text-slate-600 dark:text-zinc-300 font-bold text-base select-none">
                                ↓
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={q.id}
                          ref={el => {
                            if (el && questionCardRefs?.current) {
                              questionCardRefs.current[q.id] = el;
                            }
                          }}
                          onClick={() => onSelectQuestion?.(q)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-[#EFF6FF]/75 dark:bg-[#1E2430]'
                              : 'hover:bg-slate-50/70 dark:hover:bg-[#1B1D23]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span
                                className={`shrink-0 min-w-[28px] h-[28px] px-1.5 rounded-full text-[13px] font-extrabold inline-flex items-center justify-center border shadow-2xs ${
                                  isActive
                                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                                    : selectedVal
                                    ? 'bg-blue-50 dark:bg-blue-500/20 text-[#2563EB] dark:text-blue-300 border-[#2563EB]/40'
                                    : 'bg-white dark:bg-[#23252C] text-[#111827] dark:text-white border-[#CBD5E1] dark:border-[#4A4A4A]'
                                }`}
                              >
                                {displayNum}
                              </span>
                              <div className={`min-w-0 flex-1 ${fontSizeClass} leading-[1.7] text-[#111827] dark:text-[#F3F4F6]`}>
                                {foundSlot ? (
                                  parts.map((part, partIdx) =>
                                    part.type === 'slot' ? (
                                      <span key={partIdx}>{slotControl}</span>
                                    ) : (
                                      <span key={partIdx}>{formatText(part.value)}</span>
                                    )
                                  )
                                ) : (
                                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 max-w-xl">
                                    <span className="font-medium">{formatText(cleanPrompt)}</span>
                                    {slotControl}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {renderScopeJumpChip(q)}
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  onToggleBookmark?.(q.id);
                                }}
                                title={isFlagged ? 'Bỏ đánh dấu câu này' : 'Đánh dấu xem lại'}
                                className={`p-1 rounded transition ${
                                  isFlagged
                                    ? 'text-amber-500 dark:text-amber-400'
                                    : 'text-slate-400 dark:text-neutral-500 hover:text-amber-500'
                                }`}
                              >
                                <Bookmark className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (block.kind === 'questionGroup') {
          const firstNum = block.items[0]?.displayNum;
          const lastNum = block.items[block.items.length - 1]?.displayNum;
          const groupMeta = getQuestionTypeMeta(block.groupType, scopeType);
          const firstItem = block.items[0]?.question;
          const isFlowchartGroup = block.groupType === 'flowchart_completion';
          const instructionText =
            block.instruction ||
            getStandardGroupInstruction(firstItem, firstItem?.options);

          return (
            <div key={block.key} className="space-y-3">
              <div className="space-y-1 pb-1 border-b border-slate-200 dark:border-[#32353E]">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-[15px] sm:text-base font-extrabold text-[#111827] dark:text-white">
                    Questions {firstNum}–{lastNum}
                  </h4>
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/35">
                    {groupMeta.shortLabel}
                  </span>
                </div>
                {instructionText && (
                  <p className="text-[15px] font-semibold text-[#1F2937] dark:text-[#E5E7EB]">
                    {formatText(instructionText)}
                  </p>
                )}
                {block.hasNB && (
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                      NB You may use any letter more than once.
                    </span>
                  </div>
                )}
              </div>
              <div className={block.imageUrl ? 'grid grid-cols-1 md:grid-cols-12 gap-5 items-start' : ''}>
                {block.imageUrl && (
                  <div className="md:col-span-5 rounded-xl border border-[#CBD5E1] dark:border-[#343434] bg-white dark:bg-[#141414] p-3 shadow-2xs">
                    <img
                      src={block.imageUrl}
                      alt={`Bản đồ / Sơ đồ câu ${firstNum}–${lastNum}`}
                      onClick={() => onZoomImage?.(block.imageUrl)}
                      className="w-full max-h-[460px] object-contain rounded mx-auto cursor-zoom-in"
                    />
                    {onZoomImage && (
                      <button
                        type="button"
                        onClick={() => onZoomImage(block.imageUrl)}
                        className="mt-2 mx-auto block text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        Bấm vào ảnh để phóng to bản đồ / sơ đồ
                      </button>
                    )}
                  </div>
                )}
                <div className={`${block.imageUrl ? 'md:col-span-7 ' : ''}${isFlowchartGroup ? 'space-y-1.5 max-w-2xl mx-auto' : 'space-y-3'}`}>
                  {block.items.map(({ question: itemQ, displayNum }, itemIdx) =>
                    isFlowchartGroup ? (
                      <div key={itemQ.id}>
                        <div className="rounded-md border border-slate-200 dark:border-[#343434] bg-white dark:bg-[#191B21] px-6 py-3 text-center shadow-2xs">
                          {renderSingleQuestionCard(itemQ, displayNum, {
                            insideGroup: true,
                            groupImageUrl: block.imageUrl || ''
                          })}
                        </div>
                        {itemIdx < block.items.length - 1 && (
                          <div className="flex justify-center py-0.5 text-slate-600 dark:text-zinc-300 font-bold text-base select-none">
                            ↓
                          </div>
                        )}
                      </div>
                    ) : (
                      renderSingleQuestionCard(itemQ, displayNum, {
                        insideGroup: true,
                        groupImageUrl: block.imageUrl || ''
                      })
                    )
                  )}
                </div>
              </div>
            </div>
          );
        }

        return renderSingleQuestionCard(block.question, block.displayNum, { insideGroup: false });
      })}
    </div>
  );
}
