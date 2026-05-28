# VedaAI - AI Assessment Creator

<div align="center">
  <p><em>Intelligent Question Paper Generation Powered by AI</em></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)](https://www.mongodb.com/)
  [![Redis](https://img.shields.io/badge/Redis-7.0-red)](https://redis.io/)
  [![Groq](https://img.shields.io/badge/Groq-Llama_3.1-orange)](https://groq.com/)
</div>

---

## 📋 Overview

VedaAI is an intelligent assessment creation platform that leverages Groq's LLM API to automatically generate customized question papers. Built with modern web technologies, it provides a seamless experience for educators to create, manage, and distribute assessments.

## ✨ Features

### Core Features
- 🎯 **Custom Assignment Creation**: Define subjects, classes, and question requirements
- 🤖 **AI-Powered Generation**: Generate complete question papers using Groq LLM (Llama 3.1)
- 📊 **Smart Question Distribution**: Automatic difficulty balancing (Easy, Moderate, Challenging)
- ⚡ **Real-time Updates**: WebSocket-powered live status tracking
- 📱 **Responsive Design**: Beautiful output on desktop, tablet, and mobile
- 📄 **Export Options**: Download question papers and answer keys as PDF
- 👥 **Student Info Section**: Built-in fields for student details (Name, Roll Number, Section)
- 🔑 **Answer Key Management**: Toggle visibility for teacher-only access
- 🔄 **Regenerate Option**: Quick paper regeneration with one click
- 📋 **Copy Link**: Easy sharing of generated papers

### Question Types Supported
- Multiple Choice Questions (MCQs) with options
- Short Answer Questions
- Long Answer Questions
- Numerical Problems
- Diagram-based Questions
- Mixed format papers with sections

---

## 🚀 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with SSR |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| Zustand | 4.x | State management |
| Axios | 1.x | HTTP client |
| jsPDF | 2.x | PDF generation |
| html2canvas | 1.x | HTML to PDF conversion |
| Lucide React | Latest | Icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express | 4.x | Web framework |
| TypeScript | 5.x | Type safety |
| MongoDB | 6.x | Database |
| Mongoose | 8.x | ODM for MongoDB |
| BullMQ | 5.x | Job queue management |
| Redis | 7.x | Queue backend & caching |
| Groq SDK | Latest | AI model integration |
| WebSocket (ws) | 8.x | Real-time communication |
| dotenv | 16.x | Environment configuration |
| CORS | 2.x | Cross-origin requests |
| nodemon | Latest | Development auto-reload |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| MongoDB | Primary database |
| Redis | Message queue & cache |

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** (v18.0.0 or higher)
  ```bash
  node --version  # Should be v18+
docker --version
docker-compose --version

Required Accounts
Groq API Key: Sign up at console.groq.com
MongoDB (optional): If not using Docker MongoDB, get connection string from MongoDB Atlas

📦 Installation
Step 1: Clone the Repository
bash
git clone https://github.com/ISHRAQ01/AI-Assessment_CreationTool.git
cd vedaai
Step 2: Start MongoDB & Redis with Docker
bash  or run only 
# Start containers in detached mode
docker-compose up -d

# Verify both containers are running
docker ps

Setup Backend
bash
cd backend
npm install

Create .env file:
PORT=5002
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=gsk_your_actual_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile
FRONTEND_URL=http://localhost:3000

Setup Frontend
bash
cd ../frontend
npm install

Create .env.local file:
NEXT_PUBLIC_API_URL=http://localhost:5002/api
NEXT_PUBLIC_WS_URL=ws://localhost:5002
NEXT_PUBLIC_APP_NAME=VedaAI

Run the Application
Open two terminals:

Terminal 1 - Start Backend
bash
cd backend
npm run dev
Backend runs on: http://localhost:5002

Terminal 2 - Start Frontend
bash
cd frontend
npm run dev
Frontend runs on: http://localhost:3001

Open http://localhost:3001 in your browser.

Terminal 3 - start docker
docker-compose up -d



🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

📝 License
This project is licensed.

🙏 Acknowledgments
Groq for AI API

Vercel for Next.js

Tailwind CSS for styling

render for backedn


