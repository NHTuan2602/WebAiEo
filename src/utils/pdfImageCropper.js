import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let pdfJsPromise = null;

async function getPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import('pdfjs-dist').then(mod => {
      if (mod?.GlobalWorkerOptions) {
        mod.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      }
      return mod;
    });
  }
  return pdfJsPromise;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file đã chọn.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Dữ liệu file không hợp lệ.'));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function dataUrlToUint8Array(dataUrl) {
  const match = String(dataUrl || '').match(/^data:[^;]+;base64,(.+)$/);
  if (!match) throw new Error('Dữ liệu PDF base64 không hợp lệ.');
  const binStr = atob(match[1]);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i += 1) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Renders a 1-based page from a PDF File or PDF data URL onto a crisp canvas
 * and returns a PNG/JPEG data URL.
 */
export async function renderPdfPageToDataUrl(pdfSource, pageNumber = 1, { scale = 2.0 } = {}) {
  if (typeof document === 'undefined') return null;
  const pdfjs = await getPdfJs();
  let bytes;
  if (pdfSource instanceof Uint8Array) {
    bytes = pdfSource;
  } else if (typeof Blob !== 'undefined' && pdfSource instanceof Blob) {
    const buf = await pdfSource.arrayBuffer();
    bytes = new Uint8Array(buf);
  } else if (typeof pdfSource === 'string') {
    bytes = dataUrlToUint8Array(pdfSource);
  } else {
    throw new Error('Nguồn PDF không hợp lệ.');
  }

  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdfDoc = await loadingTask.promise;
  try {
    const totalPages = Math.max(1, Number(pdfDoc.numPages) || 1);
    const safePageNum = Math.min(totalPages, Math.max(1, Math.round(Number(pageNumber) || 1)));
    const page = await pdfDoc.getPage(safePageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // White background so transparent PDFs look clean in Dark Mode too
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;
    let dataUrl = canvas.toDataURL('image/png');
    if (dataUrl.length > 1_300_000) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    }
    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      totalPages,
      pageNumber: safePageNum
    };
  } finally {
    try {
      await pdfDoc.destroy();
    } catch {
      // ignore cleanup error
    }
  }
}

/**
 * Validates and clamps a Gemini Vision normalized bounding box [ymin, xmin, ymax, xmax] (0..1000).
 */
export function normalizeVisionChartBox(rawBox) {
  if (!Array.isArray(rawBox) || rawBox.length !== 4) return null;
  const nums = rawBox.map(v => Number(v));
  if (nums.some(v => !Number.isFinite(v))) return null;
  const ymin = Math.max(0, Math.min(990, nums[0]));
  const xmin = Math.max(0, Math.min(990, nums[1]));
  const ymax = Math.max(0, Math.min(1000, nums[2]));
  const xmax = Math.max(0, Math.min(1000, nums[3]));
  if (ymax - ymin < 50 || xmax - xmin < 50) return null;
  return [ymin, xmin, ymax, xmax];
}

/**
 * Crops a normalized [ymin, xmin, ymax, xmax] (0..1000) region out of an image data URL.
 */
export function cropNormalizedBoxFromImage(imageDataUrl, rawBox, { paddingPct = 0.015 } = {}) {
  return new Promise((resolve) => {
    const box = normalizeVisionChartBox(rawBox);
    if (!imageDataUrl || !box || typeof window === 'undefined' || typeof document === 'undefined') {
      resolve('');
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          resolve('');
          return;
        }
        const [ymin, xmin, ymax, xmax] = box;
        const padX = Math.round(w * paddingPct);
        const padY = Math.round(h * paddingPct);
        const sx = Math.max(0, Math.floor((xmin / 1000) * w) - padX);
        const sy = Math.max(0, Math.floor((ymin / 1000) * h) - padY);
        const ex = Math.min(w, Math.ceil((xmax / 1000) * w) + padX);
        const ey = Math.min(h, Math.ceil((ymax / 1000) * h) + padY);
        const cw = Math.max(20, ex - sx);
        const ch = Math.max(20, ey - sy);

        const maxOutWidth = 1500;
        const scale = cw > maxOutWidth ? maxOutWidth / cw : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(cw * scale));
        canvas.height = Math.max(1, Math.round(ch * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
        let out = canvas.toDataURL('image/png');
        if (out.length > 1_100_000) {
          out = canvas.toDataURL('image/jpeg', 0.92);
        }
        resolve(out);
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = imageDataUrl;
  });
}

/**
 * Automatically renders/crops the Task 1 chart/map/diagram from a Writing PDF or uploaded image(s)
 * using the bounding box returned by Gemini Vision.
 */
export async function attachAutoCroppedWritingChart(
  extracted,
  { pdfFile = null, pdfDataUrl = '', images = [] } = {}
) {
  if (!extracted || typeof extracted !== 'object') return extracted;
  const task1 = extracted.task1 || {};
  const hasVisual = Boolean(task1.hasChartImage);
  const warnings = Array.isArray(extracted.warnings) ? [...extracted.warnings] : [];
  if (!hasVisual) {
    return {
      ...extracted,
      task1: {
        ...task1,
        imageUrl: task1.imageUrl || '',
        fullPageImageUrl: ''
      },
      warnings
    };
  }

  let sourcePageUrl = '';
  try {
    if (pdfFile || pdfDataUrl) {
      const rendered = await renderPdfPageToDataUrl(
        pdfFile || pdfDataUrl,
        Number(task1.chartPageNumber) || 1,
        { scale: 2.0 }
      );
      sourcePageUrl = rendered?.dataUrl || '';
    } else if (Array.isArray(images) && images.length > 0) {
      const idx = Math.min(images.length - 1, Math.max(0, Math.round(Number(task1.chartImageIndex) || 0)));
      sourcePageUrl = images[idx] || images[0] || '';
    }
  } catch (err) {
    warnings.push(`Không thể tự render trang biểu đồ Task 1 từ PDF (${err?.message || 'lỗi trình duyệt'}) — bạn có thể tải ảnh biểu đồ thủ công ở bên dưới.`);
  }

  if (!sourcePageUrl) {
    return {
      ...extracted,
      task1: { ...task1, imageUrl: task1.imageUrl || '', fullPageImageUrl: '' },
      warnings
    };
  }

  const cropped = task1.chartBox
    ? await cropNormalizedBoxFromImage(sourcePageUrl, task1.chartBox, { paddingPct: 0.018 })
    : '';

  return {
    ...extracted,
    task1: {
      ...task1,
      imageUrl: cropped || sourcePageUrl,
      croppedImageUrl: cropped || '',
      fullPageImageUrl: sourcePageUrl
    },
    warnings
  };
}
