const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

let genAI = null;
let model = null;

const SYSTEM_PROMPT = `You are "Pragati", an intelligent AI learning assistant for Vridhi Mitra, an AI-powered student performance and personalized learning platform. 

Your role:
- Help students understand concepts across all subjects
- Suggest study strategies and learning resources
- Answer academic questions clearly and concisely
- Motivate students and provide encouragement
- Help with placement preparation (aptitude, coding, interviews)
- Provide study plans based on student needs

Guidelines:
- Be friendly, supportive, and encouraging
- Give concise but thorough answers
- Use examples when explaining concepts
- Format responses with markdown for readability
- If asked about non-academic topics, gently redirect to learning
- Always be positive about the student's ability to improve`;

const initializeAI = () => {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    console.log('✅ Google Gemini AI initialized.');
  } else {
    console.warn('⚠️  GEMINI_API_KEY not set. AI features will use mock responses.');
  }
};

/**
 * Chat with Pragati Bot
 */
const chatWithPragati = async (message, conversationHistory = []) => {
  if (!model) {
    return getMockResponse(message);
  }

  try {
    // Build history with system context in the first exchange
    const history = [];
    if (conversationHistory.length === 0) {
      // First message: inject system prompt as context
      history.push(
        { role: 'user', parts: [{ text: 'System: ' + SYSTEM_PROMPT + '\n\nPlease acknowledge and respond as Pragati.' }] },
        { role: 'model', parts: [{ text: 'Understood! I am Pragati, your AI learning assistant. I am ready to help you with your studies, explain concepts, create study plans, and assist with placement preparation. How can I help you today? 😊' }] }
      );
    }

    // Add conversation history
    conversationHistory.forEach(msg => {
      history.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini AI error:', error.message);
    return getMockResponse(message);
  }
};

/**
 * Analyze student performance and generate recommendations
 */
const analyzePerformance = async (studentData) => {
  if (!model) {
    return getMockAnalysis(studentData);
  }

  try {
    const prompt = `Analyze this student's academic performance data and provide personalized recommendations.

Student Data:
${JSON.stringify(studentData, null, 2)}

Please provide your analysis in the following JSON format:
{
  "overallAssessment": "Brief overall assessment",
  "strengths": ["strength1", "strength2"],
  "weakAreas": [
    {"subject": "subject name", "topic": "specific topic", "severity": "high/medium/low", "suggestion": "what to do"}
  ],
  "learningPaths": [
    {"title": "Path title", "topic": "Topic", "description": "What to study", "priority": "high/medium/low", "estimatedDays": 7, "resources": ["resource1", "resource2"]}
  ],
  "studyPlan": {
    "daily": ["task1", "task2"],
    "weekly": ["goal1", "goal2"]
  },
  "predictedImprovement": "Expected improvement if recommendations are followed",
  "motivationalMessage": "An encouraging message for the student"
}

Return ONLY valid JSON, no markdown code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Analysis error:', error.message);
    return getMockAnalysis(studentData);
  }
};

/**
 * Generate quiz questions for a topic
 */
const generateQuiz = async (topic, difficulty = 'medium', count = 5) => {
  if (!model) {
    return getMockQuiz(topic);
  }

  try {
    const prompt = `Generate ${count} ${difficulty} difficulty multiple-choice questions about "${topic}".

Return in this JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ]
}

Return ONLY valid JSON, no markdown code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Quiz generation error:', error.message);
    return getMockQuiz(topic);
  }
};

/**
 * Generate interview questions based on resume text
 */
