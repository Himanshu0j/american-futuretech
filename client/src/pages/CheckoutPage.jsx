import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Shield, Lock, CheckCircle2, ArrowRight, CreditCard, Tag, AlertCircle,
  Award, Loader2, XCircle, Mail, PhoneCall,
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';
import CompanyMarquee from '../components/CompanyMarquee';
import Footer from '../components/Footer';
import { useSiteSettings } from '../context/SiteSettingsContext';

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 24; // ~60 seconds — long enough for a slow webhook or 3-D Secure step

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const { settings } = useSiteSettings();

  const initialCourseId = searchParams.get('courseId');
  const programParam = (searchParams.get('program') || searchParams.get('mode') || '').toLowerCase();
  const initialTier = searchParams.get('tier') || (programParam === 'personalized' ? 'personalized' : 'deposit');
  const returnStatus = searchParams.get('status');
  const returnSessionId = searchParams.get('session_id');

  // Personalized 1-on-1 track pricing (admin editable via Settings → Personalized)
  const personalizedPrice = settings?.personalizedLearning?.price || 5499;
  const personalizedOriginal = settings?.personalizedLearning?.originalPrice || 6999;
  const personalizedDuration = settings?.personalizedLearning?.duration || 'Custom / 3 to 6 Months';
  const depositPrice = settings?.depositPriceUSD || 99;

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || '');
  const [tier, setTier] = useState(initialTier);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  // Fail closed: until the server confirms a gateway is live, this page must never
  // claim it is about to charge a card. `/api/settings` already carries the real
  // status, so the correct value is normally known on the very first paint.
  const [gatewayConfigured, setGatewayConfigured] = useState(() => settings?.payments?.configured === true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 'form' | 'verifying' | 'paid' | 'failed' | 'cancelled' | 'manual'
  const [phase, setPhase] = useState('form');
  const [receipt, setReceipt] = useState(null);
  const [failureMessage, setFailureMessage] = useState('');
  const [manualInfo, setManualInfo] = useState(null);

  useEffect(() => {
    fetchCourses();
    window.scrollTo(0, 0);
  }, []);

  // Keep every Stripe claim below tied to the admin's actual gateway toggle. The
  // quote endpoint corrects this again, but this covers a settings response that
  // lands after the first paint (e.g. a cold cache).
  useEffect(() => {
    if (typeof settings?.payments?.configured === 'boolean') {
      setGatewayConfigured(settings.payments.configured);
    }
  }, [settings]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      const list = res.data.courses || [];
      setCourses(list);
      if (!selectedCourseId && list.length > 0) {
        setSelectedCourseId(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    }
  };

  const selectedCourse = courses.find((c) => c._id === selectedCourseId) || courses[0];

  /**
   * The server owns the price. The browser only renders what POST
   * /api/payments/quote returns, so a voucher can never change the real charge.
   */
  const fetchQuote = useCallback(async ({ courseId, nextTier, coupon, buyerEmail }) => {
    if (!courseId) return null;
    setQuoteLoading(true);
    try {
      const res = await axios.post('/api/payments/quote', {
        courseId,
        tier: nextTier,
        couponCode: coupon || undefined,
        // The server counts per-student redemptions by email, so a coupon can
        // never be reused by the same buyer across sessions.
        email: buyerEmail || undefined,
      });
      if (res.data?.payments) setGatewayConfigured(Boolean(res.data.payments.configured));
      setQuote(res.data.quote);
      return res.data.quote;
    } catch (err) {
      console.error('Quote failed', err);
      return null;
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourseId) fetchQuote({ courseId: selectedCourseId, nextTier: tier, coupon: '' });
  }, [selectedCourseId, tier, fetchQuote]);

  const handleApplyCoupon = async () => {
    setCouponError('');
    const code = couponCode.trim();
    if (!code) {
      setAppliedCoupon('');
      setQuote(null);
      fetchQuote({ courseId: selectedCourseId, nextTier: tier, coupon: '' });
      return;
    }

    const result = await fetchQuote({ courseId: selectedCourseId, nextTier: tier, coupon: code, buyerEmail: email });
    if (result?.couponApplied) {
      setAppliedCoupon(result.couponCode);
    } else {
      setAppliedCoupon('');
      // Show the exact server reason (expired / not started / usage limit /
      // wrong program / minimum order) instead of one vague message.
      setCouponError(result?.couponError || 'That promotional code is not valid.');
      fetchQuote({ courseId: selectedCourseId, nextTier: tier, coupon: '' });
    }
  };

  const resetCoupon = () => {
    setAppliedCoupon('');
    setCouponError('');
    setCouponCode('');
  };

  // ── Return leg from Stripe ────────────────────────────────────────────────
  const pollPaymentStatus = useCallback(async (sessionId) => {
    for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
      try {
        const res = await axios.get(`/api/payments/checkout-status/${sessionId}`);
        const status = res.data?.status;
        if (res.data?.paid) {
          setReceipt(res.data.payment);
          setPhase('paid');
          confetti({ particleCount: 130, spread: 85, origin: { y: 0.6 } });
          return;
        }
        if (status === 'Failed' || status === 'Expired') {
          setFailureMessage(
            'Your bank did not complete the payment. Nothing was charged — you can try again or request a payment link.',
          );
          setPhase('failed');
          return;
        }
      } catch (err) {
        console.error('Status check failed', err);
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    setFailureMessage(
      'We have received your payment but confirmation is taking longer than usual. Please refresh this page in a minute — you will also get an email receipt as soon as it settles.',
    );
    setPhase('failed');
  }, []);

  useEffect(() => {
    if (returnStatus === 'success' && returnSessionId) {
      setPhase('verifying');
      window.scrollTo(0, 0);
      pollPaymentStatus(returnSessionId);
    } else if (returnStatus === 'cancelled') {
      setPhase('cancelled');
      window.scrollTo(0, 0);
    }
  }, [returnStatus, returnSessionId, pollPaymentStatus]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const requestManualPaymentLink = async (amount) => {
    await axios.post('/api/leads/apply', {
      fullName,
      email,
      phone,
      targetCourse: selectedCourseId || undefined,
      preferredBatch: 'Checkout — secure payment link requested',
      marketingSource: 'Checkout (card gateway pending activation)',
      notes: `Tier: ${tier}. Quoted amount: $${amount} USD. Student requested a secure payment link.`,
    });
    setManualInfo({
      name: fullName,
      email,
      amount,
      courseTitle: selectedCourse?.title || quote?.courseTitle,
    });
    setPhase('manual');
    window.scrollTo(0, 0);
  };

  const handleSubmitCheckout = async (e) => {
    e.preventDefault();
    setFailureMessage('');

    if (!fullName || !email || !phone) {
      alert('Please fill out all required personal contact details.');
      return;
    }

    const amount = quote?.amount ?? 0;

    try {
      setIsSubmitting(true);
      const res = await axios.post('/api/payments/checkout', {
        courseId: selectedCourse?._id || selectedCourseId,
        tier,
        fullName,
        email,
        phone,
        couponCode: appliedCoupon || undefined,
      });

      if (res.data?.sessionUrl) {
        // Hand the customer to Stripe's PCI-compliant hosted page.
        window.location.assign(res.data.sessionUrl);
        return;
      }
      throw new Error('Payment gateway did not return a checkout page.');
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'PAYMENTS_NOT_CONFIGURED') {
        try {
          await requestManualPaymentLink(amount || depositPrice);
        } catch (leadError) {
          alert('We could not submit your request. Please contact admissions directly.');
        }
      } else {
        alert(data?.message || 'Payment could not be started. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Amounts for display ───────────────────────────────────────────────────
  const baseAmount = quote?.originalPrice ?? (
    tier === 'deposit' ? depositPrice : tier === 'personalized' ? personalizedPrice : (selectedCourse?.pricing?.discountedPrice || 1899)
  );
  const discountAmount = quote?.discountAmount ?? 0;
  const finalAmount = quote?.amount ?? baseAmount;

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased selection:bg-[#E5C275] selection:text-[#0B1220] relative">
      <Navbar />

      <main className="pt-28 sm:pt-32 pb-14 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <CompanyMarquee />

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold mb-3 ${
              gatewayConfigured
                ? 'bg-[#EFE6D6] border-[#E5C275]/40 text-[#0B1220]'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <Lock className={`w-3.5 h-3.5 ${gatewayConfigured ? 'text-[#4338CA]' : 'text-amber-700'}`} />
            <span>
              {gatewayConfigured
                ? 'Payments secured by Stripe · PCI-DSS Level 1'
                : 'Secure request · No card charged on this page'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-[#0B1220] mb-3">
            Secure Enrollment & <span className="highlight">Seat Reservation</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Reserve your place in the upcoming engineering cohort. Choose between the flexible ${depositPrice} seat
            deposit or complete tuition — your seat is confirmed the moment your payment reaches us.
          </p>
        </div>

        {/* ── Verifying (returned from Stripe before the webhook settled) ── */}
        {phase === 'verifying' && (
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-xl">
            <Loader2 className="w-10 h-10 text-[#4338CA] animate-spin mx-auto mb-5" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1220] mb-2">
              Verifying your payment with Stripe…
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Please keep this tab open. We are confirming the transaction and activating your enrollment — this
              normally takes only a few seconds.
            </p>
          </div>
        )}

        {/* ── Payment confirmed ── */}
        {phase === 'paid' && receipt && (
          <div className="max-w-2xl mx-auto p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 text-center shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-[#EFE6D6] text-[#0B1220] flex items-center justify-center mx-auto mb-6 border border-[#E5C275]">
              <CheckCircle2 className="w-9 h-9 text-[#4338CA]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1220] mb-2">
              {receipt.tier === 'deposit' ? 'Cohort Seat Reserved Successfully' : 'Tuition & Enrollment Confirmed'}
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Welcome, <strong className="text-slate-900">{receipt.studentName}</strong>. Your registration for{' '}
              <strong className="text-[#4338CA]">{receipt.courseTitle}</strong> is active.
            </p>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 mb-6 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Official Invoice:</span>
                <span className="font-bold text-[#0B1220]">{receipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transaction Ref:</span>
                <span className="text-slate-800 break-all">{receipt.transactionId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Settled:</span>
                <span className="font-bold text-[#4338CA]">${receipt.amount} {receipt.currency}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-emerald-200 text-left mb-7">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-700 leading-relaxed">
                  Your tax invoice and student portal login credentials have been emailed to{' '}
                  <strong className="text-slate-900">{receipt.email}</strong>. For your security the temporary
                  password is never shown on screen — please check your inbox (and spam folder) and change the
                  password after your first login.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/student/login"
                className="py-3 px-6 rounded-full bg-[#0B1220] hover:bg-[#4338CA] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                Access Student LMS Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="py-3 px-6 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors"
              >
                Back to Overview
              </Link>
            </div>
          </div>
        )}

        {/* ── Payment failed / still settling ── */}
        {phase === 'failed' && (
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-xl">
            <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-5" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1220] mb-2">
              Payment not completed
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">{failureMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => { setPhase('form'); setReceipt(null); }}
                className="py-3 px-6 rounded-full bg-[#0B1220] hover:bg-[#4338CA] text-white font-bold text-sm transition-all"
              >
                Try payment again
              </button>
              <Link
                to="/contact"
                className="py-3 px-6 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                Talk to admissions
              </Link>
            </div>
          </div>
        )}

        {/* ── Cancelled at Stripe ── */}
        {phase === 'cancelled' && (
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-xl">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-5" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1220] mb-2">
              Checkout cancelled — nothing was charged
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Your seat has not been reserved yet. You can pick up exactly where you left off whenever you are ready.
            </p>
            <button
              type="button"
              onClick={() => setPhase('form')}
              className="py-3 px-6 rounded-full bg-[#0B1220] hover:bg-[#4338CA] text-white font-bold text-sm transition-all"
            >
              Return to enrollment form
            </button>
          </div>
        )}

        {/* ── Manual enquiry (gateway not activated yet) ── */}
        {phase === 'manual' && manualInfo && (
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#EFE6D6] flex items-center justify-center mx-auto mb-5 border border-[#E5C275]">
              <PhoneCall className="w-6 h-6 text-[#4338CA]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1220] mb-2">
              Request received — no card was charged
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Thanks, <strong className="text-slate-900">{manualInfo.name}</strong>. Our admissions team will email a
              secure payment link for <strong className="text-[#4338CA]">{manualInfo.courseTitle}</strong> (${manualInfo.amount}{' '}
              USD) to <strong className="text-slate-900">{manualInfo.email}</strong> within 24 hours.
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Your seat is only reserved once that payment is completed, so please complete it at the earliest to
              secure the current cohort pricing.
            </p>
            <Link
              to="/courses"
              className="inline-flex py-3 px-6 rounded-full bg-[#0B1220] hover:bg-[#4338CA] text-white font-bold text-sm transition-all"
            >
              Explore other programs
            </Link>
          </div>
        )}

        {/* ── Checkout form ── */}
        {phase === 'form' && (
          <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Details */}
            <div className="lg:col-span-7 space-y-4 text-left">
              {/* 1. Program Selection */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-[#EFE6D6] text-[#0B1220] text-xs font-display font-bold flex items-center justify-center">
                    01
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#0B1220] uppercase tracking-wider">
                    Select Tech Specialization
                  </h3>
                </div>
                <select
                  value={selectedCourseId}
                  onChange={(e) => { setSelectedCourseId(e.target.value); resetCoupon(); }}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all cursor-pointer"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} ({c.duration} — ${c.pricing?.discountedPrice || 1899} USD)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Enrollment Tier Selection */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-[#EFE6D6] text-[#0B1220] text-xs font-display font-bold flex items-center justify-center">
                    02
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#0B1220] uppercase tracking-wider">
                    Choose Tuition Schedule
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Deposit Option */}
                  <div
                    onClick={() => { setTier('deposit'); resetCoupon(); }}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      tier === 'deposit'
                        ? 'bg-[#F5F7FF] border-[#0B1220] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#0B1220] uppercase tracking-wider">Seat Reservation</span>
                      <span className="text-2xl font-display font-black text-[#0B1220]">${depositPrice}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Lock your seat in the next live cohort now. Remainder is settled before live sessions commence.
                    </p>
                  </div>

                  {/* Career Program (register now) Option */}
                  <div
                    onClick={() => { setTier('full'); resetCoupon(); }}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      tier === 'full'
                        ? 'bg-[#F5F7FF] border-[#0B1220] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#4338CA] uppercase tracking-wider">
                        Register Now — Career Program
                      </span>
                      <span className="text-2xl font-display font-black text-[#0B1220]">
                        ${selectedCourse?.pricing?.discountedPrice || 499}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Group batch, per person. Complete payment unlocks instant access to labs, the course repository and your cohort advisor.
                    </p>
                  </div>

                  {/* Personalized 1-on-1 Option */}
                  <div
                    onClick={() => { setTier('personalized'); resetCoupon(); }}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                      tier === 'personalized'
                        ? 'bg-[#fffdf7] border-amber-500 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                    }`}
                  >
                    <span className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                      Independent
                    </span>
                    <div className="flex justify-between items-start mb-2 pr-14">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Personalized 1-on-1</span>
                      <span className="text-2xl font-display font-black text-[#0B1220]">
                        ${personalizedPrice.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      Weekly private mentorship, personalized interview preparation, and salary negotiation coaching.
                    </p>
                    <div className="text-[10px] font-mono text-slate-500">
                      Duration: {personalizedDuration} • <span className="line-through">${personalizedOriginal.toLocaleString()}</span> list price
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Personal Contact Information */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-7 h-7 rounded-lg bg-[#EFE6D6] text-[#0B1220] text-xs font-display font-bold flex items-center justify-center">
                    03
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#0B1220] uppercase tracking-wider">
                    Student Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="alex.morgan@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number (with Country Code) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* 4. Payment Method — hosted Stripe checkout */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#EFE6D6] text-[#0B1220] text-xs font-display font-bold flex items-center justify-center">
                    04
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#0B1220] uppercase tracking-wider">
                    Payment Method
                  </h3>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-[#0B1220] bg-slate-50">
                  <CreditCard className="w-5 h-5 text-[#4338CA] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-[#0B1220]">
                      {gatewayConfigured ? 'Card · Apple Pay · Google Pay' : 'Secure Stripe payment link'}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      {gatewayConfigured
                        ? "You will be redirected to Stripe's secure hosted page to complete the payment. Your card details are entered on Stripe and are never seen or stored by American FutureTech."
                        : 'We email you an encrypted Stripe payment link to complete the payment. Your card details are entered on Stripe and are never seen or stored by American FutureTech.'}
                    </p>
                  </div>
                </div>
                {!gatewayConfigured && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Card payments are being activated right now. Submit this form and our admissions team will email
                      you a secure payment link within 24 hours — you will not be charged anything here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 text-left">
              <div className="p-6 sm:p-5 rounded-2xl bg-white border-2 border-[#0B1220]/15 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h3 className="text-base font-display font-bold text-[#0B1220]">Summary of Enrollment</h3>
                  <span className="text-[11px] font-bold text-[#0B1220] bg-[#EFE6D6] px-2.5 py-0.5 rounded-full">
                    Live Cohort
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm font-bold text-[#0B1220]">{quote?.courseTitle || selectedCourse?.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{quote?.courseDuration || selectedCourse?.duration || '6 Months'}</span>
                    <span>•</span>
                    <span className="capitalize font-semibold text-[#4338CA]">{tier} Track</span>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Promotional Voucher</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. FUTURETECH10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs uppercase focus:outline-none focus:border-[#0B1220] font-mono placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={quoteLoading}
                      className="px-5 py-2.5 rounded-full border border-[#0B1220] hover:bg-slate-100 text-[#0B1220] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="text-xs text-[#4338CA] font-semibold mt-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Promo '{appliedCoupon}' applied (-${discountAmount} USD)
                    </div>
                  )}
                  {couponError && (
                    <div className="text-xs text-rose-600 mt-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {couponError}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{quote?.label || 'Tuition Subtotal'}</span>
                    <span className="font-semibold text-slate-900">${baseAmount} USD</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#4338CA] font-semibold">
                      <span>Voucher Discount</span>
                      <span>-${discountAmount} USD</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Due Now</span>
                    <span className="text-3xl font-display font-black text-[#0B1220]">
                      ${finalAmount} <span className="text-xs font-sans text-slate-500 font-normal">USD</span>
                    </span>
                  </div>
                  {quoteLoading && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Confirming current price…
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || quoteLoading}
                  className="w-full py-3.5 px-4 rounded-full bg-[#0B1220] hover:bg-[#4338CA] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {gatewayConfigured ? 'Opening secure payment page…' : 'Submitting your request…'}
                    </>
                  ) : (
                    <>
                      {gatewayConfigured ? 'Continue to Secure Payment' : 'Request Secure Payment Link'} — ${finalAmount} USD
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 space-y-2 text-[11px] text-slate-500 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      {gatewayConfigured
                        ? 'Payment is processed by Stripe with 256-bit TLS and 3-D Secure. Your enrollment is confirmed automatically once the payment is verified.'
                        : 'No card details are collected on this page. Your seat is confirmed once the emailed Stripe payment has been completed.'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                    <span>Backed by 14-day 100% money-back academic guarantee. No questions asked.</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
