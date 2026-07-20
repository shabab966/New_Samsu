/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';

const demoRouter = Router();

// Injected recorder script
const INJECTED_SCRIPT = `
<script>
  (function() {
    console.log("Interactive Recorder Extension Script Activated in Sandbox Viewport");
    
    // Post navigation event on load
    window.addEventListener('load', () => {
      window.parent.postMessage({
        type: 'RECORDER_STEP',
        step: {
          type: 'navigate',
          url: window.location.pathname,
          description: 'Navigate to ' + window.location.pathname
        }
      }, '*');
    });

    // Capture clicks
    document.addEventListener('click', (e) => {
      const el = e.target.closest('button, a, .article-card-featured');
      if (!el) return;

      let selector = '';
      if (el.id) {
        selector = '#' + el.id;
      } else if (el.classList.contains('btn-filter-remote')) {
        selector = '.btn-filter-remote';
      } else if (el.classList.contains('btn-filter-all')) {
        selector = '.btn-filter-all';
      } else if (el.id === 'search-btn' || el.classList.contains('search-btn')) {
        selector = '#search-btn';
      } else if (el.classList.contains('article-card-featured')) {
        selector = '.article-card-featured';
      } else {
        selector = el.tagName.toLowerCase();
        if (el.className) {
          const firstClass = el.className.split(' ')[0];
          if (firstClass) selector += '.' + firstClass;
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

    // Capture input/typing (debounced or on change)
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

const COMMON_CSS = `
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Inter', sans-serif; }
</style>
`;

// 1. TechJobs Board Demo
demoRouter.get('/techjobs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>TechJobs Board</title>
      ${COMMON_CSS}
    </head>
    <body class="bg-slate-50 text-slate-800 p-6">
      <div class="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="bg-indigo-600 p-6 text-white">
          <h1 class="text-2xl font-bold">TechJobs Hub</h1>
          <p class="text-indigo-100 text-sm mt-1">Live listings for elite developers</p>
        </div>
        
        <div class="p-6">
          <div class="flex space-x-2 mb-6">
            <button id="btn-all" class="btn-filter-all px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700">All Positions</button>
            <button id="btn-remote" class="btn-filter-remote px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 transition hover:bg-slate-200">Remote Only</button>
          </div>

          <div id="jobs-container" class="space-y-4">
            <div class="job-item p-4 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-start" data-remote="true">
              <div>
                <h3 class="font-bold text-slate-900">Senior Full Stack Engineer</h3>
                <p class="text-sm text-slate-500">CloudScale Inc • Remote, USA</p>
                <div class="flex space-x-1 mt-2">
                  <span class="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-[10px] font-medium">React</span>
                  <span class="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-[10px] font-medium">Node.js</span>
                  <span class="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-[10px] font-medium">TypeScript</span>
                </div>
              </div>
              <div class="text-right">
                <span class="text-sm font-semibold text-indigo-600">$140k - $180k</span>
                <span class="block text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded mt-1">Remote</span>
              </div>
            </div>

            <div class="job-item p-4 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-start" data-remote="true">
              <div>
                <h3 class="font-bold text-slate-900">AI Integration Specialist</h3>
                <p class="text-sm text-slate-500">NeuralMind Solutions • SF (Hybrid)</p>
                <div class="flex space-x-1 mt-2">
                  <span class="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-[10px] font-medium">Gemini API</span>
                  <span class="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-[10px] font-medium">LLMs</span>
                  <span class="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-[10px] font-medium">Python</span>
                </div>
              </div>
              <div class="text-right">
                <span class="text-sm font-semibold text-indigo-600">$150k - $200k</span>
                <span class="block text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded mt-1">Remote</span>
              </div>
            </div>

            <div class="job-item p-4 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-start" data-remote="false">
              <div>
                <h3 class="font-bold text-slate-900">Junior Frontend Developer</h3>
                <p class="text-sm text-slate-500">DevSprint Studio • Austin, TX</p>
                <div class="flex space-x-1 mt-2">
                  <span class="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-[10px] font-medium">React</span>
                  <span class="px-2 py-0.5 bg-slate-200/60 text-slate-700 rounded text-[10px] font-medium">Tailwind CSS</span>
                </div>
              </div>
              <div class="text-right">
                <span class="text-sm font-semibold text-indigo-600">$80k - $105k</span>
                <span class="block text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded mt-1">On-Site</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script>
        const btnAll = document.getElementById('btn-all');
        const btnRemote = document.getElementById('btn-remote');
        const jobItems = document.querySelectorAll('.job-item');

        btnRemote.addEventListener('click', () => {
          btnRemote.classList.add('bg-indigo-600', 'text-white');
          btnRemote.classList.remove('bg-slate-100', 'text-slate-600');
          btnAll.classList.remove('bg-indigo-600', 'text-white');
          btnAll.classList.add('bg-slate-100', 'text-slate-600');

          jobItems.forEach(item => {
            if (item.getAttribute('data-remote') === 'false') {
              item.style.display = 'none';
            }
          });
        });

        btnAll.addEventListener('click', () => {
          btnAll.classList.add('bg-indigo-600', 'text-white');
          btnAll.classList.remove('bg-slate-100', 'text-slate-600');
          btnRemote.classList.remove('bg-indigo-600', 'text-white');
          btnRemote.classList.add('bg-slate-100', 'text-slate-600');

          jobItems.forEach(item => {
            item.style.display = 'flex';
          });
        });
      </script>
      ${INJECTED_SCRIPT}
    </body>
    </html>
  `);
});

