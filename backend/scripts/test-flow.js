#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║       KaryaAI — End-to-End API Flow Test Script             ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Flow:                                                       ║
 * ║   01. Health check                                           ║
 * ║   02. Register Admin, Client, 3 Employees                   ║
 * ║   03. Login via /api/auth/dev-token (Admin SDK tokens)       ║
 * ║   04. Create Product (as Client)                             ║
 * ║   05. Generate AI Workflow (as Client)   [Gemini]            ║
 * ║   06. Inspect workflow phases + task structure               ║
 * ║   07. Approve Workflow (as Admin) → seeds tasks collection   ║
 * ║   08. Verify tasks were seeded into flat tasks collection    ║
 * ║   09. AI Project Analysis                [Gemini]            ║
 * ║   10. AI Auto-assign tasks to employees  [Gemini]            ║
 * ║   11. Verify task assignments per employee                   ║
 * ║   12. Employee marks task in_progress                        ║
 * ║   13. Get AI recommendations for product                     ║
 * ║   14. Cleanup                                                ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node scripts/test-flow.js
 *   node scripts/test-flow.js --no-cleanup      keep test data in Firestore
 *   node scripts/test-flow.js --base-url http://localhost:3000
 *
 * Requirements:
 *   • Node.js 18+  (uses built-in fetch)
 *   • Backend running:  npm run dev  (in /backend)
 *
 * Notes:
 *   • Gemini steps (05, 09, 10) may fail with 429 on the free tier.
 *     The script will warn but not count these as failures.
 *   • Each run creates fresh Firebase Auth users with unique emails.
 *     Firebase Auth users must be removed manually from the console.
 */

'use strict';

// ─── Config ───────────────────────────────────────────────────────────────────

const args     = process.argv.slice(2);
const BASE_URL = args.find(a => a.startsWith('--base-url='))?.split('=')[1] ?? 'http://localhost:3000';
const CLEANUP  = !args.includes('--no-cleanup');
const RUN_ID   = Date.now();

const USERS = {
  admin: {
    email:     `test.admin.${RUN_ID}@karyaai.test`,
    password:  'Admin@Test123',
    full_name: 'Test Admin',
    role:      'admin',
  },
  client: {
    email:     `test.client.${RUN_ID}@karyaai.test`,
    password:  'Client@Test123',
    full_name: 'Test Client',
    role:      'client',
  },
  emp1: {
    email:     `test.emp1.${RUN_ID}@karyaai.test`,
    password:  'Emp@Test123',
    full_name: 'Alice Frontend',
    role:      'employee',
    skillset:  ['iOS Development', 'Android Development', 'UI Development', 'React Native'],
  },
  emp2: {
    email:     `test.emp2.${RUN_ID}@karyaai.test`,
    password:  'Emp@Test123',
    full_name: 'Bob Backend',
    role:      'employee',
    skillset:  ['Backend Development', 'API Design', 'Node.js', 'REST API', 'Database Design'],
  },
  emp3: {
    email:     `test.emp3.${RUN_ID}@karyaai.test`,
    password:  'Emp@Test123',
    full_name: 'Carol QA',
    role:      'employee',
    skillset:  ['Software Testing', 'QA', 'Integration Testing', 'Test Automation', 'UX Research'],
  },
};

const PROJECT_DESC =
  'Build a mobile food delivery app with real-time tracking, payment ' +
  'integration, and a restaurant management system.';

// ─── State (filled as tests run) ──────────────────────────────────────────────

const state = {
  uids:        {},   // role → uid
  tokens:      {},   // role → dev custom token
  productId:   null,
  workflowId:  null,
  tasks:       [],
  assignments: [],
};

// ─── ANSI helpers ─────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', blue: '\x1b[34m', magenta: '\x1b[35m',
};

const pass  = (msg) => console.log(`  ${c.green}✔${c.reset}  ${msg}`);
const fail  = (msg) => console.log(`  ${c.red}✘${c.reset}  ${c.red}${msg}${c.reset}`);
const info  = (msg) => console.log(`  ${c.cyan}ℹ${c.reset}  ${c.dim}${msg}${c.reset}`);
const warn  = (msg) => console.log(`  ${c.yellow}⚠${c.reset}  ${c.yellow}${msg}${c.reset}`);
const step  = (n, title) => console.log(`\n${c.bold}${c.blue}Step ${n}: ${title}${c.reset}`);
const ruler = () => console.log(`${c.dim}${'─'.repeat(60)}${c.reset}`);

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function api(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  return { status: res.status, ok: res.ok, data };
}

