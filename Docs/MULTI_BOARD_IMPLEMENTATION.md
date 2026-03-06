# Multi-Board Kanban Implementation Plan

## Context

Transformasi aplikasi Kabord dari single-board menjadi multi-board system dengan fitur:
- Setiap user bisa memiliki multiple boards
- Board-specific settings (categories, requesters, assignees)
- Sistem invitation untuk invite member lain
- Permission management (owner vs member)

---

## 1. Database Schema Design

### 1.1 New Tables

```sql
-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ownerId INTEGER NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE
);

-- Board Members
CREATE TABLE IF NOT EXISTS board_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  boardId TEXT NOT NULL,
  userId INTEGER NOT NULL,
  role TEXT DEFAULT 'member',
  joinedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
  FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(boardId, userId)
);

-- Board Invitations
CREATE TABLE IF NOT EXISTS board_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  boardId TEXT NOT NULL,
  invitedUserId INTEGER NOT NULL,
  invitedByUserId INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  respondedAt TEXT,
  FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
  FOREIGN KEY(invitedUserId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(invitedByUserId) REFERENCES users(id) ON DELETE CASCADE
);

-- Board Categories
CREATE TABLE IF NOT EXISTS board_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  boardId TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#64748b',
  position INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
  UNIQUE(boardId, name)
);

-- Board Requesters
CREATE TABLE IF NOT EXISTS board_requesters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  boardId TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(boardId) REFERENCES boards(id) ON DELETE CASCADE,
  UNIQUE(boardId, name)
);
```

### 1.2 Modified Tables

```sql
-- Tasks table - add boardId
ALTER TABLE tasks ADD COLUMN boardId TEXT;
ALTER TABLE activity ADD COLUMN boardId TEXT;
```

---

## 2. API Endpoints

### Board Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | List user's boards |
| POST | `/api/boards` | Create new board |
| GET | `/api/boards/[id]` | Get board details |
| PUT | `/api/boards/[id]` | Update board |
| DELETE | `/api/boards/[id]` | Delete board (owner only) |

### Membership Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards/[id]/members` | List members |
| POST | `/api/boards/[id]/invite` | Invite user |
| DELETE | `/api/boards/[id]/members/[userId]` | Remove member |

### Invitation Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invitations` | List user invitations |
| PUT | `/api/invitations/[id]/accept` | Accept invitation |
| PUT | `/api/invitations/[id]/reject` | Reject invitation |

### Settings Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/boards/[id]/categories` | Categories CRUD |
| GET/POST | `/api/boards/[id]/requesters` | Requesters CRUD |

---

## 3. File Structure

```
app/
  dashboard/
    page.tsx
    DashboardClient.tsx
    components/
      BoardList.tsx
      BoardCard.tsx
      CreateBoardModal.tsx
      InvitationList.tsx
      InvitationCard.tsx
  board/
    [id]/
      page.tsx
      settings/
        page.tsx
        SettingsClient.tsx
        components/
          CategoriesManager.tsx
          RequestersManager.tsx
          MembersManager.tsx
          InviteMemberModal.tsx
          DangerZone.tsx
  api/
    boards/
      route.ts
      [id]/
        route.ts
        members/route.ts
        invite/route.ts
        categories/route.ts
        requesters/route.ts
        tasks/route.ts
    invitations/
      route.ts
      [id]/
        accept/route.ts
        reject/route.ts
lib/
  boards.ts
  board-members.ts
  invitations.ts
  board-settings.ts
  permissions.ts
```

---

## 4. Permission Matrix

| Action | Owner | Member |
|--------|-------|--------|
| View board | Yes | Yes |
| Create/Edit task | Yes | Yes |
| Delete task | Yes | **No** |
| Delete board | Yes | No |
| Manage settings | Yes | Yes |
| Invite members | Yes | No |
| Remove members | Yes | No |

---

## 5. Detailed Task List

### Phase 1: Database Foundation

#### Task 1.1: Create Database Schema
- [ ] Add new tables to `lib/db.ts` (boards, board_members, board_invitations, board_categories, board_requesters)
- [ ] Add boardId column to tasks table
- [ ] Add boardId column to activity table
- [ ] Create migration function for existing data

#### Task 1.2: Create Board Library Functions
- [ ] Create `lib/boards.ts` with getUserBoards, getBoardById, createBoard, updateBoard, deleteBoard
- [ ] Create `lib/permissions.ts` with isBoardMember, isBoardOwner, canDeleteTask

---

### Phase 2: Dashboard & Board List

#### Task 2.1: Create Dashboard Page
- [ ] Create `app/dashboard/page.tsx` (server component)
- [ ] Create `app/dashboard/DashboardClient.tsx` (client component)
- [ ] Create `BoardList.tsx` component
- [ ] Create `BoardCard.tsx` component
- [ ] Create `CreateBoardModal.tsx` component

#### Task 2.2: Create Board API Endpoints
- [ ] Create `app/api/boards/route.ts` (GET list, POST create)
- [ ] Create `app/api/boards/[id]/route.ts` (GET, PUT, DELETE)

#### Task 2.3: Update Login Redirect
- [ ] Change redirect from `/board` to `/dashboard` in login page

---

### Phase 3: Board Membership System

#### Task 3.1: Create Membership Library
- [ ] Create `lib/board-members.ts` with getBoardMembers, inviteMember, removeMember
- [ ] Create `lib/invitations.ts` with getUserInvitations, acceptInvitation, rejectInvitation

