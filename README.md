# AI Career Compass

AI Career Compass is a comprehensive, AI-powered suite designed to streamline the job application process. It helps candidates manage their resumes, tailor them to specific job descriptions using state-of-the-art AI, and track their application progress—all in one place.

![Preview](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.png) <!-- Replace with actual screenshot if available -->

## 🚀 Features

- **Resume Vault**: Securely upload, store, and manage multiple versions of your resume.
- **AI Resume Tailoring**: Leverages **Gemini 2.5 Flash** to analyze job descriptions and rewrite your resume for maximum impact.
- **ATS Match Scoring**: Get real-time estimates of how well your resume matches a job description, including missing keywords.
- **Professional PDF Generation**: Export your tailored resumes and cover letters as stunning, designer-quality PDFs.
- **Job Tracker**: Keep a history of every job you've applied for along with the specific resume version used.
- **Modern Dashboard**: A clean, responsive interface built with React, Tailwind CSS, and Shadcn UI.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS & Framer Motion
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **State Management**: TanStack Query & Hooks

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 5 (TypeScript)
- **AI Integration**: Google Generative AI (Gemini 2.5 Flash)
- **Validation**: Zod
- **Database & Auth**: Supabase
- **PDF Parsing**: pdf-parse

## 📋 Prerequisites

- Node.js (v20 or higher)
- npm or pnpm
- A Supabase Project (URL and Keys)
- A Google AI Studio API Key (for Gemini)

## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-career-compass.git
cd ai-career-compass
```

### 2. Frontend Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:4000
```

Install and run:
```bash
npm install
npm run dev
```

### 3. Backend Setup
Navigate to the `backend` folder and create a `.env` file:
```bash
cd backend
# Create .env and add:
PORT=4000
FRONTEND_URL=http://localhost:8080
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

Install and run:
```bash
npm install
npm run dev
```

## 📂 Project Structure

```
├── src/                # Frontend source
│   ├── components/     # UI components (Shadcn)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API and PDF logic
│   ├── routes/         # TanStack Router pages
│   └── styles.css      # Global styles
├── backend/            # Express server
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # AI and DB logic
│   │   └── index.ts    # Server entry point
│   └── data/           # Local JSON storage (for resumes)
└── README.md
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
