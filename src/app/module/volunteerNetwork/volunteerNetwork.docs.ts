/**
 * @openapi
 * /api/volunteers/organization-applications:
 *   get:
 *     tags:
 *       - Volunteer Network
 *     summary: List volunteer applications to my organization requests (relief organization only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: searchTerm
 *         description: Matches the volunteer name or the request title
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [joinedAt, updatedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: organizationRequestId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Organization applications retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organization or account is blocked
 */

/**
 * @openapi
 * /api/volunteers/organization-applications/{id}:
 *   patch:
 *     tags:
 *       - Volunteer Network
 *     summary: Approve or reject a volunteer application (owning relief organization only)
 *     description: Approving requires a verified volunteer and free capacity. The last approved seat closes the request.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Application ID
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
 *                 enum: [APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Organization application reviewed successfully
 *       400:
 *         description: Invalid data or the volunteer is not verified
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: The application belongs to another organization
 *       404:
 *         description: Application not found
 *       409:
 *         description: Already reviewed, or the group is closed or at capacity
 */

/**
 * @openapi
 * /api/volunteers/organization-requests:
 *   post:
 *     tags:
 *       - Volunteer Network
 *     summary: Create a volunteer request for my organization (relief organization only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, location, neededVolunteers]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 example: Flood relief distribution team, Sylhet
 *               description:
 *                 type: string
 *                 minLength: 10
 *               requiredSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [FIRST_AID, SEARCH_AND_RESCUE, FIRE_SAFETY, MEDICAL_ASSISTANCE, LOGISTICS_TRANSPORT, FLOOD_RESCUE, SHELTER_MANAGEMENT, FOOD_DISTRIBUTION, PSYCHOSOCIAL_SUPPORT, TELECOMMUNICATIONS, OTHER]
 *               location:
 *                 type: string
 *                 example: Companiganj, Sylhet
 *               neededVolunteers:
 *                 type: integer
 *                 minimum: 1
 *               disasterName:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [OPEN, CLOSED]
 *                 default: OPEN
 *     responses:
 *       201:
 *         description: Organization request created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organization or account is blocked
 */

/**
 * @openapi
 * /api/volunteers/organization-requests/my-created:
 *   get:
 *     tags:
 *       - Volunteer Network
 *     summary: List the volunteer requests I created (relief organization only)
 *     description: Each row includes joinedVolunteers, the number of approved volunteers.
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: searchTerm
 *         description: Matches title, description, location or disaster name
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, neededVolunteers]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED]
 *     responses:
 *       200:
 *         description: My created organization requests retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organization or account is blocked
 */

/**
 * @openapi
 * /api/volunteers/organization-requests/my/joins:
 *   get:
 *     tags:
 *       - Volunteer Network
 *     summary: List the organization requests I applied to
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: searchTerm
 *         description: Matches title, location or disaster name
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [joinedAt, updatedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: User organization requests retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 */

/**
 * @openapi
 * /api/volunteers/organization-requests:
 *   get:
 *     tags:
 *       - Volunteer Network
 *     summary: List open organization volunteer requests
 *     description: Each row includes joinedVolunteers and matchedSkills (how many required skills the caller has). Use sortBy=skillMatch to rank by best match.
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: searchTerm
 *         description: Matches title, description, location or disaster name
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, neededVolunteers, skillMatch]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Open organization requests retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 */

/**
 * @openapi
 * /api/volunteers/organization-requests/{id}:
 *   patch:
 *     tags:
 *       - Volunteer Network
 *     summary: Update my volunteer request (owning relief organization only)
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
 *               title:
 *                 type: string
 *                 minLength: 3
 *               description:
 *                 type: string
 *                 minLength: 10
 *               requiredSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [FIRST_AID, SEARCH_AND_RESCUE, FIRE_SAFETY, MEDICAL_ASSISTANCE, LOGISTICS_TRANSPORT, FLOOD_RESCUE, SHELTER_MANAGEMENT, FOOD_DISTRIBUTION, PSYCHOSOCIAL_SUPPORT, TELECOMMUNICATIONS, OTHER]
 *               location:
 *                 type: string
 *               neededVolunteers:
 *                 type: integer
 *                 minimum: 1
 *               disasterName:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [OPEN, CLOSED]
 *     responses:
 *       200:
 *         description: Organization request updated successfully
 *       400:
 *         description: Invalid data, or needed volunteers lower than approved volunteers
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: The request belongs to another organization
 *       404:
 *         description: Organization volunteer request not found
 *       409:
 *         description: A full group cannot be reopened without raising the needed volunteers
 */

/**
 * @openapi
 * /api/volunteers/organization-requests/{id}:
 *   delete:
 *     tags:
 *       - Volunteer Network
 *     summary: Delete my volunteer request (soft delete, owning relief organization only)
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
 *         description: Organization request deleted successfully
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: The request belongs to another organization
 *       404:
 *         description: Organization volunteer request not found
 */

/**
 * @openapi
 * /api/volunteers/organization-requests/{id}/join:
 *   post:
 *     tags:
 *       - Volunteer Network
 *     summary: Apply to an open organization request (verified volunteers only)
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
 *       201:
 *         description: Volunteer group application submitted successfully (status PENDING)
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Volunteer verification is required
 *       404:
 *         description: Open organization volunteer request or volunteer profile not found
 *       409:
 *         description: Already applied, or the request already has enough volunteers
 */

/**
 * @openapi
 * /api/volunteers/rescue-groups/{id}/join:
 *   post:
 *     tags:
 *       - Volunteer Network
 *     summary: Join the volunteer group of a rescue request (verified volunteers only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Rescue request ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [whyJoin]
 *             properties:
 *               whyJoin:
 *                 type: string
 *                 minLength: 5
 *                 example: I live two kilometres from the site and have a boat
 *     responses:
 *       201:
 *         description: Joined rescue group successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Volunteer verification is required
 *       404:
 *         description: Rescue request or volunteer profile not found
 *       409:
 *         description: Join request already submitted
 */

/**
 * @openapi
 * /api/volunteers/missing-person-groups/{id}/join:
 *   post:
 *     tags:
 *       - Volunteer Network
 *     summary: Join the volunteer group of a missing person report (verified volunteers only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Missing person report ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [whyJoin]
 *             properties:
 *               whyJoin:
 *                 type: string
 *                 minLength: 5
 *     responses:
 *       201:
 *         description: Joined missing person group successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Volunteer verification is required
 *       404:
 *         description: Missing person report or volunteer profile not found
 *       409:
 *         description: Join request already submitted
 */

/**
 * @openapi
 * /api/volunteers/group-joins/my:
 *   get:
 *     tags:
 *       - Volunteer Network
 *     summary: List my rescue and missing person group join requests
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: searchTerm
 *         description: Matches the reason for joining
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *           enum: [RESCUE_REQUEST, MISSING_PERSON]
 *     responses:
 *       200:
 *         description: User group join requests retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: Volunteer profile not found
 */
