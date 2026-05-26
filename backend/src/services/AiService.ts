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
  const prompt = `
You are an expert exam paper generator. Create a question paper with the following specifications:

Subject: ${params.subject}
Class: ${params.className}
Total Marks: ${params.totalMarks}
${params.additionalInstructions ? `Additional Instructions: ${params.additionalInstructions}` : ''}

Question Types and Distribution:
${params.questionTypes.map(qt => `- ${qt.type}: ${qt.numberOfQuestions} questions, ${qt.marksPerQuestion} marks each`).join('\n')}

Generate a JSON response EXACTLY in this format:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "text": "Question text here",
          "difficulty": "Easy",
          "marks": 2
        }
      ]
    }
  ],
  "answerKey": "Optional answer key text"
}

Difficulty levels: Easy, Moderate, Challenging
Distribute difficulties appropriately (60% Easy, 30% Moderate, 10% Challenging)
Make questions relevant to ${params.subject} for class ${params.className}
`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) throw new Error('No response from AI');

  return JSON.parse(response);
}