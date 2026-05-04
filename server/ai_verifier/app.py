"""
Farmazon AI Lab Report Verifier
Flask microservice — OCR + keyword analysis + confidence scoring
Run: python app.py  (port 5001)
"""

import re
import base64
import io
import os
import tempfile
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from dateutil import parser as dateparser
from PIL import Image

app = Flask(__name__)
CORS(app)

# ─── Lazy-load EasyOCR (heavy model, load once) ───────────────────────────────
_reader = None
def get_reader():
    global _reader
    if _reader is None:
        import easyocr
        _reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    return _reader

# ─── Trusted Labs ─────────────────────────────────────────────────────────────
TRUSTED_LABS = [
    "nabl", "fssai", "agmark", "iari", "icar", "sgtin", "bureau of indian standards",
    "bis", "national accreditation", "central food laboratory", "state food laboratory",
    "vimta labs", "eurofins", "sgs india", "intertek", "tüv", "tuv", "bureau veritas",
    "ral", "accredited laboratory", "iso 17025", "iso17025",
]

# ─── Keywords ─────────────────────────────────────────────────────────────────
POSITIVE_KEYWORDS = [
    "pesticide free", "pesticide-free", "no pesticide", "zero pesticide",
    "organic", "certified organic", "chemical free", "chemical-free",
    "residue free", "residue-free", "below detection limit", "bdl",
    "not detected", "nd", "complies", "pass", "passed", "safe",
    "certified", "certificate", "test report", "analysis report",
    "lab report", "laboratory report", "test certificate",
    "residue level", "maximum residue limit", "mrl",
]

NEGATIVE_KEYWORDS = [
    "detected", "exceeds", "fail", "failed", "non-compliant",
    "above limit", "unsafe", "contaminated", "rejected",
]

DATE_PATTERNS = [
    r'\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b',
    r'\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b',
    r'\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+\d{2,4})\b',
    r'\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+\d{1,2}[\s,]+\d{2,4})\b',
]

# ─── Helpers ──────────────────────────────────────────────────────────────────
def extract_text_from_image(image_bytes):
    reader = get_reader()
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    results = reader.readtext(image, detail=0, paragraph=True)
    return '\n'.join(results)

def extract_text_from_pdf(pdf_bytes):
    try:
        from pdf2image import convert_from_bytes
        images = convert_from_bytes(pdf_bytes, dpi=200)
        reader = get_reader()
        all_text = []
        for img in images[:3]:  # max 3 pages
            results = reader.readtext(img, detail=0, paragraph=True)
            all_text.extend(results)
        return '\n'.join(all_text)
    except Exception as e:
        return f"PDF_ERROR: {str(e)}"

def find_dates(text):
    found = []
    text_lower = text.lower()
    for pattern in DATE_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        for m in matches:
            try:
                dt = dateparser.parse(m, dayfirst=True)
                if dt:
                    found.append(dt)
            except Exception:
                pass
    return found

def is_date_valid(dates):
    """True if any date is within last 6 months."""
    cutoff = datetime.now() - timedelta(days=180)
    for d in dates:
        if cutoff <= d <= datetime.now():
            return True
    return False

def find_lab_name(text):
    text_lower = text.lower()
    for lab in TRUSTED_LABS:
        if lab in text_lower:
            return lab.title()
    return None

def count_keywords(text, keywords):
    text_lower = text.lower()
    return sum(1 for kw in keywords if kw in text_lower)

def extract_result_values(text):
    """Extract numeric residue/result values like '0.01 mg/kg', 'BDL', 'ND'."""
    values = []
    patterns = [
        r'(\d+\.?\d*)\s*(mg\/kg|ppm|ppb|µg\/kg|ug\/kg)',
        r'\b(bdl|nd|not detected|below detection)\b',
    ]
    for p in patterns:
        matches = re.findall(p, text, re.IGNORECASE)
        for m in matches:
            values.append(m[0] if isinstance(m, tuple) else m)
    return list(set(values))[:10]

# ─── Scoring Engine ───────────────────────────────────────────────────────────
def compute_score(text):
    score = 0
    breakdown = {}

    # 1. Positive keywords (max 35 pts)
    pos_count = count_keywords(text, POSITIVE_KEYWORDS)
    pos_score = min(pos_count * 7, 35)
    score += pos_score
    breakdown['keyword_score'] = pos_score
    breakdown['keywords_found'] = pos_count

    # 2. Negative keywords — penalise (max -30 pts)
    neg_count = count_keywords(text, NEGATIVE_KEYWORDS)
    neg_penalty = min(neg_count * 10, 30)
    score -= neg_penalty
    breakdown['negative_penalty'] = neg_penalty
    breakdown['negative_keywords'] = neg_count

    # 3. Trusted lab name (25 pts)
    lab_name = find_lab_name(text)
    lab_score = 25 if lab_name else 0
    score += lab_score
    breakdown['lab_name'] = lab_name or 'Not found'
    breakdown['lab_score'] = lab_score

    # 4. Date validity (20 pts)
    dates = find_dates(text)
    date_valid = is_date_valid(dates)
    date_score = 20 if date_valid else (10 if dates else 0)
    score += date_score
    breakdown['dates_found'] = [d.strftime('%Y-%m-%d') for d in dates[:3]]
    breakdown['date_valid'] = date_valid
    breakdown['date_score'] = date_score

    # 5. Report structure bonus (20 pts)
    structure_keywords = ['test report', 'certificate', 'analysis', 'laboratory', 'sample', 'result']
    struct_count = count_keywords(text, structure_keywords)
    struct_score = min(struct_count * 4, 20)
    score += struct_score
    breakdown['structure_score'] = struct_score

    # Clamp 0–100
    final_score = max(0, min(100, score))
    breakdown['total_score'] = final_score

    # Decision
    if final_score >= 80:
        status = 'approved'
    elif final_score >= 50:
        status = 'needs_review'
    else:
        status = 'rejected'

    breakdown['status'] = status
    breakdown['result_values'] = extract_result_values(text)
    breakdown['extracted_text_preview'] = text[:500].strip()

    return final_score, status, breakdown

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'Farmazon AI Lab Verifier'})

@app.route('/verify', methods=['POST'])
def verify():
    data = request.get_json()
    if not data or 'file' not in data:
        return jsonify({'error': 'No file provided'}), 400

    file_b64 = data['file']
    file_type = data.get('fileType', 'image')  # 'image' or 'pdf'

    # Decode base64 (strip data URI prefix if present)
    if ',' in file_b64:
        file_b64 = file_b64.split(',', 1)[1]

    try:
        file_bytes = base64.b64decode(file_b64)
    except Exception:
        return jsonify({'error': 'Invalid base64 data'}), 400

    # OCR
    try:
        if file_type == 'pdf':
            text = extract_text_from_pdf(file_bytes)
        else:
            text = extract_text_from_image(file_bytes)
    except Exception as e:
        return jsonify({'error': f'OCR failed: {str(e)}'}), 500

    if not text or len(text.strip()) < 10:
        return jsonify({
            'score': 0,
            'status': 'rejected',
            'reason': 'Could not extract readable text from the file.',
            'breakdown': {},
        }), 200

    score, status, breakdown = compute_score(text)

    return jsonify({
        'score': score,
        'status': status,
        'breakdown': breakdown,
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f'🧪 AI Lab Verifier running on port {port}')
    app.run(host='0.0.0.0', port=port, debug=False)
