import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface GenerateParams {
  subject: string;
  className: string;
  questionTypes: Array<{ type: string; numberOfQuestions: number; marksPerQuestion: number }>;
  totalMarks: number;
  additionalInstructions?: string;
}

export async function generateQuestionPaper(params: GenerateParams) {
  // Separate MCQ from other question types
  const mcqType = params.questionTypes.find(qt => qt.type === 'Multiple Choice Questions');
  const otherTypes = params.questionTypes.filter(qt => qt.type !== 'Multiple Choice Questions');
  
  let prompt = `You are an expert exam paper generator. Create a question paper with the following specifications:

Subject: ${params.subject}
Class: ${params.className}
Total Marks: ${params.totalMarks}
${params.additionalInstructions ? `Additional Instructions: ${params.additionalInstructions}` : ''}

Question Types and Distribution:
${params.questionTypes.map(qt => `- ${qt.type}: ${qt.numberOfQuestions} questions, ${qt.marksPerQuestion} marks each`).join('\n')}

`;

  // Add specific MCQ formatting instructions
  if (mcqType) {
    prompt += `
╔══════════════════════════════════════════════════════════════╗
║           MULTIPLE CHOICE QUESTIONS FORMAT                    ║
╚══════════════════════════════════════════════════════════════╝

For the ${mcqType.numberOfQuestions} Multiple Choice Questions, you MUST use this EXACT format:

Question: [Your question text]?
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
[Answer: X]

EXAMPLE:
Question: What is the primary function of the mitochondria?
A) Protein synthesis
B) Energy production
C) Waste removal
D) Cell division
[Answer: B]

IMPORTANT RULES FOR MCQ:
1. Each question MUST have exactly 4 options (A, B, C, D)
2. The correct answer MUST be indicated as [Answer: X] on a new line
3. Do NOT use any markdown or special formatting
4. Questions MUST be based on ${params.subject} for class ${params.className}

`;
  }

  // Add instructions for other question types
  if (otherTypes.length > 0) {
    prompt += `
For other question types:
`;
    otherTypes.forEach(qt => {
      prompt += `- ${qt.type}: Clear, concise questions appropriate for the format\n`;
    });
    prompt += `\n`;
  }

  prompt += `
Generate a JSON response EXACTLY in this format:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "text": "Question text here${mcqType ? '\\nA) Option 1\\nB) Option 2\\nC) Option 3\\nD) Option 4\\n[Answer: A]' : ''}",
          "difficulty": "Easy",
          "marks": 2
        }
      ]
    }
  ],
  "answerKey": "Answer key with correct answers"
}

Difficulty levels: Easy, Moderate, Challenging
Distribute difficulties appropriately (60% Easy, 30% Moderate, 10% Challenging)
Make questions relevant to ${params.subject} for class ${params.className}

CRITICAL: For Multiple Choice Questions, the "text" field MUST contain the question followed by line breaks and the four options (A, B, C, D) and the [Answer: X] tag.
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from AI');

    const parsed = JSON.parse(response);
    
    // Post-process to ensure MCQ format is correct
    if (mcqType && parsed.sections) {
      parsed.sections = parsed.sections.map((section: any) => ({
        ...section,
        questions: section.questions.map((q: any) => {
          // If it's an MCQ but doesn't have options format, add note
          if (!q.text.includes('A)') && !q.text.includes('A.')) {
            q.text = q.text + '\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4\n[Answer: A]';
          }
          return q;
        })
      }));
    }
    
    return parsed;
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}