const generateInterviewQuestions = async (resumeText) => {
  if (!model) {
    return getMockInterviewQuestions(resumeText);
  }

  try {
    const prompt = `You are an expert technical interviewer. Based on the following resume, generate 6 interview questions.

Mix of question types:
- 2 Technical questions based on skills/projects mentioned
- 2 Behavioral/situational questions
- 1 Problem-solving question
- 1 Career goals/aspirations question

Resume:
${resumeText}

Return in this JSON format:
{
  "candidateSummary": "Brief summary of the candidate's profile",
  "questions": [
    {
      "id": 1,
      "question": "The interview question",
      "type": "technical|behavioral|problem-solving|career",
      "difficulty": "easy|medium|hard",
      "context": "Why this question is relevant to their resume"
    }
  ]
}

Return ONLY valid JSON, no markdown code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Interview question generation error:', error.message);
    return getMockInterviewQuestions(resumeText);
  }
};

/**
 * Evaluate interview answers and provide feedback
 */
const evaluateInterviewAnswers = async (questions, answers, resumeText) => {
  if (!model) {
    return getMockInterviewEvaluation(questions, answers);
  }

  try {
    const qaPairs = questions.map((q, i) => ({
      question: q.question,
      type: q.type,
      studentAnswer: answers[i] || '(No answer provided)'
    }));

    const prompt = `You are an expert interview evaluator. A student just completed a mock interview. Evaluate their answers thoroughly.

Candidate Resume Summary:
${resumeText.substring(0, 1000)}

Interview Q&A:
${JSON.stringify(qaPairs, null, 2)}

Provide detailed evaluation in this JSON format:
{
  "overallScore": 75,
  "overallGrade": "B+",
  "overallFeedback": "Overall assessment of the interview performance",
  "questionEvaluations": [
    {
      "questionNumber": 1,
      "score": 80,
      "strengths": ["What the student did well"],
      "improvements": ["What could be improved"],
      "idealAnswer": "Brief outline of what an ideal answer would cover",
      "feedback": "Detailed feedback for this answer"
    }
  ],
  "keyStrengths": ["Overall strength 1", "Overall strength 2"],
  "areasToImprove": [
    {
      "area": "Area name",
      "suggestion": "How to improve",
      "resources": ["Recommended resource"]
    }
  ],
  "communicationFeedback": {
    "clarity": 70,
    "depth": 65,
    "relevance": 80,
    "confidence": 75
  },
  "nextSteps": ["Actionable step 1", "Actionable step 2", "Actionable step 3"],
  "motivationalMessage": "Encouraging closing message"
}

Return ONLY valid JSON, no markdown code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Interview evaluation error:', error.message);
    return getMockInterviewEvaluation(questions, answers);
  }
};

// ============ MOCK RESPONSES (when AI is unavailable) ============

