export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { messages, formData, interviewStep } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY_SERVER || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Format the past chat messages into Gemini content parts structure
    const formattedHistory = (messages || []).map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const systemPrompt = `You are Oracle, the central intelligence and creative companion of the WHISPRR ecosystem. Your goal is to guide the user to forge an unforgettable NEXA character.
You collaborate as a knowledgeable friend, not a rigid questionnaire. Be creative, encouraging, and helpful. You can brainstorm names, explain fantasy races, write psychological definitions, suggest dialogue, improve drafts, and help solve writer's block.

Current state of the character being built (the formData):
- Name: "${formData?.name || ''}"
- Description/Concept: "${formData?.longDescription || ''}"
- Personality/Mind: "${formData?.personality || ''}"
- Greeting message: "${formData?.greeting || ''}"
- Opening Scene Scenario: "${formData?.scenario || ''}"
- Category/Genre: "${formData?.category || ''}"
- Tags & Classifications: "${formData?.tagsString || ''}"

We are currently focused on Step ${interviewStep}. The steps are:
Step 0: Character Name (Input current: ${formData?.name ? 'complete' : 'needed'})
Step 1: Bio & Concept (Input current: ${formData?.longDescription ? 'complete' : 'needed'})
Step 2: Personality Traits & Mind (Input current: ${formData?.personality ? 'complete' : 'needed'})
Step 3: Greeting Message / Voice (Input current: ${formData?.greeting ? 'complete' : 'needed'})
Step 4: Opening Scene Scenario / Context (Input current: ${formData?.scenario ? 'complete' : 'needed'})
Step 5: Category/Genre & Themes/Moods (Input current: ${formData?.category ? 'complete' : 'needed'})
Step 6: Avatar Image (Input current: ${formData?.avatarUrl ? 'complete' : 'needed'})

Classifications available:
- Genres: Romance, Fantasy, Sci-Fi, Horror, Mystery, Action, Adventure, Historical, Slice of Life
- Themes: Age Regression, Comfort, Healing, Angst, Found Family, Domestic Life, School Life, Parenthood
- Relationship Dynamics: Lovers, Friends, Family, Caregiver, Mentor, Rivals, Siblings
- Settings: Modern, Medieval, School, Space, Apocalypse, Cyberpunk
- Moods: Wholesome, Emotional, Dark, Psychological, Comedic, Cozy

Rules of Interaction:
1. If the user asks a question (e.g. "What is Stockholm Syndrome?", "Brainstorm medieval names", "What's the difference between opening scene and greeting?"), explain it clearly, reassuringly, and creatively first. Then, steer the conversation back to the active step (e.g., "Now, where were we? Tell me about where they first meet.")
2. If the user answers the current step, acknowledge it warmly, extract the field data, and ask the next step's question.
3. In Step 5, help the user choose a Genre and suggest relevant Themes, Relationship Dynamics, Settings, and Mood tags based on their character concept.
4. Keep responses conversational, warm, and highly engaging.

Return your response strictly as a JSON object with keys:
- "response": Your reply text to show in the chat.
- "extractedField": The key of the field updated in this turn, or null. The keys are: "name", "longDescription", "personality", "greeting", "scenario", "category", "avatarUrl", "tagsString".
- "extractedValue": The value for the updated field, or null. For "tagsString", return a comma-separated list of tags (e.g. "Comfort, Healing, Lovers, Cozy").
- "shouldAdvance": Boolean indicating if the user has successfully answered the active step and we should move to the next.
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: formattedHistory,
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return new Response(JSON.stringify({ error: 'Gemini model generated an error', details: errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiData = await geminiRes.json();
    const rawReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Parse response
    let parsedJson = { response: "I couldn't process that. Could you try again?", extractedField: null, extractedValue: null, shouldAdvance: false };
    try {
      parsedJson = JSON.parse(rawReply);
    } catch (e) {
      console.error('Error parsing JSON from Gemini:', e);
    }

    return new Response(JSON.stringify(parsedJson), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
