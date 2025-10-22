/**
 * Security Layer - Protection against extension interference and XSS
 */

class SecurityManager {
  constructor() {
    this.initCSP();
    this.detectExtensions();
    this.preventXSS();
  }

  initCSP() {
    // Content Security Policy via meta tag
    const csp = document.createElement('meta');
    csp.httpEquiv = 'Content-Security-Policy';
    csp.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co",
      "img-src 'self' data: https:",
      "frame-src 'none'"
    ].join('; ');
    
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head && !document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      head.insertBefore(csp, head.firstChild);
    }
  }

  detectExtensions() {
    // Suppress extension-related console errors
    const originalError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      // Filter out extension-related errors
      if (message.includes('message port closed') || 
          message.includes('load_embeds') ||
          message.includes('embed_script')) {
        console.warn('[Extension Interference Detected - Suppressed]:', ...args);
        return;
      }
      originalError.apply(console, args);
    };
  }

  preventXSS() {
    // Sanitize user inputs
    window.sanitizeInput = (input) => {
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    };
  }

  validateFile(file, config) {
    const errors = [];

    // Size check
    if (file.size > config.maxFileSize) {
      errors.push(`File ${file.name} exceeds ${config.maxFileSize / 1024 / 1024}MB limit`);
    }

    // Type check
    if (!config.allowedTypes.includes(file.type)) {
      errors.push(`File ${file.name} has invalid type: ${file.type}`);
    }

    // Name sanitization
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    if (sanitizedName !== file.name) {
      console.warn(`File name sanitized: ${file.name} -> ${sanitizedName}`);
    }

    return { valid: errors.length === 0, errors, sanitizedName };
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  window.securityManager = new SecurityManager();
}