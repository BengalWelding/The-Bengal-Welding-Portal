import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteTR19ReportLogEntry, listTR19ReportLog, type ReportLogEntry } from '../lib/tr19ReportLog';
import { listSiteSurveys, type SiteSurvey } from '../lib/siteSurveys';
import { useAdmin } from '../contexts/AdminContext';

const AdminReportLog: React.FC = () => {
  const navigate = useNavigate();
  const [logEntries, setLogEntries] = useState<ReportLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { jobs } = useAdmin();
  const [siteSurveys, setSiteSurveys] = useState<SiteSurvey[]>([]);
  const [isNewPcvrModalOpen, setIsNewPcvrModalOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');

  useEffect(() => {
    listTR19ReportLog()
      .then(setLogEntries)
      .catch(() => setLogEntries([]));
  }, []);

  useEffect(() => {
    listSiteSurveys()
      .then(setSiteSurveys)
      .catch(() => setSiteSurveys([]));
  }, []);

  const matchesSearch = (e: ReportLogEntry) =>
    !searchQuery ||
    (e.siteName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.jobId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.reportRef || '').toLowerCase().includes(searchQuery.toLowerCase());

  const filteredLog = useMemo(
    () => logEntries.filter(matchesSearch),
    [logEntries, searchQuery]
  );

  const eligibleSurveys = useMemo(
    () =>
      siteSurveys.filter(
        (s) => s.job_id && jobs.some((j) => j.id === s.job_id)
      ),
    [siteSurveys, jobs]
  );

  const viewReport = (jobId: string) => {
    navigate('/dashboard/certificates', { state: { viewReportJobId: jobId } });
  };

  const editReport = (jobId: string) => {
    navigate(`/dashboard/jobs/${jobId}/tr19-report`);
  };

  const openNewPcvrModal = () => {
    if (eligibleSurveys.length === 0) {
      window.alert('No TR19 sites are linked to jobs. Link a TR19 site to a job first from the TR19 page.');
      return;
    }
    setSelectedSurveyId((prev) => prev || eligibleSurveys[0].id);
    setIsNewPcvrModalOpen(true);
  };

  const closeNewPcvrModal = () => {
    setIsNewPcvrModalOpen(false);
  };

  const handleCreateNewPcvr = () => {
    const survey = eligibleSurveys.find((s) => s.id === selectedSurveyId);
    if (!survey || !survey.job_id) {
      window.alert('Select a TR19 site linked to a job to continue.');
      return;
    }
    closeNewPcvrModal();
    navigate(`/dashboard/jobs/${survey.job_id}/tr19-report`);
  };

  const deleteEntry = (entry: ReportLogEntry) => {
    if (!window.confirm(`Remove "${entry.reportRef}" from the TR19 PCVR log? This does not delete the report data.`)) return;
    const next = logEntries.filter((e) => e.id !== entry.id);
    setLogEntries(next);
    deleteTR19ReportLogEntry(entry.id).catch(() => {
      // ignore
    });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#F2C200] tracking-tight">TR19 PCVR</h1>
          <p className="text-gray-500 text-sm font-bold mt-0.5">
            All generated TR19 reports — {logEntries.length} total
          </p>
        </div>
        <button
          type="button"
          onClick={openNewPcvrModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#F2C200] text-black hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#F2C2001A] shrink-0"
        >
          <i className="fas fa-plus"></i>
          <span>New TR19 PCVR Report</span>
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
        <input
          type="text"
          placeholder="Search by site, contact, report ref, job ref..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#333333] rounded-full text-sm text-white focus:outline-none focus:border-[#F2C200]"
        />
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#333333] overflow-hidden">
        <div className="px-4 pt-3 sm:hidden">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            Swipe to view →
          </p>
        </div>

        <div className="w-full overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-black border-b border-[#333333]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Report Ref</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Site</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Generated</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333]">
              {filteredLog.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-gray-300 font-mono text-sm font-bold">{entry.reportRef}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{entry.jobId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-bold">{entry.siteName || entry.customerName || '—'}</p>
                      <p className="text-xs text-gray-500">
                        {(entry.jobTitle || '').trim()
                          ? `${entry.jobId} • ${entry.jobTitle}`
                          : entry.jobId}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{entry.customerName || '—'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(entry.generatedAt).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => viewReport(entry.jobId)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-green-900/40 text-green-400 border border-green-800/50 hover:bg-green-800/40 transition-all"
                      >
                        Generate Certificate
                      </button>
                      <button
                        onClick={() => editReport(entry.jobId)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-[#333333] text-[#F2C200] hover:bg-[#F2C200] hover:text-black transition-all"
                      >
                        Edit Report
                      </button>
                      <button
                        onClick={() => deleteEntry(entry)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-red-900/40 text-red-400 border border-red-800/50 hover:bg-red-800/40 transition-all"
                      >
                        <i className="fas fa-trash-alt text-[10px]"></i>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLog.length === 0 && (
          <div className="px-6 py-16 text-center text-gray-500 font-bold">
            {logEntries.length === 0 ? 'No reports generated yet.' : 'No reports match your search.'}
          </div>
        )}
      </div>

      {isNewPcvrModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[650] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-[#333333] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-8">
            <div className="p-6 border-b border-[#333333] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">New TR19 PCVR Report</h2>
              <button
                type="button"
                onClick={closeNewPcvrModal}
                className="text-gray-400 hover:text-white p-1 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Select a TR19 site that is already linked to a job. You will then complete the TR19 Post-Clean
                Verification Report for that job.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  TR19 Site
                </label>
                <select
                  value={selectedSurveyId}
                  onChange={(e) => setSelectedSurveyId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#111111] border border-[#333333] rounded-lg text-white text-sm focus:outline-none focus:border-[#F2C200] focus:ring-1 focus:ring-[#F2C200]/30"
                >
                  <option value="" className="bg-[#111111] text-white">
                    Select a TR19 site...
                  </option>
                  {eligibleSurveys.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#111111] text-white">
                      {s.site_name} — {s.postcode || 'No postcode'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-[#333333] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeNewPcvrModal}
                className="px-5 py-2.5 rounded-lg font-bold text-sm bg-transparent border border-[#333333] text-gray-300 hover:border-[#F2C200] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewPcvr}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-[#F2C200] text-black hover:brightness-110 active:scale-95 transition-colors shadow-lg shadow-[#F2C2001A]"
              >
                <i className="fas fa-file-alt text-sm"></i>
                <span>Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportLog;
