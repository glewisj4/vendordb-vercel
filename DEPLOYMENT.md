# LowesPro - Vercel Deployment Guide

This is a Vercel-compatible version of the LowesPro Vendor Management System. The app uses serverless API functions and connects to your Neon/Supabase PostgreSQL database.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A PostgreSQL database (Neon, Supabase, or any PostgreSQL provider)
3. Your database connection string (DATABASE_URL)

## Quick Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Push this folder to GitHub**
   - Create a new repository on GitHub
   - Push only the `vercel-app` folder contents to the repository

2. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect the Vite framework

3. **Configure Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add: `DATABASE_URL` = your PostgreSQL connection string
   
4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to vercel-app folder
cd vercel-app

# Install dependencies
npm install

# Deploy
vercel

# Follow the prompts to configure your project
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |

Example connection string:
```
postgresql://user:password@host:5432/database?sslmode=require
```

## Project Structure

```
vercel-app/
├── api/                    # Serverless API functions
│   ├── _lib/              # Shared database & schema
│   │   ├── db.ts          # Database connection
│   │   └── schema.ts      # Drizzle schema definitions
│   ├── vendors/           # Vendor endpoints
│   ├── representatives/   # Representative endpoints
│   ├── categories/        # Category endpoints
│   ├── brands/            # Brand endpoints
│   ├── pro-customers/     # Pro customer endpoints
│   ├── services/          # Services endpoints
│   └── trades/            # Trades endpoints
├── src/                   # React frontend
│   ├── components/        # UI components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities
│   └── hooks/             # Custom hooks
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies
└── vite.config.ts         # Vite configuration
```

## API Endpoints

All endpoints support standard REST methods:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/vendors` | GET, POST | List/create vendors |
| `/api/vendors/[id]` | GET, PATCH, DELETE | Single vendor operations |
| `/api/representatives` | GET, POST | List/create reps |
| `/api/representatives/[id]` | GET, PATCH, DELETE | Single rep operations |
| `/api/categories` | GET, POST | List/create categories |
| `/api/categories/[id]` | GET, PATCH, DELETE | Single category operations |
| `/api/brands` | GET, POST | List/create brands |
| `/api/pro-customers` | GET, POST | List/create pro customers |
| `/api/pro-customers/[id]` | GET, PATCH, DELETE | Single customer operations |
| `/api/trades` | GET, POST | List/create trades |
| `/api/services` | GET, POST | List/create services |

## Database Setup

If you need to set up a new database:

1. **Create a database** on Neon, Supabase, or your preferred provider

2. **Import the schema** using the SQL export from the main app:
   - Use `supabase_full_clean.sql` for complete setup
   - Or use `database_schema_only.sql` + `database_data_only.sql` separately

3. **Get your connection string** and add it to Vercel environment variables

## Extending the Frontend

The current frontend is a simplified dashboard. To add the full frontend:

1. Copy components from `client/src/components/` to `vercel-app/src/components/`
2. Copy pages from `client/src/pages/` to `vercel-app/src/pages/`
3. Update imports to use the new paths
4. Copy any additional hooks and utilities needed

## Troubleshooting

### Database Connection Issues
- Ensure your DATABASE_URL includes `?sslmode=require` for secure connections
- Check that your database allows connections from Vercel's IP ranges

### Build Errors
- Run `npm install` locally first to check for dependency issues
- Ensure all TypeScript errors are resolved before deploying

### API Not Working
- Check Vercel function logs in the dashboard
- Verify environment variables are set correctly
- Ensure database is accessible from Vercel

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Note: For local development, create a `.env` file with your DATABASE_URL.

## Support

This is a standalone deployment package. The original application remains unchanged in the main Replit project.
