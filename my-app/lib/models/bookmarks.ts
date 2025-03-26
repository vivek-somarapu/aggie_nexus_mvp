import { query } from '../db';

export type UserBookmark = {
  id: string;
  user_id: string;
  bookmarked_user_id: string;
  saved_at: string;
};

export type ProjectBookmark = {
  id: string;
  user_id: string;
  project_id: string;
  saved_at: string;
};

export async function getUserBookmarks(userId: string): Promise<UserBookmark[]> {
  const result = await query(
    'SELECT * FROM user_bookmarks WHERE user_id = $1 ORDER BY saved_at DESC',
    [userId]
  );
  
  return result.rows;
}

export async function getProjectBookmarks(userId: string): Promise<ProjectBookmark[]> {
  const result = await query(
    'SELECT * FROM project_bookmarks WHERE user_id = $1 ORDER BY saved_at DESC',
    [userId]
  );
  
  return result.rows;
}

export async function isUserBookmarked(userId: string, bookmarkedUserId: string): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM user_bookmarks WHERE user_id = $1 AND bookmarked_user_id = $2',
    [userId, bookmarkedUserId]
  );
  
  return result.rows.length > 0;
}

export async function isProjectBookmarked(userId: string, projectId: string): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM project_bookmarks WHERE user_id = $1 AND project_id = $2',
    [userId, projectId]
  );
  
  return result.rows.length > 0;
}

export async function toggleUserBookmark(userId: string, bookmarkedUserId: string): Promise<boolean> {
  // Check if already bookmarked
  const exists = await isUserBookmarked(userId, bookmarkedUserId);
  
  if (exists) {
    // Remove bookmark
    await query(
      'DELETE FROM user_bookmarks WHERE user_id = $1 AND bookmarked_user_id = $2',
      [userId, bookmarkedUserId]
    );
    return false;
  } else {
    // Add bookmark
    await query(
      'INSERT INTO user_bookmarks (user_id, bookmarked_user_id) VALUES ($1, $2)',
      [userId, bookmarkedUserId]
    );
    return true;
  }
}

export async function toggleProjectBookmark(userId: string, projectId: string): Promise<{ action: 'added' | 'removed' }> {
  // First check if the bookmark exists
  const checkResult = await query(
    'SELECT id FROM project_bookmarks WHERE user_id = $1 AND project_id = $2',
    [userId, projectId]
  );
  
  if (checkResult.rows.length > 0) {
    // Bookmark exists, so remove it
    await query(
      'DELETE FROM project_bookmarks WHERE user_id = $1 AND project_id = $2',
      [userId, projectId]
    );
    return { action: 'removed' };
  } else {
    // Bookmark doesn't exist, so add it
    await query(
      'INSERT INTO project_bookmarks (id, user_id, project_id, saved_at) VALUES (gen_random_uuid(), $1, $2, NOW())',
      [userId, projectId]
    );
    return { action: 'added' };
  }
} 