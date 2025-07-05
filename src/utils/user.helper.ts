/**
 * 🎯 User-specific transformation helpers
 * Owned by: User module team
 * Avoids merge conflicts with other modules
 */
export class UserHelper {
  /**
   * ✨ Transform user's posts from query results
   */
  static transformUserPost(row: any, prefix: string = 'post_'): any {
    if (!row[`${prefix}id`]) return null;

    return {
      id: row[`${prefix}id`],
      title: row[`${prefix}title`],
      content: row[`${prefix}content`],
      published: row[`${prefix}published`],
      createdAt: new Date(row[`${prefix}created_at`]),
    };
  }

  /**
   * ✨ Transform user's profile from query results
   */
  static transformUserProfile(row: any, prefix: string = 'profile_'): any {
    if (!row[`${prefix}id`]) return null;

    return {
      id: row[`${prefix}id`],
      bio: row[`${prefix}bio`],
      ...(row[`${prefix}avatar`] && { avatar: row[`${prefix}avatar`] }),
      ...(row[`${prefix}date_of_birth`] && {
        dateOfBirth: new Date(row[`${prefix}date_of_birth`]),
      }),
      ...(row[`${prefix}phone`] && { phone: row[`${prefix}phone`] }),
      ...(row[`${prefix}address`] && { address: row[`${prefix}address`] }),
    };
  }

  /**
   * ✨ Build SELECT clause for user with posts
   */
  static buildUserWithPostsSelect(): string {
    return `
      u.*,
      p.id as post_id,
      p.title as post_title,
      p.content as post_content,
      p.published as post_published,
      p.created_at as post_created_at
    `;
  }

  /**
   * ✨ Build SELECT clause for user with profile
   */
  static buildUserWithProfileSelect(): string {
    return `
      u.*,
      pr.id as profile_id,
      pr.bio as profile_bio,
      pr.avatar as profile_avatar,
      pr.date_of_birth as profile_date_of_birth,
      pr.phone as profile_phone,
      pr.address as profile_address
    `;
  }

  /**
   * ✨ Filter non-null posts from results
   */
  static filterValidPosts(rows: any[]): any[] {
    return rows.map(row => this.transformUserPost(row)).filter(post => post !== null);
  }

  /**
   * ✨ Build user stats queries
   */
  static buildPostCountSelect(): string {
    return `
      u.*, COUNT(p.id) as post_count
    `;
  }
}
