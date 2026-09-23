import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  LifeBuoy,
  PlusCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  ShieldAlert,
  ChevronRight,
  Headphones,
  HelpCircle,
  X
} from 'lucide-react';

export default function StudentSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  // New ticket form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical');
  const [priority, setPriority] = useState('Medium');
  const [initialMessage, setInitialMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/support/my-tickets', {
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

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      setFormError('Please fill in both subject and description.');
      return;
    }
    try {
      setCreating(true);
      setFormError('');
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/support/tickets',
        { subject, category, priority, message: initialMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setTickets([res.data.ticket, ...tickets]);
        setActiveTicket(res.data.ticket);
        setShowNewModal(false);
        setSubject('');
        setInitialMessage('');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;
    try {
      setReplying(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/support/tickets/${activeTicket._id}/reply`,
        { message: replyMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const updatedTicket = res.data.ticket;
        setActiveTicket(updatedTicket);
        setTickets(tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t));
        setReplyMessage('');
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6D6] border border-[#E5C275]/40 text-[#0B1220] text-xs font-bold uppercase tracking-wider mb-2">
            <LifeBuoy className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Academic & Technical Faculty Desk</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-[#0B1220]">
            Student Support & Mentorship Desk
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed max-w-xl">
            Need guidance with your course code exercises, cloud environments, or capstone projects? US faculty responds directly.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Create Support Ticket
        </button>
      </div>

      {/* Main Split Interface */}
      {loading ? (
        <div className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse shadow-xs" />
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#EFE6D6] border border-[#E5C275]/40 flex items-center justify-center text-[#0B1220] mb-4">
            <Headphones className="w-8 h-8 text-[#4338CA]" />
          </div>
          <h3 className="text-lg font-heading font-bold text-[#0B1220] mb-2">No Open Tickets</h3>
          <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
            All coursework and services are running smoothly. If you ever have questions about lectures or project milestones, raise a ticket here.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Open First Support Query
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Ticket List Sidebar (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-2.5 overflow-y-auto max-h-[750px] shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">
              Your Support Queries ({tickets.length})
            </div>
            {tickets.map((ticket) => {
              const isSelected = activeTicket?._id === ticket._id;
              return (
                <button
                  key={ticket._id}
                  onClick={() => setActiveTicket(ticket)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#F7F7F5] border-[#0B1220] shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F7F7F5] text-[#0B1220] border border-slate-200">
                      {ticket.category}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      ticket.status === 'Resolved' || ticket.status === 'Closed'
                        ? 'bg-[#EFE6D6] text-[#0B1220]'
                        : ticket.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0B1220] truncate mb-1">
                    {ticket.subject}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <span>{ticket.messages?.length || 1} messages</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ticket Conversation Detail (8 cols) */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden shadow-xs">
            {activeTicket ? (
              <>
                {/* Header */}
                <div className="p-5 border-b border-slate-200 bg-[#F7F7F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#4338CA] uppercase tracking-wider">
                        {activeTicket.category} • Priority: {activeTicket.priority}
                      </span>
                    </div>
                    <h3 className="text-base font-heading font-bold text-[#0B1220]">
                      {activeTicket.subject}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Opened {new Date(activeTicket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Message Thread */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[500px] bg-slate-50/40">
                  {activeTicket.messages?.map((msg, index) => {
                    const isStaff = msg.senderRole && msg.senderRole !== 'STUDENT';
                    return (
                      <div
                        key={index}
                        className={`flex gap-3 max-w-[85%] ${isStaff ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isStaff ? 'bg-[#0B1220] text-white' : 'bg-[#4338CA] text-white'
                        }`}>
                          {isStaff ? 'AF' : 'ME'}
                        </div>
                        <div className={`p-4 rounded-2xl text-xs sm:text-sm shadow-xs ${
                          isStaff
                            ? 'bg-white border border-slate-200 text-slate-800'
                            : 'bg-[#0B1220] text-white'
                        }`}>
                          <div className={`flex items-center justify-between gap-4 mb-1 text-[11px] ${
                            isStaff ? 'text-slate-400' : 'text-slate-300'
                          }`}>
                            <span className="font-bold">{msg.senderName || (isStaff ? 'Faculty Mentor' : 'You')}</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Input */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your response to faculty..."
                    disabled={activeTicket.status === 'Closed'}
                    className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#0B1220] focus:bg-white disabled:opacity-50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyMessage.trim() || activeTicket.status === 'Closed'}
                    className="px-5 py-2.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 transition-colors shrink-0 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 p-8 text-xs">
                Select a ticket to inspect conversation thread.
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-[#4338CA]" />
                  <h3 className="text-base font-heading font-bold text-[#0B1220]">Submit Academic Support Ticket</h3>
                </div>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject / Question Summary *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Question about Module 3 PyTorch Loss Function"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#0B1220] focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#0B1220] focus:bg-white transition-all"
                    >
                      <option value="Technical">Technical / Code</option>
                      <option value="Curriculum">Curriculum / Labs</option>
                      <option value="Billing">Billing / Payment</option>
                      <option value="Certificate">Certificate</option>
                      <option value="Placement">Career Mentorship</option>
                      <option value="Other">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#0B1220] focus:bg-white transition-all"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detailed Explanation *</label>
                  <textarea
                    rows={4}
                    required
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Describe what you are trying to accomplish and any error messages..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-[#0B1220] focus:bg-white resize-none transition-all"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    {creating ? 'Submitting...' : 'Submit Support Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
