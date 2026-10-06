# LeadFlow — Project Learning Guide

A whole-project learning guide for **LeadFlow**, covering the product architecture, FastAPI backend, LangGraph AI workflow, Groq/LLM integration, SQLite persistence, frontend architecture, testing, engineering decisions, limitations, and study path.

The purpose of this document is not just to explain **what the code does**, but **why the project is structured this way** and how the pieces connect.

---

# 1. What LeadFlow Is

LeadFlow is a full-stack AI-powered lead qualification workspace.

It takes an unstructured customer inquiry and transforms it into:

```text
Unstructured customer inquiry
            ↓
Structured project information
            ↓
Lead qualification
            ↓
Missing-information detection
            ↓
Clarifying questions
            ↓
Draft customer response
            ↓
Human review / editing
            ↓
Explicit approval
            ↓
Saved lead
```

The product is designed around **human-in-the-loop AI**.

The AI does not automatically save a lead or send a response.

Instead:

```text
AI analyzes
    ↓
Human reviews
    ↓
Human edits if necessary
    ↓
Human explicitly approves
    ↓
System saves
```

### What LeadFlow is not

LeadFlow is intentionally **not**:

* a full CRM replacement
* a chatbot
* an autonomous sales agent
* an email-sending system
* an RAG application
* an MCP application
* a multi-tenant production CRM

Those could be future extensions, but they are outside the current MVP.

---

# 2. Core Product Idea

The central problem is that inbound leads often arrive as messy natural-language messages.

For example:

```text
Hi, I need a website for my restaurant.
How much would it cost?
We need it before next month.
```

A salesperson needs more useful information than the raw message provides.

LeadFlow converts it into something like:

```text
Project:
Web Development

Requirements:
- Restaurant website

Qualification:
Needs Information

Score:
60/100

Missing:
- Budget expectations
- Exact launch deadline

Suggested questions:
- What budget range have you allocated?
- When exactly would you like the website to be live?

Draft:
Hello Ahmed, thank you for reaching out...
```

The important architectural decision is that this result remains a **draft** until the human approves it.

---

# 3. Technology Stack

| Layer           | Technology                 | Purpose                             |
| --------------- | -------------------------- | ----------------------------------- |
| Frontend        | Next.js                    | Web application                     |
| UI              | React                      | Components and interaction          |
| Language        | TypeScript                 | Frontend type safety                |
| Styling         | Tailwind CSS               | UI styling                          |
| Backend API     | FastAPI                    | REST API                            |
| Validation      | Pydantic                   | Request/response contracts          |
| Configuration   | pydantic-settings          | Environment configuration           |
| AI workflow     | LangGraph                  | Stateful multi-step workflow        |
| LLM framework   | LangChain                  | LLM integration / structured output |
| LLM provider    | Groq                       | Runs the configured model           |
| Model           | `openai/gpt-oss-20b`       | Current configured LLM              |
| Database        | SQLite                     | Local persistence                   |
| Database driver | Python `sqlite3`           | SQLite access                       |
| Testing         | pytest                     | Automated tests                     |
| HTTP testing    | httpx / FastAPI TestClient | API tests                           |

The backend is Python-based and the frontend is TypeScript/React-based.

---

# 4. High-Level Architecture

```text
┌───────────────────────────────────────────────┐
│                  FRONTEND                     │
│                                               │
│ Next.js + React + TypeScript + Tailwind       │
│                                               │
│ Pages → Components → lib/api.ts                │
└──────────────────────┬────────────────────────┘
                       │
                       │ HTTP / JSON
                       ▼
┌───────────────────────────────────────────────┐
│                  FASTAPI                      │
│                                               │
│ Routes → Services → Graph / Database          │
└───────────────┬───────────────────┬───────────┘
                │                   │
                ▼                   ▼
        ┌──────────────┐      ┌──────────────┐
        │  LangGraph   │      │    SQLite    │
        │              │      │              │
        │ 6 AI nodes   │      │ saved leads │
        └──────┬───────┘      └──────────────┘
               │
               ▼
        ┌──────────────┐
        │     Groq     │
        │     LLM      │
        └──────────────┘
```

### Important boundary

The frontend does **not** know:

* that LangGraph exists
* which LLM provider is being used
* how the graph is structured
* how SQLite works
* how prompts are constructed

The frontend only knows the HTTP API contract.

This separation is important because the AI implementation can change without requiring the frontend to understand the internal AI architecture.

---

# 5. The Most Important Architecture: Analyze vs Save

LeadFlow deliberately has two separate operations.

|                               | `POST /api/v1/leads/analyze` | `POST /api/v1/leads` |
| ----------------------------- | ---------------------------- | -------------------- |
| Purpose                       | Analyze inquiry              | Save reviewed lead   |
| Calls LLM                     | Yes                          | No                   |
| Writes DB                     | No                           | Yes                  |
| Input                         | `AnalyzeLeadRequest`         | `CreateLeadRequest`  |
| Output                        | `AnalyzeLeadResponse`        | `LeadResponse`       |
| Human review before operation | No                           | Yes                  |

The complete lifecycle is:

```text
POST /leads/analyze
        ↓
AI analysis
        ↓
Frontend receives result
        ↓
Human reviews result
        ↓
Human edits fields/draft
        ↓
Human clicks "Approve & Save"
        ↓
POST /leads
        ↓
SQLite
```

### Why not save immediately after analysis?

Because LLM output is probabilistic.

The model may:

