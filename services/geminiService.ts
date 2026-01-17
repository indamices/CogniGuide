import { GoogleGenAI, Schema, Type } from "@google/genai";
import { ChatMessage, TutorResponse, MasteryLevel, MessageRole, ConceptNode, ConceptLink, TeachingMode, TeachingStage } from "../types";

// Schema definition for the structured output
export const tutorResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    conversationalReply: {
      type: Type.STRING,
      description: "The DIRECT response to the learner in Simplified Chinese. REQUIRED.",
    },
    internalThought: {
      type: Type.STRING,
      description: "Brief reasoning: Identified Knowledge Type + User State + Decision.",
    },
    detectedStage: {
      type: Type.STRING,
      enum: ["Introduction", "Construction", "Consolidation", "Transfer", "Reflection"],
      description: "The current phase of the learning cycle."
    },
    updatedConcepts: {
      type: Type.ARRAY,
      description: "List of ALL key concepts for the Mind Map. Must be hierarchical (Root -> Branch -> Leaf).",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique snake_case ID" },
          name: { type: Type.STRING, description: "Display name (Chinese)" },
          mastery: {
            type: Type.STRING,
            enum: ["Unknown", "Novice", "Competent", "Expert"],
            description: "Mastery level."
          },
          description: { type: Type.STRING, description: "Short definition" }
        },
        required: ["id", "name", "mastery"],
      },
    },
    updatedLinks: {
      type: Type.ARRAY,
      description: "Parent-Child relationships strictly for a Tree/MindMap structure.",
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "Parent Node ID" },
          target: { type: Type.STRING, description: "Child Node ID" },
          relationship: { type: Type.STRING, description: "Edge label" }
        },
        required: ["source", "target", "relationship"],
      }
    },
    appliedStrategy: {
      type: Type.STRING,
      description: "Name of the pedagogical strategy used."
    },
    cognitiveLoadEstimate: {
      type: Type.STRING,
      enum: ["Low", "Optimal", "High"],
      description: "Estimate of user's cognitive load."
    },
    summaryFragments: {
      type: Type.ARRAY,
      description: "Consolidated high-value notes (Definitions, Key Insights, Confirmed Facts). Avoid trivial fragments.",
      items: { type: Type.STRING }
    }
  },
  required: ["conversationalReply", "updatedConcepts", "updatedLinks", "appliedStrategy", "internalThought", "cognitiveLoadEstimate", "detectedStage", "summaryFragments"],
};

export const SYSTEM_INSTRUCTION = `
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
### IV. OUTPUT FORMAT
Return valid JSON matching the schema.
**CRITICAL:** The field \`conversationalReply\` MUST contain your direct, natural response to the user. Do not leave it empty.
`;

export const sendMessageToTutor = async (
  history: ChatMessage[],
  currentConcepts: ConceptNode[],
  currentLinks: ConceptLink[],
  summaryNotes: string[],
  apiKey: string,
  modelName: string,
  teachingMode: TeachingMode
): Promise<TutorResponse> => {
  const ai = new GoogleGenAI({ apiKey });

  const historyContext = history.map(msg => ({
    role: msg.role === MessageRole.User ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

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

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      ...historyContext.slice(0, -1),
      {
        role: 'user',
        parts: [{ text: `${stateContext}\n\nUser Input: ${historyContext[historyContext.length - 1].parts[0].text}` }]
      }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: tutorResponseSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  try {
    return JSON.parse(text) as TutorResponse;
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("AI response was not valid JSON");
  }
};