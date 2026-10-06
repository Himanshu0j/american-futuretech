import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Shield, Lock, CheckCircle2, ArrowRight, CreditCard, Tag, AlertCircle,
  Award, Loader2, XCircle, Mail, PhoneCall,
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';
import TrustMarquee from '../components/TrustMarquee';
import Footer from '../components/Footer';
import { useSiteSettings } from '../context/SiteSettingsContext';

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 24; // ~60 seconds — long enough for a slow webhook or 3-D Secure step

/**
 * The reservation amounts the client wants on the checkout page: the two seat
 * deposits ($99 / $499) plus the two "pay it all now" amounts — the Career
 * Program tuition ($2,499) and the Personalized 1-on-1 track ($4,499).
 * server/utils/pricing.js keeps the same allowlist, so an edited request can
 * never invent a fifth amount.
 */
const RESERVE_OPTIONS = [99, 499, 2499, 4499];

/**
 * The two seat amounts painted as buttons inside the "Seat Reservation" block.
 * $2,499 and $4,499 stay in RESERVE_OPTIONS (the server allowlist and the
 * ?deposit= deep links still use the full list) but are no longer repeated here
 * — the client asked for those two to appear only as their own Group Batch /
 * Personalized Mentorship cards just below.
 */
const SEAT_DEPOSIT_OPTIONS = [99, 499];

/** Billing fields start empty; the country defaults to the US as on the form. */
const EMPTY_BILLING = {
  firstName: '',
  lastName: '',
  company: '',
  country: 'United States (US)',
  street: '',
  apartment: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  email: '',
};

const BILLING_COUNTRIES = [
  'United States (US)',
  'Canada (CA)',
  'United Kingdom (UK)',
  'India (IN)',
  'United Arab Emirates (AE)',
  'Australia (AU)',
  'Germany (DE)',
  'Singapore (SG)',
  'Other',
];

// Shared styling so every billing field matches the three contact fields above.
const FIELD_CLASS =
  'w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#002060] focus:ring-1 focus:ring-[#002060] transition-all placeholder:text-slate-400';
