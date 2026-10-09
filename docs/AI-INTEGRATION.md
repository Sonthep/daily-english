# Local Feedback & Privacy — Daily English

Daily English does not use an external AI provider. There is no API key, account, proxy, or AI request to configure.

## Local Feedback

- The Use it step compares a learner's answer with the lesson's sample answer and labels the result as an example/Self-check.
- Pronunciation tips are reusable local practice guidance based on words the browser speech recognizer did not match. They are not an AI assessment.
- Lessons from saved Resources reuse saved sentences and phrases. Vocabulary lessons use a fixed local template; learners check word meanings themselves.
- Video practice accepts pasted subtitles/transcripts, bulk text, or browser speech recognition where supported. Pasted text is parsed in the app.

## Data Handling

- Answers, saved vocabulary, and Resource text are not sent to an AI API.
- Speech synthesis uses browser/device voices. Browser speech recognition may process audio according to the browser vendor's own service and privacy policy; the app does not send audio to an app-managed AI endpoint.
- Existing OpenRouter keys are removed from local storage when the app starts.

## Feedback Contract

Feedback keeps `source: 'example'` and `meaningUnderstood: null`. The app must not present a sample answer or local heuristic as a grammar verdict, pronunciation score, or standardized proficiency result.