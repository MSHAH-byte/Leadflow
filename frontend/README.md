# LeadFlow Frontend

Next.js (App Router) + TypeScript + Tailwind frontend for the LeadFlow AI lead qualification workspace. It talks to the existing FastAPI backend over HTTP.

```bash
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm install
npm run dev
```

The backend must be running at the URL in `NEXT_PUBLIC_API_URL`. See [LEARNING.md](./LEARNING.md) for architecture, the API contract, running instructions and the end-to-end test.
