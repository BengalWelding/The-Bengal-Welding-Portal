import React from 'react';
import AdminTR19 from './AdminTR19';
import AdminReportLog from './AdminReportLog';
import AdminCertificates from './AdminCertificates';

const AdminTR19Hub: React.FC = () => {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <AdminTR19 />

      <div className="h-px bg-[#333333] w-full" />

      <AdminReportLog />

      <div className="h-px bg-[#333333] w-full" />

      <AdminCertificates />
    </div>
  );
};

export default AdminTR19Hub;

