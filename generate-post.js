import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure API key is present
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}

const ai = new GoogleGenAI({});

// Determine persona from CLI arguments (default to journalist)
const personaType = process.argv[2] || "journalist";

const personas = {
  "technical-writer": {
    role: "technical writer whose goal is to explain how to use complex technology products or frameworks.",
    focus: "Provide a detailed, step-by-step tutorial or deep-dive explanation of a complex technical concept, programming language, tool, or product. Focus on clarity, practical application, and providing actionable insights for developers.",
    wordTarget: "1,500 to 2,500 words (a comprehensive how-to/guide)"
  },
  "content-writer": {
    role: "content writer creating engaging marketing or educational material.",
    focus: "Create an engaging, accessible, and highly readable piece about broader tech trends or educational concepts. Focus on storytelling, real-world impact, and holding the reader's attention while explaining why a certain technology matters.",
    wordTarget: "1,200 to 2,000 words (a standard blog post or listicle)"
  },
  "journalist": {
    role: "investigative journalist researching and reporting on current events for the public.",
    focus: "Report on a recent, highly relevant news event or breakthrough in the technology or AI sector. Be objective, factual, and informative, explaining the context and why this news matters to the general public.",
    wordTarget: "800 to 1,200 words (a focused news report)"
  },
  "book-reviewer": {
    role: "technical book reviewer who evaluates educational materials for developers and tech enthusiasts.",
    focus: "Provide an in-depth review and summary of a highly influential or newly released technical book. Discuss the book's core concepts, its relevance to the current tech landscape, who should read it, and its practical takeaways.",
    wordTarget: "1,000 to 1,500 words (a standard in-depth review)"
  }
};

const selectedPersona = personas[personaType] || personas["journalist"];

function getExistingTitles() {
  const postsDir = path.join(__dirname, "src", "content", "blog");
  if (!fs.existsSync(postsDir)) return [];
  
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".md"));
  const titles = [];
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const match = content.match(/^title:\s*(.*)$/m);
    if (match) {
      titles.push(match[1].replace(/["']/g, "").trim());
    }
  }
  return titles;
}

const existingTitles = getExistingTitles();
const avoidTopicsStr = existingTitles.length > 0 
  ? `\nCRITICAL REQUIREMENT FOR NOVELTY:\nDo NOT write about any of the following topics, themes, or news events as they have already been covered on the blog. You MUST find a fresh angle or a completely new topic:\n` + existingTitles.map(t => `- ${t}`).join('\n')
  : "";

const PROMPT = `
You are an expert ${selectedPersona.role}

Task: ${selectedPersona.focus}

Topic Area: Choose ONE highly specific subject from the following approved topics:
1. Gadgets and Consumer Electronics:
   - Reviews and Hands-On: In-depth evaluations of the newest smartphones, laptops, wearables, and smart home devices.
   - Product Launches: Breaking news and rumors regarding upcoming releases from major manufacturers.
2. Emerging Technologies:
   - AI and Machine Learning: Exploring artificial intelligence trends, real-world applications, and the societal impact of the technology.
   - Advanced Systems: Discussions surrounding the Internet of Things (IoT), Cloud Computing, Virtual Reality, and Automation.
3. Software and App Development:
   - Programming Languages: Tutorials, overviews, and deep-dives into modern programming languages and frameworks.
   - Engineering and Architecture: Scaling challenges, infrastructure, and real-time messaging systems (e.g., system design).
4. Cybersecurity and Privacy:
   - Threat Updates: News regarding the latest ransomware, exploited servers, and hacker activity.
   - Data Privacy: Explanations on how changing data privacy laws and compliance regulations affect businesses and everyday users.
5. Practical How-Tos and Tips:
   - Troubleshooting Guides: Actionable, step-by-step solutions to fix common software errors or hardware problems.
   - Optimization: Tips on how readers can get the most out of their daily apps, websites, and devices.
6. Industry News and Business:
   - FAANG Profiles: Deep dives into the engineering blogs of Facebook, Apple, Amazon, Netflix, and Google (system design, scalability, AI).
   - Startup Profiles: Highlighting new tech companies, venture capital funding rounds, and business acquisitions.
   - Tech Policy: Analysis of government legislation and digital policies shaping the modern tech landscape.
7. Technical Book Reviews: In-depth reviews of highly influential technical books and educational materials.

CRITICAL REQUIREMENTS FOR RELIABILITY:
- The content must be completely reliable, factual, and accurate.
- Do not hallucinate statistics, quotes, or events.
- Base your writing on verifiable facts and real-world developments.
- Your persona is ${personaType}. Write in the tone appropriate for this persona.
${avoidTopicsStr}

CRITICAL RULES FOR HUMANIZED WRITING (ANTI-AI SLOP):
- The writing MUST NOT read like "AI slop". It must be heavily humanized, reading naturally and flowing with varied rhythms.
- Eliminate robotic, overly formal, and predictable patterns typical of AI tools.
- NEVER use the words or phrases: "In conclusion", "Delve", "Dive into", "Furthermore", "Moreover", "Additionally", "Crucial", "It's important to note", "In this article".
- The goal is to make the content engaging and completely undetectable to AI checkers.
- Write conversationally as if you (the persona) are speaking directly to a peer.

QUALITY & CONTENT GUIDELINES (Must follow strictly):
- Writing quality: Ensure the text is highly readable, clearly structured, and easy to understand.
- Consistency: Write as if this is part of a regularly updated, high-quality publication.
- Longevity: Adopt a tone that is trustworthy, established, and authoritative.
- Technical depth: Provide in-depth knowledge, actionable insights, and robust technical details rather than just surface-level fluff.
- Broad usefulness: Ensure the content is directly relevant and highly useful to your specific target audience's interests and skill level.

LENGTH & SEO GUIDELINES (Must follow strictly):
- Target length: Aim for ${selectedPersona.wordTarget}. This range matches the search intent for this type of post.
- Completeness over padding: Fully and accurately answer the reader's intent. NEVER pad with filler to hit a word count — thin, padded content is penalized. If the topic is fully covered below the range, that is acceptable.
- Scannability: Long content only works if it is easy to skim. Use clear, descriptive H2/H3 subheadings, short paragraphs (2-4 sentences), and bullet points to break up the text.
- Demonstrate E-E-A-T: Show Experience, Expertise, Authoritativeness, and Trustworthiness through concrete examples, specific details, accurate technical reasoning, and credible references.

Formatting Requirements:
1. The post must be written in Markdown format.
2. It MUST include a YAML frontmatter block at the very top, enclosed in \`---\`. Example:
---
title: "Your Title Here"
description: "Your description here"
categories: ["AI", "Engineering", "Design Systems"]
searchKeyword: "A single, highly specific noun phrase to search Wikimedia Commons for an image (e.g., Artificial Intelligence, Circuit Board, Data Center)"
---
3. The content should be well-structured with H2/H3 headings, bullet points where appropriate, and a conclusion.
4. When appropriate within the body of the article (e.g., to break up long sections or illustrate a point), you MUST insert an image placeholder exactly formatted as "[IMAGE: Keyword]". For example: "[IMAGE: Quantum Computer]" or "[IMAGE: Server Rack]". Insert exactly 1 or 2 of these placeholders in the body.
5. If you include any references, explicitly state they are Public Domain or Creative Commons.
6. If relevant, include a small code snippet to illustrate a point.
7. DO NOT output any markdown code block wrappers (like \`\`\`markdown or \`\`\`yaml) around the file or frontmatter. Output raw text starting directly with \`---\`.
8. Determine 2-4 highly accurate categories for your content based on what it is actually about and put them in the categories array.
`;

const isFaang = personaType === "faang-analyst";

// HUB on the first FAANG run of the calendar month, SPOKE otherwise.
// Detected from existing posts so it survives across separate workflow runs.
function faangModeForThisRun() {
  const postsDir = path.join(__dirname, "src", "content", "blog");
  if (!fs.existsSync(postsDir)) return "HUB";
  const ym = new Date().toISOString().slice(0, 7); // YYYY-MM
  const files = fs.readdirSync(postsDir).filter(f => f.startsWith(ym) && f.endsWith(".md"));
  for (const file of files) {
    const content = fs.readFileSync(path.join(postsDir, file), "utf-8");
    if (/^articleType:\s*["']?hub["']?/im.test(content)) return "SPOKE";
  }
  return "HUB";
}

// FAANG/MANGOS market-analysis prompt. Mode = SPOKE (breaking news) or HUB (monthly deep-dive).
function buildFaangPrompt(mode, catalyst) {
  return `You are a sharp, analytical tech-and-markets columnist writing for an engineering/industry publication.

ARTICLE CONFIG
- Mode: ${mode}
- Current Catalyst: ${catalyst}

CORE 2026 NARRATIVE FRAMING (editorial stance, not fact to fabricate around)
- Frame the legacy FAANG acronym as fading, with the market's center of gravity shifting to MANGOS (Meta, Anthropic, Nvidia, Google, OpenAI, SpaceX): silicon dominance, foundational reasoning models, and orbital data backbones over consumer hardware and streaming.
- The backdrop is a massive AI Capital Expenditure (CapEx) boom: Wall Street fears short-term free-cash-flow compression while rewarding long-term hyperscaler growth.

RELIABILITY (STRICT)
- The MANGOS / CapEx framing above is an editorial thesis you may argue — but it is a STANCE, not a license to invent data.
- Every specific number, financial figure, growth rate, valuation, or quote MUST be grounded in a verifiable, real-world source. If you are not certain of an exact figure, qualify it ("reportedly", "around") or omit it. NEVER fabricate statistics, earnings, or events.
- Base reactive claims on the actual Catalyst and real developments.

EXECUTION BY MODE

IF MODE IS "SPOKE" (breaking news, 500-800 words):
1. Lead with the News: open immediately on the Catalyst — exactly what happened.
2. The Ripple Effect: connect the micro-event to the macro MANGOS narrative.
3. Winners & Losers: who gains leverage, who is left vulnerable. Short sentences, fast pacing, reactive analysis.

IF MODE IS "HUB" (monthly deep-dive, 1,500-2,500 words):
1. The Monthly Thesis: bird's-eye view of the last 30 days, framed as the shift from capturing human attention (FAANG) to building artificial intelligence (MANGOS).
2. The CapEx Scorecard: analyze data-center infrastructure spend ("defensive survival vs. offensive dominance").
3. The Status Table: a Markdown comparison table — market sentiment, AI utilization, valuation metrics: legacy players vs. new infrastructure giants.
4. Structural Breakdown: a simple ASCII diagram (in a code block) or conceptual blockquote showing the new stack consolidating power: Silicon -> Models -> Cloud.

VOICE & SCANNABILITY
- Sharp, analytical, slightly witty, highly authoritative. No corporate generalizations, empty hype, or robotic transitions.
- NEVER use: "In conclusion", "Delve", "Dive into", "Furthermore", "Moreover", "Additionally", "Crucial", "It's important to note", "In this article".
- Optimize for digital readers: bold key terms, bullet points, blockquotes for key insights, clear descriptive H2/H3 headers, short paragraphs (2-4 sentences).
- Demonstrate E-E-A-T through concrete examples, specific (grounded) details, and accurate reasoning.

REQUIRED OUTPUT FORMAT (pipeline-critical — follow exactly)
1. Output raw Markdown ONLY. Do NOT wrap the response in \`\`\`markdown or \`\`\` fences.
2. Begin DIRECTLY with a YAML frontmatter block enclosed in ---, exactly:
---
title: "Your headline"
description: "One-sentence meta description (~155 chars)"
categories: ["Industry News", "AI"]
searchKeyword: "A single specific noun phrase for an image search, e.g. Data Center, Nvidia GPU, Server Rack"
articleType: "${mode.toLowerCase()}"
---
3. After the frontmatter, write the article body in Markdown with H2/H3 headings.
4. Insert exactly 1 or 2 image placeholders in the body, formatted exactly as "[IMAGE: Keyword]" (e.g. "[IMAGE: Data Center]").
5. Do not write a "Sources" or "Works Cited" section — the pipeline appends citations automatically.
`;
}

// Parse JSON only when the response is actually OK + JSON. Returns null otherwise
// (e.g. an HTML rate-limit/error page) so one bad provider never throws out of the chain.
async function safeJson(res) {
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchImage(keyword) {
  try {
    console.log(`Searching for image: "${keyword}"`);

    // 1. Try Wikimedia Commons
    try {
      const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap%20${encodeURIComponent(keyword)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url|extmetadata&format=json`;
      const wikiData = await safeJson(await fetch(wikiUrl, {
        headers: { "User-Agent": "AutoBlogger/1.0 (blog image fetch; contact: jessengolab.dev@gmail.com)" }
      }));
      const pages = wikiData?.query?.pages ? Object.values(wikiData.query.pages) : [];
      const info = pages[0]?.imageinfo?.[0];
      if (info?.url) {
        if (!info.url.match(/\.(jpe?g|png|gif|webp)$/i)) {
          console.log(`Wikimedia returned an unsupported filetype: ${info.url}. Skipping to fallbacks...`);
        } else {
          const artistClean = (info.extmetadata?.Artist?.value || "Unknown Author").replace(/<[^>]*>?/gm, "");
          const license = info.extmetadata?.LicenseShortName?.value || "Public Domain";
          console.log("Found valid image on Wikimedia Commons!");
          return { url: info.url, attribution: `${artistClean}, ${license} via Wikimedia Commons` };
        }
      }
    } catch (e) {
      console.log(`Wikimedia lookup failed: ${e.message}. Trying fallbacks...`);
    }

    // 2. Fallback to Unsplash (if key exists)
    if (process.env.UNSPLASH_API_KEY) {
      try {
        console.log("Trying Unsplash...");
        const unsplashData = await safeJson(await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1&client_id=${process.env.UNSPLASH_API_KEY}`));
        const photo = unsplashData?.results?.[0];
        if (photo) {
          return { url: photo.urls.regular, attribution: `Photo by ${photo.user.name} on Unsplash` };
        }
      } catch (e) {
        console.log(`Unsplash lookup failed: ${e.message}.`);
      }
    }

    // 3. Fallback to Pexels (if key exists)
    if (process.env.PEXELS_API_KEY) {
      try {
        console.log("Trying Pexels...");
        const pexelsData = await safeJson(await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1`, {
          headers: { Authorization: process.env.PEXELS_API_KEY }
        }));
        const photo = pexelsData?.photos?.[0];
        if (photo) {
          return { url: photo.src.large, attribution: `Photo by ${photo.photographer} on Pexels` };
        }
      } catch (e) {
        console.log(`Pexels lookup failed: ${e.message}.`);
      }
    }

    console.log("No image found, using fallback placeholder.");
    return {
       url: `https://placehold.co/1024x512/1e1b4b/818cf8.png?text=${encodeURIComponent(keyword)}`,
       attribution: "Placeholder Image"
    };
  } catch(e) {
    console.error("Image search failed:", e);
    return {
       url: `https://placehold.co/1024x512/1e1b4b/818cf8.png?text=Image+Search+Failed`,
       attribution: "Placeholder Image"
    };
  }
}

// Extract grounding source URLs that Gemini's googleSearch tool actually used
function extractGeminiSources(response) {
  try {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return chunks
      .filter(c => c.web?.uri)
      .map(c => ({ title: c.web.title || c.web.uri, url: c.web.uri }));
  } catch {
    return [];
  }
}

// Bound every generation so a single call can't blow the token budget / TPM limits.
// 8192 fits the longest target (~2,500-word guide ≈ ~3,300 tokens) plus markdown/HTML
// overhead, and leaves headroom for the citation pass which re-emits the whole body.
const MAX_OUTPUT_TOKENS = 8192;
// Minimum spacing between LLM calls so bursts (e.g. backfills) never trip per-minute rate limits.
const MIN_CALL_GAP_MS = 4000;
let lastLlmCall = 0;

async function throttleLlm() {
  const wait = MIN_CALL_GAP_MS - (Date.now() - lastLlmCall);
  if (wait > 0) await new Promise(res => setTimeout(res, wait));
  lastLlmCall = Date.now();
}

// Truncated exponential backoff with jitter. 429 (rate/quota) uses a larger base + cap
// since free-tier limits reset per-minute; 5xx (server) recovers faster.
function backoffDelay(attempt, status) {
  const is429 = status === 429;
  const base = is429 ? 20000 : 2000;
  const cap = is429 ? 64000 : 16000;
  const exp = Math.min(cap, base * 2 ** (attempt - 1));
  const jitter = Math.floor(Math.random() * 1000); // avoid thundering-herd alignment
  return exp + jitter;
}

// Primary generator: Gemini, retrying transient errors and guarding empty output
async function generateWithGemini(prompt, { useGrounding = true } = {}) {
  let retries = 0;
  const maxRetries = 3;

  while (true) {
    try {
      await throttleLlm();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          tools: useGrounding ? [{ googleSearch: {} }] : [],
        }
      });

      const text = response.text;
      if (!text || !text.trim()) {
        throw new Error("Gemini returned empty or blocked content.");
      }

      return { text, sources: useGrounding ? extractGeminiSources(response) : [], generatedBy: "gemini" };
    } catch (error) {
      const status = error.status;
      const transient = status === 429 || status === 500 || status === 502 || status === 503;
      if (transient && retries < maxRetries) {
        retries++;
        const waitTime = backoffDelay(retries, status);
        console.log(`Gemini transient error (${status}). Retrying in ${(waitTime / 1000).toFixed(1)}s... (Attempt ${retries}/${maxRetries})`);
        await new Promise(res => setTimeout(res, waitTime));
      } else {
        throw error;
      }
    }
  }
}

// Fallback generator: Groq (OpenAI-compatible). No web grounding, so sources come from HN.
async function generateWithGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not set — no fallback available.");
  }

  let retries = 0;
  const maxRetries = 3;

  while (true) {
    await throttleLlm();
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text || !text.trim()) {
        throw new Error("Groq returned empty content.");
      }
      return { text, sources: [], generatedBy: "groq" };
    }

    // Retry transient errors (rate limit / server) with the same backoff policy
    if ((res.status === 429 || res.status >= 500) && retries < maxRetries) {
      retries++;
      const waitTime = backoffDelay(retries, res.status);
      console.log(`Groq transient error (${res.status}). Retrying in ${(waitTime / 1000).toFixed(1)}s... (Attempt ${retries}/${maxRetries})`);
      await new Promise(r => setTimeout(r, waitTime));
      continue;
    }

    throw new Error(`Groq API error: ${res.status} ${await res.text()}`);
  }
}

// Orchestrate primary -> fallback (Gemini -> Groq)
async function generateContent(prompt = PROMPT, opts = {}) {
  try {
    return await generateWithGemini(prompt, opts);
  } catch (error) {
    console.warn(`Gemini failed: ${error.message}. Falling back to Groq...`);
    return await generateWithGroq(prompt);
  }
}

// Fetch real, citable sources from the free Hacker News Algolia API (no key required)
async function fetchHNSources(query, limit = 4) {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const hits = (data.hits || [])
      .filter(h => (h.points || 0) >= 20)
      .sort((a, b) => (b.points || 0) - (a.points || 0));

    const seen = new Set();
    const sources = [];
    for (const h of hits) {
      const link = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
      let domain;
      try {
        domain = new URL(link).hostname.replace(/^www\./, "");
      } catch {
        continue;
      }
      if (seen.has(domain)) continue;
      seen.add(domain);
      sources.push({ title: h.title, url: link });
      if (sources.length >= limit) break;
    }
    return sources;
  } catch (e) {
    console.error("HN source fetch failed:", e);
    return [];
  }
}

// Merge multiple source lists, deduping by domain
function mergeSources(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const s of list) {
      let domain;
      try {
        domain = new URL(s.url).hostname.replace(/^www\./, "");
      } catch {
        continue;
      }
      if (seen.has(domain)) continue;
      seen.add(domain);
      out.push(s);
    }
  }
  return out;
}

// Cache liveness checks so the same URL isn't fetched twice across source/body validation
const linkAliveCache = new Map();

// Is a URL reachable? Conservative: only treat clear-dead signals as dead so we don't
// drop good links behind bot protection (403/429) or HEAD-hostile servers.
async function isLinkAlive(url) {
  if (linkAliveCache.has(url)) return linkAliveCache.get(url);

  const headers = { "User-Agent": "Mozilla/5.0 (compatible; AutoBlogger/1.0)" };
  const withTimeout = (method) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    return fetch(url, { method, redirect: "follow", signal: controller.signal, headers })
      .finally(() => clearTimeout(timer));
  };

  let ok;
  try {
    let res;
    try {
      res = await withTimeout("HEAD");
    } catch {
      res = null;
    }
    // Some servers reject HEAD; retry with GET
    if (!res || res.status === 405 || res.status === 501) {
      res = await withTimeout("GET");
    }
    const s = res.status;
    ok = !(s === 404 || s === 410 || s >= 500); // dead only on 404/410/5xx
  } catch {
    ok = false; // DNS failure, connection refused, timeout/abort
  }

  linkAliveCache.set(url, ok);
  return ok;
}

// Drop sources whose links are dead before they reach the article or the Works Cited list
async function filterLiveSources(sources) {
  const checked = await Promise.all(
    sources.map(async s => ({ s, ok: await isLinkAlive(s.url) }))
  );
  const dropped = checked.filter(c => !c.ok).map(c => c.s.url);
  if (dropped.length) console.log(`Dropped ${dropped.length} dead source link(s): ${dropped.join(", ")}`);
  return checked.filter(c => c.ok).map(c => c.s);
}

