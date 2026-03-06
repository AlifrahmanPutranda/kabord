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
  categories?: string[];
  requesters?: string[];
  assignees?: string[];
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
  categories = [],
  requesters = [],
  assignees = [],
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
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterRequester}
          onChange={(e) => onRequesterChange(e.target.value)}
        >
          <option value="all">All Requesters</option>
          {requesters.map((req) => (
            <option key={req} value={req}>{req}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterAssignee}
          onChange={(e) => onAssigneeChange(e.target.value)}
        >
          <option value="all">All Assignees</option>
          {assignees.map((assignee) => (
            <option key={assignee} value={assignee}>{assignee}</option>
          ))}
        </select>
      </div>

      <button className="btn btn-primary btn-new-task" onClick={onNewTask}>
        <span className="btn-icon">+</span>
        <span>New Task</span>
      </button>
    </div>
  );
}
