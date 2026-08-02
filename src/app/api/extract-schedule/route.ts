import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { AIParsingResult, AIExtractedSubject, AIExtractedSlot, AIExtractedHoliday } from '@/types';

// Mock parser for offline demonstration or when GEMINI_API_KEY is not configured
function getMockExtractionResult(): AIParsingResult {
  const subjects: AIExtractedSubject[] = [
    { temp_id: 'sub-1', subject_code: 'CS-301', subject_name: 'Operating Systems & System Programming', is_lab: false, credit_hours: 4, confidence_score: 98 },
    { temp_id: 'sub-2', subject_code: 'CS-301L', subject_name: 'Operating Systems Lab', is_lab: true, credit_hours: 2, confidence_score: 95 },
    { temp_id: 'sub-3', subject_code: 'CS-302', subject_name: 'Database Management Systems (DBMS)', is_lab: false, credit_hours: 3, confidence_score: 99 },
    { temp_id: 'sub-4', subject_code: 'MATH-301', subject_name: 'Probability & Applied Statistics', is_lab: false, credit_hours: 3, confidence_score: 97 },
    { temp_id: 'sub-5', subject_code: 'HUM-201', subject_name: 'Engineering Ethics & Society', is_lab: false, credit_hours: 2, confidence_score: 72, warning: '⚠️ Check Subject Code (OCR ambiguous on notice board)' },
  ];

  const slots: AIExtractedSlot[] = [
    // Monday
    { temp_id: 'slot-1', subject_temp_id: 'sub-1', day_of_week: 1, start_time: '09:00', end_time: '10:00', room_number: 'LT-101', confidence_score: 98 },
    { temp_id: 'slot-2', subject_temp_id: 'sub-3', day_of_week: 1, start_time: '10:15', end_time: '11:15', room_number: 'LT-204', confidence_score: 96 },
    { temp_id: 'slot-3', subject_temp_id: 'sub-4', day_of_week: 1, start_time: '11:30', end_time: '12:30', room_number: 'LT-302', confidence_score: 95 },
    // Tuesday (Lab day - multi hour block split or preserved)
    { temp_id: 'slot-4', subject_temp_id: 'sub-2', day_of_week: 2, start_time: '14:00', end_time: '16:00', room_number: 'Lab-OS-2', confidence_score: 94 },
    { temp_id: 'slot-5', subject_temp_id: 'sub-5', day_of_week: 2, start_time: '10:00', end_time: '11:00', room_number: 'Sem-Hall-B', confidence_score: 75, warning: '⚠️ Verify room number' },
    // Wednesday
    { temp_id: 'slot-6', subject_temp_id: 'sub-1', day_of_week: 3, start_time: '09:00', end_time: '10:00', room_number: 'LT-101', confidence_score: 99 },
    { temp_id: 'slot-7', subject_temp_id: 'sub-3', day_of_week: 3, start_time: '10:15', end_time: '11:15', room_number: 'LT-204', confidence_score: 98 },
    // Thursday
    { temp_id: 'slot-8', subject_temp_id: 'sub-4', day_of_week: 4, start_time: '09:00', end_time: '10:00', room_number: 'LT-302', confidence_score: 97 },
    { temp_id: 'slot-9', subject_temp_id: 'sub-5', day_of_week: 4, start_time: '11:00', end_time: '12:00', room_number: 'Sem-Hall-B', confidence_score: 80 },
    // Friday
    { temp_id: 'slot-10', subject_temp_id: 'sub-1', day_of_week: 5, start_time: '09:00', end_time: '10:00', room_number: 'LT-101', confidence_score: 99 },
    { temp_id: 'slot-11', subject_temp_id: 'sub-3', day_of_week: 5, start_time: '10:15', end_time: '11:15', room_number: 'LT-204', confidence_score: 98 },
  ];

  const holidays: AIExtractedHoliday[] = [
    { temp_id: 'hol-1', holiday_date: new Date(new Date().getTime() + 86400000 * 10).toISOString().split('T')[0], description: 'Autumn Mid-Term Break', is_exam_day: false, confidence_score: 99 },
    { temp_id: 'hol-2', holiday_date: new Date(new Date().getTime() + 86400000 * 25).toISOString().split('T')[0], description: 'National Independence Day', is_exam_day: false, confidence_score: 98 },
    { temp_id: 'hol-3', holiday_date: new Date(new Date().getTime() + 86400000 * 40).toISOString().split('T')[0], description: 'Mid-Semester Exam Prep Day', is_exam_day: true, confidence_score: 95 },
  ];

  return {
    success: true,
    is_mock: true,
    subjects,
    timetable_slots: slots,
    academic_holidays: holidays,
    summary_message: 'Successfully extracted 5 subjects, 11 weekly timetable slots, and 3 holidays. Notice 1 item flagged for OCR review.',
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { timetableImage, calendarImage, useMock } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // If mock requested or no API key, return mock extraction
    if (useMock || !apiKey || apiKey === 'your-gemini-api-key-here' || apiKey.length < 10) {
      // Simulate slight network delay for realistic AI loading animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json(getMockExtractionResult());
    }

    // Initialize Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey });

    // Construct structured schema for Gemini Vision
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        subjects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              temp_id: { type: Type.STRING, description: "Unique temporary identifier like 'sub-1'" },
              subject_code: { type: Type.STRING, description: "Course code e.g. 'CS-101' or 'PHY-102L'" },
              subject_name: { type: Type.STRING, description: "Full course title e.g. 'Data Structures'" },
              is_lab: { type: Type.BOOLEAN, description: "True if practical/lab session, false if lecture" },
              credit_hours: { type: Type.INTEGER, description: "Credit hours, typically 3 or 4 for theory, 2 for labs" },
              confidence_score: { type: Type.INTEGER, description: "Confidence 0 to 100 based on image clarity" },
              warning: { type: Type.STRING, description: "Optional warning if OCR was blurry or ambiguous" }
            },
            required: ["temp_id", "subject_code", "subject_name", "is_lab", "credit_hours", "confidence_score"]
          }
        },
        timetable_slots: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              temp_id: { type: Type.STRING, description: "Unique slot identifier like 'slot-1'" },
              subject_temp_id: { type: Type.STRING, description: "Matching temp_id from subjects array" },
              day_of_week: { type: Type.INTEGER, description: "0 for Sunday, 1 for Monday, ..., 6 for Saturday" },
              start_time: { type: Type.STRING, description: "24-hour format HH:MM e.g. '09:00' or '14:30'" },
              end_time: { type: Type.STRING, description: "24-hour format HH:MM e.g. '10:00' or '16:30'" },
              room_number: { type: Type.STRING, description: "Lecture hall or lab number e.g. 'LT-101'" },
              confidence_score: { type: Type.INTEGER, description: "Confidence 0 to 100" },
              warning: { type: Type.STRING, description: "Optional warning if time or room is unclear" }
            },
            required: ["temp_id", "subject_temp_id", "day_of_week", "start_time", "end_time", "confidence_score"]
          }
        },
        academic_holidays: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              temp_id: { type: Type.STRING, description: "Unique holiday identifier like 'hol-1'" },
              holiday_date: { type: Type.STRING, description: "ISO date format YYYY-MM-DD" },
              description: { type: Type.STRING, description: "Holiday name e.g. 'Thanksgiving Break'" },
              is_exam_day: { type: Type.BOOLEAN, description: "True if mid-term or final exam date" },
              confidence_score: { type: Type.INTEGER, description: "Confidence 0 to 100" }
            },
            required: ["temp_id", "holiday_date", "description", "is_exam_day", "confidence_score"]
          }
        },
        summary_message: { type: Type.STRING, description: "Brief human-readable summary of what was extracted" }
      },
      required: ["subjects", "timetable_slots", "academic_holidays", "summary_message"]
    };

    // Prepare prompt
    const prompt = `You are an expert university schedule parser for Skiply (Attendra). 
Analyze the provided class timetable and academic calendar images or PDF documents.
1. Extract all subjects with codes, full titles, whether they are lab/practical sessions, and credit hours.
2. Extract all weekly lecture timetable slots (0=Sunday to 6=Saturday) with start and end times in 24-hour HH:MM format. If a lab is a multi-hour block (e.g., 2:00 PM - 5:00 PM), represent it with start_time '14:00' and end_time '17:00'.
3. Extract all holidays and non-instructional days from the academic calendar with exact dates in YYYY-MM-DD format.
4. Assign a confidence score (0-100). For any low-resolution, blurry, or ambiguous text, add a descriptive warning starting with '⚠️ '.`;

    const contents: Array<string | Record<string, unknown>> = [prompt];
    
    // Add images or PDF documents if provided as base64
    if (timetableImage && timetableImage.startsWith('data:')) {
      const [mime, data] = timetableImage.split(';base64,');
      contents.push({
        inlineData: {
          mimeType: mime.replace('data:', ''),
          data: data
        }
      });
    }
    if (calendarImage && calendarImage.startsWith('data:')) {
      const [mime, data] = calendarImage.split(';base64,');
      contents.push({
        inlineData: {
          mimeType: mime.replace('data:', ''),
          data: data
        }
      });
    }

    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash'
    ];

    let response = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`Attempting schedule extraction with model: ${modelName}...`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.2,
          }
        });
        if (response) break; // Successfully generated!
      } catch (err: unknown) {
        lastError = err;
        const errStr = typeof err === 'object' ? JSON.stringify(err) : String(err);
        const errMsg = err instanceof Error ? err.message : errStr;
        console.warn(`Model ${modelName} failed:`, errMsg);

        // If rate limited (429 or RESOURCE_EXHAUSTED), wait 4 seconds before trying the next fallback model
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('limit: 0')) {
          console.log('Rate limit / quota detected. Waiting 4 seconds before trying next model in chain...');
          await new Promise(res => setTimeout(res, 4000));
        }
      }
    }

    if (!response) {
      throw lastError || new Error('All Gemini models in fallback chain failed to generate content.');
    }

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);

    return NextResponse.json({
      success: true,
      is_mock: false,
      ...parsedData,
    });

  } catch (error: unknown) {
    console.error('AI Extraction Error:', error);
    // On API error, gracefully fall back to mock extraction so UI remains functional
    const fallback = getMockExtractionResult();
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      ...fallback,
      summary_message: 'Used offline mock parser due to AI API connectivity or key issue: ' + errMsg,
      raw_error: errMsg,
    });
  }
}
