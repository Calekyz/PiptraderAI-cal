import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { AdminAuditLog } from '../types';
import { AdminApi } from '../api';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getAuditLogs({
        action: actionFilter,
        search,
        limit: 200
      });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Admin', 'Role', 'Action', 'Target', 'Details', 'Reason'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      l.adminEmail,
      l.adminRole || 'SUPER_ADMIN',
      l.action,
      l.userAffected || l.targetEmail || '',
      `"${l.details.replace(/"/g, '""')}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pipnex_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Security & Governance Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable administrative audit trail tracking every operator action, credit modification, and tier change.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl bg-[#161a30] hover:bg-[#1f2442] text-slate-200 text-xs font-semibold border border-[#262b49] transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 text-purple-400" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action details, user affected, reason, operator..."
            className="w-full pl-9 pr-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-slate-200"
          >
            <option value="all">All Action Categories</option>
            <option value="CREDITS_ADD">Credits Added</option>
            <option value="CREDITS_REMOVE">Credits Deducted</option>
            <option value="USER_SUSPEND">User Suspended</option>
            <option value="USER_REACTIVATE">User Reactivated</option>
            <option value="PLAN_CHANGE">Subscription Modified</option>
            <option value="TICKET_REPLY">Support Ticket Replied</option>
            <option value="SYSTEM_CONFIG">System Configuration</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#14182e] border-b border-[#1e233d] text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Target User</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">Audit Reason</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#181d36]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#14182f]/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{log.adminName || log.adminEmail}</div>
                      <div className="text-[10px] text-purple-400 font-mono">{log.adminRole || 'SUPER_ADMIN'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {log.userAffected || log.targetEmail || 'System / Global'}
                    </td>

                    <td className="py-3 px-4 text-slate-200 max-w-sm leading-relaxed">
                      {log.details}
                    </td>

                    <td className="py-3 px-4 text-slate-400 italic">
                      {log.reason || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
