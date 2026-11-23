// Official Cambridge IELTS Speaking Examiner lead-in scripts with per-test dynamic slot substitution.

export const DEFAULT_EXAMINER_SCRIPTS = {
  part1Intro:
    "Good morning. My name is IELTS Examiner. Can you tell me your full name, please? Thank you. Now, in this first part, I'd like to ask you some questions about yourself. Let's talk about {{part1_topic}}.",
  part1TopicBridge: "Now let's move on to talk about {{part1_topic}}.",
  part2Intro:
    "Now, I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. You can make some notes if you wish. Here is your topic. I'd like you to {{part2_title}}.",
  part2StartSpeaking:
    "All right? Remember you have one to two minutes for this, so don't worry if I stop you. I'll tell you when the time is up. Can you start speaking now, please?",
  part3Intro:
    "We've been talking about {{part2_title_noun}}, and I'd like to discuss with you one or two more general questions related to this. Let's consider first of all {{part3_topic}}.",
  closing: 'Thank you. That is the end of the speaking test.'
};

function cleanSlotText(raw, fallback) {
  const s = String(raw || '')
    .replace(/\s+/g, ' ')
    .replace(/[.?!:;,\s]+$/, '')
    .trim();
  return s || fallback;
}

/**
 * Formats a Part 2 cue card title/prompt so it flows naturally after
 * "I'd like you to ___" (e.g. "Describe a person..." -> "describe a person...").
 */
export function formatPart2ActionPhrase(rawTitleOrPrompt) {
  const cleaned = cleanSlotText(rawTitleOrPrompt, 'describe an interesting experience you have had');
  if (/^(describe|talk about|tell me about)\b/i.test(cleaned)) {
    return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }
  return `talk about ${cleaned}`;
}

/**
 * Formats a Part 2 cue card title/prompt as a noun phrase for Part 3's
 * "We've been talking about ___" bridge.
 */
export function formatPart2NounPhrase(rawTitleOrPrompt) {
  const cleaned = cleanSlotText(rawTitleOrPrompt, 'your topic');
  const stripped = cleaned
    .replace(/^(describe|talk about|tell me about)\s+/i, '')
    .trim();
  return stripped || cleaned;
}

/**
 * Interpolates `{{slot}}` tokens into both plain text and rich segments
 * so UI can highlight dynamically substituted parts (gạch chân tùy đề).
 */
export function interpolateExaminerTemplate(template, slots) {
  const raw = String(template || '').trim();
  if (!raw) return { text: '', segments: [] };
  const tokenRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const segments = [];
  let lastIdx = 0;
  let match;
  while ((match = tokenRegex.exec(raw)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ text: raw.slice(lastIdx, match.index), isDynamic: false });
    }
    const key = match[1];
    const replacement = String(slots[key] ?? '').trim();
    if (replacement) {
      segments.push({ text: replacement, isDynamic: true, slotKey: key });
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < raw.length) {
    segments.push({ text: raw.slice(lastIdx), isDynamic: false });
  }
  const text = segments.map(s => s.text).join('').replace(/\s+/g, ' ').trim();
  return { text, segments };
}

/**
 * Resolves the IELTS Examiner script spoken BEFORE reading the question prompt,
 * working identically for single Speaking tests (Daily / Forecast / Exam Room)
 * and full 4-skill Mock Tests / Thực Chiến.
 */
export function buildSpeakingExaminerLeadIn({
  item,
  index = 0,
  items = [],
  speakingCfg = {},
  candidateName = '',
  testTitle = ''
} = {}) {
  if (!item) {
    return {
      leadInText: '',
      leadInSegments: [],
      fullSpokenText: '',
      part2StartSpeakingText: DEFAULT_EXAMINER_SCRIPTS.part2StartSpeaking,
      introKind: 'none'
    };
  }

  const customScripts =
    speakingCfg?.examinerScripts && typeof speakingCfg.examinerScripts === 'object'
      ? speakingCfg.examinerScripts
      : {};
  const enabled = customScripts.enabled !== false;

  const part1TopicRaw =
    (item.part === 1 ? item.topic : '') ||
    speakingCfg?.part1?.topic ||
    testTitle ||
    'your daily life and interests';
  const part2Raw =
    speakingCfg?.part2?.cueCardTitle ||
    (item.part === 2 ? item.prompt : '') ||
    speakingCfg?.part2?.topic ||
    testTitle ||
    'a topic of interest';
  const part3TopicRaw =
    (item.part === 3 ? item.topic : '') ||
    speakingCfg?.part3?.topic ||
    part1TopicRaw ||
    'this topic';

  const slots = {
    candidate_name: cleanSlotText(candidateName, 'candidate'),
    part1_topic: cleanSlotText(part1TopicRaw, 'your daily life'),
    part2_title: formatPart2ActionPhrase(part2Raw),
    part2_title_noun: formatPart2NounPhrase(part2Raw),
    part3_topic: cleanSlotText(part3TopicRaw, 'this topic')
  };

  const prevItem = index > 0 ? items[index - 1] : null;
  const isFirstOfPart = !prevItem || prevItem.part !== item.part;
  const isPart1TopicShift =
    item.part === 1 &&
    prevItem?.part === 1 &&
    item.topic &&
    prevItem.topic &&
    String(item.topic).trim().toLowerCase() !== String(prevItem.topic).trim().toLowerCase();

  let template = '';
  let introKind = 'none';
  if (enabled) {
    if (item.part === 1 && isFirstOfPart) {
      template = String(customScripts.part1Intro || '').trim() || DEFAULT_EXAMINER_SCRIPTS.part1Intro;
      introKind = 'part1_intro';
    } else if (isPart1TopicShift) {
      template = String(customScripts.part1TopicBridge || '').trim() || DEFAULT_EXAMINER_SCRIPTS.part1TopicBridge;
      introKind = 'part1_topic_bridge';
    } else if (item.part === 2 && isFirstOfPart) {
      template = String(customScripts.part2Intro || '').trim() || DEFAULT_EXAMINER_SCRIPTS.part2Intro;
      introKind = 'part2_intro';
    } else if (item.part === 3 && isFirstOfPart) {
      template = String(customScripts.part3Intro || '').trim() || DEFAULT_EXAMINER_SCRIPTS.part3Intro;
      introKind = 'part3_intro';
    }
  }

  const interpolated = interpolateExaminerTemplate(template, slots);
  const part2StartSpeakingText = interpolateExaminerTemplate(
    String(customScripts.part2StartSpeaking || '').trim() || DEFAULT_EXAMINER_SCRIPTS.part2StartSpeaking,
    slots
  ).text;

  // Build full TTS speech text: examiner intro + actual question (without repeating Part 2 title twice)
  let questionSpeechBody = String(item.prompt || '').trim();
  if (item.part === 2) {
    const bullets = Array.isArray(item.bullets)
      ? item.bullets.map(b => String(b || '').trim()).filter(Boolean)
      : [];
    if (interpolated.text) {
      // Part 2 intro already spoke the cue card title via {{part2_title}}; add the "You should say" bullets next.
      questionSpeechBody = bullets.length > 0 ? `You should say: ${bullets.join('. ')}.` : '';
    } else if (bullets.length > 0) {
      questionSpeechBody = `${questionSpeechBody}. You should say: ${bullets.join('. ')}.`;
    }
  }

  const fullSpokenText = [interpolated.text, questionSpeechBody]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    leadInText: interpolated.text,
    leadInSegments: interpolated.segments,
    fullSpokenText,
    part2StartSpeakingText,
    introKind,
    slots
  };
}
