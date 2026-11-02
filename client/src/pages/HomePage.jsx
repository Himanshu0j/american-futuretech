import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HomeVideoShowcase from '../components/HomeVideoShowcase';
import WhatIsSection from '../components/WhatIsSection';
import MetricsStrip from '../components/MetricsStrip';
import TrustMarquee from '../components/TrustMarquee';
import CourseSection from '../components/CourseSection';
import PopularCategoriesSection from '../components/PopularCategoriesSection';
import LearnerVoicesSection from '../components/LearnerVoicesSection';
import MentorsSection from '../components/MentorsSection';
import StudyAnywhereSection from '../components/StudyAnywhereSection';
import DifferentiatorsSection from '../components/DifferentiatorsSection';
import GrowthSection from '../components/GrowthSection';
import AdmissionStepsSection from '../components/AdmissionStepsSection';
import BrandBand from '../components/BrandBand';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer';
import LeadModal from '../components/LeadModal';
import SyllabusModal from '../components/SyllabusModal';
import AmbientBackground from '../components/AmbientBackground';
import LearningJourney from '../components/LearningJourney';
import ToolsSection from '../components/ToolsSection';
import PlacementRoadmap from '../components/PlacementRoadmap';
import PersonalizedLearningSection from '../components/PersonalizedLearningSection';
import FaqAccordion from '../components/common/FaqAccordion';
import { useThemeMode } from '../context/ThemeModeContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

/**
 * Public marketing homepage.
 *
 * This is a separate route chunk on purpose: the homepage pulls in every
 * marketing section (hero, journey, mentors, tools, roadmap, modals), and the
 * student portal used to download and parse all of it before showing a login
 * form. The portal only needs the app shell and its own portal pages.
 */
export default function HomePage() {
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
    <div className="min-h-screen bg-canvas dark:bg-ink-950 text-ink-900 dark:text-slate-100 font-sans antialiased relative overflow-x-hidden pt-16 md:pt-24">
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

        {/* Client promo video — optional cinema-framed band under the hero. The
            hero's own Flagship Studio frame plays the clip as well, so this band
            is off in the CMS by default (Section Visibility → 2.) to keep the
            same footage from running twice in the first two screens. */}
        {visibility.videoShowcase === true && <HomeVideoShowcase />}

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

        {/* Sketched category cards — the fastest route from "what do you teach?"
            to the full catalogue. */}
        {visibility.popularCategories !== false && <PopularCategoriesSection />}

        {/* Dedicated 1-on-1 Personalized Learning Track ($2,199 Independent Offering) */}
        {visibility.personalizedLearning !== false && (
          <PersonalizedLearningSection onOpenLeadModal={() => handleOpenLeadModal(null)} />
        )}

        {/* Myth-vs-facts trust block ("What American FutureTech Is - And Is Not") */}
        {visibility.whatIs !== false && <WhatIsSection />}

        {/* 40+ Industry Tools & Technologies Showcase (Real Database Data) */}
        {visibility.tools !== false && <ToolsSection />}

        {/* 8-Step Roadmap & 5 Proven Steps to Career Transformation (Verbatim Client Copy) */}
        {visibility.roadmap !== false && (
          <PlacementRoadmap onOpenLeadModal={() => handleOpenLeadModal(null)} />
        )}

        {/* The "Product & Learning Architecture" showcase that used to sit here
            (the Turbocharge heading plus stories 01–04) was removed at the
            client's request — the home page skips straight from the roadmap to the
            brand band. The component file is kept because its certified
            credential mock is the reference for the /certificate page. */}

        {/* Sliding brand band — the company name and the disciplines it teaches
            run past each other between the showcase and the FAQ.
            It replaces the old admin-managed photo showcase, which the client
            asked to take off the homepage. */}
        <BrandBand />

        {/* Flexibility, faculty and the four-pillar difference — the trust block
            that sits between the product showcase and the FAQ. New sections are
            opt-out through Section Visibility, so an existing site keeps them
            until the client turns one off. */}
        {visibility.studyAnywhere !== false && <StudyAnywhereSection />}
        {visibility.mentors !== false && <MentorsSection />}
        {visibility.growth !== false && <GrowthSection />}
        {/* Alumni quotes in speech bubbles, read from the CMS stories. */}
        {visibility.learnerVoices !== false && <LearnerVoicesSection />}
        {visibility.differentiators !== false && <DifferentiatorsSection />}
        {visibility.admissionSteps !== false && <AdmissionStepsSection />}

        {/* Comprehensive Academic & Program FAQs */}
        {visibility.faqs !== false && (
          <section id="faqs" className="aft-cloud py-12 sm:py-16 bg-white dark:bg-slate-900/50 border-t border-slate-200/80 dark:border-slate-800/80 relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
              <FaqAccordion
                showCategoryFilter={true}
                title="Frequently Asked Questions"
                subtitle="Everything you need to know about our curriculum, the seat reservation, 1-on-1 mentorship, and corporate hiring."
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
