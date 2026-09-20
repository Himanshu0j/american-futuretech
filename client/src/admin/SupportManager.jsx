import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  User,
  Filter,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function SupportManager() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/support/admin/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTickets(res.data.tickets || []);
        if (res.data.tickets && res.data.tickets.length > 0 && !activeTicket) {
          setActiveTicket(res.data.tickets[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `/api/support/admin/tickets/${ticketId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const updated = res.data.ticket;
        setTickets(tickets.map(t => t._id === updated._id ? updated : t));
        if (activeTicket && activeTicket._id === updated._id) {
          setActiveTicket(updated);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;
    try {
      setReplying(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/support/tickets/${activeTicket._id}/reply`,
        { message: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const updated = res.data.ticket;
        setActiveTicket(updated);
        setTickets(tickets.map(t => t._id === updated._id ? updated : t));
        setReplyText('');
      }
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setReplying(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.student?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-2">
            <LifeBuoy className="w-3.5 h-3.5" />
            Admissions & Student Care
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-heading">
            Student Support & Mentorship Tickets
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Resolve student curriculum questions, technical lab blockers, and certification inquiries in real time.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* Left Column: Tickets Queue (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-4 flex flex-col gap-3">
          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ticket or student..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
              {['ALL', 'Open', 'In Progress', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Cards */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[550px] pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No support tickets found.</div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = activeTicket?._id === ticket._id;
                return (
                  <button
                    key={ticket._id}
                    onClick={() => setActiveTicket(ticket)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/80 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {ticket.category}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        ticket.status === 'Resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : ticket.status === 'In Progress'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate mb-1">
                      {ticket.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{ticket.student?.name || 'Student'}</span>
                      <span className={`font-semibold ${ticket.priority === 'Urgent' ? 'text-rose-400' : 'text-slate-500'}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Detail & Conversation Thread (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col overflow-hidden">
          {activeTicket ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                      Ticket #{activeTicket._id.slice(-6)} • {activeTicket.category}
                    </span>
                    <span className="text-xs text-slate-500">|</span>
                    <span className="text-xs text-slate-400 font-mono">
                      Student: <strong className="text-white">{activeTicket.student?.name}</strong> ({activeTicket.student?.email})
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white font-heading">
                    {activeTicket.subject}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 uppercase">Status:</span>
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleStatusChange(activeTicket._id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[480px]">
                {activeTicket.messages?.map((msg, index) => {
                  const isStaff = msg.senderRole && msg.senderRole !== 'STUDENT';
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 max-w-[85%] ${isStaff ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isStaff ? 'bg-cyan-500 text-slate-950 font-mono' : 'bg-slate-700 text-white'
                      }`}>
                        {isStaff ? 'ADM' : 'STU'}
                      </div>
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isStaff
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                          : 'bg-slate-800/90 border border-slate-700 text-slate-200'
                      }`}>
                        <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75 font-mono">
                          <span>{msg.senderName || (isStaff ? 'Staff Support' : 'Student')}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Staff Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply to student as official faculty / admissions..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={replying || !replyText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-mono">
              Select a ticket to view conversation thread.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
