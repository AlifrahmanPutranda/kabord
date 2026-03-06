export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  requestedBy: string;
  assignee: string;
  dueDate: string;
  category: string;
  createdAt: string;
  archived: boolean;
  activity: Activity[];
}

export interface Activity {
  time: string;
  text: string;
}

export interface Column {
  id: string;
  title: string;
  icon: string;
  color: string;
}

export interface Priority {
  id: string;
  label: string;
  color: string;
}

export interface DragDropContext {
  taskId: string;
  sourceColumnId: string;
}
