/**
 * Speech Synthesis Service for Daily English
 * Handles speech audio playback with speed control (0.75x, 1.0x) and voice detection.
 */

export interface SpeechSupportStatus {
  supported: boolean;
  hasEnglishVoice: boolean;
  voiceName: string | null;
}

class SpeechService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isLoaded = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    this.isLoaded = this.voices.length > 0;
  }

  public checkSupport(): SpeechSupportStatus {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return { supported: false, hasEnglishVoice: false, voiceName: null };
    }

    if (!this.isLoaded) {
      this.initVoices();
    }

    const englishVoice = this.getBestEnglishVoice();
    return {
      supported: true,
      hasEnglishVoice: !!englishVoice,
      voiceName: englishVoice ? englishVoice.name : null,
    };
  }

  private getBestEnglishVoice(): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.initVoices();
    }

    // Preferred voice names or languages
    const enUsVoices = this.voices.filter((v) => v.lang.startsWith('en-US') || v.lang.startsWith('en_US'));
    const anyEnVoices = this.voices.filter((v) => v.lang.startsWith('en'));

    // Try to find a natural or standard voice
    const naturalVoice = [...enUsVoices, ...anyEnVoices].find(
      (v) => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google')
    );

    if (naturalVoice) return naturalVoice;
    if (enUsVoices.length > 0) return enUsVoices[0];
    if (anyEnVoices.length > 0) return anyEnVoices[0];
    return this.voices[0] || null;
  }

  public speak(
    text: string,
    rate: 0.75 | 1.0 = 1.0,
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onError) onError(new Error('SpeechSynthesis not supported'));
      return false;
    }

    // Cancel any active utterance
    this.stop();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.pitch = 1.0;

      const voice = this.getBestEnglishVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        // Don't treat user-interrupted cancellations as errors
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          if (onError) onError(e);
        }
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      if (onError) onError(err);
      return false;
    }
  }

  public isSpeaking(): boolean {
    return this.currentUtterance !== null;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }
}

export const speechService = new SpeechService();
