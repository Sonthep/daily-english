# Local Feedback & Privacy — Daily English

Daily English does not use an external AI provider. There is no AI API key, account, or AI request to configure. A captions endpoint can request YouTube transcript text when the learner asks to fetch captions. Flashcard translation is a separate, explicit MyMemory request and is not AI feedback.

## Local Feedback

- The Use it step compares a learner's answer with the lesson's sample answer and labels the result as an example/Self-check.
- Pronunciation tips are reusable local practice guidance based on words the browser speech recognizer did not match. They are not an AI assessment.
- Lessons from saved Resources reuse saved sentences and phrases. Vocabulary lessons use a fixed local template; learners check word meanings themselves.
- Video practice can fetch YouTube transcript text through the app's same-origin serverless route, or accept pasted subtitles/transcripts and bulk text. The route sends the video ID to YouTube and returns caption text; it does not upload audio or call an AI service.
- Videos without a public caption track require a transcript supplied by the learner. Thai translations must be entered manually.

## Data Handling

- Answers, saved vocabulary, and Resource text are not sent to an AI API.
- When captions are requested, the YouTube video ID passes through the app's serverless route to YouTube. The returned transcript is saved locally only after the learner applies it.
- When the learner presses Translate in a Flashcard, the selected word or phrase is sent to MyMemory. MyMemory's terms state that submitted segments may be stored long-term; anonymous use is limited to 5,000 characters per day. Do not send private text.
- Speech synthesis uses browser/device voices. Browser speech recognition may process audio according to the browser vendor's own service and privacy policy; the app does not send audio to an app-managed AI endpoint.
- Existing OpenRouter keys are removed from local storage when the app starts.

## Feedback Contract

Feedback keeps `source: 'example'` and `meaningUnderstood: null`. The app must not present a sample answer or local heuristic as a grammar verdict, pronunciation score, or standardized proficiency result.