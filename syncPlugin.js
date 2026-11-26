// Built-in Realtime Sync Relay Middleware for Vite Dev & Production Node Server
// Enables cross-browser & cross-device sync (Lobby, Chat, Đua Top Scores, Exams, Avatars).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import QRCode from 'qrcode';
import {
  buildSpeakingExaminerPrompt,
  cleanAudioMimeType,
  inferAudioExtension,
  normalizeSpeakingEvaluation,
  simulateAISpeakingGrading
} from './src/utils/speakingAiEngine.js';
import {
  callGeminiWritingGrader,
  simulateAIWritingGrading
} from './src/utils/geminiGrader.js';
import {
  calculateOverallIeltsBand,
  calculateWritingBand,
  getActiveTeamIds,
  getObjectiveAnswerMaxScore,
  getObjectiveAnswerScore,
  getQuestionCorrectAnswers,
  pickBalancedTeamId,
  roundWholeBand
} from './src/utils/examHelpers.js';
import {
  buildOtpEmailContent,
  formatMailTransportError,
  getEffectiveMailConfig,
  getPublicMailConfigSummary,
  isValidAppsScriptUrl,
  isValidEmailAddress,
  maskEmailAddress,
  sendTransactionalEmail
} from './mailService.js';
import {
  PAID_SHOP_TITLES,
  SKILL_PASS_PRICE_VND,
  DEFAULT_EXAM_PRICE_VND,
  PERIODIC_MOCK_PRICE_VND,
  FRIEND_ROOM_TICKET_PRICE_VND,
  GACHA_WISH_1_PRICE_VND,
  GACHA_WISH_10_PRICE_VND,
  AIEO_VIP_PRICE_VND,
  MIN_DONATE_AMOUNT_VND,
  SUBSCRIPTION_DURATION_MS,
  canCreateFriendRoomNow,
  computeDailyLeaderboardTitleHolders,
  formatVndCurrency,
  getFriendRoomTicketCredits,
  getGachaWishPurchasedCredits,
  getPurchasedExamCount,
  getRealExamComboMeta,
  getRealExamCredits,
  getTestPurchasePriceVnd,
  getTitlePriceVnd,
  getVietnamDateKey,
  hasCustomCoverPermission,
  hasAnimatedAvatarPermission,
  hasGamePracticeAccess,
  hasSkillPracticeAccess,
  hasTestPurchaseAccess,
  hasUnlockedAvatarFrame,
  hasVipFriendRoomAccess,
  isAnimatedDataUrl,
  isStaffOrAdminUser,
  isSyncMediaUrl,
  isWebpBufferAnimated,
  normalizePaymentConfig,
  normalizeVipNameColor,
  normalizeVipNeonCoverColor,
  MAX_AUDIO_UPLOAD_BYTES,
  STATIC_IMAGE_MAX_DATA_URL_LENGTH,
  VIP_ANIMATED_AVATAR_MAX_DATA_URL_LENGTH
} from './src/constants/profileCustomization.js';
import {
  DEFAULT_TESTS,
  DEFAULT_ATTEMPTS,
  DEFAULT_ROOMS,
  DEFAULT_TEACHER_NOTES
} from './src/constants/seedData.js';
import {
  createDefaultSpeakingForecastBank,
  filterSpeakingForecastForViewer,
  normalizeSpeakingForecastBank
} from './src/constants/speakingForecast.js';
import {
  KNIGHT_CHARACTER_SKINS,
  getVietnamMondayWeekState,
  normalizeKnightGachaConfig,
  normalizeKnightRpgProfile
} from './src/constants/knightRpgData.js';
import {
  KNIGHT_PVP_FREEZE_MS,
  KNIGHT_PVP_LIVES_PER_ROUND,
  KNIGHT_PVP_QUESTION_TIMEOUT_MS,
  KNIGHT_PVP_READY_CHECK_SEC,
  KNIGHT_PVP_TOTAL_ROUNDS,
  getKnightPvpRankTier,
  normalizeKnightPvpProfile,
  pickDemonRouletteSector,
  pickScaledNpcForRp
} from './src/constants/knightPvpData.js';

const VALID_PAYMENT_ITEM_TYPES = new Set([
  'cover',
  'title',
  'test',
  'skill_pass',
  'aieo_vip',
  'room_ticket',
  'gacha_wish_1',
  'gacha_wish_10',
  'donate',
  'real_exam_combo_3',
  'real_exam_combo_5',
  'real_exam_combo_8',
  'real_exam_combo_10'
]);

function parseStrictVndInt(rawVal) {
  if (typeof rawVal === 'boolean' || rawVal === null || rawVal === undefined || rawVal === '') return NaN;
  const num = typeof rawVal === 'number' ? rawVal : Number(String(rawVal).trim());
  if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) return NaN;
  return num;
}

function captureUserBalanceSnapshot(user) {
  if (!user || typeof user !== 'object') {
    return {
      realExamCredits: 0,
      roomCreateCredits: 0,
      gachaWishCredits: 0,
      totalPurchasedExams: 0,
      aieoVipActive: false,
      skillPassActive: false,
      customCoverActive: false
    };
  }
  const now = Date.now();
  return {
    realExamCredits: getRealExamCredits(user),
    roomCreateCredits: getFriendRoomTicketCredits(user),
    gachaWishCredits: getGachaWishPurchasedCredits(user),
    totalPurchasedExams: getPurchasedExamCount(user),
    aieoVipActive: Number(user.aieoVipExpiresAt) > now,
    skillPassActive: Number(user.skillPracticeExpiresAt) > now,
    customCoverActive: hasCustomCoverPermission(user)
  };
}

function sanitizeClientKnightRpgUpdate(
  prevRpgRaw,
  incomingRpgRaw,
  userRecord,
  { isSuperAdmin = false, isTeacher = false, allowMatchLoot = false, allowGoldGain = false } = {}
) {
  const nowMs = Date.now();
  const prev = normalizeKnightRpgProfile(prevRpgRaw || {}, nowMs);
  const next = normalizeKnightRpgProfile({ ...(prevRpgRaw || {}), ...(incomingRpgRaw || {}) }, nowMs);
  if (isSuperAdmin) {
    return next;
  }

  // Wishes are strictly server-authoritative: client cannot mint wishes beyond server gachaWishCredits
  const serverWishCredits = getGachaWishPurchasedCredits(userRecord);
  const prevClaimed = Math.max(0, Math.floor(Number(prev.claimedServerWishCredits) || 0));
  const unclaimedCredits = Math.max(0, serverWishCredits - prevClaimed);
  const maxAllowedWishes = Math.max(0, (Number(prev.wishes) || 0) + unclaimedCredits);
  next.wishes = Math.max(0, Math.min(next.wishes, maxAllowedWishes));
  next.claimedServerWishCredits = Math.min(
    Math.max(prevClaimed, next.claimedServerWishCredits),
    serverWishCredits
  );
  next.firstGameGiftClaimed = Boolean(
    prev.firstGameGiftClaimed || userRecord?.starterFirstGameGiftClaimed
  );

  // Non-SuperAdmin cannot unlock new Gacha heroes/weapons unless totalPulls increased
  const prevTotalPulls = Math.max(0, Number(prev.gachaState?.totalPulls) || 0);
  const nextTotalPulls = Math.max(prevTotalPulls, Number(next.gachaState?.totalPulls) || 0);
  const pullsDelta = Math.max(0, nextTotalPulls - prevTotalPulls);
  if (pullsDelta === 0 && prevRpgRaw && typeof prevRpgRaw === 'object') {
    next.unlockedSkins = prev.unlockedSkins;
    next.unlockedWeapons = prev.unlockedWeapons;
    next.weaponCounts = prev.weaponCounts;
    if (!prev.unlockedSkins.includes(next.equippedSkin)) {
      next.equippedSkin = prev.equippedSkin || 'holy_paladin';
    }
    if (next.equippedWeapon && !prev.unlockedWeapons.includes(next.equippedWeapon)) {
      next.equippedWeapon = prev.equippedWeapon || '';
    }
  }

  const maxGoldDelta = isTeacher
    ? 300_000
    : (allowMatchLoot ? 25_000 : allowGoldGain ? 2_500 : 0) + pullsDelta * 200_000;
  next.gold = Math.max(0, Math.min(next.gold, (Number(prev.gold) || 0) + maxGoldDelta));

  const maxKeyDelta = isTeacher ? 50 : (allowMatchLoot ? 15 : 0);
  next.keys = Math.max(0, Math.min(next.keys, (Number(prev.keys) || 0) + maxKeyDelta));
  next.keysCollected = Math.max(
    Number(prev.keysCollected) || 0,
    Math.min(next.keysCollected, (Number(prev.keysCollected) || 0) + maxKeyDelta)
  );

  const maxDemonDelta = allowMatchLoot ? 1 : 0;
  next.demonKingsSlain = Math.max(
    Number(prev.demonKingsSlain) || 0,
    Math.min(next.demonKingsSlain, (Number(prev.demonKingsSlain) || 0) + maxDemonDelta)
  );
  next.dragonsSlain = Math.max(
    Number(prev.dragonsSlain) || 0,
    Math.min(next.dragonsSlain, (Number(prev.dragonsSlain) || 0) + (allowMatchLoot ? 5 : 0))
  );
  next.monstersSlain = Math.max(
    Number(prev.monstersSlain) || 0,
    Math.min(next.monstersSlain, (Number(prev.monstersSlain) || 0) + (allowMatchLoot ? 200 : 0))
  );

  return next;
}

function sanitizeTestPayloadForStore(rawTest = {}) {
  const cleanTitle = String(rawTest.title || '').trim().slice(0, 260) || 'Đề luyện IELTS';
  const rawPrice = Number(rawTest.priceVnd);
  const safePrice =
    rawTest.testMode === 'single_skill'
      ? 0
      : Number.isFinite(rawPrice)
      ? Math.max(0, Math.min(5_000_000, Math.round(rawPrice)))
      : undefined;
  const rawMaxAtt = Number(rawTest.maxAttempts);
  const safeMaxAttempts = Number.isFinite(rawMaxAtt)
    ? Math.max(0, Math.min(100, Math.round(rawMaxAtt)))
    : rawTest.maxAttempts;
  let safeDurations = rawTest.sectionDurations;
  if (rawTest.sectionDurations && typeof rawTest.sectionDurations === 'object') {
    safeDurations = { ...rawTest.sectionDurations };
    ['listening', 'reading', 'writing', 'speaking'].forEach(sk => {
      if (safeDurations[sk] !== undefined) {
        const d = Number(safeDurations[sk]);
        safeDurations[sk] = Number.isFinite(d) ? Math.max(1, Math.min(180, Math.round(d))) : 15;
      }
    });
  }
  return {
    ...rawTest,
    title: cleanTitle,
    ...(safePrice !== undefined ? { priceVnd: safePrice } : {}),
    ...(safeMaxAttempts !== undefined ? { maxAttempts: safeMaxAttempts } : {}),
    ...(safeDurations ? { sectionDurations: safeDurations } : {})
  };
}

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_VERIFY_ATTEMPTS = 5;
const PROTECTED_CREDENTIALS_VERSION = 1;
const IS_VITE_STATIC_COMMAND = process.argv.some(arg => ['build', 'preview'].includes(String(arg).toLowerCase()));
const IS_PRODUCTION_SERVER_PROCESS = /(?:^|[\\/])server\.js$/i.test(String(process.argv[1] || ''));
const REQUIRES_BOOTSTRAP_CREDENTIALS = !IS_VITE_STATIC_COMMAND
  && (process.env.NODE_ENV === 'production' || IS_PRODUCTION_SERVER_PROCESS);

function hashOtpSecret(code, secret) {
  return crypto.createHmac('sha256', String(secret || 'otp')).update(String(code || '')).digest('hex');
}

function timingSafeHexMatch(hexA, hexB) {
  try {
    const a = Buffer.from(String(hexA || ''), 'hex');
    const b = Buffer.from(String(hexB || ''), 'hex');
    return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function timingSafeStringMatch(strA, strB) {
  try {
    const a = crypto.createHash('sha256').update(String(strA || '')).digest();
    const b = crypto.createHash('sha256').update(String(strB || '')).digest();
    return Boolean(strA) && Boolean(strB) && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function sortObjDataByKey(object) {
  if (object === null || typeof object !== 'object') return object;
  if (Array.isArray(object)) return object.map(sortObjDataByKey);
  return Object.keys(object)
    .sort()
    .reduce((acc, k) => {
      acc[k] = sortObjDataByKey(object[k]);
      return acc;
    }, {});
}

function verifyPayosWebhookSignature(dataObj, signatureHex, checksumKey) {
  if (!dataObj || typeof dataObj !== 'object' || !signatureHex || !checksumKey) return false;
  const sorted = sortObjDataByKey(dataObj);
  const queryStr = Object.keys(sorted)
    .filter(k => sorted[k] !== undefined)
    .map(k => {
      let val = sorted[k];
      if (val === null || val === undefined || val === 'null' || val === 'undefined') val = '';
      else if (typeof val === 'object') val = JSON.stringify(val);
      return `${k}=${val}`;
    })
    .join('&');
  const expected = crypto.createHmac('sha256', String(checksumKey)).update(queryStr).digest('hex');
  return timingSafeHexMatch(expected, String(signatureHex).trim().toLowerCase());
}

function maskSecretHint(secret = '') {
  const raw = String(secret || '').trim();
  if (!raw) return '';
  if (raw.length <= 10) return '••••••••';
  return `${raw.slice(0, 4)}••••••••${raw.slice(-4)}`;
}

function getEffectivePaymentSecrets(store) {
  const sec = store?.paymentSecrets && typeof store.paymentSecrets === 'object' ? store.paymentSecrets : {};
  return {
    sepayApiKey: String(sec.sepayApiKey || process.env.SEPAY_API_KEY || '').trim(),
    payosClientId: String(sec.payosClientId || process.env.PAYOS_CLIENT_ID || '').trim(),
    payosApiKey: String(sec.payosApiKey || process.env.PAYOS_API_KEY || '').trim(),
    payosChecksumKey: String(sec.payosChecksumKey || process.env.PAYOS_CHECKSUM_KEY || '').trim()
  };
}

function getPublicPaymentConfigSummary(store) {
  const cfg = normalizePaymentConfig(store?.paymentConfig || {});
  const secrets = getEffectivePaymentSecrets(store);
  const hasSepayApiKey = Boolean(secrets.sepayApiKey);
  const hasPayosClientId = Boolean(secrets.payosClientId);
  const hasPayosApiKey = Boolean(secrets.payosApiKey);
  const hasPayosChecksumKey = Boolean(secrets.payosChecksumKey);
  const hasPayosFull = Boolean(hasPayosClientId && hasPayosApiKey && hasPayosChecksumKey);
  return {
    ...cfg,
    qrReady: Boolean(cfg.customQrUrl || (cfg.bankCode && cfg.accountNumber) || hasPayosFull),
    hasSepayApiKey,
    hasPayosClientId,
    hasPayosApiKey,
    hasPayosChecksumKey,
    hasPayosFull,
    autoVerifyEnabled: Boolean(hasSepayApiKey || hasPayosFull || hasPayosChecksumKey)
  };
}

function getAdminPaymentConfigSummary(store) {
  const base = getPublicPaymentConfigSummary(store);
  const secrets = getEffectivePaymentSecrets(store);
  return {
    ...base,
    sepayApiKeyMasked: maskSecretHint(secrets.sepayApiKey),
    payosClientId: secrets.payosClientId,
    payosApiKeyMasked: maskSecretHint(secrets.payosApiKey),
    payosChecksumKeyMasked: maskSecretHint(secrets.payosChecksumKey)
  };
}

function resolveRequestOrigin(req) {
  const rawHost = String(req?.headers?.['x-forwarded-host'] || req?.headers?.host || '').split(',')[0].trim();
  if (!rawHost || !/^[a-z0-9.-]+(?::\d+)?$/i.test(rawHost)) {
    return 'https://luyenthiieltsnhatrang.up.railway.app';
  }
  const rawProto = String(req?.headers?.['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(rawHost);
  const proto = rawProto === 'http' || rawProto === 'https' ? rawProto : (isLocal ? 'http' : 'https');
  return `${proto}://${rawHost}`;
}

async function createPayosPaymentRequest({ order, originUrl, secrets }) {
  const amount = Math.round(Number(order?.amount) || 0);
  const orderCode = Number(order?.numericOrderCode) || 0;
  const description = String(order?.orderCode || `MKN${orderCode}`).replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 25);
  const returnUrl = `${originUrl}/?payos=success&order=${encodeURIComponent(order.orderCode)}`;
  const cancelUrl = `${originUrl}/?payos=cancel&order=${encodeURIComponent(order.orderCode)}`;
  const sigStr = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  const signature = crypto.createHmac('sha256', String(secrets.payosChecksumKey)).update(sigStr).digest('hex');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': secrets.payosClientId,
        'x-api-key': secrets.payosApiKey
      },
      body: JSON.stringify({
        orderCode,
        amount,
        description,
        cancelUrl,
        returnUrl,
        expiredAt: Math.floor((Number(order.expiresAt) || Date.now() + 30 * 60 * 1000) / 1000),
        signature
      }),
      signal: controller.signal
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.code !== '00' || !json.data?.qrCode) {
      const err = new Error(json?.desc || json?.message || `PayOS HTTP ${res.status}`);
      err.payosCode = String(json?.code || res.status);
      throw err;
    }
    const qrDataUrl = await QRCode.toDataURL(String(json.data.qrCode), { width: 520, margin: 2 });
    return {
      payosPaymentLinkId: String(json.data.paymentLinkId || ''),
      payosCheckoutUrl: String(json.data.checkoutUrl || ''),
      payosQrCode: String(json.data.qrCode || ''),
      payosQrDataUrl: qrDataUrl,
      payosBin: String(json.data.bin || ''),
      payosAccountNumber: String(json.data.accountNumber || ''),
      payosAccountName: String(json.data.accountName || ''),
      payosDescription: String(json.data.description || description)
    };
  } finally {
    clearTimeout(timer);
  }
}

async function confirmPayosWebhookOnGateway({ webhookUrl, secrets }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://api-merchant.payos.vn/confirm-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': secrets.payosClientId,
        'x-api-key': secrets.payosApiKey
      },
      body: JSON.stringify({ webhookUrl }),
      signal: controller.signal
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || (json?.code && json.code !== '00')) {
      throw new Error(json?.desc || json?.message || `PayOS trả mã HTTP ${res.status}`);
    }
    return json || { code: '00', desc: 'Ok' };
  } finally {
    clearTimeout(timer);
  }
}

function getOtpMap(store) {
  if (!store._otpChallenges || !(store._otpChallenges instanceof Map)) {
    store._otpChallenges = new Map();
  }
  const now = Date.now();
  if (store._otpChallenges.size > 200) {
    for (const [k, rec] of store._otpChallenges.entries()) {
      if (!rec || rec.expiresAt <= now) store._otpChallenges.delete(k);
    }
  }
  return store._otpChallenges;
}

export const LOBBY_CHAT_RESET_MS = 10 * 60 * 1000;
const SUPER_ADMIN_USERNAME = 'tuanpro123s';
const SUPER_ADMIN_BOOTSTRAP_PASS = String(process.env.SUPER_ADMIN_PASS || '').trim();
const SUPER_ADMIN_DEFAULT_PASS = SUPER_ADMIN_BOOTSTRAP_PASS || '0938899046';
const DEFAULT_TEACHER_USERNAME = 'teacher_ielts';
const TEACHER_BOOTSTRAP_PASS = String(process.env.TEACHER_DEFAULT_PASS || '').trim();
const DEFAULT_TEACHER_PASS = TEACHER_BOOTSTRAP_PASS || '123456';
const SESSION_COOKIE_NAME = 'ielts_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 15;
const MAX_SYNC_ACTION_BODY_BYTES = 32 * 1024 * 1024;
const ALLOWED_AUDIO_MIMES = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/mp3', 'audio/x-mpeg-3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/vnd.wave', 'audio/aac', 'audio/x-m4a', 'audio/flac']);

const GEMINI_AUDIO_PREFERRED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.5-pro'
];

const SERVER_TRANSIENT_GEMINI_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const sleepMsServer = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const LISTENING_40_THRESHOLDS = [
  [39, 9.0], [37, 8.5], [35, 8.0], [32, 7.5], [30, 7.0],
  [26, 6.5], [23, 6.0], [18, 5.5], [16, 5.0], [13, 4.5],
  [10, 4.0], [6, 3.5], [4, 3.0], [2, 2.0], [1, 1.0]
];

const ACADEMIC_READING_40_THRESHOLDS = [
  [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5], [30, 7.0],
  [27, 6.5], [23, 6.0], [19, 5.5], [15, 5.0], [13, 4.5],
  [10, 4.0], [8, 3.5], [6, 3.0], [4, 2.5], [2, 2.0], [1, 1.0]
];

function hashPassword(rawPassword) {
  const clean = String(rawPassword ?? '');
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(clean, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(rawPassword, userRecord) {
  if (!userRecord || typeof userRecord !== 'object') return false;
  const candidate = String(rawPassword ?? '');
  if (typeof userRecord.passwordHash === 'string' && userRecord.passwordHash.startsWith('scrypt$')) {
    const parts = userRecord.passwordHash.split('$');
    if (parts.length !== 3) return false;
    try {
      const salt = parts[1];
      const expectedBuf = Buffer.from(parts[2], 'hex');
      const actualBuf = crypto.scryptSync(candidate, salt, 64);
      return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
      return false;
    }
  }
  if (typeof userRecord.pass === 'string' && userRecord.pass.length > 0) {
    const a = Buffer.from(candidate);
    const b = Buffer.from(userRecord.pass);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  return false;
}

function verifyPasswordAsync(rawPassword, userRecord) {
  if (!userRecord || typeof userRecord !== 'object') return Promise.resolve(false);
  const candidate = String(rawPassword ?? '');
  if (typeof userRecord.passwordHash === 'string' && userRecord.passwordHash.startsWith('scrypt$')) {
    const parts = userRecord.passwordHash.split('$');
    if (parts.length !== 3) return Promise.resolve(false);
    return new Promise(resolve => {
      try {
        const salt = parts[1];
        const expectedBuf = Buffer.from(parts[2], 'hex');
        crypto.scrypt(candidate, salt, 64, (err, actualBuf) => {
          if (err || !actualBuf) return resolve(false);
          try {
            resolve(expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf));
          } catch {
            resolve(false);
          }
        });
      } catch {
        resolve(false);
      }
    });
  }
  return Promise.resolve(verifyPassword(candidate, userRecord));
}

function signToken(payloadObj, secret) {
  const encoded = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || !secret || typeof token !== 'string') return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (parsed?.exp && Date.now() > Number(parsed.exp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const out = {};
  const raw = String(req?.headers?.cookie || '');
  if (!raw) return out;
  raw.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx <= 0) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) {
      try {
        out[k] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    }
  });
  return out;
}

/** Normalize account handles consistently (strip leading @, collapse spaces). */
function normalizeUsernameKey(raw = '') {
  return String(raw || '').trim().replace(/^@+/, '').replace(/\s+/g, '_');
}

/** Resolve the canonical key in `store.users` ignoring leading `@` and casing. */
function findUserKeyInStore(store, rawUsername = '') {
  const normalized = normalizeUsernameKey(rawUsername);
  if (!normalized || !store?.users || typeof store.users !== 'object') return null;
  if (store.users[normalized]) return normalized;
  const rawTrimmed = String(rawUsername || '').trim();
  if (rawTrimmed && store.users[rawTrimmed]) return rawTrimmed;
  const lower = normalized.toLowerCase();
  return Object.keys(store.users).find(k => normalizeUsernameKey(k).toLowerCase() === lower) || null;
}

function resolveSessionPayload(req, store) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token || !store?._authSecret) return null;
  const payload = verifyToken(token, store._authSecret);
  return payload?.username ? payload : null;
}

function resolveSessionUser(req, store) {
  const payload = resolveSessionPayload(req, store);
  if (!payload) return null;
  const matchedKey = findUserKeyInStore(store, payload.username);
  const user = matchedKey ? store.users[matchedKey] : null;
  if (!user) return null;
  if ((user.tokenVersion || 1) !== (payload.tokenVersion || 1)) return null;
  return user;
}

function buildSessionCookieHeader(req, tokenValue, maxAgeSec) {
  const isHttps = Boolean(
    req?.socket?.encrypted ||
    String(req?.headers?.['x-forwarded-proto'] || '').toLowerCase().includes('https')
  );
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(tokenValue)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`
  ];
  if (isHttps) parts.push('Secure');
  return parts.join('; ');
}

function ensureProtectedAccounts(store) {
  let changed = false;
  if (!store._authSecret || typeof store._authSecret !== 'string') {
    store._authSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
    changed = true;
  }
  if (!store.users || typeof store.users !== 'object') {
    store.users = {};
  }
  Object.entries(store.users).forEach(([uname, u]) => {
    if (!u || typeof u !== 'object') return;
    if ('pass' in u) {
      delete u.pass;
      changed = true;
    }
    if (!u.tokenVersion) {
      u.tokenVersion = 1;
    }
    if (uname !== SUPER_ADMIN_USERNAME && (u.isSuperAdmin || u.hiddenFromTeacher)) {
      delete u.isSuperAdmin;
      delete u.hiddenFromTeacher;
      changed = true;
    }
    if (uname === 'teacher_ielts' && (!u.avatarUrl || u.avatarUrl === '/brand-avatar.jpg')) {
      u.avatarUrl = '/brand-avatar.jpg?v=2';
      changed = true;
    }
    if (
      Number(u.aieoVipExpiresAt) > Date.now() &&
      !u.vipEffectsCustomizedAt &&
      (u.vipRedNameEnabled === false || u.vipTagEnabled === false || u.vipNeonCoverEnabled === false)
    ) {
      u.vipRedNameEnabled = true;
      u.vipTagEnabled = true;
      u.vipNeonCoverEnabled = true;
      changed = true;
    }
  });

  if (Array.isArray(store.deletedUserIds) && store.deletedUserIds.includes(SUPER_ADMIN_USERNAME)) {
    store.deletedUserIds = store.deletedUserIds.filter(id => id !== SUPER_ADMIN_USERNAME);
    changed = true;
  }

  const existingSuper = store.users[SUPER_ADMIN_USERNAME];
  const existingDefaultTeacher = store.users[DEFAULT_TEACHER_USERNAME];
  const needsCredentialMigration = Number(store._protectedCredentialsVersion) < PROTECTED_CREDENTIALS_VERSION;
  if (needsCredentialMigration) {
    if (existingSuper && SUPER_ADMIN_BOOTSTRAP_PASS) {
      existingSuper.passwordHash = hashPassword(SUPER_ADMIN_BOOTSTRAP_PASS);
      existingSuper.tokenVersion = (Number(existingSuper.tokenVersion) || 1) + 1;
      changed = true;
    }
    if (existingDefaultTeacher && TEACHER_BOOTSTRAP_PASS) {
      existingDefaultTeacher.passwordHash = hashPassword(TEACHER_BOOTSTRAP_PASS);
      existingDefaultTeacher.tokenVersion = (Number(existingDefaultTeacher.tokenVersion) || 1) + 1;
      changed = true;
    }
    store._protectedCredentialsVersion = PROTECTED_CREDENTIALS_VERSION;
    changed = true;
  }
  if (!existingSuper) {
    store.users[SUPER_ADMIN_USERNAME] = {
      username: SUPER_ADMIN_USERNAME,
      name: 'Quản Trị Hệ Thống',
      role: 'teacher',
      isSuperAdmin: true,
      hiddenFromTeacher: true,
      targetBand: 9.0,
      joinedDate: '2026-01-01',
      tokenVersion: 1,
      passwordHash: hashPassword(SUPER_ADMIN_DEFAULT_PASS)
    };
    changed = true;
  } else {
    if (!existingSuper.passwordHash) {
      existingSuper.passwordHash = hashPassword(SUPER_ADMIN_DEFAULT_PASS);
      changed = true;
    }
    if (!existingSuper.isSuperAdmin || !existingSuper.hiddenFromTeacher || existingSuper.role !== 'teacher') {
      existingSuper.role = 'teacher';
      existingSuper.isSuperAdmin = true;
      existingSuper.hiddenFromTeacher = true;
      changed = true;
    }
  }

  // Ensure a usable default teacher account always exists unless intentionally replaced by another teacher
  const hasAnyRegularTeacher = Object.values(store.users).some(
    u => u && u.role === 'teacher' && !u.isSuperAdmin && u.username !== SUPER_ADMIN_USERNAME && Boolean(u.passwordHash)
  );
  const currentDefaultTeacher = store.users[DEFAULT_TEACHER_USERNAME];
  if (!currentDefaultTeacher && !hasAnyRegularTeacher && !(store.deletedUserIds || []).includes(DEFAULT_TEACHER_USERNAME)) {
    store.users[DEFAULT_TEACHER_USERNAME] = {
      username: DEFAULT_TEACHER_USERNAME,
      name: 'Ms. Như — IELTS Nha Trang',
      role: 'teacher',
      targetBand: 9.0,
      joinedDate: '2026-01-01',
      avatarUrl: '/brand-avatar.jpg?v=2',
      tokenVersion: 1,
      passwordHash: hashPassword(DEFAULT_TEACHER_PASS)
    };
    changed = true;
  } else if (currentDefaultTeacher && !currentDefaultTeacher.passwordHash) {
    currentDefaultTeacher.passwordHash = hashPassword(DEFAULT_TEACHER_PASS);
    currentDefaultTeacher.tokenVersion = currentDefaultTeacher.tokenVersion || 1;
    changed = true;
  }
  return changed;
}

function getClientIp(req) {
  const xff = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req?.socket?.remoteAddress || 'local';
}

function checkRateLimit(bucketMap, key, limit = LOGIN_MAX_ATTEMPTS, windowMs = LOGIN_RATE_WINDOW_MS) {
  const now = Date.now();
  if (bucketMap.size > 500) {
    for (const [k, rec] of bucketMap.entries()) {
      if (now - rec.start > windowMs) bucketMap.delete(k);
    }
  }
  const existing = bucketMap.get(key);
  if (!existing || now - existing.start > windowMs) {
    bucketMap.set(key, { count: 1, start: now });
    return true;
  }
  if (existing.count >= limit) {
    return false;
  }
  existing.count += 1;
  return true;
}

function getLocalDateKeyVi(ts = Date.now()) {
  const num = Number(ts) || Date.now();
  return new Date(num + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function mergeLoginDays(existing, incoming) {
  const validPattern = /^\d{4}-\d{2}-\d{2}$/;
  const set = new Set();
  (Array.isArray(existing) ? existing : []).forEach(d => {
    const s = String(d || '').trim();
    if (validPattern.test(s)) set.add(s);
  });
  (Array.isArray(incoming) ? incoming : []).forEach(d => {
    const s = String(d || '').trim();
    if (validPattern.test(s)) set.add(s);
  });
  return Array.from(set).sort().slice(-1500);
}

function recordUserLoginDay(store, user, ts = Date.now()) {
  if (!store || !user || !user.username) return false;
  const target = store.users?.[user.username] || user;
  const dateKey = getLocalDateKeyVi(ts);
  const existing = Array.isArray(target.loginDays) ? target.loginDays : [];
  if (existing.includes(dateKey)) return false;
  target.loginDays = mergeLoginDays(existing, [dateKey]);
  store._localMutated = true;
  return true;
}

function mergeAcknowledgedTitleIds(existing, incoming) {
  if (!Array.isArray(existing) && !Array.isArray(incoming)) return undefined;
  const set = new Set();
  const validId = /^[a-z0-9_@-]{1,64}$/i;
  (Array.isArray(existing) ? existing : []).forEach(id => {
    const clean = String(id || '').trim();
    if (validId.test(clean)) set.add(clean);
  });
  (Array.isArray(incoming) ? incoming : []).forEach(id => {
    const clean = String(id || '').trim();
    if (validId.test(clean)) set.add(clean);
  });
  const arr = Array.from(set);
  return arr.length > 250 ? arr.slice(arr.length - 250) : arr;
}

function parseScheduleTimestampServer(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) && val > 0 ? val : null;
  }
  const str = String(val).trim();
  if (!str) return null;
  const num = Number(str);
  if (Number.isFinite(num) && num > 0) return num;
  const parsed = Date.parse(str);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatViDateTimeServer(tsMs) {
  const num = parseScheduleTimestampServer(tsMs);
  if (!num) return '';
  const d = new Date(num + 7 * 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function computeTestTimelinessServer(testObj, submittedAtMs) {
  const scheduleMode = ['deadline_lock', 'deadline_track', 'flexible'].includes(testObj?.scheduleMode)
    ? testObj.scheduleMode
    : 'flexible';
  const dueAt = parseScheduleTimestampServer(testObj?.dueAt);
  if (scheduleMode === 'flexible' || !dueAt) {
    return { timelinessStatus: 'flexible', lateByMinutes: 0, dueAtSnapshot: dueAt || null, scheduleModeSnapshot: scheduleMode };
  }
  const diffMs = submittedAtMs - dueAt;
  if (diffMs > 0) {
    return {
      timelinessStatus: 'late',
      lateByMinutes: Math.max(1, Math.round(diffMs / 60_000)),
      dueAtSnapshot: dueAt,
      scheduleModeSnapshot: scheduleMode
    };
  }
  return {
    timelinessStatus: 'on_time',
    lateByMinutes: 0,
    dueAtSnapshot: dueAt,
    scheduleModeSnapshot: scheduleMode
  };
}

function sanitizeUserForViewer(user, viewer) {
  if (!user || typeof user !== 'object') return null;
  if ((user.isSuperAdmin || user.hiddenFromTeacher || user.username === SUPER_ADMIN_USERNAME) && !viewer?.isSuperAdmin) {
    return null;
  }
  const safe = {
    username: user.username,
    name: user.name || user.username,
    role: user.role === 'teacher' ? 'teacher' : 'student',
    targetBand: user.targetBand ?? (user.role === 'teacher' ? 9.0 : 7.5),
    targetListening: user.targetListening ?? null,
    targetReading: user.targetReading ?? null,
    targetWriting: user.targetWriting ?? null,
    targetSpeaking: user.targetSpeaking ?? null,
    studyGoal: user.studyGoal || '',
    joinedDate: user.joinedDate || '',
    avatarUrl: user.avatarUrl || '',
    profileBannerId: typeof user.profileBannerId === 'string' && user.profileBannerId ? user.profileBannerId : 'ocean',
    profileCoverUrl: typeof user.profileCoverUrl === 'string' ? user.profileCoverUrl : '',
    avatarFrameId:
      typeof user.avatarFrameId === 'string' &&
      user.avatarFrameId &&
      hasUnlockedAvatarFrame(user, user.avatarFrameId)
        ? user.avatarFrameId
        : 'none',
    isGuest: Boolean(user.isGuest),
    totalPurchasedExams: getPurchasedExamCount(user),
    equippedTitleId:
      typeof user.equippedTitleId === 'string' && user.equippedTitleId
        ? user.equippedTitleId
        : (user.role === 'teacher' || user.isSuperAdmin || user.username === SUPER_ADMIN_USERNAME)
        ? 'staff_ielts_10'
        : 'newbie',
    showTitleBadge: user.showTitleBadge !== false,
    showExamTierBadge: user.showExamTierBadge !== false,
    grantedTitleIds: Array.isArray(user.grantedTitleIds) ? user.grantedTitleIds.map(String).filter(Boolean) : [],
    purchasedTitleIds: Array.isArray(user.purchasedTitleIds) ? user.purchasedTitleIds.map(String).filter(Boolean) : [],
    purchasedTestIds: Array.isArray(user.purchasedTestIds) ? user.purchasedTestIds.map(String).filter(Boolean) : [],
    purchasedTitleExpiries:
      user.purchasedTitleExpiries && typeof user.purchasedTitleExpiries === 'object'
        ? user.purchasedTitleExpiries
        : {},
    customCoverUnlocked: hasCustomCoverPermission(user),
    customCoverUnlockedAt: Number(user.customCoverUnlockedAt) || 0,
    customCoverExpiresAt: Number(user.customCoverExpiresAt) || 0,
    customCoverUnlockedBy: typeof user.customCoverUnlockedBy === 'string' ? user.customCoverUnlockedBy : '',
    coverUnlockRequestedAt: Number(user.coverUnlockRequestedAt) || 0,
    paidTitleRequested: user.paidTitleRequested && typeof user.paidTitleRequested === 'object' ? user.paidTitleRequested : null,
    skillPracticeExpiresAt: Number(user.skillPracticeExpiresAt) || 0,
    aieoVipExpiresAt: Number(user.aieoVipExpiresAt) || 0,
    roomCreateCredits: getFriendRoomTicketCredits(user),
    gachaWishCredits: getGachaWishPurchasedCredits(user),
    starterFirstGameGiftClaimed: Boolean(
      user.starterFirstGameGiftClaimed || user.knightRpgProfile?.firstGameGiftClaimed
    ),
    realExamCredits: getRealExamCredits(user),
    vipRedNameEnabled: (() => {
      const isVip = Number(user.aieoVipExpiresAt) > Date.now();
      const isSa = Boolean(user.isSuperAdmin || user.username === SUPER_ADMIN_USERNAME);
      if (isVip && !user.vipEffectsCustomizedAt) return true;
      return (isVip || isSa) && user.vipRedNameEnabled !== undefined ? Boolean(user.vipRedNameEnabled) : isVip;
    })(),
    vipNameColor: normalizeVipNameColor(user.vipNameColor || 'crimson'),
    vipTagEnabled: (() => {
      const isVip = Number(user.aieoVipExpiresAt) > Date.now();
      const isSa = Boolean(user.isSuperAdmin || user.username === SUPER_ADMIN_USERNAME);
      if (isVip && !user.vipEffectsCustomizedAt) return true;
      return (isVip || isSa) && user.vipTagEnabled !== undefined ? Boolean(user.vipTagEnabled) : isVip;
    })(),
    vipNeonCoverEnabled: (() => {
      const isStaff = isStaffOrAdminUser(user);
      if (!isStaff) return false;
      const isSa = Boolean(user.isSuperAdmin || user.username === SUPER_ADMIN_USERNAME);
      if (user.vipNeonCoverEnabled !== undefined) return Boolean(user.vipNeonCoverEnabled);
      return isSa && Boolean(user.vipRedNameEnabled || user.vipTagEnabled);
    })(),
    vipNeonCoverColor: normalizeVipNeonCoverColor(user.vipNeonCoverColor || 'aurora_rgb'),
    ...(user.vipEffectsCustomizedAt ? { vipEffectsCustomizedAt: Number(user.vipEffectsCustomizedAt) || 0 } : {}),
    subscriptionRequested:
      user.subscriptionRequested && typeof user.subscriptionRequested === 'object' ? user.subscriptionRequested : null,
    loginDays: Array.isArray(user.loginDays) ? user.loginDays : [],
    emailVerified: Boolean(user.email && user.emailVerified),
    maskedEmail: user.email && user.emailVerified ? maskEmailAddress(user.email) : ''
  };
  if (viewer && (viewer.username === user.username || viewer.role === 'teacher')) {
    safe.email = typeof user.email === 'string' ? user.email : '';
  }
  if (viewer && (viewer.username === user.username || viewer.isSuperAdmin)) {
    safe.totalPaidVnd = Math.max(0, Math.round(Number(user.totalPaidVnd) || 0));
    safe.donatedTotalVnd = Math.max(0, Math.round(Number(user.donatedTotalVnd) || 0));
    safe.paidCount = Math.max(0, Math.floor(Number(user.paidCount) || 0));
    safe.lastPaidAt = Number(user.lastPaidAt) || 0;
  }
  if (viewer && viewer.username === user.username && Array.isArray(user.acknowledgedTitleIds)) {
    safe.acknowledgedTitleIds = user.acknowledgedTitleIds;
  }
  safe.allTimeBestGameScore = Math.max(0, Math.floor(Number(user.allTimeBestGameScore) || 0));
  safe.hasAllTimeGamePerfectRun = Boolean(user.hasAllTimeGamePerfectRun);
  safe.knightPvpProfile = normalizeKnightPvpProfile(user.knightPvpProfile || {});
  const isTargetSuperAdminHeroUnlock = Boolean(
    user.isSuperAdmin || user.username === SUPER_ADMIN_USERNAME
  );
  if (isTargetSuperAdminHeroUnlock || (user.knightRpgProfile && typeof user.knightRpgProfile === 'object')) {
    const baseRpgObj =
      user.knightRpgProfile && typeof user.knightRpgProfile === 'object' ? user.knightRpgProfile : {};
    const effectiveRpgObj = isTargetSuperAdminHeroUnlock
      ? { ...baseRpgObj, unlockedSkins: KNIGHT_CHARACTER_SKINS.map(s => s.id) }
      : baseRpgObj;
    if (viewer && viewer.username === user.username) {
      safe.knightRpgProfile = effectiveRpgObj;
    } else {
      safe.knightRpgProfile = {
        bestScore: Math.max(0, Math.floor(Number(user.knightRpgProfile.bestScore) || 0)),
        allTimeBestScore: Math.max(
          Math.floor(Number(user.knightRpgProfile.bestScore) || 0),
          Math.floor(Number(user.knightRpgProfile.allTimeBestScore) || 0)
        ),
        monstersSlain: Math.max(0, Math.floor(Number(user.knightRpgProfile.monstersSlain) || 0)),
        dragonsSlain: Math.max(0, Math.floor(Number(user.knightRpgProfile.dragonsSlain) || 0)),
        demonKingsSlain: Math.max(0, Math.floor(Number(user.knightRpgProfile.demonKingsSlain) || 0)),
        keysCollected: Math.max(0, Math.floor(Number(user.knightRpgProfile.keysCollected) || 0)),
        unlockedSkins: Array.isArray(effectiveRpgObj.unlockedSkins)
          ? effectiveRpgObj.unlockedSkins
          : ['knight_arthur'],
        equippedSkin: String(user.knightRpgProfile.equippedSkin || 'holy_paladin'),
        equippedWeapon: String(user.knightRpgProfile.equippedWeapon || '')
      };
    }
  }
  if (viewer?.isSuperAdmin && user.isSuperAdmin) {
    safe.isSuperAdmin = true;
    safe.hiddenFromTeacher = true;
  }
  return safe;
}

function stripQuestionSecrets(questions) {
  return questions.map(q => {
    if (!q || typeof q !== 'object') return q;
    const nextQ = { ...q };
    if (nextQ.type === 'mcq') {
      nextQ.requiredSelections = Math.max(
        1,
        Number(q.requiredSelections) || 0,
        getQuestionCorrectAnswers(q).length
      );
    }
    delete nextQ.correctAnswer;
    delete nextQ.correctAnswers;
    delete nextQ.acceptableAnswers;
    delete nextQ.explanation;
    return nextQ;
  });
}

function stripAnswerKeysFromTest(test) {
  if (!test || typeof test !== 'object') return test;
  const clone = { ...test };
  if (clone.listening && Array.isArray(clone.listening.questions)) {
    clone.listening = {
      ...clone.listening,
      questions: stripQuestionSecrets(clone.listening.questions)
    };
  }
  if (clone.reading && Array.isArray(clone.reading.questions)) {
    clone.reading = {
      ...clone.reading,
      questions: stripQuestionSecrets(clone.reading.questions)
    };
  }
  if (clone.writing) {
    clone.writing = {
      ...clone.writing,
      task1: clone.writing.task1 ? { ...clone.writing.task1, modelAnswer: '' } : undefined,
      task2: clone.writing.task2 ? { ...clone.writing.task2, modelAnswer: '' } : undefined
    };
  }
  if (clone.speaking && typeof clone.speaking === 'object') {
    const rawPass = String(clone.speaking.roomPassword || '').trim();
    clone.speaking = {
      ...clone.speaking,
      roomPassword: '',
      hasRoomPassword: Boolean(clone.speaking.hasRoomPassword || rawPass.length > 0)
    };
  }
  return clone;
}

function isAttemptApprovedForStudentViewer(att) {
  if (!att || typeof att !== 'object') return false;
  if (att.teacherGraded) return true;
  return att.testMode === 'single_skill' && (att.focusSkill === 'listening' || att.focusSkill === 'reading');
}

function stripSpeakingRecordingEvaluationFields(rec) {
  if (!rec || typeof rec !== 'object') return rec;
  return {
    questionId: String(rec.questionId || ''),
    part: Number(rec.part) || 1,
    topic: String(rec.topic || '').slice(0, 200),
    prompt: String(rec.prompt || '').slice(0, 600),
    audioId: typeof rec.audioId === 'string' ? rec.audioId.slice(0, 180) : '',
    audioUrl: typeof rec.audioUrl === 'string' ? rec.audioUrl.slice(0, 300) : '',
    mimeType: typeof rec.mimeType === 'string' ? rec.mimeType.slice(0, 80) : 'audio/webm',
    sizeBytes: Math.max(0, Math.round(Number(rec.sizeBytes) || 0)),
    durationSec: Math.max(0, Math.round(Number(rec.durationSec) || 0)),
    transcript: String(rec.transcript || rec.clientTranscript || '').slice(0, 4000),
    clientTranscript: String(rec.clientTranscript || '').slice(0, 4000),
    band: null,
    criteria: null,
    fluencyMetrics: null,
    feedback: '',
    grammarVocabularyFixes: [],
    vocabularyUpgrades: [],
    upgradedSample: ''
  };
}

function sanitizeAttemptForStudentViewer(att) {
  if (!att || typeof att !== 'object') return att;
  if (isAttemptApprovedForStudentViewer(att)) {
    const clean = { ...att };
    delete clean.aiDraftBand;
    delete clean.aiDraftFeedback;
    return clean;
  }
  const baseScores = att.scores && typeof att.scores === 'object' ? { ...att.scores } : {};
  const sanitizedScores = {
    ...baseScores,
    ...(baseScores.writing !== undefined
      ? { writing: { task1Band: null, task2Band: null, overallBand: null } }
      : {}),
    ...(baseScores.speaking !== undefined
      ? { speaking: { band: null, criteria: null } }
      : {})
  };
  const sanitizedRecordings = Array.isArray(att.speakingRecordings)
    ? att.speakingRecordings.map(stripSpeakingRecordingEvaluationFields)
    : att.speakingRecordings;
  const result = {
    ...att,
    teacherGraded: false,
    aiGraded: false,
    overallBand: null,
    teacherFeedback: '',
    aiDetails: null,
    speakingAiDetails: null,
    scores: sanitizedScores,
    ...(sanitizedRecordings !== undefined ? { speakingRecordings: sanitizedRecordings } : {})
  };
  delete result.aiDraftBand;
  delete result.aiDraftFeedback;
  return result;
}

function sanitizeAttemptForPeer(att) {
  if (!att || typeof att !== 'object') return att;
  const approved = isAttemptApprovedForStudentViewer(att);
  return {
    id: att.id,
    testId: att.testId,
    testTitle: att.testTitle,
    testMode: att.testMode,
    focusSkill: att.focusSkill,
    dailySubCategory: att.dailySubCategory || '',
    speakingPartMode: att.speakingPartMode,
    studentId: att.studentId,
    studentName: att.studentName,
    startedAt: att.startedAt || '',
    submittedAt: att.submittedAt,
    submittedAtMs: Number(att.submittedAtMs) || 0,
    durationSeconds: Number(att.durationSeconds) || 0,
    timelinessStatus: att.timelinessStatus || 'flexible',
    lateByMinutes: Number(att.lateByMinutes) || 0,
    teacherGraded: Boolean(att.teacherGraded),
    aiGraded: approved ? Boolean(att.aiGraded) : false,
    overallBand: approved ? (att.overallBand ?? null) : null,
    scores: approved ? (att.scores || {}) : {}
  };
}

function calculateAutoBandServer(raw, total, skill = 'reading') {
  const cleanTotal = Number(total);
  const cleanRaw = Number(raw);
  if (!Number.isFinite(cleanTotal) || cleanTotal <= 0 || !Number.isFinite(cleanRaw) || cleanRaw <= 0) {
    return 0;
  }
  const equiv40 = (Math.min(cleanRaw, cleanTotal) / cleanTotal) * 40 + 1e-9;
  const table = skill === 'listening' ? LISTENING_40_THRESHOLDS : ACADEMIC_READING_40_THRESHOLDS;
  for (const [minRaw, band] of table) {
    if (equiv40 >= minRaw) return band;
  }
  return 1.0;
}

function roundIeltsBandServer(score) {
  const num = Number(score);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(9.0, Math.round((num + 1e-9) * 2) / 2);
}

function evaluateObjectiveScoresForAttempt(test, answers = {}) {
  if (!test || typeof test !== 'object') return null;
  const cfgMode = test.testMode === 'single_skill' ? 'single_skill' : 'full_exam';
  const focusSkill = cfgMode === 'single_skill' ? (test.focusSkill || 'reading') : null;
  const scores = {};

  if (cfgMode !== 'single_skill' || focusSkill === 'listening') {
    const qs = Array.isArray(test.listening?.questions) ? test.listening.questions : [];
    const raw = qs.reduce((acc, q) => acc + getObjectiveAnswerScore(q, answers?.[q.id]), 0);
    const total = qs.reduce((acc, q) => acc + getObjectiveAnswerMaxScore(q), 0);
    scores.listening = {
      raw,
      total,
      band: calculateAutoBandServer(raw, total, 'listening')
    };
  }

  if (cfgMode !== 'single_skill' || focusSkill === 'reading') {
    const qs = Array.isArray(test.reading?.questions) ? test.reading.questions : [];
    const raw = qs.reduce((acc, q) => acc + getObjectiveAnswerScore(q, answers?.[q.id]), 0);
    const total = qs.reduce((acc, q) => acc + getObjectiveAnswerMaxScore(q), 0);
    scores.reading = {
      raw,
      total,
      band: calculateAutoBandServer(raw, total, 'reading')
    };
  }

  let overallBand = null;
  let teacherGraded = false;
  if (cfgMode === 'single_skill' && (focusSkill === 'listening' || focusSkill === 'reading')) {
    overallBand = scores[focusSkill]?.band ?? 0;
    teacherGraded = true;
  } else if (cfgMode !== 'single_skill') {
    teacherGraded = false;
    overallBand = null;
  }

  return { scores, overallBand, teacherGraded, roundIeltsBandServer };
}

function hasAnyObjectiveAnswersMap(answers = {}) {
  if (!answers || typeof answers !== 'object') return false;
  return Object.entries(answers).some(([key, val]) => {
    if (key === 'w1' || key === 'w2') return false;
    if (Array.isArray(val)) return val.some(item => String(item ?? '').trim().length > 0);
    return String(val ?? '').trim().length > 0;
  });
}

function reconcileAttemptObjectiveScores(attempt, test, { onlyWhenStaleRepair = false } = {}) {
  if (!attempt || typeof attempt !== 'object' || !test || typeof test !== 'object') {
    return { attempt, changed: false };
  }
  if (attempt.manualObjectiveOverride) {
    return { attempt, changed: false };
  }
  const evalRes = evaluateObjectiveScoresForAttempt(test, attempt.answers || {});
  if (!evalRes) return { attempt, changed: false };

  const cfgMode =
    test.testMode === 'single_skill'
      ? 'single_skill'
      : attempt.testMode === 'single_skill'
      ? 'single_skill'
      : 'full_exam';
  const focusSkill =
    cfgMode === 'single_skill'
      ? (test.focusSkill || attempt.focusSkill || 'reading')
      : null;
  const hasListening = cfgMode !== 'single_skill' || focusSkill === 'listening';
  const hasReading = cfgMode !== 'single_skill' || focusSkill === 'reading';
  if (!hasListening && !hasReading) {
    return { attempt, changed: false };
  }

  const prevScores = attempt.scores && typeof attempt.scores === 'object' ? attempt.scores : {};
  const nextScores = { ...prevScores };
  const hasRecordedObjectiveAnswers = hasAnyObjectiveAnswersMap(attempt.answers);
  let scoresChanged = false;

  const maybeUpdateSkill = (skillKey) => {
    const evaluated = evalRes.scores?.[skillKey];
    if (!evaluated) return;
    const prev = prevScores[skillKey];
    const prevRaw = Number.isFinite(Number(prev?.raw)) ? Number(prev.raw) : -1;
    const prevTotal = Number.isFinite(Number(prev?.total)) ? Number(prev.total) : -1;
    const prevBand = typeof prev?.band === 'number' && Number.isFinite(prev.band) ? prev.band : null;

    // Never wipe pre-seeded/imported historical attempts that have a score but no per-question answers map
    if (!hasRecordedObjectiveAnswers && prevRaw > 0 && evaluated.raw === 0) {
      return;
    }

    if (onlyWhenStaleRepair) {
      const shouldRepair =
        !prev ||
        evaluated.raw > prevRaw ||
        (evaluated.raw === prevRaw && (evaluated.total !== prevTotal || evaluated.band !== prevBand));
      if (!shouldRepair) return;
    }

    if (prevRaw !== evaluated.raw || prevTotal !== evaluated.total || prevBand !== evaluated.band) {
      nextScores[skillKey] = {
        ...(prev && typeof prev === 'object' ? prev : {}),
        raw: evaluated.raw,
        total: evaluated.total,
        band: evaluated.band
      };
      scoresChanged = true;
    }
  };

  if (hasListening) maybeUpdateSkill('listening');
  if (hasReading) maybeUpdateSkill('reading');

  let nextOverallBand = attempt.overallBand;
  let nextTeacherGraded = Boolean(attempt.teacherGraded);
  if (cfgMode === 'single_skill' && (focusSkill === 'listening' || focusSkill === 'reading')) {
    const skillBand = nextScores[focusSkill]?.band ?? 0;
    if (!onlyWhenStaleRepair || scoresChanged || nextOverallBand !== skillBand || !nextTeacherGraded) {
      nextOverallBand = skillBand;
      nextTeacherGraded = true;
    }
  } else if (cfgMode !== 'single_skill' && nextTeacherGraded && scoresChanged) {
    const skillBands = [];
    if (typeof nextScores.listening?.band === 'number') skillBands.push(nextScores.listening.band);
    if (typeof nextScores.reading?.band === 'number') skillBands.push(nextScores.reading.band);
    if (typeof nextScores.writing?.overallBand === 'number') skillBands.push(nextScores.writing.overallBand);
    if (typeof nextScores.speaking?.band === 'number') skillBands.push(nextScores.speaking.band);
    if (skillBands.length > 0) {
      nextOverallBand = calculateOverallIeltsBand(skillBands);
    }
  }

  const metaChanged =
    nextOverallBand !== attempt.overallBand ||
    nextTeacherGraded !== Boolean(attempt.teacherGraded);

  if (!scoresChanged && !metaChanged) {
    return { attempt, changed: false };
  }

  return {
    attempt: {
      ...attempt,
      scores: nextScores,
      overallBand: nextOverallBand,
      teacherGraded: nextTeacherGraded
    },
    changed: true
  };
}

function reconcileTestAttemptsObjectiveScores(store, test, { onlyWhenStaleRepair = false } = {}) {
  if (!store || !Array.isArray(store.attempts) || !test?.id) return false;
  let anyChanged = false;
  const nextAttempts = store.attempts.map(att => {
    if (!att || att.testId !== test.id) return att;
    const res = reconcileAttemptObjectiveScores(att, test, { onlyWhenStaleRepair });
    if (res.changed) {
      anyChanged = true;
      return res.attempt;
    }
    return att;
  });
  if (anyChanged) {
    store.attempts = nextAttempts;
  }
  return anyChanged;
}

function reconcileAllStaleAttemptsInStore(store) {
  if (!store || !Array.isArray(store.attempts) || !Array.isArray(store.tests)) return false;
  const testMap = new Map(store.tests.filter(t => t?.id).map(t => [t.id, t]));
  let anyChanged = false;
  const nextAttempts = store.attempts.map(att => {
    if (!att?.testId) return att;
    const linkedTest = testMap.get(att.testId);
    if (!linkedTest) return att;
    const res = reconcileAttemptObjectiveScores(att, linkedTest, { onlyWhenStaleRepair: true });
    if (res.changed) {
      anyChanged = true;
      return res.attempt;
    }
    return att;
  });
  if (anyChanged) {
    store.attempts = nextAttempts;
  }
  return anyChanged;
}

function getServerChatMsgTs(msg) {
  const rawTs = Number(msg?.createdAt ?? msg?.id);
  return Number.isFinite(rawTs) && rawTs > 1_000_000_000_000 ? rawTs : 0;
}

export function pruneServerRoomChat(raw = {}, now = Date.now()) {
  const baseChats = Array.isArray(raw?.chatMessages) ? raw.chatMessages : [];
  const baseLobby = raw?.lobbyPlayers && typeof raw.lobbyPlayers === 'object' ? { ...raw.lobbyPlayers } : {};

  if (baseChats.length === 0) {
    return { chatMessages: [], chatCycleStartedAt: null, lobbyPlayers: baseLobby };
  }

  let cycleStart = Number(raw?.chatCycleStartedAt);
  if (!Number.isFinite(cycleStart) || cycleStart <= 1_000_000_000_000) {
    const oldestTs = baseChats.map(getServerChatMsgTs).find(ts => ts > 0);
    cycleStart = oldestTs || now;
  }

  const clearLobbyChatBubbles = (playersMap) => {
    const next = {};
    Object.entries(playersMap).forEach(([uname, p]) => {
      if (!p) return;
      next[uname] = (p.chat || p.chatAt) ? { ...p, chat: '', chatAt: null } : p;
    });
    return next;
  };

  if (now - cycleStart >= LOBBY_CHAT_RESET_MS) {
    return {
      chatMessages: [],
      chatCycleStartedAt: null,
      lobbyPlayers: clearLobbyChatBubbles(baseLobby)
    };
  }

  const validChats = baseChats
    .filter(msg => {
      const ts = getServerChatMsgTs(msg);
      return ts === 0 || now - ts < LOBBY_CHAT_RESET_MS;
    })
    .slice(-50);

  if (validChats.length === 0) {
    return {
      chatMessages: [],
      chatCycleStartedAt: null,
      lobbyPlayers: clearLobbyChatBubbles(baseLobby)
    };
  }

  return {
    chatMessages: validChats,
    chatCycleStartedAt: cycleStart,
    lobbyPlayers: baseLobby
  };
}

export function normalizeServerRoom(raw = {}, pinKey = '', now = Date.now()) {
  const pin = String(raw?.pin || pinKey || '').trim();
  const prunedChat = pruneServerRoomChat(raw, now);
  const rawRoundSize = Number(raw?.roundSize);
  const rawMaxPlayers = Number(raw?.maxPlayers);
  const maxPlayers = Number.isFinite(rawMaxPlayers) && rawMaxPlayers >= 2
    ? Math.min(30, Math.round(rawMaxPlayers))
    : 30;
  const rawTeamCount = Number(raw?.teamCount);
  const teamCount = [2, 3, 4].includes(Math.round(rawTeamCount)) ? Math.round(rawTeamCount) : 0;
  return {
    pin,
    name: raw?.name || `Phòng Từ Vựng #${pin || '686868'}`,
    pass: raw?.pass ?? 'ielts',
    teacher: raw?.teacher || 'teacher_ielts',
    roomMode: raw?.roomMode === 'friend_vip' ? 'friend_vip' : 'teacher_live',
    hostUsername: String(raw?.hostUsername || ''),
    hostName: String(raw?.hostName || ''),
    status: raw?.status === 'PLAYING' || raw?.status === 'ENDED' ? raw.status : 'LOBBY',
    maxPlayers,
    teamCount,
    roundSize: Number.isFinite(rawRoundSize) && rawRoundSize >= 1 ? Math.min(200, Math.round(rawRoundSize)) : 4,
    selectedWords: Array.isArray(raw?.selectedWords)
      ? raw.selectedWords.map(w => String(w || '').trim().toUpperCase()).filter(Boolean).slice(0, 200)
      : [],
    speedMode: ['relaxed', 'normal', 'turbo'].includes(raw?.speedMode) ? raw.speedMode : 'normal',
    shufflePerPlayer: Boolean(raw?.shufflePerPlayer),
    startedAt: raw?.startedAt || null,
    lobbyPlayers: prunedChat.lobbyPlayers,
    liveMatch: raw?.liveMatch && typeof raw.liveMatch === 'object' ? { ...raw.liveMatch } : {},
    questionSolves: raw?.questionSolves && typeof raw.questionSolves === 'object' ? { ...raw.questionSolves } : {},
    chatMessages: prunedChat.chatMessages,
    chatCycleStartedAt: prunedChat.chatCycleStartedAt,
    rawVocab: typeof raw?.rawVocab === 'string' ? raw.rawVocab : '',
    players: raw?.players && typeof raw.players === 'object' ? { ...raw.players } : {}
  };
}

function pruneExpiredStoreChats(store, now = Date.now()) {
  let prunedAny = false;
  Object.entries(store.rooms || {}).forEach(([pin, r]) => {
    const prevLen = Array.isArray(r?.chatMessages) ? r.chatMessages.length : 0;
    const normalized = normalizeServerRoom(r, pin, now);
    if (
      normalized.chatMessages.length !== prevLen ||
      normalized.chatCycleStartedAt !== (r?.chatCycleStartedAt ?? null)
    ) {
      store.rooms[pin] = normalized;
      prunedAny = true;
    }
  });
  if (prunedAny) {
    store.version += 1;
  }
  return prunedAny;
}

function removeUserFromGameRooms(store, username = '') {
  const uname = String(username || '').trim();
  if (!uname || !store?.rooms || typeof store.rooms !== 'object') return false;
  let changed = false;
  Object.entries(store.rooms).forEach(([pin, r]) => {
    if (!r || typeof r !== 'object') return;
    let roomChanged = false;
    const nextLobby = r.lobbyPlayers && typeof r.lobbyPlayers === 'object' ? { ...r.lobbyPlayers } : {};
    if (Object.prototype.hasOwnProperty.call(nextLobby, uname)) {
      delete nextLobby[uname];
      roomChanged = true;
    }
    const nextLiveMatch = r.liveMatch && typeof r.liveMatch === 'object' ? { ...r.liveMatch } : {};
    if (r.status === 'LOBBY' && Object.prototype.hasOwnProperty.call(nextLiveMatch, uname)) {
      delete nextLiveMatch[uname];
      roomChanged = true;
    }
    if (roomChanged) {
      store.rooms[pin] = normalizeServerRoom({ ...r, lobbyPlayers: nextLobby, liveMatch: nextLiveMatch }, pin);
      changed = true;
    }
  });
  return changed;
}

function cloneSeedData(value) {
  return JSON.parse(JSON.stringify(value));
}

function seedCanonicalDefaults(store) {
  const allCanonicalTests = cloneSeedData(DEFAULT_TESTS);
  const canonicalTestIds = new Set(allCanonicalTests.map(test => test?.id).filter(Boolean));
  const deletedTestIds = new Set(Array.isArray(store.deletedTestIds) ? store.deletedTestIds : []);
  const canonicalTests = allCanonicalTests.filter(test => !deletedTestIds.has(test?.id));
  const customTests = (Array.isArray(store.tests) ? store.tests : [])
    .filter(test => test?.id && !canonicalTestIds.has(test.id));
  const currentRooms = store.rooms && typeof store.rooms === 'object' ? store.rooms : {};
  const customRooms = Object.fromEntries(
    Object.entries(currentRooms).filter(([pin]) => !Object.prototype.hasOwnProperty.call(DEFAULT_ROOMS, pin))
  );

  store.tests = [...canonicalTests, ...customTests];
  store.seededTags = {
    ...(store.seededTags && typeof store.seededTags === 'object' ? store.seededTags : {}),
    ...Object.fromEntries(allCanonicalTests.filter(test => test?.seedTag).map(test => [test.seedTag, true]))
  };
  store.rooms = { ...cloneSeedData(DEFAULT_ROOMS), ...customRooms };
  if (!Array.isArray(store.attempts)) store.attempts = cloneSeedData(DEFAULT_ATTEMPTS);
  if (!store.teacherNotes || typeof store.teacherNotes !== 'object') {
    store.teacherNotes = cloneSeedData(DEFAULT_TEACHER_NOTES);
  }
  store.seeded = true;
  return true;
}

function createInitialStore(audioDir = '', mediaDir = '') {
  const store = {
    version: 0,
    seeded: false,
    seededTags: {},
    deletedTestIds: [],
    deletedUserIds: [],
    rooms: {},
    classes: {},
    tests: [],
    attempts: [],
    teacherNotes: {},
    users: {},
    customVocabTopics: [],
    speakingForecast: createDefaultSpeakingForecastBank(),
    customTitles: [],
    gamePracticeLeaderboard: [],
    knightPvpLeaderboard: [],
    archivedPrevWeekGameEntries: [],
    knightGachaConfig: normalizeKnightGachaConfig({}),
    adminFeedbacks: [],
    notifications: [],
    aiConfig: { geminiApiKey: '' },
    paymentConfig: normalizePaymentConfig({}),
    paymentSecrets: { sepayApiKey: '', payosClientId: '', payosApiKey: '', payosChecksumKey: '' },
    paymentOrders: [],
    paymentTransactions: [],
    processedWebhookTxIds: [],
    mailConfig: {
      provider: 'none',
      resendApiKey: '',
      brevoApiKey: '',
      appsScriptUrl: '',
      smtpHost: '',
      smtpPort: 465,
      smtpSecure: true,
      smtpUser: '',
      smtpPass: '',
      fromEmail: '',
      fromName: 'IELTS Nha Trang — Ms. Như'
    },
    _authSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    _bootId: crypto.randomUUID(),
    _localMutated: false,
    _rateLimits: new Map(),
    _otpChallenges: new Map(),
    _unlockedSpeakingRooms: new Map(),
    _unlockedExamRooms: new Map(),
    _processedGameMatchIds: new Set(),
    _knightPvpQueue: new Map(),
    _knightPvpMatches: new Map(),
    _knightPvpRooms: new Map(),
    _dailyRankCache: null,
    _audioDir: audioDir,
    _audioMem: new Map(),
    _mediaDir: mediaDir,
    _mediaMem: new Map(),
    _mediaCache: new Map(),
    _protectedCredentialsVersion: 0
  };
  seedCanonicalDefaults(store);
  ensureProtectedAccounts(store);
  return store;
}

function sanitizeAudioId(raw = '') {
  const cleaned = String(raw || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned.length >= 4 && cleaned.length <= 120 ? cleaned : '';
}

function getEffectiveGeminiKey(store, clientOverride = '') {
  return String(
    store?.aiConfig?.geminiApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    clientOverride ||
    ''
  ).trim().replace(/^['"]|['"]$/g, '');
}

function saveAudioRecord(store, { audioId, mimeType, dataBase64, buffer: rawBuffer, username = '', attemptId = '', questionId = '' }) {
  const safeId = sanitizeAudioId(audioId) || `spk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const cleanMime = cleanAudioMimeType(mimeType);
  const rawB64 = String(dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.isBuffer(rawBuffer) ? rawBuffer : Buffer.from(rawB64, 'base64');
  const ext = inferAudioExtension(cleanMime);
  const meta = {
    audioId: safeId,
    mimeType: cleanMime,
    ext,
    sizeBytes: buffer.length,
    username,
    attemptId,
    questionId,
    createdAt: Date.now()
  };

  if (store._audioDir) {
    fs.mkdirSync(store._audioDir, { recursive: true });
    fs.writeFileSync(path.join(store._audioDir, `${safeId}.bin`), buffer);
    fs.writeFileSync(path.join(store._audioDir, `${safeId}.meta.json`), JSON.stringify(meta), 'utf8');
  } else {
    store._audioMem.set(safeId, { buffer, meta });
  }
  return meta;
}

function loadAudioRecord(store, rawId) {
  const safeId = sanitizeAudioId(rawId);
  if (!safeId) return null;
  if (store._audioDir) {
    const binPath = path.join(store._audioDir, `${safeId}.bin`);
    const metaPath = path.join(store._audioDir, `${safeId}.meta.json`);
    if (fs.existsSync(binPath)) {
      let meta = { audioId: safeId, mimeType: 'audio/webm', ext: 'webm' };
      try {
        if (fs.existsSync(metaPath)) {
          meta = { ...meta, ...JSON.parse(fs.readFileSync(metaPath, 'utf8')) };
        }
      } catch (_err) {}
      const buffer = fs.readFileSync(binPath);
      return { buffer, meta };
    }
  }
  return store._audioMem?.get(safeId) || null;
}

const MEDIA_MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/apng': 'apng',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'm4a'
};

const MEDIA_EXT_TO_MIME = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  'anim.webp': 'image/webp',
  gif: 'image/gif',
  apng: 'image/apng',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
  m4a: 'audio/mp4'
};

const MAX_MEDIA_MEMORY_CACHE_ENTRIES = 32;
const MAX_MEDIA_MEMORY_CACHE_ITEM_BYTES = 1_500_000;

function sanitizeMediaId(raw = '') {
  const str = String(raw || '').trim();
  const match = /^(med_[a-f0-9]{16,32}\.(?:jpg|png|webp|anim\.webp|gif|apng|mp3|wav|ogg|webm|m4a))$/.exec(str);
  return match ? match[1] : '';
}

function externalizeDataUrl(store, rawVal) {
  if (typeof rawVal !== 'string' || !rawVal.startsWith('data:')) {
    return { url: rawVal, changed: false };
  }
  const commaIdx = rawVal.indexOf(',');
  if (commaIdx < 16 || commaIdx > 128) {
    return { url: rawVal, changed: false };
  }
  const header = rawVal.slice(0, commaIdx);
  const mimeMatch = /^data:((?:image|audio)\/[a-zA-Z0-9.+-]+)(?:;[^,;]+)*;base64$/i.exec(header);
  if (!mimeMatch) {
    return { url: rawVal, changed: false };
  }
  const cleanMime = mimeMatch[1].toLowerCase();
  let ext = MEDIA_MIME_TO_EXT[cleanMime];
  if (!ext) {
    return { url: rawVal, changed: false };
  }
  const b64Payload = rawVal.slice(commaIdx + 1).trim();
  if (!b64Payload) {
    return { url: rawVal, changed: false };
  }
  let buffer;
  try {
    buffer = Buffer.from(b64Payload, 'base64');
  } catch {
    return { url: rawVal, changed: false };
  }
  if (!buffer || buffer.length === 0) {
    return { url: rawVal, changed: false };
  }
  if (cleanMime === 'image/webp' && isWebpBufferAnimated(buffer)) {
    ext = 'anim.webp';
  }
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 20);
  const mediaId = `med_${hash}.${ext}`;
  const canonicalMime = MEDIA_EXT_TO_MIME[ext] || cleanMime;
  const meta = {
    mediaId,
    mimeType: canonicalMime,
    sizeBytes: buffer.length
  };

  if (store?._mediaDir) {
    try {
      fs.mkdirSync(store._mediaDir, { recursive: true });
      const binPath = path.join(store._mediaDir, `${mediaId}.bin`);
      if (!fs.existsSync(binPath)) {
        fs.writeFileSync(binPath, buffer);
        fs.writeFileSync(path.join(store._mediaDir, `${mediaId}.meta.json`), JSON.stringify(meta), 'utf8');
      }
    } catch (err) {
      console.error(`[LexiPrep Sync] Failed persisting externalized media ${mediaId}:`, err?.message || err);
      if (store._mediaMem) {
        store._mediaMem.set(mediaId, { buffer, meta });
      }
    }
  } else if (store?._mediaMem) {
    store._mediaMem.set(mediaId, { buffer, meta });
  }

  return { url: `/api/sync/media/${mediaId}`, changed: true };
}

function loadMediaRecord(store, rawId) {
  const safeId = sanitizeMediaId(rawId);
  if (!safeId) return null;
  if (store?._mediaCache?.has(safeId)) {
    return store._mediaCache.get(safeId);
  }
  if (store?._mediaMem?.has(safeId)) {
    return store._mediaMem.get(safeId);
  }
  if (store?._mediaDir) {
    const binPath = path.join(store._mediaDir, `${safeId}.bin`);
    const metaPath = path.join(store._mediaDir, `${safeId}.meta.json`);
    if (fs.existsSync(binPath)) {
      const extMatch = /\.((?:anim\.webp)|[a-z0-9]+)$/i.exec(safeId);
      const fallbackMime = MEDIA_EXT_TO_MIME[extMatch?.[1]?.toLowerCase() || ''] || 'application/octet-stream';
      let meta = { mediaId: safeId, mimeType: fallbackMime };
      try {
        if (fs.existsSync(metaPath)) {
          meta = { ...meta, ...JSON.parse(fs.readFileSync(metaPath, 'utf8')) };
        }
      } catch {}
      try {
        const buffer = fs.readFileSync(binPath);
        const rec = { buffer, meta: { ...meta, sizeBytes: buffer.length } };
        if (store._mediaCache && buffer.length <= MAX_MEDIA_MEMORY_CACHE_ITEM_BYTES) {
          if (store._mediaCache.size >= MAX_MEDIA_MEMORY_CACHE_ENTRIES) {
            const oldestKey = store._mediaCache.keys().next().value;
            if (oldestKey) store._mediaCache.delete(oldestKey);
          }
          store._mediaCache.set(safeId, rec);
        }
        return rec;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function externalizePaymentConfigMedia(store, cfg) {
  if (!cfg || typeof cfg !== 'object') return { config: cfg, changed: false };
  let changed = false;
  const next = { ...cfg };
  if (typeof next.customQrUrl === 'string' && next.customQrUrl.startsWith('data:')) {
    const res = externalizeDataUrl(store, next.customQrUrl);
    if (res.changed) {
      next.customQrUrl = res.url;
      changed = true;
    }
  }
  if (typeof next.donateQrUrl === 'string' && next.donateQrUrl.startsWith('data:')) {
    const res = externalizeDataUrl(store, next.donateQrUrl);
    if (res.changed) {
      next.donateQrUrl = res.url;
      changed = true;
    }
  }
  return { config: next, changed };
}

function externalizeTestMedia(store, testObj) {
  if (!testObj || typeof testObj !== 'object') return { test: testObj, changed: false };
  let changed = false;
  let nextTest = testObj;

  const ensureClone = () => {
    if (nextTest === testObj) nextTest = { ...testObj };
    return nextTest;
  };

  if (testObj.listening && typeof testObj.listening === 'object') {
    let lChanged = false;
    const nextL = { ...testObj.listening };
    if (typeof nextL.imageUrl === 'string' && nextL.imageUrl.startsWith('data:')) {
      const r = externalizeDataUrl(store, nextL.imageUrl);
      if (r.changed) { nextL.imageUrl = r.url; lChanged = true; }
    }
    if (typeof nextL.audioUrl === 'string' && nextL.audioUrl.startsWith('data:')) {
      const r = externalizeDataUrl(store, nextL.audioUrl);
      if (r.changed) { nextL.audioUrl = r.url; lChanged = true; }
    }
    if (Array.isArray(nextL.tracks)) {
      let tracksChanged = false;
      const nextTracks = nextL.tracks.map(tr => {
        if (!tr || typeof tr !== 'object') return tr;
        let trChanged = false;
        let cloned = tr;
        if (typeof tr.imageUrl === 'string' && tr.imageUrl.startsWith('data:')) {
          const r = externalizeDataUrl(store, tr.imageUrl);
          if (r.changed) { cloned = { ...cloned, imageUrl: r.url }; trChanged = true; }
        }
        if (typeof tr.audioUrl === 'string' && tr.audioUrl.startsWith('data:')) {
          const r = externalizeDataUrl(store, tr.audioUrl);
          if (r.changed) { cloned = { ...cloned, audioUrl: r.url }; trChanged = true; }
        }
        if (trChanged) tracksChanged = true;
        return cloned;
      });
      if (tracksChanged) {
        nextL.tracks = nextTracks;
        lChanged = true;
      }
    }
    if (Array.isArray(nextL.questions)) {
      let lqChanged = false;
      const nextLq = nextL.questions.map(q => {
        if (q && typeof q.imageUrl === 'string' && q.imageUrl.startsWith('data:')) {
          const r = externalizeDataUrl(store, q.imageUrl);
          if (r.changed) { lqChanged = true; return { ...q, imageUrl: r.url }; }
        }
        return q;
      });
      if (lqChanged) {
        nextL.questions = nextLq;
        lChanged = true;
      }
    }
    if (lChanged) {
      ensureClone().listening = nextL;
      changed = true;
    }
  }

  if (testObj.reading && typeof testObj.reading === 'object') {
    let rChanged = false;
    const nextR = { ...testObj.reading };
    if (typeof nextR.imageUrl === 'string' && nextR.imageUrl.startsWith('data:')) {
      const r = externalizeDataUrl(store, nextR.imageUrl);
      if (r.changed) { nextR.imageUrl = r.url; rChanged = true; }
    }
    if (Array.isArray(nextR.passages)) {
      let passagesChanged = false;
      const nextPassages = nextR.passages.map(p => {
        if (!p || typeof p !== 'object') return p;
        if (typeof p.imageUrl === 'string' && p.imageUrl.startsWith('data:')) {
          const r = externalizeDataUrl(store, p.imageUrl);
          if (r.changed) { passagesChanged = true; return { ...p, imageUrl: r.url }; }
        }
        return p;
      });
      if (passagesChanged) {
        nextR.passages = nextPassages;
        rChanged = true;
      }
    }
    if (Array.isArray(nextR.questions)) {
      let rqChanged = false;
      const nextRq = nextR.questions.map(q => {
        if (q && typeof q.imageUrl === 'string' && q.imageUrl.startsWith('data:')) {
          const r = externalizeDataUrl(store, q.imageUrl);
          if (r.changed) { rqChanged = true; return { ...q, imageUrl: r.url }; }
        }
        return q;
      });
      if (rqChanged) {
        nextR.questions = nextRq;
        rChanged = true;
      }
    }
    if (rChanged) {
      ensureClone().reading = nextR;
      changed = true;
    }
  }

  if (testObj.writing && typeof testObj.writing === 'object') {
    let wChanged = false;
    const nextW = { ...testObj.writing };
    ['task1', 'task2'].forEach(tk => {
      if (nextW[tk] && typeof nextW[tk] === 'object' && typeof nextW[tk].imageUrl === 'string' && nextW[tk].imageUrl.startsWith('data:')) {
        const r = externalizeDataUrl(store, nextW[tk].imageUrl);
        if (r.changed) {
          nextW[tk] = { ...nextW[tk], imageUrl: r.url };
          wChanged = true;
        }
      }
    });
    if (wChanged) {
      ensureClone().writing = nextW;
      changed = true;
    }
  }

  if (testObj.speaking && typeof testObj.speaking === 'object') {
    let sChanged = false;
    const nextS = { ...testObj.speaking };
    ['part1', 'part2', 'part3'].forEach(pk => {
      const partVal = nextS[pk];
      if (Array.isArray(partVal)) {
        let pChanged = false;
        const mapped = partVal.map(item => {
          if (!item || typeof item !== 'object') return item;
          let cloned = item;
          let iChanged = false;
          if (typeof item.audioUrl === 'string' && item.audioUrl.startsWith('data:')) {
            const r = externalizeDataUrl(store, item.audioUrl);
            if (r.changed) { cloned = { ...cloned, audioUrl: r.url }; iChanged = true; }
          }
          if (typeof item.imageUrl === 'string' && item.imageUrl.startsWith('data:')) {
            const r = externalizeDataUrl(store, item.imageUrl);
            if (r.changed) { cloned = { ...cloned, imageUrl: r.url }; iChanged = true; }
          }
          if (iChanged) pChanged = true;
          return cloned;
        });
        if (pChanged) { nextS[pk] = mapped; sChanged = true; }
      } else if (partVal && typeof partVal === 'object') {
        let cloned = partVal;
        let pChanged = false;
        if (typeof partVal.audioUrl === 'string' && partVal.audioUrl.startsWith('data:')) {
          const r = externalizeDataUrl(store, partVal.audioUrl);
          if (r.changed) { cloned = { ...cloned, audioUrl: r.url }; pChanged = true; }
        }
        if (typeof partVal.imageUrl === 'string' && partVal.imageUrl.startsWith('data:')) {
          const r = externalizeDataUrl(store, partVal.imageUrl);
          if (r.changed) { cloned = { ...cloned, imageUrl: r.url }; pChanged = true; }
        }
        if (pChanged) { nextS[pk] = cloned; sChanged = true; }
      }
    });
    if (sChanged) {
      ensureClone().speaking = nextS;
      changed = true;
    }
  }

  return { test: nextTest, changed };
}

function externalizeStoreMedia(store) {
  if (!store || typeof store !== 'object') return false;
  let anyChanged = false;

  if (store.users && typeof store.users === 'object') {
    Object.entries(store.users).forEach(([uname, u]) => {
      if (!u || typeof u !== 'object') return;
      let uChanged = false;
      let nextU = u;
      if (typeof u.avatarUrl === 'string' && u.avatarUrl.startsWith('data:')) {
        const r = externalizeDataUrl(store, u.avatarUrl);
        if (r.changed) { nextU = { ...nextU, avatarUrl: r.url }; uChanged = true; }
      }
      if (typeof u.profileCoverUrl === 'string' && u.profileCoverUrl.startsWith('data:')) {
        const r = externalizeDataUrl(store, u.profileCoverUrl);
        if (r.changed) { nextU = { ...nextU, profileCoverUrl: r.url }; uChanged = true; }
      }
      if (uChanged) {
        store.users[uname] = nextU;
        anyChanged = true;
      }
    });
  }

  if (store.rooms && typeof store.rooms === 'object') {
    Object.values(store.rooms).forEach(r => {
      if (!r || typeof r !== 'object') return;
      ['lobbyPlayers', 'liveMatch'].forEach(bucketKey => {
        const bucket = r[bucketKey];
        if (!bucket || typeof bucket !== 'object') return;
        Object.entries(bucket).forEach(([uname, player]) => {
          if (player && typeof player.avatarUrl === 'string' && player.avatarUrl.startsWith('data:')) {
            const res = externalizeDataUrl(store, player.avatarUrl);
            if (res.changed) {
              bucket[uname] = { ...player, avatarUrl: res.url };
              anyChanged = true;
            }
          }
        });
      });
    });
  }

  if (Array.isArray(store.tests)) {
    let testsChanged = false;
    const nextTests = store.tests.map(t => {
      const res = externalizeTestMedia(store, t);
      if (res.changed) testsChanged = true;
      return res.test;
    });
    if (testsChanged) {
      store.tests = nextTests;
      anyChanged = true;
    }
  }

  if (store.paymentConfig && typeof store.paymentConfig === 'object') {
    const res = externalizePaymentConfigMedia(store, store.paymentConfig);
    if (res.changed) {
      store.paymentConfig = res.config;
      anyChanged = true;
    }
  }

  return anyChanged;
}

/** Hydrate persisted JSON state into `store`, keeping malformed/missing fields safe. */
function applyParsedStoreSnapshot(store, parsed) {
  if (!parsed || typeof parsed !== 'object') return;
  store.version = Number(parsed.version) || 0;
  store.seeded = Boolean(parsed.seeded);
  store._protectedCredentialsVersion = Number(parsed._protectedCredentialsVersion) || 0;
  if (parsed.seededTags && typeof parsed.seededTags === 'object') {
    store.seededTags = { ...parsed.seededTags };
  }
  if (Array.isArray(parsed.deletedTestIds)) {
    store.deletedTestIds = parsed.deletedTestIds;
  }
  if (Array.isArray(parsed.deletedUserIds)) {
    store.deletedUserIds = parsed.deletedUserIds;
  }
  if (parsed.rooms && typeof parsed.rooms === 'object') {
    store.rooms = {};
    Object.entries(parsed.rooms).forEach(([pin, r]) => {
      store.rooms[pin] = normalizeServerRoom(r, pin);
    });
  }
  if (parsed.classes && typeof parsed.classes === 'object') {
    store.classes = {};
    Object.entries(parsed.classes).forEach(([cid, cls]) => {
      const normalized = normalizeClassRecord(cls, cid);
      if (normalized) store.classes[normalized.id] = normalized;
    });
  }
  if (Array.isArray(parsed.tests)) store.tests = parsed.tests;
  if (Array.isArray(parsed.attempts)) store.attempts = parsed.attempts;
  if (parsed.teacherNotes && typeof parsed.teacherNotes === 'object') {
    store.teacherNotes = parsed.teacherNotes;
  }
  if (parsed.users && typeof parsed.users === 'object') {
    store.users = parsed.users;
    if (store.users.teacher_ielts?.name === 'Thầy Minh IELTS Master') {
      store.users.teacher_ielts = {
        ...store.users.teacher_ielts,
        name: 'Ms. Như — IELTS Nha Trang'
      };
    }
  }
  if (Array.isArray(parsed.customVocabTopics)) {
    store.customVocabTopics = parsed.customVocabTopics.filter(t => t?.id && t?.label && typeof t?.text === 'string');
  }
  if (parsed.speakingForecast && typeof parsed.speakingForecast === 'object') {
    store.speakingForecast = normalizeSpeakingForecastBank(parsed.speakingForecast);
  }
  if (Array.isArray(parsed.customTitles)) {
    store.customTitles = parsed.customTitles.filter(t => t?.id && t?.label).slice(0, 60);
  }
  if (Array.isArray(parsed.gamePracticeLeaderboard)) {
    store.gamePracticeLeaderboard = parsed.gamePracticeLeaderboard
      .filter(e => e && e.username && Number.isFinite(Number(e.score)))
      .slice(0, 300);
  }
  if (Array.isArray(parsed.knightPvpLeaderboard)) {
    store.knightPvpLeaderboard = parsed.knightPvpLeaderboard
      .filter(e => e && e.username && Number.isFinite(Number(e.rp)))
      .slice(0, 250);
  }
  if (Array.isArray(parsed.archivedPrevWeekGameEntries)) {
    store.archivedPrevWeekGameEntries = parsed.archivedPrevWeekGameEntries
      .filter(e => e && e.username && Number.isFinite(Number(e.score)))
      .slice(0, 250);
  }
  if (parsed.knightGachaConfig && typeof parsed.knightGachaConfig === 'object') {
    store.knightGachaConfig = normalizeKnightGachaConfig(parsed.knightGachaConfig);
  }
  if (Array.isArray(parsed.adminFeedbacks)) {
    store.adminFeedbacks = parsed.adminFeedbacks.filter(f => f?.id && f?.content);
  }
  if (Array.isArray(parsed.notifications)) {
    store.notifications = parsed.notifications.filter(n => n?.id && n?.title).slice(0, 80);
  }
  if (parsed.aiConfig && typeof parsed.aiConfig === 'object') {
    store.aiConfig = {
      geminiApiKey: String(parsed.aiConfig.geminiApiKey || '').trim()
    };
  }
  if (parsed.paymentConfig && typeof parsed.paymentConfig === 'object') {
    store.paymentConfig = normalizePaymentConfig(parsed.paymentConfig);
  }
  if (parsed.paymentSecrets && typeof parsed.paymentSecrets === 'object') {
    store.paymentSecrets = {
      sepayApiKey: String(parsed.paymentSecrets.sepayApiKey || '').trim(),
      payosClientId: String(parsed.paymentSecrets.payosClientId || '').trim(),
      payosApiKey: String(parsed.paymentSecrets.payosApiKey || '').trim(),
      payosChecksumKey: String(parsed.paymentSecrets.payosChecksumKey || '').trim()
    };
  }
  if (Array.isArray(parsed.paymentOrders)) {
    store.paymentOrders = parsed.paymentOrders.filter(o => o && o.orderCode && o.username).slice(0, 500);
  }
  if (Array.isArray(parsed.paymentTransactions)) {
    store.paymentTransactions = parsed.paymentTransactions
      .filter(tx => tx && tx.id && tx.username)
      .slice(0, 500);
  } else if (Array.isArray(store.paymentOrders) && store.paymentOrders.length > 0) {
    // Backfill historical paid orders into paymentTransactions on upgrade
    store.paymentTransactions = store.paymentOrders
      .filter(o => o && o.status === 'paid' && o.username)
      .slice(0, 500)
      .map(o => ({
        id: `ptx_${o.orderCode}`,
        orderCode: o.orderCode,
        username: o.username,
        userName: store.users?.[o.username]?.name || o.username,
        itemType: o.itemType || 'cover',
        itemLabel: o.itemLabel || 'Thanh toán',
        amount: Math.max(0, Math.round(Number(o.paidAmount || o.amount) || 0)),
        status: 'paid',
        gateway: o.gateway || 'auto',
        txId: o.txId || '',
        note: '',
        paidAt: Number(o.paidAt) || Number(o.createdAt) || Date.now(),
        createdAt: Number(o.createdAt) || Number(o.paidAt) || Date.now()
      }));
  }
  if (Array.isArray(parsed.processedWebhookTxIds)) {
    store.processedWebhookTxIds = parsed.processedWebhookTxIds.map(String).filter(Boolean).slice(0, 500);
  }
  if (parsed.mailConfig && typeof parsed.mailConfig === 'object') {
    store.mailConfig = {
      ...(store.mailConfig || {}),
      provider: ['resend', 'brevo', 'smtp', 'apps_script', 'none'].includes(parsed.mailConfig.provider) ? parsed.mailConfig.provider : 'none',
      resendApiKey: String(parsed.mailConfig.resendApiKey || '').trim(),
      brevoApiKey: String(parsed.mailConfig.brevoApiKey || '').trim(),
      appsScriptUrl: String(parsed.mailConfig.appsScriptUrl || '').trim(),
      smtpHost: String(parsed.mailConfig.smtpHost || '').trim(),
      smtpPort: Number(parsed.mailConfig.smtpPort) || 465,
      smtpSecure: parsed.mailConfig.smtpSecure !== false,
      smtpUser: String(parsed.mailConfig.smtpUser || '').trim(),
      smtpPass: String(parsed.mailConfig.smtpPass || '').trim(),
      fromEmail: String(parsed.mailConfig.fromEmail || '').trim(),
      fromName: String(parsed.mailConfig.fromName || 'IELTS Nha Trang — Ms. Như').trim()
    };
  }
  if (typeof parsed._authSecret === 'string' && parsed._authSecret.length >= 32) {
    store._authSecret = parsed._authSecret;
  }
}

/**
 * Create a sync store optionally backed by a JSON file on disk (debounced writes).
 * Keeps existing in-memory behavior when `persistFile` is empty.
 */
export function createPersistentSyncStore(persistFile = '') {
  const audioDir = persistFile ? path.join(path.dirname(persistFile), 'audio') : '';
  const mediaDir = persistFile ? path.join(path.dirname(persistFile), 'media') : '';
  const store = createInitialStore(audioDir, mediaDir);
  const bootTimestamp = Date.now();
  const backupFile = persistFile ? `${persistFile}.bak` : '';
  let lastDiskMtimeMs = 0;
  let lastStatCheckedAt = 0;
  let hadExistingFile = false;
  let loadedFromDisk = false;

  const tryLoadJsonFile = (filePath) => {
    if (!filePath || !fs.existsSync(filePath)) return false;
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    applyParsedStoreSnapshot(store, parsed);
    lastDiskMtimeMs = fs.statSync(filePath).mtimeMs || Date.now();
    return true;
  };

  if (persistFile) {
    try {
      if (fs.existsSync(persistFile)) {
        hadExistingFile = true;
        loadedFromDisk = tryLoadJsonFile(persistFile);
      }
    } catch (err) {
      console.error(`[LexiPrep Sync] Failed reading primary store (${persistFile}), trying backup:`, err?.message || err);
    }
    if (!loadedFromDisk && backupFile && fs.existsSync(backupFile)) {
      try {
        loadedFromDisk = tryLoadJsonFile(backupFile);
        if (loadedFromDisk) {
          console.warn(`[LexiPrep Sync] Recovered store cleanly from backup: ${backupFile}`);
        }
      } catch (bakErr) {
        console.error(`[LexiPrep Sync] Failed reading backup store (${backupFile}):`, bakErr?.message || bakErr);
      }
    }
  }
  const seedInitializedOnBoot = !store.seeded ? seedCanonicalDefaults(store) : false;
  const protectedChanged = ensureProtectedAccounts(store);
  let seedMergedOnBoot = false;
  if (loadedFromDisk && store.seeded && Array.isArray(DEFAULT_TESTS)) {
    const deletedSet = new Set(Array.isArray(store.deletedTestIds) ? store.deletedTestIds : []);
    if (!store.seededTags || typeof store.seededTags !== 'object') store.seededTags = {};
    if (!Array.isArray(store.tests)) store.tests = [];
    DEFAULT_TESTS.forEach(dt => {
      if (!dt?.id || !dt?.seedTag) return;
      if (store.seededTags[dt.seedTag]) return;
      store.seededTags[dt.seedTag] = true;
      if (!deletedSet.has(dt.id) && !store.tests.some(t => t?.id === dt.id)) {
        store.tests = [...store.tests, dt];
      }
      seedMergedOnBoot = true;
    });
  }

  const mediaMigratedOnBoot = externalizeStoreMedia(store);
  const attemptsRepairedOnBoot = reconcileAllStaleAttemptsInStore(store);
  const mondayResetOnBoot = ensureWeeklyMondayReset(store, bootTimestamp);
  if (attemptsRepairedOnBoot || mondayResetOnBoot) {
    store.version += 1;
  }

  let writeTimer = null;
  const writeStoreSync = () => {
    if (!persistFile) return;
    const tmpFile = `${persistFile}.${process.pid}.${Date.now()}.tmp`;
    try {
      fs.mkdirSync(path.dirname(persistFile), { recursive: true });
      const {
        _audioDir,
        _audioMem,
        _mediaDir,
        _mediaMem,
        _mediaCache,
        _rateLimits,
        _otpChallenges,
        _unlockedSpeakingRooms,
        _unlockedExamRooms,
        _processedGameMatchIds,
        _knightPvpQueue,
        _knightPvpMatches,
        _knightPvpRooms,
        _dailyRankCache,
        _bootId,
        _localMutated,
        ...serializableStore
      } = store;
      const serialized = JSON.stringify(serializableStore);
      fs.writeFileSync(tmpFile, serialized, 'utf8');
      if (fs.existsSync(persistFile) && backupFile) {
        try {
          fs.copyFileSync(persistFile, backupFile);
        } catch {}
      }
      fs.renameSync(tmpFile, persistFile);
      lastDiskMtimeMs = fs.statSync(persistFile).mtimeMs || Date.now();
    } catch (err) {
      console.error(`[LexiPrep Sync] Failed persisting store to ${persistFile}:`, err?.message || err);
      try {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      } catch {}
    }
  };

  // Persist protected default accounts, _authSecret, migrated media & repaired objective scores immediately on boot
  if (persistFile && (!hadExistingFile || (loadedFromDisk && (protectedChanged || seedInitializedOnBoot || seedMergedOnBoot || mediaMigratedOnBoot || attemptsRepairedOnBoot)))) {
    if (mediaMigratedOnBoot) {
      console.log('[LexiPrep Sync] Migrated inline Base64 media to cached /api/sync/media/ files.');
    }
    if (attemptsRepairedOnBoot) {
      console.log('[LexiPrep Sync] Reconciled stale objective Listening/Reading attempt scores against current answer keys.');
    }
    writeStoreSync();
  }

  /**
   * During overlapping rolling deployments, adopt the old container's final SIGTERM flush
   * if disk has a newer higher-version snapshot and this instance has not mutated yet.
   */
  const syncFromDiskIfNewer = () => {
    if (!persistFile || store._localMutated) return false;
    const now = Date.now();
    if (now - bootTimestamp > 30_000) return false;
    if (now - lastStatCheckedAt < 350) return false;
    lastStatCheckedAt = now;
    try {
      if (!fs.existsSync(persistFile)) return false;
      const stat = fs.statSync(persistFile);
      if (!stat || stat.mtimeMs <= lastDiskMtimeMs + 1) return false;
      const parsed = JSON.parse(fs.readFileSync(persistFile, 'utf8'));
      lastDiskMtimeMs = stat.mtimeMs;
      if (parsed && typeof parsed === 'object' && Number(parsed.version) > Number(store.version)) {
        applyParsedStoreSnapshot(store, parsed);
        ensureProtectedAccounts(store);
        externalizeStoreMedia(store);
        if (reconcileAllStaleAttemptsInStore(store)) {
          store.version += 1;
        }
        return true;
      }
    } catch {}
    return false;
  };

  const schedulePersist = () => {
    if (!persistFile) return;
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      writeTimer = null;
      writeStoreSync();
    }, 200);
    writeTimer.unref?.();
  };

  const flushPersist = () => {
    if (writeTimer) {
      clearTimeout(writeTimer);
      writeTimer = null;
    }
    writeStoreSync();
  };

  return { store, schedulePersist, flushPersist, syncFromDiskIfNewer };
}

function readJsonBody(req, maxBytes = 24 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    req.on('data', chunk => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function readBinaryBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let exceeded = false;
    req.on('data', chunk => {
      if (exceeded) return;
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        exceeded = true;
        req.resume();
        reject(new Error('File ghi âm vượt quá giới hạn 100MB.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!exceeded) resolve(Buffer.concat(chunks, totalBytes));
    });
    req.on('error', error => {
      if (!exceeded) reject(error);
    });
  });
}

function buildPublicAdminSnapshotFields(store, viewer) {
  const superAdmin = store.users?.[SUPER_ADMIN_USERNAME];
  const isViewerSuperAdmin = Boolean(viewer?.isSuperAdmin && viewer.username === SUPER_ADMIN_USERNAME);
  const supportAdminProfile = superAdmin ? {
    username: SUPER_ADMIN_USERNAME,
    name: superAdmin.name || 'Quản Trị Hệ Thống',
    avatarUrl: superAdmin.avatarUrl || '',
    profileBannerId: superAdmin.profileBannerId || 'ocean',
    profileCoverUrl: superAdmin.profileCoverUrl || '',
    avatarFrameId: superAdmin.avatarFrameId || 'none',
    equippedTitleId: superAdmin.equippedTitleId || 'staff_ielts_10',
    showTitleBadge: superAdmin.showTitleBadge !== false,
    showExamTierBadge: superAdmin.showExamTierBadge !== false,
    grantedTitleIds: Array.isArray(superAdmin.grantedTitleIds) ? superAdmin.grantedTitleIds : [],
    purchasedTitleIds: Array.isArray(superAdmin.purchasedTitleIds) ? superAdmin.purchasedTitleIds : [],
    vipRedNameEnabled: superAdmin.vipRedNameEnabled === true,
    vipNameColor: normalizeVipNameColor(superAdmin.vipNameColor || 'crimson'),
    vipTagEnabled: superAdmin.vipTagEnabled === true,
    vipNeonCoverEnabled:
      superAdmin.vipNeonCoverEnabled !== undefined
        ? superAdmin.vipNeonCoverEnabled === true
        : (superAdmin.vipRedNameEnabled === true || superAdmin.vipTagEnabled === true),
    vipNeonCoverColor: normalizeVipNeonCoverColor(superAdmin.vipNeonCoverColor || 'aurora_rgb'),
    aieoVipExpiresAt: Number(superAdmin.aieoVipExpiresAt) || 0,
    role: 'admin',
    isSystemAdmin: true,
    joinedDate: superAdmin.joinedDate || '2026-01-01',
    studyGoal: superAdmin.studyGoal || 'Quản trị hệ thống & Tiếp nhận góp ý nâng cấp tính năng cho Học viên và Giáo viên'
  } : null;

  const adminFeedbacks = (Array.isArray(store.adminFeedbacks) ? store.adminFeedbacks : []).filter(fb => {
    if (!fb || !fb.id) return false;
    if (!fb.isPrivate) return true;
    return isViewerSuperAdmin || fb.authorUsername === viewer?.username;
  });

  const adminPaymentHistory = isViewerSuperAdmin
    ? (Array.isArray(store.paymentTransactions) ? store.paymentTransactions : []).slice(0, 200)
    : [];

  const viewerKey = viewer?.username ? (findUserKeyInStore(store, viewer.username) || viewer.username) : '';
  const myPaymentTransactions = viewerKey
    ? (Array.isArray(store.paymentTransactions) ? store.paymentTransactions : [])
        .filter(tx => tx && String(tx.username || '').toLowerCase() === viewerKey.toLowerCase())
        .slice(0, 100)
    : [];

  return { supportAdminProfile, adminFeedbacks, adminPaymentHistory, myPaymentTransactions };
}

function normalizeClassIdList(rawIds) {
  if (!Array.isArray(rawIds)) return [];
  const clean = new Set();
  rawIds.forEach(id => {
    const s = String(id || '').trim().slice(0, 48);
    if (s) clean.add(s);
  });
  return Array.from(clean).slice(0, 30);
}

function normalizeClassRecord(raw, fallbackId = '') {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || fallbackId || '').trim().slice(0, 48);
  if (!id) return null;
  const studentSet = new Set();
  (Array.isArray(raw.studentUsernames) ? raw.studentUsernames : []).forEach(u => {
    const cleanU = String(u || '').trim();
    if (cleanU && cleanU !== SUPER_ADMIN_USERNAME) studentSet.add(cleanU);
  });
  const allowedColors = new Set(['teal', 'indigo', 'rose', 'amber', 'emerald', 'violet']);
  return {
    id,
    name: String(raw.name || 'Lớp mới').trim().slice(0, 80) || 'Lớp mới',
    description: String(raw.description || '').trim().slice(0, 240),
    color: allowedColors.has(raw.color) ? raw.color : 'teal',
    studentUsernames: Array.from(studentSet),
    createdBy: String(raw.createdBy || 'teacher_ielts'),
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now()
  };
}

function getViewerClassIdSet(store, username = '') {
  const uname = String(username || '').trim();
  const unameLower = uname.toLowerCase();
  const set = new Set();
  if (!uname || !store?.classes) return set;
  Object.entries(store.classes).forEach(([cid, cls]) => {
    if (!cls || !Array.isArray(cls.studentUsernames)) return;
    if (cls.studentUsernames.some(u => String(u || '').toLowerCase() === unameLower)) {
      set.add(cls.id || cid);
    }
  });
  return set;
}

function resolveClassNamesByIds(store, classIds = []) {
  const cleanIds = normalizeClassIdList(classIds);
  if (cleanIds.length === 0) return [];
  return cleanIds
    .map(cid => store?.classes?.[cid]?.name || '')
    .filter(Boolean);
}

function appendStoreNotification(store, notif = {}, viewer = null) {
  const title = String(notif.title || '').trim().slice(0, 140);
  const message = String(notif.message || '').trim().slice(0, 500);
  if (!title || !message) return null;
  const type = ['exam', 'exercise', 'game', 'announcement', 'payment'].includes(notif.type) ? notif.type : 'announcement';
  const targetClassIds = normalizeClassIdList(notif.targetClassIds);
  const targetUsernames = Array.isArray(notif.targetUsernames)
    ? Array.from(new Set(notif.targetUsernames.map(u => String(u || '').trim()).filter(Boolean))).slice(0, 100)
    : [];
  const targetClassNames = Array.isArray(notif.targetClassNames)
    ? notif.targetClassNames.map(s => String(s || '').trim()).filter(Boolean).slice(0, 12)
    : resolveClassNamesByIds(store, targetClassIds);
  const item = {
    id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    type,
    testId: notif.testId ? String(notif.testId) : '',
    roomPin: notif.roomPin ? String(notif.roomPin) : '',
    payerUsername: notif.payerUsername ? String(notif.payerUsername).trim().slice(0, 64) : '',
    targetClassIds,
    targetClassNames,
    targetUsernames,
    createdBy: notif.createdBy || viewer?.username || 'teacher_ielts',
    createdByName: notif.createdByName || viewer?.name || 'Giáo viên',
    createdAt: notif.createdAt || new Date().toLocaleString('vi-VN'),
    timestamp: Number(notif.timestamp) || Date.now(),
    readBy: Array.isArray(notif.readBy) ? [...new Set(notif.readBy)] : [],
    dismissedBy: Array.isArray(notif.dismissedBy) ? [...new Set(notif.dismissedBy)] : []
  };
  const prevList = Array.isArray(store.notifications) ? store.notifications : [];
  store.notifications = [item, ...prevList].slice(0, 120);
  return item;
}

function recordPaymentTransactionAndNotifyAdmin(
  store,
  {
    orderCode = '',
    username = '',
    userName = '',
    itemType = 'donate',
    itemId = '',
    itemLabel = 'Ủng hộ duy trì trang web',
    amount = 0,
    status = 'paid',
    gateway = 'auto',
    txId = '',
    note = '',
    paidAt = 0,
    balanceBefore = null,
    balanceAfter = null,
    confirmedBy = '',
    suppressAdminNotify = false
  } = {}
) {
  const cleanUser = String(username || '').trim();
  if (!cleanUser) return null;
  const userKey = findUserKeyInStore(store, cleanUser) || cleanUser;
  const userRec = store.users?.[userKey];
  const displayName = String(userName || userRec?.name || userKey).trim().slice(0, 80);
  const cleanAmount = Math.max(0, Math.round(Number(amount) || 0));
  const nowMs = Date.now();
  const cleanOrderCode = String(orderCode || '').trim().slice(0, 32);
  const cleanTxId = String(txId || '').trim().slice(0, 80);
  const cleanNote = String(note || '').trim().slice(0, 180);
  const cleanLabel = String(itemLabel || 'Thanh toán').trim().slice(0, 140);
  const cleanItemType = String(itemType || 'donate').slice(0, 32);
  const cleanItemId = String(itemId || '').trim().slice(0, 80);

  if (!Array.isArray(store.paymentTransactions)) store.paymentTransactions = [];
  const existingIdx = store.paymentTransactions.findIndex(t => {
    if (!t) return false;
    if (cleanTxId && t.txId && t.txId === cleanTxId) return true;
    if (cleanOrderCode && t.orderCode && t.orderCode === cleanOrderCode && t.username === userKey) return true;
    // Upgrade a recent manual reported row for the exact same user + itemType + itemId so Admin cannot double-confirm
    if (
      status === 'paid' &&
      t.status === 'reported' &&
      t.username === userKey &&
      t.itemType === cleanItemType &&
      String(t.itemId || '') === cleanItemId &&
      nowMs - (Number(t.createdAt) || 0) < 24 * 60 * 60 * 1000
    ) {
      return true;
    }
    // Deduplicate repeated manual 'reported' clicks within 15 minutes
    if (
      status === 'reported' &&
      t.status === 'reported' &&
      t.username === userKey &&
      t.itemType === cleanItemType &&
      String(t.itemId || '') === cleanItemId &&
      Math.round(Number(t.amount) || 0) === cleanAmount &&
      nowMs - (Number(t.createdAt) || 0) < 15 * 60 * 1000
    ) {
      return true;
    }
    return false;
  });

  const prevRecord = existingIdx >= 0 ? store.paymentTransactions[existingIdx] : null;
  if (status === 'reported' && prevRecord && prevRecord.status === 'reported') {
    return prevRecord;
  }

  const record = {
    id: prevRecord ? prevRecord.id : `ptx_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
    orderCode: cleanOrderCode || (prevRecord ? prevRecord.orderCode : ''),
    username: userKey,
    userName: displayName,
    itemType: cleanItemType,
    itemId: cleanItemId || (prevRecord?.itemId || ''),
    itemLabel: cleanLabel,
    amount: cleanAmount,
    status: status === 'paid' ? 'paid' : 'reported',
    gateway: String(gateway || 'auto').slice(0, 32),
    txId: cleanTxId || (prevRecord?.txId || ''),
    note: cleanNote || (prevRecord?.note || ''),
    ...(balanceBefore ? { balanceBefore } : prevRecord?.balanceBefore ? { balanceBefore: prevRecord.balanceBefore } : {}),
    ...(balanceAfter ? { balanceAfter } : prevRecord?.balanceAfter ? { balanceAfter: prevRecord.balanceAfter } : {}),
    ...(confirmedBy ? { confirmedBy: String(confirmedBy).slice(0, 48) } : {}),
    paidAt: status === 'paid' ? (Number(paidAt) || nowMs) : 0,
    createdAt: prevRecord ? (Number(prevRecord.createdAt) || nowMs) : nowMs
  };

  if (existingIdx >= 0) {
    store.paymentTransactions[existingIdx] = record;
  } else {
    store.paymentTransactions = [record, ...store.paymentTransactions].slice(0, 500);
  }

  const gatewayLabel =
    gateway === 'payos'
      ? 'PayOS'
      : gateway === 'sepay'
      ? 'SePay'
      : gateway === 'manual_donate'
      ? 'Ủng hộ tùy tâm'
      : gateway === 'manual_request'
      ? 'Chuyển khoản tay'
      : gateway === 'credit_wallet'
      ? 'Ví Lượt Combo'
      : 'Hệ thống';

  if (!suppressAdminNotify && userKey !== SUPER_ADMIN_USERNAME) {
    const notifTitle =
      record.status === 'paid'
        ? `💰 +${formatVndCurrency(cleanAmount)} từ ${displayName} (@${userKey})`
        : `🔔 ${displayName} (@${userKey}) báo chuyển ${formatVndCurrency(cleanAmount)}`;
    const notifMsg =
      record.status === 'paid'
        ? `Tài khoản ${displayName} (@${userKey}) đã nạp/thanh toán thành công ${formatVndCurrency(cleanAmount)} cho "${cleanLabel}" qua ${gatewayLabel}${cleanOrderCode ? ` (mã ${cleanOrderCode})` : ''}.`
        : `Tài khoản ${displayName} (@${userKey}) vừa báo đã chuyển khoản ${formatVndCurrency(cleanAmount)} — "${cleanLabel}"${cleanNote ? ` · Lời nhắn: "${cleanNote}"` : ''}. Mở Hồ sơ Admin để đối chiếu & xác nhận.`;

    appendStoreNotification(
      store,
      {
        title: notifTitle,
        message: notifMsg,
        type: 'payment',
        payerUsername: userKey,
        targetUsernames: [SUPER_ADMIN_USERNAME],
        createdBy: userKey,
        createdByName: displayName
      },
      null
    );
  }

  return record;
}

function fulfillPaidEntitlementForUser(
  store,
  {
    userKey = '',
    itemType = 'cover',
    itemId = '',
    itemLabel = '',
    amount = 0,
    orderCode = '',
    gateway = 'auto',
    txId = '',
    confirmedBy = '',
    nowMs = Date.now()
  } = {}
) {
  const resolvedKey = findUserKeyInStore(store, userKey) || String(userKey || '').trim();
  const targetUser = resolvedKey ? store.users?.[resolvedKey] : null;
  if (!resolvedKey || !targetUser) {
    return { fulfilled: false, balanceBefore: null, balanceAfter: null };
  }

  const cleanAmount = Math.max(0, Math.round(Number(amount) || 0));
  const cleanType = String(itemType || 'cover').trim();
  const cleanOrderCode = String(orderCode || '').trim();
  const effectiveItemId = String(
    itemId ||
    (cleanType === 'title' ? targetUser.paidTitleRequested?.titleId : '') ||
    (cleanType === 'test' ? targetUser.subscriptionRequested?.itemId : '') ||
    ''
  ).trim();

  const balanceBefore = captureUserBalanceSnapshot(targetUser);
  const payCfgNow = normalizePaymentConfig(store.paymentConfig || {});
  const isManualAdmin = Boolean(confirmedBy);
  const senderLabel = isManualAdmin ? 'Admin Tuấn' : 'Hệ Thống Thanh Toán Tự Động';
  const codeSuffix = cleanOrderCode ? ` (mã đơn ${cleanOrderCode})` : '';

  if (cleanType === 'title') {
    const matchedTitleDef = effectiveItemId ? PAID_SHOP_TITLES.find(t => t.id === effectiveItemId) : null;
    const isPermanentDonate = matchedTitleDef ? Boolean(matchedTitleDef.isPermanentDonateTitle) : true;
    const prevPurchased = Array.isArray(targetUser.purchasedTitleIds) ? targetUser.purchasedTitleIds.map(String) : [];
    const nextPurchasedSet = new Set(prevPurchased);
    if (effectiveItemId) nextPurchasedSet.add(effectiveItemId);
    const prevExpiries =
      targetUser.purchasedTitleExpiries && typeof targetUser.purchasedTitleExpiries === 'object'
        ? { ...targetUser.purchasedTitleExpiries }
        : {};
    const nextDonatedTotal = isPermanentDonate
      ? (Number(targetUser.donatedTotalVnd) || 0) + cleanAmount
      : (Number(targetUser.donatedTotalVnd) || 0);
    if (isPermanentDonate) {
      if (effectiveItemId) delete prevExpiries[effectiveItemId];
      PAID_SHOP_TITLES.forEach(t => {
        if (t.isPermanentDonateTitle && nextDonatedTotal >= getTitlePriceVnd(t, payCfgNow)) {
          nextPurchasedSet.add(t.id);
          delete prevExpiries[t.id];
        }
      });
    } else if (effectiveItemId) {
      const baseExp = Math.max(nowMs, Number(prevExpiries[effectiveItemId]) || 0);
      prevExpiries[effectiveItemId] = baseExp + SUBSCRIPTION_DURATION_MS;
    }
    store.users[resolvedKey] = {
      ...targetUser,
      donatedTotalVnd: nextDonatedTotal,
      purchasedTitleIds: Array.from(nextPurchasedSet),
      purchasedTitleExpiries: prevExpiries,
      paidTitleRequested: null
    };
    appendStoreNotification(
      store,
      {
        title: isPermanentDonate
          ? '💜 Đã mở khóa VĨNH VIỄN Danh Hiệu Phú Quý!'
          : '🎉 Đã mở khóa Danh Hiệu VIP (1 Tháng)!',
        message: isPermanentDonate
          ? `Hệ thống đã nhận ${formatVndCurrency(cleanAmount)}${codeSuffix} và mở khóa VĨNH VIỄN danh hiệu ${itemLabel || effectiveItemId}. Cảm ơn bạn đã ủng hộ Tuấn duy trì trang web & server học tập!`
          : `Hệ thống đã nhận ${formatVndCurrency(cleanAmount)}${codeSuffix} và kích hoạt danh hiệu ${itemLabel || effectiveItemId} trong 30 ngày. Cảm ơn bạn đã ủng hộ Tuấn chi phí duy trì trang web & server học tập!`,
        type: 'announcement',
        targetUsernames: [resolvedKey],
        createdBy: SUPER_ADMIN_USERNAME,
        createdByName: senderLabel
      },
      null
    );
  } else if (cleanType === 'test' && effectiveItemId) {
    const prevTests = Array.isArray(targetUser.purchasedTestIds) ? targetUser.purchasedTestIds.map(String) : [];
    const alreadyOwned = prevTests.includes(effectiveItemId);
    const nextTests = Array.from(new Set([...prevTests, effectiveItemId]));
    const nextTotalPurchased = alreadyOwned
      ? getPurchasedExamCount(targetUser)
      : getPurchasedExamCount(targetUser) + 1;
    store.users[resolvedKey] = {
      ...targetUser,
      purchasedTestIds: nextTests,
      totalPurchasedExams: nextTotalPurchased,
      ...(targetUser.subscriptionRequested?.itemId === effectiveItemId || targetUser.subscriptionRequested?.itemType === 'test'
        ? { subscriptionRequested: null }
        : {})
    };
    appendStoreNotification(
      store,
      {
        title: '🎉 Đã mở khóa Đề Thi Thực Chiến 4 Kỹ Năng!',
        message: `Hệ thống đã nhận ${formatVndCurrency(cleanAmount)}${codeSuffix} và mở khóa ${itemLabel || effectiveItemId} (1 lượt thi thật đủ 4 kỹ năng L·R·W·S, chờ Ms. Như duyệt điểm sau khi nộp).`,
        type: 'announcement',
        targetUsernames: [resolvedKey],
        createdBy: SUPER_ADMIN_USERNAME,
        createdByName: senderLabel
      },
      null
    );
  } else if (Boolean(getRealExamComboMeta(cleanType, store.paymentConfig))) {
    const comboFulfilled = getRealExamComboMeta(cleanType, store.paymentConfig);
    const nextCredits = getRealExamCredits(targetUser) + comboFulfilled.credits;
    const nextTotalPurchased = getPurchasedExamCount(targetUser) + comboFulfilled.credits;
    store.users[resolvedKey] = {
      ...targetUser,
      realExamCredits: nextCredits,
      totalPurchasedExams: nextTotalPurchased,
      ...(targetUser.subscriptionRequested?.itemType === cleanType ? { subscriptionRequested: null } : {})
    };
    appendStoreNotification(
      store,
      {
        title: `🎉 Đã kích hoạt ${comboFulfilled.label} (+${comboFulfilled.credits} lượt Thi Thật)!`,
        message: `Hệ thống đã nhận ${formatVndCurrency(cleanAmount)}${codeSuffix} và cộng +${comboFulfilled.credits} lượt mở đề Thực Chiến Thi Thật 4 Kỹ Năng (hiện có ${nextCredits} lượt). Bạn có thể vào Trang Chủ bấm "Dùng 1 Lượt Combo" để vào thi ngay!`,
        type: 'announcement',
        targetUsernames: [resolvedKey],
        createdBy: SUPER_ADMIN_USERNAME,
        createdByName: senderLabel
      },
      null
    );
  } else if (cleanType === 'skill_pass') {
    const baseExp = Math.max(nowMs, Number(targetUser.skillPracticeExpiresAt) || 0);
    store.users[resolvedKey] = {
      ...targetUser,
      skillPracticeExpiresAt: baseExp + SUBSCRIPTION_DURATION_MS,
      ...(targetUser.subscriptionRequested?.itemType === 'skill_pass' ? { subscriptionRequested: null } : {})
    };
    appendStoreNotification(
      store,
      {
        title: '🎉 Đã kích hoạt Gói Daily Zone (1 Tháng)!',
        message: `Hệ thống đã nhận ${formatVndCurrency(cleanAmount)}${codeSuffix} và mở khóa 30 ngày sử dụng đầy đủ Khu Daily Zone! Cảm ơn bạn đã ủng hộ!`,
        type: 'announcement',
        targetUsernames: [resolvedKey],
        createdBy: SUPER_ADMIN_USERNAME,
        createdByName: senderLabel
      },
      null
    );
  } else if (cleanType === 'aieo_vip') {
    const wasVipActive = Number(targetUser.aieoVipExpiresAt) > nowMs;
    const baseVipExp = Math.max(nowMs, Number(targetUser.aieoVipExpiresAt) || 0);
    const nextVipExp = baseVipExp + SUBSCRIPTION_DURATION_MS;
    const nextSkillExp = Math.max(Number(targetUser.skillPracticeExpiresAt) || 0, nextVipExp);
    const autoEquipVip = !targetUser.equippedTitleId || targetUser.equippedTitleId === 'newbie';
    const keepCustomRed = Boolean(wasVipActive && targetUser.vipEffectsCustomizedAt);
    store.users[resolvedKey] = {
      ...targetUser,
      aieoVipExpiresAt: nextVipExp,
      skillPracticeExpiresAt: nextSkillExp,
      vipRedNameEnabled: keepCustomRed ? (targetUser.vipRedNameEnabled ?? true) : true,
      vipNameColor: normalizeVipNameColor(targetUser.vipNameColor || 'crimson'),
      vipTagEnabled: keepCustomRed ? (targetUser.vipTagEnabled ?? true) : true,
      vipNeonCoverEnabled: keepCustomRed ? (targetUser.vipNeonCoverEnabled ?? true) : true,
      vipNeonCoverColor: normalizeVipNeonCoverColor(targetUser.vipNeonCoverColor || 'aurora_rgb'),
      ...(!wasVipActive ? { vipEffectsCustomizedAt: 0 } : {}),
      ...(autoEquipVip ? { equippedTitleId: 'aieo_vip', showTitleBadge: true } : {}),
      ...(targetUser.subscriptionRequested?.itemType === 'aieo_vip' ? { subscriptionRequested: null } : {})
    };
    appendStoreNotification(
      store,
      {
        title: '👑 Chào mừng thành viên Gói IELTS VIP (1 Tháng)!',
        message: `Hệ thống đã nhận ${formatVndCurrency(cleanAmount)}${codeSuffix}. Bạn đã mở khóa 30 ngày: Ảnh Avatar Động (.GIF/.WebP), Tùy chọn Màu Chữ Tên & Viền Bìa LED Neon Nhiều Màu, Ảnh Bìa Cá Nhân miễn phí, Khung Avatar VIP, Danh hiệu 👑 IELTS VIP & Tạo phòng Game bạn bè! Cảm ơn bạn đã ủng hộ!`,
        type: 'announcement',
        targetUsernames: [resolvedKey],
        createdBy: SUPER_ADMIN_USERNAME,
        createdByName: senderLabel
      },
      null
    );
  } else if (cleanType === 'room_ticket') {
    const nextCredits = getFriendRoomTicketCredits(targetUser) + 1;
    store.users[resolvedKey] = {
      ...targetUser,
      roomCreateCredits: nextCredits,
      ...(targetUser.subscriptionRequested?.itemType === 'room_ticket' ? { subscriptionRequested: null } : {})
    };
    appendStoreNotification(
      store,
      {
        title: '🎫 Đã mở +1 Lượt Tạo Phòng Đấu Riêng!',
        message: `Hệ thống đã nhận ${formatVndCurrency(cleanAmount)}${codeSuffix} và cộng +1 vé tạo Phòng Đấu Riêng cùng bạn bè (hiện có ${nextCredits} lượt)! Cảm ơn bạn đã ủng hộ Tuấn!`,
        type: 'announcement',
        targetUsernames: [resolvedKey],
        createdBy: SUPER_ADMIN_USERNAME,
        createdByName: senderLabel
      },
      null
    );
  } else if (cleanType === 'gacha_wish_1' || cleanType === 'gacha_wish_10') {
    const wishAdd = cleanType === 'gacha_wish_10' ? 10 : 1;
    const nextWishCredits = getGachaWishPurchasedCredits(targetUser) + wishAdd;
    const prevRpg =
      targetUser.knightRpgProfile && typeof targetUser.knightRpgProfile === 'object'
        ? targetUser.knightRpgProfile
        : {};
    const nextRpgWishes = Math.max(0, (Number(prevRpg.wishes) || 0) + wishAdd);
    store.users[resolvedKey] = {
      ...targetUser,
      gachaWishCredits: nextWishCredits,
      knightRpgProfile: {
        ...prevRpg,
        wishes: nextRpgWishes,
        claimedServerWishCredits: nextWishCredits
      },
      ...(targetUser.subscriptionRequested?.itemType === cleanType ? { subscriptionRequested: null } : {})
    };
    appendStoreNotification(
      store,
      {
        title: `🌠 Đã cộng +${wishAdd} Lượt Quay Cầu Nguyện Gacha!`,
        message: `Hệ thống đã nhận ${formatVndCurrency(cleanAmount)}${codeSuffix} và cộng ngay +${wishAdd} 🌠 Lượt Quay Cầu Nguyện vào game Hiệp Sĩ Diệt Rồng (hiện có ${nextRpgWishes} lượt)! Chúc bạn quay nổ Vàng 5★!`,
        type: 'announcement',
        targetUsernames: [resolvedKey],
        createdBy: SUPER_ADMIN_USERNAME,
        createdByName: senderLabel
      },
      null
    );
  } else if (cleanType === 'donate') {
    const nextDonatedTotal = (Number(targetUser.donatedTotalVnd) || 0) + cleanAmount;
    const prevPurchased = Array.isArray(targetUser.purchasedTitleIds) ? targetUser.purchasedTitleIds.map(String) : [];
    const nextPurchasedSet = new Set(prevPurchased);
    const prevExpiries =
      targetUser.purchasedTitleExpiries && typeof targetUser.purchasedTitleExpiries === 'object'
        ? { ...targetUser.purchasedTitleExpiries }
        : {};
    const newlyPermanentTitles = [];
    PAID_SHOP_TITLES.forEach(t => {
      if (!t.isPermanentDonateTitle) return;
      if (nextDonatedTotal >= getTitlePriceVnd(t, payCfgNow)) {
        if (!nextPurchasedSet.has(t.id)) newlyPermanentTitles.push(t);
        nextPurchasedSet.add(t.id);
        delete prevExpiries[t.id];
      }
    });
    store.users[resolvedKey] = {
      ...targetUser,
      donatedTotalVnd: nextDonatedTotal,
      purchasedTitleIds: Array.from(nextPurchasedSet),
      purchasedTitleExpiries: prevExpiries
    };
    const unlockedText =
      newlyPermanentTitles.length > 0
        ? ` Tự động mở khóa VĨNH VIỄN danh hiệu: ${newlyPermanentTitles.map(t => `${t.icon} ${t.label}`).join(', ')}!`
        : '';
    appendStoreNotification(
      store,
      {
        title: '💜 Cảm ơn bạn đã ủng hộ duy trì website!',
        message: `Hệ thống đã nhận ${formatVndCurrency(cleanAmount)}${codeSuffix}.${unlockedText} Cảm ơn bạn đã ủng hộ Tuấn chi phí duy trì máy chủ & phát triển website học tập!`,
        type: 'announcement',
        targetUsernames: [resolvedKey],
        createdBy: SUPER_ADMIN_USERNAME,
        createdByName: senderLabel
      },
      null
    );
  } else {
    const baseCoverExp = Math.max(nowMs, Number(targetUser.customCoverExpiresAt) || 0);
    store.users[resolvedKey] = {
      ...targetUser,
      customCoverUnlocked: true,
      customCoverUnlockedAt: nowMs,
      customCoverExpiresAt: baseCoverExp + SUBSCRIPTION_DURATION_MS,
      customCoverUnlockedBy: confirmedBy || `auto_${gateway}`,
      coverUnlockRequestedAt: 0
    };
    appendStoreNotification(
      store,
      {
        title: '🎉 Đã mở khóa Ảnh Nền Riêng (1 Tháng)!',
        message: `Hệ thống đã nhận ${formatVndCurrency(cleanAmount)}${codeSuffix}. Bạn có thể tải & cắt ảnh bìa hồ sơ trong 30 ngày! Cảm ơn bạn đã ủng hộ Tuấn chi phí duy trì trang web!`,
        type: 'announcement',
        targetUsernames: [resolvedKey],
        createdBy: SUPER_ADMIN_USERNAME,
        createdByName: senderLabel
      },
      null
    );
  }

  const latestUserRec = store.users[resolvedKey] || targetUser;
  store.users[resolvedKey] = {
    ...latestUserRec,
    totalPaidVnd: (Number(latestUserRec.totalPaidVnd) || 0) + cleanAmount,
    paidCount: (Number(latestUserRec.paidCount) || 0) + 1,
    lastPaidAt: nowMs
  };

  // Mark any matching pending order in store.paymentOrders as paid to prevent webhook + manual double-crediting
  if (Array.isArray(store.paymentOrders)) {
    store.paymentOrders.forEach(o => {
      if (!o || o.status !== 'pending') return;
      const matchesCode = Boolean(cleanOrderCode && o.orderCode === cleanOrderCode);
      const matchesSamePendingItem = Boolean(
        !cleanOrderCode &&
        String(o.username || '').toLowerCase() === resolvedKey.toLowerCase() &&
        (o.itemType || 'cover') === cleanType &&
        String(o.itemId || '') === effectiveItemId
      );
      if (matchesCode || matchesSamePendingItem) {
        o.status = 'paid';
        o.paidAt = nowMs;
        o.paidAmount = cleanAmount;
        if (txId) o.txId = txId;
        o.gateway = gateway || o.gateway || 'manual_confirm';
      }
    });
  }

  const balanceAfter = captureUserBalanceSnapshot(store.users[resolvedKey]);
  return { fulfilled: true, balanceBefore, balanceAfter, effectiveItemId };
}

function serializeNotificationItem(n, uname = '') {
  const readArr = Array.isArray(n.readBy) ? n.readBy : [];
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type || 'announcement',
    testId: n.testId || '',
    roomPin: n.roomPin || '',
    payerUsername: n.payerUsername || '',
    targetClassIds: normalizeClassIdList(n.targetClassIds),
    targetClassNames: Array.isArray(n.targetClassNames) ? n.targetClassNames : [],
    targetUsernames: Array.isArray(n.targetUsernames) ? n.targetUsernames : [],
    createdBy: n.createdBy || '',
    createdByName: n.createdByName || '',
    createdAt: n.createdAt || '',
    timestamp: Number(n.timestamp) || 0,
    isRead: Boolean(uname && readArr.includes(uname)),
    readCount: readArr.length
  };
}

function serializeNotificationsForViewer(store, viewer) {
  if (!viewer) return [];
  const isViewerSuperAdmin = Boolean(viewer.isSuperAdmin || viewer.username === SUPER_ADMIN_USERNAME);
  if (viewer.role === 'teacher' && !isViewerSuperAdmin) {
    return [];
  }
  if (viewer.isGuest) {
    return [];
  }
  const list = Array.isArray(store.notifications) ? store.notifications : [];
  const uname = viewer.username || '';
  const unameLower = uname.toLowerCase();
  if (isViewerSuperAdmin) {
    return list
      .filter(n => {
        if (!n) return false;
        if (Array.isArray(n.dismissedBy) && n.dismissedBy.includes(uname)) return false;
        const targetUsers = Array.isArray(n.targetUsernames)
          ? n.targetUsernames.map(u => String(u || '').toLowerCase()).filter(Boolean)
          : [];
        return targetUsers.includes(unameLower);
      })
      .map(n => serializeNotificationItem(n, uname));
  }
  const viewerClassSet = getViewerClassIdSet(store, uname);
  const testsById = new Map((Array.isArray(store.tests) ? store.tests : []).map(t => [t?.id, t]));
  return list
    .filter(n => {
      if (!n || (n.createdBy && n.createdBy === uname)) return false;
      if (Array.isArray(n.dismissedBy) && n.dismissedBy.includes(uname)) return false;
      const targetUsers = Array.isArray(n.targetUsernames) ? n.targetUsernames.map(u => String(u || '').toLowerCase()).filter(Boolean) : [];
      if (targetUsers.length > 0 && !targetUsers.includes(unameLower)) {
        return false;
      }
      const nClasses = normalizeClassIdList(n.targetClassIds);
      if (nClasses.length > 0 && !nClasses.some(cid => viewerClassSet.has(cid))) {
        return false;
      }
      if (n.testId) {
        const linked = testsById.get(n.testId);
        if (linked) {
          if ((linked.visibility || 'public') === 'private') return false;
          const testClasses = normalizeClassIdList(linked.assignedClassIds);
          if (testClasses.length > 0 && !testClasses.some(cid => viewerClassSet.has(cid))) {
            return false;
          }
        }
      }
      return true;
    })
    .map(n => serializeNotificationItem(n, uname));
}

function serializeSentNotificationsForTeacher(store, viewer) {
  if (!viewer || viewer.role !== 'teacher') return [];
  const list = Array.isArray(store.notifications) ? store.notifications : [];
  return list.map(n => serializeNotificationItem(n, viewer.username || ''));
}

const STARTER_FIRST_GAME_FREE_WISHES = 10;

function grantFirstGameStarterGiftIfEligible(store, rawUsername) {
  if (!store || typeof store !== 'object' || !rawUsername) return false;
  const targetKey = findUserKeyInStore(store, rawUsername);
  const targetUser = targetKey ? store.users?.[targetKey] : null;
  if (!targetKey || !targetUser || targetUser.isGuest) return false;
  if (targetUser.starterFirstGameGiftClaimed || targetUser.knightRpgProfile?.firstGameGiftClaimed) {
    if (!targetUser.starterFirstGameGiftClaimed) {
      store.users[targetKey] = { ...targetUser, starterFirstGameGiftClaimed: true };
    }
    return false;
  }
  const nextWishCredits = getGachaWishPurchasedCredits(targetUser) + STARTER_FIRST_GAME_FREE_WISHES;
  const prevRpg =
    targetUser.knightRpgProfile && typeof targetUser.knightRpgProfile === 'object'
      ? targetUser.knightRpgProfile
      : {};
  const nextRpgWishes = Math.max(0, (Number(prevRpg.wishes) || 0) + STARTER_FIRST_GAME_FREE_WISHES);
  store.users[targetKey] = {
    ...targetUser,
    starterFirstGameGiftClaimed: true,
    gachaWishCredits: nextWishCredits,
    knightRpgProfile: {
      ...prevRpg,
      firstGameGiftClaimed: true,
      wishes: nextRpgWishes,
      claimedServerWishCredits: nextWishCredits
    }
  };
  appendStoreNotification(
    store,
    {
      title: `🎁 Quà Tân Thủ: Tặng +${STARTER_FIRST_GAME_FREE_WISHES} Lượt Quay Gacha Miễn Phí!`,
      message: `Chúc mừng bạn vừa hoàn thành trận game đầu tiên! Hệ thống đã tặng +${STARTER_FIRST_GAME_FREE_WISHES} 🌠 Lượt Quay Gacha miễn phí vào Hiệp Sĩ Diệt Rồng (hiện có ${nextRpgWishes} lượt).`,
      type: 'game',
      targetUsernames: [targetKey],
      createdBy: SUPER_ADMIN_USERNAME,
      createdByName: 'Hệ Thống Đấu Trường'
    },
    null
  );
  return true;
}

function ensureWeeklyMondayReset(store, nowMs = Date.now()) {
  if (!store || typeof store !== 'object') return false;
  const { weekKey } = getVietnamMondayWeekState(nowMs);
  const cfg = normalizeKnightGachaConfig(store.knightGachaConfig, nowMs);
  if (cfg.lastResetWeekKey === weekKey) {
    if (!store.knightGachaConfig) store.knightGachaConfig = cfg;
    return false;
  }

  // Monday 00:00 Vietnam time reached:
  // 1) Promote Admin's scheduled next Limited 5★ hero (if any) into this week's active Limited Banner
  const promotedHeroId = cfg.nextFeaturedHeroId || '';
  store.knightGachaConfig = {
    weekKey,
    activeFeaturedHeroId: promotedHeroId,
    nextFeaturedHeroId: '',
    lastResetWeekKey: weekKey
  };

  // 2) Archive ending week's game leaderboard so Monday's Daily Top 1/2/3 titles from Sunday still settle,
  //    then reset ONLY Game Leaderboard scores back to 0 (NEVER touch IELTS / academic attempts!)
  const endingGameBestByUser = new Map();
  if (Array.isArray(store.gamePracticeLeaderboard) && store.gamePracticeLeaderboard.length > 0) {
    store.archivedPrevWeekGameEntries = store.gamePracticeLeaderboard.slice(0, 250);
    store.gamePracticeLeaderboard.forEach(entry => {
      if (!entry?.username) return;
      const k = String(entry.username).toLowerCase();
      const s = Math.max(0, Math.floor(Number(entry.score) || 0));
      const perf = Number(entry.totalCount) >= 4 && Number(entry.passedCount) >= Number(entry.totalCount);
      const prev = endingGameBestByUser.get(k) || { score: 0, perfect: false };
      endingGameBestByUser.set(k, {
        score: Math.max(prev.score, s),
        perfect: Boolean(prev.perfect || perf)
      });
    });
  }
  store.gamePracticeLeaderboard = [];
  store.knightPvpLeaderboard = [];

  if (store.users && typeof store.users === 'object') {
    Object.keys(store.users).forEach(uKey => {
      const u = store.users[uKey];
      if (!u || typeof u !== 'object') return;
      const endingRec = endingGameBestByUser.get(String(u.username || uKey).toLowerCase());
      const nextAllTimeGame = Math.max(
        Math.floor(Number(u.allTimeBestGameScore) || 0),
        endingRec?.score || 0
      );
      const nextHasPerfect = Boolean(u.hasAllTimeGamePerfectRun || endingRec?.perfect);
      let nextRpg = u.knightRpgProfile;
      if (nextRpg && typeof nextRpg === 'object') {
        nextRpg = {
          ...nextRpg,
          allTimeBestScore: Math.max(
            Math.floor(Number(nextRpg.allTimeBestScore) || 0),
            Math.floor(Number(nextRpg.bestScore) || 0)
          ),
          bestScore: 0,
          bestScoreWeekKey: weekKey
        };
      }
      let nextPvp = u.knightPvpProfile;
      if (nextPvp && typeof nextPvp === 'object') {
        const normPvp = normalizeKnightPvpProfile(nextPvp);
        nextPvp = {
          ...normPvp,
          peakRp: Math.max(normPvp.peakRp, normPvp.rp),
          rp: 0,
          winStreak: 0
        };
      }
      store.users[uKey] = {
        ...u,
        allTimeBestGameScore: nextAllTimeGame,
        hasAllTimeGamePerfectRun: nextHasPerfect,
        ...(nextRpg ? { knightRpgProfile: nextRpg } : {}),
        ...(nextPvp ? { knightPvpProfile: nextPvp } : {})
      };
    });
  }

  if (store.rooms && typeof store.rooms === 'object') {
    Object.keys(store.rooms).forEach(pin => {
      const r = store.rooms[pin];
      if (!r || typeof r !== 'object' || r.status === 'playing') return;
      const nextPlayers = {};
      Object.entries(r.players || {}).forEach(([pk, pv]) => {
        if (pv && typeof pv === 'object') {
          nextPlayers[pk] = { ...pv, score: 0, streak: 0, updatedAtMs: nowMs };
        }
      });
      store.rooms[pin] = {
        ...r,
        players: nextPlayers,
        liveMatch: {}
      };
    });
  }

  store._localMutated = true;
  return true;
}

function ensureKnightPvpMaps(store) {
  if (!(store._knightPvpQueue instanceof Map)) store._knightPvpQueue = new Map();
  if (!(store._knightPvpMatches instanceof Map)) store._knightPvpMatches = new Map();
  if (!(store._knightPvpRooms instanceof Map)) store._knightPvpRooms = new Map();
}

function pruneStaleKnightPvpRuntime(store, nowMs = Date.now()) {
  ensureKnightPvpMaps(store);
  for (const [unameLower, q] of store._knightPvpQueue.entries()) {
    if (!q || nowMs - (Number(q.queuedAt) || 0) > 90_000) {
      store._knightPvpQueue.delete(unameLower);
    }
  }
  for (const [mId, m] of store._knightPvpMatches.entries()) {
    if (!m) {
      store._knightPvpMatches.delete(mId);
      continue;
    }
    if (m.status === 'READY_CHECK' && nowMs > (Number(m.readyDeadlineMs) || 0) + 2500) {
      m.status = 'CANCELLED';
      m.finishReason = 'Hết thời gian xác nhận vào trận.';
      m.updatedAtMs = nowMs;
    }
    const ageMs = nowMs - (Number(m.updatedAtMs || m.createdAt) || 0);
    if ((m.status === 'FINISHED' || m.status === 'CANCELLED') && ageMs > 180_000) {
      store._knightPvpMatches.delete(mId);
    } else if (ageMs > 900_000) {
      store._knightPvpMatches.delete(mId);
    }
  }
  for (const [code, room] of store._knightPvpRooms.entries()) {
    if (!room || nowMs - (Number(room.updatedAtMs || room.createdAt) || 0) > 1_800_000) {
      store._knightPvpRooms.delete(code);
    }
  }
}

function buildFighterSlotFromUser(userRecord, fallbackUsername = '') {
  const uname = String(userRecord?.username || fallbackUsername || 'player');
  const rpg = normalizeKnightRpgProfile(userRecord?.knightRpgProfile || {});
  const pvp = normalizeKnightPvpProfile(userRecord?.knightPvpProfile || {});
  return {
    username: uname,
    name: userRecord?.name || uname,
    avatarUrl: userRecord?.avatarUrl || '',
    isNpc: false,
    rp: pvp.rp,
    skinId: rpg.equippedSkin || 'holy_paladin',
    weaponId: rpg.equippedWeapon || '',
    accepted: false,
    lives: KNIGHT_PVP_LIVES_PER_ROUND,
    roundsWon: 0,
    hits: 0,
    freezes: 0,
    frozenUntilMs: 0
  };
}

function settleKnightPvpRankedRewards(
  store,
  username,
  { didWin = false, isDemonTiebreaker = false, opponentName = 'Đối thủ', mode = 'ranked_npc', nowMs = Date.now() } = {}
) {
  if (mode !== 'ranked_npc' && mode !== 'ranked_human') return null;
  const uKey = findUserKeyInStore(store, username);
  const userRec = uKey ? store.users?.[uKey] : null;
  if (!uKey || !userRec || userRec.isGuest) return null;

  const prevPvp = normalizeKnightPvpProfile(userRec.knightPvpProfile || {});
  const tier = getKnightPvpRankTier(prevPvp.rp);
  const streakBonusRp = didWin && prevPvp.winStreak >= 2 ? 5 : 0;
  const demonBonusRp = didWin && isDemonTiebreaker ? 8 : 0;
  const rpDelta = didWin
    ? tier.winRp + streakBonusRp + demonBonusRp
    : -Math.min(prevPvp.rp, tier.lossRp);
  const nextRp = Math.max(0, prevPvp.rp + rpDelta);
  const nextWinStreak = didWin ? prevPvp.winStreak + 1 : 0;
  const nextPvp = normalizeKnightPvpProfile({
    rp: nextRp,
    peakRp: Math.max(prevPvp.peakRp, nextRp),
    wins: prevPvp.wins + (didWin ? 1 : 0),
    losses: prevPvp.losses + (didWin ? 0 : 1),
    winStreak: nextWinStreak,
    bestWinStreak: Math.max(prevPvp.bestWinStreak, nextWinStreak),
    demonTiebreakerWins: prevPvp.demonTiebreakerWins + (didWin && isDemonTiebreaker ? 1 : 0),
    matchesPlayed: prevPvp.matchesPlayed + 1
  });

  const goldGain = didWin ? tier.goldWin + (isDemonTiebreaker ? 80 : 0) : 45;
  const prevRpg = normalizeKnightRpgProfile(userRec.knightRpgProfile || {}, nowMs);
  const nextRpg = {
    ...prevRpg,
    gold: Math.max(0, (Number(prevRpg.gold) || 0) + goldGain)
  };

  store.users[uKey] = {
    ...userRec,
    knightPvpProfile: nextPvp,
    knightRpgProfile: nextRpg
  };

  // Upsert weekly 1v1 PvP Leaderboard (resets every Monday 00:00 Vietnam time)
  const list = Array.isArray(store.knightPvpLeaderboard) ? [...store.knightPvpLeaderboard] : [];
  const existingIdx = list.findIndex(
    e => String(e?.username || '').toLowerCase() === String(userRec.username || uKey).toLowerCase()
  );
  const nextTier = getKnightPvpRankTier(nextPvp.rp);
  const rowEntry = {
    id: existingIdx >= 0 ? list[existingIdx].id : `kpvp_${userRec.username || uKey}`,
    username: userRec.username || uKey,
    name: userRec.name || userRec.username || uKey,
    rp: nextPvp.rp,
    peakRp: nextPvp.peakRp,
    wins: nextPvp.wins,
    losses: nextPvp.losses,
    winStreak: nextPvp.winStreak,
    bestWinStreak: nextPvp.bestWinStreak,
    demonTiebreakerWins: nextPvp.demonTiebreakerWins,
    tierId: nextTier.id,
    tierLabel: nextTier.label,
    skinId: nextRpg.equippedSkin || 'holy_paladin',
    lastOpponent: String(opponentName || '').slice(0, 60),
    updatedAtMs: nowMs
  };
  if (existingIdx >= 0) list[existingIdx] = rowEntry;
  else list.push(rowEntry);
  list.sort(
    (a, b) =>
      (Number(b.rp) || 0) - (Number(a.rp) || 0) ||
      (Number(b.wins) || 0) - (Number(a.wins) || 0) ||
      (Number(b.updatedAtMs) || 0) - (Number(a.updatedAtMs) || 0)
  );
  store.knightPvpLeaderboard = list.slice(0, 200);

  if (grantFirstGameStarterGiftIfEligible(store, userRec.username || uKey)) {
    // Starter gift applied if this was the player's very first completed game
  }

  return {
    didWin,
    rpDelta,
    nextRp: nextPvp.rp,
    goldGain,
    winStreak: nextPvp.winStreak,
    tierLabel: nextTier.label,
    isDemonTiebreaker
  };
}

function buildKnightPvpRealtimeForViewer(store, viewer, nowMs = Date.now()) {
  if (!viewer?.username || viewer.isGuest) return null;
  pruneStaleKnightPvpRuntime(store, nowMs);
  const vLower = String(viewer.username).toLowerCase();
  const qEntry = store._knightPvpQueue.get(vLower) || null;

  let activeMatch = null;
  for (const m of store._knightPvpMatches.values()) {
    if (!m) continue;
    const isP1 = String(m.p1?.username || '').toLowerCase() === vLower;
    const isP2 = !m.p2?.isNpc && String(m.p2?.username || '').toLowerCase() === vLower;
    if (!isP1 && !isP2) continue;
    if (
      !activeMatch ||
      (m.status === 'PLAYING' || m.status === 'READY_CHECK') ||
      (Number(m.updatedAtMs) || 0) > (Number(activeMatch.updatedAtMs) || 0)
    ) {
      activeMatch = m;
    }
  }

  let activeRoom = null;
  for (const r of store._knightPvpRooms.values()) {
    if (!r) continue;
    const isHost = String(r.hostUsername || '').toLowerCase() === vLower;
    const isGuest = String(r.guestUsername || '').toLowerCase() === vLower;
    if (isHost || isGuest) {
      activeRoom = r;
      break;
    }
  }

  return {
    inQueue: Boolean(qEntry),
    queuedAt: qEntry ? Number(qEntry.queuedAt) || nowMs : 0,
    queueTopicId: qEntry?.topicId || 'core',
    activeMatch: activeMatch ? { ...activeMatch } : null,
    activeRoom: activeRoom ? { ...activeRoom } : null
  };
}

function getSnapshotForViewer(store, viewer = null) {
  const nowMs = Date.now();
  pruneExpiredStoreChats(store, nowMs);
  if (ensureWeeklyMondayReset(store, nowMs)) {
    store.version += 1;
  }
  const todayKey = getVietnamDateKey(nowMs);
  const basePayload = {
    authenticated: Boolean(viewer),
    bootId: store._bootId || '',
    version: store.version,
    dateKey: todayKey,
    seeded: store.seeded,
    serverTime: nowMs,
    knightGachaConfig: normalizeKnightGachaConfig(store.knightGachaConfig, nowMs),
    aiConfigured: Boolean(getEffectiveGeminiKey(store)),
    mailConfigured: getEffectiveMailConfig(store).configured
  };

  if (!viewer) {
    return {
      ...basePayload,
      deletedUserIds: [],
      rooms: {},
      classes: {},
      tests: [],
      attempts: [],
      teacherNotes: {},
      users: {},
      customVocabTopics: [],
      speakingForecast: null,
      customTitles: [],
      gamePracticeLeaderboard: [],
      knightPvpLeaderboard: [],
      knightPvpRealtime: null,
      dailyRankTitles: null,
      paymentConfig: null,
      supportAdminProfile: null,
      adminFeedbacks: [],
      myPaymentTransactions: [],
      notifications: [],
      sentNotifications: []
    };
  }

  const sanitizedUsers = {};
  const isViewerTeacherOrAdmin = viewer.role === 'teacher' || Boolean(viewer.isSuperAdmin);
  const viewerClassSet = isViewerTeacherOrAdmin ? new Set() : getViewerClassIdSet(store, viewer.username);
  const sameClassPeerSet = new Set();
  if (!isViewerTeacherOrAdmin) {
    viewerClassSet.forEach(cid => {
      const cls = store.classes?.[cid];
      if (cls && Array.isArray(cls.studentUsernames)) {
        cls.studentUsernames.forEach(u => {
          const cleanLower = String(u || '').trim().toLowerCase();
          if (cleanLower) sameClassPeerSet.add(cleanLower);
        });
      }
    });
  }

  Object.entries(store.users || {}).forEach(([uname, u]) => {
    const clean = sanitizeUserForViewer(u, viewer);
    if (!clean) return;
    if (!isViewerTeacherOrAdmin) {
      const uLower = uname.toLowerCase();
      const vLower = String(viewer.username || '').toLowerCase();
      const isSelf = uLower === vLower;
      const isTeacherRole = clean.role === 'teacher';
      const isSameClassPeer = sameClassPeerSet.has(uLower);
      if (!isSelf && !isTeacherRole && !isSameClassPeer) {
        return;
      }
    }
    sanitizedUsers[uname] = clean;
  });
  const adminFields = buildPublicAdminSnapshotFields(store, viewer);
  const notifications = serializeNotificationsForViewer(store, viewer);
  const sentNotifications = serializeSentNotificationsForTeacher(store, viewer);
  let globalDailyRankTitles = null;
  if (
    store._dailyRankCache &&
    store._dailyRankCache.version === store.version &&
    store._dailyRankCache.dateKey === todayKey
  ) {
    globalDailyRankTitles = store._dailyRankCache.data;
  } else {
    globalDailyRankTitles = computeDailyLeaderboardTitleHolders({
      attempts: store.attempts || [],
      roomsDb: store.rooms || {},
      gamePracticeLeaderboard: [
        ...(Array.isArray(store.gamePracticeLeaderboard) ? store.gamePracticeLeaderboard : []),
        ...(Array.isArray(store.archivedPrevWeekGameEntries) ? store.archivedPrevWeekGameEntries : [])
      ],
      usersDb: store.users || {}
    });
    store._dailyRankCache = {
      version: store.version,
      dateKey: todayKey,
      data: globalDailyRankTitles
    };
  }

  if (viewer.role === 'teacher') {
    const sanitizedRooms = {};
    Object.entries(store.rooms || {}).forEach(([pin, r]) => {
      sanitizedRooms[pin] = r;
    });
    return {
      ...basePayload,
      deletedUserIds: (store.deletedUserIds || []).filter(id => id !== SUPER_ADMIN_USERNAME),
      rooms: sanitizedRooms,
      classes: store.classes || {},
      tests: store.tests || [],
      attempts: store.attempts || [],
      teacherNotes: store.teacherNotes || {},
      users: sanitizedUsers,
      customVocabTopics: store.customVocabTopics || [],
      speakingForecast: normalizeSpeakingForecastBank(store.speakingForecast),
      customTitles: Array.isArray(store.customTitles) ? store.customTitles : [],
      gamePracticeLeaderboard: Array.isArray(store.gamePracticeLeaderboard) ? store.gamePracticeLeaderboard : [],
      knightPvpLeaderboard: (Array.isArray(store.knightPvpLeaderboard) ? store.knightPvpLeaderboard : []).filter(
        e => viewer.isSuperAdmin || e?.username !== SUPER_ADMIN_USERNAME
      ),
      knightPvpRealtime: buildKnightPvpRealtimeForViewer(store, viewer, nowMs),
      dailyRankTitles: globalDailyRankTitles,
      paymentConfig: getPublicPaymentConfigSummary(store),
      ...adminFields,
      notifications,
      sentNotifications
    };
  }

  // Strict Guest view: ONLY public Thực Chiến & Mock Test exams + own attempts; hide Daily, Forecast, Game, Classes, Peers, Titles
  if (viewer.isGuest) {
    const myGuestAttempts = (store.attempts || [])
      .filter(a => a && (a.studentId === viewer.username || a.studentUsername === viewer.username))
      .map(att => sanitizeAttemptForStudentViewer(att));
    const guestSubmittedIds = new Set(myGuestAttempts.map(a => a.testId).filter(Boolean));
    const guestTests = (store.tests || [])
      .filter(t => {
        if (!t || (t.visibility || 'public') === 'private') return false;
        if (t.testMode === 'single_skill') return false;
        const assigned = normalizeClassIdList(t.assignedClassIds);
        if (assigned.length > 0) return false;
        return true;
      })
      .map(t => {
        const canSeeKeys = Boolean(t?.allowViewAnswers) && guestSubmittedIds.has(t.id);
        const safeTest = canSeeKeys ? { ...t } : stripAnswerKeysFromTest(t);
        const rawExamPass = String(safeTest?.examPassword || '').trim();
        const sanitizedExamTest = {
          ...safeTest,
          examPassword: '',
          hasExamPassword: Boolean(safeTest?.hasExamPassword || rawExamPass.length > 0)
        };
        if (sanitizedExamTest?.speaking && typeof sanitizedExamTest.speaking === 'object') {
          const rawPass = String(sanitizedExamTest.speaking.roomPassword || '').trim();
          return {
            ...sanitizedExamTest,
            speaking: {
              ...sanitizedExamTest.speaking,
              roomPassword: '',
              hasRoomPassword: Boolean(sanitizedExamTest.speaking.hasRoomPassword || rawPass.length > 0)
            }
          };
        }
        return sanitizedExamTest;
      });
    const selfClean = sanitizedUsers[viewer.username] ? { [viewer.username]: sanitizedUsers[viewer.username] } : {};
    return {
      ...basePayload,
      deletedUserIds: [],
      rooms: {},
      classes: {},
      tests: guestTests,
      attempts: myGuestAttempts,
      teacherNotes: {},
      users: selfClean,
      customVocabTopics: [],
      speakingForecast: null,
      customTitles: [],
      gamePracticeLeaderboard: [],
      knightPvpLeaderboard: [],
      knightPvpRealtime: null,
      dailyRankTitles: null,
      paymentConfig: getPublicPaymentConfigSummary(store),
      ...adminFields,
      notifications,
      sentNotifications: []
    };
  }

  // Strict student view: hide private tests & other-class tests, strip keys & Speaking exam-room passwords, isolate peers by class
  const studentClasses = {};
  Object.entries(store.classes || {}).forEach(([cid, cls]) => {
    if (cls && viewerClassSet.has(cls.id || cid)) {
      studentClasses[cid] = {
        id: cls.id || cid,
        name: cls.name,
        description: cls.description || '',
        color: cls.color || 'teal',
        studentUsernames: Array.isArray(cls.studentUsernames)
          ? cls.studentUsernames.filter(u => Boolean(sanitizedUsers[u]))
          : [viewer.username]
      };
    }
  });

  const viewerAttempts = (store.attempts || []).filter(
    a => a.studentId === viewer.username || a.studentUsername === viewer.username
  );
  const submittedTestIds = new Set(viewerAttempts.map(a => a.testId).filter(Boolean));

  const studentTests = (store.tests || [])
    .filter(t => {
      if ((t?.visibility || 'public') === 'private') return false;
      const assigned = normalizeClassIdList(t?.assignedClassIds);
      if (assigned.length > 0 && !assigned.some(cid => viewerClassSet.has(cid))) return false;
      return true;
    })
    .map(t => {
      const canSeeKeys = Boolean(t?.allowViewAnswers) && submittedTestIds.has(t.id);
      const safeTest = canSeeKeys ? { ...t } : stripAnswerKeysFromTest(t);
      const rawExamPass = String(safeTest?.examPassword || '').trim();
      const sanitizedExamTest = {
        ...safeTest,
        examPassword: '',
        hasExamPassword: Boolean(safeTest?.hasExamPassword || rawExamPass.length > 0)
      };
      if (sanitizedExamTest?.speaking && typeof sanitizedExamTest.speaking === 'object') {
        const rawPass = String(sanitizedExamTest.speaking.roomPassword || '').trim();
        return {
          ...sanitizedExamTest,
          speaking: {
            ...sanitizedExamTest.speaking,
            roomPassword: '',
            hasRoomPassword: Boolean(sanitizedExamTest.speaking.hasRoomPassword || rawPass.length > 0)
          }
        };
      }
      return sanitizedExamTest;
    });

  const studentAttempts = (store.attempts || [])
    .filter(att => {
      if (!att) return false;
      const attStuLower = String(att.studentId || att.studentUsername || '').trim().toLowerCase();
      if (attStuLower === String(viewer.username || '').toLowerCase()) return true;
      if (sameClassPeerSet.has(attStuLower)) return true;
      return store.users?.[att.studentId]?.role === 'teacher';
    })
    .map(att => {
      const isMine = att.studentId === viewer.username || att.studentUsername === viewer.username;
      return isMine ? sanitizeAttemptForStudentViewer(att) : sanitizeAttemptForPeer(att);
    });

  const studentRooms = {};
  Object.entries(store.rooms || {}).forEach(([pin, r]) => {
    if (!r) return;
    const isMyHostedFriendRoom = Boolean(
      r.roomMode === 'friend_vip' &&
      r.hostUsername &&
      r.hostUsername === viewer.username
    );
    if (isMyHostedFriendRoom) {
      studentRooms[pin] = r;
    } else {
      const { pass: _hiddenPass, ...rest } = r;
      studentRooms[pin] = { ...rest, hasPassword: Boolean(_hiddenPass) };
    }
  });

  const myNote = store.teacherNotes?.[viewer.username];

  const viewerLower = String(viewer.username || '').trim().toLowerCase();
  const studentDailyByTitleId = {};
  const studentDailyByUsername = {};
  Object.entries(globalDailyRankTitles.byTitleId || {}).forEach(([tid, rec]) => {
    if (!rec) return;
    const holderLower = String(rec.username || '').trim().toLowerCase();
    const canRevealHolder = holderLower && (holderLower === viewerLower || sameClassPeerSet.has(holderLower));
    if (canRevealHolder) {
      studentDailyByTitleId[tid] = rec;
      studentDailyByUsername[holderLower] = rec;
    } else {
      studentDailyByTitleId[tid] = {
        ...rec,
        username: '',
        name: 'Học viên lớp khác',
        occupiedByOtherClass: true
      };
    }
  });
  const studentBoardRankings = {};
  Object.entries(globalDailyRankTitles.boardRankings || {}).forEach(([boardId, rows]) => {
    studentBoardRankings[boardId] = (Array.isArray(rows) ? rows : []).map(row => {
      const holderLower = String(row?.username || '').trim().toLowerCase();
      const canRevealHolder = holderLower && (holderLower === viewerLower || sameClassPeerSet.has(holderLower));
      return canRevealHolder
        ? row
        : { ...row, username: '', name: 'Học viên lớp khác', occupiedByOtherClass: true };
    });
  });
  const studentDailyRankTitles = {
    dateKey: globalDailyRankTitles.dateKey,
    expiresAtMs: globalDailyRankTitles.expiresAtMs,
    byTitleId: studentDailyByTitleId,
    byUsername: studentDailyByUsername,
    boardRankings: studentBoardRankings
  };

  return {
    ...basePayload,
    deletedUserIds: [],
    rooms: studentRooms,
    classes: studentClasses,
    tests: studentTests,
    attempts: studentAttempts,
    teacherNotes: myNote !== undefined ? { [viewer.username]: myNote } : {},
    users: sanitizedUsers,
    customVocabTopics: store.customVocabTopics || [],
    speakingForecast: filterSpeakingForecastForViewer(store.speakingForecast, Array.from(viewerClassSet), false),
    customTitles: Array.isArray(store.customTitles) ? store.customTitles : [],
    gamePracticeLeaderboard: (Array.isArray(store.gamePracticeLeaderboard) ? store.gamePracticeLeaderboard : []).filter(entry => {
      if (!entry?.username) return false;
      const uLower = String(entry.username).trim().toLowerCase();
      if (uLower === String(viewer.username || '').toLowerCase()) return true;
      if (sameClassPeerSet.has(uLower)) return true;
      return store.users?.[entry.username]?.role === 'teacher';
    }),
    knightPvpLeaderboard: (Array.isArray(store.knightPvpLeaderboard) ? store.knightPvpLeaderboard : [])
      .filter(entry => {
        if (!entry?.username) return false;
        if (entry.username === SUPER_ADMIN_USERNAME) return false;
        return true;
      })
      .map(entry => {
        const uLower = String(entry.username).trim().toLowerCase();
        const canReveal =
          uLower === viewerLower ||
          sameClassPeerSet.has(uLower) ||
          store.users?.[entry.username]?.role === 'teacher';
        return canReveal
          ? entry
          : { ...entry, name: `Đấu Sĩ #${String(entry.username).slice(0, 3).toUpperCase()}` };
      }),
    knightPvpRealtime: buildKnightPvpRealtimeForViewer(store, viewer, nowMs),
    dailyRankTitles: studentDailyRankTitles,
    paymentConfig: getPublicPaymentConfigSummary(store),
    ...adminFields,
    notifications,
    sentNotifications: []
  };
}

function authorizeSyncAction(store, type, payload = {}, viewer = null) {
  if (type === 'SEED_DEFAULTS') {
    if (!viewer) return { allowed: false, status: 401, error: 'Vui lòng đăng nhập để đồng bộ.' };
    if (viewer.role !== 'teacher') {
      return { allowed: false, status: 403, error: 'Chỉ Giáo viên mới được đồng bộ dữ liệu mặc định.' };
    }
    return { allowed: true };
  }

  if (!viewer) {
    return { allowed: false, status: 401, error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };
  }

  const isTeacher = viewer.role === 'teacher';
  const isSuperAdmin = Boolean(viewer.isSuperAdmin && viewer.username === SUPER_ADMIN_USERNAME);

  const teacherOnlyActions = new Set([
    'UPSERT_TEST',
    'UPSERT_TESTS_BULK',
    'DELETE_TEST',
    'TOGGLE_TEST_ANSWERS',
    'TOGGLE_TEST_VISIBILITY',
    'UPSERT_CLASS',
    'DELETE_CLASS',
    'UPDATE_CLASS_MEMBERS',
    'ASSIGN_TEST_CLASSES',
    'ASSIGN_FOLDER_CLASSES',
    'DELETE_ATTEMPT',
    'PURGE_ORPHAN_ATTEMPTS',
    'UPSERT_NOTE',
    'UPSERT_VOCAB_TOPIC',
    'DELETE_VOCAB_TOPIC',
    'UPSERT_SPEAKING_FORECAST',
    'SET_AI_CONFIG',
    'CREATE_NOTIFICATION',
    'DELETE_NOTIFICATION'
  ]);

  const canManageTargetRoom = (pin) => {
    if (isTeacher) return true;
    const viewerRecord = store.users?.[viewer.username] || viewer;
    const cleanPin = String(pin || '').trim();
    if (!cleanPin) return false;
    const existingRoom = store.rooms?.[cleanPin];
    if (!existingRoom) {
      return type === 'UPSERT_ROOM' && canCreateFriendRoomNow(viewerRecord);
    }
    return existingRoom.roomMode === 'friend_vip' && existingRoom.hostUsername === viewer.username;
  };

  if (teacherOnlyActions.has(type)) {
    if (!isTeacher) {
      return { allowed: false, status: 403, error: 'Chỉ Giáo viên mới có quyền thực hiện thao tác này.' };
    }
    return { allowed: true };
  }

  if (!isTeacher && viewer.isGuest) {
    const guestAllowedActions = new Set([
      'UPSERT_ATTEMPT',
      'UPSERT_USER',
      'REDEEM_REAL_EXAM_CREDIT',
      'REQUEST_COVER_UNLOCK',
      'MARK_NOTIFICATIONS_READ',
      'DISMISS_NOTIFICATIONS'
    ]);
    if (!guestAllowedActions.has(type)) {
      return {
        allowed: false,
        status: 403,
        error: 'Tài khoản Khách chỉ được phép mua và làm Đề Thực Chiến & Mock Test.'
      };
    }
  }

  switch (type) {
    case 'UPSERT_ROOM': {
      const cleanPin = String(payload?.pin || '').trim();
      if (!isTeacher) {
        const viewerRecord = store.users?.[viewer.username] || viewer;
        if (cleanPin === '686868') {
          return { allowed: false, status: 403, error: 'Mã phòng 686868 dành riêng cho Giáo viên.' };
        }
        const existingRoom = cleanPin ? store.rooms?.[cleanPin] : null;
        if (existingRoom && (existingRoom.roomMode !== 'friend_vip' || existingRoom.hostUsername !== viewer.username)) {
          return { allowed: false, status: 403, error: 'Mã phòng này đang thuộc về Giáo viên hoặc chủ phòng khác.' };
        }
        if (!existingRoom && !canCreateFriendRoomNow(viewerRecord)) {
          return {
          allowed: false,
          status: 403,
          error: `Cần mua 1 Lượt Tạo Phòng (5.000đ) hoặc đăng ký Gói IELTS VIP (${formatVndCurrency(store.paymentConfig?.aieoVipPrice ?? AIEO_VIP_PRICE_VND)}/1 tháng) để tạo phòng đấu bạn bè!`
        };
        }
        const oldPin = payload?.oldPin ? String(payload.oldPin).trim() : '';
        if (oldPin && oldPin !== cleanPin) {
          const oldRoom = store.rooms?.[oldPin];
          if (!oldRoom || oldRoom.roomMode !== 'friend_vip' || oldRoom.hostUsername !== viewer.username) {
            return { allowed: false, status: 403, error: 'Không có quyền đổi mã phòng của người khác.' };
          }
        }
      }
      return { allowed: true };
    }

    case 'CLEAR_LOBBY_CHAT':
    case 'START_GAME':
    case 'FINISH_ROOM_MATCH':
    case 'KICK_LOBBY_PLAYER':
    case 'DELETE_ROOM':
    case 'RESET_LOBBY':
    case 'APPROVE_LOBBY_PLAYER':
    case 'SHUFFLE_ROOM_TEAMS': {
      const cleanPin = String(payload?.pin || '').trim();
      if (!canManageTargetRoom(cleanPin)) {
        return { allowed: false, status: 403, error: 'Chỉ Giáo viên hoặc Chủ phòng Gói IELTS VIP mới được điều khiển phòng đấu này.' };
      }
      return { allowed: true };
    }
    case 'SET_PLAYER_TEAM': {
      const cleanPin = String(payload?.pin || '').trim();
      const targetU = String(payload?.username || '').trim();
      if (!cleanPin || !store.rooms?.[cleanPin]) {
        return { allowed: false, status: 404, error: 'Không tìm thấy phòng đấu.' };
      }
      if (!canManageTargetRoom(cleanPin) && targetU !== viewer.username) {
        return { allowed: false, status: 403, error: 'Bạn chỉ có quyền đổi Team cho chính mình.' };
      }
      return { allowed: true };
    }
    case 'RESET_USER_PASSWORD': {
      const targetKey = findUserKeyInStore(store, payload?.username);
      const targetUser = targetKey ? store.users?.[targetKey] : null;
      if (!targetKey || !targetUser) {
        return { allowed: false, status: 404, error: 'Không tìm thấy tài khoản.' };
      }
      if (!isTeacher) {
        return { allowed: false, status: 403, error: 'Không có quyền đặt lại mật khẩu.' };
      }
      if ((targetUser.isSuperAdmin || targetKey === SUPER_ADMIN_USERNAME) && !isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Không có quyền thao tác trên tài khoản Quản trị hệ thống.' };
      }
      if (targetUser.role === 'teacher' && targetKey !== viewer.username && !isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Chỉ Quản trị hệ thống mới có thể đổi mật khẩu của tài khoản Giáo viên khác.' };
      }
      return { allowed: true };
    }

    case 'DELETE_USER': {
      if (!isTeacher) {
        return { allowed: false, status: 403, error: 'Chỉ Giáo viên mới được xóa tài khoản.' };
      }
      const targetKey = findUserKeyInStore(store, payload?.username) || normalizeUsernameKey(payload?.username);
      const targetUser = store.users?.[targetKey];
      if (!targetKey || targetKey === SUPER_ADMIN_USERNAME || targetUser?.isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Không thể xóa tài khoản Quản trị hệ thống.' };
      }
      if (targetKey === viewer.username) {
        return { allowed: false, status: 403, error: 'Không thể tự xóa tài khoản đang đăng nhập.' };
      }
      if (targetUser?.role === 'teacher') {
        const remainingTeachers = Object.values(store.users || {}).filter(
          u => u && u.role === 'teacher' && !u.isSuperAdmin && u.username !== SUPER_ADMIN_USERNAME && u.username !== targetKey
        ).length;
        if (remainingTeachers < 1) {
          return { allowed: false, status: 403, error: 'Cần giữ lại ít nhất 1 tài khoản Giáo viên trong hệ thống.' };
        }
      }
      return { allowed: true };
    }

    case 'DELETE_USERS_BULK': {
      if (!isTeacher) {
        return { allowed: false, status: 403, error: 'Chỉ Giáo viên mới được xóa tài khoản.' };
      }
      const rawNames = Array.isArray(payload?.usernames)
        ? [...new Set(payload.usernames.map(u => findUserKeyInStore(store, u) || normalizeUsernameKey(u)).filter(Boolean))]
        : [];
      if (rawNames.length === 0) {
        return { allowed: false, status: 400, error: 'Chưa chọn tài khoản nào để xóa.' };
      }
      const deletableNames = rawNames.filter(uname => {
        const target = store.users?.[uname];
        return uname !== SUPER_ADMIN_USERNAME && !target?.isSuperAdmin && uname !== viewer.username;
      });
      if (deletableNames.length === 0) {
        return { allowed: false, status: 403, error: 'Không có tài khoản hợp lệ nào có thể xóa.' };
      }
      const deleteSet = new Set(deletableNames);
      const remainingTeachers = Object.values(store.users || {}).filter(
        u => u && u.role === 'teacher' && !u.isSuperAdmin && u.username !== SUPER_ADMIN_USERNAME && !deleteSet.has(u.username)
      ).length;
      if (remainingTeachers < 1) {
        return { allowed: false, status: 403, error: 'Cần giữ lại ít nhất 1 tài khoản Giáo viên trong hệ thống.' };
      }
      return { allowed: true };
    }

    case 'UPSERT_USERS_BULK': {
      if (!isTeacher) {
        return { allowed: false, status: 403, error: 'Chỉ Giáo viên mới được tạo tài khoản hàng loạt.' };
      }
      const rawUsers = Array.isArray(payload?.users) ? payload.users : [];
      if (rawUsers.length === 0) {
        return { allowed: false, status: 400, error: 'Danh sách tài khoản trống.' };
      }
      if (rawUsers.length > 500) {
        return { allowed: false, status: 400, error: 'Tối đa 500 tài khoản mỗi lần nhập.' };
      }
      for (const item of rawUsers) {
        const uname = findUserKeyInStore(store, item?.username) || normalizeUsernameKey(item?.username);
        if (!uname) {
          return { allowed: false, status: 400, error: 'Có dòng tài khoản thiếu tên đăng nhập.' };
        }
        const targetExisting = store.users?.[uname];
        if ((targetExisting?.isSuperAdmin || uname === SUPER_ADMIN_USERNAME) && !isSuperAdmin) {
          return { allowed: false, status: 403, error: 'Không thể chỉnh sửa tài khoản Quản trị hệ thống.' };
        }
        const currentRole = String(targetExisting?.role || 'student').toLowerCase();
        const requestedRole = String(item?.role || currentRole).toLowerCase();
        if (!isSuperAdmin && (requestedRole === 'teacher' || currentRole === 'teacher')) {
          return { allowed: false, status: 403, error: 'Chỉ Quản trị hệ thống mới được tạo hoặc thay đổi vai trò Giáo viên.' };
        }
      }
      return { allowed: true };
    }

    case 'UPSERT_USER': {
      const uname = findUserKeyInStore(store, payload?.username || payload?.user?.username)
        || normalizeUsernameKey(payload?.username || payload?.user?.username);
      if (!uname || !payload?.user) {
        return { allowed: false, status: 400, error: 'Thiếu thông tin tài khoản.' };
      }
      const targetExisting = store.users?.[uname];
      if ((targetExisting?.isSuperAdmin || uname === SUPER_ADMIN_USERNAME) && !isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Không thể chỉnh sửa tài khoản Quản trị hệ thống.' };
      }
      if (isTeacher && !isSuperAdmin) {
        const currentRole = String(targetExisting?.role || 'student').toLowerCase();
        const requestedRole = String(payload.user.role || currentRole).toLowerCase();
        const isSelfTeacherUpdate = uname === viewer.username && currentRole === 'teacher' && requestedRole === 'teacher';
        if ((requestedRole === 'teacher' || currentRole === 'teacher') && !isSelfTeacherUpdate) {
          return { allowed: false, status: 403, error: 'Chỉ Quản trị hệ thống mới được tạo hoặc thay đổi vai trò Giáo viên.' };
        }
      }
      if (!isTeacher) {
        if (uname !== viewer.username) {
          return { allowed: false, status: 403, error: 'Học viên không được phép sửa tài khoản người khác.' };
        }
        if (payload.user.role === 'teacher' || payload.user.isSuperAdmin) {
          return { allowed: false, status: 403, error: 'Không có quyền nâng cấp vai trò tài khoản.' };
        }
        const incomingCover = String(payload.user.profileCoverUrl || '').trim();
        if (incomingCover && !hasCustomCoverPermission(targetExisting || viewer)) {
          const priceLabel = formatVndCurrency(store.paymentConfig?.coverUnlockPrice);
          return {
            allowed: false,
            status: 403,
            error: `Tính năng tải Ảnh Nền Riêng có giá ${priceLabel}. Vui lòng thanh toán QR để mở khóa tự động hoặc liên hệ Quản Trị Viên (0367 073 526)!`
          };
        }
        return { allowed: true };
      }
      return { allowed: true };
    }

    case 'UPDATE_PAYMENT_CONFIG': {
      if (!isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Chỉ Quản Trị Hệ Thống mới có quyền chỉnh giá tiền & cấu hình thanh toán!' };
      }
      return { allowed: true };
    }

    case 'TOGGLE_USER_COVER_UNLOCK':
    case 'TOGGLE_USER_SUBSCRIPTION': {
      if (!isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Chỉ Quản Trị Hệ Thống mới có quyền mở khóa / khóa quyền thu phí của học viên!' };
      }
      const targetKey = findUserKeyInStore(store, payload?.username);
      const targetUser = targetKey ? store.users?.[targetKey] : null;
      if (!targetKey || !targetUser) {
        return { allowed: false, status: 404, error: 'Không tìm thấy tài khoản học viên.' };
      }
      return { allowed: true };
    }

    case 'REQUEST_COVER_UNLOCK': {
      if (!checkRateLimit(store._rateLimits, `pay_req:${viewer.username.toLowerCase()}`, 12, 5 * 60 * 1000)) {
        return { allowed: false, status: 429, error: 'Bạn gửi yêu cầu báo chuyển khoản quá nhanh. Vui lòng đợi ít phút rồi thử lại.' };
      }
      const reqType = payload?.itemType !== undefined && payload?.itemType !== '' ? String(payload.itemType).trim() : 'cover';
      if (!VALID_PAYMENT_ITEM_TYPES.has(reqType)) {
        return { allowed: false, status: 400, error: 'Loại gói mở khóa không hợp lệ.' };
      }
      const me = store.users?.[viewer.username] || viewer;
      if (!isTeacher && viewer.isGuest) {
        const isAllowedGuestReq =
          payload?.itemType === 'test' ||
          Boolean(getRealExamComboMeta(payload?.itemType, store.paymentConfig));
        if (!isAllowedGuestReq) {
          return {
            allowed: false,
            status: 403,
            error: 'Tài khoản Khách chỉ được phép mua Đề Thực Chiến và Mock Test.'
          };
        }
      }
      if (payload?.itemType === 'title') {
        const titleId = String(payload?.itemId || '').trim();
        const paidTitle = PAID_SHOP_TITLES.find(t => t.id === titleId);
        if (!paidTitle) {
          return { allowed: false, status: 400, error: 'Danh hiệu không hợp lệ.' };
        }
        return { allowed: true };
      }
      if (payload?.itemType === 'test') {
        const tid = String(payload?.itemId || '').trim();
        const targetTest = (store.tests || []).find(t => t?.id === tid);
        if (!targetTest || getTestPurchasePriceVnd(targetTest) <= 0) {
          return { allowed: false, status: 400, error: 'Đề thi không hợp lệ hoặc đang miễn phí.' };
        }
        return { allowed: true };
      }
      if (
        payload?.itemType === 'skill_pass' ||
        payload?.itemType === 'aieo_vip' ||
        payload?.itemType === 'room_ticket' ||
        payload?.itemType === 'gacha_wish_1' ||
        payload?.itemType === 'gacha_wish_10' ||
        Boolean(getRealExamComboMeta(payload?.itemType, store.paymentConfig))
      ) {
        return { allowed: true };
      }
      if (hasCustomCoverPermission(me) && !payload?.renew) {
        return { allowed: false, status: 400, error: 'Tài khoản của bạn đã mở khóa quyền Ảnh Nền Riêng rồi!' };
      }
      return { allowed: true };
    }

    case 'REDEEM_REAL_EXAM_CREDIT': {
      const me = store.users?.[viewer.username] || viewer;
      const tid = String(payload?.testId || '').trim();
      const targetTest = (store.tests || []).find(t => t?.id === tid);
      if (!targetTest) {
        return { allowed: false, status: 404, error: 'Không tìm thấy đề thi Thực Chiến.' };
      }
      if (targetTest.testMode === 'single_skill') {
        return { allowed: false, status: 400, error: 'Bài tập Daily Zone luôn miễn phí, không cần dùng lượt Combo.' };
      }
      if (targetTest.examCategory === 'periodic_mock' || Number(targetTest.priceVnd) >= PERIODIC_MOCK_PRICE_VND) {
        return { allowed: false, status: 400, error: 'Combo chỉ áp dụng cho đề Thực Chiến Thi Thật (100.000đ/đề), không áp dụng cho Mock Test Định Kỳ.' };
      }
      if (hasTestPurchaseAccess(me, targetTest)) {
        return { allowed: false, status: 400, error: 'Bạn đã mở khóa đề thi này rồi!' };
      }
      if (getRealExamCredits(me) < 1) {
        return { allowed: false, status: 403, error: 'Bạn chưa còn lượt Combo Thực Chiến nào. Vui lòng mua Combo 3/5/10 đề hoặc mở lẻ!' };
      }
      return { allowed: true };
    }

    case 'UPSERT_ATTEMPT': {
      const att = payload?.attempt;
      if (!att?.id) return { allowed: false, status: 400, error: 'Thiếu thông tin bài làm.' };
      if (!isTeacher) {
        const existingAtt = (store.attempts || []).find(a => a.id === att.id);
        if (existingAtt && existingAtt.studentId !== viewer.username) {
          return { allowed: false, status: 403, error: 'Không được phép sửa bài nộp của học viên khác.' };
        }
        if (existingAtt?.teacherGraded) {
          return { allowed: false, status: 403, error: 'Bài đã chấm điểm không thể tự ý chỉnh sửa.' };
        }
        const test = (store.tests || []).find(t => t.id === att.testId);
        const viewerRecord = store.users?.[viewer.username] || viewer;
        if (viewer.isGuest && test && test.testMode === 'single_skill') {
          return {
            allowed: false,
            status: 403,
            error: 'Tài khoản Khách không có quyền truy cập Daily Zone — chỉ được phép làm Đề Thực Chiến & Mock Test.'
          };
        }
        if (test && !existingAtt && !hasTestPurchaseAccess(viewerRecord, test)) {
          const priceLabel = formatVndCurrency(getTestPurchasePriceVnd(test));
          return {
            allowed: false,
            status: 403,
            error: `Đề thi 4 kỹ năng này có chi phí test ${priceLabel} (1 lượt). Vui lòng mở khóa trước khi làm & nộp bài!`
          };
        }
        const examPass = test?.focusSkill !== 'speaking' ? String(test?.examPassword || '').trim() : '';
        if (test && !existingAtt && examPass) {
          const unlockedExamMem = Boolean(store._unlockedExamRooms?.has(`${viewer.username}::${test.id}`));
          const examUnlockPayload = att.examUnlockToken ? verifyToken(att.examUnlockToken, store._authSecret) : null;
          const examTokenOk = Boolean(
            examUnlockPayload &&
            examUnlockPayload.kind === 'exam_unlock' &&
            examUnlockPayload.username === viewer.username &&
            examUnlockPayload.testId === test.id
          );
          if (!unlockedExamMem && !examTokenOk) {
            return {
              allowed: false,
              status: 403,
              error: 'Bài thi yêu cầu nhập đúng Mật khẩu lớp / Team do Ms. Như cấp trước khi nộp bài.'
            };
          }
        }
        if (test && !existingAtt) {
          const assigned = normalizeClassIdList(test.assignedClassIds);
          if (assigned.length > 0) {
            const viewerClsSet = getViewerClassIdSet(store, viewer.username);
            if (!assigned.some(cid => viewerClsSet.has(cid))) {
              return { allowed: false, status: 403, error: 'Đề / bài tập này chỉ giao riêng cho các lớp học được chỉ định.' };
            }
          }
          const spRoomPass = String(test.speaking?.roomPassword || test.examPassword || '').trim();
          const isSpExamRoom =
            test.testMode === 'single_skill' &&
            test.focusSkill === 'speaking' &&
            (test.speaking?.speakingTrack === 'exam_room' || Boolean(spRoomPass));
          if (isSpExamRoom && spRoomPass) {
            const unlockedMem = Boolean(store._unlockedSpeakingRooms?.has(`${viewer.username}::${test.id}`));
            const unlockPayload = att.speakingUnlockToken ? verifyToken(att.speakingUnlockToken, store._authSecret) : null;
            const unlockedTokenOk = Boolean(
              unlockPayload &&
              unlockPayload.kind === 'speaking_unlock' &&
              unlockPayload.username === viewer.username &&
              unlockPayload.testId === test.id
            );
            if (!unlockedMem && !unlockedTokenOk) {
              return { allowed: false, status: 403, error: 'Bài Speaking này yêu cầu nhập đúng mật khẩu Team trước khi vào làm/nộp bài.' };
            }
          }
          const nowMs = Date.now();
          const openAtMs = parseScheduleTimestampServer(test.openAt);
          const dueAtMs = parseScheduleTimestampServer(test.dueAt);
          if (openAtMs && nowMs < openAtMs) {
            return { allowed: false, status: 403, error: `Bài làm này chưa mở (Mở lúc ${formatViDateTimeServer(openAtMs)}).` };
          }
          if (test.scheduleMode === 'deadline_lock' && dueAtMs && nowMs > dueAtMs + 30_000) {
            return { allowed: false, status: 403, error: `Bài làm này đã hết hạn nộp lúc ${formatViDateTimeServer(dueAtMs)}.` };
          }
        }
        const effectiveMaxAttempts =
          test && test.testMode !== 'single_skill'
            ? (Number(test.maxAttempts) > 0 ? Number(test.maxAttempts) : 1)
            : (Number(test?.maxAttempts) || 0);
        if (test && effectiveMaxAttempts > 0 && !existingAtt) {
          const prevCount = (store.attempts || []).filter(
            a => a.testId === test.id && (a.studentId === viewer.username || a.studentUsername === viewer.username)
          ).length;
          if (prevCount >= effectiveMaxAttempts) {
            return { allowed: false, status: 403, error: `Đề thi thật chỉ được làm tối đa ${effectiveMaxAttempts} lượt - bạn đã hoàn thành lượt thi này.` };
          }
        }
      }
      return { allowed: true };
    }

    case 'JOIN_LOBBY': {
      const cleanPin = String(payload?.pin || '').trim();
      const room = store.rooms?.[cleanPin];
      if (!cleanPin || !room) {
        return { allowed: false, status: 404, error: 'Không tìm thấy phòng đấu.' };
      }
      if (!isTeacher) {
        if (payload?.player?.username && payload.player.username !== viewer.username) {
          return { allowed: false, status: 403, error: 'Không thể vào phòng dưới tên người khác.' };
        }
        const alreadyIn = Boolean(room.lobbyPlayers?.[viewer.username]);
        const isVipSelfHost = room.roomMode === 'friend_vip' && room.hostUsername === viewer.username;
        const maxPlayers = Math.max(2, Math.min(30, Number(room.maxPlayers) || 30));
        const currentLobbyCount = Object.keys(room.lobbyPlayers || {}).length;
        if (!alreadyIn && !isVipSelfHost && currentLobbyCount >= maxPlayers) {
          return { allowed: false, status: 403, error: `Phòng đấu đã đủ số lượng tối đa ${maxPlayers} người chơi!` };
        }
        if (!alreadyIn && !isVipSelfHost && room.pass && String(payload?.roomPass || '').trim() !== String(room.pass).trim()) {
          return { allowed: false, status: 403, error: 'Mật khẩu phòng không chính xác.' };
        }
      }
      return { allowed: true };
    }

    case 'UPDATE_LOBBY_PLAYER':
    case 'LEAVE_LOBBY':
    case 'UPDATE_LIVE_SCORE':
    case 'UPDATE_SCORE': {
      const targetUname = payload?.username;
      if (!isTeacher && targetUname && targetUname !== viewer.username) {
        return { allowed: false, status: 403, error: 'Không thể thao tác dữ liệu game của người chơi khác.' };
      }
      return { allowed: true };
    }

    case 'SEND_LOBBY_CHAT': {
      const msgUname = payload?.message?.username;
      if (!isTeacher && msgUname && msgUname !== viewer.username) {
        return { allowed: false, status: 403, error: 'Không thể gửi tin nhắn dưới danh nghĩa người khác.' };
      }
      return { allowed: true };
    }

    case 'SUBMIT_ADMIN_FEEDBACK': {
      const content = String(payload?.content || '').trim();
      if (!content) {
        return { allowed: false, status: 400, error: 'Vui lòng nhập nội dung góp ý hoặc đề xuất tính năng.' };
      }
      return { allowed: true };
    }

    case 'UPDATE_ADMIN_FEEDBACK': {
      if (!isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Chỉ Quản trị hệ thống mới có quyền phản hồi và cập nhật trạng thái góp ý.' };
      }
      const fbId = String(payload?.feedbackId || '').trim();
      const targetFb = (store.adminFeedbacks || []).find(f => f?.id === fbId);
      if (!fbId || !targetFb) {
        return { allowed: false, status: 404, error: 'Không tìm thấy góp ý này.' };
      }
      return { allowed: true };
    }

    case 'DELETE_ADMIN_FEEDBACK': {
      const fbId = String(payload?.feedbackId || '').trim();
      const targetFb = (store.adminFeedbacks || []).find(f => f?.id === fbId);
      if (!fbId || !targetFb) {
        return { allowed: false, status: 404, error: 'Không tìm thấy góp ý này.' };
      }
      if (!isSuperAdmin && targetFb.authorUsername !== viewer.username) {
        return { allowed: false, status: 403, error: 'Bạn chỉ có quyền xóa góp ý do chính mình gửi.' };
      }
      return { allowed: true };
    }

    case 'UPSERT_CUSTOM_TITLE':
    case 'DELETE_CUSTOM_TITLE':
    case 'GRANT_USER_TITLES': {
      if (!isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Chỉ Quản trị hệ thống mới có quyền tạo hoặc trao tặng danh hiệu!' };
      }
      return { allowed: true };
    }

    case 'ADMIN_GRANT_GACHA_WISHES': {
      if (!isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Chỉ Quản trị hệ thống (Admin) mới có quyền trao lượt quay Gacha!' };
      }
      const targetKey = findUserKeyInStore(store, payload?.username);
      const targetUser = targetKey ? store.users?.[targetKey] : null;
      if (!targetKey || !targetUser) {
        return { allowed: false, status: 404, error: 'Không tìm thấy tài khoản người nhận.' };
      }
      const amount = Math.round(Number(payload?.amount) || 0);
      if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
        return { allowed: false, status: 400, error: 'Số lượt quay trao tặng phải từ 1 đến 10.000 lượt.' };
      }
      return { allowed: true };
    }

    case 'ADMIN_SET_GACHA_BANNER_CONFIG': {
      if (!isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Chỉ Quản trị hệ thống (Admin) mới có quyền chọn nhân vật Banner Giới Hạn!' };
      }
      return { allowed: true };
    }

    case 'KNIGHT_PVP_FIND_MATCH':
    case 'KNIGHT_PVP_CANCEL_QUEUE':
    case 'KNIGHT_PVP_CREATE_ROOM':
    case 'KNIGHT_PVP_JOIN_ROOM':
    case 'KNIGHT_PVP_LEAVE_ROOM':
    case 'KNIGHT_PVP_ACCEPT_READY':
    case 'KNIGHT_PVP_DECLINE_READY':
    case 'KNIGHT_PVP_SYNC_COMBAT':
    case 'KNIGHT_PVP_FINISH_NPC_MATCH': {
      if (viewer.isGuest) {
        return { allowed: false, status: 403, error: 'Tài khoản khách không thể tham gia Hiệp Sĩ Diệt Rồng.' };
      }
      const viewerRecord = store.users?.[viewer.username] || viewer;
      if (!isTeacher && !hasGamePracticeAccess(viewerRecord)) {
        return {
          allowed: false,
          status: 403,
          error: `Vui lòng đăng ký Thẻ Tháng (${formatVndCurrency(store.paymentConfig?.aieoVipPrice ?? AIEO_VIP_PRICE_VND)}/tháng) để chơi Hiệp Sĩ Diệt Rồng!`
        };
      }
      if (!checkRateLimit(store._rateLimits, `knight_pvp:${viewer.username.toLowerCase()}`, 180, 60 * 1000)) {
        return { allowed: false, status: 429, error: 'Thao tác Đấu Trường 1v1 quá nhanh. Vui lòng thử lại sau vài giây.' };
      }
      return { allowed: true };
    }

    case 'SUBMIT_PRACTICE_GAME_SCORE': {
      if (!checkRateLimit(store._rateLimits, `game_score:${viewer.username.toLowerCase()}`, 45, 60 * 1000)) {
        return { allowed: false, status: 429, error: 'Gửi kết quả game quá nhanh. Vui lòng đợi vài giây.' };
      }
      const targetUname = payload?.username;
      if (!isTeacher && targetUname && targetUname !== viewer.username) {
        return { allowed: false, status: 403, error: 'Không thể gửi điểm luyện tập dưới tên người khác.' };
      }
      const viewerRecord = store.users?.[viewer.username] || viewer;
      if (!isTeacher && !hasGamePracticeAccess(viewerRecord)) {
        return {
          allowed: false,
          status: 403,
          error: `Vui lòng đăng ký Thẻ Tháng (${formatVndCurrency(store.paymentConfig?.aieoVipPrice ?? AIEO_VIP_PRICE_VND)}/tháng) để chơi Hiệp Sĩ Diệt Rồng & Luyện Tập Game!`
        };
      }
      return { allowed: true };
    }

    case 'REPORT_DONATE_PAYMENT': {
      if (!checkRateLimit(store._rateLimits, `donate_req:${viewer.username.toLowerCase()}`, 12, 5 * 60 * 1000)) {
        return { allowed: false, status: 429, error: 'Bạn gửi thông báo ủng hộ quá nhanh. Vui lòng đợi ít phút.' };
      }
      const amount = parseStrictVndInt(payload?.amount);
      if (!Number.isFinite(amount) || amount < MIN_DONATE_AMOUNT_VND) {
        return {
          allowed: false,
          status: 400,
          error: `Số tiền ủng hộ tùy tâm tối thiểu là ${formatVndCurrency(MIN_DONATE_AMOUNT_VND)} (số nguyên dương).`
        };
      }
      if (amount > 50_000_000) {
        return { allowed: false, status: 400, error: 'Số tiền vượt quá giới hạn cho phép.' };
      }
      return { allowed: true };
    }

    case 'CONFIRM_PAYMENT_TRANSACTION':
    case 'DELETE_PAYMENT_TRANSACTION': {
      if (!isSuperAdmin) {
        return { allowed: false, status: 403, error: 'Chỉ Quản trị hệ thống mới có quyền xác nhận hoặc xóa giao dịch.' };
      }
      return { allowed: true };
    }

    case 'MARK_NOTIFICATIONS_READ':
    case 'DISMISS_NOTIFICATIONS': {
      return { allowed: true };
    }

    default:
      return { allowed: false, status: 400, error: 'Yêu cầu đồng bộ không hợp lệ.' };
  }
}

function upsertSingleUserInStore(store, rawUname, rawUser, viewer) {
  const uname = findUserKeyInStore(store, rawUname) || normalizeUsernameKey(rawUname);
  if (!uname || !rawUser) return false;
  const prevUser = store.users?.[uname];
  const isTeacher = viewer?.role === 'teacher';
  const isSuperAdmin = Boolean(viewer?.isSuperAdmin && viewer.username === SUPER_ADMIN_USERNAME);
  const currentRole = String(prevUser?.role || 'student').toLowerCase();
  const requestedRole = String(rawUser.role || currentRole).toLowerCase();
  const isSelfTeacherUpdate = uname === viewer?.username && currentRole === 'teacher' && requestedRole === 'teacher';
  if ((prevUser?.isSuperAdmin || uname === SUPER_ADMIN_USERNAME) && !isSuperAdmin) {
    return false;
  }
  if (!isSuperAdmin && (requestedRole === 'teacher' || currentRole === 'teacher') && !isSelfTeacherUpdate) {
    return false;
  }

  const sanitizeMediaUrl = (val, prevVal = '', opts = false) => {
    const allowRelativeBrand = typeof opts === 'boolean' ? opts : Boolean(opts?.allowRelativeBrand);
    const allowAnimated = typeof opts === 'object' && opts !== null ? Boolean(opts.allowAnimated) : false;
    if (val === undefined) return prevVal || '';
    const str = String(val || '').trim();
    if (!str) return '';
    if (allowRelativeBrand && str.startsWith('/brand-avatar.jpg')) return str;
    if (isSyncMediaUrl(str)) {
      if (isAnimatedDataUrl(str) && !allowAnimated) {
        return prevVal || '';
      }
      return str;
    }
    const isHttps = /^https:\/\//i.test(str);
    const isSafeDataImage = /^data:image\/(jpeg|jpg|png|webp|gif|apng);base64,/i.test(str);
    if (!isHttps && !isSafeDataImage) {
      return prevVal || '';
    }
    if (isHttps) {
      if (str.length > 2048 || /\.svgz?(?:[?#]|$)/i.test(str) || /svg\+xml/i.test(str)) {
        return prevVal || '';
      }
    }
    const animated = isAnimatedDataUrl(str);
    if (animated && !allowAnimated) {
      return prevVal || '';
    }
    const maxLen = animated && allowAnimated ? VIP_ANIMATED_AVATAR_MAX_DATA_URL_LENGTH : STATIC_IMAGE_MAX_DATA_URL_LENGTH;
    if (str.length <= maxLen) {
      return isSafeDataImage ? externalizeDataUrl(store, str).url : str;
    }
    return prevVal || '';
  };

  const clampTargetSkillBand = (val, fallback) => {
    if (val === undefined) return fallback ?? null;
    if (val === null || val === '') return null;
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback ?? null;
    return Math.min(9.0, Math.max(4.0, Math.round(n * 2) / 2));
  };

  if (!isTeacher && prevUser) {
    // Student may only update non-privilege profile fields on own account
    const mergedAckSelf = mergeAcknowledgedTitleIds(prevUser.acknowledgedTitleIds, rawUser.acknowledgedTitleIds);
    const hasCoverPerm = hasCustomCoverPermission(prevUser);
    const hasAnimAvatarPerm = hasAnimatedAvatarPermission(prevUser);
    const cleanSelf = {
      ...prevUser,
      name: typeof rawUser.name === 'string' && rawUser.name.trim() ? rawUser.name.trim() : prevUser.name,
      avatarUrl: sanitizeMediaUrl(rawUser.avatarUrl, prevUser.avatarUrl, { allowRelativeBrand: true, allowAnimated: hasAnimAvatarPerm }),
      targetBand: rawUser.targetBand ?? prevUser.targetBand,
      targetListening: clampTargetSkillBand(rawUser.targetListening, prevUser.targetListening),
      targetReading: clampTargetSkillBand(rawUser.targetReading, prevUser.targetReading),
      targetWriting: clampTargetSkillBand(rawUser.targetWriting, prevUser.targetWriting),
      targetSpeaking: clampTargetSkillBand(rawUser.targetSpeaking, prevUser.targetSpeaking),
      studyGoal: rawUser.studyGoal ?? prevUser.studyGoal,
      profileBannerId: typeof rawUser.profileBannerId === 'string' && rawUser.profileBannerId ? rawUser.profileBannerId.slice(0, 40) : (prevUser.profileBannerId || 'ocean'),
      profileCoverUrl: hasCoverPerm ? sanitizeMediaUrl(rawUser.profileCoverUrl, prevUser.profileCoverUrl, { allowRelativeBrand: false, allowAnimated: hasCoverPerm }) : '',
      avatarFrameId: (() => {
        const candidate = typeof rawUser.avatarFrameId === 'string' && rawUser.avatarFrameId ? rawUser.avatarFrameId.slice(0, 40) : (prevUser.avatarFrameId || 'none');
        return hasUnlockedAvatarFrame(prevUser, candidate) ? candidate : (hasUnlockedAvatarFrame(prevUser, prevUser.avatarFrameId) ? prevUser.avatarFrameId : 'none');
      })(),
      equippedTitleId: typeof rawUser.equippedTitleId === 'string' && rawUser.equippedTitleId ? rawUser.equippedTitleId.slice(0, 64) : (prevUser.equippedTitleId || 'newbie'),
      showTitleBadge: rawUser.showTitleBadge !== undefined ? Boolean(rawUser.showTitleBadge) : (prevUser.showTitleBadge !== false),
      showExamTierBadge: rawUser.showExamTierBadge !== undefined ? Boolean(rawUser.showExamTierBadge) : (prevUser.showExamTierBadge !== false),
      loginDays: mergeLoginDays(prevUser.loginDays, rawUser.loginDays),
      grantedTitleIds: Array.isArray(prevUser.grantedTitleIds) ? prevUser.grantedTitleIds : [],
      purchasedTitleIds: Array.isArray(prevUser.purchasedTitleIds) ? prevUser.purchasedTitleIds : [],
      purchasedTestIds: Array.isArray(prevUser.purchasedTestIds) ? prevUser.purchasedTestIds : [],
      purchasedTitleExpiries:
        prevUser.purchasedTitleExpiries && typeof prevUser.purchasedTitleExpiries === 'object'
          ? prevUser.purchasedTitleExpiries
          : {},
      customCoverUnlocked: Boolean(prevUser.customCoverUnlocked),
      customCoverUnlockedAt: Number(prevUser.customCoverUnlockedAt) || 0,
      customCoverExpiresAt: Number(prevUser.customCoverExpiresAt) || 0,
      customCoverUnlockedBy: typeof prevUser.customCoverUnlockedBy === 'string' ? prevUser.customCoverUnlockedBy : '',
      coverUnlockRequestedAt: Number(prevUser.coverUnlockRequestedAt) || 0,
      paidTitleRequested: prevUser.paidTitleRequested || null,
      skillPracticeExpiresAt: Number(prevUser.skillPracticeExpiresAt) || 0,
      aieoVipExpiresAt: Number(prevUser.aieoVipExpiresAt) || 0,
      roomCreateCredits: getFriendRoomTicketCredits(prevUser),
      gachaWishCredits: getGachaWishPurchasedCredits(prevUser),
      realExamCredits: getRealExamCredits(prevUser),
      subscriptionRequested: prevUser.subscriptionRequested || null,
      knightRpgProfile:
        rawUser.knightRpgProfile && typeof rawUser.knightRpgProfile === 'object'
          ? sanitizeClientKnightRpgUpdate(prevUser.knightRpgProfile, rawUser.knightRpgProfile, prevUser, {
              isSuperAdmin: false,
              isTeacher: false,
              allowMatchLoot: false,
              allowGoldGain: false
            })
          : (prevUser.knightRpgProfile || null),
      email: prevUser.email || '',
      emailVerified: Boolean(prevUser.email && prevUser.emailVerified),
      emailVerifiedAt: prevUser.emailVerifiedAt || null
    };
    if (Number(prevUser.aieoVipExpiresAt) > Date.now()) {
      cleanSelf.vipRedNameEnabled =
        rawUser.vipRedNameEnabled !== undefined
          ? Boolean(rawUser.vipRedNameEnabled)
          : (prevUser.vipRedNameEnabled !== undefined ? Boolean(prevUser.vipRedNameEnabled) : true);
      cleanSelf.vipNameColor = normalizeVipNameColor(
        rawUser.vipNameColor !== undefined ? rawUser.vipNameColor : (prevUser.vipNameColor || 'crimson')
      );
      cleanSelf.vipTagEnabled =
        rawUser.vipTagEnabled !== undefined
          ? Boolean(rawUser.vipTagEnabled)
          : (prevUser.vipTagEnabled !== undefined ? Boolean(prevUser.vipTagEnabled) : true);
      cleanSelf.vipNeonCoverEnabled =
        rawUser.vipNeonCoverEnabled !== undefined
          ? Boolean(rawUser.vipNeonCoverEnabled)
          : (prevUser.vipNeonCoverEnabled !== undefined ? Boolean(prevUser.vipNeonCoverEnabled) : true);
      cleanSelf.vipNeonCoverColor = normalizeVipNeonCoverColor(
        rawUser.vipNeonCoverColor !== undefined ? rawUser.vipNeonCoverColor : (prevUser.vipNeonCoverColor || 'aurora_rgb')
      );
      if (
        rawUser.vipRedNameEnabled !== undefined ||
        rawUser.vipTagEnabled !== undefined ||
        rawUser.vipNameColor !== undefined ||
        rawUser.vipNeonCoverEnabled !== undefined ||
        rawUser.vipNeonCoverColor !== undefined
      ) {
        cleanSelf.vipEffectsCustomizedAt = Number(rawUser.vipEffectsCustomizedAt) || Date.now();
      } else if (prevUser.vipEffectsCustomizedAt) {
        cleanSelf.vipEffectsCustomizedAt = Number(prevUser.vipEffectsCustomizedAt) || 0;
      }
    } else {
      delete cleanSelf.vipRedNameEnabled;
      delete cleanSelf.vipNameColor;
      delete cleanSelf.vipTagEnabled;
      delete cleanSelf.vipNeonCoverEnabled;
      delete cleanSelf.vipNeonCoverColor;
      delete cleanSelf.vipEffectsCustomizedAt;
    }
    if (mergedAckSelf !== undefined) cleanSelf.acknowledgedTitleIds = mergedAckSelf;
    store.users[uname] = cleanSelf;
  } else {
    const incoming = { ...rawUser, username: uname };
    incoming.targetListening = clampTargetSkillBand(rawUser.targetListening, prevUser?.targetListening);
    incoming.targetReading = clampTargetSkillBand(rawUser.targetReading, prevUser?.targetReading);
    incoming.targetWriting = clampTargetSkillBand(rawUser.targetWriting, prevUser?.targetWriting);
    incoming.targetSpeaking = clampTargetSkillBand(rawUser.targetSpeaking, prevUser?.targetSpeaking);
    incoming.loginDays = mergeLoginDays(prevUser?.loginDays, incoming.loginDays);
    if (!isSuperAdmin) {
      incoming.grantedTitleIds = Array.isArray(prevUser?.grantedTitleIds) ? prevUser.grantedTitleIds : [];
      incoming.purchasedTitleIds = Array.isArray(prevUser?.purchasedTitleIds) ? prevUser.purchasedTitleIds : [];
      incoming.purchasedTestIds = Array.isArray(prevUser?.purchasedTestIds) ? prevUser.purchasedTestIds : [];
      incoming.purchasedTitleExpiries =
        prevUser?.purchasedTitleExpiries && typeof prevUser.purchasedTitleExpiries === 'object'
          ? prevUser.purchasedTitleExpiries
          : {};
      incoming.customCoverUnlocked = Boolean(prevUser?.customCoverUnlocked);
      incoming.customCoverExpiresAt = Number(prevUser?.customCoverExpiresAt) || 0;
      incoming.skillPracticeExpiresAt = Number(prevUser?.skillPracticeExpiresAt) || 0;
      incoming.aieoVipExpiresAt = Number(prevUser?.aieoVipExpiresAt) || 0;
      incoming.roomCreateCredits = getFriendRoomTicketCredits(prevUser);
      incoming.gachaWishCredits = getGachaWishPurchasedCredits(prevUser);
      incoming.realExamCredits = getRealExamCredits(prevUser);
      incoming.totalPurchasedExams = getPurchasedExamCount(prevUser);
      incoming.totalPaidVnd = Math.max(0, Math.round(Number(prevUser?.totalPaidVnd) || 0));
      incoming.donatedTotalVnd = Math.max(0, Math.round(Number(prevUser?.donatedTotalVnd) || 0));
      incoming.paidCount = Math.max(0, Math.floor(Number(prevUser?.paidCount) || 0));
      incoming.lastPaidAt = Number(prevUser?.lastPaidAt) || 0;
      incoming.starterFirstGameGiftClaimed = Boolean(prevUser?.starterFirstGameGiftClaimed);
      incoming.isGuest = Boolean(prevUser?.isGuest);
      incoming.knightRpgProfile =
        rawUser.knightRpgProfile && typeof rawUser.knightRpgProfile === 'object'
          ? sanitizeClientKnightRpgUpdate(prevUser?.knightRpgProfile, rawUser.knightRpgProfile, prevUser, {
              isSuperAdmin: false,
              isTeacher: isSelfTeacherUpdate,
              allowMatchLoot: false,
              allowGoldGain: isSelfTeacherUpdate
            })
          : (prevUser?.knightRpgProfile || null);
    } else {
      if (incoming.grantedTitleIds !== undefined) {
        incoming.grantedTitleIds = Array.isArray(incoming.grantedTitleIds)
          ? Array.from(new Set(incoming.grantedTitleIds.map(id => String(id || '').trim()).filter(Boolean)))
          : [];
      } else {
        incoming.grantedTitleIds = Array.isArray(prevUser?.grantedTitleIds) ? prevUser.grantedTitleIds : [];
      }
      if (incoming.purchasedTitleIds !== undefined) {
        incoming.purchasedTitleIds = Array.isArray(incoming.purchasedTitleIds)
          ? Array.from(new Set(incoming.purchasedTitleIds.map(id => String(id || '').trim()).filter(Boolean)))
          : [];
      } else {
        incoming.purchasedTitleIds = Array.isArray(prevUser?.purchasedTitleIds) ? prevUser.purchasedTitleIds : [];
      }
      incoming.purchasedTitleExpiries =
        incoming.purchasedTitleExpiries && typeof incoming.purchasedTitleExpiries === 'object'
          ? incoming.purchasedTitleExpiries
          : (prevUser?.purchasedTitleExpiries && typeof prevUser.purchasedTitleExpiries === 'object' ? prevUser.purchasedTitleExpiries : {});
      incoming.customCoverUnlocked =
        incoming.customCoverUnlocked !== undefined
          ? Boolean(incoming.customCoverUnlocked)
          : Boolean(prevUser?.customCoverUnlocked);
      incoming.customCoverExpiresAt =
        incoming.customCoverExpiresAt !== undefined
          ? Math.max(0, Number(incoming.customCoverExpiresAt) || 0)
          : (Number(prevUser?.customCoverExpiresAt) || 0);
      incoming.skillPracticeExpiresAt =
        incoming.skillPracticeExpiresAt !== undefined
          ? Math.max(0, Number(incoming.skillPracticeExpiresAt) || 0)
          : (Number(prevUser?.skillPracticeExpiresAt) || 0);
      incoming.aieoVipExpiresAt =
        incoming.aieoVipExpiresAt !== undefined
          ? Math.max(0, Number(incoming.aieoVipExpiresAt) || 0)
          : (Number(prevUser?.aieoVipExpiresAt) || 0);
      incoming.roomCreateCredits =
        incoming.roomCreateCredits !== undefined
          ? Math.max(0, Math.floor(Number(incoming.roomCreateCredits) || 0))
          : getFriendRoomTicketCredits(prevUser);
      incoming.gachaWishCredits =
        incoming.gachaWishCredits !== undefined
          ? Math.max(0, Math.floor(Number(incoming.gachaWishCredits) || 0))
          : getGachaWishPurchasedCredits(prevUser);
      incoming.realExamCredits =
        incoming.realExamCredits !== undefined
          ? Math.max(0, Math.floor(Number(incoming.realExamCredits) || 0))
          : getRealExamCredits(prevUser);
    }
    incoming.subscriptionRequested = prevUser?.subscriptionRequested || null;
    const isTargetVipOrSa =
      Number(incoming.aieoVipExpiresAt) > Date.now() ||
      Boolean(prevUser?.isSuperAdmin || uname === SUPER_ADMIN_USERNAME);
    if (isTargetVipOrSa) {
      if (incoming.vipRedNameEnabled !== undefined) {
        incoming.vipRedNameEnabled = Boolean(incoming.vipRedNameEnabled);
      } else if (prevUser?.vipRedNameEnabled !== undefined) {
        incoming.vipRedNameEnabled = Boolean(prevUser.vipRedNameEnabled);
      } else {
        incoming.vipRedNameEnabled = true;
      }
      incoming.vipNameColor = normalizeVipNameColor(
        rawUser.vipNameColor !== undefined ? rawUser.vipNameColor : (prevUser?.vipNameColor || 'crimson')
      );
      if (incoming.vipTagEnabled !== undefined) {
        incoming.vipTagEnabled = Boolean(incoming.vipTagEnabled);
      } else if (prevUser?.vipTagEnabled !== undefined) {
        incoming.vipTagEnabled = Boolean(prevUser.vipTagEnabled);
      } else {
        incoming.vipTagEnabled = true;
      }
      if (incoming.vipNeonCoverEnabled !== undefined) {
        incoming.vipNeonCoverEnabled = Boolean(incoming.vipNeonCoverEnabled);
      } else if (prevUser?.vipNeonCoverEnabled !== undefined) {
        incoming.vipNeonCoverEnabled = Boolean(prevUser.vipNeonCoverEnabled);
      } else {
        incoming.vipNeonCoverEnabled = true;
      }
      incoming.vipNeonCoverColor = normalizeVipNeonCoverColor(
        rawUser.vipNeonCoverColor !== undefined ? rawUser.vipNeonCoverColor : (prevUser?.vipNeonCoverColor || 'aurora_rgb')
      );
      if (
        rawUser.vipRedNameEnabled !== undefined ||
        rawUser.vipTagEnabled !== undefined ||
        rawUser.vipNameColor !== undefined ||
        rawUser.vipNeonCoverEnabled !== undefined ||
        rawUser.vipNeonCoverColor !== undefined
      ) {
        incoming.vipEffectsCustomizedAt = Number(rawUser.vipEffectsCustomizedAt) || Date.now();
      } else if (prevUser?.vipEffectsCustomizedAt) {
        incoming.vipEffectsCustomizedAt = Number(prevUser.vipEffectsCustomizedAt) || 0;
      }
    } else {
      delete incoming.vipRedNameEnabled;
      delete incoming.vipNameColor;
      delete incoming.vipTagEnabled;
      delete incoming.vipNeonCoverEnabled;
      delete incoming.vipNeonCoverColor;
      delete incoming.vipEffectsCustomizedAt;
    }
    incoming.customCoverUnlockedAt = incoming.customCoverUnlocked
      ? (Number(prevUser?.customCoverUnlockedAt) || Date.now())
      : 0;
    incoming.customCoverUnlockedBy = incoming.customCoverUnlocked
      ? (typeof prevUser?.customCoverUnlockedBy === 'string' && prevUser.customCoverUnlockedBy
          ? prevUser.customCoverUnlockedBy
          : (viewer?.username || ''))
      : '';
    incoming.coverUnlockRequestedAt = incoming.customCoverUnlocked ? 0 : (Number(prevUser?.coverUnlockRequestedAt) || 0);
    incoming.paidTitleRequested = prevUser?.paidTitleRequested || null;
    incoming.email = prevUser?.email || '';
    incoming.emailVerified = Boolean(prevUser?.email && prevUser?.emailVerified);
    incoming.emailVerifiedAt = prevUser?.emailVerifiedAt || null;
    const mergedAckTeacher = prevUser
      ? mergeAcknowledgedTitleIds(prevUser.acknowledgedTitleIds, incoming.acknowledgedTitleIds)
      : mergeAcknowledgedTitleIds(['newbie'], incoming.acknowledgedTitleIds);
    if (mergedAckTeacher !== undefined) incoming.acknowledgedTitleIds = mergedAckTeacher;
    else delete incoming.acknowledgedTitleIds;
    incoming.avatarUrl = sanitizeMediaUrl(incoming.avatarUrl, prevUser?.avatarUrl || '', {
      allowRelativeBrand: true,
      allowAnimated: hasAnimatedAvatarPermission({ ...prevUser, ...incoming, username: uname })
    });
    incoming.profileBannerId = typeof incoming.profileBannerId === 'string' && incoming.profileBannerId
      ? incoming.profileBannerId.slice(0, 40)
      : (prevUser?.profileBannerId || 'ocean');
    incoming.profileCoverUrl = sanitizeMediaUrl(incoming.profileCoverUrl, prevUser?.profileCoverUrl || '', {
      allowRelativeBrand: false,
      allowAnimated: true
    });
    incoming.avatarFrameId = typeof incoming.avatarFrameId === 'string' && incoming.avatarFrameId
      ? incoming.avatarFrameId.slice(0, 40)
      : (prevUser?.avatarFrameId || 'none');
    const defaultRoleTitle =
      incoming.role === 'teacher' || prevUser?.role === 'teacher' || uname === SUPER_ADMIN_USERNAME
        ? 'staff_ielts_10'
        : 'newbie';
    incoming.equippedTitleId = typeof incoming.equippedTitleId === 'string' && incoming.equippedTitleId
      ? incoming.equippedTitleId.slice(0, 64)
      : (prevUser?.equippedTitleId || defaultRoleTitle);
    incoming.showTitleBadge = incoming.showTitleBadge !== undefined
      ? Boolean(incoming.showTitleBadge)
      : (prevUser?.showTitleBadge !== false);
    incoming.showExamTierBadge = incoming.showExamTierBadge !== undefined
      ? Boolean(incoming.showExamTierBadge)
      : (prevUser?.showExamTierBadge !== false);
    if (incoming.pass && String(incoming.pass).trim()) {
      incoming.passwordHash = hashPassword(String(incoming.pass).trim());
    } else if (prevUser?.passwordHash) {
      incoming.passwordHash = prevUser.passwordHash;
    }
    delete incoming.pass;
    incoming.tokenVersion = prevUser?.tokenVersion || 1;
    if (uname === SUPER_ADMIN_USERNAME && isSuperAdmin) {
      incoming.isSuperAdmin = true;
      incoming.hiddenFromTeacher = true;
      incoming.role = 'teacher';
    } else {
      delete incoming.isSuperAdmin;
      delete incoming.hiddenFromTeacher;
      incoming.role = isSuperAdmin
        ? (requestedRole === 'teacher' ? 'teacher' : 'student')
        : (prevUser?.role === 'teacher' ? 'teacher' : 'student');
    }
    store.deletedUserIds = store.deletedUserIds.filter(id => id !== uname);
    store.users[uname] = incoming;
  }

  const savedUser = store.users[uname];
  // Propagate updated avatarUrl & display name into any active room lobbies / live races
  Object.entries(store.rooms).forEach(([_pin, r]) => {
    if (r?.lobbyPlayers?.[uname]) {
      r.lobbyPlayers[uname] = {
        ...r.lobbyPlayers[uname],
        name: savedUser.name || r.lobbyPlayers[uname].name,
        avatarUrl: savedUser.avatarUrl ?? r.lobbyPlayers[uname].avatarUrl
      };
    }
    if (r?.liveMatch?.[uname]) {
      r.liveMatch[uname] = {
        ...r.liveMatch[uname],
        name: savedUser.name || r.liveMatch[uname].name,
        avatarUrl: savedUser.avatarUrl ?? r.liveMatch[uname].avatarUrl
      };
    }
  });
  return true;
}

function deleteSingleUserFromStore(store, uname, { purgeAttempts = false, viewerUsername = '' } = {}) {
  if (!uname || uname === SUPER_ADMIN_USERNAME || store.users?.[uname]?.isSuperAdmin) return false;
  if (viewerUsername && uname === viewerUsername) return false;
  if (!store.deletedUserIds.includes(uname)) {
    store.deletedUserIds.push(uname);
  }
  const existed = Boolean(store.users[uname]);
  delete store.users[uname];
  delete store.teacherNotes[uname];
  Object.values(store.rooms).forEach(r => {
    if (r?.lobbyPlayers?.[uname]) delete r.lobbyPlayers[uname];
    if (r?.liveMatch?.[uname]) delete r.liveMatch[uname];
  });
  Object.values(store.classes || {}).forEach(cls => {
    if (cls && Array.isArray(cls.studentUsernames)) {
      cls.studentUsernames = cls.studentUsernames.filter(u => String(u || '').toLowerCase() !== uname.toLowerCase());
    }
  });
  let attemptsRemoved = false;
  if (purgeAttempts && Array.isArray(store.attempts)) {
    const prevLen = store.attempts.length;
    store.attempts = store.attempts.filter(a => a?.studentId !== uname && a?.studentUsername !== uname);
    attemptsRemoved = store.attempts.length !== prevLen;
  }
  return existed || attemptsRemoved;
}

function notifyPublishedTest(store, testObj, viewer = null, explicitClassIds = null) {
  if (!testObj) return;
  const targetClassIds = explicitClassIds !== null
    ? normalizeClassIdList(explicitClassIds)
    : normalizeClassIdList(testObj.assignedClassIds);
  const classNames = resolveClassNamesByIds(store, targetClassIds);
  const classHint = classNames.length > 0 ? ` [Lớp: ${classNames.join(', ')}]` : '';
  const isExercise = testObj.testMode === 'single_skill';
  const isSpeakingDaily =
    isExercise && testObj.focusSkill === 'speaking' && testObj.speaking?.speakingTrack === 'daily';
  const isSpeakingExamRoom =
    isExercise && testObj.focusSkill === 'speaking' && testObj.speaking?.speakingTrack === 'exam_room';
  const speakingTag = isSpeakingDaily
    ? ' [Speaking Daily]'
    : isSpeakingExamRoom
    ? ' [Phòng Thi Thực Chiến]'
    : '';
  const dueAt = parseScheduleTimestampServer(testObj.dueAt);
  const scheduleMode = ['deadline_lock', 'deadline_track', 'flexible'].includes(testObj.scheduleMode)
    ? testObj.scheduleMode
    : 'flexible';
  const deadlineHint = scheduleMode !== 'flexible' && dueAt
    ? ` (Hạn nộp: ${formatViDateTimeServer(dueAt)}${scheduleMode === 'deadline_lock' ? ' — khóa khi quá giờ' : ''})`
    : '';
  appendStoreNotification(
    store,
    {
      type: isExercise ? 'exercise' : 'exam',
      title: isSpeakingDaily
        ? `Speaking Daily Hôm Nay${classHint}!`
        : isExercise
        ? `Bài tập mới${speakingTag}${classHint}!`
        : `Đề thi IELTS mới${classHint}!`,
      message: isSpeakingDaily
        ? `${viewer?.name || 'Giáo viên'} vừa mở bài Speaking Daily "${testObj.title}"${classHint}${deadlineHint}. Tất cả học viên cần hoàn thành hôm nay (hệ thống báo người chưa làm)!`
        : `${viewer?.name || 'Giáo viên'} vừa giao ${isExercise ? 'bài tập' : 'đề thi'} "${testObj.title}"${classHint}${deadlineHint}. Nhấn vào thông báo để xem chi tiết!`,
      testId: testObj.id,
      targetClassIds,
      targetClassNames: classNames
    },
    viewer
  );
}

function applySyncAction(store, type, payload = {}, viewer = null) {
  let changed = false;

  switch (type) {
    case 'SEED_DEFAULTS': {
      if (!store.seeded) {
        seedCanonicalDefaults(store);
        changed = true;
      }
      if (Array.isArray(payload.customVocabTopics) && store.customVocabTopics.length === 0) {
        const validTopics = payload.customVocabTopics.filter(t => t?.id && t?.label && typeof t?.text === 'string');
        if (validTopics.length > 0) {
          store.customVocabTopics = validTopics;
          changed = true;
        }
      }
      if (store.users?.teacher_ielts?.name === 'Thầy Minh IELTS Master') {
        store.users.teacher_ielts = {
          ...store.users.teacher_ielts,
          name: 'Ms. Như — IELTS Nha Trang'
        };
        changed = true;
      }
      break;
    }

    case 'UPSERT_ROOM': {
      const cleanPin = String(payload.pin || '').trim();
      const oldPin = payload.oldPin ? String(payload.oldPin).trim() : '';
      if (!cleanPin) break;

      const sourceRoom = oldPin && oldPin !== cleanPin && store.rooms[oldPin]
        ? store.rooms[oldPin]
        : store.rooms[cleanPin];
      const isCreatingNewRoom = !sourceRoom;

      const base = normalizeServerRoom(sourceRoom || {}, cleanPin);
      const isTeacherActor = viewer?.role === 'teacher';
      const forcedUpdates = isTeacherActor
        ? (payload.updates || {})
        : {
            ...(payload.updates || {}),
            roomMode: 'friend_vip',
            hostUsername: viewer?.username || base.hostUsername || '',
            hostName: viewer?.name || base.hostName || viewer?.username || ''
          };
      const merged = normalizeServerRoom(
        {
          ...base,
          ...forcedUpdates,
          pin: cleanPin,
          lobbyPlayers: { ...base.lobbyPlayers, ...(forcedUpdates.lobbyPlayers || {}) },
          liveMatch: { ...base.liveMatch, ...(forcedUpdates.liveMatch || {}) },
          players: { ...base.players, ...(forcedUpdates.players || {}) },
          chatMessages: Array.isArray(forcedUpdates.chatMessages) ? forcedUpdates.chatMessages : base.chatMessages
        },
        cleanPin
      );

      if (oldPin && oldPin !== cleanPin && store.rooms[oldPin]) {
        delete store.rooms[oldPin];
      }
      const activeTeams = getActiveTeamIds(merged.teamCount);
      if (activeTeams.length > 0) {
        const balancedLobby = { ...(merged.lobbyPlayers || {}) };
        Object.keys(balancedLobby).forEach(uname => {
          const lp = balancedLobby[uname];
          if (!lp) return;
          if (merged.roomMode !== 'friend_vip' && lp.role === 'teacher') return;
          if (!activeTeams.includes(lp.teamId)) {
            balancedLobby[uname] = {
              ...lp,
              teamId: pickBalancedTeamId(balancedLobby, merged.teamCount, merged.roomMode, uname)
            };
          }
        });
        merged.lobbyPlayers = balancedLobby;
      }
      if (isCreatingNewRoom && !isTeacherActor && viewer?.username) {
        const creatorKey = findUserKeyInStore(store, viewer.username) || viewer.username;
        const creatorUser = store.users?.[creatorKey];
        if (creatorUser && !hasVipFriendRoomAccess(creatorUser) && getFriendRoomTicketCredits(creatorUser) > 0) {
          store.users[creatorKey] = {
            ...creatorUser,
            roomCreateCredits: Math.max(0, getFriendRoomTicketCredits(creatorUser) - 1)
          };
        }
      }
      store.rooms[cleanPin] = merged;
      store.seeded = true;
      changed = true;
      break;
    }

    case 'JOIN_LOBBY': {
      const cleanPin = String(payload.pin || '').trim();
      const player = payload.player;
      if (!cleanPin || !player?.username) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      const existingPlayer = base.lobbyPlayers[player.username];
      const isFriendAutoApprove = base.roomMode === 'friend_vip';
      const approved = isFriendAutoApprove
        ? true
        : viewer?.role === 'teacher'
        ? Boolean(player.approved ?? existingPlayer?.approved)
        : Boolean(existingPlayer?.approved);
      const activeTeams = getActiveTeamIds(base.teamCount);
      const needsAutoTeam = activeTeams.length > 0 && (base.roomMode === 'friend_vip' || player.role !== 'teacher');
      const requestedTeam = activeTeams.includes(player.teamId)
        ? player.teamId
        : activeTeams.includes(existingPlayer?.teamId)
        ? existingPlayer.teamId
        : '';
      const resolvedTeamId = needsAutoTeam
        ? (requestedTeam || pickBalancedTeamId(base.lobbyPlayers, base.teamCount, base.roomMode, player.username))
        : '';
      base.lobbyPlayers[player.username] = {
        ...(existingPlayer || {}),
        ...player,
        ...(resolvedTeamId ? { teamId: resolvedTeamId } : {}),
        approved
      };
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'SET_PLAYER_TEAM': {
      const cleanPin = String(payload.pin || '').trim();
      const username = String(payload.username || '').trim();
      if (!cleanPin || !username || !store.rooms[cleanPin]) break;
      const base = normalizeServerRoom(store.rooms[cleanPin], cleanPin);
      const activeTeams = getActiveTeamIds(base.teamCount);
      if (activeTeams.length === 0 || !base.lobbyPlayers[username]) break;
      const nextTeam = activeTeams.includes(payload.teamId) ? payload.teamId : activeTeams[0];
      base.lobbyPlayers[username] = {
        ...base.lobbyPlayers[username],
        teamId: nextTeam
      };
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'SHUFFLE_ROOM_TEAMS': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin || !store.rooms[cleanPin]) break;
      const base = normalizeServerRoom(store.rooms[cleanPin], cleanPin);
      const activeTeams = getActiveTeamIds(base.teamCount);
      if (activeTeams.length === 0) break;
      const candidates = Object.keys(base.lobbyPlayers || {}).filter(uname => {
        const lp = base.lobbyPlayers[uname];
        return lp && (base.roomMode === 'friend_vip' || lp.role !== 'teacher');
      });
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      candidates.forEach((uname, idx) => {
        base.lobbyPlayers[uname] = {
          ...base.lobbyPlayers[uname],
          teamId: activeTeams[idx % activeTeams.length]
        };
      });
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'UPDATE_LOBBY_PLAYER': {
      const cleanPin = String(payload.pin || '').trim();
      const username = payload.username;
      if (!cleanPin || !username) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      const current = base.lobbyPlayers[username] || payload.fallbackPlayer;
      if (!current) break;
      const nextPatch = { ...(payload.patch || {}) };
      if (typeof nextPatch.avatarUrl === 'string' && nextPatch.avatarUrl.startsWith('data:')) {
        nextPatch.avatarUrl = externalizeDataUrl(store, nextPatch.avatarUrl).url;
      }
      base.lobbyPlayers[username] = {
        ...current,
        ...nextPatch
      };
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'LEAVE_LOBBY': {
      const cleanPin = String(payload.pin || '').trim();
      const username = payload.username;
      if (!cleanPin || !username || !store.rooms[cleanPin]) break;
      const base = normalizeServerRoom(store.rooms[cleanPin], cleanPin);
      if (base.lobbyPlayers[username]) {
        delete base.lobbyPlayers[username];
        store.rooms[cleanPin] = base;
        changed = true;
      }
      break;
    }

    case 'SEND_LOBBY_CHAT': {
      const cleanPin = String(payload.pin || '').trim();
      const message = payload.message;
      if (!cleanPin || !message?.username || !message?.text) break;
      const now = Date.now();
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin, now);
      const player = base.lobbyPlayers[message.username] || payload.fallbackPlayer || {
        username: message.username,
        name: message.name || message.username,
        role: message.role || 'student',
        colorId: message.colorId || 'cyan',
        animalId: message.animalId || 'cat',
        accessoryId: message.accessoryId || 'crown',
        ready: true,
        joinedAt: now
      };
      base.lobbyPlayers[message.username] = {
        ...player,
        chat: message.text,
        chatAt: message.id || now
      };
      const prevChats = Array.isArray(base.chatMessages) ? base.chatMessages : [];
      if (!prevChats.some(m => m.id === message.id)) {
        base.chatMessages = [...prevChats, message].slice(-50);
      }
      if (!base.chatCycleStartedAt || prevChats.length === 0) {
        base.chatCycleStartedAt = getServerChatMsgTs(message) || now;
      }
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'CLEAR_LOBBY_CHAT': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin || !store.rooms[cleanPin]) break;
      const now = Date.now();
      const base = normalizeServerRoom(store.rooms[cleanPin], cleanPin, now);
      const beforeTs = Number(payload.beforeTs);
      const prevLen = base.chatMessages.length;

      if (Number.isFinite(beforeTs) && beforeTs > 0) {
        base.chatMessages = base.chatMessages.filter(m => {
          const ts = getServerChatMsgTs(m);
          return ts > beforeTs;
        });
      } else {
        base.chatMessages = [];
      }

      if (base.chatMessages.length === 0) {
        base.chatCycleStartedAt = null;
        Object.keys(base.lobbyPlayers || {}).forEach(uname => {
          const lp = base.lobbyPlayers[uname];
          if (lp && (lp.chat || lp.chatAt)) {
            base.lobbyPlayers[uname] = { ...lp, chat: '', chatAt: null };
          }
        });
      } else {
        base.chatCycleStartedAt = getServerChatMsgTs(base.chatMessages[0]) || now;
      }

      if (prevLen !== base.chatMessages.length || (prevLen === 0 && store.rooms[cleanPin]?.chatCycleStartedAt)) {
        store.rooms[cleanPin] = base;
        changed = true;
      }
      break;
    }

    case 'START_GAME': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      base.status = 'PLAYING';
      base.startedAt = payload.startedAt || Date.now();
      base.questionSolves = {};
      if (payload.shufflePerPlayer !== undefined) {
        base.shufflePerPlayer = Boolean(payload.shufflePerPlayer);
      }
      const freshLive = {};
      const isFriendVipMatch = base.roomMode === 'friend_vip';
      const activeTeams = getActiveTeamIds(base.teamCount);
      Object.values(base.lobbyPlayers || {}).forEach(lp => {
        if (lp && (isFriendVipMatch || lp.role !== 'teacher')) {
          const teamId = activeTeams.length > 0
            ? (activeTeams.includes(lp.teamId) ? lp.teamId : pickBalancedTeamId(base.lobbyPlayers, base.teamCount, base.roomMode, lp.username))
            : '';
          freshLive[lp.username] = {
            username: lp.username,
            name: lp.name || lp.username,
            role: lp.role || 'student',
            ...(teamId ? { teamId } : {}),
            colorId: lp.colorId || 'cyan',
            animalId: lp.animalId || 'cat',
            accessoryId: lp.accessoryId || 'none',
            avatarUrl: lp.avatarUrl || store.users?.[lp.username]?.avatarUrl || '',
            score: 0,
            streak: 0,
            lives: 3,
            round: 1,
            progressText: 'Đang vào Vòng 1',
            finished: false,
            outcome: null,
            missed: [],
            updatedAt: Date.now()
          };
        }
      });
      base.liveMatch = freshLive;
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'FINISH_ROOM_MATCH': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin || !store.rooms[cleanPin]) break;
      const base = normalizeServerRoom(store.rooms[cleanPin], cleanPin);
      base.status = 'ENDED';
      store.rooms[cleanPin] = base;
      Object.keys(base.liveMatch || {}).forEach(uname => {
        const uRec = store.users?.[findUserKeyInStore(store, uname) || uname];
        if (uRec && uRec.role !== 'teacher') {
          grantFirstGameStarterGiftIfEligible(store, uname);
        }
      });
      changed = true;
      break;
    }

    case 'KICK_LOBBY_PLAYER': {
      const cleanPin = String(payload.pin || '').trim();
      const username = payload.username;
      if (!cleanPin || !username || !store.rooms[cleanPin]) break;
      const base = normalizeServerRoom(store.rooms[cleanPin], cleanPin);
      let touched = false;
      if (base.lobbyPlayers[username]) {
        delete base.lobbyPlayers[username];
        touched = true;
      }
      if (base.liveMatch[username]) {
        delete base.liveMatch[username];
        touched = true;
      }
      if (touched) {
        store.rooms[cleanPin] = base;
        changed = true;
      }
      break;
    }

    case 'DELETE_ROOM': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin || !store.rooms[cleanPin] || Object.keys(store.rooms).length <= 1) break;
      delete store.rooms[cleanPin];
      changed = true;
      break;
    }

    case 'RESET_LOBBY': {
      const cleanPin = String(payload.pin || '').trim();
      if (!cleanPin) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      base.status = 'LOBBY';
      base.startedAt = null;
      base.liveMatch = {};
      base.questionSolves = {};
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'UPDATE_LIVE_SCORE': {
      const cleanPin = String(payload.pin || '').trim();
      const username = payload.username;
      const entry = payload.entry;
      if (!cleanPin || !username || !entry) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      const prevEntry = base.liveMatch[username] || {};
      let serverFirstBonusTotal = Number(prevEntry.serverFirstBonusTotal) || 0;
      let lastFastestRank = prevEntry.lastFastestRank || null;
      let lastFastestBonus = prevEntry.lastFastestBonus || 0;
      let lastFastestWord = prevEntry.lastFastestWord || '';
      let fastestWinsCount = Number(prevEntry.fastestWinsCount) || 0;

      const solveEv = payload.solveEvent;
      if (solveEv?.questionKey && typeof solveEv.questionKey === 'string') {
        const qKey = solveEv.questionKey.slice(0, 80);
        const solves = Array.isArray(base.questionSolves[qKey]) ? [...base.questionSolves[qKey]] : [];
        if (!solves.some(s => s?.username === username)) {
          const rank = solves.length + 1;
          const firstBonus = rank === 1 ? 60 : rank === 2 ? 35 : rank === 3 ? 15 : 0;
          solves.push({
            username,
            name: entry.name || prevEntry.name || username,
            reactionMs: Math.max(0, Number(solveEv.reactionMs) || 0),
            rank,
            bonus: firstBonus,
            solvedAt: Date.now()
          });
          base.questionSolves[qKey] = solves;
          serverFirstBonusTotal += firstBonus;
          lastFastestRank = rank;
          lastFastestBonus = firstBonus;
          lastFastestWord = String(solveEv.word || qKey.split(':').slice(1).join(':') || '');
          if (rank === 1) fastestWinsCount += 1;
        }
      }

      const isRoomParticipant =
        viewer?.role === 'teacher' ||
        Boolean(base.lobbyPlayers?.[username] || base.liveMatch?.[username]);
      if (!isRoomParticipant) break;
      const roomEnded = base.status === 'ENDED';
      const clampRoomScore = v => Math.max(0, Math.min(250_000, Math.round(Number(v) || 0)));
      const rawClientBase = entry.clientBaseScore !== undefined
        ? clampRoomScore(entry.clientBaseScore)
        : clampRoomScore(entry.score);
      const clientBaseScore = roomEnded
        ? Math.min(rawClientBase, clampRoomScore(prevEntry.clientBaseScore ?? prevEntry.score))
        : rawClientBase;
      const rawEffectiveScore = entry.clientBaseScore !== undefined
        ? clampRoomScore(clientBaseScore + serverFirstBonusTotal)
        : Math.max(clampRoomScore(entry.score), clampRoomScore(clientBaseScore + serverFirstBonusTotal));
      const effectiveScore = roomEnded
        ? Math.min(rawEffectiveScore, clampRoomScore(prevEntry.score))
        : rawEffectiveScore;
      const cleanStreak = Math.max(0, Math.min(500, Math.round(Number(entry.streak) || 0)));

      base.liveMatch[username] = {
        ...prevEntry,
        ...entry,
        username,
        streak: cleanStreak,
        teamId: entry.teamId || prevEntry.teamId || base.lobbyPlayers[username]?.teamId || '',
        clientBaseScore,
        serverFirstBonusTotal,
        lastFastestRank,
        lastFastestBonus,
        lastFastestWord,
        fastestWinsCount,
        score: effectiveScore,
        updatedAt: Date.now()
      };
      if (effectiveScore > 0 || entry.finished) {
        const prevRec = base.players[username];
        const bestScore = prevRec ? Math.max(Number(prevRec.score) || 0, effectiveScore) : effectiveScore;
        base.players[username] = {
          name: entry.name || prevEntry.name || username,
          score: bestScore,
          status: entry.progressText || `Vòng ${entry.round || 1}`,
          streak: cleanStreak,
          missed: Array.isArray(entry.missed) ? entry.missed : [],
          updatedAt: new Date().toLocaleTimeString('vi-VN')
        };
      }
      store.rooms[cleanPin] = base;
      if (entry.finished) {
        grantFirstGameStarterGiftIfEligible(store, username);
      }
      changed = true;
      break;
    }

    case 'UPDATE_SCORE': {
      const cleanPin = String(payload.pin || '').trim();
      const username = payload.username;
      const record = payload.record;
      if (!cleanPin || !username || !record || !store.rooms?.[cleanPin]) break;
      const base = normalizeServerRoom(store.rooms[cleanPin] || {}, cleanPin);
      if (viewer?.role !== 'teacher' && !base.lobbyPlayers?.[username] && !base.liveMatch?.[username]) break;
      const prevRec = base.players[username];
      const liveBest = Math.max(0, Math.min(250_000, Math.round(Number(base.liveMatch?.[username]?.score) || 0)));
      const clampedIncoming = base.status === 'ENDED' && viewer?.role !== 'teacher'
        ? Math.min(Math.max(0, Math.min(250_000, Math.round(Number(record.score) || 0))), liveBest || Number(prevRec?.score) || 0)
        : Math.max(0, Math.min(250_000, Math.round(Number(record.score) || 0)));
      const bestScore = Math.max(Number(prevRec?.score) || 0, clampedIncoming, liveBest);
      base.players[username] = {
        ...record,
        streak: Math.max(0, Math.min(500, Math.round(Number(record.streak) || 0))),
        score: bestScore
      };
      store.rooms[cleanPin] = base;
      grantFirstGameStarterGiftIfEligible(store, username);
      changed = true;
      break;
    }

    case 'UPSERT_TEST': {
      const rawTest = payload.test;
      if (!rawTest?.id) break;
      const sanitizedBaseTest = sanitizeTestPayloadForStore(rawTest);
      const scheduleMode = ['deadline_lock', 'deadline_track', 'flexible'].includes(sanitizedBaseTest.scheduleMode)
        ? sanitizedBaseTest.scheduleMode
        : 'flexible';
      const openAt = parseScheduleTimestampServer(sanitizedBaseTest.openAt);
      const dueAt = parseScheduleTimestampServer(sanitizedBaseTest.dueAt);
      const assignedClassIds = normalizeClassIdList(sanitizedBaseTest.assignedClassIds);
      const test = externalizeTestMedia(store, {
        ...sanitizedBaseTest,
        assignedClassIds,
        scheduleMode,
        openAt,
        dueAt
      }).test;
      const idx = store.tests.findIndex(t => t.id === test.id);
      const prevTest = idx >= 0 ? store.tests[idx] : null;
      const wasPublicBefore = prevTest ? (prevTest.visibility || 'public') !== 'private' : false;
      const prevClassSet = new Set(normalizeClassIdList(prevTest?.assignedClassIds));
      const isPublicNow = (test.visibility || 'public') !== 'private';
      if (idx >= 0) {
        store.tests[idx] = test;
        reconcileTestAttemptsObjectiveScores(store, test);
      } else {
        store.tests = [test, ...store.tests];
      }
      if (isPublicNow) {
        if (!wasPublicBefore) {
          notifyPublishedTest(store, test, viewer);
        } else if (assignedClassIds.length > 0 && prevClassSet.size > 0) {
          const newlyAddedClasses = assignedClassIds.filter(cid => !prevClassSet.has(cid));
          if (newlyAddedClasses.length > 0) {
            notifyPublishedTest(store, test, viewer, newlyAddedClasses);
          }
        }
      }
      changed = true;
      break;
    }

    case 'UPSERT_TESTS_BULK': {
      const incomingList = Array.isArray(payload.tests) ? payload.tests : [];
      if (incomingList.length === 0) break;
      const existingById = new Map((store.tests || []).map((t, idx) => [t?.id, { test: t, idx }]));
      const newlyInserted = [];
      let updatedAny = false;
      const nextExisting = [...(store.tests || [])];

      incomingList.slice(0, 1000).forEach(rawTest => {
        if (!rawTest?.id) return;
        const sanitizedBaseTest = sanitizeTestPayloadForStore(rawTest);
        const scheduleMode = ['deadline_lock', 'deadline_track', 'flexible'].includes(sanitizedBaseTest.scheduleMode)
          ? sanitizedBaseTest.scheduleMode
          : 'flexible';
        const openAt = parseScheduleTimestampServer(sanitizedBaseTest.openAt);
        const dueAt = parseScheduleTimestampServer(sanitizedBaseTest.dueAt);
        const assignedClassIds = normalizeClassIdList(sanitizedBaseTest.assignedClassIds);
        const test = externalizeTestMedia(store, {
          ...sanitizedBaseTest,
          assignedClassIds,
          scheduleMode,
          openAt,
          dueAt
        }).test;

        const found = existingById.get(test.id);
        if (found) {
          nextExisting[found.idx] = test;
          reconcileTestAttemptsObjectiveScores(store, test);
          updatedAny = true;
        } else {
          newlyInserted.push(test);
          existingById.set(test.id, { test, idx: -1 });
        }
      });

      if (newlyInserted.length > 0 || updatedAny) {
        store.tests = [...newlyInserted, ...nextExisting];
        if (payload.notify === true && newlyInserted.length > 0) {
          const firstPublic = newlyInserted.find(t => (t.visibility || 'public') !== 'private');
          if (firstPublic) {
            if (newlyInserted.length === 1) {
              notifyPublishedTest(store, firstPublic, viewer);
            } else {
              const summaryLabel = String(payload.summaryLabel || 'Daily Zone Writing').trim().slice(0, 120);
              const syntheticSummaryTest = {
                ...firstPublic,
                title: `${newlyInserted.length} đề mới trong ${summaryLabel}`
              };
              notifyPublishedTest(store, syntheticSummaryTest, viewer);
            }
          }
        }
        changed = true;
      }
      break;
    }

    case 'DELETE_TEST': {
      const testId = payload.testId;
      if (!testId) break;
      if (!store.deletedTestIds.includes(testId)) {
        store.deletedTestIds.push(testId);
      }
      store.tests = store.tests.filter(t => t.id !== testId);
      changed = true;
      break;
    }

    case 'TOGGLE_TEST_ANSWERS': {
      const testId = payload.testId;
      if (!testId) break;
      store.tests = store.tests.map(t => (t.id === testId ? { ...t, allowViewAnswers: !t.allowViewAnswers } : t));
      changed = true;
      break;
    }

    case 'TOGGLE_TEST_VISIBILITY': {
      const testId = payload.testId;
      if (!testId) break;
      let publishedTest = null;
      store.tests = store.tests.map(t => {
        if (t.id !== testId) return t;
        const nextVis = (t.visibility || 'public') === 'private' ? 'public' : 'private';
        const nextObj = { ...t, visibility: nextVis };
        if (nextVis === 'public') publishedTest = nextObj;
        return nextObj;
      });
      if (publishedTest) {
        notifyPublishedTest(store, publishedTest, viewer);
      }
      changed = true;
      break;
    }

    case 'UPSERT_CLASS': {
      const rawClass = payload.classObj || payload;
      const cls = normalizeClassRecord(rawClass, rawClass?.id || `cls_${Date.now()}`);
      if (!cls) break;
      if (!store.classes || typeof store.classes !== 'object') store.classes = {};
      const validUsers = store.users || {};
      cls.studentUsernames = cls.studentUsernames.filter(u => Boolean(validUsers[u]));
      cls.createdBy = store.classes[cls.id]?.createdBy || viewer?.username || cls.createdBy;
      cls.createdAt = store.classes[cls.id]?.createdAt || cls.createdAt;
      cls.updatedAt = Date.now();
      store.classes[cls.id] = cls;
      changed = true;
      break;
    }

    case 'DELETE_CLASS': {
      const cid = String(payload.classId || '').trim();
      if (!cid || !store.classes?.[cid]) break;
      delete store.classes[cid];
      store.tests = (store.tests || []).map(t => {
        const assigned = normalizeClassIdList(t?.assignedClassIds);
        if (!assigned.includes(cid)) return t;
        const remaining = assigned.filter(id => id !== cid);
        return {
          ...t,
          assignedClassIds: remaining,
          ...(remaining.length === 0 ? { visibility: 'private' } : {})
        };
      });
      changed = true;
      break;
    }

    case 'UPDATE_CLASS_MEMBERS': {
      const cid = String(payload.classId || '').trim();
      const targetCls = cid ? store.classes?.[cid] : null;
      if (!targetCls) break;
      const mode = ['add', 'remove', 'set'].includes(payload.mode) ? payload.mode : 'set';
      const validUsers = store.users || {};
      const incomingNames = Array.isArray(payload.usernames)
        ? payload.usernames.map(u => String(u || '').trim()).filter(u => Boolean(validUsers[u]) && u !== SUPER_ADMIN_USERNAME)
        : [];
      const currentSet = new Set(Array.isArray(targetCls.studentUsernames) ? targetCls.studentUsernames : []);
      if (mode === 'set') {
        targetCls.studentUsernames = Array.from(new Set(incomingNames));
      } else if (mode === 'add') {
        incomingNames.forEach(u => currentSet.add(u));
        targetCls.studentUsernames = Array.from(currentSet);
      } else if (mode === 'remove') {
        const removeLower = new Set(incomingNames.map(u => u.toLowerCase()));
        targetCls.studentUsernames = Array.from(currentSet).filter(u => !removeLower.has(u.toLowerCase()));
      }
      targetCls.updatedAt = Date.now();
      store.classes[cid] = targetCls;
      changed = true;
      break;
    }

    case 'ASSIGN_TEST_CLASSES': {
      const testId = String(payload.testId || '').trim();
      const nextAssigned = normalizeClassIdList(payload.assignedClassIds);
      const notify = payload.notify !== false;
      const makePrivateIfEmpty = Boolean(payload.makePrivateIfEmpty);
      let targetTest = null;
      let newlyAdded = [];
      store.tests = (store.tests || []).map(t => {
        if (t?.id !== testId) return t;
        const prevSet = new Set(normalizeClassIdList(t.assignedClassIds));
        newlyAdded = nextAssigned.filter(cid => !prevSet.has(cid));
        const nextVis =
          payload.publish === true
            ? 'public'
            : makePrivateIfEmpty && nextAssigned.length === 0
            ? 'private'
            : (t.visibility || 'public');
        const nextObj = { ...t, assignedClassIds: nextAssigned, visibility: nextVis };
        targetTest = nextObj;
        return nextObj;
      });
      if (targetTest && notify && (targetTest.visibility || 'public') !== 'private') {
        const notifyTarget = nextAssigned.length > 0 && newlyAdded.length > 0 ? newlyAdded : nextAssigned;
        notifyPublishedTest(store, targetTest, viewer, notifyTarget);
      }
      if (targetTest) changed = true;
      break;
    }

    case 'ASSIGN_FOLDER_CLASSES': {
      const rawIds = Array.isArray(payload.testIds) ? payload.testIds : [];
      const testIdSet = new Set(rawIds.map(id => String(id || '').trim()).filter(Boolean));
      if (testIdSet.size === 0) break;
      const incomingClasses = normalizeClassIdList(payload.assignedClassIds);
      const mode = ['replace', 'add', 'remove'].includes(payload.mode) ? payload.mode : 'replace';
      const publish = Boolean(payload.publish);
      const notify = payload.notify !== false;
      const folderLabel = String(payload.folderLabel || 'Thư mục bài tập').trim().slice(0, 140);
      let updatedCount = 0;
      let firstUpdatedTest = null;
      store.tests = (store.tests || []).map(t => {
        if (!t || !testIdSet.has(t.id)) return t;
        const prevClasses = normalizeClassIdList(t.assignedClassIds);
        let nextAssigned;
        if (mode === 'add') {
          nextAssigned = incomingClasses.length === 0 ? [] : Array.from(new Set([...prevClasses, ...incomingClasses]));
        } else if (mode === 'remove') {
          const removeSet = new Set(incomingClasses);
          nextAssigned = prevClasses.filter(cid => !removeSet.has(cid));
        } else {
          nextAssigned = incomingClasses;
        }
        const nextVis = publish ? 'public' : (t.visibility || 'public');
        const nextObj = { ...t, assignedClassIds: nextAssigned, visibility: nextVis };
        if (!firstUpdatedTest) firstUpdatedTest = nextObj;
        updatedCount += 1;
        return nextObj;
      });
      if (updatedCount > 0) {
        if (notify && mode !== 'remove') {
          const actorName = viewer?.name || viewer?.username || 'Giáo viên';
          const classNames = incomingClasses
            .map(cid => store.classes?.[cid]?.name)
            .filter(Boolean);
          const scopeLabel = classNames.length > 0 ? `Lớp ${classNames.join(', ')}` : 'toàn bộ học viên';
          appendStoreNotification(
            store,
            {
              type: firstUpdatedTest?.testMode === 'single_skill' ? 'exercise' : 'exam',
              title: `📁 Giao thư mục: ${folderLabel}`,
              message: `${actorName} vừa giao cả thư mục "${folderLabel}" (${updatedCount} bài) cho ${scopeLabel}. Nhấn để mở bài tập ngay!`,
              testId: firstUpdatedTest?.id || '',
              targetClassIds: incomingClasses,
              createdBy: viewer?.username || 'teacher_ielts',
              createdByName: actorName
            },
            viewer
          );
        }
        changed = true;
      }
      break;
    }

    case 'CREATE_NOTIFICATION': {
      const item = appendStoreNotification(store, payload, viewer);
      if (item) changed = true;
      break;
    }

    case 'MARK_NOTIFICATIONS_READ': {
      const uname = viewer?.username;
      if (!uname) break;
      const targetId = String(payload?.notificationId || 'all').trim();
      const list = Array.isArray(store.notifications) ? store.notifications : [];
      let touched = false;
      store.notifications = list.map(n => {
        if (targetId !== 'all' && n.id !== targetId) return n;
        const readArr = Array.isArray(n.readBy) ? n.readBy : [];
        if (readArr.includes(uname)) return n;
        touched = true;
        return { ...n, readBy: [...readArr, uname] };
      });
      if (touched) changed = true;
      break;
    }

    case 'DISMISS_NOTIFICATIONS': {
      const uname = viewer?.username;
      if (!uname) break;
      const targetId = String(payload?.notificationId || 'read').trim();
      const list = Array.isArray(store.notifications) ? store.notifications : [];
      let touched = false;
      store.notifications = list.map(n => {
        if (!n) return n;
        const dismissArr = Array.isArray(n.dismissedBy) ? n.dismissedBy : [];
        if (dismissArr.includes(uname)) return n;
        const readArr = Array.isArray(n.readBy) ? n.readBy : [];
        const shouldDismiss =
          targetId === 'all'
            ? true
            : targetId === 'read'
            ? readArr.includes(uname)
            : n.id === targetId;
        if (!shouldDismiss) return n;
        touched = true;
        return { ...n, dismissedBy: [...dismissArr, uname] };
      });
      if (touched) changed = true;
      break;
    }

    case 'DELETE_NOTIFICATION': {
      const nid = String(payload?.notificationId || '').trim();
      if (!nid) break;
      const list = Array.isArray(store.notifications) ? store.notifications : [];
      const next = list.filter(n => n.id !== nid);
      if (next.length !== list.length) {
        store.notifications = next;
        changed = true;
      }
      break;
    }

    case 'UPSERT_CUSTOM_TITLE': {
      const raw = payload?.customTitle || payload;
      const id = String(raw?.id || '').trim().slice(0, 64);
      const label = String(raw?.label || '').trim().slice(0, 60);
      if (!id || !label) break;
      const allowedThemes = new Set(['amber', 'teal', 'rose', 'violet', 'emerald', 'sky']);
      const colorKey = allowedThemes.has(raw?.colorKey) ? raw.colorKey : 'amber';
      const item = {
        id,
        label,
        icon: String(raw?.icon || '🏅').trim().slice(0, 10) || '🏅',
        tier: String(raw?.tier || 'Đặc Biệt').trim().slice(0, 30) || 'Đặc Biệt',
        difficulty: String(raw?.difficulty || 'Đặc Biệt').trim().slice(0, 24) || 'Đặc Biệt',
        conditionText:
          String(raw?.conditionText || 'Danh hiệu đặc biệt do Quản Trị Hệ Thống trao tặng.').trim().slice(0, 180),
        colorKey,
        createdBy: viewer?.username || SUPER_ADMIN_USERNAME,
        createdAt: Number(raw?.createdAt) || Date.now()
      };
      const prev = Array.isArray(store.customTitles) ? store.customTitles : [];
      const idx = prev.findIndex(t => t?.id === id);
      store.customTitles = idx >= 0
        ? prev.map((t, i) => (i === idx ? { ...t, ...item } : t))
        : [...prev, item];
      changed = true;
      break;
    }

    case 'DELETE_CUSTOM_TITLE': {
      const tid = String(payload?.titleId || payload?.id || '').trim();
      if (!tid) break;
      const prev = Array.isArray(store.customTitles) ? store.customTitles : [];
      const next = prev.filter(t => t?.id !== tid);
      if (next.length !== prev.length) {
        store.customTitles = next;
        Object.entries(store.users || {}).forEach(([uname, u]) => {
          if (!u) return;
          const hadGranted = Array.isArray(u.grantedTitleIds) && u.grantedTitleIds.includes(tid);
          const hadEquipped = u.equippedTitleId === tid;
          if (hadGranted || hadEquipped) {
            store.users[uname] = {
              ...u,
              ...(hadGranted ? { grantedTitleIds: u.grantedTitleIds.filter(x => x !== tid) } : {}),
              ...(hadEquipped ? { equippedTitleId: 'newbie' } : {})
            };
          }
        });
        changed = true;
      }
      break;
    }

    case 'GRANT_USER_TITLES': {
      const targetKey = findUserKeyInStore(store, payload?.username);
      const targetUser = targetKey ? store.users?.[targetKey] : null;
      if (!targetKey || !targetUser) break;
      const mode = ['add', 'remove', 'set'].includes(payload?.mode) ? payload.mode : 'add';
      const incomingIds = Array.isArray(payload?.titleIds)
        ? Array.from(new Set(payload.titleIds.map(id => String(id || '').trim()).filter(Boolean)))
        : payload?.titleId
        ? [String(payload.titleId).trim()]
        : [];
      const curr = Array.isArray(targetUser.grantedTitleIds) ? targetUser.grantedTitleIds : [];
      let nextGranted = curr;
      if (mode === 'set') {
        nextGranted = incomingIds;
      } else if (mode === 'add') {
        nextGranted = Array.from(new Set([...curr, ...incomingIds]));
      } else if (mode === 'remove') {
        const dropSet = new Set(incomingIds);
        nextGranted = curr.filter(id => !dropSet.has(id));
      }
      const clearPendingTitle =
        targetUser.paidTitleRequested?.titleId && nextGranted.includes(targetUser.paidTitleRequested.titleId);
      store.users[targetKey] = {
        ...targetUser,
        grantedTitleIds: nextGranted,
        ...(clearPendingTitle ? { paidTitleRequested: null } : {})
      };
      changed = true;
      break;
    }

    case 'TOGGLE_USER_COVER_UNLOCK': {
      const targetKey = findUserKeyInStore(store, payload?.username);
      const targetUser = targetKey ? store.users?.[targetKey] : null;
      if (!targetKey || !targetUser) break;
      const unlocked = payload?.unlocked !== false;
      const nowMs = Date.now();
      const nextExp = unlocked ? nowMs + SUBSCRIPTION_DURATION_MS : 0;
      store.users[targetKey] = {
        ...targetUser,
        customCoverUnlocked: unlocked,
        customCoverUnlockedAt: unlocked ? nowMs : 0,
        customCoverExpiresAt: nextExp,
        customCoverUnlockedBy: unlocked ? (viewer?.username || '') : '',
        coverUnlockRequestedAt: 0,
        profileCoverUrl: unlocked ? (targetUser.profileCoverUrl || '') : ''
      };
      if (unlocked && targetUser.role !== 'teacher') {
        const priceLabel = formatVndCurrency(store.paymentConfig?.coverUnlockPrice);
        appendStoreNotification(
          store,
          {
            title: '🖼️ Đã mở khóa Ảnh Nền Riêng (1 Tháng)!',
            message: `Quản Trị Hệ Thống đã xác nhận thanh toán ${priceLabel} và mở khóa quyền tải Ảnh Nền / Ảnh Bìa riêng trong 30 ngày cho hồ sơ của bạn.`,
            type: 'announcement',
            targetUsernames: [targetKey],
            createdBy: viewer?.username || SUPER_ADMIN_USERNAME,
            createdByName: viewer?.name || 'Quản Trị Hệ Thống'
          },
          viewer
        );
      }
      changed = true;
      break;
    }

    case 'TOGGLE_USER_SUBSCRIPTION': {
      const targetKey = findUserKeyInStore(store, payload?.username);
      const targetUser = targetKey ? store.users?.[targetKey] : null;
      if (!targetKey || !targetUser) break;
      const kind = String(payload?.kind || payload?.planType || '').trim();
      const active =
        payload?.active !== undefined
          ? payload.active !== false
          : payload?.unlocked !== false;
      const nowMs = Date.now();
      const extendFrom = (prevExp) => (active ? Math.max(nowMs, Number(prevExp) || 0) + SUBSCRIPTION_DURATION_MS : 0);

      if (kind === 'skill_pass') {
        const nextSkillExp = extendFrom(targetUser.skillPracticeExpiresAt);
        store.users[targetKey] = {
          ...targetUser,
          skillPracticeExpiresAt: nextSkillExp,
          ...(active && targetUser.subscriptionRequested?.itemType === 'skill_pass' ? { subscriptionRequested: null } : {})
        };
        if (active && targetUser.role !== 'teacher') {
          appendStoreNotification(
            store,
            {
              title: '🎓 Đã kích hoạt Gói Bài Tập 4 Kỹ Năng (1 Tháng)!',
              message: `Quản Trị Hệ Thống đã mở khóa 30 ngày truy cập toàn bộ Bài Tập 4 Kỹ Năng & Đề Lẻ cho tài khoản của bạn.`,
              type: 'announcement',
              targetUsernames: [targetKey],
              createdBy: viewer?.username || SUPER_ADMIN_USERNAME,
              createdByName: viewer?.name || 'Quản Trị Hệ Thống'
            },
            viewer
          );
        }
        changed = true;
      } else if (kind === 'test') {
        const testId = String(payload?.testId || '').trim();
        if (testId) {
          const prevTests = Array.isArray(targetUser.purchasedTestIds) ? targetUser.purchasedTestIds.map(String) : [];
          const alreadyOwned = prevTests.includes(testId);
          const nextTests = active
            ? Array.from(new Set([...prevTests, testId]))
            : prevTests.filter(id => id !== testId);
          const nextTotalPurchased = active && !alreadyOwned
            ? getPurchasedExamCount(targetUser) + 1
            : getPurchasedExamCount(targetUser);
          store.users[targetKey] = {
            ...targetUser,
            purchasedTestIds: nextTests,
            totalPurchasedExams: nextTotalPurchased,
            ...(active && targetUser.subscriptionRequested?.itemId === testId ? { subscriptionRequested: null } : {})
          };
          if (active && targetUser.role !== 'teacher') {
            const targetTestTitle = (store.tests || []).find(t => t?.id === testId)?.title || testId;
            appendStoreNotification(
              store,
              {
                title: '🎉 Đã mở khóa Đề Thi Thực Chiến 4 Kỹ Năng!',
                message: `Quản Trị Hệ Thống đã mở khóa đề thi "${targetTestTitle}" (1 lượt thi thật đủ 4 kỹ năng Listening, Reading, Writing & Speaking).`,
                type: 'announcement',
                targetUsernames: [targetKey],
                createdBy: viewer?.username || SUPER_ADMIN_USERNAME,
                createdByName: viewer?.name || 'Quản Trị Hệ Thống'
              },
              viewer
            );
          }
          changed = true;
        }
      } else if (kind === 'real_exam_credit' || Boolean(getRealExamComboMeta(kind, store.paymentConfig))) {
        const comboMeta = getRealExamComboMeta(kind, store.paymentConfig);
        const addCount = comboMeta ? comboMeta.credits : Math.max(1, Math.floor(Number(payload?.credits) || 1));
        const currCredits = getRealExamCredits(targetUser);
        const nextCredits = active ? currCredits + addCount : Math.max(0, currCredits - addCount);
        const nextTotalPurchased = active
          ? getPurchasedExamCount(targetUser) + addCount
          : getPurchasedExamCount(targetUser);
        store.users[targetKey] = {
          ...targetUser,
          realExamCredits: nextCredits,
          totalPurchasedExams: nextTotalPurchased,
          ...(active &&
          (targetUser.subscriptionRequested?.itemType === kind ||
            Boolean(getRealExamComboMeta(targetUser.subscriptionRequested?.itemType, store.paymentConfig)))
            ? { subscriptionRequested: null }
            : {})
        };
        if (active && targetUser.role !== 'teacher') {
          appendStoreNotification(
            store,
            {
              title: `🎫 Đã cộng +${addCount} lượt Thực Chiến Thi Thật!`,
              message: `Quản Trị Hệ Thống đã cấp +${addCount} lượt Combo Thực Chiến Thi Thật 4 Kỹ Năng (hiện có ${nextCredits} lượt). Bạn có thể vào Trang Chủ đổi 1 lượt để mở bất kỳ đề Thực Chiến 100.000đ nào!`,
              type: 'announcement',
              targetUsernames: [targetKey],
              createdBy: viewer?.username || SUPER_ADMIN_USERNAME,
              createdByName: viewer?.name || 'Quản Trị Hệ Thống'
            },
            viewer
          );
        }
        changed = true;
      } else if (kind === 'room_ticket') {
        const currTickets = getFriendRoomTicketCredits(targetUser);
        const nextCredits = active ? currTickets + 1 : Math.max(0, currTickets - 1);
        store.users[targetKey] = {
          ...targetUser,
          roomCreateCredits: nextCredits,
          ...(active && targetUser.subscriptionRequested?.itemType === 'room_ticket' ? { subscriptionRequested: null } : {})
        };
        if (active && targetUser.role !== 'teacher') {
          appendStoreNotification(
            store,
            {
              title: '🎫 Đã cộng +1 lượt Tạo Phòng Đấu Riêng!',
              message: `Quản Trị Hệ Thống đã cấp +1 vé tạo Phòng Đấu Trường Bạn Bè (hiện có ${nextCredits} lượt).`,
              type: 'announcement',
              targetUsernames: [targetKey],
              createdBy: viewer?.username || SUPER_ADMIN_USERNAME,
              createdByName: viewer?.name || 'Quản Trị Hệ Thống'
            },
            viewer
          );
        }
        changed = true;
      } else if (kind === 'gacha_wish_1' || kind === 'gacha_wish_10') {
        const addWishes = kind === 'gacha_wish_10' ? 10 : 1;
        const currGacha = getGachaWishPurchasedCredits(targetUser);
        const nextGachaCredits = active ? currGacha + addWishes : Math.max(0, currGacha - addWishes);
        const prevRpg = targetUser.knightRpgProfile && typeof targetUser.knightRpgProfile === 'object'
          ? targetUser.knightRpgProfile
          : {};
        const nextRpgWishes = active
          ? Math.max(0, (Number(prevRpg.wishes) || 0) + addWishes)
          : Math.max(0, (Number(prevRpg.wishes) || 0) - addWishes);
        store.users[targetKey] = {
          ...targetUser,
          gachaWishCredits: nextGachaCredits,
          knightRpgProfile: {
            ...prevRpg,
            wishes: nextRpgWishes,
            claimedServerWishCredits: nextGachaCredits
          },
          ...(active && targetUser.subscriptionRequested?.itemType === kind ? { subscriptionRequested: null } : {})
        };
        if (active && targetUser.role !== 'teacher') {
          appendStoreNotification(
            store,
            {
              title: `🌠 Đã cộng +${addWishes} Lượt Quay Gacha Hiệp Sĩ!`,
              message: `Quản Trị Hệ Thống đã cấp +${addWishes} lượt Cầu Nguyện Gacha Nhân Vật & Vũ Khí trong Hiệp Sĩ Diệt Rồng.`,
              type: 'announcement',
              targetUsernames: [targetKey],
              createdBy: viewer?.username || SUPER_ADMIN_USERNAME,
              createdByName: viewer?.name || 'Quản Trị Hệ Thống'
            },
            viewer
          );
        }
        changed = true;
      } else if (kind === 'aieo_vip') {
        const wasVipActive = Number(targetUser.aieoVipExpiresAt) > nowMs;
        const nextVipExp = extendFrom(targetUser.aieoVipExpiresAt);
        const nextSkillExp = active
          ? Math.max(Number(targetUser.skillPracticeExpiresAt) || 0, nextVipExp)
          : (Number(targetUser.skillPracticeExpiresAt) || 0);
        const keepCustomRed = Boolean(wasVipActive && targetUser.vipEffectsCustomizedAt);
        store.users[targetKey] = {
          ...targetUser,
          aieoVipExpiresAt: nextVipExp,
          skillPracticeExpiresAt: nextSkillExp,
          vipRedNameEnabled: active ? (keepCustomRed ? (targetUser.vipRedNameEnabled ?? true) : true) : false,
          vipNameColor: normalizeVipNameColor(targetUser.vipNameColor || 'crimson'),
          vipTagEnabled: active ? (keepCustomRed ? (targetUser.vipTagEnabled ?? true) : true) : false,
          vipNeonCoverEnabled: active ? (keepCustomRed ? (targetUser.vipNeonCoverEnabled ?? true) : true) : false,
          vipNeonCoverColor: normalizeVipNeonCoverColor(targetUser.vipNeonCoverColor || 'aurora_rgb'),
          ...(active && !wasVipActive ? { vipEffectsCustomizedAt: 0 } : {}),
          ...(!active ? { vipEffectsCustomizedAt: 0 } : {}),
          ...(active && (!targetUser.equippedTitleId || targetUser.equippedTitleId === 'newbie')
            ? { equippedTitleId: 'aieo_vip', showTitleBadge: true }
            : {}),
          ...(active && targetUser.subscriptionRequested?.itemType === 'aieo_vip' ? { subscriptionRequested: null } : {})
        };
        if (active && targetUser.role !== 'teacher') {
          appendStoreNotification(
            store,
            {
              title: '👑 Đã kích hoạt Gói IELTS VIP (1 Tháng)!',
              message: `Quản Trị Hệ Thống đã kích hoạt 30 ngày Gói IELTS VIP: Mở khóa Ảnh Avatar Động (.GIF/.WebP), Ảnh Bìa Cá Nhân, Viền Bìa & Thẻ LED Neon Nhiều Màu, Đổi Màu Chữ Tên + Nhãn IELTS VIP, Danh hiệu IELTS VIP & Tạo phòng Game Bạn Bè vô hạn.`,
              type: 'announcement',
              targetUsernames: [targetKey],
              createdBy: viewer?.username || SUPER_ADMIN_USERNAME,
              createdByName: viewer?.name || 'Quản Trị Hệ Thống'
            },
            viewer
          );
        }
        changed = true;
      }
      break;
    }

    case 'REDEEM_REAL_EXAM_CREDIT': {
      const uname = viewer?.username ? findUserKeyInStore(store, viewer.username) || viewer.username : '';
      const targetUser = uname ? store.users?.[uname] : null;
      const tid = String(payload?.testId || '').trim();
      const targetTest = (store.tests || []).find(t => t?.id === tid);
      if (!uname || !targetUser || !targetTest) break;
      if (targetTest.testMode === 'single_skill') break;
      if (targetTest.examCategory === 'periodic_mock' || Number(targetTest.priceVnd) >= PERIODIC_MOCK_PRICE_VND) break;
      const currentCredits = getRealExamCredits(targetUser);
      if (currentCredits < 1) break;
      const prevTests = Array.isArray(targetUser.purchasedTestIds) ? targetUser.purchasedTestIds.map(String) : [];
      if (prevTests.includes(tid)) break;
      const balanceBefore = captureUserBalanceSnapshot(targetUser);
      const nextTests = Array.from(new Set([...prevTests, tid]));
      const nextCredits = Math.max(0, currentCredits - 1);
      store.users[uname] = {
        ...targetUser,
        realExamCredits: nextCredits,
        purchasedTestIds: nextTests
      };
      const balanceAfter = captureUserBalanceSnapshot(store.users[uname]);
      recordPaymentTransactionAndNotifyAdmin(store, {
        username: uname,
        userName: targetUser.name || uname,
        itemType: 'credit_redeem',
        itemId: tid,
        itemLabel: `Đổi 1 lượt Combo mở đề: ${targetTest.title}`,
        amount: 0,
        status: 'paid',
        gateway: 'credit_wallet',
        balanceBefore,
        balanceAfter,
        suppressAdminNotify: true
      });
      appendStoreNotification(
        store,
        {
          title: '🎫 Đã đổi 1 lượt Combo Thi Thật thành công!',
          message: `Bạn đã dùng 1 lượt Combo để mở khóa đề "${targetTest.title}" (1 lượt thi thật 4 kỹ năng). Số lượt Combo còn lại: ${nextCredits}.`,
          type: 'announcement',
          targetUsernames: [uname],
          createdBy: SUPER_ADMIN_USERNAME,
          createdByName: 'Hệ Thống Thực Chiến IELTS'
        },
        null
      );
      changed = true;
      break;
    }

    case 'REQUEST_COVER_UNLOCK': {
      const uname = viewer?.username ? findUserKeyInStore(store, viewer.username) || viewer.username : '';
      const targetUser = uname ? store.users?.[uname] : null;
      if (!uname || !targetUser) break;
      const payCfgNow = normalizePaymentConfig(store.paymentConfig || {});
      const findPendingOrderCode = (iType, iId = '') => {
        const found = (Array.isArray(store.paymentOrders) ? store.paymentOrders : []).find(
          o =>
            o &&
            o.status === 'pending' &&
            String(o.username || '').toLowerCase() === uname.toLowerCase() &&
            (o.itemType || 'cover') === iType &&
            String(o.itemId || '') === String(iId || '')
        );
        return found?.orderCode || '';
      };
      if (payload?.itemType === 'title') {
        const paidTitle = PAID_SHOP_TITLES.find(t => t.id === payload?.itemId);
        if (!paidTitle) break;
        store.users[uname] = {
          ...targetUser,
          paidTitleRequested: {
            titleId: paidTitle.id,
            titleLabel: `${paidTitle.icon} ${paidTitle.label}`,
            requestedAt: Date.now()
          }
        };
        recordPaymentTransactionAndNotifyAdmin(store, {
          orderCode: findPendingOrderCode('title', paidTitle.id),
          username: uname,
          userName: targetUser.name || uname,
          itemType: 'title',
          itemId: paidTitle.id,
          itemLabel: `${paidTitle.icon} ${paidTitle.label} (Donate Vĩnh Viễn)`,
          amount: getTitlePriceVnd(paidTitle, payCfgNow),
          status: 'reported',
          gateway: 'manual_request'
        });
        changed = true;
        break;
      }
      if (payload?.itemType === 'test' && payload?.itemId) {
        const tid = String(payload.itemId).trim();
        const targetTest = (store.tests || []).find(t => t?.id === tid);
        if (!targetTest) break;
        store.users[uname] = {
          ...targetUser,
          subscriptionRequested: {
            itemType: 'test',
            itemId: tid,
            itemLabel: `Chi phí test: ${targetTest.title}`,
            requestedAt: Date.now()
          }
        };
        recordPaymentTransactionAndNotifyAdmin(store, {
          orderCode: findPendingOrderCode('test', tid),
          username: uname,
          userName: targetUser.name || uname,
          itemType: 'test',
          itemId: tid,
          itemLabel: `Chi phí test: ${targetTest.title}`,
          amount: getTestPurchasePriceVnd(targetTest, payCfgNow),
          status: 'reported',
          gateway: 'manual_request'
        });
        changed = true;
        break;
      }
      const comboMetaReq = getRealExamComboMeta(payload?.itemType, store.paymentConfig);
      if (comboMetaReq) {
        store.users[uname] = {
          ...targetUser,
          subscriptionRequested: {
            itemType: comboMetaReq.itemType,
            itemLabel: `${comboMetaReq.label} (${formatVndCurrency(comboMetaReq.price)})`,
            requestedAt: Date.now()
          }
        };
        recordPaymentTransactionAndNotifyAdmin(store, {
          orderCode: findPendingOrderCode(comboMetaReq.itemType, comboMetaReq.itemType),
          username: uname,
          userName: targetUser.name || uname,
          itemType: comboMetaReq.itemType,
          itemId: comboMetaReq.itemType,
          itemLabel: comboMetaReq.label,
          amount: comboMetaReq.price,
          status: 'reported',
          gateway: 'manual_request'
        });
        changed = true;
        break;
      }
      if (
        payload?.itemType === 'skill_pass' ||
        payload?.itemType === 'aieo_vip' ||
        payload?.itemType === 'room_ticket' ||
        payload?.itemType === 'gacha_wish_1' ||
        payload?.itemType === 'gacha_wish_10'
      ) {
        const reqLabel =
          payload.itemType === 'aieo_vip'
            ? 'Gói IELTS VIP (1 Tháng)'
            : payload.itemType === 'room_ticket'
            ? 'Vé Tạo 1 Phòng Đấu Riêng'
            : payload.itemType === 'gacha_wish_1'
            ? '1 Lượt Quay Gacha Hiệp Sĩ (5.000đ)'
            : payload.itemType === 'gacha_wish_10'
            ? 'Gói 10 Lượt Quay Gacha Hiệp Sĩ (50.000đ)'
            : 'Gói Daily Zone (1 Tháng)';
        const reqAmt =
          payload.itemType === 'aieo_vip'
            ? (Number(payCfgNow.aieoVipPrice) || AIEO_VIP_PRICE_VND)
            : payload.itemType === 'room_ticket'
            ? (Number(payCfgNow.friendRoomTicketPrice) || FRIEND_ROOM_TICKET_PRICE_VND)
            : payload.itemType === 'gacha_wish_1'
            ? (Number(payCfgNow.gachaWish1Price) || GACHA_WISH_1_PRICE_VND)
            : payload.itemType === 'gacha_wish_10'
            ? (Number(payCfgNow.gachaWish10Price) || GACHA_WISH_10_PRICE_VND)
            : (Number(payCfgNow.skillPassPrice) || SKILL_PASS_PRICE_VND);
        store.users[uname] = {
          ...targetUser,
          subscriptionRequested: {
            itemType: payload.itemType,
            itemLabel: reqLabel,
            requestedAt: Date.now()
          }
        };
        recordPaymentTransactionAndNotifyAdmin(store, {
          orderCode: findPendingOrderCode(payload.itemType, ''),
          username: uname,
          userName: targetUser.name || uname,
          itemType: payload.itemType,
          itemLabel: reqLabel,
          amount: reqAmt,
          status: 'reported',
          gateway: 'manual_request'
        });
        changed = true;
        break;
      }
      if (hasCustomCoverPermission(targetUser) && !payload?.renew) break;
      store.users[uname] = {
        ...targetUser,
        coverUnlockRequestedAt: Date.now()
      };
      recordPaymentTransactionAndNotifyAdmin(store, {
        orderCode: findPendingOrderCode('cover', ''),
        username: uname,
        userName: targetUser.name || uname,
        itemType: 'cover',
        itemLabel: 'Ảnh Nền Riêng (1 Tháng)',
        amount: payCfgNow.coverUnlockPrice,
        status: 'reported',
        gateway: 'manual_request'
      });
      changed = true;
      break;
    }

    case 'REPORT_DONATE_PAYMENT': {
      const uname = viewer?.username ? findUserKeyInStore(store, viewer.username) || viewer.username : '';
      const targetUser = uname ? store.users?.[uname] : null;
      if (!uname || !targetUser) break;
      const parsedAmt = parseStrictVndInt(payload?.amount);
      if (!Number.isFinite(parsedAmt) || parsedAmt < MIN_DONATE_AMOUNT_VND || parsedAmt > 50_000_000) break;
      const amount = parsedAmt;
      const note = String(payload?.note || '').trim().slice(0, 180);
      recordPaymentTransactionAndNotifyAdmin(store, {
        username: uname,
        userName: targetUser.name || uname,
        itemType: 'donate',
        itemLabel: `Ủng hộ tùy tâm (${formatVndCurrency(amount)})`,
        amount,
        status: 'reported',
        gateway: 'manual_donate',
        note
      });
      changed = true;
      break;
    }

    case 'CONFIRM_PAYMENT_TRANSACTION': {
      const txId = String(payload?.transactionId || '').trim();
      if (!txId || !Array.isArray(store.paymentTransactions)) break;
      const idx = store.paymentTransactions.findIndex(t => t && t.id === txId);
      if (idx < 0) break;
      const existing = store.paymentTransactions[idx];
      if (existing.status === 'paid') break;
      const nowMs = Date.now();
      const amt = Math.max(0, Math.round(Number(existing.amount) || 0));
      const confirmedBy = viewer?.username || SUPER_ADMIN_USERNAME;
      const fulfillRes = fulfillPaidEntitlementForUser(store, {
        userKey: existing.username,
        itemType: existing.itemType || 'cover',
        itemId: existing.itemId || '',
        itemLabel: existing.itemLabel || '',
        amount: amt,
        orderCode: existing.orderCode || '',
        gateway: existing.gateway || 'manual_confirm',
        txId: existing.txId || `manual:${txId}`,
        confirmedBy,
        nowMs
      });
      store.paymentTransactions[idx] = {
        ...existing,
        ...(fulfillRes.effectiveItemId ? { itemId: fulfillRes.effectiveItemId } : {}),
        ...(fulfillRes.balanceBefore ? { balanceBefore: fulfillRes.balanceBefore } : {}),
        ...(fulfillRes.balanceAfter ? { balanceAfter: fulfillRes.balanceAfter } : {}),
        confirmedBy,
        status: 'paid',
        paidAt: nowMs
      };
      changed = true;
      break;
    }

    case 'DELETE_PAYMENT_TRANSACTION': {
      const txId = String(payload?.transactionId || '').trim();
      if (!txId || !Array.isArray(store.paymentTransactions)) break;
      const before = store.paymentTransactions.length;
      store.paymentTransactions = store.paymentTransactions.filter(t => t && t.id !== txId);
      if (store.paymentTransactions.length !== before) changed = true;
      break;
    }

    case 'UPDATE_PAYMENT_CONFIG': {
      const normalizedCfg = normalizePaymentConfig({ ...(payload?.paymentConfig || payload || {}), pricingSchemaVersion: 3 });
      store.paymentConfig = externalizePaymentConfigMedia(store, normalizedCfg).config;
      changed = true;
      break;
    }

    case 'UPSERT_ATTEMPT': {
      let attempt = payload.attempt;
      if (!attempt?.id) break;
      const isTeacher = viewer?.role === 'teacher';
      if (!isTeacher && viewer) {
        const testObj = (store.tests || []).find(t => t.id === attempt.testId);
        const serverObjEval = evaluateObjectiveScoresForAttempt(testObj, attempt.answers || {});
        const effectiveTestMode =
          testObj?.testMode === 'single_skill'
            ? 'single_skill'
            : attempt.testMode === 'single_skill'
            ? 'single_skill'
            : 'full_exam';
        const focusSkill = effectiveTestMode === 'single_skill'
          ? (testObj?.focusSkill || attempt.focusSkill || null)
          : null;
        const isSingleSkill = effectiveTestMode === 'single_skill' && Boolean(focusSkill);
        const isSpeakingMode = isSingleSkill && focusSkill === 'speaking';
        const isSingleObjectiveMode =
          isSingleSkill &&
          (focusSkill === 'reading' || focusSkill === 'listening');

        const validTicket = isSpeakingMode && attempt.aiGradingTicket
          ? verifyToken(attempt.aiGradingTicket, store._authSecret)
          : null;
        const ticketOk = Boolean(
          validTicket &&
          validTicket.kind === 'speaking_eval' &&
          validTicket.username === viewer.username &&
          validTicket.testTitle === attempt.testTitle
        );

        const validWritingTicket = !isSpeakingMode && attempt.aiWritingTicket
          ? verifyToken(attempt.aiWritingTicket, store._authSecret)
          : null;
        const writingDigest = crypto
          .createHash('sha256')
          .update(`${String(attempt.answers?.w1 || '')}||${String(attempt.answers?.w2 || '')}`)
          .digest('hex')
          .slice(0, 24);
        const writingTicketOk = Boolean(
          validWritingTicket &&
          validWritingTicket.kind === 'writing_eval' &&
          validWritingTicket.username === viewer.username &&
          validWritingTicket.digest === writingDigest
        );

        const isSingleWritingMode = isSingleSkill && focusSkill === 'writing';
        let sanitizedScores = isSingleSkill
          ? {
              ...(focusSkill === 'listening' ? { listening: attempt.scores?.listening || { raw: 0, total: 0, band: null } } : {}),
              ...(focusSkill === 'reading' ? { reading: attempt.scores?.reading || { raw: 0, total: 0, band: null } } : {}),
              ...(isSingleWritingMode ? { writing: { task1Band: null, task2Band: null, overallBand: null } } : {}),
              ...(isSpeakingMode ? { speaking: { band: null, criteria: {} } } : {})
            }
          : {
              listening: attempt.scores?.listening || { raw: 0, total: 0, band: null },
              reading: attempt.scores?.reading || { raw: 0, total: 0, band: null },
              writing: { task1Band: null, task2Band: null, overallBand: null },
              speaking: { band: null, criteria: {} }
            };
        let finalOverallBand = null;
        let finalTeacherGraded = false;
        let finalAiGraded = false;
        let finalFeedback = '';

        if (serverObjEval) {
          if ((!isSingleSkill || focusSkill === 'listening') && serverObjEval.scores.listening) {
            sanitizedScores.listening = serverObjEval.scores.listening;
          }
          if ((!isSingleSkill || focusSkill === 'reading') && serverObjEval.scores.reading) {
            sanitizedScores.reading = serverObjEval.scores.reading;
          }
          if (isSingleObjectiveMode) {
            finalOverallBand = serverObjEval.overallBand;
            finalTeacherGraded = true;
          }
        }

        // Hold final score release for Ms. Nhu approval on Full 4-Skill Exams, Writing, and Speaking.
        // Any valid server-signed AI draft is preserved strictly as teacher reference (never auto-published as final student grade).
        let aiDraftBand = null;
        let aiDraftFeedback = '';
        if (isSpeakingMode && ticketOk && typeof validTicket.band === 'number') {
          aiDraftBand = roundWholeBand(validTicket.band);
          aiDraftFeedback = typeof validTicket.overallFeedback === 'string' ? validTicket.overallFeedback : '';
          finalAiGraded = false;
          finalTeacherGraded = false;
          finalOverallBand = null;
        } else if (!isSpeakingMode && !isSingleObjectiveMode && writingTicketOk && typeof validWritingTicket.overallBand === 'number') {
          const wt1 = Number(validWritingTicket.task1Band) || 0;
          const wt2 = Number(validWritingTicket.task2Band) || 0;
          aiDraftBand = calculateWritingBand(wt1, wt2);
          aiDraftFeedback = typeof validWritingTicket.feedback === 'string' ? validWritingTicket.feedback : '';
          finalAiGraded = false;
          finalTeacherGraded = false;
          finalOverallBand = null;
        }

        const submittedAtMs = Date.now();
        const timeliness = computeTestTimelinessServer(testObj, submittedAtMs);
        const rawDuration = Math.max(0, Math.round(Number(attempt.durationSeconds) || 0));
        const rawStartedAtMs = parseScheduleTimestampServer(attempt.startedAtMs);
        const cleanSpeakingRecordings = Array.isArray(attempt.speakingRecordings)
          ? attempt.speakingRecordings
              .filter(r => r && typeof r === 'object')
              .slice(0, 24)
              .map(stripSpeakingRecordingEvaluationFields)
          : undefined;

        attempt = {
          ...attempt,
          studentId: viewer.username,
          studentName: viewer.name || attempt.studentName,
          ...(cleanSpeakingRecordings ? { speakingRecordings: cleanSpeakingRecordings } : {}),
          startedAtMs: rawStartedAtMs || Math.max(1, submittedAtMs - rawDuration * 1000),
          startedAt: typeof attempt.startedAt === 'string' && attempt.startedAt
            ? attempt.startedAt.slice(0, 60)
            : formatViDateTimeServer(rawStartedAtMs || submittedAtMs),
          submittedAtMs,
          submittedAt: typeof attempt.submittedAt === 'string' && attempt.submittedAt
            ? attempt.submittedAt.slice(0, 60)
            : formatViDateTimeServer(submittedAtMs),
          durationSeconds: rawDuration,
          ...timeliness,
          scores: sanitizedScores,
          overallBand: finalOverallBand,
          teacherGraded: finalTeacherGraded,
          aiGraded: finalAiGraded,
          aiDetails: null,
          speakingAiDetails: null,
          teacherFeedback: finalFeedback,
          ...(aiDraftBand !== null ? { aiDraftBand, aiDraftFeedback } : {})
        };
        delete attempt.aiGradingTicket;
        delete attempt.aiWritingTicket;
      } else {
        const testObj = (store.tests || []).find(t => t.id === attempt.testId);
        const isExistingAttempt = (store.attempts || []).some(a => a.id === attempt.id);
        const submittedAtMs = parseScheduleTimestampServer(attempt.submittedAtMs) || Date.now();
        const timeliness = computeTestTimelinessServer(testObj, submittedAtMs);
        attempt = {
          ...attempt,
          submittedAtMs,
          durationSeconds: Math.max(0, Math.round(Number(attempt.durationSeconds) || 0)),
          ...timeliness
        };
        if (!isExistingAttempt && testObj && !attempt.manualObjectiveOverride) {
          const reconciled = reconcileAttemptObjectiveScores(attempt, testObj);
          if (reconciled.changed) {
            attempt = reconciled.attempt;
          }
        }
      }

      const idx = store.attempts.findIndex(a => a.id === attempt.id);
      if (idx >= 0) {
        store.attempts[idx] = attempt;
      } else {
        store.attempts = [attempt, ...store.attempts];
      }
      changed = true;
      break;
    }

    case 'DELETE_ATTEMPT': {
      const attemptId = payload.attemptId;
      if (!attemptId) break;
      const prevLen = store.attempts.length;
      store.attempts = store.attempts.filter(a => a.id !== attemptId);
      if (store.attempts.length !== prevLen) {
        changed = true;
      }
      break;
    }

    case 'UPSERT_NOTE': {
      if (!payload.username) break;
      store.teacherNotes[payload.username] = payload.text || '';
      changed = true;
      break;
    }

    case 'RESET_USER_PASSWORD': {
      const uname = findUserKeyInStore(store, payload.username);
      const nextPass = String(payload.password || '').trim();
      const target = uname ? store.users?.[uname] : null;
      if (!uname || !target || !nextPass) break;
      const updated = {
        ...target,
        passwordHash: hashPassword(nextPass),
        tokenVersion: (target.tokenVersion || 1) + 1
      };
      delete updated.pass;
      store.users[uname] = updated;
      changed = true;
      break;
    }

    case 'UPSERT_USER': {
      const rawUname = payload.username || payload.user?.username || '';
      if (upsertSingleUserInStore(store, rawUname, payload.user, viewer)) {
        changed = true;
      }
      break;
    }

    case 'UPSERT_USERS_BULK': {
      const rawUsers = Array.isArray(payload.users) ? payload.users : [];
      for (const item of rawUsers) {
        if (upsertSingleUserInStore(store, item?.username || '', item, viewer)) {
          changed = true;
        }
      }
      break;
    }

    case 'DELETE_USER': {
      const uname = findUserKeyInStore(store, payload.username) || normalizeUsernameKey(payload.username);
      if (deleteSingleUserFromStore(store, uname, { purgeAttempts: Boolean(payload.purgeAttempts), viewerUsername: viewer?.username || '' })) {
        changed = true;
      }
      break;
    }

    case 'DELETE_USERS_BULK': {
      const rawNames = Array.isArray(payload.usernames) ? payload.usernames : [];
      const purgeAttempts = payload.purgeAttempts !== false;
      for (const rawName of rawNames) {
        const uname = findUserKeyInStore(store, rawName) || normalizeUsernameKey(rawName);
        if (deleteSingleUserFromStore(store, uname, { purgeAttempts, viewerUsername: viewer?.username || '' })) {
          changed = true;
        }
      }
      break;
    }

    case 'PURGE_ORPHAN_ATTEMPTS': {
      const validUsers = store.users || {};
      const prevLen = Array.isArray(store.attempts) ? store.attempts.length : 0;
      store.attempts = (store.attempts || []).filter(att => {
        const sid = String(att?.studentId || '').trim();
        return !sid || Boolean(validUsers[sid]);
      });
      if (store.attempts.length !== prevLen) {
        changed = true;
      }
      break;
    }

    case 'UPSERT_VOCAB_TOPIC': {
      const topic = payload.topic;
      if (!topic?.id || !topic?.label || typeof topic?.text !== 'string') break;
      const list = Array.isArray(store.customVocabTopics) ? store.customVocabTopics : [];
      const idx = list.findIndex(t => t.id === topic.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...topic };
        store.customVocabTopics = [...list];
      } else {
        store.customVocabTopics = [...list, topic];
      }
      changed = true;
      break;
    }

    case 'DELETE_VOCAB_TOPIC': {
      const topicId = payload.topicId;
      if (!topicId) break;
      const list = Array.isArray(store.customVocabTopics) ? store.customVocabTopics : [];
      const filtered = list.filter(t => t.id !== topicId);
      if (filtered.length !== list.length) {
        store.customVocabTopics = filtered;
        changed = true;
      }
      break;
    }

    case 'UPSERT_SPEAKING_FORECAST': {
      const nextBank = normalizeSpeakingForecastBank(payload?.bank || payload?.speakingForecast || payload);
      store.speakingForecast = nextBank;
      changed = true;
      break;
    }

    case 'SET_AI_CONFIG': {
      const nextKey = String(payload.geminiApiKey ?? '').trim().replace(/^['"]|['"]$/g, '');
      const prevKey = String(store.aiConfig?.geminiApiKey || '');
      if (nextKey !== prevKey) {
        store.aiConfig = { ...(store.aiConfig || {}), geminiApiKey: nextKey };
        changed = true;
      }
      break;
    }

    case 'SUBMIT_ADMIN_FEEDBACK': {
      const content = String(payload?.content || '').trim().slice(0, 2000);
      if (!content || !viewer?.username) break;
      const category = ['feature', 'bug', 'ui', 'other'].includes(payload?.category) ? payload.category : 'feature';
      const item = {
        id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        authorUsername: viewer.username,
        authorName: viewer.name || viewer.username,
        authorRole: viewer.isSuperAdmin ? 'superadmin' : (viewer.role === 'teacher' ? 'teacher' : 'student'),
        category,
        content,
        isPrivate: Boolean(payload?.isPrivate),
        createdAt: new Date().toLocaleString('vi-VN'),
        status: 'new',
        adminReply: '',
        repliedAt: ''
      };
      const prevList = Array.isArray(store.adminFeedbacks) ? store.adminFeedbacks : [];
      store.adminFeedbacks = [item, ...prevList].slice(0, 300);
      changed = true;
      break;
    }

    case 'UPDATE_ADMIN_FEEDBACK': {
      const fbId = String(payload?.feedbackId || '').trim();
      if (!fbId || !Array.isArray(store.adminFeedbacks)) break;
      const idx = store.adminFeedbacks.findIndex(f => f?.id === fbId);
      if (idx < 0) break;
      const prevFb = store.adminFeedbacks[idx];
      const nextStatus = ['new', 'planned', 'done'].includes(payload?.status) ? payload.status : prevFb.status;
      const hasReplyField = typeof payload?.adminReply === 'string';
      const nextReply = hasReplyField ? payload.adminReply.trim().slice(0, 2000) : (prevFb.adminReply || '');
      const updatedFb = {
        ...prevFb,
        status: nextStatus,
        adminReply: nextReply,
        repliedAt: hasReplyField && nextReply ? new Date().toLocaleString('vi-VN') : (prevFb.repliedAt || '')
      };
      store.adminFeedbacks = [
        ...store.adminFeedbacks.slice(0, idx),
        updatedFb,
        ...store.adminFeedbacks.slice(idx + 1)
      ];
      changed = true;
      break;
    }

    case 'DELETE_ADMIN_FEEDBACK': {
      const fbId = String(payload?.feedbackId || '').trim();
      if (!fbId || !Array.isArray(store.adminFeedbacks)) break;
      const filtered = store.adminFeedbacks.filter(f => f?.id !== fbId);
      if (filtered.length !== store.adminFeedbacks.length) {
        store.adminFeedbacks = filtered;
        changed = true;
      }
      break;
    }

    case 'APPROVE_LOBBY_PLAYER': {
      const cleanPin = String(payload?.pin || '').trim();
      const base = cleanPin && store.rooms?.[cleanPin] ? normalizeServerRoom(store.rooms[cleanPin], cleanPin) : null;
      if (!base) break;
      const approveAll = Boolean(payload?.approveAll);
      const targetUname = String(payload?.username || '').trim();
      const nextApproved = payload?.approved !== false;
      const nextLobby = { ...(base.lobbyPlayers || {}) };
      if (approveAll) {
        Object.keys(nextLobby).forEach(uname => {
          if (nextLobby[uname] && nextLobby[uname].role !== 'teacher') {
            nextLobby[uname] = { ...nextLobby[uname], approved: nextApproved, ready: nextApproved ? true : nextLobby[uname].ready };
          }
        });
      } else if (targetUname && nextLobby[targetUname]) {
        nextLobby[targetUname] = {
          ...nextLobby[targetUname],
          approved: nextApproved,
          ready: nextApproved ? true : nextLobby[targetUname].ready
        };
      }
      base.lobbyPlayers = nextLobby;
      store.rooms[cleanPin] = base;
      changed = true;
      break;
    }

    case 'SUBMIT_PRACTICE_GAME_SCORE': {
      if (!viewer?.username) break;
      const isViewerSuperAdmin = Boolean(viewer.isSuperAdmin && viewer.username === SUPER_ADMIN_USERNAME);
      const isViewerTeacher = viewer.role === 'teacher';
      const matchId = String(payload?.matchId || '').trim().slice(0, 80);
      if (matchId && payload?.gameCompleted) {
        if (!(store._processedGameMatchIds instanceof Set)) {
          store._processedGameMatchIds = new Set();
        }
        const dedupKey = `${viewer.username.toLowerCase()}:${matchId}`;
        if (store._processedGameMatchIds.has(dedupKey)) {
          break;
        }
        if (store._processedGameMatchIds.size >= 1000) {
          const firstKey = store._processedGameMatchIds.values().next().value;
          if (firstKey) store._processedGameMatchIds.delete(firstKey);
        }
        store._processedGameMatchIds.add(dedupKey);
      }
      const topicId = String(payload?.topicId || 'core').trim().slice(0, 60);
      const topicLabel = String(payload?.topicLabel || 'IELTS Core').trim().slice(0, 80);
      const mode = String(payload?.mode || 'full_4').trim().slice(0, 32);
      const gameType = payload?.gameType === 'knight_rpg' || mode.startsWith('knight') ? 'knight_rpg' : 'space_shooter';
      const passedCount = Math.max(0, Math.min(200, Math.round(Number(payload?.passedCount) || 0)));
      const totalCount = Math.max(1, Math.min(200, Math.round(Number(payload?.totalCount) || 1)));
      const rawSubmittedScore = Math.max(0, Math.min(250_000, Math.round(Number(payload?.score) || 0)));
      const plausibleCap = isViewerSuperAdmin
        ? 250_000
        : passedCount <= 0
        ? 0
        : Math.min(250_000, passedCount * 3500 + 5000);
      const cleanScore = Math.min(rawSubmittedScore, plausibleCap);
      const accuracyPct = Math.min(100, Math.max(0, Math.round((passedCount / totalCount) * 100)));
      const nowMs = Date.now();
      if (payload?.knightRpgProfile && typeof payload.knightRpgProfile === 'object') {
        const uKey = findUserKeyInStore(store, viewer.username) || viewer.username;
        if (store.users?.[uKey]) {
          const prevUserRec = store.users[uKey];
          store.users[uKey] = {
            ...prevUserRec,
            knightRpgProfile: sanitizeClientKnightRpgUpdate(
              prevUserRec.knightRpgProfile,
              payload.knightRpgProfile,
              prevUserRec,
              {
                isSuperAdmin: isViewerSuperAdmin,
                isTeacher: isViewerTeacher,
                allowMatchLoot: Boolean(payload?.gameCompleted),
                allowGoldGain: isViewerTeacher
              }
            )
          };
          changed = true;
        }
      }
      if (cleanScore > 0) {
        const list = Array.isArray(store.gamePracticeLeaderboard) ? [...store.gamePracticeLeaderboard] : [];
        const existingIdx = list.findIndex(
          e => e.username === viewer.username && e.topicId === topicId && e.mode === mode && (e.gameType || 'space_shooter') === gameType
        );
        const bestScore = existingIdx >= 0 ? Math.max(Number(list[existingIdx].score) || 0, cleanScore) : cleanScore;
        const bestAccuracy = existingIdx >= 0
          ? (cleanScore >= (Number(list[existingIdx].score) || 0) ? accuracyPct : list[existingIdx].accuracyPct)
          : accuracyPct;
        const nextEntry = {
          id: existingIdx >= 0 ? list[existingIdx].id : `gpr_${viewer.username}_${gameType}_${topicId}_${mode}`,
          username: viewer.username,
          name: viewer.name || viewer.username,
          gameType,
          topicId,
          topicLabel,
          mode,
          score: bestScore,
          lastScore: cleanScore,
          passedCount,
          totalCount,
          accuracyPct: bestAccuracy,
          runsCount: existingIdx >= 0 ? (Number(list[existingIdx].runsCount) || 1) + 1 : 1,
          updatedAt: new Date(nowMs).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
          updatedAtMs: nowMs
        };
        if (existingIdx >= 0) list[existingIdx] = nextEntry;
        else list.push(nextEntry);
        list.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0) || (Number(b.updatedAtMs) || 0) - (Number(a.updatedAtMs) || 0));
        store.gamePracticeLeaderboard = list.slice(0, 250);
        const uKeyScore = findUserKeyInStore(store, viewer.username) || viewer.username;
        if (store.users?.[uKeyScore]) {
          const prevURec = store.users[uKeyScore];
          const isPerfRun = Boolean(payload?.gameCompleted && totalCount >= 4 && passedCount >= totalCount);
          store.users[uKeyScore] = {
            ...prevURec,
            allTimeBestGameScore: Math.max(
              Math.floor(Number(prevURec.allTimeBestGameScore) || 0),
              cleanScore
            ),
            hasAllTimeGamePerfectRun: Boolean(prevURec.hasAllTimeGamePerfectRun || isPerfRun)
          };
        }
        changed = true;
      }
      if (payload?.gameCompleted) {
        if (grantFirstGameStarterGiftIfEligible(store, viewer.username)) {
          changed = true;
        }
      }
      break;
    }

    case 'KNIGHT_PVP_FIND_MATCH': {
      const nowMs = Date.now();
      pruneStaleKnightPvpRuntime(store, nowMs);
      const isViewerSuperAdmin = Boolean(viewer?.isSuperAdmin && viewer?.username === SUPER_ADMIN_USERNAME);
      const vKey = findUserKeyInStore(store, viewer.username) || viewer.username;
      const viewerRec = store.users?.[vKey] || viewer;
      const vLower = String(viewer.username).toLowerCase();
      const topicId = String(payload?.topicId || 'core').trim().slice(0, 60) || 'core';
      const topicLabel = String(payload?.topicLabel || 'IELTS Core Academic').trim().slice(0, 100) || 'IELTS Core Academic';
      const forceTie22Test = Boolean(isViewerSuperAdmin && payload?.forceTie22Test);

      // Clear any finished/cancelled old match for this viewer before starting new search
      for (const [mId, m] of store._knightPvpMatches.entries()) {
        const isMine =
          String(m?.p1?.username || '').toLowerCase() === vLower ||
          (!m?.p2?.isNpc && String(m?.p2?.username || '').toLowerCase() === vLower);
        if (isMine && (m.status === 'FINISHED' || m.status === 'CANCELLED')) {
          store._knightPvpMatches.delete(mId);
        }
      }

      // Check if another real player is waiting in the matchmaking queue
      let matchedOther = null;
      if (!forceTie22Test) {
        for (const [otherLower, q] of store._knightPvpQueue.entries()) {
          if (otherLower !== vLower && q && nowMs - (Number(q.queuedAt) || 0) <= 60_000) {
            matchedOther = q;
            break;
          }
        }
      }

      if (matchedOther) {
        store._knightPvpQueue.delete(String(matchedOther.username).toLowerCase());
        store._knightPvpQueue.delete(vLower);
        const otherKey = findUserKeyInStore(store, matchedOther.username) || matchedOther.username;
        const otherRec = store.users?.[otherKey] || { username: matchedOther.username, name: matchedOther.name };
        const matchId = `kpvpm_${nowMs}_${crypto.randomBytes(4).toString('hex')}`;
        const seed = `${matchId}:seed`;
        const demonPick = pickDemonRouletteSector(seed);
        store._knightPvpMatches.set(matchId, {
          id: matchId,
          mode: 'ranked_human',
          status: 'READY_CHECK',
          seed,
          topicId: matchedOther.topicId || topicId,
          topicLabel: matchedOther.topicLabel || topicLabel,
          createdAt: nowMs,
          updatedAtMs: nowMs,
          readyDeadlineMs: nowMs + KNIGHT_PVP_READY_CHECK_SEC * 1000,
          round: 1,
          maxRounds: KNIGHT_PVP_TOTAL_ROUNDS,
          questionIdx: 0,
          tiebreakerTriggered: false,
          demonSectorIdx: demonPick.sectorIndex,
          demonRoundType: demonPick.sector.roundType,
          p1: buildFighterSlotFromUser(otherRec, matchedOther.username),
          p2: buildFighterSlotFromUser(viewerRec, viewer.username),
          roundHistory: [],
          winnerSlot: '',
          finishReason: '',
          rewards: {}
        });
        changed = true;
        break;
      }

      if (payload?.spawnNpcNow) {
        store._knightPvpQueue.delete(vLower);
        const p1Slot = buildFighterSlotFromUser(viewerRec, viewer.username);
        const npcMeta = pickScaledNpcForRp(p1Slot.rp, nowMs + vLower.length * 17);
        const matchId = `kpvpm_npc_${nowMs}_${crypto.randomBytes(4).toString('hex')}`;
        const seed = `${matchId}:seed`;
        const demonPick = pickDemonRouletteSector(seed);
        store._knightPvpMatches.set(matchId, {
          id: matchId,
          mode: 'ranked_npc',
          status: 'READY_CHECK',
          seed,
          topicId,
          topicLabel,
          forceTie22Test,
          createdAt: nowMs,
          updatedAtMs: nowMs,
          readyDeadlineMs: nowMs + KNIGHT_PVP_READY_CHECK_SEC * 1000,
          round: forceTie22Test ? 5 : 1,
          maxRounds: KNIGHT_PVP_TOTAL_ROUNDS,
          questionIdx: 0,
          tiebreakerTriggered: forceTie22Test,
          demonSectorIdx: demonPick.sectorIndex,
          demonRoundType: demonPick.sector.roundType,
          p1: {
            ...p1Slot,
            roundsWon: forceTie22Test ? 2 : 0
          },
          p2: {
            username: npcMeta.id,
            name: npcMeta.name,
            avatarUrl: '',
            isNpc: true,
            npcId: npcMeta.id,
            tierId: npcMeta.tierId,
            titleLabel: npcMeta.titleLabel,
            rp: npcMeta.rpDisplay,
            skinId: npcMeta.skinId,
            weaponId: npcMeta.weaponId,
            minDelayMs: npcMeta.minDelayMs,
            maxDelayMs: npcMeta.maxDelayMs,
            accuracy: npcMeta.accuracy,
            typingCps: npcMeta.typingCps,
            accepted: true,
            lives: KNIGHT_PVP_LIVES_PER_ROUND,
            roundsWon: forceTie22Test ? 2 : 0,
            hits: 0,
            freezes: 0,
            frozenUntilMs: 0
          },
          roundHistory: forceTie22Test
            ? [
                { round: 1, winner: 'p1' },
                { round: 2, winner: 'p2' },
                { round: 3, winner: 'p1' },
                { round: 4, winner: 'p2' }
              ]
            : [],
          winnerSlot: '',
          finishReason: '',
          rewards: {}
        });
        changed = true;
        break;
      }

      store._knightPvpQueue.set(vLower, {
        username: viewer.username,
        name: viewerRec.name || viewer.username,
        topicId,
        topicLabel,
        queuedAt: store._knightPvpQueue.get(vLower)?.queuedAt || nowMs
      });
      changed = true;
      break;
    }

    case 'KNIGHT_PVP_CANCEL_QUEUE': {
      const nowMs = Date.now();
      ensureKnightPvpMaps(store);
      const vLower = String(viewer.username).toLowerCase();
      store._knightPvpQueue.delete(vLower);
      for (const [mId, m] of store._knightPvpMatches.entries()) {
        const isMine =
          String(m?.p1?.username || '').toLowerCase() === vLower ||
          (!m?.p2?.isNpc && String(m?.p2?.username || '').toLowerCase() === vLower);
        if (isMine && m.status === 'READY_CHECK') {
          m.status = 'CANCELLED';
          m.finishReason = 'Đã hủy tìm trận.';
          m.updatedAtMs = nowMs;
          if (m.mode === 'ranked_npc') store._knightPvpMatches.delete(mId);
        }
      }
      changed = true;
      break;
    }

    case 'KNIGHT_PVP_CREATE_ROOM': {
      const nowMs = Date.now();
      pruneStaleKnightPvpRuntime(store, nowMs);
      const vLower = String(viewer.username).toLowerCase();
      store._knightPvpQueue.delete(vLower);
      for (const [c, r] of store._knightPvpRooms.entries()) {
        if (String(r?.hostUsername || '').toLowerCase() === vLower) {
          store._knightPvpRooms.delete(c);
        }
      }
      let code = '';
      for (let tries = 0; tries < 20; tries += 1) {
        const cand = String(Math.floor(100000 + Math.random() * 900000));
        if (!store._knightPvpRooms.has(cand)) {
          code = cand;
          break;
        }
      }
      if (!code) code = String(Date.now()).slice(-6);
      const topicId = String(payload?.topicId || 'core').trim().slice(0, 60) || 'core';
      const topicLabel = String(payload?.topicLabel || 'IELTS Core Academic').trim().slice(0, 100) || 'IELTS Core Academic';
      store._knightPvpRooms.set(code, {
        code,
        mode: 'casual_room',
        hostUsername: viewer.username,
        hostName: viewer.name || viewer.username,
        guestUsername: '',
        guestName: '',
        topicId,
        topicLabel,
        matchId: '',
        createdAt: nowMs,
        updatedAtMs: nowMs
      });
      changed = true;
      break;
    }

    case 'KNIGHT_PVP_JOIN_ROOM': {
      const nowMs = Date.now();
      pruneStaleKnightPvpRuntime(store, nowMs);
      const code = String(payload?.roomCode || '').trim().replace(/\D/g, '').slice(0, 6);
      const room = code ? store._knightPvpRooms.get(code) : null;
      if (!room || String(room.hostUsername || '').toLowerCase() === String(viewer.username).toLowerCase()) {
        break;
      }
      const hostKey = findUserKeyInStore(store, room.hostUsername) || room.hostUsername;
      const guestKey = findUserKeyInStore(store, viewer.username) || viewer.username;
      const hostRec = store.users?.[hostKey] || { username: room.hostUsername, name: room.hostName };
      const guestRec = store.users?.[guestKey] || viewer;
      const matchId = `kpvpm_room_${code}_${nowMs}`;
      const seed = `${matchId}:seed`;
      const demonPick = pickDemonRouletteSector(seed);
      room.guestUsername = viewer.username;
      room.guestName = viewer.name || viewer.username;
      room.matchId = matchId;
      room.updatedAtMs = nowMs;
      store._knightPvpMatches.set(matchId, {
        id: matchId,
        mode: 'casual_room',
        roomCode: code,
        status: 'READY_CHECK',
        seed,
        topicId: room.topicId || 'core',
        topicLabel: room.topicLabel || 'IELTS Core Academic',
        createdAt: nowMs,
        updatedAtMs: nowMs,
        readyDeadlineMs: nowMs + KNIGHT_PVP_READY_CHECK_SEC * 1000,
        round: 1,
        maxRounds: KNIGHT_PVP_TOTAL_ROUNDS,
        questionIdx: 0,
        tiebreakerTriggered: false,
        demonSectorIdx: demonPick.sectorIndex,
        demonRoundType: demonPick.sector.roundType,
        p1: buildFighterSlotFromUser(hostRec, room.hostUsername),
        p2: buildFighterSlotFromUser(guestRec, viewer.username),
        roundHistory: [],
        winnerSlot: '',
        finishReason: '',
        rewards: {}
      });
      changed = true;
      break;
    }

    case 'KNIGHT_PVP_LEAVE_ROOM': {
      const nowMs = Date.now();
      ensureKnightPvpMaps(store);
      const vLower = String(viewer.username).toLowerCase();
      store._knightPvpQueue.delete(vLower);
      for (const [code, r] of store._knightPvpRooms.entries()) {
        if (String(r?.hostUsername || '').toLowerCase() === vLower) {
          store._knightPvpRooms.delete(code);
        } else if (String(r?.guestUsername || '').toLowerCase() === vLower) {
          r.guestUsername = '';
          r.guestName = '';
          r.matchId = '';
          r.updatedAtMs = nowMs;
        }
      }
      for (const [mId, m] of store._knightPvpMatches.entries()) {
        const isP1 = String(m?.p1?.username || '').toLowerCase() === vLower;
        const isP2 = !m?.p2?.isNpc && String(m?.p2?.username || '').toLowerCase() === vLower;
        if (!isP1 && !isP2) continue;
        if (m.status === 'PLAYING' && m.mode === 'ranked_human') {
          const winnerSlot = isP1 ? 'p2' : 'p1';
          const loserSlot = isP1 ? 'p1' : 'p2';
          m.status = 'FINISHED';
          m.winnerSlot = winnerSlot;
          m.finishReason = `${viewer.name || viewer.username} đã rời trận đấu.`;
          m.updatedAtMs = nowMs;
          m.rewards = {
            [winnerSlot]: settleKnightPvpRankedRewards(store, m[winnerSlot].username, {
              didWin: true,
              isDemonTiebreaker: Boolean(m.tiebreakerTriggered),
              opponentName: m[loserSlot].name,
              mode: 'ranked_human',
              nowMs
            }),
            [loserSlot]: settleKnightPvpRankedRewards(store, m[loserSlot].username, {
              didWin: false,
              isDemonTiebreaker: false,
              opponentName: m[winnerSlot].name,
              mode: 'ranked_human',
              nowMs
            })
          };
        } else {
          store._knightPvpMatches.delete(mId);
        }
      }
      changed = true;
      break;
    }

    case 'KNIGHT_PVP_ACCEPT_READY':
    case 'KNIGHT_PVP_DECLINE_READY': {
      const nowMs = Date.now();
      ensureKnightPvpMaps(store);
      const matchId = String(payload?.matchId || '');
      const m = matchId ? store._knightPvpMatches.get(matchId) : null;
      if (!m || m.status !== 'READY_CHECK') break;
      const vLower = String(viewer.username).toLowerCase();
      const mySlotKey =
        String(m.p1?.username || '').toLowerCase() === vLower
          ? 'p1'
          : !m.p2?.isNpc && String(m.p2?.username || '').toLowerCase() === vLower
          ? 'p2'
          : '';
      if (!mySlotKey) break;

      if (type === 'KNIGHT_PVP_DECLINE_READY') {
        m.status = 'CANCELLED';
        m.finishReason = `${viewer.name || viewer.username} đã từ chối giao đấu.`;
        m.updatedAtMs = nowMs;
        changed = true;
        break;
      }

      m[mySlotKey].accepted = true;
      m.updatedAtMs = nowMs;
      if (m.p1?.accepted && m.p2?.accepted) {
        m.status = 'PLAYING';
        m.startedAt = nowMs;
        m.roundReadyAtMs = nowMs + 2500;
        m.questionStartedAtMs = nowMs + 2500;
        m.p1.lives = KNIGHT_PVP_LIVES_PER_ROUND;
        m.p2.lives = KNIGHT_PVP_LIVES_PER_ROUND;
        m.p1.frozenUntilMs = 0;
        m.p2.frozenUntilMs = 0;
      }
      changed = true;
      break;
    }

    case 'KNIGHT_PVP_SYNC_COMBAT': {
      const nowMs = Date.now();
      ensureKnightPvpMaps(store);
      const matchId = String(payload?.matchId || '');
      const m = matchId ? store._knightPvpMatches.get(matchId) : null;
      if (!m || m.status !== 'PLAYING' || m.mode === 'ranked_npc') break;
      const vLower = String(viewer.username).toLowerCase();
      const mySlotKey =
        String(m.p1?.username || '').toLowerCase() === vLower
          ? 'p1'
          : !m.p2?.isNpc && String(m.p2?.username || '').toLowerCase() === vLower
          ? 'p2'
          : '';
      if (!mySlotKey) break;
      const oppSlotKey = mySlotKey === 'p1' ? 'p2' : 'p1';
      const event = String(payload?.event || '');

      const advanceHumanPvpRound = (winnerSlotKey) => {
        const isDrawRound = winnerSlotKey === 'draw';
        if (!isDrawRound) {
          m[winnerSlotKey].roundsWon = (Number(m[winnerSlotKey].roundsWon) || 0) + 1;
        }
        m.roundHistory = [...(m.roundHistory || []), { round: m.round, winner: winnerSlotKey }];
        m.lastRoundKo = {
          round: m.round,
          winnerSlot: winnerSlotKey,
          atMs: nowMs
        };

        if (m.round < 4) {
          m.round += 1;
          m.questionIdx = 0;
          m.p1.lives = KNIGHT_PVP_LIVES_PER_ROUND;
          m.p2.lives = KNIGHT_PVP_LIVES_PER_ROUND;
          m.p1.frozenUntilMs = 0;
          m.p2.frozenUntilMs = 0;
          m.roundReadyAtMs = nowMs + 4000;
          m.questionStartedAtMs = nowMs + 4000;
        } else if (m.round === 4 && m.p1.roundsWon === m.p2.roundsWon) {
          m.round = 5;
          m.tiebreakerTriggered = true;
          m.tiebreakerStartedAtMs = nowMs;
          m.questionIdx = 0;
          m.p1.lives = KNIGHT_PVP_LIVES_PER_ROUND;
          m.p2.lives = KNIGHT_PVP_LIVES_PER_ROUND;
          m.p1.frozenUntilMs = 0;
          m.p2.frozenUntilMs = 0;
          m.roundReadyAtMs = nowMs + 6200;
          m.questionStartedAtMs = nowMs + 6200;
        } else if (m.round === 5 && isDrawRound) {
          const prevSectorIdx = Number(m.demonSectorIdx) || 0;
          const nextSectorIdx = (prevSectorIdx + 1 + Math.floor(Math.random() * 3)) % 4;
          m.demonSectorIdx = nextSectorIdx;
          m.demonRoundType = [1, 2, 3, 4][nextSectorIdx] || 1;
          m.tiebreakerSpinSeq = (Number(m.tiebreakerSpinSeq) || 0) + 1;
          m.questionIdx += 1;
          m.p1.lives = KNIGHT_PVP_LIVES_PER_ROUND;
          m.p2.lives = KNIGHT_PVP_LIVES_PER_ROUND;
          m.p1.frozenUntilMs = 0;
          m.p2.frozenUntilMs = 0;
          m.roundReadyAtMs = nowMs + 6200;
          m.questionStartedAtMs = nowMs + 6200;
        } else {
          const finalWinnerSlot = m.p1.roundsWon >= m.p2.roundsWon ? 'p1' : 'p2';
          const finalLoserSlot = finalWinnerSlot === 'p1' ? 'p2' : 'p1';
          m.status = 'FINISHED';
          m.winnerSlot = finalWinnerSlot;
          m.finishReason =
            m.mode === 'casual_room'
              ? 'Trận giao hữu giải trí hoàn tất (Không tính điểm BXH & Danh hiệu).'
              : m.tiebreakerTriggered
              ? 'Đoạt chiến thắng nghẹt thở ở Vòng Quyết Định (3 - 2)!'
              : `Chiến thắng chung cuộc (${m[finalWinnerSlot].roundsWon} - ${m[finalLoserSlot].roundsWon})!`;
          if (m.mode === 'ranked_human') {
            m.rewards = {
              [finalWinnerSlot]: settleKnightPvpRankedRewards(store, m[finalWinnerSlot].username, {
                didWin: true,
                isDemonTiebreaker: Boolean(m.tiebreakerTriggered),
                opponentName: m[finalLoserSlot].name,
                mode: 'ranked_human',
                nowMs
              }),
              [finalLoserSlot]: settleKnightPvpRankedRewards(store, m[finalLoserSlot].username, {
                didWin: false,
                isDemonTiebreaker: false,
                opponentName: m[finalWinnerSlot].name,
                mode: 'ranked_human',
                nowMs
              })
            };
          }
        }
      };

      if (event === 'WRONG_ANSWER') {
        m[mySlotKey].frozenUntilMs = nowMs + KNIGHT_PVP_FREEZE_MS;
        m[mySlotKey].freezes = (Number(m[mySlotKey].freezes) || 0) + 1;
        m.updatedAtMs = nowMs;
        changed = true;
        break;
      }

      if (event === 'THUNDER_TIMEOUT') {
        const clientQIdx = Math.floor(Number(payload?.questionIdx) ?? -1);
        if (clientQIdx !== m.questionIdx) break;
        const qStart = Number(m.questionStartedAtMs) || Number(m.startedAt) || nowMs;
        if (nowMs - qStart < KNIGHT_PVP_QUESTION_TIMEOUT_MS - 1200) break;

        m.lastThunderAtMs = nowMs;
        const rawP1 = (Number(m.p1.lives) || KNIGHT_PVP_LIVES_PER_ROUND) - 1;
        const rawP2 = (Number(m.p2.lives) || KNIGHT_PVP_LIVES_PER_ROUND) - 1;

        if (rawP1 <= 0 && rawP2 <= 0) {
          m.p1.lives = 0;
          m.p2.lives = 0;
          advanceHumanPvpRound('draw');
        } else if (rawP2 <= 0 && rawP1 > 0) {
          m.p1.lives = rawP1;
          m.p2.lives = 0;
          advanceHumanPvpRound('p1');
        } else if (rawP1 <= 0 && rawP2 > 0) {
          m.p1.lives = 0;
          m.p2.lives = rawP2;
          advanceHumanPvpRound('p2');
        } else {
          m.p1.lives = rawP1;
          m.p2.lives = rawP2;
          m.questionIdx += 1;
          m.questionStartedAtMs = nowMs;
        }
        m.updatedAtMs = nowMs;
        changed = true;
        break;
      }

      if (event === 'STRIKE_HIT') {
        if (nowMs < (Number(m[mySlotKey].frozenUntilMs) || 0)) break;
        const clientQIdx = Math.floor(Number(payload?.questionIdx) ?? -1);
        if (clientQIdx !== m.questionIdx) break; // Other player already answered this shared question!

        m[mySlotKey].hits = (Number(m[mySlotKey].hits) || 0) + 1;
        m[oppSlotKey].lives = Math.max(0, (Number(m[oppSlotKey].lives) || KNIGHT_PVP_LIVES_PER_ROUND) - 1);
        m.questionIdx += 1;
        m.questionStartedAtMs = nowMs;
        m.lastStrike = {
          bySlot: mySlotKey,
          byName: m[mySlotKey].name,
          round: m.round,
          atMs: nowMs
        };

        if (m[oppSlotKey].lives <= 0) {
          advanceHumanPvpRound(mySlotKey);
        }
        m.updatedAtMs = nowMs;
        changed = true;
      }
      break;
    }

    case 'KNIGHT_PVP_FINISH_NPC_MATCH': {
      const nowMs = Date.now();
      ensureKnightPvpMaps(store);
      const isViewerSuperAdmin = Boolean(viewer?.isSuperAdmin && viewer?.username === SUPER_ADMIN_USERNAME);
      const matchId = String(payload?.matchId || '');
      const m = matchId ? store._knightPvpMatches.get(matchId) : null;
      if (!m || m.mode !== 'ranked_npc' || m.status !== 'PLAYING') break;
      if (String(m.p1?.username || '').toLowerCase() !== String(viewer.username).toLowerCase()) break;

      // Anti-cheat elapsed time validation (minimum realistic duration unless SuperAdmin test mode)
      const elapsedMs = nowMs - (Number(m.startedAt) || nowMs);
      if (!isViewerSuperAdmin && elapsedMs < 3500) {
        break;
      }

      const p1Rounds = Math.max(0, Math.min(4, Math.floor(Number(payload?.p1RoundsWon) || 0)));
      const p2Rounds = Math.max(0, Math.min(4, Math.floor(Number(payload?.p2RoundsWon) || 0)));
      const totalCorrectHits = Math.max(0, Math.min(60, Math.floor(Number(payload?.totalCorrectHits) || 0)));
      const totalThunderStrikes = Math.max(0, Math.min(20, Math.floor(Number(payload?.totalThunderStrikes) || 0)));
      const tiebreakerTriggered = Boolean(
        m.forceTie22Test || payload?.tiebreakerTriggered || (p1Rounds + p2Rounds === 5)
      );

      const totalRoundsPlayed = p1Rounds + p2Rounds;
      if (totalRoundsPlayed < 1 || totalRoundsPlayed > 5 || p1Rounds === p2Rounds) {
        break;
      }
      const didWin = p1Rounds > p2Rounds;
      const minRequiredDamage = m.forceTie22Test ? 3 : didWin ? p1Rounds * KNIGHT_PVP_LIVES_PER_ROUND : 0;
      if (didWin && (totalCorrectHits < 1 || totalCorrectHits + totalThunderStrikes < minRequiredDamage)) {
        break;
      }

      m.p1.roundsWon = p1Rounds;
      m.p2.roundsWon = p2Rounds;
      m.p1.hits = totalCorrectHits;
      m.tiebreakerTriggered = tiebreakerTriggered;
      m.status = 'FINISHED';
      m.winnerSlot = didWin ? 'p1' : 'p2';
      m.updatedAtMs = nowMs;
      m.finishReason = didWin
        ? tiebreakerTriggered
          ? `Chiến thắng ${m.p2.name} ở Vòng Quyết Định (3 - 2)!`
          : `Chiến thắng ${m.p2.name} (${p1Rounds} - ${p2Rounds})!`
        : `Thất bại trước ${m.p2.name} (${p1Rounds} - ${p2Rounds}).`;
      m.rewards = {
        p1: settleKnightPvpRankedRewards(store, viewer.username, {
          didWin,
          isDemonTiebreaker: Boolean(didWin && tiebreakerTriggered),
          opponentName: m.p2.name,
          mode: 'ranked_npc',
          nowMs
        })
      };
      changed = true;
      break;
    }

    case 'ADMIN_GRANT_GACHA_WISHES': {
      const targetKey = findUserKeyInStore(store, payload?.username);
      const targetUser = targetKey ? store.users?.[targetKey] : null;
      const amount = Math.round(Number(payload?.amount) || 0);
      if (!targetKey || !targetUser || amount < 1 || amount > 10000) break;
      const nextWishCredits = getGachaWishPurchasedCredits(targetUser) + amount;
      const prevRpg = targetUser.knightRpgProfile && typeof targetUser.knightRpgProfile === 'object'
        ? targetUser.knightRpgProfile
        : {};
      const nextRpgWishes = Math.max(0, (Number(prevRpg.wishes) || 0) + amount);
      store.users[targetKey] = {
        ...targetUser,
        gachaWishCredits: nextWishCredits,
        knightRpgProfile: {
          ...prevRpg,
          wishes: nextRpgWishes,
          claimedServerWishCredits: nextWishCredits
        }
      };
      const cleanNote = String(payload?.note || '').trim().slice(0, 160);
      appendStoreNotification(
        store,
        {
          title: `🎁 Admin đã tặng bạn +${amount} Lượt Quay Gacha!`,
          message: cleanNote
            ? `${cleanNote} (Đã cộng +${amount} 🌠 Lượt Quay vào Hiệp Sĩ Diệt Rồng — hiện có ${nextRpgWishes} lượt!)`
            : `Quản Trị Hệ Thống đã trao tặng +${amount} 🌠 Lượt Quay Cầu Nguyện vào tài khoản của bạn trong Hiệp Sĩ Diệt Rồng (hiện có ${nextRpgWishes} lượt)!`,
          type: 'announcement',
          targetUsernames: [targetKey],
          createdBy: viewer?.username || SUPER_ADMIN_USERNAME,
          createdByName: viewer?.name || 'Quản Trị Hệ Thống'
        },
        viewer
      );
      changed = true;
      break;
    }

    case 'ADMIN_SET_GACHA_BANNER_CONFIG': {
      const nowMs = Date.now();
      const { weekKey } = getVietnamMondayWeekState(nowMs);
      const prevCfg = normalizeKnightGachaConfig(store.knightGachaConfig, nowMs);
      const limitedSet = new Set(KNIGHT_CHARACTER_SKINS.filter(h => h.pool === 'limited').map(h => h.id));
      const nextHeroRaw = payload?.nextFeaturedHeroId !== undefined
        ? String(payload.nextFeaturedHeroId || '').trim()
        : prevCfg.nextFeaturedHeroId;
      const activeHeroRaw = payload?.activeFeaturedHeroId !== undefined
        ? String(payload.activeFeaturedHeroId || '').trim()
        : (prevCfg.weekKey === weekKey ? prevCfg.activeFeaturedHeroId : '');
      store.knightGachaConfig = {
        weekKey,
        activeFeaturedHeroId: limitedSet.has(activeHeroRaw) ? activeHeroRaw : '',
        nextFeaturedHeroId: limitedSet.has(nextHeroRaw) ? nextHeroRaw : '',
        lastResetWeekKey: prevCfg.lastResetWeekKey || weekKey
      };
      changed = true;
      break;
    }

    default:
      break;
  }

  if (changed) {
    store.version += 1;
    store._localMutated = true;
  }
  return changed;
}

async function discoverServerGeminiModels(cleanKey) {
  const ordered = [];
  const pushUnique = (id) => {
    if (id && !ordered.includes(id)) ordered.push(id);
  };
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`);
    if (res.ok) {
      const data = await res.json();
      const ids = (data?.models || [])
        .filter(m => {
          const methods = m?.supportedGenerationMethods || [];
          const name = String(m?.name || '').toLowerCase();
          return (
            methods.includes('generateContent') &&
            !name.includes('embedding') &&
            !name.includes('imagen') &&
            !name.includes('tts') &&
            !name.includes('aqa')
          );
        })
        .map(m => String(m.name || '').replace(/^models\//, ''));
      GEMINI_AUDIO_PREFERRED_MODELS.forEach(p => { if (ids.includes(p)) pushUnique(p); });
      ids.filter(id => id.includes('flash')).forEach(pushUnique);
      ids.filter(id => id.includes('gemini')).forEach(pushUnique);
    }
  } catch (_err) {}
  GEMINI_AUDIO_PREFERRED_MODELS.forEach(pushUnique);
  return ordered;
}

function safeParseServerAiJson(rawText = '') {
  const cleaned = String(rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    try {
      const sanitized = match[0].replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(sanitized);
    } catch {
      return null;
    }
  }
}

async function callGeminiServerJson({ apiKey, requestParts, temperature = 0.2 }) {
  const cleanKey = String(apiKey || '').trim().replace(/^['"]|['"]$/g, '');
  if (!cleanKey) {
    throw new Error('Chưa cấu hình Google Gemini API Key trên máy chủ.');
  }
  const models = await discoverServerGeminiModels(cleanKey);
  let lastErr = null;

  for (const modelId of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const doFetch = async (useJsonMime = true, includeMaxTokens = true) => {
      const generationConfig = { temperature };
      if (useJsonMime) generationConfig.responseMimeType = 'application/json';
      if (includeMaxTokens) generationConfig.maxOutputTokens = 32768;
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: requestParts }],
          generationConfig
        }),
        signal: AbortSignal.timeout(90_000)
      });
    };

    let response = null;
    try {
      response = await doFetch(true, true);
      if (response.status === 400) {
        const preview = await response.clone().text();
        if (/maxOutputTokens|token/i.test(preview)) {
          response = await doFetch(true, false);
        } else if (/mime|json/i.test(preview)) {
          response = await doFetch(false, true);
        }
      }
      if (SERVER_TRANSIENT_GEMINI_STATUSES.has(response.status)) {
        await sleepMsServer(600);
        response = await doFetch(true, true);
      }
    } catch (netErr) {
      lastErr = netErr;
      continue;
    }

    if (response.ok) {
      const data = await response.json();
      const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = safeParseServerAiJson(textContent);
      if (!parsed) {
        lastErr = new Error('AI không trả về JSON hợp lệ hoặc phản hồi bị cắt cụt.');
        continue;
      }
      return { parsed, usedModel: modelId };
    }

    const errText = await response.text();
    if (response.status === 404 || /not found|not supported/i.test(errText)) {
      lastErr = new Error(errText);
      continue;
    }
    if (SERVER_TRANSIENT_GEMINI_STATUSES.has(response.status)) {
      lastErr = new Error(`Máy chủ Gemini tạm quá tải (${response.status}), đã thử model ${modelId}.`);
      continue;
    }
    throw new Error(`Gemini API lỗi (${response.status}): ${errText.slice(0, 220)}`);
  }

  throw lastErr || new Error('Không tìm thấy model Gemini khả dụng hoặc máy chủ AI tạm quá tải (503).');
}

async function gradeSpeakingWithGeminiServer({ apiKey, store, testTitle, partMode, recordings }) {
  const parts = [];
  const preparedRecordings = recordings.map(rec => {
    let audioBuffer = null;
    let resolvedMime = cleanAudioMimeType(rec.mimeType);

    if (rec.audioId) {
      const saved = loadAudioRecord(store, rec.audioId);
      if (saved?.buffer?.length > 0) {
        audioBuffer = saved.buffer;
        resolvedMime = cleanAudioMimeType(saved.meta?.mimeType || resolvedMime);
      }
    }
    if (!audioBuffer && rec.inlineAudioBase64) {
      const rawB64 = String(rec.inlineAudioBase64).replace(/^data:[^;]+;base64,/, '');
      if (rawB64) audioBuffer = Buffer.from(rawB64, 'base64');
    }

    const hasAudioBinary = Boolean(audioBuffer && audioBuffer.length > 256);
    if (hasAudioBinary) {
      parts.push({
        inlineData: {
          mimeType: resolvedMime,
          data: audioBuffer.toString('base64')
        }
      });
    }
    return { ...rec, hasAudioBinary, mimeType: resolvedMime };
  });

  const meaningfulCount = preparedRecordings.filter(
    r => (Number(r.durationSec) || 0) >= 1 && (r.hasAudioBinary || String(r.clientTranscript || '').trim().length >= 3)
  ).length;
  if (meaningfulCount === 0) {
    return simulateAISpeakingGrading({ testTitle, partMode, recordings: preparedRecordings });
  }

  const promptText = buildSpeakingExaminerPrompt({
    testTitle,
    partMode,
    recordings: preparedRecordings
  });
  const requestParts = [{ text: promptText }, ...parts];
  const { parsed, usedModel } = await callGeminiServerJson({ apiKey, requestParts, temperature: 0.2 });
  return normalizeSpeakingEvaluation({
    parsed,
    recordings: preparedRecordings,
    usedModel,
    gradedMode: 'gemini_audio'
  });
}

const IMMEDIATE_PERSIST_ACTIONS = new Set([
  'UPSERT_TEST',
  'UPSERT_TESTS_BULK',
  'UPSERT_USER',
  'UPSERT_USERS_BULK',
  'RESET_USER_PASSWORD',
  'DELETE_USER',
  'DELETE_USERS_BULK',
  'UPSERT_CLASS',
  'DELETE_CLASS',
  'UPDATE_CLASS_MEMBERS',
  'ASSIGN_TEST_CLASSES',
  'ASSIGN_FOLDER_CLASSES',
  'UPSERT_CUSTOM_TITLE',
  'DELETE_CUSTOM_TITLE',
  'GRANT_USER_TITLES',
  'TOGGLE_USER_COVER_UNLOCK',
  'TOGGLE_USER_SUBSCRIPTION',
  'REDEEM_REAL_EXAM_CREDIT',
  'REQUEST_COVER_UNLOCK',
  'REPORT_DONATE_PAYMENT',
  'CONFIRM_PAYMENT_TRANSACTION',
  'DELETE_PAYMENT_TRANSACTION',
  'UPDATE_PAYMENT_CONFIG',
  'UPSERT_SPEAKING_FORECAST',
  'UPSERT_ATTEMPT',
  'ADMIN_GRANT_GACHA_WISHES',
  'ADMIN_SET_GACHA_BANNER_CONFIG',
  'SUBMIT_PRACTICE_GAME_SCORE',
  'KNIGHT_PVP_SYNC_COMBAT',
  'KNIGHT_PVP_FINISH_NPC_MATCH',
  'SEED_DEFAULTS'
]);

export function attachSyncMiddleware(middlewares, store, sseClients, onChanged = null, { syncFromDiskIfNewer = null, onFlush = null, sendMailFn = sendTransactionalEmail } = {}) {
  const sseClientUsers = new WeakMap();
  let broadcastTimer = null;

  const matchesIfNoneMatch = (ifNoneMatchHeader, etag) => {
    if (!ifNoneMatchHeader || !etag) return false;
    const target = String(etag).replace(/^W\//i, '').trim();
    return String(ifNoneMatchHeader)
      .split(',')
      .some(part => {
        const clean = part.trim();
        return clean === '*' || clean.replace(/^W\//i, '').trim() === target;
      });
  };

  const computeStateEtag = (viewerUser, todayKey) => {
    const bootShort = String(store._bootId || '').slice(0, 8);
    const viewerSig = viewerUser
      ? `${viewerUser.username}:${viewerUser.role}:${viewerUser.tokenVersion || 1}`
      : 'anon';
    const aiFlag = getEffectiveGeminiKey(store) ? '1' : '0';
    const mailFlag = getEffectiveMailConfig(store).configured ? '1' : '0';
    const hash = crypto
      .createHash('sha1')
      .update(`${store.version}|${bootShort}|${viewerSig}|${todayKey}|${aiFlag}|${mailFlag}`)
      .digest('hex')
      .slice(0, 16);
    return `W/"s-${store.version}-${hash}"`;
  };

  const broadcast = () => {
    const todayKey = getVietnamDateKey(Date.now());
    for (const res of sseClients) {
      if (res.destroyed || res.writableEnded) {
        sseClients.delete(res);
        continue;
      }
      try {
        const sessionInfo = sseClientUsers.get(res);
        if (!sessionInfo?.username) continue;
        const matchedKey = findUserKeyInStore(store, sessionInfo.username);
        const userRec = matchedKey ? store.users?.[matchedKey] : null;
        const sessionStillValid = Boolean(userRec && (userRec.tokenVersion || 1) === sessionInfo.tokenVersion);
        if (
          sessionStillValid &&
          sessionInfo.lastSentVersion === store.version &&
          sessionInfo.lastSentDateKey === todayKey
        ) {
          continue;
        }
        const viewer = sessionStillValid ? userRec : null;
        const dataStr = `event: sync\ndata: ${JSON.stringify(getSnapshotForViewer(store, viewer))}\n\n`;
        res.write(dataStr);
        sessionInfo.lastSentVersion = store.version;
        sessionInfo.lastSentDateKey = todayKey;
        if (!sessionStillValid) {
          sseClients.delete(res);
        }
      } catch (_err) {
        sseClients.delete(res);
      }
    }
  };

  // Coalesce burst mutations (e.g., 40 simultaneous exam submissions) into one SSE fan-out pass
  const scheduleBroadcast = (delayMs = 50) => {
    if (broadcastTimer) return;
    broadcastTimer = setTimeout(() => {
      broadcastTimer = null;
      broadcast();
    }, delayMs);
    broadcastTimer.unref?.();
  };

  // Sweep expired 10-minute room chats AND Monday 00:00 VN weekly game score & banner rollover
  const chatSweepTimer = setInterval(() => {
    const nowMs = Date.now();
    const chatsPruned = pruneExpiredStoreChats(store, nowMs);
    const mondayRolled = ensureWeeklyMondayReset(store, nowMs);
    if (chatsPruned || mondayRolled) {
      if (mondayRolled) store.version += 1;
      onChanged?.(store);
      scheduleBroadcast(25);
    }
  }, 10000);
  chatSweepTimer.unref?.();

  const sendJsonResponse = (res, statusCode, dataObj, req = null, extraHeaders = null) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (extraHeaders && typeof extraHeaders === 'object') {
      Object.entries(extraHeaders).forEach(([k, v]) => {
        if (v !== undefined && v !== null) res.setHeader(k, String(v));
      });
    }
    const jsonStr = JSON.stringify(dataObj);
    const acceptEnc = String(req?.headers?.['accept-encoding'] || '').toLowerCase();
    const wantsBr = Boolean(req && /\bbr\b/.test(acceptEnc));
    const wantsGzip = Boolean(req && /\bgzip\b/.test(acceptEnc));
    if (req && jsonStr.length >= 512 && (wantsBr || wantsGzip)) {
      const rawBuf = Buffer.from(jsonStr, 'utf8');
      const done = (encName) => (err, compressed) => {
        if (!err && compressed && compressed.length < rawBuf.length) {
          res.setHeader('Content-Encoding', encName);
          if (!res.getHeader('Vary')) {
            res.setHeader('Vary', 'Accept-Encoding');
          }
          res.setHeader('Content-Length', String(compressed.length));
          res.end(compressed);
        } else {
          res.setHeader('Content-Length', String(rawBuf.length));
          res.end(rawBuf);
        }
      };
      if (wantsBr) {
        zlib.brotliCompress(
          rawBuf,
          { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } },
          done('br')
        );
      } else {
        zlib.gzip(rawBuf, { level: 5 }, done('gzip'));
      }
      return;
    }
    res.end(jsonStr);
  };

  const refreshActiveSessionCookie = (req, res, viewerPayload, activeUser) => {
    if (!activeUser?.username) return;
    const nextVer = activeUser.tokenVersion || 1;
    const viewerSid = viewerPayload?.sid || crypto.randomBytes(8).toString('hex');
    const refreshedToken = signToken(
      {
        username: activeUser.username,
        role: activeUser.role,
        isSuperAdmin: Boolean(activeUser.isSuperAdmin),
        tokenVersion: nextVer,
        sid: viewerSid,
        exp: Date.now() + SESSION_TTL_MS
      },
      store._authSecret
    );
    res.setHeader('Set-Cookie', buildSessionCookieHeader(req, refreshedToken, SESSION_TTL_MS / 1000));
    if (viewerPayload?.sid) {
      for (const sseRes of sseClients) {
        const info = sseClientUsers.get(sseRes);
        if (info && info.username === activeUser.username && info.sid === viewerPayload.sid) {
          info.tokenVersion = nextVer;
        }
      }
    }
  };

  const clearLoginLimitsForUsername = (uname) => {
    if (!uname || !store._rateLimits) return;
    const suffix = `:${uname.toLowerCase()}`;
    for (const key of store._rateLimits.keys()) {
      if (key.startsWith('login:') && key.endsWith(suffix)) {
        store._rateLimits.delete(key);
      }
    }
  };

  middlewares.use('/api/sync', async (req, res, next) => {
    const reqUrl = (req.url || '/').split('?')[0];
    syncFromDiskIfNewer?.();
    const viewerPayload = resolveSessionPayload(req, store);
    const viewer = resolveSessionUser(req, store);

    if (req.method === 'POST' && reqUrl === '/auth/login') {
      try {
        const body = await readJsonBody(req);
        const rawUsername = normalizeUsernameKey(body?.username || '');
        const password = String(body?.password || '').trim();
        const ip = getClientIp(req);

        const matchedKey = rawUsername ? findUserKeyInStore(store, rawUsername) : null;
        const rateKey = `login:${ip}:${(matchedKey || rawUsername).toLowerCase()}`;

        if (!checkRateLimit(store._rateLimits, rateKey)) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Thử đăng nhập sai quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.' }));
          return;
        }

        const user = matchedKey ? store.users?.[matchedKey] : null;
        if (!user || !(await verifyPasswordAsync(password, user))) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Sai tên đăng nhập hoặc mật khẩu!' }));
          return;
        }
        store._rateLimits?.delete(rateKey);

        if (recordUserLoginDay(store, user)) {
          store.version += 1;
          onChanged?.(store);
          scheduleBroadcast(50);
        }

        const sid = crypto.randomBytes(8).toString('hex');
        const token = signToken(
          {
            username: user.username,
            role: user.role,
            isSuperAdmin: Boolean(user.isSuperAdmin),
            tokenVersion: user.tokenVersion || 1,
            sid,
            exp: Date.now() + SESSION_TTL_MS
          },
          store._authSecret
        );
        res.setHeader('Set-Cookie', buildSessionCookieHeader(req, token, SESSION_TTL_MS / 1000));
        sendJsonResponse(
          res,
          200,
          {
            ok: true,
            user: sanitizeUserForViewer(user, user),
            snapshot: getSnapshotForViewer(store, user)
          },
          req
        );
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Đăng nhập thất bại.' }));
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/auth/register-guest') {
      try {
        const body = await readJsonBody(req);
        const ip = getClientIp(req);
        if (!checkRateLimit(store._rateLimits, `reg_guest:${ip}`, 10, 10 * 60 * 1000)) {
          sendJsonResponse(res, 429, {
            ok: false,
            error: 'Bạn thao tác đăng ký quá nhanh. Vui lòng đợi vài phút rồi thử lại.'
          });
          return;
        }
        const rawUsername = normalizeUsernameKey(body?.username || '');
        const cleanName = String(body?.name || '').trim().slice(0, 80);
        const password = String(body?.password || '').trim();
        if (!rawUsername || rawUsername.length < 3 || rawUsername.length > 32 || !/^[a-zA-Z0-9_.-]+$/.test(rawUsername)) {
          sendJsonResponse(res, 400, {
            ok: false,
            error: 'Tên đăng nhập phải dài 3–32 ký tự và chỉ gồm chữ, số, dấu gạch dưới (_), chấm (.) hoặc gạch ngang (-).'
          });
          return;
        }
        if (password.length < 4 || password.length > 128) {
          sendJsonResponse(res, 400, { ok: false, error: 'Mật khẩu phải dài ít nhất 4 ký tự.' });
          return;
        }
        const existingKey = findUserKeyInStore(store, rawUsername);
        if (existingKey || rawUsername.toLowerCase() === SUPER_ADMIN_USERNAME.toLowerCase()) {
          sendJsonResponse(res, 409, {
            ok: false,
            error: 'Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác hoặc đăng nhập.'
          });
          return;
        }
        const nowMs = Date.now();
        const guestUser = {
          username: rawUsername,
          name: cleanName || rawUsername,
          role: 'student',
          isGuest: true,
          targetBand: 6.5,
          passwordHash: hashPassword(password),
          tokenVersion: 1,
          createdAt: nowMs,
          purchasedTestIds: [],
          realExamCredits: 0,
          totalPurchasedExams: 0
        };
        store.users[rawUsername] = guestUser;
        recordUserLoginDay(store, guestUser);
        store.version += 1;
        store._localMutated = true;
        if (onFlush) onFlush(store);
        else onChanged?.(store);
        scheduleBroadcast(50);

        const sid = crypto.randomBytes(8).toString('hex');
        const token = signToken(
          {
            username: guestUser.username,
            role: guestUser.role,
            isSuperAdmin: false,
            tokenVersion: 1,
            sid,
            exp: nowMs + SESSION_TTL_MS
          },
          store._authSecret
        );
        res.setHeader('Set-Cookie', buildSessionCookieHeader(req, token, SESSION_TTL_MS / 1000));
        sendJsonResponse(
          res,
          200,
          {
            ok: true,
            user: sanitizeUserForViewer(guestUser, guestUser),
            snapshot: getSnapshotForViewer(store, guestUser)
          },
          req
        );
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Đăng ký tài khoản khách thất bại.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/auth/logout') {
      if (viewer?.username && removeUserFromGameRooms(store, viewer.username)) {
        store.version += 1;
        store._localMutated = true;
        if (onFlush) onFlush(store);
        else onChanged?.(store);
        scheduleBroadcast(20);
      }
      res.setHeader('Set-Cookie', buildSessionCookieHeader(req, '', 0));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === 'GET' && reqUrl === '/auth/session') {
      if (viewer && recordUserLoginDay(store, viewer)) {
        store.version += 1;
        onChanged?.(store);
        scheduleBroadcast(50);
      }
      sendJsonResponse(
        res,
        200,
        {
          ok: true,
          authenticated: Boolean(viewer),
          user: viewer ? sanitizeUserForViewer(viewer, viewer) : null,
          snapshot: getSnapshotForViewer(store, viewer)
        },
        req
      );
      return;
    }

    if (req.method === 'POST' && reqUrl === '/auth/change-password') {
      if (!viewer) {
        sendJsonResponse(res, 401, { ok: false, error: 'Vui lòng đăng nhập để đổi mật khẩu.' });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const oldPassword = String(body?.oldPassword || '').trim();
        const newPassword = String(body?.newPassword || '').trim();
        const ip = getClientIp(req);
        if (!checkRateLimit(store._rateLimits, `chgpass:${ip}:${viewer.username.toLowerCase()}`, 12, 5 * 60 * 1000)) {
          sendJsonResponse(res, 429, { ok: false, error: 'Bạn thao tác quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.' });
          return;
        }
        if (!oldPassword || !newPassword) {
          sendJsonResponse(res, 400, { ok: false, error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới.' });
          return;
        }
        if (newPassword.length < 4 || newPassword.length > 128) {
          sendJsonResponse(res, 400, { ok: false, error: 'Mật khẩu mới phải dài từ 4 đến 128 ký tự.' });
          return;
        }
        const target = store.users?.[viewer.username];
        if (!target || !(await verifyPasswordAsync(oldPassword, target))) {
          sendJsonResponse(res, 403, { ok: false, error: 'Mật khẩu cũ không chính xác!' });
          return;
        }
        if (newPassword === oldPassword) {
          sendJsonResponse(res, 400, { ok: false, error: 'Mật khẩu mới phải khác mật khẩu cũ.' });
          return;
        }
        const updated = {
          ...target,
          passwordHash: hashPassword(newPassword),
          tokenVersion: (target.tokenVersion || 1) + 1
        };
        delete updated.pass;
        store.users[viewer.username] = updated;
        store.version += 1;
        store._localMutated = true;
        clearLoginLimitsForUsername(viewer.username);
        if (onFlush) onFlush(store);
        else onChanged?.(store);
        refreshActiveSessionCookie(req, res, viewerPayload, updated);
        scheduleBroadcast(50);
        sendJsonResponse(res, 200, {
          ok: true,
          message: 'Đổi mật khẩu thành công!',
          user: sanitizeUserForViewer(updated, updated),
          snapshot: getSnapshotForViewer(store, updated)
        });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Không thể đổi mật khẩu.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/auth/email/send-verification') {
      if (!viewer) {
        sendJsonResponse(res, 401, { ok: false, error: 'Vui lòng đăng nhập để liên kết email.' });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const cleanEmail = String(body?.email || '').trim().toLowerCase();
        if (!isValidEmailAddress(cleanEmail)) {
          sendJsonResponse(res, 400, { ok: false, error: 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.' });
          return;
        }
        const target = store.users?.[viewer.username];
        if (!target) {
          sendJsonResponse(res, 404, { ok: false, error: 'Không tìm thấy tài khoản.' });
          return;
        }
        if (target.emailVerified && target.email === cleanEmail) {
          sendJsonResponse(res, 400, { ok: false, error: 'Email này đã được xác minh và liên kết sẵn rồi.' });
          return;
        }
        if (!checkRateLimit(store._rateLimits, `email_send:${viewer.username.toLowerCase()}`, 10, 15 * 60 * 1000)) {
          sendJsonResponse(res, 429, { ok: false, error: 'Bạn đã gửi quá nhiều yêu cầu xác minh. Vui lòng thử lại sau ít phút.' });
          return;
        }
        const otpMap = getOtpMap(store);
        const key = `verify:${viewer.username}`;
        const existingChallenge = otpMap.get(key);
        const now = Date.now();
        if (existingChallenge && existingChallenge.cooldownUntil > now) {
          const waitSecs = Math.max(1, Math.ceil((existingChallenge.cooldownUntil - now) / 1000));
          sendJsonResponse(res, 429, { ok: false, error: `Vui lòng đợi ${waitSecs} giây trước khi gửi lại mã OTP.` });
          return;
        }
        const otpCode = String(crypto.randomInt(100000, 1000000));
        otpMap.set(key, {
          email: cleanEmail,
          otpHash: hashOtpSecret(otpCode, store._authSecret),
          expiresAt: now + OTP_TTL_MS,
          cooldownUntil: now + OTP_RESEND_COOLDOWN_MS,
          attemptsLeft: OTP_MAX_VERIFY_ATTEMPTS
        });
        try {
          const content = buildOtpEmailContent({
            purpose: 'verify_email',
            otpCode,
            username: viewer.username,
            displayName: target.name || viewer.username,
            expiresMinutes: 10
          });
          await sendMailFn(store, { to: cleanEmail, ...content });
        } catch (mailErr) {
          otpMap.delete(key);
          const status = mailErr?.code === 'MAIL_NOT_CONFIGURED' ? 503 : 502;
          sendJsonResponse(res, status, {
            ok: false,
            mailError: true,
            error: formatMailTransportError(mailErr, 'Không thể gửi email xác minh lúc này.')
          });
          return;
        }
        sendJsonResponse(res, 200, {
          ok: true,
          maskedEmail: maskEmailAddress(cleanEmail),
          expiresInMinutes: 10,
          cooldownSeconds: 60,
          message: `Đã gửi mã xác minh OTP (6 chữ số) tới ${maskEmailAddress(cleanEmail)}.`
        });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Yêu cầu xác minh email thất bại.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/auth/email/verify') {
      if (!viewer) {
        sendJsonResponse(res, 401, { ok: false, error: 'Vui lòng đăng nhập.' });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const cleanEmail = String(body?.email || '').trim().toLowerCase();
        const otp = String(body?.otp || '').trim();
        const otpMap = getOtpMap(store);
        const key = `verify:${viewer.username}`;
        const challenge = otpMap.get(key);
        const now = Date.now();
        if (!challenge || challenge.expiresAt <= now) {
          otpMap.delete(key);
          sendJsonResponse(res, 400, { ok: false, error: 'Mã OTP đã hết hạn hoặc chưa được yêu cầu. Vui lòng gửi lại mã mới.' });
          return;
        }
        if (cleanEmail && challenge.email !== cleanEmail) {
          sendJsonResponse(res, 400, { ok: false, error: 'Email xác minh không khớp với email đã gửi OTP.' });
          return;
        }
        if (!/^\d{6}$/.test(otp)) {
          sendJsonResponse(res, 400, { ok: false, error: 'Mã OTP phải gồm đúng 6 chữ số.' });
          return;
        }
        const candidateHash = hashOtpSecret(otp, store._authSecret);
        if (!timingSafeHexMatch(candidateHash, challenge.otpHash)) {
          challenge.attemptsLeft -= 1;
          if (challenge.attemptsLeft <= 0) {
            otpMap.delete(key);
            sendJsonResponse(res, 400, { ok: false, error: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng gửi lại mã mới.' });
            return;
          }
          sendJsonResponse(res, 400, { ok: false, error: `Mã OTP không chính xác (còn ${challenge.attemptsLeft} lần thử).` });
          return;
        }
        otpMap.delete(key);
        const target = store.users?.[viewer.username];
        if (!target) {
          sendJsonResponse(res, 404, { ok: false, error: 'Không tìm thấy tài khoản.' });
          return;
        }
        const updated = {
          ...target,
          email: challenge.email,
          emailVerified: true,
          emailVerifiedAt: now
        };
        store.users[viewer.username] = updated;
        store.version += 1;
        store._localMutated = true;
        if (onFlush) onFlush(store);
        else onChanged?.(store);
        scheduleBroadcast(50);
        sendJsonResponse(res, 200, {
          ok: true,
          message: `Đã xác minh & liên kết email ${maskEmailAddress(updated.email)} thành công!`,
          user: sanitizeUserForViewer(updated, updated),
          snapshot: getSnapshotForViewer(store, updated)
        });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Xác minh OTP thất bại.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/auth/email/unlink') {
      if (!viewer) {
        sendJsonResponse(res, 401, { ok: false, error: 'Vui lòng đăng nhập.' });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const password = String(body?.password || '').trim();
        const target = store.users?.[viewer.username];
        if (!target || !(await verifyPasswordAsync(password, target))) {
          sendJsonResponse(res, 403, { ok: false, error: 'Vui lòng nhập đúng mật khẩu hiện tại để gỡ liên kết email.' });
          return;
        }
        const updated = { ...target, email: '', emailVerified: false, emailVerifiedAt: null };
        store.users[viewer.username] = updated;
        store.version += 1;
        store._localMutated = true;
        if (onFlush) onFlush(store);
        else onChanged?.(store);
        scheduleBroadcast(50);
        sendJsonResponse(res, 200, {
          ok: true,
          message: 'Đã gỡ liên kết email khôi phục.',
          user: sanitizeUserForViewer(updated, updated),
          snapshot: getSnapshotForViewer(store, updated)
        });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Không thể gỡ liên kết email.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/auth/forgot-password/request') {
      try {
        const body = await readJsonBody(req);
        const rawUsername = normalizeUsernameKey(body?.username || '');
        const ip = getClientIp(req);
        if (!rawUsername) {
          sendJsonResponse(res, 400, { ok: false, error: 'Vui lòng nhập tên đăng nhập tài khoản.' });
          return;
        }
        if (!checkRateLimit(store._rateLimits, `forgot_ip:${ip}`, 20, 15 * 60 * 1000)) {
          sendJsonResponse(res, 429, { ok: false, error: 'Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút hoặc liên hệ Giáo viên.' });
          return;
        }
        const matchedKey = findUserKeyInStore(store, rawUsername);
        const target = matchedKey ? store.users?.[matchedKey] : null;
        if (!target) {
          sendJsonResponse(res, 200, {
            ok: true,
            accountFound: false,
            hasVerifiedEmail: false,
            message: 'Không tìm thấy tên tài khoản này trên hệ thống. Vui lòng kiểm tra lại chính tả (không gõ dấu @) hoặc liên hệ Giáo viên để được hỗ trợ.'
          });
          return;
        }
        if (!target.email || !target.emailVerified) {
          sendJsonResponse(res, 200, {
            ok: true,
            accountFound: true,
            hasVerifiedEmail: false,
            username: target.username,
            message: 'Tài khoản này chưa liên kết hoặc chưa xác minh email khôi phục. Vui lòng liên hệ Giáo viên (Ms. Như) để đổi lại mật khẩu mặc định.'
          });
          return;
        }
        const otpMap = getOtpMap(store);
        const key = `reset:${target.username}`;
        const existingChallenge = otpMap.get(key);
        const now = Date.now();
        if (existingChallenge && existingChallenge.cooldownUntil > now) {
          const waitSecs = Math.max(1, Math.ceil((existingChallenge.cooldownUntil - now) / 1000));
          sendJsonResponse(res, 429, { ok: false, error: `Mã OTP vừa được gửi. Vui lòng đợi ${waitSecs} giây để gửi lại.` });
          return;
        }
        const otpCode = String(crypto.randomInt(100000, 1000000));
        otpMap.set(key, {
          email: target.email,
          otpHash: hashOtpSecret(otpCode, store._authSecret),
          expiresAt: now + OTP_TTL_MS,
          cooldownUntil: now + OTP_RESEND_COOLDOWN_MS,
          attemptsLeft: OTP_MAX_VERIFY_ATTEMPTS
        });
        try {
          const content = buildOtpEmailContent({
            purpose: 'forgot_password',
            otpCode,
            username: target.username,
            displayName: target.name || target.username,
            expiresMinutes: 10
          });
          await sendMailFn(store, { to: target.email, ...content });
        } catch (mailErr) {
          otpMap.delete(key);
          const status = mailErr?.code === 'MAIL_NOT_CONFIGURED' ? 503 : 502;
          sendJsonResponse(res, status, {
            ok: false,
            mailError: true,
            accountFound: true,
            hasVerifiedEmail: true,
            username: target.username,
            maskedEmail: maskEmailAddress(target.email),
            error:
              mailErr?.code === 'MAIL_NOT_CONFIGURED'
                ? 'Tài khoản đã liên kết email, nhưng máy chủ chưa cấu hình dịch vụ gửi email OTP. Vui lòng liên hệ Giáo viên để đổi lại mật khẩu mặc định.'
                : `Không thể gửi mã OTP qua email (${formatMailTransportError(mailErr, 'lỗi kết nối')}). Vui lòng thử lại hoặc liên hệ Giáo viên.`
          });
          return;
        }
        sendJsonResponse(res, 200, {
          ok: true,
          accountFound: true,
          hasVerifiedEmail: true,
          username: target.username,
          maskedEmail: maskEmailAddress(target.email),
          expiresInMinutes: 10,
          cooldownSeconds: 60,
          message: `Mã OTP xác minh đã được gửi về email đã xác minh (${maskEmailAddress(target.email)}).`
        });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Không thể xử lý yêu cầu quên mật khẩu.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/auth/forgot-password/reset') {
      try {
        const body = await readJsonBody(req);
        const rawUsername = normalizeUsernameKey(body?.username || '');
        const otp = String(body?.otp || '').trim();
        const newPassword = String(body?.newPassword || '').trim();
        const ip = getClientIp(req);
        const matchedKey = rawUsername ? findUserKeyInStore(store, rawUsername) : null;
        if (!matchedKey || !store.users?.[matchedKey]) {
          sendJsonResponse(res, 404, { ok: false, error: 'Không tìm thấy tài khoản.' });
          return;
        }
        if (!checkRateLimit(store._rateLimits, `forgot_rst:${ip}:${matchedKey.toLowerCase()}`, 12, 10 * 60 * 1000)) {
          sendJsonResponse(res, 429, { ok: false, error: 'Thử sai quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.' });
          return;
        }
        if (!/^\d{6}$/.test(otp)) {
          sendJsonResponse(res, 400, { ok: false, error: 'Mã OTP phải gồm đúng 6 chữ số.' });
          return;
        }
        if (newPassword.length < 4 || newPassword.length > 128) {
          sendJsonResponse(res, 400, { ok: false, error: 'Mật khẩu mới phải dài từ 4 đến 128 ký tự.' });
          return;
        }
        const otpMap = getOtpMap(store);
        const key = `reset:${matchedKey}`;
        const challenge = otpMap.get(key);
        const now = Date.now();
        if (!challenge || challenge.expiresAt <= now) {
          otpMap.delete(key);
          sendJsonResponse(res, 400, { ok: false, error: 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu gửi lại mã mới.' });
          return;
        }
        const candidateHash = hashOtpSecret(otp, store._authSecret);
        if (!timingSafeHexMatch(candidateHash, challenge.otpHash)) {
          challenge.attemptsLeft -= 1;
          if (challenge.attemptsLeft <= 0) {
            otpMap.delete(key);
            sendJsonResponse(res, 400, { ok: false, error: 'Bạn đã nhập sai OTP quá 5 lần. Vui lòng bấm gửi lại mã OTP mới.' });
            return;
          }
          sendJsonResponse(res, 400, { ok: false, error: `Mã OTP không đúng (còn ${challenge.attemptsLeft} lần thử).` });
          return;
        }
        otpMap.delete(key);
        const target = store.users[matchedKey];
        const updated = {
          ...target,
          passwordHash: hashPassword(newPassword),
          tokenVersion: (target.tokenVersion || 1) + 1
        };
        delete updated.pass;
        store.users[matchedKey] = updated;
        store.version += 1;
        store._localMutated = true;
        clearLoginLimitsForUsername(matchedKey);
        if (onFlush) onFlush(store);
        else onChanged?.(store);
        scheduleBroadcast(50);
        sendJsonResponse(res, 200, {
          ok: true,
          username: matchedKey,
          message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.'
        });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Đặt lại mật khẩu thất bại.' });
      }
      return;
    }

    if (req.method === 'GET' && reqUrl === '/mail/config') {
      if (!viewer || viewer.role !== 'teacher') {
        sendJsonResponse(res, 403, { ok: false, error: 'Chỉ Giáo viên mới xem được cấu hình Email.' });
        return;
      }
      sendJsonResponse(res, 200, { ok: true, config: getPublicMailConfigSummary(store) });
      return;
    }

    if (req.method === 'POST' && reqUrl === '/mail/config') {
      if (!viewer || viewer.role !== 'teacher') {
        sendJsonResponse(res, 403, { ok: false, error: 'Chỉ Giáo viên mới được cấu hình dịch vụ Email.' });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const prev = store.mailConfig || {};
        const nextProvider = ['resend', 'brevo', 'smtp', 'apps_script', 'none'].includes(body?.provider) ? body.provider : prev.provider || 'none';
        const rawAppsScriptUrl = body?.clearAppsScriptUrl ? '' : String(body?.appsScriptUrl || '').trim();
        if (rawAppsScriptUrl && !isValidAppsScriptUrl(rawAppsScriptUrl)) {
          sendJsonResponse(res, 400, {
            ok: false,
            error: 'URL Google Apps Script chưa đúng định dạng Web App (/exec). Hãy nhấn Deploy -> Web app và dán link bắt đầu bằng https://script.google.com/macros/...'
          });
          return;
        }
        store.mailConfig = {
          provider: nextProvider,
          resendApiKey: body?.clearResendKey ? '' : (String(body?.resendApiKey || '').trim() || prev.resendApiKey || ''),
          brevoApiKey: body?.clearBrevoKey ? '' : (String(body?.brevoApiKey || '').trim() || prev.brevoApiKey || ''),
          appsScriptUrl: body?.clearAppsScriptUrl ? '' : (rawAppsScriptUrl || prev.appsScriptUrl || ''),
          smtpHost: body?.smtpHost !== undefined ? String(body.smtpHost).trim() : (prev.smtpHost || ''),
          smtpPort: body?.smtpPort !== undefined ? (Number(body.smtpPort) || 465) : (prev.smtpPort || 465),
          smtpSecure: body?.smtpSecure !== undefined ? Boolean(body.smtpSecure) : (prev.smtpSecure !== false),
          smtpUser: body?.smtpUser !== undefined ? String(body.smtpUser).trim() : (prev.smtpUser || ''),
          smtpPass: body?.clearSmtpPass ? '' : (String(body?.smtpPass || '').trim() || prev.smtpPass || ''),
          fromEmail: body?.fromEmail !== undefined ? String(body.fromEmail).trim() : (prev.fromEmail || ''),
          fromName: body?.fromName !== undefined ? String(body.fromName).trim() : (prev.fromName || 'IELTS Nha Trang — Ms. Như')
        };
        store.version += 1;
        store._localMutated = true;
        if (onFlush) onFlush(store);
        else onChanged?.(store);
        scheduleBroadcast(50);
        sendJsonResponse(res, 200, { ok: true, config: getPublicMailConfigSummary(store) });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Lưu cấu hình email thất bại.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/mail/test') {
      if (!viewer || viewer.role !== 'teacher') {
        sendJsonResponse(res, 403, { ok: false, error: 'Chỉ Giáo viên mới được thử gửi email.' });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const to = String(body?.to || '').trim().toLowerCase();
        if (!isValidEmailAddress(to)) {
          sendJsonResponse(res, 400, { ok: false, error: 'Vui lòng nhập email người nhận hợp lệ.' });
          return;
        }
        const content = buildOtpEmailContent({
          purpose: 'verify_email',
          otpCode: '123456',
          username: viewer.username,
          displayName: viewer.name || viewer.username,
          expiresMinutes: 10
        });
        const result = await sendMailFn(store, { to, ...content });
        sendJsonResponse(res, 200, { ok: true, result });
      } catch (err) {
        const status = err?.code === 'MAIL_NOT_CONFIGURED' ? 503 : 502;
        sendJsonResponse(res, status, { ok: false, error: formatMailTransportError(err, 'Gửi email thử nghiệm thất bại.') });
      }
      return;
    }

    if (req.method === 'GET' && reqUrl === '/payment/config') {
      const isViewerSuperAdmin = Boolean(viewer?.isSuperAdmin && viewer.username === SUPER_ADMIN_USERNAME);
      if (!isViewerSuperAdmin) {
        sendJsonResponse(res, 403, { ok: false, error: 'Chỉ Quản Trị Hệ Thống mới xem được cấu hình giá tiền & thanh toán.' });
        return;
      }
      sendJsonResponse(res, 200, { ok: true, config: getAdminPaymentConfigSummary(store) });
      return;
    }

    if (req.method === 'POST' && reqUrl === '/payment/config') {
      const isViewerSuperAdmin = Boolean(viewer?.isSuperAdmin && viewer.username === SUPER_ADMIN_USERNAME);
      if (!isViewerSuperAdmin) {
        sendJsonResponse(res, 403, { ok: false, error: 'Chỉ Quản Trị Hệ Thống mới có quyền chỉnh giá tiền & tài khoản nhận thanh toán!' });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const rawCfg = body?.paymentConfig || body || {};
        store.paymentConfig = externalizePaymentConfigMedia(
          store,
          normalizePaymentConfig({ ...rawCfg, pricingSchemaVersion: 3 })
        ).config;
        const prevSec = store.paymentSecrets && typeof store.paymentSecrets === 'object'
          ? store.paymentSecrets
          : { sepayApiKey: '', payosClientId: '', payosApiKey: '', payosChecksumKey: '' };
        const nextClientId = body?.clearPayosClientId
          ? ''
          : body?.payosClientId !== undefined
          ? String(body.payosClientId || '').trim()
          : String(prevSec.payosClientId || '');
        store.paymentSecrets = {
          sepayApiKey: body?.clearSepayApiKey
            ? ''
            : (String(body?.sepayApiKey || '').trim() || prevSec.sepayApiKey || ''),
          payosClientId: nextClientId,
          payosApiKey: body?.clearPayosApiKey
            ? ''
            : (String(body?.payosApiKey || '').trim() || prevSec.payosApiKey || ''),
          payosChecksumKey: body?.clearPayosChecksumKey
            ? ''
            : (String(body?.payosChecksumKey || '').trim() || prevSec.payosChecksumKey || '')
        };
        store.version += 1;
        store._localMutated = true;
        if (onFlush) onFlush(store);
        else onChanged?.(store);
        scheduleBroadcast(50);
        sendJsonResponse(res, 200, { ok: true, config: getAdminPaymentConfigSummary(store) });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Lưu cấu hình QR thanh toán thất bại.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/payment/test-payos') {
      const isViewerSuperAdmin = Boolean(viewer?.isSuperAdmin && viewer.username === SUPER_ADMIN_USERNAME);
      if (!isViewerSuperAdmin) {
        sendJsonResponse(res, 403, { ok: false, error: 'Chỉ Quản Trị Hệ Thống mới kiểm tra được PayOS.' });
        return;
      }
      try {
        const body = await readJsonBody(req).catch(() => ({}));
        const secrets = getEffectivePaymentSecrets(store);
        const eff = {
          payosClientId: String(body?.payosClientId || secrets.payosClientId || '').trim(),
          payosApiKey: String(body?.payosApiKey || secrets.payosApiKey || '').trim(),
          payosChecksumKey: String(body?.payosChecksumKey || secrets.payosChecksumKey || '').trim()
        };
        if (!eff.payosClientId || !eff.payosApiKey || !eff.payosChecksumKey) {
          sendJsonResponse(res, 400, {
            ok: false,
            error: 'Vui lòng nhập & lưu đủ 3 mã PayOS: Client ID, Api Key và Checksum Key trước khi kiểm tra.'
          });
          return;
        }
        const originUrl = resolveRequestOrigin(req);
        const webhookUrl = String(body?.webhookUrl || `${originUrl}/api/sync/payment/webhook`).trim();
        await confirmPayosWebhookOnGateway({ webhookUrl, secrets: eff });
        sendJsonResponse(res, 200, {
          ok: true,
          webhookUrl,
          message: 'Kết nối PayOS & xác nhận Webhook thành công!'
        });
      } catch (err) {
        sendJsonResponse(res, 502, {
          ok: false,
          error: `PayOS từ chối kiểm tra: ${err?.message || 'Kiểm tra lại Client ID / Api Key / Checksum Key'}`
        });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/ai/generate') {
      if (!viewer || viewer.role !== 'teacher') {
        sendJsonResponse(res, 403, { ok: false, error: 'Chỉ Giáo viên hoặc Quản trị mới được dùng công cụ tạo/kiểm tra đề AI.' });
        return;
      }
      if (!checkRateLimit(store._rateLimits, `ai_gen:${viewer.username.toLowerCase()}`, 35, 5 * 60 * 1000)) {
        sendJsonResponse(res, 429, { ok: false, error: 'Bạn gửi quá nhiều yêu cầu tạo đề AI liên tiếp. Vui lòng đợi ít phút rồi thử lại.' });
        return;
      }
      try {
        const body = await readJsonBody(req, 40 * 1024 * 1024);
        const promptText = String(body?.promptText || body?.prompt || '');
        if (!promptText) {
          sendJsonResponse(res, 400, { ok: false, error: 'Thiếu promptText cho AI.' });
          return;
        }
        const effectiveKey = getEffectiveGeminiKey(store, String(body?.clientApiKey || ''));
        if (!effectiveKey) {
          sendJsonResponse(res, 400, { ok: false, error: 'Chưa cấu hình Google Gemini API Key trên máy chủ.' });
          return;
        }
        const requestParts = [{ text: promptText }];
        const images = Array.isArray(body?.images) ? body.images.slice(0, 10) : [];
        images.forEach(img => {
          if (typeof img === 'object' && img?.inlineData?.data) {
            requestParts.push(img);
          } else if (typeof img === 'string') {
            const match = img.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
            if (match) {
              requestParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
            }
          }
        });
        const documents = Array.isArray(body?.documents) ? body.documents.slice(0, 2) : [];
        documents.forEach(document => {
          if (
            typeof document === 'object' &&
            document?.inlineData?.mimeType === 'application/pdf' &&
            document.inlineData.data
          ) {
            requestParts.push(document);
          } else if (typeof document === 'string') {
            const match = document.match(/^data:application\/pdf;base64,(.+)$/);
            if (match) {
              requestParts.push({ inlineData: { mimeType: 'application/pdf', data: match[1] } });
            }
          }
        });
        const temperature = Number.isFinite(Number(body?.temperature)) ? Number(body.temperature) : 0.2;
        const { parsed, usedModel } = await callGeminiServerJson({ apiKey: effectiveKey, requestParts, temperature });
        sendJsonResponse(res, 200, { ok: true, parsed, usedModel });
      } catch (err) {
        sendJsonResponse(res, 502, { ok: false, error: err?.message || 'Gọi Gemini AI qua máy chủ thất bại.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/payment/create-order') {
      if (!viewer) {
        sendJsonResponse(res, 401, { ok: false, error: 'Vui lòng đăng nhập để tạo mã thanh toán.' });
        return;
      }
      if (!checkRateLimit(store._rateLimits, `create_order:${viewer.username.toLowerCase()}`, 30, 5 * 60 * 1000)) {
        sendJsonResponse(res, 429, { ok: false, error: 'Bạn khởi tạo mã thanh toán quá nhanh. Vui lòng đợi ít phút.' });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const viewerUser = store.users?.[viewer.username] || viewer;
        const cfg = getPublicPaymentConfigSummary(store);
        const rawType = body?.itemType !== undefined && body?.itemType !== '' ? String(body.itemType).trim() : 'cover';
        if (!VALID_PAYMENT_ITEM_TYPES.has(rawType)) {
          sendJsonResponse(res, 400, { ok: false, error: 'Loại gói thanh toán không hợp lệ.' });
          return;
        }
        const isTitleOrder = rawType === 'title';
        const isTestOrder = rawType === 'test';
        const isSkillPassOrder = rawType === 'skill_pass';
        const isAieoVipOrder = rawType === 'aieo_vip';
        const isRoomTicketOrder = rawType === 'room_ticket';
        const isGachaWish1Order = rawType === 'gacha_wish_1';
        const isGachaWish10Order = rawType === 'gacha_wish_10';
        const isDonateOrder = rawType === 'donate';
        const comboMeta = getRealExamComboMeta(rawType, cfg);
        if (viewerUser?.isGuest && viewerUser.role !== 'teacher' && !isTestOrder && !comboMeta) {
          sendJsonResponse(res, 403, {
            ok: false,
            error: 'Tài khoản Khách chỉ được phép mua Đề Thực Chiến và Mock Test.'
          });
          return;
        }
        const itemType = isTitleOrder
          ? 'title'
          : isTestOrder
          ? 'test'
          : comboMeta
          ? comboMeta.itemType
          : isSkillPassOrder
          ? 'skill_pass'
          : isAieoVipOrder
          ? 'aieo_vip'
          : isRoomTicketOrder
          ? 'room_ticket'
          : isGachaWish1Order
          ? 'gacha_wish_1'
          : isGachaWish10Order
          ? 'gacha_wish_10'
          : isDonateOrder
          ? 'donate'
          : 'cover';
        const renewFlag = Boolean(body?.renew);
        let itemId = '';
        let itemLabel = 'Ảnh Nền Riêng (1 Tháng)';
        let amount = cfg.coverUnlockPrice;
        let alreadyUnlocked = !renewFlag && hasCustomCoverPermission(viewerUser);

        if (isTitleOrder) {
          itemId = String(body?.itemId || '').trim();
          const paidTitle = PAID_SHOP_TITLES.find(t => t.id === itemId);
          if (!paidTitle) {
            sendJsonResponse(res, 400, { ok: false, error: 'Danh hiệu không hợp lệ hoặc không bán trong cửa hàng.' });
            return;
          }
          itemLabel = `${paidTitle.icon} ${paidTitle.label} (1 Tháng)`;
          amount = getTitlePriceVnd(paidTitle, cfg);
          const purchasedActive = Boolean(
            Array.isArray(viewerUser?.purchasedTitleIds) &&
            viewerUser.purchasedTitleIds.includes(itemId) &&
            ((Number(viewerUser?.purchasedTitleExpiries?.[itemId]) || 0) === 0 ||
              Number(viewerUser.purchasedTitleExpiries[itemId]) > Date.now())
          );
          alreadyUnlocked = !renewFlag && Boolean(
            viewerUser?.isSuperAdmin ||
            viewerUser?.username === SUPER_ADMIN_USERNAME ||
            purchasedActive ||
            (Array.isArray(viewerUser?.grantedTitleIds) && viewerUser.grantedTitleIds.includes(itemId))
          );
        } else if (isTestOrder) {
          itemId = String(body?.itemId || '').trim();
          const targetTest = (store.tests || []).find(t => t?.id === itemId);
          const testPrice = getTestPurchasePriceVnd(targetTest, cfg);
          if (!targetTest || testPrice <= 0) {
            sendJsonResponse(res, 400, { ok: false, error: 'Đề thi không tồn tại hoặc đang được mở miễn phí.' });
            return;
          }
          const isPeriodicMock = targetTest.examCategory === 'periodic_mock' || testPrice >= PERIODIC_MOCK_PRICE_VND;
          itemLabel = `${isPeriodicMock ? 'Mock Test Định Kỳ' : 'Chi phí test Thực Chiến 4 Kỹ Năng'}: ${targetTest.title}`;
          amount = testPrice;
          alreadyUnlocked = hasTestPurchaseAccess(viewerUser, targetTest);
        } else if (comboMeta) {
          itemId = comboMeta.itemType;
          itemLabel = `${comboMeta.label} - Thực Chiến Thi Thật 4 Kỹ Năng`;
          amount = comboMeta.price;
          alreadyUnlocked = false;
        } else if (isSkillPassOrder) {
          itemLabel = 'Gói Daily Zone (1 Tháng)';
          amount = Number(cfg.skillPassPrice) >= 0 ? cfg.skillPassPrice : SKILL_PASS_PRICE_VND;
          alreadyUnlocked = !renewFlag && hasSkillPracticeAccess(viewerUser);
        } else if (isAieoVipOrder) {
          itemLabel = 'Gói IELTS VIP (1 Tháng Full Quyền)';
          amount = Number(cfg.aieoVipPrice) >= 0 ? cfg.aieoVipPrice : AIEO_VIP_PRICE_VND;
          alreadyUnlocked = !renewFlag && Number(viewerUser?.aieoVipExpiresAt) > Date.now();
        } else if (isRoomTicketOrder) {
          itemLabel = 'Vé Tạo 1 Phòng Đấu Riêng';
          amount = Number(cfg.friendRoomTicketPrice) >= 0 ? cfg.friendRoomTicketPrice : FRIEND_ROOM_TICKET_PRICE_VND;
          alreadyUnlocked = false;
        } else if (isGachaWish1Order) {
          itemLabel = '1 Lượt Quay Gacha Hiệp Sĩ';
          amount = Number(cfg.gachaWish1Price) >= 0 ? cfg.gachaWish1Price : GACHA_WISH_1_PRICE_VND;
          alreadyUnlocked = false;
        } else if (isGachaWish10Order) {
          itemLabel = 'Gói 10 Lượt Quay Gacha Hiệp Sĩ';
          amount = Number(cfg.gachaWish10Price) >= 0 ? cfg.gachaWish10Price : GACHA_WISH_10_PRICE_VND;
          alreadyUnlocked = false;
        } else if (isDonateOrder) {
          const requestedAmt = parseStrictVndInt(body?.amount);
          if (!Number.isFinite(requestedAmt) || requestedAmt < MIN_DONATE_AMOUNT_VND) {
            sendJsonResponse(res, 400, {
              ok: false,
              error: `Mức ủng hộ tùy tâm tối thiểu là ${formatVndCurrency(MIN_DONATE_AMOUNT_VND)} (số nguyên dương).`
            });
            return;
          }
          if (requestedAmt > 50_000_000) {
            sendJsonResponse(res, 400, {
              ok: false,
              error: 'Số tiền vượt quá giới hạn tối đa 50.000.000đ.'
            });
            return;
          }
          amount = requestedAmt;
          itemLabel = `Ủng hộ tùy tâm (${formatVndCurrency(amount)})`;
          alreadyUnlocked = false;
        }

        if (alreadyUnlocked) {
          sendJsonResponse(res, 200, {
            ok: true,
            alreadyUnlocked: true,
            paymentConfig: cfg
          });
          return;
        }
        if (!Array.isArray(store.paymentOrders)) store.paymentOrders = [];
        const now = Date.now();
        let activeOrder = store.paymentOrders.find(
          o =>
            o &&
            o.username === viewer.username &&
            (o.itemType || 'cover') === itemType &&
            (o.itemId || '') === itemId &&
            o.status === 'pending' &&
            Number(o.amount) === amount &&
            o.expiresAt > now + 5 * 60 * 1000
        );
        if (!activeOrder) {
          const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
          activeOrder = {
            id: `ord_${now}_${suffix}`,
            orderCode: `MKN${suffix}`,
            numericOrderCode: crypto.randomInt(10_000_000, 999_999_999),
            username: viewer.username,
            itemType,
            itemId,
            itemLabel,
            amount,
            status: 'pending',
            createdAt: now,
            expiresAt: now + 30 * 60 * 1000,
            paidAt: 0,
            paidAmount: 0,
            txId: '',
            gateway: ''
          };
          store.paymentOrders = [activeOrder, ...store.paymentOrders].slice(0, 500);
          store.version += 1;
          store._localMutated = true;
          if (onFlush) onFlush(store);
          else onChanged?.(store);
        }

        let payosWarning = '';
        const secrets = getEffectivePaymentSecrets(store);
        const shouldCreatePayosLink = Boolean(
          !cfg.customQrUrl &&
          secrets.payosClientId &&
          secrets.payosApiKey &&
          secrets.payosChecksumKey &&
          amount >= 1000 &&
          !activeOrder.payosQrDataUrl
        );
        if (shouldCreatePayosLink) {
          const originUrl = resolveRequestOrigin(req);
          try {
            let payosRes;
            try {
              payosRes = await createPayosPaymentRequest({ order: activeOrder, originUrl, secrets });
            } catch (firstErr) {
              if (firstErr?.payosCode === '231') {
                activeOrder.numericOrderCode = crypto.randomInt(10_000_000, 999_999_999);
                payosRes = await createPayosPaymentRequest({ order: activeOrder, originUrl, secrets });
              } else {
                throw firstErr;
              }
            }
            Object.assign(activeOrder, payosRes);
            store.version += 1;
            store._localMutated = true;
            if (onFlush) onFlush(store);
            else onChanged?.(store);
          } catch (payosErr) {
            payosWarning = payosErr?.message || 'Không tạo được QR PayOS động, đang dùng VietQR dự phòng.';
          }
        }

        sendJsonResponse(res, 200, {
          ok: true,
          alreadyUnlocked: false,
          order: activeOrder,
          paymentConfig: cfg,
          ...(payosWarning ? { payosWarning } : {})
        });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Không thể khởi tạo đơn hàng.' });
      }
      return;
    }

    if (req.method === 'GET' && reqUrl === '/payment/order') {
      if (!viewer) {
        sendJsonResponse(res, 401, { ok: false, error: 'Vui lòng đăng nhập.' });
        return;
      }
      const parsedUrl = new URL(req.url || '/', 'http://localhost');
      const code = String(parsedUrl.searchParams.get('code') || '').trim().toUpperCase();
      const viewerUser = store.users?.[viewer.username] || viewer;
      const isViewerSuperAdmin = Boolean(viewer?.isSuperAdmin && viewer.username === SUPER_ADMIN_USERNAME);
      const matched = (store.paymentOrders || []).find(
        o => o && o.orderCode === code && (o.username === viewer.username || isViewerSuperAdmin)
      );
      const itemUnlocked = matched?.itemType === 'title'
        ? Boolean(
            isViewerSuperAdmin ||
            (Array.isArray(viewerUser?.purchasedTitleIds) &&
              viewerUser.purchasedTitleIds.includes(matched.itemId) &&
              (Boolean(PAID_SHOP_TITLES.find(t => t.id === matched.itemId)?.isPermanentDonateTitle) ||
                (Number(viewerUser?.purchasedTitleExpiries?.[matched.itemId]) || 0) === 0 ||
                Number(viewerUser.purchasedTitleExpiries[matched.itemId]) > Date.now())) ||
            (Boolean(PAID_SHOP_TITLES.find(t => t.id === matched.itemId)?.isPermanentDonateTitle) &&
              Number(viewerUser?.donatedTotalVnd || 0) >= getTitlePriceVnd(matched.itemId, store.paymentConfig)) ||
            (Array.isArray(viewerUser?.grantedTitleIds) && viewerUser.grantedTitleIds.includes(matched.itemId))
          )
        : matched?.itemType === 'test'
        ? Boolean(
            isViewerSuperAdmin ||
            (Array.isArray(viewerUser?.purchasedTestIds) && viewerUser.purchasedTestIds.includes(matched.itemId))
          )
        : matched?.itemType === 'skill_pass'
        ? hasSkillPracticeAccess(viewerUser)
        : matched?.itemType === 'aieo_vip'
        ? (isViewerSuperAdmin || Number(viewerUser?.aieoVipExpiresAt) > Date.now())
        : matched?.itemType === 'room_ticket' ||
          matched?.itemType === 'gacha_wish_1' ||
          matched?.itemType === 'gacha_wish_10' ||
          Boolean(getRealExamComboMeta(matched?.itemType, store.paymentConfig))
        ? Boolean(matched?.status === 'paid')
        : hasCustomCoverPermission(viewerUser);
      sendJsonResponse(res, 200, {
        ok: true,
        unlocked: itemUnlocked,
        order: matched || null
      });
      return;
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && reqUrl === '/payment/webhook') {
      if (req.method === 'HEAD') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end();
      } else {
        sendJsonResponse(res, 200, { ok: true, error: 0, success: true, ready: true });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/payment/webhook') {
      try {
        const body = await readJsonBody(req);
        const secrets = getEffectivePaymentSecrets(store);
        const isPayosPayload = Boolean(body && typeof body.data === 'object' && body.data !== null && body.signature);
        let gateway = 'sepay';
        let txKey = '';
        let amount = 0;
        let descriptionUpper = '';
        let numericOrderCode = null;

        if (isPayosPayload) {
          gateway = 'payos';
          if (!secrets.payosChecksumKey || !verifyPayosWebhookSignature(body.data, body.signature, secrets.payosChecksumKey)) {
            sendJsonResponse(res, 401, { error: -1, success: false, message: 'Invalid PayOS signature' });
            return;
          }
          if (body.code !== '00' || body.success === false || (body.data.code && body.data.code !== '00')) {
            sendJsonResponse(res, 200, { error: 0, success: true, ignored: 'non_success_status' });
            return;
          }
          const ref = String(body.data.reference || body.data.paymentLinkId || body.data.orderCode || '').trim();
          txKey = ref ? `payos:${ref}` : '';
          amount = Number(body.data.amount) || 0;
          numericOrderCode = Number(body.data.orderCode) || null;
          descriptionUpper = `${body.data.description || ''}`.toUpperCase();
        } else {
          const authHeader = String(req.headers?.authorization || '');
          const authMatch = /^Apikey\s+(.+)$/i.exec(authHeader.trim());
          const token = authMatch ? authMatch[1].trim() : '';
          if (!secrets.sepayApiKey || !timingSafeStringMatch(token, secrets.sepayApiKey)) {
            sendJsonResponse(res, 401, { success: false, message: 'Unauthorized' });
            return;
          }
          if (body?.transferType && String(body.transferType).toLowerCase() !== 'in') {
            sendJsonResponse(res, 200, { success: true, ignored: 'not_incoming' });
            return;
          }
          const ref = String(body?.id || body?.referenceCode || '').trim();
          txKey = ref ? `sepay:${ref}` : '';
          amount = Number(body?.transferAmount ?? body?.amount) || 0;
          descriptionUpper = `${body?.code || ''} ${body?.content || ''} ${body?.description || ''}`.toUpperCase();
        }

        const parsedWebhookAmount = Number(amount);
        if (!Number.isFinite(parsedWebhookAmount) || parsedWebhookAmount <= 0) {
          sendJsonResponse(res, 200, { error: 0, success: true, ignored: 'invalid_amount' });
          return;
        }
        amount = Math.round(parsedWebhookAmount);

        if (!txKey) {
          const fallbackDigest = crypto
            .createHash('sha256')
            .update(
              `${gateway}|${numericOrderCode || ''}|${amount}|${descriptionUpper.slice(0, 140)}|${String(
                body?.transactionDate || body?.when || body?.data?.transactionDateTime || ''
              )}`
            )
            .digest('hex')
            .slice(0, 24);
          txKey = `${gateway}:auto_${fallbackDigest}`;
        }

        if (!Array.isArray(store.processedWebhookTxIds)) store.processedWebhookTxIds = [];
        if (txKey && store.processedWebhookTxIds.includes(txKey)) {
          sendJsonResponse(res, 200, { error: 0, success: true, duplicate: true });
          return;
        }

        if (!Array.isArray(store.paymentOrders)) store.paymentOrders = [];
        const codeMatches = descriptionUpper.match(/\bMKN[A-Z0-9]{6}\b/g) || [];
        let matchedOrder = store.paymentOrders.find(o => {
          if (!o || o.status !== 'pending') return false;
          if (numericOrderCode && o.numericOrderCode === numericOrderCode) return true;
          if (codeMatches.includes(o.orderCode)) return true;
          return descriptionUpper.includes(o.orderCode);
        });

        // Fallback match by MOKHOANEN <USERNAME> if user made manual transfer while keeping pending order
        if (!matchedOrder && descriptionUpper.includes('MOKHOANEN')) {
          matchedOrder = store.paymentOrders.find(o => {
            if (!o || o.status !== 'pending') return false;
            const cleanU = String(o.username || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            return cleanU && descriptionUpper.includes(cleanU);
          });
        }

        // Fallback match direct Donate QR transfer: "UNGHO <USERNAME> ..." (>= 5.000đ)
        if (!matchedOrder && amount >= MIN_DONATE_AMOUNT_VND && descriptionUpper.includes('UNGHO')) {
          const matchedDonateUserKey = Object.keys(store.users || {}).find(uKey => {
            if (!uKey || uKey === SUPER_ADMIN_USERNAME) return false;
            const cleanU = String(uKey).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            return cleanU.length >= 3 && descriptionUpper.includes(cleanU);
          });
          if (matchedDonateUserKey && store.users?.[matchedDonateUserKey]) {
            const nowMs = Date.now();
            if (txKey) {
              store.processedWebhookTxIds = [txKey, ...store.processedWebhookTxIds].slice(0, 500);
            }
            const donorName = store.users[matchedDonateUserKey]?.name || matchedDonateUserKey;
            const fulfillDonate = fulfillPaidEntitlementForUser(store, {
              userKey: matchedDonateUserKey,
              itemType: 'donate',
              itemLabel: `Ủng hộ tùy tâm (${formatVndCurrency(amount)})`,
              amount,
              gateway,
              txId: txKey,
              nowMs
            });
            recordPaymentTransactionAndNotifyAdmin(store, {
              username: matchedDonateUserKey,
              userName: donorName,
              itemType: 'donate',
              itemLabel: `Ủng hộ tùy tâm (${formatVndCurrency(amount)})`,
              amount,
              status: 'paid',
              gateway,
              txId: txKey,
              balanceBefore: fulfillDonate.balanceBefore,
              balanceAfter: fulfillDonate.balanceAfter,
              paidAt: nowMs
            });
            store.version += 1;
            store._localMutated = true;
            if (onFlush) onFlush(store);
            else onChanged?.(store);
            scheduleBroadcast(10);
            sendJsonResponse(res, 200, {
              error: 0,
              success: true,
              unlocked: true,
              donateMatched: true,
              username: matchedDonateUserKey,
              amount
            });
            return;
          }
        }

        if (!matchedOrder) {
          sendJsonResponse(res, 200, { error: 0, success: true, matched: false });
          return;
        }

        if (matchedOrder.status === 'paid') {
          sendJsonResponse(res, 200, { error: 0, success: true, duplicate: true });
          return;
        }

        if (amount < Number(matchedOrder.amount || 0)) {
          sendJsonResponse(res, 200, {
            error: 0,
            success: true,
            matched: true,
            unlocked: false,
            reason: 'insufficient_amount'
          });
          return;
        }

        const nowMs = Date.now();
        const targetKey = findUserKeyInStore(store, matchedOrder.username);
        const targetUser = targetKey ? store.users?.[targetKey] : null;
        if (txKey) {
          store.processedWebhookTxIds = [txKey, ...store.processedWebhookTxIds].slice(0, 500);
        }
        matchedOrder.status = 'paid';
        matchedOrder.paidAt = nowMs;
        matchedOrder.paidAmount = amount;
        matchedOrder.txId = txKey;
        matchedOrder.gateway = gateway;

        if (targetKey && targetUser) {
          const fulfillRes = fulfillPaidEntitlementForUser(store, {
            userKey: targetKey,
            itemType: matchedOrder.itemType || 'cover',
            itemId: matchedOrder.itemId || '',
            itemLabel: matchedOrder.itemLabel || matchedOrder.itemType || 'Thanh toán',
            amount,
            orderCode: matchedOrder.orderCode,
            gateway,
            txId: txKey,
            nowMs
          });
          const latestUserRec = store.users[targetKey] || targetUser;
          recordPaymentTransactionAndNotifyAdmin(store, {
            orderCode: matchedOrder.orderCode,
            username: targetKey,
            userName: latestUserRec.name || targetKey,
            itemType: matchedOrder.itemType || 'cover',
            itemId: matchedOrder.itemId || '',
            itemLabel: matchedOrder.itemLabel || matchedOrder.itemType || 'Thanh toán',
            amount,
            status: 'paid',
            gateway,
            txId: txKey,
            balanceBefore: fulfillRes.balanceBefore,
            balanceAfter: fulfillRes.balanceAfter,
            paidAt: nowMs
          });
        }

        store.version += 1;
        store._localMutated = true;
        if (onFlush) onFlush(store);
        else onChanged?.(store);
        scheduleBroadcast(10);
        sendJsonResponse(res, 200, {
          error: 0,
          success: true,
          unlocked: true,
          orderCode: matchedOrder.orderCode,
          username: matchedOrder.username
        });
      } catch (err) {
        sendJsonResponse(res, 400, { error: -1, success: false, message: err?.message || 'Webhook failed' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/speaking/verify-password') {
      if (!viewer) {
        sendJsonResponse(res, 401, { ok: false, error: 'Vui lòng đăng nhập để vào phòng thi Speaking Thực Chiến.' });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const testId = String(body?.testId || '').trim();
        const password = String(body?.password || '').trim();
        const ip = getClientIp(req);
        if (!checkRateLimit(store._rateLimits, `spk_room:${ip}:${viewer.username}`, 25, 5 * 60 * 1000)) {
          sendJsonResponse(res, 429, { ok: false, error: 'Nhập sai mật khẩu phòng thi quá nhiều lần. Vui lòng thử lại sau ít phút.' });
          return;
        }
        const targetTest = (store.tests || []).find(t => t?.id === testId);
        if (!targetTest) {
          sendJsonResponse(res, 404, { ok: false, error: 'Không tìm thấy bài thi Speaking này.' });
          return;
        }
        const isTeacherViewer = viewer.role === 'teacher' || Boolean(viewer.isSuperAdmin);
        if (!isTeacherViewer) {
          if ((targetTest.visibility || 'public') === 'private') {
            sendJsonResponse(res, 403, { ok: false, error: 'Bài thi này đang ở chế độ riêng tư.' });
            return;
          }
          const assigned = normalizeClassIdList(targetTest.assignedClassIds);
          if (assigned.length > 0) {
            const vClasses = getViewerClassIdSet(store, viewer.username);
            if (!assigned.some(cid => vClasses.has(cid))) {
              sendJsonResponse(res, 403, { ok: false, error: 'Bạn không thuộc lớp học được giao bài thi này.' });
              return;
            }
          }
          const expectedPass = String(targetTest.speaking?.roomPassword || targetTest.examPassword || '').trim();
          if (expectedPass && expectedPass !== password) {
            sendJsonResponse(res, 403, { ok: false, error: 'Mật khẩu Phòng Thi Thực Chiến chưa chính xác!' });
            return;
          }
        }
        if (!store._unlockedSpeakingRooms) store._unlockedSpeakingRooms = new Map();
        store._unlockedSpeakingRooms.set(`${viewer.username}::${targetTest.id}`, Date.now());
        const unlockToken = signToken(
          {
            kind: 'speaking_unlock',
            username: viewer.username,
            testId: targetTest.id,
            exp: Date.now() + 12 * 60 * 60 * 1000
          },
          store._authSecret
        );
        sendJsonResponse(res, 200, { ok: true, unlockToken, examUnlockToken: unlockToken });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Xác nhận mật khẩu phòng thi thất bại.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/exam/verify-password') {
      if (!viewer) {
        sendJsonResponse(res, 401, { ok: false, error: 'Vui lòng đăng nhập để vào phòng thi Thực Chiến.' });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const testId = String(body?.testId || '').trim();
        const password = String(body?.password || '').trim();
        const ip = getClientIp(req);
        if (!checkRateLimit(store._rateLimits, `exam_room:${ip}:${viewer.username}`, 25, 5 * 60 * 1000)) {
          sendJsonResponse(res, 429, { ok: false, error: 'Nhập sai mật khẩu phòng thi quá nhiều lần. Vui lòng thử lại sau ít phút.' });
          return;
        }
        const targetTest = (store.tests || []).find(t => t?.id === testId);
        if (!targetTest) {
          sendJsonResponse(res, 404, { ok: false, error: 'Không tìm thấy đề thi này.' });
          return;
        }
        const isTeacherViewer = viewer.role === 'teacher' || Boolean(viewer.isSuperAdmin);
        if (!isTeacherViewer) {
          if ((targetTest.visibility || 'public') === 'private') {
            sendJsonResponse(res, 403, { ok: false, error: 'Đề thi này đang ở chế độ riêng tư.' });
            return;
          }
          const assigned = normalizeClassIdList(targetTest.assignedClassIds);
          if (assigned.length > 0) {
            const vClasses = getViewerClassIdSet(store, viewer.username);
            if (!assigned.some(cid => vClasses.has(cid))) {
              sendJsonResponse(res, 403, { ok: false, error: 'Bạn không thuộc lớp học được giao đề thi này.' });
              return;
            }
          }
          if (!hasTestPurchaseAccess(store.users?.[viewer.username] || viewer, targetTest)) {
            sendJsonResponse(res, 403, { ok: false, error: 'Bạn cần mở khóa đề thi trước khi nhập mật khẩu phòng thi.' });
            return;
          }
          const expectedPass = String(targetTest.examPassword || targetTest.speaking?.roomPassword || '').trim();
          if (expectedPass && expectedPass !== password) {
            sendJsonResponse(res, 403, { ok: false, error: 'Mật khẩu Phòng Thi Thực Chiến chưa chính xác!' });
            return;
          }
        }
        if (!store._unlockedExamRooms) store._unlockedExamRooms = new Map();
        store._unlockedExamRooms.set(`${viewer.username}::${targetTest.id}`, Date.now());
        const unlockToken = signToken(
          {
            kind: 'exam_unlock',
            username: viewer.username,
            testId: targetTest.id,
            exp: Date.now() + 12 * 60 * 60 * 1000
          },
          store._authSecret
        );
        sendJsonResponse(res, 200, { ok: true, unlockToken, examUnlockToken: unlockToken });
      } catch (err) {
        sendJsonResponse(res, 400, { ok: false, error: err?.message || 'Xác nhận mật khẩu đề thi thất bại.' });
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/game/join') {
      if (!viewer) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để tham gia phòng đấu.' }));
        return;
      }
      try {
        const body = await readJsonBody(req);
        const cleanPin = String(body?.pin || '').trim();
        const cleanPass = String(body?.pass || '').trim();
        const ip = getClientIp(req);
        if (!checkRateLimit(store._rateLimits, `room:${ip}:${viewer.username}`, 25, 5 * 60 * 1000)) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Nhập sai mã/mật khẩu phòng quá nhiều lần. Vui lòng đợi lát nữa.' }));
          return;
        }
        const targetRoom = cleanPin ? store.rooms?.[cleanPin] : null;
        if (!targetRoom) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: `Không tìm thấy phòng "${cleanPin}". Hãy kiểm tra lại mã phòng.` }));
          return;
        }
        const normRoom = normalizeServerRoom(targetRoom, cleanPin);
        if (normRoom.status === 'ENDED') {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Phòng đấu này đã kết thúc. Vui lòng xin mã phòng mới.' }));
          return;
        }
        const isRoomHostJoin = Boolean(normRoom.roomMode === 'friend_vip' && normRoom.hostUsername === viewer.username);
        if (viewer.role !== 'teacher' && !isRoomHostJoin && normRoom.pass && String(normRoom.pass).trim() !== cleanPass) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Mật khẩu phòng không chính xác. Vui lòng thử lại.' }));
          return;
        }
        const alreadyJoined = Boolean(normRoom.lobbyPlayers?.[viewer.username]);
        const currentCount = Object.keys(normRoom.lobbyPlayers || {}).length;
        if (!alreadyJoined && viewer.role !== 'teacher' && !isRoomHostJoin && currentCount >= normRoom.maxPlayers) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: `Phòng đấu đã đủ số lượng tối đa ${normRoom.maxPlayers} người chơi!` }));
          return;
        }
        if (normRoom.status === 'PLAYING' && !alreadyJoined && viewer.role !== 'teacher' && !isRoomHostJoin) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Trận đấu đang diễn ra! Hãy bảo Giáo viên bấm Mở Sảnh Mới.' }));
          return;
        }

        const pilot = body?.pilot || {};
        const existingPlayer = normRoom.lobbyPlayers?.[viewer.username];
        const activeTeams = getActiveTeamIds(normRoom.teamCount);
        const needsTeam = activeTeams.length > 0 && (normRoom.roomMode === 'friend_vip' || viewer.role !== 'teacher');
        const resolvedTeamId = needsTeam
          ? (activeTeams.includes(existingPlayer?.teamId)
              ? existingPlayer.teamId
              : pickBalancedTeamId(normRoom.lobbyPlayers, normRoom.teamCount, normRoom.roomMode, viewer.username))
          : '';
        normRoom.lobbyPlayers[viewer.username] = {
          ...(existingPlayer || {}),
          username: viewer.username,
          name: viewer.name || viewer.username,
          role: viewer.role,
          isHost: isRoomHostJoin || viewer.role === 'teacher',
          ...(Number(viewer.aieoVipExpiresAt) > 0 ? { aieoVipExpiresAt: Number(viewer.aieoVipExpiresAt) } : {}),
          ...(viewer.vipRedNameEnabled !== undefined ? { vipRedNameEnabled: Boolean(viewer.vipRedNameEnabled) } : {}),
          ...(viewer.vipNameColor ? { vipNameColor: normalizeVipNameColor(viewer.vipNameColor) } : {}),
          ...(viewer.vipTagEnabled !== undefined ? { vipTagEnabled: Boolean(viewer.vipTagEnabled) } : {}),
          ...(viewer.vipNeonCoverEnabled !== undefined ? { vipNeonCoverEnabled: Boolean(viewer.vipNeonCoverEnabled) } : {}),
          ...(viewer.vipNeonCoverColor ? { vipNeonCoverColor: normalizeVipNeonCoverColor(viewer.vipNeonCoverColor) } : {}),
          ...(viewer.isSuperAdmin ? { isSuperAdmin: true } : {}),
          ...(resolvedTeamId ? { teamId: resolvedTeamId } : {}),
          colorId: pilot.colorId || existingPlayer?.colorId || 'cyan',
          animalId: pilot.animalId || existingPlayer?.animalId || 'cat',
          accessoryId: pilot.accessoryId || existingPlayer?.accessoryId || 'crown',
          avatarUrl: viewer.avatarUrl || '',
          approved: normRoom.roomMode === 'friend_vip' ? true : Boolean(existingPlayer?.approved),
          ready: (viewer.role === 'teacher' || isRoomHostJoin) ? true : Boolean(existingPlayer?.ready),
          chat: existingPlayer?.chat || '',
          chatAt: existingPlayer?.chatAt || 0,
          joinedAt: existingPlayer?.joinedAt || Date.now()
        };
        store.rooms[cleanPin] = normRoom;
        store.version += 1;
        onChanged?.(store);
        scheduleBroadcast(25);

        const viewerSnap = getSnapshotForViewer(store, viewer);
        sendJsonResponse(res, 200, { ok: true, room: viewerSnap.rooms[cleanPin], snapshot: viewerSnap }, req);
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Không thể vào phòng.' }));
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/audio') {
      if (!viewer) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để tải file ghi âm.' }));
        return;
      }
      try {
        const contentType = String(req.headers?.['content-type'] || '').split(';')[0].trim().toLowerCase();
        const isLegacyJsonUpload = contentType === 'application/json';
        const body = isLegacyJsonUpload ? await readJsonBody(req) : null;
        if (isLegacyJsonUpload && !body?.dataBase64) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Missing audio data' }));
          return;
        }
        const rawMime = String(isLegacyJsonUpload ? body.mimeType || '' : contentType).split(';')[0].trim().toLowerCase();
        if (rawMime && !ALLOWED_AUDIO_MIMES.has(rawMime)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Định dạng audio không hợp lệ.' }));
          return;
        }
        const cleanMime = cleanAudioMimeType(rawMime || 'audio/webm');
        if (!ALLOWED_AUDIO_MIMES.has(cleanMime.split(';')[0])) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: 'Định dạng audio không hợp lệ.' }));
          return;
        }
        let meta;
        if (isLegacyJsonUpload) {
          const rawB64 = String(body.dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
          const approxBytes = Math.ceil((rawB64.length * 3) / 4);
          if (approxBytes > MAX_AUDIO_UPLOAD_BYTES) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: 'File ghi âm vượt quá giới hạn 100MB.' }));
            return;
          }
          meta = saveAudioRecord(store, { ...body, mimeType: cleanMime, username: viewer.username });
        } else {
          const buffer = await readBinaryBody(req, MAX_AUDIO_UPLOAD_BYTES);
          if (!buffer.length) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: 'Missing audio data' }));
            return;
          }
          const decodeHeader = name => {
            try {
              return decodeURIComponent(String(req.headers?.[name] || ''));
            } catch {
              return '';
            }
          };
          meta = saveAudioRecord(store, {
            audioId: decodeHeader('x-audio-id'),
            mimeType: cleanMime,
            buffer,
            username: viewer.username,
            attemptId: decodeHeader('x-attempt-id'),
            questionId: decodeHeader('x-question-id')
          });
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({
          ok: true,
          audioId: meta.audioId,
          audioUrl: `/api/sync/audio/${meta.audioId}`,
          mimeType: meta.mimeType,
          sizeBytes: meta.sizeBytes
        }));
      } catch (err) {
        res.statusCode = String(err?.message || '').includes('vượt quá giới hạn 100MB') ? 413 : 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Audio upload failed' }));
      }
      return;
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && reqUrl.startsWith('/media/')) {
      let rawId = '';
      try {
        rawId = decodeURIComponent(reqUrl.slice('/media/'.length));
      } catch {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Invalid media id' }));
        return;
      }
      const safeId = sanitizeMediaId(rawId);
      const record = safeId ? loadMediaRecord(store, safeId) : null;
      if (!record) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ ok: false, error: 'Media not found' }));
        return;
      }
      const totalLen = record.buffer.length;
      const etag = `"${safeId}"`;
      const mime = record.meta?.mimeType || 'application/octet-stream';
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      const rangeHeader = req.headers?.range;
      if (!rangeHeader && matchesIfNoneMatch(req.headers?.['if-none-match'], etag)) {
        res.statusCode = 304;
        res.end();
        return;
      }

      res.setHeader('Content-Type', mime);
      res.setHeader('Accept-Ranges', 'bytes');
      if (rangeHeader && /^bytes=\d*-\d*$/i.test(rangeHeader)) {
        const [startStr, endStr] = rangeHeader.replace(/^bytes=/i, '').split('-');
        const start = startStr ? Math.min(totalLen - 1, Math.max(0, parseInt(startStr, 10))) : 0;
        const end = endStr ? Math.min(totalLen - 1, Math.max(start, parseInt(endStr, 10))) : totalLen - 1;
        const slice = record.buffer.subarray(start, end + 1);
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalLen}`);
        res.setHeader('Content-Length', String(slice.length));
        if (req.method === 'HEAD') {
          res.end();
        } else {
          res.end(slice);
        }
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Length', String(totalLen));
        if (req.method === 'HEAD') {
          res.end();
        } else {
          res.end(record.buffer);
        }
      }
      return;
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && reqUrl.startsWith('/audio/')) {
      if (!viewer) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để nghe audio.' }));
        return;
      }
      const rawId = decodeURIComponent(reqUrl.slice('/audio/'.length));
      const record = loadAudioRecord(store, rawId);
      if (!record) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Audio recording not found' }));
        return;
      }
      const ownerName = record.meta?.username || '';
      const ownerIsTeacher = Boolean(ownerName && store.users?.[ownerName]?.role === 'teacher');
      const isQuestionPromptAudio = rawId.startsWith('spk_prompt_') || ownerIsTeacher;
      if (viewer.role !== 'teacher' && !isQuestionPromptAudio && ownerName && ownerName !== viewer.username) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Bạn không có quyền truy cập bản ghi âm này.' }));
        return;
      }
      const totalLen = record.buffer.length;
      const rawStoredMime = String(record.meta?.mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
      const mime = ALLOWED_AUDIO_MIMES.has(rawStoredMime) ? rawStoredMime : 'audio/webm';
      const audioEtag = `"aud_${record.meta?.audioId || sanitizeAudioId(rawId)}-${totalLen}"`;
      res.setHeader('ETag', audioEtag);
      res.setHeader('Cache-Control', 'private, max-age=86400, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      const rangeHeader = req.headers?.range;
      if (!rangeHeader && matchesIfNoneMatch(req.headers?.['if-none-match'], audioEtag)) {
        res.statusCode = 304;
        res.end();
        return;
      }

      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', mime);

      if (rangeHeader && /^bytes=\d*-\d*$/i.test(rangeHeader)) {
        const [startStr, endStr] = rangeHeader.replace(/^bytes=/i, '').split('-');
        const start = startStr ? Math.min(totalLen - 1, Math.max(0, parseInt(startStr, 10))) : 0;
        const end = endStr ? Math.min(totalLen - 1, Math.max(start, parseInt(endStr, 10))) : totalLen - 1;
        const slice = record.buffer.subarray(start, end + 1);
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalLen}`);
        res.setHeader('Content-Length', String(slice.length));
        if (req.method === 'HEAD') {
          res.end();
        } else {
          res.end(slice);
        }
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Length', String(totalLen));
        if (req.method === 'HEAD') {
          res.end();
        } else {
          res.end(record.buffer);
        }
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/grade-speaking') {
      if (!viewer) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để sử dụng công cụ chấm Speaking.' }));
        return;
      }
      if (viewer.role !== 'teacher') {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Bài Speaking cần nộp chờ Ms. Như duyệt và chấm điểm.' }));
        return;
      }
      try {
        const body = await readJsonBody(req);
        const recordings = Array.isArray(body?.recordings) ? body.recordings : [];
        const testTitle = body?.testTitle || 'IELTS Speaking Test';
        const partMode = body?.partMode || 'full';
        const clientOverrideKey = viewer.role === 'teacher' ? (body?.clientApiKey || '') : '';
        const effectiveKey = getEffectiveGeminiKey(store, clientOverrideKey);

        let evaluation = null;
        let warning = '';

        if (effectiveKey) {
          try {
            evaluation = await gradeSpeakingWithGeminiServer({
              apiKey: effectiveKey,
              store,
              testTitle,
              partMode,
              recordings
            });
          } catch (geminiErr) {
            warning = geminiErr?.message || 'Gemini API failed, fallback used';
          }
        }

        if (!evaluation) {
          const enriched = recordings.map(r => {
            const saved = r.audioId ? loadAudioRecord(store, r.audioId) : null;
            return { ...r, hasAudioBinary: Boolean(saved?.buffer?.length > 256 || r.inlineAudioBase64) };
          });
          evaluation = simulateAISpeakingGrading({ testTitle, partMode, recordings: enriched });
          if (warning) evaluation._fallbackReason = warning;
        }

        const aiGradingTicket = signToken(
          {
            kind: 'speaking_eval',
            username: viewer.username,
            testTitle,
            band: evaluation.overallBand,
            criteria: evaluation.criteria || {},
            overallFeedback: evaluation.overallFeedback || '',
            exp: Date.now() + 30 * 60 * 1000
          },
          store._authSecret
        );

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, evaluation: { ...evaluation, aiGradingTicket } }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Speaking grading failed' }));
      }
      return;
    }

    if (req.method === 'POST' && reqUrl === '/grade-writing') {
      if (!viewer) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Vui lòng đăng nhập để sử dụng công cụ phân tích Writing.' }));
        return;
      }
      if (viewer.role !== 'teacher') {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Bài Writing cần nộp chờ Ms. Như duyệt và chấm điểm.' }));
        return;
      }
      try {
        const body = await readJsonBody(req);
        const task1Prompt = String(body?.task1Prompt || '');
        const task1Text = String(body?.task1Text || '');
        const task2Prompt = String(body?.task2Prompt || '');
        const task2Text = String(body?.task2Text || '');
        const attemptId = String(body?.attemptId || '').trim();
        const clientOverrideKey = viewer.role === 'teacher' ? (body?.clientApiKey || '') : '';
        const effectiveKey = getEffectiveGeminiKey(store, clientOverrideKey);

        let evaluation = null;
        let warning = '';

        if (effectiveKey) {
          try {
            evaluation = await callGeminiWritingGrader({
              apiKey: effectiveKey,
              task1Prompt,
              task1Text,
              task2Prompt,
              task2Text
            });
          } catch (geminiErr) {
            warning = geminiErr?.message || 'Gemini Writing API failed, fallback used';
          }
        }

        if (!evaluation) {
          evaluation = simulateAIWritingGrading({
            _task1Prompt: task1Prompt,
            task1Text,
            _task2Prompt: task2Prompt,
            task2Text
          });
          if (warning) evaluation._fallbackReason = warning;
        }

        const writingDigest = crypto
          .createHash('sha256')
          .update(`${task1Text}||${task2Text}`)
          .digest('hex')
          .slice(0, 24);

        const aiWritingTicket = signToken(
          {
            kind: 'writing_eval',
            username: viewer.username,
            digest: writingDigest,
            task1Band: evaluation.task1Band,
            task2Band: evaluation.task2Band,
            overallBand: evaluation.overallBand,
            feedback: evaluation.feedback || '',
            exp: Date.now() + 30 * 60 * 1000
          },
          store._authSecret
        );

        let updatedAttempt = null;
        if (attemptId) {
          const attIdx = (store.attempts || []).findIndex(a => a.id === attemptId);
          if (attIdx >= 0) {
            const targetAtt = store.attempts[attIdx];
            const canUpdate = viewer.role === 'teacher';
            if (canUpdate) {
              const linkedTest = (store.tests || []).find(t => t.id === targetAtt.testId);
              const rawScope =
                String(body?.writingTaskScope || targetAtt.writingTaskScope || linkedTest?.writingTaskScope || '').trim() ||
                (String(targetAtt.dailySubCategory || linkedTest?.dailySubCategory || '').startsWith('w1_')
                  ? 'task1'
                  : String(targetAtt.dailySubCategory || linkedTest?.dailySubCategory || '') === 'w2_essay'
                  ? 'task2'
                  : 'both');
              const effectiveScope =
                targetAtt.testMode === 'single_skill' && targetAtt.focusSkill === 'writing'
                  ? (rawScope === 'task2' ? 'task2' : 'task1')
                  : 'both';
              const wBandFinal =
                effectiveScope === 'task1'
                  ? evaluation.task1Band
                  : effectiveScope === 'task2'
                  ? evaluation.task2Band
                  : evaluation.overallBand;
              const nextScores = {
                ...(targetAtt.scores || {}),
                writing: {
                  task1Band: effectiveScope === 'task2' ? null : evaluation.task1Band,
                  task2Band: effectiveScope === 'task1' ? null : evaluation.task2Band,
                  overallBand: wBandFinal
                }
              };
              const activeBands = [];
              if ((nextScores.listening?.total || 0) > 0) activeBands.push(Number(nextScores.listening.band) || 0);
              if ((nextScores.reading?.total || 0) > 0) activeBands.push(Number(nextScores.reading.band) || 0);
              activeBands.push(wBandFinal);
              if (typeof nextScores.speaking?.band === 'number') activeBands.push(Number(nextScores.speaking.band));
              const nextOverall = targetAtt.testMode === 'single_skill' && targetAtt.focusSkill === 'writing'
                ? wBandFinal
                : calculateOverallIeltsBand(activeBands);
              updatedAttempt = {
                ...targetAtt,
                writingTaskScope: effectiveScope,
                aiGraded: true,
                // Keep existing approval state: AI draft grading stays hidden from students until Ms. Nhu clicks Approve!
                teacherGraded: Boolean(targetAtt.teacherGraded),
                aiDetails: { ...evaluation, overallBand: wBandFinal },
                scores: nextScores,
                overallBand: nextOverall,
                teacherFeedback: evaluation.feedback || targetAtt.teacherFeedback || ''
              };
              store.attempts[attIdx] = updatedAttempt;
              store.version += 1;
              onChanged?.(store);
              scheduleBroadcast(40);
            }
          }
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, evaluation: { ...evaluation, aiWritingTicket }, attempt: updatedAttempt }));
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Writing grading failed' }));
      }
      return;
    }

    if (req.method === 'GET' && reqUrl === '/state') {
      if (pruneExpiredStoreChats(store, Date.now())) {
        onChanged?.(store);
        scheduleBroadcast(25);
      }
      if (viewer && recordUserLoginDay(store, viewer)) {
        store.version += 1;
        onChanged?.(store);
        scheduleBroadcast(50);
      }
      const todayKey = getVietnamDateKey(Date.now());
      const stateEtag = computeStateEtag(viewer, todayKey);
      let qSinceVersion = NaN;
      let qBootId = '';
      let qDateKey = '';
      let qUser = '';
      try {
        const parsedQuery = new URL(req.url || '/state', 'http://localhost').searchParams;
        if (parsedQuery.has('sinceVersion')) {
          qSinceVersion = Number(parsedQuery.get('sinceVersion'));
        }
        qBootId = String(parsedQuery.get('bootId') || '').trim();
        qDateKey = String(parsedQuery.get('dateKey') || '').trim();
        qUser = String(parsedQuery.get('user') || '').trim();
      } catch {}

      const versionQueryUnchanged = Boolean(
        viewer &&
        Number.isFinite(qSinceVersion) &&
        qSinceVersion === store.version &&
        qBootId &&
        qBootId === (store._bootId || '') &&
        qDateKey === todayKey &&
        qUser === viewer.username
      );

      if (matchesIfNoneMatch(req.headers?.['if-none-match'], stateEtag) || versionQueryUnchanged) {
        res.statusCode = 304;
        res.setHeader('ETag', stateEtag);
        res.setHeader('Cache-Control', 'private, no-cache');
        res.setHeader('Vary', 'Accept-Encoding, Cookie');
        res.end();
        return;
      }

      sendJsonResponse(res, 200, getSnapshotForViewer(store, viewer), req, {
        ETag: stateEtag,
        'Cache-Control': 'private, no-cache',
        Vary: 'Accept-Encoding, Cookie'
      });
      return;
    }

    if (req.method === 'GET' && reqUrl === '/stream') {
      if (pruneExpiredStoreChats(store, Date.now())) {
        onChanged?.(store);
        scheduleBroadcast(25);
      }
      if (viewer && recordUserLoginDay(store, viewer)) {
        store.version += 1;
        onChanged?.(store);
        scheduleBroadcast(50);
      }
      const todayKey = getVietnamDateKey(Date.now());
      let qLastVersion = NaN;
      let qBootId = '';
      let qDateKey = '';
      try {
        const parsedQuery = new URL(req.url || '/stream', 'http://localhost').searchParams;
        if (parsedQuery.has('lastVersion')) {
          qLastVersion = Number(parsedQuery.get('lastVersion'));
        }
        qBootId = String(parsedQuery.get('bootId') || '').trim();
        qDateKey = String(parsedQuery.get('dateKey') || '').trim();
      } catch {}

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      sseClients.add(res);
      const clientAlreadyCurrent = Boolean(
        viewer &&
        Number.isFinite(qLastVersion) &&
        qLastVersion === store.version &&
        qBootId &&
        qBootId === (store._bootId || '') &&
        qDateKey === todayKey
      );
      sseClientUsers.set(
        res,
        viewer
          ? {
              username: viewer.username,
              tokenVersion: viewer.tokenVersion || 1,
              sid: viewerPayload?.sid || '',
              lastSentVersion: store.version,
              lastSentDateKey: todayKey
            }
          : null
      );

      if (clientAlreadyCurrent) {
        res.write(
          `event: sync_ack\ndata: ${JSON.stringify({
            version: store.version,
            bootId: store._bootId || '',
            dateKey: todayKey,
            serverTime: Date.now()
          })}\n\n`
        );
      } else {
        res.write(`event: sync\ndata: ${JSON.stringify(getSnapshotForViewer(store, viewer))}\n\n`);
      }

      const keepAlive = setInterval(() => {
        try {
          res.write(': keepalive\n\n');
        } catch (_err) {
          clearInterval(keepAlive);
          sseClients.delete(res);
        }
      }, 25000);

      req.on('close', () => {
        clearInterval(keepAlive);
        sseClients.delete(res);
      });
      return;
    }

    if (req.method === 'POST' && reqUrl === '/action') {
      try {
        const body = await readJsonBody(req, MAX_SYNC_ACTION_BODY_BYTES);
        const authCheck = authorizeSyncAction(store, body.type, body.payload, viewer);
        if (!authCheck.allowed) {
          res.statusCode = authCheck.status || 403;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: authCheck.error || 'Không có quyền thực hiện.' }));
          return;
        }
        const changed = applySyncAction(store, body.type, body.payload, viewer);
        let activeViewer = viewer;
        if (changed) {
          if (body.type === 'RESET_USER_PASSWORD' && viewer) {
            const targetKey = findUserKeyInStore(store, body.payload?.username);
            if (targetKey) clearLoginLimitsForUsername(targetKey);
            if (targetKey && targetKey === viewer.username && store.users[targetKey]) {
              activeViewer = store.users[targetKey];
              refreshActiveSessionCookie(req, res, viewerPayload, activeViewer);
            }
          }
          if (IMMEDIATE_PERSIST_ACTIONS.has(body.type) && onFlush) {
            onFlush(store);
          } else {
            onChanged?.(store);
          }
          scheduleBroadcast(50);
        }
        sendJsonResponse(res, 200, { ok: true, snapshot: getSnapshotForViewer(store, activeViewer) }, req);
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: err?.message || 'Invalid request' }));
      }
      return;
    }

    next();
  });
}

export function lexiprepSyncPlugin({ persistFile = process.env.SYNC_STATE_FILE || '' } = {}) {
  const { store, schedulePersist, flushPersist, syncFromDiskIfNewer } = createPersistentSyncStore(persistFile);
  const sseClients = new Set();

  return {
    name: 'lexiprep-realtime-sync',
    configureServer(server) {
      attachSyncMiddleware(server.middlewares, store, sseClients, schedulePersist, { syncFromDiskIfNewer, onFlush: flushPersist });
      server.httpServer?.once('close', () => flushPersist());
    },
    configurePreviewServer(server) {
      attachSyncMiddleware(server.middlewares, store, sseClients, schedulePersist, { syncFromDiskIfNewer, onFlush: flushPersist });
      server.httpServer?.once('close', () => flushPersist());
    }
  };
}
