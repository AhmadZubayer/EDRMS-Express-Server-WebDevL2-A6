/**
 * @openapi
 * /api/community-posts:
 *   get:
 *     tags:
 *       - Community Post
 *     summary: List community posts (public)
 *     description: Anonymous users see only POSTED posts. When a valid token is sent, the caller also sees their own ARCHIVED posts. Each post includes per-type reaction counts and the comment count.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Case-insensitive match on title or body
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, bumpedAt, title]
 *           default: bumpedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns { data, meta } with paginated community posts
 *       400:
 *         description: Invalid query parameters
 *   post:
 *     tags:
 *       - Community Post
 *     summary: Create a community post (multipart, up to 10 media files)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, body]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: Safe drinking water available at Mirpur relief camp
 *               body:
 *                 type: string
 *                 example: Clean water and dry food are being distributed near Mirpur-10 until 8 PM.
 *               files:
 *                 type: array
 *                 maxItems: 10
 *                 description: JPEG, PNG, MP4 or MKV files, uploaded to Cloudinary
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Community post created successfully
 *       400:
 *         description: Invalid post data or unsupported file type
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account is blocked
 */

/**
 * @openapi
 * /api/community-posts/{id}:
 *   get:
 *     tags:
 *       - Community Post
 *     summary: Get a community post by id (public)
 *     description: Archived posts are visible only to their author or an admin (send a token).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns the post with reaction counts and comment count
 *       400:
 *         description: Invalid post id
 *       403:
 *         description: Post is archived and the caller is not the author
 *       404:
 *         description: Community post not found
 *   patch:
 *     tags:
 *       - Community Post
 *     summary: Update my community post (author only, multipart)
 *     description: New files are appended to the existing media.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               body:
 *                 type: string
 *               files:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Community post updated successfully
 *       400:
 *         description: Invalid data, nothing to update or unsupported file type
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Caller is not the post author
 *       404:
 *         description: Community post not found
 *   delete:
 *     tags:
 *       - Community Post
 *     summary: Delete a community post (author or admin, moved to trash)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post soft-deleted and moved to trash for 30 days
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Caller is neither the author nor an admin
 *       404:
 *         description: Community post not found
 */

/**
 * @openapi
 * /api/community-posts/{id}/comments:
 *   get:
 *     tags:
 *       - Community Post
 *     summary: List comments of a post (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Returns { data, meta } with paginated comments
 *       404:
 *         description: Community post not found
 *   post:
 *     tags:
 *       - Community Post
 *     summary: Add a comment to a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Thank you for sharing, we are on our way with supplies.
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid comment
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: Community post not found
 */

/**
 * @openapi
 * /api/community-posts/{id}/comments/{commentId}:
 *   delete:
 *     tags:
 *       - Community Post
 *     summary: Delete a comment (comment author, post author or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Caller may not delete this comment
 *       404:
 *         description: Post or comment not found
 */

/**
 * @openapi
 * /api/community-posts/{id}/status:
 *   patch:
 *     tags:
 *       - Community Post
 *     summary: Change post status
 *     description: The author or an admin may set POSTED or ARCHIVED. Only an admin may set FLAGGED, HIDDEN or REMOVED, or change a removed post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [POSTED, FLAGGED, HIDDEN, ARCHIVED, REMOVED]
 *     responses:
 *       200:
 *         description: Post status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Caller may not set this status
 *       404:
 *         description: Community post not found
 */

/**
 * @openapi
 * /api/community-posts/{id}/bump:
 *   patch:
 *     tags:
 *       - Community Post
 *     summary: Bump my post to the top of the feed (author only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post bumped successfully
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Caller is not the post author
 *       404:
 *         description: Community post not found
 */

/**
 * @openapi
 * /api/community-posts/{id}/react:
 *   post:
 *     tags:
 *       - Community Post
 *     summary: React to a post (one reaction per user)
 *     description: Sending the same reaction again removes it; a different type replaces the existing reaction.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [LIKE, CARE, SAD, DISLIKE]
 *                 default: LIKE
 *     responses:
 *       200:
 *         description: Reaction recorded or removed
 *       400:
 *         description: Invalid reaction type
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: Community post not found
 */

/**
 * @openapi
 * /api/community-posts/{id}/report:
 *   post:
 *     tags:
 *       - Community Post
 *     summary: Report a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 1000
 *                 example: Contains false information about the flood shelter location.
 *     responses:
 *       201:
 *         description: Post reported successfully
 *       400:
 *         description: Invalid reason
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: Community post not found
 */
