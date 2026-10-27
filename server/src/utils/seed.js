import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import CodingChallenge from '../models/CodingChallenge.js';
import Interview from '../models/Interview.js';
import InterviewEvaluation from '../models/InterviewEvaluation.js';
import ChatMessage from '../models/ChatMessage.js';
import Notification from '../models/Notification.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';

dotenv.config();

export async function seedDatabase() {
  await connectDB();

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    CodingChallenge.deleteMany({}),
    Interview.deleteMany({}),
    InterviewEvaluation.deleteMany({}),
    ChatMessage.deleteMany({}),
    Notification.deleteMany({}),
    AnalyticsEvent.deleteMany({})
  ]);

  console.log('[Seed] Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('Password123!', salt);

  const users = await User.insertMany([
    {
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      passwordHash: commonPasswordHash,
      role: 'candidate',
      title: 'Full-Stack Developer (3 YOE)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      emailVerified: true
    },
    {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      passwordHash: commonPasswordHash,
      role: 'candidate',
      title: 'Senior Frontend Engineer (5 YOE)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      emailVerified: true
    },
    {
      name: 'David Kim',
      email: 'david.kim@example.com',
      passwordHash: commonPasswordHash,
      role: 'candidate',
      title: 'Backend Systems Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      emailVerified: true
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      passwordHash: commonPasswordHash,
      role: 'candidate',
      title: 'Distributed Systems & Cloud Engineer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      emailVerified: true
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      passwordHash: commonPasswordHash,
      role: 'interviewer',
      title: 'Staff Software Engineer @ Cloud Core',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      emailVerified: true
    },
    {
      name: 'James Wilson',
      email: 'james.wilson@example.com',
      passwordHash: commonPasswordHash,
      role: 'interviewer',
      title: 'Principal Architect & Technical Lead',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      emailVerified: true
    },
    {
      name: 'Michael Chang',
      email: 'michael.chang@example.com',
      passwordHash: commonPasswordHash,
      role: 'interviewer',
      title: 'Engineering Manager & Hiring Bar Raiser',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      emailVerified: true
    },
    {
      name: 'Rachel Green',
      email: 'rachel.green@example.com',
      passwordHash: commonPasswordHash,
      role: 'recruiter',
      title: 'Lead Technical Talent Partner',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      emailVerified: true
    },
    {
      name: 'System Admin',
      email: 'admin@interviewhub.io',
      passwordHash: commonPasswordHash,
      role: 'admin',
      title: 'Chief Technology Officer / Administrator',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      emailVerified: true
    }
  ]);

  const [alex, sarah, david, priya, elena, james, michael, rachel, admin] = users;

  console.log('[Seed] Seeding Challenges...');
  const challenges = await CodingChallenge.insertMany([
    {
      title: 'Two Sum',
      description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

### Example 1:
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
      difficulty: 'Easy',
      category: 'Arrays & Hashing',
      supportedLanguages: ['javascript', 'python', 'typescript', 'java', 'cpp'],
      starterCode: {
        javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
`,
        python: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
`
      },
      testCases: [
        { input: '[[2, 7, 11, 15], 9]', expectedOutput: '[0,1]', explanation: '2 + 7 = 9' },
        { input: '[[3, 2, 4], 6]', expectedOutput: '[1,2]', explanation: '2 + 4 = 6' },
        { input: '[[3, 3], 6]', expectedOutput: '[0,1]', explanation: '3 + 3 = 6', isHidden: true }
      ],
      hints: [
        'A brute force approach checks every pair: O(n^2).',
        'Can you use a hash map to look up the complement in O(1) time?'
      ],
      createdBy: elena._id
    },
    {
      title: 'Valid Parentheses',
      description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example 1:
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: s = "(]"
Output: false
\`\`\``,
      difficulty: 'Easy',
      category: 'Stack',
      supportedLanguages: ['javascript', 'python', 'typescript'],
      starterCode: {
        javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}
`,
        python: `def isValid(s: str) -> bool:
    stack = []
    lookup = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in lookup.values():
            stack.append(char)
        elif char in lookup:
            if not stack or stack.pop() != lookup[char]:
                return False
    return len(stack) == 0
`
      },
      testCases: [
        { input: '["()[]{}"]', expectedOutput: 'true' },
        { input: '["(]"]', expectedOutput: 'false' },
        { input: '["([{}])"]', expectedOutput: 'true', isHidden: true }
      ],
      hints: ['Consider using a Last-In First-Out (Stack) data structure.'],
      createdBy: james._id
    },
    {
      title: 'Merge Intervals',
      description: `Given an array of \`intervals\` where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

### Example 1:
\`\`\`
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].
\`\`\``,
      difficulty: 'Medium',
      category: 'Arrays & Sorting',
      starterCode: {
        javascript: `function merge(intervals) {
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const res = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = res[res.length - 1];
    const curr = intervals[i];
    if (curr[0] <= last[1]) {
      last[1] = Math.max(last[1], curr[1]);
    } else {
      res.push(curr);
    }
  }
  return res;
}
`
      },
      testCases: [
        { input: '[[[1,3],[2,6],[8,10],[15,18]]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
        { input: '[[[1,4],[4,5]]]', expectedOutput: '[[1,5]]' }
      ],
      createdBy: elena._id
    },
    {
      title: 'LRU Cache Design',
      description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) Cache**.

Implement the LRUCache class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size capacity.
- \`int get(int key)\` Return the value of the key if the key exists, otherwise return -1.
- \`void put(int key, int value)\` Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions \`get\` and \`put\` must each run in O(1) average time complexity.`,
      difficulty: 'Hard',
      category: 'Data Structures & Design',
      starterCode: {
        javascript: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}
`
      },
      testCases: [
        { input: '["capacity: 2"]', expectedOutput: '"Cache initialized"' }
      ],
      createdBy: james._id
    }
  ]);

  const [twoSum, validParen, mergeIntervals, lruCache] = challenges;

  console.log('[Seed] Seeding Interviews...');
  const now = new Date();

  // 1. Live Active Demo Room
  const liveInterview = await Interview.create({
    title: 'Senior Frontend Coding Round: Alex Chen',
    description: 'Technical evaluation covering Data Structures, algorithms, and React architecture patterns.',
    candidateId: alex._id,
    interviewerIds: [elena._id, james._id],
    scheduledStart: new Date(now.getTime() - 15 * 60 * 1000), // started 15 min ago
    scheduledEnd: new Date(now.getTime() + 45 * 60 * 1000),
    actualStart: new Date(now.getTime() - 15 * 60 * 1000),
    status: 'in-progress',
    meetingCode: 'meet-demo-live',
    challengeId: twoSum._id,
    activeCode: twoSum.starterCode.javascript,
    activeLanguage: 'javascript',
    createdBy: elena._id
  });

  // 2. Upcoming Interview Today
  const upcomingInterview1 = await Interview.create({
    title: 'Distributed Systems & Concurrency: David Kim',
    description: 'Deep dive into caching strategies, rate limiting, and thread safety.',
    candidateId: david._id,
    interviewerIds: [james._id],
    scheduledStart: new Date(now.getTime() + 2 * 60 * 60 * 1000), // in 2 hours
    scheduledEnd: new Date(now.getTime() + 3 * 60 * 60 * 1000),
    status: 'scheduled',
    meetingCode: 'meet-dvd-981',
    challengeId: mergeIntervals._id,
    activeCode: mergeIntervals.starterCode.javascript,
    activeLanguage: 'javascript',
    createdBy: james._id
  });

  // 3. Upcoming Interview Tomorrow
  const upcomingInterview2 = await Interview.create({
    title: 'Full-Stack Architecture Interview: Sarah Jenkins',
    description: 'Frontend optimization, WebRTC signaling, and component state management.',
    candidateId: sarah._id,
    interviewerIds: [elena._id],
    scheduledStart: new Date(now.getTime() + 26 * 60 * 60 * 1000),
    scheduledEnd: new Date(now.getTime() + 27 * 60 * 60 * 1000),
    status: 'scheduled',
    meetingCode: 'meet-srh-442',
    challengeId: validParen._id,
    activeCode: validParen.starterCode.javascript,
    activeLanguage: 'javascript',
    createdBy: elena._id
  });

  // 4. Completed Interview 1 (Priya Patel - Hire)
  const completedInterview1 = await Interview.create({
    title: 'Cloud Infrastructure & Algorithms: Priya Patel',
    description: 'Algorithm problem solving and scalability considerations.',
    candidateId: priya._id,
    interviewerIds: [michael._id],
    scheduledStart: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    scheduledEnd: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    actualStart: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    actualEnd: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 52 * 60 * 1000),
    status: 'completed',
    meetingCode: 'meet-pry-109',
    challengeId: twoSum._id,
    activeCode: twoSum.starterCode.javascript,
    activeLanguage: 'javascript',
    createdBy: michael._id
  });

  // 5. Completed Interview 2 (Sarah Jenkins - Strong Hire)
  const completedInterview2 = await Interview.create({
    title: 'Algorithms & Data Structures: Sarah Jenkins',
    description: 'Stack parsing and complexity analysis.',
    candidateId: sarah._id,
    interviewerIds: [elena._id],
    scheduledStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    scheduledEnd: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    actualStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    actualEnd: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 47 * 60 * 1000),
    status: 'completed',
    meetingCode: 'meet-srh-001',
    challengeId: validParen._id,
    activeCode: validParen.starterCode.javascript,
    activeLanguage: 'javascript',
    createdBy: elena._id
  });

  // 6. Seed additional historical interviews across past 14 days for rich charts
  for (let d = 3; d <= 14; d++) {
    const isCompleted = d % 5 !== 0;
    const isCancelled = d % 7 === 0;
    const interviewStatus = isCancelled ? 'cancelled' : (isCompleted ? 'completed' : 'scheduled');
    const dayOffset = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    const intv = await Interview.create({
      title: `Technical Round: Track-${d}`,
      description: 'Historical interview evaluation record.',
      candidateId: [alex._id, sarah._id, david._id, priya._id][d % 4],
      interviewerIds: [[elena._id], [james._id], [michael._id]][d % 3],
      scheduledStart: dayOffset,
      scheduledEnd: new Date(dayOffset.getTime() + 60 * 60 * 1000),
      actualStart: isCompleted ? dayOffset : null,
      actualEnd: isCompleted ? new Date(dayOffset.getTime() + (40 + (d * 3) % 25) * 60 * 1000) : null,
      status: interviewStatus,
      meetingCode: `meet-hist-${d}-${Math.random().toString(36).substring(2, 5)}`,
      challengeId: [twoSum._id, validParen._id, mergeIntervals._id][d % 3],
      createdBy: elena._id
    });

    if (isCompleted) {
      await InterviewEvaluation.create({
        interviewId: intv._id,
        evaluatorId: intv.interviewerIds[0],
        candidateId: intv.candidateId,
        ratings: {
          problemSolving: 3 + (d % 3),
          dataStructures: 3 + ((d + 1) % 3),
          codeQuality: 4,
          communication: 4,
          systemDesign: 3 + (d % 2),
          overallScore: 7 + (d % 3)
        },
        recommendation: d % 3 === 0 ? 'Strong Hire' : (d % 2 === 0 ? 'Hire' : 'Leaning Hire'),
        candidateFeedback: 'Candidate showed strong grasp of foundational algorithmic complexities and handled edge cases well.',
        privateNotes: 'Private note: Recommend placing on team Core-Infra. Strong grasp of tradeoffs and clean modular thinking.',
        submittedAt: new Date(dayOffset.getTime() + 70 * 60 * 1000)
      });
    }
  }

  console.log('[Seed] Seeding Evaluations for Completed Interviews...');
  await InterviewEvaluation.create({
    interviewId: completedInterview1._id,
    evaluatorId: michael._id,
    candidateId: priya._id,
    ratings: {
      problemSolving: 4,
      dataStructures: 4,
      codeQuality: 5,
      communication: 5,
      systemDesign: 4,
      overallScore: 8.8
    },
    recommendation: 'Hire',
    candidateFeedback: 'Exceptional communication during problem breakdown. Identified O(N) space-time tradeoff immediately and tested edge cases without prompting.',
    privateNotes: 'CONFIDENTIAL: Candidate is top quartile for L5 backend engineer. Highly recommend proceeding to team matching.',
    submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000)
  });

  await InterviewEvaluation.create({
    interviewId: completedInterview2._id,
    evaluatorId: elena._id,
    candidateId: sarah._id,
    ratings: {
      problemSolving: 5,
      dataStructures: 5,
      codeQuality: 5,
      communication: 5,
      systemDesign: 4,
      overallScore: 9.6
    },
    recommendation: 'Strong Hire',
    candidateFeedback: 'Phenomenal performance on stack parsing. Delivered clean, idiomatic JavaScript with zero syntax errors on first execution.',
    privateNotes: 'CONFIDENTIAL: Absolute bar-raiser. Offer immediately at Staff level. Exceptional leadership presence.',
    submittedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)
  });

  console.log('[Seed] Seeding Chat Messages...');
  await ChatMessage.insertMany([
    {
      interviewId: liveInterview._id,
      senderId: elena._id,
      senderName: elena.name,
      senderRole: elena.role,
      message: 'Hi Alex, welcome to InterviewHub! Let me know when you can hear me and see the shared editor.'
    },
    {
      interviewId: liveInterview._id,
      senderId: alex._id,
      senderName: alex.name,
      senderRole: alex.role,
      message: 'Hi Elena! Audio and video are crystal clear. I see the Two Sum problem on the left panel.'
    },
    {
      interviewId: liveInterview._id,
      senderId: james._id,
      senderName: james.name,
      senderRole: james.role,
      message: 'Awesome. Whenever you are ready, talk us through your thought process before writing code.'
    }
  ]);

  console.log('[Seed] Seeding Notifications...');
  await Notification.insertMany([
    {
      recipientId: alex._id,
      type: 'interview_invite',
      title: 'Interview In Progress: Senior Frontend Coding Round',
      message: 'Your live interview room with Elena Rostova is open.',
      relatedInterviewId: liveInterview._id
    },
    {
      recipientId: david._id,
      type: 'interview_reminder',
      title: 'Upcoming Interview in 2 Hours',
      message: 'Distributed Systems & Concurrency with James Wilson starts at ' + upcomingInterview1.scheduledStart.toLocaleTimeString(),
      relatedInterviewId: upcomingInterview1._id
    },
    {
      recipientId: elena._id,
      type: 'interview_reminder',
      title: 'Active Interview Session',
      message: 'Senior Frontend Coding Round with Alex Chen is active.',
      relatedInterviewId: liveInterview._id
    },
    {
      recipientId: priya._id,
      type: 'feedback_submitted',
      title: 'Evaluation Completed',
      message: 'Your interviewer has submitted evaluation feedback for Cloud Infrastructure & Algorithms.',
      relatedInterviewId: completedInterview1._id
    }
  ]);

  console.log('[Seed] Seeding Analytics Events...');
  const eventTypes = [
    'user_registered', 'user_logged_in', 'interview_scheduled',
    'interview_started', 'interview_completed', 'evaluation_submitted', 'code_executed'
  ];

  for (let i = 0; i < 40; i++) {
    const randomDay = Math.floor(Math.random() * 20);
    const occurredAt = new Date(now.getTime() - randomDay * 24 * 60 * 60 * 1000 - Math.random() * 3600000);
    await AnalyticsEvent.create({
      actorId: [alex._id, sarah._id, elena._id, james._id, rachel._id][i % 5],
      eventType: eventTypes[i % eventTypes.length],
      interviewId: [liveInterview._id, completedInterview1._id, completedInterview2._id][i % 3],
      occurredAt,
      metadata: { seedEvent: true }
    });
  }

  console.log('==================================================');
  console.log(' Database successfully seeded!');
  console.log(' Seed Demo Users:');
  console.log(' - Candidate:   alex.chen@example.com (Password123!)');
  console.log(' - Candidate:   sarah.jenkins@example.com (Password123!)');
  console.log(' - Interviewer: elena.rostova@example.com (Password123!)');
  console.log(' - Interviewer: james.wilson@example.com (Password123!)');
  console.log(' - Recruiter:   rachel.green@example.com (Password123!)');
  console.log(' - Admin:       admin@interviewhub.io (Password123!)');
  console.log(' Live Demo Room Code: meet-demo-live');
  console.log('==================================================');
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch((err) => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}