const GET   = (path, token)       => api('GET',    path, null, token);
const POST  = (path, body, token) => api('POST',   path, body, token);
const PUT   = (path, body, token) => api('PUT',    path, body, token);
const DEL   = (path, token)       => api('DELETE', path, null, token);

// ─── Test runner ──────────────────────────────────────────────────────────────

let totalPassed      = 0;
let totalFailed      = 0;
let totalQuotaWarns  = 0;

/** True when the API response indicates a Gemini free-tier rate limit */
function isQuotaError(data) {
  const msg = JSON.stringify(data?.error ?? data ?? '');
  return msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
}

function assert(condition, label, detail = null) {
  if (condition) {
    pass(label);
    totalPassed++;
  } else {
    fail(label);
    if (detail) info(typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 200));
    totalFailed++;
  }
  return condition;
}

// ─── Steps ────────────────────────────────────────────────────────────────────

async function step01_healthCheck() {
  step('01', 'Health Check');
  ruler();

  const { ok, data } = await GET('/api/health');
  assert(ok,                            `GET /api/health → ${data.status ?? '?'}`);
  assert(data.database?.connected, `Database connected`);
  info(`Environment: ${data.environment}`);
}

// ──────────────────────────────────────────────────────────────────────────────

async function step02_registerUsers() {
  step('02', 'Register Users  (Admin · Client · 3 Employees)');
  ruler();

  for (const [role, userData] of Object.entries(USERS)) {
    const { ok, data } = await POST('/api/auth/signup', userData);

    if (ok) {
      state.uids[role] = data.data?.uid;
      pass(`${userData.role.padEnd(8)}  ${userData.full_name}  (uid: ${state.uids[role]})`);
    } else {
      fail(`Register failed for ${role}: ${data.error ?? JSON.stringify(data)}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────

async function step03_getDevTokens() {
  step('03', 'Acquire Dev Tokens  (/api/auth/dev-token — Admin SDK, bypasses blocked Firebase REST API)');
  ruler();

  for (const [role, userData] of Object.entries(USERS)) {
    const { ok, data } = await POST('/api/auth/dev-token', {
      email:    userData.email,
      password: userData.password,
    });

    if (ok && data.data?.customToken) {
      state.tokens[role] = data.data.customToken;
      pass(`${userData.role.padEnd(8)}  '${userData.full_name}'  (uid: ${data.data.uid})`);
    } else {
      fail(`dev-token failed for ${role}: ${data.error ?? JSON.stringify(data).slice(0, 120)}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────

async function step04_createProduct() {
  step('04', 'Create Product  (as Client)');
  ruler();

  if (!state.tokens.client) { warn('Skipped — no client token'); return; }

  const { status, ok, data } = await POST('/api/products', {
    title:       'Mobile Food Delivery App',
    description: PROJECT_DESC,
    category:    'Mobile Application',
    priority:    'High',
  }, state.tokens.client);

  if (assert(ok && !!data.data?.id, `POST /api/products → ${status}`, data.error)) {
    state.productId = data.data.id;
    info(`Product ID: ${state.productId}`);
    info(`Status:     ${data.data.status}`);
  } else {
    info(JSON.stringify(data).slice(0, 300));
  }
}

// ──────────────────────────────────────────────────────────────────────────────

async function step05_generateWorkflow() {
  step('05', 'Generate AI Workflow  (as Client)  [Gemini — ~10-20s]');
  ruler();

  if (!state.tokens.client || !state.productId) {
    warn(`Skipped — token=${!!state.tokens.client}  productId=${!!state.productId}`);
    return;
  }

  info('Calling POST /api/workflows/generate…');

  const { status, ok, data } = await POST('/api/workflows/generate', {
    productId:   state.productId,
    description: PROJECT_DESC,
  }, state.tokens.client);

  if ((!ok && status === 429) || (!ok && isQuotaError(data))) {
    warn('Gemini free-tier quota exceeded — workflow generation skipped (429)');
    warn('Wait ~1 minute and re-run, or check https://ai.dev/rate-limit');
    totalQuotaWarns++;
    return;
  }

  if (assert(ok && !!data.data?.id, `POST /api/workflows/generate → ${status}`, data.error)) {
    state.workflowId = data.data.id;
    pass(`Workflow ID:  ${state.workflowId}`);
    info(`Title:        ${data.data.title}`);
    info(`Complexity:   ${data.data.complexity}`);
    info(`Priority:     ${data.data.priority}`);
    info(`Est. Hours:   ${data.data.estimatedHours}`);
    info(`Duration:     ${data.data.estimatedDuration}`);
    info(`Phases:       ${data.data.summary?.totalPhases}`);
    info(`Tasks:        ${data.data.summary?.totalTasks}`);
  } else {
    info(JSON.stringify(data).slice(0, 400));
  }
}

// ──────────────────────────────────────────────────────────────────────────────

async function step06_inspectWorkflow() {
  step('06', 'Inspect Workflow Phases & Task Structure');
  ruler();

  if (!state.workflowId) { warn('Skipped — no workflow'); return; }

  const token = state.tokens.client ?? state.tokens.admin;
  const { ok, data } = await GET(`/api/workflows/${state.workflowId}`, token);

  if (!assert(ok, `GET /api/workflows/${state.workflowId}`)) {
    info(JSON.stringify(data));
    return;
  }

  const phases = data.data?.phases ?? [];
  assert(phases.length > 0, `Workflow has ${phases.length} phases`);

  let totalTasks = 0;
  let depsAreIds = true;

  for (const phase of phases) {
    info(`Phase [${phase.order}] "${phase.name}"  ${phase.estimatedHours}h  tasks: ${phase.tasks?.length}`);

    for (const task of (phase.tasks ?? [])) {
      totalTasks++;
      for (const dep of (task.dependencies ?? [])) {
        if (dep && !/^task_\d+_\d+$/.test(dep)) {
          depsAreIds = false;
          warn(`  Dep is not an ID: "${dep}" on task ${task.id}`);
        }
      }
    }
  }

  assert(totalTasks > 0,   `Total embedded tasks: ${totalTasks}`);
  assert(depsAreIds,       `Task dependencies are IDs (not free-form titles)`);
}

// ──────────────────────────────────────────────────────────────────────────────

async function step07_approveWorkflow() {
  step('07', 'Approve Workflow  (as Admin)  → seeds tasks collection');
  ruler();

  if (!state.workflowId)   { warn('Skipped — no workflow');    return; }
  if (!state.tokens.admin) { warn('Skipped — no admin token'); return; }

  const { status, ok, data } = await POST(
    `/api/workflows/${state.workflowId}/approve`, {}, state.tokens.admin
  );

  if (assert(ok, `POST /api/workflows/${state.workflowId}/approve → ${status}`, data.error)) {
    pass(`Workflow status:  ${data.data?.workflow?.status}`);
    pass(`Product updated:  ${data.data?.productUpdated}`);
    pass(`Tasks seeded:     ${data.data?.tasksSeeded}`);
  } else {
    info(JSON.stringify(data));
  }
}

// ──────────────────────────────────────────────────────────────────────────────

async function step08_verifyTasksSeeded() {
  step('08', 'Verify Tasks Were Seeded Into /tasks Collection');
  ruler();

  if (!state.workflowId)   { warn('Skipped — no workflow');    return; }
  if (!state.tokens.admin) { warn('Skipped — no admin token'); return; }

  const { ok, data } = await GET(`/api/tasks?workflowId=${state.workflowId}`, state.tokens.admin);

  if (!assert(ok, `GET /api/tasks?workflowId=${state.workflowId}`)) {
    info(JSON.stringify(data));
    return;
  }

  const tasks = data.tasks ?? [];
  state.tasks = tasks;

  assert(tasks.length > 0, `Tasks collection seeded: ${tasks.length} tasks`);

  if (tasks.length > 0) {
    const t = tasks[0];
    assert(!!t.id,                           `First task has id: ${t.id}`);
    assert(!!t.title,                        `First task has title`);
    assert(!!t.phaseId,                      `First task has phaseId`);
    assert(t.status === 'unassigned',        `Task status is 'unassigned'`);
    assert(Array.isArray(t.skillsRequired),  `Task has skillsRequired array`);
  }

  info(`First 5 tasks:`);
  tasks.slice(0, 5).forEach(t =>
    info(`  [${(t.status ?? '').padEnd(10)}] ${t.id}  "${t.title}"  (${t.estimatedHours}h)`)
  );
}

// ──────────────────────────────────────────────────────────────────────────────

async function step09_analyzeProject() {
  step('09', 'AI Project Analysis  (as Admin)  [Gemini]');
  ruler();

  if (!state.tokens.admin) { warn('Skipped — no admin token'); return; }

  const { status, ok, data } = await POST('/api/ai/analyze-project', {
    description: PROJECT_DESC,
  }, state.tokens.admin);

  if (!ok && isQuotaError(data)) {
    warn('Gemini free-tier quota exceeded — project analysis skipped (429)');
    totalQuotaWarns++;
    return;
  }

  if (assert(ok, `POST /api/ai/analyze-project → ${status}`, data.error)) {
    const a = data.analysis;
    pass(`Complexity:    ${a?.complexity}`);
    pass(`Duration:      ${a?.estimatedDuration}`);
    pass(`Team size:     ${a?.recommendedTeamSize}`);
    pass(`Approach:      ${a?.recommendedApproach}`);
    info(`Risk factors:  ${(a?.riskFactors ?? []).join(' · ')}`);
    info(`Key tech:      ${(a?.keyTechnologies ?? []).join(', ')}`);
  } else {
    info(JSON.stringify(data).slice(0, 300));
  }
}

// ──────────────────────────────────────────────────────────────────────────────

async function step10_assignTasks() {
  step('10', 'AI Auto-Assign Tasks to Employees  [Gemini]');
  ruler();

  if (!state.workflowId)       { warn('Skipped — no workflow');     return; }
  if (state.tasks.length === 0) { warn('Skipped — no seeded tasks'); return; }
  if (!state.tokens.admin)     { warn('Skipped — no admin token');   return; }

  info(`Assigning ${state.tasks.length} task(s) via skill-matching…`);

  const { status, ok, data } = await POST('/api/ai/assign-tasks', {
    workflowId: state.workflowId,
  }, state.tokens.admin);

  if (!ok && isQuotaError(data)) {
    warn('Gemini free-tier quota exceeded — task assignment skipped (429)');
    totalQuotaWarns++;
    return;
  }

  if (assert(ok, `POST /api/ai/assign-tasks → ${status}`, data.error)) {
    const assignments = data.assignments ?? [];
    state.assignments = assignments;

    assert(assignments.length > 0, `Assigned ${assignments.length} task(s)`);

    info('Assignments:');
    for (const a of assignments) {
      info(`  ${a.taskId.padEnd(20)}→ ${a.employeeName.padEnd(18)} score=${a.matchScore}  ${a.reason ?? ''}`);
    }
  } else {
    info(JSON.stringify(data).slice(0, 400));
  }
}

// ──────────────────────────────────────────────────────────────────────────────

async function step11_verifyEmployeeTasks() {
  step('11', 'Verify Tasks Appear Under Each Employee');
  ruler();

  if (!state.tokens.admin) { warn('Skipped — no admin token'); return; }

  for (const role of ['emp1', 'emp2', 'emp3']) {
    const uid = state.uids[role];
    if (!uid) continue;

    const { ok, data } = await GET(`/api/tasks/employee/${uid}`, state.tokens.admin);
    const tasks = data.tasks ?? [];

    if (ok) {
      pass(`${USERS[role].full_name.padEnd(16)}  ${tasks.length} task(s)`);
      tasks.forEach(t =>
        info(`    [${t.status}] "${t.title}"  (${t.estimatedHours}h)`)
      );
    } else {
      warn(`Could not fetch tasks for ${role}: ${JSON.stringify(data).slice(0, 100)}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────

async function step12_updateTaskStatus() {
  step('12', 'Employee Updates a Task to in_progress');
  ruler();

  if (!state.tokens.emp1 || !state.uids.emp1) { warn('Skipped — no emp1 token'); return; }

  const { ok: listOk, data: listData } = await GET(
    `/api/tasks/employee/${state.uids.emp1}`, state.tokens.admin
  );
  const myTasks = listData.tasks ?? [];

  if (myTasks.length === 0) {
    warn('Skipped — emp1 has no assigned tasks (assignment step may have been skipped)');
    return;
  }

  const task = myTasks[0];
  info(`Marking "${task.title}" (${task.id}) → in_progress`);

  const { status, ok, data } = await PUT(`/api/tasks/${task.id}`, {
    status: 'in_progress',
  }, state.tokens.emp1);

  if (assert(ok, `PUT /api/tasks/${task.id} → ${status}`, data.error)) {
    assert(data.task?.status === 'in_progress', `Task status is now: ${data.task?.status}`);
  } else {
    info(JSON.stringify(data).slice(0, 300));
  }
}

// ──────────────────────────────────────────────────────────────────────────────

async function step13_recommendations() {
  step('13', 'AI Recommendations for Product');
  ruler();

  if (!state.productId)    { warn('Skipped — no product');    return; }
  if (!state.tokens.admin) { warn('Skipped — no admin token'); return; }

  const { status, ok, data } = await GET(
    `/api/ai/recommendations/${state.productId}`, state.tokens.admin
  );

  if (!ok && isQuotaError(data)) {
    warn('Gemini quota exceeded — recommendations skipped (429)');
    totalQuotaWarns++;
    return;
  }

  if (assert(ok, `GET /api/ai/recommendations/${state.productId} → ${status}`, data.error)) {
    const r = data.recommendations;
    info(`Workflows:        ${r?.workflowCount}`);
    info(`Total tasks:      ${r?.currentStatus?.totalTasks}`);
    info(`Unassigned tasks: ${r?.currentStatus?.unassignedTasks}`);
    if (r?.suggestions?.length > 0) {
      info('Suggestions:');
      r.suggestions.slice(0, 3).forEach(s => info(`  [${s.priority}] ${s.type}: ${s.message}`));
    }
  } else {
    info(JSON.stringify(data).slice(0, 300));
  }
}

// ──────────────────────────────────────────────────────────────────────────────

async function step14_cleanup() {
  if (!CLEANUP) {
    info('\nCleanup skipped (--no-cleanup). Persisted IDs:');
    info(`  Product ID:  ${state.productId}`);
    info(`  Workflow ID: ${state.workflowId}`);
    return;
  }

  step('14', 'Cleanup');
  ruler();

  if (!state.tokens.admin) { warn('Skipped — no admin token'); return; }

  if (state.productId) {
    const { ok } = await DEL(`/api/products/${state.productId}`, state.tokens.admin);
    ok
      ? pass(`Product ${state.productId} soft-deleted`)
      : warn(`Could not delete product ${state.productId}`);
  }

  warn('Firebase Auth users must be deleted manually from the Firebase Console:');
  for (const [role, uid] of Object.entries(state.uids)) {
    if (uid) info(`  ${role.padEnd(6)}  ${USERS[role].email.padEnd(42)} uid: ${uid}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n');
  console.log(`${c.bold}${c.magenta}╔══════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.magenta}║     KaryaAI — End-to-End API Flow Test           ║${c.reset}`);
  console.log(`${c.bold}${c.magenta}╚══════════════════════════════════════════════════╝${c.reset}`);
  console.log(`\n  ${c.dim}Base URL : ${BASE_URL}${c.reset}`);
  console.log(`  ${c.dim}Run ID   : ${RUN_ID}${c.reset}`);
  console.log(`  ${c.dim}Cleanup  : ${CLEANUP}${c.reset}\n`);

  const started = Date.now();

  try {
    await step01_healthCheck();
    await step02_registerUsers();
    await step03_getDevTokens();
    await step04_createProduct();
    await step05_generateWorkflow();   // Gemini — may 429 on free tier
    await step06_inspectWorkflow();
    await step07_approveWorkflow();
    await step08_verifyTasksSeeded();
    await step09_analyzeProject();     // Gemini
    await step10_assignTasks();        // Gemini
    await step11_verifyEmployeeTasks();
    await step12_updateTaskStatus();
    await step13_recommendations();    // Gemini
    await step14_cleanup();
  } catch (err) {
    console.error(`\n${c.red}${c.bold}FATAL ERROR:${c.reset}`, err.message);
    if (err.cause) console.error('Cause:', err.cause);
    process.exit(1);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

  const elapsed    = ((Date.now() - started) / 1000).toFixed(1);
  const allPassed  = totalFailed === 0;

  console.log('\n');
  console.log(`${c.bold}${'═'.repeat(60)}${c.reset}`);
  console.log(`${c.bold}  Test Summary${c.reset}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  ${c.green}Passed :${c.reset}  ${totalPassed}`);
  console.log(`  ${c.red}Failed :${c.reset}  ${totalFailed}`);
  if (totalQuotaWarns > 0)
    console.log(`  ${c.yellow}Quota ⚠:${c.reset}  ${totalQuotaWarns}  (Gemini free-tier rate limit — not counted as failures)`);
  console.log(`  ${c.dim}Total  :  ${totalPassed + totalFailed}${c.reset}`);
  console.log(`  ${c.dim}Time   :  ${elapsed}s${c.reset}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(
    allPassed
      ? `\n  ${c.green}${c.bold}✔  ALL TESTS PASSED${c.reset}\n`
      : `\n  ${c.red}${c.bold}✘  ${totalFailed} TEST(S) FAILED${c.reset}\n`
  );

  process.exit(allPassed ? 0 : 1);
}

main();