* misunderstand the inquiry
* classify the project incorrectly
* assign an imperfect score
* identify unnecessary missing information
* generate an undesirable response

The human review stage provides a safety and quality boundary.

The database therefore contains the **human-approved version**, not necessarily the raw AI output.

---

# 6. Complete Request Lifecycle

## Analyze request

When the user clicks **Analyze Lead**:

```text
LeadForm.tsx
    ↓
lib/api.ts
    ↓
POST /api/v1/leads/analyze
    ↓
api/routes/leads.py
    ↓
llm_service.py
    ↓
run_lead_workflow()
    ↓
LangGraph
    ↓
Node 1
    ↓
Node 2
    ↓
Node 3
    ↓
Node 4
    ↓
Conditional branch
    ↓
Node 5 if necessary
    ↓
Node 6
    ↓
LeadAnalysisResult
    ↓
FastAPI serializes response
    ↓
Frontend
    ↓
sessionStorage
    ↓
Analysis Review page
```

## Save request

After the human reviews the result:

```text
AnalysisReview.tsx
    ↓
human edits result
    ↓
Approve & Save
    ↓
lib/api.ts
    ↓
POST /api/v1/leads
    ↓
api/routes/leads.py
    ↓
lead_service.py
    ↓
SQLite
    ↓
LeadResponse
    ↓
Frontend navigates to saved lead
```

This separation is one of the most important concepts in the entire project.

---

# 7. Backend Project Structure

```text
backend/
├── app/
│   ├── main.py
│   │
│   ├── core/
│   │   └── config.py
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   └── leads.py
│   │   │
│   │   └── v1/
│   │       ├── api.py
│   │       └── endpoints/
│   │           └── health.py
│   │
│   ├── schemas/
│   │   ├── analysis.py
│   │   └── lead.py
│   │
│   ├── services/
│   │   ├── llm_service.py
│   │   └── lead_service.py
│   │
│   ├── graph/
│   │   ├── state.py
│   │   ├── prompts.py
│   │   ├── nodes.py
│   │   └── graph.py
│   │
│   └── db/
│       ├── database.py
│       └── models.py
│
├── tests/
│   ├── conftest.py
│   ├── test_graph.py
│   └── test_leads.py
│
├── data/
│   └── leadflow.db
│
├── .env
└── .env.example
```

---

# 8. Backend Layer Responsibilities

The backend is divided into layers so each part has a clear responsibility.

| Layer      | Responsibility                       |
| ---------- | ------------------------------------ |
| `main.py`  | Create/configure FastAPI application |
| API routes | HTTP request/response handling       |
| Schemas    | Define data contracts                |
| Services   | Business/application logic           |
| Graph      | AI workflow                          |
| Database   | SQLite connection and schema         |
| Tests      | Verify behavior                      |

A useful mental model is:

```text
HTTP
 ↓
Routes
 ↓
Services
 ↓
AI / Database
```

### Routes should not contain

* SQL queries
* LangGraph implementation
* prompt construction

### Graph should not contain

* HTTP response handling
* database writes
* frontend logic

### Database layer should not contain

* AI logic
* HTTP logic
* UI behavior

This separation makes the application easier to understand and extend.

---

# 9. `main.py`

`app/main.py` is the application entry point.

It does three major things:

1. Creates the FastAPI application.
2. Configures middleware and routes.
3. Initializes the database during application startup.

The lifespan function:

```text
Application starts
      ↓
init_db()
      ↓
SQLite table exists
      ↓
Application serves requests
```

The API is mounted under:

```text
/api/v1
```

So:

```text
/api/v1/health
/api/v1/leads
/api/v1/leads/analyze
/api/v1/leads/{id}
```

The project also enables CORS so the browser frontend can communicate with the backend.

---

# 10. API Routing

## `app/api/v1/api.py`

This file combines the routers.

Conceptually:

```text
api_router
   │
   ├── health router
   │      └── /health
   │
   └── leads router
          ├── /leads
          ├── /leads/analyze
          └── /leads/{id}
```

`main.py` then mounts this router under:

```text
/api/v1
```

This gives the final paths.

---

# 11. API Endpoints

| Method | Endpoint                | Purpose            |
| ------ | ----------------------- | ------------------ |
| `GET`  | `/api/v1/health`        | Check API status   |
| `POST` | `/api/v1/leads/analyze` | Run AI workflow    |
| `POST` | `/api/v1/leads`         | Save reviewed lead |
| `GET`  | `/api/v1/leads`         | List saved leads   |
| `GET`  | `/api/v1/leads/{id}`    | Retrieve one lead  |

Swagger documentation is available at:

```text
http://127.0.0.1:8000/api/v1/docs
```

---

# 12. Pydantic Schemas

Pydantic models define the API's contracts.

There are two major categories.

## Analysis models

Located in:

```text
app/schemas/analysis.py
```

These represent structured AI outputs.

Examples:

```text
ExtractedLeadInfo
InquiryClassification
QualificationEvaluation
MissingInfoCheck
SuggestedQuestions
ResponseDraft
LeadAnalysisResult
```

## API models

Located in:

```text
app/schemas/lead.py
```

These represent HTTP request/response payloads.

Examples:

```text
AnalyzeLeadRequest
AnalyzeLeadResponse
CreateLeadRequest
LeadResponse
LeadListItem
```

---

# 13. Request/Response Contract

The analysis request begins with:

```text
AnalyzeLeadRequest
```

containing:

```text
customer_name
contact
inquiry
```

