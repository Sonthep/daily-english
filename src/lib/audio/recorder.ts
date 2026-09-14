/**
 * In-Memory Audio Recording Service for Daily English
 * Handles microphone recording, playback, and track cleanup.
 */

export type RecorderState = 'idle' | 'recording' | 'recorded' | 'playing' | 'denied' | 'unsupported';

export interface RecorderError {
  type: 'permission_denied' | 'not_found' | 'unsupported' | 'unknown';
  message: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private audioUrl: string | null = null;
  private audioElement: HTMLAudioElement | null = null;

  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!window.navigator?.mediaDevices?.getUserMedia &&
      typeof window.MediaRecorder !== 'undefined'
    );
  }

  /**
   * Starts recording audio from user microphone.
   * Requests permission on first invocation.
   */
  public async start(): Promise<{ success: boolean; error?: RecorderError }> {
    if (!AudioRecorder.isSupported()) {
      return {
        success: false,
        error: {
          type: 'unsupported',
          message: 'เบราว์เซอร์นี้ไม่รองรับการอัดเสียงผ่านไมโครโฟน กรุณาใช้โหมดพิมพ์แทน',
        },
      };
    }

    this.cleanup();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.mediaStream, { mimeType })
        : new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(200); // chunk every 200ms
      return { success: true };
    } catch (err: unknown) {
      this.cleanup();
      const errorObj = err as { name?: string; message?: string };
      if (
        errorObj.name === 'NotAllowedError' ||
        errorObj.name === 'PermissionDeniedError'
      ) {
        return {
          success: false,
          error: {
            type: 'permission_denied',
            message: 'ไม่สามารถเข้าถึงไมโครโฟนได้ คุณสามารถฝึกโดยใช้โหมดพิมพ์ข้อความแทนได้ครับ',
          },
        };
      }
      if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: 'ไม่พบอุปกรณ์ไมโครโฟนในเครื่องนี้ คุณสามารถฝึกโดยใช้โหมดพิมพ์ข้อความแทนได้ครับ',
          },
        };
      }
      return {
        success: false,
        error: {
          type: 'unknown',
          message: 'เกิดข้อผิดพลาดในการเปิดไมโครโฟน สามารถใช้โหมดพิมพ์แทนได้ครับ',
        },
      };
    }
  }

  /**
   * Stops recording and returns the in-memory object URL.
   */
  public async stop(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.stopStreamTracks();
        resolve(this.audioUrl);
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.stopStreamTracks();
        if (this.audioChunks.length > 0) {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const blob = new Blob(this.audioChunks, { type: mimeType });
          this.audioUrl = URL.createObjectURL(blob);
        }
        resolve(this.audioUrl);
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        this.stopStreamTracks();
        resolve(null);
      }
    });
  }

  /**
   * Plays the recorded audio back.
   */
  public play(onEnded?: () => void, onError?: () => void) {
    if (!this.audioUrl) return;

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    this.audioElement = new Audio(this.audioUrl);
    this.audioElement.onended = () => {
      this.audioElement = null;
      if (onEnded) onEnded();
    };
    this.audioElement.onerror = () => {
      this.audioElement = null;
      if (onError) onError();
    };

    this.audioElement.play().catch(() => {
      if (onError) onError();
    });
  }

  /**
   * Stops playback.
   */
  public stopPlayback() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }
  }

  /**
   * Releases microphone tracks.
   */
  private stopStreamTracks() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Full cleanup: stops tracks, stops playback, and revokes object URL.
   */
  public cleanup() {
    this.stopPlayback();
    this.stopStreamTracks();
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    this.audioChunks = [];
    this.mediaRecorder = null;
  }
}