const getMockResponse = (message) => {
  const responses = [
    `That's a great question! Here's what I think about "${message.substring(0, 50)}...":\n\nThis topic requires understanding the fundamentals first. I'd recommend starting with the basics and building up gradually. Practice with examples, and don't hesitate to revisit concepts you find challenging.\n\n💡 **Tip**: Break complex topics into smaller parts and tackle them one at a time.`,
    `I'd be happy to help with that! 📚\n\nBased on your question, here are some key points to consider:\n1. **Understand the core concept** - Make sure the foundation is strong\n2. **Practice regularly** - Consistency is key to mastering any topic\n3. **Use multiple resources** - Different perspectives help understanding\n\nKeep going, you're doing great! 🌟`,
    `Great question! Let me break this down for you:\n\n**Key Concepts:**\n- Start with the theoretical foundation\n- Move to practical examples\n- Test your understanding with problems\n\n**Recommended Approach:**\n1. Read the textbook chapter\n2. Watch explanatory videos\n3. Solve practice problems\n4. Review and revise\n\nYou've got this! 💪`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

const getMockAnalysis = (data) => ({
  overallAssessment: 'The student shows promising potential with room for improvement in specific areas. Consistent effort in weak subjects will lead to significant progress.',
  strengths: ['Good attendance record', 'Strong performance in practical assessments'],
  weakAreas: [
    { subject: 'Mathematics', topic: 'Calculus', severity: 'high', suggestion: 'Focus on differential equations and integration techniques' },
    { subject: 'Programming', topic: 'Data Structures', severity: 'medium', suggestion: 'Practice linked lists, trees, and graph algorithms' }
  ],
  learningPaths: [
    { title: 'Master Calculus Fundamentals', topic: 'Mathematics - Calculus', description: 'Strengthen core calculus concepts through structured practice', priority: 'high', estimatedDays: 14, resources: ['Khan Academy Calculus', 'MIT OCW 18.01'] },
    { title: 'Data Structures Deep Dive', topic: 'Computer Science - DSA', description: 'Build strong DSA foundations for placement prep', priority: 'medium', estimatedDays: 21, resources: ['GeeksforGeeks DSA', 'LeetCode Easy Problems'] }
  ],
  studyPlan: {
    daily: ['30 min calculus practice', '2 coding problems', 'Review class notes'],
    weekly: ['Complete one full topic', 'Take a practice test', 'Review weak areas']
  },
  predictedImprovement: 'With consistent effort, expect 15-20% improvement in weak areas within 4 weeks.',
  motivationalMessage: 'Every expert was once a beginner. Your dedication to improvement will pay off! 🌟'
});

const getMockQuiz = (topic) => ({
  questions: [
    {
      question: `What is the fundamental concept behind ${topic}?`,
      options: ['A) Theory of computation', 'B) Core principles and foundations', 'C) Advanced implementations', 'D) None of the above'],
      correctAnswer: 'B',
      explanation: 'Understanding the core principles forms the foundation for advanced learning.'
    },
    {
      question: `Which approach is best for learning ${topic}?`,
      options: ['A) Memorization only', 'B) Practice without theory', 'C) Balanced theory and practice', 'D) Skipping fundamentals'],
      correctAnswer: 'C',
      explanation: 'A balanced approach of theory and practice leads to deeper understanding.'
    },
    {
      question: `What is a common challenge when studying ${topic}?`,
      options: ['A) Too simple to learn', 'B) Lack of resources', 'C) Understanding abstract concepts', 'D) It requires no practice'],
      correctAnswer: 'C',
      explanation: 'Abstract concepts often require multiple examples and practice to fully understand.'
    }
  ]
});

const getMockInterviewQuestions = (resumeText) => ({
  candidateSummary: 'A motivated student with skills in programming and problem-solving, looking to build a career in software development.',
  questions: [
    { id: 1, question: 'Tell me about a project you worked on that you are most proud of. What was your role and what challenges did you face?', type: 'behavioral', difficulty: 'medium', context: 'Based on projects mentioned in resume' },
    { id: 2, question: 'Explain the difference between an array and a linked list. When would you use one over the other?', type: 'technical', difficulty: 'medium', context: 'Core data structures knowledge' },
    { id: 3, question: 'How would you design a URL shortening service like bit.ly? Walk me through your approach.', type: 'problem-solving', difficulty: 'hard', context: 'System design thinking' },
    { id: 4, question: 'Describe a situation where you had to learn a new technology quickly. How did you approach it?', type: 'behavioral', difficulty: 'easy', context: 'Adaptability and learning ability' },
    { id: 5, question: 'What is the time complexity of searching in a binary search tree vs a hash table?', type: 'technical', difficulty: 'medium', context: 'Algorithm fundamentals' },
    { id: 6, question: 'Where do you see yourself in 3-5 years and how does this role align with your career goals?', type: 'career', difficulty: 'easy', context: 'Career aspirations' }
  ]
});

const getMockInterviewEvaluation = (questions, answers) => ({
  overallScore: 72,
  overallGrade: 'B',
  overallFeedback: 'Good effort overall! You demonstrated solid foundational knowledge with room for improvement in depth and specificity. Practice articulating your thoughts more clearly and backing up answers with concrete examples.',
  questionEvaluations: questions.map((q, i) => ({
    questionNumber: i + 1,
    score: 65 + Math.floor(Math.random() * 25),
    strengths: ['Showed understanding of the core concept', 'Good attempt at structuring the answer'],
    improvements: ['Could provide more specific examples', 'Consider discussing trade-offs and edge cases'],
    idealAnswer: 'A comprehensive answer would include specific examples, mention trade-offs, and demonstrate practical experience.',
    feedback: 'Your answer covered the basics well. To improve, try to include real-world examples from your projects and discuss the trade-offs involved in your decisions.'
  })),
  keyStrengths: ['Good foundational knowledge', 'Clear communication style', 'Willingness to attempt challenging questions'],
  areasToImprove: [
    { area: 'Technical Depth', suggestion: 'Practice explaining complex concepts with examples', resources: ['LeetCode', 'GeeksforGeeks'] },
    { area: 'STAR Method', suggestion: 'Structure behavioral answers using Situation-Task-Action-Result', resources: ['YouTube: STAR Interview Method'] },
    { area: 'System Design', suggestion: 'Study common system design patterns', resources: ['System Design Primer on GitHub'] }
  ],
  communicationFeedback: { clarity: 70, depth: 65, relevance: 78, confidence: 72 },
  nextSteps: ['Practice 2 coding problems daily on LeetCode', 'Prepare 5 STAR stories from your experience', 'Study system design fundamentals for 30 min daily'],
  motivationalMessage: 'Great start! Every interview is a learning opportunity. With consistent practice, you will ace your next one! 🚀'
});

module.exports = { initializeAI, chatWithPragati, analyzePerformance, generateQuiz, generateInterviewQuestions, evaluateInterviewAnswers };
