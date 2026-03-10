// Razorpay utility functions

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(window.Razorpay);
    };
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay script'));
    };
    document.body.appendChild(script);
  });
};

// Initialize Razorpay checkout
export const initializeRazorpay = (options) => {
  return new Promise(async (resolve, reject) => {
    try {
      const Razorpay = await loadRazorpayScript();
      const rzp = new Razorpay(options);
      
      rzp.on('payment.success', (response) => {
        resolve(response);
      });
      
      rzp.on('payment.error', (error) => {
        reject(error);
      });
      
      rzp.open();
    } catch (error) {
      reject(error);
    }
  });
};

// Format amount for display
export const formatCurrency = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};

