import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Download,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Building2,
  Wallet,
  Smartphone,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AdminTransactionItem, TransactionAnalytics } from '../types';
import { AdminApi } from '../api';

interface TransactionsViewProps {
  onRefreshStats?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onRefreshStats }) => {
  const [transactions, setTransactions] = useState<AdminTransactionItem[]>([]);
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters State
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Transaction for Details Modal
  const [selectedTx, setSelectedTx] = useState<AdminTransactionItem | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const [txList, txAnalytics] = await Promise.all([
        AdminApi.getTransactions({
          dateRange,
          startDate: dateRange === 'custom' ? startDate : undefined,
          endDate: dateRange === 'custom' ? endDate : undefined,
          type: typeFilter,
          status: statusFilter,
          paymentMethod: methodFilter,
          search: searchQuery
        }),
        AdminApi.getTransactionAnalytics({
          dateRange,
          startDate: dateRange === 'custom' ? startDate : undefined,
          endDate: dateRange === 'custom' ? endDate : undefined
        })
      ]);
      setTransactions(txList);
      setAnalytics(txAnalytics);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [dateRange, startDate, endDate, typeFilter, statusFilter, methodFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // CSV Export Handler
  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      if (transactions.length === 0) {
        alert('No transactions to export.');
        setIsExporting(false);
        return;
      }

      const headers = [
        'Transaction ID',
        'Date (UTC)',
        'Trader Name',
        'Trader Email',
        'Type',
        'Payment Method',
        'USD Amount',
        'KES Amount',
        'Exchange Rate',
        'Status',
        'Reference / Hash',
        'Receipt Number',
        'Description',
        'High Value Alert'
      ];

      const rows = transactions.map(t => [
        `"${t.id}"`,
        `"${t.createdAt}"`,
        `"${t.userName.replace(/"/g, '""')}"`,
        `"${t.userEmail}"`,
        `"${t.type}"`,
        `"${t.paymentMethod}"`,
        t.amountUsd,
        t.amountKes,
        t.exchangeRate,
        `"${t.status}"`,
        `"${t.reference || ''}"`,
        `"${t.receiptNumber || ''}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.isHighValue ? 'YES' : 'NO'
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `PipNex_Transactions_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'mpesa_automated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Smartphone className="w-3 h-3 text-emerald-400" />
            M-PESA Express
          </span>
        );
      case 'mpesa_manual':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Smartphone className="w-3 h-3 text-teal-400" />
            M-PESA Paybill
          </span>
        );
      case 'binance_usdt':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Wallet className="w-3 h-3 text-amber-400" />
            Binance USDT
          </span>
        );
      case 'bank_transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Building2 className="w-3 h-3 text-blue-400" />
            Bank Wire
          </span>
        );
      case 'stripe':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CreditCard className="w-3 h-3 text-indigo-400" />
            Stripe Card
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {method}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Completed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            Pending
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" />
            Failed
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <ArrowDownRight className="w-3 h-3 text-purple-400" />
            Refunded
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  const highValueCount = useMemo(() => {
    return transactions.filter(t => t.isHighValue && t.status === 'COMPLETED').length;
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Header with Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Financial Oversight & Transactions</h1>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Live Ledger
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time audit log of all incoming M-PESA payments, crypto deposits, bot subscriptions, and refunds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTransactions}
            disabled={isLoading}
            className="px-3 py-2 rounded-lg bg-[#15192c] hover:bg-[#1c223c] border border-[#262c4d] text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            Refresh
          </button>

          <button
            id="export-transactions-csv-btn"
            onClick={handleExportCsv}
            disabled={isExporting || transactions.length === 0}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {isExporting ? 'Generating CSV...' : 'Export to CSV'}
          </button>
        </div>
      </div>

      {/* Real-Time KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Volume USD & KES */}
        <div className="p-4 rounded-xl bg-[#0d101f] border border-[#1e233d] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Volume (Settled)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              ${(analytics?.totalVolumeUsd || 0).toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +{analytics?.growthVsPreviousPeriod || 14.8}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            ≈ KES {(analytics?.totalVolumeKes || 0).toLocaleString()} (FX ~130)
          </p>
        </div>

        {/* KPI 2: Total Transactions */}
        <div className="p-4 rounded-xl bg-[#0d101f] border border-[#1e233d] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Transactions</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {transactions.length}
            </span>
            <span className="text-xs text-slate-400">
              ({analytics?.statusBreakdown?.COMPLETED || 0} completed)
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-amber-400 font-medium">{analytics?.statusBreakdown?.PENDING || 0} pending</span>
            <span>•</span>
            <span className="text-rose-400 font-medium">{analytics?.statusBreakdown?.FAILED || 0} failed</span>
          </div>
        </div>

        {/* KPI 3: Average Transaction Value */}
        <div className="p-4 rounded-xl bg-[#0d101f] border border-[#1e233d] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Transaction Value</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              ${analytics?.averageTransactionValueUsd || 0}
            </span>
            <span className="text-xs text-slate-400">per order</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            ≈ KES {Math.round((analytics?.averageTransactionValueUsd || 0) * 130).toLocaleString()}
          </p>
        </div>

        {/* KPI 4: High Value Activity */}
        <div className="p-4 rounded-xl bg-[#0d101f] border border-[#1e233d] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">High-Value Transactions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {highValueCount}
            </span>
            <span className="text-xs font-medium text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              &gt; $200 Tier
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Institutional PropPass & Platinum accounts
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="p-4 rounded-xl bg-[#0d101f] border border-[#1e233d] space-y-4">
        {/* Date Timeframe Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#15192c] p-1 rounded-lg border border-[#262c4d]">
            <button
              id="date-filter-all"
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dateRange === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              id="date-filter-today"
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dateRange === 'today'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Today
            </button>
            <button
              id="date-filter-week"
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dateRange === 'week'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              id="date-filter-month"
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dateRange === 'month'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              id="date-filter-custom"
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                dateRange === 'custom'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Custom Date Pickers */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#15192c] border border-[#262c4d] rounded-lg px-2.5 py-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-400">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none border-none"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-[#15192c] border border-[#262c4d] rounded-lg px-2.5 py-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-400">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none border-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Secondary Filters: Search, Type, Payment Method, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#1e233d]">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trader, email, receipt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#15192c] border border-[#262c4d] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#15192c] border border-[#262c4d] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="SUBSCRIPTION">Bot Subscriptions</option>
              <option value="DEPOSIT">Direct Account Deposits</option>
              <option value="CREDIT_PURCHASE">AI Signal Credit Packs</option>
              <option value="REFUND">Refunds & Adjustments</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full bg-[#15192c] border border-[#262c4d] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="all">All Payment Methods</option>
              <option value="mpesa_automated">M-PESA Express (STK)</option>
              <option value="mpesa_manual">M-PESA Paybill (Manual)</option>
              <option value="binance_usdt">Binance Pay (USDT)</option>
              <option value="bank_transfer">Direct Bank Wire</option>
              <option value="stripe">Stripe Card</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#15192c] border border-[#262c4d] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed Only</option>
              <option value="PENDING">Pending Approval</option>
              <option value="FAILED">Failed / Declined</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl bg-[#0d101f] border border-[#1e233d] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#1e233d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Transaction Ledger ({transactions.length} Records)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#12162a] text-slate-400 border-b border-[#1e233d]">
                <th className="py-3 px-4 font-semibold">Transaction / Date</th>
                <th className="py-3 px-4 font-semibold">Trader Details</th>
                <th className="py-3 px-4 font-semibold">Amount (USD / KES)</th>
                <th className="py-3 px-4 font-semibold">Type & Gateway</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e233d]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                      <p>Loading transactions ledger...</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-600" />
                      <p className="font-medium text-slate-300">No transactions match current filters</p>
                      <p className="text-xs text-slate-500">Try adjusting the date timeframe or search parameters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-[#14182e] transition-colors ${
                      tx.isHighValue ? 'bg-amber-500/[0.02]' : ''
                    }`}
                  >
                    {/* ID & Date */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-white font-medium text-[11px]">{tx.id}</span>
                        {tx.isHighValue && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            HIGH VALUE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Trader Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{tx.userName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{tx.userEmail}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">
                        {tx.amountUsd < 0 ? `-$${Math.abs(tx.amountUsd)}` : `$${tx.amountUsd}`}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        KES {Math.abs(tx.amountKes).toLocaleString()}
                      </div>
                    </td>

                    {/* Type & Method */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div>{getMethodBadge(tx.paymentMethod)}</div>
                      <div className="text-[11px] text-slate-400">{tx.description}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(tx.status)}
                    </td>

                    {/* Reference / Receipt */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-slate-300">
                        {tx.receiptNumber || tx.reference || '—'}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1c223c] hover:bg-purple-600/30 border border-[#2e375e] text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e1224] border border-[#262d4e] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e233d]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Transaction Audit Inspector</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedTx.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-lg bg-[#1c213a] hover:bg-[#252c4d] text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Info Grid */}
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 rounded-lg bg-[#14182e] border border-[#202747]">
                <span className="text-slate-400 block mb-1">Settled Amount (USD)</span>
                <span className="text-lg font-bold text-white">${selectedTx.amountUsd}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#14182e] border border-[#202747]">
                <span className="text-slate-400 block mb-1">Equivalent (KES)</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  KES {selectedTx.amountKes.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#14182e] border border-[#202747] col-span-2">
                <span className="text-slate-400 block mb-1">Trader Account</span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{selectedTx.userName}</span>
                  <span className="font-mono text-purple-400">{selectedTx.userEmail}</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Account ID: {selectedTx.userId}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#14182e] border border-[#202747]">
                <span className="text-slate-400 block mb-1">Payment Method</span>
                <div>{getMethodBadge(selectedTx.paymentMethod)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#14182e] border border-[#202747]">
                <span className="text-slate-400 block mb-1">Status</span>
                <div>{getStatusBadge(selectedTx.status)}</div>
              </div>

              <div className="p-3 rounded-lg bg-[#14182e] border border-[#202747] col-span-2 space-y-1">
                <span className="text-slate-400 block">Gateway Reference & Receipt</span>
                <p className="font-mono text-slate-200 bg-[#0d101f] p-2 rounded border border-[#1e233d] select-all break-all">
                  {selectedTx.receiptNumber || selectedTx.reference || 'N/A'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#14182e] border border-[#202747] col-span-2">
                <span className="text-slate-400 block mb-1">Description / Product Tier</span>
                <p className="text-slate-200">{selectedTx.description}</p>
                {selectedTx.tier && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
                    Tier: {selectedTx.tier}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-[#14182e] border border-[#202747] col-span-2 text-[11px] text-slate-400 space-y-0.5">
                <div>Created: {new Date(selectedTx.createdAt).toLocaleString()}</div>
                {selectedTx.completedAt && (
                  <div>Completed: {new Date(selectedTx.completedAt).toLocaleString()}</div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-lg bg-[#1c223c] hover:bg-[#252c4d] text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
