import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

  // Check for file content
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

  let prompt = `You are an expert exam paper generator. Create a complete question paper with SEPARATE sections for EACH question type.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: SECTION STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST create EXACTLY ${totalSections} sections - one for EACH question type.
Do NOT mix different question types in the same section.
Do NOT create extra sections.

`;

  if (fileContentText) {
    prompt += `⚠️ **CRITICAL INSTRUCTION**: Generate questions **ONLY** based on the following uploaded file content. 
Do **NOT** use your own knowledge or generate questions about topics not explicitly mentioned in the file.

--- FILE CONTENT (USE THIS EXCLUSIVELY) ---
${fileContentText}
--- END FILE CONTENT ---

`;
  } else {
    prompt += `Generate questions based on the assignment title and subject.\n`;
  }

  prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BASIC INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Assignment Title: ${params.title}
Subject: ${params.subject}
Class: ${params.className}
Total Marks: ${params.totalMarks}
Total Questions: ${totalQuestions}

${userInstructions ? `Additional Instructions: ${userInstructions}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED SECTIONS (CREATE EXACTLY ${totalSections} SECTIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  for (let i = 0; i < params.questionTypes.length; i++) {
    const qt = params.questionTypes[i];
    const sectionLetter = String.fromCharCode(65 + i);
    prompt += `Section ${sectionLetter}: ${qt.type} (${qt.numberOfQuestions} questions, ${qt.marksPerQuestion} marks each)\n`;
  }

  prompt += `\n`;

  for (let i = 0; i < params.questionTypes.length; i++) {
    const qt = params.questionTypes[i];
    const sectionLetter = String.fromCharCode(65 + i);
    
    prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    prompt += `INSTRUCTIONS FOR SECTION ${sectionLetter} - ${qt.type}\n`;
    prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (qt.type === 'Multiple Choice Questions') {
      prompt += `For Section ${sectionLetter}, create ${qt.numberOfQuestions} Multiple Choice Questions.
      
Each MCQ MUST follow this EXACT format in the "text" field:
Question: [your question]?
A) [option 1]
B) [option 2]
C) [option 3]
D) [option 4]
[Answer: X]

Example:
Question: What is the capital of France?
A) London
B) Berlin
C) Paris
D) Madrid
[Answer: C]

IMPORTANT: Use \\n for line breaks. Do NOT put options on the same line as the question.\n\n`;
    } 
    else if (qt.type === 'Short Questions') {
      prompt += `For Section ${sectionLetter}, create ${qt.numberOfQuestions} Short Answer Questions.
Each question should be a clear, concise question expecting a written answer.
Do NOT include options or answer tags in the question text.
Example: Explain the process of photosynthesis.\n\n`;
    }
    else if (qt.type === 'Diagram/Graph-Based Questions') {
      prompt += `For Section ${sectionLetter}, create ${qt.numberOfQuestions} Diagram/Graph based questions.
Example: Draw a labeled diagram of the human heart.\n\n`;
    }
    else if (qt.type === 'Numerical Problems') {
      prompt += `For Section ${sectionLetter}, create ${qt.numberOfQuestions} Numerical Problems.
Example: A car travels 120 km in 2 hours. Calculate its speed.\n\n`;
    }
  }

  prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON OUTPUT STRUCTURE - EXACTLY ${totalSections} SECTIONS
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

    // Add example questions
    for (let j = 0; j < qt.numberOfQuestions; j++) {
      if (qt.type === 'Multiple Choice Questions') {
        prompt += `
        {
          "text": "Question: Sample MCQ question ${j+1}?\\\\nA) Option A\\\\nB) Option B\\\\nC) Option C\\\\nD) Option D\\\\n[Answer: A]",
          "difficulty": "${j === 0 ? 'Easy' : j === 1 ? 'Moderate' : 'Challenging'}",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
      } else {
        prompt += `
        {
          "text": "Sample ${qt.type.toLowerCase()} question ${j+1}.",
          "difficulty": "${j === 0 ? 'Easy' : j === 1 ? 'Moderate' : 'Challenging'}",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
      }
    }
    
    prompt += `
      ]
    }${i < params.questionTypes.length - 1 ? ',' : ''}`;
  }

  prompt += `
  ],
  "answerKey": "1. Answer for first question\\\\n2. Answer for second question\\\\n3. Answer for third question\\\\n..."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES - MUST FOLLOW EXACTLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Create EXACTLY ${totalSections} sections - NO MORE, NO LESS.
2. Each section must contain ONLY its designated question type.
3. Section titles MUST be in format "Section X - Question Type"
4. For MCQ: Include 4 options (A, B, C, D) and [Answer: X] with \\n line breaks.
5. For non-MCQ: NO options, just the question text.
6. The answerKey must contain ${totalQuestions} answers, numbered 1 to ${totalQuestions}.
7. For MCQ answers, use just the letter (e.g., "1. C").
8. For short questions, write a brief model answer (2-3 sentences).
9. Return ONLY valid JSON. No extra text.
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from AI');
    console.log('AI response received, length:', response.length);
    
    const parsed = JSON.parse(response);
    
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid response: missing sections array');
    }
    
    // Trim extra sections if AI added more
    if (parsed.sections.length > totalSections) {
      console.warn(`AI returned ${parsed.sections.length} sections, expected ${totalSections}. Truncating.`);
      parsed.sections = parsed.sections.slice(0, totalSections);
    }
    
    // Fix section titles if needed
    for (let i = 0; i < parsed.sections.length && i < params.questionTypes.length; i++) {
      const expectedType = params.questionTypes[i].type;
      const expectedTitle = `Section ${String.fromCharCode(65 + i)} - ${expectedType}`;
      if (parsed.sections[i].title !== expectedTitle) {
        console.log(`Fixing section title: ${parsed.sections[i].title} -> ${expectedTitle}`);
        parsed.sections[i].title = expectedTitle;
      }
    }
    
    // Clean non-MCQ questions
    for (let i = 0; i < parsed.sections.length && i < params.questionTypes.length; i++) {
      const expectedType = params.questionTypes[i].type;
      const section = parsed.sections[i];
      
      if (expectedType !== 'Multiple Choice Questions' && section.questions) {
        section.questions = section.questions.map((q: any) => {
          if (q.text && /[A-D]\)/.test(q.text)) {
            let cleanText = q.text.replace(/(\n[A-D]\)\s*[^\n]+)+/g, '').replace(/\[Answer:\s*[A-D]\]/i, '').trim();
            if (!cleanText) cleanText = q.text.split('\n')[0];
            return { ...q, text: cleanText };
          }
          return q;
        });
      }
    }
    
    const totalGenerated = parsed.sections.reduce((sum: number, s: any) => sum + (s.questions?.length || 0), 0);
    console.log(`✅ Generated ${totalGenerated} / ${totalQuestions} questions`);
    console.log(`✅ Created ${parsed.sections.length} sections`);
    
    return parsed;
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}