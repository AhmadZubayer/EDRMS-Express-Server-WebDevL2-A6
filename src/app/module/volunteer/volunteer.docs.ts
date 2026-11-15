/**
 * @openapi
 * /api/volunteers/register:
 *   post:
 *     tags:
 *       - Volunteer
 *     summary: Register the logged-in user as a volunteer
 *     description: Creates the volunteer profile and sets the account role to VOLUNTEER. The NID card file is optional here and can be sent later with the verification application.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [whyJoin]
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [FIRST_AID, SEARCH_AND_RESCUE, FIRE_SAFETY, MEDICAL_ASSISTANCE, LOGISTICS_TRANSPORT, FLOOD_RESCUE, SHELTER_MANAGEMENT, FOOD_DISTRIBUTION, PSYCHOSOCIAL_SUPPORT, TELECOMMUNICATIONS, OTHER]
 *               whyJoin:
 *                 type: string
 *                 minLength: 10
 *                 example: I have flood rescue experience from the 2024 Feni floods
 *               available:
 *                 type: boolean
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: NID card (JPEG, PNG or PDF, max 5 MB)
 *     responses:
 *       201:
 *         description: Volunteer registered successfully
 *       400:
 *         description: Invalid volunteer data or file type
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Admin and relief organization accounts cannot register as volunteers
 *       409:
 *         description: Volunteer profile already exists
 */

/**
 * @openapi
 * /api/volunteers/me:
 *   get:
 *     tags:
 *       - Volunteer
 *     summary: Get my volunteer profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Volunteer profile retrieved successfully
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: Volunteer profile not found
 */

/**
 * @openapi
 * /api/volunteers/me:
 *   patch:
 *     tags:
 *       - Volunteer
 *     summary: Update my volunteer skills or availability
 *     description: Setting available to false also takes the volunteer off duty.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                   enum: [FIRST_AID, SEARCH_AND_RESCUE, FIRE_SAFETY, MEDICAL_ASSISTANCE, LOGISTICS_TRANSPORT, FLOOD_RESCUE, SHELTER_MANAGEMENT, FOOD_DISTRIBUTION, PSYCHOSOCIAL_SUPPORT, TELECOMMUNICATIONS, OTHER]
 *               available:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Volunteer profile updated successfully
 *       400:
 *         description: Invalid profile data
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: Volunteer profile not found
 */

/**
 * @openapi
 * /api/volunteers/verification/apply:
 *   post:
 *     tags:
 *       - Volunteer
 *     summary: Apply for volunteer verification
 *     description: Uploads the NID card to Cloudinary (if a file is sent) and sets the verification status to PENDING. An NID card must exist on the profile.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: NID card (JPEG, PNG or PDF, max 5 MB)
 *     responses:
 *       200:
 *         description: Verification application submitted successfully
 *       400:
 *         description: No skills, missing NID card or invalid file type
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: Volunteer profile not found
 *       409:
 *         description: Volunteer is already verified
 */

/**
 * @openapi
 * /api/volunteers/{id}/verification:
 *   patch:
 *     tags:
 *       - Volunteer
 *     summary: Review a volunteer verification (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Volunteer ID
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
 *                 enum: [VERIFIED, REJECTED]
 *     responses:
 *       200:
 *         description: Volunteer verification status reviewed successfully
 *       400:
 *         description: Invalid status or volunteer ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 *       404:
 *         description: Volunteer not found
 *       409:
 *         description: Volunteer has not applied for verification yet
 */

/**
 * @openapi
 * /api/volunteers/duty/location:
 *   patch:
 *     tags:
 *       - Volunteer
 *     summary: Update duty location and duty status (verified volunteers only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 23.8103
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: 90.4125
 *               onDuty:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Duty location updated successfully
 *       400:
 *         description: Invalid coordinates or volunteer is not available
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Volunteer verification is required
 *       404:
 *         description: Volunteer profile not found
 */

/**
 * @openapi
 * /api/volunteers/rescue-requests/nearby:
 *   get:
 *     tags:
 *       - Volunteer
 *     summary: List pending rescue requests near the volunteer (verified, available, on-duty volunteers only)
 *     description: Distances are calculated with the Haversine formula from the volunteer's last shared location. Requests the volunteer rejected are left out.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: radius
 *         description: Search radius in kilometres (1 to 200, default 25)
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 200
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
 *     responses:
 *       200:
 *         description: Nearby rescue requests sorted by distance, each with distanceKm
 *       400:
 *         description: Volunteer is not available, not on duty or has no shared location
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Volunteer verification is required
 *       404:
 *         description: Volunteer profile not found
 */

