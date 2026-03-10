import React, { useState } from "react";
import axios from "axios";
import API_URL from "../../config";

const AddUser = ({ handleCloseaddcallformModal, admin_id }) => {
  const [formData, setFormData] = useState({
    username: "",
    ename: "",
    email: "",
    phone: "",
    password: "",
    admin_id: admin_id || ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      alert("Username and password are required");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/add-employee`,
        formData
      );

      alert(response.data.message || "Employee added successfully");
      handleCloseaddcallformModal();
    } catch (error) {
      console.error("Error adding employee:", error);
      alert(
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      <div className="p-8 rounded-2xl bg-white shadow">
        <div className="flex justify-between">
          <h2 className="text-gray-800 text-2xl font-bold">
            Add New Employee
          </h2>
          <svg
            onClick={handleCloseaddcallformModal}
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 ml-2 cursor-pointer fill-gray-400 hover:fill-red-500"
            viewBox="0 0 320.591 320.591"
          >
            <path d="M30.391 318.583..." />
            <path d="M287.9 318.583..." />
          </svg>
        </div>

        <div className="mt-8 space-y-4">

          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            type="text"
            placeholder="Username"
            className="w-full border px-4 py-3 rounded-md"
          />

          <input
            name="ename"
            value={formData.ename}
            onChange={handleChange}
            type="text"
            placeholder="Full Name"
            className="w-full border px-4 py-3 rounded-md"
          />

          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            placeholder="Email"
            className="w-full border px-4 py-3 rounded-md"
          />

          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            type="text"
            placeholder="Phone"
            className="w-full border px-4 py-3 rounded-md"
          />

          <input
            name="password"
            value={formData.password}
            onChange={handleChange}
            type="password"
            placeholder="Password"
            className="w-full border px-4 py-3 rounded-md"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUser;