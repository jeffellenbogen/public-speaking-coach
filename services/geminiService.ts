
import { GoogleGenAI, Type } from "@google/genai";
import type { StructuredFeedback, FileData } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const feedbackSchema = {
  type: Type.OBJECT,
  properties: {
    overallImpression: {
      type: Type.STRING,
      description: "A brief, encouraging summary of the presentation.",
    },
    bodyLanguageAndPosture: {
      type: Type.STRING,
      description: "Analysis of stance, movement, and physical presence with specific examples and suggestions.",
    },
    gesturesAndHandMovement: {
      type: Type.STRING,
      description: "Comments on the effectiveness of hand gestures, whether they are purposeful or distracting.",
    },
    vocalVarietyAndPacing: {
      type: Type.STRING,
      description: "Analysis of tone, volume, pitch, and the speed of speech.",
    },
    clarityAndArticulation: {
      type: Type.STRING,
      description: "Feedback on speech clarity, mumbling, and the use of filler words (e.g., 'um', 'like').",
    },
    contentAndStructure: {
      type: Type.STRING,
      description: "Brief comments on the flow and clarity of the presentation content, especially if slides are provided. If no slides, mention it is based on spoken content.",
    },
    actionableSummary: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 3-5 key, bullet-pointed takeaways for the presenter to focus on for improvement.",
    },
  },
  required: [
    'overallImpression',
    'bodyLanguageAndPosture',
    'gesturesAndHandMovement',
    'vocalVarietyAndPacing',
    'clarityAndArticulation',
    'contentAndStructure',
    'actionableSummary',
  ],
};


export const getPresentationFeedback = async (
  videoData: FileData,
  slidesData: FileData | null,
  feedbackRequest: string,
  presentationContext: string
): Promise<StructuredFeedback> => {
  const model = 'gemini-3-pro-preview';

  const systemInstruction = `You are a world-class public speaking coach. Your task is to analyze a presentation and provide constructive, actionable feedback. The user will provide a video of their presentation, a description of the feedback they are looking for, and optionally, their presentation slides and the context of the presentation (e.g., class assignment, conference talk).

Your feedback must be structured and encouraging. Analyze the provided materials and return your feedback in a structured JSON format according to the provided schema.`;

  let userPrompt = `Please analyze my presentation.`;
  if (feedbackRequest) {
    userPrompt += `\n\nHere is what I'd like you to focus on: "${feedbackRequest}"`;
  }
  if (presentationContext) {
    userPrompt += `\n\nFor context, this presentation is for: "${presentationContext}"`;
  }

  const parts: any[] = [
    { text: userPrompt },
    { inlineData: { mimeType: videoData.mimeType, data: videoData.data } },
  ];

  if (slidesData) {
    parts.push({
      inlineData: { mimeType: slidesData.mimeType, data: slidesData.data },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: feedbackSchema,
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      throw new Error("Received an empty response from the API.");
    }
    
    return JSON.parse(jsonText) as StructuredFeedback;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get feedback from the AI service.");
  }
};