// 2. ItemShop Store Demo
demoRouter.get('/ecommerce', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>ItemShop Store</title>
      ${COMMON_CSS}
    </head>
    <body class="bg-slate-900 text-slate-100 p-6">
      <div class="max-w-xl mx-auto bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
        <div class="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">ItemShop</h1>
            <p class="text-emerald-100 text-xs mt-0.5">Epic premium gear marketplace</p>
          </div>
          <span class="text-xs bg-emerald-500/50 border border-emerald-400 px-2 py-1 rounded font-semibold text-emerald-100">CART: 0</span>
        </div>
        
        <div class="p-6">
          <div class="flex space-x-2 mb-6">
            <input type="text" id="search-box" placeholder="What are you looking for?" class="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500">
            <button id="search-btn" class="search-btn px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold transition hover:bg-emerald-700">Search</button>
          </div>

          <div id="products-container" class="grid grid-cols-2 gap-4">
            <div class="product-item p-4 rounded-lg bg-slate-700/50 border border-slate-700 flex flex-col justify-between" data-category="general">
              <div>
                <span class="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Monitor</span>
                <h3 class="font-bold text-white mt-1 text-sm leading-tight">UltraWide 4K Gaming Monitor</h3>
                <p class="text-xs text-slate-400 mt-1">4.7 ★ (52 reviews)</p>
              </div>
              <div class="flex justify-between items-center mt-4">
                <span class="text-base font-bold text-emerald-400">$449.00</span>
                <button class="px-2 py-1 bg-slate-600 hover:bg-emerald-600 rounded text-[10px] font-semibold">Buy</button>
              </div>
            </div>

            <div class="product-item p-4 rounded-lg bg-slate-700/50 border border-slate-700 flex flex-col justify-between" data-category="general">
              <div>
                <span class="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Keyboard</span>
                <h3 class="font-bold text-white mt-1 text-sm leading-tight">Mechanical RGB Keyboard</h3>
                <p class="text-xs text-slate-400 mt-1">4.6 ★ (123 reviews)</p>
              </div>
              <div class="flex justify-between items-center mt-4">
                <span class="text-base font-bold text-emerald-400">$89.00</span>
                <button class="px-2 py-1 bg-slate-600 hover:bg-emerald-600 rounded text-[10px] font-semibold">Buy</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script>
        const searchBox = document.getElementById('search-box');
        const searchBtn = document.getElementById('search-btn');
        const productsContainer = document.getElementById('products-container');

        const headphoneProducts = \`
          <div class="product-item p-4 rounded-lg bg-slate-700/50 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <span class="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Audio</span>
              <h3 class="font-bold text-white mt-1 text-sm leading-tight">AeroSound Pro Wireless Headphones</h3>
              <p class="text-xs text-slate-400 mt-1">4.8 ★ (342 reviews)</p>
            </div>
            <div class="flex justify-between items-center mt-4">
              <span class="text-base font-bold text-emerald-400">$189.99</span>
              <span class="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded font-semibold border border-green-500/20">In Stock</span>
            </div>
          </div>

          <div class="product-item p-4 rounded-lg bg-slate-700/50 border border-slate-700 flex flex-col justify-between">
            <div>
              <span class="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Audio</span>
              <h3 class="font-bold text-white mt-1 text-sm leading-tight">BassBeat Noise Cancelling Over-Ears</h3>
              <p class="text-xs text-slate-400 mt-1">4.5 ★ (198 reviews)</p>
            </div>
            <div class="flex justify-between items-center mt-4">
              <span class="text-base font-bold text-emerald-400">$124.50</span>
              <span class="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded font-semibold border border-green-500/20">In Stock</span>
            </div>
          </div>

          <div class="product-item p-4 rounded-lg bg-slate-700/50 border border-slate-700 opacity-60 flex flex-col justify-between">
            <div>
              <span class="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Audio</span>
              <h3 class="font-bold text-white mt-1 text-sm leading-tight">EchoBuds Sport In-Ear Wireless</h3>
              <p class="text-xs text-slate-400 mt-1">4.1 ★ (88 reviews)</p>
            </div>
            <div class="flex justify-between items-center mt-4">
              <span class="text-base font-bold text-slate-400">$79.99</span>
              <span class="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-semibold border border-rose-500/20">Sold Out</span>
            </div>
          </div>
        \`;

        searchBtn.addEventListener('click', () => {
          const query = searchBox.value.trim().toLowerCase();
          if (query.includes('headphone') || query.includes('audio') || query.includes('sound')) {
            productsContainer.innerHTML = headphoneProducts;
          } else {
            productsContainer.innerHTML = \`<div class="col-span-2 text-center text-slate-400 py-8">No items matching "\${searchBox.value}" found. Try searching "headphones"!</div>\`;
          }
        });
      </script>
      ${INJECTED_SCRIPT}
    </body>
    </html>
  `);
});

