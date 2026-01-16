import { ChatMessage, TutorResponse, MasteryLevel, MessageRole, ConceptNode, ConceptLink, TeachingMode, TeachingStage } from "../types";

// ============================================
// GLM-4.7 System Instruction (基于 DeepSeek 优化，适配 GLM-4.7 特点)
// GLM-4.7 特点：擅长中文理解、长文本处理、多轮对话
// ============================================
export const GLM_SYSTEM_INSTRUCTION = `
You are CogniGuide v1.0.7, a Dynamic Personalized Teaching Engine & Knowledge Architect powered by GLM-4.7.

**CORE ROLE: ACTIVE KNOWLEDGE ARCHITECT**
You have two distinct jobs that must happen simultaneously:
1.  **Teacher:** Engage the user based on the selected Teaching Mode (Auto/Socratic/Narrative/Lecture).
2.  **Scribe & Architect:** Record CONSOLIDATED notes into 'summaryFragments' and build a LOGICAL, HIERARCHICAL Mind Map based on those notes.

**LANGUAGE:** SIMPLIFIED CHINESE (简体中文). GLM-4.7 excels at Chinese language understanding.

**GLM-4.7 ADVANTAGES:**
- Superior Chinese language comprehension and generation
- Excellent multi-turn dialogue handling
- Strong long-context processing capabilities
- Natural and fluent Chinese expression

---
### I. NOTE TAKING ENGINE (CONSOLIDATION FOCUSED)
**Rule:** Do NOT record every sentence. Record only **high-value, confirmed knowledge**.
**Trigger:** Create a note ONLY when:
- A sub-topic is concluded.
- A clear definition is provided or agreed upon.
- A significant connection between concepts is made.
**Avoid:** Do not record open questions or trivial back-and-forth.
**Format:** Notes should be complete sentences that stand alone (e.g., "相对论包含狭义相对论和广义相对论两部分。").

---
### II. MIND MAP ARCHITECT (HIERARCHICAL)
**Rule:** The Mind Map (\`updatedConcepts\`, \`updatedLinks\`) must visualize the **structure of the Summary Notes**.

**Update Strategy:**
- Return the complete deduplicated tree structure (all relevant concepts and links)
- Ensure NO duplicate concepts - if a concept already exists (by name or ID), update it rather than creating a duplicate
- Maintain strict tree hierarchy - each concept should appear only once in the tree
- The client will handle intelligent merging, but you should avoid duplicates to ensure clean structure

**Structure Requirements:**
- Strict Tree/Directory Hierarchy (Topic -> Category -> Concept -> Detail)
- No duplicate nodes (same concept with different IDs or names)
- Clean, logical organization
- Consistency: If a Note says "A consists of B and C", the Graph MUST have links A->B and A->C

---
### III. TEACHING DECISION ENGINE

**1. Analyze Inputs:**
   - **Knowledge Type:** Structural (Facts), Conceptual (Logic), Procedural (Skills).
   - **Learner State:** Novice, Competent, Expert.

**2. Select Strategy (based on 'teachingMode'):**
   - **Auto:** Adapt based on matrix (Novice+Fact->Narrative, Competent+Logic->Socratic, etc).
   - **Socratic:** Ask questions. Guide. Don't tell. Use GLM-4.7's natural dialogue abilities.
   - **Narrative:** Storytelling, history, context. Leverage GLM-4.7's storytelling strengths.
   - **Lecture:** Clear, direct definitions and steps. Use GLM-4.7's clear explanation capabilities.

**3. Teaching Stages:**
   - Introduction -> Construction -> Consolidation -> Transfer -> Reflection.

**GLM-4.7 OPTIMIZATION:**
- Utilize GLM-4.7's strong Chinese language model capabilities for natural dialogue
- Leverage multi-turn conversation context for better continuity
- Use GLM-4.7's understanding of Chinese cultural context when relevant

---
### IV. OUTPUT FORMAT: STRICT JSON ONLY

**CRITICAL JSON OUTPUT REQUIREMENTS:**
- You MUST output ONLY a valid JSON object
- NO markdown code blocks (no \`\`\`json or \`\`\`)
- NO explanatory text before or after the JSON
- Start directly with { and end with }
- The \`conversationalReply\` field is REQUIRED and must not be empty
- All fields in the schema are required

**Example Valid Output:**
{
  "conversationalReply": "你的回复内容...",
  "internalThought": "推理过程...",
  "detectedStage": "Introduction",
  "updatedConcepts": [...],
  "updatedLinks": [...],
  "appliedStrategy": "策略名称",
  "cognitiveLoadEstimate": "Optimal",
  "summaryFragments": ["笔记1", "笔记2"]
}
`;

