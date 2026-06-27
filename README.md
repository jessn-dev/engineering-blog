# Auto-Blogger AI 🤖

An fully autonomous, highly premium blog platform powered by **Astro**, **Google Gemini 2.5 Flash**, and **GitHub Actions**.

This project automatically researches, writes, and publishes reliable, highly factual blog posts three times a week using a multi-persona AI generation engine.

## ✨ Features

- **Blazing Fast**: Built on the [Astro](https://astro.build) web framework for zero-JS-by-default static site generation.
- **Autonomous Generation**: The `generate-post.js` script uses the Gemini SDK and Google Search grounding to produce factual, high-quality Markdown posts.
- **Novelty Safeguard**: The engine automatically scans existing posts in `src/content/blog/` to ensure no topics are ever repeated.
- **Dynamic Featured Images**: The engine intelligently searches Wikimedia Commons for open-source images, with fallbacks to Unsplash and Pexels (if API keys are provided) and Placehold.co for guaranteed image generation.
- **Tri-Weekly Scheduling**: GitHub Actions run on a cron schedule to publish new content automatically:
  - **Tuesday**: Technical Writer (Deep dives into frameworks and technical concepts).
  - **Thursday**: Content Writer (Engaging educational material and tech trends).
  - **Sunday**: Journalist (Reporting on recent tech/AI news breakthroughs).

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v22.12.0+ required)
- A [Google Gemini API Key](https://aistudio.google.com/)

### 2. Local Setup

Clone the repository and install dependencies:
\`\`\`bash
npm install
\`\`\`

Create a \`.env\` file in the root of your project:
\`\`\`env
GEMINI_API_KEY="your-api-key-here"
\`\`\`

Start the Astro development server:
\`\`\`bash
npm run dev
\`\`\`
The site will be available at \`http://localhost:4321\`.

### 3. Generating a Post Manually

You can manually trigger the AI to write and save a new post at any time. Just run:
\`\`\`bash
node generate-post.js [persona]
\`\`\`
*(Available personas: \`technical-writer\`, \`content-writer\`, \`journalist\`)*

The AI will generate the post in \`src/content/blog/\` using Astro's strict Zod frontmatter schema. If the dev server is running, Astro will automatically rebuild the site in milliseconds and live-reload your browser!

### 4. Deployment

This blog is configured to deploy automatically to **GitHub Pages**. 
Just ensure you have added your \`GEMINI_API_KEY\` to your repository's **GitHub Action Secrets**.

The GitHub Actions workflows will handle:
- Nightly content generation (\`autopost.yml\`).
- Astro site building and Pages deployment (\`deploy.yml\`).
