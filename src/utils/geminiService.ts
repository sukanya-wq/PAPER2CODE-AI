/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisResult } from '../types';

/**
 * Truncate scientific paper text if it's too large to fit easily within the model's
 * free tier rate limits, protecting against excessive token usage while ensuring
 * the abstract, introduction, methodology, and conclusion are retained.
 */
function truncateTextForGemini(text: string, maxCharacters = 45000): string {
  if (text.length <= maxCharacters) return text;
  
  // Keep first 25,000 chars and last 20,000 chars
  const halfPart = Math.floor(maxCharacters / 2);
  const head = text.substring(0, halfPart);
  const tail = text.substring(text.length - halfPart);
  
  return `${head}\n\n[... TRUNCATED SECTIONS TO RESIZE WITHIN GEMINI TOKEN LIMITS ...]\n\n${tail}`;
}

/**
 * Test user-supplied Gemini API key with a small quick hello prompt.
 */
export async function testGeminiApiKey(apiKey: string, modelName = 'gemini-2.5-flash'): Promise<boolean> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, please confirm you can hear me. Reply with a short JSON containing {"ok": true}.' }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        }
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const msg = errorJson?.error?.message || `HTTP error ${res.status}`;
      throw new Error(msg);
    }
    
    const data = await res.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (textOutput) {
      const parsed = JSON.parse(textOutput.trim());
      return parsed.ok === true;
    }
    return false;
  } catch (err: any) {
    if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('key is invalid')) {
      throw new Error('The Gemini API key you entered is invalid. Please double-check and retry.');
    }
    if (err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('quota')) {
      throw new Error('Quota exceeded on this Gemini API key. Please try again with a different key.');
    }
    throw new Error(err.message || 'Connection test failed. Please verify your internet and key details.');
  }
}

/**
 * Analyze research paper using Gemini 2.5 Flash / 3.5 Flash JSON schema.
 */
export async function analyzeResearchPaper(
  pdfText: string,
  apiKey: string,
  modelName = 'gemini-2.5-flash',
  targetLanguage = 'python-pytorch',
  archStyle = 'modular',
  customDirectives = '',
  signal?: AbortSignal
): Promise<AnalysisResult> {
  const cleanedText = truncateTextForGemini(pdfText);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // Map settings to clean instruction injection
  let langDesc = 'Python using PyTorch';
  let mainFile = 'main.py';
  let configFile = 'requirements.txt';
  
  if (targetLanguage === 'python-tensorflow') {
    langDesc = 'Python using TensorFlow / Keras';
    mainFile = 'main.py';
    configFile = 'requirements.txt';
  } else if (targetLanguage === 'python-jax') {
    langDesc = 'Python using JAX & Flax';
    mainFile = 'main.py';
    configFile = 'requirements.txt';
  } else if (targetLanguage === 'rust') {
    langDesc = 'Rust (using cargo ecosystem, ndarray / burn frameworks)';
    mainFile = 'src/main.rs';
    configFile = 'Cargo.toml';
  } else if (targetLanguage === 'cpp') {
    langDesc = 'C++ (using Eigen, LibTorch or STL)';
    mainFile = 'main.cpp';
    configFile = 'CMakeLists.txt';
  } else if (targetLanguage === 'typescript') {
    langDesc = 'TypeScript / Node.js (with tfjs, mathjs or core arrays)';
    mainFile = 'src/index.ts';
    configFile = 'package.json';
  }

  let styleDesc = 'Classic modular structure (separate classes, pipelines, utilities, and test examples)';
  if (archStyle === 'notebook') {
    styleDesc = 'Interactive linear flow suitable for notebook prototyping or straightforward scripting';
  } else if (archStyle === 'monolithic') {
    styleDesc = 'Self-contained, production-hardened monolithic package holding all tools in a single executable module';
  }

  const prompt = `
You are an expert Senior Full-Stack AI Engineer, Research Scientist, and Code Architect.
Your task is to analyze the research paper provided below and generate a complete, high-quality, production-ready implementation package to turn the research paper algorithms/methodologies into runnable code.

CRITICAL FOCUS DIRECTIVES:
- You MUST analyze ONLY the specific text provided between the triple-quotes under "Here is the research paper content".
- Do NOT analyze, write about, or mention "Paper2Code" (which is the name of this host utility/applets).
- Your analysis, title extraction, summary, code, architecture, and roadmap MUST focus 100% on the actual name, domain, title, algorithms, mathematical equations/concepts, and scientific objectives of the actual uploaded research paper.
- Under no circumstances should the generated summary, titles, code, or documentation mention or refer to "Paper2Code" as the analyzed paper. Focus exclusively on the true name and concepts of the research described in the uploaded text.

CUSTOM IMPLEMENTATION PREFERENCES:
- **Target Tech Stack / Language**: Use ${langDesc}.
- **Primary Source Code Filename**: Create code under "${mainFile}". Save this filename exactly in "codeFileName".
- **Primary Configuration Filename**: Create dependency configuration under "${configFile}". Save this name exactly in "configFileName".
- **Architectural Style**: ${styleDesc}.
${customDirectives ? `- **Custom Developer Guidelines**: Apply these user directives strictly: "${customDirectives}".` : ''}

Here is the research paper content:
"""
${cleanedText}
"""

You MUST return a JSON object containing EXACTLY these keys. Do not include any pre-text or post-text outside the JSON boundaries.
JSON Keys Required:
1. "summary" (string: A comprehensive summary of the paper's core scientific objective, key findings, and context in Markdown format. The first line of this summary MUST be the actual title of the research paper in bold).
2. "contributions" (string: Key contributions of this research, in a crisp bulleted list, explaining exactly what problem it solves and why it is a breakthrough).
3. "methodology" (string: A detailed step-by-step breakdown of the scientific/math methodology, formulas modeled or algorithms proposed).
4. "architecture" (string: A clear text-based architectural schematic, data-flow explanation, or structured component diagram representation showing how information flows between modules).
5. "roadmap" (string: A structured, phased timeline/milestones implementation roadmap mapping out development stages from local setup through model testing up to deployment).
6. "pythonSkeleton" (string: A fully realized code source module written ONLY in the requested language: ${langDesc}. Clean, production-grade, with realistic logic, functional classes, method docstrings, logging, standard parameter parsing, and complete working helper code that mimics the paper's core ideas. Avoid placeholders like "pass" or "# write code here" — write realistic boilerplate that can be run out-of-the-box).
7. "folderStructure" (string: A complete, visualized directory tree layout of the proposed project showing where config files, pipelines, trainers, tests, and notebook prototypes live).
8. "requirements" (string: A fully configured dependency configuration file based on ${configFile} specifying modern package libraries and versions needed to run this specific implementation).
9. "readme" (string: A thorough, detailed, polished README.md in Markdown format guiding researchers on how to use, configure, play with, and benchmark the code skeleton).
10. "setupInstructions" (string: Crisp, copy-paste-ready terminal commands and shell execution instructions for virtualenv or package managers, packages installation, and sample run execution commands).
11. "codeFileName" (string: The exact name/path of the primary source file setup, e.g. "${mainFile}").
12. "configFileName" (string: The exact name/path of the primary config file setup, e.g. "${configFile}").

CRITICAL ESCAPING INSTRUCTIONS FOR JSON SERIALIZATION:
- Inside code fields, avoid raw unescaped double quotes inside strings by using single quotes for internal strings (e.g. use 'Adam' or 'Binary Cross-Entropy' instead of "Adam").
- If code requires regex or backslashes (like \\d, \\s, \\n), they MUST be correctly serialized as doubly escaped inside the JSON response (e.g., \\\\d or \\\\s) so that client-side JSON parsing does not mistake them for invalid escape characters.
- Ensure all curly braces inside generated code f-strings or interpolation are perfectly balanced.
- Cleanly output valid JSON without any markdown code wraps inside the response body itself.
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              summary: { type: 'STRING' },
              contributions: { type: 'STRING' },
              methodology: { type: 'STRING' },
              architecture: { type: 'STRING' },
              roadmap: { type: 'STRING' },
              pythonSkeleton: { type: 'STRING' },
              folderStructure: { type: 'STRING' },
              requirements: { type: 'STRING' },
              readme: { type: 'STRING' },
              setupInstructions: { type: 'STRING' },
              codeFileName: { type: 'STRING' },
              configFileName: { type: 'STRING' }
            },
            required: [
              'summary', 'contributions', 'methodology', 'architecture', 'roadmap',
              'pythonSkeleton', 'folderStructure', 'requirements', 'readme', 'setupInstructions',
              'codeFileName', 'configFileName'
            ]
          },
          temperature: 0.1, // low temperature for precise code structures
        }
      }),
      signal
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const msg = errorJson?.error?.message || `HTTP error ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error('Gemini API returned an empty response. Please try with a different section or paper.');
    }

    // Helper to sanitize potentially wrapped JSON block, unescaped control characters, invalid escapes, or truncated endings
    const sanitizeAndRepairJson = (raw: string): string => {
      let cleaned = raw.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n/, '');
        if (cleaned.endsWith('```')) {
          cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();
      }

      let insideString = false;
      let result = '';
      const stack: ('{' | '[')[] = [];
      
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        
        // Manage brackets stack when not inside a string
        if (!insideString) {
          if (char === '{') {
            stack.push('{');
          } else if (char === '[') {
            stack.push('[');
          } else if (char === '}') {
            if (stack.length > 0 && stack[stack.length - 1] === '{') {
              stack.pop();
            }
          } else if (char === ']') {
            if (stack.length > 0 && stack[stack.length - 1] === '[') {
              stack.pop();
            }
          }
        }

        if (insideString) {
          if (char === '\\') {
            // Look at the character immediately after the backslash to check if it's a valid JSON escape sequence.
            const nextChar = cleaned[i + 1];
            if (!nextChar) {
              // Backslash at the very end of string, escape it and terminate string
              result += '\\\\';
              continue;
            }
            
            const validEscapes = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't']);
            let isValidEscape = false;
            
            if (validEscapes.has(nextChar)) {
              isValidEscape = true;
            } else if (nextChar === 'u') {
              // Check if followed by four hex digits
              if (i + 5 < cleaned.length) {
                const hexPart = cleaned.slice(i + 2, i + 6);
                if (/^[0-9a-fA-F]{4}$/.test(hexPart)) {
                  isValidEscape = true;
                }
              }
            }
            
            if (isValidEscape) {
              result += '\\' + nextChar;
              i++; // Skip the next character
            } else {
              // Double escape: become safe JSON string
              result += '\\\\';
            }
          } else if (char === '"') {
            result += '"';
            insideString = false;
          } else if (char === '\n') {
            result += '\\n';
          } else if (char === '\r') {
            result += '\\r';
          } else if (char === '\t') {
            result += '\\t';
          } else {
            result += char;
          }
        } else {
          if (char === '"') {
            insideString = true;
          }
          result += char;
        }
      }

      // If we ended abruptly inside a string, close the string quote first!
      if (insideString) {
        if (result.endsWith('\\') && !result.endsWith('\\\\')) {
          result = result.slice(0, -1);
        }
        result += '"';
      }

      // Auto-close any unclosed curly braces or brackets
      while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') {
          result += '}';
        } else if (last === '[') {
          result += ']';
        }
      }

      return result;
    };

    try {
      const sanitizedText = sanitizeAndRepairJson(rawText);
      const parsed: AnalysisResult = JSON.parse(sanitizedText);
      
      // Ensure all fields are populated
      const requiredKeys: (keyof AnalysisResult)[] = [
        'summary', 'contributions', 'methodology', 'architecture', 'roadmap',
        'pythonSkeleton', 'folderStructure', 'requirements', 'readme', 'setupInstructions'
      ];
      
      for (const key of requiredKeys) {
        if (!parsed[key]) {
          parsed[key] = `Information for ${key} could not be fully detailed from this paper's format directly. Please consult the visual summary.`;
        }
      }

      // Default names if not returned
      if (!parsed.codeFileName) parsed.codeFileName = mainFile;
      if (!parsed.configFileName) parsed.configFileName = configFile;
      
      return parsed;
    } catch (parseErr: any) {
      console.error('Failed to parse JSON response from Gemini', rawText, parseErr);
      throw new Error(`Failed to parse a valid structured report from the AI: ${parseErr?.message || 'JSON structure error'}. Please retry.`);
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Analysis was cancelled by the user.');
    }
    if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('key is invalid')) {
      throw new Error('The Gemini API key is invalid. Please update it in the Settings page and try again.');
    }
    if (err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('quota')) {
      throw new Error('Quota exceeded for this Gemini API key. Please check your billing or use a different API key.');
    }
    throw new Error(err.message || 'An error occurred during paper analysis. Please check your connection and try again.');
  }
}
