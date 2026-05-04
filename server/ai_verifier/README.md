# Farmazon AI Lab Verifier

Python microservice for OCR-based lab report verification.
Runs on port **5001** alongside the Node server (port 5000).

## Setup

```bash
cd server/ai_verifier

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run
python app.py
```

## PDF Support (optional)
PDF processing requires `poppler`. Install it:

**Windows:** Download from https://github.com/oschwartz10612/poppler-windows/releases
and add `bin/` folder to your PATH.

**Mac:** `brew install poppler`

**Linux:** `sudo apt install poppler-utils`

## API

### POST /verify
```json
{
  "file": "<base64 encoded image or PDF>",
  "fileType": "image"  // or "pdf"
}
```

Response:
```json
{
  "score": 85,
  "status": "approved",
  "breakdown": {
    "lab_name": "NABL",
    "keywords_found": 4,
    "date_valid": true,
    "dates_found": ["2024-11-15"],
    "result_values": ["BDL", "0.01 mg/kg"],
    "keyword_score": 28,
    "lab_score": 25,
    "date_score": 20,
    "structure_score": 16,
    "negative_penalty": 0,
    "total_score": 85
  }
}
```

## Score Rules
| Score | Status |
|-------|--------|
| ≥ 80  | ✅ approved |
| 50–79 | ⚠️ needs_review |
| < 50  | ❌ rejected |

## Environment Variable
Add to `server/.env`:
```
AI_VERIFIER_URL=http://localhost:5001
```
