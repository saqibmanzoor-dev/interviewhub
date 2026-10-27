// Complete End-to-End API and Multi-User Isolation Verification Script
const BASE_URL = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('🚀 Running PostPilot End-to-End Verification Suite...\n');
  let passed = 0;
  let total = 0;

  const assert = (condition, title) => {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
    }
  };

  // 1. Health Endpoint
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.status === 'ok', 'GET /api/health returns 200 OK');

  // 2. Register User A
  const userAEmail = `user_a_${Date.now()}@example.com`;
  const regARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User A',
      email: userAEmail,
      password: 'password123',
    }),
  });
  const regAData = await regARes.json();
  assert(regARes.status === 201 && regAData.token, 'POST /api/auth/register creates User A and returns token');

  const tokenA = regAData.token;

  // 3. Duplicate Email Rejection
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User A Duplicate',
      email: userAEmail,
      password: 'password123',
    }),
  });
  assert(dupRes.status === 409, 'POST /api/auth/register rejects duplicate email with 409 Conflict');

  // 4. Login User A
  const loginARes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userAEmail,
      password: 'password123',
    }),
  });
  const loginAData = await loginARes.json();
  assert(loginARes.status === 200 && loginAData.token, 'POST /api/auth/login authenticates User A');

  // 5. Auth /me
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.user.email === userAEmail, 'GET /api/auth/me retrieves current user');

  // 6. Create Post for User A
  const post1Res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      title: 'Exciting Launch Event',
      content: 'We are officially launching PostPilot today! Check it out.',
      platform: 'linkedin',
      status: 'planned',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      hashtags: ['launch', 'tech', 'saas'],
    }),
  });
  const post1Data = await post1Res.json();
  assert(post1Res.status === 201 && post1Data.post?._id, 'POST /api/posts creates a post for User A');
  const post1Id = post1Data.post._id;

  // 7. Get Post By ID
  const getByIdRes = await fetch(`${BASE_URL}/posts/${post1Id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(getByIdRes.status === 200, 'GET /api/posts/:id fetches the created post');

  // 8. Filter and Search Posts
  const filterRes = await fetch(`${BASE_URL}/posts?platform=linkedin&status=planned&search=Launch`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const filterData = await filterRes.json();
  assert(filterRes.status === 200 && filterData.count === 1, 'GET /api/posts filters by platform, status, and search');

  // 9. Update Post
  const updateRes = await fetch(`${BASE_URL}/posts/${post1Id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      title: 'Exciting Launch Event (Updated)',
      content: 'Updated post content for launch.',
    }),
  });
  const updateData = await updateRes.json();
  assert(updateRes.status === 200 && updateData.post.title.includes('Updated'), 'PUT /api/posts/:id updates post fields');

  // 10. Update Status
  const statusRes = await fetch(`${BASE_URL}/posts/${post1Id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ status: 'published' }),
  });
  const statusData = await statusRes.json();
  assert(statusRes.status === 200 && statusData.post.status === 'published', 'PATCH /api/posts/:id/status updates status to published');

  // 11. Dashboard Summary
  const dashRes = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const dashData = await dashRes.json();
  assert(
    dashRes.status === 200 &&
    dashData.summary.total === 1 &&
    dashData.summary.published === 1,
    'GET /api/dashboard/summary reflects updated metrics (total: 1, published: 1)'
  );

  // 12. Multi-User Isolation: Register User B
  const userBEmail = `user_b_${Date.now()}@example.com`;
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User B',
      email: userBEmail,
      password: 'password123',
    }),
  });
  const regBData = await regBRes.json();
  const tokenB = regBData.token;

  // User B tries to view User A's post
  const userBGetA = await fetch(`${BASE_URL}/posts/${post1Id}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(userBGetA.status === 404, 'ISOLATION: User B cannot view User A post (404 Not Found)');

  // User B tries to update User A's post
  const userBUpdateA = await fetch(`${BASE_URL}/posts/${post1Id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ title: 'Hacked Title' }),
  });
  assert(userBUpdateA.status === 404, 'ISOLATION: User B cannot update User A post (404 Not Found)');

  // User B tries to delete User A's post
  const userBDeleteA = await fetch(`${BASE_URL}/posts/${post1Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(userBDeleteA.status === 404, 'ISOLATION: User B cannot delete User A post (404 Not Found)');

  // User B's post list is empty
  const userBList = await fetch(`${BASE_URL}/posts`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const userBListData = await userBList.json();
  assert(userBListData.count === 0, 'ISOLATION: User B post list is completely isolated (count: 0)');

  // 13. Delete Post by User A
  const delRes = await fetch(`${BASE_URL}/posts/${post1Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(delRes.status === 200, 'DELETE /api/posts/:id allows owner to delete post');

  // Verify post is gone
  const verifyDelRes = await fetch(`${BASE_URL}/posts/${post1Id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(verifyDelRes.status === 404, 'VERIFICATION: Deleted post no longer exists (404)');

  console.log(`\n========================================`);
  console.log(`🏁 Test Results: ${passed}/${total} Passed (${Math.round((passed/total)*100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

runTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
