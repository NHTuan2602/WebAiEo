import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Mic,
  MicOff,
  RotateCcw,
  Square,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { getSpeakingQuestionItems, normalizeSpeakingSection } from '../../constants/seedData';
import { buildSpeakingExaminerLeadIn } from '../../utils/speakingExaminerScript';
import { uploadSpeakingRecording } from '../../utils/speakingApi';
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

const isRecordingComplete = (rec) => Boolean(rec && (rec.blob || rec.audioUrl || rec.recorded));

export default function IntegratedSpeakingSection({
  autoExaminerMode = false,
  candidateName = '',
  initialQuestionIdx = 0,
  test,
  recordingsMap = {},
  onQuestionIndexChange,
  onUpdateRecording,
  onSpeakingNotesChange,
  speakingNotes = {}
}) {
  const speakingCfg = useMemo(() => normalizeSpeakingSection(test?.speaking), [test?.speaking]);
  const questions = useMemo(() => getSpeakingQuestionItems(test?.speaking, 'all'), [test?.speaking]);

  const [currentIdx, setCurrentIdx] = useState(() => {
    if (!questions.length) return 0;
    const firstUnanswered = questions.findIndex(q => !isRecordingComplete(recordingsMap?.[q.id]));
    if (firstUnanswered >= 0) {
      return firstUnanswered;
    }
    return Math.min(Math.max(0, Number(initialQuestionIdx) || 0), questions.length - 1);
  });
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
  const [part2PrepCountdown, setPart2PrepCountdown] = useState(null);
  const [promptPlayBlocked, setPromptPlayBlocked] = useState(false);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const meterFrameRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const autoRecordTimerRef = useRef(null);
  const part2PrepTimerRef = useRef(null);
  const goQuestionRef = useRef(null);
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
  const isUnmountedRef = useRef(false);
  const autoAdvanceTimerRef = useRef(null);

  const safeIdx = Math.min(Math.max(0, currentIdx), Math.max(0, questions.length - 1));
  const currentQ = questions[safeIdx] || null;
  const currentExaminerLead = useMemo(
    () =>
      buildSpeakingExaminerLeadIn({
        item: currentQ,
        index: safeIdx,
        items: questions,
        speakingCfg,
        candidateName,
        testTitle: test?.title || ''
      }),
    [currentQ, safeIdx, questions, speakingCfg, candidateName, test?.title]
  );
  const currentQuestionIdRef = useRef(currentQ?.id || '');
  const currentRec = currentQ ? recordingsMap[currentQ.id] : null;
  const recordedCount = useMemo(
    () => questions.filter(q => isRecordingComplete(recordingsMap[q.id])).length,
    [questions, recordingsMap]
  );

  // When resuming after F5 with previously saved answers, auto-connect Mic if browser already granted permission
  // so the student resumes directly at the next unanswered question without getting stuck on the Mic Check screen!
  const autoResumedAfterReloadRef = useRef(false);
  useEffect(() => {
    if (!autoExaminerMode || isSpeakingSectionStarted || autoResumedAfterReloadRef.current) return;
    if (recordedCount <= 0) return;
    autoResumedAfterReloadRef.current = true;
    let cancelled = false;
    const tryAutoResume = async () => {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
        let canAutoOpen = false;
        if (navigator.permissions?.query) {
          try {
            const status = await navigator.permissions.query({ name: 'microphone' });
            if (status?.state === 'granted') canAutoOpen = true;
          } catch {
            // Safari/Firefox fallback below
          }
        }
        if (!canAutoOpen || cancelled) return;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        mediaStreamRef.current = stream;
        hasMicPermissionRef.current = true;
        isSpeakingSectionStartedRef.current = true;
        setHasMicPermission(true);
        startMicrophoneMeter(stream);
        setIsSpeakingSectionStarted(true);
        const resumeIdx = questions.findIndex(q => !isRecordingComplete(recordingsMapRef.current?.[q.id]));
        const targetIdx = resumeIdx >= 0 ? resumeIdx : Math.max(0, questions.length - 1);
        setCurrentIdx(targetIdx);
        onQuestionIndexChange?.(targetIdx);
        const targetQ = questions[targetIdx] || null;
        currentQuestionIdRef.current = targetQ?.id || '';
        if (targetQ && !isRecordingComplete(recordingsMapRef.current?.[targetQ.id])) {
          readPromptAndAutoRecord(targetQ, true, targetIdx);
        }
      } catch {
        // Keep clean Mic Check button if browser requires an explicit click
      }
    };
    tryAutoResume();
    return () => {
      cancelled = true;
    };
  }, [autoExaminerMode, isSpeakingSectionStarted, recordedCount, questions]);

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
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      promptCycleRef.current += 1;
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      if (autoRecordTimerRef.current) clearInterval(autoRecordTimerRef.current);
      if (part2PrepTimerRef.current) clearInterval(part2PrepTimerRef.current);
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

  const clearPart2PrepTimer = () => {
    if (part2PrepTimerRef.current) {
      clearInterval(part2PrepTimerRef.current);
      part2PrepTimerRef.current = null;
    }
    setPart2PrepCountdown(null);
  };

  const formatMmSs = (sec) => {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const startPart2PrepTimer = (questionId, initialPrepSec = 60) => {
    clearPart2PrepTimer();
    clearAutoRecordTimer();
    if (
      !questionId ||
      currentQuestionIdRef.current !== questionId ||
      isRecordingRef.current ||
      isRecordingComplete(recordingsMapRef.current?.[questionId])
    ) {
      return;
    }
    let remaining = Math.max(1, Number(initialPrepSec) || 60);
    setPart2PrepCountdown(remaining);
    part2PrepTimerRef.current = setInterval(() => {
      if (
        currentQuestionIdRef.current !== questionId ||
        isRecordingRef.current ||
        isRecordingComplete(recordingsMapRef.current?.[questionId])
      ) {
        clearPart2PrepTimer();
        return;
      }
      remaining -= 1;
      if (remaining <= 0) {
        clearPart2PrepTimer();
        startRecordingRef.current?.();
      } else {
        setPart2PrepCountdown(remaining);
      }
    }, 1000);
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
      isRecordingComplete(recordingsMapRef.current?.[questionId])
    ) {
      return;
    }
    let remaining = 3;
    setAutoRecordCountdown(remaining);
    autoRecordTimerRef.current = setInterval(() => {
      if (
        currentQuestionIdRef.current !== questionId ||
        isRecordingRef.current ||
        isRecordingComplete(recordingsMapRef.current?.[questionId])
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

  const readPromptAndAutoRecord = (question, autoRecord = true, explicitIdx = safeIdx) => {
    if (!question) return;
    cancelPromptPlayback();
    const cycle = promptCycleRef.current;
    const questionId = question.id;
    let ttsFallbackStarted = false;
    const examinerScript = buildSpeakingExaminerLeadIn({
      item: question,
      index: explicitIdx,
      items: questions,
      speakingCfg,
      candidateName,
      testTitle: test?.title || ''
    });
    const spokenPayload = examinerScript.fullSpokenText || question.prompt || '';
    if (!question.audioUrl && speakingCfg.disableAiTts) {
      setPromptPlayBlocked(true);
      if (question.part === 2 && !isRecordingComplete(recordingsMapRef.current?.[questionId]) && !part2PrepTimerRef.current) {
        startPart2PrepTimer(questionId, question.prepSec || 60);
      }
      return;
    }
    const finishPrompt = () => {
      if (cycle !== promptCycleRef.current || currentQuestionIdRef.current !== questionId) return;
      if (promptFallbackTimerRef.current) {
        clearTimeout(promptFallbackTimerRef.current);
        promptFallbackTimerRef.current = null;
      }
      setIsSpeakingPrompt(false);
      if (question.part === 2 && !isRecordingComplete(recordingsMapRef.current?.[questionId])) {
        if (!part2PrepTimerRef.current) {
          startPart2PrepTimer(questionId, question.prepSec || 60);
        }
      } else if (autoRecord && !isRecordingComplete(recordingsMapRef.current?.[questionId])) {
        startAutoRecordCountdown(questionId);
      }
    };

    const speakPromptText = () => {
      if (cycle !== promptCycleRef.current || currentQuestionIdRef.current !== questionId || ttsFallbackStarted) return;
      ttsFallbackStarted = true;
      if (!spokenPayload || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSpeakingPrompt(false);
        setPromptPlayBlocked(true);
        if (question.part === 2 && !recordingsMapRef.current?.[questionId] && !part2PrepTimerRef.current) {
          startPart2PrepTimer(questionId, question.prepSec || 60);
        }
        return;
      }
      try {
        const utterance = new SpeechSynthesisUtterance(spokenPayload);
        const voices = window.speechSynthesis.getVoices?.() || [];
        const voice = voices.find(item => /^en-GB/i.test(item.lang)) || voices.find(item => /^en/i.test(item.lang));
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || 'en-GB';
        utterance.rate = 0.95;
        utterance.onend = finishPrompt;
        utterance.onerror = () => {
          if (cycle !== promptCycleRef.current) return;
          if (promptFallbackTimerRef.current) clearTimeout(promptFallbackTimerRef.current);
          promptFallbackTimerRef.current = null;
          setIsSpeakingPrompt(false);
          setPromptPlayBlocked(true);
          if (question.part === 2 && !recordingsMapRef.current?.[questionId] && !part2PrepTimerRef.current) {
            startPart2PrepTimer(questionId, question.prepSec || 60);
          }
        };
        const wordCount = Math.max(1, String(spokenPayload).trim().split(/\s+/).length);
        const estimatedReadMs = Math.min(48000, Math.max(2500, wordCount * 460 + 1200));
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
      clearPart2PrepTimer();
      clearAutoRecordTimer();
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
        const baseRecPayload = {
          questionId: capturedQuestion.id,
          part: capturedQuestion.part,
          prompt: capturedQuestion.prompt || capturedQuestion.topic || '',
          blob,
          previewUrl,
          durationSec: elapsed,
          transcript: liveTranscriptRef.current.trim(),
          recorded: true,
          savedAt: Date.now()
        };
        onUpdateRecording?.(capturedQuestion.id, baseRecPayload);

        // Immediately upload audio to server in background so F5 never loses recorded audio!
        if (blob.size > 0) {
          const stableAudioId = `sp4_${String(test?.id || 'exam').replace(/[^a-zA-Z0-9_-]/g, '').slice(-12)}_${capturedQuestion.id}_${Date.now()}`;
          uploadSpeakingRecording({
            blob,
            audioId: stableAudioId,
            mimeType: blobType,
            questionId: capturedQuestion.id
          })
            .then(up => {
              if (up?.audioUrl) {
                onUpdateRecording?.(capturedQuestion.id, {
                  ...baseRecPayload,
                  audioUrl: up.audioUrl,
                  audioId: up.audioId || stableAudioId
                });
              }
            })
            .catch(() => {
              // Keep local blob for retry during final exam submit
            });
        }

        stopHardwareAndTimers();
        if (isUnmountedRef.current) return;
        setIsRecording(false);

        const capturedIdx = questions.findIndex(q => q.id === capturedQuestion.id);
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        if (capturedQuestion.part === 2) {
          const nextPart3Idx = questions.findIndex((q, i) => i > capturedIdx && q.part === 3);
          const targetNext = nextPart3Idx !== -1 ? nextPart3Idx : capturedIdx + 1;
          if (targetNext > capturedIdx && targetNext < questions.length) {
            autoAdvanceTimerRef.current = setTimeout(() => {
              if (!isUnmountedRef.current) goQuestionRef.current?.(targetNext);
            }, 400);
          }
        } else if (autoExaminerMode && capturedIdx >= 0 && capturedIdx + 1 < questions.length) {
          // In Thực Chiến / Mock Test: automatically save & advance straight to the next question
          autoAdvanceTimerRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) goQuestionRef.current?.(capturedIdx + 1);
          }, 550);
        }
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

      const maxRecordSecForQuestion =
        capturedQuestion.part === 2
          ? (Number(capturedQuestion.speakSec) > 0 ? Number(capturedQuestion.speakSec) : 120)
          : 0;
      recordStartMsRef.current = Date.now();
      recorder.start(250);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => {
        const sec = Math.max(0, Math.floor((Date.now() - recordStartMsRef.current) / 1000));
        setRecordElapsedSec(sec);
        if (maxRecordSecForQuestion > 0 && sec >= maxRecordSecForQuestion) {
          stopRecording();
        }
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
  }, [autoExaminerMode, currentQ, onUpdateRecording, questions, stopHardwareAndTimers, test?.id]);
  const startRecordingRef = useRef(startRecording);
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  const goQuestion = (nextIdx) => {
    const targetIdx = Math.min(Math.max(0, nextIdx), Math.max(0, questions.length - 1));
    if (isRecordingRef.current) stopRecording();
    clearPart2PrepTimer();
    setMicError('');
    const nextQ = questions[targetIdx] || null;
    currentQuestionIdRef.current = nextQ?.id || '';
    setCurrentIdx(targetIdx);
    onQuestionIndexChange?.(targetIdx);
    if (autoExaminerMode && isSpeakingSectionStartedRef.current) {
      // In Thực Chiến / Mock Test: read examiner prompt FIRST; Part 2 1-minute prep starts ONLY in finishPrompt() after reading ends!
      readPromptAndAutoRecord(nextQ, true, targetIdx);
    } else {
      cancelPromptPlayback();
      if (nextQ?.part === 2 && !isRecordingComplete(recordingsMapRef.current?.[nextQ.id])) {
        startPart2PrepTimer(nextQ.id, nextQ.prepSec || 60);
      }
    }
  };
  goQuestionRef.current = goQuestion;

  useEffect(() => {
    if (
      !autoExaminerMode &&
      isSpeakingSectionStarted &&
      !isSpeakingPrompt &&
      currentQ?.part === 2 &&
      !isRecording &&
      !isRecordingComplete(currentRec) &&
      part2PrepCountdown === null &&
      !part2PrepTimerRef.current
    ) {
      startPart2PrepTimer(currentQ.id, currentQ.prepSec || 60);
    }
    if (currentQ?.part !== 2 && part2PrepCountdown !== null) {
      clearPart2PrepTimer();
    }
  }, [autoExaminerMode, currentQ?.id, currentQ?.part, currentQ?.prepSec, isSpeakingSectionStarted, isSpeakingPrompt, isRecording, currentRec, part2PrepCountdown]);

  const handleReadCurrentPrompt = () => {
    if (isRecordingRef.current) stopRecording();
    readPromptAndAutoRecord(currentQ, autoExaminerMode, safeIdx);
  };

  const beginSpeakingSection = () => {
    if (!hasMicPermissionRef.current) {
      setMicError('Hãy kiểm tra và cho phép Micro trước khi bắt đầu.');
      return;
    }
    const firstUnanswered = questions.findIndex(q => !isRecordingComplete(recordingsMapRef.current?.[q.id]));
    const targetIdx = firstUnanswered >= 0 ? firstUnanswered : safeIdx;
    const targetQ = questions[targetIdx] || currentQ;
    currentQuestionIdRef.current = targetQ?.id || '';
    setCurrentIdx(targetIdx);
    onQuestionIndexChange?.(targetIdx);
    isSpeakingSectionStartedRef.current = true;
    setIsSpeakingSectionStarted(true);
    setMicError('');
    if (targetQ && !isRecordingComplete(recordingsMapRef.current?.[targetQ.id])) {
      readPromptAndAutoRecord(targetQ, autoExaminerMode, targetIdx);
    }
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
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E] dark:text-teal-300">Speaking</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-100">
              {recordedCount > 0
                ? `Tiếp tục từ Câu ${Math.min(questions.length, safeIdx + 1)} (Đã lưu ${recordedCount}/${questions.length} câu)`
                : 'Kiểm tra Micro trước khi nói'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
              {recordedCount > 0
                ? 'Các câu bạn đã nói trước đó đã được lưu lại. Bật lại Micro để tiếp tục câu kế tiếp.'
                : 'Cho phép Micro và nói thử để kiểm tra âm lượng trước khi bắt đầu.'}
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
              {recordedCount > 0 ? `Tiếp tục Câu ${Math.min(questions.length, safeIdx + 1)}` : 'Bắt đầu phần Speaking'}
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
            <Mic className="w-3.5 h-3.5" /> Phần 4/4 · Speaking
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-zinc-100">
            Speaking Trực Tiếp
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
            Nghe câu hỏi và trả lời lần lượt. Dừng ghi âm sẽ tự lưu và chuyển sang câu tiếp theo.
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
          const isDone = isRecordingComplete(recordingsMap[q.id]);
          const isActive = idx === safeIdx;
          const isLockedPill = Boolean(autoExaminerMode);
          return (
            <button
              key={q.id}
              type="button"
              data-testid={`speaking-nav-pill-${idx}`}
              disabled={isLockedPill}
              onClick={() => {
                if (isLockedPill) return;
                goQuestion(idx);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                  : isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
              } ${isLockedPill ? 'cursor-not-allowed opacity-90' : 'hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
            >
              <span>P{q.part} · Câu {idx + 1}</span>
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : isLockedPill && !isActive ? (
                <Lock className="w-3 h-3 opacity-60" />
              ) : null}
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
            {currentExaminerLead.leadInText && !currentQ.audioUrl && (
              <div className="mt-2.5 p-3 rounded-lg bg-teal-50/85 dark:bg-teal-950/35 border border-teal-200 dark:border-teal-800/70 space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F766E] dark:text-teal-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  Lời dẫn Giám khảo AI (tự động đọc trước câu hỏi)
                </p>
                {autoExaminerMode ? (
                  <p className="text-xs italic text-teal-900 dark:text-teal-100">
                    🎧 Giám khảo AI đang dẫn đề Part {currentQ.part} theo kịch bản IELTS chuẩn và đọc câu hỏi...
                  </p>
                ) : (
                  <p className="text-xs text-slate-800 dark:text-teal-50 leading-relaxed italic">
                    &ldquo;
                    {currentExaminerLead.leadInSegments.map((seg, sIdx) =>
                      seg.isDynamic ? (
                        <span
                          key={sIdx}
                          className="font-extrabold not-italic underline decoration-2 decoration-[#0F766E] dark:decoration-teal-300 underline-offset-2 text-[#0F766E] dark:text-teal-200"
                        >
                          {seg.text}
                        </span>
                      ) : (
                        <span key={sIdx}>{seg.text}</span>
                      )
                    )}
                    &rdquo;
                  </p>
                )}
              </div>
            )}

            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-zinc-100 leading-snug mt-2">
              {autoExaminerMode
                ? (isSpeakingPrompt
                    ? '🎧 Đang đọc câu hỏi...'
                    : autoRecordCountdown !== null
                    ? `🎙️ Tự ghi âm sau ${autoRecordCountdown}s...`
                    : isRecordingComplete(currentRec)
                    ? '✅ Đã ghi âm xong'
                    : '🎧 Nghe câu hỏi và trả lời')
                : currentQ.prompt}
            </h3>
          </div>

          {(!speakingCfg.disableAiTts || currentQ.audioUrl) && currentQ.prompt && (!autoExaminerMode || !currentRec) && (
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

        {/* Cue Card Bullets for Part 2 (hidden in strict Thực Chiến audio-only mode) */}
        {!autoExaminerMode && Array.isArray(currentQ.bullets) && currentQ.bullets.length > 0 && (
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

        {/* Scratchpad Notes & Automated 1m Prep -> 2m Record Countdown for Part 2 */}
        {currentQ.part === 2 && (
          <div className="space-y-3">
            {!isRecording && !currentRec && (
              <div
                data-testid="part2-prep-countdown-banner"
                className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300 dark:border-amber-700/70 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                    isSpeakingPrompt ? 'bg-teal-600 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {isSpeakingPrompt ? <Volume2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                      {isSpeakingPrompt
                        ? 'Giám Khảo Đang Đọc Đề Part 2 (Chưa Bắt Đầu Tính Giờ)'
                        : 'Đồng Hồ Đếm Ngược 1 Phút Chuẩn Bị Part 2'}
                    </p>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
                      {isSpeakingPrompt
                        ? 'Hãy lắng nghe giám khảo đọc xong câu hỏi — ngay khi đọc xong, đồng hồ 1 phút chuẩn bị sẽ tự động bắt đầu đếm ngược!'
                        : <>Hết 1 phút chuẩn bị hệ thống sẽ tự động chuyển sang <strong>Đồng hồ đếm ngược 2 phút ghi âm</strong>!</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    data-testid="part2-prep-timer-value"
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-amber-300 font-mono text-lg font-black tracking-wider"
                  >
                    {formatMmSs(isSpeakingPrompt ? (currentQ.prepSec || 60) : (part2PrepCountdown ?? (currentQ.prepSec || 60)))}
                  </span>
                  <button
                    type="button"
                    data-testid="part2-skip-prep-record-btn"
                    disabled={isSpeakingPrompt}
                    onClick={() => {
                      if (isSpeakingPrompt) return;
                      clearPart2PrepTimer();
                      clearAutoRecordTimer();
                      startRecordingRef.current?.();
                    }}
                    className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-extrabold transition"
                  >
                    {isSpeakingPrompt ? 'Đang nghe đề...' : 'Ghi Âm 2 Phút Ngay →'}
                  </button>
                </div>
              </div>
            )}

            {isRecording && (
              <div
                data-testid="part2-record-countdown-banner"
                className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/70 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0 animate-pulse">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-rose-900 dark:text-rose-200">
                      Đồng Hồ Đếm Ngược 2 Phút Ghi Âm Part 2 (Tự động chuyển qua Phần 3)
                    </p>
                    <p className="text-xs text-rose-800/90 dark:text-rose-300/90">
                      Khi hết 2 phút hoặc khi bạn bấm Dừng Ghi Âm, hệ thống sẽ lưu bài nói và tự chuyển sang <strong>Part 3</strong>.
                    </p>
                  </div>
                </div>
                <span
                  data-testid="part2-record-timer-value"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-mono text-lg font-black tracking-wider"
                >
                  {formatMmSs(Math.max(0, maxTargetSec - recordElapsedSec))}
                </span>
              </div>
            )}

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
                autoExaminerMode && isRecordingComplete(currentRec) ? (
                  <span className="px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs sm:text-sm font-bold inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Đã ghi âm xong
                  </span>
                ) : (
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
                )
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-sm font-bold flex items-center gap-2 transition animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" />{' '}
                  {currentQ.part === 2
                    ? `Dừng Ghi Âm & Qua Part 3 (Còn ${formatMmSs(Math.max(0, maxTargetSec - recordElapsedSec))})`
                    : `Dừng Ghi Âm (${recordElapsedSec}s)`}
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

          {(currentRec?.previewUrl || currentRec?.audioUrl) && !isRecording && (
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Nghe lại bản ghi:
                </span>
                {!autoExaminerMode && (
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
                )}
              </div>
              <audio controls src={currentRec.previewUrl || currentRec.audioUrl} className="w-full h-9" />
              {currentRec.transcript && (
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Transcript: {currentRec.transcript}
                </p>
              )}
            </div>
          )}

          {!isRecordingComplete(currentRec) && !isRecording && (
            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <MicOff className="w-3.5 h-3.5" /> Chưa ghi âm câu này.
            </p>
          )}
        </div>

        {/* Prev / Next Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800">
          {autoExaminerMode ? (
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
              Câu {safeIdx + 1} / {questions.length}
            </span>
          ) : (
            <>
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
            </>
          )}
          <button
            type="button"
            data-testid="speaking-next-question-btn"
            disabled={safeIdx >= questions.length - 1 || (autoExaminerMode && (!isRecordingComplete(currentRec) || isRecording || isSpeakingPrompt))}
            onClick={() => goQuestion(safeIdx + 1)}
            className="px-3.5 py-2 rounded-lg bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
          >
            Câu Tiếp Theo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
