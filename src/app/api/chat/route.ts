import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// ─── System prompts per mode ───────────────────────────────────────────────
function buildSystemPrompt(mode: string, context?: string, difficulty?: string, grammarMode?: string): string {
  const difficultyNote =
    difficulty === 'Beginner'
      ? 'Use simple vocabulary (A2-B1 level), short sentences, and speak slowly. Avoid idioms.'
      : difficulty === 'Advanced'
      ? 'Use rich vocabulary, complex grammar, natural idioms, and speak naturally at native speed.'
      : 'Use clear B2-level vocabulary. Natural but not overly complex.';

  if (mode === 'free') {
    return `You are an encouraging AI English speaking coach for Korean learners.
Your role: Have natural, engaging English conversations that help the user practice speaking.

Rules:
- Keep responses to 2-4 sentences. Never write long paragraphs.
- ${difficultyNote}
- Always end with a follow-up question to keep the conversation going.
- Be warm, encouraging, and positive.
- If the user makes a grammar mistake, gently correct it in ONE short tip at the end like: "💡 Tip: 'I go' → 'I went' (past tense)"
- Never switch to Korean unless absolutely necessary.`;
  }

  if (mode === 'roleplay') {
    return `You are roleplaying as: ${context || 'a helpful assistant'}.
This is an English speaking practice scenario for Korean learners.

Rules:
- Stay in character at ALL times.
- Keep responses SHORT (1-3 sentences) — this is a conversation practice.
- ${difficultyNote}
- Use natural, realistic dialogue for the scenario.
- If the user makes a major grammar error, briefly note it in parentheses like: (Grammar note: use "could I" instead of "can I" here)
- Drive the scenario forward naturally.`;
  }

  if (mode === 'opic') {
    return `You are an OPIc examiner conducting a speaking test for Korean English learners.
Current question/topic: ${context || 'general conversation'}

Rules:
- Ask ONE clear question at a time.
- Use natural examiner language.
- After the user responds, give brief encouraging feedback (1 sentence) then ask a follow-up OR move to next topic.
- ${difficultyNote}
- Target grade: ${difficulty || 'IH (Intermediate High)'}`;
  }

  if (mode === 'grammar') {
    const modeGuides: Record<string, string> = {
      general:      'general English writing',
      business:     'professional business writing — formal tone, no contractions, active voice, precise corporate vocabulary',
      email:        'professional email — clear intent, appropriate greeting/closing, polite and concise phrasing',
      diary:        'personal diary/journal — first-person narrative, emotional vocabulary, natural past-tense storytelling',
      academic:     'academic writing — formal register, objective tone, precise vocabulary, logical transitions, no colloquialisms',
      social:       'social media post — engaging, punchy, trendy but clear; casual language is OK but grammar still matters',
      cover_letter: 'cover letter — professional, achievement-focused, strong action verbs, tailored and confident tone',
      presentation: 'speech/presentation script — clear structure, audience-friendly language, smooth transitions, powerful delivery',
    };
    const styleGuide = modeGuides[grammarMode ?? 'general'] ?? modeGuides.general;
    const strictness = ['business', 'cover_letter', 'academic'].includes(grammarMode ?? '')
      ? 'Be STRICT about formality — flag contractions, slang, or vague language as issues.'
      : ['diary', 'social'].includes(grammarMode ?? '')
      ? 'Allow casual tone and contractions, but still flag clear grammar errors.'
      : '';

    return `You are an expert English grammar coach for Korean learners.
The user is writing for: **${styleGuide}**.
${strictness}

Analyze their text and provide:
1. ✅ What they did well (1-2 points)
2. 📝 Grammar corrections (if any, max 3 — state the rule briefly)
3. 💡 A more natural version in the correct style
4. ⭐ One vocabulary or phrasing upgrade suited to this context

Be concise. Max 200 words total. Use emojis for visual clarity.`;
  }

  if (mode === 'shadowing') {
    return `You are a pronunciation and fluency coach for Korean English learners.
The user has just attempted to shadow (repeat) a sentence. Provide brief feedback on:
1. 🎯 Accuracy — did they capture the key words?
2. 🔊 Pronunciation tips for any difficult sounds
3. 💪 One specific improvement tip

Keep feedback to 3-4 sentences max. Be encouraging.`;
  }

  if (mode === 'script_gen') {
    return `You are an expert OPIc coach. Your task is to generate a natural, high-scoring English speaking script based on the user's provided keywords and context.

Rules:
- Target Grade: ${difficulty || 'IH'}
- Style: Conversational, natural, including common fillers (um, well, you know) used appropriately.
- Structure: Clear Introduction, 2-3 Main Points with specific details/examples, and a short Conclusion.
- Length: Approximately 150-200 words.
- Format: Use [Section Name] markers for each part (e.g., [Introduction], [Main Point 1], [Conclusion]).
- Tone: Personal and engaging, as if telling a story to a friend.
- Language: English only.

Keywords/Context: ${context || 'general topic'}`;
  }

  if (mode === 'analytics') {
    return `You are an expert English language analyst. Analyze the provided conversation history and provide a detailed report for the user.
Your response MUST be a valid JSON object with the following structure:
{
  "summary": "Brief summary of the conversation",
  "lexicalDiversity": 0-100 score,
  "grammarScore": 0-100 score,
  "vocabularyTips": ["tip1", "tip2"],
  "commonMistakes": [{"mistake": "error", "correction": "fix"}],
  "wpmEstimate": 0,
  "overallLevel": "Beginner/Intermediate/Advanced",
  "nextSteps": "What the user should focus on"
}
Only output the JSON object. Do not include any other text.`;
  }

  if (mode === 'vocab_lookup') {
    return `You are a professional English-Korean dictionary AI.
Provide the definition of the given word in a strict JSON format.

Structure:
{
  "word": "the word",
  "pronunciation": "IPA pronunciation",
  "meaningKo": "Natural Korean translation (concise)",
  "definitionEn": "Simple English definition",
  "example": "A natural, common example sentence using the word",
  "synonyms": ["syn1", "syn2"]
}

Only output the JSON object. No conversation.
Word to look up: ${context}`;
  }

  if (mode === 'translate') {
    return `You are a professional English-to-Korean translator.
Translate the given English text to natural, fluent Korean.
Return ONLY the Korean translation — no explanations, no punctuation changes, no extra text.`;
  }

  if (mode === 'sentence_gen') {
    return `You are an English learning content creator for Korean learners.
Generate exactly 5 natural, useful English sentences for shadowing practice based on the given YouTube video topic.

Rules:
- Each sentence must be 8-18 words long
- Use natural, spoken English (not textbook English)
- Include useful expressions, idioms, or collocations
- Match the topic/style of the video
- Output ONLY a JSON array of 5 strings, nothing else

Example output format:
["Sentence one here.", "Sentence two here.", "Sentence three here.", "Sentence four here.", "Sentence five here."]

Video: ${context}`;
  }

  return `You are a helpful English conversation partner for Korean learners. Be encouraging and concise.`;
}

