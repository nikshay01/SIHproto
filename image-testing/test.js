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
                model: "meta/llama-3.2-11b-vision-instruct",

                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text:
                                    `Analyze the image as an e-waste identification and classification system.

Identify the electronic/electrical item shown in the image and determine its classification.

IMPORTANT OUTPUT RULES:
1. Return ONLY ONE valid JSON object.
2. Do NOT return markdown.
3. Do NOT use \`\`\`json or \`\`\` code fences.
4. Do NOT provide explanations before or after the JSON.
5. Do NOT include any additional fields outside the specified schema.
6. All fields in the schema are mandatory.
7. "is_ewaste" MUST be a boolean: true or false.
8. "confidence" MUST be a number between 0 and 1.
9. If the item is an electrical or electronic device, component, accessory, charger, adapter, cable, battery, PCB, or similar electronic equipment, classify it as e-waste for this application.
10. Base the classification primarily on what is visually identifiable in the image.
11. If the exact item cannot be identified, use the closest reasonable classification and lower the confidence score.
12. Never return null, undefined, or omit a field.

Return EXACTLY this JSON structure:

{
  "is_ewaste": true,
  "item": "string",
  "category": "string",
  "subcategory": "string",
  "confidence": 0.0,
  "condition": "string",
  "description": "string"
}

FIELD DEFINITIONS:

"is_ewaste":
Whether the identified object qualifies as e-waste for this application.

"item":
The specific electronic/electrical item visible in the image.
Examples: "USB Power Adapter", "Laptop", "Smartphone", "LCD Monitor", "Keyboard", "PCB", "Hard Drive".

"category":
The broad category of the item.
Examples: "IT Equipment", "Telecommunication Equipment", "Consumer Electronics", "Electrical Equipment", "Electronic Components", "Batteries", "Cables and Accessories".

"subcategory":
A more specific classification within the category.
Examples: "Power Adapters", "Laptops", "Mobile Phones", "Printed Circuit Boards", "Lithium-ion Batteries".

"confidence":
Your confidence in the identification and classification, represented as a decimal between 0 and 1.

"condition":
The visible physical condition of the item.
Use one of:
"New"
"Used"
"Damaged"
"Broken"
"Partially Damaged"
"Unknown"

"description":
A concise description of what is visibly present in the image, including relevant damage or distinguishing characteristics.

REMEMBER:
Your entire response must be ONLY the JSON object.
No markdown.
No code fences.
No explanation.
No additional text.
`
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