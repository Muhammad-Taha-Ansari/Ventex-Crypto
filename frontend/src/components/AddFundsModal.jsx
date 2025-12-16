import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import Swal from 'sweetalert2';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Initialize Stripe - get key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('⚠️ VITE_STRIPE_PUBLISHABLE_KEY is not set in frontend/.env file');
  console.error('Please create frontend/.env and add: VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...');
}
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

// Inner component that uses Stripe hooks
const PaymentForm = ({ clientSecret, amount, onSuccess, onClose, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!stripePromise) {
      setError('Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY in frontend/.env');
    }
  }, []);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not loaded. Please wait...');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        setLoading(false);
        return;
      }

      // Confirm payment
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/portfolio?payment=success`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      if (result.paymentIntent) {
        if (result.paymentIntent.status === 'succeeded') {
          // Payment succeeded - verify and update balance
          try {
            console.log('Payment succeeded, verifying and updating balance...');
            // Verify payment status (this will also update balance if webhook hasn't fired)
            const statusResponse = await api.get(`/payments/payment-status?paymentIntentId=${result.paymentIntent.id}`);
            console.log('Payment status response:', statusResponse.data);
            
            if (statusResponse.data.paid) {
              const paidAmount = statusResponse.data.amount || parseFloat(amount);
              const newBalance = statusResponse.data.newBalance;
              
              // Show success notification
              await Swal.fire({
                icon: 'success',
                title: 'Payment Successful!',
                html: `
                  <div style="text-align: center;">
                    <p style="font-size: 18px; margin-bottom: 10px;">Funds Added Successfully</p>
                    <p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 10px 0;">
                      +$${parseFloat(paidAmount).toFixed(2)}
                    </p>
                    ${newBalance !== undefined ? `
                      <p style="color: #9ca3af; margin-top: 10px;">
                        New Balance: <span style="color: white; font-weight: bold;">$${parseFloat(newBalance).toFixed(2)}</span>
                      </p>
                    ` : ''}
                  </div>
                `,
                confirmButtonColor: '#9333ea',
                confirmButtonText: 'Great!',
                timer: 3000,
                timerProgressBar: true,
              });
              
              // Refresh user data to get updated balance
              await fetchUser();
              
              // Wait a moment for user data to update
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Call onSuccess to refresh portfolio
              onSuccess?.();
              
              // Close modal
              onClose();
            } else {
              setError('Payment verification failed. Please refresh your portfolio.');
              setLoading(false);
            }
          } catch (verifyError) {
            console.error('Error verifying payment:', verifyError);
            // Show error notification
            await Swal.fire({
              icon: 'error',
              title: 'Payment Verification Failed',
              text: verifyError.response?.data?.message || 'Unable to verify payment. Please check your portfolio.',
              confirmButtonColor: '#ef4444',
            });
            setLoading(false);
          }
        } else if (result.paymentIntent.status === 'requires_action') {
          // Payment requires additional authentication (3D Secure)
          setError('Payment requires additional authentication. Please complete the verification.');
          setLoading(false);
        } else {
          // Other status
          setError(`Payment status: ${result.paymentIntent.status}`);
          setLoading(false);
        }
      } else {
        // No payment intent returned
        setError('Payment confirmation failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Error processing payment');
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-2">Complete Payment</h2>
      <p className="text-white/60 text-sm mb-6">
        Amount: ${amount}
      </p>

      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10" style={{ minHeight: '300px', maxHeight: '450px', overflowY: 'auto' }}>
          {stripe && elements && clientSecret ? (
            <div id="payment-element-container" className="w-full">
              <style>{`
                #payment-element-container .Input {
                  background-color: rgba(255, 255, 255, 0.05) !important;
                  color: #ffffff !important;
                  border-color: rgba(255, 255, 255, 0.1) !important;
                }
                #payment-element-container .Input:focus {
                  border-color: #9333ea !important;
                  box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2) !important;
                }
                #payment-element-container .Label {
                  color: rgba(255, 255, 255, 0.8) !important;
                }
                #payment-element-container .Tab {
                  background-color: rgba(255, 255, 255, 0.05) !important;
                  color: rgba(255, 255, 255, 0.7) !important;
                  border-color: rgba(255, 255, 255, 0.1) !important;
                }
                #payment-element-container .Tab--selected {
                  background-color: #9333ea !important;
                  color: #ffffff !important;
                }
              `}</style>
              <PaymentElement 
                options={{
                  layout: 'tabs',
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                <div className="text-white/60 text-sm">
                  {!stripePromise ? 'Stripe not configured' : !stripe ? 'Loading Stripe...' : !elements ? 'Loading payment form...' : 'Initializing...'}
                </div>
                {!stripePromise && (
                  <div className="text-red-400 text-xs mt-2">
                    Set VITE_STRIPE_PUBLISHABLE_KEY in frontend/.env
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all duration-200"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !stripe || !elements || !clientSecret}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>

        <p className="text-white/40 text-xs text-center">
          Your payment is secure and encrypted
        </p>
      </form>
    </>
  );
};

const AddFundsModal = ({ isOpen, onClose, onSuccess }) => {
  const { fetchUser } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');

  const presetAmounts = [10, 50, 100, 500];

  const handleAmountSelection = async () => {
    const amount = selectedAmount || parseFloat(customAmount);

    if (!amount || amount <= 0) {
      setError('Please select or enter a valid amount');
      return;
    }

    if (amount < 1) {
      setError('Minimum amount is $1');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/payments/create-payment-intent', {
        amount: amount,
      });

      setClientSecret(response.data.clientSecret);
      setPaymentIntentId(response.data.paymentIntentId);
      setShowPaymentForm(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowPaymentForm(false);
    setClientSecret('');
    setPaymentIntentId('');
    setSelectedAmount(null);
    setCustomAmount('');
    setError('');
    onClose();
  };

  const handlePresetClick = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setError('');
  };

  const handleCustomChange = (value) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    setError('');
  };

  // Check for payment success on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const paymentIntent = urlParams.get('payment_intent');

    if (payment === 'success' && paymentIntent) {
      // Verify payment and refresh
      api.get(`/payments/payment-status?paymentIntentId=${paymentIntent}`)
        .then(async (response) => {
          if (response.data.paid) {
            const amount = response.data.amount;
            const newBalance = response.data.newBalance;
            
            // Show success notification
            await Swal.fire({
              icon: 'success',
              title: 'Payment Successful!',
              html: `
                <div style="text-align: center;">
                  <p style="font-size: 18px; margin-bottom: 10px;">Funds Added Successfully</p>
                  <p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 10px 0;">
                    +$${parseFloat(amount).toFixed(2)}
                  </p>
                  ${newBalance !== undefined ? `
                    <p style="color: #9ca3af; margin-top: 10px;">
                      New Balance: <span style="color: white; font-weight: bold;">$${parseFloat(newBalance).toFixed(2)}</span>
                    </p>
                  ` : ''}
                </div>
              `,
              confirmButtonColor: '#9333ea',
              confirmButtonText: 'Great!',
              timer: 3000,
              timerProgressBar: true,
            });
            
            // Refresh user data to get updated balance
            await fetchUser();
            // Refresh portfolio
            onSuccess?.();
          }
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch((error) => {
          console.error('Error verifying payment:', error);
          // Still refresh even if verification fails (webhook will handle it)
          fetchUser();
          onSuccess?.();
          window.history.replaceState({}, '', window.location.pathname);
        });
    } else if (payment === 'cancelled') {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [onSuccess]);

  if (!isOpen) return null;

  if (!stripePromise) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl p-6">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">⚠️ Stripe Not Configured</div>
            <p className="text-white/80 mb-4">
              Please create a <code className="bg-white/10 px-2 py-1 rounded">frontend/.env</code> file and add:
            </p>
            <code className="block bg-white/5 p-3 rounded text-left text-sm text-white/60 mb-4">
              VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
            </code>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-md my-4 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 2rem)' }}>
          {!showPaymentForm ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Add Funds</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-3">Select Amount</label>
                  <div className="grid grid-cols-2 gap-3">
                    {presetAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handlePresetClick(amount)}
                        className={`px-4 py-3 rounded-lg border transition-all duration-200 ${
                          selectedAmount === amount
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent'
                            : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-center text-white/60">OR</div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Custom Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={customAmount}
                      onChange={(e) => handleCustomChange(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {(selectedAmount || customAmount) && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Amount:</span>
                      <span className="text-white font-semibold">
                        ${selectedAmount || parseFloat(customAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAmountSelection}
                  disabled={loading || (!selectedAmount && !customAmount)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>

                <p className="text-white/40 text-xs text-center">
                  Secure payment powered by Stripe
                </p>
              </div>
            </>
          ) : (
            clientSecret && stripePromise ? (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#9333ea',
                      colorBackground: '#0f172a',
                      colorText: '#ffffff',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      spacingUnit: '4px',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <PaymentForm
                  clientSecret={clientSecret}
                  amount={selectedAmount || parseFloat(customAmount).toFixed(2)}
                  onSuccess={onSuccess}
                  onClose={handleClose}
                  onBack={() => setShowPaymentForm(false)}
                />
              </Elements>
            ) : (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-white/60">Loading payment form...</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFundsModal;
