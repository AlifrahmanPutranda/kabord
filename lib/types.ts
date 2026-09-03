// Shared client-facing DTOs. Server pages and API routes shape their data
// into these before handing it to client components.

export interface UserDTO {
  id: number;
  username: string;
  role: string;
}

export interface BoardDTO {
  id: string;
  name: string;
  description: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  role?: 'owner' | 'member';
  memberCount?: number;
  taskCount?: number;
}

export interface ColumnDTO {
  id: string;
  name: string;
  position: number;
  wipLimit: number | null;
  isDone: boolean;
  taskCount?: number;
}

export interface ActivityDTO {
  id?: number;
  time: string;
  text: string;
  actor?: string | null;
}

export interface TaskDTO {
  id: string;
  boardId: string;
  number: number | null;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | string;
  status: string; // board column id (or legacy literal until Phase 2)
  position: number;
  requestedBy: string;
  assignee: string;
  dueDate: string;
  category: string;
  createdAt: string;
  archived: boolean;
  activity?: ActivityDTO[];
  subtasks?: SubtaskDTO[];
  comments?: CommentDTO[];
  links?: TaskLinkDTO[];
}

export interface SubtaskDTO {
  id: number;
  taskId: string;
  title: string;
  done: boolean;
  position: number;
}

export interface CommentDTO {
  id: number;
  taskId: string;
  body: string;
  createdAt: string;
  user: Pick<UserDTO, 'id' | 'username'>;
}

export interface TaskLinkDTO {
  id: number;
  provider: 'github' | 'jira';
  externalId: string;
  url: string;
}

export interface MemberDTO {
  id: number;
  boardId: string;
  userId: number;
  username: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface InvitationDTO {
  id: number;
  boardId: string;
  boardName: string;
  invitedByUsername: string;
  createdAt: string;
}

export interface PrefsDTO {
  theme: 'dark' | 'light';
  aiModel: string | null;
}