The workflow produces:

```text
LeadAnalysisResult
```

which is wrapped by:

```text
AnalyzeLeadResponse
```

Conceptually:

```text
AnalyzeLeadRequest
        ↓
FastAPI route
        ↓
LangGraph
        ↓
LeadAnalysisResult
        ↓
AnalyzeLeadResponse
```

The save operation is different:

```text
CreateLeadRequest
        ↓
lead_service.create_lead()
        ↓
SQLite
        ↓
LeadResponse
```

`LeadResponse` extends the saved request data with:

```text
id
created_at
updated_at
```

---

# 14. Validation

FastAPI automatically uses Pydantic to validate incoming JSON.

For example:

```text
customer_name = ""
```

is rejected.

Whitespace-only values are also explicitly rejected by validators.

This means:

```text
Invalid request
      ↓
Pydantic
      ↓
422 response
      ↓
No LangGraph execution
      ↓
No Groq call
```

This is useful not only for correctness but also for **protecting LLM quota**.

Other constraints include:

```text
qualification_score: 0–100
```

and:

```text
qualification_status:
    qualified
    needs_information
    not_qualified
```

Using `Literal` prevents arbitrary status strings from entering the application.

---

# 15. Configuration

`app/core/config.py` contains application configuration.

Pydantic Settings loads values from `.env`.

Important settings include:

```text
PROJECT_NAME
APP_ENV
API_V1_STR
DEBUG
HOST
PORT
GROQ_API_KEY
GROQ_MODEL
DATABASE_PATH
```

The API key belongs only on the backend.

```text
backend/.env
```

The frontend should never receive:

```text
GROQ_API_KEY
```

The browser communicates with FastAPI, and FastAPI communicates with Groq.

---

# 16. Database Architecture

LeadFlow uses SQLite.

The schema contains one main table:

```text
leads
```

Fields:

```text
id
customer_name
contact
inquiry
project_type
requirements
qualification_status
qualification_score
qualification_factors
missing_information
suggested_questions
response_draft
approved
created_at
updated_at
```

---

# 17. Why Lists Are Stored as JSON Text

Several fields are Python lists:

```python
requirements
qualification_factors
missing_information
suggested_questions
```

SQLite stores them as text.

When saving:

```text
Python list
    ↓
json.dumps()
    ↓
TEXT column
```

When reading:

```text
TEXT column
    ↓
json.loads()
    ↓
Python list
```

Example:

```text
["Stripe payments", "Admin dashboard"]
```

becomes JSON text inside SQLite.

This is simple and appropriate for the MVP.

A more complex production database might normalize these into related tables or use PostgreSQL's JSON/JSONB capabilities depending on requirements.

---

# 18. SQLite Connection Handling

`database.py` provides:

```text
get_db_path()
get_connection()
init_db()
```

The database path is resolved relative to the backend project rather than depending on the current working directory.

Each database operation:

```text
open connection
    ↓
perform operation
    ↓
commit if necessary
    ↓
close connection
```

The connection is closed in `finally`, which helps prevent resource leaks.

SQLite rows are configured using:

```python
sqlite3.Row
```

so code can access:

```python
row["customer_name"]
```

instead of relying on numeric column positions.

---

# 19. SQL Safety

Database writes use parameterized queries:

```text
WHERE id = ?
```

instead of constructing SQL using string interpolation.

This prevents SQL injection through values such as `lead_id`.

The database service also keeps SQL away from the HTTP route layer.

---

# 20. Lead Service

`app/services/lead_service.py` contains database operations.

Main functions:

```text
create_lead()
get_leads()
get_lead_by_id()
```

## `create_lead()`

Takes a validated `CreateLeadRequest`.

Then:

```text
request
 ↓
serialize list fields as JSON
 ↓
INSERT INTO leads
 ↓
retrieve generated ID
 ↓
construct LeadResponse
```

It does **not** call the LLM.

That is important.

Saving a lead should be deterministic and cheap.

---

# 21. List vs Detail API

The list endpoint intentionally returns a smaller object:

```text
LeadListItem
```

It contains summary information such as:

```text
id
customer_name
contact
project_type
qualification_status
qualification_score
approved
created_at
```

It does not return the complete inquiry, requirements, questions, and response draft.

The detail endpoint returns:

```text
LeadResponse
```

with the complete record.

This prevents the list view from unnecessarily transferring large payloads.

---

# 22. LangGraph — The AI Core

The most important AI architecture lives in:

```text
app/graph/
```

It contains:

```text
state.py
prompts.py
nodes.py
graph.py
```

The workflow is:

```text
START
  ↓
extract_lead_information
  ↓
classify_inquiry
  ↓
evaluate_qualification
  ↓
check_missing_information
  ↓
       ┌──────────────────────────────┐
       │ missing information exists? │
       └──────────────┬───────────────┘
                 Yes  │  No
                      │
                      ▼
        generate_qualification_questions
                      │
                      ▼
                draft_response
                      │
                      ▼
                     END

No branch:
check_missing_information
          ↓
    draft_response
          ↓
         END
```

There are six nodes.

---

# 23. What LangGraph Provides

LangGraph gives the workflow:

* shared state
* named nodes
* directed edges
* conditional routing
* graph compilation
* execution

Instead of one giant LLM call, LeadFlow divides the reasoning task into smaller stages.

Conceptually:

```text
One giant prompt
       ↓
harder to control
harder to test
harder to extend
```

versus:

