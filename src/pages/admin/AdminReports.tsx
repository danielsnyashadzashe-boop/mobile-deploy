
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

const AdminReports = () => {
  const [reportType, setReportType] = useState('tipVolume');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const handleGenerateReport = () => {
    // In a real app, this would call an API to generate the report
    toast.success(`Generating ${reportType} report from ${startDate || 'all time'} to ${endDate || 'now'}`);
  };
  
  const handleDownloadReport = (reportName: string) => {
    // In a real app, this would download the report
    toast.success(`Downloading ${reportName}`);
  };
  
  const handleScheduleReport = () => {
    // In a real app, this would open a modal to schedule a report
    toast.info("Schedule report functionality would open a dialog");
  };
  
  const handleEditSchedule = () => {
    // In a real app, this would open a modal to edit a scheduled report
    toast.info("Edit schedule functionality would open a dialog");
  };
  
  const handleDeleteSchedule = () => {
    // In a real app, this would confirm deletion of a scheduled report
    toast.success("Schedule deleted successfully");
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-nogada-dark mb-6">Reports</h1>
      
      <div className="nogada-card mb-6">
        <h2 className="font-semibold mb-4">Generate Report</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="nogada-input"
            >
              <option value="tipVolume">Tip Volume Report</option>
              <option value="revenue">Revenue Report</option>
              <option value="payout">Payout Report</option>
              <option value="guardPerformance">Guard Performance Report</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="nogada-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="nogada-input"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <Button
              onClick={handleGenerateReport}
              className="nogada-btn-primary"
            >
              Generate Report
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="nogada-card">
          <h2 className="font-semibold mb-4">Saved Reports</h2>
          
          <div className="space-y-2">
            <div className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Tip Volume Report - May 2025</div>
                  <div className="text-xs text-gray-500">Generated: May 21, 2025</div>
                </div>
                <div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => handleDownloadReport('Tip Volume Report - May 2025')}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Revenue Report - Q1 2025</div>
                  <div className="text-xs text-gray-500">Generated: April 1, 2025</div>
                </div>
                <div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => handleDownloadReport('Revenue Report - Q1 2025')}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Guard Performance - April 2025</div>
                  <div className="text-xs text-gray-500">Generated: May 1, 2025</div>
                </div>
                <div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => handleDownloadReport('Guard Performance - April 2025')}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="nogada-card">
          <h2 className="font-semibold mb-4">Scheduled Reports</h2>
          
          <div className="space-y-2">
            <div className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">Weekly Tip Volume Report</div>
                  <div className="text-xs text-gray-500">Every Monday at 8:00 AM</div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditSchedule}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDeleteSchedule}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">Monthly Revenue Report</div>
                  <div className="text-xs text-gray-500">1st day of each month at 7:00 AM</div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditSchedule}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDeleteSchedule}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleScheduleReport}
            >
              Schedule New Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
