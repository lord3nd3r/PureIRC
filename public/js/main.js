/**
 * PureIRC Website - Main Application
 * Simplified single-file approach (no ES modules)
 */

const API_BASE = '/api';
const STATS_REFRESH_INTERVAL = 30000; // 30 seconds
const CHANNELS_REFRESH_INTERVAL = 45000; // 45 seconds

// Cache for API data
let cachedChannels = [];
let cachedStats = {};

/**
 * Initialize the entire application
 */
function initApp() {
  console.log('[App] Initializing', window.SITE_CONFIG?.siteName || 'PureIRC', 'website');

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => startApp());
  } else {
    startApp();
  }
}

/**
 * Start the app
 */
async function startApp() {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Setup UI FIRST (so buttons work immediately)
  setupHeaderScrollEffect();
  setupMobileMenu();
  setupConnectTabs();
  setupFaqAccordion();
  setupNavHighlight();
  setupFooterYear();
  setupIrcModal();
  setupThemeDropdown();

  // Apply config from server
  await applyServerConfig().catch(e => console.warn('[Config]', e.message));

  // Load data in background (don't block UI)
  loadChannels().catch(e => console.warn('[Channels]', e.message));
  loadStats().catch(e => console.warn('[Stats]', e.message));
  setupChannelQuickPicks();

  // Start auto-refresh intervals
  setInterval(() => loadChannels().catch(() => {}), CHANNELS_REFRESH_INTERVAL);
  setInterval(() => loadStats().catch(() => {}), STATS_REFRESH_INTERVAL);

  console.log('[App] Initialization complete');
}

/**
 * Fetch config from server and apply to page
 */
async function applyServerConfig() {
  const response = await fetch(`${API_BASE}/config`);
  if (!response.ok) return;
  const cfg = await response.json();

  // Store config for other modules to access
  window._serverConfig = cfg;

  // Apply tagline to hero heading
  const taglineEl = document.getElementById('hero-tagline');
  if (taglineEl && cfg.site?.tagline) {
    const lines = cfg.site.tagline.split('\n');
    if (lines.length >= 2) {
      taglineEl.innerHTML = `${lines[0]}<br><span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">${lines[1]}</span>`;
    } else {
      taglineEl.textContent = cfg.site.tagline;
    }
  }

  // Initialize theme switcher
  console.log('[Config] Loaded config, themes:', !!cfg.themes, 'showSwitcher:', cfg.ui?.showThemeSwitcher, 'themeManager:', !!window.themeManager);
  if (cfg.ui?.showThemeSwitcher && cfg.themes && window.themeManager) {
    await window.themeManager.init({ get: (key, def) => {
      const keys = key.split('.');
      let val = cfg;
      for (const k of keys) { val = val?.[k]; }
      return val ?? def;
    }});
    buildThemeSwitcher(cfg.themes);
  }
}

/**
 * Build theme switcher dots in the header
 */
function buildThemeSwitcher(themes) {
  const container = document.getElementById('theme-switcher');
  if (!container) return;

  container.innerHTML = '';
  for (const [id, theme] of Object.entries(themes)) {
    const dot = document.createElement('button');
    dot.className = 'w-5 h-5 rounded-full border-2 border-transparent hover:scale-125 transition-all cursor-pointer';
    dot.style.backgroundColor = theme.primary;
    dot.style.minWidth = '20px';
    dot.style.minHeight = '20px';
    dot.title = theme.name;
    if (window.themeManager.getTheme() === id) {
      dot.classList.remove('border-transparent');
      dot.classList.add('border-white', 'scale-110');
    }
    dot.addEventListener('click', () => {
      window.themeManager.setTheme(id);
      // Update active dot styling
      container.querySelectorAll('button').forEach(b => {
        b.classList.remove('border-white', 'scale-110');
        b.classList.add('border-transparent');
      });
      dot.classList.remove('border-transparent');
      dot.classList.add('border-white', 'scale-110');
    });
    container.appendChild(dot);
  }
}

/**
 * Fetch channels from API and render
 */
async function loadChannels() {
  try {
    const response = await fetch(`${API_BASE}/channels`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    cachedChannels = json.data || json;
    renderChannels();
  } catch (error) {
    console.warn('[Channels] Failed to load:', error.message);
    // Fall back to default channels
    renderChannelsStatic();
  }
}

/**
 * Fetch server stats from API and render
 */
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    cachedStats = json.data || json;
    renderStats();
  } catch (error) {
    console.warn('[Stats] Failed to load:', error.message);
  }
}

/**
 * Categorize a channel by name
 */
function categorizeChannel(name) {
  const n = name.toLowerCase();
  if (['#help'].includes(n)) return 'Support';
  if (['#irpg', '#gaming', '#games'].includes(n)) return 'Gaming';
  if (['#ascii', '#buzznet', '#eulenspiegal', '#godzilla'].includes(n)) return 'Entertainment';
  return 'General';
}

/**
 * Render channels grid
 */
function renderChannels() {
  const grid = document.getElementById('channels-grid');
  if (!grid) return;

  const categoryColors = {
    General: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    Support: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Technology: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Gaming: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    Entertainment: 'text-pink-400 bg-pink-500/10 border-pink-500/20'
  };

  grid.innerHTML = '';

  // Get featured channel names from config
  const cfg = window._serverConfig || window.configManager?.config;
  const featuredNames = (cfg?.ui?.channelsDisplay?.featuredChannels || []).map(n => n.toLowerCase());

  const allChannels = cachedChannels.length > 0 ? cachedChannels : getDefaultChannels();

  // Sort: featured first, then by user count descending
  const sorted = [...allChannels].sort((a, b) => {
    const aFeat = featuredNames.includes(a.name.toLowerCase()) ? 1 : 0;
    const bFeat = featuredNames.includes(b.name.toLowerCase()) ? 1 : 0;
    if (aFeat !== bFeat) return bFeat - aFeat;
    return (b.users || 0) - (a.users || 0);
  });

  const channels = sorted.slice(0, 18);

  channels.forEach(ch => {
    const category = ch.category || categorizeChannel(ch.name);
    const colorClass = categoryColors[category] || 'text-gray-400 bg-white/5 border-white/10';
    const isFeatured = featuredNames.includes(ch.name.toLowerCase());
    const html = `
      <div onclick="openIrcModal('${ch.name}')" class="group bg-gray-900 hover:bg-gray-800/80 border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <i data-lucide="hash" class="w-4 h-4 text-cyan-400"></i>
            </div>
            <span class="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">${ch.name}</span>
          </div>
          ${isFeatured ? '<span class="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">Featured</span>' : ''}
        </div>
        <p class="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">${ch.topic}</p>
        <div class="flex items-center justify-between">
          <span class="text-xs px-2.5 py-1 rounded-full border font-medium ${colorClass}">${category}</span>
          <div class="flex items-center gap-1.5 text-xs text-gray-500">
            <i data-lucide="users" class="w-3.5 h-3.5"></i>
            ${typeof ch.users === 'number' ? ch.users.toLocaleString() : ch.users}
          </div>
        </div>
      </div>
    `;
    grid.innerHTML += html;
  });

  // Re-init Lucide icons for new elements
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Render static channels if API fails
 */
function renderChannelsStatic() {
  renderChannels(); // Uses default channels
}

/**
 * Render server stats
 */
function renderStats() {
  const usersOnlineEl = document.querySelector('[data-stat="users"]');
  const channelsEl = document.querySelector('[data-stat="channels"]');

  if (usersOnlineEl && cachedStats.usersOnline !== undefined) {
    usersOnlineEl.textContent = cachedStats.usersOnline.toLocaleString();
  }
  if (channelsEl && cachedStats.totalChannels !== undefined) {
    channelsEl.textContent = cachedStats.totalChannels.toLocaleString();
  }
}

/**
 * Get default channels for fallback
 */
function getDefaultChannels() {
  const sn = window.SITE_CONFIG?.siteName || 'PureIRC';
  const dc = window.SITE_CONFIG?.defaultChannel || '#help';
  return [
    { name: dc, topic: 'Welcome to ' + sn + ' - Main channel', users: 57, category: 'General', pinned: true },
    { name: '#chat', topic: 'Everyone is welcome here', users: 20, category: 'General', pinned: true },
    { name: '#help', topic: 'Welcome to #help @ ' + sn + ' -- Please state what you need help with.', users: 12, category: 'Support', pinned: true },
  ];
}

/**
 * Setup header scroll effect
 */
function setupHeaderScrollEffect() {
  const header = document.getElementById('site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.remove('bg-transparent');
      header.classList.add('bg-gray-950/95', 'backdrop-blur', 'shadow-lg', 'shadow-black/30');
    } else {
      header.classList.add('bg-transparent');
      header.classList.remove('bg-gray-950/95', 'backdrop-blur', 'shadow-lg', 'shadow-black/30');
    }
  });
}

