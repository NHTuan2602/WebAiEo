import { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Clock,
  Copy,
  Eye,
  EyeOff,
  FileAudio,
  Flame,
  Hash,
  Key,
  KeyRound,
  Loader2,
  Lock,
  Mic,
  Plus,
  RefreshCw,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Wand2,
  X
} from 'lucide-react';
import {
  PRESET_TEST_HASHTAGS,
  createDefaultSpeakingSection,
  getEffectiveTestHashtags,
  getVietnamTodayDateKey,
  normalizeSpeakingSection,
  normalizeTestHashtags
} from '../../constants/seedData';
import { generateSpeakingQuestionsWithAI } from '../../utils/geminiGrader';
import { cleanAudioMimeType } from '../../utils/speakingAiEngine';
import { pickSupportedAudioMimeType, uploadSpeakingRecording } from '../../utils/speakingApi';

export default function SpeakingBuilderPanel({
  aiApiKey,
  aiConfigured = false,
  onAddCustomHashtag,
  onApplyQuickPreset,
  onChangeSpeaking,
  onToggleHashtag,
  setApiTestState,
  setShowApiKeyModal,
  showToast,
  speakingData,
  testForm = null
}) {
  const sp = normalizeSpeakingSection(speakingData);
  const [aiTopic, setAiTopic] = useState('Sustainable Cities & Modern Education');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingKey, setUploadingKey] = useState('');
  const [recordingKey, setRecordingKey] = useState('');
  const [showRoomPass, setShowRoomPass] = useState(true);
  const [panelHashtagInput, setPanelHashtagInput] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      try {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
      } catch (_err) {}
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const patchSpeaking = (patch) => {
    onChangeSpeaking({
      ...sp,
      ...patch
    });
  };

  const patchPart = (partKey, patch) => {
    patchSpeaking({
      [partKey]: {
        ...sp[partKey],
        ...patch
      }
    });
  };

  const addQuestionToPart = (partKey) => {
    const prefix = partKey === 'part1' ? 'sp1' : 'sp3';
    const nextList = [
      ...(sp[partKey]?.questions || []),
      {
        id: `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        prompt: '',
        hint: '',
        audioUrl: '',
        audioFileName: ''
      }
    ];
    patchPart(partKey, { enabled: true, questions: nextList });
  };

  const updateQuestionInPart = (partKey, qIdx, field, val) => {
    const nextList = (sp[partKey]?.questions || []).map((q, idx) =>
      idx === qIdx ? { ...q, [field]: val } : q
    );
    patchPart(partKey, { questions: nextList });
  };

  const patchQuestionFieldsInPart = (partKey, qIdx, fields) => {
    const nextList = (sp[partKey]?.questions || []).map((q, idx) =>
      idx === qIdx ? { ...q, ...fields } : q
    );
    patchPart(partKey, { questions: nextList });
  };

  const handleUploadQuestionAudio = async (file, uploadKey, onApplyAudio) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast?.('File ghi âm quá lớn (vui lòng chọn file dưới 15MB hoặc dán Link URL).', 'error');
      return;
    }
    setUploadingKey(uploadKey);
    try {
      const audioId = `spk_prompt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const uploaded = await uploadSpeakingRecording({
        blob: file,
        audioId,
        mimeType: file.type || 'audio/mpeg',
        questionId: uploadKey
      });
      onApplyAudio({
        audioUrl: uploaded.audioUrl,
        audioFileName: file.name
      });
      showToast?.(`Đã tải lên file ghi âm "${file.name}"!`);
    } catch (_err) {
      if (file.size <= 3 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            onApplyAudio({ audioUrl: String(reader.result), audioFileName: file.name });
            showToast?.(`Đã đính kèm cục bộ file "${file.name}".`);
          }
        };
        reader.readAsDataURL(file);
      } else {
        showToast?.('Không thể tải file lên server (hãy thử file nhỏ hơn 3MB hoặc dán Link Audio URL).', 'error');
      }
    } finally {
      setUploadingKey('');
    }
  };

  const handleToggleRecordPromptAudio = async (uploadKey, onApplyAudio) => {
    if (recordingKey === uploadKey && recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      return;
    }
    if (recordingKey && recorderRef.current && recorderRef.current.state !== 'inactive') {
      showToast?.('Vui lòng dừng ghi âm câu hiện tại trước khi thu câu khác.', 'info');
      return;
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      showToast?.('Trình duyệt không hỗ trợ ghi âm Micro (cần HTTPS hoặc localhost).', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const chosenMime = pickSupportedAudioMimeType();
      let mediaRecorder;
      try {
        mediaRecorder = chosenMime ? new MediaRecorder(stream, { mimeType: chosenMime }) : new MediaRecorder(stream);
      } catch (_err) {
        mediaRecorder = new MediaRecorder(stream);
      }
      chunksRef.current = [];
      mediaRecorder.ondataavailable = ev => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        const actualMime = cleanAudioMimeType(mediaRecorder.mimeType || chosenMime || 'audio/webm');
        const blob = new Blob(chunksRef.current, { type: actualMime });
        setRecordingKey('');
        if (blob.size > 0) {
          const ext = actualMime.includes('mp4') ? 'm4a' : actualMime.includes('ogg') ? 'ogg' : 'webm';
          const fileLike = new File([blob], `gv_${uploadKey}.${ext}`, { type: actualMime });
          handleUploadQuestionAudio(fileLike, uploadKey, onApplyAudio);
        }
      };
      recorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setRecordingKey(uploadKey);
    } catch (_err) {
      showToast?.('Không truy cập được Micro để thu âm câu hỏi.', 'error');
    }
  };

  const renderAudioAttachmentBox = ({ uploadKey, audioUrl = '', audioFileName = '', onApplyAudio }) => {
    const isBusy = uploadingKey === uploadKey;
    const isRecHere = recordingKey === uploadKey;
    return (
      <div className="pt-2 mt-1 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDFFFD] hover:bg-[#EDFFFD] text-[#0F766E] dark:text-[#1EE1D6] border border-[#007A7A]/25 text-xs font-bold transition">
            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isBusy ? 'Đang tải...' : 'Nhập File Ghi Âm (.mp3/.wav/.m4a)'}</span>
            <input
              type="file"
              accept="audio/*"
              disabled={isBusy || isRecHere}
              onChange={e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) handleUploadQuestionAudio(file, uploadKey, onApplyAudio);
              }}
              className="hidden"
            />
          </label>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleToggleRecordPromptAudio(uploadKey, onApplyAudio)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
              isRecHere
                ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                : 'bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/35'
            }`}
          >
            {isRecHere ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isRecHere ? 'Dừng & Lưu Ghi Âm' : 'Thu Âm Câu Hỏi Trực Tiếp'}</span>
          </button>
          <input
            type="url"
            value={audioUrl.startsWith('data:') ? '' : audioUrl}
            onChange={e => onApplyAudio({ audioUrl: e.target.value.trim(), audioFileName: '' })}
            placeholder="Hoặc dán Link Audio URL ngoài (tùy chọn)..."
            className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
          />
          {audioUrl && (
            <button
              type="button"
              onClick={() => onApplyAudio({ audioUrl: '', audioFileName: '' })}
              className="px-2 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition"
            >
              Xóa Audio
            </button>
          )}
        </div>
        {audioUrl && (
          <div className="space-y-1.5 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/35">
            <div className="flex flex-wrap items-center gap-2.5">
              <FileAudio className="w-4 h-4 text-[#0F766E] shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[220px]">
                {audioFileName || 'File ghi âm của Giáo viên'}
              </span>
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                ✓ Học viên sẽ nghe trực tiếp file này (không qua AI đọc)
              </span>
            </div>
            <audio controls src={audioUrl} className="h-8 w-full" />
          </div>
        )}
      </div>
    );
  };

  const removeQuestionInPart = (partKey, qIdx) => {
    const nextList = (sp[partKey]?.questions || []).filter((_q, idx) => idx !== qIdx);
    patchPart(partKey, { questions: nextList });
  };

  const handleLoadDefaultTemplate = () => {
    const fresh = createDefaultSpeakingSection();
    onChangeSpeaking({
      ...fresh,
      speakingTrack: sp.speakingTrack,
      dailyDate: sp.dailyDate,
      dailyMandatory: sp.dailyMandatory,
      roomPassword: sp.roomPassword,
      isForecast: sp.isForecast,
      autoAiGrade: sp.autoAiGrade
    });
    showToast?.('Đã nạp bộ câu hỏi mẫu IELTS Speaking (Part 1, Part 2 & Part 3)!');
  };

  const hasGeminiAccess = Boolean((aiApiKey || '').trim() || aiConfigured);

  const handleAiGenerateSpeaking = async () => {
    const cleanKey = (aiApiKey || '').trim();
    if (!hasGeminiAccess) {
      showToast?.('Vui lòng cấu hình Google Gemini API Key trước để dùng AI tạo bộ câu hỏi.', 'info');
      setApiTestState?.({ testing: false, ok: null, message: '', model: '' });
      setShowApiKeyModal?.(true);
      return;
    }
    setIsGenerating(true);
    try {
      const res = await generateSpeakingQuestionsWithAI({
        apiKey: cleanKey,
        topic: aiTopic.trim() || 'Modern Technology & Daily Life'
      });
      patchSpeaking({
        part1: {
          enabled: true,
          topic: res.part1Topic,
          questions: res.part1Questions
        },
        part2: {
          enabled: true,
          title: res.part2Title,
          cueCardPrompt: res.part2CueCardPrompt,
          bullets: res.part2Bullets,
          followUpQuestion: res.part2FollowUpQuestion
        },
        part3: {
          enabled: true,
          topic: res.part3Topic,
          questions: res.part3Questions
        }
      });
      showToast?.(`AI (${res.usedModel}) đã tạo xong trọn bộ câu hỏi Speaking Part 1 · 2 · 3!`);
    } catch (err) {
      showToast?.(err?.message || 'Không thể tạo bộ câu hỏi Speaking bằng AI.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Assistant + Settings Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EDFFFD] text-[#0F766E] dark:text-[#1EE1D6] border border-[#007A7A]/25 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Thiết Kế Đề Thi IELTS Speaking (Part 1 · Cue Card Part 2 · Part 3)
              </h3>
              <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                Học viên nói qua Micro, hệ thống lưu file ghi âm vĩnh viễn và AI tự động chấm 4 tiêu chí IELTS (Fluency, Lexical, Grammar, Pronunciation).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLoadDefaultTemplate}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition shrink-0"
          >
            Nạp Bộ Câu Hỏi Mẫu
          </button>
        </div>

        {/* AI Generator Bar */}
        <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-indigo-200 dark:border-slate-700">
            <Wand2 className="w-4 h-4 text-[#0F766E] dark:text-[#1EE1D6] shrink-0" />
            <input
              type="text"
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              placeholder="Nhập chủ đề muốn tạo đề Speaking (VD: Environment, Hometown, Work & Study...)"
              className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            {!hasGeminiAccess && (
              <button
                type="button"
                onClick={() => {
                  setApiTestState?.({ testing: false, ok: null, message: '', model: '' });
                  setShowApiKeyModal?.(true);
                }}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" /> Gemini Key
              </button>
            )}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleAiGenerateSpeaking}
              className="px-4 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] disabled:opacity-60 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition whitespace-nowrap"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              <span>{isGenerating ? 'Đang tạo câu hỏi...' : 'AI Tạo Đề Speaking P1·2·3'}</span>
            </button>
          </div>
        </div>

        {/* Timers & Options */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold uppercase text-[#475569] dark:text-slate-400 flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" /> Part 1 Nói (giây)
            </label>
            <input
              type="number"
              min={15}
              max={180}
              value={sp.part1SpeakSec}
              onChange={e => patchSpeaking({ part1SpeakSec: Math.max(15, Number(e.target.value) || 45) })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white"
            />
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold uppercase text-[#475569] dark:text-slate-400 flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" /> Part 2 Chuẩn bị (giây)
            </label>
            <input
              type="number"
              min={10}
              max={180}
              value={sp.part2PrepSec}
              onChange={e => patchSpeaking({ part2PrepSec: Math.max(10, Number(e.target.value) || 60) })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white"
            />
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold uppercase text-[#475569] dark:text-slate-400 flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" /> Part 2 Nói (giây)
            </label>
            <input
              type="number"
              min={30}
              max={300}
              value={sp.part2SpeakSec}
              onChange={e => patchSpeaking({ part2SpeakSec: Math.max(30, Number(e.target.value) || 120) })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white"
            />
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold uppercase text-[#475569] dark:text-slate-400 flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3" /> Part 3 Nói (giây)
            </label>
            <input
              type="number"
              min={15}
              max={180}
              value={sp.part3SpeakSec}
              onChange={e => patchSpeaking({ part3SpeakSec: Math.max(15, Number(e.target.value) || 60) })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white"
            />
          </div>
          <label className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 cursor-pointer">
            <div>
              <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-100">Gắn nhãn Đề Forecast</span>
              <span className="block text-xs text-[#475569] dark:text-slate-400">Hiển thị thêm trong nhóm Đề Dự Đoán Forecast</span>
            </div>
            <input
              type="checkbox"
              checked={sp.isForecast}
              onChange={e => patchSpeaking({ isForecast: e.target.checked })}
              className="w-4 h-4 accent-[#007A7A]"
            />
          </label>
        </div>

        {/* Tùy chọn phát File Ghi Âm Giáo Viên & Tắt AI đọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="p-3 rounded-xl bg-emerald-50/75 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-500/35 flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={sp.disableAiTts}
              onChange={e => patchSpeaking({ disableAiTts: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-emerald-600"
            />
            <span className="text-xs text-slate-700 dark:text-slate-200 leading-snug">
              <strong>Tắt hẳn giọng AI đọc câu hỏi</strong>
              <span className="block text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                Câu có file ghi âm của Giáo viên luôn tự động phát giọng thật (không qua AI đọc). Bật mục này nếu muốn tắt AI đọc trên mọi câu.
              </span>
            </span>
          </label>
          <label className="p-3 rounded-xl bg-sky-50/75 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-500/35 flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={sp.hidePromptTextWhenAudio}
              onChange={e => patchSpeaking({ hidePromptTextWhenAudio: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-sky-600"
            />
            <span className="text-xs text-slate-700 dark:text-slate-200 leading-snug">
              <strong>Chỉ nghe file ghi âm &amp; trả lời (Ẩn chữ câu hỏi)</strong>
              <span className="block text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                Khi câu hỏi đã có file ghi âm của Giáo viên, học viên chỉ nghe Audio rồi nói trả lời giống thi thật.
              </span>
            </span>
          </label>
        </div>

        {/* Phân chia Chuyên Mục Speaking: Đề Thi Thật (Có Pass) vs Luyện Daily vs Kho Chung + Hashtag Học Sinh */}
        <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Chế Độ Đề Thi Speaking AI &amp; Mật Khẩu Phòng Thi Thật + Hashtag Học Sinh
            </h4>
            <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
              Chọn <strong>🏛️ Đề Thi Thật · Phòng Thi Thực Chiến</strong> để tạo mật khẩu &amp; gắn <b>#ThiThật #CóPass</b>, chọn <strong>1. Luyện Daily</strong> (bắt buộc mỗi ngày), hoặc <strong>Kho Speaking Chung / Forecast</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: 'exam_room',
                title: '🏛️ Đề Thi Thật · Phòng Thi Thực Chiến',
                desc: 'Tạo mật khẩu gửi lớp · Gắn #ThiThật #CóPass · 1 lượt thi',
                icon: Lock,
                activeCls: 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
              },
              {
                id: 'daily',
                title: '🔥 1. Luyện Speaking Daily',
                desc: 'Quăng đề mỗi ngày · Gắn #SpeakingDaily · Báo ai chưa làm',
                icon: Flame,
                activeCls: 'border-orange-500 bg-orange-600 text-white shadow-sm'
              },
              {
                id: 'general',
                title: '🌐 Kho Speaking Chung / Forecast',
                desc: 'Luyện tự do không cần mật khẩu · Gắn #LuyệnTậpTựDo',
                icon: Mic,
                activeCls: 'border-[#007A7A] bg-[#007A7A] text-white shadow-sm'
              }
            ].map(opt => {
              const IconC = opt.icon;
              const active = sp.speakingTrack === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (opt.id === 'exam_room' && onApplyQuickPreset) {
                      onApplyQuickPreset('real_exam');
                      return;
                    }
                    if (opt.id === 'daily' && onApplyQuickPreset) {
                      onApplyQuickPreset('speaking_daily');
                      return;
                    }
                    if (opt.id === 'general' && onApplyQuickPreset) {
                      onApplyQuickPreset('free_practice');
                      return;
                    }
                    const autoPass = sp.roomPassword?.trim() || `SPK${Math.floor(1000 + Math.random() * 9000)}`;
                    patchSpeaking({
                      speakingTrack: opt.id,
                      ...(opt.id === 'daily' && !sp.dailyDate ? { dailyDate: getVietnamTodayDateKey(), dailyMandatory: true, roomPassword: '', hasRoomPassword: false } : {}),
                      ...(opt.id === 'exam_room' ? { roomPassword: autoPass, hasRoomPassword: true } : {}),
                      ...(opt.id === 'general' ? { roomPassword: '', hasRoomPassword: false } : {})
                    });
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                    active
                      ? opt.activeCls
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                  }`}
                >
                  <IconC className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold leading-snug">{opt.title}</p>
                    <p className={`text-xs mt-0.5 leading-snug ${active ? 'opacity-90' : 'text-[#475569] dark:text-slate-400'}`}>
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {sp.speakingTrack === 'daily' && (
            <div className="p-3.5 rounded-xl bg-orange-50/90 dark:bg-orange-950/25 border border-orange-200 dark:border-orange-500/35 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-bold text-orange-900 dark:text-orange-200 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Ngày giao bài Daily
                </label>
                <input
                  type="date"
                  value={sp.dailyDate || getVietnamTodayDateKey()}
                  onChange={e => patchSpeaking({ dailyDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-orange-200/80 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={sp.dailyMandatory}
                  onChange={e => patchSpeaking({ dailyMandatory: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-orange-600"
                />
                <span className="text-xs text-slate-700 dark:text-slate-200 leading-snug">
                  <strong>Bắt buộc hoàn thành mỗi ngày</strong> - Tự động báo danh sách học viên chưa làm &amp; nhắc trên màn hình học viên.
                </span>
              </label>
            </div>
          )}

          {sp.speakingTrack === 'exam_room' && (
            <div className="p-3.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/35 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Mật Khẩu Phòng Thi Thực Chiến Speaking (Gửi Cho Học Sinh Trước Khi Thi)
                </label>
                {Boolean(sp.roomPassword || sp.hasRoomPassword) && (
                  <button
                    type="button"
                    onClick={() => patchSpeaking({ roomPassword: '', hasRoomPassword: false })}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 underline"
                  >
                    Bỏ mật khẩu
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type={showRoomPass ? 'text' : 'password'}
                  value={sp.roomPassword}
                  onChange={e => patchSpeaking({ roomPassword: e.target.value, hasRoomPassword: Boolean(e.target.value.trim()) })}
                  placeholder="VD: SPK2026 hoặc IELTSTEAM80"
                  className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 text-xs font-mono font-extrabold tracking-wider text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowRoomPass(v => !v)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                  title={showRoomPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showRoomPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextPass = `SPK${Math.floor(1000 + Math.random() * 9000)}`;
                    patchSpeaking({ roomPassword: nextPass, hasRoomPassword: true });
                    showToast?.(`Đã tạo mật khẩu phòng thi Speaking mới: ${nextPass}`);
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tạo Pass Mới
                </button>
                {Boolean(sp.roomPassword) && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(sp.roomPassword);
                      showToast?.(`Đã sao chép mật khẩu phòng thi Speaking: ${sp.roomPassword}`);
                    }}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-50 transition"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Pass
                  </button>
                )}
              </div>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80">
                Đề thi này sẽ hiển thị nổi bật với hashtag <b>#ThiThật #CóPass</b> ở trang Học sinh để không nhầm với bài luyện tập tự do.
              </p>
            </div>
          )}

          {/* Hashtag Selector Strip inside Speaking Builder Panel */}
          {(() => {
            const effectiveTags = getEffectiveTestHashtags(testForm || { testMode: 'single_skill', focusSkill: 'speaking', speaking: sp });
            const rawTagsList = normalizeTestHashtags(testForm?.hashtags || sp.hashtags || []);
            const handlePanelToggleTag = (tag) => {
              if (onToggleHashtag) {
                onToggleHashtag(tag);
                return;
              }
              const exists = rawTagsList.some(t => t.toLowerCase() === tag.toLowerCase());
              const next = exists ? rawTagsList.filter(t => t.toLowerCase() !== tag.toLowerCase()) : normalizeTestHashtags([...rawTagsList, tag]);
              patchSpeaking({ hashtags: next });
            };
            const handlePanelAddCustom = () => {
              if (!panelHashtagInput.trim()) return;
              if (onAddCustomHashtag) {
                onAddCustomHashtag(panelHashtagInput);
              } else {
                const next = normalizeTestHashtags([...rawTagsList, panelHashtagInput]);
                patchSpeaking({ hashtags: next });
              }
              setPanelHashtagInput('');
            };

            return (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6]" />
                    Hashtag Hiển Thị Bên Học Sinh (Phân biệt rõ Thi Thật vs Luyện Tập):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {effectiveTags.map(item => (
                      <span
                        key={item.tag}
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          item.kind === 'real_exam'
                            ? 'bg-[#991B1B] text-white border-[#EF4444]'
                            : item.kind === 'password'
                            ? 'bg-indigo-700 text-white border-indigo-500'
                            : item.kind === 'daily'
                            ? 'bg-[#C2410C] text-white border-orange-500'
                            : item.kind === 'forecast'
                            ? 'bg-[#FEF3C7] text-[#92400E] border-amber-300 dark:bg-amber-500/20 dark:text-amber-300'
                            : item.kind === 'practice'
                            ? 'bg-[#EDFFFD] text-[#0F766E] border-[#B5F5F1] dark:bg-teal-500/20 dark:text-[#1EE1D6]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <span>{item.tag}</span>
                        {rawTagsList.some(t => t.toLowerCase() === item.tag.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => handlePanelToggleTag(item.tag)}
                            title={`Gỡ ${item.tag}`}
                            className="hover:opacity-75"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {PRESET_TEST_HASHTAGS.map(preset => {
                    const isSelected = effectiveTags.some(t => t.tag.toLowerCase() === preset.tag.toLowerCase());
                    return (
                      <button
                        key={preset.tag}
                        type="button"
                        onClick={() => handlePanelToggleTag(preset.tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                          isSelected
                            ? 'bg-[#007A7A] text-white border-[#007A7A]'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                        }`}
                      >
                        {isSelected ? `✓ ${preset.tag}` : `+ ${preset.tag}`}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={panelHashtagInput}
                    onChange={e => setPanelHashtagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePanelAddCustom();
                      }
                    }}
                    placeholder="Thêm #hashtag riêng (VD: #LớpTối246, #ThiThửQuý4)..."
                    className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handlePanelAddCustom}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
                  >
                    + Thêm #Hashtag
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* PART 1 EDITOR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={sp.part1.enabled}
              onChange={e => patchPart('part1', { enabled: e.target.checked })}
              className="w-4 h-4 accent-[#007A7A]"
            />
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              Part 1: Introduction &amp; Interview ({sp.part1.questions.length} câu)
            </span>
          </label>
          <button
            type="button"
            onClick={() => addQuestionToPart('part1')}
            className="px-3 py-1.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Câu Part 1
          </button>
        </div>

        {sp.part1.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Chủ đề Part 1</label>
              <input
                type="text"
                value={sp.part1.topic}
                onChange={e => patchPart('part1', { topic: e.target.value })}
                placeholder="VD: Hometown & Daily Routine"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            {sp.part1.questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#0F766E] dark:text-[#1EE1D6]">
                    Part 1 - Câu {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeQuestionInPart('part1', idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={q.prompt}
                  onChange={e => updateQuestionInPart('part1', idx, 'prompt', e.target.value)}
                  placeholder="Nhập câu hỏi tiếng Anh (hoặc để trống nếu học viên chỉ nghe file ghi âm)..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={q.hint || ''}
                  onChange={e => updateQuestionInPart('part1', idx, 'hint', e.target.value)}
                  placeholder="Gợi ý ý tưởng / từ vựng (tùy chọn)..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                />
                {renderAudioAttachmentBox({
                  uploadKey: `part1-${q.id || idx}`,
                  audioUrl: q.audioUrl || '',
                  audioFileName: q.audioFileName || '',
                  onApplyAudio: fields => patchQuestionFieldsInPart('part1', idx, fields)
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PART 2 CUE CARD EDITOR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={sp.part2.enabled}
            onChange={e => patchPart('part2', { enabled: e.target.checked })}
            className="w-4 h-4 accent-[#007A7A]"
          />
          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
            Part 2: Cue Card (Chuẩn bị 1 phút &amp; Nói 2 phút)
          </span>
        </label>

        {sp.part2.enabled && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tiêu đề Cue Card</label>
                <input
                  type="text"
                  value={sp.part2.title}
                  onChange={e => patchPart('part2', { title: e.target.value })}
                  placeholder="VD: Describe a memorable journey..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Câu hỏi phụ gợi ý (Follow-up)</label>
                <input
                  type="text"
                  value={sp.part2.followUpQuestion || ''}
                  onChange={e => patchPart('part2', { followUpQuestion: e.target.value })}
                  placeholder="VD: Do you plan to visit again?"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Đề bài Cue Card</label>
              <textarea
                rows={2}
                value={sp.part2.cueCardPrompt}
                onChange={e => patchPart('part2', { cueCardPrompt: e.target.value })}
                placeholder="Describe a person / place / event..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Các ý gợi ý (&quot;You should say:&quot;)</label>
                <button
                  type="button"
                  onClick={() => patchPart('part2', { bullets: [...(sp.part2.bullets || []), ''] })}
                  className="text-xs font-bold text-[#0F766E] dark:text-[#1EE1D6] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm ý
                </button>
              </div>
              {(sp.part2.bullets || []).map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bullet}
                    onChange={e => {
                      const next = (sp.part2.bullets || []).map((item, i) => (i === bIdx ? e.target.value : item));
                      patchPart('part2', { bullets: next });
                    }}
                    placeholder={`Ý gợi ý ${bIdx + 1}...`}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => patchPart('part2', { bullets: (sp.part2.bullets || []).filter((_x, i) => i !== bIdx) })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {renderAudioAttachmentBox({
              uploadKey: 'part2-cuecard',
              audioUrl: sp.part2.audioUrl || '',
              audioFileName: sp.part2.audioFileName || '',
              onApplyAudio: fields => patchPart('part2', fields)
            })}
          </div>
        )}
      </div>

      {/* PART 3 EDITOR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={sp.part3.enabled}
              onChange={e => patchPart('part3', { enabled: e.target.checked })}
              className="w-4 h-4 accent-[#007A7A]"
            />
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              Part 3: Two-Way Discussion ({sp.part3.questions.length} câu)
            </span>
          </label>
          <button
            type="button"
            onClick={() => addQuestionToPart('part3')}
            className="px-3 py-1.5 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-bold flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Câu Part 3
          </button>
        </div>

        {sp.part3.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Chủ đề Part 3</label>
              <input
                type="text"
                value={sp.part3.topic}
                onChange={e => patchPart('part3', { topic: e.target.value })}
                placeholder="VD: Modern Travel & Cultural Exchange"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            {sp.part3.questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    Part 3 - Câu {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeQuestionInPart('part3', idx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={q.prompt}
                  onChange={e => updateQuestionInPart('part3', idx, 'prompt', e.target.value)}
                  placeholder="Nhập câu hỏi thảo luận Part 3 (hoặc để trống nếu chỉ dùng file ghi âm)..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={q.hint || ''}
                  onChange={e => updateQuestionInPart('part3', idx, 'hint', e.target.value)}
                  placeholder="Gợi ý hướng phân tích / từ vựng (tùy chọn)..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                />
                {renderAudioAttachmentBox({
                  uploadKey: `part3-${q.id || idx}`,
                  audioUrl: q.audioUrl || '',
                  audioFileName: q.audioFileName || '',
                  onApplyAudio: fields => patchQuestionFieldsInPart('part3', idx, fields)
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
