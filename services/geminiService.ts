import { GoogleGenAI, Type } from "@google/genai";
import { ExaggerationResult, ItineraryDay, Place, WaterSafetyInfo } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const MAPS_MODEL = 'gemini-2.5-flash'; 
const REASONING_MODEL = 'gemini-3-flash-preview'; 

export const searchPlaces = async (query: string, location?: { lat: number; lng: number }): Promise<Place[]> => {
  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: `You are a travel API. Find 3 specific, hidden gem locations matching: "${query}". 
      Return a RAW JSON array of objects. Do not use markdown blocks. Each object MUST have this exact structure:
      {
        "name": "Exact Place Name",
        "address": "City, Country",
        "rating": 4.8,
        "tags": ["Hidden Gem", "Unique"],
        "uri": "https://www.google.com/maps/search/?api=1&query=Exact+Place+Name",
        "photoUrl": "https://loremflickr.com/800/600/travel,landmark?random=xxx"
      }`,
    });

    try {
        let text = response.text || "[]";
        // Clean markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: any, idx) => ({
                name: p.name || p.title || 'Unknown Hidden Gem',
                address: p.address || p.location || 'Unknown Location',
                rating: p.rating || 4.5,
                tags: Array.isArray(p.tags) ? p.tags : ['Hidden Gem', 'Unique'],
                uri: p.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name || query)}`,
                photoUrl: p.photoUrl && p.photoUrl.includes('http') ? p.photoUrl : `https://loremflickr.com/800/600/travel,landmark?random=${Math.random() * 1000 + idx}`
            })).slice(0, 3);
        }
    } catch (e) {
        console.error("JSON parsing failed, falling back", e);
    }
    throw new Error("Invalid response");
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error; // Let Home.tsx handle the mock data fallback
  }
};

export const getWaterSafety = async (city: string): Promise<WaterSafetyInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: `Is tap water safe to drink in ${city}? Return a JSON object with 'isSafe' (boolean) and 'details' (string summary).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            details: { type: Type.STRING }
          }
        }
      }
    });
    
    try {
        let text = response.text || "{}";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(text);
        if (typeof data.isSafe === 'boolean') {
            return {
                isSafe: data.isSafe,
                details: data.details || "No details provided.",
                locations: []
            };
        }
    } catch (e) {
        console.error("Water Safety JSON parsing failed", e);
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Water Safety Error:", error);
    throw error;
  }
};

export const getExaggerationScore = async (placeName: string): Promise<ExaggerationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: `Rate "${placeName}" on these 6 metrics on a scale of 1 to 10, where 10 is the best (or most intense): 
      - waitingTime (1 = no wait, 10 = terrible lines)
      - taste (1 = terrible, 10 = amazing, if not applicable use 5)
      - crowdedness (1 = empty, 10 = completely packed)
      - view (1 = nothing special, 10 = breathtaking)
      - valueForMoney (1 = complete ripoff, 10 = incredible deal)
      - accessibility (1 = impossible to reach, 10 = extremely easy/accessible)
      
      Also provide an overall exaggeration 'score' (1 to 10, 10 meaning highly overrated/tourist trap, 1 meaning hidden gem).
      Provide a short 'verdict' and 'reasoning'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            placeName: { type: Type.STRING },
            score: { type: Type.NUMBER },
            verdict: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            metrics: {
              type: Type.OBJECT,
              properties: {
                waitingTime: { type: Type.NUMBER },
                taste: { type: Type.NUMBER },
                crowdedness: { type: Type.NUMBER },
                view: { type: Type.NUMBER },
                valueForMoney: { type: Type.NUMBER },
                accessibility: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ExaggerationResult;
    }
    throw new Error("No score returned");
  } catch (error) {
    return { 
      placeName, 
      score: 5, 
      verdict: "Unknown", 
      reasoning: "Could not analyze.",
      metrics: { waitingTime: 5, taste: 5, crowdedness: 5, view: 5, valueForMoney: 5, accessibility: 5 }
    };
  }
};

export const getItinerary = async (location: string, days: number): Promise<ItineraryDay[]> => {
  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: `Create a ${days}-day must-see and must-eat itinerary for ${location}. Return a RAW JSON array. For each day, provide the structured schedule strings (morning/afternoon/evening/food). CRITICALLY: provide a 'locations' array containing EXACTLY the 3-5 specific places visited that day in chronological order. Give the exact 'lat' (latitude) and 'lng' (longitude) coordinates for each place so they can be plotted on a map and connected by walking arrows.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER },
              morning: { type: Type.STRING },
              afternoon: { type: Type.STRING },
              evening: { type: Type.STRING },
              food: { type: Type.STRING, description: "Must eat recommendation" },
              locations: {
                  type: Type.ARRAY,
                  description: "List of exactly 3-4 specific places visited this day in order (e.g., Morning Activity, Lunch, Afternoon, Dinner)",
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          name: { type: Type.STRING },
                          lat: { type: Type.NUMBER },
                          lng: { type: Type.NUMBER },
                          type: { type: Type.STRING }
                      }
                  }
              }
            }
          }
        }
      }
    });

    try {
        let text = response.text || "[]";
        // Clean markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as ItineraryDay[];
        }
    } catch (e) {
        console.error("JSON parsing failed, falling back", e);
    }
    throw new Error("Invalid response");
  } catch (error) {
    console.error("Gemini Itinerary Error:", error);
    throw error;
  }
};
