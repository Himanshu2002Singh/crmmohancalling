import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../config';
import { loadRazorpayScript } from '../../utils/razorpay';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showIncreaseEmployeesModal, setShowIncreaseEmployeesModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [numEmployees, setNumEmployees] = useState(1);
  const [billingType, setBillingType] = useState('monthly');
  const [billingDuration, setBillingDuration] = useState(1);
  const [customDays, setCustomDays] = useState(30);
  const [additionalEmployees, setAdditionalEmployees] = useState(1);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [employeeIncreaseInfo, setEmployeeIncreaseInfo] = useState(null);
  
  const subscriptionModalRef = useRef(null);
  const increaseEmployeesModalRef = useRef(null);
  
  const navigate = useNavigate();

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSubscriptionModal && subscriptionModalRef.current && !subscriptionModalRef.current.contains(event.target)) {
        setShowSubscriptionModal(false);
        setSelectedPlan(null);
        setCalculatedPrice(0);
      }
      if (showIncreaseEmployeesModal && increaseEmployeesModalRef.current && !increaseEmployeesModalRef.current.contains(event.target)) {
        setShowIncreaseEmployeesModal(false);
        setAdditionalEmployees(1);
        setEmployeeIncreaseInfo(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSubscriptionModal, showIncreaseEmployeesModal]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const role = localStorage.getItem('adminRole');
    
    if (!token || (role !== 'admin' && role !== 'superadmin')) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch data
  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
    fetchTransactions();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/plans`);
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/subscription/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentSubscription(response.data.subscription);
    } catch (error) {
      // No active subscription is fine
      setCurrentSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const calculatePrice = async () => {
    if (!selectedPlan) return;
    
    setCalculatingPrice(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_URL}/subscription/create-order`,
        {
          plan_id: selectedPlan.plan_id,
          num_employees: numEmployees,
          billing_type: billingType,
          billing_duration: billingType === 'monthly' ? billingDuration : null,
          custom_days: billingType === 'daily' ? customDays : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCalculatedPrice(response.data.amount);
    } catch (error) {
      console.error('Error calculating price:', error);
      const errorMessage = error.response?.data?.message || 'Failed to calculate price';
      
      // Check if user already has active subscription
      if (error.response?.data?.can_increase_employees) {
        // Show friendly message, not error
        alert(`You already have an active subscription!\n\nCurrent Plan: ${error.response.data.current_subscription?.plan_name}\nValid Till: ${new Date(error.response.data.current_subscription?.end_date).toLocaleDateString()}\n\nYou cannot buy a new plan while having an active subscription.\n\nPlease use "Increase Employees" option to add more employees.`);
        setShowSubscriptionModal(false);
        setShowIncreaseEmployeesModal(true);
      } else {
        alert(errorMessage);
      }
    } finally {
      setCalculatingPrice(false);
    }
  };

  // Check what will happen when employees are increased (preview)
  const previewEmployeeIncrease = async () => {
    if (!additionalEmployees || additionalEmployees <= 0) {
      alert('Please enter valid number of employees');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      // Get current subscription to calculate preview
      const response = await axios.get(`${API_URL}/subscription/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const subscription = response.data.subscription;
      if (!subscription) {
        alert('No active subscription found');
        return;
      }

      // Calculate remaining days
      const now = new Date();
      const endDate = new Date(subscription.end_date);
      const remainingDays = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      
      const oldEmployees = subscription.num_employees;
      const newEmployees = oldEmployees + parseInt(additionalEmployees);
      
      // Calculate new validity
      const newRemainingDays = Math.ceil((remainingDays * oldEmployees) / newEmployees);
      const validityReduced = remainingDays - newRemainingDays;

      setEmployeeIncreaseInfo({
        currentEmployees: oldEmployees,
        newEmployees: newEmployees,
        additionalEmployees: parseInt(additionalEmployees),
        currentValidity: remainingDays,
        newValidity: newRemainingDays,
        validityReduced: validityReduced,
      });
    } catch (error) {
      console.error('Error previewing employee increase:', error);
      alert('Failed to calculate employee increase preview');
    }
  };

  const handleIncreaseEmployees = async () => {
    if (!additionalEmployees || additionalEmployees <= 0) {
      alert('Please enter valid number of employees');
      return;
    }

    setPaymentProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.post(
        `${API_URL}/subscription/increase-employees`,
        {
          additional_employees: parseInt(additionalEmployees),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Employees increased successfully! 
      
From: ${employeeIncreaseInfo.currentEmployees} employees
To: ${employeeIncreaseInfo.newEmployees} employees

Validity reduced from ${employeeIncreaseInfo.currentValidity} days to ${employeeIncreaseInfo.newValidity} days (proportional)`);

      setShowIncreaseEmployeesModal(false);
      setAdditionalEmployees(1);
      setEmployeeIncreaseInfo(null);
      fetchCurrentSubscription();
      fetchTransactions();
    } catch (error) {
      console.error('Error increasing employees:', error);
      alert(error.response?.data?.message || 'Failed to increase employees');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleBuySubscription = async () => {
    if (!selectedPlan) {
      alert('Please select a plan');
      return;
    }

    if (numEmployees < selectedPlan.min_employees) {
      alert(`Minimum ${selectedPlan.min_employees} employees required`);
      return;
    }

    if (!calculatedPrice || calculatedPrice <= 0) {
      alert('Please calculate the price first');
      return;
    }

    setPaymentProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // First, get the Razorpay key from backend
      const keyResponse = await axios.get(`${API_URL}/razorpay-key`);
      const razorpayKeyId = keyResponse.data.key_id;
      
      if (!razorpayKeyId) {
        alert('Payment gateway configuration error. Please contact support.');
        setPaymentProcessing(false);
        return;
      }

      // Create subscription order on backend
      const response = await axios.post(
        `${API_URL}/subscription/create-order`,
        {
          plan_id: selectedPlan.plan_id,
          num_employees: numEmployees,
          billing_type: billingType,
          billing_duration: billingType === 'monthly' ? billingDuration : null,
          custom_days: billingType === 'daily' ? customDays : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Load Razorpay script
      await loadRazorpayScript();

      // Initialize Razorpay checkout for subscription
      const options = {
        key: razorpayKeyId,
        amount: Math.round(calculatedPrice * 100),
        currency: 'INR',
        name: 'TrustingBrains CRM',
        description: `Subscription: ${selectedPlan.plan_name} - ${numEmployees} employees`,
        order_id: response.data.order_id,
        handler: async (paymentResponse) => {
          try {
            await axios.post(
              `${API_URL}/subscription/verify-payment`,
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            alert('Subscription purchased successfully!');
            setShowSubscriptionModal(false);
            setSelectedPlan(null);
            setNumEmployees(1);
            setCalculatedPrice(0);
            fetchCurrentSubscription();
            fetchTransactions();
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: localStorage.getItem('adminUsername') || '',
          email: localStorage.getItem('adminEmail') || '',
        },
        theme: {
          color: '#3B82F6',
        },
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert(error.response?.data?.message || 'Failed to create subscription');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('companyName');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-blue-200">
              {localStorage.getItem('companyName') || localStorage.getItem('adminUsername')}
            </span>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {!currentSubscription && (
            <div 
              onClick={() => setShowSubscriptionModal(true)}
              className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Buy Subscription</h3>
                  <p className="text-sm text-gray-500">Purchase plan for employees</p>
                </div>
              </div>
            </div>
          )}

          {currentSubscription && (
            <div 
              onClick={() => {
                previewEmployeeIncrease();
                setShowIncreaseEmployeesModal(true);
              }}
              className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Increase Employees</h3>
                  <p className="text-sm text-gray-500">Add more employee seats</p>
                </div>
              </div>
            </div>
          )}

          <div 
            onClick={() => setActiveTab('transactions')}
            className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Transactions</h3>
                <p className="text-sm text-gray-500">View payment history</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === 'subscription'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            My Subscription
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === 'transactions'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Transactions
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Subscription Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Current Subscription</h3>
              {currentSubscription ? (
                <div>
                  <p className="text-2xl font-bold text-gray-800 mb-2">
                    {currentSubscription.plan_name}
                  </p>
                  <p className="text-gray-600 mb-2">
                    {currentSubscription.num_employees} Employees
                  </p>
                  <p className="text-sm text-gray-500">
                    Valid till: {new Date(currentSubscription.end_date).toLocaleDateString()}
                  </p>
                  <div className={`mt-3 inline-block px-3 py-1 rounded text-sm ${
                    currentSubscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {currentSubscription.status}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">No active subscription</p>
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Buy Subscription
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Current Plan</span>
                  <span className="font-semibold">{currentSubscription?.plan_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Employee Limit</span>
                  <span className="font-semibold">{currentSubscription?.num_employees || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Transactions</span>
                  <span className="font-semibold">{transactions.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">My Subscription</h2>
            {currentSubscription ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Plan Name</p>
                    <p className="font-semibold">{currentSubscription.plan_name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Employees</p>
                    <p className="font-semibold">{currentSubscription.num_employees}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-semibold">
                      {new Date(currentSubscription.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-semibold">
                      {new Date(currentSubscription.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-semibold">₹{currentSubscription.total_amount}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-semibold ${
                      currentSubscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {currentSubscription.status}
                    </p>
                  </div>
                </div>
                
                {/* Increase Employees Button */}
                <div className="mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      previewEmployeeIncrease();
                      setShowIncreaseEmployeesModal(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Increase Employee Limit
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Note: Increasing employees will reduce validity proportionally (no extra payment)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You don't have an active subscription</p>
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Buy Subscription Now
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Transaction History</h2>
            {transactions.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No transactions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Method</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.transaction_id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            txn.transaction_type === 'credit' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {txn.transaction_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          ₹{txn.amount}
                        </td>
                        <td className="px-4 py-3 text-sm capitalize">{txn.payment_method}</td>
                        <td className="px-4 py-3 text-sm">{txn.description || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            txn.status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : txn.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={subscriptionModalRef} className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Buy Subscription</h3>
            
            {/* Plans */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Plan
              </label>
              <div className="grid grid-cols-1 gap-2">
                {plans.map((plan) => (
                  <div
                    key={plan.plan_id}
                    onClick={() => {
                      setSelectedPlan(plan);
                      setCalculatedPrice(0);
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedPlan?.plan_id === plan.plan_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{plan.plan_name}</p>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">₹{plan.price_per_employee_per_month}</p>
                        <p className="text-xs text-gray-500">per employee/month</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPlan && (
              <>
                {/* Number of Employees */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Employees
                  </label>
                  <input
                    type="number"
                    min={selectedPlan.min_employees}
                    max={selectedPlan.max_employees || 9999}
                    value={numEmployees}
                    onChange={(e) => {
                      setNumEmployees(parseInt(e.target.value) || 1);
                      setCalculatedPrice(0);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Min: {selectedPlan.min_employees}
                    {selectedPlan.max_employees && `, Max: ${selectedPlan.max_employees}`}
                  </p>
                </div>

                {/* Billing Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="billingType"
                        value="monthly"
                        checked={billingType === 'monthly'}
                        onChange={(e) => {
                          setBillingType(e.target.value);
                          setCalculatedPrice(0);
                        }}
                        className="mr-2"
                      />
                      Monthly
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="billingType"
                        value="daily"
                        checked={billingType === 'daily'}
                        onChange={(e) => {
                          setBillingType(e.target.value);
                          setCalculatedPrice(0);
                        }}
                        className="mr-2"
                      />
                      Daily
                    </label>
                  </div>
                </div>

                {/* Billing Duration - Only show for monthly */}
                {billingType === 'monthly' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Duration (1 Month = 30 Days)
                    </label>
                    <select
                      value={billingDuration}
                      onChange={(e) => {
                        setBillingDuration(parseInt(e.target.value));
                        setCalculatedPrice(0);
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 Month (30 Days)</option>
                      <option value={2}>2 Months (60 Days)</option>
                      <option value={3}>3 Months (90 Days)</option>
                      <option value={6}>6 Months (180 Days)</option>
                      <option value={12}>12 Months (360 Days)</option>
                    </select>
                  </div>
                )}

                {billingType === 'daily' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={customDays}
                      onChange={(e) => {
                        setCustomDays(parseInt(e.target.value) || 1);
                        setCalculatedPrice(0);
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Calculate Button */}
                <button
                  onClick={calculatePrice}
                  disabled={calculatingPrice}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg mb-4 disabled:opacity-50"
                >
                  {calculatingPrice ? 'Calculating...' : 'Calculate Price'}
                </button>

                {/* Calculated Price */}
                {calculatedPrice > 0 && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-center">
                      <span className="text-gray-600">Total: </span>
                      <span className="text-2xl font-bold text-green-600">₹{calculatedPrice.toFixed(2)}</span>
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setSelectedPlan(null);
                  setCalculatedPrice(0);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBuySubscription}
                disabled={paymentProcessing || !calculatedPrice}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {paymentProcessing ? 'Processing...' : 'Proceed to Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Increase Employees Modal */}
      {showIncreaseEmployeesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={increaseEmployeesModalRef} className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Increase Employee Limit</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Employees
              </label>
              <input
                type="number"
                min="1"
                value={additionalEmployees}
                onChange={(e) => {
                  setAdditionalEmployees(e.target.value);
                  setEmployeeIncreaseInfo(null);
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter number of employees to add"
              />
            </div>

            <button
              onClick={previewEmployeeIncrease}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg mb-4"
            >
              Preview Changes
            </button>

            {/* Preview Info */}
            {employeeIncreaseInfo && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold mb-2">Preview Changes:</h4>
                <div className="space-y-1 text-sm">
                  <p>Current Employees: <span className="font-bold">{employeeIncreaseInfo.currentEmployees}</span></p>
                  <p>After Increase: <span className="font-bold">{employeeIncreaseInfo.newEmployees}</span></p>
                  <p className="border-t border-orange-200 pt-1 mt-1">
                    Current Validity: <span className="font-bold">{employeeIncreaseInfo.currentValidity} days</span>
                  </p>
                  <p>
                    New Validity: <span className="font-bold">{employeeIncreaseInfo.newValidity} days</span>
                  </p>
                  <p className="text-red-600">
                    Validity Reduced: <span className="font-bold">{employeeIncreaseInfo.validityReduced} days</span>
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  * Validity is reduced proportionally - no extra payment required!
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowIncreaseEmployeesModal(false);
                  setAdditionalEmployees(1);
                  setEmployeeIncreaseInfo(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleIncreaseEmployees}
                disabled={paymentProcessing || !employeeIncreaseInfo}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {paymentProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

