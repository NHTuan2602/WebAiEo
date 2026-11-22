// Structured 3-Part Speaking Daily & Forecast Zone Catalog & Helpers
// Part 1: 6 groups | Part 2: 4 groups | Part 3: 14 groups (+ dedicated Part 3 Random practice)
import { callGeminiGenerateJson } from '../utils/geminiGrader.js';

const PART_1_DEFAULT_GROUPS = [
  {
    id: 'p1_g1',
    name: 'Nhóm 1: Personal & Daily Life',
    folders: [
      {
        id: 'p1_g1_f1',
        name: 'Watches',
        questions: [
          { id: 'q_p1_w1', prompt: 'Did you wear a watch when you were a child? Why or why not?' },
          { id: 'q_p1_w2', prompt: 'Have you ever received a watch as a gift?' },
          { id: 'q_p1_w3', prompt: 'Do you usually wear a watch now? Why or why not?' },
          { id: 'q_p1_w4', prompt: 'Why do you think some people enjoy wearing expensive watches?' }
        ]
      },
      {
        id: 'p1_g1_f2',
        name: 'Morning routines',
        questions: [
          { id: 'q_p1_m1', prompt: 'What is your typical morning routine on weekdays?' },
          { id: 'q_p1_m2', prompt: 'Is breakfast important to you? Why?' },
          { id: 'q_p1_m3', prompt: 'Do you prefer to get up early or stay up late?' }
        ]
      }
    ]
  },
  { id: 'p1_g2', name: 'Nhóm 2: Work & Study', folders: [{ id: 'p1_g2_f1', name: 'Study & Major', questions: [{ id: 'q_p1_s1', prompt: 'What subjects are you studying right now?' }, { id: 'q_p1_s2', prompt: 'Why did you choose this subject or job?' }] }] },
  { id: 'p1_g3', name: 'Nhóm 3: Places & Hometown', folders: [{ id: 'p1_g3_f1', name: 'Parks', questions: [{ id: 'q_p1_pk1', prompt: 'Are public parks very important in your city?' }, { id: 'q_p1_pk2', prompt: 'What do people usually do when they visit a park?' }] }] },
  { id: 'p1_g4', name: 'Nhóm 4: Leisure & Hobbies', folders: [{ id: 'p1_g4_f1', name: 'Music & Art', questions: [{ id: 'q_p1_mu1', prompt: 'What kind of music do you enjoy listening to?' }, { id: 'q_p1_mu2', prompt: 'Have your musical tastes changed since childhood?' }] }] },
  { id: 'p1_g5', name: 'Nhóm 5: Technology & Media', folders: [{ id: 'p1_g5_f1', name: 'Websites & Social media', questions: [{ id: 'q_p1_sm1', prompt: 'Which websites or apps do you visit most often?' }, { id: 'q_p1_sm2', prompt: 'How do you stay in touch with friends online?' }] }] },
  { id: 'p1_g6', name: 'Nhóm 6: Objects & Shopping', folders: [{ id: 'p1_g6_f1', name: 'Clothes & Shopping', questions: [{ id: 'q_p1_sh1', prompt: 'Do you prefer shopping online or in physical stores?' }, { id: 'q_p1_sh2', prompt: 'What kind of clothes do you usually wear at weekends?' }] }] }
];

