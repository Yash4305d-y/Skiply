import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AIParsingResult, AIExtractedSubject, AIExtractedSlot, AIExtractedHoliday } from '@/types';

const Type = { OBJECT: 'object', ARRAY: 'array', STRING: 'string', INTEGER: 'integer', BOOLEAN: 'boolean' };
// Mock parser for offline demonstration or when GEMINI_API_KEY is not configured
function getMockExtractionResult(): AIParsingResult {
  return {
    success: true,
    is_mock: true,
    subjects: [],
    timetable_slots: [],
    academic_holidays: [],
    summary_message: 'AI is currently down , sorry for inconvenence but you can still use our app just by manually update',
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { timetableImage, calendarImage, useMock } = body;

    // Initialize Google Gen AI
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    // If mock requested or no API key, return mock extraction
    if (useMock || !geminiApiKey || geminiApiKey.length < 10) {
      // Simulate slight network delay for realistic AI loading animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json(getMockExtractionResult());
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

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
4. Assign a confidence score (0-100). For any low-resolution, blurry, or ambiguous text, add a descriptive warning starting with '⚠️ '.
You MUST output valid JSON exactly matching this schema.`;

    const messageContent: any[] = [ prompt ];
    
    // Add images if provided as base64
    if (timetableImage && timetableImage.startsWith('data:')) {
      const [header, base64] = timetableImage.split(',');
      const mimeType = header.replace('data:', '').replace(';base64', '');
      messageContent.push({
        inlineData: { data: base64, mimeType }
      });
    }
    if (calendarImage && calendarImage.startsWith('data:')) {
      const [header, base64] = calendarImage.split(',');
      const mimeType = header.replace('data:', '').replace(';base64', '');
      messageContent.push({
        inlineData: { data: base64, mimeType }
      });
    }

    console.log(`Attempting schedule extraction with Gemini 3.5 Flash...`);
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: messageContent,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });

    if (!response || !response.text) {
      throw new Error('Gemini failed to generate content.');
    }

    const jsonText = response.text;
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

    let cleanMessage = 'AI API connectivity or key issue.';
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('limit: 0')) {
      cleanMessage = 'AI is currently down , sorry for inconvenence but you can still use our app just by manually update';
    } else if (errMsg.includes('404')) {
      cleanMessage = 'AI is currently down , sorry for inconvenence but you can still use our app just by manually update';
    }

    return NextResponse.json({
      ...fallback,
      summary_message: cleanMessage,
      raw_error: errMsg,
    });
  }
}
