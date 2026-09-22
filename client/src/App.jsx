import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MetricsStrip from './components/MetricsStrip';
import TrustMarquee from './components/TrustMarquee';
import CourseSection from './components/CourseSection';
import WhyChooseUs from './components/WhyChooseUs';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import LeadModal from './components/LeadModal';
import SyllabusModal from './components/SyllabusModal';
import AmbientBackground from './components/AmbientBackground';
import LearningJourney from './components/LearningJourney';
import ThemeSwitcher from './components/ThemeSwitcher';
import PageSkeleton from './components/PageSkeleton';
import ToolsSection from './components/ToolsSection';
import PlacementRoadmap from './components/PlacementRoadmap';
import PersonalizedLearningSection from './components/PersonalizedLearningSection';
import FaqAccordion from './components/common/FaqAccordion';
import WhatsAppButton from './components/WhatsAppButton';
import AIChatbox from './components/AIChatbox';
import { ThemeModeProvider, useThemeMode } from './context/ThemeModeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteSettingsProvider, useSiteSettings } from './context/SiteSettingsContext';

// Lazy-loaded Public Subpages
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const CareerSupportPage = lazy(() => import('./pages/CareerSupportPage'));
const SuccessStoriesPage = lazy(() => import('./pages/SuccessStoriesPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CertificateVerificationPage = lazy(() => import('./pages/CertificateVerificationPage'));
const CertificationsPage = lazy(() => import('./pages/CertificationsPage'));

// Lazy-loaded Student LMS Portal
const StudentLogin = lazy(() => import('./lms/StudentLogin'));
const StudentRegister = lazy(() => import('./lms/StudentRegister'));
const StudentLayout = lazy(() => import('./lms/StudentLayout'));
const StudentDashboard = lazy(() => import('./lms/StudentDashboard'));
const MyCourses = lazy(() => import('./lms/MyCourses'));
const LessonPlayer = lazy(() => import('./lms/LessonPlayer'));
const MyCertificates = lazy(() => import('./lms/MyCertificates'));
const StudentPayments = lazy(() => import('./lms/StudentPayments'));
const StudentSupport = lazy(() => import('./lms/StudentSupport'));
const StudentProfile = lazy(() => import('./lms/StudentProfile'));

// Lazy-loaded Admin Portal Components
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const LeadsCRM = lazy(() => import('./admin/LeadsCRM'));
const CoursesCMS = lazy(() => import('./admin/CoursesCMS'));
const BatchesManager = lazy(() => import('./admin/BatchesManager'));
const StudentsManager = lazy(() => import('./admin/StudentsManager'));
const PaymentsManager = lazy(() => import('./admin/PaymentsManager'));
const JobsManager = lazy(() => import('./admin/JobsManager'));
const ContentCMS = lazy(() => import('./admin/ContentCMS'));
const SupportManager = lazy(() => import('./admin/SupportManager'));
const SettingsCMS = lazy(() => import('./admin/SettingsCMS'));
const StaffRBAC = lazy(() => import('./admin/StaffRBAC'));
const AdminGuide = lazy(() => import('./admin/AdminGuide'));

function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-sky-400 font-mono text-sm">
        Verifying Enterprise Credentials...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  if (user?.role?.toUpperCase() === 'STUDENT') {
    return <Navigate to="/student/dashboard" replace />;
  }
  return children;
}

function StudentProtectedRoute({ children }) {
  const token = localStorage.getItem('token') || localStorage.getItem('aft_admin_token');
  if (!token) {
    return <Navigate to="/student/login" replace />;
  }
  return children;
}

function LandingPage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleOpenLeadModal = (course = null) => {
    setSelectedCourse(course);
    setIsLeadModalOpen(true);
  };

  const handleOpenSyllabusModal = (course) => {
    setSelectedCourse(course);
    setIsSyllabusModalOpen(true);
  };

  const scrollToCourses = () => {
    const el = document.getElementById('courses');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { isCyber } = useThemeMode();
  const { settings } = useSiteSettings();
  const visibility = settings?.sectionVisibility || {};

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-600 selection:text-white relative overflow-x-hidden pt-16 md:pt-24">
      {/* Subtle Premium Ambient Canvas */}
      <AmbientBackground />

      {/* Sticky Translucent Glass Navbar with US Topbar */}
      <Navbar
        onOpenLeadModal={() => handleOpenLeadModal(null)}
        onNavigateSection={(id) => {
          const el = document.getElementById(id);
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <main>
        {/* Product-Led Hero Showcase with Interactive LMS Cockpit */}
        {visibility.hero !== false && (
          <Hero
            onOpenLeadModal={() => handleOpenLeadModal(null)}
            onExploreCourses={scrollToCourses}
          />
        )}

        {/* Global Enterprise Brand & Logo Marquee */}
        {visibility.trustMarquee !== false && <TrustMarquee />}

        {/* 3-Pillar Value Metrics Strip & Institutional Telemetry */}
        {visibility.metrics !== false && <MetricsStrip />}

        {/* 4-Phase Pedagogical Storytelling Journey (Learn, Practice, Certify, Advance) */}
        {visibility.learningJourney !== false && <LearningJourney />}

        {/* Program Selector Dynamic Bento Cards */}
        {visibility.courses !== false && (
          <CourseSection
            onSelectCourse={(course) => handleOpenLeadModal(course)}
            onOpenSyllabusModal={handleOpenSyllabusModal}
          />
        )}

        {/* Dedicated 1-on-1 Personalized Learning Track ($2,199 Independent Offering) */}
        {visibility.personalizedLearning !== false && (
          <PersonalizedLearningSection onOpenLeadModal={() => handleOpenLeadModal(null)} />
        )}

        {/* 40+ Industry Tools & Technologies Showcase (Real Database Data) */}
        {visibility.tools !== false && <ToolsSection />}

        {/* 8-Step Roadmap & 5 Proven Steps to Career Transformation (Verbatim Client Copy) */}
        {visibility.roadmap !== false && (
          <PlacementRoadmap onOpenLeadModal={() => handleOpenLeadModal(null)} />
        )}

        {/* Real Product Showcase & Architectural Depth */}
        {visibility.whyChooseUs !== false && <WhyChooseUs />}

        {/* Comprehensive Academic & Program FAQs */}
        {visibility.faqs !== false && (
          <section id="faqs" className="py-12 sm:py-16 bg-white dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800/80 relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
              <FaqAccordion
                showCategoryFilter={true}
                title="Frequently Asked Questions"
                subtitle="Everything you need to know about our curriculum, $99 reservation, 1-on-1 mentorship, and corporate hiring."
              />
            </div>
          </section>
        )}

        {/* Bottom CTA Banner with Selective Admissions */}
        {visibility.callToAction !== false && (
          <CallToAction onOpenLeadModal={() => handleOpenLeadModal(null)} />
        )}
      </main>

      {/* Footer */}
      <Footer onOpenLeadModal={() => handleOpenLeadModal(null)} />

      {/* Interactive Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        preselectedCourse={selectedCourse}
      />

      <SyllabusModal
        isOpen={isSyllabusModalOpen}
        onClose={() => setIsSyllabusModalOpen(false)}
        course={selectedCourse}
        onApplyNow={(course) => handleOpenLeadModal(course)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <SiteSettingsProvider>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public Homepage & Dedicated Theme URLs */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/old-ui" element={<LandingPage />} />
              <Route path="/cyber" element={<LandingPage />} />
              <Route path="/apple-ui" element={<LandingPage />} />

              {/* Public Subpages */}
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:slug" element={<CourseDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/jobs" element={<CareersPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/jobscourse" element={<CareersPage />} />
              <Route path="/jobscourse/:id" element={<JobDetailPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/careers/:id" element={<JobDetailPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/refund-policy" element={<RefundPolicyPage />} />
              <Route path="/cookie-policy" element={<CookiePolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/career-support" element={<CareerSupportPage />} />
              <Route path="/success-stories" element={<SuccessStoriesPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogDetailPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/certificate/:certificateId" element={<CertificateVerificationPage />} />
              <Route path="/certifications/:slug" element={<CertificationsPage />} />

              {/* Route Aliases */}
              <Route path="/login" element={<Navigate to="/student/login" replace />} />
              <Route path="/register" element={<Navigate to="/student/register" replace />} />

              {/* Student LMS Authentication */}
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student/register" element={<StudentRegister />} />

              {/* Student LMS Portal */}
              <Route
                path="/student"
                element={
                  <StudentProtectedRoute>
                    <StudentLayout />
                  </StudentProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/student/dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="courses" element={<MyCourses />} />
                <Route path="courses/:courseId/learn" element={<LessonPlayer />} />
                <Route path="learn/:courseId" element={<LessonPlayer />} />
                <Route path="certificates" element={<MyCertificates />} />
                <Route path="payments" element={<StudentPayments />} />
                <Route path="support" element={<StudentSupport />} />
                <Route path="profile" element={<StudentProfile />} />
              </Route>

              {/* Admin Authentication */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Enterprise SaaS Admin Panel */}
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="leads" element={<LeadsCRM />} />
                <Route path="courses" element={<CoursesCMS />} />
                <Route path="batches" element={<BatchesManager />} />
                <Route path="students" element={<StudentsManager />} />
                <Route path="payments" element={<PaymentsManager />} />
                <Route path="jobs" element={<JobsManager />} />
                <Route path="content" element={<ContentCMS />} />
                <Route path="support" element={<SupportManager />} />
                <Route path="settings" element={<SettingsCMS />} />
                <Route path="guide" element={<AdminGuide />} />
                <Route path="users" element={<StaffRBAC />} />
              </Route>

              {/* Universal Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          {/* Global Floating Admissions & Support Widgets */}
          <WhatsAppButton />
          <AIChatbox />

          {/* Global Floating Interactive Design Switcher (Hidden in production client view) */}
          {typeof window !== 'undefined' && window.location.search.includes('showSwitcher=1') && (
            <ThemeSwitcher />
          )}
        </SiteSettingsProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