```text
Extract
   ↓
Classify
   ↓
Qualify
   ↓
Find gaps
   ↓
Ask questions if necessary
   ↓
Draft response
```

Each stage has a focused responsibility.

---

# 24. `LeadState`

`state.py` defines:

```python
class LeadState(TypedDict, total=False):
```

This is the shared state passed through the graph.

It contains fields such as:

```text
customer_name
contact
inquiry
extracted_information
project_type
requirements
qualification_status
qualification_score
qualification_factors
missing_information
suggested_questions
response_draft
```

Think of it as the workflow's shared memory.

For example:

```text
Node 1 writes:
extracted_information

Node 2 reads:
extracted_information

Node 2 writes:
project_type
requirements

Node 3 reads:
project_type
requirements
```

Each node normally returns only the fields it wants to update.

LangGraph merges those updates into the shared state.

---

# 25. Node 1 — Extract Lead Information

Function:

```text
extract_lead_information()
```

Purpose:

Extract factual information from the raw inquiry.

Output model:

```text
ExtractedLeadInfo
```

It can identify:

```text
customer_name
contact
business_type
timeline
budget
key_details
```

The important prompt rule is:

> Do not invent information.

If the customer did not mention something, the model should not fabricate it.

The node also fills the state with customer name/contact if those were not already supplied.

---

# 26. Node 2 — Classify Inquiry

Function:

```text
classify_inquiry()
```

Output:

```text
InquiryClassification
```

It produces:

```text
project_type
requirements
```

The prompt deliberately emphasizes **explicit requirements**.

For example:

```text
"I need a website for my restaurant."
```

should not automatically become:

```text
Responsive design
SEO
Contact form
Social media integration
Menu page
```

unless those things were actually requested.

This is an example of **grounding the LLM output in the input evidence**.

---

# 27. Node 3 — Evaluate Qualification

Function:

```text
evaluate_qualification()
```

Output:

```text
QualificationEvaluation
```

It produces:

```text
qualification_status
qualification_score
qualification_factors
```

The status can only be:

```text
qualified
needs_information
not_qualified
```

The score is:

```text
0–100
```

The model is instructed to consider:

* project clarity
* business need
* timeline
* budget
* scope
* purchasing intent

The factors should be short and evidence-based.

The system intentionally does not ask the model to expose chain-of-thought.

---

# 28. Node 4 — Check Missing Information

Function:

```text
check_missing_information()
```

Output:

```text
MissingInfoCheck
```

This node answers:

> What important project/scoping information is still missing?

Examples:

```text
Budget expectations
Exact launch deadline
Specific feature requirements
Platform preference
Design/branding assets
```

An important design rule is that contact metadata is not treated as project scope.

For example, if:

```text
customer_name = Ahmed
contact = ahmed@example.com
```

the system should not ask:

```text
What is your name?
What is your email?
```

---

# 29. Python Guardrails After the LLM

The prompts are not the only protection.

The Python code also filters results.

For example, `check_missing_information()` removes items that incorrectly refer to already-known:

```text
name
contact
email
phone
```

Similarly, the question-generation node filters questions that ask for already-known contact information.

This is a useful general AI engineering pattern:

```text
Prompt instruction
      +
Programmatic validation/filtering
      ↓
More reliable output
```

Prompting alone should not be treated as a complete guardrail.

---

# 30. Conditional Routing

The graph's conditional logic is:

```python
route_missing_info(state)
```

It checks:

```text
Is missing_information non-empty?
```

If yes:

```text
generate_qualification_questions
```

If no:

```text
draft_response
```

Therefore the workflow is not simply linear.

It is:

```text
fixed steps
   +
conditional branch
```

This conditional edge is one of the clearest examples of why LangGraph is being used.

---

# 31. Node 5 — Generate Qualification Questions

Function:

```text
generate_qualification_questions()
```

This node only runs when missing information exists.

Output:

```text
SuggestedQuestions
```

It generates 2–4 questions based specifically on the identified gaps.

For example:

```text
Missing:
Budget
Exact deadline
```

might produce:

```text
What budget range have you allocated for the project?

When exactly would you like the project to be live?
```

The node should not invent unrelated questions.

---

# 32. Node 6 — Draft Response

Function:

```text
draft_response()
```

Output:

```text
ResponseDraft
```

This creates the customer-facing response.

The prompt explicitly prevents:

* invented features
* invented pricing
* invented deadlines
* unsupported promises

If questions exist, they are naturally incorporated.

If no questions are required, the response can suggest the next logical step, such as a discovery call.

---

# 33. Structured LLM Output

A major design decision is:

```python
llm.with_structured_output(PydanticModel)
```

instead of asking the LLM to return arbitrary text and manually parsing it.

For example:

```text
Groq
 ↓
structured output
 ↓
QualificationEvaluation
```

This provides a much stronger contract than:

```text
LLM
 ↓
"Here is the score: 73..."
 ↓
regex/string parsing
```

Pydantic then validates fields such as:

```text
score: 0–100
status: one of three allowed values
```

This is an important pattern for production AI systems:

```text
LLM output
      ↓
structured schema
      ↓
validated application data
```

---

# 34. Why Temperature Is `0.0`

The application uses:

```python
temperature=0.0
```

The workflow is primarily analytical rather than creative.

Lower temperature generally reduces unnecessary variation.

It does **not** guarantee deterministic identical responses because model/API behavior can still vary.

The purpose is to make analysis more stable, not mathematically deterministic.

---

# 35. Prompts Are Separated from Node Code

