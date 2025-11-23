import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface TestCase {
  input: any;
  expectedOutput: any;
  description: string;
}

interface CodingProblem {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  examples: any[];
  constraints: string[];
  codeTemplate: Record<string, string>;
  functionName: string;
  testCases: TestCase[];
  hints: string[];
  estimatedTime: number;
}

const CodingChallengeTest: React.FC = () => {
  const [language, setLanguage] = useState<'javascript' | 'python' | 'java' | 'cpp'>('javascript');
  const [code, setCode] = useState<string>('');
  const [currentProblem, setCurrentProblem] = useState<CodingProblem | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string>('mid');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showTestResults, setShowTestResults] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Add log function
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize question bank
  const initializeQuestionBank = async () => {
    try {
      addLog('🔧 Initializing question bank...');
      const response = await fetch('/api/coding/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`✅ Question bank initialized: ${data.totalQuestions} questions`);
        return true;
      } else {
        addLog(`❌ Failed to initialize question bank: ${response.status}`);
        return false;
      }
    } catch (error) {
      addLog(`❌ Error initializing question bank: ${error.message}`);
      return false;
    }
  };

  // Load coding problem
  const loadCodingProblem = async () => {
    setLoading(true);
    try {
      addLog(`🧩 Loading coding problem for ${experienceLevel} level...`);
      
      const response = await fetch('/api/coding/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          experienceLevel: experienceLevel,
          domain: ['general'],
          difficulty: experienceLevel === 'fresher' ? 'easy' : experienceLevel === 'senior' ? 'hard' : 'medium',
          timeLimit: 30
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.question) {
          const questionData = data.question;
          
          const formattedProblem: CodingProblem = {
            id: questionData.id,
            title: questionData.title,
            difficulty: questionData.difficulty,
            description: questionData.description,
            examples: questionData.examples || [],
            constraints: questionData.constraints || [],
            codeTemplate: questionData.codeTemplate || {},
            functionName: extractFunctionName(questionData.codeTemplate?.javascript || ''),
            testCases: questionData.examples?.map((ex: any, idx: number) => {
              // Parse expected output if it's a string representation of array/object
              let expectedOutput = ex.output;
              if (typeof expectedOutput === 'string') {
                try {
                  expectedOutput = JSON.parse(expectedOutput);
                  addLog(`📝 Parsed expected output: "${ex.output}" -> ${JSON.stringify(expectedOutput)}`);
                } catch {
                  // Keep as string if can't parse
                  addLog(`📝 Keeping expected output as string: "${ex.output}"`);
                }
              }
              
              return {
                input: ex.input,
                expectedOutput: expectedOutput,
                description: ex.explanation || `Test case ${idx + 1}`
              };
            }) || [],
            hints: questionData.hints || [],
            estimatedTime: questionData.estimatedTime || 15
          };
          
          setCurrentProblem(formattedProblem);
          
          // Set initial code template
          const template = questionData.codeTemplate?.[language] || 
                          getCodeTemplate(language, formattedProblem.functionName);
          setCode(template);
          
          addLog(`✅ Problem loaded: ${questionData.title} (${questionData.difficulty})`);
          addLog(`📊 Available templates: ${Object.keys(questionData.codeTemplate || {}).join(', ')}`);
        }
      } else {
        throw new Error(`API responded with status: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Error loading problem: ${error.message}`);
      addLog('🔄 Trying to initialize question bank first...');
      
      const initialized = await initializeQuestionBank();
      if (initialized) {
        addLog('🔄 Retrying question load...');
        // Retry once more
        setTimeout(() => loadCodingProblem(), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Extract function name from code template
  const extractFunctionName = (codeTemplate: string) => {
    if (!codeTemplate) return 'solution';
    const match = codeTemplate.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    return match ? match[1] : 'solution';
  };

  // Get code template based on language
  const getCodeTemplate = (lang: string, functionName: string) => {
    switch (lang) {
      case 'javascript':
        return `function ${functionName}() {
    // Your solution here
    
}`;
      case 'python':
        return `def ${functionName.replace(/([A-Z])/g, '_$1').toLowerCase()}():
    # Your solution here
    pass`;
      case 'java':
        return `public class Solution {
    public void ${functionName}() {
        // Your solution here
        
    }
}`;
      case 'cpp':
        return `#include <iostream>
using namespace std;

void ${functionName}() {
    // Your solution here
    
}`;
      default:
        return `function ${functionName}() {
    // Your solution here
    
}`;
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: 'javascript' | 'python' | 'java' | 'cpp') => {
    addLog(`🔄 Switching language from ${language} to ${newLanguage}`);
    setLanguage(newLanguage);
    
    if (currentProblem) {
      let newTemplate;
      if (currentProblem.codeTemplate && currentProblem.codeTemplate[newLanguage]) {
        newTemplate = currentProblem.codeTemplate[newLanguage];
        addLog(`✅ Using question bank template for ${newLanguage}`);
      } else {
        newTemplate = getCodeTemplate(newLanguage, currentProblem.functionName);
        addLog(`✅ Using generated template for ${newLanguage}`);
      }
      setCode(newTemplate);
    }
  };

  // Execute code
  const executeCode = async () => {
    if (!currentProblem) {
      addLog('❌ No problem loaded');
      return;
    }

    try {
      addLog(`🚀 Executing ${language} code...`);
      
      // Determine the correct function name for different problem types
      let actualFunctionName = currentProblem.functionName || 'solution';
      
      // Comprehensive function name detection
      if (code.includes('class LRUCache') || code.includes('LRUCache')) {
        actualFunctionName = 'LRUCache';
        addLog(`🎯 Detected LRU Cache class, using function name: ${actualFunctionName}`);
      } else if (code.includes('class Singleton') || code.includes('Singleton')) {
        actualFunctionName = 'Singleton';
        addLog(`🎯 Detected Singleton class, using function name: ${actualFunctionName}`);
      } else if (code.includes('class ') && !code.includes('class Solution')) {
        // Extract class name for other class-based problems
        const classMatch = code.match(/class\s+(\w+)/);
        if (classMatch && classMatch[1] !== 'Solution') {
          actualFunctionName = classMatch[1];
          addLog(`🎯 Detected class: ${actualFunctionName}`);
        }
      } else if (code.includes('function ')) {
        // Extract function name from code
        const functionMatch = code.match(/function\s+(\w+)/);
        if (functionMatch) {
          actualFunctionName = functionMatch[1];
          addLog(`🎯 Detected function: ${actualFunctionName}`);
        }
      } else if (code.includes('const ') && code.includes(' = ')) {
        // Extract arrow function name: const twoSum = (nums, target) => {...}
        const arrowMatch = code.match(/const\s+(\w+)\s*=/);
        if (arrowMatch) {
          actualFunctionName = arrowMatch[1];
          addLog(`🎯 Detected arrow function: ${actualFunctionName}`);
        }
      }

      const response = await fetch('/api/coding/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.trim(),
          language,
          questionId: currentProblem.id,
          functionName: actualFunctionName,
          testCases: currentProblem.testCases.map((tc, idx) => {
            // Parse input if it's a string representation
            let parsedInput = tc.input;
            if (typeof tc.input === 'string') {
              // Universal input parser for ALL question bank formats
              parsedInput = parseUniversalInput(tc.input, idx + 1, addLog);
            }
            
            function parseUniversalInput(input: string, testNumber: number, logFn: (msg: string) => void): any[] {
              try {
                // Special handling for class-based problems: contains method calls sequence or instantiation
                if (input.includes('LRUCache') || input.includes('lRUCache') || 
                    input.includes('Singleton') || input.includes('new ') || 
                    input.includes('class ') || input.includes('.getInstance') ||
                    input.includes('Design')) {
                  logFn(`📝 Test ${testNumber} - Class-based problem sequence: ${input.substring(0, 100)}...`);
                  // Return the entire input as a single string for class execution
                  return [input];
                }
                
                // 1. Two Sum: "nums = [2,7,11,15], target = 9"
                if (input.includes('nums =') && input.includes('target =')) {
                  const numsMatch = input.match(/nums\s*=\s*(\[[^\]]+\])/);
                  const targetMatch = input.match(/target\s*=\s*(-?\d+)/);
                  if (numsMatch && targetMatch) {
                    const nums = JSON.parse(numsMatch[1]);
                    const target = parseInt(targetMatch[1]);
                    logFn(`📝 Test ${testNumber} - Two Sum: nums=${JSON.stringify(nums)}, target=${target}`);
                    return [nums, target];
                  }
                }
                
                // 2. Palindrome: s = "racecar" or "A man, a plan..."
                if (input.includes('s =')) {
                  const stringMatch = input.match(/s\s*=\s*"([^"]*)"/);
                  if (stringMatch) {
                    logFn(`📝 Test ${testNumber} - Palindrome: s="${stringMatch[1]}"`);
                    return [stringMatch[1]];
                  }
                }
                
                // 3. Valid Parentheses: s = "()[]{}" 
                if (input.includes('brackets') || input.includes('parentheses') || /s\s*=\s*"[(){}\[\]]*"/.test(input)) {
                  const match = input.match(/s\s*=\s*"([^"]*)"/);
                  if (match) {
                    logFn(`📝 Test ${testNumber} - Parentheses: s="${match[1]}"`);
                    return [match[1]];
                  }
                }
                
                // 4. Binary Tree: root = [1,2,3,null,null,4,5]
                if (input.includes('root =')) {
                  const rootMatch = input.match(/root\s*=\s*(\[[^\]]+\])/);
                  if (rootMatch) {
                    const tree = JSON.parse(rootMatch[1].replace(/null/g, 'null'));
                    logFn(`📝 Test ${testNumber} - Binary Tree: root=${JSON.stringify(tree)}`);
                    return [tree];
                  }
                }
                
                // 5. Array manipulation: arr = [1,2,3], val = 2
                if (input.includes('arr =') || input.includes('array =')) {
                  const arrMatch = input.match(/(arr|array)\s*=\s*(\[[^\]]+\])/);
                  const valMatch = input.match(/val(?:ue)?\s*=\s*(-?\d+)/);
                  if (arrMatch) {
                    const arr = JSON.parse(arrMatch[2]);
                    const val = valMatch ? parseInt(valMatch[1]) : undefined;
                    if (val !== undefined) {
                      logFn(`📝 Test ${testNumber} - Array + Value: arr=${JSON.stringify(arr)}, val=${val}`);
                      return [arr, val];
                    } else {
                      logFn(`📝 Test ${testNumber} - Array Only: arr=${JSON.stringify(arr)}`);
                      return [arr];
                    }
                  }
                }
                
                // 6. Matrix: matrix = [[1,2,3],[4,5,6]]
                if (input.includes('matrix =') || input.includes('grid =')) {
                  const matrixMatch = input.match(/(matrix|grid)\s*=\s*(\[\[[^\]]+\]\]|\[[^\]]+\])/);
                  if (matrixMatch) {
                    const matrix = JSON.parse(matrixMatch[2]);
                    logFn(`📝 Test ${testNumber} - Matrix: ${JSON.stringify(matrix)}`);
                    return [matrix];
                  }
                }
                
                // 7. Linked List: head = [1,2,3,4,5]
                if (input.includes('head =') || input.includes('list =')) {
                  const headMatch = input.match(/(head|list)\s*=\s*(\[[^\]]+\])/);
                  if (headMatch) {
                    const list = JSON.parse(headMatch[2]);
                    logFn(`📝 Test ${testNumber} - Linked List: ${JSON.stringify(list)}`);
                    return [list];
                  }
                }
                
                // 8. String + Integer: s = "hello", k = 3
                if (input.includes(' k =') || input.includes(' n =')) {
                  const stringMatch = input.match(/s\s*=\s*"([^"]*)"/);
                  const numMatch = input.match(/[kn]\s*=\s*(-?\d+)/);
                  if (stringMatch && numMatch) {
                    logFn(`📝 Test ${testNumber} - String + Number: s="${stringMatch[1]}", num=${numMatch[1]}`);
                    return [stringMatch[1], parseInt(numMatch[1])];
                  }
                }
                
                // 9. Multiple arrays: nums1 = [1,2], nums2 = [3,4]
                if (input.includes('nums1 =') && input.includes('nums2 =')) {
                  const nums1Match = input.match(/nums1\s*=\s*(\[[^\]]+\])/);
                  const nums2Match = input.match(/nums2\s*=\s*(\[[^\]]+\])/);
                  if (nums1Match && nums2Match) {
                    const nums1 = JSON.parse(nums1Match[1]);
                    const nums2 = JSON.parse(nums2Match[1]);
                    logFn(`📝 Test ${testNumber} - Two Arrays: nums1=${JSON.stringify(nums1)}, nums2=${JSON.stringify(nums2)}`);
                    return [nums1, nums2];
                  }
                }
                
                // 10. Range problems: left = 1, right = 10
                if (input.includes('left =') && input.includes('right =')) {
                  const leftMatch = input.match(/left\s*=\s*(-?\d+)/);
                  const rightMatch = input.match(/right\s*=\s*(-?\d+)/);
                  if (leftMatch && rightMatch) {
                    logFn(`📝 Test ${testNumber} - Range: left=${leftMatch[1]}, right=${rightMatch[1]}`);
                    return [parseInt(leftMatch[1]), parseInt(rightMatch[1])];
                  }
                }
                
                // 11. Direct string with quotes: "hello world"
                if (input.startsWith('"') && input.endsWith('"') && input.length > 2) {
                  const str = input.slice(1, -1);
                  logFn(`📝 Test ${testNumber} - Direct String: "${str}"`);
                  return [str];
                }
                
                // 12. Direct array: [1,2,3,4,5]
                if (input.startsWith('[') && input.endsWith(']')) {
                  const arr = JSON.parse(input);
                  logFn(`📝 Test ${testNumber} - Direct Array: ${JSON.stringify(arr)}`);
                  return [arr];
                }
                
                // 13. Single number: 42
                if (/^-?\d+$/.test(input.trim())) {
                  const num = parseInt(input.trim());
                  logFn(`📝 Test ${testNumber} - Single Number: ${num}`);
                  return [num];
                }
                
                // 14. Generic parameter parsing: "param1 = value1, param2 = value2"
                if (input.includes(' = ')) {
                  const params: any[] = [];
                  const segments = input.split(',');
                  
                  for (const segment of segments) {
                    const match = segment.trim().match(/\w+\s*=\s*(.+)/);
                    if (match) {
                      const value = match[1].trim();
                      try {
                        params.push(JSON.parse(value));
                      } catch {
                        params.push(value.replace(/^["']|["']$/g, ''));
                      }
                    }
                  }
                  
                  if (params.length > 0) {
                    logFn(`📝 Test ${testNumber} - Generic Parameters: ${JSON.stringify(params)}`);
                    return params;
                  }
                }
                
                // 15. Fallback: Try JSON parse
                try {
                  const parsed = JSON.parse(input);
                  logFn(`📝 Test ${testNumber} - JSON Parsed: ${JSON.stringify(parsed)}`);
                  return Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                  // Final fallback: treat as single string parameter
                  logFn(`📝 Test ${testNumber} - Fallback String: "${input}"`);
                  return [input];
                }
                
              } catch (e) {
                logFn(`❌ Test ${testNumber} - Parse Error: ${e.message}, using raw input`);
                return [input];
              }
              
              // Handle other string formats
              try {
                parsedInput = JSON.parse(tc.input);
                addLog(`📝 Test ${idx + 1} - Parsed JSON input: "${tc.input}" -> ${JSON.stringify(parsedInput)}`);
              } catch {
                // If can't parse, wrap in array
                parsedInput = [tc.input];
                addLog(`📝 Test ${idx + 1} - Wrapped input: "${tc.input}" -> [${tc.input}]`);
              }
            }
            
            // Ensure expectedOutput is in correct format
            let expectedOutput = tc.expectedOutput;
            if (typeof expectedOutput === 'string' && (expectedOutput.startsWith('[') || expectedOutput.startsWith('{'))) {
              try {
                expectedOutput = JSON.parse(expectedOutput);
                addLog(`📝 Test ${idx + 1} - Parsed expected: "${tc.expectedOutput}" -> ${JSON.stringify(expectedOutput)}`);
              } catch {
                addLog(`📝 Test ${idx + 1} - Keeping expected as string: "${tc.expectedOutput}"`);
              }
            }
            
            addLog(`📝 Test ${idx + 1} final format: input=${JSON.stringify(parsedInput)}, expected=${JSON.stringify(expectedOutput)}`);
            
            return {
              input: Array.isArray(parsedInput) ? parsedInput : [parsedInput],
              expectedOutput: expectedOutput,
              description: tc.description
            };
          })
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          addLog(`✅ Code executed successfully! ${result.data.passedTests}/${result.data.totalTests} tests passed`);
          setTestResults(result.data.testResults || []);
          setShowTestResults(true);
        } else {
          addLog(`❌ Execution failed: ${result.error}`);
        }
      } else {
        addLog(`❌ API error: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Error executing code: ${error.message}`);
    }
  };

  // Load problem on mount and when experience level changes
  useEffect(() => {
    loadCodingProblem();
  }, [experienceLevel]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🧪 Coding Challenge Test Page</h1>
        
        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          <div>
            <label className="block text-sm mb-1">Experience Level:</label>
            <select 
              value={experienceLevel} 
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
            >
              <option value="fresher">Fresher</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1">Language:</label>
            <select 
              value={language} 
              onChange={(e) => handleLanguageChange(e.target.value as any)}
              className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <button 
              onClick={loadCodingProblem}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Loading...' : '🔄 Load New Problem'}
            </button>
            
            <button 
              onClick={executeCode}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              ▶️ Run Code
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Problem Description */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">📋 Problem</h2>
            {currentProblem ? (
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">
                  {currentProblem.title} 
                  <span className="text-sm ml-2 px-2 py-1 bg-gray-700 rounded">
                    {currentProblem.difficulty}
                  </span>
                </h3>
                <p className="text-gray-300 mb-4">{currentProblem.description}</p>
                
                {currentProblem.examples.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Examples:</h4>
                    {currentProblem.examples.map((ex, idx) => (
                      <div key={idx} className="bg-gray-700 p-3 rounded mb-2">
                        <div><strong>Input:</strong> {JSON.stringify(ex.input)}</div>
                        <div><strong>Output:</strong> {JSON.stringify(ex.output)}</div>
                        {ex.explanation && <div><strong>Explanation:</strong> {ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {currentProblem.constraints.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Constraints:</h4>
                    <ul className="list-disc pl-5">
                      {currentProblem.constraints.map((constraint, idx) => (
                        <li key={idx} className="text-gray-300">{constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400">Loading problem...</div>
            )}
          </div>

          {/* Code Editor */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">💻 Code Editor</h2>
            <div className="h-96">
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>
        </div>

        {/* Test Results */}
        {showTestResults && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">🧪 Test Results</h2>
            <div className="space-y-3">
              {testResults.map((result, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded ${result.passed ? 'bg-green-900' : 'bg-red-900'}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{result.passed ? '✅' : '❌'} {result.description}</span>
                    <span className="text-sm">{result.executionTime}ms</span>
                  </div>
                  {!result.passed && (
                    <div className="mt-2 text-sm">
                      <div>Expected: {JSON.stringify(result.expectedOutput)}</div>
                      <div>Got: {JSON.stringify(result.actualOutput)}</div>
                      {result.error && <div>Error: {result.error}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Logs */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📝 Debug Logs</h2>
          <div className="bg-black p-4 rounded max-h-60 overflow-y-auto">
            {logs.map((log, idx) => (
              <div key={idx} className="text-sm text-green-400 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingChallengeTest;