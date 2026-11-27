// Pure-browser ZIP & Microsoft Word (.docx) importer — zero external npm dependencies.
// Supports Google Drive folder downloads (.zip containing subfolders of .docx / .pdf / images),
// direct multi-select .docx uploads, and local folder uploads (webkitdirectory).

const IMAGE_EXT_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp'
};

const TEXT_DECODER_UTF8 = new TextDecoder('utf-8', { fatal: false });

function uint8ToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

async function inflateRawBytes(compressedBytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Trình duyệt hiện tại chưa hỗ trợ giải nén file Word (.docx) / ZIP. Hãy cập nhật Chrome, Edge hoặc Cốc Cốc.');
  }
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  const writePromise = writer.write(compressedBytes).then(() => writer.close());
  const chunks = [];
  const reader = ds.readable.getReader();
  let totalLen = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && value.byteLength > 0) {
      chunks.push(value);
      totalLen += value.byteLength;
    }
  }
  await writePromise;
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/**
 * Reads all non-directory entries from a standard ZIP archive (including .docx).
 * Returns Map<normalizedPath, { path, getBytes: () => Promise<Uint8Array>, uncompressedSize }>
 */
export async function readZipEntries(arrayBuffer) {
  const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (bytes.length < 22) {
    throw new Error('File không đúng định dạng ZIP hoặc .docx hợp lệ.');
  }

  // Locate End of Central Directory (EOCD) signature 0x06054b50 from end of file
  const minEocdPos = Math.max(0, bytes.length - 65557);
  let eocdPos = -1;
  for (let i = bytes.length - 22; i >= minEocdPos; i -= 1) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      const commentLen = view.getUint16(i + 20, true);
      if (i + 22 + commentLen <= bytes.length) {
        eocdPos = i;
        break;
      }
    }
  }

  if (eocdPos < 0) {
    throw new Error('Không tìm thấy cấu trúc ZIP/DOCX hợp lệ (nếu đây là file .doc đời cũ 97-2003, hãy lưu lại dạng .docx).');
  }

  const totalEntries = view.getUint16(eocdPos + 10, true);
  const cdSize = view.getUint32(eocdPos + 12, true);
  const cdOffset = view.getUint32(eocdPos + 16, true);
  const cdEnd = Math.min(bytes.length, cdOffset + cdSize);

  const entries = [];
  let pos = cdOffset;
  let parsed = 0;

  while (pos + 46 <= cdEnd && parsed < totalEntries) {
    const sig = view.getUint32(pos, true);
    if (sig !== 0x02014b50) break;

    const method = view.getUint16(pos + 10, true);
    const compSize = view.getUint32(pos + 20, true);
    const uncompSize = view.getUint32(pos + 24, true);
    const nameLen = view.getUint16(pos + 28, true);
    const extraLen = view.getUint16(pos + 30, true);
    const commentLen = view.getUint16(pos + 32, true);
    const localHeaderOffset = view.getUint32(pos + 42, true);

    const nameBytes = bytes.subarray(pos + 46, pos + 46 + nameLen);
    const rawPath = TEXT_DECODER_UTF8.decode(nameBytes).replace(/\\/g, '/');

    pos += 46 + nameLen + extraLen + commentLen;
    parsed += 1;

    if (!rawPath || rawPath.endsWith('/')) continue;
    const baseName = rawPath.split('/').pop() || '';
    if (
      rawPath.includes('__MACOSX/') ||
      baseName === '.DS_Store' ||
      baseName === 'Thumbs.db' ||
      baseName.startsWith('~$')
    ) {
      continue;
    }

    const getBytes = async () => {
      if (localHeaderOffset + 30 > bytes.length) {
        throw new Error(`Lỗi vị trí dữ liệu trong file nén: ${rawPath}`);
      }
      const localSig = view.getUint32(localHeaderOffset, true);
      if (localSig !== 0x04034b50) {
        throw new Error(`Header file nén không hợp lệ: ${rawPath}`);
      }
      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const dataEnd = Math.min(bytes.length, dataStart + compSize);
      const compSlice = bytes.subarray(dataStart, dataEnd);

      if (method === 0) {
        return new Uint8Array(compSlice);
      }
      if (method === 8) {
        return inflateRawBytes(compSlice);
      }
      throw new Error(`Phương thức nén ZIP (${method}) không được hỗ trợ cho: ${rawPath}`);
    };

    entries.push({
      path: rawPath,
      baseName,
      method,
      compressedSize: compSize,
      uncompressedSize: uncompSize,
      getBytes
    });
  }

  return entries;
}

