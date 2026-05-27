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

  let prompt = `You are an expert exam paper generator. Create a complete question paper.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE OF QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

${userInstructions ? `Additional Instructions: ${userInstructions}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION TYPES & DISTRIBUTION (MUST FOLLOW EXACTLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  for (const qt of params.questionTypes) {
    prompt += `► ${qt.type}: ${qt.numberOfQuestions} questions, ${qt.marksPerQuestion} marks each\n`;

    if (qt.type === 'Multiple Choice Questions') {
      prompt += `   **FORMAT FOR EACH MCQ (MUST BE EXACT)**:
   - Write "Question:" followed by the question text.
   - Then on a new line, write "A)" and the first option.
   - Then "B)" and second option.
   - Then "C)" and third option.
   - Then "D)" and fourth option.
   - Then on a new line, write "[Answer: X]" where X is the correct letter.

   **Example (copy this exact style):**
   Question: What is the capital of France?
   A) London
   B) Berlin
   C) Paris
   D) Madrid
   [Answer: C]

   Do NOT use any other formatting. Do NOT omit the line breaks.\n\n`;
    } 
    else if (qt.type === 'Short Questions') {
      prompt += `   FORMAT: Plain question text without any options or answer tags.\n\n`;
    }
    else if (qt.type === 'Diagram/Graph-Based Questions') {
      prompt += `   FORMAT: Description of a diagram or graph to draw/interpret.\n\n`;
    }
    else if (qt.type === 'Numerical Problems') {
      prompt += `   FORMAT: Mathematical problem statement with necessary data.\n\n`;
    }
  }

  prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON OUTPUT STRUCTURE - EXACTLY ${totalSections} SECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a JSON response with EXACTLY ${totalSections} sections. Example:

{
  "sections": [`;

  for (let i = 0; i < params.questionTypes.length; i++) {
    const qt = params.questionTypes[i];
    const sectionName = `Section ${String.fromCharCode(65 + i)} - ${qt.type}`;
    const exampleQuestion = qt.type === 'Multiple Choice Questions' 
      ? `{\n          "text": "Question: Sample question?\\nA) Option1\\nB) Option2\\nC) Option3\\nD) Option4\\n[Answer: A]",\n          "difficulty": "Easy",\n          "marks": ${qt.marksPerQuestion}\n        }`
      : `{\n          "text": "Sample ${qt.type.toLowerCase()} question.",\n          "difficulty": "Moderate",\n          "marks": ${qt.marksPerQuestion}\n        }`;
    
    prompt += `
    {
      "title": "${sectionName}",
      "instruction": "Attempt all questions. Each question carries ${qt.marksPerQuestion} marks.",
      "questions": [
        ${exampleQuestion}
      ]
    }${i < params.questionTypes.length - 1 ? ',' : ''}`;
  }

  prompt += `
  ],
  "answerKey": "1. C\\n2. B\\n3. (Sample answer)\\n..."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULES (STRICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Exactly ${totalSections} sections.
2. Exact question counts:
`;
  for (const qt of params.questionTypes) {
    prompt += `   - ${qt.type}: ${qt.numberOfQuestions} questions\n`;
  }
  prompt += `
3. For MCQs, the "text" field MUST contain the question, four option lines (A), B), C), D)), and the [Answer: X] line.
4. For non‑MCQs, the "text" field MUST NOT contain options or answer tags.
5. Use difficulty: 60% Easy, 30% Moderate, 10% Challenging.
6. Return ONLY valid JSON. No extra text.
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
    console.log('AI response length:', response.length);
    const parsed = JSON.parse(response);
    
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid response: missing sections array');
    }
    
    // Trim extra sections
    if (parsed.sections.length > totalSections) {
      console.warn(`AI returned ${parsed.sections.length} sections, expected ${totalSections}. Truncating.`);
      parsed.sections = parsed.sections.slice(0, totalSections);
    }
    
    // Post‑process: ensure non‑MCQ questions have no options
    for (let i = 0; i < parsed.sections.length; i++) {
      const section = parsed.sections[i];
      const expectedType = params.questionTypes[i]?.type;
      if (expectedType && expectedType !== 'Multiple Choice Questions' && section.questions) {
        section.questions = section.questions.map((q: any) => {
          if (q.text && /[A-D]\)/.test(q.text)) {
            // Remove options and answer tag
            let clean = q.text.replace(/(\n[A-D]\)\s*[^\n]+)+/g, '').replace(/\[Answer:\s*[A-D]\]/i, '').trim();
            if (!clean) clean = q.text.split('\n')[0];
            return { ...q, text: clean };
          }
          return q;
        });
      }
    }
    
    const totalGenerated = parsed.sections.reduce((sum: number, s: any) => sum + (s.questions?.length || 0), 0);
    const expectedTotal = params.questionTypes.reduce((sum, qt) => sum + qt.numberOfQuestions, 0);
    console.log(`✅ Generated ${totalGenerated} / ${expectedTotal} questions`);
    
    return parsed;
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}