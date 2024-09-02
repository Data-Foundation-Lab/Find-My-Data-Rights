  // Usage example:
  // const results = DataPrivacyAnalyzer.analyze();
  // console.log(results.report);

const DataPrivacyAnalyzer = (function() {
    const trackingCategories = {
      analytics: {
        name: "Analytics",
        description: "Tracks user behavior for site improvement and marketing insights.",
        privacyImplications: "May collect user navigation patterns and interactions."
      },
      advertising: {
        name: "Advertising",
        description: "Used for targeted advertising and remarketing.",
        privacyImplications: "Can track users across different websites and build detailed profiles."
      },
      functionality: {
        name: "Functionality",
        description: "Enhances website functionality and user experience.",
        privacyImplications: "Generally low risk, but may store user preferences."
      },
      social: {
        name: "Social Media",
        description: "Enables social media integration and sharing.",
        privacyImplications: "May allow social networks to track user behavior across sites."
      },
      unknown: {
        name: "Unknown",
        description: "Purpose couldn't be determined.",
        privacyImplications: "Potential data privacy risk, further investigation needed."
      }
    };
  
    function categorizeTracker(identifier) {
      const lowerIdentifier = identifier.toLowerCase();
      if (lowerIdentifier.includes('analytics') || lowerIdentifier.includes('gtag')) {
        return 'analytics';
      } else if (lowerIdentifier.includes('ad') || lowerIdentifier.includes('pixel')) {
        return 'advertising';
      } else if (lowerIdentifier.includes('api') || lowerIdentifier.includes('cdn')) {
        return 'functionality';
      } else if (lowerIdentifier.includes('facebook') || lowerIdentifier.includes('twitter')) {
        return 'social';
      }
      return 'unknown';
    }
  
    function mightCollectData(url) {
      const suspiciousDomains = [
        'google-analytics.com', 'googletagmanager.com', 'doubleclick.net', 'facebook.net',
        'hotjar.com', 'optimizely.com', 'adroll.com'
      ];
      return suspiciousDomains.some(domain => url.includes(domain));
    }
  
    function analyzeScripts() {
      const scripts = document.getElementsByTagName('script');
      return Array.from(scripts)
        .filter(script => script.src && mightCollectData(script.src))
        .map(script => ({
          url: script.src,
          category: categorizeTracker(script.src)
        }));
    }
  
    function analyzeStylesheets() {
      const links = document.getElementsByTagName('link');
      return Array.from(links)
        .filter(link => link.rel === 'stylesheet' && link.href && mightCollectData(link.href))
        .map(link => ({
          url: link.href,
          category: categorizeTracker(link.href)
        }));
    }
  
    function analyzeCookies() {
      return document.cookie.split(';')
        .map(cookie => cookie.trim().split('='))
        .map(([name, value]) => ({
          name,
          value,
          category: categorizeTracker(name)
        }));
    }
  
    function analyzeLocalStorage() {
      return Object.keys(localStorage)
        .map(key => ({
          key,
          value: localStorage.getItem(key),
          category: categorizeTracker(key)
        }));
    }
  
    function analyzeSessionStorage() {
      return Object.keys(sessionStorage)
        .map(key => ({
          key,
          value: sessionStorage.getItem(key),
          category: categorizeTracker(key)
        }));
    }
  
    function detectDataPrivacyPolicy() {
      const privacyKeywords = ['privacy policy', 'privacy statement', 'data policy'];
      const links = document.getElementsByTagName('a');
      for (let link of links) {
        if (privacyKeywords.some(keyword => link.textContent.toLowerCase().includes(keyword))) {
          return { found: true, link: link.href };
        }
      }
      return { found: false };
    }
  
    function detectCookieConsentBanner() {
      const consentKeywords = ['cookie', 'consent', 'gdpr', 'ccpa'];
      const elements = document.body.getElementsByTagName('*');
      for (let element of elements) {
        if (consentKeywords.some(keyword => element.textContent.toLowerCase().includes(keyword))) {
          return { found: true, element: element.tagName };
        }
      }
      return { found: false };
    }
  
    function detectGPCSupport() {
      if ('globalPrivacyControl' in navigator) {
        return { supported: true, enabled: navigator.globalPrivacyControl };
      }
      return { supported: false };
    }
  
    function detectPrivacySensitiveAPIs() {
      const privacySensitiveAPIs = [
        { name: 'Geolocation', check: 'navigator.geolocation' },
        { name: 'Notification', check: 'Notification' },
        { name: 'Camera/Microphone', check: 'navigator.mediaDevices && navigator.mediaDevices.getUserMedia' }
      ];
      
      return privacySensitiveAPIs.filter(api => {
        try {
          return eval(`typeof ${api.check} !== 'undefined'`);
        } catch {
          return false;
        }
      });
    }
  
    function detectThirdPartyResources() {
      const currentDomain = window.location.hostname;
      const resources = [
        ...Array.from(document.scripts).map(script => script.src),
        ...Array.from(document.styleSheets).map(stylesheet => stylesheet.href),
        ...Array.from(document.images).map(img => img.src)
      ].filter(Boolean);
  
      return resources.filter(resource => {
        try {
          const url = new URL(resource);
          return url.hostname !== currentDomain;
        } catch {
          return false;
        }
      });
    }
  
    function generateReport(data) {
      let report = "Data Privacy Analysis Report\n";
      report += "=====================================\n\n";
  
      // Tracking items report
      const allItems = [
        ...data.scripts.map(s => ({...s, type: 'Script'})),
        ...data.styles.map(s => ({...s, type: 'Stylesheet'})),
        ...data.cookies.map(c => ({...c, type: 'Cookie'})),
        ...data.localStorage.map(l => ({...l, type: 'LocalStorage'})),
        ...data.sessionStorage.map(s => ({...s, type: 'SessionStorage'}))
      ];
  
      const categorizedItems = allItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {});
  
      Object.keys(categorizedItems).forEach(category => {
        const items = categorizedItems[category];
        report += `${trackingCategories[category].name} Trackers\n`;
        report += `${'-'.repeat(trackingCategories[category].name.length + 9)}\n`;
        report += `Description: ${trackingCategories[category].description}\n`;
        report += `Data Privacy Implications: ${trackingCategories[category].privacyImplications}\n`;
        report += `Items Found: ${items.length}\n\n`;
  
        items.forEach(item => {
          report += `  - Type: ${item.type}\n`;
          if (item.url) report += `    URL: ${item.url}\n`;
          if (item.name) report += `    Name: ${item.name}\n`;
          if (item.key) report += `    Key: ${item.key}\n`;
          report += '\n';
        });
  
        report += '\n';
      });
  
      // Data privacy features report
      report += `Data Privacy Features\n`;
      report += `----------------\n`;
      if (data.privacyPolicy.found) {
        report += `Data Privacy Policy: Found (${data.privacyPolicy.link})\n`;
      } else {
        report += `Data Privacy Policy: Not found. RECOMMENDATION: Add a clear link to your data privacy policy.\n`;
      }
  
      if (data.cookieConsent.found) {
        report += `Cookie Consent Banner: Detected (${data.cookieConsent.element})\n`;
      } else {
        report += `Cookie Consent Banner: Not detected. RECOMMENDATION: Implement a cookie consent mechanism for GDPR compliance.\n`;
      }
  
      if (data.gpc.supported) {
        report += `Global Privacy Control (GPC): Supported${data.gpc.enabled ? ' and enabled' : ' but not enabled'}\n`;
      } else {
        report += `Global Privacy Control (GPC): Not supported. RECOMMENDATION: Consider adding support for GPC.\n`;
      }
  
      report += `\nData Privacy-Sensitive API Usage:\n`;
      if (data.privacySensitiveAPIs.length > 0) {
        report += `  The following data privacy-sensitive APIs are potentially in use:\n`;
        data.privacySensitiveAPIs.forEach(api => report += `    - ${api.name}\n`);
        report += `  RECOMMENDATION: Ensure proper user consent is obtained before using these APIs and clearly disclose their usage in your data privacy policy.\n`;
      } else {
        report += `  No data privacy-sensitive APIs detected in use.\n`;
      }
  
      report += `\nThird-Party Resources:\n`;
      if (data.thirdPartyResources.length > 0) {
        report += `  ${data.thirdPartyResources.length} third-party resources detected. Top 5:\n`;
        data.thirdPartyResources.slice(0, 5).forEach(resource => report += `    - ${resource}\n`);
        report += `  RECOMMENDATION: Review all third-party resources for data collection practices and ensure they align with your data privacy policy.\n`;
      } else {
        report += `  No third-party resources detected.\n`;
      }
  
      // Summary
      const totalItems = allItems.length;
      report += `\nSummary\n`;
      report += `-------\n`;
      report += `Total potential tracking items found: ${totalItems}\n`;
      if (totalItems > 10) {
        report += `DATA PRIVACY ALERT: High number of potential tracking items detected. Consider reviewing and potentially reducing third-party integrations.\n`;
      } else if (totalItems > 5) {
        report += `DATA PRIVACY NOTICE: Moderate number of potential tracking items detected. Ensure all are necessary and disclosed in your data privacy policy.\n`;
      } else if (totalItems > 0) {
        report += `DATA PRIVACY INFO: Low number of potential tracking items detected. Good practice to review periodically.\n`;
      } else {
        report += `DATA PRIVACY INFO: No potential tracking items detected. Great job! However, always stay vigilant about data privacy.\n`;
      }
  
      return report;
    }
  
    function analyzePrivacy() {
      const data = {
        scripts: analyzeScripts(),
        styles: analyzeStylesheets(),
        cookies: analyzeCookies(),
        localStorage: analyzeLocalStorage(),
        sessionStorage: analyzeSessionStorage(),
        privacyPolicy: detectDataPrivacyPolicy(),
        cookieConsent: detectCookieConsentBanner(),
        gpc: detectGPCSupport(),
        privacySensitiveAPIs: detectPrivacySensitiveAPIs(),
        thirdPartyResources: detectThirdPartyResources()
      };
  
      const report = generateReport(data);
      console.log(report);
  
      return { ...data, report };
    }
  
    return {
      analyze: analyzePrivacy
    };
  })();