function decodeXmlEntities(str = '') {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });
}

/**
 * Extracts clean readable paragraphs from WordprocessingML (word/document.xml).
 */
export function extractTextFromDocumentXml(xmlString = '') {
  const xml = String(xmlString || '');
  if (!xml.trim()) return '';

  // Remove deleted revisions (<w:del>...</w:del>) so tracked-change deletions don't pollute text
  const cleanedXml = xml.replace(/<w:del\b[^>]*>[\s\S]*?<\/w:del>/gi, '');

  const paragraphs = [];
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi;
  let pMatch;

  while ((pMatch = pRegex.exec(cleanedXml)) !== null) {
    const pInner = pMatch[1];
    // Preserve line breaks (<w:br/>, <w:cr/>) and tabs (<w:tab/>) inside paragraph
    const tokenized = pInner
      .replace(/<w:tab\b[^>]*\/>/gi, '\t')
      .replace(/<w:(?:br|cr)\b[^>]*\/>/gi, '\n');

    let line = '';
    const tokenRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|(\n|\t)/gi;
    let tMatch;
    while ((tMatch = tokenRegex.exec(tokenized)) !== null) {
      if (tMatch[1] !== undefined) {
        line += decodeXmlEntities(tMatch[1]);
      } else if (tMatch[2]) {
        line += tMatch[2];
      }
    }

    const normalized = line
      .replace(/\r/g, '')
      .split('\n')
      .map(s => s.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .trim();

    if (normalized) {
      paragraphs.push(normalized);
    }
  }

  return paragraphs.join('\n\n').trim();
}

/**
 * Splits a Word Task 1 document's text into the exam prompt and optional sample/model answer.
 * Many IELTS teacher Google Docs contain the Task 1 prompt at the top followed by a Band 8/9 sample essay.
 */
export function splitDocxWritingTask1Text(rawText = '') {
  const full = String(rawText || '')
    .replace(/\r/g, '')
    .trim();
  if (!full) return { prompt: '', modelAnswer: '' };

  const paragraphs = full
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return { prompt: '', modelAnswer: '' };

  const sampleHeadingRe =
    /^(?:sample\s*answer|model\s*answer|sample\s*essay|model\s*essay|band\s*[6-9](?:\.5)?\s*(?:sample|answer|essay|model)?|bài\s*mẫu|đáp\s*án\s*mẫu|suggested\s*answer|answer\s*key|vocabulary|useful\s*vocab|outline|dàn\s*ý|paraphrase|overview\s*:|introduction\s*:|body\s*\d*\s*:)\b/i;

  const promptParts = [];
  const sampleParts = [];
  let inSample = false;

  for (let i = 0; i < paragraphs.length; i += 1) {
    const p = paragraphs[i];
    // Strip standard IELTS header noise lines if standalone
    if (/^(?:writing\s+task\s*1|ielts\s+writing\s+task\s*1|task\s*1)\s*[:.-]?$/i.test(p)) {
      continue;
    }

    if (!inSample && sampleHeadingRe.test(p)) {
      inSample = true;
      sampleParts.push(p);
      continue;
    }

    // Heuristic: after we already captured a complete prompt (ends with "Summarise..." or "Write at least 150 words"
    // or >= 20 words), a long essay paragraph starting with typical Task 1 report openers ("The bar chart compares...",
    // "Overall, ...", "Looking at the ...") is a sample essay!
    if (
      !inSample &&
      promptParts.length >= 1 &&
      (
        /summarise the information|summarize the information|write at least 150 words|make comparisons where relevant/i.test(
          promptParts.join(' ')
        ) ||
        promptParts.join(' ').split(/\s+/).length >= 22
      ) &&
      (
        /^(?:overall,|in general,|as can be seen|looking at|turning to|in the first|to begin with|with regard to|regarding|it is clear that|it is evident that)/i.test(p) ||
        (p.split(/\s+/).length >= 45 && !/summarise|summarize|write at least|you should spend/i.test(p))
      )
    ) {
      inSample = true;
      sampleParts.push(p);
      continue;
    }

    if (inSample) {
      sampleParts.push(p);
    } else {
      promptParts.push(p);
    }
  }

  let prompt = promptParts.join('\n\n').trim();
  const modelAnswer = sampleParts.join('\n\n').trim();

  // Remove trailing "Write at least 150 words." only if we want clean prompt? Keep standard IELTS wording if short,
  // or keep prompt intact so students see the exact authentic prompt!
  if (!prompt && full) {
    prompt = paragraphs.slice(0, 2).join('\n\n').trim();
  }

  return { prompt, modelAnswer };
}

/**
 * Infers Daily Zone Task 1 subfolder ('w1_map' | 'w1_process' | 'w1_dynamic' | 'w1_static')
 * using folder path first (e.g. Google Drive's DYNAMIC CHART / MAP / PROCESS / STATIC CHART),
 * then filename, then prompt keywords.
 */
export function inferTask1SubCategoryFromPath(folderPath = '', fileName = '', promptText = '') {
  const pathUpper = `${String(folderPath || '')} ${String(fileName || '')}`.toUpperCase();

  // Priority 1: Explicit folder path match (matches Google Drive folders directly!)
  if (/(?:^|[\/_\-\s])(MAP|MAPS|BẢN ĐỒ|BAN DO|FLOOR\s*PLAN)(?:$|[\/_\-\s])/i.test(pathUpper)) {
    return { subCategory: 'w1_map', matchedFromFolder: true };
  }
  if (/(?:^|[\/_\-\s])(PROCESS|DIAGRAM|QUY TRÌNH|QUY TRINH|CYCLE|LIFECYCLE|MANUFACTUR)/i.test(pathUpper)) {
    return { subCategory: 'w1_process', matchedFromFolder: true };
  }
  if (/(?:^|[\/_\-\s])(STATIC|BIỂU ĐỒ TĨNH|BIEU DO TINH)(?:$|[\/_\-\s])/i.test(pathUpper)) {
    return { subCategory: 'w1_static', matchedFromFolder: true };
  }
  if (/(?:^|[\/_\-\s])(DYNAMIC|BIỂU ĐỒ ĐỘNG|BIEU DO DONG|TREND|CHANGE OVER TIME)(?:$|[\/_\-\s])/i.test(pathUpper)) {
    return { subCategory: 'w1_dynamic', matchedFromFolder: true };
  }

  // Priority 2: Prompt text keywords
  const low = String(promptText || '').toLowerCase();
  if (/\b(maps?|floor\s*plan|town|village|island|layout|redevelopment|site\s*plan|park\s*in\s*\d{4})\b/.test(low)) {
    return { subCategory: 'w1_map', matchedFromFolder: false };
  }
  if (/\b(process|diagram|stages?|how\s+.*\s+(?:is|are)\s+(?:made|produced|manufactured|recycled|generated)|life\s*cycle|equipment|system\s+works)\b/.test(low)) {
    return { subCategory: 'w1_process', matchedFromFolder: false };
  }

  // Check for multiple distinct years or time-change phrases -> Dynamic vs Static
  const years = [...new Set((low.match(/\b(?:19\d\d|20\d\d)\b/g) || []))];
  if (
    years.length >= 2 ||
    /\b(between\s+\d{4}\s+and\s+\d{4}|from\s+\d{4}\s+to\s+\d{4}|over\s+a\s+\d+-year|over\s+time|changes?\s+in|projections?|forecast|trends?|line\s+graph)\b/.test(
      low
    )
  ) {
    return { subCategory: 'w1_dynamic', matchedFromFolder: false };
  }
  if (years.length === 1 || /\b(in\s+\d{4}\b|pie\s+chart|bar\s+chart|table\s+shows|compares?\s+the)\b/.test(low)) {
    return { subCategory: 'w1_static', matchedFromFolder: false };
  }

  return { subCategory: 'w1_dynamic', matchedFromFolder: false };
}

/**
 * Extracts text + embedded raster images from a single .docx ArrayBuffer or File.
 */
export async function extractDocxContent(fileOrBuffer, fileName = '', folderPath = '') {
  const buffer =
    fileOrBuffer instanceof ArrayBuffer
      ? fileOrBuffer
      : fileOrBuffer instanceof Uint8Array
      ? fileOrBuffer.buffer.slice(fileOrBuffer.byteOffset, fileOrBuffer.byteOffset + fileOrBuffer.byteLength)
      : await fileOrBuffer.arrayBuffer();

  const entries = await readZipEntries(buffer);
  const byLowerPath = new Map(entries.map(e => [e.path.toLowerCase(), e]));

  const docEntry = byLowerPath.get('word/document.xml');
  if (!docEntry) {
    throw new Error(`File "${fileName || 'word.docx'}" không chứa word/document.xml hợp lệ.`);
  }

  const docXmlBytes = await docEntry.getBytes();
  const docXml = TEXT_DECODER_UTF8.decode(docXmlBytes);
  let rawText = extractTextFromDocumentXml(docXml);

  // If body text is empty, check headers just in case
  if (!rawText) {
    const headerEntries = entries.filter(e => /^word\/header\d*\.xml$/i.test(e.path));
    const headerTexts = [];
    for (const h of headerEntries) {
      const hXml = TEXT_DECODER_UTF8.decode(await h.getBytes());
      const ht = extractTextFromDocumentXml(hXml);
      if (ht) headerTexts.push(ht);
    }
    rawText = headerTexts.join('\n\n').trim();
  }

  // Extract all embedded raster images from word/media/*
  const mediaEntries = entries.filter(e => /^word\/media\/[^/]+$/i.test(e.path));
  const images = [];

  for (const m of mediaEntries) {
    const ext = (m.baseName.split('.').pop() || '').toLowerCase();
    const mime = IMAGE_EXT_MIME[ext];
    if (!mime) continue;
    try {
      const imgBytes = await m.getBytes();
      if (!imgBytes || imgBytes.byteLength < 64) continue;
      const base64 = uint8ToBase64(imgBytes);
      images.push({
        name: m.baseName,
        mimeType: mime,
        byteSize: imgBytes.byteLength,
        dataUrl: `data:${mime};base64,${base64}`
      });
    } catch (_err) {
      // Ignore individual corrupt media item and keep going
    }
  }

  // Sort images so the largest raster chart/map/process image comes first (avoids tiny logos/icons)
  images.sort((a, b) => b.byteSize - a.byteSize);

  const { prompt, modelAnswer } = splitDocxWritingTask1Text(rawText);
  const inferred = inferTask1SubCategoryFromPath(folderPath, fileName, prompt || rawText);

  return {
    fileName: fileName || 'document.docx',
    folderPath: folderPath || '',
    rawText,
    prompt,
    modelAnswer,
    images,
    primaryImageUrl: images[0]?.dataUrl || '',
    inferredSubCategory: inferred.subCategory,
    matchedFromFolder: inferred.matchedFromFolder
  };
}

/**
 * Cleans up a filename (e.g. "a drug company's total sales.docx") into a readable English title fallback.
 * Returns empty string if the filename looks like Vietnamese teacher shorthand (e.g. "4 AREAS CƯỜI", "7 PTGT")
 * so the caller prefers deriving the title from the English prompt text instead.
 */
export function cleanEnglishTitleFromDocxFilename(fileName = '') {
  const base = String(fileName || '')
    .replace(/\.(?:docx?|pdf|png|jpe?g|webp)$/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return '';

  // Reject filenames containing Vietnamese diacritics or purely shorthand codes like "7 PTGT" / "2 BÁNH"
  if (/[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(base)) {
    return '';
  }
  const strippedNum = base.replace(/^\d+\s*[.)\-–—]?\s*/, '').trim();
  const words = strippedNum.split(/\s+/).filter(Boolean);
  if (words.length < 2) return '';
  // Reject all-caps short abbreviations like "PTGT", "US CAR"
  if (words.length <= 2 && strippedNum === strippedNum.toUpperCase()) return '';

  const smallWords = new Set(['of', 'in', 'on', 'at', 'to', 'for', 'by', 'and', 'or', 'the', 'a', 'an', 'across', 'from', 'with']);
  return words
    .map((w, idx) => {
      const low = w.toLowerCase();
      if (idx > 0 && smallWords.has(low)) return low;
      return low.charAt(0).toUpperCase() + low.slice(1);
    })
    .join(' ')
    .slice(0, 72);
}

/**
 * Unpacks any mix of uploaded .zip (e.g. Google Drive folder download), .docx, .pdf, and image files.
 * Preserves folder paths from both ZIP inner paths and webkitRelativePath (folder picker).
 */
export async function unpackUploadedWritingFiles(fileList = [], { onProgress } = {}) {
  const files = Array.from(fileList || []);
  const docxItems = [];
  const imageFiles = [];
  const pdfFiles = [];
  const skippedWarnings = [];
  const detectedFolderSet = new Set();

  const report = (message) => {
    if (typeof onProgress === 'function') onProgress(message);
  };

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    if (!file) continue;
    const name = String(file.name || '');
    const lower = name.toLowerCase();
    const relPath = String(file.webkitRelativePath || '').replace(/\\/g, '/');
    const relFolder = relPath.includes('/') ? relPath.slice(0, relPath.lastIndexOf('/')) : '';

    if (name.startsWith('~$') || name === '.DS_Store' || name === 'Thumbs.db') {
      continue;
    }

    if (lower.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
      report(`Đang giải nén file ZIP "${name}"...`);
      try {
        const buf = await file.arrayBuffer();
        const zipEntries = await readZipEntries(buf);
        let innerCount = 0;

        for (let j = 0; j < zipEntries.length; j += 1) {
          const entry = zipEntries[j];
          const entryLower = entry.baseName.toLowerCase();
          const entryFolder = entry.path.includes('/') ? entry.path.slice(0, entry.path.lastIndexOf('/')) : '';

          if (entryLower.endsWith('.docx')) {
            innerCount += 1;
            if (innerCount % 5 === 1 || innerCount === zipEntries.length) {
              report(`Đang đọc file Word trong ZIP (${innerCount}): ${entry.baseName}`);
            }
            try {
              const entryBytes = await entry.getBytes();
              const parsed = await extractDocxContent(entryBytes, entry.baseName, entryFolder);
              if (parsed.matchedFromFolder) detectedFolderSet.add(parsed.inferredSubCategory);
              docxItems.push({
                id: `docx_${Date.now()}_${i}_${j}_${Math.random().toString(36).slice(2, 6)}`,
                ...parsed
              });
            } catch (err) {
              skippedWarnings.push(`Không đọc được "${entry.path}": ${err?.message || 'File hỏng'}`);
            }
          } else if (entryLower.endsWith('.pdf')) {
            innerCount += 1;
            try {
              const entryBytes = await entry.getBytes();
              const pdfFile = new File([entryBytes], entry.baseName, { type: 'application/pdf' });
              pdfFile._folderPath = entryFolder;
              pdfFiles.push(pdfFile);
            } catch (err) {
              skippedWarnings.push(`Không giải nén được PDF "${entry.path}": ${err?.message || 'Lỗi'}`);
            }
          } else {
            const ext = (entry.baseName.split('.').pop() || '').toLowerCase();
            if (IMAGE_EXT_MIME[ext]) {
              innerCount += 1;
              try {
                const entryBytes = await entry.getBytes();
                const imgFile = new File([entryBytes], entry.baseName, { type: IMAGE_EXT_MIME[ext] });
                imgFile._folderPath = entryFolder;
                const inf = inferTask1SubCategoryFromPath(entryFolder, entry.baseName, '');
                if (inf.matchedFromFolder) {
                  imgFile._inferredSubCategory = inf.subCategory;
                  detectedFolderSet.add(inf.subCategory);
                }
                imageFiles.push(imgFile);
              } catch (err) {
                skippedWarnings.push(`Không giải nén được ảnh "${entry.path}": ${err?.message || 'Lỗi'}`);
              }
            } else if (entryLower.endsWith('.doc')) {
              skippedWarnings.push(`Bỏ qua "${entry.baseName}" (.doc đời cũ — hãy lưu lại dạng .docx).`);
            }
          }
        }

        if (innerCount === 0) {
          skippedWarnings.push(`File ZIP "${name}" không chứa file .docx, .pdf hay ảnh nào.`);
        }
      } catch (err) {
        skippedWarnings.push(`Không thể giải nén "${name}": ${err?.message || 'File ZIP lỗi'}`);
      }
      continue;
    }

    if (
      lower.endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      report(`Đang đọc file Word (${i + 1}/${files.length}): ${name}`);
      try {
        const parsed = await extractDocxContent(file, name, relFolder);
        if (parsed.matchedFromFolder) detectedFolderSet.add(parsed.inferredSubCategory);
        docxItems.push({
          id: `docx_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          ...parsed
        });
      } catch (err) {
        skippedWarnings.push(`Không đọc được "${name}": ${err?.message || 'File .docx không hợp lệ'}`);
      }
      continue;
    }

    if (lower.endsWith('.doc')) {
      skippedWarnings.push(`File "${name}" là định dạng Word .doc đời cũ (97-2003). Hãy mở bằng Word/Google Docs và lưu lại thành .docx.`);
      continue;
    }

    if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
      if (relFolder) file._folderPath = relFolder;
      pdfFiles.push(file);
      continue;
    }

    if (file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(lower)) {
      if (relFolder) {
        file._folderPath = relFolder;
        const inf = inferTask1SubCategoryFromPath(relFolder, name, '');
        if (inf.matchedFromFolder) {
          file._inferredSubCategory = inf.subCategory;
          detectedFolderSet.add(inf.subCategory);
        }
      }
      imageFiles.push(file);
      continue;
    }
  }

  return {
    docxItems,
    imageFiles,
    pdfFiles,
    skippedWarnings,
    detectedFolders: [...detectedFolderSet]
  };
}