Prompts live in:

```text
app/graph/prompts.py
```

while execution logic lives in:

```text
app/graph/nodes.py
```

This separation is useful.

If the classification behavior needs improvement, you can modify:

```text
CLASSIFY_INQUIRY_SYSTEM
```

without changing the graph structure.

Therefore:

```text
Workflow logic
      ≠
Prompt behavior
```

They are related, but separate concerns.

---

# 36. `graph.py`

`graph.py` builds the actual LangGraph.

The important steps are:

```text
StateGraph(...)
        ↓
add_node(...)
        ↓
add_edge(...)
        ↓
add_conditional_edges(...)
        ↓
compile()
```

Then:

```text
lead_graph.invoke(initial_state)
```

runs the workflow.

---

# 37. `run_lead_workflow()`

This function provides a clean application-level interface.

The rest of the backend does not need to know how the graph is constructed.

It can simply call:

```text
run_lead_workflow(...)
```

and receive:

```text
LeadAnalysisResult
```

Internally:

```text
input
 ↓
initial LeadState
 ↓
lead_graph.invoke()
 ↓
final state
 ↓
LeadAnalysisResult
```

This is a useful abstraction boundary.

---

# 38. `llm_service.py`

`llm_service.py` contains:

```text
analyze_lead_inquiry()
```

Its responsibility is to call the workflow and provide safe error handling.

The route therefore does not directly contain:

```text
LangGraph invocation
```

Instead:

```text
route
 ↓
llm_service
 ↓
graph
```

If the AI workflow raises an exception, the service logs it and exposes a generic internal error to the API client.

The client does not receive raw internal exception details.

---

# 39. Human Approval Is Not a LangGraph Node

This is an important architectural distinction.

The graph ends here:

```text
draft_response
      ↓
     END
```

Human review happens **outside the graph**.

```text
LangGraph
    ↓
AI result
    ↓
Frontend review
    ↓
Human edit
    ↓
Approve
    ↓
Database
```

The MVP does not use:

```text
LangGraph interrupt
LangGraph checkpointer
```

for human approval.

That is intentional.

The frontend/API boundary is sufficient for this workflow.

A future version could use LangGraph persistence and interrupts if the AI workflow itself needed to pause and resume.

---

# 40. Frontend Architecture

The frontend uses:

```text
Next.js
React
TypeScript
Tailwind CSS
```

The main routes are:

```text
/
├── Dashboard

/leads/new
├── New lead form

/leads/analysis
├── Review unsaved AI analysis

/leads/history
├── Saved lead history

/leads/[id]
├── Saved lead detail
```

The frontend communicates directly with FastAPI.

There is no Next.js API proxy layer in the current architecture.

---

# 41. Frontend Layers

Conceptually:

```text
Pages
   ↓
Components
   ↓
lib/api.ts
   ↓
FastAPI
```

`lib/api.ts` is the main network abstraction.

It contains functions such as:

```text
healthCheck()
analyzeLead()
getLeads()
getLead()
createLead()
```

The rest of the frontend does not need to manually construct fetch requests everywhere.

---

# 42. `.tsx` vs `.ts`

A useful mental model:

### `.tsx`

TypeScript + JSX.

Usually UI:

```text
page.tsx
component.tsx
```

Examples:

```text
app/leads/new/page.tsx
components/leads/lead-form.tsx
```

### `.ts`

TypeScript without JSX.

Usually logic/data:

```text
lib/api.ts
lib/types.ts
lib/utils.ts
```

This is a convention rather than an absolute rule.

---

# 43. Frontend Type Contracts

`frontend/lib/types.ts` mirrors the backend API models.

This creates a frontend representation of the API contract.

For example:

```text
Backend Pydantic model
        ↕
Frontend TypeScript type
```

This is useful because the frontend can understand:

```text
qualification_status
qualification_score
requirements
missing_information
suggested_questions
response_draft
```

without knowing anything about the backend implementation.

The backend remains the source of truth.

---

# 44. Unsaved Analysis and `sessionStorage`

The AI result is intentionally not saved to SQLite immediately.

Instead, the frontend temporarily stores the analysis using:

```text
sessionStorage
```

Flow:

```text
Analyze
  ↓
AI result
  ↓
sessionStorage
  ↓
Analysis Review page
  ↓
Human edits
  ↓
Approve & Save
  ↓
POST /leads
  ↓
SQLite
```

Why `sessionStorage`?

Because the analysis is:

* temporary
* associated with the current browser tab
* not yet a saved lead
* useful across page navigation and refresh

After successful saving, the draft is cleared.

A limitation is that closing the browser tab discards it.

---

# 45. Frontend State Management

The project deliberately does not use:

```text
Redux
Zustand
React Query
SWR
```

Instead it uses React primitives such as:

```text
useState
useEffect
useSyncExternalStore
```

and small custom utilities.

For an MVP of this size, this avoids unnecessary state-management complexity.

---

# 46. Loading, Error, and Empty States

The frontend distinguishes between:

```text
Loading
Success
Empty
Error
```

For example:

```text
Loading leads...
```

versus:

```text
No leads yet.
```

versus:

```text
Unable to connect to the backend.
```

This is important because a production-style application should not treat every non-success state as the same thing.

---

# 47. Testing Architecture

Tests are divided between:

```text
test_leads.py
test_graph.py
conftest.py
```

There are two broad categories.

## Fast offline tests

These do not need Groq.

They test:

* API behavior
* validation
* database persistence
* graph structure
* routing

