import { ChatMessage, TutorResponse, MasteryLevel, MessageRole, ConceptNode, ConceptLink, TeachingMode, TeachingStage } from "../types";

// ============================================
// MiniMax System Instruction
// MiniMax 特点：支持上下文长度大、响应速度快、性价比高
// ============================================
export const MINIMAX_SYSTEM_INSTRUCTION = `
You are CogniGuide v1.0.6, a Dynamic Personalized Teaching Engine & Knowledge Architect powered by MiniMax.

**CORE ROLE: ACTIVE KNOWLEDGE ARCHITECT**
You have two distinct jobs that must happen simultaneously:
1.  **Teacher:** Engage the user based on the selected Teaching Mode (Auto/Socratic/Narrative/Lecture).
2.  **Scribe & Architect:** Record CONSOLIDATED notes into 'summaryFragments' and build a LOGICAL, HIERARCHICAL Mind Map based on those notes.

**LANGUAGE:** SIMPLIFIED CHINESE (简体中文).

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
   - **Socratic:** Ask questions. Guide. Don't tell.
   - **Narrative:** Storytelling, history, context.
   - **Lecture:** Clear, direct definitions and steps.

**3. Teaching Stages:**
   - Introduction -> Construction -> Consolidation -> Transfer -> Reflection.

---
### IV. OUTPUT FORMAT: STRICT JSON ONLY

**CRITICAL JSON OUTPUT REQUIREMENTS:**
- You MUST output ONLY a valid JSON object
- NO markdown code blocks (no \`\`\`json or \`\`\`)
- NO explanatory text before or after the JSON
- Start directly with { and end with }
- The \`conversationalReply\` field is REQUIRED and must not be empty

**Required JSON Structure:**
{
  "conversationalReply": "Your direct, natural response to the user in Simplified Chinese (REQUIRED, must not be empty)",
  "internalThought": "Brief reasoning: Identified Knowledge Type + User State + Decision",
  "detectedStage": "Introduction | Construction | Consolidation | Transfer | Reflection",
  "updatedConcepts": [
    {
      "id": "snake_case_id",
      "name": "Display name (Chinese)",
      "mastery": "Unknown | Novice | Competent | Expert",
      "description": "Short definition"
    }
  ],
  "updatedLinks": [
    {
      "source": "Parent Node ID",
      "target": "Child Node ID",
      "relationship": "Edge label"
    }
  ],
  "appliedStrategy": "Name of the pedagogical strategy used",
  "cognitiveLoadEstimate": "Low | Optimal | High",
  "summaryFragments": ["Note 1", "Note 2"]
}
`;

// ============================================
// Helper Functions
// ============================================

/**
 * Attempt to fix common JSON parsing errors
 */
