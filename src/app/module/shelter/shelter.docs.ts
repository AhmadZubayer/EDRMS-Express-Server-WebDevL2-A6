/**
 * @openapi
 * /api/shelters:
 *   post:
 *     tags:
 *       - Shelter
 *     summary: Create a shelter for a disaster (verified relief organization or admin)
 *     description: Only admin-verified relief organizations may create shelters. Admins must pass reliefOrgId.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shelterName, shelterLocation, shelterCapacity, disasterId]
 *             properties:
 *               shelterName:
 *                 type: string
 *                 example: Mirpur Central Relief Camp
 *               shelterLocation:
 *                 type: string
 *                 example: Mirpur Stadium, Section 10, Dhaka
 *               shelterCapacity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 500
 *               currentPeopleCount:
 *                 type: integer
 *                 minimum: 0
 *                 example: 45
 *               disasterId:
 *                 type: string
 *                 format: uuid
 *               reliefOrgId:
 *                 type: string
 *                 format: uuid
 *                 description: Admin only. The relief organization the shelter belongs to.
 *     responses:
 *       201:
 *         description: Shelter created successfully
 *       400:
 *         description: Invalid shelter data or people count exceeds capacity
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Relief organization is missing or not yet verified
 *       404:
 *         description: Disaster not found
 */

/**
 * @openapi
 * /api/shelters:
 *   get:
 *     tags:
 *       - Shelter
 *     summary: List shelters
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
 *           enum: [createdAt, shelterName, shelterCapacity, currentPeopleCount]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: disasterId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: reliefOrgId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns a paginated list of shelters
 *       400:
 *         description: Invalid query parameters
 */

/**
 * @openapi
 * /api/shelters/{id}:
 *   get:
 *     tags:
 *       - Shelter
 *     summary: Get shelter details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Shelter details retrieved successfully
 *       400:
 *         description: Invalid shelter ID
 *       404:
 *         description: Shelter not found
 */

/**
 * @openapi
 * /api/shelters/{id}:
 *   patch:
 *     tags:
 *       - Shelter
 *     summary: Update a shelter (owning relief organization or admin)
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
 *             properties:
 *               shelterName:
 *                 type: string
 *               shelterLocation:
 *                 type: string
 *               shelterCapacity:
 *                 type: integer
 *                 minimum: 1
 *               currentPeopleCount:
 *                 type: integer
 *                 minimum: 0
 *               disasterId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Shelter updated successfully
 *       400:
 *         description: Invalid shelter data or people count exceeds capacity
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Shelter belongs to another relief organization
 *       404:
 *         description: Shelter or disaster not found
 */

/**
 * @openapi
 * /api/shelters/{id}:
 *   delete:
 *     tags:
 *       - Shelter
 *     summary: Soft delete a shelter (owning relief organization or admin)
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
 *         description: Shelter deleted successfully
 *       400:
 *         description: Invalid shelter ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Shelter belongs to another relief organization
 *       404:
 *         description: Shelter not found
 */
