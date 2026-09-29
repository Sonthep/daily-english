import { describe, expect, it } from 'vitest';
import { rankEnglishVoices } from '../src/lib/audio/speech';

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