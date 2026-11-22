import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Copy,
  EyeOff,
  FileText,
  Globe,
  Hash,
  Headphones,
  HelpCircle,
  Image,
  KeyRound,
  Layers,
  Lock,
  Mic,
  PenTool,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
  Users,
  X
} from 'lucide-react';
import { formatVndCurrency } from '../constants/profileCustomization';
import {
  DAILY_LISTENING_SUBCATEGORIES,
  DAILY_READING_SUBCATEGORIES,
  DAILY_WRITING_T1_SUBCATEGORIES,
  DAILY_WRITING_T2_SUBCATEGORIES,
  DAILY_WRITING_T2_TOPICS,
  DAILY_WRITING_T2_QUESTION_TYPES,
  PRESET_TEST_HASHTAGS,
  formatViDateTime,
  getEffectiveTestHashtags,
  getListeningTracks,
  getReadingPassages,
  getSpeakingQuestionItems,
  getVietnamTodayDateKey,
  normalizeExamConfig,
  normalizeSingleHashtag,
  normalizeSpeakingSection,
  normalizeTestHashtags,
  parseScheduleTimestamp,
  toDatetimeLocalInputValue
} from '../constants/seedData';
import { applyAnswerKeyTextToQuestions, syncClozeBlanksWithQuestions } from '../utils/clozeHelpers';
import { clearBuilderDraft } from '../utils/sessionPersistence';
import BuilderGuideBanner, { BuilderGuideModal } from '../components/teacher/BuilderGuideAssistant';
import SkillQuestionWorkspace from '../components/teacher/SkillQuestionWorkspace';
import SpeakingBuilderPanel from '../components/teacher/SpeakingBuilderPanel';
import QuickPassageSplitModal from '../components/teacher/QuickPassageSplitModal';

