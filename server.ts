import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up server limit to allow image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Initialize Google GenAI securely from background
const getGenAI = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    // If key is missing, throw a helpful message, or we can handle fallback gracefully
    throw new Error("Missing or invalid GEMINI_API_KEY. Please set your Gemini API secret in settings.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// --- API Endpoints ---

// Check backend status/config
app.get("/api/config", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    timestamp: new Date().toISOString()
  });
});

// Endpoint: Multimodal Fridge scan
app.post("/api/scan-fridge", async (req, res) => {
  try {
    const { image } = req.body; // base64 string
    if (!image) {
      res.status(400).json({ error: "Missing image parameter" });
      return;
    }

    // Clean base64 header if present, e.g. "data:image/jpeg;base64,..."
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    let mimeType = "image/jpeg";
    let base64Data = image;
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: "Identify all food items, vegetables, proteins, dairy, dry goods, fruits, condiments, or baking supplies visible in this photo of a fridge or pantry. Group or combine them into clean, simple food nouns (e.g., 'egg', 'tomato', 'chicken breast', 'spinach', 'milk', 'onion', 'parmesan cheese', 'bread'). Do not include extraneous items like containers or dishes. Return the output as a simple list of matching ingredient string names.",
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "List of detected raw food ingredient names present in the scanned scene",
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response string from Gemini API.");
    }

    const detectedIngredients = JSON.parse(text);
    res.json({ success: true, ingredients: detectedIngredients });
  } catch (error: any) {
    console.error("Fridge scanning error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while scanning the image.",
      fallbackData: ["egg", "milk", "spinach", "bread", "chicken breast", "tomato", "cheese"]
    });
  }
});

// Endpoint: Suggest Budget meal plan & cooking steps
app.post("/api/generate-plan", async (req, res) => {
  try {
    const { schedule, inventory } = req.body;
    if (!schedule) {
      res.status(400).json({ error: "Missing schedule parameter" });
      return;
    }

    const { activityLevel, dietaryPreference, dailyBudget, notes } = schedule;
    const itemsInStock = inventory || [];

    const ai = getGenAI();

    const systemPrompt = `You are BiteBudget, an elite AI chef, culinary planner, and thrifty budget coach.
The user is planning a daily meal schema (Breakfast, Lunch, Dinner).
Their details are:
- Daily budget: $${dailyBudget} USD.
- Diet constraint: ${dietaryPreference}.
- Daily Schedule / Activity level: ${activityLevel} (e.g. busy workday vs workout day vs leisure).
- Additional requests/notes: "${notes || "None"}".
- Ingredients currently in their fridge/inventory in stock: ${JSON.stringify(itemsInStock)}.

Your main mission:
1. Formulate a 3-course daily meal plan (Breakfast, Lunch, and Dinner). Set it up such that it minimizes user's total cash out-of-pocket for needed groceries.
2. Maximize the usage of items already 'in stock' to save money.
3. Keep the meal plan customized to their schedule. For example, if 'busy', offer rapid, low-cook meals or meal preps. If a high-activity workout level, prioritize macronutrient density.
4. If they need to buy ingredients, write them down in the 'missingGroceries' array with realistic budget costs (e.g. approximate local supermarket pricing in USD, like $0.50 for a banana, $2.00 for yogurt, etc.), and provide a clever cheaper substitution or ingredient swap option (e.g., swapping expensive berries for frozen berries or apples, or meat with cheaper eggs/beans, cheese with nutritional yeast, or vice versa) which reduces estimated cost even further.
5. Create fully action-oriented Cooking steps for EACH of the three meals. Include a precise 'durationSeconds' value for any step that contains a timing threshold (such as simmering for 5 minutes, boiling pasta for 10 minutes, pan-frying for 3 minutes) so they can run interactive timers! If a step doesn't involve waiting/active timers, assign durationSeconds = 0.

Ensure that totalEstimatedCost matches the sum of the estimated costs of ingredients listed in 'missingGroceries'.
Provide a concise, practical custom 'spendingRecommendation' pointing out budget status (whether under, at, or over budget), active substitution advice, and daily schedule guidance. Ensure all output values are valid JSON compliant with the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Generate my BiteBudget daily meal plan.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mealType: { type: Type.STRING, description: "Must be Breakfast, Lunch, or Dinner" },
                  recipeName: { type: Type.STRING, description: "Name of the dish" },
                  description: { type: Type.STRING, description: "Slick and descriptive culinary tagline" },
                  prepTime: { type: Type.INTEGER, description: "Prep duration in minutes" },
                  cookTime: { type: Type.INTEGER, description: "Cook duration in minutes" },
                  estimatedCost: { type: Type.NUMBER, description: "Estimated incremental portion cost of this meal" },
                  ingredientsRequired: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "User friendly line, e.g. '2 large Brown eggs'"
                  },
                  simpleIngredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Pure lowercase matching name e.g., 'egg'. We'll use this for set comparisons."
                  },
                  instructions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        step: { type: Type.INTEGER },
                        instruction: { type: Type.STRING, description: "Detailed, chef-like direction" },
                        durationSeconds: { type: Type.INTEGER, description: "Timer length for this action, 0 if static" }
                      },
                      required: ["step", "instruction", "durationSeconds"]
                    }
                  },
                  substitutions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        original: { type: Type.STRING, description: "Base ingredient name" },
                        replacement: { type: Type.STRING, description: "More affordable or alternative in-store ingredient" },
                        costDifference: { type: Type.NUMBER, description: "How much cheaper it is. Should be positive if it saves money, e.g. 1.50 means saving $1.50" }
                      },
                      required: ["original", "replacement", "costDifference"]
                    }
                  }
                },
                required: ["mealType", "recipeName", "description", "prepTime", "cookTime", "estimatedCost", "ingredientsRequired", "simpleIngredients", "instructions", "substitutions"]
              }
            },
            missingGroceries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Simplistic name of missing item" },
                  quantity: { type: Type.STRING, description: "Specific checkout unit, e.g. '1 carton', '1 bunch'" },
                  estimatedCost: { type: Type.NUMBER, description: "Approximate cost in USD (e.g. 2.49)" },
                  substitutionSuggestion: { type: Type.STRING, description: "Optional dynamic swap" },
                  cheaperSubstitutionCost: { type: Type.NUMBER, description: "Alternative item cost to purchase instead" }
                },
                required: ["name", "quantity", "estimatedCost"]
              }
            },
            totalEstimatedCost: { type: Type.NUMBER, description: "Combined sum of the missing groceries cost" },
            spendingRecommendation: { type: Type.STRING, description: "Chef coach advice custom tailored to user schedule, budget ceiling, and smart shopping tricks" }
          },
          required: ["meals", "missingGroceries", "totalEstimatedCost", "spendingRecommendation"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini.");
    }

    const payload = JSON.parse(text);
    res.json({ success: true, data: payload });
  } catch (error: any) {
    console.error("Meal planning error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while creating your customized meal plan.",
    });
  }
});

// App server setup
async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Mode setup
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode setup
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BiteBudget server running on http://0.0.0.0:${PORT}`);
  });
}

start();
