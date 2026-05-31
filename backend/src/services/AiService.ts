import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Available models to try in order
const AVAILABLE_MODELS = [
  process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
];

interface GenerateParams {
  title: string;
  subject: string;
  className: string;
  questionTypes: Array<{ type: string; numberOfQuestions: number; marksPerQuestion: number }>;
  totalMarks: number;
  additionalInstructions?: string;
}

// Helper to try generation with a specific model
async function tryGenerateWithModel(prompt: string, model: string) {
  console.log(`🔄 Trying model: ${model}`);
  
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: model,
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });
  
  const response = completion.choices[0]?.message?.content;
  if (!response) throw new Error('No response from AI');
  
  return response;
}

export async function generateQuestionPaper(params: GenerateParams) {
  const totalSections = params.questionTypes.length;
  const totalQuestions = params.questionTypes.reduce((sum, qt) => sum + qt.numberOfQuestions, 0);

  const hasFileContent = params.additionalInstructions ? params.additionalInstructions.includes('--- FILE CONTENT START ---') : false;
  let fileContentText = '';
  let userInstructions = params.additionalInstructions || '';

  if (hasFileContent && params.additionalInstructions) {
    const match = params.additionalInstructions.match(/--- FILE CONTENT START ---\n([\s\S]*?)\n--- END FILE CONTENT ---/);
    if (match) {
      fileContentText = match[1].substring(0, 2000); // Reduced from 4000
      userInstructions = params.additionalInstructions.replace(/--- FILE CONTENT START ---[\s\S]*?--- END FILE CONTENT ---/, '').trim();
    }
  }

  let sectionsList = '';
  for (let i = 0; i < params.questionTypes.length; i++) {
    const qt = params.questionTypes[i];
    const sectionLetter = String.fromCharCode(65 + i);
    sectionsList += `   Section ${sectionLetter}: ${qt.type} (${qt.numberOfQuestions} questions, ${qt.marksPerQuestion} marks each)\n`;
  }

  let prompt = `You are an expert exam paper generator. Create a complete question paper with REAL questions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTIONS REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sectionsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOPIC / SUBJECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  if (fileContentText) {
    prompt += `Generate questions based ONLY on this content:
--- CONTENT ---
${fileContentText}
--- END CONTENT ---

`;
  } else {
    prompt += `Subject: ${params.subject}
Topic: ${params.title}
Class: ${params.className}

Generate ${totalQuestions} questions about "${params.title}" for ${params.subject} class ${params.className}.

`;
  }

  prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION FORMAT BY TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  for (let i = 0; i < params.questionTypes.length; i++) {
    const qt = params.questionTypes[i];
    const sectionLetter = String.fromCharCode(65 + i);
    
    prompt += `SECTION ${sectionLetter}: ${qt.type.toUpperCase()}\n`;
    
    if (qt.type === 'Multiple Choice Questions') {
      prompt += `Write ${qt.numberOfQuestions} MCQs with A) B) C) D) options and [Answer: X].\n\n`;
    } else if (qt.type === 'Short Questions') {
      prompt += `Write ${qt.numberOfQuestions} Short Answer Questions.\n\n`;
    } else if (qt.type === 'Numerical Problems') {
      prompt += `Write ${qt.numberOfQuestions} Numerical Problems with calculated answers.\n\n`;
    } else if (qt.type === 'Diagram/Graph-Based Questions') {
      prompt += `Write ${qt.numberOfQuestions} Diagram/Graph questions.\n\n`;
    }
  }

  prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "sections": [`;

  for (let i = 0; i < params.questionTypes.length; i++) {
    const qt = params.questionTypes[i];
    const sectionLetter = String.fromCharCode(65 + i);
    const sectionName = `Section ${sectionLetter} - ${qt.type}`;
    
    prompt += `
    {
      "title": "${sectionName}",
      "instruction": "Attempt all questions. Each carries ${qt.marksPerQuestion} marks.",
      "questions": [`;

    for (let j = 0; j < qt.numberOfQuestions; j++) {
      prompt += `
        {
          "text": "actual question here",
          "difficulty": "Moderate",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
    }
    
    prompt += `
      ]
    }${i < params.questionTypes.length - 1 ? ',' : ''}`;
  }

  prompt += `
  ],
  "answerKey": "1. Answer1\\n2. Answer2\\n..."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Write REAL questions about "${params.title}" for ${params.subject}.
2. MCQ: Include A) B) C) D) options and [Answer: X] in question text.
3. Numerical: Provide calculated answer in answerKey.
4. Return ONLY valid JSON. No markdown, no extra text.
`;

  // ========== MODEL FALLBACK SYSTEM ==========
  try {
    let response: string | null = null;
    let usedModel: string | null = null;
    let lastError: any = null;

    // Try each model until one works
    for (const model of AVAILABLE_MODELS) {
      try {
        response = await tryGenerateWithModel(prompt, model);
        usedModel = model;
        console.log(`✅ Success with model: ${model}`);
        break;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message || error?.toString() || '';
        
        if (errorMsg.includes('rate_limit') || errorMsg.includes('429')) {
          console.log(`⚠️ Rate limited on ${model}, trying next model...`);
        } else if (errorMsg.includes('decommissioned') || errorMsg.includes('not_found') || errorMsg.includes('404')) {
          console.log(`⚠️ Model ${model} unavailable, trying next...`);
        } else if (errorMsg.includes('too large') || errorMsg.includes('413')) {
          console.log(`⚠️ Prompt too large for ${model}, trying next...`);
        } else {
          console.log(`❌ Error with ${model}: ${errorMsg}, trying next...`);
        }
        continue;
      }
    }

    if (!response) {
      throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown'}`);
    }

    console.log(`📝 Parsing response from ${usedModel}...`);
    const parsed = JSON.parse(response);
    
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid response: missing sections array');
    }
    
    // Fix section titles
    for (let i = 0; i < params.questionTypes.length && i < parsed.sections.length; i++) {
      const expectedType = params.questionTypes[i].type;
      const expectedTitle = `Section ${String.fromCharCode(65 + i)} - ${expectedType}`;
      parsed.sections[i].title = expectedTitle;
    }
    
    console.log(`✅ Generated ${parsed.sections.length} sections with real questions using ${usedModel}`);
    
    return parsed;
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}
