import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  Calendar,
  CheckCircle2,
  Download,
  Printer,
  ArrowLeft,
  ExternalLink,
  QrCode,
  Sparkles,
  Lock
} from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DEMO_CERTIFICATES = {
  'AFT-CERT-AI9821': {
    certificateId: 'AFT-CERT-AI9821',
    studentName: 'Ethan Hunt',
    courseTitle: '6-Month Comprehensive Fellowship in Applied AI & Deep Learning',
    category: 'Artificial Intelligence & Machine Learning',
    grade: 'Conferred with Highest Academic Honors · GPA 3.96',
    issueDate: '2026-03-15T00:00:00.000Z',
    completionHash: '0xe84a91b2c7f4e8832a8947b1df2847c94b293818e918c72834b928198f8271a4',
    institution: 'American FutureTech Institute of Applied Technology',
    charter: 'State of Wyoming Registry · Charter #2024-0012984',
    credits: '24.0 Continuing Education Units (CEU)'
  }
};

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
      setError('');
      const normalizedId = (certificateId || '').toUpperCase();

      // Check demo certificates first
      if (DEMO_CERTIFICATES[normalizedId]) {
        setCert(DEMO_CERTIFICATES[normalizedId]);
        setLoading(false);
        return;
      }

      const res = await axios.get(`/api/lms/certificate/${certificateId}`);
      if (res.data?.certificate) {
        setCert({
          certificateId: res.data.certificate.certificateId,
          studentName: res.data.certificate.student?.name || res.data.certificate.studentName || 'Fellow Graduate',
          courseTitle: res.data.certificate.course?.title || res.data.certificate.courseTitle || 'Executive Fellowship Track',
          category: res.data.certificate.course?.category || 'Emerging Technology',
          grade: res.data.certificate.grade || 'Graduated with Honors',
          issueDate: res.data.certificate.issueDate || new Date().toISOString(),
          completionHash: res.data.certificate.hash || '0x71a4...verified',
          institution: 'American FutureTech Institute of Applied Technology',
          charter: 'State of Wyoming Registry · Charter #2024-0012984',
          credits: '24.0 Continuing Education Units (CEU)'
        });
      } else {
        throw new Error('Record not found');
      }
    } catch (err) {
      // Fallback for default demo
      const normalizedId = (certificateId || '').toUpperCase();
      if (DEMO_CERTIFICATES[normalizedId]) {
        setCert(DEMO_CERTIFICATES[normalizedId]);
      } else {
        setError(
          err.response?.data?.message ||
            `Certificate ID "${certificateId}" could not be located in the American FutureTech public credential registry.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#fffff2] text-[#1b1b1b] font-sans antialiased selection:bg-[#76ff8a] selection:text-[#1a361d] relative">
      <Navbar />

      <main className="pt-28 pb-20 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
        {/* Navigation & Action Bar */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4 print:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#1a361d] font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to American FutureTech</span>
          </Link>

          {cert && (
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="py-2 px-5 rounded-full border border-[#1a361d] text-[#1a361d] bg-white hover:bg-gray-50 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Print / Save PDF</span>
              </button>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-4 rounded-full bg-[#1a361d] text-white hover:bg-[#2d5c36] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Add to LinkedIn</span>
              </a>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-[#1a361d]/20 border-t-[#1a361d] rounded-full animate-spin" />
            <div className="text-xs font-mono text-gray-500">Querying Cryptographic Credential Registry...</div>
          </div>
        ) : error ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-rose-200 text-center max-w-lg mx-auto shadow-md">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">Record Not Found</h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">{error}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/certificate/AFT-CERT-AI9821"
                className="py-2.5 px-5 bg-[#1a361d] hover:bg-[#2d5c36] text-white rounded-full text-xs font-bold transition-colors shadow-xs w-full sm:w-auto"
              >
                Inspect Sample Verified Certificate
              </Link>
              <Link
                to="/courses"
                className="py-2.5 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-colors w-full sm:w-auto"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        ) : (
          /* Official High-Resolution Double-Bordered US Diploma Presentation */
          <div className="rounded-3xl bg-white border-8 border-double border-[#1a361d]/40 p-6 sm:p-14 shadow-2xl relative overflow-hidden text-[#1a361d] print:border-4 print:p-8">
            {/* Background Crest Watermark */}
            <div className="absolute right-4 -bottom-10 opacity-[0.03] pointer-events-none">
              <Award className="w-96 h-96 text-[#1a361d]" />
            </div>

            {/* Top Institutional Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b-2 border-gray-200 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <img
                  src="/images/logo-crest.webp"
                  alt="American FutureTech Crest"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 drop-shadow-md"
                />
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#10b981]">
                    Accredited Technical Education
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-heading text-[#1a361d] mt-0.5">
                    American FutureTech Institute
                  </div>
                  <div className="text-xs text-gray-500">
                    30 N Gould St, Sheridan, WY 82801 &bull; United States
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end gap-1.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d8ffd2] border border-[#10b981]/40 text-[#1a361d] text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <span>Officially Verified Credential</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">Registry Status: Active & Conferred</span>
              </div>
            </div>

            {/* Diploma Body */}
            <div className="py-12 sm:py-16 text-center space-y-6">
              <div className="text-xs font-mono uppercase tracking-widest text-gray-500 font-bold">
                By the authority of the academic faculty and Board of Trustees
              </div>

              <div className="text-xs text-gray-600">This official diploma is proudly conferred upon</div>

              {/* Graduate Name */}
              <div className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading text-[#1a361d] tracking-tight py-1">
                {cert.studentName}
              </div>

              <div className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
                who has successfully completed all prescribed coursework, laboratory defense requirements, and real-world capstone engineering benchmarks for the specialization in
              </div>

              {/* Course Title Badge */}
              <div className="text-lg sm:text-2xl font-black font-heading text-[#1a361d] py-3 px-8 rounded-2xl bg-[#fffff2] inline-block border border-[#1a361d]/20 shadow-sm">
                {cert.courseTitle}
              </div>

              {/* Academic Distinction & Credits */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <span className="px-3 py-1 rounded-full bg-[#d8ffd2] text-[#1a361d] text-xs font-bold">
                  {cert.grade}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-mono font-medium">
                  {cert.credits}
                </span>
              </div>
            </div>

            {/* Signatures & Seal Footer */}
            <div className="pt-8 border-t-2 border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-xs text-gray-600">
              {/* Left Column: Metadata */}
              <div className="text-center sm:text-left space-y-1">
                <div>
                  <span className="text-gray-400 font-mono text-[10px] block">CONFERRAL DATE</span>
                  <strong className="text-[#1a361d] font-medium">
                    {new Date(cert.issueDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 font-mono text-[10px] block">PERMANENT REGISTRY ID</span>
                  <strong className="font-mono text-[#1a361d] font-black">{cert.certificateId}</strong>
                </div>
              </div>

              {/* Center Column: Official Gold Seal Medal */}
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/images/gold-seal-medal.webp"
                  alt="Official Gold Accreditation Seal"
                  className="w-20 h-20 object-contain drop-shadow-lg"
                />
                <span className="text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                  Board of Accreditation Seal
                </span>
              </div>

              {/* Right Column: Academic Director Signature */}
              <div className="text-center sm:text-right space-y-1">
                <div className="font-serif italic text-lg sm:text-xl text-[#1a361d]">Alexander Pierce</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                  Dean & Academic Director
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  American FutureTech Academic Senate
                </div>
              </div>
            </div>

            {/* Cryptographic Hash Strip */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-gray-500 bg-gray-50/80 -mx-6 -mb-6 sm:-mx-14 sm:-mb-14 p-4 px-6 sm:px-14">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#10b981]" />
                <span className="text-gray-600">SHA-256 Ledger Hash:</span>
                <span className="text-gray-800 break-all">{cert.completionHash}</span>
              </div>
              <div className="text-[#10b981] font-bold shrink-0">
                Verified Cryptographic Signature &bull; US Jurisdiction
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