// 3. DailyNews Tech Feed Demo
demoRouter.get('/news', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>DailyNews Technology</title>
      ${COMMON_CSS}
    </head>
    <body class="bg-slate-50 text-slate-900 p-6">
      <div class="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="border-b border-slate-200 p-6 flex justify-between items-baseline">
          <h1 class="text-2xl font-black text-slate-950 uppercase tracking-tight">DailyNews <span class="text-red-600">Tech</span></h1>
          <span class="text-xs font-semibold text-slate-500">July 20, 2026</span>
        </div>
        
        <div class="p-6">
          <div class="article-card-featured p-6 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-slate-950 transition duration-300">
            <span class="text-red-500 font-bold uppercase tracking-wider text-[10px]">Featured Article</span>
            <h2 class="text-xl font-bold mt-1 text-slate-100 hover:text-white transition">The Future of Web Automation: Eliminating CSS Selectors with Gemini AI</h2>
            <div class="text-slate-400 text-xs mt-2">Sarah Jenkins • 5 min read</div>
            <p class="text-slate-300 text-sm mt-3 leading-relaxed">Traditional web scraping relies on brittle CSS selectors that break constantly. By executing user clicks and taking DOM snapshots, AI can extract data visually and textually like a human...</p>
          </div>

          <div class="mt-6 space-y-4">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">More Stories</h3>
            
            <div class="p-4 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition cursor-not-allowed">
              <span class="text-blue-600 font-semibold uppercase tracking-wider text-[9px]">Cloud Computing</span>
              <h4 class="font-bold text-slate-900 mt-0.5 text-sm">Quantum Computing Enters the Cloud: What Developers Need to Know</h4>
              <div class="text-slate-400 text-[10px] mt-1">Dr. Robert Chen • July 18, 2026</div>
            </div>

            <div class="p-4 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition cursor-not-allowed">
              <span class="text-indigo-600 font-semibold uppercase tracking-wider text-[9px]">CSS Frameworks</span>
              <h4 class="font-bold text-slate-900 mt-0.5 text-sm">Tailwind CSS v5 Alpha Released: Built-in CSS variables and pure performance</h4>
              <div class="text-slate-400 text-[10px] mt-1">Marc Robinson • July 17, 2026</div>
            </div>
          </div>
        </div>
      </div>

      <script>
        const featured = document.querySelector('.article-card-featured');
        featured.addEventListener('click', () => {
          window.location.href = '/demo/news/article-future-automation';
        });
      </script>
      ${INJECTED_SCRIPT}
    </body>
    </html>
  `);
});

// Featured Article View
demoRouter.get('/news/article-future-automation', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>The Future of Web Automation - DailyNews</title>
      ${COMMON_CSS}
    </head>
    <body class="bg-slate-50 text-slate-900 p-6">
      <div class="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="border-b border-slate-200 p-4 bg-slate-50 flex items-center">
          <a href="/demo/news" class="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1">
            <span>← Back to Tech</span>
          </a>
        </div>
        
        <div class="p-6">
          <div class="mb-6">
            <span class="text-red-600 font-semibold text-xs tracking-wider uppercase">Automation</span>
            <h1 class="text-2xl font-extrabold text-slate-950 mt-1 leading-tight">The Future of Web Automation: Eliminating CSS Selectors with Gemini AI</h1>
            <div class="flex items-center text-slate-500 text-xs mt-3 space-x-2">
              <span class="font-medium text-slate-800">Sarah Jenkins</span>
              <span>•</span>
              <span>Tech Analyst</span>
              <span>•</span>
              <span>July 20, 2026</span>
            </div>
          </div>

          <div class="prose prose-slate max-w-none text-sm text-slate-700 space-y-4 leading-relaxed">
            <p>Traditional web scraping is fundamentally broken. Anyone who has written a scraping script knows the pain of CSS selector updates. A developer changes a class name from <code>.job-title</code> to <code>.job-listing__heading</code>, and the scraper crashes instantly.</p>
            <p><strong>The Solution: AI-Powered Semantic Scraping.</strong> By replaying manual clicks in a headless browser and parsing the final HTML DOM layout with Large Language Models like Google's Gemini, we bypass brittle CSS scrapers. The AI understands the context of the page just like a human reader does, extracting perfect structured JSON dynamically.</p>
            <p><strong>Why This Matters:</strong> Anyone can now build robust APIs in under 60 seconds with simple clicks. The marketplace enables non-technical operators to build custom dashboards, trigger schedules, and feed real-time intelligence into their tools.</p>
          </div>
        </div>
      </div>
      ${INJECTED_SCRIPT}
    </body>
    </html>
  `);
});

