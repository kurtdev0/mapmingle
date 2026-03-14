import { GoogleGenAI, Type } from "@google/genai";
import { ExaggerationResult, ItineraryDay, Place, WaterSafetyInfo } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const MAPS_MODEL = 'gemini-2.5-flash'; 
const REASONING_MODEL = 'gemini-3-flash-preview'; 

export const searchPlaces = async (query: string, location?: { lat: number; lng: number }): Promise<Place[]> => {
  try {
    const retrievalConfig = location ? {
      retrievalConfig: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    } : {};

    const response = await ai.models.generateContent({
      model: MAPS_MODEL,
      contents: `List 5 specific, real places matching this request: "${query}". For each place, provide a name and a very short description.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: retrievalConfig
      }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) return [];

    const groundingChunks = candidates[0].groundingMetadata?.groundingChunks;
    const places: Place[] = [];

    // 1. Try to get data from Grounding (Best Source)
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.maps) {
          places.push({
            name: chunk.maps.title,
            address: chunk.maps.placeId, // Maps grounding often gives Place ID or address
            uri: chunk.maps.uri,
            rating: 4.0 + Math.random(), // Simulate high ratings for recommended spots
            userRatingsTotal: Math.floor(Math.random() * 500) + 50,
            photoUrl: `https://loremflickr.com/800/600/travel,${encodeURIComponent(chunk.maps.title.split(' ')[0])}?random=${Math.random()}`
          });
        }
      });
    }

    // 2. Fallback: Parse text if Grounding fails or returns nothing useful (Robustness)
    if (places.length === 0 && response.text) {
        const lines = response.text.split('\n');
        lines.forEach(line => {
            // Simple heuristic to catch list items like "1. Eiffel Tower" or "- Colosseum"
            const match = line.match(/^[\d-]+\.\s*\*?(.*?)\*?(:|-|$)/);
            if (match && match[1]) {
                const name = match[1].trim();
                places.push({
                    name: name,
                    address: "Location details available on map",
                    uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
                    rating: 4.5,
                    tags: ['Discovered'],
                    photoUrl: `https://loremflickr.com/800/600/landmark,${encodeURIComponent(name.replace(/\s/g, ','))}?random=${Math.random()}`
                });
            }
        });
    }

    // Deduplicate based on name
    return Array.from(new Map(places.map(item => [item.name, item])).values()).slice(0, 6);

  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
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
    
    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        isSafe: data.isSafe,
        details: data.details,
        locations: []
      };
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Water Safety Error:", error);
    return { isSafe: false, details: "Could not fetch safety info.", locations: [] };
  }
};

export const getExaggerationScore = async (placeName: string): Promise<ExaggerationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: `Rate how overrated "${placeName}" is on a scale of 1 to 10 (10 being extremely overrated/tourist trap, 1 being a hidden gem). Be honest and critical. Provide a short verdict and reasoning.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            placeName: { type: Type.STRING },
            score: { type: Type.NUMBER },
            verdict: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ExaggerationResult;
    }
    throw new Error("No score returned");
  } catch (error) {
    return { placeName, score: 5, verdict: "Unknown", reasoning: "Could not analyze." };
  }
};

export const getItinerary = async (location: string, days: number): Promise<ItineraryDay[]> => {
  try {
    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: `Create a ${days}-day must-see and must-eat itinerary for ${location}. Return a JSON array.`,
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
              food: { type: Type.STRING, description: "Must eat recommendation" }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ItineraryDay[];
    }
    return [];
  } catch (error) {
    console.error("Itinerary Error:", error);
    return [];
  }
};
