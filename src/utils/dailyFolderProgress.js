import { normalizeExamConfig } from '../constants/seedData';

export const getDailyFolderName = test => String(test?.dailyFolderName || '').trim();

export const getDailyFolderKey = test => {
  const cfg = normalizeExamConfig(test);
  const folderName = getDailyFolderName(test);
  if (!folderName) return '';
  return `${cfg.focusSkill}:${cfg.dailySubCategory}:${folderName.normalize('NFKC').toLocaleLowerCase()}`;
};

export const getDailyFolderGroups = (tests = []) => {
  const groupsByKey = new Map();

  (Array.isArray(tests) ? tests : []).forEach(test => {
    const cfg = normalizeExamConfig(test);
    if (
      cfg.testMode !== 'single_skill' ||
      !['reading', 'listening'].includes(cfg.focusSkill) ||
      cfg.visibility === 'private'
    ) {
      return;
    }

    const folderName = getDailyFolderName(test);
    if (!folderName) return;

    const key = getDailyFolderKey(test);
    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, {
        key,
        focusSkill: cfg.focusSkill,
        dailySubCategory: cfg.dailySubCategory,
        folderName,
        tests: []
      });
    }
    groupsByKey.get(key).tests.push(test);
  });

  return Array.from(groupsByKey.values())
    .map(group => ({
      ...group,
      tests: [...group.tests].sort((a, b) => {
        const aDate = Date.parse(a.createdAt || '') || 0;
        const bDate = Date.parse(b.createdAt || '') || 0;
        return aDate - bDate || String(a.title || '').localeCompare(String(b.title || ''));
      })
    }))
    .sort((a, b) =>
      a.focusSkill.localeCompare(b.focusSkill) ||
      a.dailySubCategory.localeCompare(b.dailySubCategory) ||
      a.folderName.localeCompare(b.folderName)
    );
};

const getAttemptScore = (attempt, skill) => {
  const rawValue = attempt?.scores?.[skill]?.raw;
  const totalValue = attempt?.scores?.[skill]?.total;
  return {
    raw: rawValue !== null && rawValue !== undefined && Number.isFinite(Number(rawValue)) ? Number(rawValue) : null,
    total: totalValue !== null && totalValue !== undefined && Number.isFinite(Number(totalValue)) ? Number(totalValue) : null
  };
};

const compareAttemptsForBest = (a, b, skill) => {
  const scoreA = getAttemptScore(a, skill);
  const scoreB = getAttemptScore(b, skill);
  if (scoreA.raw !== scoreB.raw) return (scoreB.raw ?? -1) - (scoreA.raw ?? -1);

  const durationA = Number(a.durationSeconds) > 0 ? Number(a.durationSeconds) : Number.POSITIVE_INFINITY;
  const durationB = Number(b.durationSeconds) > 0 ? Number(b.durationSeconds) : Number.POSITIVE_INFINITY;
  if (durationA !== durationB) return durationA - durationB;

  return (Number(b.submittedAtMs) || 0) - (Number(a.submittedAtMs) || 0);
};

export const getDailyFolderStudentProgress = ({
  group,
  student,
  attempts = [],
  classesDb = {}
}) => {
  const studentUsername = String(student?.username || '').trim();
  const studentClassIds = new Set(
    Object.values(classesDb || {})
      .filter(cls => Array.isArray(cls?.studentUsernames) && cls.studentUsernames.includes(studentUsername))
      .map(cls => String(cls.id || '').trim())
      .filter(Boolean)
  );

  const expectedTests = (group?.tests || []).filter(test => {
    const assignedClassIds = normalizeExamConfig(test).assignedClassIds || [];
    return assignedClassIds.length === 0 || assignedClassIds.some(id => studentClassIds.has(id));
  });

  const testRows = expectedTests.map(test => {
    const matchingAttempts = (Array.isArray(attempts) ? attempts : []).filter(attempt =>
      attempt?.testId === test.id &&
      (attempt.studentId === studentUsername || attempt.studentUsername === studentUsername)
    );
    const bestAttempt = matchingAttempts.sort((a, b) => compareAttemptsForBest(a, b, group.focusSkill))[0] || null;
    const score = bestAttempt ? getAttemptScore(bestAttempt, group.focusSkill) : { raw: null, total: null };
    return { test, attempts: matchingAttempts, attempt: bestAttempt, score };
  });

  const completedRows = testRows.filter(row => row.attempt);
  const scoredRows = completedRows.filter(row => row.score.raw !== null);
  const totalDurationSeconds = completedRows.reduce((sum, row) => {
    const duration = Number(row.attempt?.durationSeconds) || 0;
    return sum + Math.max(0, duration);
  }, 0);

  return {
    student,
    expectedCount: expectedTests.length,
    completedCount: completedRows.length,
    testRows,
    totalCorrect: scoredRows.reduce((sum, row) => sum + row.score.raw, 0),
    totalQuestions: scoredRows.reduce((sum, row) => sum + (row.score.total || 0), 0),
    totalDurationSeconds,
    lastSubmittedAtMs: completedRows.reduce(
      (latest, row) => Math.max(latest, Number(row.attempt?.submittedAtMs) || 0),
      0
    )
  };
};
