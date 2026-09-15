/**
 * Web Speech Recognition Service for Daily English
 * Handles Speech-to-Text in browser using SpeechRecognition / webkitSpeechRecognition.
 */

export interface RecognitionError {
  type: 'not-allowed' | 'no-speech' | 'network' | 'audio-capture' | 'unsupported' | 'unknown';
  message: string;
}

export type RecognitionState = 'idle' | 'listening' | 'recognized' | 'error' | 'unsupported';

// Browser-agnostic Web Speech API interfaces
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  item(index: number): SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((event: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
  }
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private currentFinalTranscript = '';

  /**
   * Check if the current browser environment supports Web Speech Recognition
   */
  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Start speech recognition for English
   */
  public start(options: {
    lang?: string;
    continuous?: boolean;
    onInterim?: (text: string) => void;
    onFinal?: (text: string) => void;
    onError?: (err: RecognitionError) => void;
    onEnd?: () => void;
  }): { success: boolean; error?: RecognitionError } {
    if (!SpeechRecognitionService.isSupported()) {
      return {
        success: false,
        error: {
          type: 'unsupported',
          message: 'เบราว์เซอร์นี้ไม่รองรับ Web Speech Recognition (แนะนำใช้ Google Chrome หรือ Microsoft Edge)',
        },
      };
    }

    this.stop();
    this.currentFinalTranscript = '';

    try {
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) {
        return {
          success: false,
          error: {
            type: 'unsupported',
            message: 'ไม่พบ SpeechRecognition ในเบราว์เซอร์',
          },
        };
      }

      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.lang = options.lang || 'en-US';
      this.recognition.interimResults = true;
      this.recognition.continuous = options.continuous ?? true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interimText = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0].transcript;
          } else {
            interimText += res[0].transcript;
          }
        }

        if (finalChunk) {
          this.currentFinalTranscript = (this.currentFinalTranscript + ' ' + finalChunk).trim();
          if (options.onFinal) {
            options.onFinal(this.currentFinalTranscript);
          }
        }

        if (options.onInterim) {
          const combined = (this.currentFinalTranscript + ' ' + interimText).trim();
          options.onInterim(combined);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        let errType: RecognitionError['type'] = 'unknown';
        let message = 'เกิดข้อผิดพลาดในการรับเสียงพูด';

        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          errType = 'not-allowed';
          message = 'เบราว์เซอร์ไม่ได้รับอนุญาตให้ใช้ไมโครโฟนสำหรับ Speech Recognition';
        } else if (event.error === 'no-speech') {
          errType = 'no-speech';
          message = 'ตรวจไม่พบเสียงพูด ลองพูดใกล้ไมโครโฟนมากขึ้นครับ';
        } else if (event.error === 'network') {
          errType = 'network';
          message = 'การเชื่อมต่อเครือข่ายสำหรับระบบถอดเสียงขัดข้อง';
        } else if (event.error === 'audio-capture') {
          errType = 'audio-capture';
          message = 'ไม่พบอุปกรณ์รับเสียงหรือไมโครโฟนกำลังถูกโปรแกรมอื่นใช้งานอยู่';
        }

        if (options.onError) {
          options.onError({ type: errType, message });
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (options.onEnd) {
          options.onEnd();
        }
      };

      this.recognition.start();
      return { success: true };
    } catch (err: unknown) {
      this.isListening = false;
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: {
          type: 'unknown',
          message: `ไม่สามารถเริ่ม Speech Recognition ได้: ${errorMsg}`,
        },
      };
    }
  }

  /**
   * Stop recognition gracefully
   */
  public stop(): string {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Safe ignore
      }
    }
    this.isListening = false;
    return this.currentFinalTranscript;
  }

  /**
   * Abort recognition immediately
   */
  public abort(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Safe ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
    this.currentFinalTranscript = '';
  }

  /**
   * Current accumulated transcript
   */
  public getTranscript(): string {
    return this.currentFinalTranscript;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
