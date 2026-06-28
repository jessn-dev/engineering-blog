# 🚀 Auto-Blogger Engine

[![Astro](https://img.shields.io/badge/Astro-3.0-orange.svg)](https://astro.build/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2020.0.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> An enterprise-grade, fully automated static blogging engine built with **Astro**. It natively integrates with Gemini AI to auto-generate highly technical, humanized deep-dives, which are then compiled into a lightning-fast static site deployed on GitHub Pages.

---

## 📑 Table of Contents
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Available Scripts](#available-scripts)
- [Deployment (CI/CD)](#deployment-cicd)
- [License](#license)

---

## 🏗 Architecture
This project is built for maximum performance and automated workflows:
- **Astro Core**: Zero-JS-by-default static site generation for instant page loads.
- **Vanilla CSS**: A completely custom, lightweight dark-mode design system.
- **Generative AI Pipeline**: A dedicated `generate-post.js` Node script powered by Google Gemini (v2.5-flash) and multiple stock photo APIs (Wikimedia, Unsplash, Pexels).
- **RSS Syndication**: Natively exposes an XML RSS feed so other services (like `smm-bot`) can react to new publications.
- **GitHub Actions**: Fully automated deployment to GitHub Pages.

---

## 📦 Prerequisites
- **Node.js**: `v20.0.0` or higher.
- **npm**: `v10.0.0` or higher.
- A free **Google Gemini API Key**.

---

## 🚀 Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jessn-dev/auto-blogger.git
   cd auto-blogger
   ```

2. **Install dependencies:**
   ```bash
   npm ci
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory and add your keys:
   ```env
   GEMINI_API_KEY=your_key_here
   UNSPLASH_API_KEY=optional_key_here
   PEXELS_API_KEY=optional_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:4321`.

---

## 🛠 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local Astro development server. |
| `npm run build` | Compiles the Astro project into static HTML/CSS in `dist/`. |
| `npm run preview` | Previews the compiled `dist/` directory locally. |
| `node generate-post.js [persona]` | Triggers the AI pipeline to research, write, and format a new blog post. |

---

## ☁️ Deployment (CI/CD)

This blog is configured to build and deploy automatically to **GitHub Pages**.
Whenever a new post is generated and pushed to the `main` branch, the GitHub Action workflow will compile the Astro site into static assets and publish them globally via GitHub's CDN.

---

## 📝 License
Copyright © 2026.
This project is [MIT](https://opensource.org/licenses/MIT) licensed.