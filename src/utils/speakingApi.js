import { cleanAudioMimeType, simulateAISpeakingGrading } from './speakingAiEngine';
import { simulateAIWritingGrading } from './geminiGrader';
import { MAX_AUDIO_UPLOAD_BYTES } from '../constants/profileCustomization';

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

export async function uploadSpeakingRecording({
  blob,
  audioId,
  mimeType = '',
  attemptId = '',
  questionId = ''
}) {
  if (!blob) throw new Error('Không có dữ liệu file ghi âm.');
  if (Number(blob.size) > MAX_AUDIO_UPLOAD_BYTES) {
    throw new Error('File ghi âm vượt quá giới hạn 100MB.');
  }
  const cleanMime = cleanAudioMimeType(mimeType || blob?.type || 'audio/webm');
  const encodeHeader = value => encodeURIComponent(String(value || '').slice(0, 240));
  const res = await fetch('/api/sync/audio', {
    method: 'POST',
    headers: {
      'Content-Type': cleanMime,
      'X-Audio-Id': encodeHeader(audioId),
      'X-Attempt-Id': encodeHeader(attemptId),
      'X-Question-Id': encodeHeader(questionId)
    },
    body: blob
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

export async function verifySpeakingRoomPassword({ testId, password = '' }) {
  const res = await fetch('/api/sync/speaking/verify-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testId: String(testId || '').trim(),
      password: String(password || '').trim()
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Mật khẩu phòng thi không chính xác!');
  }
  return data;
}

export async function verifyExamRoomPassword({ testId, password = '' }) {
  const res = await fetch('/api/sync/exam/verify-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testId: String(testId || '').trim(),
      password: String(password || '').trim()
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Mật khẩu đề thi thực chiến không chính xác!');
  }
  return data;
}

export async function requestAiWritingGrading({
  attemptId = '',
  task1Prompt = '',
  task1Text = '',
  task2Prompt = '',
  task2Text = '',
  clientApiKey = ''
}) {
  try {
    const res = await fetch('/api/sync/grade-writing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId,
        task1Prompt,
        task1Text,
        task2Prompt,
        task2Text,
        clientApiKey
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ok && data?.evaluation) {
        return {
          evaluation: data.evaluation,
          attempt: data.attempt || null
        };
      }
    }
  } catch (_err) {
    // Fall back to deterministic examiner analyzer when offline
  }

  return {
    evaluation: simulateAIWritingGrading({
      _task1Prompt: task1Prompt,
      task1Text,
      _task2Prompt: task2Prompt,
      task2Text
    }),
    attempt: null
  };
}
