/**
 * @openapi
 * /api/payments/create:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Create a checkout session for one of my initiated donations
 *     description: Use this to retry paying an existing donation. A new donation is normally created and paid in one step with POST /api/donations/campaigns/{id}/donate.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [donationId]
 *             properties:
 *               donationId:
 *                 type: string
 *                 format: uuid
 *               provider:
 *                 type: string
 *                 enum: [STRIPE, BKASH]
 *                 default: STRIPE
 *                 description: Payment gateway to use
 *     responses:
 *       201:
 *         description: Returns a paymentId and the gateway checkoutUrl
 *       400:
 *         description: Invalid payment request
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account is blocked
 *       404:
 *         description: Donation not found for this user
 *       409:
 *         description: Donation is not payable or a payment is already in progress
 *       502:
 *         description: The payment gateway rejected the request
 */

/**
 * @openapi
 * /api/payments:
 *   get:
 *     tags:
 *       - Payment
 *     summary: List my payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the payments of my donations with the donation status and campaign title, newest first
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account is blocked
 */

/**
 * @openapi
 * /api/payments/{id}:
 *   get:
 *     tags:
 *       - Payment
 *     summary: Get one of my payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Payment ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Returns the payment with its amount, provider, status, and donation details
 *       400:
 *         description: Invalid payment ID
 *       401:
 *         description: Access token is missing or invalid
 *       403:
 *         description: Account is blocked
 *       404:
 *         description: Payment not found for this user
 */
