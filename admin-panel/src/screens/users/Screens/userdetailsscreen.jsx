import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from "../../../config";
// import { useParams, useNavigate } from 'react-router-dom';

const UserDetailScreen = () => {
  const { emp_id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [leads, setLeads] = useState([]);
  const [calls, setCalls] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  // Toggle states
  const [showLeads, setShowLeads] = useState(true);
  const [showCalls, setShowCalls] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  
  // Pagination states
  const [leadsPage, setLeadsPage] = useState(1);
  const [callsPage, setCallsPage] = useState(1);
  const [tasksPage, setTasksPage] = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState(10);
  const [callsPerPage, setCallsPerPage] = useState(10);
  const [tasksPerPage, setTasksPerPage] = useState(10);
  

  // Fetch employee details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch employee data
        const empResponse = await axios.get(`${API_URL}/employees/${emp_id}`);
        setEmployee(empResponse.data);
        
        // Fetch leads associated with this employee
        const leadsResponse = await axios.get(`${API_URL}/leads/${emp_id}`);
        setLeads(leadsResponse.data);
        
        // Fetch calls associated with this employee
        const callsResponse = await axios.get(`${API_URL}/calls/${emp_id}`);
        setCalls(callsResponse.data.calls);

        // Fetch tasks associated with this employee
        const tasksResponse = await axios.get(`${API_URL}/task/${emp_id}`);
        setTasks(tasksResponse.data.tasks);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [emp_id]);

  // items per page selector
  const ItemsPerPageDropdown = ({ value, options = [5, 10, 20, 50, 100], onChange }) => {
  const handleChange = (e) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue); // Notify parent
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
        Items per page:
      </label>
      <select
        id="itemsPerPage"
        value={value}
        onChange={handleChange}
        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((count) => (
          <option key={count} value={count}>
            {count}
          </option>
        ))}
      </select>
    </div>
  );
};

  // Calculate paginated data
  const paginatedLeads = leads.slice(
    (leadsPage - 1) * leadsPerPage,
    leadsPage * leadsPerPage
  );

  const paginatedCalls = calls.slice(
    (callsPage - 1) * callsPerPage,
    callsPage * callsPerPage
  );

  const paginatedTasks = tasks.slice(
    (tasksPage-1)*tasksPerPage,
    tasksPage * tasksPerPage
  );

  const totalLeadsPages = Math.ceil(leads.length / leadsPerPage);
  const totalCallsPages = Math.ceil(calls.length / callsPerPage);
  const totalTasksPages = Math.ceil(tasks.length / tasksPerPage);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (!employee) return <div className="text-center py-8">Employee not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
            <img 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">{employee.ename}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-gray-600">User Name</p>
                <p className="font-medium">{employee.username}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone Number</p>
                <p className="font-medium">{employee.phone}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{employee.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Password</p>
                <p className="font-medium">{employee.password}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Associated Leads</h2>
          <ItemsPerPageDropdown 
            value={leadsPerPage} 
            onChange={(value) => {
              setLeadsPerPage(value);
              setLeadsPage(1); // Reset to first page when changing items per page
            }} 
          />
          <button 
            onClick={() => setShowLeads(!showLeads)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showLeads ? 'Hide' : 'Show'} Leads ({leads.length})
          </button>
        </div>
        
        {showLeads && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead.lead_id} className="hover:bg-gray-50" onClick = {()=> navigate(`/lead-details/${lead.lead_id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.lead_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${lead.status === 'Converted' ? 'bg-green-100 text-green-800' : 
                            lead.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length === 0 && (
                <p className="text-center py-4 text-gray-500">No leads found for this employee</p>
              )}
            </div>
            
            {/* Leads Pagination */}
            {leads.length > leadsPerPage && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setLeadsPage(prev => Math.max(prev - 1, 1))}
                  disabled={leadsPage === 1}
                  className={`px-3 py-1 rounded ${leadsPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  Previous
                </button>
                <span>Page {leadsPage} of {totalLeadsPages}</span>
                <button
                  onClick={() => setLeadsPage(prev => Math.min(prev + 1, totalLeadsPages))}
                  disabled={leadsPage === totalLeadsPages}
                  className={`px-3 py-1 rounded ${leadsPage === totalLeadsPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Calls Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Call Logs</h2>
          <ItemsPerPageDropdown 
            value={callsPerPage} 
            onChange={(value) => {
              setCallsPerPage(value);
              setCallsPage(1);
            }} 
          />
          <button 
            onClick={() => setShowCalls(!showCalls)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showCalls ? 'Hide' : 'Show'} Calls ({calls.length})
          </button>
        </div>
        
        {showCalls && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">At</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCalls.map((call) => (
                    <tr key={call.call_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{call.call_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {call.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{call.number} </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {call.remark}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(call.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {calls.length === 0 && (
                <p className="text-center py-4 text-gray-500">No call logs found for this employee</p>
              )}
            </div>
            
            {/* Calls Pagination */}
            {calls.length > callsPerPage && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setCallsPage(prev => Math.max(prev - 1, 1))}
                  disabled={callsPage === 1}
                  className={`px-3 py-1 rounded ${callsPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  Previous
                </button>
                <span>Page {callsPage} of {totalCallsPages}</span>
                <button
                  onClick={() => setCallsPage(prev => Math.min(prev + 1, totalCallsPages))}
                  disabled={callsPage === totalCallsPages}
                  className={`px-3 py-1 rounded ${callsPage === totalCallsPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* task section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Tasks</h2>
          <ItemsPerPageDropdown 
            value={tasksPerPage} 
            onChange={(value) => {
              setTasksPerPage(value);
              setTasksPage(1);
            }} 
          />
          <button 
            onClick={() => setShowTasks(!showTasks)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showTasks ? 'Hide' : 'Show'} Tasks ({tasks.length})
          </button>
        </div>
        
        {showTasks && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTasks.map((task) => (
                    <tr key={task.task_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.task_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.choose_lead} </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.end_date != null ? new Date(task.start_date).toLocaleString():""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.end_date != null ? new Date(task.end_date).toLocaleString():""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.priority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-medium ${
                            task.status === "Completed" ? "text-green-600" :
                            task.status === "On Going" ? "text-blue-600" :
                            task.status === "Other" ? "text-gray-600" :
                            "text-gray-500"
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          title={task.description} // Tooltip on hover
                          className="cursor-pointer hover:text-blue-600"
                          // onClick={() => openDescriptionModal(task.description)}
                        >
                          {task.description.length > 30
                            ? `${task.description.slice(0, 30)}...`
                            : task.description}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tasks.length === 0 && (
                <p className="text-center py-4 text-gray-500">No tasks found for this employee</p>
              )}
            </div>
            
            {/* Tasks Pagination */}
            {tasks.length > tasksPerPage && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setCallsPage(prev => Math.max(prev - 1, 1))}
                  disabled={tasksPage === 1}
                  className={`px-3 py-1 rounded ${tasksPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  Previous
                </button>
                <span>Page {tasksPage} of {totalTasksPages}</span>
                <button
                  onClick={() => setTasksPage(prev => Math.min(prev + 1, totalTasksPages))}
                  disabled={tasksPage === totalTasksPages}
                  className={`px-3 py-1 rounded ${tasksPage === totalTasksPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default UserDetailScreen;