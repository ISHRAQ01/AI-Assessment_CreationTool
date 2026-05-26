# VedaAI - AI Assessment Creator

## Features
- Create assignments with custom question types
- AI-powered question paper generation using Groq LLM
- Real-time status updates via WebSocket
- Beautiful, responsive question paper output
- Student info section on output page

## Tech Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Zustand
- Backend: Node.js, Express, TypeScript
- Database: MongoDB
- Queue: BullMQ with Redis
- AI: Groq API (Llama 3.1)
- Real-time: WebSocket

## Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Installation

1. Clone the repo
2. Start MongoDB and Redis:
   ```bash
   docker-compose up -d
