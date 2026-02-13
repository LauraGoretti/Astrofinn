import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion, AstroCommand } from "../types";

// Initialize Gemini Client
// CRITICAL: We use process.env.API_KEY as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-3-flash-preview';

/**
 * Generates a set of quiz questions based on the topic.
 */
export const generateQuizQuestions = async (topic: string, count: number = 3): Promise<QuizQuestion[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { 
          type: Type.ARRAY,
          items: { type: Type.STRING } 
        },
        correctAnswerIndex: { type: Type.INTEGER },
        explanation: { type: Type.STRING }
      },
      required: ["question", "options", "correctAnswerIndex", "explanation"],
      propertyOrdering: ["question", "options", "correctAnswerIndex", "explanation"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Generate ${count} challenging but age-appropriate (7th grade, approx 13 years old) multiple choice questions about: ${topic}. 
      Context: Finland science curriculum. Focus on physics, geometry of space, and observation.
      Make sure the options are plausible. 
      The explanation should be concise and educational.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a cool, futuristic science tutor for teenagers."
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizQuestion[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    // Fallback static data if API fails to avoid app crash
    return [
      {
        question: "API Error. What is the main cause of seasons?",
        options: ["Distance to sun", "Axial tilt", "Solar flares", "Moon gravity"],
        correctAnswerIndex: 1,
        explanation: "Earth's axis is tilted 23.5 degrees."
      }
    ];
  }
};

/**
 * Generates roleplay commands for group activities.
 */
export const generateAstroCommands = async (topic: string): Promise<AstroCommand[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        role: { type: Type.STRING, description: "The role the student plays (e.g., Earth, Sun, Observer)" },
        action: { type: Type.STRING, description: "The physical action they must perform" },
        question: { type: Type.STRING, description: "A question the 'Gamemaster' asks the group" },
        answer: { type: Type.STRING, description: "The correct answer to check against" }
      },
      required: ["role", "action", "question", "answer"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Generate 3 fun, physical roleplay commands for students learning about ${topic}.
      Target audience: 13 year olds.
      Format: One student is usually the 'Sun', one is 'Earth'.
      The commands should involve moving around, spinning (rotation), or tilting.
      Example: 'Earth, tilt your head North and walk around the Sun. Stop at June Solstice.'`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are Mission Control giving orders to astronauts simulating celestial bodies."
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AstroCommand[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Command Error:", error);
    return [{
      role: "Earth",
      action: "Spin around 3 times",
      question: "What did you just simulate?",
      answer: "Rotation (Day/Night)"
    }];
  }
};
