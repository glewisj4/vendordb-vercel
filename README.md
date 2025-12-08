# LowesPro Vendor Management - Vercel Edition

A comprehensive vendor management system for the construction industry, deployed on Vercel.

## Features

- **Vendor Management**: Track vendors with contact info, categories, and services
- **Sales Representatives**: Manage sales rep contacts linked to vendors  
- **Pro Customers**: Customer profiles with trade preferences and payment options
- **Categories & Services**: Organize vendors by category and service offerings
- **Brand Management**: Track product brands and vendor associations
- **Trade Dashboard**: Analytics by customer trade/specialty

## Quick Start

### Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variable: `DATABASE_URL` = your PostgreSQL connection string
5. Deploy

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |

Example: `postgresql://user:password@host:5432/database?sslmode=require`

## Local Development

```bash
# Install dependencies
npm install

# Create .env file with DATABASE_URL
cp .env.example .env

# Start development server
npm run dev
```

## Project Structure

```
vercel-app/
├── api/                    # Serverless API functions
│   ├── _lib/              # Database connection
│   ├── vendors/           # Vendor endpoints
│   ├── representatives/   # Rep endpoints
│   ├── categories/        # Category endpoints
│   ├── brands/            # Brand endpoints
│   ├── pro-customers/     # Customer endpoints
│   ├── services/          # Service endpoints
│   └── trades/            # Trade endpoints
├── src/                   # React frontend
│   ├── components/        # UI components
│   ├── pages/             # Route pages
│   ├── lib/               # Utilities
│   └── hooks/             # React hooks
├── shared/                # Shared TypeScript types
└── vercel.json            # Vercel configuration
```

## Database Setup

This app requires a PostgreSQL database. You can use:
- Neon Database (recommended for Vercel)
- Supabase
- Any PostgreSQL provider

Use the SQL export files in the parent project to set up your database schema.

## Tech Stack

- **Frontend**: React, Tailwind CSS, TanStack Query
- **Backend**: Vercel Serverless Functions
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: Wouter

## License

Private - All rights reserved.
