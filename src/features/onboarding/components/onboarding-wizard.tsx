'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, ChevronRight, Trash2, AlertTriangle, Check, 
  Plus, BookOpen, Clock, Calendar 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  AIParsingResult, AIExtractedSubject, AIExtractedSlot, AIExtractedHoliday, 
  Subject, TimetableSlot, AcademicHoliday 
} from '@/types';
import { saveConfirmedScheduleToDemo, updateDemoSemesterConfig } from '@/lib/demo-store';
import { saveOnboardingData, getUserProfile, updateSemesterConfig } from '@/actions/db';
import { usePerformanceTier } from '@/lib/utils/use-performance-tier';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type WizardStep = 1 | 2 | 3 | 4;

function formatReadableDate(isoDateStr: string): string {
  if (!isoDateStr) return '';
  const [y, m, d] = isoDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return isoDateStr;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OnboardingWizard() {
  const router = useRouter();
  const { isLowEnd } = usePerformanceTier();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State: Semester Configuration
  const [targetPercentage, setTargetPercentage] = useState<number>(75);
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date(Date.now() + 86400000 * 120).toISOString().split('T')[0];
  });

  // Files State
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [calendarFile, setCalendarFile] = useState<File | null>(null);
  const [timetablePreview, setTimetablePreview] = useState<string | null>(null);
  const [calendarPreview, setCalendarPreview] = useState<string | null>(null);

  const timetableInputRef = useRef<HTMLInputElement>(null);
  const calendarInputRef = useRef<HTMLInputElement>(null);

  // AI Extraction Results
  const [extractionResult, setExtractionResult] = useState<AIParsingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'SLOTS' | 'HOLIDAYS'>('SUBJECTS');
  
  // Editable Lists in Review Step
  const [subjects, setSubjects] = useState<AIExtractedSubject[]>([]);
  const [slots, setSlots] = useState<AIExtractedSlot[]>([]);
  const [holidays, setHolidays] = useState<AIExtractedHoliday[]>([]);

  // Load saved preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      if (typeof window !== 'undefined') {
        const savedTarget = localStorage.getItem('skiply_onboarding_target');
        if (savedTarget) setTargetPercentage(Number(savedTarget));
        const savedStart = localStorage.getItem('skiply_onboarding_start');
        if (savedStart) setStartDate(savedStart);
        const savedEnd = localStorage.getItem('skiply_onboarding_end');
        if (savedEnd) setEndDate(savedEnd);
      }
      
      try {
        const profile = await getUserProfile();
        if (profile) {
          if (profile.target_attendance_percentage) setTargetPercentage(Number(profile.target_attendance_percentage));
          if (profile.semester_start_date) setStartDate(profile.semester_start_date);
          if (profile.semester_end_date) setEndDate(profile.semester_end_date);
        }
      } catch {
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

  const handleFileSelect = (file: File | undefined, type: 'TIMETABLE' | 'CALENDAR') => {
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

  const removeFile = (e: React.MouseEvent, type: 'TIMETABLE' | 'CALENDAR') => {
    e.stopPropagation();
    if (type === 'TIMETABLE') {
      setTimetableFile(null);
      setTimetablePreview(null);
      if (timetableInputRef.current) timetableInputRef.current.value = '';
    } else {
      setCalendarFile(null);
      setCalendarPreview(null);
      if (calendarInputRef.current) calendarInputRef.current.value = '';
    }
  };

  const loadSampleTimetable = () => {
    const fakeFile = new File(['mock'], 'sample_university_timetable.png', { type: 'image/png' });
    setTimetableFile(fakeFile);
    setTimetablePreview('data:image/png;base64,mock');
  };

  const runAIExtraction = async () => {
    if (!timetablePreview) return;
    setIsExtracting(true);

    try {
      const response = await fetch('/api/extract-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timetableImage: timetablePreview,
          calendarImage: calendarPreview,
          useMock: false,
        }),
      });

      const data: AIParsingResult = await response.json();
      setExtractionResult(data);
      setSubjects(data.subjects || []);
      setSlots(data.timetable_slots || []);
      setHolidays(data.academic_holidays || []);

      setIsExtracting(false);
      setCurrentStep(2);
    } catch (err) {
      console.error(err);
      alert('Failed to parse schedule. Please try again.');
      setIsExtracting(false);
    }
  };

  const handleConfirmAndSave = async () => {
    setIsSaving(true);
    setToastMessage(null);

    const finalSubjects: Subject[] = subjects.map(s => ({
      id: s.temp_id,
      user_id: 'user-default',
      subject_code: s.subject_code,
      subject_name: s.subject_name,
      is_lab: s.is_lab,
      credit_hours: s.credit_hours,
      color_hex: '#2DD4BF',
    }));

    const finalSlots: TimetableSlot[] = slots.map((sl, idx) => ({
      id: `slot-${idx + 1}`,
      user_id: 'user-default',
      subject_id: sl.subject_temp_id,
      day_of_week: sl.day_of_week,
      start_time: sl.start_time,
      end_time: sl.end_time,
      room_number: sl.room_number || '',
    }));

    const finalHolidays: AcademicHoliday[] = holidays.map((h, idx) => ({
      id: `hol-${idx + 1}`,
      user_id: 'user-default',
      holiday_date: h.holiday_date,
      description: h.description,
      is_exam_day: h.is_exam_day,
    }));

    saveConfirmedScheduleToDemo(
      finalSubjects,
      finalSlots,
      finalHolidays,
      targetPercentage,
      startDate,
      endDate
    );

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
      await updateSemesterConfig(targetPercentage, startDate, endDate);
    } catch {
      updateDemoSemesterConfig(targetPercentage, startDate, endDate);
    }

    setIsSaving(false);
    setCurrentStep(4);
    
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      router.push('/dashboard');
    }, 1600);
  };

  const updateSubject = (id: string, field: keyof AIExtractedSubject, val: string | number | boolean) => {
    setSubjects(prev => prev.map(s => s.temp_id === id ? { ...s, [field]: val } : s));
  };
  const updateSlot = (id: string, field: keyof AIExtractedSlot, val: string | number) => {
    setSlots(prev => prev.map(sl => sl.temp_id === id ? { ...sl, [field]: val } : sl));
  };
  const updateHoliday = (id: string, field: keyof AIExtractedHoliday, val: string | number | boolean) => {
    setHolidays(prev => prev.map(h => h.temp_id === id ? { ...h, [field]: val } : h));
  };
  const addSubject = () => {
    setSubjects(prev => [...prev, { temp_id: `new-sub-${Date.now()}`, subject_code: '', subject_name: '', is_lab: false, credit_hours: 3, confidence_score: 100 }]);
  };
  const addSlot = () => {
    setSlots(prev => [...prev, { temp_id: `new-slot-${Date.now()}`, subject_temp_id: subjects[0]?.temp_id || '', day_of_week: 1, start_time: '09:00', end_time: '10:00', room_number: '', confidence_score: 100 }]);
  };
  const addHoliday = () => {
    setHolidays(prev => [...prev, { temp_id: `new-hol-${Date.now()}`, holiday_date: new Date().toISOString().split('T')[0], description: '', is_exam_day: false, confidence_score: 100 }]);
  };

  const stepTitles = [
    'Upload schedule',
    'Semester configuration',
    'Verify schedule',
    'Ready'
  ];

  const todayIso = new Date().toISOString().split('T')[0];
  const isEndDateInPast = Boolean(endDate && endDate < todayIso);

  return (
    <div className="max-w-xl mx-auto px-4 pb-28 sm:pb-12 pt-2 select-none">
      {/* Step Indicator: "Step 1 of 4" + Thin 4-Segment Progress Line */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Step {currentStep} of 4</span>
          <span className="text-white font-medium">{stepTitles[currentStep - 1]}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1 w-full">
          {[1, 2, 3, 4].map(num => (
            <div 
              key={num} 
              className={`h-full rounded-full transition-colors duration-200 ${
                num <= currentStep ? 'bg-teal-400' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: UPLOAD SCHEDULE */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-white tracking-[-0.02em] [text-wrap:balance]">
              Upload schedule
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Upload your timetable image. We automatically extract courses, timings, and rooms.
            </p>
          </div>

          {/* Two Compact Upload Rows */}
          <div className="space-y-2.5">
            {/* Timetable Row */}
            <div 
              onClick={() => timetableInputRef.current?.click()}
              className={`p-3.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                timetableFile 
                  ? 'bg-[#181B1F] border-teal-500/30' 
                  : 'bg-[#121417] hover:bg-[#181B1F] border-white/[0.06]'
              }`}
            >
              <input 
                ref={timetableInputRef}
                type="file" 
                aria-label="Upload class timetable"
                accept="image/png, image/jpeg, image/jpg"
                onChange={(e) => handleFileSelect(e.target.files?.[0], 'TIMETABLE')} 
                className="hidden"
              />
              
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded bg-white/[0.06] text-slate-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {timetableFile ? timetableFile.name : 'Class timetable'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {timetableFile ? 'Ready to extract' : 'PNG or JPG'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {timetableFile ? (
                  <button
                    type="button"
                    onClick={(e) => removeFile(e, 'TIMETABLE')}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </div>
            </div>

            {/* Academic Calendar Row */}
            <div 
              onClick={() => calendarInputRef.current?.click()}
              className={`p-3.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                calendarFile 
                  ? 'bg-[#181B1F] border-teal-500/30' 
                  : 'bg-[#121417] hover:bg-[#181B1F] border-white/[0.06]'
              }`}
            >
              <input 
                ref={calendarInputRef}
                type="file" 
                aria-label="Upload academic calendar"
                accept="image/png, image/jpeg, image/jpg"
                onChange={(e) => handleFileSelect(e.target.files?.[0], 'CALENDAR')} 
                className="hidden"
              />
              
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded bg-white/[0.06] text-slate-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {calendarFile ? calendarFile.name : 'Holiday list (optional)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {calendarFile ? 'Ready to extract' : 'PNG or JPG'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {calendarFile ? (
                  <button
                    type="button"
                    onClick={(e) => removeFile(e, 'CALENDAR')}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </div>
            </div>
          </div>

          {/* Quick Demo Helper */}
          {!timetableFile && !isExtracting && (
            <div>
              <button
                type="button"
                onClick={loadSampleTimetable}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Use sample university timetable (Demo) →</span>
              </button>
            </div>
          )}

          {/* Extraction Loading State: Thin progress line with short status text */}
          {isExtracting && (
            <div className="p-4 rounded-lg bg-[#121417] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>Extracting schedule...</span>
                <span className="text-teal-400">Processing</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}

          {/* Sticky Bottom Primary Button */}
          <div className="fixed bottom-0 inset-x-0 p-4 bg-[#0B0C0E] border-t border-white/[0.06] z-20 max-w-xl mx-auto sm:static sm:bg-transparent sm:border-0 sm:p-0">
            <button 
              onClick={runAIExtraction}
              disabled={!timetableFile || isExtracting}
              className={`w-full h-12 px-5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                !timetableFile || isExtracting
                  ? 'bg-[#181B1F] text-slate-500 cursor-not-allowed border border-white/[0.06]' 
                  : 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer'
              }`}
            >
              <span>{isExtracting ? 'Extracting schedule...' : 'Extract with AI'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SEMESTER CONFIGURATION */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-white tracking-[-0.02em] [text-wrap:balance]">
              Semester configuration
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure your semester dates and required minimum attendance target.
            </p>
          </div>

          <div className="bg-[#121417] p-5 rounded-xl border border-white/[0.06] space-y-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="startDate" className="font-medium text-slate-300">
                  Semester start date
                </label>
                <span className="text-slate-400 font-mono">
                  {formatReadableDate(startDate)}
                </span>
              </div>
              <input 
                id="startDate"
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-white/[0.06] text-white text-xs font-mono focus:outline-none"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="endDate" className="font-medium text-slate-300">
                  Semester end date
                </label>
                <span className="text-slate-400 font-mono">
                  {formatReadableDate(endDate)}
                </span>
              </div>
              <input 
                id="endDate"
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#181B1F] border border-white/[0.06] text-white text-xs font-mono focus:outline-none"
              />
              {isEndDateInPast && (
                <p className="text-xs text-amber-400 font-medium flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>End date is before today ({formatReadableDate(todayIso)})</span>
                </p>
              )}
            </div>

            {/* Target Attendance */}
            <div className="space-y-2 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="targetAttendance" className="font-medium text-slate-300">
                  Target attendance percentage
                </label>
                <span className="font-mono font-bold text-teal-400 tabular-nums">
                  {targetPercentage}%
                </span>
              </div>
              <input 
                id="targetAttendance"
                type="range"
                min="50"
                max="90"
                step="1"
                value={targetPercentage} 
                onChange={(e) => setTargetPercentage(Number(e.target.value))}
                className="w-full accent-teal-500 bg-white/10 h-1 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="fixed bottom-0 inset-x-0 p-4 bg-[#0B0C0E] border-t border-white/[0.06] z-20 max-w-xl mx-auto sm:static sm:bg-transparent sm:border-0 sm:p-0 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="h-12 px-4 rounded-lg text-xs font-medium bg-[#181B1F] text-slate-300 hover:text-white transition-colors"
            >
              Back
            </button>
            <button 
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex-1 h-12 px-5 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer"
            >
              Continue to verification
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VERIFY GRID */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-white tracking-[-0.02em] [text-wrap:balance]">
              Verify schedule
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {extractionResult?.summary_message || 'Review courses and timetable slots before finalizing.'}
            </p>
          </div>

          {/* Tab Navigators */}
          <div className="flex border-b border-white/[0.06] gap-2">
            <button 
              onClick={() => setActiveTab('SUBJECTS')}
              className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'SUBJECTS' ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Subjects ({subjects.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('SLOTS')}
              className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'SLOTS' ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Slots ({slots.length})</span>
            </button>

            <button 
              onClick={() => setActiveTab('HOLIDAYS')}
              className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'HOLIDAYS' ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Holidays ({holidays.length})</span>
            </button>
          </div>

          {/* TAB: SUBJECTS */}
          {activeTab === 'SUBJECTS' && (
            <div className="space-y-2">
              {subjects.map(s => (
                <div key={s.temp_id} className="p-3 rounded-lg bg-[#121417] border border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      aria-label="Subject code"
                      value={s.subject_code} 
                      onChange={(e) => updateSubject(s.temp_id, 'subject_code', e.target.value)}
                      placeholder="Code"
                      className="w-24 bg-[#181B1F] px-2.5 py-1.5 rounded border border-white/[0.06] text-white font-mono uppercase"
                    />
                    <input 
                      type="text" 
                      aria-label="Subject name"
                      value={s.subject_name} 
                      onChange={(e) => updateSubject(s.temp_id, 'subject_name', e.target.value)}
                      placeholder="Subject name"
                      className="flex-1 bg-[#181B1F] px-2.5 py-1.5 rounded border border-white/[0.06] text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <button 
                      type="button"
                      onClick={() => updateSubject(s.temp_id, 'is_lab', !s.is_lab)}
                      className={`px-2 py-0.5 rounded font-medium border ${
                        s.is_lab ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-slate-400 border-white/[0.06]'
                      }`}
                    >
                      {s.is_lab ? 'Lab course' : 'Theory lecture'}
                    </button>
                    <span className="text-slate-500 font-mono">
                      {s.confidence_score}% match
                    </span>
                  </div>
                </div>
              ))}
              <button 
                type="button"
                onClick={addSubject}
                className="w-full py-2.5 rounded-lg border border-dashed border-white/10 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add subject</span>
              </button>
            </div>
          )}

          {/* TAB: SLOTS */}
          {activeTab === 'SLOTS' && (
            <div className="space-y-2">
              {slots.map(sl => (
                <div key={sl.temp_id} className="p-3 rounded-lg bg-[#121417] border border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <select 
                      aria-label="Day of week"
                      value={sl.day_of_week}
                      onChange={(e) => updateSlot(sl.temp_id, 'day_of_week', Number(e.target.value))}
                      className="bg-[#181B1F] px-2 py-1.5 rounded border border-white/[0.06] text-white text-xs"
                    >
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <option key={idx} value={idx}>{day}</option>
                      ))}
                    </select>
                    <select 
                      aria-label="Select subject"
                      value={sl.subject_temp_id}
                      onChange={(e) => updateSlot(sl.temp_id, 'subject_temp_id', e.target.value)}
                      className="flex-1 bg-[#181B1F] px-2 py-1.5 rounded border border-white/[0.06] text-white text-xs truncate"
                    >
                      {subjects.map(s => (
                        <option key={s.temp_id} value={s.temp_id}>{s.subject_code} — {s.subject_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <input 
                      type="text" 
                      aria-label="Start time"
                      value={sl.start_time} 
                      onChange={(e) => updateSlot(sl.temp_id, 'start_time', e.target.value)}
                      className="w-20 bg-[#181B1F] px-2 py-1.5 rounded border border-white/[0.06] text-white"
                      placeholder="09:00"
                    />
                    <span className="text-slate-500">-</span>
                    <input 
                      type="text" 
                      aria-label="End time"
                      value={sl.end_time} 
                      onChange={(e) => updateSlot(sl.temp_id, 'end_time', e.target.value)}
                      className="w-20 bg-[#181B1F] px-2 py-1.5 rounded border border-white/[0.06] text-white"
                      placeholder="10:00"
                    />
                    <input 
                      type="text" 
                      aria-label="Room"
                      value={sl.room_number || ''} 
                      onChange={(e) => updateSlot(sl.temp_id, 'room_number', e.target.value)}
                      placeholder="Room"
                      className="flex-1 bg-[#181B1F] px-2 py-1.5 rounded border border-white/[0.06] text-white"
                    />
                  </div>
                </div>
              ))}
              <button 
                type="button"
                onClick={addSlot}
                className="w-full py-2.5 rounded-lg border border-dashed border-white/10 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add slot</span>
              </button>
            </div>
          )}

          {/* TAB: HOLIDAYS */}
          {activeTab === 'HOLIDAYS' && (
            <div className="space-y-2">
              {holidays.map(h => (
                <div key={h.temp_id} className="p-3 rounded-lg bg-[#121417] border border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={h.holiday_date} 
                      onChange={(e) => updateHoliday(h.temp_id, 'holiday_date', e.target.value)}
                      className="bg-[#181B1F] px-2 py-1.5 rounded border border-white/[0.06] text-white font-mono text-xs"
                    />
                    <input 
                      type="text" 
                      value={h.description} 
                      onChange={(e) => updateHoliday(h.temp_id, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 bg-[#181B1F] px-2 py-1.5 rounded border border-white/[0.06] text-white"
                    />
                  </div>
                </div>
              ))}
              <button 
                type="button"
                onClick={addHoliday}
                className="w-full py-2.5 rounded-lg border border-dashed border-white/10 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add holiday</span>
              </button>
            </div>
          )}

          {/* Sticky Bottom Actions */}
          <div className="fixed bottom-0 inset-x-0 p-4 bg-[#0B0C0E] border-t border-white/[0.06] z-20 max-w-xl mx-auto sm:static sm:bg-transparent sm:border-0 sm:p-0 flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setCurrentStep(2)}
              className="h-12 px-4 rounded-lg text-xs font-medium bg-[#181B1F] text-slate-300 hover:text-white transition-colors"
            >
              Back
            </button>
            <button 
              type="button"
              onClick={handleConfirmAndSave}
              disabled={isSaving}
              className="flex-1 h-12 px-5 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer"
            >
              {isSaving ? 'Building schedule...' : 'Confirm & save schedule'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS */}
      {currentStep === 4 && (
        <div className="p-8 rounded-xl text-center space-y-4 max-w-md mx-auto my-8 border border-white/[0.06] bg-[#121417]">
          <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto">
            <Check className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-2xl text-white">Semester ready</h3>
            <p className="text-xs text-slate-400">
              Schedule saved. Redirecting to your dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
