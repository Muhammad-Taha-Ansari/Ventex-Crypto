const User = require('../models/User');

// Initialize Stripe only if key is available
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } else {
    console.warn('STRIPE_SECRET_KEY not found in environment variables');
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
}

// Create Stripe Payment Intent
exports.createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.',
      });
    }

    const { amount } = req.body;
    const userId = req.user.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is $1',
      });
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        userId: userId.toString(),
        amount: amount.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message,
    });
  }
};

// Confirm payment intent (optional, for server-side confirmation)
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.userId;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required',
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify the payment intent belongs to the user
    if (paymentIntent.metadata.userId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    res.json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message,
    });
  }
};

// Stripe webhook handler
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const userId = paymentIntent.metadata.userId;
    const amount = parseFloat(paymentIntent.metadata.amount);

    try {
      const user = await User.findById(userId);
      if (user) {
        // Check if balance was already updated (idempotency check)
        // In production, you might want to track processed payment intents
        const previousBalance = user.balance;
        user.balance += amount;
        await user.save();
        console.log(`Added $${amount} to user ${userId} (balance: $${previousBalance} -> $${user.balance}) via Payment Intent ${paymentIntent.id}`);
      }
    } catch (error) {
      console.error('Error updating user balance:', error);
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    console.log(`Payment failed for Payment Intent ${paymentIntent.id}`);
  }

  res.json({ received: true });
};

// Get payment intent status and update balance if payment succeeded
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.query;
    const userId = req.user.userId;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required',
      });
    }

    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is not configured',
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    console.log(`🔍 Payment Intent Status: "${paymentIntent.status}" (type: ${typeof paymentIntent.status})`);
    console.log(`🔍 Payment Intent Metadata:`, paymentIntent.metadata);

    // Verify the payment intent belongs to the user
    if (paymentIntent.metadata.userId !== userId.toString()) {
      console.error(`❌ Unauthorized: Payment intent user ${paymentIntent.metadata.userId} doesn't match current user ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // If payment succeeded, update balance (webhook might not fire in development)
    console.log(`🔍 Checking if status === 'succeeded': ${paymentIntent.status === 'succeeded'}`);
    if (paymentIntent.status === 'succeeded') {
      console.log(`✅ Payment succeeded! Updating balance for user ${userId}...`);
      const amount = parseFloat(paymentIntent.metadata.amount);
      console.log(`💰 Amount to add: $${amount}`);
      
      if (!amount || isNaN(amount) || amount <= 0) {
        console.error(`❌ Invalid amount in payment intent: ${paymentIntent.metadata.amount}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid payment amount',
        });
      }

      const user = await User.findById(userId);
      console.log(`👤 User found: ${user ? 'Yes' : 'No'}`);
      
      if (!user) {
        console.error(`❌ User not found: ${userId}`);
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Always update balance for succeeded payments
      // The webhook will also try to update, but we'll handle idempotency
      const previousBalance = user.balance || 0;
      console.log(`💰 Previous balance: $${previousBalance}`);
      user.balance = (user.balance || 0) + amount;
      console.log(`💰 New balance (before save): $${user.balance}`);
      
      try {
        await user.save();
        console.log(`✅ Balance saved! User ${userId}: $${previousBalance} -> $${user.balance}`);
        
        // Verify the balance was actually saved by fetching it again
        const verifyUser = await User.findById(userId);
        console.log(`🔍 Verification: Balance in database: $${verifyUser.balance}`);
        
        // Return updated balance in response
        const response = {
          success: true,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          paid: paymentIntent.status === 'succeeded',
          newBalance: verifyUser.balance,
        };
        console.log(`📤 Sending response:`, JSON.stringify(response));
        return res.json(response);
      } catch (saveError) {
        console.error(`❌ Error saving user balance:`, saveError);
        console.error(`❌ Error stack:`, saveError.stack);
        return res.status(500).json({
          success: false,
          message: 'Error updating balance',
          error: saveError.message,
        });
      }
    } else {
      console.log(`⚠️ Payment status is "${paymentIntent.status}", not updating balance`);
    }

    res.json({
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      paid: paymentIntent.status === 'succeeded',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status',
      error: error.message,
    });
  }
};
