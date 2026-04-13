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
  console.log('[App] Initializing PureIRC website');

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

  // Load initial data
  await loadChannels();
  await loadStats();

  // Setup UI
  setupHeaderScrollEffect();
  setupMobileMenu();
  setupConnectTabs();
  setupFaqAccordion();
  setupCopyToClipboard();
  setupNavHighlight();
  setupFooterYear();
  setupChannelQuickPicks();
  setupIrcModal();

  // Start auto-refresh intervals
  setInterval(loadChannels, CHANNELS_REFRESH_INTERVAL);
  setInterval(loadStats, STATS_REFRESH_INTERVAL);

  console.log('[App] Initialization complete');
}

/**
 * Fetch channels from API and render
 */
async function loadChannels() {
  try {
    const response = await fetch(`${API_BASE}/channels`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    cachedChannels = await response.json();
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
    cachedStats = await response.json();
    renderStats();
  } catch (error) {
    console.warn('[Stats] Failed to load:', error.message);
  }
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

  const channels = cachedChannels.length > 0 ? cachedChannels : getDefaultChannels();

  channels.forEach(ch => {
    const colorClass = categoryColors[ch.category] || 'text-gray-400 bg-white/5 border-white/10';
    const html = `
      <div onclick="openIrcModal('${ch.name}')" class="group bg-gray-900 hover:bg-gray-800/80 border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <i data-lucide="hash" class="w-4 h-4 text-cyan-400"></i>
            </div>
            <span class="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">${ch.name}</span>
          </div>
          ${ch.pinned ? '<span class="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">Featured</span>' : ''}
        </div>
        <p class="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">${ch.topic}</p>
        <div class="flex items-center justify-between">
          <span class="text-xs px-2.5 py-1 rounded-full border font-medium ${colorClass}">${ch.category}</span>
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
  const usersOnlineEl = document.querySelector('[data-stat="users-online"]');
  const channelsEl = document.querySelector('[data-stat="channels"]');

  if (usersOnlineEl && cachedStats.usersOnline !== undefined) {
    usersOnlineEl.textContent = cachedStats.usersOnline.toLocaleString();
  }
  if (channelsEl && cachedStats.networksChannels !== undefined) {
    channelsEl.textContent = cachedStats.networksChannels.toLocaleString();
  }
}

/**
 * Get default channels for fallback
 */
function getDefaultChannels() {
  return [
    { name: '#lobby', topic: 'General chat and welcome newcomers to PureIRC', users: 312, category: 'General', pinned: true },
    { name: '#help', topic: 'Need assistance? Ask the community here', users: 198, category: 'Support', pinned: true },
    { name: '#tech', topic: 'Programming, hardware, software & all things tech', users: 247, category: 'Technology', pinned: false },
    { name: '#gaming', topic: 'Games, streams, reviews and everything gaming', users: 189, category: 'Gaming', pinned: false },
    { name: '#linux', topic: 'The Linux community — distros, tips, and support', users: 164, category: 'Technology', pinned: false },
    { name: '#music', topic: 'Share what you\'re listening to and discover new artists', users: 122, category: 'Entertainment', pinned: false },
    { name: '#dev', topic: 'Software development, projects, and code reviews', users: 143, category: 'Technology', pinned: false },
    { name: '#offtopic', topic: 'Everything and anything goes (within rules)', users: 211, category: 'General', pinned: false },
    { name: '#anime', topic: 'Manga, anime, and Japanese media discussions', users: 98, category: 'Entertainment', pinned: false }
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

  const faqs = [
    { q: 'Do I need to register to use PureIRC?', a: 'No registration is required to connect and chat. You can optionally register your nickname using NickServ to reserve it: /msg NickServ REGISTER yourpassword youremail@example.com' },
    { q: 'How do I register my nickname?', a: 'Once connected, type: /msg NickServ REGISTER <password> <email>. You\'ll receive a verification code via email. Follow the instructions in the email to complete registration.' },
    { q: 'Can I run a bot on PureIRC?', a: 'Bots are allowed with prior approval. Connect to #help or message an IRCop to request bot access. Provide a brief description of your bot\'s purpose.' },
    { q: 'How do I create my own channel?', a: 'Simply join a channel that doesn\'t exist yet: /join #mychannel. You\'ll automatically become channel operator. Register it with ChanServ to keep ownership: /msg ChanServ REGISTER #mychannel' },
    { q: 'Is SSL/TLS supported?', a: 'Yes. Connect to irc.pureirc.com on port 6697 and enable SSL/TLS in your client settings for an encrypted connection.' },
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
  const channels = cachedChannels.length > 0 ? cachedChannels : getDefaultChannels();

  channels.forEach(ch => {
    quickPicks.innerHTML += `
      <button type="button" onclick="pickChannel('${ch.name}')" class="channel-pill text-xs px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-white font-mono">${ch.name}</button>
    `;
  });
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

let currentIrcChannel = '#lobby';
let ircConnected = false;

function openIrcModal(channel) {
  channel = channel || '#lobby';
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
    const container = document.getElementById('irc-frame-container');
    const bar = document.getElementById('irc-channel-bar');
    if (form) form.classList.remove('hidden');
    if (container) container.classList.add('hidden');
    if (bar) bar.classList.add('hidden');
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

function buildKiwiUrl(nickname, channel) {
  const channelClean = channel.startsWith('#') ? channel.substring(1) : channel;
  let url = `https://kiwiirc.com/nextclient/irc.pureirc.com/?nick=${encodeURIComponent(nickname)}`;
  url += `#${encodeURIComponent(channelClean)}`;
  return url;
}

function connectIrc() {
  let nickname = document.getElementById('irc-nickname').value.trim();
  let channel = document.getElementById('irc-channel-input').value.trim() || '#lobby';
  if (!channel.startsWith('#')) channel = '#' + channel;

  if (!nickname) {
    nickname = 'PureUser' + Math.floor(Math.random() * 9999);
    document.getElementById('irc-nickname').value = nickname;
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_\-]{0,15}$/.test(nickname)) {
    nickname = 'PureUser' + Math.floor(Math.random() * 9999);
    document.getElementById('irc-nickname').value = nickname;
  }

  currentIrcChannel = channel;
  ircConnected = true;

  const url = buildKiwiUrl(nickname, channel);
  const frame = document.getElementById('irc-frame');
  if (frame) frame.src = url;

  const form = document.getElementById('irc-connect-form');
  const container = document.getElementById('irc-frame-container');
  const bar = document.getElementById('irc-channel-bar');
  const display = document.getElementById('irc-channel-display');

  if (form) form.classList.add('hidden');
  if (container) container.classList.remove('hidden');
  if (bar) bar.classList.remove('hidden');
  if (display) display.textContent = channel;

  renderChannelBar(channel);
}

function renderChannelBar(activeChannel) {
  const pills = document.getElementById('irc-channel-bar-pills');
  if (!pills) return;

  pills.innerHTML = '';
  const channels = cachedChannels.length > 0 ? cachedChannels : getDefaultChannels();

  channels.forEach(ch => {
    const isActive = ch.name === activeChannel;
    pills.innerHTML += `
      <button onclick="switchIrcChannel('${ch.name}')" class="channel-pill text-xs px-3 py-1.5 rounded-full border border-white/10 text-gray-400 font-mono whitespace-nowrap ${isActive ? 'active' : ''}">${ch.name}</button>
    `;
  });
}

function switchIrcChannel(channel) {
  if (!channel.startsWith('#')) channel = '#' + channel;
  currentIrcChannel = channel;

  const display = document.getElementById('irc-channel-display');
  if (display) display.textContent = channel;

  const nickname = document.getElementById('irc-nickname').value.trim() || 'PureUser' + Math.floor(Math.random() * 9999);
  const url = buildKiwiUrl(nickname, channel);
  const frame = document.getElementById('irc-frame');
  if (frame) frame.src = url;

  renderChannelBar(channel);
}

function switchToChannel() {
  let channel = document.getElementById('irc-switch-input').value.trim();
  if (!channel) return;
  if (!channel.startsWith('#')) channel = '#' + channel;
  document.getElementById('irc-switch-input').value = '';
  switchIrcChannel(channel);
}

function openIrcInNewTab() {
  const nickname = document.getElementById('irc-nickname').value.trim() || 'PureUser' + Math.floor(Math.random() * 9999);
  const url = buildKiwiUrl(nickname, currentIrcChannel);
  window.open(url, '_blank');
}

// Enter key in channel switch input
document.addEventListener('DOMContentLoaded', () => {
  const switchInput = document.getElementById('irc-switch-input');
  if (switchInput) {
    switchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') switchToChannel();
    });
  }
});

// Initialize app when DOM is ready
initApp();
