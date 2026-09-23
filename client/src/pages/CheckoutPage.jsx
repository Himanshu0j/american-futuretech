import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, CheckCircle2, ArrowRight, CreditCard, Tag, AlertCircle, Award, Check } from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';
import CompanyMarquee from '../components/CompanyMarquee';
import Footer from '../components/Footer';
import { useSiteSettings } from '../context/SiteSettingsContext';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const initialCourseId = searchParams.get('courseId');
  const programParam = (searchParams.get('program') || searchParams.get('mode') || '').toLowerCase();
  const initialTier = searchParams.get('tier') || (programParam === 'personalized' ? 'personalized' : 'deposit');

  // Personalized 1-on-1 track pricing (admin editable via Settings → Personalized)
  const personalizedPrice = settings?.personalizedLearning?.price || 5499;
  const personalizedOriginal = settings?.personalizedLearning?.originalPrice || 6999;
  const personalizedDuration = settings?.personalizedLearning?.duration || 'Custom / 3 to 6 Months';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || '');
  const [tier, setTier] = useState(initialTier);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit / Debit Card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);

  useEffect(() => {
    fetchCourses();
    window.scrollTo(0, 0);
  }, []);

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

  const selectedCourse = courses.find(c => c._id === selectedCourseId) || courses[0];

  const baseAmount = tier === 'deposit'
    ? 99
    : tier === 'personalized'
      ? personalizedPrice
      : (selectedCourse?.pricing?.discountedPrice || 1899);
  const finalAmount = Math.max(10, baseAmount - discountAmount);

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    if (code === 'FUTURETECH10' || code === 'WELCOME10') {
      const disc = Math.round(baseAmount * 0.1);
      setDiscountAmount(disc);
      setAppliedCoupon(code);
    } else if (code === 'AI2026' || code === 'TECH50') {
      const disc = Math.min(50, baseAmount - 10);
      setDiscountAmount(disc);
      setAppliedCoupon(code);
    } else {
      setCouponError('Invalid or expired promotional code. Try FUTURETECH10 or AI2026');
    }
  };

  const handleSubmitCheckout = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      alert('Please fill out all required personal contact details.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        courseId: selectedCourse._id,
        tier,
        fullName,
        email,
        phone,
        couponCode: appliedCoupon || undefined,
        paymentMethod,
      };

      const res = await axios.post('/api/payments/checkout', payload);
      if (res.data.success) {
        setCheckoutSuccess(res.data);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed. Please verify information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 sm:pt-32 pb-14 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

        <CompanyMarquee />        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5 text-[#2d5c36]" />
            <span>256-Bit SSL Encrypted Enrollment Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-[#1a361d] mb-3">
            Secure Enrollment & <span className="highlight">Seat Reservation</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Reserve your place in the upcoming engineering cohort. Choose between the flexible $99 seat deposit or complete tuition.
          </p>
        </div>

        {checkoutSuccess ? (
          /* Success Screen */
          <div className="max-w-2xl mx-auto p-6 sm:p-6 rounded-3xl bg-white border border-slate-200 text-center shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-[#d8ffd2] text-[#1a361d] flex items-center justify-center mx-auto mb-6 border border-[#76ff8a]">
              <CheckCircle2 className="w-9 h-9 text-[#2d5c36]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#1a361d] mb-2">
              {tier === 'deposit' ? 'Cohort Seat Reserved Successfully' : 'Tuition & Enrollment Confirmed'}
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Welcome, <strong className="text-slate-900">{checkoutSuccess.payment.studentName}</strong>. Your registration for <strong className="text-[#2d5c36]">{checkoutSuccess.payment.courseTitle}</strong> is active.
            </p>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 mb-8 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Official Invoice:</span>
                <span className="font-bold text-[#1a361d]">{checkoutSuccess.payment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transaction Ref:</span>
                <span className="text-slate-800">{checkoutSuccess.payment.transactionId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Settled:</span>
                <span className="font-bold text-[#2d5c36]">${checkoutSuccess.payment.amount} USD</span>
              </div>
              {checkoutSuccess.isNewStudent && (
                <div className="pt-3 border-t border-slate-200 text-slate-700">
                  <div className="text-amber-800 font-semibold mb-1 font-sans text-xs">Student Portal Credentials Generated:</div>
                  <div className="text-xs font-sans">User ID: <strong className="text-slate-900 font-mono">{checkoutSuccess.payment.email}</strong></div>
                  <div className="text-xs font-sans">Initial Password: <strong className="text-slate-900 font-mono">Password@123</strong></div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/student/login"
                className="py-3 px-6 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
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
        ) : (
          /* Checkout Form & Order Summary */
          <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Details */}
            <div className="lg:col-span-7 space-y-4 text-left">
              {/* 1. Program Selection */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-[#d8ffd2] text-[#1a361d] text-xs font-display font-bold flex items-center justify-center">
                    01
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#1a361d] uppercase tracking-wider">
                    Select Tech Specialization
                  </h3>
                </div>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all cursor-pointer"
                >
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.title} ({c.duration} — ${c.pricing?.discountedPrice || 1899} USD)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Enrollment Tier Selection */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-[#d8ffd2] text-[#1a361d] text-xs font-display font-bold flex items-center justify-center">
                    02
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#1a361d] uppercase tracking-wider">
                    Choose Tuition Schedule
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Deposit Option */}
                  <div
                    onClick={() => { setTier('deposit'); setDiscountAmount(0); setAppliedCoupon(''); }}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      tier === 'deposit'
                        ? 'bg-[#f7fdf8] border-[#1a361d] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#1a361d] uppercase tracking-wider">Seat Reservation</span>
                      <span className="text-2xl font-display font-black text-[#1a361d]">$99</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Lock your seat in the next live cohort now. Remainder is settled before live sessions commence.
                    </p>
                  </div>

                  {/* Full Tuition Option */}
                  <div
                    onClick={() => { setTier('full'); setDiscountAmount(0); setAppliedCoupon(''); }}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      tier === 'full'
                        ? 'bg-[#f7fdf8] border-[#1a361d] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[#2d5c36] uppercase tracking-wider">Full Tuition</span>
                      <span className="text-2xl font-display font-black text-[#1a361d]">${selectedCourse?.pricing?.discountedPrice || 1899}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Complete upfront payment. Unlocks instant access to labs, course repository, and 1-on-1 advisor.
                    </p>
                  </div>

                  {/* Personalized 1-on-1 Option */}
                  <div
                    onClick={() => { setTier('personalized'); setDiscountAmount(0); setAppliedCoupon(''); }}
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
                      <span className="text-2xl font-display font-black text-[#1a361d]">${personalizedPrice.toLocaleString()}</span>
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
                  <span className="w-7 h-7 rounded-lg bg-[#d8ffd2] text-[#1a361d] text-xs font-display font-bold flex items-center justify-center">
                    03
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#1a361d] uppercase tracking-wider">
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
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all placeholder:text-slate-400"
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
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all placeholder:text-slate-400"
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
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* 4. Payment Card Simulation */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="w-7 h-7 rounded-lg bg-[#d8ffd2] text-[#1a361d] text-xs font-display font-bold flex items-center justify-center">
                    04
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#1a361d] uppercase tracking-wider">
                    Payment Method
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2.5 mb-4">
                  {['Credit / Debit Card', 'Google Pay', 'Wire Transfer'].map(method => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-[#1a361d] border-[#1a361d] text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full p-3 pl-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all font-mono"
                    />
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expires (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">CVC / Security Code</label>
                    <input
                      type="password"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#1a361d] focus:ring-1 focus:ring-[#1a361d] transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 text-left">
              <div className="p-6 sm:p-5 rounded-2xl bg-white border-2 border-[#1a361d]/15 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h3 className="text-base font-display font-bold text-[#1a361d]">
                    Summary of Enrollment
                  </h3>
                  <span className="text-[11px] font-bold text-[#1a361d] bg-[#d8ffd2] px-2.5 py-0.5 rounded-full">
                    Live Cohort
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm font-bold text-[#1a361d]">{selectedCourse?.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{selectedCourse?.duration || '6 Months'}</span>
                    <span>•</span>
                    <span className="capitalize font-semibold text-[#2d5c36]">{tier} Track</span>
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
                      className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs uppercase focus:outline-none focus:border-[#1a361d] font-mono placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-5 py-2.5 rounded-full border border-[#1a361d] hover:bg-slate-100 text-[#1a361d] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="text-xs text-[#2d5c36] font-semibold mt-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#40844e]" />
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
                    <span className="text-slate-500">Tuition Subtotal</span>
                    <span className="font-semibold text-slate-900">${baseAmount} USD</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#2d5c36] font-semibold">
                      <span>Voucher Discount</span>
                      <span>-${discountAmount} USD</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Due Now</span>
                    <span className="text-3xl font-display font-black text-[#1a361d]">${finalAmount} <span className="text-xs font-sans text-slate-500 font-normal">USD</span></span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    'Securing Enrollment Seat...'
                  ) : (
                    <>
                      Confirm & Pay ${finalAmount} USD
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
                  <Shield className="w-4 h-4 text-[#40844e] shrink-0 mt-0.5" />
                  <span>Backed by 14-day 100% money-back academic guarantee. No questions asked.</span>
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
