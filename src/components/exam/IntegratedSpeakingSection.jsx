import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import AudioLevelMeter from '../speaking/AudioLevelMeter';

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
  autoExaminerMode = false,
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
  const [hasMicPermission, setHasMicPermission] = useState(!autoExaminerMode);
  const [isCheckingMic, setIsCheckingMic] = useState(false);
  const [isSpeakingSectionStarted, setIsSpeakingSectionStarted] = useState(!autoExaminerMode);
  const [micLevel, setMicLevel] = useState(0);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);
  const [autoRecordCountdown, setAutoRecordCountdown] = useState(null);
  const [promptPlayBlocked, setPromptPlayBlocked] = useState(false);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const meterFrameRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const autoRecordTimerRef = useRef(null);
  const promptFallbackTimerRef = useRef(null);
  const promptAudioRef = useRef(null);
  const promptCycleRef = useRef(0);
  const recordStartMsRef = useRef(0);
  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');
  const isRecordingRef = useRef(isRecording);
  const hasMicPermissionRef = useRef(hasMicPermission);
  const isSpeakingSectionStartedRef = useRef(isSpeakingSectionStarted);
  const recordingsMapRef = useRef(recordingsMap);

  const safeIdx = Math.min(Math.max(0, currentIdx), Math.max(0, questions.length - 1));
  const currentQ = questions[safeIdx] || null;
  const currentQuestionIdRef = useRef(currentQ?.id || '');
  const currentRec = currentQ ? recordingsMap[currentQ.id] : null;
  const recordedCount = useMemo(
    () => questions.filter(q => Boolean(recordingsMap[q.id]?.blob || recordingsMap[q.id]?.audioUrl)).length,
    [questions, recordingsMap]
  );

  useEffect(() => {
    isRecordingRef.current = isRecording;
    hasMicPermissionRef.current = hasMicPermission;
    isSpeakingSectionStartedRef.current = isSpeakingSectionStarted;
    recordingsMapRef.current = recordingsMap;
    currentQuestionIdRef.current = currentQ?.id || '';
  }, [isRecording, hasMicPermission, isSpeakingSectionStarted, recordingsMap, currentQ?.id]);

  const stopHardwareAndTimers = useCallback(({ releaseStream = false } = {}) => {
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
    if (releaseStream && mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      } catch {
        // ignore
      }
      mediaStreamRef.current = null;
    }
    if (releaseStream && meterFrameRef.current) {
      cancelAnimationFrame(meterFrameRef.current);
      meterFrameRef.current = null;
    }
    if (releaseStream && audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      promptCycleRef.current += 1;
      if (autoRecordTimerRef.current) clearInterval(autoRecordTimerRef.current);
      if (promptFallbackTimerRef.current) clearTimeout(promptFallbackTimerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
      try {
        promptAudioRef.current?.pause();
      } catch {
        // ignore
      }
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      stopHardwareAndTimers({ releaseStream: true });
    };
  }, [stopHardwareAndTimers]);

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

  const startMicrophoneMeter = (stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (meterFrameRef.current) cancelAnimationFrame(meterFrameRef.current);
      analyserRef.current?.disconnect();
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextClass();
      }
      const context = audioContextRef.current;
      if (context.state === 'suspended') context.resume();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(buffer);
        let peak = 0;
        for (let index = 0; index < buffer.length; index += 1) {
          peak = Math.max(peak, Math.abs(buffer[index] - 128));
        }
        setMicLevel(Math.min(100, Math.round((peak / 64) * 100)));
        meterFrameRef.current = requestAnimationFrame(tick);
      };
      if (meterFrameRef.current) cancelAnimationFrame(meterFrameRef.current);
      meterFrameRef.current = requestAnimationFrame(tick);
    } catch {
      setMicLevel(0);
    }
  };

  const ensureMicPermission = async () => {
    setMicError('');
    setIsCheckingMic(true);
    const existingStream = mediaStreamRef.current;
    if (existingStream?.getAudioTracks().some(track => track.readyState === 'live')) {
      setHasMicPermission(true);
      if (!analyserRef.current) startMicrophoneMeter(existingStream);
      setIsCheckingMic(false);
      return true;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicError('Trình duyệt này chưa hỗ trợ micro. Hãy mở trang bằng Chrome, Edge hoặc Safari qua HTTPS.');
      setIsCheckingMic(false);
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setHasMicPermission(true);
      startMicrophoneMeter(stream);
      return true;
    } catch (error) {
      setHasMicPermission(false);
      setMicError(
        error?.name === 'NotAllowedError'
          ? 'Micro đang bị chặn. Cho phép Micro trong biểu tượng ổ khóa trên thanh địa chỉ rồi thử lại.'
          : `Không thể kết nối Micro: ${error?.message || 'Lỗi thiết bị'}`
      );
      return false;
    } finally {
      setIsCheckingMic(false);
    }
  };

  const clearAutoRecordTimer = () => {
    if (autoRecordTimerRef.current) {
      clearInterval(autoRecordTimerRef.current);
      autoRecordTimerRef.current = null;
    }
    setAutoRecordCountdown(null);
  };

  const cancelPromptPlayback = () => {
    promptCycleRef.current += 1;
    if (promptFallbackTimerRef.current) {
      clearTimeout(promptFallbackTimerRef.current);
      promptFallbackTimerRef.current = null;
    }
    clearAutoRecordTimer();
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      promptAudioRef.current?.pause();
    } catch {
      // ignore
    }
    promptAudioRef.current = null;
    setIsSpeakingPrompt(false);
  };

  const startAutoRecordCountdown = questionId => {
    clearAutoRecordTimer();
    if (
      !questionId ||
      currentQuestionIdRef.current !== questionId ||
      isRecordingRef.current ||
      recordingsMapRef.current?.[questionId]
    ) {
      return;
    }
    let remaining = 3;
    setAutoRecordCountdown(remaining);
    autoRecordTimerRef.current = setInterval(() => {
      if (
        currentQuestionIdRef.current !== questionId ||
        isRecordingRef.current ||
        recordingsMapRef.current?.[questionId]
      ) {
        clearAutoRecordTimer();
        return;
      }
      remaining -= 1;
      if (remaining <= 0) {
        clearAutoRecordTimer();
        startRecordingRef.current?.();
      } else {
        setAutoRecordCountdown(remaining);
      }
    }, 1000);
  };

  const readPromptAndAutoRecord = (question, autoRecord = true) => {
    if (!question) return;
    cancelPromptPlayback();
    const cycle = promptCycleRef.current;
    const questionId = question.id;
    let ttsFallbackStarted = false;
    if (!question.audioUrl && speakingCfg.disableAiTts) {
      setPromptPlayBlocked(true);
      return;
    }
    const finishPrompt = () => {
      if (cycle !== promptCycleRef.current || currentQuestionIdRef.current !== questionId) return;
      if (promptFallbackTimerRef.current) {
        clearTimeout(promptFallbackTimerRef.current);
        promptFallbackTimerRef.current = null;
      }
      setIsSpeakingPrompt(false);
      if (autoRecord && !recordingsMapRef.current?.[questionId]) {
        startAutoRecordCountdown(questionId);
      }
    };

    const speakPromptText = () => {
      if (cycle !== promptCycleRef.current || currentQuestionIdRef.current !== questionId || ttsFallbackStarted) return;
      ttsFallbackStarted = true;
      if (!question.prompt || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSpeakingPrompt(false);
        setPromptPlayBlocked(true);
        return;
      }
      try {
        const utterance = new SpeechSynthesisUtterance(question.prompt);
        const voices = window.speechSynthesis.getVoices?.() || [];
        const voice = voices.find(item => /^en-GB/i.test(item.lang)) || voices.find(item => /^en/i.test(item.lang));
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || 'en-GB';
        utterance.rate = 0.96;
        utterance.onend = finishPrompt;
        utterance.onerror = () => {
          if (cycle !== promptCycleRef.current) return;
          if (promptFallbackTimerRef.current) clearTimeout(promptFallbackTimerRef.current);
          promptFallbackTimerRef.current = null;
          setIsSpeakingPrompt(false);
          setPromptPlayBlocked(true);
        };
        const wordCount = Math.max(1, String(question.prompt).trim().split(/\s+/).length);
        const estimatedReadMs = Math.min(18000, Math.max(2500, wordCount * 450 + 600));
        promptFallbackTimerRef.current = setTimeout(finishPrompt, estimatedReadMs + 1200);
        setPromptPlayBlocked(false);
        setIsSpeakingPrompt(true);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeakingPrompt(false);
        setPromptPlayBlocked(true);
      }
    };

    if (question.audioUrl && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio(question.audioUrl);
        promptAudioRef.current = audio;
        audio.onended = finishPrompt;
        audio.onerror = speakPromptText;
        setPromptPlayBlocked(false);
        setIsSpeakingPrompt(true);
        const playPromise = audio.play();
        if (playPromise?.catch) playPromise.catch(speakPromptText);
        return;
      } catch {
        speakPromptText();
        return;
      }
    }
    speakPromptText();
  };

  const startRecording = useCallback(async () => {
    if (!currentQ || isRecordingRef.current) return;
    if (autoExaminerMode && !hasMicPermissionRef.current) {
      setMicError('Hãy kiểm tra và cho phép Micro trước khi bắt đầu phần Speaking.');
      return;
    }
    setMicError('');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicError('Trình duyệt hiện tại không hỗ trợ ghi âm Micro. Vui lòng dùng Chrome/Edge/Safari và cấp quyền Micro.');
      return;
    }
    try {
      const existingStream = mediaStreamRef.current;
      const hasLiveAudioTrack = existingStream?.getAudioTracks().some(track => track.readyState === 'live');
      const stream = hasLiveAudioTrack ? existingStream : await navigator.mediaDevices.getUserMedia({ audio: true });
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
  }, [autoExaminerMode, currentQ, onUpdateRecording, stopHardwareAndTimers]);
  const startRecordingRef = useRef(startRecording);
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  const goQuestion = (nextIdx) => {
    const targetIdx = Math.min(Math.max(0, nextIdx), Math.max(0, questions.length - 1));
    if (isRecordingRef.current) stopRecording();
    setMicError('');
    currentQuestionIdRef.current = questions[targetIdx]?.id || '';
    setCurrentIdx(targetIdx);
    if (autoExaminerMode && isSpeakingSectionStartedRef.current) {
      readPromptAndAutoRecord(questions[targetIdx], true);
    } else {
      cancelPromptPlayback();
    }
  };

  const handleReadCurrentPrompt = () => {
    if (isRecordingRef.current) stopRecording();
    readPromptAndAutoRecord(currentQ, autoExaminerMode);
  };

  const beginSpeakingSection = () => {
    if (!hasMicPermissionRef.current) {
      setMicError('Hãy kiểm tra và cho phép Micro trước khi bắt đầu phần Speaking.');
      return;
    }
    isSpeakingSectionStartedRef.current = true;
    setIsSpeakingSectionStarted(true);
    setMicError('');
    readPromptAndAutoRecord(currentQ, autoExaminerMode);
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

  if (autoExaminerMode && !isSpeakingSectionStarted) {
    return (
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <section className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 text-center space-y-5">
          <span className="mx-auto w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0F766E] dark:text-teal-300 flex items-center justify-center border border-teal-200 dark:border-teal-800">
            <Mic className="w-5 h-5" />
          </span>
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E] dark:text-teal-300">Speaking Thực Chiến / Mock</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-100">Kiểm tra Micro trước khi nói</h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-xl mx-auto">
              {speakingCfg.disableAiTts
                ? 'Cho phép Micro và nói thử để kiểm tra âm lượng. File câu hỏi của giáo viên sẽ tự phát; với câu không có file, hãy đọc nội dung trên màn hình rồi tự bật Micro.'
                : 'Cho phép Micro và nói thử để kiểm tra âm lượng. Khi bắt đầu, giám khảo sẽ đọc từng câu hỏi; sau khi đọc xong, hệ thống đếm 3 giây rồi tự bật ghi âm.'}
            </p>
          </div>

          {hasMicPermission && (
            <div className="max-w-sm mx-auto space-y-2">
              <AudioLevelMeter level={micLevel} active={hasMicPermission} barCount={24} />
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Micro đã kết nối. Hãy nói thử và quan sát mức âm lượng.
              </p>
            </div>
          )}

          {micError && (
            <div className="max-w-xl mx-auto px-3 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-200">
              {micError}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={isCheckingMic}
              onClick={ensureMicPermission}
              className="px-4 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs font-extrabold disabled:opacity-60"
            >
              {isCheckingMic ? 'Đang kiểm tra Micro...' : hasMicPermission ? 'Kiểm tra lại Micro' : 'Bấm Kiểm Tra Micro'}
            </button>
            <button
              type="button"
              disabled={!hasMicPermission}
              onClick={beginSpeakingSection}
              className="px-5 py-2.5 rounded-lg bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold disabled:opacity-50"
            >
              Bắt đầu phần Speaking
            </button>
          </div>
        </section>
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
            {autoExaminerMode
              ? 'Giám khảo tự đọc câu hỏi; sau 3 giây hệ thống bật Micro. Bài làm sẽ được gửi cho Ms. Như kiểm tra sau khi bạn nộp bài.'
              : 'Trả lời lần lượt các câu hỏi bên dưới. Toàn bộ bài làm 4 kỹ năng (Listening, Reading, Writing & Speaking) sẽ được gửi cho Ms. Như kiểm tra & trả điểm sau khi bạn bấm Nộp Bài.'}
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

          {(!speakingCfg.disableAiTts || currentQ.audioUrl) && currentQ.prompt && (
            <button
              type="button"
              onClick={handleReadCurrentPrompt}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                isSpeakingPrompt
                  ? 'bg-[#007A7A] text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              {isSpeakingPrompt
                ? 'Đang đọc câu hỏi...'
                : autoExaminerMode
                ? promptPlayBlocked
                  ? 'Bấm để nghe câu hỏi'
                  : 'Đọc lại câu hỏi'
                : 'Nghe câu hỏi'}
            </button>
          )}
        </div>

        {autoExaminerMode && autoRecordCountdown !== null && !isRecording && (
          <div className="px-3.5 py-3 rounded-lg bg-rose-600 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold">
              <Mic className="w-4 h-4 shrink-0" />
              <span>Tự bật Micro ghi âm sau {autoRecordCountdown} giây...</span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearAutoRecordTimer();
                startRecordingRef.current?.();
              }}
              className="px-3 py-1.5 rounded-lg bg-white text-rose-800 text-xs font-extrabold hover:bg-rose-50"
            >
              Nói ngay
            </button>
          </div>
        )}

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
                  onClick={() => {
                    clearAutoRecordTimer();
                    startRecordingRef.current?.();
                  }}
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
                  onClick={() => {
                    clearAutoRecordTimer();
                    startRecordingRef.current?.();
                  }}
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
