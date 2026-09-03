'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Dropdown, DropdownItem, DropdownSep } from '@/components/ui/Dropdown';
import { TaskCard } from './TaskCard';
import type { ColumnDTO, TaskDTO } from '@/lib/types';

export function Column({
  column,
  tasks,
  selectedTaskId,
  isOwner,
  onSelectTask,
  onAddTask,
  onEditColumn,
  onDeleteColumn,
}: {
  column: ColumnDTO & { taskCount?: number };
  tasks: TaskDTO[];
  selectedTaskId: string | null;
  isOwner: boolean;
  onSelectTask: (task: TaskDTO) => void;
  onAddTask: (columnId: string) => void;
  onEditColumn: (column: ColumnDTO) => void;
  onDeleteColumn: (column: ColumnDTO) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column' } });
  const overLimit = column.wipLimit !== null && column.wipLimit !== undefined && tasks.length > column.wipLimit;

  return (
    <div className={`kb-column ${isOver ? 'kb-column--dragover' : ''}`}>
      <div className="kb-column__head">
        <span className="kb-column__name">{column.name}</span>
        <span className="kb-column__count">{tasks.length}</span>
        {column.wipLimit !== null && column.wipLimit !== undefined && (
          <span className={`kb-column__wip ${overLimit ? 'kb-column__wip--over' : ''}`} title="Work-in-progress limit">
            WIP {tasks.length}/{column.wipLimit}
          </span>
        )}
        <span className="kb-column__spacer" />
        <button className="kb-iconbtn kb-iconbtn--sm" aria-label={`Add task to ${column.name}`} title="Add task" onClick={() => onAddTask(column.id)}>
          <Plus size={14} />
        </button>
        <Dropdown
          trigger={
            <span className="kb-iconbtn kb-iconbtn--sm" role="button" aria-label={`${column.name} options`}>
              <MoreHorizontal size={14} />
            </span>
          }
        >
          <DropdownItem onClick={() => onEditColumn(column)}>Edit column</DropdownItem>
          {isOwner && (
            <>
              <DropdownSep />
              <DropdownItem danger onClick={() => onDeleteColumn(column)}>
                Delete column
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>

      <div className="kb-column__list" ref={setNodeRef}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} selected={selectedTaskId === task.id} onSelect={onSelectTask} />
          ))}
        </SortableContext>
        {tasks.length === 0 && <div className="kb-column__empty">Drop tasks here</div>}
      </div>
    </div>
  );
}
