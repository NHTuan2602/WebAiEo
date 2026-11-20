import os
import sys
import glob
import subprocess
import argparse
import re
from pathlib import Path
from google import genai
from google.genai import types

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>IELTS Reading Mock Test</title>
<style>
  @page {
    size: A4;
    margin: 20mm 15mm 20mm 15mm;
  }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    line-height: 1.45;
    color: #111;
    margin: 0;
    padding: 0;
  }
  .header-test {
    text-align: center;
    margin-bottom: 25px;
  }
  .highlight-yellow {
    background-color: #fff100 !important;
    font-weight: bold;
    padding: 2px 6px;
    font-size: 13px;
    display: inline-block;
    border-radius: 2px;
  }
  .passage-title {
    font-size: 16px;
    font-weight: bold;
    margin: 20px 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-green {
    background-color: #00e000 !important;
    color: #000;
    padding: 2px 6px;
    font-weight: bold;
    margin-right: 6px;
    border-radius: 2px;
  }
  p {
    margin: 0 0 10px 0;
    text-align: justify;
  }
  .question-block {
    margin-top: 20px;
  }
  .question-instruction {
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 13.5px;
  }
  .word-bank {
    border: 1.5px solid #222;
    padding: 10px 14px;
    margin: 12px 0;
    width: fit-content;
    min-width: 70%;
    background-color: #fafafa;
    line-height: 1.6;
  }
  table.exam-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }
  table.exam-table th, table.exam-table td {
    border: 1px solid #bbb;
    padding: 8px 10px;
    vertical-align: top;
    font-size: 12.5px;
  }
  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>
{content}
</body>
</html>
"""

PROMPT = """
You are an expert exam layout formatter and IELTS digitization engine.
I provide a sequence of screenshots of an IELTS reading test from a web interface (or scanned document).
Note:
1. The web interface typically has 2 columns (passage on left, questions on right) and dark mode.
2. Multiple screenshots contain overlapping parts due to scrolling. Carefully deduplicate them so no sentences or paragraphs are repeated.
3. Transcribe and structure the entire content into clean, semantic HTML body tags matching authentic Cambridge IELTS print layout.

Format rules:
- Mock test header: <div class="header-test"><span class="highlight-yellow">READING MOCK TEST</span></div> (only once at the very beginning).
- For each Passage (e.g. Passage 1 / R1, Passage 2 / R2, Passage 3 / R3):
  - If it is Passage 2 or Passage 3, prefix with <div class="page-break"></div>.
  - Section title: <div class="passage-title"><span class="badge-green">R1</span> TITLE OF THE PASSAGE</div>
  - Paragraphs: standard <p> tags. Retain paragraph markers (A, B, C...) if present at the start of paragraphs.
  - Questions: <div class="question-block">...</div>
  - Question instructions: <div class="question-instruction">...</div> (use <span class="highlight-yellow">...</span> for "NB You may use any letter more than once" or word limits if highlighted).
  - Summary / Note completion with Word Box (A-I): use <div class="word-bank">A ... B ... C ...</div>
  - Summary / Note completion with blanks: write 8___________ or 18 ____________
  - Tables: use <table class="exam-table">...</table>
  - Matching Information / Matching Features / True False Not Given: list each question item cleanly.
- Do NOT output ```html markdown tags or wrapper <html>/<body> tags. Return ONLY the raw inner HTML content.
"""

def get_msedge_or_chrome_path():
    """Detect Edge, Chrome, or Chromium across Windows, macOS, and Linux."""
    candidates = [
        # Windows Edge
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
        # Windows Chrome
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        # Windows Brave
        r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
        # macOS
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        # Linux
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/microsoft-edge",
        "/usr/bin/microsoft-edge-stable",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium"
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return None

def find_gemini_api_key(cli_key=None):
    """Resolve Gemini API key from CLI flag, environment, or .env file."""
    if cli_key and cli_key.strip():
        return cli_key.strip()
    
    env_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("VITE_GEMINI_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()

    # Try searching for .env in current or parent directories
    search_paths = [
        Path.cwd() / ".env",
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent / ".env"
    ]
    for p in search_paths:
        if p.exists():
            try:
                content = p.read_text(encoding="utf-8")
                match = re.search(r"^(?:GEMINI_API_KEY|VITE_GEMINI_API_KEY)\s*=\s*['\"]?([^'\"\r\n]+)['\"]?", content, re.MULTILINE)
                if match:
                    return match.group(1).strip()
            except Exception:
                pass
    return None

def process_images_to_pdf(image_inputs, output_pdf, api_key, model="gemini-2.5-flash", keep_html=False, auto_open=False):
    """Convert screenshots of an IELTS reading test to a standardized Cambridge A4 PDF."""
    client = genai.Client(api_key=api_key)

    # Resolve image files
    files = []
    for item in image_inputs:
        p = Path(item)
        if p.is_dir():
            for ext in ("*.png", "*.jpg", "*.jpeg", "*.webp"):
                files.extend(p.glob(ext))
        elif p.is_file():
            files.append(p)
    
    # Sort files naturally
    files = sorted(list(set(files)), key=lambda x: str(x).lower())

    if not files:
        print(f"[Error] Khong tim thay anh hop le tu input: {image_inputs}")
        sys.exit(1)

    print(f"[*] Tim thay {len(files)} anh de thi. Dang chuan bi gui Gemini...")
    for idx, f in enumerate(files, 1):
        print(f"    {idx}. {f.name}")

    contents = []
    for f in files:
        with open(f, "rb") as fp:
            data = fp.read()
        suffix = f.suffix.lower()
        mime = "image/png" if suffix == ".png" else "image/webp" if suffix == ".webp" else "image/jpeg"
        contents.append(types.Part.from_bytes(data=data, mime_type=mime))

    contents.append(PROMPT)

    print(f"[*] Dang xu ly qua Gemini ({model}). AI dang khu trung lap va dinh dang Cambridge A4...")
    try:
        response = client.models.generate_content(
            model=model,
            contents=contents
        )
    except Exception as e:
        print(f"[Error] Loi khi goi Gemini API: {e}")
        sys.exit(1)

    html_body = response.text.strip()
    if html_body.startswith("```"):
        html_body = html_body.split("\n", 1)[1]
        if html_body.endswith("```"):
            html_body = html_body.rsplit("```", 1)[0]

    full_html = HTML_TEMPLATE.format(content=html_body)

    out_pdf_path = Path(output_pdf).resolve()
    out_pdf_path.parent.mkdir(parents=True, exist_ok=True)
    
    tmp_html = out_pdf_path.with_suffix(".html")
    tmp_html.write_text(full_html, encoding="utf-8")
    print(f"[OK] Da tao ban in HTML: {tmp_html.name}")

    # Render PDF using headless Chrome/Edge
    browser_bin = get_msedge_or_chrome_path()
    if not browser_bin:
        print("[Warning] Khong tim thay Edge hoac Chrome de tu dong xuat PDF.")
        print(f"          Ban co the mo file '{tmp_html}' tren trinh duyet va chon 'In -> Luu thanh PDF'.")
        return

    print(f"[*] Dang xuat PDF qua {Path(browser_bin).name} (Headless Print)...")
    cmd = [
        browser_bin,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={str(out_pdf_path)}",
        tmp_html.as_uri()
    ]
    try:
        subprocess.run(cmd, check=True)
        print(f"[SUCCESS] Xuat PDF thanh cong: {out_pdf_path}")
        if not keep_html:
            tmp_html.unlink(missing_ok=True)
        else:
            print(f"[Info] Giu lai file HTML tai: {tmp_html}")
    except Exception as err:
        print(f"[Error] Khong the xuat PDF bang browser: {err}")
        print(f"        File HTML van duoc luu tai: {tmp_html}")

    if auto_open and out_pdf_path.exists():
        try:
            if os.name == "nt":
                os.startfile(str(out_pdf_path))
            elif sys.platform == "darwin":
                subprocess.run(["open", str(out_pdf_path)])
            else:
                subprocess.run(["xdg-open", str(out_pdf_path)])
        except Exception:
            pass

def main():
    parser = argparse.ArgumentParser(
        description="IELTS Screenshot-to-PDF Converter: Chuyen doi anh chup de thi web thanh PDF chuan Cambridge."
    )
    parser.add_argument(
        "inputs",
        nargs="+",
        help="Thu muc chua anh hoac danh sach cac file anh (.png, .jpg, .webp)"
    )
    parser.add_argument(
        "-o", "--output",
        default="ielts_reading_exam.pdf",
        help="Duong dan file PDF xuat ra (mac dinh: ielts_reading_exam.pdf)"
    )
    parser.add_argument(
        "-k", "--key",
        help="Google Gemini API Key (neu khong truyen se tu dong doc tu env GEMINI_API_KEY hoac file .env)"
    )
    parser.add_argument(
        "-m", "--model",
        default="gemini-2.5-flash",
        help="Model Gemini su dung (mac dinh: gemini-2.5-flash)"
    )
    parser.add_argument(
        "--keep-html",
        action="store_true",
        help="Giu lai file HTML trung gian sau khi xuat PDF"
    )
    parser.add_argument(
        "--open",
        action="store_true",
        help="Tu dong mo file PDF sau khi xuat xong"
    )

    args = parser.parse_args()

    api_key = find_gemini_api_key(args.key)
    if not api_key:
        if sys.stdin.isatty():
            try:
                api_key = input("Nhap Google Gemini API Key: ").strip()
            except EOFError:
                pass
        if not api_key:
            print("[Error] Thieu Google Gemini API Key. Hay truyen --key <API_KEY> hoac set bien moi truong GEMINI_API_KEY.")
            sys.exit(1)

    process_images_to_pdf(
        image_inputs=args.inputs,
        output_pdf=args.output,
        api_key=api_key,
        model=args.model,
        keep_html=args.keep_html,
        auto_open=args.open
    )

if __name__ == "__main__":
    main()
