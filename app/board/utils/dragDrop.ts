export interface DropResult {
  taskId: string;
  sourceColumnId: string;
  sourceIndex?: number;
  destinationColumnId?: string;
  destinationIndex?: number;
}

export interface DragDropContextType {
  taskId: string;
  sourceColumnId: string;
}

export interface DragEventData {
  taskId: string;
  sourceColumnId: string;
  element: HTMLElement;
}

// Simple drag and drop state management
export const createDragDropContext = (): DragDropManager => {
  return {
    isDragging: false,
    draggedTaskId: null,
    sourceColumnId: null,
    overColumnId: null,
  };
};

export interface DragDropManager {
  isDragging: boolean;
  draggedTaskId: string | null;
  sourceColumnId: string | null;
  overColumnId: string | null;
}

// Handle drag start
export const handleDragStart = (
  taskId: string,
  columnId: string,
  element: HTMLElement,
  setDragging: (data: { taskId: string; columnId: string; element: HTMLElement } | null) => void
) => {
  element.setAttribute('draggable', 'true');
  element.style.opacity = '0.5';
  setDragging({ taskId, columnId, element });
};

// Handle drag over
export const handleDragOver = (e: React.DragEvent, columnId: string) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

// Handle drag enter
export const handleDragEnter = (
  e: React.DragEvent,
  columnId: string,
  setOverColumn: (id: string) => void
) => {
  e.preventDefault();
  setOverColumn(columnId);
};

// Handle drag leave
export const handleDragLeave = (
  e: React.DragEvent,
  setOverColumn: (id: string | null) => void
) => {
  e.preventDefault();
  setOverColumn(null);
};

// Handle drop
export const handleDrop = (
  e: React.DragEvent,
  targetColumnId: string,
  draggedData: { taskId: string; columnId: string } | null,
  onDrop: (taskId: string, sourceColumnId: string, targetColumnId: string, index: number) => void,
  clearDragging: () => void
) => {
  e.preventDefault();

  if (!draggedData) return;

  // Calculate drop index based on mouse position
  const column = e.currentTarget as HTMLElement;
  const taskCards = column.querySelectorAll('[data-task-id]');
  let dropIndex = taskCards.length;

  for (let i = 0; i < taskCards.length; i++) {
    const card = taskCards[i];
    const rect = card.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    if (e.clientY < midPoint) {
      dropIndex = i;
      break;
    }
  }

  onDrop(draggedData.taskId, draggedData.columnId, targetColumnId, dropIndex);
  clearDragging();
};

// Handle drag end (cleanup)
export const handleDragEnd = (
  element: HTMLElement,
  clearDragging: () => void
) => {
  if (element) {
    element.style.opacity = '1';
    element.setAttribute('draggable', 'false');
  }
  clearDragging();
};
