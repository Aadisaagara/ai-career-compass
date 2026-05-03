# AI Career Compass Backend

Production-ready Node.js 20, Express 5, TypeScript REST API for authenticated job tracking, profile management, and Gemini-powered resume analysis.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Fill in `.env`:

```bash
PORT=4000
FRONTEND_URL=http://localhost:8080
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

Use the Supabase service role key on the server only. Do not expose it in browser code.

4. Run the API in development:

```bash
npm run dev
```

5. Build and run production output:

```bash
npm run build
npm start
```

## Authentication

All `/api/*` endpoints require a Supabase access token:

```bash
Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN
```

The server verifies the token with `supabase.auth.getUser(token)` and scopes all data access to the authenticated user.

## Health Check

```bash
curl http://localhost:4000/health
```

## AI Resume Analysis

`POST /api/process-ai`

Runs Gemini analysis. If `jobId` is included, the result is saved to that job's `generated_content`, and the submitted resume/job description are stored on the job.

```bash
curl -X POST http://localhost:4000/api/process-ai \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "11111111-1111-1111-1111-111111111111",
    "jobDescription": "We are hiring a Senior Full Stack Engineer with strong Node.js, React, PostgreSQL, API design, cloud deployment, automated testing, and cross-functional collaboration experience.",
    "resumeText": "Senior software engineer with 8 years of experience building production web applications with Node.js, TypeScript, React, PostgreSQL, REST APIs, CI/CD, automated testing, monitoring, and collaborative product delivery across engineering and design teams."
  }'
```

Response:

```json
{
  "matchScore": 88,
  "missingKeywords": ["cloud deployment"],
  "coverLetter": "Generated cover letter...",
  "tailoredSummary": "Generated summary...",
  "improvements": ["Add cloud deployment outcomes."]
}
```

## Jobs

`GET /api/jobs`

```bash
curl http://localhost:4000/api/jobs \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```

`POST /api/jobs`

```bash
curl -X POST http://localhost:4000/api/jobs \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Acme",
    "role_title": "Senior Full Stack Engineer",
    "status": "Saved",
    "job_description": "Build scalable product features with Node.js and React.",
    "original_resume_text": "Senior engineer resume text."
  }'
```

`PUT /api/jobs/:id`

```bash
curl -X PUT http://localhost:4000/api/jobs/11111111-1111-1111-1111-111111111111 \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Applied",
    "generated_content": {
      "matchScore": 88,
      "missingKeywords": ["cloud deployment"],
      "coverLetter": "Generated cover letter...",
      "tailoredSummary": "Generated summary...",
      "improvements": ["Add cloud deployment outcomes."]
    }
  }'
```

`DELETE /api/jobs/:id`

```bash
curl -X DELETE http://localhost:4000/api/jobs/11111111-1111-1111-1111-111111111111 \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```

## Profile

`GET /api/profile`

```bash
curl http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```

`PUT /api/profile`

Creates or updates the authenticated user's profile.

```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Ada Lovelace",
    "master_resume_text": "Principal engineer resume text...",
    "avatar_url": "https://example.com/avatar.png"
  }'
```

## Errors

Errors return JSON:

```json
{
  "error": "Human-readable error message"
}
```

Validation failures also include Zod details. Gemini failures return HTTP `502` with:

```json
{
  "error": "AI service unavailable"
}
```

