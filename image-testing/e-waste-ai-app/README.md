# E-Waste AI Classifier

Express.js backend + Vanilla JavaScript frontend using NVIDIA's vision model.

## 1. Requirements

- Node.js 18+
- A valid NVIDIA API key
- Camera permission for camera mode

## 2. Install

Open a terminal in this folder:

```bash
npm install
```

## 3. Configure NVIDIA API key

Copy:

```text
.env.example
```

to:

```text
.env
```

Then put your NEW NVIDIA API key in `.env`:

```env
NVIDIA_API_KEY=YOUR_NEW_NVIDIA_API_KEY
PORT=5000
```

Never put the key inside `public/`.

## 4. Start

```bash
npm start
```

Then open:

```text
http://localhost:5000
```

## 5. Development mode

```bash
npm run dev
```

## Architecture

```text
Browser / Vanilla JS
        |
        | POST /api/analyze
        v
Express.js
        |
        | Authorization: Bearer <server-side key>
        v
NVIDIA Vision API
        |
        v
Express.js
        |
        v
Browser
```

The browser never receives the NVIDIA API key.

## API

### GET /api/health

Returns server and NVIDIA key configuration status.

### POST /api/analyze

Body:

```json
{
  "image": "data:image/jpeg;base64,..."
}
```

Returns:

```json
{
  "is_ewaste": true,
  "item": "USB Power Adapter",
  "category": "Electrical Equipment",
  "subcategory": "Power Adapters",
  "confidence": 0.91,
  "condition": "Used",
  "description": "..."
}
```

## Important security note

If an NVIDIA API key was previously placed in frontend HTML/JavaScript or committed to GitHub, revoke/rotate that key and use a new key in `.env`.
