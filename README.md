# 🌊 Context Flow - Intelligent Browser Workspace Manager

Transform your browser chaos into organized workspaces with AI-powered context detection and seamless tab management.

## 🚀 Features

### 🧠 AI-Powered Context Detection
- Automatically detects browsing contexts (work, shopping, research, travel, entertainment)
- Creates relevant workspaces without manual effort
- Smart pattern recognition based on URLs and page titles

### 📁 Dynamic Workspaces
- Organize tabs by context automatically
- Integrated note-taking for each workspace
- Persistent storage across browser sessions
- Easy workspace switching with one click

### ⚡ Brain Dump Feature
- Quick capture with `Ctrl+Shift+Space` keyboard shortcut
- Automatically saves notes to the relevant workspace
- Works on any website

### 🎯 Additional Features
- Modern glassmorphism UI design
- Privacy-first (all data stored locally)
- Keyboard shortcuts for power users
- Settings panel for customization
- Tab management with click-to-open and remove

## 🛠️ Installation

### For Development
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the project folder
5. The extension will appear in your toolbar

### For Users
*Coming soon to Chrome Web Store*

## 📁 Project Structure

```
Context Flow/
├── manifest.json          # Extension configuration
├── background.js          # Service worker with AI logic
├── popup.html            # Extension popup interface
├── popup.css             # Styling with modern design
├── popup.js              # Frontend JavaScript logic
├── images/               # Extension icons
├── PRIVACY_POLICY.md     # Privacy policy
├── STORE_LISTING.md      # Chrome Web Store content
└── README.md            # This file
```

## ⌨️ Keyboard Shortcuts

- `Ctrl+Shift+Space` (or `Cmd+Shift+Space` on Mac) - Brain Dump
- `Ctrl+Shift+W` (or `Cmd+Shift+W` on Mac) - Quick Workspace Switcher

## 🔧 Technical Details

### Built With
- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No external dependencies
- **Chrome Storage API** - Local data persistence
- **Chrome Tabs API** - Tab management
- **Chrome Scripting API** - Content injection for brain dump

### Context Detection Patterns
The extension recognizes contexts based on:
- **Work**: GitHub, Slack, Jira, Google Workspace, etc.
- **Shopping**: Amazon, eBay, retail websites
- **Research**: Wikipedia, Stack Overflow, academic sites
- **Travel**: Booking sites, airline websites, travel guides
- **Entertainment**: Netflix, YouTube, gaming sites

## 🔒 Privacy & Security

- **100% Local Storage** - No data sent to external servers
- **No Tracking** - We don't collect analytics or usage data
- **Secure** - Uses Chrome's built-in security mechanisms
- **GDPR Compliant** - Respects user privacy rights

## 🐛 Known Issues

- Icons need to be added to the `images/` folder
- Brain dump doesn't work on Chrome system pages (chrome://, chrome-extension://)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the need for better browser organization
- Built with modern web technologies
- Designed for productivity and focus

---

**Transform your browser experience with Context Flow!**