// Safety net: unwrap any remaining dead Markdown link in the body, leaving the text intact.
// Catches links the model may have introduced despite instructions.
async function removeDeadBodyLinks(body) {
  const linkRegex = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g;
  const urls = [...new Set([...body.matchAll(linkRegex)].map(m => m[1]))];
  if (!urls.length) return body;

  const status = new Map();
  await Promise.all(urls.map(async u => status.set(u, await isLinkAlive(u))));

  let removed = 0;
  const out = body.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, text, url) => {
    if (status.get(url) === false) {
      removed++;
      return text; // unwrap to plain text
    }
    return m;
  });
  if (removed) console.log(`Unwrapped ${removed} dead link(s) from article body.`);
  return out;
}

function domainName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// MLA-style access date, e.g. "28 June 2026"
function mlaAccessDate(d) {
  const month = d.toLocaleString("en-US", { month: "long" });
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}

// Build an MLA "Works Cited" section from approximate metadata (title, site, URL, access date)
function buildWorksCited(sources) {
  if (!sources.length) return "";
  const today = new Date();
  const entries = sources
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(s => `- "${s.title.replace(/"/g, "")}." *${domainName(s.url)}*, ${s.url}. Accessed ${mlaAccessDate(today)}.`)
    .join("\n");
  return `\n\n## Works Cited\n\n${entries}\n`;
}

