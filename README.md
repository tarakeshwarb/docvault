# DocVault

**DocVault** is an enterprise-grade Academic Compliance & Workflow Automation platform. Built with Next.js, PostgreSQL (Supabase), and Cloudflare R2, it digitizes academic auditing, role-based document collection, and bulk data processing.

## 🚀 Key Features

- **Complex RBAC (Role-Based Access Control):** 6 distinct administrative tiers (Admin, HOD, Audit Professor, Course Coordinator, Secondary Coordinator, Faculty) with rigidly scoped permissions and custom dashboard views.
- **Enterprise Workflow Automation:** Automates the collection, status tracking, and compliance auditing of academic course files.
- **ETL Data Processing:** Built-in spreadsheet parsers (`xlsx`) to extract, validate, and inject bulk faculty assignments and student grading data directly into relational PostgreSQL tables.
- **Secure Document Vault:** Direct-to-cloud file uploads leveraging Cloudflare R2 (S3-compatible object storage) with real-time in-browser document previews for Word, Excel, PPT, and PDF files.
- **Live Auditing & Analytics:** Real-time completion tracking, granular submission logs, and dynamic progress aggregations for Department Heads and Audit Professors.

## 🛠 Tech Stack

- **Framework:** Next.js 14+ (App Router, Server Actions)
- **Database:** PostgreSQL (via Supabase)
- **Storage:** Cloudflare R2 Object Storage
- **Styling:** Tailwind CSS / Vanilla CSS
- **Data Processing:** SheetJS (`xlsx`) for bulk data ingestion

## ⚙️ Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Database Setup:**
   Run the schema migrations found in `supabase/schema.sql` against your PostgreSQL instance.

3. **Environment Variables:**
   Copy `.env.example` to `.env.local` and configure your credentials:
   ```env
   DATABASE_URL=
   R2_ENDPOINT=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET=
   R2_PUBLIC_BASE_URL=
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🌐 Deployment

This application is optimized for Vercel. Ensure all environment variables are securely mapped in your Vercel project settings prior to deployment.
