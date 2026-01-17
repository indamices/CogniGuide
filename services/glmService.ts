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
### II. MIND MAP ARCHITECT (EVOLUTIONARY TREE STRUCTURE)

**CRITICAL PARADIGM SHIFT: EVOLUTIONARY, NOT ACCUMULATIVE**
The Mind Map is NOT built by stacking new nodes onto existing branches. Instead, it EVOLVES by re-thinking the entire knowledge structure based on ALL accumulated notes.

**EVOLUTIONARY BUILDING STRATEGY:**

1. **Look at ALL Notes**: Analyze the complete \`summaryNotes\` array (ALL notes, not just new ones)
2. **Re-think Structure**: Based on the full knowledge context, design an optimal hierarchical organization
3. **Allow Reorganization**: 
   - Concepts can move to different parents as understanding deepens
   - Categories can be merged or split for better organization
   - Hierarchical levels can be adjusted (a concept might become a category, or vice versa)
   - The root topic structure can evolve as new themes emerge

4. **Return Optimized Tree**: Return the BEST CURRENT structure for ALL accumulated knowledge, not an incremental addition

**TREE STRUCTURE RULES:**

**Hierarchy Requirements:**
- **Single Root**: There must be ONE root concept (the main topic)
- **One Parent Only**: Each concept has exactly ONE parent (strict tree)
- **Depth Limit**: Maximum 4 levels (Root → L1 → L2 → L3 → L4)
- **No Cycles**: Links must form a strict tree with no circular references

**Structure Optimization:**
- **Merge Similar Concepts**: If multiple notes mention similar concepts, merge them into one node
- **Reorganize Categories**: As knowledge grows, reorganize categories for better logical grouping
- **Adjust Hierarchy**: Move concepts up or down levels based on their importance and relationships
- **Simplify Structure**: If the tree becomes too deep or fragmented, flatten or reorganize for clarity

**WHAT TO RETURN:**

You should return \`updatedConcepts\` and \`updatedLinks\` that represent the OPTIMAL current structure for ALL notes, not just additions:

- Include ALL relevant concepts from the notes (deduplicated)
- Include ALL relevant hierarchical links (parent-child relationships)
- Do NOT just append new nodes - REORGANIZE if needed
- If a concept's relationship changed, update its parent link
- If categories need merging, do so

**Example Evolution:**

Initial State:
\`\`\`
相对论 (root)
  ├── 狭义相对论
  └── 广义相对论
\`\`\`

After New Notes About Time Dilation:
\`\`\`
相对论 (root)
  ├── 狭义相对论
  │   ├── 时间膨胀 (NEW - but reorganized under proper parent)
  │   └── 长度收缩
  └── 广义相对论
      └── 引力场
\`\`\`

NOT:
\`\`\`
相对论 (root)
  ├── 狭义相对论
  ├── 广义相对论
  └── 时间膨胀 (WRONG - just added at root level)
\`\`\`

**Current Context You Receive:**
- \`currentConcepts\`: Current concepts in the graph (for reference - you may reorganize them)
- \`currentLinks\`: Current links (for reference - you may change them)
- \`summaryNotes\`: ALL accumulated notes - THIS IS YOUR SOURCE OF TRUTH

**Your Task:**
Based on ALL \`summaryNotes\`, design and return the optimal tree structure. This may involve:
- Keeping existing concepts but moving them to better locations
- Merging concepts that became redundant
- Splitting categories that became too large
- Creating new organizational categories as themes emerge
- Removing outdated or incorrect concepts (if any)

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

  // Build context for evolutionary structure
  const stateContext = `
[System Context]
Current Teaching Mode: ${teachingMode}

[KNOWLEDGE BASE - ALL SUMMARY NOTES (YOUR SOURCE OF TRUTH)]
These are ALL accumulated notes. Use them to design the OPTIMAL current tree structure:
${JSON.stringify(summaryNotes, null, 2)}

[CURRENT GRAPH STATE (FOR REFERENCE ONLY)]
This is the current structure. You may REORGANIZE it based on all notes above.
Current Concepts (${currentConcepts.length}):
${JSON.stringify(currentConcepts.map(c => ({ id: c.id, name: c.name })), null, 2)}

Current Links (${currentLinks.length}):
${JSON.stringify(currentLinks.map(l => ({ source: l.source, target: l.target, rel: l.relationship })), null, 2)}

[INSTRUCTIONS]
Based on ALL notes above, design the OPTIMAL hierarchical tree structure.
- You may reorganize existing concepts
- You may merge, split, or move concepts to better locations
- Return the COMPLETE optimized structure (all relevant concepts and links)
- This is EVOLUTIONARY, not incremental - re-think the whole structure for optimal organization
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
