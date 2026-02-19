import { QuizQuestion, AstroCommand } from "../types";

/**
 * STATIC DATA REPOSITORY
 * 
 * This file replaces the previous AI generation service.
 * All questions and commands are now stored directly in the application code.
 * 
 * TODO: Populate the 'TOPICS' object below with the specific questions provided by the user.
 */

// --- QUIZ DATA ---

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    question: "What is the primary reason for Earth's seasons?",
    options: ["Distance from the Sun", "Axial Tilt (23.5°)", "Solar Flares", "The Moon's orbit"],
    correctAnswerIndex: 1,
    explanation: "Earth's axis is tilted 23.5 degrees. As we orbit the Sun, this tilt causes different hemispheres to receive more direct sunlight at different times of the year."
  },
  {
    question: "Approximately how long does it take for Earth to complete one revolution around the Sun?",
    options: ["24 hours", "30 days", "365.25 days", "10 years"],
    correctAnswerIndex: 2,
    explanation: "One revolution equals one year, which is approximately 365.25 days."
  },
  {
    question: "Which motion causes day and night?",
    options: ["Revolution", "Rotation", "Precession", "Gravitation"],
    correctAnswerIndex: 1,
    explanation: "Earth rotates on its axis once every 24 hours, causing day and night."
  }
];

const KAAMOS_QUESTIONS: QuizQuestion[] = [
  {
    question: "What is 'Kaamos'?",
    options: ["A type of snow", "Polar Night (Sun doesn't rise)", "The Northern Lights", "Midsummer Festival"],
    correctAnswerIndex: 1,
    explanation: "Kaamos is the Finnish term for the Polar Night, a period in winter north of the Arctic Circle when the sun does not rise above the horizon."
  },
  {
    question: "Where can you experience the Midnight Sun?",
    options: ["At the Equator", "Anywhere in Europe", "North of the Arctic Circle", "Only at the South Pole"],
    correctAnswerIndex: 2,
    explanation: "The Midnight Sun is a natural phenomenon that occurs in the summer months in places north of the Arctic Circle or south of the Antarctic Circle."
  },
  {
    question: "In Rovaniemi (Arctic Circle), approximately how much sunlight is there in mid-winter?",
    options: ["12 hours", "Only a few hours of twilight", "24 hours", "8 hours"],
    correctAnswerIndex: 1,
    explanation: "In mid-winter near the Arctic Circle, the sun barely rises, resulting in very short days or just twilight."
  }
];

const SHADOW_QUESTIONS: QuizQuestion[] = [
  {
    question: "When is your shadow the shortest?",
    options: ["Sunrise", "Noon", "Sunset", "Midnight"],
    correctAnswerIndex: 1,
    explanation: "Shadows are shortest when the light source (the Sun) is at its highest point in the sky, typically around solar noon."
  },
  {
    question: "If the Sun is low in the sky (like winter in Finland), your shadow will be:",
    options: ["Very short", "Very long", "Invisible", "The same as your height"],
    correctAnswerIndex: 1,
    explanation: "A low angle of light creates long shadows. In Finnish winters, the sun stays low, creating long shadows all day."
  },
  {
    question: "What happens to a shadow as the light source moves higher?",
    options: ["It gets longer", "It gets shorter", "It disappears", "It becomes wider"],
    correctAnswerIndex: 1,
    explanation: "As the angle of incidence increases (sun gets higher), the shadow length decreases."
  }
];

// Map topics (keywords) to question sets
const TOPIC_MAP: Record<string, QuizQuestion[]> = {
  "kaamos": KAAMOS_QUESTIONS,
  "polar": KAAMOS_QUESTIONS,
  "shadow": SHADOW_QUESTIONS,
  "incidence": SHADOW_QUESTIONS,
  // Fallback to default for general orbit/season topics if not specifically matched
  "default": DEFAULT_QUESTIONS
};

// --- COMMAND DATA ---

const COMMAND_DATA: AstroCommand[] = [
  {
    role: "Earth",
    action: "Tilt your upper body to the right. Keep this tilt and walk in a circle around the 'Sun'.",
    question: "When your tilt points towards the Sun, what season is it in the North?",
    answer: "Summer"
  },
  {
    role: "Sun",
    action: "Stand still. Shine your 'light' (arms) directly at Earth's waist (Equator).",
    question: "Where is the sunlight hitting most directly?",
    answer: "The Equator"
  },
  {
    role: "Earth",
    action: "Spin around (rotate) while moving slowly along your orbit path.",
    question: "You are doing two motions. What do they represent?",
    answer: "Rotation (Day) and Revolution (Year)"
  },
  {
    role: "Observer",
    action: "Stand in 'Finland' (Top of Earth). Look at the Sun when Earth is tilted away.",
    question: "Does the Sun look high or low in the sky?",
    answer: "Low"
  }
];

/**
 * Service to retrieve quiz questions.
 * Now uses static local data.
 */
export const generateQuizQuestions = async (topic: string, count: number = 3): Promise<QuizQuestion[]> => {
  const t = topic.toLowerCase();
  
  // Find matching topic
  let data = TOPIC_MAP["default"];
  for (const key in TOPIC_MAP) {
    if (t.includes(key)) {
      data = TOPIC_MAP[key];
      break;
    }
  }

  // Return all available questions for that topic (ignoring count for static data simplicity, or slicing if needed)
  // To keep the app dynamic feeling, we could shuffle them here if we had a large bank.
  return Promise.resolve(data);
};

/**
 * Service to retrieve astro commands.
 * Now uses static local data.
 */
export const generateAstroCommands = async (topic: string): Promise<AstroCommand[]> => {
  return Promise.resolve(COMMAND_DATA);
};
