import { CodingQuestion, ICodingQuestion } from '../models/QuestionBank';

/**
 * Coding Question Bank Service
 * Manages the repository of coding challenge questions for interviews
 */

export interface QuestionSelectionCriteria {
  difficulty?: 'easy' | 'medium' | 'hard';
  experienceLevel?: 'fresher' | 'mid' | 'senior';
  domain?: string[];
  subcategory?: string;
  excludeQuestionIds?: string[];
  timeLimit?: number; // minutes available
}

export class CodingQuestionBankService {
  
  /**
   * Get a coding question based on criteria
   */
  static async selectQuestion(criteria: QuestionSelectionCriteria): Promise<ICodingQuestion | null> {
    try {
      const filter: any = {};
      
      if (criteria.difficulty) {
        filter.difficulty = criteria.difficulty;
      }
      
      if (criteria.experienceLevel) {
        filter.experienceLevel = criteria.experienceLevel;
      }
      
      if (criteria.domain && criteria.domain.length > 0) {
        filter.domain = { $in: criteria.domain };
      }
      
      if (criteria.subcategory) {
        filter.subcategory = criteria.subcategory;
      }
      
      if (criteria.excludeQuestionIds && criteria.excludeQuestionIds.length > 0) {
        filter.id = { $nin: criteria.excludeQuestionIds };
      }
      
      if (criteria.timeLimit) {
        filter.estimatedTime = { $lte: criteria.timeLimit };
      }
      
      // Select question with weighted randomization (prefer less used, higher success rate)
      const questions = await CodingQuestion.aggregate([
        { $match: filter },
        {
          $addFields: {
            weight: {
              $add: [
                { $multiply: [{ $subtract: [100, "$usageCount"] }, 0.3] }, // Less used = higher weight
                { $multiply: ["$successRate", 0.7] } // Higher success rate = higher weight
              ]
            }
          }
        },
        { $sort: { weight: -1 } },
        { $limit: 5 } // Get top 5 candidates
      ]);
      
      if (questions.length === 0) {
        return null;
      }
      
      // Random selection from top candidates
      const selectedQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      // Increment usage count
      await CodingQuestion.findByIdAndUpdate(selectedQuestion._id, {
        $inc: { usageCount: 1 }
      });
      
      return selectedQuestion;
      
    } catch (error) {
      console.error('Error selecting coding question:', error);
      return null;
    }
  }
  
  /**
   * Update question analytics after completion
   */
  static async updateQuestionAnalytics(
    questionId: string, 
    timeSpent: number, 
    solved: boolean
  ): Promise<void> {
    try {
      const question = await CodingQuestion.findOne({ id: questionId });
      if (!question) return;
      
      const totalAttempts = question.usageCount;
      const currentSuccessCount = Math.floor(question.successRate * totalAttempts / 100);
      const newSuccessCount = solved ? currentSuccessCount + 1 : currentSuccessCount;
      const newSuccessRate = (newSuccessCount / totalAttempts) * 100;
      
      const currentAvgTime = question.averageTimeSpent;
      const newAvgTime = ((currentAvgTime * (totalAttempts - 1)) + timeSpent) / totalAttempts;
      
      await CodingQuestion.findOneAndUpdate(
        { id: questionId },
        {
          successRate: newSuccessRate,
          averageTimeSpent: newAvgTime
        }
      );
      
    } catch (error) {
      console.error('Error updating question analytics:', error);
    }
  }
  
  /**
   * Initialize the question bank with default questions
   */
  static async initializeQuestionBank(): Promise<void> {
    try {
      const existingCount = await CodingQuestion.countDocuments();
      if (existingCount > 0) {
        console.log(`[Question Bank] Question bank already has ${existingCount} questions`);
        return;
      }
      
      console.log('Initializing coding question bank...');
      await this.seedQuestions();
      console.log('Question bank initialized successfully');
      
    } catch (error) {
      console.error('Error initializing question bank:', error);
    }
  }
  
