import React, { useState, useEffect } from 'react';
import moment from "moment";
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  BarChart2, 
  PieChart as PieChartIcon, 
  Users, 
  Phone, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock,
  UserCheck,
  ListChecks,
  Search
} from 'lucide-react';
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import API_URL from '../../config';

const PerformanceScreen = () => {
  const [employee, setEmployee] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [calls, setCalls] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCallId, setExpandedCallId] = useState(null);

  // Calculate stats
  const totalCalls = calls.length;
  const totalTasks = tasks.length;
  const totalAttendance = attendance.length;

  // Task status counts
  const initialTasks = tasks.filter(task => task.status === 'Initial').length;
  const onGoingTasks = tasks.filter(task => task.status === 'On Going').length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;

  // Attendance status counts
  const fullAttendance = attendance.filter(a => a.isLate === false).length;
  const lateAttendance = attendance.filter(a => a.isLate === true).length;

  // Lead status counts
  const freshLeads = leads.filter(lead => lead.status === 'Fresh Lead').length;
  const interestedLeads = leads.filter(lead => lead.status === 'Interested');
  const callBackLeads = leads.filter(lead => lead.status === 'Call Back');
  const noRequirementLeads = leads.filter(lead => lead.status === 'No Requirement');
  const lineUpLeads = leads.filter(lead => lead.status === 'LineUp');
  const lineUpDropoutLeads = leads.filter(lead => lead.status === 'LineUp Dropout');
  const interviewRejectedLeads = leads.filter(lead => lead.status === 'Interview Rejected');
  const interviewPendingLeads = leads.filter(lead => lead.status === 'Interview Pending');
  const interviewDoneLeads = leads.filter(lead => lead.status === 'Interview Done');
  const interviewSelectedLeads = leads.filter(lead => lead.status === 'Interview Selected');
  const joinedLeads = leads.filter(lead => lead.status === 'Joined');
  const oneMonthCompletedLeads = leads.filter(lead => lead.status === '1 Month Completed');
  const twoMonthsCompletedLeads = leads.filter(lead => lead.status === '2 Months Completed');
  const threeMonthsCompletedLeads = leads.filter(lead => lead.status === '3 Months Completed');

  // Task status data for chart
  const taskStatusData = [
    { name: 'Initial', value: initialTasks, color: '#f59e0b' },
    { name: 'On Going', value: onGoingTasks, color: '#3b82f6' },
    { name: 'Completed', value: completedTasks, color: '#10b981' }
  ];

  // Attendance status data for chart
  const attendanceData = [
    { name: 'Present', value: fullAttendance, color: '#10b981' },
    { name: 'Late', value: lateAttendance, color: '#f59e0b' },
  ];

  // Lead status data for chart
  const leadStatusData = [
    { name: 'Fresh Leads', value: freshLeads, color: '#f59e0b' },
    { name: "Interested", value: interestedLeads.length, color: "#10b981" },
    { name: "Call Back", value: callBackLeads.length, color: "#3b82f6" },
    { name: "No Requirement", value: noRequirementLeads.length, color: "#ef4444" },
    { name: "LineUp", value: lineUpLeads.length, color: "#8b5cf6" },
    { name: "LineUp Dropout", value: lineUpDropoutLeads.length, color: "#f97316" },
    { name: "Interview Rejected", value: interviewRejectedLeads.length, color: "#dc2626" },
    { name: "Interview Pending", value: interviewPendingLeads.length, color: "#f59e0b" },
    { name: "Interview Done", value: interviewDoneLeads.length, color: "#06b6d4" },
    { name: "Interview Selected", value: interviewSelectedLeads.length, color: "#14b8a6" },
    { name: "Joined", value: joinedLeads.length, color: "#22c55e" },
    { name: "1 Month Completed", value: oneMonthCompletedLeads.length, color: "#84cc16" },
    { name: "2 Months Completed", value: twoMonthsCompletedLeads.length, color: "#a3e635" },
    { name: "3 Months Completed", value: threeMonthsCompletedLeads.length, color: "#eab308" }
  ];

  // Fetch all employees on component mount
  useEffect(() => {
    const fetchAllEmployees = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('superadminToken');
        const response = await axios.get(`${API_URL}/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllEmployees(response.data.employees);
      } catch (error) {
        console.error("Error fetching employees", error);
      } finally{
        setLoading(false);
      }
    };
    
    fetchAllEmployees();
  }, []);

  // Set default dates (current month)
  useEffect(() => {
    const now = new Date();
    
    // First day of current month
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Last day of current month
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setFromDate(formatDate(startDate));
    setToDate(formatDate(endDate));
  }, []);

  // Fetch performance data when dates or selected employee changes
  useEffect(() => {
    if (fromDate && toDate && employee) {
      fetchData();
    }
  }, [fromDate, toDate, employee]);

  const fetchData = async () => {
    try {
      if(employee!==null){
        setLoading(true);
      }
      
      const params = { 
        startDate: fromDate,
        endDate: toDate,
        userId : employee.emp_id
      };
      const token = localStorage.getItem('adminToken') || localStorage.getItem('superadminToken');

      const [callsRes, tasksRes, leadsRes, attendanceRes] = await Promise.all([
        axios.get(`${API_URL}/filterCalls/${employee.emp_id}`, { params, headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/task/${employee.emp_id}`, { params, headers: { Authorization: `Bearer ${token}` } }),
        
        axios.get(`${API_URL}/getLeadsByEmpIdAndDate/${employee.emp_id}`, { params, headers: { Authorization: `Bearer ${token}` } }),

        axios.get(`${API_URL}/monthlyattendance/2025-01`, { params, headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setCalls(callsRes.data);
      setTasks(tasksRes.data.tasks);
      
      setLeads(leadsRes.data);
      // console.log("asdfghjsdfghjkdfghj");
      // console.log("dfghjklxcvbnm,zxcvbnm,",attendanceRes);
      setAttendance(attendanceRes.data.attendance);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching performance data", error);
      setLoading(false);
    }
  };

  const handleEmployeeChange = (e) => {
    const selectedEmp = JSON.parse(e.target.value);
    setEmployee(selectedEmp);
  };

  const renderPieChart = (data, title) => {
    return (
      <div className="bg-white rounded-lg shadow p-4 h-full">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${(value)}`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}`, 'Count']}
                labelFormatter={(name) => `Status: ${name}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

const renderBarChart = (data, title, dataKey = "value") => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
      <h3 className="text-xl font-bold text-gray-800 mb-6">{title}</h3>
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 40,
              bottom: 20,
            }}
            layout="vertical" // Horizontal bars
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12, fill: "#4b5563" }} />
            <YAxis
              dataKey="name"
              type="category"
              width={120}
              tick={{ fontSize: 12, fill: "#4b5563", fontWeight: 500 }}
              interval={0} 
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#f9fafb", borderRadius: "8px", borderColor: "#e5e7eb" }}
              formatter={(value) => [`${value}`, 'Count']}
              labelFormatter={(name) => `Category: ${name}`}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#4b5563" }} />
            <Bar dataKey={dataKey} radius={[8, 8, 8, 8]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

  const callsPerDay = calls.reduce((acc, call) => {
    const date = moment(call.createdAt).format("YYYY-MM-DD");
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // 🔥 2. Find min & max date from calls
  const dates = calls.map(call => moment(call.createdAt));
  const minDate = moment.min(dates);
  const maxDate = moment.max(dates);

  // 🔥 3. Fill all dates (even with 0 calls)
  const chartData = [];
  for (let m = minDate.clone(); m.diff(maxDate) <= 0; m.add(1, "day")) {
    const dateStr = m.format("YYYY-MM-DD");
    chartData.push({
      date: dateStr,
      calls: callsPerDay[dateStr] || 0,
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Employee Performance Dashboard
            </h1>
            {employee && (
              <p className="text-gray-600">
                {employee.ename} - {employee.emp_id}
              </p>
            )}
            <p className="text-gray-600 mt-1">
              {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
              <select
                value={employee ? JSON.stringify(employee) : ""}
                onChange={handleEmployeeChange}
                className="border rounded-md px-3 py-2 text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Employee</option>
                {allEmployees.map((emp) => (
                  <option key={emp.emp_id} value={JSON.stringify(emp)}>
                    {emp.ename} ({emp.emp_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {!employee ? (
          <div className="text-center py-8 text-gray-500">
            Please select an employee to view performance data
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Calls</p>
                    <p className="text-2xl font-bold text-blue-800">{totalCalls}</p>
                    <p className="text-xs text-blue-500 mt-1">Last 30 days</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Tasks</p>
                    <p className="text-2xl font-bold text-green-800">{totalTasks}</p>
                    <p className="text-xs text-green-500 mt-1">{completedTasks} completed</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <ListChecks className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Attendance</p>
                    <p className="text-2xl font-bold text-purple-800">{totalAttendance}</p>
                    <p className="text-xs text-purple-500 mt-1">{lateAttendance} late arrivals</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <UserCheck className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">Total Leads</p>
                    <p className="text-2xl font-bold text-indigo-800">{leads.length}</p>
                    <p className="text-xs text-indigo-500 mt-1">{interestedLeads.length} interested</p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {renderPieChart(taskStatusData, "Task Status Distribution")}
              {renderPieChart(attendanceData, "Attendance Status")}
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
              {renderBarChart(leadStatusData, "Leads by Status")}
            </div>

            {/* <div className="grid grid-cols-1 gap-6 mb-6">
              {renderBarChart(loanTypeData, "Leads by Loan Type")}
            </div> */}

            {/* Calls Over Time Chart */}
            <div className="grid grid-cols-1 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Calls Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} calls`, 'Count']}
                labelFormatter={(date) => `Date: ${date}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="calls"
                stroke="#3b82f6"
                name="Calls"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  
          </>
        )}
      </div>
    </div>
  );
};

export default PerformanceScreen;