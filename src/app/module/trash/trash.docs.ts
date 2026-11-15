/**
 * @openapi
 * /api/trash:
 *   get:
 *     tags:
 *       - Trash
 *     summary: List my trash items (admins may list everyone's with all=true)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [deletedAt, expiresAt, itemTitle]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: itemType
 *         schema:
 *           type: string
 *           enum: [MISSING_PERSON, RESCUE_REQUEST, COMMUNITY_POST]
 *       - in: query
 *         name: all
 *         description: Admin only. When true, returns trash items of every user
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *     responses:
 *       200:
 *         description: Trash items retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account is blocked
 */

/**
 * @openapi
 * /api/trash/{id}/restore:
 *   post:
 *     tags:
 *       - Trash
 *     summary: Restore a trashed item (owner or admin)
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
 *         description: Item restored successfully
 *       400:
 *         description: Invalid trash item ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: You do not own this item
 *       404:
 *         description: Trash item not found or expired
 */

/**
 * @openapi
 * /api/trash/{id}:
 *   delete:
 *     tags:
 *       - Trash
 *     summary: Permanently delete a trashed item (owner or admin)
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
 *         description: Item permanently deleted
 *       400:
 *         description: Invalid trash item ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: You do not own this item
 *       404:
 *         description: Trash item not found
 */
