/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     tags:
 *       - User
 *     summary: Get my profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: User not found
 */

/**
 * @openapi
 * /api/users/update-profile:
 *   patch:
 *     tags:
 *       - User
 *     summary: Update my profile (optionally replace the profile photo)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               phone:
 *                 type: string
 *                 example: "01712345678"
 *               house:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               country:
 *                 type: string
 *               gpsLat:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               gpsLng:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               emergencyMessage:
 *                 type: string
 *               medicalInformation:
 *                 type: string
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               house:
 *                 type: string
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               country:
 *                 type: string
 *               gpsLat:
 *                 type: number
 *               gpsLng:
 *                 type: number
 *               emergencyMessage:
 *                 type: string
 *               medicalInformation:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Invalid profile data or unsupported image type
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: User not found
 *       409:
 *         description: Phone number is already registered by another account
 */

/**
 * @openapi
 * /api/users/complete-profile:
 *   put:
 *     tags:
 *       - User
 *     summary: Complete my emergency profile (location, emergency message, medical info, photo)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               gpsLat:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               gpsLng:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               emergencyMessage:
 *                 type: string
 *               medicalInformation:
 *                 type: string
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gpsLat:
 *                 type: number
 *               gpsLng:
 *                 type: number
 *               emergencyMessage:
 *                 type: string
 *               medicalInformation:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile completed successfully
 *       400:
 *         description: Invalid profile data or unsupported image type
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: User not found
 */

/**
 * @openapi
 * /api/users/is-safe:
 *   patch:
 *     tags:
 *       - User
 *     summary: Toggle my safe status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Safety status updated successfully
 *       401:
 *         description: Access token is missing or invalid
 *       404:
 *         description: User not found
 */
