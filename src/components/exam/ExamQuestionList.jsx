import { Bookmark } from 'lucide-react';
import { getQuestionTypeMeta } from '../../utils/examHelpers';
import {
  groupQuestionsForRendering,
  stripLeadingQuestionNumber
} from '../../utils/examUiHelpers';

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
  questionCardRefs,
  questions = [],
  renderText = null,
  scopeLabelPrefix = '',
  scopeType = 'reading',
  showScopeBadge = false
}) {
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
          className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#3A3A3A] hover:border-[#2563EB]"
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
          className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#3A3A3A] hover:border-[#2563EB]"
        >
          {scopeLabelPrefix || 'Passage'} {q.passageIdx + 1}
        </button>
      );
    }
    return null;
  };

  return (
    <div onMouseUp={onTextSelect || undefined} data-exam-copy-source="true" className="font-exam space-y-4 select-text">
      {grouped.map(block => {
        if (block.kind === 'matrix') {
          const firstNum = block.items[0]?.displayNum;
          const lastNum = block.items[block.items.length - 1]?.displayNum;

          return (
            <div key={block.key} className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[15px] sm:text-base font-extrabold text-[#111827] dark:text-white">
                  Questions {firstNum}–{lastNum}
                </h4>
              </div>

              <div className="rounded-lg border border-[#CBD5E1] dark:border-[#343434] overflow-x-auto bg-white dark:bg-[#141414]">
                <table className="w-full border-collapse text-left min-w-[480px]">
                  <thead>
                    <tr className="bg-[#2563EB] text-white">
                      <th className="py-2.5 px-3 text-xs font-bold border-r border-blue-500/40 min-w-[220px]">
                        Statement
                      </th>
                      {block.options.map(opt => (
                        <th
                          key={opt}
                          className="py-2.5 px-2 text-center text-xs font-extrabold border-r last:border-r-0 border-blue-500/40 w-9"
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
                          <td className="py-3 px-3 border-r border-[#E2E8F0] dark:border-[#2C2C2C] align-top">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
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
                          </td>
                          {block.options.map(opt => {
                            const checked = selectedVal === opt;
                            return (
                              <td
                                key={opt}
                                onClick={e => {
                                  e.stopPropagation();
                                  onSelectQuestion?.(q);
                                  onAnswerChange?.(q.id, opt);
                                }}
                                className={`py-2.5 px-1.5 text-center border-r last:border-r-0 border-[#E2E8F0] dark:border-[#2C2C2C] cursor-pointer transition ${
                                  checked ? 'bg-blue-50/70 dark:bg-blue-500/15' : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                                }`}
                              >
                                <span
                                  className={`inline-flex w-4 h-4 rounded-full items-center justify-center border transition ${
                                    checked
                                      ? 'border-[#2563EB] dark:border-[#60A5FA] bg-[#2563EB] dark:bg-[#3B82F6]'
                                      : 'border-slate-400 dark:border-neutral-500 bg-transparent'
                                  }`}
                                >
                                  {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
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
          );
        }

        const q = block.question;
        const displayNum = block.displayNum;
        const isActive = activeQuestionId === q.id;
        const isFlagged = Boolean(bookmarkedQuestions?.[q.id]);
        const cleanPrompt = stripLeadingQuestionNumber(q.question) || q.question;
        const typeMeta = getQuestionTypeMeta(q.type, scopeType);
        const optionList = Array.isArray(q.options) ? q.options.map(o => String(o || '').trim()).filter(Boolean) : [];
        const hasChoiceOptions = optionList.length > 0;
        const wordLimitHint = String(q.wordLimit || '').trim();

        return (
          <div
            key={block.key}
            ref={el => {
              if (el && questionCardRefs?.current) {
                questionCardRefs.current[q.id] = el;
              }
            }}
            onClick={() => onSelectQuestion?.(q)}
            className={`py-3 transition ${
              isActive
                ? 'bg-pink-100/45 dark:bg-[#1E232D]/70 rounded-md px-2.5 -mx-2.5'
                : 'px-0'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={`shrink-0 min-w-[26px] h-[26px] px-1.5 rounded-[3px] text-[13px] font-bold inline-flex items-center justify-center border mt-0.5 ${
                    isActive
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white dark:bg-[#262626] text-[#111827] dark:text-white border-[#CBD5E1] dark:border-[#4A4A4A]'
                  }`}
                >
                  {displayNum}
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {q.type && q.type !== 'mcq' && q.type !== 'fill' && q.type !== 'tfng' && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/35">
                        {typeMeta.shortLabel}
                      </span>
                    )}
                    {wordLimitHint && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                        {wordLimitHint}
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

            {hasChoiceOptions ? (
              <div className="space-y-1.5 pl-1">
                {optionList.map((opt, optIdx) => {
                  const isSelected = answers?.[q.id] === opt;
                  return (
                    <label
                      key={optIdx}
                      className={`flex items-start gap-2.5 px-2 py-1 rounded-[4px] cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#DBEAFE]/80 dark:bg-[#2563EB]/25 text-[#111827] dark:text-white font-semibold'
                          : 'text-[#1F2937] dark:text-[#E5E7EB] hover:bg-pink-100/50 dark:hover:bg-[#232323]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${scopeType}_q_${q.id}`}
                        value={opt}
                        checked={isSelected}
                        onChange={e => onAnswerChange?.(q.id, e.target.value)}
                        className="mt-1.5 w-4 h-4 accent-[#2563EB] shrink-0"
                      />
                      <span className={`${fontSizeClass}`}>
                        {formatText(opt)}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="pl-1 pt-1">
                <input
                  type="text"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  autoComplete="off"
                  placeholder={wordLimitHint ? `Câu ${displayNum} (${wordLimitHint})` : `${displayNum}`}
                  value={answers?.[q.id] || ''}
                  onChange={e => onAnswerChange?.(q.id, e.target.value)}
                  className="w-56 sm:w-72 h-[34px] px-3 rounded-[3px] text-center text-[15px] font-bold transition outline-none border bg-white dark:bg-[#3A3B40] text-[#111827] dark:text-white border-[#767676] dark:border-[#5D5F66] focus:bg-[#FFFDF7] dark:focus:bg-[#23262E] focus:border-[#A16207] dark:focus:border-[#EAB308] placeholder:text-slate-500 dark:placeholder:text-slate-300 placeholder:text-xs placeholder:font-semibold"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
