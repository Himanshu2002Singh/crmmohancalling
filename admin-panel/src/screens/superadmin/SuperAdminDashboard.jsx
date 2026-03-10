import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../config';

function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('pricing');
  const [plans, setPlans] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const navigate = useNavigate();

  // Form states
  const [planForm, setPlanForm] = useState({
    plan_name: '',
    description: '',
    price_per_employee_per_month: '',
    min_employees: 1,
    max_employees: '',
    features: '',
  });

  // Admin creation form
  const [adminForm, setAdminForm] = useState({
    username: '',
    password: '',
    email: '',
    company_name: '',
    phone: '',
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('superadminToken');
    const role = localStorage.getItem('superadminRole');
    
    if (!token || role !== 'superadmin') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch data
  useEffect(() => {
    fetchPlans();
    if (activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/plans`);
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('superadminToken');
      const response = await axios.get(`${API_URL}/superadmin/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(response.data.admins || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('superadminToken');
      
      const data = {
        ...planForm,
        price_per_employee_per_month: parseFloat(planForm.price_per_employee_per_month),
        min_employees: parseInt(planForm.min_employees),
        max_employees: planForm.max_employees ? parseInt(planForm.max_employees) : null,
      };

      if (editingPlan) {
        await axios.put(`${API_URL}/superadmin/plans/${editingPlan.plan_id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/superadmin/plans`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      setEditingPlan(null);
      setPlanForm({
        plan_name: '',
        description: '',
        price_per_employee_per_month: '',
        min_employees: 1,
        max_employees: '',
        features: '',
      });
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan');
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      plan_name: plan.plan_name,
      description: plan.description || '',
      price_per_employee_per_month: plan.price_per_employee_per_month,
      min_employees: plan.min_employees,
      max_employees: plan.max_employees || '',
      features: plan.features || '',
    });
    setShowModal(true);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const token = localStorage.getItem('superadminToken');
      await axios.delete(`${API_URL}/superadmin/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
    }
  };

  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    try {
      const token = localStorage.getItem('superadminToken');
      await axios.put(
        `${API_URL}/superadmin/admin/${adminId}/toggle`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdmins();
    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert('Failed to update admin status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superadminToken');
    localStorage.removeItem('superadminId');
    localStorage.removeItem('superadminUsername');
    localStorage.removeItem('superadminRole');
    navigate('/login');
  };

  // Create new admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('superadminToken');
      
      await axios.post(`${API_URL}/admin/register`, {
        ...adminForm,
        role: 'admin',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Admin created successfully!');
      setShowAdminModal(false);
      setAdminForm({
        username: '',
        password: '',
        email: '',
        company_name: '',
        phone: '',
      });
      fetchAdmins();
    } catch (error) {
      console.error('Error creating admin:', error);
      alert(error.response?.data?.message || 'Failed to create admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-purple-200">
              Welcome, {localStorage.getItem('superadminUsername')}
            </span>
            <button
              onClick={handleLogout}
              className="bg-purple-800 hover:bg-purple-900 px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === 'pricing'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Manage Pricing
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === 'admins'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Manage Admins
          </button>
        </div>

        {/* Content */}
        {activeTab === 'pricing' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Subscription Plans</h2>
              <button
                onClick={() => {
                  setEditingPlan(null);
                  setPlanForm({
                    plan_name: '',
                    description: '',
                    price_per_employee_per_month: '',
                    min_employees: 1,
                    max_employees: '',
                    features: '',
                  });
                  setShowModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                + Add New Plan
              </button>
            </div>

            {loading ? (
              <p className="text-center py-8">Loading...</p>
            ) : plans.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No plans created yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div key={plan.plan_id} className="border rounded-xl p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-800">{plan.plan_name}</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        ₹{plan.price_per_employee_per_month}/employee/month
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 text-sm">{plan.description || 'No description'}</p>
                    <div className="text-sm text-gray-500 mb-4">
                      <p>Min Employees: {plan.min_employees}</p>
                      {plan.max_employees && <p>Max Employees: {plan.max_employees}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.plan_id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">All Admins</h2>
              <button
                onClick={() => setShowAdminModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                + Create New Admin
              </button>
            </div>

            {loading ? (
              <p className="text-center py-8">Loading...</p>
            ) : admins.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No admins found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                      {/* <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Balance</th> */}
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.admin_id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{admin.admin_id}</td>
                        <td className="px-4 py-3 text-sm font-medium">{admin.username}</td>
                        <td className="px-4 py-3 text-sm">{admin.email}</td>
                        <td className="px-4 py-3 text-sm">{admin.company_name || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            admin.role === 'superadmin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {admin.role}
                          </span>
                        </td>
                        {/* <td className="px-4 py-3 text-sm">₹{parseFloat(admin.wallet_balance || 0).toFixed(2)}</td> */}
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            admin.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {admin.role !== 'superadmin' && (
                            <button
                              onClick={() => handleToggleAdminStatus(admin.admin_id, admin.is_active)}
                              className={`px-3 py-1 rounded text-xs ${
                                admin.is_active 
                                  ? 'bg-red-500 hover:bg-red-600' 
                                  : 'bg-green-500 hover:bg-green-600'
                              } text-white`}
                            >
                              {admin.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
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

      {/* Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">
              {editingPlan ? 'Edit Plan' : 'Add New Plan'}
            </h3>
            <form onSubmit={handleSubmitPlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={planForm.plan_name}
                  onChange={(e) => setPlanForm({ ...planForm, plan_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Employee per Month (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={planForm.price_per_employee_per_month}
                  onChange={(e) => setPlanForm({ ...planForm, price_per_employee_per_month: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Employees
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={planForm.min_employees}
                    onChange={(e) => setPlanForm({ ...planForm, min_employees: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Employees (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={planForm.max_employees}
                    onChange={(e) => setPlanForm({ ...planForm, max_employees: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features (comma separated)
                </label>
                <input
                  type="text"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Leads, Attendance, Tasks..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
                >
                  {editingPlan ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Create New Admin</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={adminForm.company_name}
                  onChange={(e) => setAdminForm({ ...adminForm, company_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;

