import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { isBoardMember } from '@/lib/boards';
import { updateCategory, deleteCategory } from '@/lib/board-settings';

// PUT /api/boards/[id]/categories/[catId] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, catId } = await params;
    const categoryId = parseInt(catId, 10);

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    if (!isBoardMember(id, user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, color } = body;

    const category = updateCategory(categoryId, { name, color }, id);

    if (!category) {
      return NextResponse.json({ error: 'Category not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/boards/[id]/categories/[catId] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, catId } = await params;
    const categoryId = parseInt(catId, 10);

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    if (!isBoardMember(id, user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const success = deleteCategory(categoryId, id);

    if (!success) {
      return NextResponse.json({ error: 'Category not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
