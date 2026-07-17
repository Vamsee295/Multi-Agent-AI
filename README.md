# 🤖 Multi-Agent AI Customer Support Assistant (Capstone Edition)

An enterprise-grade, full-stack AI customer support system demonstrating advanced **Multi-Agent Orchestration**, **Retrieval-Augmented Generation (RAG)**, **Sentiment Analysis**, and a **Modern Next.js Frontend**.

Built to satisfy rigorous capstone requirements, this application seamlessly routes customer queries to specialized AI agents, fetches company policies via a local FAISS vector store, and provides rich analytics and ticket escalation workflows.

---

## ✨ Features (Capstone Upgrades)

- **Multi-Agent Architecture**: Queries are intelligently routed to 5 specialized agents (Billing, Technical, Product, Complaint, FAQ) using LLM intent classification.
- **RAG Pipeline**: Fully integrated FAISS vector store with `sentence-transformers` embeddings, parsing text/PDFs from a local knowledge base.
- **Sentiment Analysis Layer**: Automatically detects customer sentiment (positive, neutral, frustrated, angry). Frustrated/angry customers are instantly co-routed to the Complaint agent for specialized handling.
- **Dynamic Orchestration**: Parallel execution of multiple agents for compound queries (e.g., "I paid but it crashed" → Billing + Technical), synthesized into a single cohesive response.
- **Analytics Dashboard**: Real-time KPI tracking via MongoDB aggregation (response times, agent usage breakdown, satisfaction scores, open escalations).
- **Escalation & Ticketing**: Low-confidence or highly angry interactions automatically trigger an escalation ticket for human review.
- **AI Tooling**: Auto-generates concise conversation summaries and context-aware session titles using LLMs.
- **Premium Enterprise UI**: A stunning dark-mode glassmorphism React frontend, featuring Markdown rendering, source citation drawers, sentiment badges, and thumbs up/down feedback widgets.

---

## 🏗️ Architecture Stack

### Backend (Python/FastAPI)
- **Framework**: FastAPI + Uvicorn
- **Database**: MongoDB (via Motor async driver)
- **AI/LLM**: Support for Groq (Llama 3), OpenAI, Gemini, or a deterministic offline "Mock" mode.
- **Embeddings**: `sentence-transformers` (`all-MiniLM-L6-v2`)
- **Vector DB**: FAISS
- **Auth**: JWT (PyJWT) + bcrypt (Passlib)

### Frontend (Next.js/React)
- **Framework**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS (Custom Dark Enterprise Palette + Glassmorphism)
- **State/Data**: Axios + custom React Hooks
- **Data Viz**: Recharts (Analytics Dashboard)
- **Icons/Markdown**: Lucide React + React Markdown

---

## 🚀 Quick Start Guide

### 1. Start the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or venv\Scripts\activate on Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env to add your LLM API keys (e.g., GROQ_API_KEY) and configure LLM_PROVIDER
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *(On startup, the system automatically ingests and chunks documents in `backend/knowledge_base/` into the FAISS index).*

### 2. Start the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Using the App

1. **Register/Login**: Create an account via the stunning dark-mode auth pages.
2. **Chat Interface**: 
   - Ask complex questions (e.g., "I'm furious! My premium subscription renewed but the app keeps crashing on login. What is your refund policy?")
   - Watch the animated **Pulse Strip** indicate which agents are handling the request in parallel.
   - Expand the **Context Drawer** below the response to view the exact company documents (with confidence scores) the RAG pipeline retrieved.
   - Rate responses using the **Feedback Widget**.
3. **Analytics Dashboard**: Click the "Analytics Dashboard" link in the sidebar to view:
   - Total conversations & average response times.
   - A Recharts-powered bar chart of agent usage.
   - Open escalation tickets (which you can mark as resolved).

---

## 🧪 Testing

The backend includes a robust test suite covering intent detection, RAG retrieval accuracy, and routing logic.

```bash
cd backend
pytest tests/ -v
```

*(Note: The test suite runs entirely offline using the mock LLM provider and mock embeddings, requiring no API keys).*