function attemptJsonFix(jsonContent: string): TutorResponse | null {
  try {
    let fixed = jsonContent
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
      .replace(/:\s*([^",\[\]{}\s]+)([,}\]])/g, ':"$1"$2');
    return JSON.parse(fixed) as TutorResponse;
  } catch (e) {
    return null;
  }
}

/**
 * Generate fallback reply when conversationalReply is missing
 */
function generateFallbackReply(
  parsed: Partial<TutorResponse>,
  notes: string[]
): string {
  if (parsed.summaryFragments && parsed.summaryFragments.length > 0) {
    const latestNote = parsed.summaryFragments[parsed.summaryFragments.length - 1];
    return `好的，我已经记录了这个要点：${latestNote}\n\n你还有什么想了解的吗？`;
  } else if (notes.length > 0) {
    const latestNote = notes[notes.length - 1];
    return `我已经理解并记录了：${latestNote}。你还有什么想了解的吗？`;
  } else {
    return "我理解了你的问题。让我们继续深入探讨这个主题吧。";
  }
}

// ============================================
// Core Service Function
// ============================================

export const sendMessageToMiniMax = async (
  history: ChatMessage[],
  currentConcepts: ConceptNode[],
  currentLinks: ConceptLink[],
  summaryNotes: string[],
  apiKey: string,
  modelName: string,
  teachingMode: TeachingMode,
  groupId?: string
): Promise<TutorResponse> => {
  // MiniMax API endpoint - 使用官方文档的正确端点
  const apiUrl = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

  // 根据官方文档更新模型映射
  const modelMap: Record<string, string> = {
    // M2 系列模型（推荐使用）
    'MiniMax-M2.5': 'MiniMax-M2.5',
    'MiniMax-M2.5-lightning': 'MiniMax-M2.5-lightning',
    'MiniMax-M2.1': 'MiniMax-M2.1',
    'MiniMax-M2.1-ning': 'MiniMax-M2.1-ning',
  };

  const actualModelName = modelMap[modelName] || 'MiniMax-M2.5';

  // Clean history - filter out invalid content and system auto-replies
  const cleanHistory = history.filter(msg => {
    if (!msg.content || msg.content.trim() === '') return false;
    if (msg.role === MessageRole.Model) {
      const lowerContent = msg.content.toLowerCase();
      return !(
        lowerContent.includes('知识库已更新') ||
        lowerContent.includes('收到，请继续') ||
        lowerContent.includes('ai思考完毕')
      );
    }
    return true;
  });

  // Build message history context
  const historyContext = cleanHistory.map(msg => ({
    role: msg.role === MessageRole.User ? 'user' : 'assistant',
    content: msg.content,
  }));

  // Build state context for evolutionary structure
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
`.trim();

  // Build messages payload with system instruction
  const messagesPayload = [
    { role: 'system', content: MINIMAX_SYSTEM_INSTRUCTION },
    ...historyContext.slice(0, -1),
    {
      role: 'user',
      content: `${stateContext}\n\nUser Input: ${historyContext[historyContext.length - 1]?.content || ''}\n\nRemember: Output ONLY valid JSON, no markdown blocks, conversationalReply is required.`
    }
  ];

  try {
    // 构建请求体
    const requestBody: Record<string, any> = {
      model: actualModelName,
      messages: messagesPayload,
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 0.95,
      stream: false
    };

    // 如果提供了 groupId，添加到请求中
    if (groupId && groupId.trim() !== '') {
      requestBody.group_id = groupId.trim();
    }

    // Make API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MiniMax API 错误:', response.status, errorText);

      // 尝试解析错误信息
      let errorMessage = `MiniMax API 错误 (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error.message || errorData.error.type || errorText;
        } else {
          errorMessage = errorText;
        }
      } catch {
        errorMessage = errorText;
      }

      // 根据状态码提供更具体的错误信息
      if (response.status === 401) {
        errorMessage = 'API Key 无效或已过期，请检查您的 MiniMax API Key';
      } else if (response.status === 403) {
        errorMessage = 'API 访问被拒绝，请检查您的账户状态';
      } else if (response.status === 429) {
        errorMessage = '请求频率过高，请稍后再试';
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice || !choice.message) {
      throw new Error("API 返回格式异常");
    }

    let content = choice.message.content;
    if (!content) {
      throw new Error("MiniMax 返回空内容");
    }

    // Extract and clean JSON
    let jsonContent = content;

    // Try to match JSON object (supporting multiline and nested structures)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    } else {
      // Fallback: Try to extract outermost JSON object by counting braces
      let braceCount = 0;
      let startIdx = -1;
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') {
          if (startIdx === -1) startIdx = i;
          braceCount++;
        } else if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIdx !== -1) {
            jsonContent = content.substring(startIdx, i + 1);
            break;
          }
        }
      }
    }

    // Clean Markdown code block markers
    jsonContent = jsonContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Validate JSON structure before parsing
    if (!jsonContent.startsWith('{') || !jsonContent.endsWith('}')) {
      console.error("JSON 格式异常", {
        startsWithBrace: jsonContent.startsWith('{'),
        endsWithBrace: jsonContent.endsWith('}'),
        preview: jsonContent.substring(0, 200),
        model: actualModelName
      });
      throw new Error("JSON 格式异常：必须以 { 开始，以 } 结束");
    }

    // Parse JSON with enhanced error handling
    let parsed: TutorResponse;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("JSON 解析失败", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        contentLength: jsonContent.length,
        preview: jsonContent.substring(0, 200),
        model: actualModelName
      });

      // Attempt to fix common JSON errors
      const fixedJson = attemptJsonFix(jsonContent);
      if (fixedJson) {
        console.warn("成功修复 JSON 格式错误");
        parsed = fixedJson;
      } else {
        throw new Error(`JSON 解析失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    }

    // Validate and fill missing required fields
    const requiredFields = ['conversationalReply', 'updatedConcepts', 'updatedLinks'];
    const missingFields = requiredFields.filter(field => !parsed[field as keyof TutorResponse]);

    if (missingFields.length > 0) {
      console.warn("缺少必需字段", {
        missingFields,
        model: actualModelName,
        hasPartialData: Object.keys(parsed).length > 0
      });

      // Generate default values for missing fields
      missingFields.forEach(field => {
        if (field === 'conversationalReply') {
          parsed.conversationalReply = generateFallbackReply(parsed, summaryNotes);
        } else if (field === 'updatedConcepts') {
          parsed.updatedConcepts = currentConcepts;
        } else if (field === 'updatedLinks') {
          parsed.updatedLinks = currentLinks;
        }
      });
    }

    // Ensure conversationalReply is not empty
    if (!parsed.conversationalReply || parsed.conversationalReply.trim() === '') {
      console.warn("conversationalReply 为空，生成回退回复", {
        model: actualModelName,
        hasSummaryFragments: !!(parsed.summaryFragments && parsed.summaryFragments.length > 0)
      });
      parsed.conversationalReply = generateFallbackReply(parsed, summaryNotes);
    }

    // Data structure fixes
    if (parsed.updatedConcepts && parsed.updatedConcepts.length > 0) {
      // Ensure mastery values are valid
      const validMasteryLevels: MasteryLevel[] = [
        MasteryLevel.Unknown,
        MasteryLevel.Novice,
        MasteryLevel.Competent,
        MasteryLevel.Expert
      ];
      parsed.updatedConcepts = parsed.updatedConcepts.map(concept => ({
        ...concept,
        mastery: validMasteryLevels.includes(concept.mastery as MasteryLevel)
          ? concept.mastery
          : MasteryLevel.Unknown
      }));
    }

    // Ensure detectedStage is valid
    const validStages: TeachingStage[] = [
        TeachingStage.Introduction,
        TeachingStage.Construction,
        TeachingStage.Consolidation,
        TeachingStage.Transfer,
        TeachingStage.Reflection
    ];
    if (!validStages.includes(parsed.detectedStage as TeachingStage)) {
      const lastUserMessage = cleanHistory[cleanHistory.length - 1]?.content || '';
      if (lastUserMessage.includes('什么是') || lastUserMessage.includes('介绍一下')) {
        parsed.detectedStage = TeachingStage.Introduction;
      } else if (lastUserMessage.includes('为什么') || lastUserMessage.includes('怎么')) {
        parsed.detectedStage = TeachingStage.Construction;
      } else {
        parsed.detectedStage = TeachingStage.Consolidation;
      }
    }

    return parsed;
  } catch (error) {
    console.error("MiniMax 服务错误", {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      model: modelName,
      apiModel: actualModelName,
      historyLength: cleanHistory.length,
      conceptsCount: currentConcepts.length,
      notesCount: summaryNotes.length
    });

    // Safe error fallback response
    const fallbackResponse: TutorResponse = {
      conversationalReply: "抱歉，系统暂时遇到了一些问题。让我们重新开始这个话题吧。",
      internalThought: `错误: ${error instanceof Error ? error.message : String(error)}`,
      detectedStage: TeachingStage.Introduction,
      updatedConcepts: currentConcepts,
      updatedLinks: currentLinks,
      appliedStrategy: "Lecture",
      cognitiveLoadEstimate: "Optimal",
      summaryFragments: summaryNotes
    };
    return fallbackResponse;
  }
};
