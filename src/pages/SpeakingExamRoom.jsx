import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileAudio,
  Lightbulb,
  Lock,
  Mic,
  RotateCcw,
  Send,
  Square,
  Volume2
} from 'lucide-react';
import { BRAND_INFO } from '../constants/brandInfo';
import { formatViDateTime, getSpeakingQuestionItems, normalizeExamConfig, normalizeSpeakingSection } from '../constants/seedData';
import { createUniqueAttemptId } from '../utils/examHelpers';
import { cleanAudioMimeType } from '../utils/speakingAiEngine';
import { buildSpeakingExaminerLeadIn } from '../utils/speakingExaminerScript';
import { pickSupportedAudioMimeType, uploadSpeakingRecording, verifySpeakingRoomPassword } from '../utils/speakingApi';
import AudioLevelMeter from '../components/speaking/AudioLevelMeter';
import SpeakingResultCelebrationModal from '../components/speaking/SpeakingResultCelebrationModal';

function formatSecs(totalSec) {
  const s = Math.max(0, Math.floor(totalSec || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export default function SpeakingExamRoom({
  currentUser,
  dispatchSyncAction,
  onAttemptCreated,
  onExitSpeaking,
  onSpeakingRoomUnlocked,
  onViewResult,
  partMode = 'full',
  selectedTestId,
  showToast,
  speakingUnlockTokens = {},
  tests = [],
  transientTest = null
}) {
  const activeTest = transientTest || tests.find(t => t.id === selectedTestId);
  const cfg = normalizeExamConfig(activeTest);
  const spMeta = normalizeSpeakingSection(activeTest?.speaking);
  const isTeacher = currentUser?.role === 'teacher';
  const hasAnyRoomPass = Boolean(spMeta.hasRoomPassword || spMeta.roomPassword || cfg.hasExamPassword || cfg.examPassword);
  const isExamRoomMode = spMeta.speakingTrack === 'exam_room' || cfg.examPurpose === 'real_exam' || hasAnyRoomPass;
  const isDailyMode = spMeta.speakingTrack === 'daily';
  const isRealExamLocked = (cfg.maxAttempts > 0 || isExamRoomMode) && !isTeacher;
  const existingUnlockToken = activeTest ? (speakingUnlockTokens?.[activeTest.id] || '') : '';
  const [localUnlockToken, setLocalUnlockToken] = useState('');
  const [roomPassInput, setRoomPassInput] = useState('');
  const [roomPassError, setRoomPassError] = useState('');
  const [verifyingRoomPass, setVerifyingRoomPass] = useState(false);

  const effectiveUnlockToken = localUnlockToken || existingUnlockToken;
  const requiresRoomPassword =
    !isTeacher &&
    hasAnyRoomPass &&
    !effectiveUnlockToken;

  const partFilterMap = {
    full: 'all',
    part1: 'part1',
    part2: 'part2',
    part3: 'part3'
  };
  const items = getSpeakingQuestionItems(activeTest?.speaking, partFilterMap[partMode] || 'all');

  const [phase, setPhase] = useState('MIC_CHECK'); // 'MIC_CHECK' | 'ACTIVE' | 'GRADING' | 'CELEBRATION'
  const [micReady, setMicReady] = useState(false);
  const [micError, setMicError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [autoSpeakPrompt, setAutoSpeakPrompt] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Per-question recording state map: { [questionId]: { blob, objectUrl, mimeType, durationSec, clientTranscript } }
  const [recordingsByQid, setRecordingsByQid] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordElapsedSec, setRecordElapsedSec] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [prepRemainingSec, setPrepRemainingSec] = useState(0);
  const [part2Notes, setPart2Notes] = useState('');
  const [promptPlayBlocked, setPromptPlayBlocked] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);
  const [autoRecordCountdown, setAutoRecordCountdown] = useState(null);

  // Grading + Celebration state
  const [gradingProgressText, setGradingProgressText] = useState('');
  const [submittedAttempt, setSubmittedAttempt] = useState(null);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordStartedAtRef = useRef(0);
  const examStartedAtRef = useRef(0);
  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const meterRafRef = useRef(null);
  const recordTimerRef = useRef(null);
  const prepTimerRef = useRef(null);
  const autoRecordTimerRef = useRef(null);
  const ttsFallbackTimerRef = useRef(null);
  const createdUrlsRef = useRef([]);
  const submitLockRef = useRef(false);
  const promptAudioRef = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;
  const recordingsByQidRef = useRef(recordingsByQid);
  recordingsByQidRef.current = recordingsByQid;

  useEffect(() => {
    examStartedAtRef.current = Date.now();
    setCurrentIdx(0);
    setRecordingsByQid({});
    setPart2Notes('');
  }, [activeTest?.id]);

  const stopMeterLoop = () => {
    if (meterRafRef.current) {
      cancelAnimationFrame(meterRafRef.current);
      meterRafRef.current = null;
    }
    setAudioLevel(0);
  };

  const clearAutoRecordTimers = () => {
    if (autoRecordTimerRef.current) {
      clearInterval(autoRecordTimerRef.current);
      autoRecordTimerRef.current = null;
    }
    if (ttsFallbackTimerRef.current) {
      clearTimeout(ttsFallbackTimerRef.current);
      ttsFallbackTimerRef.current = null;
    }
    setAutoRecordCountdown(null);
  };

  const cleanupMediaResources = () => {
    clearAutoRecordTimers();
    setIsSpeakingPrompt(false);
    stopMeterLoop();
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      prepTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch (_err) {}
    recognitionRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch (_err) {}
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch (_err) {}
      audioCtxRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (promptAudioRef.current) {
      try {
        promptAudioRef.current.pause();
      } catch (_err) {}
      promptAudioRef.current = null;
    }
  };

  useEffect(() => {
    const urls = createdUrlsRef.current;
    return () => {
      cleanupMediaResources();
      urls.forEach(u => {
        try {
          URL.revokeObjectURL(u);
        } catch (_err) {}
      });
    };
  }, []);

  const currentItem = items[currentIdx] || items[0] || null;
  const currentPromptText = currentItem?.prompt || '';
  const currentPromptAudioUrl = currentItem?.audioUrl || '';
  const currentExaminerLead = buildSpeakingExaminerLeadIn({
    item: currentItem,
    index: currentIdx,
    items,
    speakingCfg: spMeta,
    candidateName: currentUser?.name || '',
    testTitle: activeTest?.title || ''
  });
  const currentSpokenText = currentExaminerLead.fullSpokenText || currentPromptText;
  const currentItemIdRef = useRef(currentItem?.id || '');
  currentItemIdRef.current = currentItem?.id || '';
  const prevPrepSecRef = useRef(prepRemainingSec);
  const handleBeginRecordingRef = useRef(null);

  const startExamRoom3sCountdown = () => {
    if (!isExamRoomMode) return;
    const targetQid = currentItemIdRef.current;
    if (phaseRef.current !== 'ACTIVE' || isRecordingRef.current || recordingsByQidRef.current?.[targetQid]) {
      return;
    }
    clearAutoRecordTimers();
    let remaining = 3;
    setAutoRecordCountdown(remaining);
    autoRecordTimerRef.current = setInterval(() => {
      if (phaseRef.current !== 'ACTIVE' || isRecordingRef.current || currentItemIdRef.current !== targetQid) {
        clearAutoRecordTimers();
        return;
      }
      remaining -= 1;
      if (remaining <= 0) {
        clearAutoRecordTimers();
        handleBeginRecordingRef.current?.();
      } else {
        setAutoRecordCountdown(remaining);
      }
    }, 1000);
  };
  const startExamRoom3sCountdownRef = useRef(startExamRoom3sCountdown);
  startExamRoom3sCountdownRef.current = startExamRoom3sCountdown;

  // Tick down Part 2 preparation timer cleanly — wait until examiner finishes reading the prompt!
  useEffect(() => {
    if (phase !== 'ACTIVE' || prepRemainingSec <= 0 || isSpeakingPrompt) return;
    const t = setInterval(() => {
      setPrepRemainingSec(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, prepRemainingSec, isSpeakingPrompt]);

  // When Part 2 1-minute prep timer reaches 0, automatically start the 2-minute Part 2 recording
  useEffect(() => {
    const prevVal = prevPrepSecRef.current;
    prevPrepSecRef.current = prepRemainingSec;
    if (
      phase === 'ACTIVE' &&
      currentItem?.part === 2 &&
      prevVal > 0 &&
      prepRemainingSec === 0 &&
      !isRecordingRef.current &&
      !recordingsByQidRef.current?.[currentItem.id]
    ) {
      handleBeginRecordingRef.current?.();
    }
  }, [phase, prepRemainingSec, currentItem?.id, currentItem?.part]);

  const stopPromptPlayback = () => {
    clearAutoRecordTimers();
    setIsSpeakingPrompt(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_err) {}
    }
    if (promptAudioRef.current) {
      try {
        promptAudioRef.current.pause();
      } catch (_err) {}
    }
  };

  const pickBestEnglishVoice = () => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
      const voices = window.speechSynthesis.getVoices?.() || [];
      return (
        voices.find(v => /^en-GB/i.test(v.lang) && /natural|google|samantha|libby|ryan|sonia/i.test(v.name)) ||
        voices.find(v => /^en-GB/i.test(v.lang)) ||
        voices.find(v => /^en-US/i.test(v.lang) && /natural|google|aria|jenny|guy/i.test(v.name)) ||
        voices.find(v => /^en/i.test(v.lang)) ||
        null
      );
    } catch (_err) {
      return null;
    }
  };

  const triggerPromptPlayback = (text, audioUrl = '', { allowAutoCountdown = false } = {}) => {
    stopPromptPlayback();
    if (audioUrl) {
      const audioEl = promptAudioRef.current;
      const onAudioDone = () => {
        setIsSpeakingPrompt(false);
        if (allowAutoCountdown) startExamRoom3sCountdownRef.current?.();
      };
      if (audioEl && typeof audioEl.play === 'function') {
        try {
          audioEl.currentTime = 0;
          audioEl.onended = onAudioDone;
          setIsSpeakingPrompt(true);
          const playPromise = audioEl.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(err => {
              setIsSpeakingPrompt(false);
              if (err?.name !== 'AbortError') {
                setPromptPlayBlocked(true);
                if (allowAutoCountdown) startExamRoom3sCountdownRef.current?.();
              }
            });
          }
        } catch (_err) {
          setIsSpeakingPrompt(false);
          Promise.resolve().then(() => setPromptPlayBlocked(true));
          if (allowAutoCountdown) startExamRoom3sCountdownRef.current?.();
        }
        return;
      }
      if (typeof Audio !== 'undefined') {
        try {
          const fallbackEl = new Audio(audioUrl);
          fallbackEl.onended = onAudioDone;
          promptAudioRef.current = fallbackEl;
          setIsSpeakingPrompt(true);
          fallbackEl.play().catch(err => {
            setIsSpeakingPrompt(false);
            if (err?.name !== 'AbortError') {
              setPromptPlayBlocked(true);
              if (allowAutoCountdown) startExamRoom3sCountdownRef.current?.();
            }
          });
        } catch (_err) {
          setIsSpeakingPrompt(false);
          Promise.resolve().then(() => setPromptPlayBlocked(true));
          if (allowAutoCountdown) startExamRoom3sCountdownRef.current?.();
        }
      }
      return;
    }

    // Always provide English AI TTS reading for Speaking questions when teacher audio isn't uploaded
    if (!text) {
      if (allowAutoCountdown) startExamRoom3sCountdownRef.current?.();
      return;
    }
    const wordCount = Math.max(1, String(text).trim().split(/\s+/).length);
    const estMs = Math.min(48000, Math.max(2500, wordCount * 460 + 1200));
    let completed = false;
    const finishSpeech = () => {
      if (completed) return;
      completed = true;
      if (ttsFallbackTimerRef.current) {
        clearTimeout(ttsFallbackTimerRef.current);
        ttsFallbackTimerRef.current = null;
      }
      setIsSpeakingPrompt(false);
      if (allowAutoCountdown) {
        startExamRoom3sCountdownRef.current?.();
      }
    };

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (allowAutoCountdown) {
        ttsFallbackTimerRef.current = setTimeout(finishSpeech, 400);
      }
      return;
    }

    try {
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickBestEnglishVoice();
      if (voice) utter.voice = voice;
      utter.lang = voice?.lang || 'en-GB';
      utter.rate = 0.95;
      utter.onend = finishSpeech;
      utter.onerror = finishSpeech;
      setIsSpeakingPrompt(true);
      if (allowAutoCountdown) {
        ttsFallbackTimerRef.current = setTimeout(finishSpeech, estMs);
      }
      window.speechSynthesis.speak(utter);
    } catch (_err) {
      finishSpeech();
    }
  };

  const speakPromptQuestion = (text, audioUrl = '') => {
    setPromptPlayBlocked(false);
    triggerPromptPlayback(text, audioUrl, { allowAutoCountdown: false });
  };

  const triggerPromptPlaybackRef = useRef(triggerPromptPlayback);
  triggerPromptPlaybackRef.current = triggerPromptPlayback;

  // Auto-play teacher recording or AI English TTS (including official IELTS Examiner lead-in) when entering a question.
  // In Exam Room mode, after reading finishes across Part 1, 2 & 3 -> starts 3s countdown -> auto-records!
  useEffect(() => {
    if (phase === 'ACTIVE' && (isExamRoomMode || autoSpeakPrompt) && (currentPromptAudioUrl || currentSpokenText)) {
      const targetQid = currentItem?.id || '';
      const alreadyRecorded = Boolean(recordingsByQidRef.current?.[targetQid]);
      const isPart2WithPrep = currentItem?.part === 2 && (currentItem?.prepSec || 0) > 0 && !alreadyRecorded;
      triggerPromptPlaybackRef.current(currentSpokenText, currentPromptAudioUrl, {
        allowAutoCountdown: isExamRoomMode && !alreadyRecorded && !isPart2WithPrep
      });
    }
    return () => stopPromptPlayback();
  }, [phase, currentIdx, isExamRoomMode, autoSpeakPrompt, currentSpokenText, currentPromptAudioUrl, currentItem?.id, currentItem?.part, currentItem?.prepSec]);

  const startMeterFromStream = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(buf);
        let peak = 0;
        for (let i = 0; i < buf.length; i++) {
          const deviation = Math.abs(buf[i] - 128);
          if (deviation > peak) peak = deviation;
        }
        setAudioLevel(Math.min(100, Math.round((peak / 64) * 100)));
        meterRafRef.current = requestAnimationFrame(tick);
      };
      stopMeterLoop();
      meterRafRef.current = requestAnimationFrame(tick);
    } catch (_err) {}
  };

  const ensureMicPermission = async () => {
    setMicError('');
    if (streamRef.current && streamRef.current.getAudioTracks().some(t => t.readyState === 'live')) {
      setMicReady(true);
      startMeterFromStream(streamRef.current);
      return streamRef.current;
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      const msg = 'Trình duyệt của bạn không hỗ trợ ghi âm Micro (yêu cầu HTTPS hoặc localhost).';
      setMicError(msg);
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicReady(true);
      startMeterFromStream(stream);
      return stream;
    } catch (err) {
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Bạn đã từ chối quyền Micro. Vui lòng bấm vào biểu tượng ổ khóa trên thanh địa chỉ trình duyệt để Cho phép Micro.'
          : 'Không tìm thấy hoặc không truy cập được Micro trên thiết bị này.';
      setMicError(msg);
      setMicReady(false);
      return null;
    }
  };

  const syncPrepForIndex = (idx, nextRecordingsMap = recordingsByQid) => {
    const targetItem = items[idx];
    if (targetItem && targetItem.part === 2 && targetItem.prepSec > 0 && !nextRecordingsMap[targetItem.id]) {
      setPrepRemainingSec(targetItem.prepSec);
    } else {
      setPrepRemainingSec(0);
    }
  };

  const handleVerifyRoomPassword = async (e) => {
    e?.preventDefault();
    if (!activeTest || verifyingRoomPass) return;
    setRoomPassError('');
    setVerifyingRoomPass(true);
    try {
      const res = await verifySpeakingRoomPassword({
        testId: activeTest.id,
        password: roomPassInput
      });
      const tok = res?.unlockToken || 'unlocked';
      setLocalUnlockToken(tok);
      onSpeakingRoomUnlocked?.(activeTest.id, tok);
      showToast?.('Đã xác nhận mật khẩu Phòng Thi Thực Chiến!', 'success');
    } catch (err) {
      setRoomPassError(err?.message || 'Mật khẩu Phòng Thi Thực Chiến chưa chính xác!');
    } finally {
      setVerifyingRoomPass(false);
    }
  };

  const handleStartExamSession = async () => {
    const stream = await ensureMicPermission();
    if (!stream && isRealExamLocked) return;
    setCurrentIdx(0);
    syncPrepForIndex(0);
    setPhase('ACTIVE');
  };

  const startSpeechRecognitionBackup = () => {
    try {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) return;
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      liveTranscriptRef.current = '';
      setLiveTranscript('');
      let finalChunks = '';
      rec.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const txt = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalChunks += (finalChunks ? ' ' : '') + txt.trim();
          } else {
            interim += txt;
          }
        }
        const combined = `${finalChunks}${interim ? ` ${interim}` : ''}`.trim();
        liveTranscriptRef.current = combined;
        setLiveTranscript(combined);
      };
      rec.onerror = () => {};
      rec.start();
      recognitionRef.current = rec;
    } catch (_err) {}
  };

  const stopCurrentRecording = () => {
    return new Promise((resolve) => {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      try {
        recognitionRef.current?.stop();
      } catch (_err) {}
      recognitionRef.current = null;

      const rec = recorderRef.current;
      if (!rec || rec.state === 'inactive') {
        setIsRecording(false);
        resolve(null);
        return;
      }
      rec.addEventListener('stop', () => resolve(true), { once: true });
      rec.stop();
    });
  };

  const handleBeginRecording = async () => {
    if (!currentItem || isRecording) return;
    clearAutoRecordTimers();
    if (prepRemainingSec > 0) {
      setPrepRemainingSec(0);
      if (prepTimerRef.current) {
        clearInterval(prepTimerRef.current);
        prepTimerRef.current = null;
      }
    }
    stopPromptPlayback();

    const stream = await ensureMicPermission();
    if (!stream) return;

    const chosenMime = pickSupportedAudioMimeType();
    let mediaRecorder;
    try {
      mediaRecorder = chosenMime ? new MediaRecorder(stream, { mimeType: chosenMime }) : new MediaRecorder(stream);
    } catch (_err) {
      mediaRecorder = new MediaRecorder(stream);
    }

    const qId = currentItem.id;
    const isPart2Item = currentItem.part === 2;
    const maxSec = isPart2Item ? (Number(currentItem.speakSec) > 0 ? Number(currentItem.speakSec) : 120) : (currentItem.speakSec || 45);
    chunksRef.current = [];
    recordStartedAtRef.current = Date.now();
    setRecordElapsedSec(0);
    setIsRecording(true);
    startSpeechRecognitionBackup();

    mediaRecorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunksRef.current.push(ev.data);
      }
    };

    mediaRecorder.onstop = () => {
      const elapsedSec = Math.max(1, Math.round((Date.now() - recordStartedAtRef.current) / 1000));
      const actualMime = cleanAudioMimeType(mediaRecorder.mimeType || chosenMime || 'audio/webm');
      const blob = new Blob(chunksRef.current, { type: actualMime });
      const objUrl = URL.createObjectURL(blob);
      createdUrlsRef.current.push(objUrl);
      const capturedTranscript = liveTranscriptRef.current.trim();

      setRecordingsByQid(prev => ({
        ...prev,
        [qId]: {
          blob,
          objectUrl: objUrl,
          mimeType: actualMime,
          durationSec: elapsedSec,
          clientTranscript: capturedTranscript
        }
      }));
      setIsRecording(false);
      if (isPart2Item) {
        const capturedIdx = items.findIndex(it => it.id === qId);
        const nextPart3Idx = items.findIndex((it, i) => i > capturedIdx && it.part === 3);
        const targetNext = nextPart3Idx !== -1 ? nextPart3Idx : capturedIdx + 1;
        if (targetNext > capturedIdx && targetNext < items.length) {
          showToast?.('Đã hoàn thành ghi âm Part 2 — Tự động chuyển sang Part 3!', 'info');
          setTimeout(() => {
            setLiveTranscript('');
            setCurrentIdx(targetNext);
            setPrepRemainingSec(0);
          }, 350);
        }
      }
    };

    recorderRef.current = mediaRecorder;
    mediaRecorder.start(250);

    recordTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordStartedAtRef.current) / 1000);
      setRecordElapsedSec(elapsed);
      // Part 2 always uses a 2-minute (120s) countdown and auto-transitions to Part 3
      if ((isExamRoomMode || isPart2Item) && elapsed >= maxSec) {
        stopCurrentRecording();
        showToast?.(
          isPart2Item
            ? `Đã hết 2 phút ghi âm Part 2 (${maxSec}s) - tự động lưu và chuyển qua Part 3!`
            : `Đã hết thời gian câu ${currentIdx + 1} (${maxSec}s) - tự động lưu ghi âm!`,
          'info'
        );
      }
    }, 250);
  };
  handleBeginRecordingRef.current = handleBeginRecording;

  const handleGoQuestion = async (nextIdx) => {
    if (isRecording) {
      await stopCurrentRecording();
    }
    setLiveTranscript('');
    const clampedIdx = Math.min(Math.max(0, nextIdx), items.length - 1);
    setCurrentIdx(clampedIdx);
    syncPrepForIndex(clampedIdx);
  };

  const handleFinalSubmitSpeaking = async () => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setShowSubmitConfirm(false);
    if (isRecording) {
      await stopCurrentRecording();
    }
    cleanupMediaResources();
    setPhase('GRADING');

    const attemptId = createUniqueAttemptId('att-spk', currentUser?.username);
    const savedRecordings = [];

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rec = recordingsByQid[item.id];
        if (rec?.blob && rec.blob.size > 0) {
          setGradingProgressText(`Đang lưu file ghi âm câu ${i + 1}/${items.length} lên hệ thống...`);
          const audioId = `${attemptId}_${item.id}`;
          let uploadedUrl = '';
          let finalMime = rec.mimeType || 'audio/webm';
          let sizeBytes = rec.blob.size;
          try {
            const up = await uploadSpeakingRecording({
              blob: rec.blob,
              audioId,
              mimeType: finalMime,
              attemptId,
              questionId: item.id
            });
            uploadedUrl = up.audioUrl;
            finalMime = up.mimeType || finalMime;
            sizeBytes = up.sizeBytes || sizeBytes;
          } catch (_uploadErr) {
            uploadedUrl = '';
          }

          savedRecordings.push({
            questionId: item.id,
            part: item.part,
            topic: item.topic,
            prompt: item.prompt,
            audioId: uploadedUrl ? audioId : '',
            audioUrl: uploadedUrl,
            mimeType: finalMime,
            sizeBytes,
            durationSec: rec.durationSec || 1,
            clientTranscript: rec.clientTranscript || ''
          });
        } else {
          savedRecordings.push({
            questionId: item.id,
            part: item.part,
            topic: item.topic,
            prompt: item.prompt,
            audioId: '',
            audioUrl: '',
            mimeType: 'audio/webm',
            sizeBytes: 0,
            durationSec: 0,
            clientTranscript: ''
          });
        }
      }

      setGradingProgressText('Đang hoàn tất gửi bài nói - Ms. Như đang check...');

      const enrichedRecordings = savedRecordings.map(r => ({
        ...r,
        transcript: r.clientTranscript || '',
        band: null,
        criteria: null,
        fluencyMetrics: null,
        feedback: '',
        grammarVocabularyFixes: [],
        vocabularyUpgrades: [],
        upgradedSample: ''
      }));

      const submittedAtMs = Date.now();
      const startedAtMs = examStartedAtRef.current > 0 ? examStartedAtRef.current : submittedAtMs;
      const durationSeconds = Math.max(1, Math.round((submittedAtMs - startedAtMs) / 1000));
      const dueAt = cfg.dueAt ? Number(cfg.dueAt) : null;
      const timelinessStatus = cfg.scheduleMode === 'flexible' || !dueAt
        ? 'flexible'
        : submittedAtMs > dueAt
        ? 'late'
        : 'on_time';
      const lateByMinutes = timelinessStatus === 'late' && dueAt
        ? Math.max(1, Math.round((submittedAtMs - dueAt) / 60_000))
        : 0;

      const newAttempt = {
        id: attemptId,
        testId: activeTest.id,
        testTitle: activeTest.title,
        testMode: 'single_skill',
        focusSkill: 'speaking',
        speakingPartMode: partMode,
        studentId: currentUser?.username || 'std_guest',
        studentName: currentUser?.name || 'Học viên',
        startedAtMs,
        startedAt: formatViDateTime(startedAtMs),
        submittedAtMs,
        submittedAt: formatViDateTime(submittedAtMs),
        durationSeconds,
        timelinessStatus,
        lateByMinutes,
        answers: {
          part2Notes,
          speakingRecordingsCount: enrichedRecordings.filter(r => r.durationSec > 0).length
        },
        speakingRecordings: enrichedRecordings,
        antiCheatLogs: [],
        tabSwitchCount: 0,
        teacherGraded: false,
        aiGraded: false,
        ...(effectiveUnlockToken ? { speakingUnlockToken: effectiveUnlockToken } : {}),
        scores: {
          listening: { raw: 0, total: 0, band: null },
          reading: { raw: 0, total: 0, band: null },
          writing: { task1Band: null, task2Band: null, overallBand: null },
          speaking: { band: null, criteria: {} }
        },
        overallBand: null,
        teacherFeedback: ''
      };

      onAttemptCreated?.(newAttempt);
      await dispatchSyncAction?.('UPSERT_ATTEMPT', { attempt: newAttempt });
      setSubmittedAttempt(newAttempt);
      setPhase('CELEBRATION');
    } catch (err) {
      submitLockRef.current = false;
      showToast?.(err?.message || 'Có lỗi khi lưu & chấm bài Speaking.', 'error');
      setPhase('ACTIVE');
    }
  };

  if (!activeTest || items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020618] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <img
            src={BRAND_INFO.avatarUrl}
            alt={BRAND_INFO.shortName}
            className="w-16 h-16 mx-auto rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 bg-white shadow-sm"
          />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Đề Speaking không có câu hỏi khả dụng
          </h2>
          <button
            type="button"
            onClick={() => onExitSpeaking?.()}
            className="w-full py-2.5 px-4 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold"
          >
            Quay Về Luyện Speaking
          </button>
        </div>
      </div>
    );
  }

  const recordedCount = items.filter(it => (recordingsByQid[it.id]?.durationSec || 0) > 0).length;
  const teacherAudioCount = items.filter(it => Boolean(it.audioUrl)).length;
  const allHaveTeacherAudio = items.length > 0 && teacherAudioCount === items.length;
  const hasTeacherAudioAny = teacherAudioCount > 0;
  // Thực Chiến: ẩn hoàn toàn chữ câu hỏi, chỉ nghe AI đọc rồi tự ghi âm sau 3s, không được ghi âm lại.
  // Daily & Forecast: hiển thị đầy đủ câu hỏi, không đếm ngược, cho phép thu âm lại thoải mái.
  const hideQuestionTextNow = isExamRoomMode
    ? !isTeacher
    : Boolean(currentItem?.audioUrl && spMeta.hidePromptTextWhenAudio && !currentItem.prompt);
  const currentRec = currentItem ? recordingsByQid[currentItem.id] : null;
  const maxAllowedSec = currentItem?.speakSec || 45;
  const remainingSpeakSec = Math.max(0, maxAllowedSec - recordElapsedSec);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020618] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Room Header */}
      <header className="bg-white dark:bg-[#0F172B] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={BRAND_INFO.avatarUrl}
            alt={BRAND_INFO.shortName}
            className={`w-9 h-9 rounded-full object-cover bg-white shrink-0 border-2 transition ${
              isRecording
                ? 'border-rose-500 ring-2 ring-rose-400/40 animate-pulse'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#007A7A] text-white shrink-0">
                {partMode === 'full' ? 'FULL TEST' : partMode.toUpperCase()}
              </span>
              {isDailyMode && (
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-600 text-white shrink-0">
                  Speaking Daily
                </span>
              )}
              {isExamRoomMode && (
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white shrink-0">
                  Phòng Thi Thực Chiến
                </span>
              )}
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {activeTest.title}
              </h1>
            </div>
            <p className="text-xs text-[#475569] dark:text-slate-400">
              Đã thu {recordedCount}/{items.length} câu · Tự động lưu file &amp; AI chấm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {phase === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp Bài &amp; Chấm AI</span>
            </button>
          )}
          {!isRealExamLocked || phase === 'MIC_CHECK' ? (
            <button
              type="button"
              onClick={() => {
                cleanupMediaResources();
                onExitSpeaking?.();
              }}
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#23222D] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Thoát
            </button>
          ) : (
            <span className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Thi Thật
            </span>
          )}
        </div>
      </header>

      {/* PHASE 0: PASSWORD GATE FOR EXAM ROOM (TEAM SẮP THI) */}
      {requiresRoomPassword && (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <form
            onSubmit={handleVerifyRoomPassword}
            className="max-w-md w-full bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 text-center"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EDFFFD] text-[#0F766E] dark:text-[#1EE1D6] flex items-center justify-center border border-[#007A7A]/30">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Phòng Thi Thực Chiến • Team Sắp Thi
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Nhập Mật Khẩu Vào Phòng Thi
              </h2>
              <p className="text-xs text-[#475569] dark:text-slate-400 leading-relaxed">
                Phòng thi <strong>{activeTest.title}</strong> được bảo vệ bằng mật khẩu dành riêng cho nhóm học viên chuẩn bị thi thật.
              </p>
            </div>

            <div className="space-y-2 text-left">
              <input
                type="password"
                autoFocus
                required
                value={roomPassInput}
                onChange={e => setRoomPassInput(e.target.value)}
                placeholder="Nhập mật khẩu phòng thi do giáo viên cấp..."
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#23222D] border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007A7A]"
              />
              {roomPassError && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {roomPassError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={verifyingRoomPass}
              className="w-full py-3 rounded-2xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-60 text-white text-sm font-extrabold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition"
            >
              <Lock className="w-4 h-4" />
              <span>{verifyingRoomPass ? 'Đang kiểm tra mật khẩu...' : 'Mở Khóa Phòng Thi Thực Chiến'}</span>
            </button>
          </form>
        </main>
      )}

      {/* PHASE 1: MIC CHECK */}
      {!requiresRoomPassword && phase === 'MIC_CHECK' && (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-lg w-full bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center">
            <img
              src={BRAND_INFO.avatarUrl}
              alt={BRAND_INFO.shortName}
              className="w-20 h-20 mx-auto rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 bg-white shadow-md"
            />
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#0F766E] dark:text-[#1EE1D6]">
                Chuẩn bị phòng thi Speaking AI
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Kiểm Tra Micro Trước Khi Nói
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-400">
                Gồm <strong>{items.length} câu hỏi</strong> ({partMode === 'full' ? 'Part 1 + Part 2 Cue Card + Part 3' : `Thi tập trung ${partMode.toUpperCase()}`}). Hệ thống sẽ lưu file ghi âm và chấm điểm tự động ngay sau khi hoàn thành.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#23222D] border border-slate-200 dark:border-slate-700 space-y-3">
              <AudioLevelMeter level={audioLevel} active={micReady} />
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={ensureMicPermission}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-[#2E2C3A] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{micReady ? 'Micro Đã Sẵn Sàng (Nói thử ngay)' : 'Bấm Kiểm Tra Micro'}</span>
                </button>
              </div>
              {micReady && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Micro đang thu tín hiệu tốt! Thanh sóng nhảy khi bạn nói.
                </p>
              )}
              {micError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {micError}
                </p>
              )}
            </div>

            {isExamRoomMode ? (
              <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/35 text-xs font-bold text-rose-700 dark:text-rose-200 leading-relaxed">
                ⏱️ <strong>Phòng Thi (Part 1 · 2 · 3):</strong> Giám khảo sẽ đọc câu hỏi, sau đó tự đếm ngược <strong>3 giây</strong> rồi <strong>bật Micro ghi âm</strong>.
              </div>
            ) : (
              <div className="px-4 py-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold text-indigo-800 dark:text-indigo-200 leading-relaxed">
                🎙️ <strong>Chế độ Tự Luyện:</strong> Giám khảo đọc câu hỏi bằng tiếng Anh, sau đó bạn bấm <strong>Bắt Đầu Trả Lời &amp; Ghi Âm</strong> khi sẵn sàng.
              </div>
            )}

            {hasTeacherAudioAny && (
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/35 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {allHaveTeacherAudio
                  ? `🎧 Tất cả ${teacherAudioCount}/${items.length} câu dùng file ghi âm chuẩn của Giáo viên.`
                  : `🎧 Đề có ${teacherAudioCount}/${items.length} câu dùng file ghi âm của Giáo viên - các câu còn lại dùng giọng Giám khảo đọc chuẩn IELTS.`}
              </div>
            )}

            {!isExamRoomMode && (
              <label className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSpeakPrompt}
                  onChange={e => setAutoSpeakPrompt(e.target.checked)}
                  className="w-4 h-4 accent-[#007A7A]"
                />
                <span>
                  {allHaveTeacherAudio
                    ? 'Tự động phát file ghi âm câu hỏi của Giáo viên khi sang câu mới'
                    : hasTeacherAudioAny
                      ? 'Tự động đọc câu hỏi khi sang câu mới (ưu tiên file ghi âm Giáo viên)'
                      : 'Giám khảo tự đọc toàn bộ câu hỏi bằng tiếng Anh khi sang câu mới'}
                </span>
              </label>
            )}

            <button
              type="button"
              onClick={handleStartExamSession}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-sm font-extrabold shadow-lg shadow-indigo-900/25 flex items-center justify-center gap-2 transition"
            >
              <Mic className="w-4 h-4" />
              <span>Bắt Đầu Thi Speaking Ngay</span>
            </button>
          </div>
        </main>
      )}

      {/* PHASE 2: ACTIVE INTERVIEW STAGE */}
      {!requiresRoomPassword && phase === 'ACTIVE' && currentItem && (
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Luyennoi Progress Pips */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {items.map((it, idx) => {
                const done = (recordingsByQid[it.id]?.durationSec || 0) > 0;
                const active = idx === currentIdx;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => handleGoQuestion(idx)}
                    className={`h-8 min-w-[36px] px-2.5 rounded-full text-xs font-extrabold border transition flex items-center justify-center gap-1 ${
                      active
                        ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-sm'
                        : done
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                        : 'bg-white dark:bg-[#0F172B] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>P{it.part}.{idx + 1}</span>
                    {done && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-[#475569] dark:text-slate-400">
              Câu {currentIdx + 1} / {items.length}
            </span>
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#EDFFFD] text-[#0F766E] dark:text-[#1EE1D6] text-xs font-black uppercase">
                  {currentItem.partLabel}
                </span>
                <span className="text-xs font-bold text-[#475569] dark:text-slate-400">
                  {currentItem.topic}
                </span>
              </div>

              <button
                type="button"
                onClick={() => speakPromptQuestion(currentSpokenText, currentItem.audioUrl)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  currentItem.audioUrl
                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200'
                    : isSpeakingPrompt
                    ? 'bg-[#007A7A] text-white border-[#007A7A] animate-pulse'
                    : 'bg-white dark:bg-[#23222D] border-slate-200 dark:border-slate-700 hover:border-[#007A7A] text-slate-700 dark:text-slate-200'
                }`}
              >
                <Volume2 className={`w-3.5 h-3.5 ${currentItem.audioUrl ? 'text-emerald-600 dark:text-emerald-300' : isSpeakingPrompt ? 'text-white' : 'text-[#0F766E] dark:text-[#1EE1D6]'}`} />
                <span>
                  {currentItem.audioUrl
                    ? 'Nghe Lại File Ghi Âm Ms. Như'
                    : isSpeakingPrompt
                    ? 'Đang Đọc Câu Hỏi...'
                    : 'Nghe Đọc Câu Hỏi'}
                </span>
              </button>
            </div>

            {isExamRoomMode && autoRecordCountdown !== null && !isRecording && (
              <div className="p-3.5 rounded-2xl bg-rose-600 text-white flex flex-wrap items-center justify-between gap-3 shadow-md animate-pulse">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold">
                  <Mic className="w-4 h-4 shrink-0" />
                  <span>Phòng Thi Thực Chiến: Tự động bật Micro ghi âm sau {autoRecordCountdown} giây...</span>
                </div>
                <button
                  type="button"
                  onClick={handleBeginRecording}
                  className="px-3 py-1 rounded-xl bg-white text-rose-700 text-xs font-black hover:bg-rose-50 transition"
                >
                  Nói ngay
                </button>
              </div>
            )}

            {currentItem.audioUrl && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-500/40 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    File Ghi Âm Câu Hỏi Của Giáo Viên
                    {currentItem.audioFileName ? ` (${currentItem.audioFileName})` : ''}
                  </span>
                  {promptPlayBlocked && (
                    <button
                      type="button"
                      onClick={() => speakPromptQuestion(currentItem.prompt, currentItem.audioUrl)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold animate-pulse"
                    >
                      ▶ Bấm Phát Ngay
                    </button>
                  )}
                </div>
                <audio
                  key={`${currentItem.id}-${currentItem.audioUrl}`}
                  ref={promptAudioRef}
                  controls
                  preload="auto"
                  src={currentItem.audioUrl}
                  onPlay={() => setPromptPlayBlocked(false)}
                  className="w-full h-10"
                />
              </div>
            )}

            <div className="space-y-3">
              {currentExaminerLead.leadInText && !currentItem.audioUrl && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-50/85 dark:bg-teal-950/35 border border-teal-200 dark:border-teal-700/60 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#0F766E] dark:text-teal-300 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" />
                      Lời dẫn Giám khảo
                    </span>
                    <span className="text-[11px] font-semibold text-teal-800/80 dark:text-teal-200/80">
                      Tự động đọc trước câu hỏi
                    </span>
                  </div>
                  {hideQuestionTextNow ? (
                    <p className="text-xs sm:text-sm italic text-teal-900 dark:text-teal-100">
                      🎧 Giám khảo đang dẫn vào Part {currentItem.part} và đọc câu hỏi...
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-teal-50 leading-relaxed italic">
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

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {hideQuestionTextNow
                  ? (isSpeakingPrompt
                      ? '🎧 Giám khảo đang đọc câu hỏi — Hãy tập trung lắng nghe!'
                      : autoRecordCountdown !== null
                      ? `🎙️ Chuẩn bị trả lời — Tự bật ghi âm sau ${autoRecordCountdown} giây...`
                      : '🎧 Nghe Giám khảo đọc câu hỏi và trả lời trực tiếp.')
                  : currentItem.prompt}
              </h2>

              {!hideQuestionTextNow && Array.isArray(currentItem.bullets) && currentItem.bullets.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#23222D] border border-slate-200 dark:border-slate-700 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-slate-400">
                    You should say:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base text-slate-800 dark:text-slate-100 font-medium">
                    {currentItem.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!isRealExamLocked && currentItem.hint && (
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Gợi ý ôn tập:</strong> {currentItem.hint}</span>
                </div>
              )}
            </div>

            {/* Part 2 1-Minute Preparation Note Pad */}
            {currentItem.part === 2 && !isRecording && !currentRec && (
              <div className="p-4 rounded-2xl bg-indigo-50/75 dark:bg-[#211F2D] border border-indigo-200 dark:border-[#007A7A]/35 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6] flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {prepRemainingSec > 0
                      ? `Thời gian chuẩn bị Cue Card còn lại: ${formatSecs(prepRemainingSec)}`
                      : 'Hết thời gian chuẩn bị - hãy bấm Ghi Âm bài nói Part 2'}
                  </span>
                  {prepRemainingSec > 0 && (
                    <button
                      type="button"
                      onClick={handleBeginRecording}
                      className="text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6] hover:underline"
                    >
                      Tôi đã sẵn sàng - Bắt đầu nói luôn →
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  autoComplete="off"
                  data-gramm="false"
                  data-gramm_editor="false"
                  value={part2Notes}
                  onChange={e => setPart2Notes(e.target.value)}
                  placeholder="Ghi chú nhanh dàn ý gạch đầu dòng (Bullet points) cho Cue Card Part 2 trong 1 phút chuẩn bị..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#16151C] border border-indigo-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007A7A]"
                />
              </div>
            )}

            {/* Recording Bar */}
            <div className="p-5 rounded-2xl bg-white/85 dark:bg-[#23222D] border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!isRecording ? (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleBeginRecording}
                        disabled={Boolean(currentRec && isRealExamLocked)}
                        className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition shadow-md ${
                          currentRec && isRealExamLocked
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-[#007A7A] hover:bg-[#065B5B] text-white'
                        }`}
                      >
                        {currentRec ? <RotateCcw className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        <span>
                          {currentRec
                            ? isRealExamLocked
                              ? 'Đã Ghi Âm (Thi thật 1 lượt)'
                              : 'Ghi Âm Lại Câu Này'
                            : 'Bắt Đầu Trả Lời & Ghi Âm'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCurrentRecording}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md animate-pulse transition"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Dừng Ghi Âm Câu Này</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6]" />
                  <span>
                    {isExamRoomMode || currentItem.part === 2
                      ? isRecording
                        ? `Đếm ngược ghi âm: còn ${formatSecs(remainingSpeakSec)} (đã nói ${formatSecs(recordElapsedSec)})`
                        : `Thời gian nói: ${formatSecs(maxAllowedSec)}`
                      : isRecording
                      ? `Đang ghi âm: ${formatSecs(recordElapsedSec)} (Không đếm ngược)`
                      : 'Tự do (Không đếm ngược · Được thu lại)'}
                  </span>
                </div>
              </div>

              <AudioLevelMeter level={audioLevel} active={isRecording} barCount={24} />

              {isRecording && liveTranscript && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172B] border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 italic">
                  <strong>Bản nháp nhận diện giọng nói:</strong> {liveTranscript}
                </div>
              )}

              {currentRec && !isRecording && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <FileAudio className="w-4 h-4" />
                      Đã thu âm câu này ({currentRec.durationSec} giây)
                    </span>
                    {currentRec.clientTranscript && (
                      <span className="text-xs font-medium text-[#475569] dark:text-slate-400 truncate max-w-md">
                        &quot;{currentRec.clientTranscript}&quot;
                      </span>
                    )}
                  </div>
                  <audio controls src={currentRec.objectUrl} className="w-full h-10" />
                </div>
              )}
            </div>

            {/* Bottom Prev / Next Question Nav */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => handleGoQuestion(currentIdx - 1)}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#23222D] border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Câu Trước
              </button>

              {currentIdx < items.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handleGoQuestion(currentIdx + 1)}
                  className="px-5 py-2.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                >
                  <span>Câu Tiếp Theo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Hoàn Thành &amp; AI Chấm Điểm</span>
                </button>
              )}
            </div>
          </div>
        </main>
      )}

      {/* PHASE 3: GRADING LOADING SCREEN */}
      {phase === 'GRADING' && (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
          <img
            src={BRAND_INFO.avatarUrl}
            alt={BRAND_INFO.shortName}
            className="w-28 h-28 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 bg-white shadow-lg animate-pulse"
          />
          <div className="space-y-2 max-w-md">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {gradingProgressText || 'Ms. Như đang check bài nói của bạn...'}
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-slate-400">
              Hệ thống đang lưu an toàn các file ghi âm lên máy chủ gửi tới Ms. Như duyệt và trả điểm chính thức.
            </p>
          </div>
        </main>
      )}

      {/* PHASE 4: LUYENNOI CELEBRATION MODAL */}
      {phase === 'CELEBRATION' && submittedAttempt && (
        <SpeakingResultCelebrationModal
          attempt={submittedAttempt}
          partMode={partMode}
          onViewScore={() => onViewResult?.(submittedAttempt.id)}
          onBackToHub={() => onExitSpeaking?.()}
        />
      )}

      {/* SUBMIT CONFIRM MODAL */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Xác nhận nộp bài Speaking cho Ms. Như check?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn đã ghi âm <strong>{recordedCount}/{items.length} câu hỏi</strong>. Tất cả file ghi âm sẽ được lưu vĩnh viễn trên hệ thống và AI sẽ chấm Band điểm ngay lập tức.
            </p>
            {recordedCount < items.length && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
                Còn {items.length - recordedCount} câu chưa ghi âm - AI sẽ chấm 0.0 cho các câu bỏ trống.
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#23222D] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Tiếp Tục Nói
              </button>
              <button
                type="button"
                onClick={handleFinalSubmitSpeaking}
                className="px-5 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold shadow-sm"
              >
                Nộp &amp; Chấm Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
