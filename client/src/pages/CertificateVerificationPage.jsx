import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Award, Calendar, CheckCircle2, Download, Printer, ArrowLeft, ExternalLink } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CyberParticles from '../components/CyberParticles';

export default function CertificateVerificationPage() {
  const { certificateId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCert();
    window.scrollTo(0, 0);
  }, [certificateId]);

  const fetchCert = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/lms/certificate/${certificateId}`);
      setCert(res.data.certificate);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate record could not be verified in the public registry.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#fffff2] text-slate-800 font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 pb-20 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
        <div className="mb-6 flex justify-between items-center print:hidden">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#1a361d] font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to American FutureTech
          </Link>
          {cert && (
            <button
              onClick={handlePrint}
              className="py-2.5 px-5 rounded-full border border-[#1a361d] text-[#1a361d] hover:bg-slate-100 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#40844e]" /> Print / Save Certificate PDF
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#1a361d]/20 border-t-[#1a361d] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl bg-white border border-rose-300 text-center max-w-md mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Certificate Unverified</h3>
            <p className="text-xs text-slate-600 mb-6">{error}</p>
            <Link to="/courses" className="py-2.5 px-6 bg-[#9e4f8f] hover:bg-[#582c50] text-white rounded-full text-xs font-bold transition-colors shadow-sm">
              Explore Certified Programs
            </Link>
          </div>
        ) : (
          /* Official Styled Certificate Presentation */
          <div className="rounded-3xl bg-white border-4 border-double border-[#1a361d]/30 p-8 sm:p-14 shadow-lg relative overflow-hidden text-[#1a361d]">
            {/* Ambient Watermark */}
            <div className="absolute right-6 -bottom-10 opacity-5 pointer-events-none">
              <Award className="w-96 h-96 text-[#1a361d]" />
            </div>

            {/* Verification Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-slate-200 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <img
                  src="/images/logo-crest.webp"
                  alt="American FutureTech Crest"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-sm"
                />
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#2d5c36]">Official Certificate of Mastery</div>
                  <div className="text-xl font-display font-extrabold text-[#1a361d] mt-1">American FutureTech Institute</div>
                  <div className="text-[11px] text-slate-500">Wyoming, United States &bull; Accredited Technology Program</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d8ffd2] border border-[#76ff8a] text-[#1a361d] text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#2d5c36]" />
                Verified Credential
              </div>
            </div>

            {/* Certificate Body */}
            <div className="py-12 text-center space-y-6">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                This is to officially certify that
              </div>

              <div className="text-3xl sm:text-5xl font-serif font-black text-[#1a361d]">
                {cert.studentName}
              </div>

              <div className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                has successfully completed all rigorous curriculum requirements, production capstone labs, and comprehensive module assessments for
              </div>

              <div className="text-xl sm:text-2xl font-display font-bold text-[#1a361d] py-2.5 px-6 rounded-2xl bg-slate-50 inline-block border border-slate-200 shadow-xs">
                {cert.courseTitle}
              </div>

              <div className="text-xs font-bold text-[#2d5c36]">
                Graduation Distinction: {cert.grade || 'Honor Distinction'}
              </div>
            </div>

            {/* Certificate Footer Stamp */}
            <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-600">
              <div className="text-center sm:text-left">
                <div>Issue Date: <strong className="text-slate-900">{new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></div>
                <div>Certificate ID: <strong className="text-[#1a361d] font-mono font-bold">{cert.certificateId}</strong></div>
              </div>

              <div className="text-center sm:text-right">
                <div className="font-serif italic text-slate-800 text-sm">Alexander Pierce</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Dean & Academic Director</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
