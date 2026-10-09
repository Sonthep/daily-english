/**
 * Speech Synthesis Service for Daily English
 * Handles speech audio playback with gender selection (Male/Female),
 * speed control (0.75x, 1.0x), and voice detection.
 */

export type VoiceGender = 'male' | 'female';

const VOICE_GENDER_STORAGE_KEY = 'daily_english_voice_gender';
const VOICE_URI_STORAGE_KEY = 'daily_english_voice_uri';

export function getStoredVoiceGender(): VoiceGender {
  try {
    const saved = localStorage.getItem(VOICE_GENDER_STORAGE_KEY);
    if (saved === 'female') return 'female';
    return 'male'; // Default to Male voice
  } catch {
    return 'male';
  }
}

export function setStoredVoiceGender(gender: VoiceGender): void {
  try {
    localStorage.setItem(VOICE_GENDER_STORAGE_KEY, gender);
  } catch (err) {
    console.warn('Unable to persist voice gender preference', err);
  }
}

export function getStoredVoiceURI(): string {
  try {
    return localStorage.getItem(VOICE_URI_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredVoiceURI(voiceURI: string): void {
  try {
    if (voiceURI) localStorage.setItem(VOICE_URI_STORAGE_KEY, voiceURI);
    else localStorage.removeItem(VOICE_URI_STORAGE_KEY);
  } catch (err) {
    console.warn('Unable to persist voice preference', err);
  }
}

export function clearStoredVoicePreferences(): void {
  try {
    localStorage.removeItem(VOICE_GENDER_STORAGE_KEY);
    localStorage.removeItem(VOICE_URI_STORAGE_KEY);
  } catch (err) {
    console.warn('Unable to clear voice preferences', err);
  }
}

export function rankEnglishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const englishVoices = voices.filter((voice) => /^en([-_]|$)/i.test(voice.lang));
  const naturalTerms = ['natural', 'neural', 'online', 'google', 'siri', 'premium'];
  const score = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    const localeScore = /^en[-_]us/i.test(voice.lang) ? 100 : 0;
    const naturalScore = naturalTerms.some((term) => name.includes(term)) ? 50 : 0;
    const serviceScore = voice.localService === false ? 10 : 0;
    return localeScore + naturalScore + serviceScore;
  };
  return englishVoices.sort((a, b) => score(b) - score(a));
}

export interface SpeechSupportStatus {
  supported: boolean;
  hasEnglishVoice: boolean;
  voiceName: string | null;
  gender: VoiceGender;
}

const MALE_VOICE_NAMES = [
  'male',
  'guy',
  'david',
  'mark',
  'alex',
  'daniel',
  'george',
  'ryan',
  'christopher',
  'brian',
  'andrew',
  'charles',
  'eric',
  'james',
  'tom',
  'aaron',
  'arthur',
  'fred',
];

const FEMALE_VOICE_NAMES = [
  'female',
  'zira',
  'jenny',
  'aria',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'catherine',
  'hazel',
  'susan',
  'linda',
  'stephanie',
];

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

  public getEnglishVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) this.initVoices();
    return rankEnglishVoices(this.voices);
  }

  public checkSupport(): SpeechSupportStatus {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return { supported: false, hasEnglishVoice: false, voiceName: null, gender: getStoredVoiceGender() };
    }

    if (!this.isLoaded) {
      this.initVoices();
    }

    const currentGender = getStoredVoiceGender();
    const englishVoice = this.getBestEnglishVoice(currentGender);
    return {
      supported: true,
      hasEnglishVoice: !!englishVoice,
      voiceName: englishVoice ? englishVoice.name : null,
      gender: currentGender,
    };
  }

  public getBestEnglishVoice(gender: VoiceGender = getStoredVoiceGender()): SpeechSynthesisVoice | null {
    const candidateVoices = this.getEnglishVoices();
    const selectedVoice = candidateVoices.find((voice) => voice.voiceURI === getStoredVoiceURI());
    if (selectedVoice) return selectedVoice;
    const naturalTerms = ['natural', 'neural', 'online', 'google', 'siri', 'premium'];
    const naturalVoice = candidateVoices.find((voice) =>
      naturalTerms.some((term) => voice.name.toLowerCase().includes(term)) || voice.localService === false
    );
    if (naturalVoice) return naturalVoice;

    if (gender === 'male') {
      const anyMale = candidateVoices.find((v) => {
        const name = v.name.toLowerCase();
        return MALE_VOICE_NAMES.some((k) => name.includes(k));
      });
      if (anyMale) return anyMale;

      const nonFemale = candidateVoices.find((v) => {
        const name = v.name.toLowerCase();
        return !FEMALE_VOICE_NAMES.some((k) => name.includes(k));
      });
      if (nonFemale) return nonFemale;
    } else {
      const female = candidateVoices.find((v) => {
        const name = v.name.toLowerCase();
        return FEMALE_VOICE_NAMES.some((k) => name.includes(k));
      });
      if (female) return female;
    }

    if (candidateVoices.length > 0) return candidateVoices[0];
    return this.voices[0] || null;
  }

  public speak(
    text: string,
    rate: 0.75 | 1.0 = 1.0,
    onEnd?: () => void,
    onError?: (err: unknown) => void,
    overrideGender?: VoiceGender
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

      const gender = overrideGender || getStoredVoiceGender();
      const voice = this.getBestEnglishVoice(gender);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.pitch = 1.0;

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