  /**
   * Seed the database with comprehensive coding questions
   */
  private static async seedQuestions(): Promise<void> {
    const questions: Partial<ICodingQuestion>[] = [
      // === EASY LEVEL QUESTIONS (Fresher) ===
      {
        id: "easy_001",
        title: "Two Sum",
        subcategory: "algorithms",
        difficulty: "easy",
        experienceLevel: "fresher",
        domain: ["general"],
        problemStatement: "Find two numbers in an array that add up to a target sum",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]"
          },
          {
            input: "nums = [3,2,4], target = 6", 
            output: "[1,2]"
          }
        ],
        constraints: [
          "2 ≤ nums.length ≤ 10^4",
          "-10^9 ≤ nums[i] ≤ 10^9",
          "-10^9 ≤ target ≤ 10^9",
          "Only one valid answer exists"
        ],
        codeTemplate: {
          javascript: `function twoSum(nums, target) {
    // Your code here
    
}`,
          python: `def two_sum(nums, target):
    # Your code here
    pass`,
          java: `public int[] twoSum(int[] nums, int target) {
    // Your code here
    
}`,
          cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    // Your code here
    
}`
        },
        testCases: [
          { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isHidden: false },
          { input: "[3,2,4], 6", expectedOutput: "[1,2]", isHidden: false },
          { input: "[3,3], 6", expectedOutput: "[0,1]", isHidden: true }
        ],
        evaluationCriteria: [
          "Correct algorithm implementation",
          "Optimal time complexity (O(n))",
          "Proper edge case handling",
          "Clean, readable code"
        ],
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        aiPrompt: "I'd like to test your problem-solving skills with a classic algorithm question. Here's the problem: You need to find two numbers in an array that add up to a specific target. Take a look at the problem statement and examples, then implement your solution. Feel free to think out loud as you work through it.",
        followUpQuestions: [
          "How would you modify this if there could be multiple valid pairs?",
          "What if the array was sorted? Could you optimize further?",
          "Can you explain the trade-off between time and space complexity in your solution?"
        ],
        hints: [
          "Consider using a hash map to store values you've seen",
          "For each number, check if its complement (target - number) exists",
          "Remember to return the indices, not the values"
        ],
        tags: ["arrays", "hash-map", "algorithms", "two-pointer"],
        estimatedTime: 15
      },
      
      {
        id: "easy_002",
        title: "Palindrome Check",
        subcategory: "algorithms",
        difficulty: "easy", 
        experienceLevel: "fresher",
        domain: ["general"],
        problemStatement: "Check if a given string is a palindrome",
        description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
        examples: [
          {
            input: '"A man, a plan, a canal: Panama"',
            output: "true",
            explanation: '"amanaplanacanalpanama" is a palindrome'
          },
          {
            input: '"race a car"',
            output: "false",
            explanation: '"raceacar" is not a palindrome'
          }
        ],
        constraints: [
          "1 ≤ s.length ≤ 2 * 10^5",
          "s consists only of printable ASCII characters"
        ],
        codeTemplate: {
          javascript: `function isPalindrome(s) {
    // Your code here
    
}`,
          python: `def is_palindrome(s):
    # Your code here
    pass`,
          java: `public boolean isPalindrome(String s) {
    // Your code here
    
}`,
          cpp: `bool isPalindrome(string s) {
    // Your code here
    
}`
        },
        testCases: [
          { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", isHidden: false },
          { input: '"race a car"', expectedOutput: "false", isHidden: false },
          { input: '" "', expectedOutput: "true", isHidden: true }
        ],
        evaluationCriteria: [
          "Correct string processing",
          "Proper handling of edge cases",
          "Efficient algorithm",
          "Code clarity"
        ],
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        aiPrompt: "Let's work on string manipulation. I have a palindrome checking problem for you. You'll need to determine if a string reads the same forwards and backwards, but with a twist - you need to ignore case and non-alphanumeric characters. Go ahead and implement your solution.",
        followUpQuestions: [
          "How would you handle Unicode characters?",
          "Could you solve this recursively? What would be the trade-offs?",
          "What if we wanted to find the longest palindromic substring instead?"
        ],
        hints: [
          "Use two pointers from start and end",
          "Skip non-alphanumeric characters",
          "Convert to lowercase for comparison"
        ],
        tags: ["strings", "two-pointer", "palindrome"],
        estimatedTime: 10
      },
      
      // === MEDIUM LEVEL QUESTIONS (Mid-Level) ===
      {
        id: "medium_001", 
        title: "Valid Parentheses with Multiple Types",
        subcategory: "data-structures",
        difficulty: "medium",
        experienceLevel: "mid",
        domain: ["general"],
        problemStatement: "Check if parentheses, brackets, and braces are properly balanced",
        description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order.",
        examples: [
          {
            input: '"()[]{}"',
            output: "true"
          },
          {
            input: '"([)]"',
            output: "false",
            explanation: "The brackets are not properly nested"
          },
          {
            input: '"{[]}"',
            output: "true"
          }
        ],
        constraints: [
          "1 ≤ s.length ≤ 10^4",
          "s consists of parentheses only '()[]{}'."
        ],
        codeTemplate: {
          javascript: `function isValid(s) {
    // Your code here
    
}`,
          python: `def is_valid(s):
    # Your code here
    pass`,
          java: `public boolean isValid(String s) {
    // Your code here
    
}`,
          cpp: `bool isValid(string s) {
    // Your code here
    
}`
        },
        testCases: [
          { input: '"()[]{}"', expectedOutput: "true", isHidden: false },
          { input: '"([)]"', expectedOutput: "false", isHidden: false },
          { input: '"{[]}"', expectedOutput: "true", isHidden: true },
          { input: '"((("', expectedOutput: "false", isHidden: true }
        ],
        evaluationCriteria: [
          "Correct stack usage",
          "Proper bracket matching logic", 
          "Edge case handling",
          "Clean implementation"
        ],
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        aiPrompt: "Now let's test your understanding of data structures. This is a classic stack problem about validating parentheses. You need to check if different types of brackets are properly balanced and nested. Implement your solution using the most appropriate data structure.",
        followUpQuestions: [
          "How would you modify this to handle nested mathematical expressions?",
          "Could you solve this without using a stack? What would be the trade-offs?",
          "How would you extend this to check for proper indentation in code?"
        ],
        hints: [
          "Stack is the ideal data structure for this problem",
          "Push opening brackets, pop and match closing brackets",
          "Handle edge cases: empty string, mismatched types"
        ],
        tags: ["stack", "data-structures", "brackets", "validation"],
        estimatedTime: 12
      },

      {
        id: "medium_002",
        title: "Binary Tree Level Order Traversal",
        subcategory: "data-structures", 
        difficulty: "medium",
        experienceLevel: "mid",
        domain: ["general"],
        problemStatement: "Return the level order traversal of a binary tree's node values",
        description: "Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).",
        examples: [
          {
            input: "root = [3,9,20,null,null,15,7]",
            output: "[[3],[9,20],[15,7]]"
          },
          {
            input: "root = [1]", 
            output: "[[1]]"
          }
        ],
        constraints: [
          "The number of nodes in the tree is in the range [0, 2000]",
          "-1000 ≤ Node.val ≤ 1000"
        ],
        codeTemplate: {
          javascript: `function levelOrder(root) {
    // Definition for a binary tree node
    // function TreeNode(val, left, right) {
    //     this.val = (val===undefined ? 0 : val)
    //     this.left = (left===undefined ? null : left)
    //     this.right = (right===undefined ? null : right)
    // }
    
    // Your code here
    
}`,
          python: `def level_order(root):
    # Definition for a binary tree node.
    # class TreeNode:
    #     def __init__(self, val=0, left=None, right=None):
    #         self.val = val
    #         self.left = left
    #         self.right = right
    
