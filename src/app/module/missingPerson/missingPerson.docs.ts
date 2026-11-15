/**
 * @openapi
 * /api/missing-persons:
 *   post:
 *     tags:
 *       - MissingPerson
 *     summary: Report a missing person (optional photo upload)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fullName, age, gender, lastSeenLocation, lastSeenDate, description]
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *                 example: Rahim Uddin
 *               age:
 *                 type: integer
 *                 minimum: 0
 *                 example: 34
 *               gender:
 *                 type: string
 *                 example: Male
 *               lastSeenLocation:
 *                 type: string
 *                 example: Kamalapur Bazar, Sunamganj
 *               lastSeenDate:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *                 example: Wearing a blue shirt and lungi, scar on left hand
 *               contactPhone:
 *                 type: string
 *                 description: Defaults to the reporter's profile phone
 *                 example: "01712345678"
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
 *         description: Missing person report created successfully
 *       400:
 *         description: Invalid report data, invalid image type or no contact phone available
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account is blocked
 */

/**
 * @openapi
 * /api/missing-persons/my:
 *   get:
 *     tags:
 *       - MissingPerson
 *     summary: List my missing person reports
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
 *           enum: [createdAt, lastSeenDate, fullName, age]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [MISSING, FOUND, RESOLVED, CLOSED]
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the logged-in user's reports with pagination meta
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account is blocked
 */

/**
 * @openapi
 * /api/missing-persons:
 *   get:
 *     tags:
 *       - MissingPerson
 *     summary: List missing person reports (public)
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         description: Matches name, last seen location or description
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
 *           enum: [createdAt, lastSeenDate, fullName, age]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [MISSING, FOUND, RESOLVED, CLOSED]
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns reports with pagination meta
 *       400:
 *         description: Invalid query parameters
 */

/**
 * @openapi
 * /api/missing-persons/{id}:
 *   get:
 *     tags:
 *       - MissingPerson
 *     summary: Get a missing person report by id (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Missing person report retrieved successfully
 *       400:
 *         description: Invalid report id
 *       404:
 *         description: Missing person report not found
 */

/**
 * @openapi
 * /api/missing-persons/{id}:
 *   patch:
 *     tags:
 *       - MissingPerson
 *     summary: Update a missing person report (reporter or admin)
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
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *               age:
 *                 type: integer
 *                 minimum: 0
 *               gender:
 *                 type: string
 *               lastSeenLocation:
 *                 type: string
 *               lastSeenDate:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               contactPhone:
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
 *         description: Missing person report updated successfully
 *       400:
 *         description: Invalid report data or image type
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the reporter or an admin, or account is blocked
 *       404:
 *         description: Missing person report not found
 */

/**
 * @openapi
 * /api/missing-persons/{id}/status:
 *   patch:
 *     tags:
 *       - MissingPerson
 *     summary: Change the status of a report (reporter or admin)
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
 *                 enum: [MISSING, FOUND, RESOLVED, CLOSED]
 *     responses:
 *       200:
 *         description: Missing person status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the reporter or an admin, or account is blocked
 *       404:
 *         description: Missing person report not found
 */

/**
 * @openapi
 * /api/missing-persons/{id}:
 *   delete:
 *     tags:
 *       - MissingPerson
 *     summary: Move a report to trash (reporter or admin, soft delete)
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
 *         description: Report soft deleted and a trash item created for 30 days
 *       400:
 *         description: Invalid report id
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the reporter or an admin, or account is blocked
 *       404:
 *         description: Missing person report not found
 *       409:
 *         description: Report was already deleted
 */