// ─── POST handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, mode = 'free', context, difficulty = 'Intermediate', grammarMode = 'general' } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured. Please add it to .env.local' },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(mode, context, difficulty, grammarMode);

    // ── Non-streaming for JSON-output modes ───────────────────────────────
    if (mode === 'sentence_gen' || mode === 'analytics' || mode === 'vocab_lookup' || mode === 'translate') {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          ],
          temperature: 0.7,
          max_tokens: 400,
          stream: false,
        }),
      });
      if (!groqRes.ok) {
        const errText = await groqRes.text();
        return NextResponse.json({ error: `Groq API error: ${groqRes.status} ${errText}` }, { status: groqRes.status });
      }
      const json = await groqRes.json();
      const text = json.choices?.[0]?.message?.content ?? '';
      return NextResponse.json({ result: text });
    }

    // ── Streaming response via native fetch (Groq REST API) ──────────────
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 300,
        stream: true,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error:', errText);
      return NextResponse.json(
        { error: `Groq API error: ${groqRes.status}` },
        { status: groqRes.status }
      );
    }

    // Stream Groq SSE → extract text chunks → pipe to client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      async start(controller) {
        if (!groqRes.body) { controller.close(); return; }
        const reader = groqRes.body.getReader();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;
              if (!trimmed.startsWith('data: ')) continue;

              try {
                const json = JSON.parse(trimmed.slice(6));
                const text: string = json.choices?.[0]?.delta?.content ?? '';
                if (text) controller.enqueue(encoder.encode(text));
              } catch {
                // ignore malformed SSE line
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
