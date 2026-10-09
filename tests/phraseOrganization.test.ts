import { describe, expect, it } from 'vitest';
import { suggestPhraseGrammar } from '../src/lib/phrases/organization';

describe('Flashcard part-of-speech suggestions', () => {
  it('classifies a context word as a noun without semantic topic tags', () => {
    const suggestion = suggestPhraseGrammar('perspective', 'I love my perspective.');

    expect(suggestion.category).toBe('Noun');
    expect(suggestion.tags).toContain('singular');
  });

  it('classifies verbs and recognizes subjects from sentence context', () => {
    const suggestion = suggestPhraseGrammar('love', 'I love my perspective.');

    expect(suggestion.category).toBe('Verb');
    expect(suggestion.tags).toContain('present tense');
    expect(suggestPhraseGrammar('I', 'I love my perspective.').tags).toContain('subject');
  });

  it('uses Other when the local tagger cannot identify a word', () => {
    expect(suggestPhraseGrammar('').category).toBe('Other');
  });
});