/**
 * @openapi
 * /api/volunteers/rescue-tasks/{requestId}/accept:
 *   post:
 *     tags:
 *       - Volunteer
 *     summary: Accept a rescue request as a task (verified volunteers only)
 *     description: Assigns the rescue request to the volunteer and sets its status to ACKNOWLEDGED. Only one volunteer can win the assignment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Rescue task accepted successfully
 *       400:
 *         description: Volunteer is not available or invalid request ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Volunteer verification is required
 *       404:
 *         description: Rescue request not found
 *       409:
 *         description: Request already assigned, completed or cancelled
 */

/**
 * @openapi
 * /api/volunteers/rescue-tasks/{requestId}/reject:
 *   post:
 *     tags:
 *       - Volunteer
 *     summary: Reject a rescue request (verified volunteers only)
 *     description: Hides the request from this volunteer's nearby list. A task already accepted cannot be rejected.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Rescue task rejected
 *       400:
 *         description: Invalid request ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Volunteer verification is required
 *       404:
 *         description: Rescue request not found
 *       409:
 *         description: An accepted task cannot be rejected
 */

/**
 * @openapi
 * /api/volunteers/rescue-tasks/my:
 *   get:
 *     tags:
 *       - Volunteer
 *     summary: List my rescue tasks
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
 *         description: Matches the rescue request description, address or requester name
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, completedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACCEPTED, REJECTED, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: Assigned tasks retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: Volunteer profile not found
 */

/**
 * @openapi
 * /api/volunteers/rescue-tasks/{taskId}/progress:
 *   patch:
 *     tags:
 *       - Volunteer
 *     summary: Update progress of my rescue task (verified volunteers only)
 *     description: Progress can only move forward. The linked rescue request status follows the task (ACCEPTED to ACKNOWLEDGED, IN_PROGRESS to IN_PROGRESS, COMPLETED to RESCUED).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
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
 *                 enum: [ACCEPTED, IN_PROGRESS, COMPLETED]
 *               progressNote:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Task progress updated successfully
 *       400:
 *         description: Invalid progress data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not your task or volunteer verification is required
 *       404:
 *         description: Volunteer task not found
 *       409:
 *         description: Task is rejected, completed or progress would move backwards
 */

/**
 * @openapi
 * /api/volunteers/rescue-tasks/{taskId}/complete:
 *   patch:
 *     tags:
 *       - Volunteer
 *     summary: Mark my rescue task as completed (verified volunteers only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task completed successfully and the rescue request marked RESCUED
 *       400:
 *         description: Invalid task ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not your task or volunteer verification is required
 *       404:
 *         description: Volunteer task not found
 *       409:
 *         description: Task is already completed or rejected
 */

/**
 * @openapi
 * /api/volunteers/field-reports/routes:
 *   post:
 *     tags:
 *       - Volunteer
 *     summary: Report a blocked or dangerous route (verified volunteers only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reportType, description, latitude, longitude]
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [BLOCKED_ROUTE, DANGEROUS_ROUTE]
 *               description:
 *                 type: string
 *                 minLength: 5
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               address:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: HIGH
 *     responses:
 *       201:
 *         description: Route report created successfully
 *       400:
 *         description: Invalid report data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Volunteer verification is required
 *       404:
 *         description: Volunteer profile not found
 */

/**
 * @openapi
 * /api/volunteers/field-reports/shortages:
 *   post:
 *     tags:
 *       - Volunteer
 *     summary: Report a resource shortage (verified volunteers only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resourceName, quantityNeeded, description, latitude, longitude]
 *             properties:
 *               resourceName:
 *                 type: string
 *                 example: Drinking water
 *               quantityNeeded:
 *                 type: integer
 *                 minimum: 1
 *               description:
 *                 type: string
 *                 minLength: 5
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               address:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: HIGH
 *     responses:
 *       201:
 *         description: Resource shortage report created successfully
 *       400:
 *         description: Invalid report data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Volunteer verification is required
 *       404:
 *         description: Volunteer profile not found
 */

/**
 * @openapi
 * /api/volunteers/field-reports/my:
 *   get:
 *     tags:
 *       - Volunteer
 *     summary: List my field reports
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
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, severity]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [BLOCKED_ROUTE, DANGEROUS_ROUTE, RESOURCE_SHORTAGE]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       200:
 *         description: Field reports retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 */

/**
 * @openapi
 * /api/volunteers/field-reports:
 *   get:
 *     tags:
 *       - Volunteer
 *     summary: List all volunteer field reports (relief organization or admin)
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
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, severity]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [BLOCKED_ROUTE, DANGEROUS_ROUTE, RESOURCE_SHORTAGE]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       200:
 *         description: Field reports retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organization or admin
 */
