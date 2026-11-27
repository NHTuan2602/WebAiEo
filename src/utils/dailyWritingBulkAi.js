import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  DAILY_WRITING_T1_SUBCATEGORIES,
  DAILY_WRITING_T2_QUESTION_TYPES,
  DAILY_WRITING_T2_TOPICS,
  createEmptySingleSkillTestForm,
  normalizeTestHashtags
} from '../constants/seedData.js';
import { callGeminiGenerateJson } from './geminiGrader.js';
import { cropNormalizedBoxFromImage, normalizeVisionChartBox, readFileAsDataUrl } from './pdfImageCropper.js';
import { cleanEnglishTitleFromDocxFilename } from './wordImportHelpers.js';

let pdfJsModulePromise = null;

async function loadPdfJs() {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import('pdfjs-dist').then(mod => {
      if (mod?.GlobalWorkerOptions) {
        mod.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      }
      return mod;
    });
  }
  return pdfJsModulePromise;
}

const VALID_T1_SUBCAT_IDS = new Set(DAILY_WRITING_T1_SUBCATEGORIES.map(s => s.id));
const VALID_T2_TOPIC_IDS = new Set(DAILY_WRITING_T2_TOPICS.map(t => t.id));
const VALID_T2_QTYPE_IDS = new Set(DAILY_WRITING_T2_QUESTION_TYPES.map(q => q.id));

/**
 * Normalizes / compresses a browser image dataUrl so bulk uploads of 10-50 Task 1 charts
 * remain crisp yet lightweight (~150-350 KB each).
 */
export function compressVisualDataUrl(dataUrl, { maxWidth = 1400, quality = 0.88 } = {}) {
  return new Promise(resolve => {
    if (!dataUrl || typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(dataUrl || '');
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          resolve(dataUrl);
          return;
        }
        const scale = w > maxWidth ? maxWidth / w : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let out = canvas.toDataURL('image/jpeg', quality);
        if (out.length > dataUrl.length && dataUrl.length < 900_000) {
          out = dataUrl;
        }
        resolve(out);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Reconstructs clean visual lines from pdfjs page.getTextContent() using Y-coordinate grouping.
 */
function reconstructLinesFromTextContent(textContent) {
  const items = Array.isArray(textContent?.items) ? textContent.items : [];
  if (items.length === 0) return [];

  const positioned = items
    .map(item => {
      const str = String(item?.str ?? '');
      if (!str) return null;
      const tr = Array.isArray(item?.transform) ? item.transform : [1, 0, 0, 1, 0, 0];
      return {
        str,
        x: Number(tr[4]) || 0,
        y: Number(tr[5]) || 0,
        hasEOL: Boolean(item?.hasEOL)
      };
    })
    .filter(Boolean);

  if (positioned.length === 0) return [];

  const rows = [];
  let currentRow = [];
  let lastY = null;

  for (const tok of positioned) {
    if (lastY !== null && Math.abs(tok.y - lastY) > 4.2) {
      rows.push(currentRow);
      currentRow = [];
    }
    currentRow.push(tok);
    lastY = tok.y;
    if (tok.hasEOL) {
      rows.push(currentRow);
      currentRow = [];
      lastY = null;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return rows
    .map(row => {
      const sorted = [...row].sort((a, b) => a.x - b.x);
      let line = '';
      for (let i = 0; i < sorted.length; i += 1) {
        const piece = sorted[i].str;
        if (i > 0 && line && !/\s$/.test(line) && !/^\s/.test(piece)) {
          const gap = sorted[i].x - sorted[i - 1].x;
          if (gap > 3) line += ' ';
        }
        line += piece;
      }
      return line.replace(/\uFFFD/g, '-').replace(/\s+/g, ' ').trim();
    })
    .filter(Boolean);
}

/**
 * Extracts structured text lines from ALL pages of a PDF file in milliseconds.
 */
export async function extractPdfTextAndPageCount(pdfFile, { onProgress = null } = {}) {
  const pdfjs = await loadPdfJs();
  const buf = await pdfFile.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) });
  const pdfDoc = await loadingTask.promise;
  try {
    const numPages = Math.max(1, Number(pdfDoc.numPages) || 1);
    const pageTexts = [];
    let totalChars = 0;

    for (let p = 1; p <= numPages; p += 1) {
      const page = await pdfDoc.getPage(p);
      const tc = await page.getTextContent();
      const lines = reconstructLinesFromTextContent(tc);
      const joined = lines.join('\n');
      totalChars += joined.length;
      pageTexts.push({ pageNumber: p, lines, text: joined });
      if (onProgress && (p % 5 === 0 || p === numPages)) {
        onProgress({ donePages: p, totalPages: numPages });
      }
    }

    return {
      numPages,
      totalChars,
      fullText: pageTexts.map(pt => pt.text).join('\n'),
      pageTexts
    };
  } finally {
    try {
      await pdfDoc.destroy();
    } catch {
      // ignore
    }
  }
}

/**
 * Renders every page (or selected page range) of a PDF file into crisp JPEG images
 * for Task 1 chart extraction or scanned PDF OCR.
 */
export async function renderPdfPagesToImages(
  pdfFile,
  { scale = 1.85, maxPages = 120, onProgress = null, signal = null } = {}
) {
  const pdfjs = await loadPdfJs();
  const buf = await pdfFile.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) });
  const pdfDoc = await loadingTask.promise;
  try {
    const totalPages = Math.min(maxPages, Math.max(1, Number(pdfDoc.numPages) || 1));
    const renderedPages = [];

    for (let p = 1; p <= totalPages; p += 1) {
      if (signal?.aborted) throw new Error('Đã hủy tác vụ theo yêu cầu.');
      const page = await pdfDoc.getPage(p);
      const viewport = page.getViewport({ scale });
      const maxWidth = 1450;
      const effectiveScale = viewport.width > maxWidth ? scale * (maxWidth / viewport.width) : scale;
      const finalViewport = effectiveScale !== scale ? page.getViewport({ scale: effectiveScale }) : viewport;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(finalViewport.width));
      canvas.height = Math.max(1, Math.round(finalViewport.height));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: finalViewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        renderedPages.push({
          pageNumber: p,
          totalPages,
          dataUrl,
          width: canvas.width,
          height: canvas.height
        });
      }
      onProgress?.({ donePages: p, totalPages });
    }
    return renderedPages;
  } finally {
    try {
      await pdfDoc.destroy();
    } catch {
      // ignore
    }
  }
}

/**
 * Cleans an individual Task 2 prompt string (fixing PDF ligatures, stray slashes, spacing).
 */
export function cleanTask2PromptText(rawPrompt = '') {
  let text = String(rawPrompt || '')
    .replace(/\r\n/g, '\n')
    .replace(/[\uFFFD\u00AD]/g, '-')
    .replace(/face-\s*to-\s*face/gi, 'face-to-face')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Remove leading numbering like "1." or "329)" or "Question 12:"
  text = text.replace(/^(?:question|prompt|topic|câu|đề)?\s*\d{1,4}\s*[.):\-–]\s*/i, '').trim();

  // If a prompt contains "//" separating duplicate/alternate phrasings (common in forecast compilations),
  // keep the primary complete IELTS prompt if the first half is already >= 55 chars and ends with ? or .
  if (text.includes('//')) {
    const parts = text
      .split(/\s*\/\/+\s*/)
      .map(s => s.trim())
      .filter(Boolean);
    if (parts.length >= 2 && parts[0].length >= 55) {
      text = parts[0];
    } else {
      text = parts.join(' / ');
    }
  }

  // Capitalize first letter if lowercase (e.g. "162. people nowadays..." -> "People nowadays...")
  if (/^[a-z]/.test(text)) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return text;
}

/**
 * Parses 1 to 1,000+ IELTS Writing Task 2 prompts out of raw PDF text or pasted text,
 * accurately stitching multi-line prompts wrapped across PDF page breaks and filtering stray notes.
 */
export function parseTask2PromptsFromRawText(rawText = '') {
  const lines = String(rawText || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => {
      if (!l) return false;
      if (l === '\\' || l === '/' || l === '-') return false;
      // Ignore standalone page numbers like "1", "Page 12", "12 / 34", "- 5 -"
      if (/^(?:page\s*)?\d{1,3}(?:\s*(?:\/|of)\s*\d{1,3})?$/i.test(l)) return false;
      if (/^-\s*\d{1,3}\s*-$/.test(l)) return false;
      // Ignore standalone vocabulary notes with arrow "=>" (e.g. "pass a tipping point => render any remedial action futile")
      if (l.includes('=>') && !/^\d{1,4}\s*[.)]/.test(l)) return false;
      return true;
    });

  if (lines.length === 0) return [];

  const numberedStartRegex = /^(\d{1,4})\s*[.)]\s*(.+)$/;
  const numberedHits = lines.filter(l => numberedStartRegex.test(l)).length;

  // Mode A: Numbered compilation (e.g. 1..350 IELTS Task 2 questions across 34 pages)
  if (numberedHits >= 2) {
    const items = [];
    let current = null;

    for (const line of lines) {
      const m = line.match(numberedStartRegex);
      if (m) {
        const num = Number(m[1]);
        const rest = m[2].trim();
        // Guard against false-positive year/decimal at start of wrapped line unless sequential/plausible
        const isPlausibleNextNumber =
          !current ||
          (num > 0 && num <= 2500 && (num >= current.number || num === 1 || Math.abs(num - current.number) <= 20));
        if (isPlausibleNextNumber && rest.length >= 4) {
          if (current) items.push(current);
          current = { number: num, parts: [rest] };
          continue;
        }
      }
      if (current) {
        current.parts.push(line);
      }
    }
    if (current) items.push(current);

    return items
      .map(it => ({
        sourceNumber: it.number,
        prompt: cleanTask2PromptText(it.parts.join(' '))
      }))
      .filter(it => it.prompt.split(/\s+/).length >= 6);
  }

  // Mode B: Unnumbered paragraphs / bulleted list
  const rawParagraphs = String(rawText || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(b => b.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);

  if (rawParagraphs.length >= 2) {
    return rawParagraphs
      .map((p, idx) => ({
        sourceNumber: idx + 1,
        prompt: cleanTask2PromptText(p)
      }))
      .filter(it => it.prompt.split(/\s+/).length >= 6);
  }

  // Single block fallback: split after question prompts ("Agree or disagree?", "give your own opinion.", etc.)
  const splitByEndings = String(rawText || '')
    .replace(/\r\n/g, '\n')
    .split(
      /(?<=(?:agree\s*(?:or|\/|hay)\s*disagree\??|give\s+your\s+(?:own\s+)?opinions?\.?|outweigh\s+(?:the\s+|its\s+)?(?:disadvantages|drawbacks|advantages|problems)\??|positive\s+(?:or|and|hay)\s+negative\s+(?:development|trend|characteristic|impact|situation|one)\??|(?:reasons|causes)\s*(?:and|\+)\s*(?:solutions|measures)\??))\s+/i
    )
    .map(s => cleanTask2PromptText(s))
    .filter(s => s.split(/\s+/).length >= 6);

  return splitByEndings.map((prompt, idx) => ({
    sourceNumber: idx + 1,
    prompt
  }));
}

/**
 * Deterministic IELTS Task 2 Question Type classifier (used as instant baseline & fallback).
 */
export function detectTask2QuestionTypeFallback(prompt = '') {
  const lower = String(prompt || '').toLowerCase();

  if (/\bdiscuss\s+both\s+(?:these\s+|the\s+)?(?:views?|sides?)\b|\bdiscuss\s*&\s*state\s+your\s+opinion\b/.test(lower)) {
    return 'both_views';
  }
  if (
    /\b(?:advantages?|benefits?)\b[\s\S]{0,60}\b(?:disadvantages?|drawbacks?|problems?)\b|\b(?:disadvantages?|drawbacks?)\b[\s\S]{0,60}\b(?:advantages?|benefits?)\b/.test(
      lower
    )
  ) {
    // Check if it ALSO asks "Why is this happening?" -> still classified under pros_cons or two_questions;
    // If pure advantages/disadvantages or outweigh -> pros_cons
    if (/\bwhy\b/.test(lower) && /\?.*\?/.test(lower)) {
      return 'two_questions';
    }
    return 'pros_cons';
  }
  if (/\bpositive\s*(?:or|and|\/|hay|\? or)\s*negative\b/.test(lower)) {
    if (/\b(?:why|what\s+are\s+the\s+reasons|how\s+do\s+you\s+think)\b/.test(lower) && (lower.match(/\?/g) || []).length >= 2) {
      return 'two_questions';
    }
    return 'pros_cons';
  }
  if (
    /\b(?:causes?|reasons?|problems?)\b[\s\S]{0,80}\b(?:solutions?|measures?|can\s+be\s+done|solve|address|encourage|effects?)\b/.test(
      lower
    ) &&
    !/\bagree\b/.test(lower)
  ) {
    return 'reason_problem_solution';
  }
  if (/\b(?:agree|disagree)\b|\bto\s+what\s+extent\s+do\s+you\s+agree\b/.test(lower)) {
    return 'agree_disagree';
  }
  if ((lower.match(/\?/g) || []).length >= 2) {
    return 'two_questions';
  }
  return 'agree_disagree';
}

