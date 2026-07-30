'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, Sparkles, CheckCircle2, AlertTriangle, 
  Calendar, Clock, BookOpen, ArrowRight, ArrowLeft, 
  Plus, Trash2, Edit3, Check, RefreshCw, Layers, FileText, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  AIParsingResult, AIExtractedSubject, AIExtractedSlot, AIExtractedHoliday, 
  Subject, TimetableSlot, AcademicHoliday 
} from '@/types';
import { saveConfirmedScheduleToDemo, updateDemoSemesterConfig } from '@/lib/demo-store';
import { saveOnboardingData, getUserProfile, updateSemesterConfig } from '@/actions/db';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<'UPLOAD' | 'PROCESSING' | 'REVIEW' | 'SUCCESS'>('UPLOAD');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Form State
  const [targetPercentage, setTargetPercentage] = useState<number>(75);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(new Date().getTime() + 86400000 * 120).toISOString().split('T')[0]
  );
  const [initialTarget, setInitialTarget] = useState<number>(75);
  const [initialStart, setInitialStart] = useState<string>(startDate);
  const [initialEnd, setInitialEnd] = useState<string>(endDate);

  // Load saved preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      if (typeof window !== 'undefined') {
        const savedTarget = localStorage.getItem('skiply_onboarding_target');
        if (savedTarget) {
          setTargetPercentage(Number(savedTarget));
          setInitialTarget(Number(savedTarget));
        }
        const savedStart = localStorage.getItem('skiply_onboarding_start');
        if (savedStart) {
          setStartDate(savedStart);
          setInitialStart(savedStart);
        }
        const savedEnd = localStorage.getItem('skiply_onboarding_end');
        if (savedEnd) {
          setEndDate(savedEnd);
          setInitialEnd(savedEnd);
        }
      }
      
      try {
        const profile = await getUserProfile();
        if (profile) {
          if (profile.target_attendance_percentage) {
            setTargetPercentage(Number(profile.target_attendance_percentage));
            setInitialTarget(Number(profile.target_attendance_percentage));
          }
          if (profile.semester_start_date) {
            setStartDate(profile.semester_start_date);
            setInitialStart(profile.semester_start_date);
          }
          if (profile.semester_end_date) {
            setEndDate(profile.semester_end_date);
            setInitialEnd(profile.semester_end_date);
          }
        }
      } catch (e) {
        // Ignore auth errors on mount
      }
    }
    loadPreferences();
  }, []);

  // Save preferences on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('skiply_onboarding_target', targetPercentage.toString());
      localStorage.setItem('skiply_onboarding_start', startDate);
      localStorage.setItem('skiply_onboarding_end', endDate);
    }
  }, [targetPercentage, startDate, endDate]);

  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const handleUpdateConfig = async () => {
    setIsUpdatingConfig(true);
    setToastMessage(null);
    try {
      const profile = await getUserProfile();
      if (profile) {
        await updateSemesterConfig(targetPercentage, startDate, endDate);
      } else {
        updateDemoSemesterConfig(targetPercentage, startDate, endDate);
      }
      setInitialTarget(targetPercentage);
      setInitialStart(startDate);
      setInitialEnd(endDate);
      setToastMessage('Semester configuration updated successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Failed to update configuration.');
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const hasConfigChanges = targetPercentage !== initialTarget || startDate !== initialStart || endDate !== initialEnd;

  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [calendarFile, setCalendarFile] = useState<File | null>(null);
  const [timetablePreview, setTimetablePreview] = useState<string | null>(null);
  const [calendarPreview, setCalendarPreview] = useState<string | null>(null);
  
  // AI Extraction State
  const [isMocking, setIsMocking] = useState<boolean>(false);
  const [extractionResult, setExtractionResult] = useState<AIParsingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'SLOTS' | 'HOLIDAYS'>('SUBJECTS');
  
  // Editable Lists in Review Step
  const [subjects, setSubjects] = useState<AIExtractedSubject[]>([]);
  const [slots, setSlots] = useState<AIExtractedSlot[]>([]);
  const [holidays, setHolidays] = useState<AIExtractedHoliday[]>([]);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'TIMETABLE' | 'CALENDAR') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      if (type === 'TIMETABLE') {
        setTimetableFile(file);
        setTimetablePreview(b64);
      } else {
        setCalendarFile(file);
        setCalendarPreview(b64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger AI Extraction
  const startAIProcessing = async (useMock = false) => {
    setIsMocking(useMock);
    setStep('PROCESSING');

    try {
      const response = await fetch('/api/extract-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timetableImage: timetablePreview,
          calendarImage: calendarPreview,
          useMock: useMock || (!timetablePreview && !calendarPreview)
        }),
      });

      const data: AIParsingResult = await response.json();
      setExtractionResult(data);
      setSubjects(data.subjects || []);
      setSlots(data.timetable_slots || []);
      setHolidays(data.academic_holidays || []);

      // Transition to Review step after a short aesthetic animation delay
      setTimeout(() => {
        setStep('REVIEW');
      }, 1500);

    } catch (err) {
      console.error(err);
      alert('Failed to parse schedule. Please try again.');
      setStep('UPLOAD');
    }
  };

  // Save Confirmed Schedule
  const handleConfirmAndSave = async () => {
    setIsSaving(true);
    setToastMessage(null);

    // Map AI extracted items to permanent UI entities
    const finalSubjects: Subject[] = subjects.map(s => ({
      id: s.temp_id,
      user_id: 'demo-user-id-1234',
      subject_code: s.subject_code,
      subject_name: s.subject_name,
      is_lab: s.is_lab,
      credit_hours: s.credit_hours,
      color_hex: s.is_lab ? '#8b5cf6' : '#6366f1',
    }));

    const finalSlots: TimetableSlot[] = slots.map((sl, idx) => ({
      id: `slot-${idx + 1}`,
      user_id: 'demo-user-id-1234',
      subject_id: sl.subject_temp_id,
      day_of_week: sl.day_of_week,
      start_time: sl.start_time,
      end_time: sl.end_time,
      room_number: sl.room_number || 'TBA',
    }));

    const finalHolidays: AcademicHoliday[] = holidays.map((h, idx) => ({
      id: `hol-${idx + 1}`,
      user_id: 'demo-user-id-1234',
      holiday_date: h.holiday_date,
      description: h.description,
      is_exam_day: h.is_exam_day,
    }));

    // Save to demo store as local fallback
    saveConfirmedScheduleToDemo(
      finalSubjects,
      finalSlots,
      finalHolidays,
      targetPercentage,
      startDate,
      endDate
    );

    // Prepare payload for Supabase cloud DB
    const payload = {
      subjects: subjects.map(s => ({
        code: s.subject_code,
        name: s.subject_name,
        is_lab: s.is_lab,
      })),
      slots: slots.map(sl => {
        const subj = subjects.find(s => s.temp_id === sl.subject_temp_id);
        return {
          subject_code: subj ? subj.subject_code : '',
          day_of_week: sl.day_of_week,
          start_time: sl.start_time,
          end_time: sl.end_time,
          room: sl.room_number || '',
        };
      }).filter(sl => sl.subject_code),
      holidays: holidays.map(h => ({
        date: h.holiday_date,
        name: h.description,
      })),
      startDate,
      endDate,
    };

    try {
      await saveOnboardingData(payload);
    } catch (e: any) {
      // If student is testing in Demo Mode without cloud auth, quietly proceed with local demo save
      console.log('Cloud DB save skipped (Demo Mode or unauthenticated):', e);
      if (e?.message && !e.message.includes('Not authenticated')) {
        console.error('Supabase save error during AI onboarding:', e.message);
      }
    }

    setIsSaving(false);
    setToastMessage('Schedule saved successfully!');
    setStep('SUCCESS');
    
    // Celebrate with confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  // Edit Subject Field
  const updateSubject = (id: string, field: keyof AIExtractedSubject, val: any) => {
    setSubjects(prev => prev.map(s => s.temp_id === id ? { ...s, [field]: val } : s));
  };

  // Edit Slot Field
  const updateSlot = (id: string, field: keyof AIExtractedSlot, val: any) => {
    setSlots(prev => prev.map(sl => sl.temp_id === id ? { ...sl, [field]: val } : sl));
  };

  // Edit Holiday Field
  const updateHoliday = (id: string, field: keyof AIExtractedHoliday, val: any) => {
    setHolidays(prev => prev.map(h => h.temp_id === id ? { ...h, [field]: val } : h));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-success text-white font-bold text-sm shadow-2xl flex items-center gap-2.5 border border-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5 animate-bounce" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wizard Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>AI Onboarding Wizard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          Set Up Your Semester in 60 Seconds
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Upload your timetable and calendar. Vision AI will extract subjects, timings, and holidays automatically so you never do manual data entry.
        </p>
      </div>

      {/* Progress Steps Bar */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
        {[
          { id: 'UPLOAD', label: '1. Upload Schedule' },
          { id: 'PROCESSING', label: '2. AI Extraction' },
          { id: 'REVIEW', label: '3. Verify Grid' },
          { id: 'SUCCESS', label: '4. Ready!' }
        ].map((item, idx) => {
          const isActive = step === item.id;
          const isDone = (step === 'PROCESSING' && idx === 0) || 
                         (step === 'REVIEW' && idx <= 1) || 
                         (step === 'SUCCESS' && idx <= 2);
          return (
            <div key={item.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive ? 'bg-slate-100 text-slate-900 shadow-sm' :
                isDone ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                'bg-slate-800 text-slate-500'
              }`}>
                {isDone && <Check className="w-3 h-3" />}
                <span>{item.label}</span>
              </div>
              {idx < 3 && <div className="w-4 h-0.5 bg-surface-secondary" />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: UPLOAD */}
        {step === 'UPLOAD' && (
          <motion.div 
            key="step-upload"
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Quick Demo Button */}
            <div className="glass-card premium-gradient-border p-4 rounded-2xl bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Want to test instantly without uploading?</h3>
                  <p className="text-xs text-slate-400">Try our AI Demo Mode with pre-loaded college timetable & calendar images.</p>
                </div>
              </div>
              <button 
                onClick={() => startAIProcessing(true)}
                className="btn-interactive w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-50 text-slate-950 font-bold text-sm shadow-sm flex items-center justify-center gap-2"
              >
                <span>⚡ Auto-Fill Demo Schedule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timetable Upload Zone */}
              <div className="glass-card card-interactive p-6 rounded-2xl border-dashed border-2 border-slate-700 hover:border-teal-500/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <input 
                  type="file" 
                  accept="image/*,.pdf,application/pdf"
                  onChange={(e) => handleFileChange(e, 'TIMETABLE')} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {timetablePreview ? (
                  <div className="space-y-3 w-full">
                    {timetablePreview.startsWith('data:application/pdf') || timetableFile?.type === 'application/pdf' ? (
                      <div className="h-40 w-full rounded-xl border border-slate-700 bg-slate-900/80 flex flex-col items-center justify-center gap-2 p-4 text-teal-300">
                        <FileText className="w-10 h-10 text-teal-400" />
                        <span className="text-xs font-semibold truncate max-w-full text-white">{timetableFile?.name || 'Timetable PDF'}</span>
                        <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase">PDF Ready for AI</span>
                      </div>
                    ) : (
                      <img src={timetablePreview} alt="Timetable preview" className="h-40 w-full object-cover rounded-xl border border-border" />
                    )}
                    <p className="text-xs font-semibold text-success flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Timetable document ready
                    </p>
                  </div>
                ) : (
                  <div className="py-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-teal-400 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Upload Class Timetable</h4>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, or PDF document of notice board</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Academic Calendar Upload Zone */}
              <div className="glass-card card-interactive p-6 rounded-2xl border-dashed border-2 border-slate-700 hover:border-teal-500/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <input 
                  type="file" 
                  accept="image/*,.pdf,application/pdf"
                  onChange={(e) => handleFileChange(e, 'CALENDAR')} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {calendarPreview ? (
                  <div className="space-y-3 w-full">
                    {calendarPreview.startsWith('data:application/pdf') || calendarFile?.type === 'application/pdf' ? (
                      <div className="h-40 w-full rounded-xl border border-slate-700 bg-slate-900/80 flex flex-col items-center justify-center gap-2 p-4 text-sky-300">
                        <FileText className="w-10 h-10 text-sky-400" />
                        <span className="text-xs font-semibold truncate max-w-full text-white">{calendarFile?.name || 'Calendar PDF'}</span>
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-bold uppercase">PDF Ready for AI</span>
                      </div>
                    ) : (
                      <img src={calendarPreview} alt="Calendar preview" className="h-40 w-full object-cover rounded-xl border border-border" />
                    )}
                    <p className="text-xs font-semibold text-success flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Academic calendar ready
                    </p>
                  </div>
                ) : (
                  <div className="py-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-sky-400 group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Upload Holiday Lists</h4>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, or PDF document of college calendar</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Semester Parameters Card */}
            <div className="card bg-surface shadow-sm p-6 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  <span>Semester Configuration</span>
                </h3>
                <button
                  onClick={handleUpdateConfig}
                  disabled={!hasConfigChanges || isUpdatingConfig}
                  className={`btn-interactive px-4 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2
                    ${(!hasConfigChanges && !isUpdatingConfig) 
                      ? 'bg-slate-800 text-slate-500 border border-slate-700' 
                      : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'
                    }
                  `}
                >
                  {isUpdatingConfig ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : hasConfigChanges ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Update Config</span>
                    </>
                  ) : (
                    <span>No Changes</span>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Semester Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-interactive w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Semester End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-interactive w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end">
              <button 
                onClick={() => startAIProcessing(false)}
                disabled={!timetablePreview && !calendarPreview}
                className={`btn-interactive px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm ${
                  (!timetablePreview && !calendarPreview) 
                    ? 'bg-slate-800 text-slate-500 border border-slate-700' 
                    : 'bg-slate-50 text-slate-950'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Extract With AI</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: PROCESSING */}
        {step === 'PROCESSING' && (
          <motion.div 
            key="step-processing"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-12 rounded-2xl text-center space-y-6 max-w-md mx-auto my-12 border-white/5"
          >
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-teal-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-teal-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Vision AI is Parsing Schedule</h3>
              <p className="text-xs text-slate-400">
                {isMocking ? 'Simulating extraction of 5 subjects, 11 weekly slots, and 3 holidays...' : 'Analyzing grid columns, resolving course abbreviations, and mapping lab hours...'}
              </p>
            </div>
          </motion.div>
        )}

        {/* STEP 3: INTERACTIVE REVIEW GRID */}
        {step === 'REVIEW' && (
          <motion.div 
            key="step-review"
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Banner */}
            <div className="glass-card p-4 rounded-2xl bg-teal-500/5 border-teal-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-teal-300 text-sm">{extractionResult?.summary_message}</h4>
                  <p className="text-xs text-teal-500/70">Please review and edit any cells below before finalizing your semester.</p>
                </div>
              </div>
            </div>

            {/* Tab Navigators */}
            <div className="flex border-b border-border gap-2">
              <button 
                onClick={() => setActiveTab('SUBJECTS')}
                className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'SUBJECTS' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Subjects ({subjects.length})</span>
              </button>

              <button 
                onClick={() => setActiveTab('SLOTS')}
                className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'SLOTS' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Weekly Schedule ({slots.length})</span>
              </button>

              <button 
                onClick={() => setActiveTab('HOLIDAYS')}
                className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'HOLIDAYS' ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Academic Holidays ({holidays.length})</span>
              </button>
            </div>

            {/* TAB CONTENT: SUBJECTS */}
            {activeTab === 'SUBJECTS' && (
              <div className="card bg-surface shadow-sm rounded-2xl overflow-hidden border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface/60 text-slate-400 text-xs uppercase tracking-wider border-b border-border">
                        <th className="p-4 font-semibold">Subject Code</th>
                        <th className="p-4 font-semibold">Subject Name</th>
                        <th className="p-4 font-semibold">Type</th>
                        <th className="p-4 font-semibold">Credits</th>
                        <th className="p-4 font-semibold">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                      {subjects.map(s => (
                        <tr key={s.temp_id} className="hover:bg-surface-secondary/40 transition-colors">
                          <td className="p-4">
                            <input 
                              type="text" 
                              value={s.subject_code} 
                              onChange={(e) => updateSubject(s.temp_id, 'subject_code', e.target.value)}
                              className="w-full bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 text-white font-mono focus:border-teal-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-4">
                            <input 
                              type="text" 
                              value={s.subject_name} 
                              onChange={(e) => updateSubject(s.temp_id, 'subject_name', e.target.value)}
                              className="w-full bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
                            />
                            {s.warning && (
                              <p className="text-[11px] text-warning mt-1 flex items-center gap-1 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5" /> {s.warning}
                              </p>
                            )}
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => updateSubject(s.temp_id, 'is_lab', !s.is_lab)}
                              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                                s.is_lab ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {s.is_lab ? '🧪 Lab / Practical' : '📖 Theory Lecture'}
                            </button>
                          </td>
                          <td className="p-4">
                            <input 
                              type="number" 
                              value={s.credit_hours} 
                              onChange={(e) => updateSubject(s.temp_id, 'credit_hours', Number(e.target.value))}
                              className="w-16 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 text-white text-center focus:border-teal-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              s.confidence_score > 90 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                            }`}>
                              {s.confidence_score}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SLOTS */}
            {activeTab === 'SLOTS' && (
              <div className="card bg-surface shadow-sm rounded-2xl overflow-hidden border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface/60 text-slate-400 text-xs uppercase tracking-wider border-b border-border">
                        <th className="p-4 font-semibold">Day</th>
                        <th className="p-4 font-semibold">Subject</th>
                        <th className="p-4 font-semibold">Start Time</th>
                        <th className="p-4 font-semibold">End Time</th>
                        <th className="p-4 font-semibold">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                      {slots.map(sl => {
                        const subj = subjects.find(s => s.temp_id === sl.subject_temp_id);
                        return (
                          <tr key={sl.temp_id} className="hover:bg-surface-secondary/40 transition-colors">
                            <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                              <select 
                                value={sl.day_of_week}
                                onChange={(e) => updateSlot(sl.temp_id, 'day_of_week', Number(e.target.value))}
                                className="bg-slate-900 px-2 py-1.5 rounded border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                              >
                                {DAYS_OF_WEEK.map((day, idx) => (
                                  <option key={idx} value={idx}>{day}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-4">
                              <select 
                                value={sl.subject_temp_id}
                                onChange={(e) => updateSlot(sl.temp_id, 'subject_temp_id', e.target.value)}
                                className="w-full bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                              >
                                {subjects.map(s => (
                                  <option key={s.temp_id} value={s.temp_id}>{s.subject_code} — {s.subject_name}</option>
                                ))}
                              </select>
                              {sl.warning && (
                                <p className="text-[11px] text-warning mt-1 flex items-center gap-1 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5" /> {sl.warning}
                                </p>
                              )}
                            </td>
                            <td className="p-4">
                              <input 
                                type="text" 
                                value={sl.start_time} 
                                onChange={(e) => updateSlot(sl.temp_id, 'start_time', e.target.value)}
                                className="w-24 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 text-white font-mono focus:border-teal-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-4">
                              <input 
                                type="text" 
                                value={sl.end_time} 
                                onChange={(e) => updateSlot(sl.temp_id, 'end_time', e.target.value)}
                                className="w-24 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 text-white font-mono focus:border-teal-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-4">
                              <input 
                                type="text" 
                                value={sl.room_number || ''} 
                                onChange={(e) => updateSlot(sl.temp_id, 'room_number', e.target.value)}
                                placeholder="LT-101"
                                className="w-24 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: HOLIDAYS */}
            {activeTab === 'HOLIDAYS' && (
              <div className="card bg-surface shadow-sm rounded-2xl overflow-hidden border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface/60 text-slate-400 text-xs uppercase tracking-wider border-b border-border">
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold">Description</th>
                        <th className="p-4 font-semibold">Exam / Assessment Day?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                      {holidays.map(h => (
                        <tr key={h.temp_id} className="hover:bg-surface-secondary/40 transition-colors">
                          <td className="p-4">
                            <input 
                              type="date" 
                              value={h.holiday_date} 
                              onChange={(e) => updateHoliday(h.temp_id, 'holiday_date', e.target.value)}
                              className="bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 text-white font-mono focus:border-teal-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-4">
                            <input 
                              type="text" 
                              value={h.description} 
                              onChange={(e) => updateHoliday(h.temp_id, 'description', e.target.value)}
                              className="w-full bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => updateHoliday(h.temp_id, 'is_exam_day', !h.is_exam_day)}
                              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                                h.is_exam_day ? 'bg-warning/20 text-warning border border-warning/30' : 'bg-surface-secondary text-slate-700 dark:text-slate-300 border border-border'
                              }`}
                            >
                              {h.is_exam_day ? '📝 Yes (Exam Prep)' : '🏖️ No (Holiday)'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-4">
              <button 
                onClick={() => setStep('UPLOAD')}
                className="px-5 py-2.5 rounded-xl bg-surface-secondary hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Upload</span>
              </button>

              <button 
                onClick={handleConfirmAndSave}
                disabled={isSaving}
                className="px-8 py-3 rounded-xl bg-slate-50 hover:bg-white text-slate-950 font-bold text-sm shadow-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Build Schedule</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'SUCCESS' && (
          <motion.div 
            key="step-success"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="glass-card p-12 rounded-2xl text-center space-y-6 max-w-md mx-auto my-12 border-white/5 bg-slate-900"
          >
            <div className="w-20 h-20 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-teal-400 mx-auto">
              <Check className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Semester Schedule Ready!</h3>
              <p className="text-sm text-slate-300">
                Redirecting you to your daily dashboard and safe skip calculator...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
