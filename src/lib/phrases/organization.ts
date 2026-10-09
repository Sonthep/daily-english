import nlp from 'compromise/two';

export interface PhraseGrammarSuggestion {
  category: string;
  tags: string[];
}

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  Noun: 'Noun',
  ProperNoun: 'Proper noun',
  Verb: 'Verb',
  Adjective: 'Adjective',
  Adverb: 'Adverb',
  Pronoun: 'Pronoun',
  Preposition: 'Preposition',
  Conjunction: 'Conjunction',
  Determiner: 'Determiner',
  Interjection: 'Interjection',
  Other: 'Other',
};

const POS_PRIORITY = Object.keys(PART_OF_SPEECH_LABELS);
const MORPHOLOGY_TAGS: Record<string, string> = {
  Singular: 'singular',
  Plural: 'plural',
  Gerund: 'gerund',
  Infinitive: 'infinitive',
  PresentTense: 'present tense',
  PastTense: 'past tense',
  Comparative: 'comparative',
  Superlative: 'superlative',
};

const getTerms = (text: string): Array<{ normal?: string; tags?: string[] }> =>
  nlp(text).terms().json().flatMap((phrase: { terms?: Array<{ normal?: string; tags?: string[] }> }) => phrase.terms || []);

export function suggestPhraseGrammar(
  wordOrPhrase: string,
  context = '',
  currentCategory = 'Other'
): PhraseGrammarSuggestion {
  const target = wordOrPhrase.toLowerCase().replace(/[^a-z0-9'-]+/g, ' ').trim().split(/\s+/)[0];
  const contextTerms = getTerms(context.trim() || wordOrPhrase);
  const targetTerm = contextTerms
    .find((term) => term.normal?.toLowerCase() === target) || getTerms(wordOrPhrase)[0];
  const tags = targetTerm?.tags || [];
  const partOfSpeech = POS_PRIORITY.find((tag) => tags.includes(tag));
  const existingPosCategory = Object.values(PART_OF_SPEECH_LABELS).includes(currentCategory)
    ? currentCategory
    : 'Other';
  const category = partOfSpeech ? PART_OF_SPEECH_LABELS[partOfSpeech] : existingPosCategory;

  const tagSuggestions = Object.entries(MORPHOLOGY_TAGS)
    .filter(([tag]) => tags.includes(tag))
    .map(([, label]) => label);
  const firstVerbIndex = contextTerms.findIndex((term) => term.tags?.includes('Verb'));
  const subjectCandidate = firstVerbIndex > 0
    ? contextTerms.slice(0, firstVerbIndex).reverse().find((term) =>
        term.tags?.some((tag) => ['Noun', 'ProperNoun', 'Pronoun'].includes(tag))
      )
    : undefined;
  if (target && subjectCandidate?.normal?.toLowerCase() === target) tagSuggestions.push('subject');

  return { category, tags: [...new Set(tagSuggestions)] };
}