# Kabord - IT Task Kanban Board

Modern IT Task Management Kanban Board built with Next.js 14.

## Features

- 📋 **Multi-Board Support** - Create and manage multiple Kanban boards
- 🎯 **Drag & Drop** - Intuitive drag & drop tasks between columns
- 👥 **Team Collaboration** - Invite users to boards by username
- 📊 **Board Statistics** - Real-time task statistics per board
- 🔍 **Advanced Filtering** - Filter by priority, category, requester, assignee
- ⚙️ **Board Settings** - Customize categories and requesters per board
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Authentication**: Cookie-based with bcryptjs
- **Styling**: CSS Variables with responsive design

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

| Username | Password  |
|----------|-----------|
| admin    | Admin123  |

## User Roles & Permissions

| Action           | Owner | Member |
|------------------|-------|--------|
| Create/Edit Tasks| ✅    | ✅     |
| Archive Tasks    | ✅    | ✅     |
| Delete Tasks     | ✅    | ❌     |
| Invite Members   | ✅    | ❌     |
| Remove Members   | ✅    | ❌     |
| Manage Settings  | ✅    | ✅     |
| Delete Board     | ✅    | ❌     |

## Project Structure

```
kabord/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── boards/             # Board CRUD & settings
│   │   ├── invitations/        # Invitation management
│   │   └── tasks/              # Task operations
│   ├── board/
│   │   ├── [id]/               # Dynamic board view
│   │   │   ├── settings/       # Board settings page
│   │   │   └── BoardClient.tsx # Board client component
│   │   └── components/         # Shared board components
│   ├── dashboard/              # Dashboard with board list
│   └── register/               # Registration page
├── lib/
│   ├── db.ts                   # Database schema & migrations
│   ├── boards.ts               # Board operations
│   ├── board-members.ts        # Membership management
│   ├── board-settings.ts       # Categories & requesters
│   ├── invitations.ts          # Invitation handling
│   ├── tasks.ts                # Task operations
│   ├── session.ts              # Session management
│   └── permissions.ts          # Permission utilities
└── globals.css                 # Global styles
```

## Database Schema

### Core Tables
- **users** - User accounts
- **boards** - Kanban boards
- **board_members** - Board membership
- **board_invitations** - Pending invitations
- **board_categories** - Per-board categories
- **board_requesters** - Per-board requesters
- **tasks** - Task items
- **activity** - Task activity log

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration

### Boards
- `GET /api/boards` - List user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/[id]` - Get board details
- `PUT /api/boards/[id]` - Update board
- `DELETE /api/boards/[id]` - Delete board (owner only)

### Board Members
- `GET /api/boards/[id]/members` - List members
- `DELETE /api/boards/[id]/members/[userId]` - Remove member
- `POST /api/boards/[id]/invite` - Invite user by username

### Board Settings
- `GET/POST /api/boards/[id]/categories` - Category CRUD
- `GET/POST /api/boards/[id]/requesters` - Requester CRUD

### Tasks
- `GET /api/boards/[id]/tasks` - Get board tasks
- `POST /api/boards/[id]/tasks` - Create task
- `GET/PUT/DELETE /api/tasks/[id]` - Task operations

### Invitations
- `GET /api/invitations` - List pending invitations
- `POST /api/invitations/[id]/accept` - Accept invitation
- `POST /api/invitations/[id]/reject` - Reject invitation

## Keyboard Shortcuts

| Shortcut       | Action              |
|----------------|---------------------|
| `Ctrl/Cmd + K` | Create new task     |
| `Escape`       | Close modal         |
| `Ctrl/Cmd + N` | Create new board    |

## License

Proprietary - All rights reserved
