/**
 * Main App - Initializes all modules and common functionality
 */

import ChannelRenderer from './channel-renderer.js';
import StatsWidget from './stats-widget.js';
import IRCModal from './irc-modal.js';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[App] Initializing website');

  // Load config first
  if (window.configManager) {
    await window.configManager.load();
    applyConfigToPage();
  }

  // Initialize theme manager
  if (window.themeManager && window.configManager) {
    await window.themeManager.init(window.configManager);
  }

  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Initialize modules
  await initializeModules();

  // Setup UI features
  setupHeaderScrollEffect();
  setupMobileMenu();
  setupConnectTabs();
  setupFaqAccordion();
  setupCopyToClipboard();
  setupNavHighlight();
  setupFooterYear();
  setupThemeSwitcher();
});

/**
 * Apply loaded config to page elements
 */
function applyConfigToPage() {
  const cfg = window.configManager;
  const siteName = cfg.get('site.name', 'Network');
  const defaultChannel = cfg.get('irc.defaultChannel', '#general');
  const ircHost = cfg.get('irc.host', 'irc.example.com');

  // Update page titles dynamically from site name
  document.title = `${siteName} — Free IRC Network`;
  
  // Update header branding
  const headerLink = document.querySelector('a[href="#home"]');
  if (headerLink) {
    headerLink.innerHTML = `
      <div class="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center shadow-md shadow-cyan-500/30">
        <i data-lucide="${cfg.get('branding.icon', 'radio')}" class="w-4 h-4 text-gray-950"></i>
      </div>
      <span class="text-white font-bold text-lg tracking-tight">${siteName.toLowerCase()}</span>
    `;
    if (window.lucide) lucide.createIcons();
  }

  // Update "Connect Now" buttons with default channel
  document.querySelectorAll('[onclick*="openIrcModal"]').forEach(btn => {
    btn.setAttribute('onclick', `openIrcModal('${defaultChannel}')`);
  });

  // Update page descriptions
  const heroDescription = document.querySelector('p.text-lg.text-gray-400');
  if (heroDescription) {
    heroDescription.textContent = cfg.get('site.description', 'Connect with us');
  }

  // Update IRC server references
  document.querySelectorAll('code').forEach(code => {
    if (code.textContent.includes('irc.') && code.textContent.includes('.')) {
      code.textContent = ircHost;
    }
  });

  // Update footer copyright with site name
  const copyrightText = document.querySelector('p.text-xs.text-gray-600');
  if (copyrightText) {
    const year = new Date().getFullYear();
    copyrightText.textContent = `© ${year} ${cfg.get('site.fullName', 'Network')}. All rights reserved.`;
  }

  // Update header title in chat modal if present
  const headerTitle = document.querySelector('.irc-modal-header h3');
  if (headerTitle) {
    headerTitle.textContent = `Connect to ${siteName}`;
  }

  console.log('[App] Config applied to page');
}

/**
 * Initialize all modules
 */
async function initializeModules() {
  try {
    // Initialize IRC Modal and load channels
    if (window.ircModal) {
      await window.ircModal.init();
    }

    // Initialize Channel Renderer
    if (window.channelRenderer) {
      await window.channelRenderer.init();
    }

    // Initialize Stats Widget
    if (window.statsWidget) {
      await window.statsWidget.init();
    }

    console.log('[App] All modules initialized');
  } catch (err) {
    console.error('[App] Module initialization error:', err);
  }
}

/**
 * Header scroll effect
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
 * Mobile menu toggle
 */
function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIconOpen = document.getElementById('menu-icon-open');
  const menuIconClose = document.getElementById('menu-icon-close');

  if (!mobileMenuBtn || !mobileMenu) return;

  mobileMenuBtn.addEventListener('click', () => {
    const isOpen = !mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden');
    menuIconOpen.classList.toggle('hidden');
    menuIconClose.classList.toggle('hidden');
  });

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuIconOpen.classList.remove('hidden');
      menuIconClose.classList.add('hidden');
    });
  });
}

/**
 * Connect tabs
 */
function setupConnectTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (tabBtns.length === 0) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // Update buttons
      tabBtns.forEach(b => {
        b.classList.remove('bg-gray-800', 'border', 'border-white/10', 'shadow-md');
        b.classList.add('hover:bg-white/5');
        const icon = b.querySelector('.tab-icon');
        if (icon) {
          icon.classList.remove('bg-cyan-500/15', 'border-cyan-500/25');
          icon.classList.add('bg-white/5');
          const iconElement = icon.querySelector('i');
          if (iconElement) {
            iconElement.classList.remove('text-cyan-400');
            iconElement.classList.add('text-gray-500');
          }
        }
        const label = b.querySelector('.tab-label');
        if (label) {
          label.classList.remove('text-white');
          label.classList.add('text-gray-400');
        }
      });

      btn.classList.add('bg-gray-800', 'border', 'border-white/10', 'shadow-md');
      btn.classList.remove('hover:bg-white/5');
      const icon = btn.querySelector('.tab-icon');
      if (icon) {
        icon.classList.add('bg-cyan-500/15', 'border-cyan-500/25');
        icon.classList.remove('bg-white/5');
        const iconElement = icon.querySelector('i');
        if (iconElement) {
          iconElement.classList.add('text-cyan-400');
          iconElement.classList.remove('text-gray-500');
        }
      }
      const label = btn.querySelector('.tab-label');
      if (label) {
        label.classList.add('text-white');
        label.classList.remove('text-gray-400');
      }

      // Update panels
      tabPanels.forEach(p => p.classList.add('hidden'));
      document.getElementById('panel-' + tab)?.classList.remove('hidden');
    });
  });
}

