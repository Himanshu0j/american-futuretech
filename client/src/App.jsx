import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ThemeSwitcher from './components/ThemeSwitcher';
import PageSkeleton from './components/PageSkeleton';
import WhatsAppButton from './components/WhatsAppButton';
import AIChatbox from './components/AIChatbox';
import CookieConsent from './components/CookieConsent';
import SiteEditor from './components/SiteEditor';
import SiteOverridesApplier from './components/SiteOverridesApplier';
import ScrollReveal from './components/ScrollReveal';
import useCompanyInfo from './hooks/useCompanyInfo';
import { ThemeModeProvider } from './context/ThemeModeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteSettingsProvider, useSiteSettings } from './context/SiteSettingsContext';

// The marketing homepage is its own chunk: the student portal must not parse
// every hero/journey/mentor/roadmap section before it can show a login form.
const HomePage = lazy(() => import('./pages/HomePage'));

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
const MyClasses = lazy(() => import('./lms/MyClasses'));
const ClassroomRoom = lazy(() => import('./lms/ClassroomRoom'));
const MyQuizzes = lazy(() => import('./lms/MyQuizzes'));
const MyAssignments = lazy(() => import('./lms/MyAssignments'));
const Grades = lazy(() => import('./lms/Grades'));
const StudentCalendar = lazy(() => import('./lms/StudentCalendar'));
const Transcript = lazy(() => import('./lms/Transcript'));
const Notifications = lazy(() => import('./lms/Notifications'));
const Leaderboard = lazy(() => import('./lms/Leaderboard'));
const Badges = lazy(() => import('./lms/Badges'));
const MyJobs = lazy(() => import('./lms/MyJobs'));
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
const CouponsManager = lazy(() => import('./admin/CouponsManager'));
const FooterManager = lazy(() => import('./admin/FooterManager'));
const HeaderManager = lazy(() => import('./admin/HeaderManager'));
const JobsManager = lazy(() => import('./admin/JobsManager'));
const ContentCMS = lazy(() => import('./admin/ContentCMS'));
const SupportManager = lazy(() => import('./admin/SupportManager'));
const SettingsCMS = lazy(() => import('./admin/SettingsCMS'));
const WebsiteEditor = lazy(() => import('./admin/WebsiteEditor'));
const StaffRBAC = lazy(() => import('./admin/StaffRBAC'));
const AdminGuide = lazy(() => import('./admin/AdminGuide'));
const IssueReports = lazy(() => import('./admin/IssueReports'));
const MediaLibrary = lazy(() => import('./admin/MediaLibrary'));
const CookieConsents = lazy(() => import('./admin/CookieConsents'));

// Academy / LMS control centre
const LmsDashboard = lazy(() => import('./admin/lms/LmsDashboard'));
const LmsPortal = lazy(() => import('./admin/lms/LmsPortal'));
const CourseBatches = lazy(() => import('./admin/lms/CourseBatches'));
const BatchWorkspace = lazy(() => import('./admin/lms/BatchWorkspace'));
const CurriculumBuilder = lazy(() => import('./admin/lms/CurriculumBuilder'));
const AssessmentsManager = lazy(() => import('./admin/lms/AssessmentsManager'));
const EnrollmentsManager = lazy(() => import('./admin/lms/EnrollmentsManager'));
const ProgressTracker = lazy(() => import('./admin/lms/ProgressTracker'));
const CertificatesManager = lazy(() => import('./admin/lms/CertificatesManager'));
const LmsCommunications = lazy(() => import('./admin/lms/LmsCommunications'));
const LmsSettings = lazy(() => import('./admin/lms/LmsSettings'));

/**
 * Real maintenance gate for the admin's "Maintenance mode" switch.
 * Visitors see this screen; /admin and /student keep working so staff can turn it back off.
 */
