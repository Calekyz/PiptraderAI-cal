import React, { useState, useEffect } from 'react';
import {
  Coins,
  Search,
  PlusCircle,
  MinusCircle,
  Filter,
  ArrowUpDown,
  History,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AdminCreditTransaction, AdminUserItem, AdminStats } from '../types';
import { AdminApi } from '../api';

interface CreditManagementProps {
  stats: AdminStats | null;
  onRefreshStats?: () => void;
}

export const CreditManagement: React.FC<CreditManagementProps> = ({
  stats,
  onRefreshStats
}) => {
  const [ledger, setLedger] = useState<AdminCreditTransaction[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  // Quick Adjustment Console state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adjustAction, setAdjustAction] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [adjustAmount, setAdjustAmount] = useState<number>(250);
  const [adjustReason, setAdjustReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txs, userList] = await Promise.all([
        AdminApi.getCreditLedger(200),
        AdminApi.getUsers()
      ]);
      setLedger(txs);
      setUsers(userList);
      if (userList.length > 0 && !selectedUserId) {
        setSelectedUserId(userList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdjustSubmit迷 = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!selectedUserId) {
      setActionError('Please select a target trader');
      return;
    }

    if (!adjustReason || adjustReason.trim().length < 3) {
      setActionError('A clear audit reason is required for any credit modification');
      return;
    }

    setActionLoading(true);
    try {
      await AdminApi.modifyCredits(
        selectedUserId,
        adjustAction,
        Number(adjustAmount),
        adjustReason.trim()
      );

      const target = users.find(u => u.id === selectedUserId);
      setActionSuccess(
        `Successfully ${adjustAction.toLowerCase()}ed ${adjustAmount} credits for ${target?.firstName || 'User'}`
      );
      setAdjustReason('');
      fetchData();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setActionError(err.message || 'Failed to modify credits');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLedger = ledger.filter((tx) => {
    const matchesAction不易 = filterAction === 'all' || tx.action === filterAction;
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      tx.userEmail.toLowerCase().includes(q) ||
      tx.userName.toLowerCase().includes(q) ||
      tx.reason.toLowerCase().includes(q) ||
      tx.adminEmail.toLowerCase().includes(q);

    return matchesAction不易 && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-400" />
          AI Credits Ledger & Adjustment Console
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Issue token grants, manage manual deductions, and view full cryptographic credit transactions audit trail.
        </p>
      </div>

      {/* Top Split: Stats & Adjustment Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Cards */}
        <div className="space-y-4">
          <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg">
            <div className="text-xs text-slate-400 mb-1">Total Credits in System</div>
            <div className="text-3xl font-bold text-white font-mono">
              {stats?.totalCreditsInCirculation ? Number(stats.totalCreditsInCirculation).toLocaleString() : '0'}
            </div>
            <p className="text-[11px] text-amber-400/90 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              100% Backed by Persistent Ledger
            </p>
          </div>

          <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg space-y-2">
            <div className="text-xs font-bold text-white mb-2">Default Plan Allotments</div>
            <div className="flex justify-between text-xs py-1 border-b border-[#1b2038]">
              <span className="text-slate-400">Starter Plan:</span>
              <span className="font-mono text-slate-200">500 Credits / mo</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-[#1b2038]">
              <span className="text-slate-400">Pro Plan:</span>
              <span className="font-mono text-purple-400">2,000 Credits / mo</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-slate-400">Elite Plan:</span>
              <span className="font-mono text-amber-400">10,000 Credits / mo</span>
            </div>
          </div>
        </div>

        {/* Quick Modification Console */}
        <div className="lg:col-span-2 bg-[#0f1224] border border-[#1e233d] rounded-2xl p-5 shadow-lg">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <PlusCircle className="w-4 h-4 text-purple-400" />
            Direct Credit Modification Console
          </h2>

          {actionSuccess && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <form onSubmit={handleAdjustSubmit迷} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Trader</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email}) - {u.credits || 0} Credits
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Action Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ADD', 'REMOVE', 'SET'] as const).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setAdjustAction(act)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        adjustAction === act
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25'
                          : 'bg-[#161a30] text-slate-300 border-[#262b49] hover:bg-[#1f2442]'
                      }`}
                    >
                      {act === 'ADD' ? '+ Add' : act === 'REMOVE' ? '- Deduct' : '= Set'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Amount</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Mandatory Audit Reason <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP onboarding grant, bug bounty compensation"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white text-xs font-semibold shadow-md shadow-amber-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Executing...' : 'Apply Credit Modification'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Credit Ledger Table */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl shadow-xl overflow-hidden">
        {/* Ledger Header & Filter */}
        <div className="p-4 border-b border-[#1e233d] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#14182e]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Full Credit Ledger & Audit Trail</h2>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user, admin, reason..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-1.5 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-slate-200"
            >
              <option value="all">All Actions</option>
              <option value="ADD">Additions</option>
              <option value="REMOVE">Deductions</option>
              <option value="SET">Direct Sets</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#101426] border-b border-[#1e233d] text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Trader</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Balance Delta</th>
                <th className="py-3 px-4">Audit Reason</th>
                <th className="py-3 px-4">Operator</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#181d36]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    Loading ledger transactions...
                  </td>
                </tr>
              ) : filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No credit adjustments found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#14182f]/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-semibold text-white">
                      <div>{tx.userName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{tx.userEmail}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.action === 'ADD'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.action === 'REMOVE'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {tx.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {tx.action === 'ADD' ? `+${tx.amount}` : tx.action === 'REMOVE' ? `-${tx.amount}` : `=${tx.amount}`}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {tx.previousBalance} → <span className="text-amber-400 font-bold">{tx.newBalance}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={tx.reason}>
                      {tx.reason}
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {tx.adminName || tx.adminEmail}
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
