'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, CheckSquare, GitBranch, Layers } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatShortDate, dueStatus } from '@/lib/client/dates';
import type { TaskDTO } from '@/lib/types';

const PRIORITY_LABEL: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export function TaskCard({
  task,
  selected,
  onSelect,
  overlay = false,
}: {
  task: TaskDTO;
  selected?: boolean;
  onSelect?: (task: TaskDTO) => void;
  overlay?: boolean;
}) {
  const sortable = useSortable({ id: task.id, data: { type: 'task', columnId: task.status } });
  const style = overlay ? undefined : { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition };

  const due = dueStatus(task.dueDate);
  const doneSubtasks = task.subtasks?.filter(s => s.done).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  const inner = (
    <>
      <div className="kb-taskcard__toprow">
        <span className="kb-taskcard__key">{task.number != null ? `KAB-${task.number}` : task.id.slice(0, 8)}</span>
      </div>
      <div className="kb-taskcard__title">{task.title}</div>
      <div className="kb-taskcard__chips">
        <span className={`kb-prioritychip kb-prioritychip--${task.priority}`}>
          <span className="kb-badge__dot" />
          {PRIORITY_LABEL[task.priority] || task.priority}
        </span>
        {task.category && (
          <span className="kb-badge">{task.category}</span>
        )}
        {task.links?.map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="kb-linkbadge"
            onClick={e => e.stopPropagation()}
            title={`${link.provider}: ${link.externalId}`}
          >
            {link.provider === 'github' ? <GitBranch size={10} /> : <Layers size={10} />}
            {link.externalId.length > 18 ? link.externalId.slice(0, 18) + '…' : link.externalId}
          </a>
        ))}
      </div>
      {(totalSubtasks > 0 || task.dueDate || task.assignee) && (
        <div className="kb-taskcard__foot">
          {task.dueDate && (
            <span
              className={`kb-taskcard__due ${due === 'overdue' ? 'kb-taskcard__due--overdue' : ''} ${due === 'soon' || due === 'today' ? 'kb-taskcard__due--soon' : ''}`}
            >
              <CalendarDays size={11} />
              {formatShortDate(task.dueDate)}
            </span>
          )}
          {totalSubtasks > 0 && (
            <span className="kb-taskcard__subtasks" title={`${doneSubtasks}/${totalSubtasks} subtasks done`}>
              <CheckSquare size={11} />
              {doneSubtasks}/{totalSubtasks}
            </span>
          )}
          <span className="kb-taskcard__foot-spacer" />
          {task.assignee && <Avatar name={task.assignee} size="sm" />}
        </div>
      )}
    </>
  );

  if (overlay) {
    return (
      <div className="kb-taskcard kb-dragoverlay-card" data-selected={selected ? 'true' : 'false'}>
        {inner}
      </div>
    );
  }

  return (
    <button
      ref={sortable.setNodeRef}
      style={style}
      className={`kb-taskcard ${sortable.isDragging ? 'kb-taskcard--dragging' : ''}`}
      data-selected={selected ? 'true' : 'false'}
      onClick={() => onSelect?.(task)}
      aria-label={`Task ${task.number != null ? 'KAB-' + task.number : ''}: ${task.title}`}
      {...sortable.attributes}
      {...sortable.listeners}
    >
      {inner}
    </button>
  );
}
