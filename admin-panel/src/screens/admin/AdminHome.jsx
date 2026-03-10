import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../../config';
import { loadRazorpayScript } from '../../utils/razorpay';

function AdminHome() {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showIncreaseEmployeesModal, setShowIncreaseEmployeesModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [numEmployees, setNumEmployees] = useState(1);
  const [billingType, setBillingType] = useState('monthly');
  const [customDays, setCustomDays] = useState(30);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [additionalEmployees, setAdditionalEmployees] = useState(1);
  const [employeeIncreaseInfo, setEmployeeIncreaseInfo] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const role = localStorage.getItem('adminRole');
    
    if (!token || role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch data
  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
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
      setCurrentSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async () => {
    if (!selectedPlan) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_URL}/subscription/create-order`,
        {
          plan_id: selectedPlan.plan_id,
          num_employees: numEmployees,
          billing_type: billingType,
          custom_days: billingType === 'daily' ? customDays : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCalculatedPrice(response.data.amount);
    } catch (error) {
      console.error('Error calculating price:', error.response);
      // Show the exact error message from the API
      console.log("===================>",error.response?.data?.message);
      const errorMessage = error.response?.data?.message || 'Failed to calculate price';
      alert(errorMessage);
    }
  };

  // Preview employee increase
  const previewEmployeeIncrease = async () => {
    if (!additionalEmployees || additionalEmployees <= 0) {
      alert('Please enter valid number of employees');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.get(`${API_URL}/subscription/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const subscription = response.data.subscription;
      if (!subscription) {
        alert('No active subscription found');
        return;
      }

      const now = new Date();
      const endDate = new Date(subscription.end_date);
      const remainingDays = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      
      const oldEmployees = subscription.num_employees;
      const newEmployees = oldEmployees + parseInt(additionalEmployees);
      
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
    } catch (error) {
      console.error('Error increasing employees:', error);
      alert(error.response?.data?.message || 'Failed to increase employees');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleBuySubscription = async () => {
    if (!selectedPlan || calculatedPrice <= 0) {
      alert('Please select a plan and calculate price first');
      return;
    }

    setPaymentProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      const keyResponse = await axios.get(`${API_URL}/razorpay-key`);
      const razorpayKeyId = keyResponse.data.key_id;
      
      if (!razorpayKeyId) {
        alert('Payment gateway configuration error. Please contact support.');
        setPaymentProcessing(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/subscription/create-order`,
        {
          plan_id: selectedPlan.plan_id,
          num_employees: numEmployees,
          billing_type: billingType,
          custom_days: billingType === 'daily' ? customDays : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await loadRazorpayScript();

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
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: localStorage.getItem('adminUsername') || '',
          email: localStorage.getItem('email') || '',
        },
        theme: {
          color: '#3B82F6',
        },
      };

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

  const adminName = localStorage.getItem('adminUsername') || localStorage.getItem('companyName') || 'Admin';

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <header className="bg-white shadow-md rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Welcome,</p>
                <p className="font-semibold">{adminName}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-medium">{adminName.slice(0, 2).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Subscription</p>
            <p className="text-xl font-bold text-purple-600">{currentSubscription?.plan_name || 'No Plan'}</p>
            <button onClick={() => setShowSubscriptionModal(true)} className="text-blue-600 text-sm hover:underline">Manage</button>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Employees Allowed</p>
            <p className="text-2xl font-bold text-blue-600">{currentSubscription?.num_employees || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Valid Till</p>
            <p className="text-lg font-bold text-gray-800">
              {currentSubscription ? new Date(currentSubscription.end_date).toLocaleDateString() : '-'}
            </p>
          </div>
          {currentSubscription && (
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-gray-500 text-sm">Increase Employees</p>
              <button 
                onClick={() => {
                  previewEmployeeIncrease();
                  setShowIncreaseEmployeesModal(true);
                }}
                className="text-lg font-bold text-orange-600 hover:underline"
              >
                + Add More
              </button>
            </div>
          )}
        </div>

        {/* CRM Features Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">CRM Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/leads" className="p-4 border rounded-lg hover:shadow-md transition text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="font-semibold">Leads</p>
            </Link>
            <Link to="/add-users" className="p-4 border rounded-lg hover:shadow-md transition text-center">
              <div className="text-3xl mb-2">👥</div>
              <p className="font-semibold">Employees</p>
            </Link>
            <Link to="/attendance" className="p-4 border rounded-lg hover:shadow-md transition text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="font-semibold">Attendance</p>
            </Link>
            <Link to="/tasks" className="p-4 border rounded-lg hover:shadow-md transition text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold">Tasks</p>
            </Link>
            <Link to="/performance" className="p-4 border rounded-lg hover:shadow-md transition text-center">
              <div className="text-3xl mb-2">📊</div>
              <p className="font-semibold">Performance</p>
            </Link>
            <Link to="/lead_report" className="p-4 border rounded-lg hover:shadow-md transition text-center">
              <div className="text-3xl mb-2">📈</div>
              <p className="font-semibold">Lead Report</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Buy Subscription</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
              <div className="grid grid-cols-1 gap-2">
                {plans.map((plan) => (
                  <div
                    key={plan.plan_id}
                    onClick={() => { setSelectedPlan(plan); setCalculatedPrice(0); }}
                    className={`p-4 border rounded-lg cursor-pointer transition ${selectedPlan?.plan_id === plan.plan_id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
                  <input
                    type="number"
                    min={selectedPlan.min_employees}
                    value={numEmployees}
                    onChange={(e) => { setNumEmployees(parseInt(e.target.value) || 1); setCalculatedPrice(0); }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Billing Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input type="radio" name="billingType" value="monthly" checked={billingType === 'monthly'} onChange={(e) => { setBillingType(e.target.value); setCalculatedPrice(0); }} className="mr-2" />
                      Monthly
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="billingType" value="daily" checked={billingType === 'daily'} onChange={(e) => { setBillingType(e.target.value); setCalculatedPrice(0); }} className="mr-2" />
                      Daily
                    </label>
                  </div>
                </div>

                {billingType === 'daily' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Days</label>
                    <input
                      type="number"
                      min="1"
                      value={customDays}
                      onChange={(e) => { setCustomDays(parseInt(e.target.value) || 1); setCalculatedPrice(0); }}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}

                <button onClick={calculatePrice} className="w-full bg-gray-200 py-2 rounded-lg mb-4">Calculate Price</button>

                {calculatedPrice > 0 && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <span className="text-gray-600">Total: </span>
                    <span className="text-2xl font-bold text-green-600">₹{calculatedPrice.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowSubscriptionModal(false); setSelectedPlan(null); setCalculatedPrice(0); }} className="flex-1 bg-gray-300 py-2 rounded-lg">Cancel</button>
              <button onClick={handleBuySubscription} disabled={paymentProcessing || !calculatedPrice} className="flex-1 bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50">
                {paymentProcessing ? 'Processing...' : 'Proceed to Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Increase Employees Modal */}
      {showIncreaseEmployeesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
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
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter number of employees to add"
              />
            </div>

            <button
              onClick={previewEmployeeIncrease}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg mb-4"
            >
              Preview Changes
            </button>

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

export default AdminHome;