#### Task 3.2: Create Invitation API Endpoints
- [ ] Create `app/api/invitations/route.ts` (GET user's invitations)
- [ ] Create `app/api/invitations/[id]/accept/route.ts`
- [ ] Create `app/api/invitations/[id]/reject/route.ts`

#### Task 3.3: Create Board Member Management API
- [ ] Create `app/api/boards/[id]/members/route.ts` (GET)
- [ ] Create `app/api/boards/[id]/invite/route.ts` (POST)
- [ ] Create `app/api/boards/[id]/members/[userId]/route.ts` (DELETE)

#### Task 3.4: Create Invitation UI
- [ ] Create `InvitationList.tsx` component
- [ ] Create `InvitationCard.tsx` component
- [ ] Add invitation section to Dashboard

---

### Phase 4: Board-Specific Settings

#### Task 4.1: Create Settings Library
- [ ] Create `lib/board-settings.ts` with categories and requesters CRUD

#### Task 4.2: Create Category Management
- [ ] Create `app/api/boards/[id]/categories/route.ts` (GET, POST)
- [ ] Create `app/api/boards/[id]/categories/[catId]/route.ts` (PUT, DELETE)
- [ ] Create `CategoriesManager.tsx` component

#### Task 4.3: Create Requester Management
- [ ] Create `app/api/boards/[id]/requesters/route.ts` (GET, POST)
- [ ] Create `app/api/boards/[id]/requesters/[reqId]/route.ts` (PUT, DELETE)
- [ ] Create `RequestersManager.tsx` component

#### Task 4.4: Create Settings Page
- [ ] Create `app/board/[id]/settings/page.tsx`
- [ ] Create `app/board/[id]/settings/SettingsClient.tsx`
- [ ] Create `MembersManager.tsx` component
- [ ] Create `InviteMemberModal.tsx` component
- [ ] Create `DangerZone.tsx` component (delete board - owner only)

---

### Phase 5: Task Scoping

#### Task 5.1: Modify Task Library
- [ ] Update `lib/tasks.ts` - add boardId parameter to getAllTasks
- [ ] Add getTasksByBoard function
- [ ] Add board membership checks to task operations

#### Task 5.2: Modify Task API Endpoints
- [ ] Create `app/api/boards/[id]/tasks/route.ts` (GET board tasks, POST create)
- [ ] Modify `app/api/tasks/[id]/route.ts` - add board membership check
- [ ] Add owner-only check for DELETE task

#### Task 5.3: Modify Board Page
- [ ] Rename `app/board/page.tsx` to `app/board/[id]/page.tsx`
- [ ] Fetch board-specific data (categories, requesters, members)
- [ ] Pass dynamic data to BoardClient

#### Task 5.4: Update Board Client
- [ ] Modify `BoardClient.tsx` to accept boardId prop
- [ ] Add settings link to header
- [ ] Update to use dynamic categories/requesters/assignees

---

### Phase 6: UI Polish & Navigation

#### Task 6.1: Update Header Component
- [ ] Add breadcrumb navigation (Dashboard > Board Name)
- [ ] Add "All Boards" link
- [ ] Add "Settings" link for current board

#### Task 6.2: Update Filter Components
- [ ] Modify `FilterBar.tsx` to accept dynamic categories/requesters props
- [ ] Remove hardcoded values

#### Task 6.3: Update Task Modals
- [ ] Modify `TaskCreateModal.tsx` to use dynamic data
- [ ] Modify `TaskEditModal.tsx` to use dynamic data
- [ ] Modify `TaskDetailModal.tsx` - show delete button only for owner

#### Task 6.4: Add CSS Styles
- [ ] Add dashboard styles to globals.css
- [ ] Add settings page styles to globals.css
- [ ] Add invitation card styles to globals.css

---

### Phase 7: Migration & Testing

#### Task 7.1: Create Migration Script
- [ ] Create default board for existing tasks
- [ ] Migrate hardcoded categories to board_categories
- [ ] Migrate hardcoded requesters to board_requesters
- [ ] Add all existing users as members of default board

#### Task 7.2: End-to-End Testing
- [ ] Test: User creates new board
- [ ] Test: User invites another user
- [ ] Test: User accepts/rejects invitation
- [ ] Test: Member can create/edit tasks
- [ ] Test: Member CANNOT delete tasks
- [ ] Test: Owner can delete tasks
- [ ] Test: Owner can delete board
- [ ] Test: Categories/requesters are board-specific

---

## 6. Verification Checklist

- [ ] User can create multiple boards
- [ ] User can see list of owned and shared boards
- [ ] Board owner can invite users by username
- [ ] Invited users can accept/reject invitations
- [ ] Board members can CRUD tasks
- [ ] Only board owner can DELETE tasks
- [ ] Each board has independent categories/requesters
- [ ] Assignee dropdown shows board members
- [ ] Navigation works correctly (dashboard <-> board <-> settings)
- [ ] Existing data migrated successfully

---

## Critical Files to Modify

1. `lib/db.ts` - Database schema
2. `lib/tasks.ts` - Add board scoping
3. `app/board/page.tsx` → `app/board/[id]/page.tsx`
4. `app/board/BoardClient.tsx` - Add board context
5. `app/board/components/FilterBar.tsx` - Dynamic filters
6. `app/page.tsx` - Change redirect to /dashboard
