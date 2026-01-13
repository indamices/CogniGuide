import { ChatMessage, TutorResponse, ConceptNode, ConceptLink, TeachingMode, MessageRole } from "../types";

// DeepSeek-Optimized Instruction (Concise & Imperative)
// DeepSeek follows strict instructions better than complex role-playing
const DEEPSEEK_INSTRUCTION = `
You are CogniGuide v1.0.6.
TASK: Act as an intelligent tutor for the user.

[1. TEACHING STRATEGY]
Based on the current mode, interact with the user:
- Auto: Adaptive (Socratic for concepts, Narrative for history).
- Socratic: Ask probing questions. Guide the user.
- Narrative: Use storytelling and analogies.
- Lecture: Give direct, clear explanations.

[2. KNOWLEDGE MANAGEMENT (CONSOLIDATION)]
- **Summary Notes**: Record ONLY high-value, consolidated facts or insights. Avoid fragmented notes. Wait for a sub-topic to be clear before recording.
- **Mind Map**: Update 'updatedConcepts' and 'updatedLinks' to reflect the structure of the notes. Use a Tree Structure (Root -> Category -> Detail).

[3. JSON OUTPUT RULES]
You MUST output valid JSON.
The response object must have this EXACT structure:
{
  "conversationalReply": "YOUR RESPONSE TEXT HERE (Required)",
  "internalThought": "Brief logic",
  "detectedStage": "Introduction" | "Construction" | "Consolidation" | "Transfer" | "Reflection",
  "updatedConcepts": [{ "id": "snake_case", "name": "Chinese Name", "mastery": "Novice"|"Competent"|"Expert", "description": "Short def" }],
  "updatedLinks": [{ "source": "id1", "target": "id2", "relationship": "is part of" }],
  "appliedStrategy": "Strategy Name",
  "cognitiveLoadEstimate": "Low" | "Optimal" | "High",
  "summaryFragments": ["Note 1", "Note 2"]
}

IMPORTANT:
1. 'conversationalReply' must be the FIRST field and MUST NOT be empty.
2. Speak in Simplified Chinese.
`;

export const sendMessageToDeepSeek = async (
  history: ChatMessage[],
  currentConcepts: ConceptNode[],
  currentLinks: ConceptLink[],
  summaryNotes: string[],
  apiKey: string,
  modelName: string, // "V3.2" (Chat) or "V3.2Think" (Reasoner)
  teachingMode: TeachingMode
): Promise<TutorResponse> => {
  
  // 1. History Cleaning
  // Filter out previous fallback messages or empty messages
  const cleanHistory = history.filter(msg => {
      if (!msg.content) return false;
      if (msg.role === MessageRole.Model) {
          return !msg.content.includes("知识库已更新");
      }
      return true;
  });

  const historyContext = cleanHistory.map(msg => ({
    role: msg.role === MessageRole.User ? 'user' : 'assistant',
    content: msg.content,
  }));

  // 2. Simplified Context Injection
  // Don't overwhelm DeepSeek with too much metadata. Keep it high-level.
  const stateContext = `
[CONTEXT]
Mode: ${teachingMode}
Current Notes: ${summaryNotes.slice(-5).join('; ')}... (Total: ${summaryNotes.length})
Current Nodes: ${currentConcepts.map(c => c.name).join(', ')}
  `;

  const isReasoner = modelName === 'V3.2Think';
  const apiModelName = isReasoner ? 'deepseek-reasoner' : 'deepseek-chat';

  // Construct Payload
  let messagesPayload = [];

  if (isReasoner) {
      // FOR R1 (REASONER):
      // R1 works best when instructions are in the User Prompt.
      // We reconstruct the flow so the instructions are visible in the final turn.
      
      const lastUserMsg = historyContext[historyContext.length - 1];
      const previousMsgs = historyContext.slice(0, -1);

      // Add context to previous messages if needed, but primarily inject into the active prompt
      messagesPayload = [
          ...previousMsgs,
          {
              role: 'user',
              content: `${DEEPSEEK_INSTRUCTION}\n\n${stateContext}\n\nUser Input: ${lastUserMsg.content}\n\n[MANDATORY]: Respond in JSON. Fill 'conversationalReply' first.`
          }
      ];

  } else {
      // FOR V3 (CHAT):
      // System prompt is effective.
      messagesPayload = [
          { role: 'system', content: DEEPSEEK_INSTRUCTION },
          ...historyContext.slice(0, -1),
          {
              role: 'user',
              content: `${stateContext}\n\nUser Input: ${historyContext[historyContext.length - 1].content}`
          }
      ];
  }

  const payload = {
    model: apiModelName,
    messages: messagesPayload,
    stream: false,
    response_format: { type: 'json_object' }
  };

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`DeepSeek API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    let content = choice.message.content;
    const reasoning = choice.message.reasoning_content;

    if (!content) throw new Error("Empty response from DeepSeek");

    // Robust JSON Extraction (Handle Markdown blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        content = jsonMatch[0];
    } else {
        content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    }

    let parsed: TutorResponse;
    try {
        parsed = JSON.parse(content);
    } catch (e) {
        console.error("DeepSeek JSON Parse Error", content);
        throw new Error("DeepSeek response was not valid JSON");
    }

    // Smart Fallback Generation
    if (!parsed.conversationalReply || parsed.conversationalReply.trim() === "") {
        if (parsed.summaryFragments && parsed.summaryFragments.length > 0) {
            const points = parsed.summaryFragments.map((f: string) => `• ${f}`).join('\n');
            parsed.conversationalReply = `(AI: 我已记录以下要点)\n${points}\n\n请继续。`;
        } else {
            parsed.conversationalReply = isReasoner 
                ? "（AI 思考完毕，已更新知识结构，请查看右侧。）" 
                : "（收到，请继续。）";
        }
    }

    // Append R1 Thinking process to internal thought for visibility
    if (reasoning) {
        parsed.internalThought = `[THINKING]\n${reasoning.substring(0, 200)}...\n\n[DECISION]\n${parsed.internalThought || ''}`;
    }

    return parsed;

  } catch (error) {
    console.error("DeepSeek Service Error:", error);
    throw error;
  }
};