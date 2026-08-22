import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    server: "e-waste-ai-classifier",
    nvidiaKeyConfigured: Boolean(NVIDIA_API_KEY)
  });
});

app.post("/api/analyze", async (req, res) => {
  try {
    if (!NVIDIA_API_KEY) {
      return res.status(500).json({
        error: "NVIDIA_API_KEY is not configured. Create a .env file."
      });
    }

    const { image } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Missing image. Send a base64 data URL in the 'image' field."
      });
    }

    if (!image.startsWith("data:image/")) {
      return res.status(400).json({
        error: "Invalid image format. Expected an image data URL."
      });
    }

    const prompt = `Analyze the image as an e-waste identification and classification system.

Identify the electronic/electrical item shown in the image and determine its classification.

IMPORTANT OUTPUT RULES:
1. Return ONLY ONE valid JSON object.
2. Do NOT return markdown.
3. Do NOT use code fences.
4. Do NOT provide explanations before or after the JSON.
5. Do NOT include additional fields outside the schema.
6. All fields in the schema are mandatory.
7. "is_ewaste" MUST be a boolean.
8. "confidence" MUST be a number between 0 and 1.
9. If the item is an electrical/electronic device, component, accessory, charger, adapter, cable, battery, PCB, or similar electronic equipment, classify it as e-waste.
10. Base the classification primarily on what is visually identifiable.
11. If the exact item cannot be identified, use the closest reasonable classification and lower confidence.
12. Never return null, undefined, or omit a field.

Return EXACTLY:
{
  "is_ewaste": true,
  "item": "string",
  "category": "string",
  "subcategory": "string",
  "confidence": 0.0,
  "condition": "New | Used | Damaged | Broken | Partially Damaged | Unknown",
  "description": "string"
}

FIELD DEFINITIONS:
- is_ewaste: whether the visible object qualifies as e-waste.
- item: the specific item, e.g. USB Power Adapter, Laptop, Smartphone, LCD Monitor, Keyboard, PCB, Hard Drive.
- category: broad category, e.g. IT Equipment, Telecommunication Equipment, Consumer Electronics, Electrical Equipment, Electronic Components, Batteries, Cables and Accessories.
- subcategory: specific classification within the category.
- confidence: decimal from 0 to 1.
- condition: visible physical condition.
- description: concise visual description including relevant distinguishing characteristics or damage.

Remember: your entire response must be ONLY the JSON object. and do not get away from json no matter what`;

    const nvidiaResponse = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta/llama-3.2-11b-vision-instruct",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.2
        })
      }
    );

    const raw = await nvidiaResponse.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: "NVIDIA returned a non-JSON response.",
        details: raw.slice(0, 1000)
      });
    }

    if (!nvidiaResponse.ok) {
      return res.status(nvidiaResponse.status).json({
        error: "NVIDIA API request failed.",
        details: data
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    console.log("==============================================");
    console.log("NVIDIA MODEL RESPONSE");
    console.log("==============================================");
    console.log(content);
    console.log("==============================================");

    if (!content) {
      return res.status(502).json({
        error: "NVIDIA response did not contain model output.",
        details: data
      });
    }

    function extractJsonObject(text) {
      if (!text || typeof text !== "string") {
        return null;
      }

      let cleaned = text.trim();

      // Remove markdown code fences if the model added them.
      cleaned = cleaned
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      // Find the JSON object inside any extra model text.
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
      }

      const jsonText = cleaned.slice(firstBrace, lastBrace + 1);

      try {
        return JSON.parse(jsonText);
      } catch (error) {
        console.error("JSON parse failed.");
        console.error("Extracted JSON:");
        console.error(jsonText);

        return null;
      }
    }

    const result = extractJsonObject(content);

    if (!result) {
      console.error("==============================================");
      console.error("INVALID NVIDIA MODEL RESPONSE");
      console.error("==============================================");
      console.error(content);
      console.error("==============================================");

      return res.status(502).json({
        error: "Model returned invalid JSON.",
        rawModelResponse: content
      });
    }

    const normalized = {
      is_ewaste: Boolean(result.is_ewaste),
      item: String(result.item ?? "Unknown"),
      category: String(result.category ?? "Unknown"),
      subcategory: String(result.subcategory ?? "Unknown"),
      confidence: Math.max(
        0,
        Math.min(1, Number(result.confidence) || 0)
      ),
      condition: String(result.condition ?? "Unknown"),
      description: String(result.description ?? "")
    };

    res.json(normalized);
  } catch (error) {
    console.error("Analysis error:", error);

    res.status(500).json({
      error: "Server error while analyzing image.",
      details: error.message
    });
  }
});

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

app.listen(PORT, () => {
  console.log("==============================================");
  console.log("E-WASTE AI CLASSIFIER");
  console.log("==============================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`NVIDIA API key: ${NVIDIA_API_KEY ? "CONFIGURED" : "NOT CONFIGURED"}`);
  console.log("==============================================");
});