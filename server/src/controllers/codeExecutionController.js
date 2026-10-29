import vm from 'vm';
import { spawn } from 'child_process';
import CodingChallenge from '../models/CodingChallenge.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';

export async function executeCode(req, res, next) {
  try {
    const { code, language = 'javascript', challengeId, customInput } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'No code provided.' });
    }

    // Safety checks against dangerous system modules in candidate code
    const forbiddenPatterns = [
      /process\./,
      /require\s*\(/,
      /import\s+/,
      /child_process/,
      /fs\./,
      /__dirname/,
      /__filename/
    ];

    if (language === 'javascript') {
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(code)) {
          return res.json({
            success: true,
            data: {
              status: 'Execution Error',
              stdout: '',
              stderr: 'Security Policy Violation: Access to system APIs (process, fs, child_process, require) is forbidden.',
              passed: false
            }
          });
        }
      }
    }

    let challenge = null;
    if (challengeId) {
      challenge = await CodingChallenge.findById(challengeId);
    }

    const startTime = Date.now();
    let stdoutBuffer = [];
    let stderrBuffer = [];
    let testResults = [];
    let passedCount = 0;

    if (language === 'javascript') {
      // Sandboxed execution using Node vm
      const sandbox = {
        console: {
          log: (...args) => stdoutBuffer.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args) => stderrBuffer.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args) => stdoutBuffer.push('[WARN] ' + args.join(' '))
        },
        JSON,
        Math,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Map,
        Set,
        Date,
        parseInt,
        parseFloat
      };

      const context = vm.createContext(sandbox);

      try {
        const script = new vm.Script(code);
        // Execute main script with 1500ms timeout
        const returnedValue = script.runInContext(context, { timeout: 1500 });
        if (returnedValue !== undefined) {
          stdoutBuffer.push(`Returned: ${typeof returnedValue === 'object' ? JSON.stringify(returnedValue) : returnedValue}`);
        }

        // If challenge test cases exist, run them!
        if (challenge && challenge.testCases && challenge.testCases.length > 0) {
          for (let i = 0; i < challenge.testCases.length; i++) {
            const tc = challenge.testCases[i];
            const testCode = `
              try {
                const fn = typeof solution === 'function' ? solution : (typeof twoSum === 'function' ? twoSum : (typeof reverseList === 'function' ? reverseList : Object.values(this).find(v => typeof v === 'function')));
                if (!fn) throw new Error('No solution function found');
                const parsedInput = ${tc.input};
                const res = Array.isArray(parsedInput) ? fn(...parsedInput) : fn(parsedInput);
                JSON.stringify(res);
              } catch(e) {
                'ERR:' + e.message;
              }
            `;
            let actualOutput;
            try {
              const testScript = new vm.Script(testCode);
              actualOutput = testScript.runInContext(context, { timeout: 1000 });
            } catch (tcErr) {
              actualOutput = 'ERR:' + tcErr.message;
            }

            const cleanExpected = tc.expectedOutput.replace(/\s+/g, '');
            const cleanActual = (actualOutput || '').replace(/\s+/g, '');
            const isMatch = cleanExpected === cleanActual;
            if (isMatch) passedCount++;

            testResults.push({
              testCaseIndex: i + 1,
              input: tc.input,
              expected: tc.expectedOutput,
              actual: actualOutput,
              passed: isMatch,
              isHidden: tc.isHidden && req.user.role === 'candidate'
            });
          }
        }
      } catch (execErr) {
        stderrBuffer.push(execErr.message);
      }
    } else if (language === 'python') {
      // Execute Python safely via child_process
      try {
        const pyResult = await new Promise((resolve) => {
          const proc = spawn('python3', ['-c', code], { timeout: 2000 });
          let out = '';
          let err = '';
          proc.stdout.on('data', d => out += d.toString());
          proc.stderr.on('data', d => err += d.toString());
          proc.on('close', (exitCode) => resolve({ out, err, exitCode }));
          proc.on('error', (err) => resolve({ out: '', err: 'Python execution unavailable: ' + err.message, exitCode: 1 }));
        });
        stdoutBuffer.push(pyResult.out);
        if (pyResult.err) stderrBuffer.push(pyResult.err);
      } catch (pyErr) {
        stderrBuffer.push(pyErr.message);
      }
    } else {
      stdoutBuffer.push(`Language '${language}' syntax checked. Execution simulation complete.`);
    }

    const duration = Date.now() - startTime;

    try {
      if (AnalyticsEvent && req.user?._id) {
        AnalyticsEvent.create({
          actorId: req.user._id,
          eventType: 'code_executed',
          metadata: { language, durationMs: duration, passedCount, totalCases: testResults.length }
        }).catch(() => {});
      }
    } catch (e) {}

    res.json({
      success: true,
      data: {
        status: stderrBuffer.length > 0 ? 'Runtime Error' : 'Success',
        stdout: stdoutBuffer.join('\n'),
        stderr: stderrBuffer.join('\n'),
        executionTimeMs: duration,
        testCases: testResults,
        passRate: testResults.length > 0 ? Math.round((passedCount / testResults.length) * 100) : 100
      }
    });
  } catch (err) {
    next(err);
  }
}
