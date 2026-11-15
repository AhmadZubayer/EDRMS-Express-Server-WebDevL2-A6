/**
 * @openapi
 * /api/disasters:
 *   post:
 *     tags:
 *       - Disaster
 *     summary: Create a disaster alert (relief organization or admin)
 *     description: Creates the alert and emails every active, verified user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [disasterName, impactedLocation, impactTime, type]
 *             properties:
 *               disasterName:
 *                 type: string
 *                 minLength: 3
 *                 example: Cyclone Remal landfall
 *               impactedLocation:
 *                 type: string
 *                 example: Khulna, Satkhira and Bagerhat coastal belt
 *               impactTime:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-05-26T18:00:00.000Z
 *               type:
 *                 type: string
 *                 enum: [CYCLONE, FLOOD, FLASH_FLOOD, HEAVY_RAIN, DROUGHT, EARTHQUAKE, LANDSLIDE, WILDFIRE, TSUNAMI, HEATWAVE, COLD_WAVE, RIVER_EROSION, STORM_SURGE, TORNADO, AVALANCHE]
 *     responses:
 *       201:
 *         description: Disaster alert created successfully
 *       400:
 *         description: Invalid disaster data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organization or admin
 */

/**
 * @openapi
 * /api/disasters:
 *   get:
 *     tags:
 *       - Disaster
 *     summary: List disaster alerts
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
 *           enum: [createdAt, impactTime, disasterName]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CYCLONE, FLOOD, FLASH_FLOOD, HEAVY_RAIN, DROUGHT, EARTHQUAKE, LANDSLIDE, WILDFIRE, TSUNAMI, HEATWAVE, COLD_WAVE, RIVER_EROSION, STORM_SURGE, TORNADO, AVALANCHE]
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *     responses:
 *       200:
 *         description: Returns a paginated list of disaster alerts
 *       400:
 *         description: Invalid query parameters
 */

/**
 * @openapi
 * /api/disasters/{id}:
 *   get:
 *     tags:
 *       - Disaster
 *     summary: Get a disaster alert with its shelters
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Disaster details retrieved successfully
 *       400:
 *         description: Invalid disaster ID
 *       404:
 *         description: Disaster not found
 */

/**
 * @openapi
 * /api/disasters/{id}:
 *   patch:
 *     tags:
 *       - Disaster
 *     summary: Update a disaster alert (relief organization or admin)
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
 *               disasterName:
 *                 type: string
 *                 minLength: 3
 *               impactedLocation:
 *                 type: string
 *               impactTime:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [CYCLONE, FLOOD, FLASH_FLOOD, HEAVY_RAIN, DROUGHT, EARTHQUAKE, LANDSLIDE, WILDFIRE, TSUNAMI, HEATWAVE, COLD_WAVE, RIVER_EROSION, STORM_SURGE, TORNADO, AVALANCHE]
 *     responses:
 *       200:
 *         description: Disaster alert updated successfully
 *       400:
 *         description: Invalid disaster data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organization or admin
 *       404:
 *         description: Disaster not found
 */

/**
 * @openapi
 * /api/disasters/{id}/mark-safe:
 *   patch:
 *     tags:
 *       - Disaster
 *     summary: Mark a disaster as safe (relief organization or admin)
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
 *         description: Disaster alert marked as safe successfully
 *       400:
 *         description: Invalid disaster ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organization or admin
 *       404:
 *         description: Disaster not found
 */

/**
 * @openapi
 * /api/disasters/{id}:
 *   delete:
 *     tags:
 *       - Disaster
 *     summary: Soft delete a disaster alert and its shelters (relief organization or admin)
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
 *         description: Disaster alert deleted successfully
 *       400:
 *         description: Invalid disaster ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organization or admin
 *       404:
 *         description: Disaster not found
 */