    # Your code here
    pass`,
          java: `public List<List<Integer>> levelOrder(TreeNode root) {
    // Definition for a binary tree node.
    // public class TreeNode {
    //     int val;
    //     TreeNode left;
    //     TreeNode right;
    //     TreeNode() {}
    //     TreeNode(int val) { this.val = val; }
    //     TreeNode(int val, TreeNode left, TreeNode right) {
    //         this.val = val;
    //         this.left = left;
    //         this.right = right;
    //     }
    // }
    
    // Your code here
    
}`,
          cpp: `vector<vector<int>> levelOrder(TreeNode* root) {
    // Definition for a binary tree node.
    // struct TreeNode {
    //     int val;
    //     TreeNode *left;
    //     TreeNode *right;
    //     TreeNode() : val(0), left(nullptr), right(nullptr) {}
    //     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    //     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
    // };
    
    // Your code here
    
}`
        },
        testCases: [
          { input: "[3,9,20,null,null,15,7]", expectedOutput: "[[3],[9,20],[15,7]]", isHidden: false },
          { input: "[1]", expectedOutput: "[[1]]", isHidden: false },
          { input: "[]", expectedOutput: "[]", isHidden: true }
        ],
        evaluationCriteria: [
          "Correct BFS implementation",
          "Proper level grouping",
          "Null handling",
          "Queue usage understanding"
        ],
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        aiPrompt: "Let's explore tree data structures. This problem requires you to traverse a binary tree level by level. You'll need to group nodes by their depth in the tree. Think about which traversal method and data structure would be most appropriate for this task.",
        followUpQuestions: [
          "How would you implement this using recursion instead of iteration?",
          "Could you modify this to traverse right to left on alternating levels?",
          "What if you needed to find the maximum value at each level?"
        ],
        hints: [
          "BFS (Breadth-First Search) is ideal for level-order traversal",
          "Use a queue to track nodes at each level",
          "Process nodes level by level, not one by one"
        ],
        tags: ["binary-tree", "bfs", "queue", "traversal"],
        estimatedTime: 18
      },

      // === HARD LEVEL QUESTIONS (Senior) ===
      {
        id: "hard_001",
        title: "Design LRU Cache",
        subcategory: "system-design",
        difficulty: "hard", 
        experienceLevel: "senior",
        domain: ["backend", "general"],
        problemStatement: "Design and implement a data structure for Least Recently Used (LRU) cache",
        description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement LRUCache class with methods: get(key) and put(key, value). Both operations should run in O(1) time complexity.",
        examples: [
          {
            input: `LRUCache lRUCache = new LRUCache(2);
lRUCache.put(1, 1);
lRUCache.put(2, 2);
lRUCache.get(1); // return 1
lRUCache.put(3, 3); // evicts key 2
lRUCache.get(2); // return -1 (not found)`,
            output: "1, -1"
          }
        ],
        constraints: [
          "1 ≤ capacity ≤ 3000",
          "0 ≤ key ≤ 10^4", 
          "0 ≤ value ≤ 10^5",
          "At most 2 * 10^5 calls will be made to get and put"
        ],
        codeTemplate: {
          javascript: `class LRUCache {
    constructor(capacity) {
        // Your code here
    }
    
    get(key) {
        // Your code here
    }
    
    put(key, value) {
        // Your code here
    }
}`,
          python: `class LRUCache:
    def __init__(self, capacity):
        # Your code here
        pass
    
    def get(self, key):
        # Your code here
        pass
    
    def put(self, key, value):
        # Your code here
        pass`,
          java: `class LRUCache {
    public LRUCache(int capacity) {
        // Your code here
    }
    
    public int get(int key) {
        // Your code here
    }
    
    public void put(int key, int value) {
        // Your code here
    }
}`,
          cpp: `class LRUCache {
public:
    LRUCache(int capacity) {
        // Your code here
    }
    
    int get(int key) {
        // Your code here
    }
    
    void put(int key, int value) {
        // Your code here
    }
};`
        },
        testCases: [
          { 
            input: "capacity=2, operations: put(1,1), put(2,2), get(1), put(3,3), get(2)", 
            expectedOutput: "1, -1", 
            isHidden: false 
          }
        ],
        evaluationCriteria: [
          "O(1) time complexity for both operations",
          "Correct LRU eviction policy",
          "Proper data structure design",
          "Clean API implementation",
          "Memory efficiency"
        ],
        timeComplexity: "O(1)",
        spaceComplexity: "O(capacity)",
        aiPrompt: "This is a system design coding challenge. You need to implement an LRU Cache with O(1) operations. This tests your understanding of data structures and how they can be combined to create efficient systems. Think about what data structures you'd need to achieve constant time complexity for both get and put operations.",
        followUpQuestions: [
          "How would you handle concurrent access in a multi-threaded environment?",
          "What if you needed to persist this cache to disk?",
          "How would you modify this to implement TTL (Time To Live) functionality?",
          "Could you implement this using only arrays? What would be the trade-offs?"
        ],
        hints: [
          "Combine HashMap and Doubly Linked List",
          "HashMap provides O(1) lookup, LinkedList provides O(1) insertion/deletion", 
          "Keep track of both head (most recent) and tail (least recent)",
          "Move accessed items to head, remove from tail when at capacity"
        ],
        tags: ["system-design", "cache", "hash-map", "linked-list", "optimization"],
        estimatedTime: 25
      },

      // === FRONTEND SPECIFIC ===
      {
        id: "frontend_001",
        title: "React Component State Management",
        subcategory: "frontend",
        difficulty: "medium",
        experienceLevel: "mid", 
        domain: ["frontend"],
        problemStatement: "Build a reusable React component with complex state management",
        description: "Create a SearchableDropdown component that handles async data fetching, debouncing, keyboard navigation, and accessibility. The component should be performant and follow React best practices.",
        examples: [
          {
            input: "fetchData prop, placeholder, onSelect callback",
            output: "Fully functional searchable dropdown with keyboard support"
          }
        ],
        constraints: [
          "Must use React hooks (no class components)",
          "Implement proper debouncing (300ms)",
          "Support keyboard navigation (arrow keys, enter, escape)",
          "Handle loading and error states",
          "Must be accessible (ARIA labels)"
        ],
        codeTemplate: {
          javascript: `import React, { useState, useEffect, useCallback } from 'react';

const SearchableDropdown = ({ 
  fetchData, 
  placeholder = "Search...",
  onSelect,
  debounceMs = 300 
}) => {
  // Your implementation here
  
  return (
    <div className="searchable-dropdown">
      {/* Your JSX here */}
    </div>
  );
};

export default SearchableDropdown;`,
          python: `# React component equivalent in Python (Flask/FastAPI)
from typing import List, Callable, Optional
import asyncio

class SearchableDropdown:
    def __init__(self, fetch_data: Callable, placeholder: str = "Search...", 
                 on_select: Callable = None, debounce_ms: int = 300):
        # Your implementation here
        pass`,
          java: `// React-like component in Java (Spring Boot)
import java.util.List;
import java.util.function.Function;

public class SearchableDropdown {
    private Function<String, List<String>> fetchData;
    private String placeholder;
    private int debounceMs;
    
    public SearchableDropdown(Function<String, List<String>> fetchData) {
        // Your implementation here
    }
}`,
          cpp: `// Component-like structure in C++
#include <vector>
#include <string>
#include <functional>

class SearchableDropdown {
private:
    std::function<std::vector<std::string>(std::string)> fetchData;
    std::string placeholder;
    int debounceMs;
    
public:
    SearchableDropdown(std::function<std::vector<std::string>(std::string)> fetchData) {
        // Your implementation here
    }
};`
        },
        testCases: [
          { 
            input: "fetchData returns array after 100ms, user types 'test'", 
            expectedOutput: "Debounced API call, dropdown shows filtered results",
            isHidden: false 
          }
        ],
        evaluationCriteria: [
          "Proper React hooks usage",
          "Effective debouncing implementation", 
          "Keyboard navigation functionality",
          "Accessibility compliance",
          "Performance optimization",
          "Error handling",
          "Clean component API"
        ],
        aiPrompt: "Let's dive into React development. I need you to build a sophisticated SearchableDropdown component. This will test your knowledge of React hooks, performance optimization, and user experience. Focus on creating something that's both functional and user-friendly.",
        followUpQuestions: [
          "How would you add virtualization for large datasets?",
          "What testing strategy would you use for this component?",
          "How would you handle internationalization?",
          "Could you explain your choice of hooks and why?"
        ],
        hints: [
          "useEffect for side effects, useState for component state",
          "useCallback and useMemo for performance",
          "Custom hook for debouncing logic",
          "useRef for DOM manipulation"
        ],
        tags: ["react", "hooks", "debouncing", "accessibility", "frontend"],
        estimatedTime: 20
      },

      // === BACKEND SPECIFIC ===
      {
        id: "backend_001", 
        title: "API Rate Limiter Design",
        subcategory: "backend",
        difficulty: "hard",
        experienceLevel: "senior",
        domain: ["backend"],
        problemStatement: "Implement a distributed rate limiter for API endpoints",
        description: "Design and implement a rate limiting system that can handle distributed requests across multiple servers. Support multiple algorithms (token bucket, sliding window) and different rate limits per user/API key.",
        examples: [
          {
            input: "100 requests/minute limit, user makes 150 requests in 1 minute",
            output: "First 100 succeed, remaining 50 are rate limited with appropriate HTTP status codes"
          }
        ],
        constraints: [
          "Must work across multiple server instances",
          "Support different algorithms (token bucket, sliding window)",
          "Handle high throughput (10k+ requests/second)",
          "Provide accurate rate limiting with minimal false positives",
          "Include proper error messages and retry-after headers"
        ],
        codeTemplate: {
          javascript: `class RateLimiter {
  constructor(algorithm = 'token-bucket', store = 'redis') {
    // Your implementation here
  }
  
  async isAllowed(identifier, limit, window) {
    // Your implementation here
    // Return: { allowed: boolean, retryAfter?: number, remaining?: number }
  }
  
  async resetLimit(identifier) {
    // Your implementation here
  }
}

module.exports = RateLimiter;`,
          python: `import asyncio
import time
from typing import Dict, Optional, Tuple

class RateLimiter:
    def __init__(self, algorithm: str = 'token-bucket', store: str = 'redis'):
        # Your implementation here
        pass
    
    async def is_allowed(self, identifier: str, limit: int, window: int) -> Dict:
        # Your implementation here
        # Return: {"allowed": bool, "retry_after": int, "remaining": int}
        pass
    
    async def reset_limit(self, identifier: str) -> None:
        # Your implementation here
        pass`,
          java: `import java.util.concurrent.CompletableFuture;
import java.util.Map;

public class RateLimiter {
    private String algorithm;
    private String store;
    
    public RateLimiter(String algorithm, String store) {
        // Your implementation here
    }
    
    public CompletableFuture<Map<String, Object>> isAllowed(
        String identifier, int limit, long window) {
        // Your implementation here
        return null;
    }
    
    public CompletableFuture<Void> resetLimit(String identifier) {
        // Your implementation here
        return null;
    }
}`,
          cpp: `#include <string>
#include <unordered_map>
#include <future>

class RateLimiter {
private:
    std::string algorithm;
    std::string store;
    
public:
    RateLimiter(const std::string& algorithm = "token-bucket", 
                const std::string& store = "redis") {
        // Your implementation here
    }
    
    std::future<std::unordered_map<std::string, int>> 
    isAllowed(const std::string& identifier, int limit, long window) {
        // Your implementation here
        return std::promise<std::unordered_map<std::string, int>>().get_future();
    }
    
    std::future<void> resetLimit(const std::string& identifier) {
        // Your implementation here
        return std::promise<void>().get_future();
    }
};`
        },
        testCases: [
          {
            input: "User makes 100 requests in 60 seconds with 100/min limit",
            expectedOutput: "All requests allowed, remaining count decreases",
            isHidden: false
          },
          {
            input: "User makes 150 requests in 60 seconds with 100/min limit", 
            expectedOutput: "First 100 allowed, next 50 rate limited",
            isHidden: true
          }
        ],
        evaluationCriteria: [
          "Correct rate limiting algorithm implementation",
          "Distributed system considerations",
          "Performance and scalability",
          "Accurate counting with minimal race conditions",
          "Proper error handling and user feedback",
          "Code organization and extensibility"
        ],
        timeComplexity: "O(1) per request",
        spaceComplexity: "O(n) where n is number of unique identifiers",
        aiPrompt: "This is a system design implementation challenge. You need to build a production-ready rate limiter that can handle distributed systems. Think about the algorithms you'd use, how to handle consistency across servers, and what trade-offs you'd make between accuracy and performance.",
        followUpQuestions: [
          "How would you handle clock synchronization across servers?",
          "What would happen if Redis goes down? How would you handle failover?",
          "How would you monitor and alert on rate limiting effectiveness?",
          "Could you implement this using only in-memory storage? What would be the limitations?"
        ],
        hints: [
          "Consider using Redis for distributed storage",
          "Sliding window log vs fixed window counter trade-offs",
          "Use atomic operations to prevent race conditions",
          "Think about memory cleanup for old entries"
        ],
        tags: ["system-design", "rate-limiting", "distributed-systems", "redis", "backend"],
        estimatedTime: 30
      }
    ];
    
    // Insert all questions
    for (const question of questions) {
      await CodingQuestion.create(question);
    }
  }
}

export default CodingQuestionBankService;