## Live AI tests

These execute:

```text
run_lead_workflow()
```

and therefore call Groq.

They test real model behavior.

---

# 48. API Tests

`test_leads.py` covers:

```text
health endpoint
analyze endpoint
validation
create lead
list leads
get lead
404 behavior
edited values preservation
```

The analyze endpoint test mocks:

```text
run_lead_workflow
```

so the test does not consume Groq quota.

This is the correct principle:

> API tests should test the API contract without requiring the external LLM to be available.

---

# 49. Temporary Test Database

`conftest.py` creates a temporary SQLite database for each test.

Conceptually:

```text
Test starts
   ↓
temporary DB created
   ↓
tables initialized
   ↓
test runs
   ↓
test finishes
   ↓
temporary DB disappears
```

The real:

```text
data/leadflow.db
```

is not modified.

This makes tests safer and isolated.

---

# 50. Why the Tests Patch Where the Function Is Used

The routes contain imports such as:

```python
from app.services.lead_service import create_lead
```

That means the route module has its own reference to the function.

Therefore the test patches:

```text
app.api.routes.leads.create_lead
```

rather than only patching:

```text
app.services.lead_service.create_lead
```

General Python mocking principle:

> Patch the name where the code under test looks it up.

This is an important testing concept beyond LeadFlow itself.

---

# 51. Graph Tests

`test_graph.py` checks graph structure and behavior.

The structural test verifies that the required nodes exist.

The routing test verifies both branches:

```text
missing_information exists
        ↓
generate questions
```

and:

```text
missing_information empty
        ↓
draft response
```

The live AI tests verify behavioral properties such as:

* explicit requirements are captured
* unsupported features are not invented
* known contact information isn't treated as missing
* qualification score stays within range

These tests are useful, but they are naturally less deterministic than normal unit tests.

---

# 52. Running the Backend

From:

```text
D:\Development\Langgraph\Leadflow\backend
```

activate the environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Create `.env` from `.env.example`, then add:

```text
GROQ_API_KEY=your_key_here
```

Start FastAPI:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

# 53. Running the Frontend

From:

```text
D:\Development\Langgraph\Leadflow\frontend
```

Install dependencies:

```powershell
npm install
```

Create local environment configuration:

```powershell
copy .env.example .env.local
```

Then:

```powershell
npm run dev
```

The frontend normally runs at:

```text
http://localhost:3000
```

The backend normally runs at:

```text
http://127.0.0.1:8000
```

---

# 54. Running Tests

From:

```text
backend
```

Fast offline API tests:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_leads.py
```

Fast graph structure/routing tests:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_graph.py::test_graph_nodes_and_edges tests/test_graph.py::test_conditional_routing_branches
```

Full suite:

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

The full suite includes live LLM tests and therefore requires:

```text
GROQ_API_KEY
```

and consumes model/API quota.

---

# 55. Manual End-to-End Test

A useful manual test is:

### 1. Start backend

```text
127.0.0.1:8000
```

### 2. Start frontend

```text
localhost:3000
```

### 3. Check empty dashboard

The application should show the empty state.

### 4. Test validation

Submit an empty New Lead form.

Expected:

```text
validation errors
```

### 5. Analyze a real inquiry

Example:

```text
Customer:
Ahmed

Contact:
ahmed@example.com

Inquiry:
I need a website for my restaurant.
How much would it cost?
We need it before next month.
```

### 6. Review the AI result

Check:

```text
project type
requirements
qualification
score
missing information
questions
response draft
```

### 7. Edit the response

Modify the draft manually.

### 8. Refresh

The unsaved analysis should remain available through `sessionStorage`.

### 9. Approve and save

Click:

```text
Approve & Save
```

### 10. Verify persistence

Open the saved lead.

The edited values should be stored.

### 11. Check history

The lead should appear in the history list.

### 12. Test 404

Open:

```text
/leads/99999
```

Expected:

```text
Lead not found
```

### 13. Test backend failure

Stop FastAPI and reload the frontend.

Expected:

```text
controlled connection/error state
```

---

# 56. Engineering Decisions

## Why LangGraph?

Because the AI task naturally consists of multiple stages with shared state and a conditional branch.

Instead of:

```text
one huge prompt
```

LeadFlow uses:

```text
extract
→ classify
→ qualify
→ inspect gaps
→ optionally ask questions
→ draft
```

This makes the workflow easier to reason about and extend.

---

## Why Pydantic structured output?

Because application code needs reliable structured data.

Instead of parsing arbitrary LLM text:

```text
LLM text
→ regex
→ manual parsing
```

the project uses:

```text
LLM
→ structured Pydantic model
→ validated Python object
```

---

## Why SQLite?

Because LeadFlow is currently an MVP/local project.

SQLite provides:

* zero external database server
* simple setup
* transactional persistence
* easy development
* minimal infrastructure

For a deployed multi-user system, PostgreSQL would be a more appropriate choice.

---

## Why no authentication?

Authentication is intentionally out of scope for the current MVP.

The application is demonstrating:

```text
AI workflow
+
human review
+
persistence
+
full-stack architecture
```

rather than implementing a complete SaaS identity system.

---

## Why no RAG?

The current task does not require retrieving information from external documents.

The AI operates primarily on:

```text
customer inquiry
+
structured workflow state
```

RAG would become relevant if LeadFlow needed to answer using:

* company service catalogs
* pricing documents
* previous proposals
* internal sales knowledge
* product documentation

---