const PART_2_DEFAULT_GROUPS = [
  {
    id: 'p2_g1',
    name: 'Nhóm 1: People',
    folders: [
      {
        id: 'p2_g1_f1',
        name: 'An inspiring person',
        questions: [
          {
            id: 'q_p2_pe1',
            prompt: 'Describe a person who inspired you to do something interesting.',
            bullets: [
              'Who this person is',
              'How you knew this person',
              'What interesting thing you did',
              'And explain how he/she inspired you to do it'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'p2_g2',
    name: 'Nhóm 2: Places',
    folders: [
      {
        id: 'p2_g2_f1',
        name: 'A peaceful place',
        questions: [
          {
            id: 'q_p2_pl1',
            prompt: 'Describe a quiet place you like to go to.',
            bullets: [
              'Where it is',
              'How you knew it',
              'How often you go there',
              'And explain why you like this place'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'p2_g3',
    name: 'Nhóm 3: Objects & Media',
    folders: [
      {
        id: 'p2_g3_f1',
        name: 'A useful website or app',
        questions: [
          {
            id: 'q_p2_ob1',
            prompt: 'Describe a website or app that helps you a lot in your study or work.',
            bullets: [
              'What it is',
              'How you found out about it',
              'How you use it',
              'And explain why it is useful to you'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'p2_g4',
    name: 'Nhóm 4: Events & Experiences',
    folders: [
      {
        id: 'p2_g4_f1',
        name: 'A memorable trip',
        questions: [
          {
            id: 'q_p2_ev1',
            prompt: 'Describe a memorable journey you went on.',
            bullets: [
              'Where you went',
              'Who you went with',
              'What you did there',
              'And explain why this trip was memorable'
            ]
          }
        ]
      }
    ]
  }
];

const PART_3_GROUP_NAMES = [
  'Nhóm 1: Education & Learning',
  'Nhóm 2: Technology & AI',
  'Nhóm 3: Environment & Climate',
  'Nhóm 4: Work & Career',
  'Nhóm 5: Society & Community',
  'Nhóm 6: Family & Generations',
  'Nhóm 7: Health & Lifestyle',
  'Nhóm 8: Media & Communication',
  'Nhóm 9: Travel & Tourism',
  'Nhóm 10: Culture & Traditions',
  'Nhóm 11: Economy & Consumerism',
  'Nhóm 12: Law & Government',
  'Nhóm 13: Arts, Music & Creativity',
  'Nhóm 14: Science, Sports & Future'
];

const PART_3_SAMPLE_QUESTIONS = [
  'How has technology changed the way students learn compared to the past?',
  'Do you think artificial intelligence will replace more jobs in the near future?',
  'What can individuals and governments do together to reduce urban pollution?',
  'Why do some young people prefer freelancing over traditional office jobs?',
  'How can communities encourage stronger relationships between neighbors?',
  'In what ways do family values differ between older and younger generations?',
  'Should governments invest more in preventive healthcare or hospital infrastructure?',
  'How reliable is information shared on social media compared to traditional news?',
  'What are the positive and negative impacts of mass tourism on local towns?',
  'Why is it important to preserve traditional festivals in a modern globalized world?',
  'Why do people sometimes buy expensive brands even when cheaper options exist?',
  'What makes a public policy effective in changing citizens’ everyday habits?',
  'Should governments fund public museums and art programs with taxpayers’ money?',
  'How do international sporting events bring different countries closer together?'
];

const PART_3_DEFAULT_GROUPS = PART_3_GROUP_NAMES.map((name, idx) => ({
  id: `p3_g${idx + 1}`,
  name,
  folders: [
    {
      id: `p3_g${idx + 1}_f1`,
      name: name.replace(/^Nhóm\s+\d+:\s*/, ''),
      questions: [
        {
          id: `q_p3_g${idx + 1}_1`,
          prompt: PART_3_SAMPLE_QUESTIONS[idx] || `Discussion question for ${name}`
        }
      ]
    }
  ]
}));

function cloneZoneParts() {
  return {
    part1: JSON.parse(JSON.stringify(PART_1_DEFAULT_GROUPS)),
    part2: JSON.parse(JSON.stringify(PART_2_DEFAULT_GROUPS)),
    part3: JSON.parse(JSON.stringify(PART_3_DEFAULT_GROUPS))
  };
}

export function createDefaultSpeakingForecastBank() {
  return {
    periodLabel: 'Q3-2026',
    daily: cloneZoneParts(),
    forecast: cloneZoneParts()
  };
}

function normalizeQuestionList(rawList = [], fallbackPrefix = 'sq') {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter(q => q && typeof q.prompt === 'string' && q.prompt.trim())
    .map((q, idx) => ({
      id: String(q.id || `${fallbackPrefix}_${idx + 1}`).slice(0, 80),
      prompt: String(q.prompt || '').trim().slice(0, 1200),
      ...(Array.isArray(q.bullets) && q.bullets.length > 0
        ? { bullets: q.bullets.map(b => String(b || '').trim()).filter(Boolean).slice(0, 10) }
        : {}),
      ...(typeof q.hint === 'string' && q.hint.trim() ? { hint: q.hint.trim().slice(0, 500) } : {})
    }));
}

function normalizeGroupList(rawGroups, defaultGroups, partKey) {
  if (!Array.isArray(rawGroups) || rawGroups.length === 0) {
    return JSON.parse(JSON.stringify(defaultGroups));
  }
  return rawGroups
    .filter(g => g && typeof g === 'object')
    .slice(0, 40)
    .map((g, gIdx) => {
      const gId = String(g.id || `${partKey}_g${gIdx + 1}`).slice(0, 64);
      const rawFolders = Array.isArray(g.folders) ? g.folders : [];
      const folders = rawFolders
        .filter(f => f && typeof f === 'object')
        .slice(0, 60)
        .map((f, fIdx) => {
          const fId = String(f.id || `${gId}_f${fIdx + 1}`).slice(0, 64);
          return {
            id: fId,
            name: String(f.name || `Chủ đề ${fIdx + 1}`).trim().slice(0, 120) || `Chủ đề ${fIdx + 1}`,
            questions: normalizeQuestionList(f.questions, `${fId}_q`)
          };
        });
      return {
        id: gId,
        name: String(g.name || `Nhóm ${gIdx + 1}`).trim().slice(0, 120) || `Nhóm ${gIdx + 1}`,
        folders
      };
    });
}

export function normalizeSpeakingForecastBank(raw = null) {
  const defaults = createDefaultSpeakingForecastBank();
  if (!raw || typeof raw !== 'object') return defaults;
  const normZone = (zoneRaw, fallbackZone) => ({
    part1: normalizeGroupList(zoneRaw?.part1, fallbackZone.part1, 'p1'),
    part2: normalizeGroupList(zoneRaw?.part2, fallbackZone.part2, 'p2'),
    part3: normalizeGroupList(zoneRaw?.part3, fallbackZone.part3, 'p3')
  });
  return {
    periodLabel: String(raw.periodLabel || defaults.periodLabel).trim().slice(0, 40) || 'Q3-2026',
    daily: normZone(raw.daily, defaults.daily),
    forecast: normZone(raw.forecast, defaults.forecast)
  };
}

/**
 * Parse raw pasted text into Speaking questions.
 * Supports numbered questions, bullet lists, and Part 2 cue cards ("You should say:" + bullets).
 */
export function parsePastedSpeakingQuestions(rawText = '', partNumber = 1) {
  const clean = String(rawText || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  if (Number(partNumber) === 2) {
    // Split multiple cue cards by blank lines or "Topic:" / "Describe " blocks
    const blocks = clean
      .split(/\n{2,}(?=(?:Topic\s*:|Card\s*\d*|Describe\s+|\d+[.)]\s*Describe))/i)
      .map(b => b.trim())
      .filter(Boolean);

    const parsedCards = blocks.map((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const firstLine = (lines[0] || '').replace(/^(?:Topic\s*:|Card\s*\d*[:.\s]*|\d+[.)]\s*)/i, '').trim();
      const bullets = [];
      let inBullets = false;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^you should say\s*:?$/i.test(line)) {
          inBullets = true;
          continue;
        }
        if (inBullets || /^[•\-*–]\s+/.test(line)) {
          bullets.push(line.replace(/^[•\-*–]\s+/, '').trim());
        } else if (!firstLine) {
          // ignore
        } else {
          bullets.push(line);
        }
      }
      return {
        id: `sp2_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
        prompt: firstLine || lines[0] || 'Describe a memorable experience.',
        ...(bullets.length > 0 ? { bullets } : {})
      };
    }).filter(c => c.prompt);

    if (parsedCards.length > 0) return parsedCards;
  }

  // Part 1 & Part 3: one question per non-empty line, stripping leading numbers/bullets
  return clean
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => l.replace(/^(?:(?:q(?:uestion)?\s*)?\d+\s*[.):\-–]\s*|[•\-*–]\s+)/i, '').trim())
    .filter(l => l.length >= 4)
    .map((prompt, idx) => ({
      id: `sp${partNumber}_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
      prompt
    }));
}

/** Extract structured Speaking topics & questions directly from an uploaded PDF via Gemini AI. */
export async function extractSpeakingQuestionsFromPdf({
  apiKey = '',
  pdfDataUrl = '',
  partNumber = 1,
  groupName = ''
}) {
  if (!pdfDataUrl) throw new Error('Thiếu dữ liệu file PDF.');
  const partLabel = `IELTS Speaking Part ${partNumber}`;
  const promptText = `You are an IELTS Speaking syllabus extraction engine.
Extract ALL ${partLabel} topics and questions from the attached PDF${groupName ? ` (target group: ${groupName})` : ''}.
- Group related questions into clean topic folders (e.g. "Watches", "Parks", "Education").
- For Part 2 cue cards, put the main "Describe..." line in "prompt" and the "You should say" sub-points in "bullets" array.
- For Part 1 and Part 3, put each clean English question in "prompt" and leave "bullets" empty.
- Preserve every single question accurately without inventing extra commentary.

Return ONLY valid JSON:
{
  "folders": [
    {
      "name": "Topic name",
      "questions": [
        { "prompt": "Question text?", "bullets": [] }
      ]
    }
  ]
}`;

  const { parsed } = await callGeminiGenerateJson({
    apiKey,
    promptText,
    documents: [{ dataUrl: pdfDataUrl, mimeType: 'application/pdf' }],
    temperature: 0.1
  });

  const rawFolders = Array.isArray(parsed?.folders) ? parsed.folders : [];
  return rawFolders
    .filter(f => f && typeof f === 'object' && Array.isArray(f.questions) && f.questions.length > 0)
    .map((f, fIdx) => ({
      id: `pdf_f_${Date.now()}_${fIdx}_${Math.random().toString(36).slice(2, 5)}`,
      name: String(f.name || `Topic PDF #${fIdx + 1}`).trim().slice(0, 120),
      questions: normalizeQuestionList(f.questions, `pdf_q_${Date.now()}_${fIdx}`)
    }))
    .filter(f => f.questions.length > 0);
}

/** Build a transient Speaking test payload for relaxed Daily/Forecast practice inside SpeakingExamRoom. */
export function buildTransientSpeakingPracticeTest({
  id = '',
  title = 'Speaking Practice',
  partNumber = 1,
  topicName = '',
  questions = [],
  zone = 'forecast'
}) {
  const cleanQs = (Array.isArray(questions) ? questions : [])
    .filter(q => q && q.prompt)
    .map((q, idx) => ({
      id: q.id || `prac_q_${idx + 1}`,
      topic: q.topic || topicName || title,
      prompt: q.prompt,
      ...(Array.isArray(q.bullets) && q.bullets.length > 0 ? { bullets: q.bullets } : {}),
      ...(q.hint ? { hint: q.hint } : {}),
      speakSec: Number(partNumber) === 2 ? 120 : 60
    }));

  const pNum = Number(partNumber) || 1;
  return {
    id: id || `sp_zone_${zone}_p${pNum}_${Date.now()}`,
    title,
    testMode: 'single_skill',
    focusSkill: 'speaking',
    examPurpose: 'practice',
    maxAttempts: 0,
    speaking: {
      speakingTrack: zone === 'daily' ? 'daily' : 'general',
      isForecast: zone === 'forecast',
      hidePromptTextWhenAudio: false,
      noCountdown: true,
      allowRerecord: true,
      part1: pNum === 1 ? cleanQs : [],
      part2: pNum === 2 ? cleanQs : [],
      part3: pNum === 3 ? cleanQs : []
    }
  };
}
