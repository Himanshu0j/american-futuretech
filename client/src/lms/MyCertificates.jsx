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
  Check
} from 'lucide-react';

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 text-[#1a361d] text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5 text-[#2d5c36]" />
            Accredited Credentials
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-[#1a361d]">
            My Issued Certificates
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl">
            Industry-recognized, cryptographically verified certifications earned upon 100% course and quiz completion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-right shadow-xs">
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Earned</div>
            <div className="text-2xl font-heading font-black text-[#1a361d]">{certificates.length}</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse shadow-xs" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#d8ffd2] border border-[#76ff8a]/40 flex items-center justify-center text-[#1a361d] mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-heading font-bold text-[#1a361d] mb-2">No Certificates Yet</h3>
          <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
            Complete 100% of your course curriculum and pass all module quizzes to unlock your verified American FutureTech graduation credential.
          </p>
          <Link
            to="/student/courses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#9e4f8f] hover:bg-[#582c50] text-white font-bold text-xs shadow-xs transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Resume Courses
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <motion.div
              key={cert._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-2xl border-2 border-slate-200 hover:border-[#1a361d]/40 bg-white p-6 transition-all duration-300 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#d8ffd2] border border-[#76ff8a]/40 flex items-center justify-center text-[#1a361d]">
                    <ShieldCheck className="w-6 h-6 text-[#2d5c36]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#2d5c36] uppercase tracking-wider block">
                      {cert.grade || 'Certified with Distinction'}
                    </span>
                    <h3 className="text-lg font-heading font-bold text-[#1a361d] leading-snug">
                      {cert.courseTitle || cert.course?.title || 'Advanced Specialization'}
                    </h3>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d8ffd2] text-[#1a361d]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2d5c36]" />
                  VERIFIED
                </span>
              </div>

              {/* Certificate Details */}
              <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-100 my-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">CREDENTIAL ID</span>
                  <span className="text-[#1a361d] font-mono font-bold">{cert.certificateId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">DATE OF ISSUANCE</span>
                  <span className="text-slate-700 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/certificate/${cert.certificateId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1a361d] hover:bg-[#2d5c36] text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View & Verify
                  </Link>

                  <Link
                    to={`/certificate/${cert.certificateId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-[#1a361d] text-xs font-semibold transition-colors"
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
                      <Check className="w-3.5 h-3.5 text-[#2d5c36]" />
                      <span className="text-[#2d5c36] font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Verification Notice */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-[#d8ffd2] text-[#2d5c36] shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-[#1a361d]">Global Verification Standard:</strong> Every American FutureTech certificate contains a unique cryptographic credential ID that employers and institutions can verify instantly at our public registry portal without login.
        </p>
      </div>
    </div>
  );
}