/**
 * FAQ Accordion
 */
function setupFaqAccordion() {
  const faqContainer = document.getElementById('faq-container');
  if (!faqContainer) return;

  const faqs = [
    { q: "Do I need to register to use PureIRC?", a: "No registration is required to connect and chat. You can optionally register your nickname using NickServ to reserve it: /msg NickServ REGISTER yourpassword youremail@example.com" },
    { q: "How do I register my nickname?", a: "Once connected, type: /msg NickServ REGISTER <password> <email>. You'll receive a verification code via email. Follow the instructions in the email to complete registration." },
    { q: "Can I run a bot on PureIRC?", a: "Bots are allowed with prior approval. Connect to #help or message an IRCop to request bot access. Provide a brief description of your bot's purpose." },
    { q: "How do I create my own channel?", a: "Simply join a channel that doesn't exist yet: /join #mychannel. You'll automatically become channel operator. Register it with ChanServ to keep ownership: /msg ChanServ REGISTER #mychannel" },
    { q: "Is SSL/TLS supported?", a: "Yes. Connect to irc.pureirc.com on port 6697 and enable SSL/TLS in your client settings for an encrypted connection." },
    { q: "How do I report abuse or harassment?", a: "Join #help or use /oper to reach a network operator. You can also use /msg <IRCop> to contact staff directly. Provide logs and any relevant context." }
  ];

  faqContainer.innerHTML = faqs.map((faq, i) => `
    <div class="faq-item border-b border-white/5 last:border-0">
      <button onclick="app.toggleFaq(this)" class="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-white transition-colors group">
        <span class="faq-q text-sm font-medium text-gray-300 group-hover:text-white transition-colors">${faq.q}</span>
        <i data-lucide="chevron-down" class="faq-icon-down w-4 h-4 text-gray-500 flex-shrink-0"></i>
        <i data-lucide="chevron-up" class="faq-icon-up w-4 h-4 text-cyan-400 flex-shrink-0 hidden"></i>
      </button>
      <p class="faq-answer text-sm text-gray-400 leading-relaxed pb-5 hidden">${faq.a}</p>
    </div>
  `).join('');

  if (window.lucide) {
    lucide.createIcons();
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
function setupCopyToClipboard() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;

    const codeElement = btn.previousElementSibling;
    if (!codeElement) return;

    const text = codeElement.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', 'check');
        icon.classList.add('text-cyan-400');
        if (window.lucide) {
          lucide.createIcons({ nodes: [icon] });
        }

        setTimeout(() => {
          icon.setAttribute('data-lucide', 'copy');
          icon.classList.remove('text-cyan-400');
          if (window.lucide) {
            lucide.createIcons({ nodes: [icon] });
          }
        }, 2000);
      }
    });
  });
}

/**
 * Navigation highlight on scroll
 */
function setupNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');

  if (sections.length === 0 || navLinks.length === 0) return;

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
 * Set footer year
 */
function setupFooterYear() {
  const yearElement = document.getElementById('footer-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

/**
 * Setup theme switcher if enabled in config
 */
function setupThemeSwitcher() {
  const cfg = window.configManager;
  if (!cfg.get('ui.showThemeSwitcher', false)) {
    return; // Theme switcher disabled
  }

  const themeSwitcher = document.getElementById('theme-switcher');
  if (!themeSwitcher) return;

  const themes = window.themeManager?.getAvailableThemes() || [];
  const currentTheme = window.themeManager?.getTheme();

  themeSwitcher.innerHTML = themes.map(theme => `
    <button class="theme-option px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
      theme.id === currentTheme 
        ? 'bg-opacity-100 text-white' 
        : 'bg-white/5 text-gray-400 hover:bg-white/10'
    }" data-theme="${theme.id}" title="${theme.description}">
      ${theme.name}
    </button>
  `).join('');

  themeSwitcher.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.theme;
      window.themeManager?.setTheme(themeId);
      
      // Update button styles
      themeSwitcher.querySelectorAll('.theme-option').forEach(b => {
        b.classList.remove('bg-opacity-100', 'text-white');
        b.classList.add('bg-white/5', 'text-gray-400');
      });
      btn.classList.add('bg-opacity-100', 'text-white');
      btn.classList.remove('bg-white/5', 'text-gray-400');
    });
  });

  console.log('[App] Theme switcher initialized');
}

// Export functions to global scope for onclick handlers
window.app = {
  toggleFaq
};

console.log('[App] PureIRC website ready');
