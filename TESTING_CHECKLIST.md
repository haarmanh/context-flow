# 🧪 Context Flow Testing Checklist

## Pre-Testing Setup
- [ ] Icons added to `images/` folder (icon16.png, icon48.png, icon128.png)
- [ ] Extension loaded in Chrome developer mode
- [ ] No console errors on extension load

## Core Functionality Tests

### 1. Extension Installation & Initialization
- [ ] Extension loads without errors
- [ ] Default "General" workspace is created
- [ ] Popup opens when clicking extension icon
- [ ] All UI elements are visible and properly styled

### 2. Workspace Management
- [ ] Create new workspace via "+ New" button
- [ ] Workspace dropdown populates correctly
- [ ] Switch between workspaces
- [ ] Delete workspace (confirm only when >1 workspace exists)
- [ ] Workspace names display correctly with emojis

### 3. Tab Organization
- [ ] Visit work-related sites (GitHub, Slack) - should auto-detect "Work" context
- [ ] Visit shopping sites (Amazon, eBay) - should auto-detect "Shopping" context
- [ ] Visit research sites (Wikipedia, Stack Overflow) - should auto-detect "Research" context
- [ ] Visit travel sites (Booking.com, Expedia) - should auto-detect "Travel" context
- [ ] Visit entertainment sites (YouTube, Netflix) - should auto-detect "Entertainment" context
- [ ] Tabs appear in correct workspace automatically
- [ ] Tab count badge updates correctly
- [ ] Click on tab in list opens the URL
- [ ] Remove tab from workspace works

### 4. Notes Functionality
- [ ] Type in notes area
- [ ] Save indicator appears when typing
- [ ] Notes persist when switching workspaces
- [ ] Notes save automatically after 1 second
- [ ] Save indicator disappears after saving

### 5. Brain Dump Feature
- [ ] Press `Ctrl+Shift+Space` on a regular website
- [ ] Brain dump overlay appears
- [ ] Type text and click "Save to Workspace"
- [ ] Note appears in current workspace with timestamp
- [ ] Press `Escape` to cancel brain dump
- [ ] Try on Chrome system pages (should fail gracefully)

### 6. Settings Panel
- [ ] Click settings gear icon
- [ ] Settings panel slides in from right
- [ ] Toggle auto-detection on/off
- [ ] Toggle smart suggestions on/off
- [ ] Change max tabs per workspace
- [ ] Settings persist after closing popup
- [ ] Close settings panel with X or Escape

### 7. Keyboard Shortcuts
- [ ] `Ctrl+Shift+Space` opens brain dump
- [ ] `Ctrl+Shift+W` opens popup
- [ ] `Escape` closes modals and settings

### 8. Action Buttons
- [ ] "Open All Tabs" opens all workspace tabs
- [ ] "Clear Tabs" removes all tabs from workspace (with confirmation)
- [ ] Delete workspace button only shows when >1 workspace exists

## Edge Cases & Error Handling

### 9. Data Persistence
- [ ] Close and reopen popup - data persists
- [ ] Restart Chrome - workspaces and notes remain
- [ ] Create many workspaces - performance remains good
- [ ] Add many tabs to workspace - UI handles overflow

### 10. Error Scenarios
- [ ] Invalid URLs don't crash the extension
- [ ] Missing favicons fall back to default icon
- [ ] Network errors don't break functionality
- [ ] Rapid clicking doesn't cause issues
- [ ] Large amounts of text in notes work properly

### 11. UI/UX Testing
- [ ] All animations work smoothly
- [ ] Modal overlays display correctly
- [ ] Scrolling works in tab lists
- [ ] Hover effects work on all interactive elements
- [ ] Text is readable and properly sized
- [ ] Colors and contrast are appropriate

### 12. Performance Testing
- [ ] Extension doesn't slow down browsing
- [ ] Memory usage stays reasonable
- [ ] No memory leaks after extended use
- [ ] Fast response times for all actions

## Browser Compatibility
- [ ] Works in Chrome (primary target)
- [ ] Test in different Chrome versions if possible
- [ ] Test on different operating systems (Windows, Mac, Linux)

## Final Checks
- [ ] No console errors in background script
- [ ] No console errors in popup
- [ ] All features work as expected
- [ ] Privacy policy is accurate
- [ ] README is complete and accurate
- [ ] Store listing content is compelling

## Post-Testing
- [ ] Document any bugs found
- [ ] Fix critical issues
- [ ] Verify fixes work
- [ ] Ready for Chrome Web Store submission

---

**Note**: Complete this checklist thoroughly before submitting to Chrome Web Store. Each item should be tested multiple times to ensure reliability.
