import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play, CheckCircle2, ChevronRight, ChevronLeft, Download, Award,
  HelpCircle, BookOpen, Clock, FileText, Check, Lock, ArrowLeft,
  Sparkles, ExternalLink, X, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';

export default function LessonPlayer() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'resources'
  const [completing, setCompleting] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);

  // Quiz Modal State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  useEffect(() => {
    fetchCourseLearn();
  }, [courseId]);

  const fetchCourseLearn = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/lms/courses/${courseId}/learn`);
      if (res.data.success) {
        setData(res.data);
        const completed = res.data.progress?.completedLessons || [];
        setCompletedLessonIds(completed);
        setProgressPercent(res.data.progress?.progressPercent || 0);

        // Determine which lesson to open: lastAccessedLesson or first incomplete or first lesson
        const allLessons = [];
        res.data.curriculum?.forEach(m => {
          m.lessons?.forEach(l => allLessons.push(l));
        });

        const lastId = res.data.progress?.lastAccessedLesson;
        const targetLesson = (lastId && allLessons.find(l => l._id === lastId)) ||
          allLessons.find(l => !completed.includes(l._id)) ||
          allLessons[0];

        setActiveLesson(targetLesson);
      }
    } catch (err) {
      console.error('Failed to load course player data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkComplete = async () => {
    if (!activeLesson) return;
    try {
      setCompleting(true);
      const res = await axios.post(`/api/lms/lessons/${activeLesson._id}/complete`);
      if (res.data.success) {
        setCompletedLessonIds(res.data.completedLessons || []);
        setProgressPercent(res.data.progressPercent);

        if (res.data.progressPercent === 100) {
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error('Failed to mark lesson complete', err);
    } finally {
      setCompleting(false);
    }
  };

  // Find next and previous lessons across modules
  const getAllLessonsFlat = () => {
    const flat = [];
    data?.curriculum?.forEach(m => {
      m.lessons?.forEach(l => flat.push(l));
    });
    return flat;
  };

  const flatLessons = getAllLessonsFlat();
  const currentIndex = flatLessons.findIndex(l => l?._id === activeLesson?._id);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  const isCurrentCompleted = completedLessonIds.includes(activeLesson?._id);

  // Quiz Handling
  const handleOpenQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    try {
      setSubmittingQuiz(true);
      const formattedAnswers = Object.entries(quizAnswers).map(([questionId, selectedOptionIndex]) => ({
        questionId,
        selectedOptionIndex,
      }));

      const res = await axios.post(`/api/lms/quizzes/${activeQuiz._id}/submit`, {
        answers: formattedAnswers,
        timeSpentSeconds: 120,
      });

      if (res.data.success) {
        setQuizResult(res.data);
        if (res.data.passed) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grade quiz.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-slate-900 flex flex-col antialiased">
        <header className="h-16 bg-[#0B1220] border-b border-[#0B1220] px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white/20" />
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-white/20 rounded" />
              <div className="h-2.5 w-24 bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-8 w-28 bg-white/20 rounded-full animate-pulse" />
        </header>
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 p-6 flex flex-col space-y-4 animate-pulse">
            <div className="w-full aspect-video rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-slate-400 fill-current" />
              </div>
            </div>
            <div className="h-6 w-1/3 bg-slate-200 rounded-lg" />
            <div className="h-4 w-2/3 bg-slate-100 rounded" />
          </div>
          <div className="w-full lg:w-96 border-l border-slate-200 bg-white p-5 space-y-4 animate-pulse hidden lg:block">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl border border-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data?.course) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-heading font-bold text-[#0B1220] mb-2">Course Curriculum Unavailable</h2>
        <p className="text-slate-600 text-sm max-w-md mb-6">
          We could not load the course modules. You may not be enrolled in this cohort or the program is being updated.
        </p>
        <Link
          to="/student/courses"
          className="px-6 py-2.5 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold transition-colors shadow-xs"
        >
          Return to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-slate-900 flex flex-col antialiased">
      {/* Top Navbar - Easy LMS Deep Green Executive Bar */}
      <header className="h-16 bg-[#0B1220] border-b border-[#0B1220] px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/student/dashboard"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-heading font-bold text-white truncate">
              {data?.course?.title}
            </h1>
            <div className="text-[11px] text-slate-300 truncate">
              Lesson {currentIndex + 1} of {flatLessons.length}: {activeLesson?.title}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Course Progress</div>
              <div className="text-xs font-bold text-[#E5C275]">{progressPercent}% Completed</div>
            </div>
            <div className="w-24 bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="bg-[#E5C275] h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {progressPercent === 100 && (
            <Link
              to="/student/certificates"
              className="py-1.5 px-4 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Award className="w-4 h-4" />
              Claim Certificate
            </Link>
          )}
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Column: Interactive Curriculum Drawer */}
        <aside className="w-full lg:w-80 lg:shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col max-h-[40vh] lg:max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xs">
          <div className="p-4 border-b border-slate-100 font-heading font-bold text-xs uppercase tracking-wider text-[#0B1220]">
            Course Curriculum ({data?.curriculum?.length} Modules)
          </div>

          <div className="divide-y divide-slate-100">
            {data?.curriculum?.map((mod, mIdx) => (
              <div key={mod._id || mIdx} className="p-3">
                <div className="px-2 py-1.5 text-xs font-bold text-[#4338CA] flex items-center justify-between">
                  <span>Module 0{mod.moduleNumber}: {mod.title}</span>
                </div>

                <div className="space-y-1 mt-1">
                  {mod.lessons?.map((lesson) => {
                    const isSelected = activeLesson?._id === lesson._id;
                    const isDone = completedLessonIds.includes(lesson._id);
                    return (
                      <button
                        key={lesson._id}
                        onClick={() => handleSelectLesson(lesson)}
                        className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#F7F7F5] text-[#0B1220] border-2 border-[#0B1220] font-bold shadow-xs'
                            : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-[#4338CA] shrink-0" />
                          ) : (
                            <Play className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#0B1220] fill-current' : 'text-slate-400'}`} />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{lesson.videoDuration || '45m'}</span>
                      </button>
                    );
                  })}

                  {/* Module Quiz Button */}
                  {mod.quiz && (
                    <button
                      onClick={() => handleOpenQuiz(mod.quiz)}
                      className="w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-2 bg-[#fcf5fa] hover:bg-[#faeaf6] text-[#4338CA] border border-[#4338CA]/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#4338CA] shrink-0" />
                        <span className="font-bold">{mod.quiz.title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#4338CA] uppercase">Test</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center & Right Column: Content Player & Resources */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Video Player Box */}
          <div className="w-full bg-black aspect-video max-h-[55vh] flex items-center justify-center relative">
            {activeLesson?.videoUrl ? (
              <iframe
                src={activeLesson.videoUrl}
                title={activeLesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center p-8 text-slate-400">
                <Play className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">Video content ready for playback.</p>
              </div>
            )}
          </div>

          {/* Navigation Controls Bar */}
          <div className="p-4 sm:p-5 bg-white border-y border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                disabled={!prevLesson}
                className="py-2 px-4 rounded-full bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                disabled={!nextLesson}
                className="py-2 px-4 rounded-full bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkComplete}
                disabled={completing}
                className={`py-2 px-5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isCurrentCompleted
                    ? 'bg-[#EFE6D6] text-[#0B1220] border border-[#E5C275]/40'
                    : 'bg-[#4338CA] hover:bg-[#0B1220] text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                {isCurrentCompleted ? 'Completed' : 'Mark as Complete'}
              </button>
            </div>
          </div>

          {/* Lesson Notes & Resource Tabs */}
          <div className="p-6 sm:p-8 max-w-5xl space-y-6">
            <div className="flex gap-4 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveTab('overview')}
                className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'text-[#0B1220] border-b-2 border-[#0B1220]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Lesson Overview & Notes
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors cursor-pointer ${
                  activeTab === 'resources'
                    ? 'text-[#0B1220] border-b-2 border-[#0B1220]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Lab Resources ({activeLesson?.resources?.length || 0})
              </button>
            </div>

            {activeTab === 'overview' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-heading font-bold text-[#0B1220]">{activeLesson?.title}</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeLesson?.description}
                </p>
                {activeLesson?.textContent && (
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-3 shadow-xs leading-relaxed">
                    {activeLesson.textContent.split('\n\n').map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {!activeLesson?.resources?.length ? (
                  <div className="p-6 rounded-2xl bg-white border border-dashed border-slate-300 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-[#0B1220]">No resources attached to this lesson</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Your instructor has not added slides or starter files for this lesson yet.
                    </p>
                  </div>
                ) : (
                  activeLesson.resources.map((res, i) => (
                    <div
                      key={res._id || i}
                      className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] text-[#4338CA] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0B1220]">{res.title}</div>
                          <div className="text-[10px] text-slate-500">{res.fileType} • {res.fileSize}</div>
                        </div>
                      </div>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-4 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveQuiz(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[11px] font-bold text-[#0B1220] uppercase tracking-wider bg-[#EFE6D6] px-3 py-1 rounded-full border border-[#E5C275]/40">
                Module Assessment
              </span>
              <h2 className="text-2xl font-heading font-black text-[#0B1220] mt-3">{activeQuiz.title}</h2>
              <p className="text-xs text-slate-600 mt-1">{activeQuiz.description || 'Answer all questions to validate module competency.'}</p>
            </div>

            {quizResult ? (
              /* Quiz Result Review */
              <div className="space-y-6">
                <div className={`p-6 rounded-2xl text-center border ${
                  quizResult.passed
                    ? 'bg-[#EFE6D6] border-[#E5C275]/40 text-[#0B1220]'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="text-4xl font-heading font-black mb-1">{quizResult.scorePercent}%</div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {quizResult.passed ? '🎉 You Passed This Assessment!' : 'Attempt Not Passed (Needs 70%)'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 font-medium">
                    Correct: {quizResult.correctAnswersCount} / {quizResult.totalQuestions}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Detailed Question Breakdown:</h4>
                  {quizResult.evaluatedAnswers?.map((ans, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="font-bold text-[#0B1220] flex items-start gap-2">
                        {ans.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <span>{ans.questionText}</span>
                      </div>
                      {ans.explanation && (
                        <div className="text-[11px] text-slate-600 pl-6 bg-white p-2.5 rounded-lg border border-slate-200">
                          <strong className="text-[#0B1220]">Explanation:</strong> {ans.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                  className="w-full py-3 rounded-full bg-white hover:bg-slate-50 border-2 border-[#0B1220] text-[#0B1220] text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Retake Assessment
                </button>
              </div>
            ) : (
              /* Quiz Question Runner */
              <div className="space-y-6">
                {activeQuiz.questions?.map((q, qIdx) => (
                  <div key={q._id || qIdx} className="p-5 rounded-2xl bg-[#F7F7F5] border border-slate-200 space-y-3 shadow-xs">
                    <div className="font-bold text-sm text-[#0B1220] flex items-start gap-2">
                      <span className="text-[#4338CA] font-mono font-bold">Q{qIdx + 1}.</span>
                      <span>{q.questionText}</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {q.options?.map((opt, oIdx) => {
                        const isSelected = quizAnswers[q._id] === oIdx;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectOption(q._id, oIdx)}
                            className={`w-full p-3.5 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-white border-2 border-[#0B1220] text-[#0B1220] font-bold shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#4338CA]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmitQuiz}
                  disabled={submittingQuiz || Object.keys(quizAnswers).length < (activeQuiz.questions?.length || 1)}
                  className="w-full py-3.5 px-6 rounded-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingQuiz ? 'Grading Answers...' : 'Submit Assessment for Grading'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
