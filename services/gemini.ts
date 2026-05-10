/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, Modality } from "@google/genai";
import { extractHtmlFromText } from "../utils/html";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const IMAGE_SYSTEM_PROMPT = "Generate an isolated object/scene on a simple background.";
export const VOXEL_PROMPT = "I have provided an image. Code a beautiful voxel art scene inspired by this image. Write threejs code as a single-page.";

export const generateImage = async (prompt: string, aspectRatio: string = '1:1', optimize: boolean = true): Promise<string> => {
  try {
    let finalPrompt = prompt;

    // Apply the shortened optimization prompt if enabled
    if (optimize) {
      finalPrompt = `${IMAGE_SYSTEM_PROMPT}\n\nSubject: ${prompt}`;
    }

    // Note: gemini-2.5-flash-image now supports multiple aspect ratios.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        responseModalities: [
            'IMAGE',
        ],
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image generated.");
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const analyzeAssetVibe = async (base64Image: string): Promise<{ description: string, tags: string[], palette: string[] }> => {
  try {
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const mimeType = base64Image.includes(',') ? base64Image.split(';')[0].split(':')[1] : 'image/png';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: `Analyze this image for a game asset library. Return a JSON object with:
              1. "description": A short, evocative 1-sentence "vibe" description.
              2. "tags": An array of 3-5 keyword strings (e.g., "mossy", "occult", "ui-element").
              3. "palette": An array of 3 hex color codes representing the dominant colors.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing asset:", error);
    throw error;
  }
};
export const generateVoxelScene = async (
  imageBase64: string, 
  onThoughtUpdate?: (thought: string) => void
): Promise<string> => {
  // Extract the base64 data part if it includes the prefix
  const base64Data = imageBase64.split(',')[1] || imageBase64;
  
  // Extract MIME type from the data URL if present, otherwise default to jpeg
  const mimeMatch = imageBase64.match(/^data:(.*?);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  let fullHtml = "";

  try {
    // Using gemini-2.5-flash for free tier usage
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: VOXEL_PROMPT
          }
        ]
      },
      config: {
        thinkingConfig: {
          includeThoughts: true,
        },
      },
    });

    for await (const chunk of response) {
      const candidates = chunk.candidates;
      if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          // Cast to any to access 'thought' property if not in current type definition
          const p = part as any;
          
          if (p.thought) {
            if (onThoughtUpdate && p.text) {
              onThoughtUpdate(p.text);
            }
          } else {
            if (p.text) {
              fullHtml += p.text;
            }
          }
        }
      }
    }

    return extractHtmlFromText(fullHtml);

  } catch (error) {
    console.error("Voxel scene generation failed:", error);
    throw error;
  }
};
