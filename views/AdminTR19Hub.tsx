import React, { useState } from 'react';
import AdminTR19 from './AdminTR19';
import AdminReportLog from './AdminReportLog';
import AdminCertificates from './AdminCertificates';
import type { Job } from '../types';
import type { TR19Report } from './TR19ReportForm';

const AdminTR19Hub: React.FC = () => {
  const [certificateFromReport, setCertificateFromReport] = useState<{ job: Job; report: TR19Report } | null>(null);

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <AdminTR19 onOpenCertificate={setCertificateFromReport} />

      <div className="h-px bg-[#333333] w-full" />

      <AdminReportLog />

      <div className="h-px bg-[#333333] w-full" />

      <AdminCertificates
        externalCertificateFromReport={certificateFromReport}
        onCloseExternalCertificate={() => setCertificateFromReport(null)}
      />
    </div>
  );
};

export default AdminTR19Hub;