// Second pass: ask the model to weave the source URLs into the body as inline Markdown links.
// Falls back to the unmodified body on any failure so a post never breaks over citations.
async function insertInlineCitations(body, sources) {
  try {
    const sourceList = sources.map(s => `- ${s.title} : ${s.url}`).join("\n");
    const prompt = `You are editing a finished blog post. Insert inline citations as Markdown links into the article text below.

STRICT RULES:
- Return the article text EXACTLY as given. Change nothing except inserting links.
- For each source, wrap the single most relevant existing phrase in a Markdown link: [phrase](url).
- Use ONLY the URLs provided. NEVER invent or alter a URL. Use each URL at most once.
- Do NOT add, remove, reword, or reorder any sentence. Do NOT touch headings, images, HTML, code blocks, or the YAML frontmatter.
- If a source has no clearly relevant phrase, skip it rather than forcing a link.
- Output ONLY the article text. No commentary, no code fences.

SOURCES:
${sourceList}

ARTICLE:
${body}`;

    const result = await generateContent(prompt, { useGrounding: false });
    let out = result.text;
    out = out.replace(/^```(markdown|md)?\n/, "").replace(/\n```$/, "");

    // Guard against truncation/garbled output: keep original if the result shrank too much
    if (!out || out.trim().length < body.trim().length * 0.6) {
      console.warn("Inline citation pass output looks malformed. Keeping original body.");
      return body;
    }
    return out;
  } catch (e) {
    console.warn(`Inline citation pass failed: ${e.message}. Keeping original body.`);
    return body;
  }
}

// Fail fast if the model didn't produce the required frontmatter
function validateFrontmatter(content) {
  const hasTitle = /^title:\s*.+$/m.test(content);
  const hasDescription = /^description:\s*.+$/m.test(content);
  if (!hasTitle || !hasDescription) {
    throw new Error("Generated content is missing required frontmatter (title/description).");
  }
}

