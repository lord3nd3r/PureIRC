/**
 * Theme Manager - Handles applying themes from config
 */

class ThemeManager {
  constructor() {
    this.themes = {};
    this.currentTheme = null;
    this.storageKey = 'app-theme';
  }

  /**
   * Initialize theme manager with config
   */
  async init(configManager) {
    // Get all themes from config
    this.themes = configManager.get('themes', {});
    
    // Get default theme or stored preference
    const defaultTheme = configManager.get('branding.defaultTheme', 'cyan');
    const storedTheme = localStorage.getItem(this.storageKey);
    const themeToUse = storedTheme || defaultTheme;

    if (this.themes[themeToUse]) {
      this.setTheme(themeToUse);
    } else {
      console.warn(`[Theme] Theme "${themeToUse}" not found, using "${defaultTheme}"`);
      this.setTheme(defaultTheme);
    }

    console.log('[Theme] Initialized', { current: this.currentTheme, available: Object.keys(this.themes) });
  }

  /**
   * Set and apply a theme
   */
  setTheme(themeName) {
    if (!this.themes[themeName]) {
      console.error(`[Theme] Theme "${themeName}" not found`);
      return false;
    }

    const theme = this.themes[themeName];
    this.currentTheme = themeName;

    // Store preference
    localStorage.setItem(this.storageKey, themeName);

    // Apply CSS variables
    this.applyCssVariables(theme);

    // Apply Tailwind classes where needed
    this.applyTailwindClasses(theme);

    console.log(`[Theme] Applied theme: ${themeName}`);
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName, config: theme } }));

    return true;
  }

  /**
   * Apply CSS custom properties for theme
   */
  applyCssVariables(theme) {
    const root = document.documentElement;
    const vars = {
      '--theme-primary': theme.primary,
      '--theme-accent': theme.textAccent,
      '--theme-accent-light': theme.accentLight,
      '--theme-accent-dark': theme.accentDark,
    };

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }

  /**
   * Apply Tailwind dynamically where needed (icon background, etc.)
   */
  applyTailwindClasses(theme) {
    // Update header icon background
    const headerIcon = document.querySelector('a[href="#home"] .w-8.h-8');
    if (headerIcon) {
      // Remove all cyan/purple/emerald/rose/amber/blue color classes
      headerIcon.className = headerIcon.className
        .replace(/bg-(cyan|purple|emerald|rose|amber|blue)-\d+/g, '')
        .replace(/shadow-(cyan|purple|emerald|rose|amber|blue)-\d+\/\d+/g, '');
      
      // Add new color classes
      headerIcon.classList.add(`bg-${theme.accent}-500`);
      headerIcon.classList.add(`shadow-${theme.accent}-500/30`);
    }

    // Update "Connect Now" buttons
    document.querySelectorAll('a[onclick*="openIrcModal"]').forEach(btn => {
      if (btn.classList.contains('bg-cyan-500') || btn.classList.contains('bg-purple-500') ||
          btn.classList.contains('bg-emerald-500') || btn.classList.contains('bg-rose-500') ||
          btn.classList.contains('bg-amber-500') || btn.classList.contains('bg-blue-500')) {
        // Get current accent color and replace
        const currentAccent = ['cyan', 'purple', 'emerald', 'rose', 'amber', 'blue']
          .find(c => btn.className.includes(`bg-${c}-500`));
        
        if (currentAccent) {
          btn.className = btn.className
            .replace(`bg-${currentAccent}-500`, `bg-${theme.accent}-500`)
            .replace(`hover:bg-${currentAccent}-400`, `hover:bg-${theme.accent}-400`)
            .replace(`shadow-${currentAccent}-500/20`, `shadow-${theme.accent}-500/20`)
            .replace(`hover:shadow-${currentAccent}-400/30`, `hover:shadow-${theme.accent}-400/30`);
        }
      }
    });

    // Update text accent colors
    document.querySelectorAll('.text-cyan-400, .text-purple-400, .text-emerald-400, .text-rose-400, .text-amber-400, .text-blue-400').forEach(el => {
      const currentAccent = ['cyan', 'purple', 'emerald', 'rose', 'amber', 'blue']
        .find(c => el.className.includes(`text-${c}-400`));
      
      if (currentAccent) {
        el.className = el.className
          .replace(`text-${currentAccent}-400`, `text-${theme.accentLight}`);
      }
    });

    // Update accent backgrounds and borders
    const accentBg = document.querySelectorAll('[class*="cyan-500/10"], [class*="purple-500/10"], [class*="emerald-500/10"], [class*="rose-500/10"], [class*="amber-500/10"], [class*="blue-500/10"]');
    accentBg.forEach(el => {
      const currentAccent = ['cyan', 'purple', 'emerald', 'rose', 'amber', 'blue']
        .find(c => el.className.includes(`${c}-500/10`));
      
      if (currentAccent) {
        el.className = el.className
          .replace(`bg-${currentAccent}-500/10`, `bg-${theme.accent}-500/10`)
          .replace(`border-${currentAccent}-500/20`, `border-${theme.accent}-500/20`)
          .replace(`border-${currentAccent}-500/40`, `border-${theme.accent}-500/40`);
      }
    });
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Get all available themes
   */
  getAvailableThemes() {
    return Object.entries(this.themes).map(([key, theme]) => ({
      id: key,
      ...theme
    }));
  }

  /**
   * Check if theme exists
   */
  hasTheme(themeName) {
    return themeName in this.themes;
  }
}

// Create global instance
window.themeManager = new ThemeManager();
