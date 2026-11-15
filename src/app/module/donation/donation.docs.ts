/**
 * @openapi
 * /api/donations/campaigns:
 *   post:
 *     tags:
 *       - Donation
 *     summary: Create a donation campaign (relief organisation or admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, targetAmount, startDate, endDate]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Sylhet Flood Relief Fund 2026
 *               description:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *                 example: 500000
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, COMPLETED, CLOSED]
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Optional campaign image (max 5 MB), stored on Cloudinary
 *     responses:
 *       201:
 *         description: Campaign created successfully
 *       400:
 *         description: Invalid campaign data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organisation or admin
 *   get:
 *     tags:
 *       - Donation
 *     summary: List donation campaigns
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CLOSED]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, targetAmount, raisedAmount, startDate, endDate]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Returns campaigns with pagination meta
 *       400:
 *         description: Invalid query parameters
 */

/**
 * @openapi
 * /api/donations/campaigns/{id}:
 *   get:
 *     tags:
 *       - Donation
 *     summary: Get a campaign with donor count and available balance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns the campaign, donorsCount, totalPaidOut and availableBalance
 *       400:
 *         description: Invalid campaign ID
 *       404:
 *         description: Campaign not found
 *   patch:
 *     tags:
 *       - Donation
 *     summary: Update a campaign (its owner or an admin)
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
 *               description:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, COMPLETED, CLOSED]
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *       400:
 *         description: Invalid campaign data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the campaign owner
 *       404:
 *         description: Campaign not found
 *   delete:
 *     tags:
 *       - Donation
 *     summary: Soft delete a campaign (its owner or an admin)
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
 *         description: Campaign deleted successfully
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the campaign owner
 *       404:
 *         description: Campaign not found
 */

/**
 * @openapi
 * /api/donations/campaigns/{id}/applications:
 *   get:
 *     tags:
 *       - Donation
 *     summary: List aid applications of a campaign (its owner or an admin)
 *     security:
 *       - bearerAuth: []
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, approvedAmount, reviewedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Returns applications with pagination meta
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the campaign owner
 *       404:
 *         description: Campaign not found
 */

/**
 * @openapi
 * /api/donations/campaigns/{id}/transactions:
 *   get:
 *     tags:
 *       - Donation
 *     summary: List donations (DONATE) and payouts (RECEIVE) of a campaign
 *     description: Anonymous donors are masked. Rows are sorted newest first.
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
 *         description: Returns the combined list of donations and payouts
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the campaign owner
 *       404:
 *         description: Campaign not found
 */

/**
 * @openapi
 * /api/donations/campaigns/{id}/donate:
 *   post:
 *     tags:
 *       - Donation
 *     summary: Donate to a campaign and get the gateway checkout URL
 *     description: Open to guests. When a valid token is sent the donation is linked to the user. The campaign total is increased only after the gateway confirms the payment (Stripe webhook or bKash callback). After checkout, Stripe returns to /api/payments/return/success or /api/payments/return/cancel and bKash returns to /api/payments/bkash/callback.
 *     security:
 *       - {}
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
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 example: 1000
 *                 description: Amount in BDT
 *               provider:
 *                 type: string
 *                 enum: [STRIPE, BKASH]
 *                 default: STRIPE
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *               donorName:
 *                 type: string
 *               donorEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Returns donationId, paymentId and checkoutUrl
 *       400:
 *         description: Invalid donation data
 *       401:
 *         description: Access token is invalid
 *       404:
 *         description: Campaign not found
 *       409:
 *         description: Campaign is not accepting donations
 *       502:
 *         description: The payment gateway rejected the request
 */

/**
 * @openapi
 * /api/donations/campaigns/{id}/apply:
 *   post:
 *     tags:
 *       - Donation
 *     summary: Apply for financial aid from a campaign
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
 *             required: [reason, payoutDetails]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Our home was washed away by the flood in Sylhet and we need urgent help.
 *               payoutDetails:
 *                 type: string
 *                 example: "bKash: 01712345678 (Personal)"
 *               proofDocument:
 *                 type: string
 *                 format: binary
 *                 description: Optional proof (image or PDF, max 10 MB), stored on Cloudinary
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Invalid application data or file
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: Campaign not found
 *       409:
 *         description: Campaign is closed
 */

/**
 * @openapi
 * /api/donations/my-applications:
 *   get:
 *     tags:
 *       - Donation
 *     summary: List my aid applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Returns my applications with pagination meta
 *       401:
 *         description: Access token is missing or invalid
 */

/**
 * @openapi
 * /api/donations/my-donations:
 *   get:
 *     tags:
 *       - Donation
 *     summary: List my donations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [INITIATED, PAID, CANCELLED]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, amount]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Returns my donations with their payments and pagination meta
 *       401:
 *         description: Access token is missing or invalid
 */

/**
 * @openapi
 * /api/donations/applications:
 *   get:
 *     tags:
 *       - Donation
 *     summary: List aid applications (admin sees all, a relief organisation sees its own campaigns)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: campaignId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, approvedAmount, reviewedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Returns applications with pagination meta
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: User is not a relief organisation or admin
 */

/**
 * @openapi
 * /api/donations/applications/{id}/review:
 *   patch:
 *     tags:
 *       - Donation
 *     summary: Approve or reject an aid application
 *     description: Approving creates a payout in the same transaction. The approved amount cannot exceed the campaign's unpaid balance (raised amount minus earlier payouts).
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
 *                 enum: [APPROVED, REJECTED]
 *               approvedAmount:
 *                 type: number
 *                 example: 15000
 *                 description: Required when status is APPROVED
 *     responses:
 *       200:
 *         description: Application reviewed successfully
 *       400:
 *         description: Invalid review data
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Not the owner of the campaign
 *       404:
 *         description: Application not found
 *       409:
 *         description: Already reviewed, or the amount exceeds the available balance
 */
