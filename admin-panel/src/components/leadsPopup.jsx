import React, { useEffect } from "react";
import * as XLSX from "xlsx";

const LeadsPopup = ({ isOpen, onClose, title, leads = [] }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const downloadExcel = () => {
    let dataToExport = [];

    if (title === "Total Calls") {
      dataToExport = leads.map((lead) => ({
        "Call ID": lead.call_id,
        Name: lead.name,
        Number: lead.number,
        Remark: lead.remark,
        Date: new Date(lead.createdAt).toLocaleString("en-IN"),
      }));
    } else {
      dataToExport = leads.map((lead) => ({
        "Lead ID": lead.lead_id,
        Name: lead.name,
        Phone: lead.number,
        "Assigned To": lead.owner,
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);

    const fileName = `${title}_${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-6 w-[95%] max-w-4xl max-h-[90%] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-semibold">{title}</h2>

          <div className="flex items-center gap-3">
            {leads.length > 0 && (
              <button
                onClick={downloadExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm font-medium whitespace-nowrap"
              >
                Download Excel
              </button>
            )}

            <button
              onClick={onClose}
              className="text-2xl font-bold text-gray-500 hover:text-red-500"
            >
              ×
            </button>
          </div>
        </div>

        {/* Leads Table */}
        {leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {title === "Total Calls" ? (
                    <>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Call ID
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Number
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Remark
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        At
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Lead ID
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Phone
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Assigned To
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {leads.map((lead, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    {title === "Total Calls" ? (
                      <>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {lead.call_id}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {lead.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {lead.number}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {lead.remark}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {new Date(lead.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {lead.lead_id}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {lead.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {lead.number}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {lead.owner}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-center">No leads to display.</p>
        )}
      </div>
    </div>
  );
};

export default LeadsPopup;