# 57. Honest Limitations

The current architecture is intentionally MVP-level.

## LLM provider coupling

`get_llm()` currently creates:

```text
ChatGroq
```

directly.

The provider is therefore not fully abstracted.

A future provider factory could provide:

```text
get_llm()
   ↓
provider configuration
   ↓
Groq / OpenAI / another provider
```

---

## Synchronous workflow

The graph currently runs synchronously.

There is no:

```text
streaming
retry policy
workflow timeout
background job
```

A slow/failing provider can therefore make the API request slow or fail.

---

## CORS

Current configuration allows:

```text
allow_origins=["*"]
```

with credentials enabled.

This is acceptable for local development but should be restricted before production deployment.

---

## No authentication

Anyone able to reach the API can potentially interact with it.

Production would require authentication and authorization.

---

## No rate limiting

The analyze endpoint can trigger LLM calls.

A production deployment should protect it with:

```text
rate limiting
usage controls
authentication
possibly quotas
```

---

## No input-size limits

The current API does not enforce strong inquiry length/token limits.

Production systems should limit input size to control:

```text
cost
latency
abuse
context limits
```

---

## LLM-generated qualification is heuristic

A score such as:

```text
78/100
```

is not an objective mathematical measurement.

It is an LLM-based heuristic.

The human review step therefore remains important.

---

## Live AI tests can vary

A test such as:

```python
assert result.qualification_score >= 70
```

can become fragile because LLM behavior is not perfectly deterministic.

These tests are better considered:

```text
AI regression tests
```

rather than conventional deterministic unit tests.

---

## SQLite deployment limitations

SQLite is excellent for local development and small workloads.

For a production multi-user system, PostgreSQL would generally be preferable.

---

# 58. Current Scope

Intentionally not implemented:

```text
Authentication
Authorization
Multi-tenancy
RAG
MCP
Email integration
WhatsApp integration
CRM synchronization
Payments
Background workers
Streaming AI output
Pagination
Server-side search
Production observability
```

These are extension points, not missing requirements for the current MVP.

---

# 59. Where to Look When You Want to Change Something

This is one of the most useful ways to navigate the project.

| Goal                          | Main file                                           |
| ----------------------------- | --------------------------------------------------- |
| Change API endpoint behavior  | `app/api/routes/leads.py`                           |
| Add/change API contract       | `app/schemas/lead.py`                               |
| Change AI output schema       | `app/schemas/analysis.py`                           |
| Change workflow order         | `app/graph/graph.py`                                |
| Add an AI node                | `app/graph/nodes.py` + `graph.py`                   |
| Change AI behavior            | `app/graph/prompts.py`                              |
| Change workflow state         | `app/graph/state.py`                                |
| Change LLM provider/model     | `app/graph/nodes.py` / config                       |
| Change database schema        | `app/db/models.py`                                  |
| Change DB connection behavior | `app/db/database.py`                                |
| Change saving/listing logic   | `app/services/lead_service.py`                      |
| Change AI service boundary    | `app/services/llm_service.py`                       |
| Change environment settings   | `app/core/config.py`                                |
| Change app startup/CORS       | `app/main.py`                                       |
| Change API tests              | `tests/test_leads.py`                               |
| Change graph tests            | `tests/test_graph.py`                               |
| Change test DB setup          | `tests/conftest.py`                                 |
| Change frontend API calls     | `frontend/lib/api.ts`                               |
| Change frontend types         | `frontend/lib/types.ts`                             |
| Change analysis persistence   | `frontend/lib/analysis-draft.ts`                    |
| Change New Lead screen        | `frontend/app/leads/new/page.tsx` / `lead-form.tsx` |
| Change analysis review        | `analysis-review.tsx`                               |
| Change saved lead detail      | `lead-detail.tsx`                                   |
| Change history                | `lead-history.tsx` / `lead-table.tsx`               |
| Change dashboard              | `dashboard-view.tsx`                                |
| Change global styling         | `app/globals.css`                                   |

---

# 60. Recommended Study Order

Do not start by reading every file randomly.

Follow the system's execution path.

## Phase 1 — Understand the product

Understand:

```text
Inquiry
 ↓
AI analysis
 ↓
Human review
 ↓
Approval
 ↓
Database
```

You should be able to explain this without looking at the code.

---

## Phase 2 — Understand the API

Read:

```text
main.py
 ↓
api/v1/api.py
 ↓
api/routes/leads.py
```

Understand:

```text
How does HTTP reach the correct Python function?
```

---

## Phase 3 — Understand contracts

Read:

```text
schemas/lead.py
schemas/analysis.py
```

Understand:

```text
What enters the system?
What leaves the system?
What does each Pydantic model represent?
```

---

## Phase 4 — Understand persistence

Read:

```text
db/models.py
db/database.py
services/lead_service.py
```

Understand:

```text
How does Python data become SQLite data?
How does SQLite data become API data?
```

---

## Phase 5 — Understand the AI workflow

Read in this order:

```text
graph/state.py
        ↓
graph/prompts.py
        ↓
graph/nodes.py
        ↓
graph/graph.py
```

This is the most important part if your goal is to learn LangGraph.

---

## Phase 6 — Understand the AI service boundary

Read:

```text
services/llm_service.py
```

Understand why the API route does not directly own the workflow implementation.

---

## Phase 7 — Understand tests

Read:

```text
tests/conftest.py
tests/test_leads.py
tests/test_graph.py
```

Focus particularly on:

