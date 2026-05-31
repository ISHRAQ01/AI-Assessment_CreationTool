import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const AVAILABLE_MODELS = [
  process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'llama3-8b-8192',
];

// ✅ ONLY THIS ADDED - Helper function
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

interface GenerateParams {
  title: string;
  subject: string;
  className: string;
  questionTypes: Array<{ type: string; numberOfQuestions: number; marksPerQuestion: number }>;
  totalMarks: number;
  additionalInstructions?: string;
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
      fileContentText = match[1].substring(0, 4000);
      userInstructions = params.additionalInstructions.replace(/--- FILE CONTENT START ---[\s\S]*?--- END FILE CONTENT ---/, '').trim();
    }
  }

  let sectionsList = '';
  for (let i = 0; i < params.questionTypes.length; i++) {
    const qt = params.questionTypes[i];
    const sectionLetter = String.fromCharCode(65 + i);
    sectionsList += `   Section ${sectionLetter}: ${qt.type} (${qt.numberOfQuestions} questions, ${qt.marksPerQuestion} marks each)\n`;
  }

  let prompt = `You are an expert exam paper generator. Create a complete question paper with REAL questions and their CORRECT answers.

╔═══════════════════════════════════════════════════════════════════════════════╗
║                    CRITICAL: GENERATE REAL QUESTIONS                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

DO NOT use placeholders like "Question 1:" or "Sample question".
You MUST write ACTUAL, MEANINGFUL questions based on the subject and topic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXACT SECTION ORDER
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

  prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION FORMAT BY TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  for (let i = 0; i < params.questionTypes.length; i++) {
    const qt = params.questionTypes[i];
    const sectionLetter = String.fromCharCode(65 + i);
    
    prompt += `╔═══════════════════════════════════════════════════════════════════════════════╗\n`;
    prompt += `║ SECTION ${sectionLetter}: ${qt.type.toUpperCase()}                                                       ║\n`;
    prompt += `╚═══════════════════════════════════════════════════════════════════════════════╝\n`;
    
    if (qt.type === 'Multiple Choice Questions') {
      prompt += `Write ${qt.numberOfQuestions} REAL Multiple Choice Questions about ${params.title}.

Example of a GOOD MCQ:
Question: What is the SI unit of force?
A) Joule
B) Watt
C) Newton
D) Pascal
[Answer: C]

`;
    } 
    else if (qt.type === 'Short Questions') {
      prompt += `Write ${qt.numberOfQuestions} REAL Short Answer Questions about ${params.title}.

Example of a GOOD short question:
Explain Newton's first law of motion with an example.

`;
    }
    else if (qt.type === 'Numerical Problems') {
      prompt += `Write ${qt.numberOfQuestions} REAL Numerical Problems about ${params.title}.

Example of a GOOD numerical problem:
A car accelerates from rest at 2 m/s² for 5 seconds. Calculate its final velocity.

Answer in answerKey: 10 m/s

`;
    }
    else if (qt.type === 'Diagram/Graph-Based Questions') {
      prompt += `Write ${qt.numberOfQuestions} REAL Diagram/Graph questions about ${params.title}.

Example of a GOOD diagram question:
Draw a labeled diagram showing the structure of a neuron.

`;
    }
    prompt += `\n`;
  }

  prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON OUTPUT
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
      "instruction": "Attempt all questions. Each question carries ${qt.marksPerQuestion} marks.",
      "questions": [`;

    for (let j = 0; j < qt.numberOfQuestions; j++) {
      if (qt.type === 'Multiple Choice Questions') {
        prompt += `
        {
          "text": "Question: What is the SI unit of force?\\\\nA) Joule\\\\nB) Watt\\\\nC) Newton\\\\nD) Pascal\\\\n[Answer: C]",
          "difficulty": "Easy",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
      } else if (qt.type === 'Numerical Problems') {
        prompt += `
        {
          "text": "A car accelerates from rest at 2 m/s² for 5 seconds. Calculate its final velocity.",
          "difficulty": "Easy",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
      } else if (qt.type === 'Short Questions') {
        prompt += `
        {
          "text": "Explain Newton's first law of motion with an example.",
          "difficulty": "Easy",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
      } else {
        prompt += `
        {
          "text": "Draw a labeled diagram showing the structure of a neuron.",
          "difficulty": "Easy",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
      }
    }
    
    prompt += `
      ]
    }${i < params.questionTypes.length - 1 ? ',' : ''}`;
  }

  // Build dynamic answer key
  let answerKeyEntries = [];
  let counter = 1;
  for (const qt of params.questionTypes) {
    for (let j = 0; j < qt.numberOfQuestions; j++) {
      if (qt.type === 'Multiple Choice Questions') {
        answerKeyEntries.push(`${counter}. C`);
      } else if (qt.type === 'Numerical Problems') {
        answerKeyEntries.push(`${counter}. 10 m/s`);
      } else if (qt.type === 'Short Questions') {
        answerKeyEntries.push(`${counter}. Newton's first law states that an object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force. For example, a book on a table remains stationary until someone pushes it.`);
      } else {
        answerKeyEntries.push(`${counter}. The diagram should show a labeled neuron with dendrites, cell body, axon, and axon terminals.`);
      }
      counter++;
    }
  }

  prompt += `
  ],
  "answerKey": "${answerKeyEntries.join('\\n')}"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Write REAL, MEANINGFUL questions - NOT "Question 1:" or "Sample question".
2. Each question MUST be based on "${params.title}" for ${params.subject}.
3. For MCQ: Include A), B), C), D) options and [Answer: X].
4. For Numerical: Provide the actual calculated answer.
5. Return ONLY valid JSON.
`;

  // ✅ ONLY THIS CHANGED - Model fallback instead of single model
  try {
    let response: string | null = null;
    let usedModel: string | null = null;
    let lastError: any = null;

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
          console.log(`⚠️ Rate limited on ${model}, trying next...`);
        } else if (errorMsg.includes('decommissioned') || errorMsg.includes('not_found')) {
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
    
    console.log(`✅ Generated ${parsed.sections.length} sections using ${usedModel}`);
    
    return parsed;
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}