// 4. Booking.com Accommodation Sandbox Demo
demoRouter.get('/booking', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Booking.com - Hotel Search Sandbox</title>
      ${COMMON_CSS}
    </head>
    <body class="bg-slate-100 text-slate-800 p-6">
      <div class="max-w-xl mx-auto">
        <!-- Logo Header -->
        <div class="bg-blue-900 p-4 rounded-t-xl text-white flex justify-between items-center shadow-md">
          <div class="flex items-center space-x-2">
            <span class="text-xl font-extrabold tracking-tight">Booking<span class="text-blue-400">.com</span></span>
            <span class="text-[9px] bg-amber-400 text-blue-950 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">SANDBOX</span>
          </div>
          <span class="text-xs text-blue-200">USD • English (US)</span>
        </div>

        <div class="bg-white border-x border-b border-slate-200 rounded-b-xl p-6 shadow-sm">
          <!-- Search Block -->
          <div class="bg-amber-400 p-4 rounded-lg shadow-sm border border-amber-300 mb-6">
            <h2 class="text-sm font-bold text-blue-900 mb-3">Find your next stay</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div class="md:col-span-7">
                <div class="relative">
                  <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🏨</span>
                  <input 
                    type="text" 
                    id="search-box" 
                    placeholder="Where are you going? (e.g. New York, London, Tokyo)" 
                    class="w-full bg-white border border-slate-300 rounded pl-8 pr-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-blue-600 font-medium"
                  >
                </div>
              </div>
              
              <div class="md:col-span-3">
                <select id="guests-select" class="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 text-sm focus:outline-none font-medium">
                  <option value="1">1 adult</option>
                  <option value="2" selected>2 adults</option>
                  <option value="3">3 adults</option>
                </select>
              </div>

              <div class="md:col-span-2">
                <button 
                  id="search-btn" 
                  class="search-btn w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-sm transition text-center shadow-sm"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          <!-- Hot Deals Title -->
          <div class="flex justify-between items-baseline mb-4 border-b border-slate-100 pb-2">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Accommodations & Rates</h3>
            <span class="text-[10px] text-blue-600 font-semibold" id="hotel-counter">5 properties found</span>
          </div>

          <!-- Hotel Card Container -->
          <div id="hotels-container" class="space-y-4">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>

      <script>
        const searchBox = document.getElementById('search-box');
        const searchBtn = document.getElementById('search-btn');
        const hotelsContainer = document.getElementById('hotels-container');
        const hotelCounter = document.getElementById('hotel-counter');

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

        function renderHotels(query) {
          const cleanQuery = query.trim().toLowerCase();
          const filtered = allHotels.filter(h => !cleanQuery || h.city.includes(cleanQuery) || h.name.toLowerCase().includes(cleanQuery));
          
          hotelCounter.innerText = filtered.length + ' properties found';

          if (filtered.length === 0) {
            hotelsContainer.innerHTML = \`
              <div class="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p class="text-slate-400 text-sm font-medium">No stays match "\${query}"</p>
                <p class="text-slate-400 text-xs mt-1">Try typing "New York", "London", or "Tokyo" for full listings.</p>
              </div>
            \`;
            return;
          }

          hotelsContainer.innerHTML = filtered.map(h => \`
            <div class="hotel-card p-4 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row gap-4 hover:border-blue-500/30 transition shadow-sm animate-fade-in">
              <div class="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center text-3xl shrink-0">
                \${h.image}
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-start gap-2">
                  <div>
                    <h3 class="font-bold text-slate-900 text-sm leading-tight hover:text-blue-600 cursor-pointer">\${h.name}</h3>
                    <p class="text-[11px] text-slate-500 mt-1 capitalize">📍 \${h.city} • 1.2 miles from downtown</p>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="flex items-center justify-end space-x-1.5">
                      <span class="text-[10px] text-slate-600 font-semibold">\${h.ratingText}</span>
                      <span class="text-xs bg-blue-800 text-white font-bold px-1.5 py-0.5 rounded font-mono">\${h.rating}</span>
                    </div>
                  </div>
                </div>
                <p class="text-[11px] text-emerald-700 font-bold mt-2">\${h.details}</p>
                <div class="flex justify-between items-baseline mt-4 border-t border-slate-100 pt-2.5">
                  <span class="text-[10px] text-slate-400 font-medium">\${h.reviews} reviews</span>
                  <div class="text-right">
                    <span class="text-[9px] text-slate-500 block">1 night, 2 adults</span>
                    <span class="text-base font-extrabold text-blue-900">\${h.price}</span>
                  </div>
                </div>
              </div>
            </div>
          \`).join('');
        }

        searchBtn.addEventListener('click', () => {
          const query = searchBox.value;
          renderHotels(query);
        });

        // Trigger on typing enter too
        searchBox.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            renderHotels(searchBox.value);
          }
        });

        // Initial render
        renderHotels('');
      </script>
      ${INJECTED_SCRIPT}
    </body>
    </html>
  `);
});

export default demoRouter;
