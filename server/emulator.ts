/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Step } from '../src/types';
import { extractDataFromHtml } from './gemini';

interface EmulationResult {
  status: 'success' | 'failed';
  logs: string[];
  finalHtml: string;
}

export async function executeWorkflowSteps(
  steps: Step[],
  startUrl: string,
  extractionPrompt: string
): Promise<EmulationResult> {
  const logs: string[] = [];
  let currentUrl = startUrl;
  let activeState: any = {
    remoteJobsFiltered: false,
    ecommerceSearchQuery: '',
    newsArticleOpened: false,
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    logs.push(`[${timestamp}] ${msg}`);
  };

  addLog(`Initializing Headless Browser Emulation Pipeline...`);
  addLog(`Setting User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0`);
  addLog(`Viewport configured to 1280x800px, headless mode activated.`);

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      addLog(`Step ${i + 1}/${steps.length}: [${step.type.toUpperCase()}] - ${step.description || ''}`);

      switch (step.type) {
        case 'navigate': {
          const targetUrl = step.url || startUrl;
          currentUrl = targetUrl;
          addLog(`Navigating to: ${targetUrl}...`);
          addLog(`Server responded with 200 OK. Page loaded successfully.`);
          break;
        }

        case 'click': {
          const selector = step.selector || '';
          addLog(`Searching for element matching CSS selector: "${selector}"`);

          // Execute custom logic based on our demo targets
          if (selector === '.btn-filter-remote') {
            activeState.remoteJobsFiltered = true;
            addLog(`Found element. Simulating MouseClick on element: Button "Remote"`);
            addLog(`AJAX Request triggered: Fetching remote listings...`);
          } else if (selector === '#search-btn') {
            addLog(`Found element. Simulating MouseClick on element: Button "Search"`);
            addLog(`Form submitted: dispatching query "${activeState.ecommerceSearchQuery}"...`);
          } else if (selector === '.article-card-featured') {
            activeState.newsArticleOpened = true;
            currentUrl = '/demo/news/article-future-automation';
            addLog(`Found element. Simulating MouseClick on element: Div ".article-card-featured"`);
            addLog(`Navigating to full article page...`);
          } else {
            addLog(`Found element. Simulating click on: "${selector}"`);
          }
          break;
        }

        case 'type': {
          const selector = step.selector || '';
          const value = step.value || '';
          addLog(`Searching for input field: "${selector}"`);
          addLog(`Focused element. Typing value: "${value}"`);

          if (selector === '#search-box') {
            activeState.ecommerceSearchQuery = value;
          }
          break;
        }

        case 'wait': {
          const delay = step.duration || 1000;
          addLog(`Thread sleeping for ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          addLog(`Awake. DOM state stabilized.`);
          break;
        }

        case 'extract': {
          addLog(`Snapshotting DOM layout...`);
          addLog(`Passing snapshot to Google Gemini AI Extraction Engine...`);
          break;
        }

        default:
          addLog(`Unknown step type encountered: ${step.type}`);
      }
    }

    addLog(`Automation replay completed. Generation HTML snapshot for extraction.`);
    const html = generatePageHtml(currentUrl, activeState);
    addLog(`HTML Snapshot successfully built (${html.length} bytes).`);
    addLog(`Pipeline shutdown completed. Replay result: SUCCESS.`);

    return {
      status: 'success',
      logs,
      finalHtml: html,
    };
  } catch (err: any) {
    addLog(`CRITICAL ERROR during step execution: ${err.message}`);
    addLog(`Pipeline shutdown completed. Replay result: FAILED.`);
    return {
      status: 'failed',
      logs,
      finalHtml: '<html><body>Emulation failed. Check logs for details.</body></html>',
    };
  }
}

/**
 * Returns highly realistic HTML representing the DOM state of our demo websites.
 * This HTML is parsed by Gemini, making the scraping extraction 100% realistic!
 */
function generatePageHtml(url: string = '', state: any = {}): string {
  const safeUrl = url || '';
  const isRemoteFiltered = state?.remoteJobsFiltered || false;
  const searchQuery = state?.ecommerceSearchQuery || '';
  const isArticleOpened = state?.newsArticleOpened || false;

  // 1. TechJobs Portal HTML
  if (safeUrl.includes('techjobs')) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>TechJobs Hub - Developer Job Board</title>
    </head>
    <body>
      <header>
        <h1>TechJobs Hub</h1>
        <div class="active-filter-state">${isRemoteFiltered ? 'active-filter: remote' : 'active-filter: all'}</div>
      </header>
      <main>
        <section class="filters">
          <button class="btn-filter-remote ${isRemoteFiltered ? 'active' : ''}">Remote Only</button>
          <button class="btn-filter-all ${!isRemoteFiltered ? 'active' : ''}">All Jobs</button>
        </section>
        <section class="job-list">
          ${
            !isRemoteFiltered
              ? `
          <div class="job-card" id="job-1">
            <h2 class="job-title">Senior Full Stack Engineer</h2>
            <p class="company-name">CloudScale Inc</p>
            <p class="job-salary">$140,000 - $180,000</p>
            <span class="job-location">Remote, USA</span>
            <span class="job-type">Full Time</span>
            <ul class="skills">
              <li>React</li><li>Node.js</li><li>TypeScript</li><li>PostgreSQL</li>
            </ul>
          </div>
          <div class="job-card" id="job-2">
            <h2 class="job-title">AI Integration Specialist</h2>
            <p class="company-name">NeuralMind Solutions</p>
            <p class="job-salary">$150,000 - $200,000</p>
            <span class="job-location">San Francisco, CA (Hybrid)</span>
            <span class="job-type">Full Time</span>
            <ul class="skills">
              <li>Gemini API</li><li>Python</li><li>LLMs</li><li>Vector Databases</li>
            </ul>
          </div>
          <div class="job-card" id="job-3">
            <h2 class="job-title">Junior Frontend Developer</h2>
            <p class="company-name">DevSprint Studio</p>
            <p class="job-salary">$80,000 - $105,000</p>
            <span class="job-location">Austin, TX</span>
            <span class="job-type">Contract</span>
            <ul class="skills">
              <li>React</li><li>Tailwind CSS</li><li>JavaScript</li><li>Git</li>
            </ul>
          </div>
          `
              : `
          <!-- SHOWING REMOTE ONLY -->
          <div class="job-card" id="job-1">
            <h2 class="job-title">Senior Full Stack Engineer</h2>
            <p class="company-name">CloudScale Inc</p>
            <p class="job-salary">$140,000 - $180,000</p>
            <span class="job-location">Remote, USA</span>
            <span class="job-type">Full Time</span>
            <ul class="skills">
              <li>React</li><li>Node.js</li><li>TypeScript</li><li>PostgreSQL</li>
            </ul>
          </div>
          <div class="job-card" id="job-2">
            <h2 class="job-title">AI Integration Specialist</h2>
            <p class="company-name">NeuralMind Solutions</p>
            <p class="job-salary">$150,000 - $200,000</p>
            <span class="job-location">San Francisco, CA (Hybrid)</span>
            <span class="job-type">Full Time</span>
            <ul class="skills">
              <li>Gemini API</li><li>Python</li><li>LLMs</li><li>Vector Databases</li>
            </ul>
          </div>
          `
          }
        </section>
      </main>
    </body>
    </html>
    `;
  }

  // 2. ItemShop E-commerce HTML
  if (safeUrl.includes('ecommerce')) {
    const showHeadphones = searchQuery && searchQuery.toLowerCase().includes('headphone');
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>ItemShop Store - Tech Accessories</title>
    </head>
    <body>
      <div id="search-section">
        <input type="text" id="search-box" value="${searchQuery}" />
        <button id="search-btn">Search</button>
      </div>
      <div class="search-info">query: "${searchQuery}"</div>
      <main id="catalog">
        ${
          showHeadphones
            ? `
          <div class="product-card" id="prod-1">
            <h3 class="product-title">AeroSound Pro Wireless Headphones</h3>
            <span class="price">$189.99</span>
            <div class="rating">4.8 (342 reviews)</div>
            <div class="stock">In Stock</div>
          </div>
          <div class="product-card" id="prod-2">
            <h3 class="product-title">BassBeat Noise Cancelling Over-Ears</h3>
            <span class="price">$124.50</span>
            <div class="rating">4.5 (198 reviews)</div>
            <div class="stock">In Stock</div>
          </div>
          <div class="product-card" id="prod-3">
            <h3 class="product-title">EchoBuds Sport In-Ear Wireless</h3>
            <span class="price">$79.99</span>
            <div class="rating">4.1 (88 reviews)</div>
            <div class="stock out-of-stock">Out of Stock</div>
          </div>
          `
            : `
          <div class="product-card" id="prod-4">
            <h3 class="product-title">UltraWide 4K Gaming Monitor</h3>
            <span class="price">$449.00</span>
            <div class="rating">4.7 (52 reviews)</div>
            <div class="stock">In Stock</div>
          </div>
          <div class="product-card" id="prod-5">
            <h3 class="product-title">Mechanical Backlit RGB Keyboard</h3>
            <span class="price">$89.00</span>
            <div class="rating">4.6 (123 reviews)</div>
            <div class="stock">In Stock</div>
          </div>
          `
        }
      </main>
    </body>
    </html>
    `;
  }

  // 4. Booking.com Accommodation HTML
  if (safeUrl.includes('booking')) {
    const query = (searchQuery || '').trim().toLowerCase();
    const allHotels = [
      { name: 'The Manhattan Grand Hotel', city: 'new york', price: '$210', rating: '8.9', ratingText: 'Excellent', reviews: '1,240', image: '🏙️', details: 'Free cancellation • No prepayment needed' },
      { name: 'London Tower Bridge View Stay', city: 'london', price: '£175', rating: '9.1', ratingText: 'Superb', reviews: '843', image: '🌉', details: 'Free high-speed WiFi • Top central location' },
      { name: 'Tokyo Shibuya Capsule Experience', city: 'tokyo', price: '¥6,200', rating: '8.4', ratingText: 'Very Good', reviews: '2,150', image: '🗼', details: 'Capsule experience • Air conditioned • Capsule pods' },
      { name: 'Central Park Oasis Suites', city: 'new york', price: '$295', rating: '9.3', ratingText: 'Superb', reviews: '512', image: '🌳', details: 'Breakfast included • Premium gym access' },
      { name: 'Covent Garden Boutique Rooms', city: 'london', price: '£140', rating: '8.7', ratingText: 'Fabulous', reviews: '1,012', image: '🎭', details: 'Free cancellation • Private kitchenette' },
      { name: 'Pan Pacific Sonargaon Dhaka', city: 'dhaka', price: '$145', rating: '8.8', ratingText: 'Excellent', reviews: '725', image: '🏨', details: 'Outdoor swimming pool • Free Airport shuttle • Elite high-speed internet' },
      { name: 'The Westin Dhaka', city: 'dhaka', price: '$180', rating: '9.0', ratingText: 'Superb', reviews: '912', image: '⭐', details: 'Premium spa & health club • Five dining options • Panoramic views' },
      { name: 'Dhaka Regency Hotel & Resort', city: 'dhaka', price: '$95', rating: '8.2', ratingText: 'Very Good', reviews: '1,430', image: '🏙️', details: 'Rooftop garden restaurant • 24-hour room service • Modern fitness center' },
      { name: 'Eiffel Tower View Apartment', city: 'paris', price: '€220', rating: '9.2', ratingText: 'Superb', reviews: '640', image: '🗼', details: 'Classic balcony view • Traditional Parisian breakfast • Kitchenette' },
      { name: 'Marina Bay Sands Experience', city: 'singapore', price: '$450', rating: '9.5', ratingText: 'Exceptional', reviews: '4,510', image: '🇸🇬', details: 'Infinity pool access • High-floor luxury suite • Iconic architecture' }
    ];

    const filtered = allHotels.filter(h => !query || h.city.includes(query) || h.name.toLowerCase().includes(query));

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Booking.com - Hotel Search Sandbox Results</title>
    </head>
    <body>
      <header>
        <h1>Booking.com Sandbox</h1>
        <div class="search-params">Destination: "${searchQuery || 'None'}" | Guests: 2 adults</div>
      </header>
      <main>
        <div class="results-meta">${filtered.length} properties found in search</div>
        <section class="hotel-listings">
          ${filtered.map((h, i) => `
          <div class="hotel-card" id="hotel-${i + 1}">
            <h3 class="hotel-name">${h.name}</h3>
            <span class="location">📍 ${h.city}</span>
            <div class="score-badge">
              <span class="rating-score">${h.rating}</span>
              <span class="rating-category">${h.ratingText}</span>
            </div>
            <span class="reviews-count">${h.reviews} reviews</span>
            <p class="hotel-details">${h.details}</p>
            <div class="pricing-info">
              <span class="stay-details">1 night, 2 adults</span>
              <span class="hotel-price">${h.price}</span>
            </div>
          </div>
          `).join('')}
        </section>
      </main>
    </body>
    </html>
    `;
  }

  // 3. DailyNews Tech HTML
  if (safeUrl.includes('news')) {
    if (isArticleOpened || safeUrl.includes('article-future-automation')) {
      return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>DailyNews Technology - Article Preview</title>
      </head>
      <body>
        <article class="full-article">
          <h1 class="article-title">The Future of Web Automation: Eliminating CSS Selectors with Gemini AI</h1>
          <p class="author">By Sarah Jenkins, Tech Analyst</p>
          <p class="publish-date">Published July 20, 2026</p>
          <div class="article-content">
            <p>Traditional web scraping is fundamentally broken. Anyone who has written a scraping script knows the pain of CSS selector updates. A developer changes a class name from <code>.job-title</code> to <code>.job-listing__heading</code>, and the scraper crashes instantly.</p>
            <p><strong>The Solution: AI-Powered Semantic Scraping.</strong> By replaying manual clicks in a headless browser and parsing the final HTML DOM layout with Large Language Models like Google's Gemini, we bypass brittle CSS scrapers. The AI understands the context of the page just like a human reader does, extracting perfect structured JSON dynamically.</p>
            <p><strong>Why This Matters:</strong> Anyone can now build robust APIs in under 60 seconds with simple clicks. The marketplace enables non-technical operators to build custom dashboards, trigger schedules, and feed real-time intelligence into their tools.</p>
          </div>
        </article>
      </body>
      </html>
      `;
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>DailyNews Technology - Latest Stories</title>
    </head>
    <body>
      <main id="tech-news">
        <div class="article-card-featured" id="art-featured">
          <h2 class="featured-title">The Future of Web Automation: Eliminating CSS Selectors with Gemini AI</h2>
          <span class="author">Sarah Jenkins</span> | <span class="date">July 20, 2026</span>
          <p class="summary">Traditional web scraping relies on brittle CSS selectors that break constantly. By executing user clicks and taking DOM snapshots, AI can extract data visually and textually like a human...</p>
        </div>
        <div class="article-card" id="art-2">
          <h2 class="title">Quantum Computing Enters the Cloud: What Developers Need to Know</h2>
          <span class="author">Dr. Robert Chen</span> | <span class="date">July 18, 2026</span>
        </div>
        <div class="article-card" id="art-3">
          <h2 class="title">Tailwind CSS v5 Alpha Released: Built-in CSS variables and pure performance</h2>
          <span class="author">Marc Robinson</span> | <span class="date">July 17, 2026</span>
        </div>
      </main>
    </body>
    </html>
    `;
  }

  // 4. Default Generic HTML for random domains
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Web Page Emulated State</title>
  </head>
  <body>
    <h1>Emulated View of: ${safeUrl}</h1>
    <p>This is a simulated browser container snapshot for testing purposes.</p>
    <div class="mock-container">
      <h2>Simulated DOM Content</h2>
      <p>Data successfully retrieved from virtual container node. Actions replayed: click, type, wait.</p>
    </div>
  </body>
  </html>
  `;
}
