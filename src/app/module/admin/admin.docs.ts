/**
 * @openapi
 * /api/admin/admins:
 *   post:
 *     tags:
 *       - Super Admin
 *     summary: "Create an admin account (super admin only). A random password is generated and emailed."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *                 example: "01712345678"
 *     responses:
 *       201:
 *         description: Admin created. The password is emailed, never returned
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Only a super admin can access this route
 *       409:
 *         description: Email or phone already registered
 */

/**
 * @openapi
 * /api/admin/admins:
 *   get:
 *     tags:
 *       - Super Admin
 *     summary: "List admin accounts (super admin only)"
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
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, email]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, SUPER_ADMIN]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, BLOCKED, DELETED]
 *     responses:
 *       200:
 *         description: Returns a paginated list of admins
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Only a super admin can access this route
 */

/**
 * @openapi
 * /api/admin/admins/{id}/status:
 *   patch:
 *     tags:
 *       - Super Admin
 *     summary: "Block or unblock an admin (super admin only)"
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
 *                 enum: [ACTIVE, BLOCKED]
 *     responses:
 *       200:
 *         description: Admin status updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Only a super admin can access this route
 *       404:
 *         description: Admin not found
 */

/**
 * @openapi
 * /api/admin/admins/{id}:
 *   delete:
 *     tags:
 *       - Super Admin
 *     summary: "Soft delete an admin account (super admin only)"
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
 *         description: Admin deleted
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Only a super admin can access this route
 *       404:
 *         description: Admin not found
 */

/**
 * @openapi
 * /api/admin/accounts:
 *   get:
 *     tags:
 *       - Admin
 *     summary: "List accounts (admin)"
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
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, email, role]
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, VOLUNTEER, RELIEF_ORG, ADMIN, SUPER_ADMIN]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, BLOCKED, DELETED]
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *     responses:
 *       200:
 *         description: Returns a paginated list of accounts without passwords
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */

/**
 * @openapi
 * /api/admin/accounts:
 *   post:
 *     tags:
 *       - Admin
 *     summary: "Create an account (admin). Only a super admin may create ADMIN or SUPER_ADMIN accounts. Without a password one is generated and emailed."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               phone:
 *                 type: string
 *                 example: "01712345678"
 *               role:
 *                 type: string
 *                 enum: [USER, VOLUNTEER, RELIEF_ORG, ADMIN, SUPER_ADMIN]
 *     responses:
 *       201:
 *         description: Account created
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not an admin, or a non super admin tried to create an admin
 *       409:
 *         description: Email or phone already registered
 */

/**
 * @openapi
 * /api/admin/accounts/{id}/role:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: "Change an account role. Only a super admin may assign or remove ADMIN/SUPER_ADMIN; super admins and your own account cannot be changed."
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, VOLUNTEER, RELIEF_ORG, ADMIN, SUPER_ADMIN]
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not allowed to change this role
 *       404:
 *         description: Account not found
 */

/**
 * @openapi
 * /api/admin/accounts/{id}/restore:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: "Restore a soft deleted account"
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
 *         description: Account restored
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Only a super admin can restore an admin
 *       404:
 *         description: Account not found
 *       409:
 *         description: Account is not deleted
 */

/**
 * @openapi
 * /api/admin/accounts/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: "Soft delete an account. Super admins and your own account cannot be deleted; only a super admin can delete an admin."
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
 *         description: Account deleted
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not allowed to delete this account
 *       404:
 *         description: Account not found
 *       409:
 *         description: Account already deleted
 */

/**
 * @openapi
 * /api/admin/volunteers:
 *   get:
 *     tags:
 *       - Admin
 *     summary: "List volunteers (admin)"
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
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, verificationStatus]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOT_APPLIED, PENDING, VERIFIED, REJECTED]
 *     responses:
 *       200:
 *         description: Returns a paginated list of volunteers
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */

/**
 * @openapi
 * /api/admin/volunteers/{id}/verify:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: "Verify, reject or reset a volunteer application"
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
 *                 enum: [VERIFIED, REJECTED, PENDING]
 *     responses:
 *       200:
 *         description: Volunteer verification updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 *       404:
 *         description: Volunteer not found
 */

/**
 * @openapi
 * /api/admin/relief-orgs:
 *   get:
 *     tags:
 *       - Admin
 *     summary: "List relief organizations (admin)"
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
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, organizationName]
 *       - in: query
 *         name: verified
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *     responses:
 *       200:
 *         description: Returns a paginated list of relief organizations
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */

/**
 * @openapi
 * /api/admin/relief-orgs/{id}/verify:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: "Verify or unverify a relief organization"
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
 *             required: [verified]
 *             properties:
 *               verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Relief organization verification updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 *       404:
 *         description: Relief organization not found
 */

/**
 * @openapi
 * /api/admin/disasters:
 *   get:
 *     tags:
 *       - Admin
 *     summary: "List disasters (admin)"
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
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, impactTime, disasterName]
 *       - in: query
 *         name: verified
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CYCLONE, FLOOD, FLASH_FLOOD, HEAVY_RAIN, DROUGHT, EARTHQUAKE, LANDSLIDE, WILDFIRE, TSUNAMI, HEATWAVE, COLD_WAVE, RIVER_EROSION, STORM_SURGE, TORNADO, AVALANCHE]
 *     responses:
 *       200:
 *         description: Returns a paginated list of disasters
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */

/**
 * @openapi
 * /api/admin/disasters:
 *   post:
 *     tags:
 *       - Admin
 *     summary: "Create a disaster alert (verified by default)"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [disasterName, type, impactedLocation]
 *             properties:
 *               disasterName:
 *                 type: string
 *                 minLength: 3
 *               type:
 *                 type: string
 *                 enum: [CYCLONE, FLOOD, FLASH_FLOOD, HEAVY_RAIN, DROUGHT, EARTHQUAKE, LANDSLIDE, WILDFIRE, TSUNAMI, HEATWAVE, COLD_WAVE, RIVER_EROSION, STORM_SURGE, TORNADO, AVALANCHE]
 *               impactedLocation:
 *                 type: string
 *               impactTime:
 *                 type: string
 *                 format: date-time
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Disaster created
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */

/**
 * @openapi
 * /api/admin/disasters/{id}/verify:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: "Verify or unverify a disaster"
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
 *             required: [verified]
 *             properties:
 *               verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Disaster verification updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 *       404:
 *         description: Disaster not found
 */

/**
 * @openapi
 * /api/admin/rescue-requests:
 *   get:
 *     tags:
 *       - Admin
 *     summary: "List rescue requests (admin)"
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
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, urgencyLevel, status]
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
 *     responses:
 *       200:
 *         description: Returns a paginated list of rescue requests
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */

/**
 * @openapi
 * /api/admin/rescue-requests:
 *   post:
 *     tags:
 *       - Admin
 *     summary: "Create an emergency rescue request on behalf of a caller"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contactPhone, description]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: Defaults to the logged in admin
 *               contactPhone:
 *                 type: string
 *                 example: "01712345678"
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 example: 23.8103
 *               longitude:
 *                 type: number
 *                 example: 90.4125
 *               peopleCount:
 *                 type: integer
 *                 minimum: 1
 *               urgencyLevel:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               description:
 *                 type: string
 *                 minLength: 5
 *               medicalNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rescue request created
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 *       404:
 *         description: Requester user not found
 */

/**
 * @openapi
 * /api/admin/community-posts:
 *   get:
 *     tags:
 *       - Admin
 *     summary: "List community posts (admin)"
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
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, status]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [POSTED, FLAGGED, HIDDEN, ARCHIVED, REMOVED]
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *     responses:
 *       200:
 *         description: Returns a paginated list of community posts
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */

/**
 * @openapi
 * /api/admin/community-posts/{id}/status:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: "Moderate a community post status"
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
 *         description: Post status updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 *       404:
 *         description: Community post not found
 */

/**
 * @openapi
 * /api/admin/community-posts/{id}/restore:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: "Restore a soft deleted community post"
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
 *         description: Post restored
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 *       404:
 *         description: Community post not found
 *       409:
 *         description: Post is not deleted
 */

/**
 * @openapi
 * /api/admin/community-posts/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: "Soft delete a community post"
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
 *         description: Post deleted
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 *       404:
 *         description: Community post not found
 *       409:
 *         description: Post already deleted
 */

/**
 * @openapi
 * /api/admin/reports:
 *   get:
 *     tags:
 *       - Admin
 *     summary: "Dashboard report: users by role, volunteers by verification status, rescue requests by status, disasters, donations raised, open missing persons, posts by status"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns aggregate counts
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */

/**
 * @openapi
 * /api/admin/tables:
 *   get:
 *     tags:
 *       - Admin
 *     summary: "List the browsable database tables with record counts"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns table names and counts
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */

/**
 * @openapi
 * /api/admin/tables/{tableName}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: "Browse raw records of a whitelisted table (password columns are never exposed)"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *           example: users
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
 *         description: Returns a paginated list of records
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not an admin or account is blocked
 */
