import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mic,
  MicOff,
  RotateCcw,
  Square,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { getSpeakingQuestionItems, normalizeSpeakingSection } from '../../constants/seedData';

const pickSupportedMimeType = () => {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ];
  for (const mime of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    } catch {
      // ignore unsupported
    }
  }
  return '';
};

export default function IntegratedSpeakingSection({
  test,
  recordingsMap = {},
  onUpdateRecording,
  onSpeakingNotesChange,
  speakingNotes = {}
}) {
  const speakingCfg = useMemo(() => normalizeSpeakingSection(test?.speaking), [test?.speaking]);
  const questions = useMemo(() => getSpeakingQuestionItems(test?.speaking, 'all'), [test?.speaking]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordElapsedSec, setRecordElapsedSec] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micError, setMicError] = useState('');

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordStartMsRef = useRef(0);
  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');

  const safeIdx = Math.min(Math.max(0, currentIdx), Math.max(0, questions.length - 1));
  const currentQ = questions[safeIdx] || null;
  const currentRec = currentQ ? recordingsMap[currentQ.id] : null;
  const recordedCount = useMemo(
    () => questions.filter(q => Boolean(recordingsMap[q.id]?.blob || recordingsMap[q.id]?.audioUrl)).length,
    [questions, recordingsMap]
  );

  const stopHardwareAndTimers = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      } catch {
        // ignore
      }
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopHardwareAndTimers();
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
    };
  }, []);

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    } else {
      stopHardwareAndTimers();
      setIsRecording(false);
    }
  };

  const startRecording = async () => {
    if (!currentQ || isRecording) return;
    setMicError('');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicError('Trình duyệt hiện tại không hỗ trợ ghi âm Micro. Vui lòng dùng Chrome/Edge/Safari và cấp quyền Micro.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      liveTranscriptRef.current = '';
      setLiveTranscript('');
      setRecordElapsedSec(0);

      const mimeType = pickSupportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const capturedQuestion = currentQ;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const elapsed = Math.max(1, Math.round((Date.now() - recordStartMsRef.current) / 1000));
        const blobType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: blobType });
        const previewUrl = URL.createObjectURL(blob);
        onUpdateRecording?.(capturedQuestion.id, {
          questionId: capturedQuestion.id,
          part: capturedQuestion.part,
          prompt: capturedQuestion.prompt || capturedQuestion.topic || '',
          blob,
          previewUrl,
          durationSec: elapsed,
          transcript: liveTranscriptRef.current.trim()
        });
        stopHardwareAndTimers();
        setIsRecording(false);
      };

      // Optional live speech-to-text helper for Ms. Nhu's grading reference
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.lang = 'en-US';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (evt) => {
            let fullText = '';
            for (let i = 0; i < evt.results.length; i++) {
              fullText += `${evt.results[i][0]?.transcript || ''} `;
            }
            liveTranscriptRef.current = fullText.trim();
            setLiveTranscript(fullText.trim());
          };
          rec.onerror = () => {
            // silent fallback; audio recording continues cleanly
          };
          rec.start();
          recognitionRef.current = rec;
        } catch {
          // ignore if unavailable
        }
      }

      recordStartMsRef.current = Date.now();
      recorder.start(250);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => {
        const sec = Math.max(0, Math.floor((Date.now() - recordStartMsRef.current) / 1000));
        setRecordElapsedSec(sec);
      }, 300);
    } catch (err) {
      stopHardwareAndTimers();
      setIsRecording(false);
      setMicError(
        err?.name === 'NotAllowedError'
          ? 'Bạn chưa cấp quyền Micro cho trình duyệt. Bấm biểu tượng ổ khóa trên thanh địa chỉ để cho phép Micro.'
          : `Không thể mở Micro: ${err?.message || 'Lỗi thiết bị'}`
      );
    }
  };

  const speakPromptAloud = (text) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = 0.96;
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore
    }
  };

  const goQuestion = (nextIdx) => {
    if (isRecording) stopRecording();
    setMicError('');
    setCurrentIdx(Math.min(Math.max(0, nextIdx), Math.max(0, questions.length - 1)));
  };

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-center space-y-2">
        <p className="text-base font-bold text-slate-900 dark:text-zinc-100">
          Phần thi Speaking chưa có câu hỏi nào.
        </p>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Bạn có thể bấm nút Nộp Bài Thi ở góc trên phải để gửi bài cho Ms. Như duyệt &amp; chấm điểm.
        </p>
      </div>
    );
  }

  const maxTargetSec = currentQ?.speakSec || (currentQ?.part === 2 ? 120 : 60);

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2.5 py-0.5 rounded-md mb-1.5">
            <Mic className="w-3.5 h-3.5" /> Phần 4/4 · Speaking Thực Chiến Liên Hoàn
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-zinc-100">
            Ghi Âm Trả Lời Speaking Trực Tiếp Trong Phòng Thi
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-0.5">
            Trả lời lần lượt các câu hỏi bên dưới. Toàn bộ bài làm 4 kỹ năng (Listening, Reading, Writing &amp; Speaking) sẽ được gửi cho <b>Ms. Như kiểm tra &amp; trả điểm</b> sau khi bạn bấm Nộp Bài.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3.5 py-2 rounded-lg">
          <CheckCircle2 className={`w-4 h-4 ${recordedCount === questions.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`} />
          <div className="text-xs">
            <p className="font-extrabold text-slate-900 dark:text-zinc-100">
              Đã ghi âm: {recordedCount}/{questions.length} câu
            </p>
            <p className="text-slate-500 dark:text-zinc-400">
              {recordedCount === questions.length ? 'Sẵn sàng nộp bài!' : 'Hoàn thành tất cả các câu'}
            </p>
          </div>
        </div>
      </div>

      {/* Question Navigator Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {questions.map((q, idx) => {
          const isDone = Boolean(recordingsMap[q.id]?.blob || recordingsMap[q.id]?.audioUrl);
          const isActive = idx === safeIdx;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => goQuestion(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                  : isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span>P{q.part} · Câu {idx + 1}</span>
              {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </div>

      {/* Main Active Question Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-extrabold">
                {currentQ.partLabel}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                Chủ đề: {currentQ.topic}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Gợi ý ~{maxTargetSec}s
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-zinc-100 leading-snug mt-2">
              {currentQ.prompt}
            </h3>
          </div>

          {!speakingCfg.disableAiTts && !currentQ.audioUrl && currentQ.prompt && (
            <button
              type="button"
              onClick={() => speakPromptAloud(currentQ.prompt)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition shrink-0"
            >
              <Volume2 className="w-4 h-4" /> Nghe câu hỏi
            </button>
          )}
        </div>

        {/* Teacher Audio Prompt (if uploaded) */}
        {currentQ.audioUrl && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Audio câu hỏi từ Ms. Như:
            </p>
            <audio controls src={currentQ.audioUrl} className="w-full h-9" />
          </div>
        )}

        {/* Cue Card Bullets for Part 2 */}
        {Array.isArray(currentQ.bullets) && currentQ.bullets.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              You should say:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-800 dark:text-zinc-200">
              {currentQ.bullets.map((b, bIdx) => (
                <li key={bIdx}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Scratchpad Notes for Part 2 */}
        {currentQ.part === 2 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Giấy nháp ý tưởng Part 2 (1 phút chuẩn bị - tùy chọn):
            </label>
            <textarea
              rows={3}
              value={speakingNotes[currentQ.id] || ''}
              onChange={e => onSpeakingNotesChange?.(currentQ.id, e.target.value)}
              placeholder="Ghi nhanh từ khóa / cấu trúc câu bạn sẽ nói trong 2 phút..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-sm text-slate-900 dark:text-zinc-100 outline-none focus:border-teal-600"
            />
          </div>
        )}

        {micError && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-200 flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* Recording Controls */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold flex items-center gap-2 transition"
                >
                  <Mic className="w-4 h-4" />
                  {currentRec ? 'Ghi Âm Lại Câu Này' : 'Bắt Đầu Ghi Âm'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-sm font-bold flex items-center gap-2 transition animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" /> Dừng Ghi Âm ({recordElapsedSec}s)
                </button>
              )}

              {isRecording && (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  Đang thu âm câu {safeIdx + 1}...
                </span>
              )}
            </div>

            {currentRec && !isRecording && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Đã lưu bản ghi ({currentRec.durationSec || 0}s)
              </span>
            )}
          </div>

          {isRecording && liveTranscript && (
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 italic">
              Nhận diện lời nói: &quot;{liveTranscript}&quot;
            </div>
          )}

          {currentRec?.previewUrl && !isRecording && (
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Nghe lại bản ghi của bạn:
                </span>
                <button
                  type="button"
                  onClick={startRecording}
                  className="text-xs font-bold text-slate-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Thu lại
                </button>
              </div>
              <audio controls src={currentRec.previewUrl} className="w-full h-9" />
              {currentRec.transcript && (
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Transcript: {currentRec.transcript}
                </p>
              )}
            </div>
          )}

          {!currentRec && !isRecording && (
            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <MicOff className="w-3.5 h-3.5" /> Chưa có bản ghi âm cho câu hỏi này. Bấm &quot;Bắt Đầu Ghi Âm&quot; để trả lời.
            </p>
          )}
        </div>

        {/* Prev / Next Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            disabled={safeIdx === 0}
            onClick={() => goQuestion(safeIdx - 1)}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-zinc-200 disabled:opacity-40 flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Câu Trước
          </button>
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            Câu {safeIdx + 1} / {questions.length}
          </span>
          <button
            type="button"
            disabled={safeIdx >= questions.length - 1}
            onClick={() => goQuestion(safeIdx + 1)}
            className="px-3.5 py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1 transition"
          >
            Câu Tiếp Theo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
