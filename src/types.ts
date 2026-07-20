/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Step {
  id: string;
  type: 'navigate' | 'click' | 'type' | 'wait' | 'extract';
  url?: string;
  selector?: string;
  value?: string;
  duration?: number; // for wait step (ms)
  description?: string;
}

export interface VersionLog {
  version: number;
  updatedAt: string;
  steps: Step[];
  extractionPrompt: string;
  changeSummary?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  startUrl: string;
  steps: Step[];
  extractionPrompt: string;
  createdAt: string;
  createdBy: string; // user ID or 'system'
  isPublic: boolean;
  schedule?: string; // cron expression or 'none'
  lastRunStatus?: 'success' | 'failed' | 'never';
  lastRunTime?: string;
  version?: number;
  versionHistory?: VersionLog[];
}

export interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  runTime: string;
  status: 'success' | 'failed';
  stepsExecuted: number;
  totalSteps: number;
  extractedData?: any;
  logs: string[]; // terminal-like steps
  trigger: 'manual' | 'schedule';
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}
