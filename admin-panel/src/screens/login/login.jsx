import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../config';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('admin');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/admin/login`, {
        username,
        password,
      });

      const { token, admin } = response.data;

      if (userType === 'superadmin' && admin.role !== 'superadmin') {
        alert('Please use Super Admin credentials');
        return;
      }
      
      if (userType === 'admin' && admin.role === 'superadmin') {
        alert('Please use Super Admin login for superadmin accounts');
        return;
      }

      if (admin.role === 'superadmin') {
        localStorage.setItem('superadminToken', token);
        localStorage.setItem('superadminId', admin.admin_id);
        localStorage.setItem('superadminUsername', admin.username);
        localStorage.setItem('superadminRole', admin.role);
        navigate('/superadmin/dashboard');
      } else {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminId', admin.admin_id);
        localStorage.setItem('adminUsername', admin.username);
        localStorage.setItem('adminRole', admin.role);
        localStorage.setItem('companyName', admin.company_name || '');
        navigate('/admin/home');
      }

    } catch (error) {
      console.error("Login failed", error);
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-700">CRM Login</h2>
        <p className="text-center text-gray-500 mb-6">Login to your account</p>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            className="flex-1 py-2 rounded-md text-sm font-medium transition bg-white text-blue-600 shadow"
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Admin Username
            </label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            For Admin access only
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

