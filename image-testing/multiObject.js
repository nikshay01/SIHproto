require("dotenv").config();

const fs = require("fs");
const axios = require("axios");

const API_KEY = "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";
const IMAGE_PATH = "D:/nikshay/coding/SIH/main-project/image-testing/test-image/idk.jpg";

console.log("1. Starting...");
console.log("2. API key loaded:", API_KEY ? "YES" : "NO");
console.log("3. Image exists:", fs.existsSync(IMAGE_PATH));

async function testEwasteRecognition() {
    try {
        if (!API_KEY) {
            throw new Error("NVIDIA_API_KEY is missing from .env");
        }

        if (!fs.existsSync(IMAGE_PATH)) {
            throw new Error(`Image not found: ${IMAGE_PATH}`);
        }

        console.log("4. Reading image...");

        const imageBuffer = fs.readFileSync(IMAGE_PATH);
        const base64Image = imageBuffer.toString("base64");

        console.log("5. Image converted to base64");
        console.log("6. Sending request to NVIDIA...");

        const response = await axios.post(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            {
                model: "minimaxai/minimax-m3",

                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text:
                                    `Analyze the image and identify ONLY clearly visible electrical/electronic objects. Do not infer, assume, hallucinate, or identify hidden/internal objects. Do not count the same object twice. If an object is too unclear to identify, exclude it.

Return ONLY valid JSON with exactly this structure:

{
  "image_contains_ewaste": true,
  "object_count": 1,
  "objects": [
    {
      "item": "USB Power Adapter",
      "is_ewaste": true,
      "category": "Electrical Equipment",
      "subcategory": "Power Adapters",
      "confidence": 0.95,
      "condition": "Damaged",
      "description": "White power adapter with visibly damaged casing."
    }
  ]
}

Rules:
- Include ONLY visibly identifiable objects.
- One entry per distinct visible object.
- object_count must equal the objects array length.
- Use is_ewaste=true for visible electrical/electronic items that qualify as e-waste.
- confidence must be 0–1.
- condition must be: New, Used, Damaged, Broken, Partially Damaged, or Unknown.
- If no qualifying object is visible, return an empty objects array.
- No markdown, explanations, or additional text.`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],

                max_tokens: 500,
                temperature: 0.2
            },

            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },

                timeout: 60000
            }
        );

        console.log("7. NVIDIA responded!");

        console.log("\n==============================");
        console.log("MODEL RESPONSE");
        console.log("==============================\n");

        console.log(response.data.choices[0].message.content);

        console.log("\n==============================");
        console.log("FULL RESPONSE");
        console.log("==============================\n");

        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {

        console.log("\n==============================");
        console.log("ERROR");
        console.log("==============================\n");

        if (error.response) {
            console.log("HTTP Status:", error.response.status);
            console.log(
                "NVIDIA Response:",
                JSON.stringify(error.response.data, null, 2)
            );
        } else if (error.code === "ECONNABORTED") {
            console.log("Request timed out.");
        } else {
            console.log(error.message);
        }
    }
}

testEwasteRecognition();