export default function ExamBuilder({
  addQuestionToSkill,
  aiApiKey,
  aiConfigured = false,
  builderListeningIdx,
  builderReadingIdx,
  builderTab,
  classesDb = {},
  currentUser,
  defaultExamPriceVnd = 20000,
  editingTest,
  handleAudioFileUpload,
  handleListeningImageUpload,
  handleReadingImageUpload,
  handleSaveTestBuilder,
  handleWritingTask1ImageUpload,
  removeQuestionFromSkill,
  setApiTestState,
  setBuilderListeningIdx,
  setBuilderReadingIdx,
  setBuilderTab,
  setEditingTest,
  setShowApiKeyModal,
  setTestForm,
  setView,
  setZoomedReadingImg,
  showToast,
  testForm,
  updateListeningTrackField,
  updateOptionInSkill,
  updateQuestionInSkill,
  updateReadingPassageField
}) {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showAdvancedListeningExtras, setShowAdvancedListeningExtras] = useState(false);
  const [showAdvancedReadingImg, setShowAdvancedReadingImg] = useState(false);
  const [filterListeningByTrack, setFilterListeningByTrack] = useState(true);
  const [filterReadingByPassage, setFilterReadingByPassage] = useState(false);
  const [questionTabBySkill, setQuestionTabBySkill] = useState({ listening: 'all', reading: 'all' });
  const [sourceFilterBySkill, setSourceFilterBySkill] = useState({ listening: 'all', reading: 'all' });
  const [customHashtagInput, setCustomHashtagInput] = useState('');
  const [showPassageSplitModal, setShowPassageSplitModal] = useState(false);

  const handleApplyPassageSplit = ({ p1End = 14, p2End = 27 } = {}) => {
    const p1E = Math.max(1, Number(p1End) || 14);
    const p2E = Math.max(p1E + 1, Number(p2End) || 27);

    setTestForm(prev => {
      const currentPassages = getReadingPassages(prev.reading);
      const nextPassages = [...currentPassages];
      const defaultTitles = [
        'Bài 1: Reading Passage 1',
        'Bài 2: Reading Passage 2',
        'Bài 3: Reading Passage 3'
      ];
      while (nextPassages.length < 3) {
        const nextNum = nextPassages.length + 1;
        nextPassages.push({
          id: `passage-${Date.now()}-${nextNum}`,
          title: defaultTitles[nextNum - 1] || `Bài ${nextNum}: Reading Passage ${nextNum}`,
          imageUrl: '',
          imageFileName: '',
          passageText: '',
          clozeText: ''
        });
      }

      const currentQuestions = Array.isArray(prev.reading?.questions) ? prev.reading.questions : [];
      const updatedQuestions = currentQuestions.map((q, idx) => {
        let num = idx + 1;
        if (typeof q?.questionNumber === 'number' && q.questionNumber > 0) {
          num = q.questionNumber;
        } else if (typeof q?.blankNum === 'number' && q.blankNum > 0) {
          num = q.blankNum;
        } else {
          const match = String(q?.question || '').trim().match(/^(?:(?:questions?|q|câu)\s*)?(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?(?=\b|\s|[.):])/i);
          if (match) {
            const parsedNum = Number(match[1]);
            if (Number.isFinite(parsedNum) && parsedNum > 0) num = parsedNum;
          }
        }

        let targetPassageIdx = 0;
        if (num > p2E) {
          targetPassageIdx = 2;
        } else if (num > p1E) {
          targetPassageIdx = 1;
        } else {
          targetPassageIdx = 0;
        }

        return {
          ...q,
          passageIdx: targetPassageIdx
        };
      });

      const p1Count = updatedQuestions.filter(q => q.passageIdx === 0).length;
      const p2Count = updatedQuestions.filter(q => q.passageIdx === 1).length;
      const p3Count = updatedQuestions.filter(q => q.passageIdx === 2).length;

      showToast?.(`Đã chia ${updatedQuestions.length} câu: Passage 1 (${p1Count} câu), Passage 2 (${p2Count} câu), Passage 3 (${p3Count} câu)!`);

      return {
        ...prev,
        reading: {
          ...prev.reading,
          passages: nextPassages,
          questions: updatedQuestions
        }
      };
    });

    setBuilderReadingIdx(0);
    setShowPassageSplitModal(false);
  };

  const updateTestHashtags = (updater) => {
    setTestForm(prev => {
      const current = normalizeTestHashtags(prev.hashtags || prev.speaking?.hashtags || []);
      const nextList = normalizeTestHashtags(typeof updater === 'function' ? updater(current, prev) : updater);
      const isSp = prev.testMode === 'single_skill' && prev.focusSkill === 'speaking';
      return {
        ...prev,
        hashtags: nextList,
        ...(isSp
          ? {
              speaking: {
                ...normalizeSpeakingSection(prev.speaking),
                hashtags: nextList
              }
            }
          : {})
      };
    });
  };

  const togglePresetHashtag = (rawTag) => {
    const clean = normalizeSingleHashtag(rawTag);
    if (!clean) return;
    const lower = clean.toLowerCase();
    setTestForm(prev => {
      const current = normalizeTestHashtags(prev.hashtags || prev.speaking?.hashtags || []);
      const exists = current.some(t => t.toLowerCase() === lower);
      const nextList = exists
        ? current.filter(t => t.toLowerCase() !== lower)
        : normalizeTestHashtags([...current, clean]);
      const isSp = prev.testMode === 'single_skill' && prev.focusSkill === 'speaking';
      const sp = normalizeSpeakingSection(prev.speaking);
      const nextForecast = lower === '#forecast' ? !exists : sp.isForecast;
      return {
        ...prev,
        hashtags: nextList,
        ...(isSp
          ? {
              speaking: {
                ...sp,
                isForecast: nextForecast,
                hashtags: nextList
              }
            }
          : {})
      };
    });
  };

  const handleAddCustomHashtag = () => {
    const clean = normalizeSingleHashtag(customHashtagInput);
    if (!clean) return;
    updateTestHashtags(curr => [...curr, clean]);
    setCustomHashtagInput('');
    showToast?.(`Đã gắn hashtag ${clean} hiển thị bên học sinh!`);
  };

  const sessionKey = `${editingTest?.id || 'new'}::${testForm?.id || 'draft'}`;
  const initialSnapshotRef = useRef({ key: null, json: '' });
  useEffect(() => {
    if (initialSnapshotRef.current.key !== sessionKey) {
      initialSnapshotRef.current = {
        key: sessionKey,
        json: JSON.stringify(testForm || {})
      };
    }
  }, [sessionKey, testForm]);

  const handleExitBuilder = () => {
    const hasUnsavedChanges =
      initialSnapshotRef.current.key === sessionKey &&
      JSON.stringify(testForm || {}) !== initialSnapshotRef.current.json;
    if (
      hasUnsavedChanges &&
      !window.confirm('Bạn có thay đổi chưa lưu trong trình soạn đề. Rời trang lúc này sẽ mất các chỉnh sửa vừa nhập. Bạn vẫn muốn quay lại?')
    ) {
      return;
    }
    clearBuilderDraft(currentUser?.username);
    setEditingTest(null);
    setView('TEACHER_DASHBOARD');
  };

  const handleLoadSampleTemplate = () => {
    const hasExistingData =
      Boolean(testForm.title?.trim()) ||
      (testForm.listening?.questions?.length || 0) > 0 ||
      (testForm.reading?.questions?.length || 0) > 0;
    if (
      hasExistingData &&
      !window.confirm(
        'Bạn muốn nạp bộ khung đề mẫu để tham khảo và chỉnh sửa? Dữ liệu bạn đang soạn trên màn hình này sẽ được thay bằng đề mẫu.'
      )
    ) {
      return;
    }
    const stamp = Date.now();
    const sampleCloze = `Questions 1-2
Complete the notes below.
Write ONE WORD AND/OR A NUMBER for each answer.

**CLINIC APPOINTMENT BOOKING**
• Patient surname: {{1}}
• Preferred morning: {{2}}`;

    setTestForm(prev => ({
      ...prev,
      title: 'Đề Tập Soạn IELTS Mini (Mẫu Hướng Dẫn)',
      description: 'Đề mẫu Full 4 kỹ năng ngắn gọn giúp giáo viên dễ xem cấu trúc và sửa lại nội dung.',
      visibility: 'private',
      maxAttempts: 1,
      sequentialMode: false,
      allowEarlyNextSection: true,
      antiCheatEnabled: false,
      sectionOrder: ['listening', 'reading', 'writing', 'speaking'],
      sectionDurations: { listening: 20, reading: 30, writing: 30, speaking: 12 },
      maxAudioPlays: 2,
      allowViewAnswers: true,
      listening: {
        ...prev.listening,
        audioUrl: '',
        audioFileName: '',
        imageUrl: '',
        imageFileName: '',
        contextText: '',
        clozeText: sampleCloze,
        transcript:
          'Receptionist: Good morning, Greenfield Clinic. Could I confirm your appointment details? Caller: Yes, my surname is Miller, M-I-L-L-E-R, and I prefer Tuesday morning if available.',
        tracks: [
          {
            id: `track_tpl_${stamp}`,
            title: 'Part 1: Clinic Booking (Mẫu)',
            audioUrl: '',
            audioFileName: '',
            imageUrl: '',
            imageFileName: '',
            contextText: '',
            clozeText: sampleCloze,
            transcript:
              'Receptionist: Good morning, Greenfield Clinic. Could I confirm your appointment details? Caller: Yes, my surname is Miller, M-I-L-L-E-R, and I prefer Tuesday morning if available.'
          }
        ],
        questions: [
          {
            id: `lq_tpl_1_${stamp}`,
            type: 'fill',
            blankNum: 1,
            trackIdx: 0,
            question: '1. Patient surname: ______',
            options: [],
            correctAnswer: 'Miller|miller'
          },
          {
            id: `lq_tpl_2_${stamp}`,
            type: 'fill',
            blankNum: 2,
            trackIdx: 0,
            question: '2. Preferred morning: ______',
            options: [],
            correctAnswer: 'Tuesday|tuesday'
          }
        ]
      },
      reading: {
        ...prev.reading,
        passageTitle: 'Bài 1: Urban Rooftop Gardens (Mẫu)',
        passageText:
          'Many modern cities are turning flat building rooftops into productive green gardens. These spaces cool concrete roofs by several degrees in summer and provide fresh herbs and vegetables directly to nearby restaurants while absorbing rainwater during heavy storms.',
        clozeText: '',
        imageUrl: '',
        imageFileName: '',
        passages: [
          {
            id: `pass_tpl_${stamp}`,
            title: 'Bài 1: Urban Rooftop Gardens (Mẫu)',
            imageUrl: '',
            imageFileName: '',
            passageText:
              'Many modern cities are turning flat building rooftops into productive green gardens. These spaces cool concrete roofs by several degrees in summer and provide fresh herbs and vegetables directly to nearby restaurants while absorbing rainwater during heavy storms.',
            clozeText: ''
          }
        ],
        questions: [
          {
            id: `rq_tpl_1_${stamp}`,
            type: 'tfng',
            passageIdx: 0,
            question: '1. Rooftop gardens help lower building roof temperatures during summer.',
            options: ['TRUE', 'FALSE', 'NOT GIVEN'],
            correctAnswer: 'TRUE'
          },
          {
            id: `rq_tpl_2_${stamp}`,
            type: 'mcq',
            passageIdx: 0,
            question: '2. What environmental benefit is mentioned besides cooling?',
            options: [
              'A. Absorbing heavy storm rainwater',
              'B. Generating wind electricity',
              'C. Filtering underground metro air',
              'D. Eliminating street traffic noise'
            ],
            correctAnswer: 'A. Absorbing heavy storm rainwater'
          }
        ]
      },
      writing: {
        task1: {
          prompt:
            'Task 1: The chart below shows the percentage of households recycling plastic waste between 2015 and 2025. Summarise the main features.',
          minWords: 150,
          imageUrl: '',
          modelAnswer: ''
        },
        task2: {
          prompt:
            'Task 2: Some people believe public transport should be free for all residents in major cities. Do you agree or disagree?',
          minWords: 250,
          modelAnswer: ''
        }
      }
    }));
    setBuilderListeningIdx(0);
    setBuilderReadingIdx(0);
    showToast?.('Đã nạp bộ khung đề mẫu! Hãy bấm xem từng Tab 1–4 rồi sửa chữ theo ý bạn.');
  };

  const applyQuickPreset = (presetType) => {
    const defaultPrice = Math.max(1000, Number(defaultExamPriceVnd) || 20000);
    const currentCfg = normalizeExamConfig(testForm);
    const isSingle = currentCfg.testMode === 'single_skill' && Boolean(currentCfg.focusSkill);
    const isSpeakingSingle = isSingle && currentCfg.focusSkill === 'speaking';

    if (presetType === 'real_exam' || presetType === 'official') {
      setTestForm(prev => {
        const baseTags = normalizeTestHashtags(prev.hashtags || []).filter(
          t => !['#luyệntậptựdo', '#speakingdaily', '#mocktestđịnhkỳ'].includes(t.toLowerCase())
        );
        const nextTags = normalizeTestHashtags(['#ThựcChiến4KỹNăng', '#ThiThật', ...baseTags]);
        return {
          ...prev,
          testMode: 'full_exam',
          focusSkill: null,
          examCategory: 'real_exam',
          sectionOrder: ['listening', 'reading', 'writing', 'speaking'],
          visibility: 'public',
          examPurpose: 'real_exam',
          priceVnd: Number(prev.priceVnd) > 0 && Number(prev.priceVnd) < 300000 ? Number(prev.priceVnd) : defaultPrice,
          hashtags: nextTags,
          maxAttempts: 1,
          sequentialMode: true,
          allowEarlyNextSection: true,
          antiCheatEnabled: true,
          allowInternalCopyPaste: false,
          allowViewAnswers: false,
          maxAudioPlays: 1,
          sectionDurations: { listening: 30, reading: 60, writing: 60, speaking: 14 }
        };
      });
      showToast?.('Đã áp dụng: Thực Chiến Thi Thật 4 Kỹ Năng (L·R·W·S · 20.000đ hoặc Combo · 1 lượt · Chờ Ms. Như duyệt điểm).');
    } else if (presetType === 'periodic_mock') {
      setTestForm(prev => {
        const baseTags = normalizeTestHashtags(prev.hashtags || []).filter(
          t => !['#luyệntậptựdo', '#speakingdaily', '#thựcchiến4kỹnăng'].includes(t.toLowerCase())
        );
        const nextTags = normalizeTestHashtags(['#MockTestĐịnhKỳ', '#ThiThật', ...baseTags]);
        return {
          ...prev,
          testMode: 'full_exam',
          focusSkill: null,
          examCategory: 'periodic_mock',
          sectionOrder: ['listening', 'reading', 'writing', 'speaking'],
          visibility: 'public',
          examPurpose: 'real_exam',
          priceVnd: 300000,
          hashtags: nextTags,
          maxAttempts: 1,
          sequentialMode: true,
          allowEarlyNextSection: true,
          antiCheatEnabled: true,
          allowInternalCopyPaste: false,
          allowViewAnswers: false,
          maxAudioPlays: 1,
          sectionDurations: { listening: 30, reading: 60, writing: 60, speaking: 14 }
        };
      });
      showToast?.('Đã áp dụng: Mock Test Định Kỳ Ms. Như (300.000đ · 3 tháng/lần · Full 4 kỹ năng · 1 lượt).');
    } else if (presetType === 'speaking_daily') {
      const todayKey = getVietnamTodayDateKey();
      setTestForm(prev => {
        const sp = normalizeSpeakingSection(prev.speaking);
        const baseTags = normalizeTestHashtags(prev.hashtags || sp.hashtags || []).filter(
          t => !['#thithật', '#cópass', '#teamsắpthi', '#luyệntậptựdo', '#forecast'].includes(t.toLowerCase())
        );
        const nextTags = normalizeTestHashtags(['#DailySpeaking', ...baseTags]);
        return {
          ...prev,
          testMode: 'single_skill',
          focusSkill: 'speaking',
          examCategory: 'daily_zone',
          dailySubCategory: 'speaking_daily',
          sectionOrder: ['speaking'],
          visibility: 'public',
          examPurpose: 'free_practice',
          priceVnd: 0,
          hashtags: nextTags,
          maxAttempts: 0,
          antiCheatEnabled: false,
          allowViewAnswers: true,
          speaking: {
            ...sp,
            speakingTrack: 'daily',
            isForecast: false,
            dailyDate: sp.dailyDate || todayKey,
            dailyMandatory: true,
            hashtags: nextTags
          }
        };
      });
      showToast?.('Đã áp dụng: Daily Speaking (Bài nói hàng ngày trong Daily Zone).');
    } else if (presetType === 'speaking_forecast') {
      setTestForm(prev => {
        const sp = normalizeSpeakingSection(prev.speaking);
        const baseTags = normalizeTestHashtags(prev.hashtags || sp.hashtags || []).filter(
          t => !['#speakingdaily', '#dailyspeaking'].includes(t.toLowerCase())
        );
        const nextTags = normalizeTestHashtags(['#Forecast', '#CayForecastMsNhu', ...baseTags]);
        return {
          ...prev,
          testMode: 'single_skill',
          focusSkill: 'speaking',
          examCategory: 'daily_zone',
          dailySubCategory: 'speaking_forecast',
          sectionOrder: ['speaking'],
          visibility: 'public',
          examPurpose: 'free_practice',
          priceVnd: 0,
          hashtags: nextTags,
          maxAttempts: 0,
          antiCheatEnabled: false,
          allowViewAnswers: true,
          speaking: {
            ...sp,
            speakingTrack: 'general',
            isForecast: true,
            hashtags: nextTags
          }
        };
      });
      showToast?.('Đã áp dụng: Cày Forecast Cùng Ms. Như (Daily Zone).');
    } else if (presetType === 'paid_practice') {
      const chosenPrice = Number(testForm.priceVnd) > 0 ? Number(testForm.priceVnd) : defaultPrice;
      setTestForm(prev => ({
        ...prev,
        testMode: 'full_exam',
        focusSkill: null,
        examCategory: chosenPrice >= 300000 ? 'periodic_mock' : 'real_exam',
        sectionOrder: ['listening', 'reading', 'writing', 'speaking'],
        visibility: 'public',
        examPurpose: 'real_exam',
        priceVnd: chosenPrice,
        maxAttempts: 1,
        sequentialMode: true,
        allowEarlyNextSection: true,
        antiCheatEnabled: true,
        allowInternalCopyPaste: false,
        allowViewAnswers: false,
        maxAudioPlays: 1,
        sectionDurations: { listening: 30, reading: 60, writing: 60, speaking: 14 }
      }));
      showToast?.(`Đã áp dụng: Chi phí test ${formatVndCurrency(chosenPrice)} · Full 4 kỹ năng · 1 lượt.`);
    } else if (presetType === 'free_practice' || presetType === 'practice') {
      setTestForm(prev => {
        const sp = normalizeSpeakingSection(prev.speaking);
        const baseTags = normalizeTestHashtags(prev.hashtags || sp.hashtags || []).filter(
          t => !['#thithật', '#cópass', '#teamsắpthi', '#speakingdaily'].includes(t.toLowerCase())
        );
        const nextTags = normalizeTestHashtags(['#DailyZone', ...baseTags]);
        return {
          ...prev,
          visibility: 'public',
          examCategory: isSingle ? 'daily_zone' : 'real_exam',
          examPurpose: 'free_practice',
          priceVnd: 0,
          hashtags: nextTags,
          maxAttempts: isSingle ? 0 : 1,
          sequentialMode: !isSingle,
          allowEarlyNextSection: true,
          antiCheatEnabled: false,
          allowViewAnswers: true,
          maxAudioPlays: 3,
          sectionDurations: { listening: 30, reading: 60, writing: 60, speaking: 14 },
          ...(isSpeakingSingle
            ? {
                speaking: {
                  ...sp,
                  speakingTrack: 'general',
                  roomPassword: '',
                  hasRoomPassword: false,
                  hashtags: nextTags
                }
              }
            : {})
        };
      });
      showToast?.('Đã áp dụng chế độ: Luyện Tập Miễn Phí (Gắn #LuyệnTậpTựDo · làm nhiều lần, mở đáp án).');
    } else {
      setTestForm(prev => ({
        ...prev,
        visibility: 'private',
        examPurpose: 'draft',
        antiCheatEnabled: false
      }));
      showToast?.('Đã đặt về Nháp Chỉ Mình Tôi (học sinh chưa nhìn thấy đề này).', 'info');
    }
  };
  const handleSyncClozeQuestions = (skill, scopeField, scopeIdx, clozeText) => {
    setTestForm(prev => {
      const synced = syncClozeBlanksWithQuestions({
        clozeText,
        existingQuestions: prev[skill]?.questions || [],
        scopeField,
        scopeIdx,
        skill
      });
      return {
        ...prev,
        [skill]: {
          ...prev[skill],
          questions: synced
        }
      };
    });
    showToast?.('Đã đồng bộ các ô đục lỗ sang danh sách câu hỏi chấm điểm!');
  };

  const handleQuickAnswerKeyText = (skill, scopeField, scopeIdx, rawText) => {
    let matchedCount = 0;
    setTestForm(prev => {
      const result = applyAnswerKeyTextToQuestions(rawText, prev[skill]?.questions || [], scopeField, scopeIdx);
      matchedCount = result.matchedCount;
      return {
        ...prev,
        [skill]: {
          ...prev[skill],
          questions: result.updated
        }
      };
    });
    if (matchedCount > 0) {
      showToast?.(`Đã tự động điền ${matchedCount} đáp án vào danh sách câu hỏi!`);
    } else {
      showToast?.('Chưa khớp được số câu nào. Hãy đảm bảo đã có danh sách câu hỏi hoặc viết dạng "1. đáp án".', 'info');
    }
  };

  const handleApplyAiExtraction = (skill, scopeField, scopeIdx, extracted, { replaceScope = true }) => {
    const stampedQuestions = (extracted.questions || []).map((q, idx) => ({
      id: `${skill[0]}q_ai_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      type: q.type || 'fill',
      source: 'ai',
      ...(typeof q.blankNum === 'number' ? { blankNum: q.blankNum } : {}),
      [scopeField]: scopeIdx,
      question: q.question || `${q.blankNum || idx + 1}. Câu hỏi`,
      options: q.options || [],
      correctAnswer: q.correctAnswer || q.correctAnswers?.[0] || '',
      requiredSelections: q.type === 'mcq' ? Math.max(1, q.correctAnswers?.length || 1) : 1,
      ...(Array.isArray(q.correctAnswers) ? { correctAnswers: q.correctAnswers } : {})
    }));

    setTestForm(prev => {
      const currentQs = prev[skill]?.questions || [];
      const hasScoped = currentQs.some(q => typeof q?.[scopeField] === 'number');
      const retainedQs = replaceScope
        ? currentQs.filter(q => {
            if (!hasScoped) return false;
            return typeof q?.[scopeField] === 'number' && q[scopeField] !== scopeIdx;
          })
        : currentQs;

      let mergedQs = [...retainedQs, ...stampedQuestions];
      if (extracted.clozeText) {
        mergedQs = syncClozeBlanksWithQuestions({
          clozeText: extracted.clozeText,
          existingQuestions: mergedQs,
          scopeField,
          scopeIdx,
          skill,
          defaultSource: 'ai'
        });
      }

      if (skill === 'listening') {
        const tracks = getListeningTracks(prev.listening);
        const updatedTracks = tracks.map((tr, i) =>
          i === scopeIdx
            ? {
                ...tr,
                title: extracted.title || tr.title,
                clozeText: extracted.clozeText !== undefined
                  ? (extracted.clozeText || (replaceScope ? '' : tr.clozeText))
                  : tr.clozeText
              }
            : tr
        );
        const first = updatedTracks[0] || {};
        return {
          ...prev,
          listening: {
            ...prev.listening,
            tracks: updatedTracks,
            clozeText: first.clozeText || '',
            questions: mergedQs
          }
        };
      }

      const passages = getReadingPassages(prev.reading);
      const updatedPassages = passages.map((p, i) =>
        i === scopeIdx
          ? {
              ...p,
              title: extracted.title || p.title,
              passageText: extracted.passageText || p.passageText,
              clozeText: extracted.clozeText !== undefined
                ? (extracted.clozeText || (replaceScope ? '' : p.clozeText))
                : p.clozeText
            }
          : p
      );
      const first = updatedPassages[0] || {};
      return {
        ...prev,
        reading: {
          ...prev.reading,
          passages: updatedPassages,
          passageTitle: first.title || '',
          passageText: first.passageText || '',
          clozeText: first.clozeText || '',
          questions: mergedQs
        }
      };
    });

    return { totalInScope: stampedQuestions.length };
  };

  const handleApplyReadingPdfExtraction = (extracted, { replaceAll = true } = {}) => {
    const extractedPassages = Array.isArray(extracted?.passages) ? extracted.passages : [];
    if (extractedPassages.length === 0) {
      showToast?.('PDF chưa có passage Reading để áp dụng.', 'error');
      return { cancelled: true };
    }

    const currentPassages = getReadingPassages(testForm.reading);
    const currentQuestions = Array.isArray(testForm.reading?.questions) ? testForm.reading.questions : [];
    const hasExistingContent = currentQuestions.length > 0 || currentPassages.some(
      passage => String(passage?.passageText || '').trim() || String(passage?.clozeText || '').trim()
    );
    const shouldReplaceAll = replaceAll || !hasExistingContent;
    if (
      shouldReplaceAll &&
      hasExistingContent &&
      !window.confirm('Thay toàn bộ passages, nội dung và câu hỏi Reading hiện tại bằng dữ liệu từ PDF?')
    ) {
      return { cancelled: true };
    }

    const stamp = Date.now();
    const importedPassages = extractedPassages.map((passage, idx) => ({
      id: `pass_pdf_${stamp}_${idx}`,
      title: String(passage?.title || `Passage ${idx + 1}`).trim(),
      imageUrl: '',
      imageFileName: '',
      passageText: String(passage?.passageText || '').trim(),
      clozeText: String(passage?.clozeText || '').trim()
    }));

    setTestForm(prev => {
      const previousPassages = getReadingPassages(prev.reading);
      const passageOffset = shouldReplaceAll ? 0 : previousPassages.length;
      const nextPassages = shouldReplaceAll
        ? importedPassages
        : [...previousPassages, ...importedPassages];
      const importedQuestions = extractedPassages.flatMap((passage, passageIdx) =>
        (Array.isArray(passage?.questions) ? passage.questions : []).map((question, questionIdx) => ({
          id: `rq_pdf_${stamp}_${passageIdx}_${questionIdx}`,
          type: question.type || 'fill',
          source: 'ai',
          ...(typeof question.blankNum === 'number' ? { blankNum: question.blankNum } : {}),
          ...(typeof question.questionNumber === 'number' ? { questionNumber: question.questionNumber } : {}),
          ...(typeof question.questionEndNumber === 'number' ? { questionEndNumber: question.questionEndNumber } : {}),
          passageIdx: passageOffset + passageIdx,
          question: question.question || `${question.blankNum || questionIdx + 1}. Câu hỏi`,
          options: Array.isArray(question.options) ? question.options : [],
          wordLimit: String(question.wordLimit || '').trim(),
          correctAnswer: question.correctAnswer || question.correctAnswers?.[0] || '',
          ...(question.type === 'mcq'
            ? { requiredSelections: Math.max(1, Number(question.requiredSelections) || question.correctAnswers?.length || 1) }
            : {}),
          ...(Array.isArray(question.correctAnswers) ? { correctAnswers: question.correctAnswers } : {})
        }))
      );
      const readingQuestions = shouldReplaceAll
        ? importedQuestions
        : [...(Array.isArray(prev.reading?.questions) ? prev.reading.questions : []), ...importedQuestions];
      const firstPassage = nextPassages[0] || {};

      return {
        ...prev,
        reading: {
          ...prev.reading,
          passages: nextPassages,
          passageTitle: firstPassage.title || '',
          passageText: firstPassage.passageText || '',
          clozeText: firstPassage.clozeText || '',
          imageUrl: firstPassage.imageUrl || '',
          imageFileName: firstPassage.imageFileName || '',
          questions: readingQuestions
        }
      };
    });

    setBuilderReadingIdx(0);
    const questionCount = extractedPassages.reduce(
      (sum, passage) => sum + (Array.isArray(passage?.questions) ? passage.questions.length : 0),
      0
    );
    showToast?.(`Đã đưa ${importedPassages.length} passage và ${questionCount} câu Reading từ PDF vào đề. Hãy rà lại đáp án trước khi lưu.`);
    return { passageCount: importedPassages.length, questionCount };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <button
            onClick={handleExitBuilder}
            className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Quay Lại Bảng Điều Khiển Giáo Viên
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {(() => {
              const isEx = normalizeExamConfig(testForm).testMode === 'single_skill';
              if (editingTest) return `${isEx ? 'Chỉnh Sửa Bài Tập' : 'Chỉnh Sửa Đề Thi'}: ${editingTest.title}`;
              return isEx ? 'Tạo & Biên Soạn Bài Tập Kỹ Năng Mới' : 'Tạo & Biên Soạn Đề Thi IELTS Mới';
            })()}
          </h1>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
            {normalizeExamConfig(testForm).testMode === 'single_skill'
              ? 'Biên soạn nội dung, câu hỏi, audio / hình ảnh hoặc đề Speaking riêng cho bài tập Daily Zone này.'
              : 'Tùy chỉnh câu hỏi Listening (kèm file ghi âm MP3/WAV), Reading (kèm hình ảnh minh họa), Writing, Speaking và quyền xem đáp án.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="px-3.5 py-2.5 text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6] bg-[#EDFFFD] dark:bg-teal-950/50 hover:bg-[#B5F5F1]/60 rounded-xl border border-[#B5F5F1] dark:border-teal-500/40 transition flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" /> Hướng Dẫn Cách Tạo
          </button>
          <button
            onClick={handleExitBuilder}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleSaveTestBuilder}
            className="bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {normalizeExamConfig(testForm).testMode === 'single_skill' ? 'Lưu Bài Tập' : 'Lưu Toàn Bộ Đề Thi'}
          </button>
        </div>
      </div>

      {/* Step-by-Step Interactive Guide Banner (Hidden cleanly in Single-Skill focus mode) */}
      {normalizeExamConfig(testForm).testMode !== 'single_skill' && (
        <BuilderGuideBanner
          builderTab={builderTab}
          onJumpToTab={setBuilderTab}
          onLoadSampleTemplate={handleLoadSampleTemplate}
          onOpenGuideModal={() => setShowGuideModal(true)}
          testForm={testForm}
        />
      )}

      <BuilderGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onJumpToTab={setBuilderTab}
      />

      {/* Builder Sub-Navigation Tabs */}
      {(() => {
        const currentCfg = normalizeExamConfig(testForm);
        const isSingleSkill = currentCfg.testMode === 'single_skill' && currentCfg.focusSkill;
        const singleMetaMap = {
          listening: { label: `2. Nội Dung & Câu Hỏi Listening (${testForm.listening?.questions?.length || 0} câu)`, icon: Headphones, activeCls: 'bg-blue-600 text-white shadow-sm' },
          reading: { label: `2. Nội Dung & Câu Hỏi Reading (${testForm.reading?.questions?.length || 0} câu)`, icon: BookOpen, activeCls: 'bg-indigo-600 text-white shadow-sm' },
          writing: { label: '2. Nội Dung Đề Writing & Bài Mẫu', icon: PenTool, activeCls: 'bg-emerald-600 text-white shadow-sm' },
          speaking: { label: `2. Câu Hỏi Speaking AI (${getSpeakingQuestionItems(testForm.speaking, 'all').length} câu)`, icon: Mic, activeCls: 'bg-[#007A7A] text-white shadow-sm' }
        };

        return (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setBuilderTab('general')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                  builderTab === 'general'
                    ? 'bg-[#007A7A] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" /> 1. Tên Đề &amp; Cài Đặt Chung
              </button>

              {isSingleSkill ? (() => {
                const sm = singleMetaMap[currentCfg.focusSkill] || singleMetaMap.speaking;
                const SkillIcon = sm.icon;
                return (
                  <button
                    onClick={() => setBuilderTab(currentCfg.focusSkill)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                      builderTab === currentCfg.focusSkill
                        ? sm.activeCls
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <SkillIcon className="w-4 h-4" /> {sm.label}
                  </button>
                );
              })() : (
                <>
                  <button
                    onClick={() => setBuilderTab('listening')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                      builderTab === 'listening'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Headphones className="w-4 h-4" /> 2. Phần Listening ({getListeningTracks(testForm.listening).length > 1 ? `${getListeningTracks(testForm.listening).length} Part • ` : ''}{testForm.listening?.questions?.length || 0} câu)
                  </button>
                  <button
                    onClick={() => setBuilderTab('reading')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                      builderTab === 'reading'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" /> 3. Phần Reading ({testForm.reading?.questions?.length || 0} câu)
                  </button>
                  <button
                    onClick={() => setBuilderTab('writing')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                      builderTab === 'writing'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <PenTool className="w-4 h-4" /> 4. Phần Writing &amp; Bài Mẫu
                  </button>
                  <button
                    onClick={() => setBuilderTab('speaking')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                      builderTab === 'speaking'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Mic className="w-4 h-4" /> 5. Phần Speaking ({getSpeakingQuestionItems(testForm.speaking, 'all').length} câu)
                  </button>
                </>
              )}
            </div>

            {isSingleSkill && (
              <span className="px-3 py-1 rounded-xl bg-[#EDFFFD] text-[#0F766E] dark:text-[#1EE1D6] text-xs font-extrabold mr-1">
                Daily Zone: {currentCfg.focusSkill === 'writing' ? (currentCfg.writingTaskScope === 'task1' ? 'WRITING TASK 1 (W1)' : currentCfg.writingTaskScope === 'task2' ? 'WRITING TASK 2 (W2)' : 'WRITING') : currentCfg.focusSkill.toUpperCase()}
              </span>
            )}
          </div>
        );
      })()}

      {/* TAB 1: GENERAL SETTINGS, VISIBILITY, ATTEMPT LIMITS, SECTION TIMERS & ANSWER PERMISSIONS */}
      <div
        key={`builder-tab-${builderTab}`}
        className="apple-view-enter space-y-6"
        onAnimationEnd={e => {
          if (e.currentTarget === e.target) {
            e.currentTarget.classList.remove('apple-view-enter');
          }
        }}
      >
      {builderTab === 'general' && (() => {
        const cfg = normalizeExamConfig(testForm);
        const skillLabels = {
          listening: { name: 'Listening', icon: Headphones, color: 'text-blue-600 dark:text-blue-400' },
          reading: { name: 'Reading', icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400' },
          writing: { name: 'Writing', icon: PenTool, color: 'text-purple-600 dark:text-purple-400' },
          speaking: { name: 'Speaking AI', icon: Mic, color: 'text-[#0F766E] dark:text-[#1EE1D6]' }
        };
        const moveSectionOrder = (idx, dir) => {
          const nextIdx = idx + dir;
          if (nextIdx < 0 || nextIdx >= cfg.order.length) return;
          const nextOrder = [...cfg.order];
          [nextOrder[idx], nextOrder[nextIdx]] = [nextOrder[nextIdx], nextOrder[idx]];
          setTestForm(prev => ({ ...prev, sectionOrder: nextOrder }));
        };

        return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Exam Structure Mode Switcher: Full 4-Skill Mock Exam vs Daily Zone Exercises */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#EDFFFD] dark:bg-indigo-950/25 border border-[#007A7A]/25 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold text-[#0F766E] dark:text-[#1EE1D6]">
                  Loại Nội Dung: Đề Thi IELTS Full 4 Kỹ Năng (L·R·W·S) vs Bài Tập Daily Zone (Từng Team)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Chọn <b>Đề Thi Full 4 Kỹ Năng</b> cho Thực Chiến Thi Thật (20.000đ / Combo) &amp; Mock Test Định Kỳ (300.000đ), hoặc chọn từng kỹ năng (tách riêng <b>Writing Task 1</b> và <b>Writing Task 2</b>) cho <b>Daily Zone</b>.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setTestForm(prev => ({
                    ...prev,
                    testMode: 'full_exam',
                    focusSkill: null,
                    examCategory: prev.examCategory === 'periodic_mock' ? 'periodic_mock' : 'real_exam',
                    writingTaskScope: 'both',
                    sectionOrder: ['listening', 'reading', 'writing', 'speaking'],
                    sectionDurations: { listening: 30, reading: 60, writing: 60, speaking: 14 },
                    maxAttempts: 1,
                    sequentialMode: true
                  }))
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition ${
                  cfg.testMode !== 'single_skill'
                    ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                🏛️ Đề Thi IELTS Full 4 Kỹ Năng (L·R·W·S)
              </button>
              {[
                { key: 'listening', skill: 'listening', scope: 'both', defaultSub: 'listening_shw', label: '🎧 Daily Listening' },
                { key: 'reading', skill: 'reading', scope: 'both', defaultSub: 'shw_1', label: '📖 Daily Reading (SHW 1–14)' },
                { key: 'writing_t1', skill: 'writing', scope: 'task1', defaultSub: 'w1_map', label: '✍️ Daily Writing Task 1 (W1)' },
                { key: 'writing_t2', skill: 'writing', scope: 'task2', defaultSub: 'w2_essay', label: '📝 Daily Writing Task 2 (W2)' },
                { key: 'speaking', skill: 'speaking', scope: 'both', defaultSub: 'speaking_daily', label: '🎙️ Daily Speaking / Forecast' }
              ].map(item => {
                const isActiveSk =
                  cfg.testMode === 'single_skill' &&
                  cfg.focusSkill === item.skill &&
                  (item.skill !== 'writing' || cfg.writingTaskScope === item.scope);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setTestForm(prev => ({
                        ...prev,
                        testMode: 'single_skill',
                        focusSkill: item.skill,
                        examCategory: 'daily_zone',
                        writingTaskScope: item.scope,
                        dailySubCategory: item.defaultSub,
                        sectionOrder: [item.skill],
                        sequentialMode: false,
                        examPurpose: 'free_practice',
                        priceVnd: 0,
                        maxAttempts: 0,
                        allowViewAnswers: true,
                        antiCheatEnabled: false
                      }))
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition ${
                      isActiveSk
                        ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Daily Zone Sub-Category Selector (Reading SHW 1-14 / Listening 3 mục / Writing W1 4 dạng / W2 / Speaking 2 mục) */}
            {cfg.testMode === 'single_skill' && (
              <div className="pt-3 border-t border-[#007A7A]/20 space-y-2">
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Phân Mục Hiển Thị Trong Daily Zone:
                </p>
                {cfg.focusSkill === 'reading' && (
                  <div className="flex flex-wrap gap-1.5">
                    {DAILY_READING_SUBCATEGORIES.map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setTestForm(prev => ({ ...prev, dailySubCategory: sub.id }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                          cfg.dailySubCategory === sub.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
                {cfg.focusSkill === 'listening' && (
                  <div className="flex flex-wrap gap-1.5">
                    {DAILY_LISTENING_SUBCATEGORIES.map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setTestForm(prev => ({ ...prev, dailySubCategory: sub.id }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          cfg.dailySubCategory === sub.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
                {['reading', 'listening'].includes(cfg.focusSkill) && (
                  <label className="block max-w-xl space-y-1.5 pt-1">
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bộ bài / thư mục SuperHomework (tùy chọn)
                    </span>
                    <input
                      type="text"
                      value={testForm.dailyFolderName || ''}
                      onChange={e => setTestForm(prev => ({ ...prev, dailyFolderName: e.target.value }))}
                      maxLength={60}
                      placeholder="Ví dụ: Cuốn 1 • Tuần 1"
                      className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#007A7A]"
                    />
                    <span className="block text-xs text-slate-600 dark:text-slate-400">
                      Đặt cùng tên cho các bài lẻ trong một bộ để gom thành thư mục và theo dõi tiến độ chung.
                    </span>
                  </label>
                )}
                {cfg.focusSkill === 'writing' && cfg.writingTaskScope === 'task1' && (
                  <div className="flex flex-wrap gap-1.5">
                    {DAILY_WRITING_T1_SUBCATEGORIES.map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setTestForm(prev => ({ ...prev, dailySubCategory: sub.id, writingTaskScope: 'task1' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          cfg.dailySubCategory === sub.id
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        W1 · {sub.label}
                      </button>
                    ))}
                  </div>
                )}
                {cfg.focusSkill === 'writing' && cfg.writingTaskScope === 'task2' && (
                  <div className="flex flex-wrap gap-1.5">
                    {DAILY_WRITING_T2_SUBCATEGORIES.map(sub => (
                      <span
                        key={sub.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-600 text-white"
                      >
                        {sub.label}
                      </span>
                    ))}
                  </div>
                )}
                {cfg.focusSkill === 'speaking' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyQuickPreset('speaking_daily')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition ${
                        !normalizeSpeakingSection(testForm.speaking).isForecast
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      🔥 1. Daily Speaking
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickPreset('speaking_forecast')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition ${
                        normalizeSpeakingSection(testForm.speaking).isForecast
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      🌟 2. Cày Forecast Cùng Ms. Như
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* 1-Click Quick Configuration Presets for Non-Tech Users */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#EDFFFD]/80 dark:bg-teal-950/30 border border-[#B5F5F1] dark:border-teal-500/30 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold text-[#007A7A] dark:text-[#1EE1D6] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Chia Sẵn Chế Độ Đề Thi (1 Chạm)
                </h2>
                <p className="text-xs text-[#314158] dark:text-slate-300 mt-0.5">
                  {cfg.testMode === 'single_skill'
                    ? 'Bài tập Daily Zone luôn cho làm lại nhiều lần, miễn phí và có thể đặt Mật khẩu Team riêng cho từng lớp:'
                    : 'Chọn Thực Chiến Thi Thật (Full 4 kỹ năng · 20.000đ hoặc Combo · 1 lượt) hoặc Mock Test Định Kỳ (300.000đ · 3 tháng/lần · 1 lượt):'}
                </p>
              </div>
            </div>

            {(() => {
              const isSingle = cfg.testMode === 'single_skill';
              const isSpeakingSingle = isSingle && cfg.focusSkill === 'speaking';
              const sp = normalizeSpeakingSection(testForm.speaking);
              const currentPass = String(
                (isSpeakingSingle ? (sp.roomPassword || testForm.examPassword) : testForm.examPassword) || ''
              ).trim();
              const hasPass = Boolean(
                currentPass ||
                testForm.hasExamPassword ||
                (isSpeakingSingle && sp.hasRoomPassword)
              );
              const activePurpose =
                testForm.visibility === 'private'
                  ? 'draft'
                  : !isSingle && (cfg.examCategory === 'periodic_mock' || Number(testForm.priceVnd || 0) >= 300000)
                  ? 'periodic_mock'
                  : !isSingle
                  ? 'real_exam'
                  : isSpeakingSingle && sp.isForecast
                  ? 'speaking_forecast'
                  : isSpeakingSingle
                  ? 'speaking_daily'
                  : 'free_practice';
              const effectiveTags = getEffectiveTestHashtags(testForm);
              const rawTagsList = normalizeTestHashtags(testForm.hashtags || sp.hashtags || []);

              const handleChangeUnifiedPassword = (nextVal) => {
                const cleanVal = String(nextVal || '').trimStart();
                setTestForm(prev => {
                  const prevSp = normalizeSpeakingSection(prev.speaking);
                  return {
                    ...prev,
                    examPassword: cleanVal,
                    hasExamPassword: Boolean(cleanVal.trim()),
                    ...(isSpeakingSingle
                      ? {
                          speaking: {
                            ...prevSp,
                            roomPassword: cleanVal,
                            hasRoomPassword: Boolean(cleanVal.trim())
                          }
                        }
                      : {})
                  };
                });
              };

              const handleClearUnifiedPassword = () => {
                setTestForm(prev => {
                  const prevSp = normalizeSpeakingSection(prev.speaking);
                  return {
                    ...prev,
                    examPassword: '',
                    hasExamPassword: false,
                    ...(isSpeakingSingle
                      ? {
                          speaking: {
                            ...prevSp,
                            roomPassword: '',
                            hasRoomPassword: false
                          }
                        }
                      : {})
                  };
                });
              };

              return (
                <>
                  {isSingle ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => applyQuickPreset(isSpeakingSingle ? 'speaking_daily' : 'free_practice')}
                        className={`text-left p-3 rounded-xl bg-white dark:bg-slate-900 border transition shadow-xs ${
                          activePurpose !== 'draft' && activePurpose !== 'speaking_forecast'
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                          🌐 {isSpeakingSingle ? 'Daily Speaking (Mở Daily Zone)' : 'Mở Công Khai Daily Zone (Làm Nhiều Lần)'}
                        </div>
                        <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5 leading-snug">
                          Miễn phí · Làm lại không giới hạn · Có thể đặt mật khẩu riêng cho từng Team bên dưới
                        </p>
                      </button>

                      {isSpeakingSingle && (
                        <button
                          type="button"
                          onClick={() => applyQuickPreset('speaking_forecast')}
                          className={`text-left p-3 rounded-xl bg-white dark:bg-slate-900 border transition shadow-xs ${
                            activePurpose === 'speaking_forecast'
                              ? 'border-teal-500 ring-2 ring-teal-500/25'
                              : 'border-slate-200 dark:border-slate-700 hover:border-teal-500'
                          }`}
                        >
                          <div className="text-xs font-extrabold text-teal-700 dark:text-teal-300">
                            🌟 Cày Forecast Cùng Ms. Như
                          </div>
                          <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5 leading-snug">
                            Xếp vào kho Forecast Speaking của Ms. Như trong Daily Zone
                          </p>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => applyQuickPreset('draft')}
                        className={`text-left p-3 rounded-xl bg-white dark:bg-slate-900 border transition shadow-xs ${
                          activePurpose === 'draft'
                            ? 'border-amber-500 ring-2 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-amber-500'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">🔒 Lưu Nháp Soạn Dở</div>
                        <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5 leading-snug">
                          Chỉ mình giáo viên thấy • Học sinh chưa nhìn thấy bài tập này
                        </p>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => applyQuickPreset('real_exam')}
                        className={`text-left p-3 rounded-xl bg-white dark:bg-slate-900 border transition shadow-xs ${
                          activePurpose === 'real_exam'
                            ? 'border-[#007A7A] ring-2 ring-teal-500/25'
                            : 'border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-[#007A7A] dark:text-[#1EE1D6]">
                          🏛️ Thực Chiến Thi Thật (20.000đ · 1 Lượt)
                        </div>
                        <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5 leading-snug">
                          Full 4 kỹ năng L·R·W·S liên hoàn · Áp dụng Combo 3/5/10 đề · Chờ Ms. Như duyệt điểm
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyQuickPreset('periodic_mock')}
                        className={`text-left p-3 rounded-xl bg-white dark:bg-slate-900 border transition shadow-xs ${
                          activePurpose === 'periodic_mock'
                            ? 'border-amber-500 ring-2 ring-amber-500/25'
                            : 'border-slate-200 dark:border-slate-700 hover:border-amber-500'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5" /> Mock Test Định Kỳ (300.000đ)
                        </div>
                        <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5 leading-snug">
                          Kỳ thi định kỳ 3 tháng/lần của Ms. Như · Full 4 kỹ năng · 1 lượt duy nhất
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyQuickPreset('draft')}
                        className={`text-left p-3 rounded-xl bg-white dark:bg-slate-900 border transition shadow-xs ${
                          activePurpose === 'draft'
                            ? 'border-slate-500 ring-2 ring-slate-400/25'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-slate-600 dark:text-slate-300">🔒 Lưu Nháp Soạn Dở</div>
                        <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5 leading-snug">
                          Chỉ mình tôi thấy · Chưa hiển thị cho học sinh
                        </p>
                      </button>
                    </div>
                  )}

                  {/* Unified Password Strip (Team Pass for Daily Zone OR Class Pass for Full Exam) */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/35 border border-indigo-200 dark:border-indigo-700/50 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
                          {isSingle
                            ? 'Mật Khẩu Team / Lớp (Tùy chọn - Để trống nếu mở chung)'
                            : 'Mật Khẩu Phòng Thi Thực Chiến (Tùy chọn - Gửi cho lớp trước khi thi)'}
                        </span>
                      </div>
                      {hasPass && (
                        <button
                          type="button"
                          onClick={handleClearUnifiedPassword}
                          className="text-xs font-bold text-slate-500 hover:text-rose-600 underline"
                        >
                          Bỏ mật khẩu
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={currentPass}
                        onChange={e => handleChangeUnifiedPassword(e.target.value)}
                        placeholder={
                          hasPass && !currentPass
                            ? 'Đang có mật khẩu cũ - nhập mã mới nếu muốn đổi'
                            : isSingle
                            ? 'VD: TEAM65, TEAM70 hoặc để trống'
                            : 'VD: THI2026 hoặc để trống'
                        }
                        className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 text-xs font-extrabold tracking-wider text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const prefix = isSingle ? 'TEAM' : 'THI';
                          handleChangeUnifiedPassword(`${prefix}${Math.floor(1000 + Math.random() * 9000)}`);
                        }}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Tạo Pass Mới
                      </button>
                      {Boolean(currentPass) && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(currentPass);
                            showToast?.(`Đã sao chép mật khẩu: ${currentPass}`);
                          }}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-50 transition"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Pass
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contextual Inline Strip for Speaking Daily */}
                  {isSpeakingSingle && activePurpose === 'speaking_daily' && (
                    <div className="p-3.5 rounded-xl bg-orange-50/90 dark:bg-orange-950/25 border border-orange-200 dark:border-orange-500/35 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="block text-xs font-bold text-orange-900 dark:text-orange-200 mb-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Ngày giao bài Speaking Daily
                        </label>
                        <input
                          type="date"
                          value={sp.dailyDate || getVietnamTodayDateKey()}
                          onChange={e =>
                            setTestForm(prev => ({
                              ...prev,
                              speaking: {
                                ...normalizeSpeakingSection(prev.speaking),
                                speakingTrack: 'daily',
                                dailyDate: e.target.value
                              }
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                      <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-orange-200/80 dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={sp.dailyMandatory}
                          onChange={e =>
                            setTestForm(prev => ({
                              ...prev,
                              speaking: {
                                ...normalizeSpeakingSection(prev.speaking),
                                speakingTrack: 'daily',
                                dailyMandatory: e.target.checked
                              }
                            }))
                          }
                          className="mt-0.5 w-4 h-4 accent-orange-600"
                        />
                        <span className="text-xs text-slate-700 dark:text-slate-200 leading-snug">
                          <strong>Bắt buộc hoàn thành mỗi ngày</strong> - Tự động báo danh sách học viên chưa làm &amp; gắn <b>#SpeakingDaily</b> trên màn hình học viên.
                        </span>
                      </label>
                    </div>
                  )}

                  {!isSingle && (
                    <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                            Chi Phí Test Full 4 Kỹ Năng (Mỗi Đề Chỉ Làm 1 Lượt Duy Nhất)
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          {Number(testForm.priceVnd || 0) > 0 ? formatVndCurrency(Number(testForm.priceVnd)) : 'Miễn phí (0đ)'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { v: 20000, label: 'Thực chiến (20.000đ)' },
                          { v: 300000, label: 'Mock Test Định Kỳ (300.000đ)' },
                          { v: 0, label: 'Miễn phí (0đ)' }
                        ].map(preset => {
                          const isSelected = Number(testForm.priceVnd || 0) === preset.v;
                          return (
                            <button
                              key={preset.v}
                              type="button"
                              onClick={() =>
                                setTestForm(prev => ({
                                  ...prev,
                                  priceVnd: preset.v,
                                  examCategory: preset.v >= 300000 ? 'periodic_mock' : 'real_exam',
                                  examPurpose: 'real_exam',
                                  maxAttempts: 1
                                }))
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition ${
                                isSelected
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-amber-200 dark:border-amber-700/50 hover:border-amber-500'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Khác:</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={Number(testForm.priceVnd || 0)}
                            onChange={e => {
                              const nextPrice = Math.max(0, Math.round(Number(e.target.value) || 0));
                              setTestForm(prev => ({
                                ...prev,
                                priceVnd: nextPrice,
                                examPurpose: nextPrice > 0 ? 'paid_practice' : 'free_practice'
                              }));
                            }}
                            className="w-28 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Student-Facing Hashtags Strip (Chống nhầm Đề Thi Thật vs Bài Luyện Tập bên Học Sinh) */}
                  <div className="p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" />
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Hashtag Phân Loại Hiển Thị Bên Học Sinh (Để Học Sinh Không Nhầm Đề Thi Thật Với Luyện Tập)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-[#475569] dark:text-slate-400">Hiển thị trên thẻ HS:</span>
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
                                onClick={() => togglePresetHashtag(item.tag)}
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
                        const isSelected = effectiveTags.some(
                          t => t.tag.toLowerCase() === preset.tag.toLowerCase()
                        );
                        return (
                          <button
                            key={preset.tag}
                            type="button"
                            onClick={() => togglePresetHashtag(preset.tag)}
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

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <input
                        type="text"
                        value={customHashtagInput}
                        onChange={e => setCustomHashtagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomHashtag();
                          }
                        }}
                        placeholder="Nhập #hashtag riêng cho lớp (VD: #LớpTối246, #ThiThửTháng11, #Cam19)..."
                        className="flex-1 min-w-[220px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007A7A]"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomHashtag}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
                      >
                        + Thêm #Hashtag
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                <span>Tên Đề Thi IELTS</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-extrabold normal-case">
                  Bắt buộc
                </span>
              </label>
              <input
                id="builder-test-title-input"
                type="text"
                value={testForm.title}
                onChange={e => setTestForm({ ...testForm, title: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                placeholder="VD: Đề kiểm tra tuần 1 - Lớp IELTS Cơ Bản"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                <span>Số Lần Nghe Audio</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-400 font-bold normal-case">
                  Mặc định 1
                </span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={testForm.maxAudioPlays}
                onChange={e => setTestForm({ ...testForm, maxAudioPlays: Number(e.target.value) || 1 })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              <span>Mô Tả Ngắn Về Đề Thi</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-400 font-bold normal-case">
                Tùy chọn (bỏ trống cũng được)
              </span>
            </label>
            <textarea
              rows={2}
              value={testForm.description}
              onChange={e => setTestForm({ ...testForm, description: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
              placeholder="VD: Gồm Listening Part 1 + Reading Passage 1, làm trong 45 phút... (không bắt buộc)"
            />
          </div>

          {/* Visibility & Max Attempts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Visibility Setting */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  {cfg.visibility === 'private' ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Globe className="w-4 h-4 text-emerald-500" />}
                  Chế Độ Hiển Thị Đề Thi
                </h3>
                <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
                  Chọn <b>Chỉ mình tôi</b> khi đang soạn thảo để học viên không nhìn thấy hoặc bấm nhầm.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, visibility: 'public' }))}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    cfg.visibility === 'public'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Công khai (HS thấy)
                </button>
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, visibility: 'private' }))}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    cfg.visibility === 'private'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" /> Chỉ mình tôi (Ẩn)
                </button>
              </div>
            </div>

            {/* Attempt Limit Setting */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-500" /> Số Lần Học Viên Được Làm Bài
                </h3>
                <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
                  Đặt <b>0</b> để ôn tập tự do không giới hạn, hoặc <b>1</b> nếu dùng để kiểm tra / thi thật.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, maxAttempts: 0 }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    cfg.maxAttempts === 0
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  ∞ Thi Thử (Nhiều lần)
                </button>
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, maxAttempts: 1 }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    cfg.maxAttempts === 1
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  🔒 Thi Thật (1 lần)
                </button>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-xs text-[#475569] dark:text-slate-400 font-semibold">Tùy chỉnh:</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={cfg.maxAttempts}
                    onChange={e => setTestForm(prev => ({ ...prev, maxAttempts: Math.max(0, Number(e.target.value) || 0) }))}
                    className="w-16 px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Class Scope Assignment Card */}
          {(() => {
            const classList = Object.values(classesDb || {}).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            const assignedIds = Array.isArray(cfg.assignedClassIds) ? cfg.assignedClassIds : [];
            const isAllClasses = assignedIds.length === 0;
            const toggleAssignedClass = (cid) => {
              setTestForm(prev => {
                const curr = Array.isArray(prev.assignedClassIds) ? prev.assignedClassIds : [];
                const next = curr.includes(cid) ? curr.filter(x => x !== cid) : [...curr, cid];
                return { ...prev, assignedClassIds: next };
              });
            };
            return (
              <div className="p-5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-500/30 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      Giao Đề / Bài Tập Theo Lớp Học
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Chọn <strong>Tất cả học viên</strong> hoặc chỉ định riêng một vài lớp (chỉ học viên trong lớp được chọn mới nhìn thấy bài và nhận thông báo).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestForm(prev => ({ ...prev, assignedClassIds: [] }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                      isAllClasses
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 inline mr-1" />
                    Tất cả học viên
                  </button>
                </div>

                {classList.length === 0 ? (
                  <p className="text-xs text-[#475569] dark:text-slate-400 italic">
                    Chưa có lớp học nào. Giáo viên có thể tạo lớp tại tab <strong>6. Quản Lý Lớp Học</strong> trên Bảng Điều Khiển.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {classList.map(cls => {
                      const active = assignedIds.includes(cls.id);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => toggleAssignedClass(cls.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                            active
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-sky-400'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{cls.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-slate-400'}`}>
                            {cls.studentUsernames?.length || 0} HS
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Schedule / Deadline Configuration */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Hẹn Giờ Mở Đề &amp; Hạn Chót Nộp Bài
                </h3>
                <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
                  Chọn khóa hẳn bài khi quá giờ, hoặc cho làm bất kỳ lúc nào (hệ thống luôn ghi nhận ngày giờ bắt đầu, lúc nộp &amp; tổng thời gian làm của từng học viên).
                </p>
              </div>
              {cfg.scheduleMode !== 'flexible' && cfg.dueAt && (
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 shrink-0">
                  Hạn: {formatViDateTime(cfg.dueAt)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'flexible',
                  title: '🕒 Làm khi nào cũng được',
                  desc: 'Mở tự do 24/7, vẫn ghi lại thời gian làm & lúc nộp của từng học viên.'
                },
                {
                  id: 'deadline_lock',
                  title: '🔒 Hẹn giờ - Khóa khi quá giờ',
                  desc: 'Hết giờ quy định hệ thống tự khóa, học viên không vào làm hoặc nộp được nữa.'
                },
                {
                  id: 'deadline_track',
                  title: '⏱️ Hẹn giờ - Quá giờ vẫn cho làm',
                  desc: 'Vượt hạn vẫn cho nộp, nhưng bảng điểm tự đánh dấu nộp muộn (trễ bao nhiêu phút).'
                }
              ].map(opt => {
                const active = cfg.scheduleMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setTestForm(prev => {
                        const defaultDue = prev.dueAt || Date.now() + 24 * 60 * 60 * 1000;
                        return {
                          ...prev,
                          scheduleMode: opt.id,
                          dueAt: opt.id === 'flexible' ? null : defaultDue
                        };
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-[#EDFFFD] dark:bg-teal-950/45 border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#007A7A]/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">{opt.title}</p>
                    <p className="text-xs text-[#475569] dark:text-slate-400 mt-1 leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            {cfg.scheduleMode !== 'flexible' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Hạn Chót Nộp Bài (Ngày &amp; Giờ) *
                  </label>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocalInputValue(cfg.dueAt)}
                    onChange={e =>
                      setTestForm(prev => ({
                        ...prev,
                        dueAt: parseScheduleTimestamp(e.target.value)
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      { label: '+1 giờ', ms: 3_600_000 },
                      { label: '+24 giờ', ms: 86_400_000 },
                      { label: '+3 ngày', ms: 3 * 86_400_000 },
                      { label: '+7 ngày', ms: 7 * 86_400_000 }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setTestForm(prev => ({ ...prev, dueAt: Date.now() + preset.ms }))}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#007A7A] text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Giờ Bắt Đầu Mở Đề (Tùy chọn)
                    </label>
                    {cfg.openAt && (
                      <button
                        type="button"
                        onClick={() => setTestForm(prev => ({ ...prev, openAt: null }))}
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        Mở ngay lập tức
                      </button>
                    )}
                  </div>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocalInputValue(cfg.openAt)}
                    onChange={e =>
                      setTestForm(prev => ({
                        ...prev,
                        openAt: parseScheduleTimestamp(e.target.value)
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                  />
                  <p className="text-xs text-slate-400">
                    {cfg.openAt ? `Học viên sẽ vào làm được từ ${formatViDateTime(cfg.openAt)}.` : 'Bỏ trống để học viên làm được ngay sau khi công khai.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Per-Skill Durations & Sequential Section Order */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Thời Gian Từng Kỹ Năng & Thứ Tự Thi Luân Phiên
                </h3>
                <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                  Đặt số phút riêng cho mỗi kỹ năng (VD: Reading 30p, Listening 15p) và sắp xếp thứ tự làm bài từ trên xuống dưới.
                </p>
              </div>
              <span className="text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full shrink-0">
                Tổng thời gian: {cfg.order.reduce((acc, s) => acc + cfg.durations[s], 0)} phút
              </span>
            </div>

            <div className="space-y-2.5">
              {cfg.order.map((sId, idx) => {
                const meta = skillLabels[sId];
                const IconComp = meta.icon;
                return (
                  <div
                    key={sId}
                    className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <IconComp className={`w-4 h-4 ${meta.color}`} />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">{meta.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={cfg.durations[sId]}
                          onChange={e => {
                            const mins = Math.max(1, Number(e.target.value) || 1);
                            setTestForm(prev => ({
                              ...prev,
                              sectionDurations: { ...normalizeExamConfig(prev).durations, [sId]: mins }
                            }));
                          }}
                          className="w-16 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-extrabold text-center"
                        />
                        <span className="text-xs text-[#475569] dark:text-slate-400 font-semibold">phút</span>
                      </div>

                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-3">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSectionOrder(idx, -1)}
                          title="Đưa lên trước"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === cfg.order.length - 1}
                          onClick={() => moveSectionOrder(idx, 1)}
                          title="Đưa xuống sau"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-100">
                <input
                  type="checkbox"
                  checked={cfg.sequentialMode}
                  onChange={e => setTestForm(prev => ({ ...prev, sequentialMode: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span>Khóa tuần tự theo từng phần (Làm xong kỹ năng này sang kỹ năng khác - không thể quay lại kỹ năng cũ)</span>
              </label>

              {cfg.sequentialMode && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={cfg.allowEarlyNextSection}
                    onChange={e => setTestForm(prev => ({ ...prev, allowEarlyNextSection: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Cho phép chuyển sớm sang phần sau (báo thời gian còn lại &amp; khóa phần cũ)</span>
                </label>
              )}
            </div>
          </div>

          {/* Permission Control Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 dark:from-indigo-950/50 dark:via-slate-800/80 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl ${testForm.allowViewAnswers ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-amber-300'}`}>
                {testForm.allowViewAnswers ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Quyền Xem Đáp Án Đúng Khi Xem Lại Điểm (Dành Cho Học Sinh)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-xl">
                  Khi bật tính năng này, học sinh sau khi nộp bài có thể nhìn thấy đáp án đúng của từng câu Listening, Reading và bài mẫu Writing. Nếu tắt, học sinh chỉ biết câu trả lời của mình là Đúng/Sai còn đáp án đúng sẽ bị khóa.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTestForm(prev => ({ ...prev, allowViewAnswers: !prev.allowViewAnswers }))}
              className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-sm flex-shrink-0 ${
                testForm.allowViewAnswers
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700'
              }`}
            >
              {testForm.allowViewAnswers ? (
                <>
                  <Unlock className="w-4 h-4" /> Đang Bật Cho Phép Xem Đáp Án
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Đang Khóa Đáp Án Với Học Sinh
                </>
              )}
            </button>
          </div>

          {/* Stealth Anti-Cheat Control Card (Hidden from Student UI) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50/70 to-slate-50 dark:from-rose-950/35 dark:via-slate-800/80 dark:to-slate-900 border border-rose-200 dark:border-rose-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`p-3 rounded-2xl ${cfg.antiCheatEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {cfg.antiCheatEnabled ? <ShieldCheck className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                    Chế Độ Chống Gian Lận &amp; Kiểm Tra Extension
                    <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 dark:bg-slate-800 border border-slate-700">
                      Ẩn với học sinh
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-xl">
                    Khi bật, hệ thống đếm số lần rời tab/mất focus, phát hiện mở panel bên hông trình duyệt (từ điển/dịch), khóa DevTools &amp; Extension can thiệp, đồng thời chặn dán văn bản từ bên ngoài (web/ChatGPT/Google Dịch).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTestForm(prev => ({ ...prev, antiCheatEnabled: !cfg.antiCheatEnabled }))}
                className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-sm flex-shrink-0 ${
                  cfg.antiCheatEnabled
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {cfg.antiCheatEnabled ? (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Đang Bật Chống Gian Lận
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" /> Đang Tắt (Luyện Tập Tự Do)
                  </>
                )}
              </button>
            </div>

            {cfg.antiCheatEnabled && (
              <div className="pt-3 border-t border-rose-200/70 dark:border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.allowInternalCopyPaste}
                    onChange={e => setTestForm(prev => ({ ...prev, allowInternalCopyPaste: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-200 leading-snug">
                    <strong>Cho phép Copy/Paste NỘI BỘ trong bài thi</strong> - Học viên có thể Ctrl+C / Ctrl+V văn bản từ chính Đề đọc, Ngữ cảnh, Câu hỏi sang ô trả lời Writing/Fill-blank, nhưng vẫn <strong>CẤM 100%</strong> mọi thao tác dán văn bản copy từ web/app bên ngoài.
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* TAB 2: LISTENING BUILDER (MULTI-TOPIC LIKE READING + AUDIO + IMAGE + CONTEXT + QUESTIONS) */}
      {builderTab === 'listening' && (() => {
        const tracks = getListeningTracks(testForm.listening);
        const activeIdx = Math.min(Math.max(0, builderListeningIdx), tracks.length - 1);
        const activeTrack = tracks[activeIdx];

        const addListeningTrack = () => {
          const nextNum = tracks.length + 1;
          const newTrack = {
            id: `track-${Date.now()}`,
            title: `Chủ đề ${nextNum}: Nội dung mới`,
            audioUrl: '',
            audioFileName: '',
            imageUrl: '',
            imageFileName: '',
            contextText: '',
            transcript: ''
          };
          setTestForm(prev => ({
            ...prev,
            listening: {
              ...prev.listening,
              tracks: [...getListeningTracks(prev.listening), newTrack]
            }
          }));
          setBuilderListeningIdx(tracks.length);
        };

        const removeListeningTrack = (removeIdx) => {
          if (tracks.length <= 1) return;
          const nextTracks = tracks.filter((_, i) => i !== removeIdx);
          const first = nextTracks[0] || {};
          setTestForm(prev => ({
            ...prev,
            listening: {
              ...prev.listening,
              tracks: nextTracks,
              audioUrl: first.audioUrl || '',
              audioFileName: first.audioFileName || '',
              imageUrl: first.imageUrl || '',
              imageFileName: first.imageFileName || '',
              contextText: first.contextText || '',
              transcript: first.transcript || '',
              questions: (prev.listening?.questions || []).map(q => {
                if (typeof q.trackIdx !== 'number') return q;
                if (q.trackIdx === removeIdx) return { ...q, trackIdx: 0 };
                if (q.trackIdx > removeIdx) return { ...q, trackIdx: q.trackIdx - 1 };
                return q;
              })
            }
          }));
          setBuilderListeningIdx(Math.max(0, Math.min(activeIdx, nextTracks.length - 1)));
        };

        return (
        <div className="space-y-6">
          {/* Listening Topics, Audio & Optional Diagram Card (mirroring Reading) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Nội Dung Bài Nghe Listening ({tracks.length} Chủ Đề / Bài)
                </h2>
                <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
                  Mặc định có 1 chủ đề. Bấm &quot;Thêm Chủ Đề&quot; nếu cần chia nhiều chủ đề / file ghi âm đánh số 1, 2, 3... kèm ảnh sơ đồ/đề chụp hoặc đoạn đề dẫn giống phần Reading.
                </p>
              </div>
              <button
                type="button"
                onClick={addListeningTrack}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Thêm Chủ Đề / Bài Nghe #{tracks.length + 1}
              </button>
            </div>

            {/* Numbered Topic Selector Bar (1, 2, 3...) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                {tracks.map((tr, trIdx) => (
                  <button
                    key={tr.id || trIdx}
                    type="button"
                    onClick={() => setBuilderListeningIdx(trIdx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                      trIdx === activeIdx
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-500/15'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-xs font-black flex items-center justify-center ${
                      trIdx === activeIdx ? 'bg-white text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}>
                      {trIdx + 1}
                    </span>
                    <span className="max-w-[160px] truncate">{tr.title || `Chủ đề ${trIdx + 1}`}</span>
                    {tr.audioUrl && <span title="Đã có file audio">🎵</span>}
                    {tr.imageUrl && <span title="Đã có ảnh minh họa">🖼️</span>}
                  </button>
                ))}
              </div>

              {tracks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListeningTrack(activeIdx)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa Chủ Đề #{activeIdx + 1}
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tiêu Đề Chủ Đề / Bài Nghe #{activeIdx + 1}
              </label>
              <input
                type="text"
                value={activeTrack?.title || ''}
                onChange={e => updateListeningTrackField(activeIdx, { title: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder={`VD: Chủ đề ${activeIdx + 1}: Everyday Conversation / Campus Map`}
              />
            </div>

            {/* Audio Upload & URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload File Box */}
              <div className="border-2 border-dashed border-blue-200 dark:border-blue-500/40 bg-blue-50/40 dark:bg-blue-500/10 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Tải File Ghi Âm Chủ Đề #{activeIdx + 1} Từ Máy Tính
                  </span>
                  <p className="text-xs text-[#475569] dark:text-slate-400 mb-4">
                    Hỗ trợ MP3, WAV, OGG, M4A (Tối đa 100MB/file).
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">
                    <Upload className="w-4 h-4" />
                    <span>Chọn File Ghi Âm (.mp3 / .wav)</span>
                    <input
                      key={`audio-upload-${activeIdx}`}
                      type="file"
                      accept="audio/*"
                      onChange={e => handleAudioFileUpload(e, activeIdx)}
                      className="hidden"
                    />
                  </label>

                  {activeTrack?.audioFileName && (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-500/30 text-xs">
                      <span className="font-bold text-blue-800 dark:text-blue-300 truncate">
                        🎵 {activeTrack.audioFileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateListeningTrackField(activeIdx, { audioUrl: '', audioFileName: '' })}
                        className="text-rose-600 dark:text-rose-400 hover:underline font-bold ml-2 shrink-0"
                      >
                        Xóa file
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Audio URL & Preview */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Hoặc Dán Đường Dẫn URL File Audio Chủ Đề #{activeIdx + 1} (.mp3)
                  </label>
                  <input
                    type="text"
                    value={activeTrack?.audioUrl?.startsWith('data:') || activeTrack?.audioUrl?.startsWith('/api/sync/') ? '' : (activeTrack?.audioUrl || '')}
                    onChange={e =>
                      updateListeningTrackField(activeIdx, {
                        audioUrl: e.target.value,
                        audioFileName: e.target.value ? 'External Audio URL' : ''
                      })
                    }
                    placeholder={`https://example.com/ielts-listening-topic-${activeIdx + 1}.mp3`}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {activeTrack?.audioUrl && (
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                      Nghe thử file ghi âm Chủ đề #{activeIdx + 1}:
                    </p>
                    <audio key={`preview-${activeIdx}-${activeTrack.audioUrl.slice(0, 32)}`} controls src={activeTrack.audioUrl} className="w-full h-9" />
                  </div>
                )}
              </div>
            </div>

            {/* Optional Diagram & Context Text Collapsible Drawer */}
            {(() => {
              const hasListeningExtras = Boolean(activeTrack?.imageUrl || activeTrack?.contextText?.trim());
              const isExtrasOpen = hasListeningExtras || showAdvancedListeningExtras;
              return (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedListeningExtras(v => !v)}
                    className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      <Image className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Tùy chọn phụ: Ảnh Sơ Đồ / Bản Đồ &amp; Đề Dẫn Riêng Cho Chủ Đề #{activeIdx + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                        {hasListeningExtras ? 'Đang có dữ liệu' : 'Bỏ qua nếu không có'}
                      </span>
                    </div>
                    {isExtrasOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  {isExtrasOpen && (
                    <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 space-y-5 bg-white/70 dark:bg-slate-900/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/40 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/30">
                        <div className="space-y-3">
                          <span className="text-xs font-extrabold text-blue-950 dark:text-blue-200 uppercase flex items-center gap-1.5">
                            <Image className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Ảnh Sơ Đồ / Map Chủ Đề #{activeIdx + 1}
                          </span>
                          <p className="text-xs text-[#475569] dark:text-slate-400">
                            Chỉ cần tải lên khi bài nghe có hình bản đồ (Map), sơ đồ máy móc (Diagram)...
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">
                              <Upload className="w-4 h-4" />
                              <span>Tải Ảnh Chủ Đề #{activeIdx + 1}</span>
                              <input
                                key={`listening-img-upload-${activeIdx}`}
                                type="file"
                                accept="image/*"
                                onChange={e => handleListeningImageUpload(e, activeIdx)}
                                className="hidden"
                              />
                            </label>

                            {activeTrack?.imageUrl && (
                              <button
                                type="button"
                                onClick={() => updateListeningTrackField(activeIdx, { imageUrl: '', imageFileName: '' })}
                                className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl border border-rose-200 dark:border-rose-500/30 transition"
                              >
                                Xóa Ảnh
                              </button>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                              Hoặc dán Link URL hình ảnh:
                            </label>
                            <input
                              type="text"
                              value={activeTrack?.imageUrl?.startsWith('data:') || activeTrack?.imageUrl?.startsWith('/api/sync/') ? '' : (activeTrack?.imageUrl || '')}
                              onChange={e => updateListeningTrackField(activeIdx, { imageUrl: e.target.value })}
                              placeholder="https://example.com/listening-map.png"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 min-h-[140px]">
                          {activeTrack?.imageUrl ? (
                            <img
                              src={activeTrack.imageUrl}
                              alt={`Listening Preview ${activeIdx + 1}`}
                              onClick={() => setZoomedReadingImg(activeTrack.imageUrl)}
                              className="max-h-44 object-contain rounded-lg cursor-zoom-in"
                            />
                          ) : (
                            <div className="text-center text-xs text-slate-400">
                              <Image className="w-7 h-7 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                              <span>Chưa có hình ảnh cho Chủ đề #{activeIdx + 1}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Văn Bản Đề Dẫn Phụ Cho Chủ Đề #{activeIdx + 1} (Tùy chọn)
                        </label>
                        <textarea
                          rows={3}
                          value={activeTrack?.contextText || ''}
                          onChange={e => updateListeningTrackField(activeIdx, { contextText: e.target.value })}
                          className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed font-serif focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Chỉ điền nếu muốn hiển thị thêm đoạn hướng dẫn dài ở cột trái..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Transcript Box (Clear Standalone Explanation for Teachers without MP3) */}
            <div>
              <label className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Lời Thoại Audio / Transcript Chủ Đề #{activeIdx + 1}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
                  Không có file MP3? Chỉ cần dán đoạn văn vào đây máy tự đọc!
                </span>
              </label>
              <textarea
                rows={4}
                value={activeTrack?.transcript || ''}
                onChange={e => updateListeningTrackField(activeIdx, { transcript: e.target.value })}
                className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder={`Dán lời thoại bài nghe tiếng Anh cho Chủ đề ${activeIdx + 1} tại đây (hoặc bỏ trống nếu đã tải file MP3 ở trên)...`}
              />
            </div>
          </div>

          <SkillQuestionWorkspace
            skill="listening"
            groups={tracks}
            activeIdx={activeIdx}
            activeGroup={activeTrack}
            questions={testForm.listening?.questions || []}
            activeTab={questionTabBySkill.listening}
            onChangeTab={tab => setQuestionTabBySkill(prev => ({ ...prev, listening: tab }))}
            sourceFilter={sourceFilterBySkill.listening}
            onChangeSourceFilter={f => setSourceFilterBySkill(prev => ({ ...prev, listening: f }))}
            filterByGroup={filterListeningByTrack}
            onSetFilterByGroup={setFilterListeningByTrack}
            onAddQuestion={qType => addQuestionToSkill('listening', qType)}
            onUpdateQuestion={(qId, field, value) => updateQuestionInSkill('listening', qId, field, value)}
            onUpdateOption={(qId, optIdx, val) => updateOptionInSkill('listening', qId, optIdx, val)}
            onRemoveQuestion={qId => removeQuestionFromSkill('listening', qId)}
            onChangeClozeText={val => updateListeningTrackField(activeIdx, { clozeText: val })}
            onChangeGroupImage={val => updateListeningTrackField(activeIdx, { imageUrl: val, imageFileName: val ? 'Uploaded Image' : '' })}
            onSyncCloze={() => handleSyncClozeQuestions('listening', 'trackIdx', activeIdx, activeTrack?.clozeText || '')}
            aiApiKey={aiApiKey}
            aiConfigured={aiConfigured}
            setApiTestState={setApiTestState}
            setShowApiKeyModal={setShowApiKeyModal}
            showToast={showToast}
            onApplyQuickAnswerText={txt => handleQuickAnswerKeyText('listening', 'trackIdx', activeIdx, txt)}
            onApplyAiExtraction={(extracted, opts) =>
              handleApplyAiExtraction('listening', 'trackIdx', activeIdx, extracted, opts)
            }
          />
        </div>
        );
      })()}

      {/* TAB 3: READING BUILDER (MULTI-PASSAGE NUMBERED TOPICS + IMAGE UPLOAD + QUESTIONS CRUD) */}
      {builderTab === 'reading' && (() => {
        const passages = getReadingPassages(testForm.reading);
        const activeIdx = Math.min(Math.max(0, builderReadingIdx), passages.length - 1);
        const activePassage = passages[activeIdx];

        const addReadingPassage = () => {
          const nextNum = passages.length + 1;
          const newP = {
            id: `passage-${Date.now()}`,
            title: `Bài ${nextNum}: Chủ đề mới`,
            imageUrl: '',
            imageFileName: '',
            passageText: ''
          };
          setTestForm(prev => ({
            ...prev,
            reading: {
              ...prev.reading,
              passages: [...getReadingPassages(prev.reading), newP]
            }
          }));
          setBuilderReadingIdx(passages.length);
        };

        const removeReadingPassage = (removeIdx) => {
          if (passages.length <= 1) return;
          const nextPassages = passages.filter((_, i) => i !== removeIdx);
          const first = nextPassages[0] || {};
          setTestForm(prev => ({
            ...prev,
            reading: {
              ...prev.reading,
              passages: nextPassages,
              passageTitle: first.title || '',
              passageText: first.passageText || '',
              imageUrl: first.imageUrl || '',
              imageFileName: first.imageFileName || '',
              questions: (prev.reading?.questions || []).map(q => {
                if (typeof q.passageIdx !== 'number') return q;
                if (q.passageIdx === removeIdx) return { ...q, passageIdx: 0 };
                if (q.passageIdx > removeIdx) return { ...q, passageIdx: q.passageIdx - 1 };
                return q;
              })
            }
          }));
          setBuilderReadingIdx(Math.max(0, Math.min(activeIdx, nextPassages.length - 1)));
        };

        return (
        <div className="space-y-6">
          {/* Reading Passage & Image Upload Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" /> Nội Dung Bài Đọc Reading ({passages.length} Chủ Đề / Bài)
                </h2>
                <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
                  Tạo nhiều bài đọc / chủ đề đánh số 1, 2, 3... để học sinh chuyển qua lại dễ dàng khi có nhiều ảnh hoặc nhiều đoạn đọc.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPassageSplitModal(true)}
                  className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
                  title="Tự động phân chia câu hỏi theo số thứ tự vào 3 Passage"
                >
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Chia Nhanh Câu Theo Passage</span>
                </button>
                <button
                  type="button"
                  onClick={addReadingPassage}
                  className="bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Thêm Chủ Đề / Bài Đọc #{passages.length + 1}
                </button>
              </div>
            </div>

            {/* Numbered Passage Selector Bar (1, 2, 3...) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                {passages.map((p, pIdx) => (
                  <button
                    key={p.id || pIdx}
                    type="button"
                    onClick={() => setBuilderReadingIdx(pIdx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                      pIdx === activeIdx
                        ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-xs font-black flex items-center justify-center ${
                      pIdx === activeIdx ? 'bg-white text-[#007A7A]' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}>
                      {pIdx + 1}
                    </span>
                    <span className="max-w-[160px] truncate">{p.title || `Bài đọc ${pIdx + 1}`}</span>
                  </button>
                ))}
              </div>

              {passages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeReadingPassage(activeIdx)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa Bài #{activeIdx + 1}
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tiêu Đề Bài Đọc / Chủ Đề #{activeIdx + 1}
              </label>
              <input
                type="text"
                value={activePassage?.title || ''}
                onChange={e => updateReadingPassageField(activeIdx, { title: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={`VD: Bài ${activeIdx + 1}: The Evolution of Urban Architecture`}
              />
            </div>

            {/* Collapsible Reading Image Upload & URL */}
            {(() => {
              const hasReadingImg = Boolean(activePassage?.imageUrl);
              const isImgOpen = hasReadingImg || showAdvancedReadingImg;
              return (
                <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/30 bg-indigo-50/35 dark:bg-indigo-500/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedReadingImg(v => !v)}
                    className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-indigo-50/80 dark:hover:bg-indigo-500/15 transition"
                  >
                    <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
                      <Image className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Tùy chọn phụ: Ảnh Minh Họa / Đề Chụp Kèm Bài Đọc #{activeIdx + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        {hasReadingImg ? 'Đang có ảnh' : 'Bỏ qua nếu bạn nhập chữ'}
                      </span>
                    </div>
                    {isImgOpen ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-indigo-500" />}
                  </button>

                  {isImgOpen && (
                    <div className="p-4 sm:p-5 border-t border-indigo-100 dark:border-indigo-500/30 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/75 dark:bg-slate-900/50">
                      <div className="space-y-3">
                        <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 uppercase flex items-center gap-1.5">
                          <Image className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Tải Ảnh Kèm Bài #{activeIdx + 1}
                        </span>
                        <p className="text-xs text-[#475569] dark:text-slate-400">
                          Chỉ dùng khi muốn học sinh nhìn ảnh gốc thay cho đoạn chữ. (Nếu muốn AI chép chữ từ ảnh, hãy dùng khung <strong>Tạo Đề Tự Động Từ Ảnh</strong> ngay bên dưới!).
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <label className="cursor-pointer inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">
                            <Upload className="w-4 h-4" />
                            <span>Tải Ảnh Cho Bài #{activeIdx + 1}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleReadingImageUpload(e, activeIdx)}
                              className="hidden"
                            />
                          </label>

                          {activePassage?.imageUrl && (
                            <button
                              type="button"
                              onClick={() => updateReadingPassageField(activeIdx, { imageUrl: '', imageFileName: '' })}
                              className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl border border-rose-200 dark:border-rose-500/30 transition"
                            >
                              Xóa Ảnh
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Hoặc dán Link URL hình ảnh:
                          </label>
                          <input
                            type="text"
                            value={activePassage?.imageUrl?.startsWith('data:') || activePassage?.imageUrl?.startsWith('/api/sync/') ? '' : (activePassage?.imageUrl || '')}
                            onChange={e => updateReadingPassageField(activeIdx, { imageUrl: e.target.value })}
                            placeholder="https://example.com/reading-diagram.png"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 min-h-[140px]">
                        {activePassage?.imageUrl ? (
                          <img
                            src={activePassage.imageUrl}
                            alt={`Reading Preview ${activeIdx + 1}`}
                            onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                            className="max-h-44 object-contain rounded-lg cursor-zoom-in"
                          />
                        ) : (
                          <div className="text-center text-xs text-slate-400">
                            <Image className="w-7 h-7 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                            <span>Chưa có hình ảnh cho Bài #{activeIdx + 1}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Passage Text */}
            <div>
              <label className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Nội Dung Văn Bản Bài Đọc #{activeIdx + 1}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
                  Copy/Dán bài đọc từ Word/PDF hoặc dùng tab Tạo Tự Động (AI Ảnh) bên dưới
                </span>
              </label>
              <textarea
                rows={7}
                value={activePassage?.passageText || ''}
                onChange={e => updateReadingPassageField(activeIdx, { passageText: e.target.value })}
                className="w-full p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs leading-relaxed font-serif focus:ring-2 focus:ring-[#007A7A] focus:outline-none"
                placeholder={`Dán đoạn văn Reading Bài ${activeIdx + 1} tại đây...`}
              />
            </div>
          </div>

          <SkillQuestionWorkspace
            skill="reading"
            groups={passages}
            activeIdx={activeIdx}
            activeGroup={activePassage}
            questions={testForm.reading?.questions || []}
            activeTab={questionTabBySkill.reading}
            onChangeTab={tab => setQuestionTabBySkill(prev => ({ ...prev, reading: tab }))}
            sourceFilter={sourceFilterBySkill.reading}
            onChangeSourceFilter={f => setSourceFilterBySkill(prev => ({ ...prev, reading: f }))}
            filterByGroup={filterReadingByPassage}
            onSetFilterByGroup={setFilterReadingByPassage}
            onAddQuestion={qType => addQuestionToSkill('reading', qType)}
            onUpdateQuestion={(qId, field, value) => updateQuestionInSkill('reading', qId, field, value)}
            onUpdateOption={(qId, optIdx, val) => updateOptionInSkill('reading', qId, optIdx, val)}
            onRemoveQuestion={qId => removeQuestionFromSkill('reading', qId)}
            onChangeClozeText={val => updateReadingPassageField(activeIdx, { clozeText: val })}
            onChangeGroupImage={val => updateReadingPassageField(activeIdx, { imageUrl: val, imageFileName: val ? 'Uploaded Image' : '' })}
            onSyncCloze={() => handleSyncClozeQuestions('reading', 'passageIdx', activeIdx, activePassage?.clozeText || '')}
            aiApiKey={aiApiKey}
            aiConfigured={aiConfigured}
            setApiTestState={setApiTestState}
            setShowApiKeyModal={setShowApiKeyModal}
            showToast={showToast}
            onApplyQuickAnswerText={txt => handleQuickAnswerKeyText('reading', 'passageIdx', activeIdx, txt)}
            onApplyAiExtraction={(extracted, opts) =>
              handleApplyAiExtraction('reading', 'passageIdx', activeIdx, extracted, opts)
            }
            onApplyReadingPdfExtraction={handleApplyReadingPdfExtraction}
            onQuickAllocatePassages={() => setShowPassageSplitModal(true)}
          />
        </div>
        );
      })()}

      {/* TAB 4: WRITING BUILDER (PROMPTS, CHART IMAGE & MODEL ANSWERS) */}
      {builderTab === 'writing' && (() => {
        const wCfg = normalizeExamConfig(testForm);
        const wScope = wCfg.writingTaskScope || 'both';
        return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Task 1 */}
          {wScope !== 'task2' && (
          <div className={`space-y-4 ${wScope === 'both' ? 'pb-6 border-b border-slate-200 dark:border-slate-800' : ''}`}>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Writing Academic Task 1 ( Tối thiểu 150 từ )
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Đề Bài Writing Task 1 (Prompt)</label>
              <textarea
                rows={3}
                value={testForm.writing?.task1?.prompt || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task1: { ...testForm.writing.task1, prompt: e.target.value } }
                  })
                }
                className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Task 1 Chart Image Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Hình Ảnh Biểu Đồ / Bản Đồ Writing Task 1 (Tùy chọn)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải Ảnh Biểu Đồ Task 1</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleWritingTask1ImageUpload}
                      className="hidden"
                    />
                  </label>
                  {testForm.writing?.task1?.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setTestForm(prev => ({
                          ...prev,
                          writing: { ...prev.writing, task1: { ...prev.writing.task1, imageUrl: '' } }
                        }))
                      }
                      className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>

              {testForm.writing?.task1?.imageUrl && (
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-center">
                  <img
                    src={testForm.writing.task1.imageUrl}
                    alt="Task 1 Chart Preview"
                    className="max-h-36 object-contain rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                Bài Mẫu Tham Khảo Task 1 (Hiển thị khi Giáo viên bật cho phép xem đáp án)
              </label>
              <textarea
                rows={4}
                value={testForm.writing?.task1?.modelAnswer || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task1: { ...testForm.writing.task1, modelAnswer: e.target.value } }
                  })
                }
                placeholder="Nhập bài viết mẫu Band 8.0+ cho Task 1..."
                className="w-full p-3.5 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-500/10 text-slate-900 dark:text-slate-100 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          )}

          {/* Task 2 */}
          {wScope !== 'task1' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Writing Academic Task 2 ( Tối thiểu 250 từ )
            </h3>

            {wCfg.testMode === 'single_skill' && wCfg.focusSkill === 'writing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Chủ đề Writing Task 2</span>
                  <select
                    value={testForm.writingTask2Topic || ''}
                    onChange={e => setTestForm(prev => ({ ...prev, writingTask2Topic: e.target.value }))}
                    className="w-full p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Chọn chủ đề</option>
                    {DAILY_WRITING_T2_TOPICS.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Dạng câu hỏi</span>
                  <select
                    value={testForm.writingTask2QuestionType || ''}
                    onChange={e => setTestForm(prev => ({ ...prev, writingTask2QuestionType: e.target.value }))}
                    className="w-full p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Chọn dạng bài</option>
                    {DAILY_WRITING_T2_QUESTION_TYPES.map(questionType => (
                      <option key={questionType.id} value={questionType.id}>{questionType.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Đề Bài Writing Task 2 (Prompt)</label>
              <textarea
                rows={3}
                value={testForm.writing?.task2?.prompt || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task2: { ...testForm.writing.task2, prompt: e.target.value } }
                  })
                }
                className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                Bài Mẫu Tham Khảo Task 2 (Hiển thị khi Giáo viên bật cho phép xem đáp án)
              </label>
              <textarea
                rows={4}
                value={testForm.writing?.task2?.modelAnswer || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task2: { ...testForm.writing.task2, modelAnswer: e.target.value } }
                  })
                }
                placeholder="Nhập bài viết mẫu Band 8.0+ cho Task 2..."
                className="w-full p-3.5 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-500/10 text-slate-900 dark:text-slate-100 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          )}
        </div>
        );
      })()}
      {/* TAB 5: SPEAKING AI BUILDER (PART 1, PART 2 CUE CARD, PART 3) */}
      {builderTab === 'speaking' && (
        <SpeakingBuilderPanel
          aiApiKey={aiApiKey}
          aiConfigured={aiConfigured}
          onChangeSpeaking={nextSp =>
            setTestForm(prev => {
              const normalizedSp = normalizeSpeakingSection(nextSp);
              const pass = String(normalizedSp.roomPassword || '').trim();
              return {
                ...prev,
                ...(normalizedSp.speakingTrack === 'exam_room'
                  ? {
                      examPurpose: 'real_exam',
                      examPassword: pass,
                      hasExamPassword: Boolean(pass || normalizedSp.hasRoomPassword),
                      maxAttempts: prev.maxAttempts > 0 ? prev.maxAttempts : 1
                    }
                  : {
                      examPurpose: prev.visibility === 'private' ? 'draft' : 'free_practice',
                      examPassword: '',
                      hasExamPassword: false
                    }),
                hashtags: normalizedSp.hashtags?.length ? normalizedSp.hashtags : prev.hashtags,
                speaking: normalizedSp
              };
            })
          }
          setApiTestState={setApiTestState}
          setShowApiKeyModal={setShowApiKeyModal}
          showToast={showToast}
          speakingData={testForm.speaking}
        />
      )}

      <QuickPassageSplitModal
        isOpen={showPassageSplitModal}
        onClose={() => setShowPassageSplitModal(false)}
        questions={testForm.reading?.questions || []}
        passages={getReadingPassages(testForm.reading)}
        onApply={handleApplyPassageSplit}
      />
      </div>
    </div>
  );
}
