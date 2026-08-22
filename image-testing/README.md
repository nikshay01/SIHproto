# E-Waste Classifier - Camera App

This is a standalone HTML application that allows you to:
1. Access your device's camera
2. Capture images of electronic/electrical items
3. Get AI-powered e-waste classification using NVIDIA's vision models
4. View detailed results in a user-friendly interface

## Features
- Camera access with start/stop controls
- Image capture functionality
- AI analysis using NVIDIA's Llama 3.2 11B Vision Instruct model
- Detailed e-waste classification including:
  - Item identification
  - Category and subcategory
  - Confidence score
  - Condition assessment
  - Description
- Beautiful, responsive UI with dark theme
- Raw JSON response viewer

## How to Use
1. Open `camera-app.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Click "Start Camera" to activate your device's camera
3. Position the e-waste item in the camera view
4. Click "Capture Image" to take a photo
5. Wait for the AI analysis to complete (usually 5-10 seconds)
6. View the detailed classification results below

## Technical Details
- Uses the NVIDIA API endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`
- Employs the exact same e-waste classification prompt, model, and parameters as `test.js`
- Processes images directly in the browser (no server required for image handling)
- Makes direct API calls to NVIDIA (requires CORS solution for browser execution)

## How Image Analysis Works
The application now implements the exact same logic as `test.js` for analyzing images:
1. Captures image from camera and converts to base64 (same as reading file in test.js)
2. Uses the same NVIDIA API endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`
3. Uses the same model: `meta/llama-3.2-11b-vision-instruct`
4. Uses the identical prompt and parameters as test.js
5. Processes the response in the same way

## Important Note about CORS
Because this application runs in a browser, making direct requests to `https://integrate.api.nvidia.com/v1/chat/completions` will encounter CORS (Cross-Origin Resource Sharing) restrictions. The NVIDIA API does not include the necessary CORS headers to allow requests from arbitrary origins like `localhost:3000`.

### To Get This Working, You Have Three Options:

#### Option 1: Use a Local CORS Proxy (Recommended for Development)
This is the easiest way to get the camera app working with real AI analysis:

```bash
# Install the proxy server globally (one-time)
npm install -g cors-proxy-server

# Start the proxy on port 9090
cors-proxy-server --port 9090
```

The proxy will automatically handle CORS by adding the necessary headers. No code changes needed - the app is already configured to work with a local proxy at `http://localhost:9090/` through the application's internal routing.

#### Option 2: Modify the Fetch URL for Different Proxy
If you prefer to use a different CORS proxy, you can modify one line in the `analyzeImage` function in `camera-app.html`:

Change this line:
```javascript
const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
```

To use your proxy (example for cors-anywhere):
```javascript
const response = await fetch('https://cors-anywhere.herokuapp.com/https://integrate.api.nvidia.com/v1/chat/completions', {
```

#### Option 3: Backend Proxy (Best for Production)
Create a simple backend endpoint (Node.js/Express, Python Flask, etc.) that:
1. Securely stores your NVIDIA API key (not exposed to clients)
2. Proxies requests to `https://integrate.api.nvidia.com/v1/chat/completions`
3. Handles CORS properly for your frontend
4. This is the most secure approach as it keeps your API key secret

### For Immediate Testing Without CORS Setup:
Use your existing Node.js scripts which work fine since they run in Node.js (no browser CORS restrictions):
```bash
node test.js          # Analyzes test-image/idk.jpg
node multiObject.js   # Another analysis script
```

## Privacy and Security Notes
- **IMPORTANT**: The current implementation includes your NVIDIA API key in the client-side code. This is fine for learning and local testing, but **not secure for production use**.
- For production, you should implement Option 3 (backend proxy) to keep your API key secure.
- Images are only sent to the NVIDIA API for analysis when you click "Capture Image"
- No images or data are stored locally by the application
- The application does not access your camera without your explicit permission

## Troubleshooting
If you see "Failed to fetch" or CORS errors in the console:
1. Make sure you've started a CORS proxy (Option 1 above)
2. Verify the proxy is running and accessible
3. Check that you're not blocking the request with browser extensions
4. Try accessing the proxy URL directly in your browser to verify it works

## Privacy Note
- The application runs entirely in your browser
- Images are only sent to the NVIDIA API for analysis
- No images or data are stored locally by the application
- Your API key is embedded in the code (for local use only)

## Requirements
- Modern web browser with camera access permissions
- Internet connection to reach the NVIDIA API
- Valid NVIDIA API key (already embedded from your .env file)

## Files in this Directory
- `camera-app.html` - Main application file
- `test.js` - Original Node.js script for file-based analysis
- `multiObject.js` - Node.js script for multiple object detection
- `test-image/` - Directory with test images
- `.env` - Environment variables including API key

## Notes
- For production use, consider moving the API key to a backend proxy to avoid exposing it in client-side code
- The application works best with clear, well-lit images of electronic/electrical items
- Some items may not be recognized if they're obscure or heavily damaged