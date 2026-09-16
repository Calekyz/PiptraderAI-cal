import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  ShieldAlert,
  Coins,
  CheckCircle,
  Eye,
  X,
  Send,
  Ban,
  History,
  Lock,
  Globe,
  Laptop,
  CheckSquare,
  MessageSquare,
  Clock,
  RotateCcw
} from 'lucide-react';
import { AdminUserItem, AdminCreditTransaction, AdminSupportTicket } from '../types';
import { AdminApi } from '../api';

interface UserManagementProps {
  initialSearchQuery?: string;
  onRefreshStats?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  initialSearchQuery = '',
  onRefreshStats
}) => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearchQuery);
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlineOnly, setOnlineOnly] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<string>('newest');

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [isBulkSuspendOpen, setIsBulkSuspendOpen] = useState(false);
  const [isBulkMessageOpen, setIsBulkMessageOpen] = useState(false);

  const [activeUser, setActiveUser] = useState<AdminUserItem | null>(null);
  const [activeUserDetail, setActiveUserDetail] = useState<{
    user: AdminUserItem;
    creditHistory: AdminCreditTransaction[];
    tickets: AdminSupportTicket[];
    strategies: any[];
    proppass: any[];
  } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const [createData, setCreateData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    plan: 'Starter' as AdminUserItem['plan'],
    credits: 500,
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING'
  });

  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    plan: 'Starter' as AdminUserItem['plan'],
    credits: 500,
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING',
    isVerified: true,
    mt5Connected: false,
    mt5AccountNumber: ''
  });

  const [creditActionData, setCreditActionData] = useState({
    action: 'ADD' as 'ADD' | 'REMOVE' | 'SET',
    amount: 100,
    reason: ''
  });

  const [subActionData, setSubActionData] = useState({
    plan: 'Pro' as AdminUserItem['plan'],
    startDate: '',
    expiryDate: '',
    reason: ''
  });

  const [suspendDuration, setSuspendDuration] = useState('30 Days');
  const [actionReason, setActionReason] = useState('');

  const [messageData, setMessageData] = useState({
    template: 'Custom Message',
    subject: '',
    message: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getUsers({
        search,
        plan: selectedPlan,
        status: selectedStatus,
        sort: sortOrder
      });
      setUsers(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, selectedPlan, selectedStatus, sortOrder]);

  const filteredUsers = useMemo(() => {
    if (!onlineOnly) return users;
    return users.filter(u => u.isOnline);
  }, [users, onlineOnly]);

  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenDetail = async (user: AdminUserItem) => {
    setActiveUser(user);
    setIsDetailDrawerOpen(true);
    try {
      const detail = await AdminApi.getUserDetails(user.id);
      setActiveUserDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (user: AdminUserItem) => {
    setActiveUser(user);
    setEditData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      plan: user.plan,
      credits: user.credits || 0,
      status: user.status || 'ACTIVE',
      isVerified: user.isVerified,
      mt5Connected: user.mt5Connected,
      mt5AccountNumber: user.mt5AccountNumber || ''
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenCredit = (user: AdminUserItem) => {
    setActiveUser(user);
    setCreditActionData({
      action: 'ADD',
      amount: 100,
      reason: 'Administrative promotional credit top-up'
    });
    setFormError(null);
    setIsCreditModalOpen(true);
  };

  const handleOpenSub = (user: AdminUserItem) => {
    setActiveUser(user);
    setSubActionData({
      plan: user.plan,
      startDate: user.subscriptionStartDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      expiryDate: user.subscriptionExpiry?.split('T')[0] || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      reason: 'Administrative tier upgrade'
    });
    setFormError(null);
    setIsSubModalOpen(true);
  };

  const handleOpenSuspend = (user: AdminUserItem) => {
    setActiveUser(user);
    setSuspendDuration('30 Days');
    setActionReason('Terms violation or suspicious activity');
    setFormError(null);
    setIsSuspendModalOpen(true);
  };

  const handleOpenBan = (user: AdminUserItem) => {
    setActiveUser(user);
    setActionReason('Severe terms violation, fraudulent chargeback, or security threat');
    setFormError(null);
    setIsBanModalOpen(true);
  };

  const handleOpenMessage = (user: AdminUserItem) => {
    setActiveUser(user);
    setMessageData({
      template: 'Custom Advisory',
      subject: `Account Notice: PipNex AI Platform`,
      message: `Dear ${user.firstName},\n\nWe are reaching out regarding your PipNex AI account...`
    });
    setFormError(null);
    setIsMessageModalOpen(true);
  };

  const handleOpenDelete = (user: AdminUserItem) => {
    setActiveUser(user);
    setActionReason('Account permanent deletion per GDPR / compliance request');
    setAdminPasswordInput('');
    setFormError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await AdminApi.createUser(createData);
      setIsCreateModalOpen(false);
      fetchUsers();
      if (onRefreshStats) onRefreshStats();
      setCreateData({
        firstName: '', lastName: '', email: '', phone: '',
        plan: 'Starter', credits: 500, status: 'ACTIVE'
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    setFormError(null);
    try {
      await AdminApi.updateUser(activeUser.id, editData);
      setIsEditModalOpen(false);
      fetchUsers();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update user');
    }
  };

  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    if (!creditActionData.reason || creditActionData.reason.trim().length < 3) {
      setFormError('A clear audit reason is required for credit modifications');
      return;
    }
    setFormError(null);
    try {
      await AdminApi.modifyCredits(
        activeUser.id,
        creditActionData.action,
        Number(creditActionData.amount),
        creditActionData.reason
      );
      setIsCreditModalOpen(false);
      fetchUsers();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to adjust credits');
    }
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    setFormError(null);
    try {
      await AdminApi.changeSubscription(
        activeUser.id,
        subActionData.plan,
        subActionData.startDate,
        subActionData.expiryDate,
        subActionData.reason
      );
      setIsSubModalOpen(false);
      fetchUsers();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update subscription');
    }
  };

  const handleSuspendSubmit = async () => {
    if (!activeUser) return;
    setFormError(null);
    try {
      await AdminApi.suspendUser(activeUser.id, suspendDuration, actionReason);
      setIsSuspendModalOpen(false);
      fetchUsers();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to suspend account');
    }
  };

  const handleBanSubmit = async () => {
    if (!activeUser) return;
    if (!actionReason || actionReason.trim().length < 3) {
      setFormError('A mandatory reason is required to ban a user account.');
      return;
    }
    setFormError(null);
    try {
      await AdminApi.banUser(activeUser.id, actionReason);
      setIsBanModalOpen(false);
      fetchUsers();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to ban account');
    }
  };

  const handleReactivateSubmit = async (user: AdminUserItem) => {
    try {
      await AdminApi.reactivateUser(user.id, 'Account reactivated by administrator');
      fetchUsers();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate user');
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    setFormError(null);
    try {
      await AdminApi.sendMessage(activeUser.id, messageData.subject, messageData.message, messageData.template);
      setIsMessageModalOpen(false);
      alert('Message successfully dispatched to trader inbox.');
    } catch (err: any) {
      setFormError(err.message || 'Failed to send message');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!activeUser) return;
    setFormError(null);
    setIsVerifyingPassword(true);
    try {
      const isValid = await AdminApi.verifyPassword(adminPasswordInput);
      if (!isValid) {
        setFormError('Invalid administrator credentials. Password confirmation failed.');
        setIsVerifyingPassword(false);
        return;
      }
      await AdminApi.deleteUser(activeUser.id, actionReason);
      setIsDeleteModalOpen(false);
      fetchUsers();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete user');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleBulkSuspendSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await AdminApi.bulkSuspend(selectedUserIds, suspendDuration, actionReason || 'Bulk administrator suspension');
      setIsBulkSuspendOpen(false);
      setSelectedUserIds([]);
      fetchUsers();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      alert(err.message || 'Failed to bulk suspend users');
    }
  };

  const handleBulkReactivateSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Reactivate ${selectedUserIds.length} selected trader account(s)?`)) return;
    try {
      await AdminApi.bulkReactivate(selectedUserIds, 'Bulk administrator reactivation');
      setSelectedUserIds([]);
      fetchUsers();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      alert(err.message || 'Failed to bulk reactivate users');
    }
  };

  const handleBulkMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    try {
      await AdminApi.bulkMessage(selectedUserIds, messageData.subject, messageData.message, messageData.template);
      setIsBulkMessageOpen(false);
      setSelectedUserIds([]);
      alert(`Message successfully broadcasted to ${selectedUserIds.length} traders.`);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch bulk message');
    }
  };

  const getStatusBadge = (user: AdminUserItem) => {
    if (user.status === 'BANNED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <Ban className="w-3 h-3 text-rose-400" />
          Banned
        </span>
      );
    }
    if (user.status === 'SUSPENDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          Suspended
        </span>
      );
    }
    if (!user.isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30" title="Email verification pending">
          <Clock className="w-3 h-3 text-amber-400" />
          Unverified Email
        </span>
      );
    }
    if (user.status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <Clock className="w-3 h-3 text-blue-400" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        <CheckCircle className="w-3 h-3 text-emerald-400" />
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              User Lifecycle & Moderation Hub
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {filteredUsers.length} Users
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time trader directory with live status, plan assignment, and moderation tools.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Trader</span>
        </button>
      </div>

      {/* Bulk bar */}
      {selectedUserIds.length > 0 && (
        <div className="p-3.5 rounded-xl bg-purple-950/70 border border-purple-500/40 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs text-purple-200">
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <span className="font-bold">{selectedUserIds.length}</span> trader(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMessageData({
                  template: 'Bulk Notice',
                  subject: 'Notice from PipNex AI Team',
                  message: 'Hello Traders,\n\nWe are writing with an update...'
                });
                setIsBulkMessageOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-200 text-xs font-medium flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Message All
            </button>
            <button
              onClick={() => {
                setSuspendDuration('30 Days');
                setActionReason('Bulk administrative suspension');
                setIsBulkSuspendOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Bulk Suspend
            </button>
            <button
              onClick={handleBulkReactivateSubmit}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Bulk Reactivate
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl p-4 shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, account ID, IP, device..."
              className="w-full pl-9 pr-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
              <option value="PENDING">Pending Verification</option>
            </select>
          </div>

          <div>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Plans</option>
              <option value="Pending">Pending</option>
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Elite">Elite</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none bg-[#161a30] px-3 py-2 rounded-xl border border-[#262b49] w-full">
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Online Only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#14172b] text-slate-400 border-b border-[#1e233d]">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 font-semibold">Trader</th>
                <th className="py-3.5 px-4 font-semibold">Plan</th>
                <th className="py-3.5 px-4 font-semibold">Credits & Balance</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e233d]">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">Loading users database...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No users found.</td></tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <tr key={user.id} className={`hover:bg-[#151930] transition-colors ${isSelected ? 'bg-purple-950/20' : ''}`}>
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(user.id)}
                          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{user.firstName} {user.lastName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          user.plan === 'Pending'
                            ? 'bg-slate-500/10 text-slate-300 border-slate-500/30'
                            : 'bg-[#1a1f3d] text-purple-300 border-[#2d3663]'
                        }`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{(user.credits ?? 0).toLocaleString()} Credits</div>
                        <div className="text-[11px] text-emerald-400 font-mono">${(user.balance || 0).toFixed(2)}</div>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(user)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenDetail(user)} className="p-1.5 rounded-lg bg-[#181d38] hover:bg-[#22294e] text-slate-300" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleOpenMessage(user)} className="p-1.5 rounded-lg bg-[#181d38] hover:bg-[#22294e] text-purple-400" title="Message">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleOpenCredit(user)} className="p-1.5 rounded-lg bg-[#181d38] hover:bg-[#22294e] text-amber-400" title="Credits">
                            <Coins className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleOpenEdit(user)} className="p-1.5 rounded-lg bg-[#181d38] hover:bg-[#22294e] text-slate-300" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {user.status === 'ACTIVE' ? (
                            <>
                              <button onClick={() => handleOpenSuspend(user)} className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400" title="Suspend">
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleOpenBan(user)} className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400" title="Ban">
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleReactivateSubmit(user)} className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400" title="Reactivate">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleOpenDelete(user)} className="p-1.5 rounded-lg bg-[#181d38] hover:bg-rose-600/30 text-rose-400" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e1224] border border-[#262d4e] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e233d]">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" /> Add New Trader Account
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 rounded-lg bg-[#1a1f38] text-slate-400 hover:text-white flex items-center justify-center">✕</button>
            </div>

            {formError && <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">{formError}</div>}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">First Name *</label>
                  <input type="text" required value={createData.firstName} onChange={(e) => setCreateData({ ...createData, firstName: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Last Name *</label>
                  <input type="text" required value={createData.lastName} onChange={(e) => setCreateData({ ...createData, lastName: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500" />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Email Address *</label>
                <input type="email" required value={createData.email} onChange={(e) => setCreateData({ ...createData, email: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500 font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Phone</label>
                  <input type="text" placeholder="+254..." value={createData.phone} onChange={(e) => setCreateData({ ...createData, phone: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500 font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Initial Plan</label>
                  <select value={createData.plan} onChange={(e) => setCreateData({ ...createData, plan: e.target.value as any })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500">
                    <option value="Pending">Pending</option>
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Initial AI Credits</label>
                  <input type="number" value={createData.credits} onChange={(e) => setCreateData({ ...createData, credits: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Status</label>
                  <select value={createData.status} onChange={(e) => setCreateData({ ...createData, status: e.target.value as any })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1a1f38] text-slate-300 hover:text-white">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-600/30">Create Trader</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && activeUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e1224] border border-[#262d4e] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e233d]">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit className="w-4 h-4 text-purple-400" /> Edit: {activeUser.firstName} {activeUser.lastName}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 rounded-lg bg-[#1a1f38] text-slate-400 hover:text-white flex items-center justify-center">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">First Name</label>
                  <input type="text" required value={editData.firstName} onChange={(e) => setEditData({ ...editData, firstName: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Last Name</label>
                  <input type="text" required value={editData.lastName} onChange={(e) => setEditData({ ...editData, lastName: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500" />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Phone</label>
                <input type="text" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500 font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Plan</label>
                  <select value={editData.plan} onChange={(e) => setEditData({ ...editData, plan: e.target.value as any })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500">
                    <option value="Pending">Pending</option>
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Status</label>
                  <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value as any })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white outline-none focus:border-purple-500">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="BANNED">BANNED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1a1f38] text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION MODAL */}
      {isSubModalOpen && activeUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e1224] border border-[#262d4e] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e233d]">
              <h3 className="font-bold text-white text-sm">Change Subscription Plan</h3>
              <button onClick={() => setIsSubModalOpen(false)} className="w-8 h-8 rounded-lg bg-[#1a1f38] text-slate-400 hover:text-white flex items-center justify-center">✕</button>
            </div>
            <form onSubmit={handleSubSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Plan</label>
                <select value={subActionData.plan} onChange={(e) => setSubActionData({ ...subActionData, plan: e.target.value as any })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white">
                  <option value="Pending">Pending</option>
                  <option value="Starter">Starter</option>
                  <option value="Pro">Pro</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Start</label>
                  <input type="date" value={subActionData.startDate} onChange={(e) => setSubActionData({ ...subActionData, startDate: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Expiry</label>
                  <input type="date" value={subActionData.expiryDate} onChange={(e) => setSubActionData({ ...subActionData, expiryDate: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Reason *</label>
                <input type="text" required value={subActionData.reason} onChange={(e) => setSubActionData({ ...subActionData, reason: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsSubModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1a1f38] text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDITS MODAL */}
      {isCreditModalOpen && activeUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e1224] border border-[#262d4e] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e233d]">
              <h3 className="font-bold text-white text-sm">Adjust AI Credits</h3>
              <button onClick={() => setIsCreditModalOpen(false)} className="w-8 h-8 rounded-lg bg-[#1a1f38] text-slate-400 hover:text-white flex items-center justify-center">✕</button>
            </div>
            <form onSubmit={handleCreditSubmit} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#151930] border border-[#23294c] flex items-center justify-between">
                <span className="text-slate-400">Current</span>
                <span className="text-base font-bold text-white">{(activeUser.credits ?? 0).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['ADD', 'REMOVE', 'SET'] as const).map(act => (
                  <button key={act} type="button" onClick={() => setCreditActionData({ ...creditActionData, action: act })} className={`py-2 rounded-xl text-xs font-semibold ${creditActionData.action === act ? 'bg-purple-600 text-white' : 'bg-[#161a30] text-slate-400 border border-[#262b49]'}`}>
                    {act === 'ADD' ? '+ Add' : act === 'REMOVE' ? '- Deduct' : 'Set'}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Amount *</label>
                <input type="number" min="1" required value={creditActionData.amount} onChange={(e) => setCreditActionData({ ...creditActionData, amount: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white font-mono" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Reason *</label>
                <input type="text" required value={creditActionData.reason} onChange={(e) => setCreditActionData({ ...creditActionData, reason: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreditModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1a1f38] text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold">Apply</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUSPEND MODAL */}
      {isSuspendModalOpen && activeUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e1224] border border-[#262d4e] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center"><ShieldAlert className="w-5 h-5" /></div>
              <div>
                <h3 className="font-bold text-white text-base">Suspend Account</h3>
                <p className="text-xs text-slate-400">{activeUser.email}</p>
              </div>
            </div>
            <div className="text-xs space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Duration</label>
                <select value={suspendDuration} onChange={(e) => setSuspendDuration(e.target.value)} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white">
                  <option value="24 Hours">24 Hours</option>
                  <option value="7 Days">7 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="90 Days">90 Days</option>
                  <option value="Indefinite">Indefinite</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Reason *</label>
                <textarea rows={3} value={actionReason} onChange={(e) => setActionReason(e.target.value)} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white" />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setIsSuspendModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1a1f38] text-slate-300 text-xs">Cancel</button>
              <button onClick={handleSuspendSubmit} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* BAN MODAL */}
      {isBanModalOpen && activeUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#120a14] border border-rose-600/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center"><Ban className="w-6 h-6 text-rose-500" /></div>
              <div>
                <h3 className="font-bold text-white text-base">Permanent Ban</h3>
                <p className="text-xs text-rose-300/80 font-mono">{activeUser.email}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 bg-rose-950/30 p-3 rounded-xl border border-rose-500/20">
              ⚠️ Banning revokes login, halts bots, and flags device fingerprints.
            </p>
            <div className="text-xs">
              <label className="text-slate-400 block mb-1">Justification *</label>
              <textarea rows={3} value={actionReason} onChange={(e) => setActionReason(e.target.value)} className="w-full px-3 py-2 bg-[#1b1122] border border-rose-500/30 rounded-xl text-white text-xs" />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setIsBanModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs">Cancel</button>
              <button onClick={handleBanSubmit} className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold">Ban</button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {isMessageModalOpen && activeUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e1224] border border-[#262d4e] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e233d]">
              <h3 className="font-bold text-white text-sm">Message Trader</h3>
              <button onClick={() => setIsMessageModalOpen(false)} className="w-8 h-8 rounded-lg bg-[#1a1f38] text-slate-400 hover:text-white flex items-center justify-center">✕</button>
            </div>
            <form onSubmit={handleSendMessageSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Subject *</label>
                <input type="text" required value={messageData.subject} onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Message *</label>
                <textarea rows={5} required value={messageData.message} onChange={(e) => setMessageData({ ...messageData, message: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white font-mono text-[11px]" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsMessageModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#1a1f38] text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && activeUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#120a14] border border-rose-600/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center"><Trash2 className="w-6 h-6 text-rose-500" /></div>
              <div>
                <h3 className="font-bold text-white text-base">Delete Account</h3>
                <p className="text-xs text-rose-300 font-mono">{activeUser.email}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">This action is <strong>irreversible</strong>.</p>
            {formError && <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">{formError}</div>}
            <div className="text-xs space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Reason</label>
                <input type="text" value={actionReason} onChange={(e) => setActionReason(e.target.value)} className="w-full px-3 py-2 bg-[#1b1122] border border-rose-500/30 rounded-xl text-white text-xs" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Admin Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-[#1b1122] border border-rose-500/30 rounded-xl text-white text-xs font-mono" />
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs">Cancel</button>
              <button onClick={handleDeleteSubmit} disabled={isVerifyingPassword || !adminPasswordInput} className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold">
                {isVerifyingPassword ? 'Verifying...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK SUSPEND MODAL */}
      {isBulkSuspendOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e1224] border border-[#262d4e] rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Bulk Suspend {selectedUserIds.length} Users</h3>
            <div className="text-xs space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Duration</label>
                <select value={suspendDuration} onChange={(e) => setSuspendDuration(e.target.value)} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white">
                  <option value="24 Hours">24 Hours</option>
                  <option value="7 Days">7 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="Indefinite">Indefinite</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Reason</label>
                <textarea rows={3} value={actionReason} onChange={(e) => setActionReason(e.target.value)} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsBulkSuspendOpen(false)} className="px-4 py-2 rounded-xl bg-[#1a1f38] text-slate-300 text-xs">Cancel</button>
              <button onClick={handleBulkSuspendSubmit} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold">Suspend All</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK MESSAGE MODAL */}
      {isBulkMessageOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e1224] border border-[#262d4e] rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Bulk Message {selectedUserIds.length} Users</h3>
            <form onSubmit={handleBulkMessageSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Subject *</label>
                <input type="text" required value={messageData.subject} onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Message *</label>
                <textarea rows={5} required value={messageData.message} onChange={(e) => setMessageData({ ...messageData, message: e.target.value })} className="w-full px-3 py-2 bg-[#161a30] border border-[#262b49] rounded-xl text-white font-mono text-[11px]" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsBulkMessageOpen(false)} className="px-4 py-2 rounded-xl bg-[#1a1f38] text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold">Send All</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER */}
      {isDetailDrawerOpen && activeUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xl bg-[#0e1224] border-l border-[#262d4e] h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e233d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-white">
                  {activeUser.firstName[0]}{activeUser.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{activeUser.firstName} {activeUser.lastName}</h3>
                  <p className="text-xs text-purple-400 font-mono">{activeUser.email}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailDrawerOpen(false)} className="w-8 h-8 rounded-lg bg-[#1a1f38] text-slate-400 hover:text-white flex items-center justify-center">✕</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#14182e] border border-[#202747]">
                <span className="text-slate-400 block mb-1">Status</span>
                {getStatusBadge(activeUser)}
              </div>
              <div className="p-3 rounded-xl bg-[#14182e] border border-[#202747]">
                <span className="text-slate-400 block mb-1">Plan</span>
                <span className="font-bold text-white">{activeUser.plan}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#14182e] border border-[#202747]">
                <span className="text-slate-400 block mb-1">Credits</span>
                <span className="font-bold text-amber-400">{(activeUser.credits ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#14182e] border border-[#202747] text-xs space-y-2">
              <span className="font-semibold text-white block mb-1">Device & Network</span>
              <div className="flex justify-between py-1 border-b border-[#202747]">
                <span className="text-slate-400">Last IP</span>
                <span className="font-mono text-slate-200">{activeUser.lastIp || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#202747]">
                <span className="text-slate-400">Location</span>
                <span className="text-slate-200">{activeUser.location || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Registered</span>
                <span className="text-slate-200">{new Date(activeUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1e233d] flex gap-2">
              <button onClick={() => { setIsDetailDrawerOpen(false); handleOpenMessage(activeUser); }} className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </button>
              <button onClick={() => { setIsDetailDrawerOpen(false); handleOpenCredit(activeUser); }} className="py-2 px-3 rounded-xl bg-[#1a1f38] hover:bg-[#252c4e] text-amber-400 text-xs font-semibold">
                Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
