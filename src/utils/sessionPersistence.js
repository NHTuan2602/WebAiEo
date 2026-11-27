import { normalizeExamConfig } from '../constants/seedData';

const NAV_SESSION_KEY = 'ielts_nav_session_v1';
const EXAM_DRAFT_PREFIX = 'ielts_exam_draft_';
const BUILDER_DRAFT_PREFIX = 'ielts_builder_draft_';

const ALLOWED_VIEWS = new Set([
  'HOME',
  'SKILL_HUB',
  'SPEAKING_MODE',
  'EXAM_MODE',
  'RESULT_VIEW',
  'TEACHER_DASHBOARD',
  'EXAM_BUILDER',
  'GAME_ARENA',
  'STUDENT_PROFILE'
]);

const TEACHER_ONLY_VIEWS = new Set(['TEACHER_DASHBOARD', 'EXAM_BUILDER']);
const STUDENT_ONLY_VIEWS = new Set([]);

export function getExamDraftKey(username, testId) {
  return `${EXAM_DRAFT_PREFIX}${username || 'guest'}_${testId}`;
}

export function buildInitialExamState(test = null) {
  const cfg = normalizeExamConfig(test);
  const firstSkill = cfg.order[0] || 'listening';
  return {
    skill: firstSkill,
    sectionIdx: 0,
    timeRemaining: (cfg.durations[firstSkill] || 15) * 60,
    answers: {},
    bookmarkedQuestions: {},
    audioPlays: { mainAudio: 0 },
    highlights: [],
    notes: [],
    antiCheatLogs: [],
    tabSwitchCount: 0,
    visitedSkills: [firstSkill],
    listeningTrackIdx: 0,
    showAllListeningQs: false,
    readingPassageIdx: 0,
    showAllReadingQs: false,
    readingQuestionViewMode: false,
    writingTaskIdx: cfg.writingTaskScope === 'task2' ? 1 : 0,
    speakingRecordings: {},
    speakingNotes: {},
    speakingCurrentIdx: 0,
    startedAt: '',
    startedAtMs: null,
    accumulatedSeconds: 0
  };
}

const VALID_EXAM_SKILLS = ['listening', 'reading', 'writing', 'speaking'];