function MaintenanceScreen() {
  const { settings } = useSiteSettings();
  const company = useCompanyInfo();
  const path = window.location.pathname;
  const isStaffArea = path.startsWith('/admin') || path.startsWith('/student');

  if (settings?.isMaintenanceMode !== true || isStaffArea) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-[#001845] flex items-center justify-center px-6">
      <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-[#002060] p-10 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-300 flex items-center justify-center mx-auto font-black">
          AF
        </div>
        <h1 className="text-2xl font-black text-white font-heading">We'll be right back</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {company.siteName} is doing a quick scheduled update. Please check back in a few minutes.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
          <a href={company.phoneHref} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white">
            {company.phone}
          </a>
          <a href={company.emailHref} className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white break-all">
            {company.email}
          </a>
        </div>
      </div>
    </div>
  );
}

function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#001845] flex items-center justify-center text-blue-400 font-mono text-sm">
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
  const { isAuthenticated, loading } = useAuth();

  // Wait for /auth/me before rendering the portal shell. Rendering immediately
  // showed the "Ethan Hunt" placeholder strip until the request resolved, which
  // read as "student ka naam/photo nahi aa raha".
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-slate-500 font-mono text-sm">
        Loading your classroom…
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/student/login" replace />;
  }
  return children;
}

/**
 * Admissions & support widgets belong to the public site and the student LMS.
 *
 * They used to be mounted globally, so the AI chat box and the WhatsApp button
 * also floated over the admin panel — the exact widget the client asked to keep
 * out of admin.
 */
function PublicFloatingWidgets() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;
  return (
    <>
      <WhatsAppButton />
      <AIChatbox />
    </>
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
              <Route path="/" element={<HomePage />} />
              <Route path="/old-ui" element={<HomePage />} />
              <Route path="/cyber" element={<HomePage />} />
              <Route path="/apple-ui" element={<HomePage />} />

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
                <Route path="classes" element={<MyClasses />} />
                {/* The room a class plays in — not a link out to YouTube. */}
                <Route path="classes/:classId" element={<ClassroomRoom />} />
                <Route path="quizzes" element={<MyQuizzes />} />
                <Route path="assignments" element={<MyAssignments />} />
                <Route path="grades" element={<Grades />} />
                <Route path="calendar" element={<StudentCalendar />} />
                <Route path="transcript" element={<Transcript />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="badges" element={<Badges />} />
                <Route path="jobs" element={<MyJobs />} />
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
                <Route path="coupons" element={<CouponsManager />} />
                <Route path="footer" element={<FooterManager />} />
                <Route path="header" element={<HeaderManager />} />
                <Route path="jobs" element={<JobsManager />} />
                <Route path="content" element={<ContentCMS />} />
                <Route path="support" element={<SupportManager />} />
                <Route path="settings" element={<SettingsCMS />} />
                <Route path="website-editor" element={<WebsiteEditor />} />
                <Route path="issues" element={<IssueReports />} />
                <Route path="media" element={<MediaLibrary />} />
                <Route path="consent" element={<CookieConsents />} />
                <Route path="guide" element={<AdminGuide />} />
                <Route path="users" element={<StaffRBAC />} />

                {/* Academy / LMS control centre */}
                <Route path="lms" element={<LmsDashboard />} />
                <Route path="lms/portal" element={<LmsPortal />} />
                <Route path="lms/portal/:courseId" element={<CourseBatches />} />
                <Route path="lms/portal/:courseId/batches/:batchId" element={<BatchWorkspace />} />
                <Route path="lms/curriculum" element={<CurriculumBuilder />} />
                <Route path="lms/quizzes" element={<AssessmentsManager />} />
                <Route path="lms/enrollments" element={<EnrollmentsManager />} />
                <Route path="lms/progress" element={<ProgressTracker />} />
                <Route path="lms/certificates" element={<CertificatesManager />} />
                <Route path="lms/communications" element={<LmsCommunications />} />
                <Route path="lms/settings" element={<LmsSettings />} />
              </Route>

              {/* Universal Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          {/* Scroll-linked reveal for every public page. Renders nothing and
              only sets attributes, so the inline editor's DOM keys survive —
              see lib/scrollReveal.js. Admin and the student LMS opt out. */}
          <ScrollReveal />

          {/* Global Floating Admissions & Support Widgets (public + LMS only) */}
          <PublicFloatingWidgets />

          {/* Cookie choice — it records the decision, it never blocks the page */}
          <CookieConsent />

          {/* Shows the maintenance screen to visitors when the admin switches it on */}
          <MaintenanceScreen />

          {/* Renders admin text/image edits for every visitor (mount order matters: apply, then edit) */}
          <SiteOverridesApplier />

          {/* Inline site editor — only renders for a signed-in admin on ?edit=1 */}
          <SiteEditor />

          {/* Global Floating Interactive Design Switcher (Hidden in production client view) */}
          {typeof window !== 'undefined' && window.location.search.includes('showSwitcher=1') && (
            <ThemeSwitcher />
          )}
        </SiteSettingsProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
