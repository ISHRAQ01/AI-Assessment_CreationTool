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

  let prompt = `You are an expert exam paper generator. Create a complete question paper with questions AND their correct answers.

╔═══════════════════════════════════════════════════════════════════════════════╗
║                    CRITICAL: YOU MUST PROVIDE REAL ANSWERS                     ║
╚═══════════════════════════════════════════════════════════════════════════════╝

For EVERY question you generate, you MUST provide the REAL correct answer in the answerKey field.
- For Multiple Choice Questions: Provide the correct letter (A, B, C, or D)
- For Short Questions: Write a complete 2-3 sentence model answer
- For Numerical Problems: Calculate and provide the final number with units
- For Diagram Questions: Describe what the diagram should show

DO NOT use placeholders like "Answer will vary", "Teacher should provide", or "Model answer for...".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXACT SECTION ORDER (MUST FOLLOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sectionsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION SOURCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  if (fileContentText) {
    prompt += `Generate questions based ONLY on this content:

--- CONTENT ---
${fileContentText}
--- END CONTENT ---

`;
  } else {
    prompt += `Generate questions about: "${params.title}" for ${params.subject} class ${params.className}\n`;
  }

  prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT RULES BY QUESTION TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  for (let i = 0; i < params.questionTypes.length; i++) {
    const qt = params.questionTypes[i];
    const sectionLetter = String.fromCharCode(65 + i);
    
    prompt += `SECTION ${sectionLetter}: ${qt.type}\n`;
    
    if (qt.type === 'Multiple Choice Questions') {
      prompt += `   Each MCQ question text MUST include:
   Question: [question]?
   A) [option]
   B) [option]
   C) [option]
   D) [option]
   [Answer: X]
   
   Example:
   Question: What is 2+2?
   A) 3
   B) 4
   C) 5
   D) 6
   [Answer: B]
   
`;
    } 
    else if (qt.type === 'Short Questions') {
      prompt += `   Each Short Question: Plain question text without options.
   In answerKey, write a REAL 2-3 sentence answer.
   
   Example question: Explain the process of photosynthesis.
   Example answer in answerKey: Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. It occurs in the chloroplasts and is essential for plant growth.
   
`;
    }
    else if (qt.type === 'Numerical Problems') {
      prompt += `   Each Numerical Problem: Provide the problem statement.
   In answerKey, calculate and provide the ACTUAL number with units.
   
   Example question: A car travels 120 km in 2 hours. Calculate its speed.
   Example answer in answerKey: 60 km/h
   
`;
    }
    else if (qt.type === 'Diagram/Graph-Based Questions') {
      prompt += `   Each Diagram Question: Describe what to draw.
   In answerKey, describe what the correct diagram should show.
   
   Example question: Draw a labeled diagram of the human heart.
   Example answer in answerKey: A diagram showing the four chambers: right atrium, right ventricle, left atrium, left ventricle, with labeled blood vessels (aorta, pulmonary artery, vena cava).
   
`;
    }
    prompt += `\n`;
  }

  prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON OUTPUT STRUCTURE
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
          "text": "Question: Question ${j+1}?\\\\nA) Option A\\\\nB) Option B\\\\nC) Option C\\\\nD) Option D\\\\n[Answer: A]",
          "difficulty": "Easy",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
      } else if (qt.type === 'Short Questions') {
        prompt += `
        {
          "text": "Short question ${j+1}: What is the main concept?",
          "difficulty": "Easy",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
      } else if (qt.type === 'Numerical Problems') {
        prompt += `
        {
          "text": "Numerical problem ${j+1}: Calculate the value.",
          "difficulty": "Easy",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
      } else {
        prompt += `
        {
          "text": "${qt.type} question ${j+1}.",
          "difficulty": "Easy",
          "marks": ${qt.marksPerQuestion}
        }${j < qt.numberOfQuestions - 1 ? ',' : ''}`;
      }
    }
    
    prompt += `
      ]
    }${i < params.questionTypes.length - 1 ? ',' : ''}`;
  }

  // Build answer key example with real answers
  let answerKeyExample = '"';
  let counter = 1;
  for (const qt of params.questionTypes) {
    for (let j = 0; j < qt.numberOfQuestions; j++) {
      if (qt.type === 'Multiple Choice Questions') {
        answerKeyExample += `${counter}. A`;
      } else if (qt.type === 'Short Questions') {
        answerKeyExample += `${counter}. This is a real model answer that directly answers the question with 2-3 complete sentences.`;
      } else if (qt.type === 'Numerical Problems') {
        answerKeyExample += `${counter}. 42 units`;
      } else {
        answerKeyExample += `${counter}. The diagram should show the key components as described.`;
      }
      answerKeyExample += counter < totalQuestions ? '\\n' : '';
      counter++;
    }
  }
  answerKeyExample += '"';

  prompt += `
  ],
  "answerKey": ${answerKeyExample}
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL INSTRUCTIONS - READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Create EXACTLY ${totalSections} sections in the order shown above.
2. For EACH question, generate REAL, SPECIFIC answers in the answerKey field.
3. For Numerical Problems: DO NOT write formulas. Write the ACTUAL CALCULATED NUMBER.
4. For Short Questions: DO NOT write "Answer will vary". Write REAL model answers.
5. For Diagram Questions: DO NOT write "Diagram should show". Write WHAT it should show.
6. The answerKey MUST have ${totalQuestions} entries numbered 1 to ${totalQuestions}.
7. Return ONLY valid JSON. No extra text before or after.
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
    
    // Fix section titles to ensure correct order
    const fixedSections: any[] = [];
    for (let i = 0; i < params.questionTypes.length && i < parsed.sections.length; i++) {
      const expectedType = params.questionTypes[i].type;
      const expectedTitle = `Section ${String.fromCharCode(65 + i)} - ${expectedType}`;
      if (parsed.sections[i]) {
        parsed.sections[i].title = expectedTitle;
      }
      fixedSections.push(parsed.sections[i]);
    }
    parsed.sections = fixedSections;
    
    // Also ensure answerKey has correct number of entries
    if (parsed.answerKey) {
      const answerLines = parsed.answerKey.split('\\n').filter((l: string) => l.match(/^\d+\./));
      if (answerLines.length !== totalQuestions) {
        console.warn(`Answer key has ${answerLines.length} entries, expected ${totalQuestions}`);
      }
    }
    
    console.log(`✅ Generated ${parsed.sections.length} sections`);
    
    return parsed;
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}