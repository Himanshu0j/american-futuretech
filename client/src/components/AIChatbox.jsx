import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  CheckCircle2,
  ChevronRight,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import axios from 'axios';

const KNOWLEDGE_BASE = [
  {
    triggers: ['program', 'course', 'track', 'learn', 'specialization', 'which program'],
    answer: "American FutureTech offers 6 flagship engineering fellowship tracks:\n1. Data Science with AI Integration (6 Months)\n2. Cyber Security with Ethical Hacking (6 Months)\n3. Cyber Security & AI Hybrid Track (6 Months)\n4. Advanced Generative & Agentic AI Master Program (4 Months)\n5. DevOps, Kubernetes & Cloud with AI (6 Months)\n6. AI Product Manager & GRC (4-6 Months)\n\nAll tracks feature weekend live interactive masterclasses, 1-on-1 mentorship, and production sandbox labs."
  },
  {
    triggers: ['placement', 'job', 'hiring', 'career', 'salary', 'guarantee', 'roadmap'],
    answer: "Our 6-Phase Career Transformation System guarantees personalized placement guidance:\n- Step 1: Program Orientation & Skills Audit\n- Step 2: Hands-on Labs with 40+ Industry Tools\n- Step 3: Quizzes, Challenges & Capstone Reviews\n- Step 4: US Verifiable Digital Certification\n- Step 5: ATS Resume Overhaul & FAANG Mock Interviews\n- Step 6: Direct Referral Access across our 140+ hiring partner network (average salary uplift +138%)."
  },
  {
    triggers: ['accredited', 'certificate', 'credential', 'wyoming', 'verify'],
    answer: "Yes. American FutureTech LLC is a registered corporate education institute in Sheridan, Wyoming, USA (30 N Gould St). Every graduate receives a permanent, cryptographically-verifiable digital credential shareable on LinkedIn and verifiable directly on our portal (/certificate/:id)."
  },
  {
    triggers: ['fee', 'price', 'cost', '99', 'reservation', 'tuition'],
    answer: "You can reserve your cohort fellowship seat today for just $99. Complete tuition details and flexible monthly installment options can be tailored during your academic counseling session. Early-bird applicants receive priority capstone lab allocations."
  },
  {
    triggers: ['contact', 'human', 'call', 'speak', 'admissions', 'counselor'],
    answer: "Our admissions department is located at 30 N Gould St, Sheridan, WY 82801. You can call us directly at +1 (307) 201-9494, chat via WhatsApp, or share your details below to schedule an advisory consultation."
  }
];

export default function AIChatbox() {
  const location = useLocation();
  // Strictly prevent AIChatbox from ever rendering in Admin UI
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your American FutureTech Admissions Advisor. Ask me anything about our fellowship tracks, US accreditation, tuition, or placement assistance!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  // Quick Lead form state inside chat
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (textToSend = null) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    // Append user message
    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let matchedAnswer = null;

      for (const item of KNOWLEDGE_BASE) {
        if (item.triggers.some(t => lower.includes(t))) {
          matchedAnswer = item.answer;
          break;
        }
      }

      if (!matchedAnswer) {
        matchedAnswer = "Thank you for inquiring! Our comprehensive engineering programs combine weekend live mentor sessions, 40+ industry tools, and US digital credentials. Would you like to schedule a 1-on-1 academic counseling consultation or browse our Live Jobs board?";
      }

      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: matchedAnswer }
      ]);
      setIsTyping(false);

      if (lower.includes('call') || lower.includes('human') || lower.includes('admissions') || lower.includes('counseling')) {
        setShowLeadForm(true);
      }
    }, 600);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadPhone) {
      alert('Please fill out your name, email, and phone number.');
      return;
    }

    try {
      await axios.post('/api/leads', {
        name: leadName,
        email: leadEmail,
        phone: leadPhone,
        programOfInterest: 'Admissions Counseling (AI Chat)',
        source: 'AI Chat Advisor'
      });
      setLeadSubmitted(true);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Thank you, ${leadName}! Your counseling request has been received. Our senior admissions counselor will reach out to ${leadPhone} shortly.`
        }
      ]);
    } catch (err) {
      alert('Failed to submit advisory request. Please call us at +1 (307) 201-9494.');
    }
  };

  const quickPills = [
    'Which program is best for me?',
    'How does placement work?',
    'Are certificates accredited?',
    'What is the $99 seat reservation?'
  ];

  return (
    <>
      {/* Floating Trigger Button (Stacked cleanly above WhatsApp button) */}
      <div className="fixed bottom-24 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Advisor Chat"
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#1a361d] hover:bg-[#2d5c36] text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-[#76ff8a]/40 group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-[#76ff8a] text-[#1a361d] flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <span className="text-xs font-bold font-sans tracking-wide">Ask AI Advisor</span>
          </button>
        )}
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-96 rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] h-[540px] text-left animate-in fade-in slide-in-from-bottom-5 duration-200 font-sans">
          
          {/* Header */}
          <div className="p-4 bg-[#1a361d] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#76ff8a] text-[#1a361d] flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>AFT Academic AI</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-[#d8ffd2]/80 font-mono">
                  Online • Instant Admissions Guidance
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fffff2]/60 text-xs">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 items-start ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-[#1a361d] text-[#76ff8a] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-[#1a361d] text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-slate-400 text-xs italic pl-8">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                <span>Advisor is typing...</span>
              </div>
            )}

            {/* Quick Lead Capture Box */}
            {showLeadForm && !leadSubmitted && (
              <form onSubmit={handleLeadSubmit} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 mt-2">
                <div className="font-bold text-[#1a361d] text-xs flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#2d5c36]" />
                  <span>Request Admissions Call Back</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#1a361d]"
                />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#1a361d]"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone Number (with country code)"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#1a361d]"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#1a361d] hover:bg-[#2d5c36] text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Confirm Counseling Request
                </button>
              </form>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pill)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-[#d8ffd2] text-slate-700 hover:text-[#1a361d] text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about admissions, courses, or jobs..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1a361d]"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2.5 rounded-xl bg-[#1a361d] hover:bg-[#2d5c36] text-white disabled:opacity-40 transition-all cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
