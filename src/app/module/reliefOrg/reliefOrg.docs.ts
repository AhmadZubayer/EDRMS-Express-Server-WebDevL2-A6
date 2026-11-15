/**
 * @openapi
 * /api/relief-orgs/sign-up:
 *   post:
 *     tags:
 *       - Relief Organization
 *     summary: Apply as a relief organization with verification documents
 *     description: Uploads the documents to Cloudinary, creates the organization (pending admin verification) and sets the account role to RELIEF_ORG.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [organizationName, registrationNumber, address, verificationDocs]
 *             properties:
 *               organizationName:
 *                 type: string
 *                 minLength: 3
 *                 example: Bangladesh Red Crescent Society
 *               registrationNumber:
 *                 type: string
 *                 example: NGO-REG-2026-9876
 *               address:
 *                 type: string
 *                 example: 684-686 Bara Maghbazar, Dhaka
 *               contactEmail:
 *                 type: string
 *                 format: email
 *               contactPhone:
 *                 type: string
 *                 example: "+8801712345678"
 *               website:
 *                 type: string
 *                 format: uri
 *               description:
 *                 type: string
 *               organizationType:
 *                 type: string
 *                 example: NGO
 *               verificationDocs:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Relief organization sign up request submitted successfully
 *       400:
 *         description: Invalid data, missing or unsupported documents
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Admin accounts cannot register as a relief organization
 *       409:
 *         description: User or registration number already registered
 */

/**
 * @openapi
 * /api/relief-orgs/profile/me:
 *   get:
 *     tags:
 *       - Relief Organization
 *     summary: Get the logged-in user's relief organization profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Relief organization profile retrieved successfully
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organization
 *       404:
 *         description: Relief organization profile not found
 */

/**
 * @openapi
 * /api/relief-orgs:
 *   get:
 *     tags:
 *       - Relief Organization
 *     summary: List relief organizations
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
 *           enum: [createdAt, organizationName]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: adminVerified
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *       - in: query
 *         name: organizationType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a paginated list of relief organizations with their shelters
 *       400:
 *         description: Invalid query parameters
 */

/**
 * @openapi
 * /api/relief-orgs/{id}:
 *   get:
 *     tags:
 *       - Relief Organization
 *     summary: Get a relief organization by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Relief organization details retrieved successfully
 *       400:
 *         description: Invalid relief organization ID
 *       404:
 *         description: Relief organization not found
 */

/**
 * @openapi
 * /api/relief-orgs/{id}/documents:
 *   get:
 *     tags:
 *       - Relief Organization
 *     summary: Get verification documents of a relief organization (admin only)
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
 *         description: Verification documents retrieved successfully
 *       400:
 *         description: Invalid relief organization ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin
 *       404:
 *         description: Relief organization not found
 */

/**
 * @openapi
 * /api/relief-orgs/{id}/verify:
 *   patch:
 *     tags:
 *       - Relief Organization
 *     summary: Verify a relief organization (admin only)
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
 *         description: Relief organization verified successfully and account role updated
 *       400:
 *         description: Invalid relief organization ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin
 *       404:
 *         description: Relief organization not found
 *       409:
 *         description: Relief organization is already verified
 */
