# Kabord - IT Task Kanban Board

Modern IT Task Management Kanban Board built with Next.js 14.

## Features

- 📋 Kanban board with 4 columns (To Do, In Progress, Review, Done)
- 🎯 Drag & drop tasks between columns
- 👥 User authentication system
- 📊 Real-time statistics dashboard
- 🔍 Advanced filtering and search
- 📱 Responsive design

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Authentication**: bcryptjs

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Default Login

| Username | Password |
|----------|----------|
| admin | Admin123 |

## Project Structure

```
kabord/
├── app/
│   ├── api/          # API routes
│   ├── board/        # Kanban board pages & components
│   └── register/     # Registration page
├── lib/              # Database & utilities
└── globals.css       # Global styles
```

## License

Proprietary - All rights reserved
