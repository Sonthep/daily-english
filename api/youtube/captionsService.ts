import {
  fetchTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from 'youtube-transcript';

export interface YoutubeCaptionSegment {
  text: string;
  offsetSeconds: number;
  durationSeconds: number;
}

export interface CaptionsApiResult {
  status: number;
  body: { captions?: YoutubeCaptionSegment[]; error?: { message: string } };
}

export function normalizeTranscriptOffsets(
  transcript: Array<{ text: string; offset: number; duration: number }>
): YoutubeCaptionSegment[] {
  const durations = transcript.map((segment) => segment.duration).sort((a, b) => a - b);
  const medianDuration = durations[Math.floor(durations.length / 2)] || 0;
  const divisor = medianDuration > 100 ? 1000 : 1;

  return transcript
    .filter((segment) => segment.text.trim())
    .map((segment) => ({
      text: segment.text.trim(),
      offsetSeconds: segment.offset / divisor,
      durationSeconds: segment.duration / divisor,
    }));
}

export async function createCaptionsApiResult(videoId: string): Promise<CaptionsApiResult> {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return { status: 400, body: { error: { message: 'ลิงก์ YouTube ไม่ถูกต้อง' } } };
  }

  try {
    const transcript = await fetchTranscript(videoId, { lang: 'en' });
    const captions = normalizeTranscriptOffsets(transcript);
    if (captions.length === 0) {
      return { status: 404, body: { error: { message: 'ไม่พบ captions สำหรับคลิปนี้' } } };
    }
    return { status: 200, body: { captions } };
  } catch (error) {
    if (error instanceof YoutubeTranscriptTooManyRequestError) {
      return { status: 429, body: { error: { message: 'YouTube จำกัดคำขอชั่วคราว กรุณาลองใหม่ภายหลัง' } } };
    }
    if (
      error instanceof YoutubeTranscriptDisabledError ||
      error instanceof YoutubeTranscriptNotAvailableError ||
      error instanceof YoutubeTranscriptNotAvailableLanguageError ||
      error instanceof YoutubeTranscriptVideoUnavailableError
    ) {
      return { status: 404, body: { error: { message: 'YouTube ไม่เปิด English captions สำหรับคลิปนี้' } } };
    }
    return { status: 502, body: { error: { message: 'ดึง captions จาก YouTube ไม่สำเร็จ กรุณาวาง transcript เอง' } } };
  }
}