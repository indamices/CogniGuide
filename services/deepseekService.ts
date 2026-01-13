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
	// 2. 优化的 DeepSeek 系统指令
	// ============================================
	export const DEEPSEEK_SYSTEM_INSTRUCTION = `
	# 角色：CogniGuide 教学引擎与知识架构师
	你是一个同时执行两项任务的教学系统：
	1. **教学引擎**：根据教学模式与学生互动
	2. **知识架构师**：整理笔记并构建层次化思维导图
	**输出语言**：简体中文
	## 第一部分：笔记整理引擎（只记录高价值信息）
	### 记录原则
	- **只记录**：已确认的定义、关键洞察、重要事实
	- **不记录**：开放性问题、琐碎对话、未确认的猜测
	### 记录时机（满足任一条件即可记录）
	1. 一个子主题讨论结束，结论明确时
	2. 一个清晰的定义被提出或确认时  
	3. 概念之间建立重要连接时
	### 笔记格式
	- 使用完整、独立的句子
	- 示例："相对论包括狭义相对论和广义相对论。"
	## 第二部分：思维导图架构（严格树形结构）
	### 核心规则
	1. **结构来源**：思维导图必须直接可视化"summaryFragments"中的笔记内容
	2. **层级关系**：严格的树形/目录结构（主题 → 类别 → 概念 → 细节）
	3. **禁止网状连接**：只允许父子关系，不允许交叉连接
	4. **一致性**：如果笔记说"A由B和C组成"，图中必须有A→B和A→C的连接
	### 更新逻辑
	- 每次响应必须重新输出所有相关节点（包括现有节点+新节点）
	- 确保客户端能渲染完整的树结构
	## 第三部分：教学决策引擎
	### 分析维度
	1. **知识类型**：
	   - 结构型（事实、数据）
	   - 概念型（逻辑、理论）  
	   - 程序型（技能、步骤）
	2. **学习者水平**：
	   - 新手（Novice）
	   - 熟练（Competent）
	   - 专家（Expert）
	### 教学模式策略
	- **自动模式**：根据分析结果自动选择
	  - 新手+事实 → 叙事模式
	  - 熟练+逻辑 → 苏格拉底模式
	  - 专家+技能 → 讲座模式
	- **苏格拉底模式**：提问引导，不直接给出答案
	- **叙事模式**：讲故事、历史背景、类比
	- **讲座模式**：清晰直接的定义和步骤
	### 教学阶段识别
	- 介绍：引入新主题
	- 构建：建立概念连接  
	- 巩固：总结和强化
	- 迁移：应用到新情境
	- 反思：回顾学习过程
	## 第四部分：输出格式（严格JSON）
	### 必须字段
	{
	  "conversationalReply": "直接回复学生的自然对话内容（必填）",
	  "internalThought": "简要推理：知识类型+学生状态+决策依据",
	  "detectedStage": "当前教学阶段",
	  "updatedConcepts": [
	    {
	      "id": "snake_case_id",
	      "name": "中文名称", 
	      "mastery": "Unknown/Novice/Competent/Expert",
	      "description": "简短定义"
	    }
	  ],
	  "updatedLinks": [
	    {
	      "source": "父节点ID",
	      "target": "子节点ID", 
	      "relationship": "关系标签"
	    }
	  ],
	  "appliedStrategy": "使用的教学策略名称",
	  "cognitiveLoadEstimate": "Low/Optimal/High",
	  "summaryFragments": ["笔记1", "笔记2"]
	}
	### 关键要求
	1. **conversationalReply 不能为空**：这是与学生的直接对话
	2. **思维导图必须反映笔记内容**：updatedConcepts 和 updatedLinks 要基于 summaryFragments
	3. **保持树形结构**：确保层级清晰，无交叉连接
	4. **每次都要更新**：即使只是微调，也要重新输出完整的 updatedConcepts 和 updatedLinks
	`;
	// ============================================
	// 3. 核心服务函数
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
	  // 3. 构建清晰的状态上下文
	  const stateContext = `
	【系统状态】
	教学模式：${teachingMode}
	当前笔记数量：${summaryNotes.length} 条
	当前节点数量：${currentConcepts.length} 个
	【最近笔记摘要】
	${summaryNotes.length > 0 
	  ? summaryNotes.slice(-3).map((note, i) => `${i+1}. ${note}`).join('\n')
	  : '暂无笔记'
	}
	【当前思维导图根节点】
	${currentConcepts.filter(c => 
	  !currentLinks.some(l => l.target === c.id)
	).map(c => `- ${c.name}`).join('\n') || '暂无根节点'}
	【指令】
	请基于以上状态执行你的双重角色：
	1. 作为教学引擎，用自然对话回复学生
	2. 作为知识架构师，更新笔记和思维导图
	  `.trim();
	  // 4. 确定模型类型 (兼容原代码的 V3.2Think 和新标准 reasoner)
	  const isReasoner = modelName.includes('reasoner') || modelName.includes('Think');
	  const apiModelName = isReasoner ? 'deepseek-reasoner' : 'deepseek-chat';
	  // 5. 构建消息负载
	  let messagesPayload = [];
	  if (isReasoner) {
	    // 推理模型策略：将指令注入到 User 消息中
	    const lastUserMsg = historyContext[historyContext.length - 1];
	    const previousMsgs = historyContext.slice(0, -1);
	    messagesPayload = [
	      ...previousMsgs,
	      {
	        role: 'user',
	        content: `${DEEPSEEK_SYSTEM_INSTRUCTION}\n\n${stateContext}\n\n学生输入：${lastUserMsg.content}\n\n请严格按照JSON格式输出，确保 conversationalReply 字段不为空。`
	      }
	    ];
	  } else {
	    // 普通模型策略：使用 System 消息
	    messagesPayload = [
	      { role: 'system', content: DEEPSEEK_SYSTEM_INSTRUCTION },
	      ...historyContext.slice(0, -1),
	      {
	        role: 'user',
	        content: `${stateContext}\n\n学生输入：${historyContext[historyContext.length - 1].content}`
	      }
	    ];
	  }
	  // 6. 构建最终 API 请求参数
	  const payload = {
	    model: apiModelName,
	    messages: messagesPayload,
	    stream: false,
	    response_format: { type: 'json_object' },
	    temperature: 0.3,
	    max_tokens: 2000
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
	    // 8. 提取与清洗 JSON
	    let jsonContent = content;
	    // 尝试匹配 JSON 对象
	    const jsonMatch = content.match(/\{[\s\S]*\}/);
	    if (jsonMatch) {
	      jsonContent = jsonMatch[0];
	    }
	    // 清理 Markdown 代码块标记
	    jsonContent = jsonContent
	      .replace(/^```json\s*/i, '')
	      .replace(/^```\s*/i, '')
	      .replace(/\s*```$/i, '')
	      .trim();
	    // 9. 解析 JSON
	    let parsed: TutorResponse;
	    try {
	      parsed = JSON.parse(jsonContent);
	    } catch (parseError) {
	      console.error("JSON 解析失败，原始内容:", jsonContent);
	      throw new Error(`JSON 解析失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
	    }
	    // 10. 验证与回退处理
	    if (!parsed.conversationalReply || parsed.conversationalReply.trim() === '') {
	      console.warn("conversationalReply 为空，生成回退回复");
	      if (parsed.summaryFragments && parsed.summaryFragments.length > 0) {
	        const latestNote = parsed.summaryFragments[parsed.summaryFragments.length - 1];
	        parsed.conversationalReply = `好的，我已经记录了这个要点：${latestNote}\n\n你还有什么想了解的吗？`;
	      } else {
	        parsed.conversationalReply = isReasoner 
	          ? "我已经思考了这个问题，并更新了知识结构。你可以查看右侧的思维导图，或者继续提问。"
	          : "我理解了你的问题。让我们继续深入探讨这个主题吧。";
	      }
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
	      // 确保 mastery 值合法
	      const validMasteryLevels: MasteryLevel[] = ["Unknown", "Novice", "Competent", "Expert"];
	      parsed.updatedConcepts = parsed.updatedConcepts.map(concept => ({
	        ...concept,
	        mastery: validMasteryLevels.includes(concept.mastery as MasteryLevel)
	          ? concept.mastery
	          : "Unknown"
	      }));
	    }
	    // 确保 detectedStage 合法
	    const validStages: TeachingStage[] = ["Introduction", "Construction", "Consolidation", "Transfer", "Reflection"];
	    if (!validStages.includes(parsed.detectedStage as TeachingStage)) {
	      const lastUserMessage = cleanHistory[cleanHistory.length - 1]?.content || '';
	      if (lastUserMessage.includes('什么是') || lastUserMessage.includes('介绍一下')) {
	        parsed.detectedStage = "Introduction";
	      } else if (lastUserMessage.includes('为什么') || lastUserMessage.includes('怎么')) {
	        parsed.detectedStage = "Construction";
	      } else {
	        parsed.detectedStage = "Consolidation";
	      }
	    }
	    return parsed;
	  } catch (error) {
	    console.error("DeepSeek 服务错误:", error);
	    // 安全的错误回退响应
	    const fallbackResponse: TutorResponse = {
	      conversationalReply: "抱歉，系统暂时遇到了一些问题。让我们重新开始这个话题吧。",
	      internalThought: `错误: ${error instanceof Error ? error.message : String(error)}`,
	      detectedStage: "Introduction",
	      updatedConcepts: currentConcepts,
	      updatedLinks: currentLinks,
	      appliedStrategy: "Lecture",
	      cognitiveLoadEstimate: "Optimal",
	      summaryFragments: summaryNotes
	    };
	    return fallbackResponse;
	  }
	};
