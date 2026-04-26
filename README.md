# Hey-Pixi

Hey-Pixi is an autonomous AI agent creation platform. It allows businesses to instantly generate highly-tuned customer support and sales bots by simply providing their website URL. The platform crawls the website, extracts semantic business profiles, and creates an intelligent agent capable of capturing leads autonomously.

## 🚀 Features

- **Instant Agent Creation**: Provide a URL, and the system automatically crawls sub-pages (About, Pricing, Services) using Jina AI to build a comprehensive knowledge base.
- **Semantic Prompt Architecture**: Uses Groq (Llama-3.3-70B) to analyze raw website data and structure it into a perfect system prompt.
- **Real-time Streaming**: Real-time feedback in the UI using Server-Sent Events (SSE) during the scraping and prompt generation process.
- **Autonomous Lead Capture**: Agents are equipped with tools to automatically detect when a user provides contact info (Name, Email, Phone) and save it to the database.
- **Modern Tech Stack**: Built on Next.js App Router, Tailwind CSS, and MongoDB.

## 📚 Documentation

Detailed documentation can be found in the `docs/` folder:

- [Setup Guide](./docs/setup.md) - Instructions for running the project locally.
- [Architecture Overview](./docs/architecture.md) - Deep dive into the system design and workflows.
- [API Routes](./docs/api-routes.md) - Information on the internal API endpoints.

## 🛠️ Quick Start

1. **Clone the repository** and install dependencies:
   ```bash
   npm install
   ```

2. **Set up Environment Variables**:
   Copy `.env.example` to `.env.local` and add your keys (MongoDB, Groq, Jina, etc.).

3. **Start the Database**:
   Ensure MongoDB is running locally (`net start MongoDB`) or you have a valid Atlas connection string in your `.env.local`.

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
