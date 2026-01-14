	import { ChatMessage, TutorResponse, MasteryLevel, MessageRole, ConceptNode, ConceptLink, TeachingMode, TeachingStage } from "../types";
	// ============================================
	// 1. Schema 定义 (用于文档及类型校验参考)
	// ============================================
	export const tutorResponseSchema = {
	  type: "object" as const,
	  properties: {
	    conversationalReply: {
	      type: "string" as const,
	      description: "直接回复学生的自然对话内容（简体中文，必填）",
	    },
	    internalThought: {
	      type: "string" as const,
	      description: "简要推理：知识类型+学生状态+决策依据",
	    },
	    detectedStage: {
	      type: "string" as const,
	      enum: ["Introduction", "Construction", "Consolidation", "Transfer", "Reflection"],
	      description: "当前教学阶段"
	    },
	    updatedConcepts: {
	      type: "array" as const,
	      description: "思维导图的所有关键概念节点，必须是层次化结构（根→分支→叶子）",
	      items: {
	        type: "object" as const,
	        properties: {
	          id: { type: "string" as const, description: "唯一的蛇形命名ID" },
	          name: { type: "string" as const, description: "显示名称（中文）" },
	          mastery: {
	            type: "string" as const,
	            enum: ["Unknown", "Novice", "Competent", "Expert"],
	            description: "掌握程度"
	          },
	          description: { type: "string" as const, description: "简短定义" }
	        },
	        required: ["id", "name", "mastery"],
	      },
	    },
	    updatedLinks: {
	      type: "array" as const,
	      description: "思维导图的父子关系，严格保持树形结构",
	      items: {
	        type: "object" as const,
	        properties: {
	          source: { type: "string" as const, description: "父节点ID" },
	          target: { type: "string" as const, description: "子节点ID" },
	          relationship: { type: "string" as const, description: "关系标签" }
	        },
	        required: ["source", "target", "relationship"],
	      }
	    },
	    appliedStrategy: {
	      type: "string" as const,
	      description: "使用的教学策略名称"
	    },
	    cognitiveLoadEstimate: {
	      type: "string" as const,
	      enum: ["Low", "Optimal", "High"],
	      description: "学生认知负荷估计"
	    },
	    summaryFragments: {
	      type: "array" as const,
	      description: "整理后的高价值笔记（定义、关键洞察、确认事实），避免琐碎片段",
	      items: { type: "string" as const }
	    }
	  },
	  required: ["conversationalReply", "updatedConcepts", "updatedLinks", "appliedStrategy", "internalThought", "cognitiveLoadEstimate", "detectedStage", "summaryFragments"],
	};
	// ============================================
	// 2. DeepSeek System Instruction (English, aligned with Gemini)
	// ============================================
	export const DEEPSEEK_SYSTEM_INSTRUCTION = `
You are CogniGuide v1.0.6, a Dynamic Personalized Teaching Engine & Knowledge Architect.

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
**Format:** Notes should be complete sentences that stand alone (e.g., "The Theory of Relativity consists of Special Relativity and General Relativity.").

---
### II. MIND MAP ARCHITECT (HIERARCHICAL)
**Rule:** The Mind Map (\`updatedConcepts\`, \`updatedLinks\`) must visualize the **structure of the Summary Notes**.
- **Structure:** Strict Tree/Directory Hierarchy. (Topic -> Category -> Concept -> Detail).
- **No Hairballs:** Do not create a messy network. Create a clean breakdown.
- **Consistency:** If a Note says "A consists of B and C", the Graph MUST have links A->B and A->C.
- **Update Logic:** You must re-emit relevant existing nodes + new nodes to ensure the client renders the full tree correctly.

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

**Key Reminders:**
1. \`conversationalReply\` MUST contain your direct response to the user. Do not leave it empty.
2. Mind Map must reflect the Summary Notes: \`updatedConcepts\` and \`updatedLinks\` should be based on \`summaryFragments\`
3. Maintain tree structure: Ensure clear hierarchy, no cross-connections
4. Always update: Even for minor adjustments, re-emit complete \`updatedConcepts\` and \`updatedLinks\`
`;
	// ============================================
	// 3. Helper Functions
	// ============================================
	
	/**
	 * Attempt to fix common JSON parsing errors
	 */
	function attemptJsonFix(jsonContent: string): TutorResponse | null {
	  try {
	    // Try to fix common issues: trailing commas, unescaped quotes, etc.
	    let fixed = jsonContent
	      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
	      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
	      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Add quotes around unquoted keys (simple fix)
	      .replace(/:\s*([^",\[\]{}\s]+)([,}\]])/g, ':"$1"$2');  // Add quotes around unquoted string values
	    
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
	  notes: string[], 
	  isReasoner: boolean
	): string {
	  if (parsed.summaryFragments && parsed.summaryFragments.length > 0) {
	    const latestNote = parsed.summaryFragments[parsed.summaryFragments.length - 1];
	    return `好的，我已经记录了这个要点：${latestNote}\n\n你还有什么想了解的吗？`;
	  } else if (notes.length > 0) {
	    const latestNote = notes[notes.length - 1];
	    return `我已经理解并记录了：${latestNote}。你还有什么想了解的吗？`;
	  } else {
	    return isReasoner 
	      ? "我已经思考了这个问题，并更新了知识结构。你可以查看右侧的思维导图，或者继续提问。"
	      : "我理解了你的问题。让我们继续深入探讨这个主题吧。";
	  }
	}
	
	/**
	 * Validate JSON structure completeness
	 */
	function validateJsonStructure(obj: any): boolean {
	  if (!obj || typeof obj !== 'object') return false;
	  
	  const requiredFields = [
	    'conversationalReply',
	    'updatedConcepts',
	    'updatedLinks',
	    'appliedStrategy',
	    'internalThought',
	    'cognitiveLoadEstimate',
	    'detectedStage',
	    'summaryFragments'
	  ];
	  
	  return requiredFields.every(field => obj.hasOwnProperty(field));
	}

	// ============================================
	// 4. Core Service Function
	// ============================================
	export const sendMessageToDeepSeek = async (
	  history: ChatMessage[],
	  currentConcepts: ConceptNode[],
	  currentLinks: ConceptLink[],
	  summaryNotes: string[],
	  apiKey: string,
	  modelName: string, // 兼容 "V3.2Think" 或 "deepseek-reasoner" 等格式
	  teachingMode: TeachingMode
	): Promise<TutorResponse> => {
	  // 1. 历史记录清理 (过滤无效内容和系统自动回复)
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
	  // 2. 构建消息历史上下文
	  const historyContext = cleanHistory.map(msg => ({
	    role: msg.role === MessageRole.User ? 'user' : 'assistant',
	    content: msg.content,
	  }));
	  // 3. Build concise state context (aligned with Gemini style)
	  const stateContext = `
    [System Context]
    Current Teaching Mode: ${teachingMode}
    
    [KNOWLEDGE BASE - SUMMARY NOTES]
    (This is the source of truth for the Mind Map. Ensure the Graph visualizes THESE notes.)
    ${JSON.stringify(summaryNotes)}

    [Current Graph State]
    Nodes: ${JSON.stringify(currentConcepts.map(c => c.id))}
  `.trim();
	  // 4. 确定模型类型 (兼容原代码的 V3.2Think 和新标准 reasoner)
	  const isReasoner = modelName.includes('reasoner') || modelName.includes('Think');
	  const apiModelName = isReasoner ? 'deepseek-reasoner' : 'deepseek-chat';
	  // 5. Build message payload (optimized for reasoner models)
	  let messagesPayload = [];
	  if (isReasoner) {
	    // Reasoner model strategy: Keep system message separate, add brief JSON reminder in user message
	    messagesPayload = [
	      { role: 'system', content: DEEPSEEK_SYSTEM_INSTRUCTION },
	      ...historyContext.slice(0, -1),
	      {
	        role: 'user',
	        content: `${stateContext}\n\nUser Input: ${historyContext[historyContext.length - 1].content}\n\nRemember: Output ONLY valid JSON, no markdown blocks, conversationalReply is required.`
	      }
	    ];
	  } else {
	    // Regular model strategy: Use System message
	    messagesPayload = [
	      { role: 'system', content: DEEPSEEK_SYSTEM_INSTRUCTION },
	      ...historyContext.slice(0, -1),
	      {
	        role: 'user',
	        content: `${stateContext}\n\nUser Input: ${historyContext[historyContext.length - 1].content}`
	      }
	    ];
	  }
	  // 6. 构建最终 API 请求参数
	  // 注意：移除 response_format，因为 DeepSeek API 可能不支持 OpenAI 的此参数
	  // 依赖系统提示词要求 JSON 输出格式
	  const payload = {
	    model: apiModelName,
	    messages: messagesPayload,
	    stream: false,
	    temperature: 0.2,  // Reduced for better stability and consistency
	    max_tokens: 4000,  // Increased to avoid truncation of complex responses
	    top_p: 0.95        // Added to work with temperature for better output quality
	  };
	  try {
	    // 7. 发起请求
	    const response = await fetch("https://api.deepseek.com/chat/completions", {
	      method: "POST",
	      headers: {
	        "Content-Type": "application/json",
	        "Authorization": `Bearer ${apiKey}`
	      },
	      body: JSON.stringify(payload)
	    });
	    if (!response.ok) {
	      const errorText = await response.text();
	      console.error('DeepSeek API 错误:', response.status, errorText);
	      throw new Error(`DeepSeek API 错误: ${response.status} ${errorText}`);
	    }
	    const data = await response.json();
	    const choice = data.choices[0];
	    if (!choice || !choice.message) {
	      throw new Error("API 返回格式异常");
	    }
	    let content = choice.message.content;
	    const reasoning = choice.message.reasoning_content;
	    if (!content) {
	      throw new Error("DeepSeek 返回空内容");
	    }
	    // 8. Extract and clean JSON with improved logic
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
	        model: apiModelName
	      });
	      throw new Error("JSON 格式异常：必须以 { 开始，以 } 结束");
	    }
	    
	    // 9. Parse JSON with enhanced error handling
	    let parsed: TutorResponse;
	    try {
	      parsed = JSON.parse(jsonContent);
	    } catch (parseError) {
	      console.error("JSON 解析失败", {
	        error: parseError instanceof Error ? parseError.message : String(parseError),
	        contentLength: jsonContent.length,
	        preview: jsonContent.substring(0, 200),
	        model: apiModelName
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
	    // 10. Validate and fill missing required fields
	    const requiredFields = ['conversationalReply', 'updatedConcepts', 'updatedLinks'];
	    const missingFields = requiredFields.filter(field => !parsed[field as keyof TutorResponse]);
	    
	    if (missingFields.length > 0) {
	      console.warn("缺少必需字段", {
	        missingFields,
	        model: apiModelName,
	        hasPartialData: Object.keys(parsed).length > 0
	      });
	      
	      // Generate default values for missing fields
	      missingFields.forEach(field => {
	        if (field === 'conversationalReply') {
	          parsed.conversationalReply = generateFallbackReply(parsed, summaryNotes, isReasoner);
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
	        model: apiModelName,
	        hasSummaryFragments: !!(parsed.summaryFragments && parsed.summaryFragments.length > 0)
	      });
	      parsed.conversationalReply = generateFallbackReply(parsed, summaryNotes, isReasoner);
	    }
	    // 11. 附加推理过程
	    if (reasoning && reasoning.trim() !== '') {
	      const briefReasoning = reasoning.length > 150 
	        ? reasoning.substring(0, 150) + '...' 
	        : reasoning;
	      parsed.internalThought = `[推理过程]\n${briefReasoning}\n\n${parsed.internalThought || ''}`;
	    }
	    // 12. 数据结构修正
	    if (parsed.updatedConcepts && parsed.updatedConcepts.length > 0) {
	      // 确保 mastery 值合法 - 使用枚举值
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
	    // 确保 detectedStage 合法 - 使用枚举值
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
	    console.error("DeepSeek 服务错误", {
	      error: error instanceof Error ? error.message : String(error),
	      errorType: error instanceof Error ? error.constructor.name : typeof error,
	      model: modelName,
	      apiModel: apiModelName,
	      isReasoner,
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
