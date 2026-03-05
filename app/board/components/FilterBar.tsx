'use client';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterPriority: string;
  onPriorityChange: (priority: string) => void;
  filterCategory: string;
  onCategoryChange: (category: string) => void;
  filterRequester: string;
  onRequesterChange: (requester: string) => void;
  filterAssignee: string;
  onAssigneeChange: (assignee: string) => void;
  onNewTask: () => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  filterPriority,
  onPriorityChange,
  filterCategory,
  onCategoryChange,
  filterRequester,
  onRequesterChange,
  filterAssignee,
  onAssigneeChange,
  onNewTask,
}: Props) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks... (Ctrl+K to create new)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="filter-group filters">
        <select
          className="filter-select"
          value={filterPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="System">System</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="HR">HR</option>
          <option value="Access">Access</option>
          <option value="Finance">Finance</option>
          <option value="Marketing">Marketing</option>
          <option value="CRM">CRM</option>
          <option value="Estate">Estate</option>
          <option value="Other">Other</option>
        </select>

        <select
          className="filter-select"
          value={filterRequester}
          onChange={(e) => onRequesterChange(e.target.value)}
        >
          <option value="all">All Requesters</option>
          <option value="Pak Fiki">Pak Fiki</option>
          <option value="Pak Vic">Pak Vic</option>
          <option value="Pak Victor">Pak Victor</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Marketing">Marketing</option>
          <option value="CRM Team">CRM Team</option>
          <option value="Estate">Estate</option>
          <option value="Other">Other</option>
        </select>

        <select
          className="filter-select"
          value={filterAssignee}
          onChange={(e) => onAssigneeChange(e.target.value)}
        >
          <option value="all">All Assignees</option>
          <option value="Pak Fiki">Pak Fiki</option>
          <option value="IT Team">IT Team</option>
          <option value="Dev Team">Dev Team</option>
          <option value="Ryan">Ryan</option>
          <option value="HR & IT">HR & IT</option>
          <option value="Pak Victor">Pak Victor</option>
        </select>
      </div>

      <button className="btn btn-primary btn-new-task" onClick={onNewTask}>
        <span className="btn-icon">+</span>
        <span>New Task</span>
      </button>
    </div>
  );
}
