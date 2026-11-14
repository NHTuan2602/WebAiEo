import { parseClozeLines, resolveQuestionForBlank } from '../../utils/clozeHelpers';

export default function ClozeNoteSheet({
  activeBlankNum = null,
  answers = {},
  clozeText = '',
  inputRefs = null,
  onAnswerChange,
  onBlankFocus,
  onPassageTextSelect,
  questions = [],
  readOnlyPreview = false,
  scopeField = 'trackIdx',
  scopeIdx = 0
}) {
  const parsedLines = parseClozeLines(clozeText);
  if (parsedLines.length === 0) return null;

  // Split optional preamble lines ("Questions 1-10", "Complete the notes...", "Write ONE WORD...")
  // from the main boxed note content so it mirrors the LexiPrep Computer-Delivered exam UI cleanly.
  const firstBoxLineIdx = parsedLines.findIndex(
    l => l.kind === 'heading' || l.kind === 'bullet'
  );
  const preambleLines = firstBoxLineIdx > 0 ? parsedLines.slice(0, firstBoxLineIdx) : [];
  const boxLines = firstBoxLineIdx > 0 ? parsedLines.slice(firstBoxLineIdx) : parsedLines;

  const renderSegments = (segments) =>
    segments.map((seg, idx) => {
      if (seg.type === 'text') {
        return <span key={idx}>{seg.value}</span>;
      }

      const linkedQ = resolveQuestionForBlank(questions, seg.blankNum, scopeField, scopeIdx);
      const qId = linkedQ?.id;
      const value = qId ? (answers?.[qId] || '') : '';
      const isActive = Number(activeBlankNum) === Number(seg.blankNum);

      return (
        <span key={`blank-${seg.blankNum}-${idx}`} className="inline-flex items-center align-middle mx-1.5 my-0.5">
          <input
            ref={el => {
              if (inputRefs?.current && el) {
                inputRefs.current[seg.blankNum] = el;
              }
            }}
            type="text"
            readOnly={readOnlyPreview}
            value={readOnlyPreview ? (linkedQ?.correctAnswer || '') : value}
            placeholder={String(seg.blankNum)}
            aria-label={`Câu ${seg.blankNum}`}
            onFocus={() => onBlankFocus?.(seg.blankNum, qId)}
            onChange={e => {
              if (readOnlyPreview || !qId) return;
              onAnswerChange?.(qId, e.target.value);
            }}
            className={`w-28 sm:w-36 px-3.5 py-1 rounded-full text-center text-xs sm:text-sm font-bold transition-all outline-none border ${
              isActive
                ? 'bg-[#EDFFFD] dark:bg-[#0D1A1E] text-[#0F172B] dark:text-white border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#00B2AD]/35 shadow-[0_0_12px_rgba(0,178,173,0.3)]'
                : value
                ? 'bg-white dark:bg-[#111827] text-[#0F172B] dark:text-white border-[#007A7A]/70 dark:border-[#00B2AD]/60'
                : 'bg-[#F8FAFC] dark:bg-[#0B1117] text-[#0F172B] dark:text-white border-slate-300 dark:border-slate-700 hover:border-[#007A7A] dark:hover:border-[#00B2AD]'
            } placeholder:text-[#007A7A] dark:placeholder:text-[#00B2AD] placeholder:font-extrabold`}
          />
        </span>
      );
    });

  const renderLine = (line) => {
    if (line.kind === 'spacer') {
      return <div key={line.id} className="h-2.5" />;
    }
    if (line.kind === 'heading') {
      return (
        <h4
          key={line.id}
          className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#0F172B] dark:text-white pt-1"
        >
          {renderSegments(line.segments)}
        </h4>
      );
    }
    if (line.kind === 'subheading') {
      return (
        <h5 key={line.id} className="text-xs sm:text-sm font-extrabold text-[#007A7A] dark:text-[#1EE1D6] pt-1">
          {renderSegments(line.segments)}
        </h5>
      );
    }
    if (line.kind === 'bullet') {
      return (
        <div
          key={line.id}
          className="flex items-start gap-2.5 text-xs sm:text-sm text-[#314158] dark:text-slate-200 leading-relaxed pl-1"
        >
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#007A7A] dark:bg-[#1EE1D6] shrink-0" />
          <div className="flex-1 leading-[2]">{renderSegments(line.segments)}</div>
        </div>
      );
    }
    return (
      <p key={line.id} className="text-xs sm:text-sm text-[#314158] dark:text-slate-200 leading-[1.9]">
        {renderSegments(line.segments)}
      </p>
    );
  };

  return (
    <div onMouseUp={onPassageTextSelect} className="space-y-4 select-text">
      {preambleLines.length > 0 && (
        <div className="space-y-1">
          {preambleLines.map(line =>
            line.kind === 'spacer' ? (
              <div key={line.id} className="h-1" />
            ) : (
              <p
                key={line.id}
                className={`text-xs sm:text-sm ${
                  /^Questions?\s+\d+/i.test(line.segments.map(s => s.value || '').join(''))
                    ? 'font-extrabold text-[#007A7A] dark:text-[#1EE1D6] text-base'
                    : 'font-semibold text-[#314158] dark:text-slate-300'
                }`}
              >
                {renderSegments(line.segments)}
              </p>
            )
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-300/90 dark:border-slate-700/90 bg-white dark:bg-[#0B1117] p-5 sm:p-7 space-y-2.5 shadow-xs">
        {boxLines.map(renderLine)}
      </div>
    </div>
  );
}
