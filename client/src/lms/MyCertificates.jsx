import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Award,
  ExternalLink,
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  ZoomIn,
  Eye,
  Layers
} from 'lucide-react';
import { MICROSOFT_CERTIFICATES, getAlignedMicrosoftCert } from '../data/microsoftCertificates';
import CertificateModal from '../components/CertificateModal';

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'us' | 'microsoft'
  const [selectedModalCert, setSelectedModalCert] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/lms/certificates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCertificates(res.data.certificates || []);
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyVerifyLink = (certId) => {
    const url = `${window.location.origin}/certificate/${certId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE6D6] border border-[#E5C275]/40 text-[#0B1220] text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5 text-[#4338CA]" />
            Accredited Credentials
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-[#0B1220]">
            My Issued Certificates
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl">
            Industry-recognized, cryptographically verified certifications earned upon 100% course and quiz completion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-right shadow-xs">
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Earned</div>
            <div className="text-2xl font-heading font-black text-[#0B1220]">{certificates.length}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-slate-100/80 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#0B1220] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            All Credentials ({certificates.length + MICROSOFT_CERTIFICATES.length})
          </button>
          <button
            onClick={() => setActiveTab('us')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'us'
                ? 'bg-[#0B1220] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>US Diplomas ({certificates.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('microsoft')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'microsoft'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Microsoft Partner Credentials ({MICROSOFT_CERTIFICATES.length})</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-500 pr-2 hidden md:inline">
          Official Institutional Alignment &bull; Wyoming Charter #2024-0012984
        </span>
      </div>

      {/* SECTION 1: US Institutional Certificates */}
      {(activeTab === 'all' || activeTab === 'us') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold text-[#0B1220] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#4338CA]" />
              <span>US Institutional Fellowship Diplomas</span>
            </h2>
            <span className="text-xs font-mono text-slate-600">Wyoming Digital Registry</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse shadow-xs" />
              ))}
            </div>
          ) : certificates.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center max-w-xl mx-auto shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#EFE6D6] border border-[#E5C275]/40 flex items-center justify-center text-[#0B1220] mb-3">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-base font-heading font-bold text-[#0B1220] mb-1">No US Diplomas Conferred Yet</h3>
              <p className="text-slate-600 text-xs mb-4 leading-relaxed">
                Complete 100% of your course modules and pass technical capstone defenses to unlock your verified American FutureTech credential.
              </p>
              <Link
                to="/student/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition-all"
              >
                <BookOpen className="w-4 h-4" />
                Resume Active Courses
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {certificates.map((cert) => {
                const alignedMs = getAlignedMicrosoftCert(cert.courseTitle || cert.course?.title);
                return (
                  <motion.div
                    key={cert._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative rounded-2xl border-2 border-slate-200 hover:border-[#0B1220]/40 bg-white p-6 transition-all duration-300 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#EFE6D6] border border-[#E5C275]/40 flex items-center justify-center text-[#0B1220] shrink-0">
                            <ShieldCheck className="w-6 h-6 text-[#4338CA]" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-[#4338CA] uppercase tracking-wider block">
                              {cert.grade || 'Certified with Distinction'}
                            </span>
                            <h3 className="text-base sm:text-lg font-heading font-bold text-[#0B1220] leading-snug">
                              {cert.courseTitle || cert.course?.title || 'Advanced Specialization'}
                            </h3>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EFE6D6] text-[#0B1220] shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4338CA]" />
                          VERIFIED
                        </span>
                      </div>

                      {/* Dual Credential Miniature Preview */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={() => setSelectedModalCert(alignedMs)}
                            className="cursor-pointer relative w-16 h-12 rounded-lg overflow-hidden border border-indigo-400/40 shadow-xs bg-white shrink-0 group/img hover:scale-105 transition-transform"
                            title="Click to zoom aligned Microsoft certificate"
                          >
                            <img
                              src={alignedMs.image}
                              alt={alignedMs.title}
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 block">
                              Aligned Microsoft Credential:
                            </span>
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {alignedMs.title.replace('Microsoft Certified: ', '')}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">Exam: {alignedMs.code}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedModalCert(alignedMs)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </div>

                      {/* Certificate Details */}
                      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 mb-4 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-semibold uppercase text-[10px] tracking-wider">CREDENTIAL ID</span>
                          <span className="text-[#0B1220] font-mono font-bold">{cert.certificateId}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-semibold uppercase text-[10px] tracking-wider">DATE OF ISSUANCE</span>
                          <span className="text-slate-700 font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/certificate/${cert.certificateId}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0B1220] hover:bg-[#4338CA] text-white text-xs font-bold transition-colors shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View & Verify
                        </Link>

                        <Link
                          to={`/certificate/${cert.certificateId}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-[#0B1220] text-xs font-semibold transition-colors"
                          title="Print / Save PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Print PDF
                        </Link>
                      </div>

                      <button
                        onClick={() => copyVerifyLink(cert.certificateId)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
                        title="Copy verification link"
                      >
                        {copiedId === cert.certificateId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#4338CA]" />
                            <span className="text-[#4338CA] font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Share Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Official Microsoft Partner Certifications */}
      {(activeTab === 'all' || activeTab === 'microsoft') && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-heading font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Official Microsoft Certified Partner Credentials</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic Microsoft credentials aligned with American FutureTech professional fellowship programs.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 self-start sm:self-auto">
              5 Certifications Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MICROSOFT_CERTIFICATES.map((msCert) => (
              <motion.div
                key={msCert.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-2 border-indigo-100 hover:border-indigo-400 bg-white p-5 shadow-xs transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail Image with Click-to-Zoom */}
                  <div
                    onClick={() => setSelectedModalCert(msCert)}
                    className="relative cursor-pointer rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 mb-4 group/img hover:shadow-md transition-all"
                  >
                    <img
                      src={msCert.image}
                      alt={msCert.title}
                      className="w-full h-44 object-contain transition-transform duration-300 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                      <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                        <ZoomIn className="w-4 h-4 text-indigo-600" />
                        <span>Inspect 4K</span>
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900 text-white text-[11px] font-mono flex items-center justify-between px-3">
                      <span className="font-bold text-indigo-300">{msCert.code}</span>
                      <span className="text-slate-400 text-[10px]">{msCert.level} Level</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold uppercase border border-indigo-200">
                      {msCert.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 font-heading leading-snug">
                      {msCert.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {msCert.description}
                    </p>
                  </div>

                  {/* Skills tags */}
                  <div className="pt-3 flex flex-wrap gap-1.5">
                    {msCert.skills.slice(0, 3).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedModalCert(msCert)}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>

                  <a
                    href={msCert.image}
                    download={`${msCert.code}.png`}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    title="Download Certificate PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">PNG</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Notice */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-[#EFE6D6] text-[#4338CA] shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-[#0B1220]">Global Verification Standard:</strong> Every American FutureTech credential is cryptographically anchored in our Wyoming Registry and aligned with official Microsoft Professional certifications. Recruiters and hiring managers can verify your transcript and honors directly at our public registry portal without login.
        </p>
      </div>

      {/* Full-Resolution Certificate Lightbox Modal */}
      <CertificateModal
        isOpen={!!selectedModalCert}
        certificate={selectedModalCert}
        onClose={() => setSelectedModalCert(null)}
      />
    </div>
  );
}
