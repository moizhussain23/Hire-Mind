/**
 * Code Execution Service - LeetCode-style coding challenge execution
 * Supports JavaScript, Python, Java with test case validation
 */

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface TestCase {
  input: any[];
  expectedOutput: any;
  description?: string;
  hidden?: boolean; // Hidden test cases not shown to candidate
}

export interface CodeExecutionRequest {
  code: string;
  language: 'javascript' | 'python' | 'java';
  functionName: string;
  testCases: TestCase[];
  timeLimit?: number; // in milliseconds
  memoryLimit?: number; // in MB
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  memoryUsed?: number;
}

export interface TestCaseResult {
  testCase: TestCase;
  result: ExecutionResult;
  passed: boolean;
  actualOutput?: any;
}

export interface CodeSubmissionResult {
  allTestsPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testResults: TestCaseResult[];
  overallExecutionTime: number;
  codeQuality: {
    complexity: string;
    readability: string;
    bestPractices: string[];
  };
  suspiciousActivity?: {
    possibleCopyPaste: boolean;
    aiAssistanceDetected: boolean;
    unusualPatterns: string[];
  };
}

/**
 * Execute code with test cases - main function
 */
export async function executeCodeWithTestCases(
  request: CodeExecutionRequest
): Promise<CodeSubmissionResult> {
  const startTime = Date.now();
  console.log(`\n🚀 EXECUTING CODE CHALLENGE`);
  console.log(`Language: ${request.language}`);
  console.log(`Function: ${request.functionName}`);
  console.log(`Test Cases: ${request.testCases.length}`);

  try {
    // Create execution environment
    const executionId = uuidv4();
    const tempDir = path.join(__dirname, '../../temp/code-execution');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const testResults: TestCaseResult[] = [];
    let passedTests = 0;

    // Execute each test case
    for (let i = 0; i < request.testCases.length; i++) {
      const testCase = request.testCases[i];
      console.log(`\n📝 Running Test Case ${i + 1}/${request.testCases.length}`);
      
      try {
        const result = await executeTestCase(
          request.code,
          request.language,
          request.functionName,
          testCase,
          executionId,
          tempDir
        );

        const passed = compareOutputs(result.output, testCase.expectedOutput);
        if (passed) passedTests++;

        testResults.push({
          testCase,
          result,
          passed,
          actualOutput: result.output
        });

        console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}: ${testCase.description || `Test ${i + 1}`}`);
        if (!passed) {
          console.log(`   Expected: ${JSON.stringify(testCase.expectedOutput)}`);
          console.log(`   Got: ${JSON.stringify(result.output)}`);
        }

      } catch (testError) {
        console.log(`   ❌ ERROR: ${testError}`);
        testResults.push({
          testCase,
          result: {
            success: false,
            error: String(testError),
            executionTime: 0
          },
          passed: false
        });
      }
    }

    // Analyze code quality and suspicious activity
    const codeQuality = analyzeCodeQuality(request.code, request.language);
    const suspiciousActivity = await detectSuspiciousActivity(request.code, request.language);

    const overallExecutionTime = Date.now() - startTime;
    const allTestsPassed = passedTests === request.testCases.length;

    console.log(`\n🎯 EXECUTION SUMMARY`);
    console.log(`   Tests Passed: ${passedTests}/${request.testCases.length}`);
    console.log(`   Overall Time: ${overallExecutionTime}ms`);
    console.log(`   Code Quality: ${codeQuality.complexity} complexity`);
    console.log(`   Suspicious Activity: ${suspiciousActivity.possibleCopyPaste ? 'Detected' : 'None'}`);

    return {
      allTestsPassed,
      totalTests: request.testCases.length,
      passedTests,
      failedTests: request.testCases.length - passedTests,
      testResults,
      overallExecutionTime,
      codeQuality,
      suspiciousActivity
    };

  } catch (error) {
    console.error('❌ Code execution failed:', error);
    throw new Error(`Code execution failed: ${error}`);
  }
}

/**
 * Execute a single test case
 */
async function executeTestCase(
  code: string,
  language: string,
  functionName: string,
  testCase: TestCase,
  executionId: string,
  tempDir: string
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    switch (language) {
      case 'javascript':
        return await executeJavaScript(code, functionName, testCase, executionId, tempDir);
      case 'python':
        return await executePython(code, functionName, testCase, executionId, tempDir);
      case 'java':
        return await executeJava(code, functionName, testCase, executionId, tempDir);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Execute JavaScript code
 */
async function executeJavaScript(
  code: string,
  functionName: string,
  testCase: TestCase,
  executionId: string,
  tempDir: string
): Promise<ExecutionResult> {
  const startTime = Date.now();

  let testCode;
  
  // Special handling for class-based problems (like LRU Cache, Design Patterns, etc.)
  if (functionName === 'LRUCache' || functionName.includes('Cache') || 
      functionName === 'Singleton' || functionName.includes('Design') ||
      code.includes('class ') && (functionName !== 'solution')) {
    testCode = `
${code}

// Test execution for LRU Cache
try {
  const startTime = Date.now();
  
  // Parse the test sequence (contains method calls)
  const testSequence = ${JSON.stringify(testCase.input[0] || '')};
  
  // Execute the test sequence and capture results
  let result = [];
  
  // Parse LRU Cache operations from test sequence
  let lruCache = null;
  
  // Initialize LRU Cache first
  const initMatch = testSequence.match(/new LRUCache\\((\\d+)\\)/);
  if (initMatch) {
    const capacity = parseInt(initMatch[1]);
    lruCache = new LRUCache(capacity);
  }
  
  if (!lruCache) {
    throw new Error("Failed to initialize LRU Cache");
  }
  
  // Find all operations (put and get calls)
  const operations = [];
  
  // Find all .put() calls
  const putMatches = testSequence.matchAll(/lRUCache\\.put\\((\\d+),\\s*(\\d+)\\)/g);
  for (const match of putMatches) {
    const index = match.index || 0;
    operations.push({
      index,
      type: 'put',
      key: parseInt(match[1]),
      value: parseInt(match[2])
    });
  }
  
  // Find all .get() calls
  const getMatches = testSequence.matchAll(/lRUCache\\.get\\((\\d+)\\)/g);
  for (const match of getMatches) {
    const index = match.index || 0;
    operations.push({
      index,
      type: 'get',
      key: parseInt(match[1])
    });
  }
  
  // Sort operations by their position in the string
  operations.sort((a, b) => a.index - b.index);
  
  // Execute operations in order
  for (const op of operations) {
    if (op.type === 'put') {
      lruCache.put(op.key, op.value);
      result.push(null); // put operations return nothing
    } else if (op.type === 'get') {
      const value = lruCache.get(op.key);
      result.push(value);
    }
  }
  
  const executionTime = Date.now() - startTime;
  
  // For LRU Cache, format result to match expected output (only get() results)
  let finalOutput;
  if (result.length > 0 && result.some(r => r === null)) {
    // LRU Cache case: filter out nulls (put operations) and format as string
    const getResults = result.filter(r => r !== null);
    finalOutput = getResults.join(', ');
  } else {
    // Regular case: use result as-is
    finalOutput = result.length === 1 ? result[0] : result;
  }
  
  console.log(JSON.stringify({ success: true, output: finalOutput, executionTime }));
} catch (error) {
  console.log(JSON.stringify({ success: false, error: error.message, executionTime: 0 }));
}
`;
  } else {
    // Regular function execution
    testCode = `
${code}

// Test execution
try {
  const startTime = Date.now();
  const result = ${functionName}(${testCase.input.map(input => JSON.stringify(input)).join(', ')});
  const executionTime = Date.now() - startTime;
  console.log(JSON.stringify({ success: true, output: result, executionTime }));
} catch (error) {
  console.log(JSON.stringify({ success: false, error: error.message, executionTime: 0 }));
}
`;
  }

  const filePath = path.join(tempDir, `${executionId}.js`);
  writeFileSync(filePath, testCode);

  return new Promise((resolve) => {
    const process = spawn('node', [filePath], {
      timeout: 5000, // 5 second timeout
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle spawn errors (e.g., if node is not installed)
    process.on('spawn', () => {
      console.log('✅ Node.js process spawned successfully');
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      // Cleanup
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }

      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output.trim());
          resolve({
            success: result.success,
            output: result.output,
            error: result.error,
            executionTime: result.executionTime || (Date.now() - startTime)
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: `Failed to parse output: ${output}`,
            executionTime: Date.now() - startTime
          });
        }
      } else {
        resolve({
          success: false,
          error: errorOutput || `Process exited with code ${code}`,
          executionTime: Date.now() - startTime
        });
      }
    });

    process.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      });
    });
  });
}

/**
 * Execute Python code
 */
async function executePython(
  code: string,
  functionName: string,
  testCase: TestCase,
  executionId: string,
  tempDir: string
): Promise<ExecutionResult> {
  const startTime = Date.now();

  const testCode = `
import json
import time

${code}

try:
    start_time = time.time()
    result = ${functionName}(${testCase.input.map(input => JSON.stringify(input)).join(', ')})
    execution_time = int((time.time() - start_time) * 1000)
    print(json.dumps({"success": True, "output": result, "executionTime": execution_time}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e), "executionTime": 0}))
`;

  const filePath = path.join(tempDir, `${executionId}.py`);
  writeFileSync(filePath, testCode);

  return new Promise((resolve) => {
    const process = spawn('python', [filePath], {
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      // Cleanup
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }

      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output.trim());
          resolve({
            success: result.success,
            output: result.output,
            error: result.error,
            executionTime: result.executionTime || (Date.now() - startTime)
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: `Failed to parse output: ${output}`,
            executionTime: Date.now() - startTime
          });
        }
      } else {
        resolve({
          success: false,
          error: errorOutput || `Process exited with code ${code}`,
          executionTime: Date.now() - startTime
        });
      }
    });

    process.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      });
    });
  });
}

/**
 * Execute Java code (simplified version)
 */
async function executeJava(
  code: string,
  functionName: string,
  testCase: TestCase,
  executionId: string,
  tempDir: string
): Promise<ExecutionResult> {
  // Java execution would require more complex setup with compilation
  // For now, return a placeholder
  return {
    success: false,
    error: 'Java execution not yet implemented',
    executionTime: 0
  };
}

/**
 * Compare outputs with type coercion and tolerance - handles string vs array mismatch
 */
function compareOutputs(actual: any, expected: any): boolean {
  console.log(`🔍 Comparing outputs:`);
  console.log(`   Actual: ${JSON.stringify(actual)} (type: ${typeof actual})`);
  console.log(`   Expected: ${JSON.stringify(expected)} (type: ${typeof expected})`);
  
  // Direct match
  if (actual === expected) {
    console.log('   ✅ Direct match');
    return true;
  }
  
  // Handle string vs array conversion (common in test cases)
  if (typeof expected === 'string' && Array.isArray(actual)) {
    try {
      const expectedParsed = JSON.parse(expected);
      const match = JSON.stringify(actual) === JSON.stringify(expectedParsed);
      console.log(`   🔄 String->Array: "${expected}" vs [${actual}] = ${match}`);
      return match;
    } catch {
      // If expected string can't be parsed as JSON, compare as string
      const actualAsString = JSON.stringify(actual);
      const match = actualAsString === expected;
      console.log(`   🔄 Array->String: "${actualAsString}" vs "${expected}" = ${match}`);
      return match;
    }
  }
  
  // Handle array vs string conversion
  if (typeof actual === 'string' && Array.isArray(expected)) {
    try {
      const actualParsed = JSON.parse(actual);
      const match = JSON.stringify(actualParsed) === JSON.stringify(expected);
      console.log(`   🔄 String->Array: "${actual}" vs [${expected}] = ${match}`);
      return match;
    } catch {
      const expectedAsString = JSON.stringify(expected);
      const match = actual === expectedAsString;
      console.log(`   🔄 Array->String: "${actual}" vs "${expectedAsString}" = ${match}`);
      return match;
    }
  }
  
  // Handle arrays
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      console.log(`   ❌ Array length mismatch: ${actual.length} vs ${expected.length}`);
      return false;
    }
    const match = actual.every((item, index) => compareOutputs(item, expected[index]));
    console.log(`   🔄 Array comparison: ${match}`);
    return match;
  }
  
  // Handle numbers with small tolerance
  if (typeof actual === 'number' && typeof expected === 'number') {
    const match = Math.abs(actual - expected) < 1e-9;
    console.log(`   🔢 Number comparison: ${match}`);
    return match;
  }
  
  // Handle string comparison (case insensitive for text)
  if (typeof actual === 'string' && typeof expected === 'string') {
    const match = actual.toLowerCase().trim() === expected.toLowerCase().trim();
    console.log(`   📝 String comparison: ${match}`);
    return match;
  }
  
  // Final JSON comparison for objects
  try {
    const match = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`   🧩 JSON comparison: ${match}`);
    return match;
  } catch {
    console.log(`   ❌ Failed all comparisons`);
    return false;
  }
}

/**
 * Analyze code quality
 */
function analyzeCodeQuality(code: string, language: string) {
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  
  let complexity = 'low';
  let readability = 'good';
  const bestPractices: string[] = [];
  
  // Complexity analysis
  const complexityIndicators = [
    /for\s*\(/g,
    /while\s*\(/g,
    /if\s*\(/g,
    /switch\s*\(/g,
    /function\s+\w+/g,
    /=>\s*{/g
  ];
  
  let complexityScore = 0;
  complexityIndicators.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) complexityScore += matches.length;
  });
  
  if (complexityScore > 10) complexity = 'high';
  else if (complexityScore > 5) complexity = 'medium';
  
  // Best practices
  if (language === 'javascript') {
    if (code.includes('const ') || code.includes('let ')) {
      bestPractices.push('Uses modern variable declarations');
    }
    if (code.includes('=>')) {
      bestPractices.push('Uses arrow functions');
    }
    if (code.includes('async') || code.includes('await')) {
      bestPractices.push('Uses async/await pattern');
    }
  }
  
  // Readability
  const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
  if (avgLineLength > 120) readability = 'poor';
  else if (avgLineLength < 40) readability = 'excellent';
  
  return { complexity, readability, bestPractices };
}

/**
 * Detect suspicious activity (copy-paste, AI assistance)
 */
async function detectSuspiciousActivity(code: string, language: string) {
  const suspiciousActivity = {
    possibleCopyPaste: false,
    aiAssistanceDetected: false,
    unusualPatterns: [] as string[]
  };
  
  // Check for common copy-paste indicators
  const copyPasteIndicators = [
    /\/\*\s*https?:\/\//i, // URLs in comments
    /leetcode|hackerrank|codewars/i, // Platform references
    /author:|created by:/i, // Attribution comments
    /TODO:|FIXME:/i, // Development comments
    /console\.log\(.*test.*\)/i // Debug logs
  ];
  
  copyPasteIndicators.forEach(pattern => {
    if (pattern.test(code)) {
      suspiciousActivity.possibleCopyPaste = true;
      suspiciousActivity.unusualPatterns.push('Potential copy-paste indicators found');
    }
  });
  
  // Check for AI-generated code patterns
  const aiIndicators = [
    /\/\*\*[\s\S]*\*\//g, // Extensive JSDoc comments
    /This function (calculates|computes|returns)/i, // AI-style comments
    /Here's (a|an) (solution|implementation)/i, // AI explanations
    /We can (solve|approach) this/i, // AI reasoning
  ];
  
  aiIndicators.forEach(pattern => {
    if (pattern.test(code)) {
      suspiciousActivity.aiAssistanceDetected = true;
      suspiciousActivity.unusualPatterns.push('AI-generated code patterns detected');
    }
  });
  
  // Check code structure patterns
  const lines = code.split('\n');
  const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*'));
  const commentRatio = commentLines.length / lines.length;
  
  if (commentRatio > 0.3) {
    suspiciousActivity.unusualPatterns.push('Unusually high comment ratio');
  }
  
  return suspiciousActivity;
}

export default {
  executeCodeWithTestCases,
  analyzeCodeQuality,
  detectSuspiciousActivity
};