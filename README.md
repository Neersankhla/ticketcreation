# Smart Helpdesk

An AI-powered helpdesk system built with MERN stack (MongoDB, Express, React, Node.js) and a Python agent worker using Gemini AI for intelligent ticket triage and resolution.

## 🚀 Features

- **Role-based Authentication**: Admin, Agent, and User roles with JWT authentication
- **AI-Powered Triage**: Gemini AI classifies tickets and suggests responses
- **Knowledge Base Management**: Create, update, and search help articles
- **Auto-Resolution**: High-confidence tickets are automatically resolved
- **Audit Logging**: Complete activity tracking with trace IDs
- **Real-time Updates**: Live status updates and notifications
- **Configurable Settings**: Adjustable AI confidence thresholds

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + MongoDB
- **Agent Worker**: Python + FastAPI + Gemini AI
- **Database**: MongoDB + Redis
- **Authentication**: JWT tokens
- **Deployment**: Docker + Docker Compose

## 📋 Prerequisites

- Node.js (v18+)
- Python (v3.11+)
- MongoDB
- Redis
- Gemini API Key

## 🚀 Getting Started

### 1. Clone & Setup
git clone https://github.com/janhvi2806/smart-helpdesk.git

### 2. Environment Configuration
Create a `.env` file in the root directory: cp .env.example .env

### 3. Install Dependencies
#### Root dependencies
-> npm install

#### Backend dependencies
-> cd backend && npm install

#### Frontend dependencies
-> cd ../frontend && npm install

#### Python dependencies
-> cd ../agent-worker
-> python -m venv venv
-> source venv\Scripts\activate
-> pip install -r requirements.txt


### 4. Start Services

**Option A: Docker**
-> docker-compose up --build

**Option B: Local Development**
#### Terminal 1: Start MongoDB and Redis
(or use Docker for just databases)
#### Terminal 2: Backend
-> cd backend && npm run dev
#### Terminal 3: Agent Worker
-> cd agent-worker && uvicorn app.main:app --reload --port 8000
#### Terminal 4: Frontend
-> cd frontend && npm run dev

### 5. Seed Database
-> node scripts/seed.js

### 6. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Agent Service**: http://localhost:8000

## 🔐 Demo Accounts

After seeding the database:
- **Admin**: admin@example.com / password123
- **Agent**: agent@example.com / password123
- **User**: user@example.com / password123


## 📝 Development

### Adding New Features
1. Backend changes go in `backend/src/`
2. Frontend changes go in `frontend/src/`
3. AI logic changes go in `agent-worker/app/`

### Database Schema
- Users, Articles, Tickets, AgentSuggestions, AuditLogs, Config

## 🚢 Deployment

The application is containerized and ready for deployment:
- Use `docker-compose.yml` for local/staging
- Modify environment variables for production
- Ensure proper secrets management

## 🎥 Demo Video

A complete video demonstration is attached showing the Smart Helpdesk system in action.
▶ [Watch Demo Video](https://drive.google.com/file/d/11w9ZdpxFtMAv52QnUm4Weo9eRIeg1Srg/view?usp=sharing)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions, please create an issue in the repository.

