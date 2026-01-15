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
    
    [KNOWLEDGE BASE - SUMMARY NOTES]
    (This is the source of truth for the Mind Map. Ensure the Graph visualizes THESE notes.)
    ${JSON.stringify(summaryNotes)}

    [Current Graph State]
    Nodes: ${JSON.stringify(currentConcepts.map(c => c.id))}
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