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
import { getSpeakingQuestionItems, normalizeExamConfig } from '../constants/seedData';
import { createUniqueAttemptId } from '../utils/examHelpers';
import { cleanAudioMimeType, roundSpeakingBand } from '../utils/speakingAiEngine';
import { pickSupportedAudioMimeType, requestAiSpeakingGrading, uploadSpeakingRecording } from '../utils/speakingApi';
import AudioLevelMeter from '../components/speaking/AudioLevelMeter';
import SpeakingResultCelebrationModal from '../components/speaking/SpeakingResultCelebrationModal';

function formatSecs(totalSec) {
  const s = Math.max(0, Math.floor(totalSec || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export default function SpeakingExamRoom({
  aiApiKey = '',
  currentUser,
  dispatchSyncAction,
  onAttemptCreated,
  onExitSpeaking,
  onViewResult,
  partMode = 'full',
  selectedTestId,
  showToast,
  tests = []
}) {
  const activeTest = tests.find(t => t.id === selectedTestId);
  const cfg = normalizeExamConfig(activeTest);
  const isTeacher = currentUser?.role === 'teacher';
  const isRealExamLocked = cfg.maxAttempts > 0 && !isTeacher;

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
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Grading + Celebration state
  const [gradingProgressText, setGradingProgressText] = useState('');
  const [submittedAttempt, setSubmittedAttempt] = useState(null);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordStartedAtRef = useRef(0);
  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const meterRafRef = useRef(null);
  const recordTimerRef = useRef(null);
  const prepTimerRef = useRef(null);
  const createdUrlsRef = useRef([]);
  const submitLockRef = useRef(false);

  const stopMeterLoop = () => {
    if (meterRafRef.current) {
      cancelAnimationFrame(meterRafRef.current);
      meterRafRef.current = null;
    }
    setAudioLevel(0);
  };

  const cleanupMediaResources = () => {
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

  // Tick down Part 2 preparation timer cleanly without synchronous setState in effect
  useEffect(() => {
    if (phase !== 'ACTIVE' || prepRemainingSec <= 0) return;
    const t = setInterval(() => {
      setPrepRemainingSec(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, prepRemainingSec]);

  const speakPromptQuestion = (text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-GB';
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    } catch (_err) {}
  };

  // Auto-read Examiner prompt when advancing to a question in ACTIVE phase
  useEffect(() => {
    if (phase === 'ACTIVE' && autoSpeakPrompt && currentPromptText) {
      speakPromptQuestion(currentPromptText);
    }
  }, [phase, currentIdx, autoSpeakPrompt, currentPromptText]);

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

  const handleStartExamSession = async () => {
    const stream = await ensureMicPermission();
    if (!stream) return;
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
    if (prepRemainingSec > 0) {
      setPrepRemainingSec(0);
      if (prepTimerRef.current) {
        clearInterval(prepTimerRef.current);
        prepTimerRef.current = null;
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

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
    const maxSec = currentItem.speakSec || 45;
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
    };

    recorderRef.current = mediaRecorder;
    mediaRecorder.start(250);

    recordTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordStartedAtRef.current) / 1000);
      setRecordElapsedSec(elapsed);
      if (elapsed >= maxSec) {
        stopCurrentRecording();
        showToast?.(`Đã hết thời gian câu ${currentIdx + 1} (${maxSec}s) — tự động lưu ghi âm!`, 'info');
      }
    }, 250);
  };

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
              username: currentUser?.username || '',
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

      setGradingProgressText('Uốn lưỡi bảy lần trước khi nghe lại bài nói & AI đang chấm 4 tiêu chí IELTS Speaking...');
      const evaluation = await requestAiSpeakingGrading({
        testTitle: activeTest?.title || 'IELTS Speaking Test',
        partMode,
        recordings: savedRecordings,
        clientApiKey: aiApiKey
      });

      const spBand = roundSpeakingBand(evaluation?.overallBand ?? 0);
      const criteria = evaluation?.criteria || { fc: spBand, lr: spBand, gra: spBand, pr: spBand };
      const evalByQid = new Map((evaluation?.questionEvaluations || []).map(ev => [String(ev.questionId), ev]));

      const enrichedRecordings = savedRecordings.map(r => {
        const ev = evalByQid.get(String(r.questionId));
        return {
          ...r,
          transcript: ev?.transcript || r.clientTranscript || '',
          band: ev?.band ?? 0,
          feedback: ev?.feedback || '',
          grammarVocabularyFixes: ev?.grammarVocabularyFixes || [],
          upgradedSample: ev?.upgradedSample || ''
        };
      });

      const newAttempt = {
        id: attemptId,
        testId: activeTest.id,
        testTitle: activeTest.title,
        testMode: 'single_skill',
        focusSkill: 'speaking',
        speakingPartMode: partMode,
        studentId: currentUser?.username || 'std_guest',
        studentName: currentUser?.name || 'Học viên',
        submittedAt: new Date().toLocaleString('vi-VN'),
        answers: {
          part2Notes,
          speakingRecordingsCount: enrichedRecordings.filter(r => r.durationSec > 0).length
        },
        speakingRecordings: enrichedRecordings,
        speakingAiDetails: {
          criteria,
          strengths: evaluation?.strengths || [],
          improvements: evaluation?.improvements || [],
          _usedModel: evaluation?._usedModel || 'speaking-ai',
          _gradedMode: evaluation?._gradedMode || 'fallback',
          _fallbackReason: evaluation?._fallbackReason || ''
        },
        antiCheatLogs: [],
        tabSwitchCount: 0,
        teacherGraded: true,
        aiGraded: true,
        ...(evaluation?.aiGradingTicket ? { aiGradingTicket: evaluation.aiGradingTicket } : {}),
        scores: {
          listening: { raw: 0, total: 0, band: null },
          reading: { raw: 0, total: 0, band: null },
          writing: { task1Band: null, task2Band: null, overallBand: null },
          speaking: { band: spBand, criteria }
        },
        overallBand: spBand,
        teacherFeedback: evaluation?.overallFeedback || ''
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
      <div className="min-h-screen bg-[#FDECF2] dark:bg-[#141318] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#FFF5F8] dark:bg-[#191820] border border-pink-200 dark:border-[#2C2A35] rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <img
            src={BRAND_INFO.avatarUrl}
            alt={BRAND_INFO.shortName}
            className="w-16 h-16 mx-auto rounded-full object-cover border-2 border-pink-200 dark:border-[#34323F] bg-white shadow-sm"
          />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Đề Speaking không có câu hỏi khả dụng
          </h2>
          <button
            type="button"
            onClick={() => onExitSpeaking?.()}
            className="w-full py-2.5 px-4 rounded-xl bg-[#570DF8] hover:bg-[#490AD2] text-white text-xs font-extrabold"
          >
            Quay Về Luyện Speaking
          </button>
        </div>
      </div>
    );
  }

  const recordedCount = items.filter(it => (recordingsByQid[it.id]?.durationSec || 0) > 0).length;
  const currentRec = currentItem ? recordingsByQid[currentItem.id] : null;
  const maxAllowedSec = currentItem?.speakSec || 45;
  const remainingSpeakSec = Math.max(0, maxAllowedSec - recordElapsedSec);

  return (
    <div className="min-h-screen bg-[#FDECF2] dark:bg-[#141318] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Room Header */}
      <header className="bg-[#FDF2F6] dark:bg-[#191820] border-b border-pink-200 dark:border-[#2C2A35] px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={BRAND_INFO.avatarUrl}
            alt={BRAND_INFO.shortName}
            className={`w-9 h-9 rounded-full object-cover bg-white shrink-0 border-2 transition ${
              isRecording
                ? 'border-rose-500 ring-2 ring-rose-400/40 animate-pulse'
                : 'border-pink-200 dark:border-[#34323F]'
            }`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#570DF8] text-white shrink-0">
                {partMode === 'full' ? 'FULL TEST' : partMode.toUpperCase()}
              </span>
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {activeTest.title}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#23222D] border border-pink-200 dark:border-[#34323F] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Thoát
            </button>
          ) : (
            <span className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Thi Thật
            </span>
          )}
        </div>
      </header>

      {/* PHASE 1: MIC CHECK */}
      {phase === 'MIC_CHECK' && (
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-lg w-full bg-[#FFF5F8] dark:bg-[#191820] border border-pink-200 dark:border-[#2C2A35] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center">
            <img
              src={BRAND_INFO.avatarUrl}
              alt={BRAND_INFO.shortName}
              className="w-20 h-20 mx-auto rounded-full object-cover border-2 border-pink-200 dark:border-[#34323F] bg-white shadow-md"
            />
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#570DF8] dark:text-[#A78BFA]">
                Chuẩn bị phòng thi Speaking AI
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Kiểm Tra Micro Trước Khi Nói
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Gồm <strong>{items.length} câu hỏi</strong> ({partMode === 'full' ? 'Part 1 + Part 2 Cue Card + Part 3' : `Thi tập trung ${partMode.toUpperCase()}`}). Hệ thống sẽ lưu file ghi âm và chấm điểm tự động ngay sau khi hoàn thành.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#23222D] border border-pink-200/80 dark:border-[#34323F] space-y-3">
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

            <label className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSpeakPrompt}
                onChange={e => setAutoSpeakPrompt(e.target.checked)}
                className="w-4 h-4 accent-[#570DF8]"
              />
              <span>Giám khảo AI tự đọc câu hỏi bằng tiếng Anh khi sang câu mới</span>
            </label>

            <button
              type="button"
              onClick={handleStartExamSession}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#570DF8] hover:bg-[#490AD2] text-white text-sm font-extrabold shadow-lg shadow-indigo-900/25 flex items-center justify-center gap-2 transition"
            >
              <Mic className="w-4 h-4" />
              <span>Bắt Đầu Thi Speaking Ngay</span>
            </button>
          </div>
        </main>
      )}

      {/* PHASE 2: ACTIVE INTERVIEW STAGE */}
      {phase === 'ACTIVE' && currentItem && (
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
                        ? 'bg-[#570DF8] text-white border-[#570DF8] shadow-sm'
                        : done
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                        : 'bg-[#FFF5F8] dark:bg-[#191820] text-slate-600 dark:text-slate-300 border-pink-200 dark:border-[#34323F]'
                    }`}
                  >
                    <span>P{it.part}.{idx + 1}</span>
                    {done && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Câu {currentIdx + 1} / {items.length}
            </span>
          </div>

          {/* Question Card */}
          <div className="bg-[#FFF5F8] dark:bg-[#191820] border border-pink-200 dark:border-[#2C2A35] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#570DF8]/15 text-[#570DF8] dark:text-[#C4B5FD] text-xs font-black uppercase">
                  {currentItem.partLabel}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {currentItem.topic}
                </span>
              </div>

              <button
                type="button"
                onClick={() => speakPromptQuestion(currentItem.prompt)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#23222D] border border-pink-200 dark:border-[#34323F] hover:border-[#570DF8] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#570DF8] dark:text-[#A78BFA]" /> Nghe Giám Khảo Đọc
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {currentItem.prompt}
              </h2>

              {Array.isArray(currentItem.bullets) && currentItem.bullets.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#23222D] border border-pink-200/80 dark:border-[#34323F] space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
              <div className="p-4 rounded-2xl bg-indigo-50/75 dark:bg-[#211F2D] border border-indigo-200 dark:border-[#570DF8]/35 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#570DF8] dark:text-[#C4B5FD] flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {prepRemainingSec > 0
                      ? `Thời gian chuẩn bị Cue Card còn lại: ${formatSecs(prepRemainingSec)}`
                      : 'Hết thời gian chuẩn bị — hãy bấm Ghi Âm bài nói Part 2'}
                  </span>
                  {prepRemainingSec > 0 && (
                    <button
                      type="button"
                      onClick={handleBeginRecording}
                      className="text-xs font-extrabold text-[#570DF8] dark:text-[#A78BFA] hover:underline"
                    >
                      Tôi đã sẵn sàng — Bắt đầu nói luôn →
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={part2Notes}
                  onChange={e => setPart2Notes(e.target.value)}
                  placeholder="Ghi chú nhanh dàn ý gạch đầu dòng (Bullet points) cho Cue Card Part 2 trong 1 phút chuẩn bị..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#16151C] border border-indigo-200 dark:border-[#34323F] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#570DF8]"
                />
              </div>
            )}

            {/* Recording Bar */}
            <div className="p-5 rounded-2xl bg-white/85 dark:bg-[#23222D] border border-pink-200/80 dark:border-[#34323F] space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleBeginRecording}
                      disabled={Boolean(currentRec && isRealExamLocked)}
                      className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition shadow-md ${
                        currentRec && isRealExamLocked
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-[#570DF8] hover:bg-[#490AD2] text-white'
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
                  <Clock className="w-4 h-4 text-[#570DF8] dark:text-[#A78BFA]" />
                  <span>
                    {isRecording
                      ? `Đang nói: ${formatSecs(recordElapsedSec)} (còn ${formatSecs(remainingSpeakSec)})`
                      : `Giới hạn câu: ${formatSecs(maxAllowedSec)}`}
                  </span>
                </div>
              </div>

              <AudioLevelMeter level={audioLevel} active={isRecording} barCount={24} />

              {isRecording && liveTranscript && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#191820] border border-slate-200 dark:border-[#34323F] text-xs text-slate-600 dark:text-slate-300 italic">
                  <strong>Bản nháp nhận diện giọng nói:</strong> {liveTranscript}
                </div>
              )}

              {currentRec && !isRecording && (
                <div className="pt-2 border-t border-pink-200/70 dark:border-[#34323F] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <FileAudio className="w-4 h-4" />
                      Đã thu âm câu này ({currentRec.durationSec} giây)
                    </span>
                    {currentRec.clientTranscript && (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-md">
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
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#23222D] border border-pink-200 dark:border-[#34323F] disabled:opacity-40 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Câu Trước
              </button>

              {currentIdx < items.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handleGoQuestion(currentIdx + 1)}
                  className="px-5 py-2.5 rounded-xl bg-[#570DF8] hover:bg-[#490AD2] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
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
            className="w-28 h-28 rounded-full object-cover border-2 border-pink-200 dark:border-[#34323F] bg-white shadow-lg animate-bounce"
          />
          <div className="space-y-2 max-w-md">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {gradingProgressText || 'Uốn lưỡi bảy lần trước khi chấm bài...'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Hệ thống đang lưu an toàn các file ghi âm lên máy chủ và AI Examiner đang chấm Band điểm 4 tiêu chí IELTS Speaking (FC, LR, GRA, PR).
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
          <div className="max-w-md w-full bg-[#FFF5F8] dark:bg-[#191820] border border-pink-200 dark:border-[#2C2A35] rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Xác nhận nộp bài Speaking cho AI chấm?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn đã ghi âm <strong>{recordedCount}/{items.length} câu hỏi</strong>. Tất cả file ghi âm sẽ được lưu vĩnh viễn trên hệ thống và AI sẽ chấm Band điểm ngay lập tức.
            </p>
            {recordedCount < items.length && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
                Còn {items.length - recordedCount} câu chưa ghi âm — AI sẽ chấm 0.0 cho các câu bỏ trống.
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#23222D] border border-pink-200 dark:border-[#34323F] text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Tiếp Tục Nói
              </button>
              <button
                type="button"
                onClick={handleFinalSubmitSpeaking}
                className="px-5 py-2 rounded-xl bg-[#570DF8] hover:bg-[#490AD2] text-white text-xs font-extrabold shadow-sm"
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
