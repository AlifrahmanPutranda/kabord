'use client';

import { useState } from 'react';

interface Category {
  id: number;
  boardId: string;
  name: string;
  color: string;
  position: number;
}

interface CategoriesManagerProps {
  boardId: string;
  categories: Category[];
  onCategoryAdded: (category: Category) => void;
  onCategoryUpdated: (category: Category) => void;
  onCategoryDeleted: (categoryId: number) => void;
}

export default function CategoriesManager({
  boardId,
  categories,
  onCategoryAdded,
  onCategoryUpdated,
  onCategoryDeleted,
}: CategoriesManagerProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        onCategoryAdded(data.category);
        setNewName('');
      } else {
        alert(data.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (categoryId: number) => {
    if (!editName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        onCategoryUpdated(data.category);
        setEditingId(null);
        setEditName('');
      } else {
        alert(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onCategoryDeleted(categoryId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="settings-manager">
      <div className="add-form">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add new category..."
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newName.trim()}
          className="btn btn-primary btn-sm"
        >
          Add
        </button>
      </div>

      <div className="items-list">
        {categories.map((category) => (
          <div key={category.id} className="settings-item">
            {editingId === category.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(category.id)}
                  autoFocus
                />
                <button
                  onClick={() => handleUpdate(category.id)}
                  disabled={loading}
                  className="btn btn-primary btn-sm"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className="item-name">{category.name}</span>
                <div className="item-actions">
                  <button
                    onClick={() => startEdit(category)}
                    className="btn-icon"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="btn-icon danger"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="empty-message">No categories yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}
