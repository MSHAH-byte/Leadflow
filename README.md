# LeadFlow

**LeadFlow** is an AI-powered lead management and workflow automation system built with **FastAPI, LangGraph, Next.js, and Groq**.

It helps users capture leads, analyze and qualify them using an LLM-powered workflow, review AI-generated insights, and manage lead history through a web dashboard.

## Features

* Create and manage leads
* AI-powered lead analysis and qualification
* LangGraph-based analysis workflow
* Structured AI-generated analysis
* Lead scoring and qualification insights
* AI-generated response drafts
* Review and edit AI analysis before saving
* Lead history and individual lead details
* REST API built with FastAPI
* SQLite persistence
* Next.js dashboard with TypeScript and React
* Automated tests for core backend functionality

## Architecture

```text
                    LeadFlow
                       │
          ┌────────────┴────────────┐
          │                         │
     Next.js Frontend          FastAPI Backend
          │                         │
          │                    Lead Service
          │                         │
          │                      LangGraph
          │                         │
          │                   Analysis Workflow
          │                         │
          │                    LLM Service
          │                         │
          │                       Groq
          │                         │
          └──────────────┬──────────┘
                         │
                      SQLite
```

### Backend

The backend is organized into separate layers:

```text
backend/
├── app/
│   ├── api/          # API routes and endpoints
│   ├── core/         # Application configuration
│   ├── db/           # Database configuration and models
│   ├── graph/        # LangGraph workflow
│   ├── schemas/      # Pydantic request/response schemas
│   ├── services/     # Business and LLM services
│   └── main.py       # FastAPI application entry point
│
├── tests/            # Backend tests
└── requirements.txt  # Python dependencies
```

### Frontend

```text
frontend/
├── app/              # Next.js routes and pages
├── components/       # Reusable React components
├── lib/              # API client, types and application utilities
├── public/            # Static assets
└── package.json       # Frontend dependencies
```

## LangGraph Workflow

Lead analysis is handled through a LangGraph workflow rather than a single direct LLM call.

The workflow coordinates the analysis process and produces structured results that can be reviewed by the user before being persisted.

The main graph implementation is located in:

```text
backend/app/graph/
├── graph.py
├── nodes.py
├── prompts.py
└── state.py
```

## Tech Stack

### Backend

* Python
* FastAPI
* LangGraph
* LangChain
* Groq
* Pydantic
* SQLAlchemy
* SQLite
* Pytest

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* ESLint

## Getting Started

### Prerequisites

Make sure you have:

* Python 3.10+
* Node.js 18+
* npm
* A Groq API key

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd Leadflow
```

### 2. Backend Setup

```bash
cd backend

python -m venv .venv
```

#### Windows PowerShell

```powershell
.venv\Scripts\Activate.ps1
```

#### Install dependencies

```bash
pip install -r requirements.txt
```

Create your local environment file:

```text
backend/.env
```

Use `backend/.env.example` as the template and add your Groq API key.

Start the backend:

```bash
python -m uvicorn app.main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env.local
```

using `frontend/.env.example` as the template.

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:3000
```

## Running Tests

From the `backend` directory:

```bash
pytest
```

The tests cover the core LangGraph workflow and lead API functionality.

## Environment Variables

API keys and local environment configuration are intentionally excluded from version control.

Use the provided environment templates:

```text
backend/.env.example
frontend/.env.example
```

Never commit real API keys or other secrets.

## Project Documentation

Additional frontend architecture and learning documentation is available in:

```text
frontend/LEARNING.md
```

## Project Status

**MVP complete.**

The current version focuses on the core lead-management and AI-analysis workflow. Future iterations may expand automation, integrations, analytics, and production deployment capabilities.

## License

This project is available under the MIT License.