/**
 * Setup mobile menu
 */
function setupMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  const openIcon = document.getElementById('menu-icon-open');
  const closeIcon = document.getElementById('menu-icon-close');

  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    openIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
  });

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      openIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
    });
  });
}

/**
 * Setup connect tabs
 */
function setupConnectTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // Update buttons
      tabBtns.forEach(b => {
        b.classList.remove('bg-gray-800', 'border', 'border-white/10', 'shadow-md');
        b.classList.add('hover:bg-white/5');
        b.querySelector('.tab-icon').classList.remove('bg-cyan-500/15', 'border-cyan-500/25');
        b.querySelector('.tab-icon').classList.add('bg-white/5');
        b.querySelector('.tab-icon i').classList.remove('text-cyan-400');
        b.querySelector('.tab-icon i').classList.add('text-gray-500');
        b.querySelector('.tab-label').classList.remove('text-white');
        b.querySelector('.tab-label').classList.add('text-gray-400');
      });

      btn.classList.add('bg-gray-800', 'border', 'border-white/10', 'shadow-md');
      btn.classList.remove('hover:bg-white/5');
      btn.querySelector('.tab-icon').classList.add('bg-cyan-500/15', 'border-cyan-500/25');
      btn.querySelector('.tab-icon').classList.remove('bg-white/5');
      btn.querySelector('.tab-icon i').classList.add('text-cyan-400');
      btn.querySelector('.tab-icon i').classList.remove('text-gray-500');
      btn.querySelector('.tab-label').classList.add('text-white');
      btn.querySelector('.tab-label').classList.remove('text-gray-400');

      // Update panels
      tabPanels.forEach(p => p.classList.add('hidden'));
      document.getElementById('panel-' + tab).classList.remove('hidden');
    });
  });
}

/**
 * Setup FAQ accordion
 */
function setupFaqAccordion() {
  const container = document.getElementById('faq-container');
  if (!container) return;

  const sn = window.SITE_CONFIG?.siteName || 'PureIRC';
  const ih = window.SITE_CONFIG?.ircHost || 'irc.pureirc.com';
  const ps = window.SITE_CONFIG?.ircPortSSL || '6697';
  const faqs = [
    { q: 'Do I need to register to use ' + sn + '?', a: 'No registration is required to connect and chat. You can optionally register your nickname using NickServ to reserve it: /msg NickServ REGISTER yourpassword youremail@example.com' },
    { q: 'How do I register my nickname?', a: 'Once connected, type: /msg NickServ REGISTER <password> <email>. You\'ll receive a verification code via email. Follow the instructions in the email to complete registration.' },
    { q: 'Can I run a bot on ' + sn + '?', a: 'Bots are allowed with prior approval. Connect to #help or message an IRCop to request bot access. Provide a brief description of your bot\'s purpose.' },
    { q: 'How do I create my own channel?', a: 'Simply join a channel that doesn\'t exist yet: /join #mychannel. You\'ll automatically become channel operator. Register it with ChanServ to keep ownership: /msg ChanServ REGISTER #mychannel' },
    { q: 'Is SSL/TLS supported?', a: 'Yes. Connect to ' + ih + ' on port ' + ps + ' and enable SSL/TLS in your client settings for an encrypted connection.' },
    { q: 'How do I report abuse or harassment?', a: 'Join #help or use /oper to reach a network operator. You can also use /msg <IRCop> to contact staff directly. Provide logs and any relevant context.' }
  ];

  container.innerHTML = '';
  faqs.forEach((faq, i) => {
    container.innerHTML += `
      <div class="faq-item border-b border-white/5 last:border-0">
        <button onclick="toggleFaq(this)" class="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-white transition-colors group">
          <span class="faq-q text-sm font-medium text-gray-300 group-hover:text-white transition-colors">${faq.q}</span>
          <i data-lucide="chevron-down" class="faq-icon-down w-4 h-4 text-gray-500 flex-shrink-0"></i>
          <i data-lucide="chevron-up" class="faq-icon-up w-4 h-4 text-cyan-400 flex-shrink-0 hidden"></i>
        </button>
        <p class="faq-answer text-sm text-gray-400 leading-relaxed pb-5 hidden">${faq.a}</p>
      </div>
    `;
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Toggle FAQ item
 */
function toggleFaq(btn) {
  const item = btn.parentElement;
  const answer = item.querySelector('.faq-answer');
  const iconDown = item.querySelector('.faq-icon-down');
  const iconUp = item.querySelector('.faq-icon-up');
  const qText = item.querySelector('.faq-q');
  const isOpen = !answer.classList.contains('hidden');

  if (isOpen) {
    answer.classList.add('hidden');
    iconDown.classList.remove('hidden');
    iconUp.classList.add('hidden');
    qText.classList.remove('text-white');
    qText.classList.add('text-gray-300');
  } else {
    answer.classList.remove('hidden');
    iconDown.classList.add('hidden');
    iconUp.classList.remove('hidden');
    qText.classList.add('text-white');
    qText.classList.remove('text-gray-300');
  }
}

/**
 * Copy to clipboard
 */
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const icon = btn.querySelector('i');
    icon.setAttribute('data-lucide', 'check');
    icon.classList.add('text-cyan-400');
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [icon] });
    }
    setTimeout(() => {
      icon.setAttribute('data-lucide', 'copy');
      icon.classList.remove('text-cyan-400');
      if (window.lucide) {
        window.lucide.createIcons({ nodes: [icon] });
      }
    }, 2000);
  });
}

/**
 * Setup footer year
 */
function setupFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) {
    el.textContent = new Date().getFullYear();
  }
}

/**
 * Setup channel quick picks
 */
function setupChannelQuickPicks() {
  const quickPicks = document.getElementById('channel-quick-picks');
  if (!quickPicks) return;

  quickPicks.innerHTML = '';

  // Use featured channels from config if available
  const cfg = window._serverConfig || window.configManager?.config;
  const featuredChannels = cfg?.ui?.channelsDisplay?.featuredChannels || [];

  if (featuredChannels.length > 0) {
    featuredChannels.forEach(name => {
      quickPicks.innerHTML += `
        <button type="button" onclick="pickChannel('${name}')" class="channel-pill text-xs px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-white font-mono">${name}</button>
      `;
    });
  } else {
    const allChannels = cachedChannels.length > 0 ? cachedChannels : getDefaultChannels();
    const channels = allChannels.slice(0, 18);

    channels.forEach(ch => {
      quickPicks.innerHTML += `
        <button type="button" onclick="pickChannel('${ch.name}')" class="channel-pill text-xs px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-white font-mono">${ch.name}</button>
      `;
    });
  }
}

/**
 * Pick a channel
 */
function pickChannel(name) {
  const input = document.getElementById('irc-channel-input');
  if (input) {
    input.value = name;
  }
  document.querySelectorAll('#channel-quick-picks .channel-pill').forEach(p => {
    p.classList.toggle('active', p.textContent.trim() === name);
  });
}

/**
 * Setup theme dropdown menu
 */
function setupThemeDropdown() {
  const btn = document.getElementById('theme-menu-btn');
  const dropdown = document.getElementById('theme-dropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });

  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Initialize themeManager with config from API
  applyServerConfig().then(() => {}).catch(() => {});
}

/**
 * Select a theme from dropdown
 */
function selectTheme(name) {
  if (window.themeManager) {
    window.themeManager.setTheme(name);
  }
  const dropdown = document.getElementById('theme-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
}

/**
 * Setup IRC Modal
 */
function setupIrcModal() {
  const modal = document.getElementById('irc-modal');
  const nicknameInput = document.getElementById('irc-nickname');
  const channelInput = document.getElementById('irc-channel-input');
  const sslCheckbox = document.getElementById('irc-ssl');
  const portDisplay = document.getElementById('irc-port-display');

  if (!modal) return;

  // Update port display on SSL toggle
  if (sslCheckbox) {
    sslCheckbox.addEventListener('change', function() {
      if (portDisplay) {
        portDisplay.textContent = this.checked ? '6697 (SSL)' : '6667';
      }
    });
  }

  // Enter key handlers
  if (nicknameInput) {
    nicknameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') connectIrc();
    });
  }
  if (channelInput) {
    channelInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') connectIrc();
    });
  }

  // Escape key to close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeIrcModal();
    }
  });

  // Click backdrop to close
  modal.addEventListener('click', e => {
    if (e.target === modal) closeIrcModal();
  });
}

/**
 * Setup navigation highlight
 */
function setupNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('text-white');
            link.classList.remove('text-gray-400');
          } else if (!link.classList.contains('bg-cyan-500')) {
            link.classList.remove('text-white');
            link.classList.add('text-gray-400');
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => observer.observe(s));
}

/**
 * IRC Modal Functions
 */

let currentIrcChannel = '*status';  // Start on status window
let ircConnected = false;
let ws = null;
let ircNickname = '';
let channelUsers = {};
let ircMaximized = false;

// Per-channel message buffers: { normalizedName: [htmlStrings] }
let channelBuffers = {};
// Ordered list of open tabs (including '*status')
let openTabs = ['*status'];
// Unread indicators per tab
let tabUnread = {};

const MAX_BUFFER_LINES = 500;

// IRC channels are case-insensitive, normalize for lookups
function normChan(ch) { return (ch || '').toLowerCase(); }

// Look up a user's highest mode prefix (@, +, etc.) in a channel
function getUserPrefix(nick, channel) {
  const users = channelUsers[normChan(channel)] || [];
  const user = users.find(u => u.nick === nick);
  if (!user || !user.modes || user.modes.length === 0) return '';
  if (user.modes.includes('q')) return '~';
  if (user.modes.includes('a')) return '&';
  if (user.modes.includes('o')) return '@';
  if (user.modes.includes('h')) return '%';
  if (user.modes.includes('v')) return '+';
  return '';
}

function getBuffer(ch) {
  const key = normChan(ch);
  if (!channelBuffers[key]) channelBuffers[key] = [];
  return channelBuffers[key];
}

function appendToBuffer(ch, html) {
  const buf = getBuffer(ch);
  buf.push(html);
  while (buf.length > MAX_BUFFER_LINES) buf.shift();

  const key = normChan(ch);
  // If this is the active tab, render it
  if (key === normChan(currentIrcChannel)) {
    const container = document.getElementById('irc-messages');
    if (!container) return;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
    container.insertAdjacentHTML('beforeend', html);
    if (atBottom) container.scrollTop = container.scrollHeight;
    while (container.children.length > MAX_BUFFER_LINES) container.removeChild(container.firstChild);
  } else {
    // Mark tab as unread
    tabUnread[key] = true;
    renderTabs();
  }
}

function appendMessage(html) {
  // Append to current channel's buffer and render
  appendToBuffer(currentIrcChannel, html);
}

function appendStatusMessage(html) {
  appendToBuffer('*status', html);
}

function showBuffer(ch) {
  const container = document.getElementById('irc-messages');
  if (!container) return;
  const buf = getBuffer(ch);
  container.innerHTML = buf.join('');
  container.scrollTop = container.scrollHeight;
}

