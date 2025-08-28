class ContextFlow {
  constructor() {
    this.lastNotifiedContext = null;
    this.notificationTimeout = null;
    this.contextPatterns = {
      'work': {
        keywords: ['jira', 'slack', 'github', 'gitlab', 'confluence', 'notion', 'asana', 'trello', 'teams', 'zoom', 'calendar', 'drive', 'docs', 'sheets'],
        domains: ['github.com', 'gitlab.com', 'atlassian.com', 'slack.com', 'notion.so', 'google.com', 'microsoft.com']
      },
      'shopping': {
        keywords: ['shop', 'buy', 'cart', 'checkout', 'price', 'deal', 'sale', 'product'],
        domains: ['amazon.com', 'bol.com', 'coolblue.nl', 'zalando.com', 'webshop', 'store']
      },
      'research': {
        keywords: ['wiki', 'research', 'study', 'learn', 'tutorial', 'guide', 'documentation', 'stack'],
        domains: ['wikipedia.org', 'stackoverflow.com', 'reddit.com', 'medium.com', 'youtube.com']
      },
      'travel': {
        keywords: ['hotel', 'flight', 'booking', 'trip', 'vacation', 'travel', 'airbnb', 'destination'],
        domains: ['booking.com', 'airbnb.com', 'expedia.com', 'skyscanner.com', 'tripadvisor.com']
      },
      'entertainment': {
        keywords: ['netflix', 'youtube', 'music', 'movie', 'game', 'stream', 'video'],
        domains: ['netflix.com', 'youtube.com', 'spotify.com', 'twitch.tv', 'steam']
      }
    };
    
    this.initializeListeners();
  }

  initializeListeners() {
    // Listen for keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });

    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        this.analyzeTab(tab);
      }
    });

    // Listen for tab creation
    chrome.tabs.onCreated.addListener((tab) => {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        this.analyzeTab(tab);
      }
    });

    // Initialize on startup
    chrome.runtime.onStartup.addListener(() => {
      this.initializeWorkspaces();
    });

    chrome.runtime.onInstalled.addListener(() => {
      this.initializeWorkspaces();
    });
  }

  async initializeWorkspaces() {
    const data = await chrome.storage.local.get(['workspaces', 'settings']);
    
    if (!data.workspaces || data.workspaces.length === 0) {
      const defaultWorkspaces = [
        {
          id: this.generateId(),
          name: 'General',
          context: 'general',
          tabs: [],
          notes: '',
          created: Date.now(),
          lastActive: Date.now()
        }
      ];
      
      await chrome.storage.local.set({ 
        workspaces: defaultWorkspaces,
        activeWorkspaceId: defaultWorkspaces[0].id,
        settings: {
          autoDetection: true,
          smartSuggestions: true,
          maxTabsPerWorkspace: 20
        }
      });
    }
  }

  async analyzeTab(tab) {
    try {
      const data = await chrome.storage.local.get(['settings']);
      if (!data.settings?.autoDetection) return;

      const context = this.detectContext(tab.url, tab.title);
      if (context) {
        await this.handleContextDetection(tab, context);
      }
    } catch (error) {
      console.error('Error analyzing tab:', error);
    }
  }

  detectContext(url, title = '') {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    
    for (const [contextName, pattern] of Object.entries(this.contextPatterns)) {
      if (pattern.domains.some(domain => urlLower.includes(domain))) {
        return contextName;
      }
      if (pattern.keywords.some(keyword => 
        titleLower.includes(keyword) || urlLower.includes(keyword)
      )) {
        return contextName;
      }
    }
    
    return null;
  }

  async handleContextDetection(tab, context) {
    const data = await chrome.storage.local.get(['workspaces', 'activeWorkspaceId', 'settings']);
    let workspaces = data.workspaces || [];
    const settings = data.settings || { maxTabsPerWorkspace: 20 };
    
    let contextWorkspace = workspaces.find(w => w.context === context);
    
    if (!contextWorkspace) {
      contextWorkspace = {
        id: this.generateId(),
        name: this.getContextDisplayName(context),
        context: context,
        tabs: [],
        notes: '',
        created: Date.now(),
        lastActive: Date.now()
      };
      workspaces.push(contextWorkspace);
    }

    const existingTab = contextWorkspace.tabs.find(t => t.url === tab.url);
    if (!existingTab) {
      contextWorkspace.tabs.unshift({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        favicon: tab.favIconUrl,
        added: Date.now()
      });
      
      const maxTabs = settings.maxTabsPerWorkspace || 20;
      if (contextWorkspace.tabs.length > maxTabs) {
        contextWorkspace.tabs = contextWorkspace.tabs.slice(0, maxTabs);
      }
    }

    contextWorkspace.lastActive = Date.now();
    
    await chrome.storage.local.set({ workspaces });
    
    this.showContextNotification(context, contextWorkspace.name);
  }

  showContextNotification(context, workspaceName) {
    if (this.lastNotifiedContext === context) return;

    chrome.action.setBadgeText({ text: '●' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 3000);

    this.lastNotifiedContext = context;

    clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => {
      this.lastNotifiedContext = null;
    }, 60000);
  }
  
  async handleCommand(command) {
    switch (command) {
      case 'brain-dump':
        await this.showBrainDumpPrompt();
        break;
      case 'switch-workspace':
        chrome.action.openPopup();
        break;
    }
  }

  async showBrainDumpPrompt() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    // Check if we can inject scripts into this tab
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      console.log('Cannot inject script into system page');
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (document.getElementById('context-flow-brain-dump')) return;
          
          const overlay = document.createElement('div');
          overlay.id = 'context-flow-brain-dump';
          overlay.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: white; border-radius: 8px; padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 2147483647;
            width: 450px; max-width: 90vw;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `;
          
          overlay.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #333; font-weight: 600;">🧠 Quick Brain Dump</h3>
            <textarea id="brain-dump-text" placeholder="What's on your mind? Notes, ideas, links..." 
                      style="width: 100%; height: 100px; border: 1px solid #ddd; border-radius: 4px; padding: 8px; resize: vertical; font-family: inherit;"></textarea>
            <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
              <button id="brain-dump-cancel" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
              <button id="brain-dump-save" style="padding: 8px 16px; border: none; background: #4CAF50; color: white; border-radius: 4px; cursor: pointer;">Save to Workspace</button>
            </div>
          `;
          
          document.body.appendChild(overlay);
          
          const textarea = document.getElementById('brain-dump-text');
          const saveBtn = document.getElementById('brain-dump-save');
          const cancelBtn = document.getElementById('brain-dump-cancel');
          
          textarea.focus();
          
          const cleanup = () => overlay.remove();
          
          cancelBtn.onclick = cleanup;
          
          saveBtn.onclick = () => {
            const text = textarea.value.trim();
            if (text) {
              chrome.runtime.sendMessage({
                action: 'brainDump',
                text: text,
                url: window.location.href,
                title: document.title
              });
            }
            cleanup();
          };
          
          const handleKeydown = (e) => {
            if (e.key === 'Escape') {
              cleanup();
              document.removeEventListener('keydown', handleKeydown, true);
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              saveBtn.click();
              document.removeEventListener('keydown', handleKeydown, true);
            }
          };
          
          document.addEventListener('keydown', handleKeydown, true);
        }
      });
    } catch (error) {
      console.error('Failed to inject brain dump script:', error);
    }
  }

  async handleBrainDump(text, url, title) {
    const data = await chrome.storage.local.get(['workspaces', 'activeWorkspaceId']);
    let workspaces = data.workspaces || [];
    let activeWorkspaceId = data.activeWorkspaceId;

    let activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    if (!activeWorkspace) {
      activeWorkspace = workspaces.length > 0 ? workspaces[0] : null;
       if (!activeWorkspace) { // Still no workspace, create one
            activeWorkspace = {
                id: this.generateId(), name: 'Notes', context: 'general', tabs: [], notes: '',
                created: Date.now(), lastActive: Date.now()
            };
            workspaces.push(activeWorkspace);
        }
        activeWorkspaceId = activeWorkspace.id;
    }

    const timestamp = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const brainDumpEntry = `[${timestamp}] ${text}\n(From: ${title})\n\n`;

    activeWorkspace.notes = brainDumpEntry + (activeWorkspace.notes || '');
    activeWorkspace.lastActive = Date.now();

    await chrome.storage.local.set({ workspaces, activeWorkspaceId });

    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
  }

  async createWorkspace(name, context = 'general') {
    const data = await chrome.storage.local.get(['workspaces']);
    const workspaces = data.workspaces || [];

    const newWorkspace = {
      id: this.generateId(),
      name: name,
      context: context,
      tabs: [],
      notes: '',
      created: Date.now(),
      lastActive: Date.now()
    };

    workspaces.push(newWorkspace);

    await chrome.storage.local.set({
      workspaces,
      activeWorkspaceId: newWorkspace.id
    });

    return newWorkspace;
  }

  async switchWorkspace(workspaceId) {
    const data = await chrome.storage.local.get(['workspaces']);
    let workspaces = data.workspaces || [];

    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      workspace.lastActive = Date.now();
      // Make it the most recent by re-ordering
      workspaces = workspaces.filter(w => w.id !== workspaceId);
      workspaces.unshift(workspace);

      await chrome.storage.local.set({
        workspaces,
        activeWorkspaceId: workspaceId
      });
      return workspace;
    }
    return null;
  }

  async deleteWorkspace(workspaceId) {
    const data = await chrome.storage.local.get(['workspaces', 'activeWorkspaceId']);
    let workspaces = data.workspaces || [];

    if (workspaces.length <= 1) return false; // Don't delete the last workspace

    const workspaceIndex = workspaces.findIndex(w => w.id === workspaceId);
    if (workspaceIndex === -1) return false;

    workspaces.splice(workspaceIndex, 1);

    let newActiveId = data.activeWorkspaceId;
    if (data.activeWorkspaceId === workspaceId) {
      newActiveId = workspaces.length > 0 ? workspaces[0].id : null;
    }

    await chrome.storage.local.set({
      workspaces,
      activeWorkspaceId: newActiveId
    });

    return true;
  }

  async updateWorkspace(updatedWorkspace) {
    const data = await chrome.storage.local.get(['workspaces']);
    let workspaces = data.workspaces || [];

    const index = workspaces.findIndex(w => w.id === updatedWorkspace.id);
    if (index !== -1) {
      workspaces[index] = { ...workspaces[index], ...updatedWorkspace };
      await chrome.storage.local.set({ workspaces });
      return workspaces[index];
    }
    return null;
  }

  getContextDisplayName(context) {
    const names = {
      'work': '💼 Work', 'shopping': '🛒 Shopping', 'research': '📚 Research',
      'travel': '✈️ Travel', 'entertainment': '🎬 Entertainment'
    };
    return names[context] || `📁 ${context.charAt(0).toUpperCase() + context.slice(1)}`;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

const contextFlow = new ContextFlow();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      let result;
      switch (request.action) {
        case 'createWorkspace':
          result = await contextFlow.createWorkspace(request.name, request.context);
          break;
        case 'switchWorkspace':
          result = await contextFlow.switchWorkspace(request.workspaceId);
          break;
        case 'deleteWorkspace':
          result = await contextFlow.deleteWorkspace(request.workspaceId);
          break;
        case 'brainDump':
          result = await contextFlow.handleBrainDump(request.text, request.url, request.title);
          break;
        case 'updateWorkspace':
          result = await contextFlow.updateWorkspace(request.workspace);
          break;
        default:
          throw new Error(`Unknown action: ${request.action}`);
      }
      sendResponse({ success: true, data: result });
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true;
});
