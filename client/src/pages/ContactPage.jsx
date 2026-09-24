import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import CompanyMarquee from '../components/CompanyMarquee';
import Footer from '../components/Footer';
import CyberParticles from '../components/CyberParticles';
import useCompanyInfo from '../hooks/useCompanyInfo';

export default function ContactPage() {
  const company = useCompanyInfo();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredBatch, setPreferredBatch] = useState('Weekend Live (2 Hours)');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await axios.post('/api/leads/apply', {
        fullName,
        email,
        phone,
        preferredBatch,
        marketingSource: 'Contact Page Inquiry Form',
        notes: message,
      });
      setIsSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit inquiry. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased selection:bg-[#E5C275] selection:text-[#0B1220] relative">
      <Navbar />

      <main className="pt-28 pb-10">

        <CompanyMarquee />        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center pt-8 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6D6] border border-[#E5C275]/40 text-[#0B1220] text-xs font-semibold mb-4">
            <Mail className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>ACADEMIC & ADMISSIONS ADVISORY</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#0B1220] mb-4">
            Connect with <span className="highlight">Admissions</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Have questions regarding cohort schedules, tuition financing, curriculum prerequisites, or career mentorship? Our admissions counselors are ready to assist.
          </p>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Office & Contact Cards */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-5 space-y-4 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  INSTITUTIONAL HEADQUARTERS
                </span>

                <div className="flex items-start gap-3.5 text-xs text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] text-[#0B1220] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#4338CA]" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-[#0B1220] text-sm">United States Office</div>
                    <div className="text-slate-700 mt-0.5">{company.address}</div>
                    <div className="text-slate-500">Registered in Wyoming, United States</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 text-xs text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] text-[#0B1220] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[#4338CA]" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-[#0B1220] text-sm">Admissions Hotline</div>
                    <a href={company.phoneHref} className="text-[#4338CA] hover:underline mt-0.5 block font-mono font-semibold">
                      {company.phone}
                    </a>
                    <div className="text-slate-500">Mon - Sat 9:00 AM - 6:00 PM EST</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 text-xs text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] text-[#0B1220] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#4338CA]" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-[#0B1220] text-sm">Email Inquiries</div>
                    <a href={company.emailHref} className="text-[#4338CA] hover:underline mt-0.5 block font-semibold break-all">
                      {company.email}
                    </a>
                    <div className="text-slate-500">Target response time: &lt; 2 hours</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 text-xs text-slate-600">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-[#0B1220] text-sm">Advisory Hours</div>
                    <div className="text-slate-700 mt-0.5">Mon – Fri: 8:00 AM – 8:00 PM EST</div>
                    <div className="text-slate-500">Saturday: 10:00 AM – 4:00 PM EST</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Inquiry Form */}
            <div className="lg:col-span-7 text-left">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-6 shadow-xs">
                {isSuccess ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-[#EFE6D6] text-[#0B1220] flex items-center justify-center mx-auto mb-4 border border-[#E5C275]">
                      <CheckCircle2 className="w-8 h-8 text-[#4338CA]" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-[#0B1220] mb-2">Inquiry Submitted</h3>
                    <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-6">
                      Thank you, <strong>{fullName}</strong>. Your inquiry has been routed to our admissions team. An advisor will contact you shortly via email and phone.
                    </p>
                    <button
                      onClick={() => { setIsSuccess(false); setFullName(''); setEmail(''); setPhone(''); setMessage(''); }}
                      className="py-2.5 px-6 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <h3 className="text-lg font-display font-bold text-[#0B1220] mb-1">Request Admissions Consultation</h3>
                      <p className="text-xs text-slate-500 mb-5">Fill in your information below to schedule a discussion with our technical admissions advisors.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jordan Miller"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="jordan@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+1 (555) 019-2831"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Batch Format</label>
                      <select
                        aria-label="Preferred batch format"
                        value={preferredBatch}
                        onChange={(e) => setPreferredBatch(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all"
                      >
                        <option value="Weekend Live (2 Hours)">Weekend Live (Sat & Sun: 10:00 AM - 12:00 PM EST)</option>
                        <option value="Weekday Evening (1.5 Hours)">Weekday Evening (Tue & Thu: 7:00 PM - 8:30 PM EST)</option>
                        <option value="Self-Paced with Mentor Sync">Self-Paced with 1-on-1 Weekly Mentor Sync</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Questions or Goals</label>
                      <textarea
                        rows={3}
                        placeholder="Tell us about your background and target career objectives..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Submitting Inquiry...' : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Admissions Inquiry &rarr;</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
