# Stripe Payment Integration Setup Guide

## Backend Environment Variables

Add these to your `backend/.env` file:

```env
# Stripe API Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173
```

## Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# Stripe Publishable Key (get from https://dashboard.stripe.com/test/apikeys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Stripe Dashboard Setup

### 1. Get API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** → Add to `frontend/.env` as `VITE_STRIPE_PUBLISHABLE_KEY`
3. Copy your **Secret key** → Add to `backend/.env` as `STRIPE_SECRET_KEY`

### 2. Set Up Webhook Endpoint

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. Set endpoint URL:
   - **Local development**: Use Stripe CLI (see below)
   - **Production**: `https://your-domain.com/api/payments/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** → Add to `backend/.env` as `STRIPE_WEBHOOK_SECRET`

### 3. Local Development with Stripe CLI

For local webhook testing, use Stripe CLI:

```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases
# Mac: brew install stripe/stripe-cli/stripe
# Linux: See https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payments/webhook

# Copy the webhook signing secret shown and add to .env
```

## Testing

### Test Card Numbers

Use these test cards in Stripe test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Use any:
- Future expiry date (e.g., 12/34)
- Any 3-digit CVC
- Any ZIP code

### Test Flow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Start Stripe CLI (for webhooks): `stripe listen --forward-to localhost:3000/api/payments/webhook`
4. Go to Portfolio page and click "Add Funds"
5. Select amount and enter test card details
6. Complete payment

## Payment Intent Flow

1. **User selects amount** → Frontend calls `/api/payments/create-payment-intent`
2. **Backend creates Payment Intent** → Returns `clientSecret`
3. **Frontend shows Stripe Elements** → User enters card details
4. **User submits payment** → Frontend calls `stripe.confirmPayment()`
5. **Stripe processes payment** → Webhook sent to backend
6. **Backend updates user balance** → User balance increased

## API Endpoints

### POST `/api/payments/create-payment-intent`
Creates a Payment Intent for the specified amount.

**Request:**
```json
{
  "amount": 100
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_...",
  "paymentIntentId": "pi_..."
}
```

### GET `/api/payments/payment-status?paymentIntentId=pi_...`
Gets the status of a payment intent.

**Response:**
```json
{
  "success": true,
  "status": "succeeded",
  "amount": 100,
  "paid": true
}
```

### POST `/api/payments/webhook`
Stripe webhook endpoint (handled automatically by Stripe).

## Security Notes

- Never expose your Secret Key in frontend code
- Always verify webhook signatures
- Use HTTPS in production
- Store sensitive keys in environment variables only

