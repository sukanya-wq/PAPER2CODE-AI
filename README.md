# Paper2Code AI 🚀

Paper2Code AI is an interactive, professional-grade platform designed to translate scientific and AI research publications directly into runnable code skeletons, modular repository structure diagrams, dependency manifests, and detailed roadmap plans.

Engineered with React + TypeScript + Tailwind CSS and powered entirely on the client side using the latest Google Gemini LLM, Paper2Code AI simplifies research-to-code translation while maintaining 100% data privacy—no PDF text ever leaves the user's browser, and API keys are stored securely in local browser storage.

---

## Key Features 📈
* **In-Browser PDF Text Extraction**: Extremely fast, multi-threaded client-side parser reading text layers page-by-page.
* **Structured Generative Translation**: Leverages structured JSON schemas with `gemini-2.5-flash` or `gemini-3.5-flash` to extract scientific methodologies.
* **Complete Workspace Packages**:
  * **Executive Report**: Concise summary of scientific goals and breakthroughs.
  * **Methodology Grid**: Breakdown of equations and theoretical frameworks.
  * **Interactive Explorer Skeletons**: Full functional class structures, arguments, CLI, logging declarations, and docstrings.
  * **Project Tree layouts**: Visual directories mapping where pipelines, trains, and configs live.
  * **requirements.txt & instructions**: Copy and download-ready setup commands.
* **Request Cancelling**: Integrates native `AbortController` signals to immediately stop network calls.
* **Local Catalog Ledger**: Chronologically indexes analyzed publications, ratings, and stats in local storage.

---

## Complete Project Structure 📂
```
paper2code-ai/
├── /src
│   ├── /components
│   │   ├── ApiKeySettings.tsx      # Handles API Key storage, connection validation and models.
│   │   ├── ErrorBoundary.tsx       # Catches component crashes and provides reinitialization tools.
│   │   ├── Layout.tsx              # Sidebar navigation and status bar components.
│   │   ├── PdfUploader.tsx         # Drag-and-drop file uploader with parsing progress bars.
│   │   ├── SavedAnalysesList.tsx   # Catalog dashboard lists, ratings, and stats indicators.
│   │   └── SummaryView.tsx         # Executive reports, contributions and roadmaps view.
│   │   └── CodeGeneratorView.tsx   # Interactive tabs for source modules, trees and dependencies.
│   ├── /utils
│   │   ├── geminiService.ts        # Model payloads, truncation logic, and validation hooks.
│   │   └── pdfParser.ts            # Client-side PDF decompression and text extractor.
│   ├── App.tsx                     # Main router controller managing states and cancels.
│   ├── main.tsx                    # React DOM entry mount point.
│   └── index.css                   # Global styling sheet with scrollbar and keyframe layouts.
├── /assets                        # Static vector assets and icons.
├── index.html                      # HTML root template.
├── tsconfig.json                   # TypeScript compiling parameters.
├── vite.config.ts                  # Vite build tool config.
├── package.json                    # Dependencies manifest.
├── .env.example                    # Environmental parameters template.
└── README.md                       # Complete documentation.
```

---

## Technical Dependencies 🛠️
```json
"dependencies": {
  "@google/genai": "^2.4.0",
  "lucide-react": "^0.546.0",
  "react": "^19.0.1",
  "react-dom": "^19.0.1",
  "react-markdown": "^9.0.3",
  "motion": "^12.23.24"
}
```

---

## Getting Started: Local Workspace Setup 💻

These steps guide you to launch and run Paper2Code AI on a local computer (Windows/macOS/Linux) quickly.

### 1. Prerequisites
Ensure you have Node.js (v18.0.0 or higher) and npm installed:
```bash
node -v
npm -v
```

### 2. Installations
Unpack the downloaded ZIP bundle, open your terminal inside the root directory and install dependencies:
```bash
npm install
```

### 3. Running Dev Server
Launch the hot-reloading local development server:
```bash
npm run dev
```
Once initialized, navigate your browser to the local address:
👉 **`http://localhost:3000`**

### 4. Compiling a Production Build
Compile and bundle the project into a compact, optimized `/dist` folder for hosting:
```bash
npm run build
```

---

## Setup Instructions for Derived Skeletons 🐍

Once you export a Python skeleton (`main.py`) and dependencies (`requirements.txt`), run these steps in your terminal to boot the local project:

```bash
# 1. Spin up a clean python virtualenv
python -m venv venv

# 2. Activate virtualenv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

# 3. Securely install matching requirements
pip install -r requirements.txt

# 4. Trigger the implementation skeleton module
python main.py --help
```

---

## Production Deployment Procedures 🌍

Paper2Code AI compiles to standard HTML/JS static assets, making it compatible with any modern hosting platform (Vercel, Netlify, Cloudflare Pages, GitHub Pages) for absolutely **free**.

### Deploying to GitHub Pages
1. Install GitHub Pages utility: `npm install -D gh-pages`
2. Add deploy scripts to your `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -e dist"
   }
   ```
3. Execute the deployment trigger:
   ```bash
   npm run deploy
   ```

---

## Security and Privacy Statement 🛡️
* **API Key Safety**: Your Google AI Studio API key is strictly saved inside your browser's private indexed database partition (`localStorage`) via encrypted fields. They are never sent or proxied through secondary backend servers.
* **No Telemetry Leakage**: Paper2Code AI performs all computations and PDF parsing fully inside your local client-side memory context. Your research code layouts and paper drafts remain entirely secure in your box.