async function generatePost() {
  try {
    console.log(`Generating new blog post as ${personaType}...`);

    // FAANG/MANGOS analysis uses a dedicated prompt; mode + catalyst are resolved at runtime.
    // Grounding (on by default) lets a SPOKE discover its own recent catalyst.
    let activePrompt = PROMPT;
    let faangMode = null;
    if (isFaang) {
      faangMode = faangModeForThisRun();
      const catalyst = faangMode === "SPOKE"
        ? "Identify the single most significant MANGOS/FAANG (Meta, Anthropic, Nvidia, Google, OpenAI, SpaceX, or a major legacy tech/AI player) news event from the last 7 days, and lead the article with it."
        : "N/A - Monthly Macro Synthesis";
      console.log(`FAANG mode: ${faangMode}`);
      activePrompt = buildFaangPrompt(faangMode, catalyst);
    }

    const result = await generateContent(activePrompt);
    let content = result.text;
    const aiSources = result.sources;
    const generatedBy = result.generatedBy;
    console.log(`Content generated via: ${generatedBy}`);
    
    // Clean up any rogue markdown code block wrappers the AI might have added
    content = content.replace(/^```(markdown|yaml|md)?\n/, "");
    content = content.replace(/\n```$/, "");
    if (!content.startsWith("---")) {
        // If it still doesn't start with ---, try to fix it
        content = "---\n" + content;
    }

    // Bail out before saving anything broken
    validateFrontmatter(content);

    // Extract searchKeyword
    const keywordMatch = content.match(/^searchKeyword:\s*["']?(.*?)["']?$/m);
    const searchKeyword = keywordMatch ? keywordMatch[1] : "Technology";
    
    // Fetch hero image
    const imageData = await fetchImage(searchKeyword);
    
    // Remove searchKeyword from output so Astro doesn't complain about unknown frontmatter properties
    content = content.replace(/^searchKeyword:.*?\n/m, "");

    // Drop any model-emitted articleType; we inject an authoritative one below for FAANG posts
    content = content.replace(/^articleType:.*?\n/m, "");
    
    // Find and process body image placeholders: [IMAGE: keyword]
    const imagePlaceholderRegex = /\[IMAGE:\s*(.+?)\]/g;
    const bodyMatches = [...content.matchAll(imagePlaceholderRegex)];
    
    for (const match of bodyMatches) {
      const fullPlaceholder = match[0];
      const keyword = match[1];
      const imgData = await fetchImage(keyword);
      const markdownImg = `\n\n<figure style="text-align: center; margin: 2.5rem 0;">
  <img src="${imgData.url}" alt="${keyword}" style="max-width: 100%; max-height: 500px; border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); display: block; margin: 0 auto;" onerror="this.onerror=null; this.src='https://placehold.co/1024x512/1e1b4b/818cf8.png?text=Image+Unavailable';" />
  <figcaption style="font-size: 0.85em; color: var(--text-muted); font-style: italic; margin-top: 1rem;">${imgData.attribution}</figcaption>
</figure>\n\n`;
      content = content.replace(fullPlaceholder, markdownImg);
    }

    // Gather citable sources: Gemini grounding (if any) + Hacker News, deduped by domain,
    // then drop any whose links are already dead.
    const hnSources = await fetchHNSources(searchKeyword);
    const merged = mergeSources(aiSources, hnSources);
    const sources = await filterLiveSources(merged);

    // Split frontmatter from body so the citation pass never touches the YAML.
    // Always run dead-link removal on the body, even with zero sources, to catch
    // any broken link the model wrote into the draft itself.
    const fm = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (fm) {
      const frontmatter = fm[1];
      let body = fm[2];
      if (sources.length) body = await insertInlineCitations(body, sources);
      body = await removeDeadBodyLinks(body);
      content = frontmatter + body + buildWorksCited(sources);
    } else {
      content = await removeDeadBodyLinks(content) + buildWorksCited(sources);
    }

    // Inject pubDate, heroImage, attribution, and which model produced this post
    const dateStr = new Date().toISOString();

    const articleTypeLine = faangMode ? `articleType: "${faangMode.toLowerCase()}"\n` : "";
    const injectedFrontmatter = `---
pubDate: "${dateStr}"
heroImage: "${imageData.url}"
heroImageAttribution: "${imageData.attribution}"
generatedBy: "${generatedBy}"
${articleTypeLine}`;
    content = content.replace(/^---\n/, injectedFrontmatter);

    // Ensure the posts directory exists
    const postsDir = path.join(__dirname, "src", "content", "blog");
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    // Create a shorthand filename using the date and the searchKeyword
    const date = new Date();
    const dateString = date.toISOString().split("T")[0];
    const shorthandSlug = searchKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let filename = `${dateString}-${shorthandSlug}.md`;
    let filepath = path.join(postsDir, filename);

    // Avoid silently overwriting an existing post with the same keyword/day
    let counter = 2;
    while (fs.existsSync(filepath)) {
      filename = `${dateString}-${shorthandSlug}-${counter}.md`;
      filepath = path.join(postsDir, filename);
      counter++;
    }

    // Save the file
    fs.writeFileSync(filepath, content);
    console.log(`Successfully generated and saved new post: ${filename}`);
  } catch (error) {
    console.error("Failed to generate post:", error);
    process.exit(1);
  }
}

generatePost();
