const { QuestionBank, Course } = require('../models');

const mockQuestions = {
  'Data Structures & Algorithms': [
    { question: 'What is the time complexity of binary search?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], correctIndex: 1 },
    { question: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correctIndex: 1 },
    { question: 'What is a balanced binary tree?', options: ['Left and right subtrees height differ by at most 1', 'All leaves are at the same level', 'Every node has exactly 2 children', 'None of the above'], correctIndex: 0 },
    { question: 'Which algorithm is used to find the shortest path?', options: ['DFS', 'Dijkstra', 'Kruskal', 'Prim'], correctIndex: 1 },
    { question: 'What is the worst-case time complexity of QuickSort?', options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(1)'], correctIndex: 2 },
    { question: 'Which data structure is used for BFS?', options: ['Stack', 'Queue', 'Array', 'Linked List'], correctIndex: 1 },
    { question: 'What does a Hash Table use to compute an index?', options: ['Binary Search', 'Hash Function', 'Sorting Algorithm', 'Linked List'], correctIndex: 1 },
    { question: 'What is the best case time complexity for Bubble Sort?', options: ['O(1)', 'O(n)', 'O(n log n)', 'O(n^2)'], correctIndex: 1 },
    { question: 'In a max heap, where is the largest element located?', options: ['Leaf', 'Root', 'Left child', 'Right child'], correctIndex: 1 },
    { question: 'Which traversal visits the root first?', options: ['Inorder', 'Preorder', 'Postorder', 'Level-order'], correctIndex: 1 }
  ],
  'Database Management Systems': [
    { question: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Question Language', 'Strong Query Language', 'Standard Query Logic'], correctIndex: 0 },
    { question: 'Which command is used to extract data from a database?', options: ['GET', 'EXTRACT', 'SELECT', 'PULL'], correctIndex: 2 },
    { question: 'What is a Primary Key?', options: ['A key used for encryption', 'A unique identifier for a record', 'A foreign key', 'A candidate key'], correctIndex: 1 },
    { question: 'Which normal form eliminates partial dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctIndex: 1 },
    { question: 'What does ACID stand for?', options: ['Atomicity, Consistency, Isolation, Durability', 'Active, Consistent, Isolated, Durable', 'Automatic, Continuous, Independent, Dynamic', 'None of the above'], correctIndex: 0 },
    { question: 'Which JOIN returns all records when there is a match in either left or right table?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], correctIndex: 3 },
    { question: 'What is a foreign key?', options: ['A primary key in another table', 'A unique index', 'A null constraint', 'A default value'], correctIndex: 0 },
    { question: 'What is normalization used for?', options: ['Increase data redundancy', 'Decrease data redundancy', 'Make queries slower', 'None of the above'], correctIndex: 1 },
    { question: 'Which command is a DDL command?', options: ['SELECT', 'INSERT', 'UPDATE', 'CREATE'], correctIndex: 3 },
    { question: 'What is a transaction?', options: ['A single query', 'A sequence of operations performed as a single logical unit of work', 'A backup', 'A network packet'], correctIndex: 1 }
  ],
  'Artificial Intelligence': [
    { question: 'What is Artificial Intelligence?', options: ['Making a computer smart', 'Programming with Python', 'A new CPU architecture', 'None of the above'], correctIndex: 0 },
    { question: 'Which search algorithm guarantees the shortest path?', options: ['DFS', 'A*', 'Hill Climbing', 'Simulated Annealing'], correctIndex: 1 },
    { question: 'What is Machine Learning?', options: ['Learning from data', 'Hardcoding rules', 'A type of database', 'A web framework'], correctIndex: 0 },
    { question: 'What is a neural network inspired by?', options: ['Biological brains', 'Computer networks', 'Graphs', 'Trees'], correctIndex: 0 },
    { question: 'Which activation function is commonly used in hidden layers?', options: ['Linear', 'Sigmoid', 'ReLU', 'Softmax'], correctIndex: 2 },
    { question: 'What does NLP stand for?', options: ['Natural Language Processing', 'New Linear Programming', 'Neural Logic Protocol', 'None of the above'], correctIndex: 0 },
    { question: 'What is supervised learning?', options: ['Learning with labeled data', 'Learning without labeled data', 'Learning by playing games', 'Learning by reading books'], correctIndex: 0 },
    { question: 'What is reinforcement learning?', options: ['Learning by trial and error with rewards', 'Learning from a teacher', 'Learning by clustering', 'Learning by compressing data'], correctIndex: 0 },
    { question: 'What is a Turing Test used for?', options: ['Testing computer speed', 'Testing machine intelligence', 'Testing software bugs', 'Testing network latency'], correctIndex: 1 },
    { question: 'What is deep learning?', options: ['Machine learning with deep neural networks', 'Learning deep concepts', 'A new programming language', 'A type of search algorithm'], correctIndex: 0 }
  ]
};

async function seedQuestionBank() {
  try {
    const courses = await Course.findAll();
    let count = 0;
    
    for (const course of courses) {
      const questionsForCourse = mockQuestions[course.name];
      if (questionsForCourse) {
        // Clear existing questions for this course
        await QuestionBank.destroy({ where: { course_id: course.id } });
        
        // Add new ones
        for (const q of questionsForCourse) {
          await QuestionBank.create({
            course_id: course.id,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex
          });
          count++;
        }
      } else {
        // Fallback for other courses: create 10 generic questions
        await QuestionBank.destroy({ where: { course_id: course.id } });
        for (let i = 1; i <= 10; i++) {
          await QuestionBank.create({
            course_id: course.id,
            question: `Generic Question ${i} for ${course.name}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: Math.floor(Math.random() * 4)
          });
          count++;
        }
      }
    }
    console.log(`Successfully seeded ${count} questions into the Question Bank.`);
  } catch (error) {
    console.error('Error seeding questions:', error);
  }
}

module.exports = seedQuestionBank;
