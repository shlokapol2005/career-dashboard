import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import officeParser from 'officeparser';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let extractedText = '';

    // Determine how to extract text based on file type
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx')) {
      // officeParser can parse the buffer directly
      extractedText = await officeParser.parseOfficeAsync(buffer);
    } else if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from the file.' }, { status: 400 });
    }

    // Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in the environment variables.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-1.5-flash as it is fast and efficient for summarization
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an expert AI learning assistant. Your task is to analyze the following academic notes/document and generate a structured JSON response to help a student study.
      
      Here is the extracted text from the document:
      ---
      ${extractedText.substring(0, 50000)} // Limiting text to avoid exceeding token limits for basic implementation
      ---

      Please respond strictly with a JSON object in the following format, without markdown formatting or code blocks wrapping the JSON:
      {
        "summary": "A cohesive executive summary of the entire document (approx 100-200 words).",
        "concepts": [
          {
            "title": "Name of concept",
            "description": "Clear explanation of the concept"
          }
        ],
        "revisionNotes": [
          "Actionable, short bullet point for rapid revision",
          "Another short bullet point"
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting in the LLM response
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }

    const jsonResponse = JSON.parse(text);

    return NextResponse.json(jsonResponse);

  } catch (error) {
    console.error('Summarization API Error:', error);
    return NextResponse.json({ error: 'Failed to process document or communicate with AI.' }, { status: 500 });
  }
}
