# EDRMS Video Demo Guide

**Target length:** 8 minutes. Use Postman or Thunder Client for API requests and the browser for Stripe Checkout. The speaking notes are in English and can be delivered in Bengali.

| Time       | Show on screen                                                        |
| ---------- | --------------------------------------------------------------------- |
| 0:00–0:45 | Project overview and architecture                                     |
| 0:45–2:30 | Volunteer, Relief Organization and Admin requests, then a `403`     |
| 2:30–4:20 | Use the User role to create, read, update and delete a community post |
| 4:20–5:00 | `404` after deletion and an invalid email returning `400`         |
| 5:00–7:15 | Stripe sandbox checkout, payment status and cancel handling           |
| 7:15–8:00 | Webhook verification and duplicate-event handling                     |

## Before recording

Use an environment in Postman or Thunder Client with these variables.

| Variable                                                           | Value                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `adminPassword`                                                  | Set this private value to the Admin password shared in chat |
| `userToken`, `volunteerToken`, `reliefToken`, `adminToken` | Save `data.accessToken` from each login below             |
| `postId`, `paymentId`                                          | Leave these blank until the create requests return          |

Select the method, then paste the URL from the text block directly into the URL field. For requests with a body, select **Body → raw → JSON** in Postman or **Body → JSON** in Thunder Client and paste the JSON block. For authenticated requests, choose **Bearer Token** and paste the token variable shown. `{{postId}}` and `{{paymentId}}` resolve to the IDs returned during your recording.

Log in before recording and keep credentials and token responses off screen. Clear the API domain's cookies after copying the tokens, or disable Postman's cookie jar for the demo requests. EDRMS gives the `accessToken` cookie priority over the Bearer header, so a leftover Admin cookie can invalidate the `403` demonstration.

### Prepare the four logins

**Method:** `POST`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/auth/login
```

**Authorization:** No Auth. Send each body as a separate request. Each successful login returns `200 OK`.

**User · Imran Hossain**

```json
{
  "email": "imran.hossain@example.com",
  "password": "Bd@Pass2026!"
}
```

Save `data.accessToken` as `userToken`.

**Volunteer · Rahim Uddin**

```json
{
  "email": "rahim.uddin@example.com",
  "password": "Bd@Pass2026!"
}
```

Save `data.accessToken` as `volunteerToken`.

**Relief Organization · Bangladesh Red Crescent Society – Sylhet Unit**

```json
{
  "email": "nusrat.jahan@example.com",
  "password": "Bd@Pass2026!"
}
```

Save `data.accessToken` as `reliefToken`.

**Admin**

```json
{
  "email": "admin@edrms.org",
  "password": "{{adminPassword}}"
}
```

Save `data.accessToken` as `adminToken`.

## A. Project and architecture · 0:00–0:45

> EDRMS stands for Emergency Disaster Response and Management System. It helps coordinate disaster response in Bangladesh by connecting people who need help with volunteers, relief organizations and administrators. In Express, routes define the endpoint and apply middleware for access control or validation. Controllers handle the request and response, services enforce business rules, and Prisma reads and writes data in PostgreSQL.

Show the community-post module as one concrete example. Open `communityPost.route.ts`, `communityPost.controller.ts` and `communityPost.service.ts` under `src/app/module/communityPost`, then point to `prisma.communityPost.create` in the service.

## B. Three roles and a forbidden request · 0:45–2:30

Show `VOLUNTEER`, `RELIEF_ORG` and `ADMIN` here. The next section shows what a regular `USER` can do. EDRMS also has a `SUPER_ADMIN` role for managing admins.

### 1. Volunteer · View Rahim's volunteer profile

**Method:** `GET`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/volunteers/me
```

**Bearer Token:** `{{volunteerToken}}`
**Expected:** `200 OK`. Show the volunteer profile and explain that Rahim can access his volunteer details.

### 2. Relief Organization · View its recruitment requests

**Method:** `GET`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/volunteers/organization-requests/my-created
```

**Bearer Token:** `{{reliefToken}}`
**Expected:** `200 OK`. Show the returned list of requests created by this organization. An empty array is a valid response.

### 3. Admin · Open the report, then retry as a volunteer

**Method:** `GET`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/admin/reports
```

**First send:** `{{adminToken}}` → `200 OK`. Show the report data.**Second send:** `{{volunteerToken}}` → `403 Forbidden`. Keep the URL and method the same so the role change is clear.

> Rahim is signed in, but the report requires Admin access. The authorization middleware rejects the request before it reaches the report controller.

## C. CRUD · 2:30–4:20

Use Imran's regular User account to create a clearly labeled exercise post. Use the ID from this recording for every follow-up request.

### 4. Create a community post

**Method:** `POST`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/community-posts
```

**Bearer Token:** `{{userToken}}`

```json
{
  "title": "[DEMO] Sunamganj flood relief supply checklist",
  "body": "Training exercise by Imran Hossain. The sample checklist for a Sunamganj relief distribution includes drinking water, oral saline and dry food. This is a fictional exercise."
}
```

**Expected:** `201 Created`. Save `data.id` as `postId` and point out the title and author.

### 5. Read the same post

**Method:** `GET`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/community-posts/{{postId}}
```

