import mongoose, { Document, Schema } from 'mongoose';

export interface ICodingQuestion extends Document {
  id: string;
  title: string;
  category: 'coding';
  subcategory: 'algorithms' | 'data-structures' | 'system-design' | 'frontend' | 'backend' | 'database';
  difficulty: 'easy' | 'medium' | 'hard';
  experienceLevel: 'fresher' | 'mid' | 'senior';
  domain: string[]; // ['frontend', 'backend', 'fullstack', 'general']
  
  // Question Details
  problemStatement: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  
  // Code Template
  codeTemplate: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
  };
  
  // Solution & Evaluation
  expectedSolution?: {
    javascript?: string;
    python?: string;
    java?: string;
    cpp?: string;
  };
  
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
  
  evaluationCriteria: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
  
  // Interview Context
  aiPrompt: string; // How AI should ask this question
  followUpQuestions: string[];
  hints: string[];
  
  // Metadata
  tags: string[];
  estimatedTime: number; // minutes
  usageCount: number;
  successRate: number;
  averageTimeSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

const CodingQuestionSchema = new Schema<ICodingQuestion>({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['coding'],
    default: 'coding'
  },
  subcategory: {
    type: String,
    enum: ['algorithms', 'data-structures', 'system-design', 'frontend', 'backend', 'database'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['fresher', 'mid', 'senior'],
    required: true
  },
  domain: [{
    type: String,
    enum: ['frontend', 'backend', 'fullstack', 'general']
  }],
  
  problemStatement: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  
  codeTemplate: {
    javascript: String,
    python: String,
    java: String,
    cpp: String
  },
  
  expectedSolution: {
    javascript: String,
    python: String,
    java: String,
    cpp: String
  },
  
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: {
      type: Boolean,
      default: false
    }
  }],
  
  evaluationCriteria: [String],
  timeComplexity: String,
  spaceComplexity: String,
  
  aiPrompt: {
    type: String,
    required: true
  },
  followUpQuestions: [String],
  hints: [String],
  
  tags: [String],
  estimatedTime: {
    type: Number,
    default: 15
  },
  usageCount: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  },
  averageTimeSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
CodingQuestionSchema.index({ difficulty: 1, experienceLevel: 1 });
CodingQuestionSchema.index({ subcategory: 1, domain: 1 });
CodingQuestionSchema.index({ tags: 1 });
CodingQuestionSchema.index({ usageCount: -1 });
CodingQuestionSchema.index({ successRate: -1 });

export const CodingQuestion = mongoose.model<ICodingQuestion>('CodingQuestion', CodingQuestionSchema);