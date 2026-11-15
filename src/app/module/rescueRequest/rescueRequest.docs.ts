/**
 * @openapi
 * /api/rescue-requests:
 *   post:
 *     tags:
 *       - RescueRequest
 *     summary: Create a rescue request (optional photo upload)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [latitude, longitude, description, contactPhone]
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 24.8949
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: 91.8687
 *               description:
 *                 type: string
 *                 example: Family stranded on the roof, floodwater rising
 *               contactPhone:
 *                 type: string
 *                 example: "01812345678"
 *               address:
 *                 type: string
 *                 example: Ward 5, Companiganj, Sylhet
 *               peopleCount:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *               urgencyLevel:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: HIGH
 *               medicalNotes:
 *                 type: string
 *               photoUrl:
 *                 type: string
 *                 format: uri
 *                 description: Used only when no file is uploaded
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: JPEG, PNG or WebP photo, uploaded to Cloudinary
 *     responses:
 *       201:
 *         description: Rescue request created successfully
 *       400:
 *         description: Invalid request data or image type
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account is blocked
 */

/**
 * @openapi
 * /api/rescue-requests/my:
 *   get:
 *     tags:
 *       - RescueRequest
 *     summary: List my rescue requests
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
 *           enum: [createdAt, urgencyLevel, peopleCount, status]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACKNOWLEDGED, DISPATCHED, IN_PROGRESS, RESCUED, CANCELLED]
 *       - in: query
 *         name: urgencyLevel
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *       - in: query
 *         name: assignedRescuerId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns the logged-in user's rescue requests with pagination meta
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account is blocked
 */

/**
 * @openapi
 * /api/rescue-requests:
 *   get:
 *     tags:
 *       - RescueRequest
 *     summary: List rescue requests (public)
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         description: Matches address, description or contact phone
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
 *           enum: [createdAt, urgencyLevel, peopleCount, status]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACKNOWLEDGED, DISPATCHED, IN_PROGRESS, RESCUED, CANCELLED]
 *       - in: query
 *         name: urgencyLevel
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *       - in: query
 *         name: assignedRescuerId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns rescue requests with requester, assigned rescuer and pagination meta
 *       400:
 *         description: Invalid query parameters
 */

/**
 * @openapi
 * /api/rescue-requests/{id}:
 *   get:
 *     tags:
 *       - RescueRequest
 *     summary: Get a rescue request by id (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Rescue request retrieved successfully
 *       400:
 *         description: Invalid rescue request id
 *       404:
 *         description: Rescue request not found
 */

/**
 * @openapi
 * /api/rescue-requests/{id}:
 *   patch:
 *     tags:
 *       - RescueRequest
 *     summary: Update a rescue request (owner or admin)
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
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               description:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               address:
 *                 type: string
 *               peopleCount:
 *                 type: integer
 *                 minimum: 1
 *               urgencyLevel:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               medicalNotes:
 *                 type: string
 *               photoUrl:
 *                 type: string
 *                 format: uri
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New photo; the previous Cloudinary photo is replaced
 *     responses:
 *       200:
 *         description: Rescue request updated successfully
 *       400:
 *         description: Invalid request data or image type
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the owner or an admin, or account is blocked
 *       404:
 *         description: Rescue request not found
 */

/**
 * @openapi
 * /api/rescue-requests/{id}/status:
 *   patch:
 *     tags:
 *       - RescueRequest
 *     summary: Change status and optionally assign a rescuer (owner or admin)
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
 *                 enum: [PENDING, ACKNOWLEDGED, DISPATCHED, IN_PROGRESS, RESCUED, CANCELLED]
 *               assignedRescuerId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Rescue request status updated successfully
 *       400:
 *         description: Invalid status or rescuer id
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the owner or an admin, or account is blocked
 *       404:
 *         description: Rescue request or assigned rescuer not found
 */

/**
 * @openapi
 * /api/rescue-requests/{id}/cancel:
 *   patch:
 *     tags:
 *       - RescueRequest
 *     summary: Cancel my own rescue request
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
 *         description: Rescue request cancelled successfully
 *       400:
 *         description: Invalid rescue request id
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Request belongs to another user, or account is blocked
 *       404:
 *         description: Rescue request not found
 *       409:
 *         description: Request is already rescued or cancelled
 */

/**
 * @openapi
 * /api/rescue-requests/{id}:
 *   delete:
 *     tags:
 *       - RescueRequest
 *     summary: Move a rescue request to trash (owner or admin, soft delete)
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
 *         description: Rescue request soft deleted and a trash item created for 30 days
 *       400:
 *         description: Invalid rescue request id
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the owner or an admin, or account is blocked
 *       404:
 *         description: Rescue request not found
 *       409:
 *         description: Rescue request was already deleted
 */
