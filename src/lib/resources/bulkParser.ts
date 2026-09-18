import { ResourceSentence } from '../../types';

/**
 * Parses raw pasted text (lyrics, interview transcripts, subtitles, or bilingual text)
 * into a structured list of ResourceSentence objects.
 */
export function parseBulkTextToSentences(rawText: string): ResourceSentence[] {
  if (!rawText || !rawText.trim()) return [];

  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Regex helpers
  const timestampRegex = /(?:\[|\()?(\d{1,2}:\d{2}(?::\d{2})?)(?:\]|\))?/;
  const srtArrowRegex = /(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/;
  const isThaiRegex = /[\u0E00-\u0E7F]/;

  const sentences: ResourceSentence[] = [];
  let pendingSentence: { en: string; timestamp?: string } | null = null;
  let currentTimestamp: string | undefined = undefined;

  const flushPending = () => {
    if (pendingSentence) {
      sentences.push({
        id: `bs_${Date.now()}_${sentences.length + 1}`,
        en: pendingSentence.en,
        th: '',
        timestamp: pendingSentence.timestamp,
      });
      pendingSentence = null;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Skip pure SRT sequence numbers (e.g. "1", "2", "3") and flush any prior sentence
    if (/^\d+$/.test(line)) {
      flushPending();
      continue;
    }

    // Check for SRT/VTT arrow timestamp line (e.g. "00:01:24,000 --> 00:01:28,000")
    const srtMatch = line.match(srtArrowRegex);
    if (srtMatch) {
      flushPending();
      // Convert "00:01:24" to "01:24"
      const timePart = srtMatch[1].slice(3, 8);
      currentTimestamp = timePart;
      continue;
    }

    // Check for inline timestamp e.g. "[01:24] Hello world" or "01:24 - Hello world"
    let cleanLine = line;
    let activeTimestamp: string | undefined = currentTimestamp;
    const timeMatch = cleanLine.match(timestampRegex);
    if (timeMatch) {
      activeTimestamp = timeMatch[1];
      cleanLine = cleanLine.replace(timeMatch[0], '').replace(/^[\s\-–—:]+/, '').trim();
      currentTimestamp = undefined;
    }

    if (!cleanLine) {
      if (activeTimestamp) {
        currentTimestamp = activeTimestamp;
      }
      continue;
    }

    // Check if line contains both English and Thai separated by delimiter: " / ", " - ", " — ", " : "
    const delimiterMatch = cleanLine.match(/^(.*?)\s+(?:[/—–]|-(?!>))\s+(.*)$/);
    if (delimiterMatch) {
      const part1 = delimiterMatch[1].trim();
      const part2 = delimiterMatch[2].trim();

      const part1HasThai = isThaiRegex.test(part1);
      const part2HasThai = isThaiRegex.test(part2);

      if (!part1HasThai && part2HasThai) {
        // part1 is EN, part2 is TH
        flushPending();
        sentences.push({
          id: `bs_${Date.now()}_${sentences.length + 1}`,
          en: part1,
          th: part2,
          timestamp: activeTimestamp,
        });
        currentTimestamp = undefined;
        continue;
      } else if (part1HasThai && !part2HasThai) {
        // part1 is TH, part2 is EN
        flushPending();
        sentences.push({
          id: `bs_${Date.now()}_${sentences.length + 1}`,
          en: part2,
          th: part1,
          timestamp: activeTimestamp,
        });
        currentTimestamp = undefined;
        continue;
      }
    }

    const hasThai = isThaiRegex.test(cleanLine);

    if (hasThai) {
      if (pendingSentence) {
        // This Thai line translates the pending English line
        sentences.push({
          id: `bs_${Date.now()}_${sentences.length + 1}`,
          en: pendingSentence.en,
          th: cleanLine,
          timestamp: pendingSentence.timestamp || activeTimestamp,
        });
        pendingSentence = null;
        currentTimestamp = undefined;
      } else {
        // Standalone Thai line without previous English line
        sentences.push({
          id: `bs_${Date.now()}_${sentences.length + 1}`,
          en: cleanLine,
          th: '',
          timestamp: activeTimestamp,
        });
        currentTimestamp = undefined;
      }
    } else {
      // English line
      flushPending();
      pendingSentence = {
        en: cleanLine,
        timestamp: activeTimestamp,
      };
      currentTimestamp = undefined;
    }
  }

  // Push any remaining pending line at the end
  flushPending();

  return sentences;
}
