export const FALLBACK_CHALLENGES = [
  {
    _id: 'ch_twosum_01',
    title: 'Two Sum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    tags: ['Array', 'Hash Table'],
    supportedLanguages: ['javascript', 'python', 'typescript'],
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      python: `def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []`
    }
  },
  {
    _id: 'ch_lru_02',
    title: 'LRU Cache Implementation',
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the \`LRUCache\` class with \`get\` and \`put\` methods running in O(1) average time complexity.`,
    difficulty: 'Medium',
    category: 'Data Structures',
    tags: ['Hash Table', 'Linked List', 'Design'],
    supportedLanguages: ['javascript', 'python', 'typescript'],
    starterCode: {
      javascript: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n\n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n\n  put(key, value) {\n    if (this.cache.has(key)) this.cache.delete(key);\n    this.cache.set(key, value);\n    if (this.cache.size > this.capacity) {\n      this.cache.delete(this.cache.keys().next().value);\n    }\n  }\n}`,
      python: `class LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = {}\n`
    }
  },
  {
    _id: 'ch_parens_03',
    title: 'Valid Parentheses',
    description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if brackets close in the correct order and same type.`,
    difficulty: 'Easy',
    category: 'Stack',
    tags: ['String', 'Stack'],
    supportedLanguages: ['javascript', 'python', 'typescript'],
    starterCode: {
      javascript: `function isValid(s) {\n  const stack = [];\n  const pairs = { ')': '(', '}': '{', ']': '[' };\n  for (const c of s) {\n    if (pairs[c]) {\n      if (stack.pop() !== pairs[c]) return false;\n    } else {\n      stack.push(c);\n    }\n  }\n  return stack.length === 0;\n}`
    }
  },
  {
    _id: 'ch_mergek_04',
    title: 'Merge k Sorted Lists',
    description: `You are given an array of \`k\` linked-lists \`lists\`, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.`,
    difficulty: 'Hard',
    category: 'Linked Lists & Heaps',
    tags: ['Linked List', 'Divide and Conquer', 'Heap'],
    supportedLanguages: ['javascript', 'python'],
    starterCode: {
      javascript: `function mergeKLists(lists) {\n  // Implementation here\n  return null;\n}`
    }
  }
];

export const FALLBACK_INTERVIEWS = [
  {
    _id: 'inv_live_01',
    title: 'Senior Full-Stack Architecture Screen',
    status: 'scheduled',
    meetingCode: 'eng-arch-902',
    scheduledStart: new Date(Date.now() + 3600000).toISOString(),
    durationMinutes: 60,
    candidateId: {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    },
    interviewerIds: [
      {
        name: 'Saqib (Admin)',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      }
    ],
    challengeId: FALLBACK_CHALLENGES[0]
  },
  {
    _id: 'inv_live_02',
    title: 'Distributed Systems & Algorithms',
    status: 'scheduled',
    meetingCode: 'alg-sys-481',
    scheduledStart: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 60,
    candidateId: {
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    interviewerIds: [
      {
        name: 'Elena Rostova',
        role: 'interviewer',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
      }
    ],
    challengeId: FALLBACK_CHALLENGES[1]
  },
  {
    _id: 'inv_live_03',
    title: 'Frontend React & Performance Session',
    status: 'completed',
    meetingCode: 'react-perf-239',
    scheduledStart: new Date(Date.now() - 86400000).toISOString(),
    durationMinutes: 45,
    candidateId: {
      name: 'David Kim',
      email: 'david.kim@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    interviewerIds: [
      {
        name: 'Saqib (Admin)',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
      }
    ],
    challengeId: FALLBACK_CHALLENGES[2]
  }
];
