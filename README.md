# Tenglish AI Caption Studio

Telugu captions. Your language. Your style.

Tenglish AI Caption Studio is a web application tailored for Telugu content creators producing vertical videos for Instagram Reels, YouTube Shorts, and TikTok. It transcribes spoken Telugu-English mixed speech into natural Roman Telugu (Tenglish) while preserving English technical terms, job titles, and colloquial nuances with zero paid AI APIs.

---

## Key Features

1. **Local Speech Recognition (0 Paid APIs)**:
   - Uses local CPU INT8 quantized Whisper speech recognition (`Xenova/whisper-tiny` / `faster-whisper`).
   - Requires no OpenAI, Anthropic, or Gemini API keys.
   - 100% private: videos and audio never leave the local machine.

2. **Tenglish Transliteration & Code-Switching Engine**:
   - Converts Telugu script and phonemes into natural Roman letters.
   - Preserves spoken English vocabulary: words like *job*, *freshers*, *apply*, *opportunity*, *video*, *skills*, *salary*, *package*, *interview*, and *software* remain in clean English spelling instead of awkward phonetic distortion.
   - Normalizes colloquial Roman spellings (e.g., `cheskondi`, `kuda`, `chudandi`, `manchi`).
   - Supports Creator Custom Vocabulary and preferred spellings.

3. **5 Built-In Reel & Shorts Caption Templates**:
   - **Viral Pop**: High-impact bold sans, white text with black outline, and punchy yellow keyword pop for comedy and trending reels.
   - **Tech Creator**: Dark translucent badge, clean bold typography, and vivid cyan technical term emphasis for coding and career updates.
   - **Word-by-Word Karaoke**: High-energy active word tracking with contrast against dimmed surrounding words.
   - **Clean Minimal**: Distraction-free lower-third typography for interviews, podcasts, and educational shorts.
   - **Cinematic Creator**: Elegant warm amber accents and soft shadow for travel, storytelling, and emotional voiceovers.

4. **Synchronized Caption Editor**:
   - Real-time synchronized 9:16 vertical video preview.
   - Inline caption editing with instantaneous preview update.
   - Split segment, merge adjacent captions, delete, add segment, and adjust start/end timestamps.
   - Full Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) history stack.

5. **FFmpeg Export Pipeline**:
   - Renders Advanced SubStation Alpha (`.ass`) subtitles directly into MP4 using local FFmpeg.
   - Preserves original audio and video quality.
   - One-click `.srt` subtitle file download.

---

## Local Setup & Installation (Windows / macOS / Linux)

### 1. Prerequisites
- **Node.js**: v18 or later (tested on v20 and v22)
- **FFmpeg**: Must be installed and accessible in your system `PATH`.

#### Installing FFmpeg on Windows:
1. Open PowerShell as Administrator and run:
   ```powershell
   winget install Gyan.FFmpeg
   ```
   Or download from [gyan.dev/ffmpeg/builds](https://www.gyan.dev/ffmpeg/builds/), extract to `C:\ffmpeg`, and add `C:\ffmpeg\bin` to your Environment Variables `Path`.
2. Verify in Command Prompt:
   ```cmd
   ffmpeg -version
   ```

#### Installing FFmpeg on macOS:
```bash
brew install ffmpeg
```

#### Installing FFmpeg on Ubuntu/Debian:
```bash
sudo apt update && sudo apt install -y ffmpeg
```

---

### 2. Install Project Dependencies

From the repository root directory:
```bash
npm install
```

---

### 3. Start the Application

Start the combined Express full-stack server and Vite development frontend:
```bash
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

---

### 4. Running Automated Tests

To run the unit test suite verifying transliteration, code-switching, segmentation, and ASS subtitle generation:
```bash
npx tsx server/tests/test_suite.ts
```

All 12 test assertions validate:
- Spoken English terms preservation (*bro*, *opportunity*, *freshers*, *apply*)
- Colloquial Tenglish spelling normalization (*fast ga*, *cheskondi*, *kuda*)
- Custom creator vocabulary consistency
- Monotonic, non-overlapping subtitle segmentation
- Standard SRT and ASS subtitle formatting
- Color mathematics (`#RRGGBB` to `&H00BBGGRR&`)
- Template preset schema integrity

---

## Model Limitations & Transparent Disclosure

- **Speech Recognition Accuracy**: While local Whisper handles clear speech and common Telugu-English words effectively, heavy background music, noisy audio, or regional accents may require quick manual touch-ups in the editor. Captions are never claimed to be 100% accurate without review.
- **Transliteration Nuance**: Roman Telugu has several acceptable spelling variants (e.g. *kuda* vs *kooda*, *cheskondi* vs *chesukondi*). Use the **Custom Vocabulary** tool in the editor to lock in your preferred channel spelling.
