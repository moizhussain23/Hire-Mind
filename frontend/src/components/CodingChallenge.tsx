import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Clock, CheckCircle, AlertCircle, Code, Play, Send } from 'lucide-react';

interface CodingChallengeProps {
  question: {
    id: string;
    title: string;
    difficulty: string;
    problemStatement: string;
    description: string;
    examples: Array<{
      input: string;
      output: string;
      explanation?: string;
    }>;
    constraints: string[];
    codeTemplate: {
      javascript: string;
      python: string;
      java: string;
      cpp: string;
    };
    estimatedTime: number;
    hints: string[];
  };
  onSubmit: (code: string, language: string, timeSpent: number) => void;
  onCancel?: () => void;
}

const CodingChallenge: React.FC<CodingChallengeProps> = ({
  question,
  onSubmit,
  onCancel
}) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<'javascript' | 'python' | 'java' | 'cpp'>('javascript');
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [showHints, setShowHints] = useState(false);

  // Initialize code template when language changes
  useEffect(() => {
    if (question.codeTemplate[language]) {
      setCode(question.codeTemplate[language]);
    }
  }, [language, question.codeTemplate]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(code, language, timeSpent);
    } finally {
      setIsSubmitting(false);
    }
  };

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'java', label: 'Java', icon: '☕' },
    { value: 'cpp', label: 'C++', icon: '⚡' }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Code className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">{question.title}</h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty.toUpperCase()}
                </span>
                <span className="text-gray-400 text-sm">
                  Estimated: {question.estimatedTime} minutes
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-mono text-lg">
                {formatTime(timeSpent)}
              </span>
            </div>
            
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
              >
                Back to Interview
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Problem Description */}
          <div className="bg-gray-800 rounded-lg p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Problem Description</h2>
            
            <div className="space-y-6">
              {/* Problem Statement */}
              <div>
                <p className="text-gray-300 leading-relaxed">{question.description}</p>
              </div>

              {/* Examples */}
              {question.examples && question.examples.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Examples</h3>
                  <div className="space-y-4">
                    {question.examples.map((example, index) => (
                      <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <div className="mb-2">
                          <span className="text-sm text-gray-400">Input:</span>
                          <code className="block bg-gray-800 p-2 rounded mt-1 text-green-400 font-mono text-sm">
                            {example.input}
                          </code>
                        </div>
                        <div className="mb-2">
                          <span className="text-sm text-gray-400">Output:</span>
                          <code className="block bg-gray-800 p-2 rounded mt-1 text-blue-400 font-mono text-sm">
                            {example.output}
                          </code>
                        </div>
                        {example.explanation && (
                          <div>
                            <span className="text-sm text-gray-400">Explanation:</span>
                            <p className="text-sm text-gray-300 mt-1">{example.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints */}
              {question.constraints && question.constraints.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">Constraints</h3>
                  <ul className="space-y-1">
                    {question.constraints.map((constraint, index) => (
                      <li key={index} className="text-gray-300 text-sm flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        <code className="font-mono bg-gray-900 px-1 rounded">{constraint}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints */}
              {question.hints && question.hints.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-purple-400 hover:text-purple-300 font-semibold mb-3 flex items-center"
                  >
                    💡 {showHints ? 'Hide' : 'Show'} Hints ({question.hints.length})
                  </button>
                  {showHints && (
                    <div className="space-y-2">
                      {question.hints.map((hint, index) => (
                        <div key={index} className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-3">
                          <p className="text-purple-200 text-sm">{hint}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Code Editor */}
          <div className="bg-gray-800 rounded-lg overflow-hidden flex flex-col">
            {/* Editor Header */}
            <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold">Code Editor</h3>
                <select
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value as 'javascript' | 'python' | 'java' | 'cpp';
                    setLanguage(newLang);
                    // Update code template when language changes
                    if (question.codeTemplate[newLang]) {
                      setCode(question.codeTemplate[newLang]);
                    }
                  }}
                  className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !code.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Solution</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  wordWrap: 'on',
                  contextmenu: true,
                  selectOnLineNumbers: true,
                  roundedSelection: false,
                  readOnly: false,
                  cursorStyle: 'line',
                  folding: true,
                  showFoldingControls: 'always'
                }}
              />
            </div>

            {/* Editor Footer */}
            <div className="bg-gray-900 px-4 py-2 border-t border-gray-700 text-xs text-gray-400">
              <div className="flex items-center justify-between">
                <span>Press Ctrl+S to save • Ctrl+/ to comment</span>
                <span>{code.length} characters</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingChallenge;