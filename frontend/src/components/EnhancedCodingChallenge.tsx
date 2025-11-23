import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';

interface TestCase {
  input: any[];
  expectedOutput: any;
  description?: string;
  hidden?: boolean;
}

interface TestResult {
  passed: boolean;
  description?: string;
  input: any;
  expectedOutput: any;
  actualOutput: any;
  executionTime: number;
  error?: string;
}

interface CodingProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  functionName: string;
  signature: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  testCases: TestCase[];
  constraints?: string[];
}

interface Props {
  problem: CodingProblem;
  language: 'javascript' | 'python' | 'java';
  onSubmit: (code: string, results: any) => void;
  interviewMode?: boolean;
}

const EnhancedCodingChallenge: React.FC<Props> = ({
  problem,
  language,
  onSubmit,
  interviewMode = false
}) => {
  const [code, setCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [codeQuality, setCodeQuality] = useState<any>(null);
  const [suspiciousActivity, setSuspiciousActivity] = useState<any>(null);
  const [copyPasteDetected, setCopyPasteDetected] = useState(false);
  const [keystrokes, setKeystrokes] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const editorRef = useRef<any>(null);

  // Initialize with function signature
  useEffect(() => {
    if (problem) {
      setCode(problem.signature);
      setStartTime(new Date());
    }
  }, [problem]);

  // Monitor keystrokes for behavior analysis
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Track keystrokes
    editor.onKeyDown(() => {
      setKeystrokes(prev => prev + 1);
    });

    // Track paste events
    editor.onDidPaste(() => {
      setPasteCount(prev => prev + 1);
      if (pasteCount > 2) {
        setCopyPasteDetected(true);
      }
    });

    // Configure editor for interview mode
    if (interviewMode) {
      editor.updateOptions({
        contextmenu: false, // Disable right-click menu
        quickSuggestions: false, // Disable auto-complete
        suggestOnTriggerCharacters: false,
        wordBasedSuggestions: false,
        parameterHints: { enabled: false },
        hover: { enabled: false }
      });
    }
  };

  const runCode = async () => {
    if (!code.trim() || isRunning) return;

    setIsRunning(true);
    setShowResults(false);

    try {
      const response = await fetch('/api/coding/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code: code.trim(),
          language,
          questionId: problem.id,
          functionName: problem.functionName,
          testCases: problem.testCases
        })
      });

      const result = await response.json();

      if (result.success) {
        setTestResults(result.data.testResults);
        setExecutionTime(result.data.overallExecutionTime);
        setCodeQuality(result.data.codeQuality);
        setSuspiciousActivity(result.data.suspiciousActivity);
        setShowResults(true);

        console.log('🎯 Code execution results:', {
          passed: result.data.passedTests,
          total: result.data.totalTests,
          time: result.data.overallExecutionTime,
          quality: result.data.codeQuality,
          suspicious: result.data.suspiciousActivity
        });
      } else {
        console.error('Code execution failed:', result.error);
      }
    } catch (error) {
      console.error('Error running code:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = () => {
    const allPassed = testResults.every(result => result.passed);
    
    const submissionData = {
      code,
      testResults,
      allTestsPassed: allPassed,
      executionTime,
      codeQuality,
      suspiciousActivity,
      behaviorAnalysis: {
        keystrokes,
        pasteCount,
        copyPasteDetected,
        timeSpent: startTime ? Date.now() - startTime.getTime() : 0
      }
    };

    onSubmit(code, submissionData);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getLanguageTemplate = () => {
    switch (language) {
      case 'javascript':
        return {
          defaultValue: problem.signature,
          theme: 'vs-dark',
          language: 'javascript'
        };
      case 'python':
        return {
          defaultValue: problem.signature.replace('function', 'def').replace('{', ':'),
          theme: 'vs-dark', 
          language: 'python'
        };
      case 'java':
        return {
          defaultValue: `public class Solution {\n    ${problem.signature}\n}`,
          theme: 'vs-dark',
          language: 'java'
        };
      default:
        return { defaultValue: problem.signature, theme: 'vs-dark', language: 'javascript' };
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Problem Description Panel */}
      <div className="w-1/2 p-6 overflow-y-auto bg-gray-800">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold">{problem.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed">{problem.description}</p>
          </div>
        </div>

        {/* Examples */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Examples</h3>
          {problem.examples.map((example, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-700 rounded-lg">
              <div className="font-medium mb-2">Example {index + 1}:</div>
              <div className="font-mono text-sm">
                <div className="mb-1">
                  <span className="text-gray-400">Input:</span> {example.input}
                </div>
                <div className="mb-1">
                  <span className="text-gray-400">Output:</span> {example.output}
                </div>
                {example.explanation && (
                  <div className="text-gray-400 text-xs mt-2">
                    <span className="font-semibold">Explanation:</span> {example.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Constraints */}
        {problem.constraints && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Constraints</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              {problem.constraints.map((constraint, index) => (
                <li key={index} className="font-mono">• {constraint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Test Results */}
        {showResults && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Test Results</h3>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border-l-4 ${
                    result.passed 
                      ? 'bg-green-900/30 border-green-500' 
                      : 'bg-red-900/30 border-red-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-medium ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {result.passed ? '✅ PASSED' : '❌ FAILED'}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {result.executionTime}ms
                    </span>
                  </div>
                  
                  {result.description && (
                    <div className="text-sm text-gray-300 mb-2">{result.description}</div>
                  )}
                  
                  <div className="font-mono text-xs space-y-1">
                    <div><span className="text-gray-400">Input:</span> {JSON.stringify(result.input)}</div>
                    <div><span className="text-gray-400">Expected:</span> {JSON.stringify(result.expectedOutput)}</div>
                    {!result.passed && (
                      <div><span className="text-red-400">Got:</span> {JSON.stringify(result.actualOutput)}</div>
                    )}
                    {result.error && (
                      <div className="text-red-400">Error: {result.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Code Quality & Security Analysis */}
            {(codeQuality || suspiciousActivity) && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <h4 className="font-semibold mb-2">Analysis</h4>
                
                {codeQuality && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-300">
                      <span className="font-medium">Complexity:</span> {codeQuality.complexity} | 
                      <span className="font-medium"> Readability:</span> {codeQuality.readability}
                    </div>
                    {codeQuality.bestPractices.length > 0 && (
                      <div className="text-xs text-green-400 mt-1">
                        ✅ {codeQuality.bestPractices.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {suspiciousActivity && (suspiciousActivity.possibleCopyPaste || suspiciousActivity.aiAssistanceDetected) && (
                  <div className="text-sm">
                    {suspiciousActivity.possibleCopyPaste && (
                      <div className="text-yellow-400">⚠️ Possible copy-paste detected</div>
                    )}
                    {suspiciousActivity.aiAssistanceDetected && (
                      <div className="text-orange-400">🤖 AI assistance patterns detected</div>
                    )}
                    {copyPasteDetected && (
                      <div className="text-red-400">📋 Multiple paste operations detected</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Code Editor Panel */}
      <div className="w-1/2 flex flex-col bg-gray-900">
        {/* Editor Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <select 
              value={language} 
              disabled 
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
            
            {interviewMode && (
              <div className="text-xs text-yellow-400 flex items-center gap-1">
                🎥 Interview Mode
                <span className="text-gray-400">| Keystrokes: {keystrokes}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={runCode}
              disabled={isRunning}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm font-medium transition-colors"
            >
              {isRunning ? '⏳ Running...' : '▶️ Run'}
            </button>
            <button
              onClick={submitCode}
              disabled={!showResults}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm font-medium transition-colors"
            >
              🚀 Submit
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={getLanguageTemplate().language}
            theme={getLanguageTemplate().theme}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: true,
              selectOnLineNumbers: true,
              automaticLayout: true
            }}
          />
        </div>

        {/* Status Bar */}
        <div className="p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex justify-between items-center">
            <span>
              {testResults.length > 0 && (
                <>Passed: {testResults.filter(r => r.passed).length}/{testResults.length}</>
              )}
            </span>
            <span>
              {executionTime > 0 && <>Runtime: {executionTime}ms</>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCodingChallenge;