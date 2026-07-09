const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const officeParser = require('officeparser');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Summarize Route
app.post('/api/summarize', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let extractedText = '';
    const buffer = file.buffer;

    // Determine how to extract text based on file type
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.originalname.endsWith('.pptx')) {
      extractedText = await officeParser.parseOfficeAsync(buffer);
    } else if (file.mimetype.startsWith('text/') || file.originalname.endsWith('.md') || file.originalname.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from the file.' });
    }

    // Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the backend environment variables.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an expert AI learning assistant. Your task is to analyze the following academic notes/document and generate a structured JSON response to help a student study.
      
      Here is the extracted text from the document:
      ---
      ${extractedText.substring(0, 50000)}
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
    
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
    }

    const jsonResponse = JSON.parse(text);
    return res.json(jsonResponse);

  } catch (error) {
    console.error('Summarization API Error:', error);
    return res.status(500).json({ error: 'Failed to process document or communicate with AI.' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