function openIrcModal(channel) {
  channel = channel || (window.SITE_CONFIG?.defaultChannel || '#help');
  if (!channel.startsWith('#')) channel = '#' + channel;
  currentIrcChannel = channel;

  const input = document.getElementById('irc-channel-input');
  if (input) input.value = channel;

  document.querySelectorAll('#channel-quick-picks .channel-pill').forEach(p => {
    p.classList.toggle('active', p.textContent.trim() === channel);
  });

  const modal = document.getElementById('irc-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  if (ircConnected) {
    switchIrcChannel(channel);
  } else {
    const form = document.getElementById('irc-connect-form');
    const container = document.getElementById('irc-chat-container');
    if (form) form.classList.remove('hidden');
    if (container) container.classList.add('hidden');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeIrcModal() {
  const modal = document.getElementById('irc-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function toggleIrcMaximize() {
  const modal = document.getElementById('irc-modal');
  const content = document.getElementById('irc-modal-content');
  if (!modal || !content) return;
  ircMaximized = !ircMaximized;
  modal.classList.toggle('maximized', ircMaximized);
  content.classList.toggle('maximized', ircMaximized);
  if (window.lucide) window.lucide.createIcons();
}

function openIrcInNewTab() {
  window.open('/chat', '_blank');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Nick color hash
const nickColors = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399',
  '#22d3ee', '#60a5fa', '#a78bfa', '#e879f9', '#fb7185',
];
function nickColor(nick) {
  let hash = 0;
  for (let i = 0; i < nick.length; i++) hash = ((hash << 5) - hash + nick.charCodeAt(i)) | 0;
  return nickColors[Math.abs(hash) % nickColors.length];
}

// ========== TABS ==========

function renderTabs() {
  const bar = document.getElementById('irc-tab-bar');
  if (!bar) return;
  bar.innerHTML = '';

  openTabs.forEach(tab => {
    const key = normChan(tab);
    const isActive = key === normChan(currentIrcChannel);
    const isStatus = tab === '*status';
    const hasUnread = tabUnread[key] && !isActive;
    const displayName = isStatus ? 'Status' : tab;

    let html = `<div class="irc-tab${isActive ? ' active' : ''}" onclick="switchTab('${escapeHtml(tab)}')" title="${escapeHtml(tab)}">`;
    if (hasUnread) html += `<span class="tab-unread"></span>`;
    html += `<span>${escapeHtml(displayName)}</span>`;
    if (!isStatus) {
      html += `<span class="tab-close" onclick="event.stopPropagation(); closeTab('${escapeHtml(tab)}')" title="Close">&times;</span>`;
    }
    html += `</div>`;
    bar.insertAdjacentHTML('beforeend', html);
  });
}

function ensureTab(ch) {
  const key = normChan(ch);
  if (!openTabs.find(t => normChan(t) === key)) {
    openTabs.push(ch);
    renderTabs();
  }
}

function switchTab(tab) {
  const key = normChan(tab);
  tabUnread[key] = false;
  currentIrcChannel = tab;

  const display = document.getElementById('irc-channel-display');
  if (display) display.textContent = tab === '*status' ? 'Status' : tab;

  showBuffer(tab);
  renderTabs();
  renderUserList();

  // Focus input
  const input = document.getElementById('irc-input');
  if (input) input.focus();
}

function closeTab(tab) {
  const key = normChan(tab);
  if (tab === '*status') return;

  // Part the channel if connected
  if (ws && ircConnected && tab.startsWith('#')) {
    ws.send(JSON.stringify({ type: 'part', channel: tab }));
  }

  openTabs = openTabs.filter(t => normChan(t) !== key);
  delete channelBuffers[key];
  delete channelUsers[key];
  delete tabUnread[key];

  // If we closed the active tab, switch to the last tab
  if (normChan(currentIrcChannel) === key) {
    const newTab = openTabs[openTabs.length - 1] || '*status';
    switchTab(newTab);
  } else {
    renderTabs();
  }
}

// ========== CONNECTION ==========

function connectIrc() {
  let nickname = document.getElementById('irc-nickname').value.trim();
  let channel = document.getElementById('irc-channel-input').value.trim() || (window.SITE_CONFIG?.defaultChannel || '#help');
  if (!channel.startsWith('#')) channel = '#' + channel;
  const useSSL = document.getElementById('irc-ssl')?.checked || false;
  const nsPassword = document.getElementById('irc-password')?.value.trim() || '';

  if (!nickname) {
    nickname = (window.SITE_CONFIG?.userPrefix || 'User') + Math.floor(Math.random() * 9999);
    document.getElementById('irc-nickname').value = nickname;
  }

  if (!/^[a-zA-Z_\[\]\\`^{}|][a-zA-Z0-9_\[\]\\`^{}|\-]{0,15}$/.test(nickname)) {
    nickname = (window.SITE_CONFIG?.userPrefix || 'User') + Math.floor(Math.random() * 9999);
    document.getElementById('irc-nickname').value = nickname;
  }

  currentIrcChannel = '*status';
  ircNickname = nickname;
  channelUsers = {};
  channelBuffers = {};
  openTabs = ['*status'];
  tabUnread = {};

  // Store the initial channel to join after connect
  window._ircInitialChannel = channel;

  // Show connecting state
  const connectBtn = document.querySelector('#irc-connect-form button[onclick="connectIrc()"]');
  if (connectBtn) {
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<span class="animate-pulse">Connecting...</span>';
  }
  const errorDiv = document.getElementById('irc-connect-error');
  if (errorDiv) errorDiv.classList.add('hidden');

  // Open WebSocket
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}/ws/irc`);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'connect',
      nickname: nickname,
      ssl: useSSL,
      nsPassword: nsPassword || undefined,
    }));
  };

  ws.onmessage = (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch { return; }
    handleIrcMessage(data);
  };

  ws.onerror = () => {
    appendStatusMessage('<div class="msg-line msg-system">⚠ WebSocket error</div>');
  };

  ws.onclose = () => {
    if (ircConnected) {
      ircConnected = false;
      appendStatusMessage('<div class="msg-line msg-system">— Disconnected from server —</div>');
      updateConnectionStatus(false);
    } else {
      const errorDiv = document.getElementById('irc-connect-error');
      if (errorDiv) {
        errorDiv.textContent = 'Connection failed. Try unchecking SSL or try again.';
        errorDiv.classList.remove('hidden');
      }
    }
    if (connectBtn) {
      connectBtn.disabled = false;
      connectBtn.innerHTML = '<i data-lucide="radio" class="w-4 h-4"></i> Connect to ' + (window.SITE_CONFIG?.siteName || 'PureIRC');
      if (window.lucide) window.lucide.createIcons();
    }
    ws = null;
  };
}

// ========== MESSAGE HANDLING ==========

function routeMessage(data) {
  // Determine which buffer a message belongs to
  if (!data.target && !data.channel) return '*status';
  const target = data.channel || data.target || '*status';
  // If the target is our nick, it's a private message (status or query)
  if (target === ircNickname || target === '*') return '*status';
  return target;
}

function handleIrcMessage(data) {
  switch (data.type) {
    case 'connected':
      ircConnected = true;
      ircNickname = data.nickname;
      updateConnectionStatus(true);

      // Switch UI
      const form = document.getElementById('irc-connect-form');
      const container = document.getElementById('irc-chat-container');

      if (form) form.classList.add('hidden');
      if (container) container.classList.remove('hidden');

      const display = document.getElementById('irc-channel-display');
      if (display) display.textContent = 'Status';

      appendStatusMessage(`<div class="msg-line msg-system">— Connected to ${escapeHtml(data.server)} as ${escapeHtml(data.nickname)} —</div>`);
      renderTabs();
      showBuffer('*status');

      // Join the initial channel
      const initCh = window._ircInitialChannel || (window.SITE_CONFIG?.defaultChannel || '#help');
      ws.send(JSON.stringify({ type: 'join', channel: initCh }));
      break;

    case 'message': {
      const dest = routeMessage(data);
      const time = formatTime(data.time);
      const color = nickColor(data.nick);
      const selfClass = data.isSelf ? ' msg-self' : '';
      const prefix = getUserPrefix(data.nick, dest);
      const prefixHtml = prefix ? `<span class="user-prefix">${prefix}</span>` : '';
      let html;
      if (data.isAction) {
        html = `<div class="msg-line msg-action${selfClass}"><span class="text-gray-600">${time}</span> * ${prefixHtml}<span class="msg-nick" style="color:${color}">${escapeHtml(data.nick)}</span> ${escapeHtml(data.message)}</div>`;
      } else {
        html = `<div class="msg-line${selfClass}"><span class="text-gray-600">${time}</span> <span class="msg-nick" style="color:${color}">&lt;${prefixHtml}${escapeHtml(data.nick)}&gt;</span> <span class="text-gray-300">${escapeHtml(data.message)}</span></div>`;
      }
      ensureTab(dest);
      appendToBuffer(dest, html);
      break;
    }

    case 'notice': {
      const time = formatTime(data.time);
      const html = `<div class="msg-line msg-notice"><span class="text-gray-600">${time}</span> -${escapeHtml(data.nick)}- ${escapeHtml(data.message)}</div>`;
      // Route notices: channel notices go to channel, else status
      const dest = (data.target && data.target.startsWith('#')) ? data.target : '*status';
      appendToBuffer(dest, html);
      break;
    }

    case 'join': {
      const ch = data.channel;
      const chKey = normChan(ch);
      ensureTab(ch);

      appendToBuffer(ch, `<div class="msg-line msg-join"><span class="text-gray-600">${formatTime(data.time)}</span> → ${escapeHtml(data.nick)} joined ${escapeHtml(ch)}</div>`);

      if (!channelUsers[chKey]) channelUsers[chKey] = [];
      if (!channelUsers[chKey].find(u => u.nick === data.nick)) {
        channelUsers[chKey].push({ nick: data.nick, modes: [] });
      }

      // If it's us joining, switch to that tab
      if (data.nick === ircNickname) {
        switchTab(ch);
      } else if (chKey === normChan(currentIrcChannel)) {
        renderUserList();
      }
      break;
    }

    case 'part': {
      const ch = data.channel;
      const chKey = normChan(ch);
      appendToBuffer(ch, `<div class="msg-line msg-part"><span class="text-gray-600">${formatTime(data.time)}</span> ← ${escapeHtml(data.nick)} left ${escapeHtml(ch)}${data.message ? ' (' + escapeHtml(data.message) + ')' : ''}</div>`);

      if (channelUsers[chKey]) {
        channelUsers[chKey] = channelUsers[chKey].filter(u => u.nick !== data.nick);
      }
      // If we parted, remove the tab
      if (data.nick === ircNickname) {
        openTabs = openTabs.filter(t => normChan(t) !== chKey);
        delete channelUsers[chKey];
        if (normChan(currentIrcChannel) === chKey) {
          switchTab(openTabs[openTabs.length - 1] || '*status');
        }
        renderTabs();
      } else if (chKey === normChan(currentIrcChannel)) {
        renderUserList();
      }
      break;
    }

    case 'kick': {
      const ch = data.channel;
      const chKey = normChan(ch);
      appendToBuffer(ch, `<div class="msg-line msg-part"><span class="text-gray-600">${formatTime(data.time)}</span> ✖ ${escapeHtml(data.nick)} was kicked by ${escapeHtml(data.by)}${data.reason ? ' (' + escapeHtml(data.reason) + ')' : ''}</div>`);

      if (channelUsers[chKey]) {
        channelUsers[chKey] = channelUsers[chKey].filter(u => u.nick !== data.nick);
      }
      if (data.nick === ircNickname) {
        openTabs = openTabs.filter(t => normChan(t) !== chKey);
        delete channelUsers[chKey];
        if (normChan(currentIrcChannel) === chKey) {
          switchTab(openTabs[openTabs.length - 1] || '*status');
        }
        renderTabs();
      } else if (chKey === normChan(currentIrcChannel)) {
        renderUserList();
      }
      break;
    }

    case 'quit': {
      const html = `<div class="msg-line msg-quit"><span class="text-gray-600">${formatTime(data.time)}</span> ← ${escapeHtml(data.nick)} quit${data.message ? ' (' + escapeHtml(data.message) + ')' : ''}</div>`;
      // Add quit message to all channels this user was in
      for (const ch in channelUsers) {
        if (channelUsers[ch].find(u => u.nick === data.nick)) {
          channelUsers[ch] = channelUsers[ch].filter(u => u.nick !== data.nick);
          appendToBuffer(ch, html);
        }
      }
      if (channelUsers[normChan(currentIrcChannel)]) renderUserList();
      break;
    }

    case 'nick': {
      const html = `<div class="msg-line msg-system"><span class="text-gray-600">${formatTime(data.time)}</span> — ${escapeHtml(data.oldNick)} is now known as ${escapeHtml(data.newNick)}</div>`;
      if (data.oldNick === ircNickname) ircNickname = data.newNick;
      for (const ch in channelUsers) {
        const user = channelUsers[ch].find(u => u.nick === data.oldNick);
        if (user) {
          user.nick = data.newNick;
          appendToBuffer(ch, html);
        }
      }
      renderUserList();
      break;
    }

    case 'topic': {
      const ch = data.channel || '*status';
      appendToBuffer(ch, `<div class="msg-line msg-topic"><span class="text-gray-600">${formatTime(data.time)}</span> ◆ Topic for ${escapeHtml(data.channel)}: ${escapeHtml(data.topic)}</div>`);
      break;
    }

    case 'userlist': {
      const chKey = normChan(data.channel);
      const existing = channelUsers[chKey] || [];
      // Merge: preserve locally-tracked modes from earlier mode events
      // that the NAMES reply might not yet reflect (race condition)
      channelUsers[chKey] = data.users.map(u => {
        const prev = existing.find(e => e.nick === u.nick);
        if (prev && prev.modes.length > 0) {
          const merged = [...new Set([...u.modes, ...prev.modes])];
          return { nick: u.nick, modes: merged };
        }
        return u;
      });
      if (chKey === normChan(currentIrcChannel)) renderUserList();
      break;
    }

    case 'mode': {
      const chKey = normChan(data.channel);
      const users = channelUsers[chKey] || [];
      if (data.modes && Array.isArray(data.modes)) {
        // Build readable mode string like "+ao Nick Nick"
        let adding = null;
        let modeStr = '';
        let params = [];
        for (const m of data.modes) {
          if (m.adding !== adding) {
            adding = m.adding;
            modeStr += adding ? '+' : '-';
          }
          modeStr += m.mode;
          if (m.param) params.push(m.param);
          // Update internal user state
          const user = users.find(u => u.nick === m.param);
          if (!user) continue;
          if (m.adding) {
            if (!user.modes.includes(m.mode)) user.modes.push(m.mode);
          } else {
            user.modes = user.modes.filter(x => x !== m.mode);
          }
        }
        const modeDisplay = modeStr + (params.length ? ' ' + params.join(' ') : '');
        const who = data.nick ? escapeHtml(data.nick) : 'server';
        appendToBuffer(data.channel, `<div class="msg-line msg-system"><span class="text-gray-600">${formatTime(data.time)}</span> ★ ${who} sets mode ${escapeHtml(modeDisplay)}</div>`);
      }
      if (chKey === normChan(currentIrcChannel)) renderUserList();
      break;
    }

    case 'motd':
      if (data.motd) {
        appendStatusMessage(`<div class="msg-line msg-system">— MOTD —</div>`);
        data.motd.split('\n').forEach(line => {
          appendStatusMessage(`<div class="msg-line msg-system">${escapeHtml(line)}</div>`);
        });
      }
      break;

    case 'nick_in_use':
      ircNickname = data.newNick;
      appendStatusMessage(`<div class="msg-line msg-notice">⚠ Nick ${escapeHtml(data.oldNick)} in use, trying ${escapeHtml(data.newNick)}</div>`);
      break;

    case 'irc_error':
      appendStatusMessage(`<div class="msg-line msg-notice">⚠ ${escapeHtml(data.error || 'Error')}: ${escapeHtml(data.reason)}</div>`);
      break;

    case 'whois': {
      const lines = [];
      lines.push(`<span class="text-blue-400">${escapeHtml(data.nick)}</span> (${escapeHtml(data.ident)}@${escapeHtml(data.hostname)})`);
      if (data.real_name) lines.push(`  realname: ${escapeHtml(data.real_name)}`);
      if (data.server) lines.push(`  server  : ${escapeHtml(data.server)}${data.server_info ? ' (' + escapeHtml(data.server_info) + ')' : ''}`);
      if (data.channels) lines.push(`  channels: ${escapeHtml(data.channels)}`);
      if (data.account) lines.push(`  account : ${escapeHtml(data.account)}`);
      if (data.secure) lines.push(`  secure  : using a secure connection`);
      if (data.idle) {
        const idleMins = Math.floor(data.idle / 60);
        const idleSecs = data.idle % 60;
        lines.push(`  idle    : ${idleMins}m ${idleSecs}s`);
      }
      if (data.logon) {
        const logonDate = new Date(data.logon * 1000).toLocaleString();
        lines.push(`  signon  : ${logonDate}`);
      }
      if (data.actual_ip) lines.push(`  ip      : ${escapeHtml(data.actual_ip)}`);
      const html = lines.map(l => `<div class="msg-line msg-notice">${l}</div>`).join('');
      appendToBuffer(currentIrcChannel, html);
      break;
    }

    case 'error':
      appendStatusMessage(`<div class="msg-line msg-notice">⚠ ${escapeHtml(data.message)}</div>`);
      break;

    case 'disconnected':
      ircConnected = false;
      updateConnectionStatus(false);
      appendStatusMessage(`<div class="msg-line msg-system">— ${escapeHtml(data.message)} —</div>`);
      break;
  }
}

// ========== UI RENDERING ==========

function renderUserList() {
  const listEl = document.getElementById('irc-userlist');
  const countEl = document.getElementById('irc-user-count');
  const panel = document.getElementById('irc-userlist-panel');
  if (!listEl) return;

  // Hide user list on status tab
  if (currentIrcChannel === '*status') {
    if (panel) panel.classList.add('hidden');
    return;
  }
  if (panel) panel.classList.remove('hidden');

  const users = channelUsers[normChan(currentIrcChannel)] || [];

  // Rank modes for sorting: q=5, a=4, o=3, h=2, v=1, none=0
  function modeRank(modes) {
    if (modes.includes('q')) return 5;
    if (modes.includes('a')) return 4;
    if (modes.includes('o')) return 3;
    if (modes.includes('h')) return 2;
    if (modes.includes('v')) return 1;
    return 0;
  }
  function modePrefix(modes) {
    if (modes.includes('q')) return '~';
    if (modes.includes('a')) return '&';
    if (modes.includes('o')) return '@';
    if (modes.includes('h')) return '%';
    if (modes.includes('v')) return '+';
    return '';
  }

  users.sort((a, b) => {
    const diff = modeRank(b.modes) - modeRank(a.modes);
    if (diff !== 0) return diff;
    return a.nick.toLowerCase().localeCompare(b.nick.toLowerCase());
  });

  listEl.innerHTML = users.map(u => {
    const prefix = modePrefix(u.modes);
    return `<div class="user-item">${prefix ? '<span class="user-prefix">' + prefix + '</span>' : ''}${escapeHtml(u.nick)}</div>`;
  }).join('');

  if (countEl) countEl.textContent = users.length;
}

function updateConnectionStatus(connected) {
  const indicator = document.getElementById('irc-status-indicator');
  const dot = document.getElementById('irc-status-dot');
  const text = document.getElementById('irc-status-text');
  if (!indicator) return;

  if (connected) {
    indicator.classList.remove('hidden');
    dot.classList.remove('bg-red-400');
    dot.classList.add('bg-emerald-400');
    text.textContent = 'Connected';
  } else {
    dot.classList.remove('bg-emerald-400');
    dot.classList.add('bg-red-400');
    text.textContent = 'Disconnected';
  }
}

// ========== SENDING ==========

function sendIrcMessage() {
  const input = document.getElementById('irc-input');
  if (!input || !ws || !ircConnected) return;

  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  if (text.startsWith('/')) {
    const parts = text.substring(1).split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'join':
      case 'j':
        if (args[0]) {
          let ch = args[0];
          if (!ch.startsWith('#')) ch = '#' + ch;
          ws.send(JSON.stringify({ type: 'join', channel: ch }));
        }
        break;
      case 'part':
      case 'leave':
      case 'p': {
        const ch = args[0] || (currentIrcChannel !== '*status' ? currentIrcChannel : '');
        if (ch) ws.send(JSON.stringify({ type: 'part', channel: ch }));
        break;
      }
      case 'nick':
        if (args[0]) ws.send(JSON.stringify({ type: 'nick', nickname: args[0] }));
        break;
      case 'me':
      case 'action':
        if (currentIrcChannel !== '*status') {
          ws.send(JSON.stringify({ type: 'action', target: currentIrcChannel, text: args.join(' ') }));
        }
        break;
      case 'msg':
      case 'privmsg':
      case 'query':
        if (args.length >= 2) {
          ws.send(JSON.stringify({ type: 'message', target: args[0], text: args.slice(1).join(' ') }));
        }
        break;
      case 'notice':
        if (args.length >= 2) {
          ws.send(JSON.stringify({ type: 'raw', line: 'NOTICE ' + args[0] + ' :' + args.slice(1).join(' ') }));
        }
        break;
      case 'topic':
        if (args.length > 0 && args[0].startsWith('#')) {
          ws.send(JSON.stringify({ type: 'raw', line: 'TOPIC ' + args[0] + (args.length > 1 ? ' :' + args.slice(1).join(' ') : '') }));
        } else if (args.length > 0) {
          ws.send(JSON.stringify({ type: 'raw', line: 'TOPIC ' + (currentIrcChannel !== '*status' ? currentIrcChannel : '') + ' :' + args.join(' ') }));
        } else {
          ws.send(JSON.stringify({ type: 'raw', line: 'TOPIC ' + (currentIrcChannel !== '*status' ? currentIrcChannel : '') }));
        }
        break;

      // === Operator / Channel management ===
      case 'op':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' +o ' + args[0] }));
        break;
      case 'deop':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' -o ' + args[0] }));
        break;
      case 'voice':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' +v ' + args[0] }));
        break;
      case 'devoice':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' -v ' + args[0] }));
        break;
      case 'hop':
      case 'halfop':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' +h ' + args[0] }));
        break;
      case 'dehop':
      case 'dehalfop':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' -h ' + args[0] }));
        break;
      case 'protect':
      case 'admin':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' +a ' + args[0] }));
        break;
      case 'deprotect':
      case 'deadmin':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' -a ' + args[0] }));
        break;
      case 'owner':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' +q ' + args[0] }));
        break;
      case 'deowner':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' -q ' + args[0] }));
        break;
      case 'kick':
      case 'k':
        if (args[0]) {
          const reason = args.length > 1 ? args.slice(1).join(' ') : '';
          ws.send(JSON.stringify({ type: 'raw', line: 'KICK ' + currentIrcChannel + ' ' + args[0] + (reason ? ' :' + reason : '') }));
        }
        break;
      case 'ban':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' +b ' + args[0] }));
        break;
      case 'unban':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' -b ' + args[0] }));
        break;
      case 'kickban':
      case 'kb':
        if (args[0]) {
          const reason = args.length > 1 ? args.slice(1).join(' ') : '';
          ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + currentIrcChannel + ' +b ' + args[0] }));
          ws.send(JSON.stringify({ type: 'raw', line: 'KICK ' + currentIrcChannel + ' ' + args[0] + (reason ? ' :' + reason : '') }));
        }
        break;
      case 'mode':
        if (args.length > 0) {
          const target = args[0].startsWith('#') ? args[0] : currentIrcChannel;
          const modeArgs = args[0].startsWith('#') ? args.slice(1).join(' ') : args.join(' ');
          ws.send(JSON.stringify({ type: 'raw', line: 'MODE ' + target + ' ' + modeArgs }));
        }
        break;
      case 'invite':
        if (args[0]) {
          const ch = args[1] || (currentIrcChannel !== '*status' ? currentIrcChannel : '');
          if (ch) ws.send(JSON.stringify({ type: 'raw', line: 'INVITE ' + args[0] + ' ' + ch }));
        }
        break;

      // === Services shortcuts ===
      case 'ns':
      case 'nickserv':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'PRIVMSG NickServ :' + args.join(' ') }));
        break;
      case 'cs':
      case 'chanserv':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'PRIVMSG ChanServ :' + args.join(' ') }));
        break;
      case 'ms':
      case 'memoserv':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'PRIVMSG MemoServ :' + args.join(' ') }));
        break;
      case 'bs':
      case 'botserv':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'PRIVMSG BotServ :' + args.join(' ') }));
        break;
      case 'hs':
      case 'hostserv':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'PRIVMSG HostServ :' + args.join(' ') }));
        break;
      case 'os':
      case 'operserv':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'PRIVMSG OperServ :' + args.join(' ') }));
        break;
      case 'identify':
      case 'id':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'PRIVMSG NickServ :IDENTIFY ' + args.join(' ') }));
        break;
      case 'ghost':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'PRIVMSG NickServ :GHOST ' + args.join(' ') }));
        break;
      case 'regain':
      case 'recover':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'PRIVMSG NickServ :REGAIN ' + args.join(' ') }));
        break;

      // === Info / queries ===
      case 'whois':
      case 'wi':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'WHOIS ' + args[0] }));
        break;
      case 'whowas':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'WHOWAS ' + args[0] }));
        break;
      case 'who':
        ws.send(JSON.stringify({ type: 'raw', line: 'WHO ' + (args[0] || currentIrcChannel) }));
        break;
      case 'list':
        ws.send(JSON.stringify({ type: 'raw', line: 'LIST' + (args.length > 0 ? ' ' + args.join(' ') : '') }));
        break;
      case 'names':
        ws.send(JSON.stringify({ type: 'raw', line: 'NAMES ' + (args[0] || currentIrcChannel) }));
        break;
      case 'motd':
        ws.send(JSON.stringify({ type: 'raw', line: 'MOTD' + (args[0] ? ' ' + args[0] : '') }));
        break;
      case 'version':
        ws.send(JSON.stringify({ type: 'raw', line: 'VERSION' + (args[0] ? ' ' + args[0] : '') }));
        break;
      case 'time':
        ws.send(JSON.stringify({ type: 'raw', line: 'TIME' + (args[0] ? ' ' + args[0] : '') }));
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'raw', line: 'PING ' + (args[0] || ':webchat') }));
        break;
      case 'ctcp':
        if (args.length >= 2) {
          ws.send(JSON.stringify({ type: 'raw', line: 'PRIVMSG ' + args[0] + ' :\x01' + args.slice(1).join(' ').toUpperCase() + '\x01' }));
        }
        break;

      // === Connection ===
      case 'quit':
      case 'disconnect':
        ws.send(JSON.stringify({ type: 'raw', line: 'QUIT :' + (args.join(' ') || 'Leaving') }));
        break;
      case 'away':
        ws.send(JSON.stringify({ type: 'raw', line: 'AWAY' + (args.length > 0 ? ' :' + args.join(' ') : '') }));
        break;
      case 'back':
        ws.send(JSON.stringify({ type: 'raw', line: 'AWAY' }));
        break;

      // === UI helpers ===
      case 'clear':
      case 'cls': {
        const key = normChan(currentIrcChannel);
        if (channelBuffers[key]) channelBuffers[key] = [];
        const container = document.getElementById('irc-messages');
        if (container) container.innerHTML = '';
        break;
      }
      case 'help': {
        const helpLines = [
          '<b>Channel:</b> /join /part /topic /invite /cycle /names',
          '<b>Users:</b> /op /deop /voice /devoice /hop /dehop /kick /ban /unban /kickban /mode /owner /deowner /admin /deadmin',
          '<b>Services:</b> /ns /cs /ms /bs /hs /os /identify /ghost /regain',
          '<b>Chat:</b> /msg /notice /me /ctcp /query',
          '<b>Info:</b> /whois /whowas /who /list /motd /version /time /ping /stats',
          '<b>Other:</b> /nick /away /back /quit /clear /raw',
          '<b>Oper:</b> /oper /kill /kline /unkline /gline /ungline /zline /unzline /dline /undline',
          '<b>Oper+:</b> /wallops /globops /sajoin /sapart /sanick /samode /chghost /sethost /chgident /chgname',
          '<b>Oper++:</b> /squit /rehash /die /restart /map /links /trace /modules /userip',
        ];
        helpLines.forEach(l => appendToBuffer(currentIrcChannel, `<div class="msg-line msg-system">${l}</div>`));
        break;
      }

      // === Convenience ===
      case 'cycle':
      case 'rejoin': {
        const ch = args[0] || (currentIrcChannel !== '*status' ? currentIrcChannel : '');
        if (ch) {
          ws.send(JSON.stringify({ type: 'part', channel: ch }));
          setTimeout(() => ws.send(JSON.stringify({ type: 'join', channel: ch })), 500);
        }
        break;
      }
      case 'raw':
      case 'quote':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: args.join(' ') }));
        break;

      // === IRCop commands ===
      case 'oper':
        if (args.length >= 2) ws.send(JSON.stringify({ type: 'raw', line: 'OPER ' + args[0] + ' ' + args[1] }));
        break;
      case 'kill':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'KILL ' + args[0] + (args.length > 1 ? ' :' + args.slice(1).join(' ') : ' :Killed') }));
        break;
      case 'kline':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'KLINE ' + args.join(' ') }));
        break;
      case 'unkline':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'UNKLINE ' + args.join(' ') }));
        break;
      case 'gline':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'GLINE ' + args.join(' ') }));
        break;
      case 'ungline':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'UNGLINE ' + args.join(' ') }));
        break;
      case 'zline':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'ZLINE ' + args.join(' ') }));
        break;
      case 'unzline':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'UNZLINE ' + args.join(' ') }));
        break;
      case 'dline':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'DLINE ' + args.join(' ') }));
        break;
      case 'undline':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'UNDLINE ' + args.join(' ') }));
        break;
      case 'wallops':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'WALLOPS :' + args.join(' ') }));
        break;
      case 'globops':
        if (args.length > 0) ws.send(JSON.stringify({ type: 'raw', line: 'GLOBOPS :' + args.join(' ') }));
        break;
      case 'squit':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'SQUIT ' + args[0] + (args.length > 1 ? ' :' + args.slice(1).join(' ') : '') }));
        break;
      case 'die':
        ws.send(JSON.stringify({ type: 'raw', line: 'DIE' + (args.length > 0 ? ' ' + args.join(' ') : '') }));
        break;
      case 'restart':
        ws.send(JSON.stringify({ type: 'raw', line: 'RESTART' + (args.length > 0 ? ' ' + args.join(' ') : '') }));
        break;
      case 'rehash':
        ws.send(JSON.stringify({ type: 'raw', line: 'REHASH' + (args.length > 0 ? ' ' + args.join(' ') : '') }));
        break;
      case 'stats':
        ws.send(JSON.stringify({ type: 'raw', line: 'STATS ' + (args[0] || '*') + (args[1] ? ' ' + args[1] : '') }));
        break;
      case 'trace':
        ws.send(JSON.stringify({ type: 'raw', line: 'TRACE' + (args[0] ? ' ' + args[0] : '') }));
        break;
      case 'map':
        ws.send(JSON.stringify({ type: 'raw', line: 'MAP' }));
        break;
      case 'links':
        ws.send(JSON.stringify({ type: 'raw', line: 'LINKS' + (args.length > 0 ? ' ' + args.join(' ') : '') }));
        break;
      case 'sajoin':
        if (args.length >= 2) ws.send(JSON.stringify({ type: 'raw', line: 'SAJOIN ' + args[0] + ' ' + args[1] }));
        break;
      case 'sapart':
        if (args.length >= 2) ws.send(JSON.stringify({ type: 'raw', line: 'SAPART ' + args[0] + ' ' + args[1] }));
        break;
      case 'sanick':
        if (args.length >= 2) ws.send(JSON.stringify({ type: 'raw', line: 'SANICK ' + args[0] + ' ' + args[1] }));
        break;
      case 'samode':
        if (args.length >= 2) ws.send(JSON.stringify({ type: 'raw', line: 'SAMODE ' + args.join(' ') }));
        break;
      case 'chghost':
        if (args.length >= 2) ws.send(JSON.stringify({ type: 'raw', line: 'CHGHOST ' + args[0] + ' ' + args[1] }));
        break;
      case 'sethost':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'SETHOST ' + args[0] }));
        break;
      case 'chgident':
        if (args.length >= 2) ws.send(JSON.stringify({ type: 'raw', line: 'CHGIDENT ' + args[0] + ' ' + args[1] }));
        break;
      case 'chgname':
        if (args.length >= 2) ws.send(JSON.stringify({ type: 'raw', line: 'CHGNAME ' + args[0] + ' :' + args.slice(1).join(' ') }));
        break;
      case 'userip':
        if (args[0]) ws.send(JSON.stringify({ type: 'raw', line: 'USERIP ' + args[0] }));
        break;
      case 'modules':
        ws.send(JSON.stringify({ type: 'raw', line: 'MODULE' + (args[0] ? ' ' + args[0] : '') }));
        break;

      default:
        // Send as raw IRC command
        ws.send(JSON.stringify({ type: 'raw', line: text.substring(1) }));
    }
  } else {
    if (currentIrcChannel === '*status') {
      appendStatusMessage('<div class="msg-line msg-system">ℹ Cannot send messages to the status window. Use /join #channel first.</div>');
    } else {
      ws.send(JSON.stringify({ type: 'message', target: currentIrcChannel, text: text }));
    }
  }

  input.focus();
}

// ========== CHANNEL SWITCHING ==========

function switchIrcChannel(channel) {
  if (!channel.startsWith('#') && channel !== '*status') channel = '#' + channel;

  // Ensure tab exists and join if needed
  ensureTab(channel);
  if (ws && ircConnected && channel.startsWith('#')) {
    ws.send(JSON.stringify({ type: 'join', channel: channel }));
  }

  switchTab(channel);
}

function renderChannelBar() {
  // No-op: replaced by tabs
}

function switchToChannel() {
  const input = document.getElementById('irc-switch-input');
  if (!input) return;
  let channel = input.value.trim();
  if (!channel) return;
  if (!channel.startsWith('#')) channel = '#' + channel;
  input.value = '';
  switchIrcChannel(channel);
}

// Enter key in channel switch input
// ========== TAB COMPLETION ==========

let tabCompleteState = { active: false, index: 0, matches: [], prefix: '', cursorStart: 0 };

function tabCompleteNick(input) {
  const pos = input.selectionStart;
  const text = input.value;

  if (!tabCompleteState.active) {
    // Find the word fragment before the cursor
    let start = pos;
    while (start > 0 && text[start - 1] !== ' ') start--;
    const prefix = text.substring(start, pos).toLowerCase();
    if (!prefix) return;

    const users = channelUsers[normChan(currentIrcChannel)] || [];
    const matches = users
      .map(u => u.nick)
      .filter(n => n.toLowerCase().startsWith(prefix))
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    if (matches.length === 0) return;

    tabCompleteState = { active: true, index: 0, matches, prefix, cursorStart: start };
  } else {
    tabCompleteState.index = (tabCompleteState.index + 1) % tabCompleteState.matches.length;
  }

  const nick = tabCompleteState.matches[tabCompleteState.index];
  const suffix = tabCompleteState.cursorStart === 0 ? ': ' : ' ';
  const before = text.substring(0, tabCompleteState.cursorStart);
  
  // Find end of current completion (could be a previous tab-completed nick)
  let end = tabCompleteState.cursorStart;
  while (end < text.length && text[end] !== ' ') end++;
  // Also skip the suffix from previous completion
  if (text.substring(end, end + 2) === ': ') end += 2;
  else if (text[end] === ' ') end += 1;

  const after = text.substring(end);
  input.value = before + nick + suffix + after;
  const newPos = before.length + nick.length + suffix.length;
  input.setSelectionRange(newPos, newPos);
}

function resetTabComplete() {
  tabCompleteState = { active: false, index: 0, matches: [], prefix: '', cursorStart: 0 };
}

// ========== EVENT LISTENERS ==========

document.addEventListener('DOMContentLoaded', () => {
  const switchInput = document.getElementById('irc-switch-input');
  if (switchInput) {
    switchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') switchToChannel();
    });
  }
  const chatInput = document.getElementById('irc-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        tabCompleteNick(chatInput);
        return;
      }
      if (e.key !== 'Shift') resetTabComplete();
      if (e.key === 'Enter') sendIrcMessage();
    });
  }
  // Enter on connect form fields
  ['irc-nickname', 'irc-channel-input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') connectIrc(); });
  });
});

// Initialize app when DOM is ready
initApp();
