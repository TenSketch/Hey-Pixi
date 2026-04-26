# Local Setup Guide

Follow these instructions to get Hey-Pixi running on your local machine.

## Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB Server (Local or Atlas Cloud)
- API Keys for external services

## 1. Database Setup

Hey-Pixi requires a running MongoDB instance.

### Option A: Local MongoDB
1. Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2. Start the MongoDB service.
   - Windows: `net start MongoDB`
   - Mac/Linux: `brew services start mongodb-community`

### Option B: MongoDB Atlas (Cloud)
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Whitelist your IP and create a database user.
3. Get the connection string.

## 2. Environment Variables

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env.local
```

### Required Keys
- `MONGODB_URI`: Your database connection string (e.g., `mongodb://127.0.0.1:27017/hey-pixi` or your Atlas URI).
- `GROQ_API_KEY`: Get this from [Groq Console](https://console.groq.com/). Required for LLM generation.
- `JINA_API_KEY`: Get this from [Jina AI](https://jina.ai/reader/). Required for website analysis and scraping.
- `AUTH_SECRET`: A random 32+ character string for session encryption.

## 3. Installation & Running

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 4. Troubleshooting
- **`ECONNREFUSED 127.0.0.1:27017`**: Your MongoDB server is not running. Start the service or ensure your Atlas URI is correct.
- **Analysis Fails / Hangs**: Ensure your `JINA_API_KEY` is valid and the target website is accessible.
