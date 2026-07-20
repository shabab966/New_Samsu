/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load env variables
dotenv.config();

import { db } from './server/db';
import { executeWorkflowSteps } from './server/emulator';
import { extractDataFromHtml } from './server/gemini';
import demoRouter from './server/demoRouter';
import { Workflow, ExecutionLog, User } from './src/types';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'browser-api-recorder-super-secret-key';

app.use(express.json());

// Background Scheduler (Simulating Cron Engine for recurring API workflows)
setInterval(async () => {
  const workflows = db.getWorkflows();
  const now = new Date();

  for (const workflow of workflows) {
    if (!workflow.schedule || workflow.schedule === 'none') continue;

    // Determine interval in milliseconds
    let intervalMs = 0;
    if (workflow.schedule === '1m') intervalMs = 60 * 1000;
    else if (workflow.schedule === '5m') intervalMs = 5 * 60 * 1000;
    else if (workflow.schedule === '1h') intervalMs = 60 * 60 * 1000;
    else if (workflow.schedule === '24h') intervalMs = 24 * 60 * 60 * 1000;

    if (intervalMs === 0) continue;

    const lastRun = workflow.lastRunTime ? new Date(workflow.lastRunTime) : null;
    const shouldRun = !lastRun || (now.getTime() - lastRun.getTime() >= intervalMs);

    if (shouldRun) {
      console.log(`[Scheduler] Automatically triggering workflow "${workflow.name}" (${workflow.id})`);
      
      // Update workflow run state first to prevent double-execution
      workflow.lastRunTime = now.toISOString();
      db.updateWorkflow(workflow);

      try {
        const result = await executeWorkflowSteps(workflow.steps, workflow.startUrl, workflow.extractionPrompt);
        let extractedData = null;

        if (result.status === 'success') {
          try {
            extractedData = await extractDataFromHtml(result.finalHtml, workflow.extractionPrompt);
            workflow.lastRunStatus = 'success';
          } catch (extractErr) {
            result.logs.push(`[Scheduler] Data extraction failed during scheduled trigger.`);
            workflow.lastRunStatus = 'failed';
          }
        } else {
          workflow.lastRunStatus = 'failed';
        }

        // Save execution log
        const logId = 'log-' + Math.random().toString(36).substring(2, 9);
        const log: ExecutionLog = {
          id: logId,
          workflowId: workflow.id,
          workflowName: workflow.name,
          runTime: now.toISOString(),
          status: result.status,
          stepsExecuted: workflow.steps.length,
          totalSteps: workflow.steps.length,
          extractedData,
          logs: result.logs,
          trigger: 'schedule'
        };

        db.addHistory(log);
        db.updateWorkflow(workflow);
        console.log(`[Scheduler] Completed scheduled run for "${workflow.name}". Result: ${result.status.toUpperCase()}`);
      } catch (err: any) {
        console.error(`[Scheduler] Error running scheduled workflow ${workflow.id}:`, err);
      }
    }
  }
}, 10000); // Check every 10 seconds

// Authentication Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
}

// Ensure Token Present Middleware (Strict auth)
function requireAuth(req: any, res: any, next: any) {
  authenticateToken(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please login.' });
    }
    next();
  });
}

// ---------------- API ENDPOINTS ----------------

// Auth Register
app.post('/api/auth/register', async (req: any, res: any) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  const users = db.getUsers();
  if (users.some(u => u.username === username || u.email === email)) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }

  const userId = 'usr-' + Math.random().toString(36).substring(2, 9);
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser: User = {
    id: userId,
    username,
    email,
    createdAt: new Date().toISOString()
  };

  db.addUser(newUser, passwordHash);

  // Sign JWT with 30-day expiry (as requested)
  const token = jwt.sign({ id: userId, username, email }, JWT_SECRET, { expiresIn: '30d' });

  res.status(201).json({ token, user: newUser });
});

// Auth Login
app.post('/api/auth/login', async (req: any, res: any) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = db.getUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  const passwordHash = db.getPassword(user.id);
  if (!passwordHash) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, passwordHash);
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  // Sign JWT with 30-day expiry
  const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

  res.json({ token, user });
});

