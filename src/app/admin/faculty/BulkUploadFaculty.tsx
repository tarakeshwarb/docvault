"use client";

import { useState, useRef } from "react";
import { UploadCloud, Loader2, AlertCircle, Download, X, Check, Save } from "lucide-react";
import * as XLSX from "xlsx";
import { bulkUploadFaculty } from "../actions";

type ParsedFaculty = {
  faculty_id: number;
  faculty_name: string;
  email: string;
  mobile_no?: string;
  designation?: string;
  _error?: string;
};

export function BulkUploadFaculty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewData, setPreviewData] = useState<ParsedFaculty[] | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<any>(worksheet);

      if (json.length === 0) {
        throw new Error("The uploaded Excel file is empty.");
      }

      const parsedFaculty: ParsedFaculty[] = [];
      for (let i = 0; i < json.length; i++) {
        const row = json[i];
        let empIdStr = row["Emp ID"] || row["Employee ID"] || row["faculty_id"] || row["ID"];
        let name = row["Faculty Name"] || row["Name"] || row["faculty_name"];
        let email = row["Official Email ID"] || row["Email"] || row["email"];
        let contact = row["Contact No."] || row["Contact"] || row["mobile_no"] || row["Mobile"];
        if (contact && contact.toString().trim().toUpperCase() === "NIL") contact = null;
        let designation = row["Designation"] || row["designation"] || "Assistant Professor";

        if (!empIdStr || !name || !email) {
          const keys = Object.keys(row);
          if (keys.length > 0) {
            const empIdKey = keys.find(k => k.toLowerCase().includes("emp") || k.toLowerCase().includes("id"));
            const nameKey = keys.find(k => k.toLowerCase().includes("name") || k.toLowerCase().includes("faculty"));
            const emailKey = keys.find(k => k.toLowerCase().includes("email") || k.toLowerCase().includes("mail"));
            if (empIdKey) empIdStr = row[empIdKey];
            if (nameKey) name = row[nameKey];
            if (emailKey) email = row[emailKey];
          }
        }

        let empIdNum = NaN;
        let rowError = undefined;

        if (empIdStr) {
          empIdNum = parseInt(empIdStr.toString().trim(), 10);
        }

        if (isNaN(empIdNum) || !name) {
          rowError = "Missing ID or Name";
        }

        if (!email && !isNaN(empIdNum)) {
          email = `${empIdNum}@srmist.edu.in`;
        }

        parsedFaculty.push({
          faculty_id: empIdNum,
          faculty_name: name ? name.toString().trim() : "",
          email: email ? email.toString().trim() : "",
          mobile_no: contact ? contact.toString().trim() : "",
          designation: designation ? designation.toString().trim() : "",
          _error: rowError
        });
      }

      if (parsedFaculty.length === 0) {
        throw new Error("Could not find any readable rows.");
      }

      setPreviewData(parsedFaculty);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to process the file.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Emp ID": "123456",
        "Faculty Name": "Dr. John Doe",
        "Official Email ID": "johndoe@srmist.edu.in",
        "Contact No.": "9876543210",
        "Designation": "Assistant Professor",
      },
    ]);
    ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 35 }, { wch: 20 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Faculty_Bulk_Upload_Template.xlsx");
  };

  const handleUpdateRow = (index: number, field: keyof ParsedFaculty, value: string) => {
    if (!previewData) return;
    const newData = [...previewData];
    if (field === "faculty_id") {
      const num = parseInt(value, 10);
      newData[index] = { ...newData[index], faculty_id: num };
    } else {
      newData[index] = { ...newData[index], [field]: value };
    }

    // revalidate
    const row = newData[index];
    if (isNaN(row.faculty_id) || !row.faculty_name || !row.email) {
      newData[index]._error = "Missing required fields";
    } else {
      newData[index]._error = undefined;
    }
    
    setPreviewData(newData);
  };

  const handleSaveToDirectory = async () => {
    if (!previewData) return;
    const validRows = previewData.filter(r => !r._error && !isNaN(r.faculty_id));
    
    if (validRows.length === 0) {
      setError("No valid rows to save.");
      return;
    }

    setLoading(true);
    try {
      const res = await bulkUploadFaculty(validRows);
      if (res.success) {
        setSuccess(`Successfully saved ${res.count} faculty records to the directory.`);
        setPreviewData(null);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to save to directory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {error && !previewData && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </span>
          )}
          {success && (
            <span className="text-xs text-green-600 font-medium">
              {success}
            </span>
          )}
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Template
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            Bulk Upload
          </button>
        </div>
        <p className="text-[10px] text-gray-500">
          Columns: Emp ID, Faculty Name, Official Email ID, Contact No., Designation
        </p>
      </div>

      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Review Faculty Upload</h3>
                <p className="text-sm text-gray-500">
                  Found {previewData.length} records. Please correct any errors before saving.
                </p>
              </div>
              <button 
                onClick={() => setPreviewData(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-white">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-tl-lg">Emp ID</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Contact No.</th>
                    <th className="px-4 py-3 font-semibold">Designation</th>
                    <th className="px-4 py-3 font-semibold rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className={`transition-colors hover:bg-gray-50/50 ${row._error ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={isNaN(row.faculty_id) ? "" : row.faculty_id}
                          onChange={(e) => handleUpdateRow(idx, "faculty_id", e.target.value)}
                          className={`w-24 px-2 py-1 border rounded focus:ring-2 focus:outline-none transition-shadow ${row._error && isNaN(row.faculty_id) ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-200 focus:ring-[var(--color-accent)]/20"}`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          value={row.faculty_name}
                          onChange={(e) => handleUpdateRow(idx, "faculty_name", e.target.value)}
                          className={`w-full min-w-[150px] px-2 py-1 border rounded focus:ring-2 focus:outline-none transition-shadow ${row._error && !row.faculty_name ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-200 focus:ring-[var(--color-accent)]/20"}`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          value={row.email}
                          onChange={(e) => handleUpdateRow(idx, "email", e.target.value)}
                          className={`w-full min-w-[200px] px-2 py-1 border rounded focus:ring-2 focus:outline-none transition-shadow ${row._error && !row.email ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-200 focus:ring-[var(--color-accent)]/20"}`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          value={row.mobile_no || ""}
                          onChange={(e) => handleUpdateRow(idx, "mobile_no", e.target.value)}
                          className="w-full min-w-[120px] px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:outline-none transition-shadow"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="text" 
                          value={row.designation || ""}
                          onChange={(e) => handleUpdateRow(idx, "designation", e.target.value)}
                          className="w-full min-w-[150px] px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:outline-none transition-shadow"
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {row._error ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                            <AlertCircle className="w-3 h-3" />
                            {row._error}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                            <Check className="w-3 h-3" />
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                {previewData.filter(r => !r._error).length} valid records ready to save
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveToDirectory}
                  disabled={loading || previewData.filter(r => !r._error).length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save to Directory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
