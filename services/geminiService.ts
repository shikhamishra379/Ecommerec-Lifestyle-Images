
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationResult, ProductInfo, GroundingSource } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Strips markdown code blocks and whitespace from a string to ensure it's valid JSON
 */
const cleanJsonResponse = (text: string): string => {
  let cleaned = text.trim();
  // Remove markdown JSON blocks if they exist (```json ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
};

export const generateLifestyleConcepts = async (
  product: ProductInfo,
  refinement?: string
): Promise<GenerationResult> => {
  const model = "gemini-3-flash-preview";

  const isInfographic = product.assetType === 'Infographic';
  const hasUrl = !!product.url && product.url.trim().length > 0;

  const systemInstruction = `You are a World-Class Creative Director and Market Research Specialist. Your goal is to generate 5 high-end visual concepts for a ${product.assetType} campaign.

### SMART RESEARCH MODE:
${hasUrl ? `- A product URL has been provided: ${product.url}. 
- MANDATORY: Use your search tool to investigate this product. Extract its materials, technical dimensions, specific safety certifications (e.g. Cut Resistance level), and brand aesthetic.
- Use this research to ensure your concepts are technically accurate for this specific product model.` : ''}

### MANDATORY CORE RULES:
- If a Product Image is uploaded, the prompt MUST start with: "Using the uploaded source image as the absolute physical reference for the product, maintaining the exact physical form, geometry, and mechanical openings."
- Materials MUST NEVER pass through solid housings. Only interact via identified openings.

### ASSET TYPE SPECIFIC LOGIC (CRITICAL):

${isInfographic ? `
#### FOR INFOGRAPHIC ASSETS:
- OBJECTIVE: Showcase technical specifications, safety features, and mechanical utility based on your research.
- BACKGROUND: Use clean, professional studio environments (solid white, neutral grey, or minimalist workshop).
- COMPOSITION: Focus on macro close-ups of specific features.
- VISUAL STYLE: Use "Diagrammatic lighting," "Exploded view," or "Technical cross-section" terminology.
- PROMPT FOCUS: Research the ${product.name} specs. Describe shots that highlight materials discovered in research.` : `
#### FOR LIFESTYLE ASSETS:
- OBJECTIVE: Human behavior and use-cases discovered from the product listing research.
- COMPOSITION: Action shots, people interacting with the product in real-world settings.
- MOOD: Narrative-driven, cinematic, and situational.`}

### OUTPUT REQUIREMENTS (JSON):
1. category: e.g., 'Technical Breakdown' (for Infographic), 'Situational Action' (for Lifestyle).
2. title: Professional marketing title.
3. description: Explain the design logic and how your research into ${product.url || 'the product'} informed this choice.
4. prompt: A detailed 8K prompt for AI generation including the Source Reference, Aspect Ratio Phrasing ("${product.aspectRatio}"), and researched technical details.

IMPORTANT: Return valid JSON matching the schema.`;

  const promptText = `
    Product: ${product.name}
    URL: ${product.url}
    Asset Type: ${product.assetType}
    User Details: ${product.specificDetails}
    Theme: ${product.theme}
    Ratio: ${product.aspectRatio}
    ${refinement ? `\nREFINEMENT REQUEST: ${refinement}` : ''}

    Research the product details from the URL provided and generate 5 distinct ${product.assetType} concepts.
  `;

  const contents: any = {
    parts: [
      { text: promptText }
    ]
  };

  if (product.productImageBase64) {
    contents.parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: product.productImageBase64.split(',')[1]
      }
    });
  }

  try {
    const config: any = {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          concepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                prompt: { type: Type.STRING },
              },
              required: ["category", "title", "description", "prompt"],
            }
          }
        },
        required: ["concepts"],
      },
    };

    // Add search tool if URL is provided
    if (hasUrl) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    const text = response.text || '{"concepts": []}';
    const cleanedText = cleanJsonResponse(text);
    const result: GenerationResult = JSON.parse(cleanedText);

    // Extract grounding chunks if they exist
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingChunks) {
      result.groundingSources = groundingMetadata.groundingChunks
        .map((chunk: any) => ({
          title: chunk.web?.title || chunk.web?.uri,
          uri: chunk.web?.uri
        }))
        .filter((source: GroundingSource) => !!source.uri);
    }

    result.concepts = result.concepts.map((c, i) => ({
      ...c,
      id: `concept-${Date.now()}-${i}`
    }));

    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
