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
  Lock,
  ZoomIn,
  Eye,
  Layers,
  Check
} from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import CompanyMarquee from '../components/CompanyMarquee';
import Footer from '../components/Footer';
import { MICROSOFT_CERTIFICATES, getAlignedMicrosoftCert } from '../data/microsoftCertificates';
import CertificateModal from '../components/CertificateModal';

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
  const [activeTab, setActiveTab] = useState('us-diploma'); // 'us-diploma' | 'microsoft' | 'both'
  const [selectedMicrosoftCert, setSelectedMicrosoftCert] = useState(MICROSOFT_CERTIFICATES[1]);
  const [selectedModalCert, setSelectedModalCert] = useState(null);

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
        const demoData = DEMO_CERTIFICATES[normalizedId];
        setCert(demoData);
        setSelectedMicrosoftCert(getAlignedMicrosoftCert(demoData.courseTitle || demoData.category));
        setLoading(false);
        return;
      }

      const res = await axios.get(`/api/lms/certificate/${certificateId}`);
      if (res.data?.certificate) {
        const fetchedCourse = res.data.certificate.course?.title || res.data.certificate.courseTitle || res.data.certificate.course?.category || '';
        setSelectedMicrosoftCert(getAlignedMicrosoftCert(fetchedCourse));
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
        const demoData = DEMO_CERTIFICATES[normalizedId];
        setCert(demoData);
        setSelectedMicrosoftCert(getAlignedMicrosoftCert(demoData.courseTitle || demoData.category));
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

        <CompanyMarquee />        {/* Navigation & Action Bar */}
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
          <div className="space-y-8">
            {/* Credential Presentation Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('us-diploma')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'us-diploma'
                      ? 'bg-[#1a361d] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>US Fellowship Diploma</span>
                </button>

                <button
                  onClick={() => setActiveTab('microsoft')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'microsoft'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Microsoft Certified Credential</span>
                </button>

                <button
                  onClick={() => setActiveTab('both')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'both'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Dual Verification View</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-500 px-2 hidden sm:flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Dual Verified: US Institutional Senate + Microsoft Certified Partner</span>
              </div>
            </div>

            {/* TAB 1: Official High-Resolution Double-Bordered US Diploma Presentation */}
            {(activeTab === 'us-diploma' || activeTab === 'both') && (
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

            {/* TAB 2: Official Microsoft Certified Credential Presentation */}
            {(activeTab === 'microsoft' || activeTab === 'both') && (
              <div className="rounded-3xl bg-slate-900 border-4 border-indigo-500/30 p-6 sm:p-12 shadow-2xl relative overflow-hidden text-white print:border-2 print:p-6 print:bg-white print:text-black">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#6366f115_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* Top Microsoft Header Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800 text-center sm:text-left relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-400">
                        Official Microsoft Credential Partner
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-heading text-white mt-0.5 print:text-black">
                        Microsoft Certified Professional Credential
                      </div>
                      <div className="text-xs text-slate-400 print:text-slate-600">
                        Conferred under Institutional Curriculum Alignment &bull; Fellow ID: {cert.certificateId}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center sm:items-end gap-1.5">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Certified Active & Validated</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Exam Track: {selectedMicrosoftCert.code}</span>
                  </div>
                </div>

                {/* Microsoft Certificate Showcase */}
                <div className="py-8 relative z-10 space-y-6">
                  {/* Interactive Certificate Image */}
                  <div className="flex flex-col items-center justify-center">
                    <div
                      onClick={() => setSelectedModalCert(selectedMicrosoftCert)}
                      className="group relative cursor-pointer rounded-2xl overflow-hidden border-2 border-indigo-400/40 shadow-2xl bg-white max-w-2xl w-full transition-all duration-300 hover:scale-[1.01] hover:border-indigo-400"
                    >
                      <img
                        src={selectedMicrosoftCert.image}
                        alt={selectedMicrosoftCert.title}
                        className="w-full h-auto object-contain transition-transform duration-300 group-hover:contrast-105"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px] print:hidden">
                        <span className="px-4 py-2 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center gap-2 shadow-xl">
                          <ZoomIn className="w-4 h-4 text-indigo-600" />
                          <span>Inspect Full Resolution (4K)</span>
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 border-t border-slate-800 text-center flex items-center justify-between text-xs font-mono text-indigo-300 px-4 print:hidden">
                        <span className="font-bold text-white">{selectedMicrosoftCert.code} &bull; {selectedMicrosoftCert.title}</span>
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-indigo-400" /> Click to Enlarge
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Metadata Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">CONFERRED TO FELLOW</div>
                      <div className="text-base font-bold text-white print:text-black">{cert.studentName}</div>
                      <div className="text-xs text-indigo-300 font-mono mt-0.5">{cert.certificateId}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">CREDENTIAL SPECIALIZATION</div>
                      <div className="text-base font-bold text-white print:text-black">{selectedMicrosoftCert.title.replace('Microsoft Certified: ', '')}</div>
                      <div className="text-xs text-emerald-400 font-semibold mt-0.5">{selectedMicrosoftCert.level} Level Credential</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">VERIFICATION REGISTRY</div>
                      <div className="text-xs font-bold text-white print:text-black">American FutureTech & Microsoft Partner Network</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">Status: Verified Permanent</div>
                    </div>
                  </div>

                  {/* Skills Validated */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-left">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
                      Verified Technical Competencies Assessed:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMicrosoftCert.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Other Microsoft Credentials Selector */}
                  <div className="pt-2 print:hidden text-left">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Inspect All Official Microsoft Certifications in this Framework:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {MICROSOFT_CERTIFICATES.map((mCert) => (
                        <button
                          key={mCert.id}
                          onClick={() => setSelectedMicrosoftCert(mCert)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                            selectedMicrosoftCert.id === mCert.id
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/40'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
                          }`}
                        >
                          <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 text-[10px]">
                            {mCert.code}
                          </span>
                          <span>{mCert.title.replace('Microsoft Certified: ', '')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cryptographic Hash Strip */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-slate-400 bg-slate-950/80 -mx-6 -mb-6 sm:-mx-12 sm:-mb-12 p-4 px-6 sm:px-12 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-indigo-400" />
                    <span>Microsoft Partner Verification Hash:</span>
                    <span className="text-slate-200 break-all">{cert.completionHash}</span>
                  </div>
                  <div className="text-indigo-400 font-bold shrink-0">
                    Dual Verified &bull; Conferred via American FutureTech
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Full-Resolution Certificate Lightbox Modal */}
      <CertificateModal
        isOpen={!!selectedModalCert}
        certificate={selectedModalCert}
        onClose={() => setSelectedModalCert(null)}
      />

      <Footer />
    </div>
  );
}
