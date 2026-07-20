/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { Workflow, ExecutionLog, User } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'database.json');

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> hashed_password
  workflows: Workflow[];
  history: ExecutionLog[];
}

const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'system-techjobs-api',
    name: 'TechJobs Portal Extractor',
    description: 'Automates job board scraping, navigating to active listings and using Gemini AI to extract structured job details, salaries, and remote eligibility.',
    startUrl: '/demo/techjobs',
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    extractionPrompt: 'Extract all active job listings. For each listing, extract: jobTitle, companyName, salaryRange, location, remoteEligible (boolean), and a list of keySkillsRequired.',
    steps: [
      { id: 'step-1', type: 'navigate', url: '/demo/techjobs', description: 'Navigate to TechJobs home page' },
      { id: 'step-2', type: 'click', selector: '.btn-filter-remote', description: 'Click Filter for "Remote" jobs' },
      { id: 'step-3', type: 'wait', duration: 1000, description: 'Wait for list to update' },
      { id: 'step-4', type: 'extract', description: 'Extract the loaded list using Gemini AI' }
    ],
    schedule: 'none',
    lastRunStatus: 'success',
    lastRunTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    version: 1,
    versionHistory: [
      {
        version: 1,
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        steps: [
          { id: 'step-1', type: 'navigate', url: '/demo/techjobs', description: 'Navigate to TechJobs home page' },
          { id: 'step-2', type: 'click', selector: '.btn-filter-remote', description: 'Click Filter for "Remote" jobs' },
          { id: 'step-3', type: 'wait', duration: 1000, description: 'Wait for list to update' },
          { id: 'step-4', type: 'extract', description: 'Extract the loaded list using Gemini AI' }
        ],
        extractionPrompt: 'Extract all active job listings. For each listing, extract: jobTitle, companyName, salaryRange, location, remoteEligible (boolean), and a list of keySkillsRequired.',
        changeSummary: 'Initial built-in release'
      }
    ]
  },
  {
    id: 'system-ecommerce-api',
    name: 'ItemShop Price Tracker',
    description: 'Automates e-commerce browsing: searches for "headphones", filters by high rating, and extracts product titles, prices, and review summaries.',
    startUrl: '/demo/ecommerce',
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    extractionPrompt: 'List all items matching the search. For each item, extract: productName, price, rating, reviewsCount (integer), and availabilityStatus (boolean).',
    steps: [
      { id: 'step-5', type: 'navigate', url: '/demo/ecommerce', description: 'Navigate to ItemShop store' },
      { id: 'step-6', type: 'type', selector: '#search-box', value: 'headphones', description: 'Search for "headphones"' },
      { id: 'step-7', type: 'click', selector: '#search-btn', description: 'Click Search button' },
      { id: 'step-8', type: 'wait', duration: 1500, description: 'Wait for search results' },
      { id: 'step-9', type: 'extract', description: 'Extract the search results data' }
    ],
    schedule: 'none',
    lastRunStatus: 'success',
    lastRunTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    version: 1,
    versionHistory: [
      {
        version: 1,
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        steps: [
          { id: 'step-5', type: 'navigate', url: '/demo/ecommerce', description: 'Navigate to ItemShop store' },
          { id: 'step-6', type: 'type', selector: '#search-box', value: 'headphones', description: 'Search for "headphones"' },
          { id: 'step-7', type: 'click', selector: '#search-btn', description: 'Click Search button' },
          { id: 'step-8', type: 'wait', duration: 1500, description: 'Wait for search results' },
          { id: 'step-9', type: 'extract', description: 'Extract the search results data' }
        ],
        extractionPrompt: 'List all items matching the search. For each item, extract: productName, price, rating, reviewsCount (integer), and availabilityStatus (boolean).',
        changeSummary: 'Initial built-in release'
      }
    ]
  },
  {
    id: 'system-news-api',
    name: 'DailyNews Summary Feed',
    description: 'Monitors the local DailyNews tech section, clicks the top featured article, and extracts its title, author, publish date, and key takeaway bullet points.',
    startUrl: '/demo/news',
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    extractionPrompt: 'Extract details of the featured article: articleTitle, authorName, publishedTime, and bulletPointsSummary (array of key takeaways).',
    steps: [
      { id: 'step-10', type: 'navigate', url: '/demo/news', description: 'Navigate to DailyNews Technology' },
      { id: 'step-11', type: 'click', selector: '.article-card-featured', description: 'Click the top featured article' },
      { id: 'step-12', type: 'wait', duration: 1000, description: 'Wait for page load' },
      { id: 'step-13', type: 'extract', description: 'Extract and summarize article contents' }
    ],
    schedule: 'none',
    lastRunStatus: 'never',
    lastRunTime: undefined,
    version: 1,
    versionHistory: [
      {
        version: 1,
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        steps: [
          { id: 'step-10', type: 'navigate', url: '/demo/news', description: 'Navigate to DailyNews Technology' },
          { id: 'step-11', type: 'click', selector: '.article-card-featured', description: 'Click the top featured article' },
          { id: 'step-12', type: 'wait', duration: 1000, description: 'Wait for page load' },
          { id: 'step-13', type: 'extract', description: 'Extract and summarize article contents' }
        ],
        extractionPrompt: 'Extract details of the featured article: articleTitle, authorName, publishedTime, and bulletPointsSummary (array of key takeaways).',
        changeSummary: 'Initial built-in release'
      }
    ]
  },
  {
    id: 'system-booking-api',
    name: 'Booking.com Stays Tracker',
    description: 'Automates hotel listings extraction: inputs search destination "New York", executes hotel lookup, and extracts property details, ratings, prices, and amenities.',
    startUrl: '/demo/booking',
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    extractionPrompt: 'Extract all hotel search results. For each hotel, extract: propertyName, cityLocation, pricePerNight, ratingScore (number), ratingText, and keyAmenities (e.g. Free cancellation).',
    steps: [
      { id: 'step-14', type: 'navigate', url: '/demo/booking', description: 'Navigate to Booking.com Sandbox' },
      { id: 'step-15', type: 'type', selector: '#search-box', value: 'New York', description: 'Search destination "New York"' },
      { id: 'step-16', type: 'click', selector: '#search-btn', description: 'Click Search button' },
      { id: 'step-17', type: 'wait', duration: 1200, description: 'Wait for hotel listings to render' },
      { id: 'step-18', type: 'extract', description: 'Extract the loaded hotels list using Gemini' }
    ],
    schedule: 'none',
    lastRunStatus: 'success',
    lastRunTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    version: 1,
    versionHistory: [
      {
        version: 1,
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        steps: [
          { id: 'step-14', type: 'navigate', url: '/demo/booking', description: 'Navigate to Booking.com Sandbox' },
          { id: 'step-15', type: 'type', selector: '#search-box', value: 'New York', description: 'Search destination "New York"' },
          { id: 'step-16', type: 'click', selector: '#search-btn', description: 'Click Search button' },
          { id: 'step-17', type: 'wait', duration: 1200, description: 'Wait for hotel listings to render' },
          { id: 'step-18', type: 'extract', description: 'Extract the loaded hotels list using Gemini' }
        ],
        extractionPrompt: 'Extract all hotel search results. For each hotel, extract: propertyName, cityLocation, pricePerNight, ratingScore (number), ratingText, and keyAmenities (e.g. Free cancellation).',
        changeSummary: 'Initial built-in release'
      }
    ]
  }
];

function readDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        users: [],
        passwords: {},
        workflows: DEFAULT_WORKFLOWS,
        history: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading database file, resetting to default', error);
    return {
      users: [],
      passwords: {},
      workflows: DEFAULT_WORKFLOWS,
      history: []
    };
  }
}

function writeDB(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database file', error);
  }
}

export const db = {
  getUsers(): User[] {
    return readDB().users;
  },

  getPassword(userId: string): string | undefined {
    return readDB().passwords[userId];
  },

  addUser(user: User, passwordHash: string): void {
    const data = readDB();
    data.users.push(user);
    data.passwords[user.id] = passwordHash;
    writeDB(data);
  },

  getWorkflows(): Workflow[] {
    return readDB().workflows;
  },

  getWorkflowById(id: string): Workflow | undefined {
    return readDB().workflows.find(w => w.id === id);
  },

  addWorkflow(workflow: Workflow): void {
    const data = readDB();
    data.workflows.push(workflow);
    writeDB(data);
  },

  updateWorkflow(workflow: Workflow): void {
    const data = readDB();
    const index = data.workflows.findIndex(w => w.id === workflow.id);
    if (index !== -1) {
      data.workflows[index] = workflow;
      writeDB(data);
    }
  },

  deleteWorkflow(id: string): void {
    const data = readDB();
    data.workflows = data.workflows.filter(w => w.id !== id);
    data.history = data.history.filter(h => h.workflowId !== id);
    writeDB(data);
  },

  getHistory(): ExecutionLog[] {
    return readDB().history;
  },

  getHistoryByWorkflow(workflowId: string): ExecutionLog[] {
    return readDB().history.filter(h => h.workflowId === workflowId);
  },

  addHistory(log: ExecutionLog): void {
    const data = readDB();
    data.history.unshift(log); // newest first
    writeDB(data);
  }
};