export function loadExamDraft(username, testId, testsList = []) {
  if (!testId) return null;
  try {
    const raw = localStorage.getItem(getExamDraftKey(username, testId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const activeTest = Array.isArray(testsList) ? testsList.find(t => t.id === testId) : null;
    const cfg = normalizeExamConfig(activeTest);
    // When testsList is still hydrating on F5 reload, allow all 4 IELTS skills (including speaking)
    // so a Speaking draft is never discarded and overwritten before tests sync arrives.
    const validOrder = activeTest ? cfg.order : VALID_EXAM_SKILLS;
    if (!parsed || typeof parsed !== 'object' || !validOrder.includes(parsed.skill)) {
      return null;
    }

    const validIdx = activeTest
      ? Math.max(0, cfg.order.indexOf(parsed.skill))
      : Math.max(0, typeof parsed.sectionIdx === 'number' ? parsed.sectionIdx : validOrder.indexOf(parsed.skill));
    const restoredSkill = activeTest ? cfg.order[validIdx] : parsed.skill;
    const restoredVisited = Array.isArray(parsed.visitedSkills)
      ? Array.from(new Set([...parsed.visitedSkills.filter(s => validOrder.includes(s)), restoredSkill]))
      : [restoredSkill];

    return {
      skill: restoredSkill,
      sectionIdx: validIdx,
      timeRemaining:
        typeof parsed.timeRemaining === 'number' && parsed.timeRemaining > 0
          ? parsed.timeRemaining
          : (cfg.durations[restoredSkill] || 15) * 60,
      answers: parsed.answers || {},
      bookmarkedQuestions: parsed.bookmarkedQuestions && typeof parsed.bookmarkedQuestions === 'object' ? parsed.bookmarkedQuestions : {},
      audioPlays: parsed.audioPlays || { mainAudio: 0 },
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      antiCheatLogs: Array.isArray(parsed.antiCheatLogs) ? parsed.antiCheatLogs : [],
      tabSwitchCount: Number(parsed.tabSwitchCount) || 0,
      visitedSkills: restoredVisited,
      listeningTrackIdx: Number(parsed.listeningTrackIdx) || 0,
      showAllListeningQs: Boolean(parsed.showAllListeningQs),
      readingPassageIdx: Number(parsed.readingPassageIdx) || 0,
      showAllReadingQs:
        typeof parsed.showAllReadingQs === 'boolean'
          ? parsed.showAllReadingQs
          : typeof parsed.readingQuestionViewMode === 'boolean'
          ? parsed.readingQuestionViewMode
          : false,
      readingQuestionViewMode:
        typeof parsed.readingQuestionViewMode === 'boolean'
          ? parsed.readingQuestionViewMode
          : typeof parsed.showAllReadingQs === 'boolean'
          ? parsed.showAllReadingQs
          : false,
      writingTaskIdx: Number(parsed.writingTaskIdx) === 1 ? 1 : 0,
      speakingRecordings:
        parsed.speakingRecordings && typeof parsed.speakingRecordings === 'object'
          ? parsed.speakingRecordings
          : {},
      speakingNotes:
        parsed.speakingNotes && typeof parsed.speakingNotes === 'object'
          ? parsed.speakingNotes
          : {},
      speakingCurrentIdx: Math.max(0, Number(parsed.speakingCurrentIdx) || 0),
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : '',
      startedAtMs: Number(parsed.startedAtMs) > 0 ? Number(parsed.startedAtMs) : null,
      accumulatedSeconds: Math.max(0, Number(parsed.accumulatedSeconds) || 0)
    };
  } catch (_err) {
    return null;
  }
}

export function saveExamDraft(username, testId, examState) {
  if (!testId || !examState) return;
  try {
    // Strip non-serializable Blob / ephemeral blob: URLs from speakingRecordings while preserving uploaded audioUrl & metadata
    let cleanSpeakingRecordings = undefined;
    if (examState.speakingRecordings && typeof examState.speakingRecordings === 'object') {
      cleanSpeakingRecordings = {};
      Object.entries(examState.speakingRecordings).forEach(([qId, rec]) => {
        if (!rec || typeof rec !== 'object') return;
        cleanSpeakingRecordings[qId] = {
          questionId: rec.questionId || qId,
          part: rec.part || 1,
          prompt: String(rec.prompt || ''),
          audioUrl: String(rec.audioUrl || ''),
          audioId: String(rec.audioId || ''),
          durationSec: Math.max(0, Number(rec.durationSec) || 0),
          transcript: String(rec.transcript || ''),
          recorded: true,
          savedAt: rec.savedAt || Date.now()
        };
      });
    }
    localStorage.setItem(
      getExamDraftKey(username, testId),
      JSON.stringify({
        ...examState,
        ...(cleanSpeakingRecordings ? { speakingRecordings: cleanSpeakingRecordings } : {}),
        savedAt: Date.now()
      })
    );
  } catch (_err) {}
}

export function clearExamDraft(username, testId) {
  if (!testId) return;
  try {
    localStorage.removeItem(getExamDraftKey(username, testId));
  } catch (_err) {}
}

export function loadNavSession(user) {
  if (!user) {
    return { view: 'AUTH' };
  }
  const defaultView = user.role === 'teacher' ? 'TEACHER_DASHBOARD' : 'HOME';
  try {
    const raw = localStorage.getItem(NAV_SESSION_KEY);
    if (!raw) return { view: defaultView };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.username !== user.username) {
      return { view: defaultView };
    }
    let nextView = ALLOWED_VIEWS.has(parsed.view) ? parsed.view : defaultView;
    if (TEACHER_ONLY_VIEWS.has(nextView) && user.role !== 'teacher') {
      nextView = 'HOME';
    }
    if (STUDENT_ONLY_VIEWS.has(nextView) && user.role === 'teacher') {
      nextView = 'TEACHER_DASHBOARD';
    }
    if ((nextView === 'EXAM_MODE' || nextView === 'SPEAKING_MODE') && !parsed.selectedTestId) {
      nextView = defaultView;
    }
    if (nextView === 'RESULT_VIEW' && !parsed.selectedAttemptId) {
      nextView = defaultView;
    }

    let safeGameSubState = parsed.gameSubState || 'JOIN';
    if (nextView === 'GAME_ARENA') {
      if (safeGameSubState === 'HOST_SPECTATE' && user.role === 'teacher') {
        safeGameSubState = 'HOST_SPECTATE';
      } else if (parsed.joinedRoomPin && ['LOBBY', 'COUNTDOWN', 'PLAYING', 'TRANSITION', 'GAMEOVER'].includes(safeGameSubState)) {
        safeGameSubState = 'LOBBY';
      } else {
        safeGameSubState = 'JOIN';
      }
    }

    let safePreviousView = ALLOWED_VIEWS.has(parsed.previousView) ? parsed.previousView : defaultView;
    if (STUDENT_ONLY_VIEWS.has(safePreviousView) && user.role === 'teacher') {
      safePreviousView = 'TEACHER_DASHBOARD';
    }
    if (TEACHER_ONLY_VIEWS.has(safePreviousView) && user.role !== 'teacher') {
      safePreviousView = 'HOME';
    }

    const rawTeacherTab = parsed.teacherHubTab === 'students' ? 'accounts' : parsed.teacherHubTab;

    return {
      view: nextView,
      previousView: safePreviousView,
      selectedTestId: parsed.selectedTestId || null,
      selectedAttemptId: parsed.selectedAttemptId || null,
      selectedProfileStudent: parsed.selectedProfileStudent || null,
      resultReviewTab: ['listening', 'reading', 'writing', 'speaking'].includes(parsed.resultReviewTab) ? parsed.resultReviewTab : 'listening',
      skillHubTab: ['speaking', 'forecast', 'listening', 'reading', 'writing'].includes(parsed.skillHubTab) ? parsed.skillHubTab : 'speaking',
      speakingPartMode: ['full', 'part1', 'part2', 'part3'].includes(parsed.speakingPartMode) ? parsed.speakingPartMode : 'full',
      teacherHubTab: ['tests', 'skill_exercises', 'grading', 'game_room', 'accounts'].includes(rawTeacherTab) ? rawTeacherTab : 'tests',
      expandedTeacherTestId: parsed.expandedTeacherTestId || null,
      currentRoomPin: parsed.currentRoomPin || '686868',
      joinedRoomPin: parsed.joinedRoomPin || null,
      gameSubState: safeGameSubState
    };
  } catch (_err) {
    return { view: defaultView };
  }
}

export function saveNavSession(username, snapshot) {
  if (!username || !snapshot) return;
  try {
    localStorage.setItem(
      NAV_SESSION_KEY,
      JSON.stringify({
        username,
        ...snapshot,
        updatedAt: Date.now()
      })
    );
  } catch (_err) {}
}

export function clearNavSession() {
  try {
    localStorage.removeItem(NAV_SESSION_KEY);
  } catch (_err) {}
}

export function loadBuilderDraft(username) {
  if (!username) return null;
  try {
    const raw = localStorage.getItem(`${BUILDER_DRAFT_PREFIX}${username}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.testForm) return null;
    return parsed;
  } catch (_err) {
    return null;
  }
}

export function saveBuilderDraft(username, draft) {
  if (!username || !draft?.testForm) return;
  try {
    localStorage.setItem(
      `${BUILDER_DRAFT_PREFIX}${username}`,
      JSON.stringify({
        editingTest: draft.editingTest || null,
        builderTab: draft.builderTab || 'general',
        builderListeningIdx: draft.builderListeningIdx || 0,
        builderReadingIdx: draft.builderReadingIdx || 0,
        testForm: draft.testForm,
        updatedAt: Date.now()
      })
    );
  } catch (_err) {}
}

export function clearBuilderDraft(username) {
  if (!username) return;
  try {
    localStorage.removeItem(`${BUILDER_DRAFT_PREFIX}${username}`);
  } catch (_err) {}
}