const TOPIC_KEYWORD_RULES = [
  { id: 'space_exploration', rx: /\b(space exploration|mars|other planets|intelligent life|astronaut|outer space|universe)\b/i },
  { id: 'animals_wildlife_conservation', rx: /\b(wild animals|animal species|extinct|wildlife|dinosaurs|exploiting animals|zoo|endangered)\b/i },
  { id: 'crime_law_military', rx: /\b(crime|criminals|prison|ex-prisoners|punish|lawbreakers|robbery|police|legal system|military|army)\b/i },
  { id: 'art_music', rx: /\b(artists|painters|musicians|poets|art classes|painting|drawing|poetry|works of art)\b/i },
  { id: 'history_museums_heritage', rx: /\b(museum|art galleries|historical objects|local history|world history|family history|previous generations|heritage)\b/i },
  { id: 'language_communication', rx: /\b(foreign language|new language|english as a global language|invent a new language|written texts|write by hand|handwriting)\b/i },
  { id: 'architecture_housing', rx: /\b(free housing|shortage of housing|build more housing|vertical city|horizontal city|tall buildings|apartments|homes in specific areas)\b/i },
  { id: 'food_agriculture', rx: /\b(food|junk food|fast food|fruits? and vegetables|imported food|local food|nutrition|nutritious|diet|farm)\b/i },
  { id: 'transport', rx: /\b(bicycle|cyclist|road safety|driving test|cars|motorcycles|public transport|air travel|traffic|congestion tax|vehicle-free|fuel)\b/i },
  { id: 'environment_energy', rx: /\b(climate change|environmental|pollution|recycling|household waste|natural resources|fossil fuels|wind and solar|fresh water|freshwater|plant trees)\b/i },
  { id: 'news_media_advertising', rx: /\b(advertis|newspapers|news reports|good news|media|television|tv programmes|films and movies|celebrities|social media)\b/i },
  { id: 'sport_leisure', rx: /\b(sport|athletes|football|tennis|extreme sports|sky diving|sporting events|team sports|video games|electronic games|computer games|free-time activities)\b/i },
  { id: 'tourism_culture', rx: /\b(tourist|organized tours|travel to other countries|traveling more|customs and traditions|traditional ways|single world culture|foreign movies)\b/i },
  { id: 'consumerism_materialism', rx: /\b(consumer goods|shops open|out-of-town stores|credit card|fashion and consumer|spending large amount of money|cosmetic surgery|plastic surgery)\b/i },
  { id: 'technology_science', rx: /\b(robots|artificial intelligence|computers|internet|mobile phones|technology|scientific research|inventions)\b/i },
  { id: 'globalization_international_relations', rx: /\b(multinational|globalization|international cooperation|developing countries|charity organizations|global issues|between countries)\b/i },
  { id: 'government_funding_public_services', rx: /\b(public money|government should fund|public libraries|public services|hospitals, schools and public services|tax)\b/i },
  { id: 'family_parents_children', rx: /\b(parents|fathers|mothers|parenting|child's development|children|elderly|retire|old people|older people|live alone|family)\b/i },
  { id: 'work_employment', rx: /\b(employers|employees|working hours|working days|salaries|salary|change jobs|careers|interviews|unemployed|senior management|work hard)\b/i },
  { id: 'economy_business', rx: /\b(economic|wealth|rich|businesses|social responsibilities|make more sales|factories)\b/i },
  { id: 'city_urbanization', rx: /\b(mega-cities|large cities|big cities|countryside|city centres|population of many cities|urban)\b/i },
  { id: 'health_lifestyle', rx: /\b(healthy lifestyle|health|obesity|overweight|exercise|medical care|healthcare|illness)\b/i },
  { id: 'education', rx: /\b(school|university|students|tuition|teachers|subjects|libraries|academic|vocational training|educate)\b/i },
  { id: 'social_issues_demographics_psychology', rx: /\b(anti-social|peer pressure|ambition|competitiveness|luck|ideal society|happier society|happiness|getting old|under the age of 15)\b/i }
];

export function detectTask2TopicFallback(prompt = '') {
  const text = String(prompt || '');
  for (const rule of TOPIC_KEYWORD_RULES) {
    if (rule.rx.test(text)) return rule.id;
  }
  return 'social_issues_demographics_psychology';
}

/**
 * Deterministic fallback that turns an IELTS Task 2 prompt into a clean academic noun-phrase title
 * when AI is unavailable or omits an item.
 */
export function buildFallbackNounPhraseTitle(prompt = '') {
  const clean = cleanTask2PromptText(prompt);
  // Strip trailing instruction sentences ("To what extent...", "Discuss both views...", "Do you agree...", etc.)
  const coreStatement = clean
    .replace(
      /\s*(?:To what extent[^?]*\??|Do you (?:agree|think|believe)[^?]*\??|Discuss both[^.]*\.?|What are the (?:causes|reasons|problems|advantages|effects)[^?]*\??|Why is this[^?]*\??|What can be done[^?]*\??|Agree\s*(?:or|\/|hay)\s*disagree\??|Is this a positive[^?]*\??|Reasons\?\s*Solutions\??|Causes\s*\+\s*Solutions\.?)+$/gi,
      ''
    )
    .trim();

  const firstSentence = (coreStatement.split(/(?<=[.!?])\s+/)[0] || clean)
    .replace(/[.!?]+$/, '')
    .trim();

  // Strip generic framing clauses ("Some people think/believe/argue that...", "In many countries, ...", "Nowadays, ...")
  let body = firstSentence
    .replace(
      /^(?:Nowadays,?\s*|Today,?\s*|In recent years,?\s*|In many (?:countries|cities|parts of the world),?\s*|In some (?:countries|societies|cities),?\s*|It is (?:argued|believed|suggested|often said) that\s*|Some (?:people|experts|scientists) (?:think|believe|argue|say|state|claim) (?:that\s*)?|Many people (?:believe|think|say) (?:that\s*)?)+/i,
      ''
    )
    .trim();

  // Convert common modal "X should be Y" / "X should do Y" into nominal phrase "The necessity of..." or noun-led phrase
  const modalShouldMatch = body.match(/^([a-z0-9\s,'-]+?)\s+should\s+(?:not\s+)?be\s+([a-z]+ed)\b(.*)$/i);
  if (modalShouldMatch) {
    const subj = modalShouldMatch[1].trim();
    const pp = modalShouldMatch[2].trim();
    const tail = modalShouldMatch[3].trim();
    body = `The policy of having ${subj.toLowerCase()} ${pp.toLowerCase()} ${tail}`.replace(/\s+/g, ' ').trim();
  } else if (/^everyone should stay at school until the age of 18/i.test(body)) {
    body = 'The enforcement of compulsory education until the age of eighteen';
  } else if (/^[a-z0-9\s,'-]+?\s+should\s+/i.test(body)) {
    const m2 = body.match(/^([a-z0-9\s,'-]+?)\s+should\s+(not\s+)?([a-z]+)\b(.*)$/i);
    if (m2) {
      const verb = m2[3].toLowerCase();
      const gerund =
        verb.endsWith('e') && !verb.endsWith('ee')
          ? `${verb.slice(0, -1)}ing`
          : `${verb}ing`;
      const neg = m2[2] ? 'avoiding ' : '';
      body = `The practice of ${m2[1].trim().toLowerCase()} ${neg}${gerund}${m2[4] || ''}`.replace(/\s+/g, ' ').trim();
    }
  } else if (!/^(?:the|a|an|[a-z]+ing)\b/i.test(body)) {
    body = `The issue of ${body.charAt(0).toLowerCase()}${body.slice(1)}`;
  }

  const words = body.split(/\s+/).filter(Boolean);
  const clipped = words.length > 14 ? words.slice(0, 14).join(' ').replace(/[,:;]+$/, '') : words.join(' ');
  if (!clipped) return 'Academic essay topic in IELTS Writing Task 2';
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

export function normalizeNounPhraseTitle(rawTitle = '', fallbackPrompt = '') {
  let t = String(rawTitle || '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/^(?:Task\s*[12]\s*[:\-–]\s*|Topic\s*[:\-–]\s*)/i, '')
    .replace(/[.!?]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!t || t.length < 4) {
    return buildFallbackNounPhraseTitle(fallbackPrompt);
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Calls Gemini AI on a chunk of ~35 Task 2 prompts to classify Topic + Question Type
 * and generate an academic English noun-phrase title for each prompt.
 */
async function classifyTask2ChunkWithAi(chunkItems, { apiKey }) {
  const topicSpec = DAILY_WRITING_T2_TOPICS.map(t => `${t.id} (${t.label})`).join(', ');
  const qTypeSpec = DAILY_WRITING_T2_QUESTION_TYPES.map(q => `${q.id} (${q.label})`).join(', ');

  const payloadLines = chunkItems.map((it, idx) => `${idx}: ${it.prompt}`).join('\n');

  const promptText = `You are a Senior Cambridge IELTS Writing Task 2 Curriculum Designer.
Classify EVERY IELTS Writing Task 2 prompt below and generate an academic English NOUN-PHRASE title for each one.

ALLOWED "topic" IDs (pick EXACTLY ONE id from this list):
${topicSpec}

ALLOWED "type" IDs (pick EXACTLY ONE id from this list):
- agree_disagree : Opinion / Agree or Disagree ("To what extent do you agree or disagree?", "Do you agree or disagree?")
- both_views : Discussion + Opinion ("Discuss both views and give your opinion")
- pros_cons : Advantages & Disadvantages OR Positive / Negative Development ("Do the advantages outweigh the disadvantages?", "What are the advantages and disadvantages?", "Is this a positive or negative development?")
- reason_problem_solution : Causes / Problems & Solutions ("Why is this happening? What measures/solutions can be taken?", "Causes and solutions")
- two_questions : Two-Part / Direct Questions (two distinct analytical questions that are NOT pure cause+solution, e.g. "Why has this happened? Is this a positive or negative development?" or "What are the reasons? Are arts as important as science?")
(${qTypeSpec})

STRICT RULE FOR "title" (NOUN PHRASE ONLY):
- Must be a concise, natural C1/C2 academic English NOUN PHRASE (6–13 words) built around the core head nouns / nominalized theme of the prompt.
- Sentence case (capitalize ONLY the first word and proper nouns like Internet, Earth, Mars, English).
- NO finite sentences, NO question marks, NO periods at the end, NO numbering, NO "Task 2:" prefix!
- Examples of exact desired style:
  * Prompt: "Everyone should stay at school until the age of 18. Agree/disagree?"
    -> "title": "The enforcement of compulsory education until the age of eighteen", "topic": "education", "type": "agree_disagree"
  * Prompt: "In many countries, people are choosing other means of transport rather than bicycles. Why is this happening? What can be done to encourage people to use bicycles more often?"
    -> "title": "The decline in bicycle usage and promotion of urban cycling", "topic": "transport", "type": "reason_problem_solution"
  * Prompt: "Some people think that the government should provide assistance to all kinds of artists, including painters, musicians and poets. However, other people think that this is a waste of money. Discuss both views and give your own opinion."
    -> "title": "Government financial assistance for painters, musicians and poets", "topic": "art_music", "type": "both_views"

INPUT PROMPTS (${chunkItems.length} items, indexed 0..${chunkItems.length - 1}):
${payloadLines}

Return ONLY valid JSON with key "items" containing ${chunkItems.length} objects:
{
  "items": [
    { "i": 0, "title": "...", "topic": "education", "type": "agree_disagree" }
  ]
}`;

  const { parsed, usedModel } = await callGeminiGenerateJson({
    apiKey,
    promptText,
    temperature: 0.1
  });

  const arr = Array.isArray(parsed?.items) ? parsed.items : [];
  const byIdx = new Map();
  arr.forEach((row, pos) => {
    const idx = Number.isFinite(Number(row?.i)) ? Number(row.i) : pos;
    byIdx.set(idx, row);
  });

  return {
    usedModel,
    results: chunkItems.map((orig, idx) => {
      const hit = byIdx.get(idx) || {};
      const rawTopic = String(hit.topic || '').trim();
      const rawType = String(hit.type || '').trim();
      return {
        ...orig,
        title: normalizeNounPhraseTitle(hit.title, orig.prompt),
        writingTask2Topic: VALID_T2_TOPIC_IDS.has(rawTopic)
          ? rawTopic
          : detectTask2TopicFallback(orig.prompt),
        writingTask2QuestionType: VALID_T2_QTYPE_IDS.has(rawType)
          ? rawType
          : detectTask2QuestionTypeFallback(orig.prompt),
        aiClassified: Boolean(hit.title)
      };
    })
  };
}

/**
 * OCRs a scanned (image-only) PDF for Task 2 prompts in small page batches via Gemini Vision.
 */
async function extractScannedPdfTask2PromptsWithVision(pdfFile, { apiKey, onProgress, signal }) {
  const renderedPages = await renderPdfPagesToImages(pdfFile, {
    scale: 1.65,
    maxPages: 80,
    signal,
    onProgress: ({ donePages, totalPages }) => {
      onProgress?.({
        phase: 'ocr',
        done: donePages,
        total: totalPages,
        message: `Đang quét ảnh trang PDF (${donePages}/${totalPages})...`
      });
    }
  });

  const allPrompts = [];
  const pageBatchSize = 4;
  for (let i = 0; i < renderedPages.length; i += pageBatchSize) {
    if (signal?.aborted) throw new Error('Đã hủy tác vụ theo yêu cầu.');
    const slice = renderedPages.slice(i, i + pageBatchSize);
    const promptText = `Transcribe ALL IELTS Writing Task 2 essay prompts visible on these ${slice.length} page(s).
Preserve complete wording of each prompt. Merge lines belonging to the same prompt. Ignore page headers/footers.
Return ONLY valid JSON:
{
  "prompts": [
    "Full Task 2 essay prompt 1...",
    "Full Task 2 essay prompt 2..."
  ]
}`;
    const { parsed } = await callGeminiGenerateJson({
      apiKey,
      promptText,
      images: slice.map(p => p.dataUrl),
      temperature: 0.1
    });
    const list = Array.isArray(parsed?.prompts) ? parsed.prompts : [];
    list.forEach(p => {
      const cleaned = cleanTask2PromptText(p);
      if (cleaned.split(/\s+/).length >= 6) {
        allPrompts.push({
          sourceNumber: allPrompts.length + 1,
          prompt: cleaned
        });
      }
    });
  }

  return allPrompts;
}

/**
 * Full Bulk Task 2 AI Pipeline:
 * Supports 350+ prompts in PDF(s) and/or pasted raw text, classifies Topic + Question Type,
 * and names every test using an academic noun phrase.
 */
export async function runBulkTask2AiPipeline({
  pdfFiles = [],
  docxItems = [],
  rawPastedText = '',
  apiKey = '',
  aiConfigured = false,
  useAi = true,
  onProgress = null,
  signal = null
}) {
  const rawChunks = [];
  const hasAiAccess = Boolean(useAi && (String(apiKey || '').trim() || aiConfigured));

  // 0. Extract prompts from uploaded Word (.docx) files (direct or unpacked from .zip)
  for (let dIdx = 0; dIdx < docxItems.length; dIdx += 1) {
    if (signal?.aborted) throw new Error('Đã hủy tác vụ theo yêu cầu.');
    const doc = docxItems[dIdx];
    const docText = String(doc?.rawText || '').trim();
    if (!docText) continue;
    const parsedFromDoc = parseTask2PromptsFromRawText(docText);
    if (parsedFromDoc.length > 0) {
      rawChunks.push(...parsedFromDoc);
    } else {
      // Single unnumbered prompt inside a single .docx file
      const cleaned = cleanTask2PromptText(docText.split(/\n{2,}/).slice(0, 2).join(' '));
      if (cleaned.split(/\s+/).length >= 8) {
        rawChunks.push({
          sourceNumber: rawChunks.length + 1,
          prompt: cleaned
        });
      }
    }
  }

  // 1. Extract prompts from all uploaded PDFs
  for (let fIdx = 0; fIdx < pdfFiles.length; fIdx += 1) {
    if (signal?.aborted) throw new Error('Đã hủy tác vụ theo yêu cầu.');
    const file = pdfFiles[fIdx];
    onProgress?.({
      phase: 'pdf',
      done: fIdx,
      total: pdfFiles.length,
      message: `Đang đọc file PDF "${file.name}"...`
    });

    const extracted = await extractPdfTextAndPageCount(file, {
      onProgress: ({ donePages, totalPages }) => {
        onProgress?.({
          phase: 'pdf',
          done: donePages,
          total: totalPages,
          message: `Đang đọc văn bản PDF "${file.name}" (trang ${donePages}/${totalPages})...`
        });
      }
    });

    const parsedFromText = parseTask2PromptsFromRawText(extracted.fullText);
    if (parsedFromText.length > 0) {
      rawChunks.push(...parsedFromText);
    } else if (hasAiAccess) {
      // Scanned image PDF -> OCR via Gemini Vision
      const scannedPrompts = await extractScannedPdfTask2PromptsWithVision(file, {
        apiKey,
        onProgress,
        signal
      });
      rawChunks.push(...scannedPrompts);
    }
  }

  // 2. Append any prompts from pasted raw text
  if (String(rawPastedText || '').trim()) {
    const pastedItems = parseTask2PromptsFromRawText(rawPastedText);
    rawChunks.push(...pastedItems);
  }

  // Deduplicate exact identical normalized prompt strings while keeping order
  const seenPrompts = new Set();
  const uniquePrompts = [];
  rawChunks.forEach((item, idx) => {
    const key = item.prompt.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!key || seenPrompts.has(key)) return;
    seenPrompts.add(key);
    uniquePrompts.push({
      id: `w2_draft_${Date.now()}_${idx}`,
      sourceNumber: item.sourceNumber || uniquePrompts.length + 1,
      prompt: item.prompt
    });
  });

  if (uniquePrompts.length === 0) {
    throw new Error('Không tìm thấy câu hỏi Writing Task 2 nào trong file Word / PDF / văn bản đã tải lên.');
  }

  // 3. Classify & Name in parallel batches of 35 so 350+ prompts complete quickly without token truncation!
  const CHUNK_SIZE = 35;
  const CONCURRENCY = 2;
  const batches = [];
  for (let i = 0; i < uniquePrompts.length; i += CHUNK_SIZE) {
    batches.push({
      startIndex: i,
      items: uniquePrompts.slice(i, i + CHUNK_SIZE)
    });
  }

  const finalResults = new Array(uniquePrompts.length);
  let completedItems = 0;
  let usedModelName = hasAiAccess ? 'gemini' : 'smart-local-classifier';
  const warnings = [];

  onProgress?.({
    phase: 'ai',
    done: 0,
    total: uniquePrompts.length,
    message: hasAiAccess
      ? `AI đang đọc, phân loại Chủ đề · Dạng bài & Đặt tên danh từ cho ${uniquePrompts.length} đề Task 2...`
      : `Đang phân loại nhanh ${uniquePrompts.length} đề Task 2...`
  });

  let cursor = 0;
  const worker = async () => {
    while (cursor < batches.length) {
      if (signal?.aborted) throw new Error('Đã hủy tác vụ theo yêu cầu.');
      const myBatchIdx = cursor;
      cursor += 1;
      const batch = batches[myBatchIdx];

      let processedSlice = null;
      if (hasAiAccess) {
        try {
          const aiRes = await classifyTask2ChunkWithAi(batch.items, { apiKey });
          if (aiRes.usedModel) usedModelName = aiRes.usedModel;
          processedSlice = aiRes.results;
        } catch (err) {
          warnings.push(
            `Nhóm câu ${batch.startIndex + 1}–${batch.startIndex + batch.items.length}: chuyển sang bộ phân loại dự phòng (${err?.message || 'lỗi mạng'}).`
          );
        }
      }

      if (!processedSlice) {
        processedSlice = batch.items.map(orig => ({
          ...orig,
          title: buildFallbackNounPhraseTitle(orig.prompt),
          writingTask2Topic: detectTask2TopicFallback(orig.prompt),
          writingTask2QuestionType: detectTask2QuestionTypeFallback(orig.prompt),
          aiClassified: false
        }));
      }

      processedSlice.forEach((item, offset) => {
        finalResults[batch.startIndex + offset] = {
          ...item,
          selected: true
        };
      });

      completedItems += batch.items.length;
      onProgress?.({
        phase: 'ai',
        done: Math.min(completedItems, uniquePrompts.length),
        total: uniquePrompts.length,
        message: `Đã xử lý ${Math.min(completedItems, uniquePrompts.length)} / ${uniquePrompts.length} đề Task 2...`
      });
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, batches.length) }, () => worker())
  );

  return {
    items: finalResults.filter(Boolean),
    usedModel: usedModelName,
    warnings
  };
}

/**
 * Analyzes a single Task 1 image / PDF page with Gemini Vision:
 * - Extracts exact Task 1 prompt (or composes standard Cambridge Task 1 prompt if image is chart-only)
 * - Generates an academic noun-phrase title based on the chart's nouns
 * - Crops chart cleanly if surrounding exam text is present
 * - Classifies chart folder (Map / Process / Dynamic / Static) when in 'auto' mode
 */
async function analyzeSingleTask1VisualWithAi(visualItem, { apiKey, targetSubCategory }) {
  const promptText = `You are a Senior Cambridge IELTS Academic Writing Task 1 Test Designer.
Analyze this IELTS Writing Task 1 image/page and return structured JSON.

INSTRUCTIONS:
1. "nounTitle": Write a concise academic English NOUN-PHRASE title (5–12 words, sentence case, NO period, NO "Task 1:" prefix) built around the core nouns of the chart/map/diagram.
   - Example: "Average percentages of macronutrients consumed in Vietnamese meals"
   - Example: "Proposed redevelopment of Bankside Cultural Complex"
   - Example: "Stages in the manufacturing process of clay bricks"
2. "prompt":
   - If the IELTS Task 1 question prompt IS printed in the image, transcribe it cleanly (e.g. "The pie charts below show... Summarise the information by selecting and reporting the main features, and make comparisons where relevant."). Exclude any "TASK 2" text if printed below!
   - If the image contains ONLY a chart/graph/table/map/diagram WITHOUT a printed question paragraph, compose an authentic Cambridge IELTS Academic Writing Task 1 prompt accurately describing what the visual shows + "Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
3. "subCategory": Classify into EXACTLY ONE of:
   - "w1_map" (maps, floor plans, town layouts before/after)
   - "w1_process" (process diagrams, life cycles, how something works/is produced)
   - "w1_dynamic" (charts/graphs/tables showing changes over 2+ years/time periods)
   - "w1_static" (charts/graphs/tables comparing categories at a single point in time or with no time trend)
4. "isPureChartImage" & "chartBox":
   - If the image is ALREADY just the visual figure/chart itself (no separate "TASK 1: You should spend..." or essay paragraphs above/below it), set "isPureChartImage": true and "chartBox": null.
   - If the image is a full document page containing BOTH printed exam instructions/paragraphs AND the visual chart/map/diagram, set "isPureChartImage": false and set "chartBox": [ymin, xmin, ymax, xmax] (0..1000 normalized coordinates) tightly enclosing ONLY the visual graphic + its chart title, axes, numbers, and legend (excluding external "TASK 1" prompt paragraphs and any "TASK 2" section!).

Return ONLY valid JSON:
{
  "nounTitle": "Average percentages of protein, carbohydrates and fibre in meals",
  "prompt": "The pie charts below show ... Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  "subCategory": "w1_static",
  "isPureChartImage": false,
  "chartBox": [160, 110, 630, 890]
}`;

  const { parsed, usedModel } = await callGeminiGenerateJson({
    apiKey,
    promptText,
    images: [visualItem.imageDataUrl],
    temperature: 0.1
  });

  const validBox = normalizeVisionChartBox(parsed?.chartBox);
  const boxAreaRatio = validBox
    ? ((validBox[2] - validBox[0]) * (validBox[3] - validBox[1])) / 1_000_000
    : 1;
  const shouldCrop = Boolean(validBox && !parsed?.isPureChartImage && boxAreaRatio < 0.88);
  const croppedUrl = shouldCrop
    ? await cropNormalizedBoxFromImage(visualItem.imageDataUrl, validBox, { paddingPct: 0.018 })
    : '';

  const rawSub = String(parsed?.subCategory || '').trim();
  const resolvedSubCategory =
    targetSubCategory && targetSubCategory !== 'auto' && VALID_T1_SUBCAT_IDS.has(targetSubCategory)
      ? targetSubCategory
      : VALID_T1_SUBCAT_IDS.has(rawSub)
      ? rawSub
      : 'w1_dynamic';

  const cleanPrompt = String(parsed?.prompt || '').trim() ||
    'The diagram below gives information for IELTS Academic Writing Task 1. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.';

  return {
    id: visualItem.id,
    sourceLabel: visualItem.sourceLabel,
    title: normalizeNounPhraseTitle(parsed?.nounTitle, cleanPrompt),
    prompt: cleanPrompt,
    dailySubCategory: resolvedSubCategory,
    imageUrl: croppedUrl || visualItem.imageDataUrl,
    croppedImageUrl: croppedUrl || '',
    fullImageUrl: visualItem.imageDataUrl,
    usingCropped: Boolean(croppedUrl),
    selected: true,
    usedModel
  };
}

/**
 * Deterministic fallback noun-phrase title specifically tuned for IELTS Writing Task 1 prompts
 * (e.g. "The bar chart below shows the amount of money invested..." -> "The amount of money invested...").
 */
function buildTask1NounTitleFromPrompt(prompt = '', fileName = '') {
  const firstSentence = String(prompt || '')
    .replace(/\r/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*Summarise the information.*$/i, '')
    .replace(/\s*Summarize the information.*$/i, '')
    .replace(/\s*You should spend about \d+ minutes[^.]*\./gi, '')
    .replace(/\s*Write at least \d+ words\.?/gi, '')
    .trim()
    .split(/(?<=[.!?])\s+/)[0] || '';

  const strippedLead = firstSentence
    .replace(/[.!?]+$/, '')
    .replace(
      /^The\s+(?:bar\s+charts?|pie\s+charts?|line\s+graphs?|charts?|graphs?|tables?|diagrams?|maps?|plans?|flow\s*charts?|illustrations?|pictures?|figures?|data)(?:\s+and\s+(?:bar\s+charts?|pie\s+charts?|line\s+graphs?|charts?|graphs?|tables?|diagrams?|maps?))?\s*(?:below|above|given|provided)?\s+(?:show|shows|illustrate|illustrates|compare|compares|give|gives|provide|provides|present|presents|depict|depicts|describe|describes|indicate|indicates|detail|details)(?:\s+information\s+(?:about|on))?\s+/i,
      ''
    )
    .trim();

  if (strippedLead && strippedLead.split(/\s+/).length >= 3) {
    const words = strippedLead.split(/\s+/).slice(0, 12);
    const joined = words.join(' ').replace(/[,:;]+$/, '').trim();
    if (joined.length >= 6) {
      return joined.charAt(0).toUpperCase() + joined.slice(1);
    }
  }

  const fromName = cleanEnglishTitleFromDocxFilename(fileName);
  if (fromName) return fromName;

  return buildFallbackNounPhraseTitle(prompt || fileName || 'IELTS Writing Task 1 Visual');
}

/**
 * Lightweight text-only Gemini batch call to polish noun-phrase titles (and confirm subCategory when auto)
 * for up to 35 Word (.docx) Task 1 items at once — 20x faster than per-image Vision calls.
 */
async function polishTask1DocxBatchWithAi(chunkItems, { apiKey }) {
  const payloadLines = chunkItems
    .map(
      (it, idx) =>
        `${idx}: [folder=${it.folderPath || 'none'}] [file=${it.fileName}] ${String(it.prompt || '').slice(0, 320)}`
    )
    .join('\n');

  const promptText = `You are a Senior Cambridge IELTS Academic Writing Task 1 Curriculum Designer.
For EACH Task 1 item below, generate a clean academic English NOUN-PHRASE title (5–11 words, sentence case, NO period, NO "Task 1:" prefix, ignore any Vietnamese shorthand filenames like "2 BÁNH" or "7 PTGT" and derive the title strictly from the English prompt) and confirm its chart category.

ALLOWED "subCategory" IDs:
- "w1_map" (maps, floor plans, town/site layouts)
- "w1_process" (process diagrams, manufacturing stages, life cycles)
- "w1_dynamic" (charts/graphs/tables showing trends across 2+ years/periods)
- "w1_static" (charts/graphs/tables comparing categories at 1 time point or without time trends)

ITEMS:
${payloadLines}

Return ONLY valid JSON:
{
  "items": [
    { "idx": 0, "title": "Total sales of a pharmaceutical company across three regions", "subCategory": "w1_dynamic" }
  ]
}`;

  const { parsed, usedModel } = await callGeminiGenerateJson({
    apiKey,
    promptText,
    images: [],
    temperature: 0.1
  });

  const outMap = new Map();
  if (Array.isArray(parsed?.items)) {
    parsed.items.forEach(row => {
      const idx = Number(row?.idx);
      if (Number.isInteger(idx) && idx >= 0 && idx < chunkItems.length) {
        outMap.set(idx, row);
      }
    });
  }

  return { outMap, usedModel };
}

/**
 * Full Bulk Task 1 AI Pipeline:
 * Expands N Word (.docx) files (direct or unpacked from Google Drive .zip / folders) + uploaded images + pasted screenshots + PDF pages
 * into N Task 1 exercises, extracts/writes prompts, crops charts, names each exercise with a noun phrase,
 * and routes them into the chosen or folder-detected Task 1 subfolder.
 */
export async function runBulkTask1AiPipeline({
  docxItems = [],
  visualSources = [],
  pdfFiles = [],
  targetSubCategory = 'w1_dynamic',
  useAiForDocx = true,
  apiKey = '',
  aiConfigured = false,
  onProgress = null,
  signal = null
}) {
  const hasAiAccess = Boolean(String(apiKey || '').trim() || aiConfigured);
  const warnings = [];
  const docxReadyDrafts = [];
  const expandedVisuals = [];
  let usedModelName = 'word-direct-import';

  // 0. Fast-path Word (.docx) items: exact prompt text + embedded chart image directly from XML/media
  if (docxItems.length > 0) {
    for (let i = 0; i < docxItems.length; i += 1) {
      if (signal?.aborted) throw new Error('Đã hủy tác vụ theo yêu cầu.');
      const doc = docxItems[i];
      onProgress?.({
        phase: 'docx',
        done: i + 1,
        total: docxItems.length,
        message: `Đang tách chữ & ảnh từ file Word (${i + 1}/${docxItems.length}): ${doc.fileName}`
      });

      const rawPrompt = String(doc.prompt || doc.rawText || '').trim();
      const hasPromptText = rawPrompt.split(/\s+/).filter(Boolean).length >= 6;
      const hasImage = Boolean(doc.primaryImageUrl);

      // Case A: Word file only contains a pasted screenshot (no text) -> send to Vision pipeline
      if (!hasPromptText && hasImage) {
        const compressed = await compressVisualDataUrl(doc.primaryImageUrl, { maxWidth: 1400, quality: 0.88 });
        expandedVisuals.push({
          id: `w1_docx_vis_${Date.now()}_${i}`,
          sourceLabel: doc.folderPath ? `${doc.folderPath}/${doc.fileName}` : doc.fileName,
          imageDataUrl: compressed,
          inferredSubCategory: doc.inferredSubCategory,
          matchedFromFolder: doc.matchedFromFolder
        });
        continue;
      }

      if (!hasPromptText && !hasImage) {
        warnings.push(`${doc.fileName}: file Word trống (không có văn bản đề hay hình biểu đồ), đã bỏ qua.`);
        continue;
      }

      const compressedImg = hasImage
        ? await compressVisualDataUrl(doc.primaryImageUrl, { maxWidth: 1400, quality: 0.88 })
        : '';

      if (!hasImage) {
        warnings.push(`${doc.fileName}: chưa có hình ảnh nhúng trong file Word — bạn có thể gắn ảnh hoặc tạo hình bằng AI sau.`);
      }

      const resolvedSub =
        targetSubCategory && targetSubCategory !== 'auto' && VALID_T1_SUBCAT_IDS.has(targetSubCategory)
          ? targetSubCategory
          : VALID_T1_SUBCAT_IDS.has(doc.inferredSubCategory)
          ? doc.inferredSubCategory
          : 'w1_dynamic';

      docxReadyDrafts.push({
        id: doc.id || `w1_docx_${Date.now()}_${i}`,
        fileName: doc.fileName,
        folderPath: doc.folderPath || '',
        sourceLabel: doc.folderPath ? `${doc.folderPath.split('/').pop()} / ${doc.fileName}` : doc.fileName,
        title: normalizeNounPhraseTitle(buildTask1NounTitleFromPrompt(rawPrompt, doc.fileName), rawPrompt),
        prompt: rawPrompt,
        modelAnswer: String(doc.modelAnswer || '').trim(),
        dailySubCategory: resolvedSub,
        matchedFromFolder: Boolean(doc.matchedFromFolder),
        imageUrl: compressedImg,
        croppedImageUrl: '',
        fullImageUrl: compressedImg,
        usingCropped: false,
        selected: true
      });
    }

    // Optional ultra-fast text-only AI title polishing in batches of 35 (2s for 50 docs!)
    if (docxReadyDrafts.length > 0 && useAiForDocx && hasAiAccess) {
      const BATCH_SIZE = 35;
      for (let start = 0; start < docxReadyDrafts.length; start += BATCH_SIZE) {
        if (signal?.aborted) throw new Error('Đã hủy tác vụ theo yêu cầu.');
        const slice = docxReadyDrafts.slice(start, start + BATCH_SIZE);
        onProgress?.({
          phase: 'docx-ai',
          done: start,
          total: docxReadyDrafts.length,
          message: `AI đang chuẩn hóa tên Cụm Danh Từ học thuật cho ${slice.length} đề Word (${start + 1}–${start + slice.length}/${docxReadyDrafts.length})...`
        });
        try {
          const { outMap, usedModel } = await polishTask1DocxBatchWithAi(slice, { apiKey });
          if (usedModel) usedModelName = `${usedModel} (word-fast)`;
          slice.forEach((draft, offset) => {
            const aiRow = outMap.get(offset);
            if (!aiRow) return;
            if (aiRow.title) {
              draft.title = normalizeNounPhraseTitle(aiRow.title, draft.prompt);
            }
            // Only let AI override subCategory when target is 'auto' AND folder name didn't already pin it
            if (
              targetSubCategory === 'auto' &&
              !draft.matchedFromFolder &&
              VALID_T1_SUBCAT_IDS.has(String(aiRow.subCategory || '').trim())
            ) {
              draft.dailySubCategory = String(aiRow.subCategory).trim();
            }
          });
        } catch (err) {
          warnings.push(`Nhóm file Word ${start + 1}–${start + slice.length}: giữ tên rút trích tự động (${err?.message || 'lỗi AI'}).`);
        }
      }
    }
  }

  // 1. Normalize uploaded / pasted image items
  for (let i = 0; i < visualSources.length; i += 1) {
    if (signal?.aborted) throw new Error('Đã hủy tác vụ theo yêu cầu.');
    const src = visualSources[i];
    const rawUrl = src.dataUrl || (src.file ? await readFileAsDataUrl(src.file) : '');
    if (!rawUrl) continue;
    const compressed = await compressVisualDataUrl(rawUrl, { maxWidth: 1400, quality: 0.88 });
    expandedVisuals.push({
      id: `w1_vis_${Date.now()}_${i}`,
      sourceLabel: src.name || `Hình ${i + 1}`,
      imageDataUrl: compressed,
      inferredSubCategory: src.inferredSubCategory || src.file?._inferredSubCategory || '',
      matchedFromFolder: Boolean(src.inferredSubCategory || src.file?._inferredSubCategory)
    });
  }

  // 2. Render each page of uploaded PDF files into a Task 1 visual item
  for (let fIdx = 0; fIdx < pdfFiles.length; fIdx += 1) {
    if (signal?.aborted) throw new Error('Đã hủy tác vụ theo yêu cầu.');
    const pdfFile = pdfFiles[fIdx];
    const pages = await renderPdfPagesToImages(pdfFile, {
      scale: 1.85,
      maxPages: 80,
      signal,
      onProgress: ({ donePages, totalPages }) => {
        onProgress?.({
          phase: 'pdf',
          done: donePages,
          total: totalPages,
          message: `Đang tách trang ảnh từ PDF "${pdfFile.name}" (${donePages}/${totalPages})...`
        });
      }
    });
    pages.forEach(pg => {
      expandedVisuals.push({
        id: `w1_pdf_${Date.now()}_${fIdx}_p${pg.pageNumber}`,
        sourceLabel: `${pdfFile.name} • Trang ${pg.pageNumber}`,
        imageDataUrl: pg.dataUrl
      });
    });
  }

  if (docxReadyDrafts.length === 0 && expandedVisuals.length === 0) {
    throw new Error('Hãy tải lên ít nhất 1 file Word (.docx), file ZIP thư mục, hình ảnh hoặc file PDF đề Writing Task 1.');
  }

  const visionResults = new Array(expandedVisuals.length);
  if (expandedVisuals.length > 0) {
    let completed = 0;
    usedModelName = hasAiAccess ? 'gemini-vision' : 'local-image-import';
    const CONCURRENCY = 2;
    let cursor = 0;

    onProgress?.({
      phase: 'ai',
      done: 0,
      total: expandedVisuals.length,
      message: hasAiAccess
        ? `AI đang đọc biểu đồ, tự cắt hình & đặt tên danh từ cho ${expandedVisuals.length} đề hình ảnh / PDF...`
        : `Đang khởi tạo ${expandedVisuals.length} đề Task 1 từ hình ảnh...`
    });

    const worker = async () => {
      while (cursor < expandedVisuals.length) {
        if (signal?.aborted) throw new Error('Đã hủy tác vụ theo yêu cầu.');
        const idx = cursor;
        cursor += 1;
        const item = expandedVisuals[idx];
        const effectiveTargetSub =
          targetSubCategory && targetSubCategory !== 'auto' && VALID_T1_SUBCAT_IDS.has(targetSubCategory)
            ? targetSubCategory
            : item.matchedFromFolder && VALID_T1_SUBCAT_IDS.has(item.inferredSubCategory)
            ? item.inferredSubCategory
            : 'auto';

        if (hasAiAccess) {
          try {
            const analyzed = await analyzeSingleTask1VisualWithAi(item, {
              apiKey,
              targetSubCategory: effectiveTargetSub
            });
            if (analyzed.usedModel) usedModelName = analyzed.usedModel;
            visionResults[idx] = analyzed;
          } catch (err) {
            warnings.push(`${item.sourceLabel}: dùng ảnh gốc & tiêu đề mặc định (${err?.message || 'lỗi AI'}).`);
            const fallbackSub =
              effectiveTargetSub !== 'auto' && VALID_T1_SUBCAT_IDS.has(effectiveTargetSub)
                ? effectiveTargetSub
                : 'w1_dynamic';
            visionResults[idx] = {
              id: item.id,
              sourceLabel: item.sourceLabel,
              title: `Visual data analysis (${item.sourceLabel.replace(/\.[^.]+$/, '')})`,
              prompt:
                'The chart/diagram below gives information for IELTS Academic Writing Task 1. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
              dailySubCategory: fallbackSub,
              imageUrl: item.imageDataUrl,
              croppedImageUrl: '',
              fullImageUrl: item.imageDataUrl,
              usingCropped: false,
              selected: true
            };
          }
        } else {
          const fallbackSub =
            effectiveTargetSub !== 'auto' && VALID_T1_SUBCAT_IDS.has(effectiveTargetSub)
              ? effectiveTargetSub
              : 'w1_dynamic';
          visionResults[idx] = {
            id: item.id,
            sourceLabel: item.sourceLabel,
            title: `Visual chart analysis #${idx + 1}`,
            prompt:
              'The chart/diagram below gives information for IELTS Academic Writing Task 1. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
            dailySubCategory: fallbackSub,
            imageUrl: item.imageDataUrl,
            croppedImageUrl: '',
            fullImageUrl: item.imageDataUrl,
            usingCropped: false,
            selected: true
          };
        }

        completed += 1;
        onProgress?.({
          phase: 'ai',
          done: completed,
          total: expandedVisuals.length,
          message: `Đã soạn xong ${completed} / ${expandedVisuals.length} đề hình ảnh / PDF...`
        });
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, expandedVisuals.length) }, () => worker())
    );
  }

  return {
    items: [...docxReadyDrafts, ...visionResults.filter(Boolean)],
    usedModel: usedModelName,
    warnings
  };
}

/**
 * Converts reviewed Task 1 draft items into complete Daily Zone test objects:
 * - Public ('public')
 * - Duration: 20 minutes (P1 = 20p)
 * - Attempts: Unlimited (maxAttempts = 0, flexible)
 */
export function buildDailyTask1TestObjects(
  draftItems = [],
  { hashtags = ['#ThiThật', '#DailyZone'], assignedClassIds = [] } = {}
) {
  const nowStamp = Date.now();
  const todayIso = new Date().toISOString().split('T')[0];
  const normalizedTags = normalizeTestHashtags(hashtags);

  return draftItems
    .filter(it => it && it.selected !== false && String(it.prompt || '').trim())
    .map((it, idx) => {
      const subCat = VALID_T1_SUBCAT_IDS.has(it.dailySubCategory) ? it.dailySubCategory : 'w1_dynamic';
      const base = createEmptySingleSkillTestForm('writing', {
        writingTaskScope: 'task1',
        dailySubCategory: subCat
      });
      return {
        ...base,
        id: `test-w1-bulk-${nowStamp}-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`,
        title: normalizeNounPhraseTitle(it.title, it.prompt),
        description: '',
        createdAt: todayIso,
        visibility: 'public',
        testMode: 'single_skill',
        focusSkill: 'writing',
        examCategory: 'daily_zone',
        dailySubCategory: subCat,
        writingTaskScope: 'task1',
        examPurpose: 'free_practice',
        priceVnd: 0,
        maxAttempts: 0,
        scheduleMode: 'flexible',
        openAt: null,
        dueAt: null,
        assignedClassIds: Array.isArray(assignedClassIds) ? assignedClassIds : [],
        hashtags: normalizedTags,
        antiCheatEnabled: false,
        allowInternalCopyPaste: true,
        allowViewAnswers: true,
        sectionOrder: ['writing'],
        sectionDurations: { listening: 10, reading: 20, writing: 20 },
        writing: {
          task1: {
            prompt: String(it.prompt || '').trim(),
            minWords: 150,
            imageUrl: String(it.imageUrl || '').trim(),
            modelAnswer: String(it.modelAnswer || '').trim()
          },
          task2: {
            prompt: '',
            minWords: 250,
            modelAnswer: ''
          }
        }
      };
    });
}

/**
 * Converts reviewed Task 2 draft items into complete Daily Zone test objects:
 * - Public ('public')
 * - Duration: 40 minutes (P2 = 40p)
 * - Attempts: Unlimited (maxAttempts = 0, flexible)
 * - Auto-assigned Topic + Question Type + Noun-phrase Title
 */
export function buildDailyTask2TestObjects(
  draftItems = [],
  { hashtags = ['#ThiThật', '#DailyZone'], assignedClassIds = [] } = {}
) {
  const nowStamp = Date.now();
  const todayIso = new Date().toISOString().split('T')[0];
  const normalizedTags = normalizeTestHashtags(hashtags);

  return draftItems
    .filter(it => it && it.selected !== false && String(it.prompt || '').trim())
    .map((it, idx) => {
      const topicId = VALID_T2_TOPIC_IDS.has(it.writingTask2Topic)
        ? it.writingTask2Topic
        : detectTask2TopicFallback(it.prompt);
      const qTypeId = VALID_T2_QTYPE_IDS.has(it.writingTask2QuestionType)
        ? it.writingTask2QuestionType
        : detectTask2QuestionTypeFallback(it.prompt);
      const base = createEmptySingleSkillTestForm('writing', {
        writingTaskScope: 'task2',
        dailySubCategory: 'w2_essay',
        writingTask2Topic: topicId,
        writingTask2QuestionType: qTypeId
      });
      return {
        ...base,
        id: `test-w2-bulk-${nowStamp}-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`,
        title: normalizeNounPhraseTitle(it.title, it.prompt),
        description: '',
        createdAt: todayIso,
        visibility: 'public',
        testMode: 'single_skill',
        focusSkill: 'writing',
        examCategory: 'daily_zone',
        dailySubCategory: 'w2_essay',
        writingTaskScope: 'task2',
        writingTask2Topic: topicId,
        writingTask2QuestionType: qTypeId,
        examPurpose: 'free_practice',
        priceVnd: 0,
        maxAttempts: 0,
        scheduleMode: 'flexible',
        openAt: null,
        dueAt: null,
        assignedClassIds: Array.isArray(assignedClassIds) ? assignedClassIds : [],
        hashtags: normalizedTags,
        antiCheatEnabled: false,
        allowInternalCopyPaste: true,
        allowViewAnswers: true,
        sectionOrder: ['writing'],
        sectionDurations: { listening: 10, reading: 20, writing: 40 },
        writing: {
          task1: {
            prompt: '',
            minWords: 150,
            imageUrl: '',
            modelAnswer: ''
          },
          task2: {
            prompt: String(it.prompt || '').trim(),
            minWords: 250,
            modelAnswer: String(it.modelAnswer || '').trim()
          }
        }
      };
    });
}
