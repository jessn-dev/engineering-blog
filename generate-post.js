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
    focus: "Provide a detailed, step-by-step tutorial or deep-dive explanation of a complex technical concept, programming language, tool, or product. Focus on clarity, practical application, and providing actionable insights for developers."
  },
  "content-writer": {
    role: "content writer creating engaging marketing or educational material.",
    focus: "Create an engaging, accessible, and highly readable piece about broader tech trends or educational concepts. Focus on storytelling, real-world impact, and holding the reader's attention while explaining why a certain technology matters."
  },
  "journalist": {
    role: "investigative journalist researching and reporting on current events for the public.",
    focus: "Report on a recent, highly relevant news event or breakthrough in the technology or AI sector. Be objective, factual, and informative, explaining the context and why this news matters to the general public."
  },
  "book-reviewer": {
    role: "technical book reviewer who evaluates educational materials for developers and tech enthusiasts.",
    focus: "Provide an in-depth review and summary of a highly influential or newly released technical book. Discuss the book's core concepts, its relevance to the current tech landscape, who should read it, and its practical takeaways."
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

async function fetchImage(keyword) {
  try {
    console.log(`Searching for image: "${keyword}"`);
    // 1. Try Wikimedia Commons
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap%20${encodeURIComponent(keyword)}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url|extmetadata&format=json`;
    const wikiRes = await fetch(wikiUrl);
    const wikiData = await wikiRes.json();
    if (wikiData.query && wikiData.query.pages) {
      const pages = Object.values(wikiData.query.pages);
      if (pages.length > 0 && pages[0].imageinfo && pages[0].imageinfo.length > 0) {
        const info = pages[0].imageinfo[0];
        const url = info.url;
        
        // Final guard against unsupported filetypes (like .pdf or .svg)
        if (!url.match(/\.(jpe?g|png|gif|webp)$/i)) {
          console.log(`Wikimedia returned an unsupported filetype: ${url}. Skipping to fallbacks...`);
        } else {
          const artist = info.extmetadata?.Artist?.value || "Unknown Author";
          const artistClean = artist.replace(/<[^>]*>?/gm, ''); // Strip HTML
          const license = info.extmetadata?.LicenseShortName?.value || "Public Domain";
          console.log("Found valid image on Wikimedia Commons!");
          return {
            url: url,
            attribution: `${artistClean}, ${license} via Wikimedia Commons`
          };
        }
      }
    }
    
    // 2. Fallback to Unsplash (if key exists)
    if (process.env.UNSPLASH_API_KEY) {
       console.log("Wikimedia failed. Trying Unsplash...");
       const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1&client_id=${process.env.UNSPLASH_API_KEY}`);
       const unsplashData = await unsplashRes.json();
       if (unsplashData.results && unsplashData.results.length > 0) {
         const photo = unsplashData.results[0];
         return {
           url: photo.urls.regular,
           attribution: `Photo by ${photo.user.name} on Unsplash`
         };
       }
    }
    
    // 3. Fallback to Pexels (if key exists)
    if (process.env.PEXELS_API_KEY) {
       console.log("Unsplash failed. Trying Pexels...");
       const pexelsRes = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1`, {
         headers: { Authorization: process.env.PEXELS_API_KEY }
       });
       const pexelsData = await pexelsRes.json();
       if (pexelsData.photos && pexelsData.photos.length > 0) {
         const photo = pexelsData.photos[0];
         return {
           url: photo.src.large,
           attribution: `Photo by ${photo.photographer} on Pexels`
         };
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

async function generatePost() {
  try {
    console.log(`Generating new blog post as ${personaType}...`);
    
    let response;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: PROMPT,
          config: {
            temperature: 0.3,
            tools: [{ googleSearch: {} }],
          }
        });
        break; // Success!
      } catch (error) {
        if (error.status === 429) {
          retries++;
          const waitTime = 65000; // wait 65 seconds
          console.log(`Rate limited (429). Retrying in ${waitTime/1000} seconds... (Attempt ${retries}/${maxRetries})`);
          await new Promise(res => setTimeout(res, waitTime));
        } else {
          throw error;
        }
      }
    }
    
    if (!response) {
      throw new Error("Failed to generate content after maximum retries due to API rate limiting.");
    }

    let content = response.text;
    
    // Clean up any rogue markdown code block wrappers the AI might have added
    content = content.replace(/^```(markdown|yaml|md)?\n/, "");
    content = content.replace(/\n```$/, "");
    if (!content.startsWith("---")) {
        // If it still doesn't start with ---, try to fix it
        content = "---\n" + content;
    }
    
    // Extract searchKeyword
    const keywordMatch = content.match(/^searchKeyword:\s*["']?(.*?)["']?$/m);
    const searchKeyword = keywordMatch ? keywordMatch[1] : "Technology";
    
    // Fetch hero image
    const imageData = await fetchImage(searchKeyword);
    
    // Remove searchKeyword from output so Astro doesn't complain about unknown frontmatter properties
    content = content.replace(/^searchKeyword:.*?\n/m, "");
    
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

    // Inject pubDate, author, heroImage, and heroImageAttribution
    const dateStr = new Date().toISOString();
    
    const injectedFrontmatter = `---
pubDate: "${dateStr}"
heroImage: "${imageData.url}"
heroImageAttribution: "${imageData.attribution}"
`;
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
    const filename = `${dateString}-${shorthandSlug}.md`;
    const filepath = path.join(postsDir, filename);

    // Save the file
    fs.writeFileSync(filepath, content);
    console.log(`Successfully generated and saved new post: ${filename}`);
  } catch (error) {
    console.error("Failed to generate post:", error);
    process.exit(1);
  }
}

generatePost();
