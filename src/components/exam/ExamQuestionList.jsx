import { Bookmark } from 'lucide-react';
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
  onToggleBookmark,
  questionCardRefs,
  questions = [],
  scopeLabelPrefix = '',
  scopeType = 'reading',
  showScopeBadge = false
}) {
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
    <div className="font-exam space-y-4">
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
                                  {cleanPrompt}
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

        return (
          <div
            key={block.key}
            ref={el => {
              if (el && questionCardRefs?.current) {
                questionCardRefs.current[q.id] = el;
              }
            }}
            onClick={() => onSelectQuestion?.(q)}
            className={`px-4 py-3.5 rounded-lg border transition ${
              isActive
                ? 'bg-[#EFF6FF]/60 dark:bg-[#1E232D] border-[#2563EB] dark:border-[#3B82F6]'
                : 'bg-[#FFF9FB] dark:bg-[#161616] border-rose-200/80 dark:border-[#2C2C2C] hover:border-rose-300 dark:hover:border-[#404040]'
            }`}
          >
            <div className="flex items-start justify-between gap-2.5 mb-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={`shrink-0 min-w-[26px] h-6 px-1.5 rounded text-xs font-extrabold inline-flex items-center justify-center border mt-0.5 ${
                    isActive
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-slate-100 dark:bg-[#262626] text-[#111827] dark:text-white border-[#CBD5E1] dark:border-[#404040]'
                  }`}
                >
                  {displayNum}
                </span>
                <p className={`font-semibold text-[#111827] dark:text-[#F3F4F6] ${fontSizeClass} leading-snug`}>
                  {cleanPrompt}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
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

            {(q.type === 'mcq' || q.type === 'tfng') && (
              <div className="space-y-1 pl-8">
                {(q.options || []).map((opt, optIdx) => {
                  const isSelected = answers?.[q.id] === opt;
                  return (
                    <label
                      key={optIdx}
                      className={`flex items-start gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#DBEAFE] dark:bg-[#2563EB]/25 text-[#1E3A8A] dark:text-white'
                          : 'text-[#374151] dark:text-[#D1D5DB] hover:bg-slate-100 dark:hover:bg-[#232323]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${scopeType}_q_${q.id}`}
                        value={opt}
                        checked={isSelected}
                        onChange={e => onAnswerChange?.(q.id, e.target.value)}
                        className="mt-1 accent-[#2563EB] shrink-0"
                      />
                      <span className={`${fontSizeClass} leading-snug font-medium`}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.type === 'fill' && (
              <div className="pl-8 pt-1">
                <input
                  type="text"
                  placeholder={`${displayNum}`}
                  value={answers?.[q.id] || ''}
                  onChange={e => onAnswerChange?.(q.id, e.target.value)}
                  className="w-full max-w-sm h-9 px-3.5 rounded-[5px] text-sm font-bold transition outline-none border bg-[#F1F3F5] dark:bg-[#4B4C52] text-[#111827] dark:text-white border-[#B8BFC9] dark:border-[#5D5F66] focus:bg-white dark:focus:bg-[#242833] focus:border-[#2563EB] dark:focus:border-[#3B82F6] placeholder:text-[#6B7280] dark:placeholder:text-[#D1D5DB] placeholder:font-bold"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