**Authorization:** No Auth.
**Expected:** `200 OK`. Show the same ID and title. Keep this request open for the `404` demonstration.

### 6. Update the supply checklist

**Method:** `PATCH`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/community-posts/{{postId}}
```

**Bearer Token:** `{{userToken}}`

```json
{
  "body": "Training exercise by Imran Hossain. The updated sample checklist includes drinking water, oral saline, dry food and hygiene kits. This is a fictional exercise."
}
```

**Expected:** `200 OK`. Point out the added hygiene kits in `data.body`.

### 7. Delete the exercise post

**Method:** `DELETE`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/community-posts/{{postId}}
```

**Bearer Token:** `{{userToken}}`. No body.
**Expected:** `200 OK`. Explain that the service marks the post as deleted and adds a trash entry in the same transaction.

## D. Validation and errors · 4:20–5:00

**`404 Not Found`.** Resend request 5 using the same `postId`. Show `success: false`, `statusCode: 404` and `message: "Community post not found"`.

**`400 Bad Request`.** Duplicate the No Auth login request and use this body.

**Method:** `POST`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/auth/login
```

```json
{
  "email": "rahim.uddin.example.com",
  "password": "demo"
}
```

Show `message: "Validation failed"` and the `errorDetails` entry with `field: "email"` and `message: "Invalid email address"`.

## E. Stripe sandbox payment · 5:00–7:15

### 8. Create a donation and its Checkout session

**Method:** `POST`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/donations/campaigns/4f98c8c6-9771-4012-930f-8d48d4a4f5e0/donate
```

**Bearer Token:** `{{volunteerToken}}`

```json
{
  "amount": 100,
  "provider": "STRIPE",
  "isAnonymous": true
}
```

**Expected:** `201 Created`. Show `data.donationId`, `data.paymentId` and `data.checkoutUrl`. Save `data.paymentId` as `paymentId`. This endpoint creates the donation and immediately starts the payment session, so one request is enough. Keep the Volunteer token on the request so the donation is linked to your account for the next step.

### 9. Read payment status before and after Checkout

**Method:** `GET`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/payments/{{paymentId}}
```

**Bearer Token:** `{{volunteerToken}}`
**Before paying:** `200 OK` with `data.status: "PENDING"` and `data.donation.status: "INITIATED"`.

Open `data.checkoutUrl` in the browser. Confirm Stripe displays **Sandbox** and **BDT 100.00**. Enter the test details and submit the sandbox payment. [Stripe test card documentation](https://docs.stripe.com/testing)

| Field       | Test value                       |
| ----------- | -------------------------------- |
| Email       | `rahim.uddin.demo@example.com` |
| Card number | `4242 4242 4242 4242`          |
| Expiry      | `12/34`                        |
| CVC         | `123`                          |
| Name        | `Rahim Uddin`                  |
| Country     | Bangladesh                       |

**After paying:** Resend request 9. Once the Stripe webhook arrives, show `data.status: "COMPLETED"`, `data.donation.status: "PAID"` and the populated `data.paidAt` field.

**Current deployment behavior.** The tested Stripe session returned the browser to `localhost:5000` after payment. The signed webhook still reached the deployed API and updated the database. If that redirect appears on camera, return to Postman and show the payment record. The production `SERVER_URL` needs the public API address for new Checkout sessions to return to the deployment.

### 10. Show the cancel return handler

**Method:** `GET`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/payments/return/cancel
```

**Authorization:** No Auth.
**Expected:** `200 OK` with a message saying the customer left Stripe Checkout. Explain that this is the page Stripe uses for the Back action. Calling it directly demonstrates the deployed handler. The page itself makes no database update. Stripe's session-expiration webhook closes an expired unpaid session.

**Fallback if the new webhook is delayed during recording**

**Method:** `GET`

```text
https://edrms-express-server-ahmadzubayer.vercel.app/api/donations/campaigns/4f98c8c6-9771-4012-930f-8d48d4a4f5e0/transactions
```

Use `{{adminToken}}`. Find the previously verified Stripe demo donation ID `882f56d9-b366-436f-bfb5-8fa28ef617b7` in `data` and show its `PAID` and `COMPLETED` statuses. Say that it is a rehearsal payment. The same ledger also contains the verified bKash rehearsal donation `91aa985e-a6c9-44c1-b1d1-daed4dc5925f`.

## F. Technical challenge · 7:15–8:00

Open `src/app/module/payment/providers/stripe/stripe.webhook.ts` and `src/app/module/payment/payment.service.ts`. Explain that Stripe sends a signed `checkout.session.completed` event to `POST /api/payments/webhook`. Point to signature verification and `completePaymentIntoDB`.

> Stripe can deliver the same webhook more than once. EDRMS checks the signature against the raw request body and verifies that the session, amount and currency match the payment. A Prisma transaction moves the payment from pending to completed, marks the donation paid and increases the campaign total. The status check prevents a repeated event from crediting the campaign twice. For bKash, the backend verifies the payment by calling bKash's Execute Payment API after its callback, then uses the same transaction to record the donation.
