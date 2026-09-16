import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  X
} from 'lucide-react';
import { AdminUserItem, AdminStats } from '../types';
import { AdminApi } from '../api';

interface SubscriptionManagementProps {
  stats: AdminStats | null;
  onRefreshStats?: () => void;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  stats,
  onRefreshStats
}) => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [modalData, setModalData] = useState({
    plan: 'Pro' as AdminUserItem['plan'],
    startDate: '',
    expiryDate: '',
    reason: 'Administrative plan adjustment'
  });
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getUsers({
        search,
        plan: selectedPlan,
        status: selectedStatus
      });
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [search, selectedPlan, selectedStatus]);

  const handleOpenEdit = (user: AdminUserItem) => {
    setSelectedUser(user);
    setModalData({
      plan: user.plan,
      startDate: user.subscriptionStartDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      expiryDate: user.subscriptionExpiry?.split('T')[0] || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      reason: 'Administrative subscription update'
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setModalError(null);

    try {
      await AdminApi.changeSubscription(
        selectedUser.id,
        modalData.plan,
        modalData.startDate,
        modalData.expiryDate,
        modalData.reason
      );
      setIsModalOpen(false);
      fetchSubscribers();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update subscription');
    }
  };

  const plansList = [
    {
      id: 'Pending',
      title: 'Pending (Awaiting Plan)',
      price: '—',
      duration: '',
      features: 'No plan assigned yet — user cannot access locked features',
      count: stats?.planBreakdown?.Pending || 0,
      color: 'border-slate-500/30 bg-slate-500/5'
    },
    {
      id: 'Starter',
      title: 'Starter Plan',
      price: '$45.00',
      duration: '/½ month',
      features: '1 AI Bot, 500 Credits, Standard Signals',
      count: stats?.planBreakdown?.Starter || 0,
      color: 'border-blue-500/30 bg-blue-500/5'
    },
    {
      id: 'Pro',
      title: 'Pro Tier (Most Popular)',
      price: '$95.00',
      duration: '/month',
      features: '3 AI Bots, 2,500 Credits, FVG & ICT Models',
      count: stats?.planBreakdown?.Pro || 0,
      color: 'border-purple-500/30 bg-purple-500/5'
    },
    {
      id: 'Elite',
      title: 'Elite Institutional',
      price: '$195.00',
      duration: '/3 months',
      features: 'Unlimited Bots, 10,000 Credits, Zero-Latency',
      count: stats?.planBreakdown?.Elite || 0,
      color: 'border-amber-500/30 bg-amber-500/5'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-400" />
          Subscription & Membership Management
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Monitor subscriber tiers, assign plans, and manually adjust billing.
        </p>
      </div>

      {/* Plan Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plansList.map((p) => (
          <div
            key={p.id}
            className={`p-4 rounded-2xl border ${p.color} bg-[#0f1224] shadow-lg flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-white">{p.title}</span>
                <span className="font-mono text-purple-400 font-bold">{p.count} users</span>
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {p.price} <span className="text-xs text-slate-400 font-normal">{p.duration}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">{p.features}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1e233d] flex justify-between items-center text-xs">
              <span className="text-slate-500">Tier Status:</span>
              <span className="text-emerald-400 font-semibold text-[11px]">ACTIVE</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subscriber name or email..."
            className="w-full pl-9 pr-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Tiers</option>
            <option value="Pending">Pending</option>
            <option value="Starter">Starter</option>
            <option value="Pro">Pro</option>
            <option value="Elite">Elite</option>
          </select>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#14182e] border-b border-[#1e233d] text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Subscriber</th>
                <th className="py-3.5 px-4">Current Plan</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">Expiration Date</th>
                <th className="py-3.5 px-4">Remaining Period</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#181d36]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Loading subscriber records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No subscribers found matching query.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const expiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
                  const now = new Date();
                  const isPending = user.plan === 'Pending';
                  const isExpired = expiry ? expiry < now : false;
                  const daysLeft = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / 86400000) : 0;

                  return (
                    <tr key={user.id} className="hover:bg-[#14182f]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{user.firstName} {user.lastName}</div>
                        <div className="text-[11px] text-slate-400">{user.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isPending
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        }`}>
                          {user.plan}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {user.subscriptionStartDate ? new Date(user.subscriptionStartDate).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-3 px-4">
                        {isPending ? (
                          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Awaiting assignment
                          </span>
                        ) : isExpired ? (
                          <span className="text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Expired
                          </span>
                        ) : daysLeft <= 3 ? (
                          <span className="text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {daysLeft} days left
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {daysLeft} days active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#161a30] hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-[#262b49] text-xs transition-colors cursor-pointer"
                        >
                          Modify Tier
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Edit Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111427] border border-[#232847] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e233d] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                Modify Subscription Plan
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#181d38]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#161a30] rounded-xl border border-[#262b49] text-xs">
              <div className="text-slate-400">Subscriber:</div>
              <div className="font-semibold text-white">{selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})</div>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Plan</label>
                <select
                  value={modalData.plan}
                  onChange={(e) => setModalData({ ...modalData, plan: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white"
                >
                  <option value="Pending">Pending (No Access)</option>
                  <option value="Starter">Starter Plan ($45 / ½ month)</option>
                  <option value="Pro">Pro Tier ($95 / month)</option>
                  <option value="Elite">Elite Plan ($195 / 3 months)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={modalData.startDate}
                    onChange={(e) => setModalData({ ...modalData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={modalData.expiryDate}
                    onChange={(e) => setModalData({ ...modalData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Audit Reason</label>
                <input
                  type="text"
                  required
                  value={modalData.reason}
                  onChange={(e) => setModalData({ ...modalData, reason: e.target.value })}
                  placeholder="e.g. Complimentary upgrade or manual wire payment"
                  className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#161a30] text-slate-300 text-xs font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