```text
mocking
patching
temporary databases
API contract tests
live LLM tests
```

---

## Phase 8 — Understand frontend integration

Read:

```text
frontend/lib/types.ts
frontend/lib/api.ts
frontend/components/leads/lead-form.tsx
frontend/components/leads/analysis-review.tsx
frontend/lib/analysis-draft.ts
```

Then move through:

```text
history
detail
dashboard
```

---

# 61. Questions You Should Be Able to Answer

If you genuinely understand LeadFlow, you should be able to answer these without opening the code.

## Product

* What problem does LeadFlow solve?
* Who is it designed for?
* Why doesn't analysis automatically save?
* Where does human approval happen?

## FastAPI

* How does a request reach `analyze_lead()`?
* What does `APIRouter` do?
* Why are API routes separate from services?
* What causes a 422 response?
* What causes a 404 response?
* Why return a generic 500 message?

## Pydantic

* Why use Pydantic models?
* What is `Literal` doing?
* Why validate `qualification_score` between 0 and 100?
* Why have separate request and response models?

## LangGraph

* What is `LeadState`?
* What is a node?
* What is an edge?
* What does `START` represent?
* What does `END` represent?
* What does `compile()` do?
* What does `invoke()` do?
* Where is the conditional branch?
* What causes the branch?
* Why use multiple nodes instead of one large prompt?

## LLM

* Why use `with_structured_output()`?
* Why use Pydantic models with the LLM?
* Why is temperature `0.0`?
* Why are prompts separated into `prompts.py`?
* Why have Python guardrails in addition to prompts?
* Why shouldn't the application trust every LLM output blindly?

## Database

* Why SQLite?
* Why are lists stored as JSON text?
* Why use parameterized SQL?
* Why close the connection?
* Why is `LeadListItem` smaller than `LeadResponse`?
* Why are timestamps stored as UTC ISO strings?

## Frontend

* Why does the frontend call FastAPI directly?
* Why is `lib/api.ts` useful?
* Why use `sessionStorage`?
* Why isn't unsaved analysis stored in SQLite?
* Why use TypeScript types that mirror the backend?

## Testing

* Why mock the LLM workflow in API tests?
* Why use a temporary database?
* Why patch `app.api.routes.leads.create_lead`?
* Which tests consume Groq quota?
* Why can live LLM tests be flaky?

## Production

* What would you change before deploying?
* Why would PostgreSQL be preferable?
* Why restrict CORS?
* Why add authentication?
* Why add rate limiting?
* Why add retries/timeouts?
* How would you abstract the LLM provider?
* How would you handle long-running AI workflows?

---

# 62. A Practical Exercise to Prove Understanding

A good next exercise is to add a new field end-to-end.

For example:

```text
urgency
```

You should trace it through the entire architecture:

```text
LLM output schema
        ↓
LeadState
        ↓
Graph node
        ↓
Final analysis result
        ↓
API schema
        ↓
Database column
        ↓
SQL INSERT
        ↓
SQL SELECT
        ↓
API response
        ↓
TypeScript type
        ↓
Frontend UI
```

This exercise forces you to understand the boundaries between every layer instead of memorizing individual files.

---

# 63. The Mental Model to Remember

The entire application can be reduced to this:

```text
                    LEADFLOW

Customer inquiry
       │
       ▼
┌───────────────┐
│   FastAPI     │
│ API contract  │
└───────┬───────┘
        │
        ▼
┌──────────────────────┐
│      LangGraph       │
│                      │
│ Extract              │
│   ↓                  │
│ Classify             │
│   ↓                  │
│ Qualify              │
│   ↓                  │
│ Find missing info    │
│   ↓                  │
│ Questions? ─────┐    │
│                 │    │
│ Draft ◄─────────┘    │
└──────────┬───────────┘
           │
           ▼
     Structured result
           │
           ▼
    Human review/edit
           │
           ▼
      Explicit approval
           │
           ▼
        SQLite
```

The key separation is:

```text
AI reasoning
     ≠
human decision
     ≠
database persistence
```

That separation is the core architectural idea behind LeadFlow.

---

# 64. One-Paragraph Technical Summary

LeadFlow is a full-stack AI lead qualification workspace built with Next.js, React, TypeScript, FastAPI, LangGraph, LangChain, Groq, Pydantic, and SQLite. A customer inquiry is submitted through the frontend to a FastAPI endpoint, where a six-node LangGraph workflow extracts information, classifies the project, evaluates qualification, identifies missing information, conditionally generates qualification questions, and drafts a customer response. Each AI stage uses Pydantic structured output, while Python-level filtering provides additional guardrails. The resulting analysis is returned to the frontend without being persisted. A human reviews and edits the result, then explicitly approves it through a separate save request. The backend validates the reviewed payload and stores it in SQLite. Automated tests cover the API, validation, persistence, graph structure, routing, and selected live AI behaviors using isolated temporary databases and mocked workflows where appropriate.

---

# 65. Final Learning Goal

The objective is **not** to memorize every line of LeadFlow.

The objective is to reach the point where you can look at the project and explain:

```text
Why is this file here?
What responsibility does it have?
Who calls it?
What data enters it?
What data leaves it?
Why is the next layer separate?
What would break if I changed it?
```

If you can answer those questions, you understand the architecture.

You do not need to have manually typed every line of the project for that understanding to be legitimate. Using AI to generate implementation is a productivity tool; understanding, testing, debugging, modifying, and being able to defend the resulting system is the engineering skill you are building.
