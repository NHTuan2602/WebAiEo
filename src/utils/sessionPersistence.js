import { normalizeExamConfig } from '../constants/seedData';

const NAV_SESSION_KEY = 'ielts_nav_session_v1';
const EXAM_DRAFT_PREFIX = 'ielts_exam_draft_';
const BUILDER_DRAFT_PREFIX = 'ielts_builder_draft_';

const ALLOWED_VIEWS = new Set([
  'HOME',
  'EXAM_MODE',
  'RESULT_VIEW',
  'TEACHER_DASHBOARD',
  'EXAM_BUILDER',
  'GAME_ARENA',
  'STUDENT_PROFILE'
]);

const TEACHER_ONLY_VIEWS = new Set(['TEACHER_DASHBOARD', 'EXAM_BUILDER']);
const STUDENT_ONLY_VIEWS = new Set(['STUDENT_PROFILE']);

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
    audioPlays: { mainAudio: 0 },
    highlights: [],
    notes: [],
    antiCheatLogs: [],
    tabSwitchCount: 0,
    visitedSkills: [firstSkill],
    listeningTrackIdx: 0,
    showAllListeningQs: false,
    readingPassageIdx: 0,
    showAllReadingQs: false
  };
}

export function loadExamDraft(username, testId, testsList = []) {
  if (!testId) return null;
  try {
    const raw = localStorage.getItem(getExamDraftKey(username, testId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const activeTest = Array.isArray(testsList) ? testsList.find(t => t.id === testId) : null;
    const cfg = normalizeExamConfig(activeTest);
    if (!parsed || typeof parsed !== 'object' || !cfg.order.includes(parsed.skill)) {
      return null;
    }

    const validIdx = Math.max(0, cfg.order.indexOf(parsed.skill));
    const restoredSkill = cfg.order[validIdx];
    const restoredVisited = Array.isArray(parsed.visitedSkills)
      ? Array.from(new Set([...parsed.visitedSkills.filter(s => cfg.order.includes(s)), restoredSkill]))
      : [restoredSkill];

    return {
      skill: restoredSkill,
      sectionIdx: validIdx,
      timeRemaining:
        typeof parsed.timeRemaining === 'number' && parsed.timeRemaining > 0
          ? parsed.timeRemaining
          : (cfg.durations[restoredSkill] || 15) * 60,
      answers: parsed.answers || {},
      audioPlays: parsed.audioPlays || { mainAudio: 0 },
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      antiCheatLogs: Array.isArray(parsed.antiCheatLogs) ? parsed.antiCheatLogs : [],
      tabSwitchCount: Number(parsed.tabSwitchCount) || 0,
      visitedSkills: restoredVisited,
      listeningTrackIdx: Number(parsed.listeningTrackIdx) || 0,
      showAllListeningQs: Boolean(parsed.showAllListeningQs),
      readingPassageIdx: Number(parsed.readingPassageIdx) || 0,
      showAllReadingQs: Boolean(parsed.showAllReadingQs)
    };
  } catch (_err) {
    return null;
  }
}

export function saveExamDraft(username, testId, examState) {
  if (!testId || !examState) return;
  try {
    localStorage.setItem(
      getExamDraftKey(username, testId),
      JSON.stringify({
        ...examState,
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
    if (nextView === 'EXAM_MODE' && !parsed.selectedTestId) {
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
      selectedProfileStudent: user.role === 'teacher' ? null : (parsed.selectedProfileStudent || null),
      resultReviewTab: ['listening', 'reading', 'writing'].includes(parsed.resultReviewTab) ? parsed.resultReviewTab : 'listening',
      teacherHubTab: ['tests', 'grading', 'game_room', 'accounts'].includes(rawTeacherTab) ? rawTeacherTab : 'tests',
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
