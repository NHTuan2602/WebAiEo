import { cleanAudioMimeType, simulateAISpeakingGrading } from './speakingAiEngine';

export function pickSupportedAudioMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return 'audio/webm';
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg'
  ];
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    if (!blob) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc dữ liệu ghi âm.'));
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

export async function uploadSpeakingRecording({
  blob,
  audioId,
  mimeType = '',
  username = '',
  attemptId = '',
  questionId = ''
}) {
  const cleanMime = cleanAudioMimeType(mimeType || blob?.type || 'audio/webm');
  const dataBase64 = await blobToBase64(blob);
  const res = await fetch('/api/sync/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioId,
      mimeType: cleanMime,
      dataBase64,
      username,
      attemptId,
      questionId
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Lỗi tải lên ghi âm (${res.status})`);
  }
  return res.json();
}

export async function requestAiSpeakingGrading({
  testTitle = '',
  partMode = 'full',
  recordings = [],
  clientApiKey = ''
}) {
  try {
    const res = await fetch('/api/sync/grade-speaking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testTitle,
        partMode,
        recordings,
        clientApiKey
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ok && data?.evaluation) {
        return data.evaluation;
      }
    }
  } catch (_err) {
    // Fall through cleanly to local fallback if server is temporarily unreachable
  }

  return simulateAISpeakingGrading({
    testTitle,
    partMode,
    recordings
  });
}