const LABEL_CLASS = 'block text-xs font-semibold text-slate-700 mb-1.5';

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
  const depositPrice = settings?.depositPriceUSD || 99;

  /**
   * Wording for the three tuition-schedule blocks and the payment-method note.
   *
   * Every field is admin-editable (Settings → "Checkout & Tuition") and every
   * description defaults to EMPTY, which is how the client's request — "remove
   * the small text from these blocks, keep the rest" — is implemented: blank
   * renders nothing, and typing a sentence in the admin brings one back without
   * a code change.
   */
  const checkoutCopy = settings?.checkout || {};
  // Seat reservation offers the four amounts in RESERVE_OPTIONS. Settings picks
  // which deposit is selected by default; a link may ask for another with
  // ?deposit=99|499|2499|4499.
  const requestedDeposit = Number(searchParams.get('deposit'));
  const initialDeposit = RESERVE_OPTIONS.includes(requestedDeposit)
    ? requestedDeposit
    : (RESERVE_OPTIONS.includes(Number(depositPrice)) ? Number(depositPrice) : 99);

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || '');
  const [tier, setTier] = useState(initialTier);
  const [depositAmount, setDepositAmount] = useState(initialDeposit);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billing, setBilling] = useState(EMPTY_BILLING);
  const [orderNotes, setOrderNotes] = useState('');
  const setBillingField = (field) => (e) => setBilling((prev) => ({ ...prev, [field]: e.target.value }));
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

  // Instalment methods (Klarna, Afterpay) this amount qualifies for, straight from
  // the quote endpoint — the server owns the amount windows, so the badges can
  // never promise a method that Stripe would silently hide at this price.
  const [installments, setInstallments] = useState([]);

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

  // One-line address summary attached to the lead when a customer asks for a
  // secure payment link, so admissions knows where the invoice should go.
  const billingSummary = [
    `${billing.firstName} ${billing.lastName}`.trim(),
    billing.company,
    [billing.street, billing.apartment].filter(Boolean).join(', '),
    [billing.city, billing.state, billing.zip].filter(Boolean).join(' '),
    billing.country,
    billing.phone,
    billing.email,
  ].filter(Boolean).join(' | ');

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
  const fetchQuote = useCallback(async ({ courseId, nextTier, coupon, buyerEmail, reserve }) => {
    if (!courseId) return null;
    setQuoteLoading(true);
    try {
      const res = await axios.post('/api/payments/quote', {
        courseId,
        tier: nextTier,
        // Only meaningful for tier=deposit; the server validates it against its
        // own allowlist, so this is a request and never a price.
        depositAmount: nextTier === 'deposit' ? (reserve ?? depositAmount) : undefined,
        couponCode: coupon || undefined,
        // The server counts per-student redemptions by email, so a coupon can
        // never be reused by the same buyer across sessions.
        email: buyerEmail || undefined,
      });
      if (res.data?.payments) setGatewayConfigured(Boolean(res.data.payments.configured));
      setInstallments(
        res.data?.installments?.available ? (res.data.installments.methods || []) : [],
      );
      setQuote(res.data.quote);
      return res.data.quote;
    } catch (err) {
      console.error('Quote failed', err);
      return null;
    } finally {
      setQuoteLoading(false);
    }
  }, [depositAmount]);

  useEffect(() => {
    if (selectedCourseId) fetchQuote({ courseId: selectedCourseId, nextTier: tier, coupon: '' });
  }, [selectedCourseId, tier, depositAmount, fetchQuote]);

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
    // Klarna/Afterpay approve the plan first and settle the money a little later,
    // so the order can legitimately still be Pending when the student lands back
    // here. Remember that and say so, instead of the generic "taking longer" line.
    let instalmentSettling = false;
    for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
      try {
        const res = await axios.get(`/api/payments/checkout-status/${sessionId}`);
        const status = res.data?.status;
        if (res.data?.settlementPending) {
          instalmentSettling = true;
        }
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
      instalmentSettling
        ? 'Your instalment plan is approved and the payment is being confirmed by the provider — that can take a few minutes. Refresh this page shortly; your seat is reserved and the receipt is emailed the moment it settles.'
        : 'We have received your payment but confirmation is taking longer than usual. Please refresh this page in a minute — you will also get an email receipt as soon as it settles.',
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
      notes: `Tier: ${tier}. Quoted amount: $${amount} USD. Student requested a secure payment link. Billing: ${billingSummary}.${orderNotes ? ` Order notes: ${orderNotes}` : ''}`,
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

    if (!billing.firstName || !billing.lastName || !billing.street || !billing.city || !billing.state || !billing.zip || !billing.phone || !billing.email) {
      alert('Please complete the billing details (name, address, phone and email).');
      return;
    }

    // A quote for a tier the customer has since moved away from must never
    // decide the amount admissions is asked to invoice.
    const amount = (quote?.tier === tier && quote?.amount) || 0;

    try {
      setIsSubmitting(true);
      const res = await axios.post('/api/payments/checkout', {
        courseId: selectedCourse?._id || selectedCourseId,
        tier,
        depositAmount: tier === 'deposit' ? depositAmount : undefined,
        fullName,
        email,
        phone,
        couponCode: appliedCoupon || undefined,
        // Sent for the record; the server prices the order on its own and
        // Stripe collects the cardholder's own billing address at payment time.
        billingDetails: billing,
        orderNotes: orderNotes || undefined,
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
          await requestManualPaymentLink(amount || (tier === 'deposit' ? depositAmount : depositPrice));
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
  /**
   * Only a quote that belongs to the tier on screen may set these figures.
   *
   * `quote` arrives from an async request, so for a moment after a tier switch it
   * still describes the previous one. The name below updates the instant the
   * customer picks an option, and a name that disagrees with its own number is
   * exactly the confusion this section exists to avoid — so the previous tier's
   * figures are dropped in favour of this selection's own (the same amounts its
   * fee card shows) until the server answers for this tier.
   */
  const quoteForTier = quote?.tier === tier ? quote : null;
  const baseAmount = quoteForTier?.originalPrice ?? (
    tier === 'deposit' ? depositAmount : tier === 'personalized' ? personalizedPrice : (selectedCourse?.pricing?.discountedPrice || 1899)
  );
  const discountAmount = quoteForTier?.discountAmount ?? 0;
  const finalAmount = quoteForTier?.amount ?? baseAmount;

  /**
   * What the breakdown row calls the charge.
   *
   * `quote` arrives from an async request, so for a moment after a tier switch it
   * still describes the previous tier — and if that request fails it stays there.
   * The server's own wording is therefore only used while it belongs to the tier
   * on screen; otherwise the name is derived from the selection, so this row can
   * never read "Personalized …" next to a $99 seat deposit.
   */
  const tierName =
    tier === 'deposit'
      ? `Cohort Seat Reservation Deposit ($${Number(depositAmount).toLocaleString('en-US')})`
      : tier === 'personalized'
        ? 'Personalized 1-on-1 Mentorship Track'
        : 'Full Program Tuition';
  const breakdownLabel = (quote?.tier === tier && quote?.label) || tierName;

  /**
   * The gap between the list price and what is actually due, minus any coupon
   * already shown on its own line. Without this the breakdown jumps from a
   * higher sub-total straight to a smaller "Total Due Now" and the difference
   * reads like a mistake — e.g. $2,999 then $2,499 with nothing in between.
   */
  const builtInSaving = Math.max(
    0,
    Number(baseAmount || 0) - Number(finalAmount || 0) - Number(discountAmount || 0),
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-800 font-sans antialiased selection:bg-[#F00000] selection:text-[#002060] relative">
      <Navbar />

      <main className="pt-28 sm:pt-32 pb-14 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <TrustMarquee />

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold mb-3 ${
              gatewayConfigured
                ? 'bg-[#FCE7E7] border-[#F00000]/40 text-[#002060]'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <Lock className={`w-3.5 h-3.5 ${gatewayConfigured ? 'text-[#1D4ED8]' : 'text-red-700'}`} />
            <span>
              {gatewayConfigured
                ? 'Payments secured by Stripe · PCI-DSS Level 1'
                : 'Secure request · No card charged on this page'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-[#002060] mb-3">
            Secure Enrollment & <span className="highlight">Seat Reservation</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Reserve your place in the upcoming engineering cohort with a ${RESERVE_OPTIONS[0]} or ${RESERVE_OPTIONS[1]} seat
            deposit, or settle the Career Program (${RESERVE_OPTIONS[2].toLocaleString()}) or the Personalized 1-on-1
            track (${RESERVE_OPTIONS[3].toLocaleString()}) in full — your seat is confirmed the moment your payment
            reaches us.
          </p>
        </div>

        {/* ── Verifying (returned from Stripe before the webhook settled) ── */}
        {phase === 'verifying' && (
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-xl">
            <Loader2 className="w-10 h-10 text-[#1D4ED8] animate-spin mx-auto mb-5" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#002060] mb-2">
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
            <div className="w-12 h-12 rounded-full bg-[#FCE7E7] text-[#002060] flex items-center justify-center mx-auto mb-6 border border-[#F00000]">
              <CheckCircle2 className="w-9 h-9 text-[#1D4ED8]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#002060] mb-2">
              {receipt.tier === 'deposit' ? 'Cohort Seat Reserved Successfully' : 'Tuition & Enrollment Confirmed'}
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Welcome, <strong className="text-slate-900">{receipt.studentName}</strong>. Your registration for{' '}
              <strong className="text-[#1D4ED8]">{receipt.courseTitle}</strong> is active.
            </p>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 mb-6 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Official Invoice:</span>
                <span className="font-bold text-[#002060]">{receipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transaction Ref:</span>
                <span className="text-slate-800 break-all">{receipt.transactionId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Settled:</span>
                <span className="font-bold text-[#1D4ED8]">${receipt.amount} {receipt.currency}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F2F6FF] border border-blue-200 text-left mb-7">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
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
                className="py-3 px-6 rounded-full bg-[#002060] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
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
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-5" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#002060] mb-2">
              Payment not completed
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">{failureMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => { setPhase('form'); setReceipt(null); }}
                className="py-3 px-6 rounded-full bg-[#002060] hover:bg-[#1D4ED8] text-white font-bold text-sm transition-all"
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
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-5" />
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#002060] mb-2">
              Checkout cancelled — nothing was charged
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Your seat has not been reserved yet. You can pick up exactly where you left off whenever you are ready.
            </p>
            <button
              type="button"
              onClick={() => setPhase('form')}
              className="py-3 px-6 rounded-full bg-[#002060] hover:bg-[#1D4ED8] text-white font-bold text-sm transition-all"
            >
              Return to enrollment form
            </button>
          </div>
        )}

        {/* ── Manual enquiry (gateway not activated yet) ── */}
        {phase === 'manual' && manualInfo && (
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#FCE7E7] flex items-center justify-center mx-auto mb-5 border border-[#F00000]">
              <PhoneCall className="w-6 h-6 text-[#1D4ED8]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#002060] mb-2">
              Request received — no card was charged
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Thanks, <strong className="text-slate-900">{manualInfo.name}</strong>. Our admissions team will email a
              secure payment link for <strong className="text-[#1D4ED8]">{manualInfo.courseTitle}</strong> (${manualInfo.amount}{' '}
              USD) to <strong className="text-slate-900">{manualInfo.email}</strong> within 24 hours.
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Your seat is only reserved once that payment is completed, so please complete it at the earliest to
              secure the current cohort pricing.
            </p>
            <Link
              to="/courses"
              className="inline-flex py-3 px-6 rounded-full bg-[#002060] hover:bg-[#1D4ED8] text-white font-bold text-sm transition-all"
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
                  <span className="w-7 h-7 rounded-lg bg-[#FCE7E7] text-[#002060] text-xs font-display font-bold flex items-center justify-center">
                    01
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#002060] uppercase tracking-wider">
                    Select Tech Specialization
                  </h3>
                </div>
                <select
                  aria-label="Select tech specialization"
                  value={selectedCourseId}
                  onChange={(e) => { setSelectedCourseId(e.target.value); resetCoupon(); }}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#002060] focus:ring-1 focus:ring-[#002060] transition-all cursor-pointer"
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
                  <span className="w-7 h-7 rounded-lg bg-[#FCE7E7] text-[#002060] text-xs font-display font-bold flex items-center justify-center">
                    02
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#002060] uppercase tracking-wider">
                    {checkoutCopy.scheduleHeading || 'Choose Enrollment'}
                  </h3>
                </div>
                {/* One fee per row, in the order the client asked for: the $99 seat
                    reservation first, then the career program, then the 1-on-1
                    track. Three side-by-side cards inside the two-column
                    checkout layout squeezed the third one until its price
                    ($4,499) was clipped. */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Deposit Option */}
                  <div
                    onClick={() => { setTier('deposit'); resetCoupon(); }}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      tier === 'deposit'
                        ? 'bg-[#F2F6FF] border-[#002060] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-[#002060] uppercase tracking-wider">{checkoutCopy.seatTitle || 'Seat Reservation'}</span>
                    </div>
                    {checkoutCopy.seatDescription && (
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {checkoutCopy.seatDescription}
                      </p>
                    )}
                    {/* The two seat deposits — tap to switch. $2,499 and $4,499
                        have their own cards below, so they are not repeated here. */}
                    <div className="flex flex-wrap items-center gap-2">
                      {SEAT_DEPOSIT_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTier('deposit');
                            setDepositAmount(option);
                            resetCoupon();
                          }}
                          aria-pressed={tier === 'deposit' && depositAmount === option}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            tier === 'deposit' && depositAmount === option
                              ? 'bg-[#002060] text-white border-[#002060]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          Register Now ${option.toLocaleString('en-US')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Career Program (register now) Option */}
                  <div
                    onClick={() => { setTier('full'); resetCoupon(); }}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      tier === 'full'
                        ? 'bg-[#F2F6FF] border-[#002060] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                        {checkoutCopy.careerTitle || 'Group Batch Enroll Now'}
                      </span>
                      <span className="text-2xl font-display font-black text-[#002060]">
                        ${selectedCourse?.pricing?.discountedPrice || 499}
                      </span>
                    </div>
                    {checkoutCopy.careerDescription && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {checkoutCopy.careerDescription}
                      </p>
                    )}
                  </div>

                  {/* Personalized 1-on-1 Option */}
                  <div
                    onClick={() => { setTier('personalized'); resetCoupon(); }}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                      tier === 'personalized'
                        ? 'bg-[#fffdf7] border-red-500 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-red-300'
                    }`}
                  >
                    <span className="absolute top-0 right-0 bg-gradient-to-l from-red-500 to-red-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                      Independent
                    </span>
                    <div className="flex justify-between items-start mb-2 pr-14">
                      <span className="text-xs font-bold text-red-700 uppercase tracking-wider">{checkoutCopy.personalizedTitle || 'Personalized Mentorship'}</span>
                      <span className="text-2xl font-display font-black text-[#002060]">
                        ${personalizedPrice.toLocaleString()}
                      </span>
                    </div>
                    {checkoutCopy.personalizedDescription && (
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">
                        {checkoutCopy.personalizedDescription}
                      </p>
                    )}
                    {checkoutCopy.personalizedMeta && (
                      <div className="text-[10px] font-mono text-slate-500">
                        {checkoutCopy.personalizedMeta}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Personal Contact Information */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-7 h-7 rounded-lg bg-[#FCE7E7] text-[#002060] text-xs font-display font-bold flex items-center justify-center">
                    03
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#002060] uppercase tracking-wider">
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
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#002060] focus:ring-1 focus:ring-[#002060] transition-all placeholder:text-slate-400"
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
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#002060] focus:ring-1 focus:ring-[#002060] transition-all placeholder:text-slate-400"
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
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#002060] focus:ring-1 focus:ring-[#002060] transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Billing details — the client asked for the full billing
                    address form from their reference screenshot, in the same
                    order: name → company → country → street → town → state/zip
                    → phone/email → order notes. */}
                <div className="pt-5 mt-2 border-t border-slate-200">
                  <h4 className="text-sm font-display font-bold text-[#002060]">Billing details</h4>
                  <p className="text-[11px] text-slate-500 mt-1 mb-4">Fields marked with * are required.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="billing-first-name" className={LABEL_CLASS}>First name *</label>
                      <input
                        id="billing-first-name"
                        type="text"
                        required
                        autoComplete="given-name"
                        value={billing.firstName}
                        onChange={setBillingField('firstName')}
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="billing-last-name" className={LABEL_CLASS}>Last name *</label>
                      <input
                        id="billing-last-name"
                        type="text"
                        required
                        autoComplete="family-name"
                        value={billing.lastName}
                        onChange={setBillingField('lastName')}
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="billing-company" className={LABEL_CLASS}>Company name (optional)</label>
                    <input
                      id="billing-company"
                      type="text"
                      autoComplete="organization"
                      value={billing.company}
                      onChange={setBillingField('company')}
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="billing-country" className={LABEL_CLASS}>Country / Region *</label>
                    <select
                      id="billing-country"
                      required
                      autoComplete="country-name"
                      value={billing.country}
                      onChange={setBillingField('country')}
                      className={`${FIELD_CLASS} cursor-pointer`}
                    >
                      {BILLING_COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4 space-y-3">
                    <div>
                      <label htmlFor="billing-street" className={LABEL_CLASS}>Street address *</label>
                      <input
                        id="billing-street"
                        type="text"
                        required
                        autoComplete="address-line1"
                        placeholder="House number and street name"
                        value={billing.street}
                        onChange={setBillingField('street')}
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="billing-apartment" className="sr-only">
                        Apartment, suite, unit, etc. (optional)
                      </label>
                      <input
                        id="billing-apartment"
                        type="text"
                        autoComplete="address-line2"
                        placeholder="Apartment, suite, unit, etc. (optional)"
                        value={billing.apartment}
                        onChange={setBillingField('apartment')}
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="billing-city" className={LABEL_CLASS}>Town / City *</label>
                    <input
                      id="billing-city"
                      type="text"
                      required
                      autoComplete="address-level2"
                      value={billing.city}
                      onChange={setBillingField('city')}
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="billing-state" className={LABEL_CLASS}>State *</label>
                      <input
                        id="billing-state"
                        type="text"
                        required
                        autoComplete="address-level1"
                        value={billing.state}
                        onChange={setBillingField('state')}
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="billing-zip" className={LABEL_CLASS}>ZIP Code *</label>
                      <input
                        id="billing-zip"
                        type="text"
                        required
                        autoComplete="postal-code"
                        value={billing.zip}
                        onChange={setBillingField('zip')}
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="billing-phone" className={LABEL_CLASS}>Phone *</label>
                      <input
                        id="billing-phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={billing.phone}
                        onChange={setBillingField('phone')}
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="billing-email" className={LABEL_CLASS}>Email address *</label>
                      <input
                        id="billing-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={billing.email}
                        onChange={setBillingField('email')}
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-200">
                    <h4 className="text-sm font-display font-bold text-[#002060] mb-1">Additional information</h4>
                    <label htmlFor="order-notes" className={LABEL_CLASS}>Order notes (optional)</label>
                    <textarea
                      id="order-notes"
                      rows={3}
                      placeholder="Notes about your order, e.g. special notes for delivery."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className={`${FIELD_CLASS} resize-y`}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Payment Method — hosted Stripe checkout */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#FCE7E7] text-[#002060] text-xs font-display font-bold flex items-center justify-center">
                    04
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#002060] uppercase tracking-wider">
                    Payment Method
                  </h3>
                </div>
                {/* The "Secure Stripe payment link" tile was crossed out by the
                    client. It is now behind the Settings → Checkout & Tuition
                    switch (off by default) so it can come back the moment they
                    want card copy on the page again. */}
                {checkoutCopy.showPaymentMethodNote && (
                  <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-[#002060] bg-slate-50">
                    <CreditCard className="w-5 h-5 text-[#1D4ED8] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-[#002060]">
                        {checkoutCopy.paymentMethodTitle
                          || (gatewayConfigured
                            ? ['Card · Apple Pay · Google Pay', ...installments.map((m) => m.label)].join(' · ')
                            : 'Secure Stripe payment link')}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        {checkoutCopy.paymentMethodBody
                          || (gatewayConfigured
                            ? "You will be redirected to Stripe's secure hosted page to complete the payment. Your card details are entered on Stripe and are never seen or stored by American FutureTech."
                            : 'We email you an encrypted Stripe payment link to complete the payment. Your card details are entered on Stripe and are never seen or stored by American FutureTech.')}
                      </p>
                    </div>
                  </div>
                )}
                {/* Instalments / pay-later (EMI). Students asked to split the fee,
                    and Klarna + Afterpay are enabled on the Stripe account, so the
                    options are advertised here — inside the amount window the
                    server verified for this exact tier. */}
                {installments.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#F2F6FF] border border-[#002060]/20 space-y-2">
                    <div className="text-xs font-bold text-[#002060] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#1D4ED8]" />
                      Pay in instalments (EMI)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {installments.map((method) => (
                        <span
                          key={method.id}
                          className="px-3 py-1.5 rounded-full bg-white border border-[#002060]/20 text-[11px] font-semibold text-[#002060]"
                        >
                          {method.label}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Choose {installments.map((m) => m.label).join(' or ')} on the Stripe payment page to split this
                      amount — {installments[0].blurb.toLowerCase()}. Approval is decided by the provider, not by
                      American FutureTech, and your seat is confirmed as soon as the payment settles.
                    </p>
                  </div>
                )}

                {/* The amber "card payments are being activated" box was removed
                    on the client's request (they crossed it out) and replaced
                    with this confirmation note. */}
                <div className="pt-3 border-t border-slate-200">
                  <h4 className="text-sm font-display font-bold text-[#002060] mb-1.5">
                    Secure Payment &amp; Confirmation
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Once your payment is successfully completed, the American FutureTech Team will send you a
                    confirmation email with your payment receipt and the next steps to get started.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 text-left">
              <div className="p-6 sm:p-5 rounded-2xl bg-white border-2 border-[#002060]/15 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h3 className="text-base font-display font-bold text-[#002060]">Summary of Enrollment</h3>
                  <span className="text-[11px] font-bold text-[#002060] bg-[#FCE7E7] px-2.5 py-0.5 rounded-full">
                    Live Cohort
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm font-bold text-[#002060]">{quote?.courseTitle || selectedCourse?.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{quote?.courseDuration || selectedCourse?.duration || '6 Months'}</span>
                    <span>•</span>
                    <span className="capitalize font-semibold text-[#1D4ED8]">{tier} Track</span>
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
                      className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs uppercase focus:outline-none focus:border-[#002060] font-mono placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={quoteLoading}
                      className="px-5 py-2.5 rounded-full border border-[#002060] hover:bg-slate-100 text-[#002060] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="text-xs text-[#1D4ED8] font-semibold mt-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Promo '{appliedCoupon}' applied (-${discountAmount} USD)
                    </div>
                  )}
                  {couponError && (
                    <div className="text-xs text-red-600 mt-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {couponError}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{breakdownLabel}</span>
                    <span className="font-semibold text-slate-900">${baseAmount} USD</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#1D4ED8] font-semibold">
                      <span>Voucher Discount</span>
                      <span>-${discountAmount} USD</span>
                    </div>
                  )}
                  {builtInSaving > 0 && (
                    <div className="flex justify-between text-[#1D4ED8] font-semibold">
                      <span>Savings</span>
                      <span>-${builtInSaving} USD</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Due Now</span>
                    <span className="text-3xl font-display font-black text-[#002060]">
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
                  className="w-full py-3.5 px-4 rounded-full bg-[#002060] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                    <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span>
                      {gatewayConfigured
                        ? 'Payment is processed by Stripe with 256-bit TLS and 3-D Secure. Your enrollment is confirmed automatically once the payment is verified.'
                        : 'No card details are collected on this page. Your seat is confirmed once the emailed Stripe payment has been completed.'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
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
