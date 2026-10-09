import { describe, expect, it } from 'vitest';
import {
  clearStoredVoicePreferences,
  getStoredVoiceGender,
  getStoredVoiceURI,
  rankEnglishVoices,
  setStoredVoiceGender,
  setStoredVoiceURI,
} from '../src/lib/audio/speech';

function voice(name: string, lang: string, localService = true): SpeechSynthesisVoice {
  return { name, lang, localService, voiceURI: name, default: false } as SpeechSynthesisVoice;
}

describe('rankEnglishVoices', () => {
  it('prefers natural US voices and excludes non-English voices', () => {
    const ranked = rankEnglishVoices([
      voice('Microsoft David - English (United States)', 'en-US'),
      voice('Microsoft Aria Online (Natural)', 'en-US', false),
      voice('Google UK English Female', 'en-GB'),
      voice('Thai Voice', 'th-TH'),
    ]);

    expect(ranked.map((item) => item.name)).toEqual([
      'Microsoft Aria Online (Natural)',
      'Microsoft David - English (United States)',
      'Google UK English Female',
    ]);
  });
});

describe('voice preferences', () => {
  it('clears only the app voice settings during a reset', () => {
    localStorage.setItem('unrelated-setting', 'keep');
    setStoredVoiceGender('female');
    setStoredVoiceURI('voice-1');

    clearStoredVoicePreferences();

    expect(getStoredVoiceGender()).toBe('male');
    expect(getStoredVoiceURI()).toBe('');
    expect(localStorage.getItem('unrelated-setting')).toBe('keep');
    localStorage.removeItem('unrelated-setting');
  });
});