// Auth Status / Profile
app.get('/api/auth/me', authenticateToken, (req: any, res: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

// Get Workflows (Public or owned by active user)
app.get('/api/workflows', authenticateToken, (req: any, res: any) => {
  const workflows = db.getWorkflows();
  const userId = req.user?.id;

  // If authenticated, show public workflows + user's own workflows. Else, show only public workflows.
  const filtered = workflows.filter(w => w.isPublic || w.createdBy === 'system' || (userId && w.createdBy === userId));
  res.json(filtered);
});

// Create Workflow
app.post('/api/workflows', authenticateToken, (req: any, res: any) => {
  const { name, description, startUrl, steps, extractionPrompt, isPublic, schedule } = req.body;

  if (!name || !startUrl || !steps || !extractionPrompt) {
    return res.status(400).json({ error: 'Missing required workflow fields' });
  }

  const newWorkflow: Workflow = {
    id: 'wf-' + Math.random().toString(36).substring(2, 9),
    name,
    description: description || '',
    startUrl,
    steps,
    extractionPrompt,
    isPublic: isPublic !== undefined ? isPublic : true,
    createdBy: req.user?.id || 'system',
    createdAt: new Date().toISOString(),
    schedule: schedule || 'none',
    lastRunStatus: 'never',
    version: 1,
    versionHistory: [{
      version: 1,
      updatedAt: new Date().toISOString(),
      steps,
      extractionPrompt,
      changeSummary: 'Initial creation'
    }]
  };

  db.addWorkflow(newWorkflow);
  res.status(201).json(newWorkflow);
});

// Update Workflow (with version tracking)
app.put('/api/workflows/:id', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const { name, description, startUrl, steps, extractionPrompt, isPublic, schedule, changeSummary } = req.body;

  const workflow = db.getWorkflowById(id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  // Allow system/admin or creator to edit
  if (workflow.createdBy !== 'system' && workflow.createdBy !== (req.user?.id || 'system')) {
    return res.status(403).json({ error: 'Unauthorized to update this workflow' });
  }

  const currentVersion = workflow.version || 1;
  const nextVersion = currentVersion + 1;

  if (!workflow.versionHistory) {
    workflow.versionHistory = [{
      version: currentVersion,
      updatedAt: workflow.createdAt || new Date().toISOString(),
      steps: workflow.steps,
      extractionPrompt: workflow.extractionPrompt,
      changeSummary: 'Initial creation'
    }];
  }

  workflow.versionHistory.push({
    version: nextVersion,
    updatedAt: new Date().toISOString(),
    steps: steps || workflow.steps,
    extractionPrompt: extractionPrompt || workflow.extractionPrompt,
    changeSummary: changeSummary || 'Updated workflow steps'
  });

  workflow.version = nextVersion;
  if (name !== undefined) workflow.name = name;
  if (description !== undefined) workflow.description = description;
  if (startUrl !== undefined) workflow.startUrl = startUrl;
  if (steps !== undefined) workflow.steps = steps;
  if (extractionPrompt !== undefined) workflow.extractionPrompt = extractionPrompt;
  if (isPublic !== undefined) workflow.isPublic = isPublic;
  if (schedule !== undefined) workflow.schedule = schedule;

  db.updateWorkflow(workflow);
  res.json(workflow);
});

// Update Workflow Schedule
app.post('/api/workflows/:id/schedule', authenticateToken, (req: any, res: any) => {
  const { id } = req.params;
  const { schedule } = req.body;
  
  const workflow = db.getWorkflowById(id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  workflow.schedule = schedule || 'none';
  db.updateWorkflow(workflow);
  res.json({ success: true, schedule: workflow.schedule });
});

// Delete Workflow
app.delete('/api/workflows/:id', requireAuth, (req: any, res: any) => {
  const { id } = req.params;
  const workflow = db.getWorkflowById(id);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  // Allow deleting if user owns it, or if they are admin/system
  if (workflow.createdBy !== req.user.id && workflow.createdBy !== 'system') {
    return res.status(403).json({ error: 'Unauthorized to delete this workflow' });
  }

  db.deleteWorkflow(id);
  res.json({ success: true, message: 'Workflow and associated history deleted' });
});

// Run Workflow (Execute Steps + Gemini Extraction)
app.post('/api/workflows/:id/run', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  const workflow = db.getWorkflowById(id);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const runTime = new Date().toISOString();
  console.log(`[Manual Trigger] Executing workflow "${workflow.name}"`);

  try {
    // 1. Run headless step simulation
    const emulation = await executeWorkflowSteps(workflow.steps, workflow.startUrl, workflow.extractionPrompt);
    let extractedData = null;

    if (emulation.status === 'success') {
      try {
        emulation.logs.push(`[${new Date().toLocaleTimeString()}] Querying Google Gemini AI for structured extraction...`);
        
        // 2. Run Gemini Extraction
        extractedData = await extractDataFromHtml(emulation.finalHtml, workflow.extractionPrompt);
        workflow.lastRunStatus = 'success';
        
        emulation.logs.push(`[${new Date().toLocaleTimeString()}] Gemini extraction completed successfully! Data structured as JSON.`);
      } catch (extractErr: any) {
        emulation.logs.push(`[${new Date().toLocaleTimeString()}] Gemini extraction error: ${extractErr.message}`);
        workflow.lastRunStatus = 'failed';
      }
    } else {
      workflow.lastRunStatus = 'failed';
    }

    workflow.lastRunTime = runTime;
    db.updateWorkflow(workflow);

    // 3. Save Execution Log
    const logId = 'log-' + Math.random().toString(36).substring(2, 9);
    const log: ExecutionLog = {
      id: logId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      runTime,
      status: emulation.status === 'success' && workflow.lastRunStatus === 'success' ? 'success' : 'failed',
      stepsExecuted: workflow.steps.length,
      totalSteps: workflow.steps.length,
      extractedData,
      logs: emulation.logs,
      trigger: 'manual'
    };

    db.addHistory(log);

    res.json({
      success: log.status === 'success',
      logId,
      status: log.status,
      extractedData,
      logs: emulation.logs
    });
  } catch (err: any) {
    console.error(`Error executing workflow ${id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Get Run History
app.get('/api/history', authenticateToken, (req: any, res: any) => {
  const history = db.getHistory();
  // Filter history if needed, but for simplicity of the marketplace and learning, serve all logs
  res.json(history);
});

// Proxy Recorder Service (Fetches website, rewrites URLs, injects tracking recorder)
app.get('/api/proxy', async (req: any, res: any) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Missing target url query parameter.');
  }

  try {
    // If it is a local path to one of our demo sites, redirect
    if (targetUrl.startsWith('/demo/')) {
      return res.redirect(targetUrl);
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to proxy target URL. Status: ${response.status}`);
    }

    let html = await response.text();

    // Injected recorder script
    const proxyScript = `
    <script>
      (function() {
        console.log("Interactive Recorder Extension Script Activated inside Proxy Viewport");
        
        // Notify parent of load
        window.parent.postMessage({
          type: 'RECORDER_STEP',
          step: {
            type: 'navigate',
            url: "${targetUrl}",
            description: "Navigate to ${targetUrl}"
          }
        }, '*');

        // Capture click events on links and buttons
        document.addEventListener('click', (e) => {
          const el = e.target.closest('button, a, input[type="submit"]');
          if (!el) return;

          let selector = '';
          if (el.id) {
            selector = '#' + el.id;
          } else {
            selector = el.tagName.toLowerCase();
            if (el.className) {
              const firstClass = el.className.split(' ')[0];
              if (firstClass && !firstClass.includes(':')) selector += '.' + firstClass;
            }
          }

          const label = el.innerText || el.value || selector;
          window.parent.postMessage({
            type: 'RECORDER_STEP',
            step: {
              type: 'click',
              selector: selector,
              description: 'Click "' + label.trim().substring(0, 25) + '"'
            }
          }, '*');
        });

        // Capture input / typing
        let typeTimeout;
        document.addEventListener('input', (e) => {
          const el = e.target;
          if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;

          clearTimeout(typeTimeout);
          typeTimeout = setTimeout(() => {
            let selector = el.id ? '#' + el.id : 'input';
            window.parent.postMessage({
              type: 'RECORDER_STEP',
              step: {
                type: 'type',
                selector: selector,
                value: el.value,
                description: 'Type "' + el.value + '"'
              }
            }, '*');
          }, 500);
        });
      })();
    </script>
    `;

    // Rewrite relative assets (styles, links) to keep target styling working inside iframe
    const parsedUrl = new URL(targetUrl);
    const origin = parsedUrl.origin;

    // A simple regex path rewriter
    html = html.replace(/(href|src)="\/([^"]+)/g, `$1="${origin}/$2`);

    // Append script
    html = html.replace('</body>', `${proxyScript}</body>`);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err: any) {
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proxy Error</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-900 text-slate-100 p-8 font-sans">
        <div class="max-w-md mx-auto bg-slate-800 p-6 rounded-lg border border-rose-500/30">
          <h2 class="text-rose-500 font-bold text-lg">⚠️ External Proxy Connection Failed</h2>
          <p class="text-slate-300 text-sm mt-3">Could not fetch target page <strong>${targetUrl}</strong>.</p>
          <p class="text-slate-400 text-xs mt-2 leading-relaxed">This is common due to modern website security shields (Cloudflare, CAPTCHAs, or CORS). <strong>To enjoy the full recorder and AI scraping workflow with 100% success rate, click one of our interactive demo sites listed below!</strong></p>
          <div class="mt-6 flex flex-col space-y-2">
            <span class="text-xs text-slate-400 uppercase font-semibold tracking-wider">Flawless Local Sandbox Targets:</span>
            <button onclick="window.parent.postMessage({type: 'LOAD_SANDBOX_URL', url: '/demo/booking'}, '*')" class="text-left px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 rounded text-sm font-medium transition">🏨 Booking.com Stays Demo</button>
            <button onclick="window.parent.postMessage({type: 'LOAD_SANDBOX_URL', url: '/demo/techjobs'}, '*')" class="text-left px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded text-sm font-medium transition">💻 TechJobs Board Demo</button>
            <button onclick="window.parent.postMessage({type: 'LOAD_SANDBOX_URL', url: '/demo/ecommerce'}, '*')" class="text-left px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded text-sm font-medium transition">🛒 ItemShop Store Demo</button>
            <button onclick="window.parent.postMessage({type: 'LOAD_SANDBOX_URL', url: '/demo/news'}, '*')" class="text-left px-4 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 rounded text-sm font-medium transition">📰 DailyNews Technology Feed</button>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

// Serve Demo Sites Router
app.use('/demo', demoRouter);

// ---------------- VITE MIDDLEWARE SETUP ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