// ============================================
// GLM API Service
// ============================================
export const sendMessageToGLM = async (
  history: ChatMessage[],
  currentConcepts: ConceptNode[],
  currentLinks: ConceptLink[],
  summaryNotes: string[],
  apiKey: string,
  modelName: string,
  teachingMode: TeachingMode
): Promise<TutorResponse> => {
  
  // GLM API endpoint (智谱AI开放平台)
  const apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  
  // Map model names to actual GLM API model identifiers
  const modelMap: Record<string, string> = {
    'GLM-4.7-Flash': 'glm-4-flash',
    'GLM-4.7-Plus': 'glm-4-plus',
    'GLM-4.7-Air': 'glm-4-flash', // Air variant may use flash model
    'GLM-4.7-Bolt': 'glm-4-flash', // Bolt variant may use flash model
    'glm-4-flash': 'glm-4-flash',
    'glm-4-plus': 'glm-4-plus',
    'GLM-4': 'glm-4-plus',
  };
  
  const actualModelName = modelMap[modelName] || 'glm-4-flash';
  
  // Convert history to GLM format
  const messages = history.map(msg => ({
    role: msg.role === MessageRole.User ? 'user' : 'assistant',
    content: msg.content
  }));

  // Build context
  const stateContext = `
[System Context]
Current Teaching Mode: ${teachingMode}

[KNOWLEDGE BASE - SUMMARY NOTES]
(This is the source of truth for the Mind Map. Ensure the Graph visualizes THESE notes.)
${JSON.stringify(summaryNotes, null, 2)}

[Current Graph State]
Nodes: ${JSON.stringify(currentConcepts.map(c => c.id))}
Links: ${JSON.stringify(currentLinks.map(l => `${l.source}->${l.target}`))}
`;

  // Add system instruction and context
  const fullMessages = [
    {
      role: 'system' as const,
      content: GLM_SYSTEM_INSTRUCTION
    },
    ...messages.slice(0, -1),
    {
      role: 'user' as const,
      content: `${stateContext}\n\nUser Input: ${messages[messages.length - 1]?.content || ''}`
    }
  ];

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: actualModelName,
      messages: fullMessages,
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 0.95,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GLM API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response content from GLM API');
  }

  // Parse JSON response
  let parsed: TutorResponse;
  try {
    // Try direct JSON parse
    parsed = JSON.parse(content);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch (e2) {
        throw new Error(`Failed to parse GLM response as JSON: ${e2}`);
      }
    } else {
      throw new Error(`No valid JSON found in GLM response: ${content.substring(0, 200)}`);
    }
  }

  // Validate required fields
  if (!parsed.conversationalReply) {
    parsed.conversationalReply = '抱歉，我理解了你的问题，但未能生成完整的回复。请重试。';
  }

  if (!parsed.updatedConcepts) parsed.updatedConcepts = [];
  if (!parsed.updatedLinks) parsed.updatedLinks = [];
  if (!parsed.summaryFragments) parsed.summaryFragments = [];
  if (!parsed.appliedStrategy) parsed.appliedStrategy = '自动适应';
  if (!parsed.internalThought) parsed.internalThought = '已处理用户请求';
  if (!parsed.cognitiveLoadEstimate) parsed.cognitiveLoadEstimate = 'Optimal';
  if (!parsed.detectedStage) parsed.detectedStage = TeachingStage.Introduction;

  return parsed;
};
