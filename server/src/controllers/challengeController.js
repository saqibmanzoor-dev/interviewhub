import CodingChallenge from '../models/CodingChallenge.js';

export async function getChallenges(req, res, next) {
  try {
    const { difficulty, category, search } = req.query;
    const query = {};

    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const challenges = await CodingChallenge.find(query).select('-testCases.isHidden').sort({ difficulty: 1, title: 1 });
    res.json({ success: true, count: challenges.length, data: challenges });
  } catch (err) {
    next(err);
  }
}

export async function getChallengeById(req, res, next) {
  try {
    const challenge = await CodingChallenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found.' });
    }

    // Hide hidden test cases for candidates
    let sanitized = challenge.toObject();
    if (req.user.role === 'candidate') {
      sanitized.testCases = sanitized.testCases.filter(tc => !tc.isHidden);
    }

    res.json({ success: true, data: sanitized });
  } catch (err) {
    next(err);
  }
}

export async function createChallenge(req, res, next) {
  try {
    const { title, description, difficulty, category, starterCode, testCases, hints } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const challenge = await CodingChallenge.create({
      title,
      description,
      difficulty: difficulty || 'Medium',
      category: category || 'Algorithms',
      starterCode: starterCode || {},
      testCases: testCases || [],
      hints: hints || [],
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Challenge created.', data: challenge });
  } catch (err) {
    next(err);
  }
}

export async function updateChallenge(req, res, next) {
  try {
    const challenge = await CodingChallenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found.' });
    }
    res.json({ success: true, message: 'Challenge updated.', data: challenge });
  } catch (err) {
    next(err);
  }
}

export async function deleteChallenge(req, res, next) {
  try {
    const challenge = await CodingChallenge.findByIdAndDelete(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found.' });
    }
    res.json({ success: true, message: 'Challenge deleted.' });
  } catch (err) {
    next(err);
  }
}
