class ModalManager {
    static show(modalElement) {
        modalElement.style.display = 'flex';
        // Force reflow to trigger animation
        modalElement.offsetHeight; 
        modalElement.classList.add('visible');
    }

    static hide(modalElement) {
        modalElement.classList.remove('visible');
        setTimeout(() => {
            if (!modalElement.classList.contains('visible')) {
                modalElement.style.display = 'none';
            }
        }, 200); // Match CSS transition duration
    }

    static setupBackdropClose(modalElement, hideCallback) {
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                hideCallback();
            }
        });
    }
}

class ErrorHandler {
    static show(message, type = 'error') {
        let toast = document.getElementById('errorToast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `error-toast ${type} visible`;
        
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 4000);
    }
}

class PopupController {
    constructor() {
        this.currentWorkspace = null;
        this.workspaces = [];
        this.settings = {};
        this.notesTimeout = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadData();
    }

    initializeElements() {
        // Main elements
        this.workspaceDropdown = document.getElementById('workspaceDropdown');
        this.workspaceIndicator = document.getElementById('workspaceIndicator');
        this.tabsList = document.getElementById('tabsList');
        this.tabCount = document.getElementById('tabCount');
        this.notesArea = document.getElementById('notesArea');
        this.saveNotesBtn = document.getElementById('saveNotesBtn');

        // Buttons
        this.newWorkspaceBtn = document.getElementById('newWorkspaceBtn');
        this.openAllTabsBtn = document.getElementById('openAllTabsBtn');
        this.clearWorkspaceBtn = document.getElementById('clearWorkspaceBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.deleteWorkspaceBtn = document.getElementById('deleteWorkspaceBtn');

        // New Workspace Modal
        this.modal = document.getElementById('newWorkspaceModal');
        this.workspaceNameInput = document.getElementById('workspaceNameInput');
        this.contextSelect = document.getElementById('contextSelect');
        this.createBtn = document.getElementById('createBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');

        // Confirmation modal
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmTitle = document.getElementById('confirmTitle');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.confirmOkBtn = document.getElementById('confirmOkBtn');
        this.confirmCancelBtn = document.getElementById('confirmCancelBtn');
        this.confirmCloseBtn = document.getElementById('confirmCloseBtn');

        // Settings panel
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.autoDetectionToggle = document.getElementById('autoDetectionToggle');
        this.smartSuggestionsToggle = document.getElementById('smartSuggestionsToggle');
        this.maxTabsInput = document.getElementById('maxTabsInput');
    }

    setupEventListeners() {
        this.workspaceDropdown.addEventListener('change', (e) => this.switchWorkspace(e.target.value));
        this.newWorkspaceBtn.addEventListener('click', () => this.showNewWorkspaceModal());
        this.createBtn.addEventListener('click', () => this.createWorkspace());
        this.cancelBtn.addEventListener('click', () => this.hideNewWorkspaceModal());
        this.closeModalBtn.addEventListener('click', () => this.hideNewWorkspaceModal());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.hideSettings());

        this.confirmOkBtn.addEventListener('click', () => {
            if (this.pendingConfirmAction) this.pendingConfirmAction();
            this.hideConfirmModal();
        });
        this.confirmCancelBtn.addEventListener('click', () => this.hideConfirmModal());
        this.confirmCloseBtn.addEventListener('click', () => this.hideConfirmModal());

        this.openAllTabsBtn.addEventListener('click', () => this.openAllTabs());
        this.clearWorkspaceBtn.addEventListener('click', () => this.confirmClearWorkspace());
        this.deleteWorkspaceBtn.addEventListener('click', () => this.confirmDeleteWorkspace());

        this.notesArea.addEventListener('input', () => this.debounceNoteSave());
        this.autoDetectionToggle.addEventListener('change', () => this.updateSettings());
        this.smartSuggestionsToggle.addEventListener('change', () => this.updateSettings());
        this.maxTabsInput.addEventListener('change', () => this.updateSettings());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideNewWorkspaceModal();
                this.hideConfirmModal();
                this.hideSettings();
            }
        });

        ModalManager.setupBackdropClose(this.modal, () => this.hideNewWorkspaceModal());
        ModalManager.setupBackdropClose(this.confirmModal, () => this.hideConfirmModal());

        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && (changes.workspaces || changes.activeWorkspaceId)) {
                this.loadData();
            }
        });
    }

    async loadData() {
        try {
            const data = await chrome.storage.local.get(['workspaces', 'activeWorkspaceId', 'settings']);
            
            this.workspaces = data.workspaces || [];
            this.settings = data.settings || {
                autoDetection: true, smartSuggestions: true, maxTabsPerWorkspace: 20
            };

            this.autoDetectionToggle.checked = this.settings.autoDetection;
            this.smartSuggestionsToggle.checked = this.settings.smartSuggestions;
            this.maxTabsInput.value = this.settings.maxTabsPerWorkspace;
            
            const activeWorkspaceId = data.activeWorkspaceId;
            this.currentWorkspace = this.workspaces.find(w => w.id === activeWorkspaceId) || this.workspaces[0] || null;

            this.populateWorkspaceDropdown();
            this.updateUI();
        } catch (error) {
            console.error('Error loading data:', error);
            ErrorHandler.show('Could not load workspace data.');
        }
    }

    populateWorkspaceDropdown() {
        this.workspaceDropdown.innerHTML = '';
        
        if (this.workspaces.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No workspaces';
            this.workspaceDropdown.appendChild(option);
            return;
        }

        this.workspaces.forEach(workspace => {
            const option = document.createElement('option');
            option.value = workspace.id;
            option.textContent = workspace.name;
            if (this.currentWorkspace && workspace.id === this.currentWorkspace.id) {
                option.selected = true;
            }
            this.workspaceDropdown.appendChild(option);
        });
    }

    updateUI() {
        this.deleteWorkspaceBtn.style.display = this.workspaces.length > 1 ? 'block' : 'none';

        if (!this.currentWorkspace) {
            this.workspaceIndicator.textContent = '...';
            this.tabCount.textContent = '0';
            this.tabsList.innerHTML = '<div class="empty-state">Create a workspace to get started</div>';
            this.notesArea.value = '';
            this.notesArea.disabled = true;
            return;
        }
        
        this.notesArea.disabled = false;
        this.workspaceIndicator.textContent = this.getContextEmoji(this.currentWorkspace.context);
        this.tabCount.textContent = this.currentWorkspace.tabs.length.toString();
        this.renderTabsList();
        this.notesArea.value = this.currentWorkspace.notes || '';
    }

    renderTabsList() {
        if (!this.currentWorkspace || this.currentWorkspace.tabs.length === 0) {
            this.tabsList.innerHTML = '<div class="empty-state">No tabs in this workspace yet</div>';
            return;
        }

        const tabsHTML = this.currentWorkspace.tabs.map((tab, index) => this.createTabHTML(tab, index)).join('');
        this.tabsList.innerHTML = tabsHTML;

        this.tabsList.querySelectorAll('.tab-item').forEach(element => {
            element.querySelector('.tab-info').addEventListener('click', (e) => {
                this.openTab(e.currentTarget.dataset.url);
            });
            element.querySelector('.tab-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTab(parseInt(e.currentTarget.dataset.index));
            });
        });
    }

    createTabHTML(tab, index) {
        const favicon = tab.favicon || 'icons/icon16.png';
        const title = tab.title || 'Untitled';
        let url;
        try {
            url = new URL(tab.url).hostname;
        } catch (e) {
            url = tab.url || 'Invalid URL';
        }

        return `
            <div class="tab-item">
                <img class="tab-favicon" src="${favicon}" alt="" onerror="this.src='icons/icon16.png'">
                <div class="tab-info" data-url="${this.escapeHtml(tab.url)}">
                    <div class="tab-title">${this.escapeHtml(title)}</div>
                    <div class="tab-url">${this.escapeHtml(url)}</div>
                </div>
                <button class="tab-remove" title="Remove tab" data-index="${index}">×</button>
            </div>
        `;
    }

    async switchWorkspace(workspaceId) {
        if (!workspaceId) return;
        this.sendMessage({ action: 'switchWorkspace', workspaceId });
    }

    showConfirmation(title, message, onConfirm) {
        this.confirmTitle.textContent = title;
        this.confirmMessage.textContent = message;
        this.pendingConfirmAction = onConfirm;
        ModalManager.show(this.confirmModal);
    }

    hideConfirmModal() {
        ModalManager.hide(this.confirmModal);
        this.pendingConfirmAction = null;
    }

    confirmClearWorkspace() {
        if (!this.currentWorkspace || this.currentWorkspace.tabs.length === 0) return;
        this.showConfirmation(
            'Clear Tabs',
            `Remove all ${this.currentWorkspace.tabs.length} tabs from "${this.currentWorkspace.name}"?`,
            () => this.clearWorkspaceTabs()
        );
    }

    confirmDeleteWorkspace() {
        if (!this.currentWorkspace || this.workspaces.length <= 1) return;
        this.showConfirmation(
            'Delete Workspace',
            `Permanently delete workspace "${this.currentWorkspace.name}" and its ${this.currentWorkspace.tabs.length} tabs?`,
            () => this.deleteWorkspace()
        );
    }

    async deleteWorkspace() {
        if (!this.currentWorkspace) return;
        this.sendMessage({ action: 'deleteWorkspace', workspaceId: this.currentWorkspace.id });
    }

    showNewWorkspaceModal() {
        ModalManager.show(this.modal);
        this.workspaceNameInput.value = '';
        this.contextSelect.value = 'general';
        this.workspaceNameInput.focus();
    }

    hideNewWorkspaceModal() {
        ModalManager.hide(this.modal);
    }

    async createWorkspace() {
        const name = this.workspaceNameInput.value.trim();
        if (!name) {
            this.workspaceNameInput.focus();
            return;
        }
        await this.sendMessage({
            action: 'createWorkspace', name, context: this.contextSelect.value
        });
        this.hideNewWorkspaceModal();
    }

    showSettings() {
        this.settingsPanel.classList.add('visible');
    }
    hideSettings() {
        this.settingsPanel.classList.remove('visible');
    }

    async updateSettings() {
        this.settings = {
            autoDetection: this.autoDetectionToggle.checked,
            smartSuggestions: this.smartSuggestionsToggle.checked,
            maxTabsPerWorkspace: parseInt(this.maxTabsInput.value) || 20
        };
        await chrome.storage.local.set({ settings: this.settings });
        ErrorHandler.show('Settings saved!', 'success');
    }

    async openAllTabs() {
        if (!this.currentWorkspace || this.currentWorkspace.tabs.length === 0) return;
        for (const tab of this.currentWorkspace.tabs) {
            chrome.tabs.create({ url: tab.url, active: false });
        }
        window.close();
    }

    async clearWorkspaceTabs() {
        if (!this.currentWorkspace) return;
        this.currentWorkspace.tabs = [];
        await this.sendMessage({
            action: 'updateWorkspace',
            workspace: this.currentWorkspace
        }); // A new action might be needed here
        this.updateUI(); // Immediate UI feedback
    }

    async removeTab(index) {
        if (!this.currentWorkspace) return;
        this.currentWorkspace.tabs.splice(index, 1);
        await this.saveNotes(); // Save the whole workspace state
        this.updateUI();
    }

    openTab(url) {
        chrome.tabs.create({ url });
        window.close();
    }

    debounceNoteSave() {
        this.saveNotesBtn.style.display = 'block';
        if (this.notesTimeout) clearTimeout(this.notesTimeout);
        this.notesTimeout = setTimeout(() => this.saveNotes(), 1000);
    }

    async saveNotes() {
        if (!this.currentWorkspace) return;
        this.currentWorkspace.notes = this.notesArea.value;
        await chrome.storage.local.set({ workspaces: this.workspaces });
        this.saveNotesBtn.style.display = 'none';
    }

    async sendMessage(message) {
        try {
            const response = await chrome.runtime.sendMessage(message);
            if (!response.success) {
                ErrorHandler.show(response.error || 'An unknown error occurred.');
            }
        } catch (error) {
            console.error(`Error sending message: ${message.action}`, error);
            ErrorHandler.show('Communication with background failed.');
        }
    }

    getContextEmoji(context) {
        const emojis = {
            'work': '💼', 'shopping': '🛒', 'research': '📚',
            'travel': '✈️', 'entertainment': '🎬', 'general': '📁'
        };
        return emojis[context] || '📁';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
