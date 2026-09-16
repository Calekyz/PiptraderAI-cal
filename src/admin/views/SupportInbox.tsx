import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  FileText,
  User,
  Sparkles,
  ChevronRight,
  MoreVertical,
  Paperclip
} from 'lucide-react';
import { AdminSupportTicket, AdminStats } from '../types';
import { AdminApi } from '../api';

interface SupportInboxProps {
  initialTicketId?: string | null;
  stats: AdminStats | null;
  onRefreshStats?: () => void;
}

export const SupportInbox: React.FC<SupportInboxProps> = ({
  initialTicketId,
  stats,
  onRefreshStats
}) => {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialTicketId || null);
  const [activeTicket, setActiveTicket] = useState<AdminSupportTicket | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<string>('IN_PROGRESS');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Internal Note state
  const [internalNote, setInternalNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await AdminApi.getSupportTickets({
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        search
      });
      setTickets(data);

      if (data.length > 0) {
        if (selectedTicketId) {
          const found = data.find(t => t.id === selectedTicketId);
          setActiveTicket(found || data[0]);
        } else {
          setActiveTicket(data[0]);
          setSelectedTicketId(data[0].id);
        }
      } else {
        setActiveTicket(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter, search]);

  const handleSelectTicket = async (ticket: AdminSupportTicket) => {
    setSelectedTicketId(ticket.id);
    setActiveTicket(ticket);
    try {
      const full = await AdminApi.getTicketDetails(ticket.id);
      setActiveTicket(full);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const updated = await AdminApi.replyTicket(
        activeTicket.id,
        replyText.trim(),
        'PipNex Support Desk',
        replyStatus
      );

      setActiveTicket(updated);
      setReplyText('');
      fetchTickets();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleChangeStatus = async (newStatus: AdminSupportTicket['status']) => {
    if (!activeTicket) return;
    try {
      const updated = await AdminApi.setTicketStatus(activeTicket.id, newStatus);
      setActiveTicket(updated);
      fetchTickets();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePriority = async (newPriority: AdminSupportTicket['priority']) => {
    if (!activeTicket) return;
    try {
      const updated = await AdminApi.setTicketPriority(activeTicket.id, newPriority);
      setActiveTicket(updated);
      fetchTickets();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !internalNote.trim()) return;

    try {
      const updated = await AdminApi.addTicketNote(activeTicket.id, internalNote.trim());
      setActiveTicket(updated);
      setInternalNote('');
      setIsAddingNote(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Canned responses
  const cannedTemplates = [
    {
      title: 'Investigating MT5',
      text: 'Hello Trader, our technical integration team is currently reviewing your MetaTrader connection logs. Please keep your terminal online.'
    },
    {
      title: 'Credits Credited',
      text: 'Your account balance has been reviewed and compensation tokens have been added to your credit ledger.'
    },
    {
      title: 'Resolved & Closed',
      text: 'The reported configuration has been updated and verified on our server. We are marking this ticket as resolved.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-amber-400" />
          Support Desk & Ticket Inquiries
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Live customer support inbox, canned response macros, priority routing, and internal notes.
        </p>
      </div>

      {/* Main 2-Pane Support Desk */}
      <div className="bg-[#0f1224] border border-[#1e233d] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column: Tickets List (4 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 border-r border-[#1e233d] flex flex-col bg-[#0d101f]">
          {/* Filter Bar */}
          <div className="p-3 border-b border-[#1e233d] space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket subject, user email..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#161a30] border border-[#262b49] rounded-xl text-slate-200 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="PENDING">PENDING</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#161a30] border border-[#262b49] rounded-xl text-slate-200 text-xs"
              >
                <option value="all">All Priorities</option>
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#181d36] custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No tickets found.</div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-600/15 border-l-4 border-purple-500'
                        : 'hover:bg-[#14182e]/80 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.priority === 'URGENT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700/40 text-slate-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-white truncate">{t.subject}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">{t.userName} • {t.userEmail}</div>

                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-[#161a30] text-slate-400 border border-[#232847]">
                        {t.category}
                      </span>
                      <span
                        className={`font-semibold ${
                          t.status === 'OPEN'
                            ? 'text-amber-400'
                            : t.status === 'RESOLVED'
                            ? 'text-emerald-400'
                            : 'text-purple-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Thread (7-8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-[#0f1224]">
          {activeTicket ? (
            <>
              {/* Ticket Top Action Bar */}
              <div className="p-4 border-b border-[#1e233d] flex flex-wrap items-center justify-between gap-3 bg-[#13162b]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">#{activeTicket.id}</span>
                    <h2 className="text-sm font-bold text-white">{activeTicket.subject}</h2>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    From: <span className="text-slate-200 font-semibold">{activeTicket.userName}</span> ({activeTicket.userEmail})
                  </div>
                </div>

                {/* Status & Priority Controls */}
                <div className="flex items-center gap-2">
                  {/* Status Dropdown */}
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleChangeStatus(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-[#161a30] border border-[#262b49] rounded-xl text-xs font-semibold text-purple-300"
                  >
                    <option value="OPEN">Status: OPEN</option>
                    <option value="IN_PROGRESS">Status: IN PROGRESS</option>
                    <option value="PENDING">Status: PENDING</option>
                    <option value="RESOLVED">Status: RESOLVED</option>
                    <option value="CLOSED">Status: CLOSED</option>
                  </select>

                  {/* Priority Dropdown */}
                  <select
                    value={activeTicket.priority}
                    onChange={(e) => handleChangePriority(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-[#161a30] border border-[#262b49] rounded-xl text-xs font-semibold text-amber-300"
                  >
                    <option value="LOW">Priority: LOW</option>
                    <option value="MEDIUM">Priority: MEDIUM</option>
                    <option value="HIGH">Priority: HIGH</option>
                    <option value="URGENT">Priority: URGENT</option>
                  </select>
                </div>
              </div>

              {/* Conversation Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {/* Original User Message */}
                <div className="p-4 bg-[#14182e] border border-[#232847] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {activeTicket.userName} (Trader)
                    </span>
                    <span className="text-[11px] font-mono">
                      {new Date(activeTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {activeTicket.message}
                  </p>
                </div>

                {/* Internal Notes Display */}
                {activeTicket.internalNotes && activeTicket.internalNotes.length > 0 && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Staff Internal Notes
                    </div>
                    {activeTicket.internalNotes.map((note, idx) => (
                      <p key={idx} className="text-xs text-amber-200/90 font-mono">
                        • {note}
                      </p>
                    ))}
                  </div>
                )}

                {/* Replies Thread */}
                {activeTicket.replies && activeTicket.replies.map((reply) => {
                  const isAgent = reply.sender === 'agent';
                  return (
                    <div
                      key={reply.id}
                      className={`p-3.5 rounded-2xl text-xs space-y-1.5 max-w-xl ${
                        isAgent
                          ? 'ml-auto bg-purple-600/20 border border-purple-500/30 text-purple-100'
                          : 'mr-auto bg-[#14182e] border border-[#232847] text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] opacity-80 mb-1">
                        <span className="font-bold">{reply.senderName}</span>
                        <span className="text-[10px] font-mono">
                          {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{reply.text}</p>
                    </div>
                  );
                })}
              </div>

              {/* Canned Macro Quick Buttons */}
              <div className="px-4 py-2 bg-[#121528] border-t border-[#1e233d] flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-slate-500 shrink-0">Macros:</span>
                {cannedTemplates.map((macro) => (
                  <button
                    key={macro.title}
                    type="button"
                    onClick={() => setReplyText(macro.text)}
                    className="px-2.5 py-1 rounded-lg bg-[#1a1f3a] hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-[#2b3152] shrink-0 transition-colors cursor-pointer"
                  >
                    {macro.title}
                  </button>
                ))}
              </div>

              {/* Reply Form */}
              <div className="p-4 border-t border-[#1e233d] bg-[#111427]">
                <form onSubmit={handleSendReply} className="space-y-3">
                  <textarea
                    rows={3}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official response to trader..."
                    className="w-full p-3 bg-[#161a30] border border-[#262b49] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Set status after reply:</span>
                      <select
                        value={replyStatus}
                        onChange={(e) => setReplyStatus(e.target.value)}
                        className="px-2 py-1 bg-[#161a30] border border-[#262b49] rounded-lg text-xs text-slate-200"
                      >
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReply}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingReply ? 'Sending...' : 'Send Response'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <LifeBuoy className="w-12 h-12 text-slate-600 mb-3" />
              <div className="text-sm font-semibold text-slate-300">No Ticket Selected</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Select a ticket from the left panel to review inquiry conversation and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
