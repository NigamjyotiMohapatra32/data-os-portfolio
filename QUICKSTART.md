# 🚀 Quick Start Guide - Enhanced Data OS

## First Time Setup

1. **Navigate to project directory**
   ```bash
   cd path/to/data-os-portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Dev URL: http://localhost:5173
   - Or click the link shown in terminal

---

## Accessing the Workspace

### From Portfolio:
1. Scroll down to **Hero Section**
2. Click the **"⚡ Launch Data OS"** button
3. Watch the boot animation (2.5 seconds)
4. Enter the enhanced workspace

### Direct Navigation:
- Type `/workspace` in the URL if needed

---

## 🎯 Your First 5 Minutes

### Minute 1: Explore the Sidebar
- 👀 Look at the **left sidebar** with 7 colored buttons
- 🔵 Click **ER Diagram** (cyan) - Entity modeler
- 🟢 Click **SQL Editor** (emerald) - Query builder
- Each has a different color for quick recognition

### Minute 2: Try the Pomodoro Timer
- ⏱️ Look at the **right sidebar**
- 🍅 Click **"▶ Start"** on the timer
- ⏸️ Watch the circular progress fill up
- 🔄 Click **"Reset"** to restart

### Minute 3: Create a Note
- 📝 Click **Notes** button (purple) in sidebar
- Type a **title**: "My First Note"
- Type **content**: "This is a sticky note"
- Click a **color circle** to choose theme
- Click **"+ Add"** to save
- ✨ Your note appears as a colorful card!

### Minute 4: Save a SQL Snippet
- 📌 Click **Snippets** button (teal) in sidebar
- Copy this SQL into the code area:
  ```sql
  SELECT customer_id, COUNT(*) as orders
  FROM orders
  GROUP BY customer_id
  ```
- Type **name**: "Customer Order Count"
- Click **"+ Save Snippet"**
- Click **"Copy"** button to reuse anytime

### Minute 5: Check Performance Dashboard
- 📊 Click **Dashboard** button (magenta) in sidebar
- View 6 **colorful metric cards**
- Scroll down to see **recent activity timeline**
- Each card shows a **trend indicator**

---

## ⌨️ Keyboard Shortcuts (Must Know)

### Navigation
| Shortcut | Action |
|----------|--------|
| **⌘K** | Open Command Palette |
| **⌘⇧?** | Show All Shortcuts |
| **Esc** | Close any modal |

### Quick Panel Access
| Shortcut | Destination |
|----------|-------------|
| **⌘D** | ER Diagram |
| **⌘S** | SQL Editor |
| **⌘T** | Tasks |
| **⌘N** | Notes |
| **⌘H** | Query History |
| **⌘/** | Snippets |
| **⌘P** | Dashboard |

### Pro Tip
- Press **⌘K** right now to open Command Palette
- Type "notes" to jump directly to notes panel
- Use **↑↓ arrows** to navigate
- Press **Enter** to select

---

## 📋 Feature Quick Reference

### 🍅 Pomodoro Timer
- **Location:** Right sidebar
- **Duration:** 25 minutes
- **How to use:** Click Start → Work → Get notification when done
- **Benefits:** Focus in intervals, track productivity

### 📝 Notes Panel
- **Location:** Left sidebar, purple button
- **Colors:** 7 vibrant themes to choose from
- **How to use:** Add title → Add content → Pick color → Save
- **Pro tip:** Organize notes by color (red for urgent, green for completed)

### ⏱️ Query History
- **Location:** Left sidebar, pink button
- **Auto-tracks:** Every query you run
- **How to use:** Click "📋 Copy" to reuse queries
- **Clear:** Click "Clear" button to reset

### 📌 Saved Snippets
- **Location:** Left sidebar, teal button
- **Pre-loaded:** 3 example snippets included
- **How to use:** Click "Copy" to insert into SQL editor
- **Save new:** Type SQL → Name it → Save

### 📊 Dashboard
- **Location:** Left sidebar, magenta button
- **Shows:** 6 key metrics with color gradients
- **Timeline:** Recent activity with timestamps
- **Update frequency:** Real-time as you work

### ⌘K Command Palette
- **Trigger:** Press **⌘K** (Ctrl+K on Windows)
- **Type to search:** Fuzzy matching on command names
- **Navigate:** Use arrow keys
- **Select:** Press Enter
- **13 commands** available including all panels

### ⌨️ Keyboard Shortcuts Modal
- **Trigger:** Press **⌘⇧?** (Ctrl+Shift+? on Windows)
- **View:** All 13 keyboard shortcuts at a glance
- **Search-friendly:** Organized by category
- **Always available:** From any panel

### 🔔 Toast Notifications
- **Success:** Green toast with ✓
- **Error:** Red toast with ✕
- **Info:** Blue toast with ℹ
- **Auto-dismiss:** Disappears after 3 seconds

---

## 💡 Pro Tips & Tricks

### Tip 1: Sidebar Shortcuts
Each sidebar button has a **keyboard shortcut**. Look for:
- **⌘D** next to ER Diagram button
- **⌘S** next to SQL Editor button
- etc.

### Tip 2: Color Coding
- **Cyan** = Data modeled (ER diagrams, searches)
- **Green** = Ready/Success (SQL editor, tasks done)
- **Yellow** = Attention (tasks, important notes)
- **Purple** = Creative (notes, ideas)
- **Pink** = Historical (past queries, archive)
- **Teal** = Code storage (snippets, templates)
- **Magenta** = Performance (dashboard, metrics)

### Tip 3: Workflow Pattern
```
1. Click ⌘N to open Notes
2. Plan your work in a purple note
3. Click ⌘S to go to SQL Editor
4. Write or copy (⌘/) a snippet
5. Click ⌘⏱ then Start Pomodoro
6. Execute query and check ⌘H History
7. At end of day, click ⌘P Dashboard
```

### Tip 4: Copy Clipboard Actions
- All query history items have **📋 Copy** button
- All snippets have **Copy** button
- Copies to clipboard automatically
- Paste with **Ctrl+V** or **Cmd+V**

### Tip 5: Modal Stacking
- **Close any modal** with **Esc** key
- Modals are: Command Palette, Shortcuts, your work panels
- Only one modal at a time

---

## 🎨 Understanding the Color System

### Color Meanings
```
🔵 Cyan (#22d3ee)     = Information, Primary action
🟢 Emerald (#34d399)  = Success, Confirmed
🟡 Amber (#fbbf24)    = Caution, Tasks pending
🟣 Purple (#a78bfa)   = Creative, Notes & ideas
🩷 Pink (#f472b6)     = History, Timeline, Archive
🌿 Teal (#06d6a0)     = Repository, Code storage
🔴 Magenta (#ff006e)  = Performance, Metrics, Focus
```

### Visual Feedback
- **Hover:** Cards lift up and glow brighter
- **Active:** Glowing dot indicator on sidebar
- **Borders:** Colored borders match panel theme
- **Shadows:** Colored glows around interactive elements

---

## 🐛 Troubleshooting

### "I don't see the new features"
1. Make sure you're on the latest files
2. Hard refresh browser (**Ctrl+Shift+R** or **Cmd+Shift+R**)
3. Check that `/workspace` route is active

### "Shortcuts aren't working"
- Windows/Linux: Use **Ctrl+K** (not Cmd+K)
- Mac: Use **Cmd+K**
- Make sure workspace is focused (click anywhere first)

### "Styles look wrong"
- Try refreshing page
- Check browser zoom is 100%
- Clear browser cache

### "Toasts not showing"
- Check bottom-right corner of screen
- Run a query to trigger "success" toast
- May be hidden behind other elements

---

## 📊 Sample Workflows

### Workflow 1: Quick Note Session (2 min)
```
1. Press ⌘N → Go to Notes
2. Click purple color
3. Title: "Morning Standup Notes"
4. Add: "Completed ER diagram review"
5. Click "+ Add"
6. Done!
```

### Workflow 2: SQL Snippet Reuse (3 min)
```
1. Press ⌘/ → Go to Snippets
2. Click "Copy" on "Window Function Example"
3. Press ⌘S → Go to SQL Editor
4. Paste with Cmd+V / Ctrl+V
5. Modify if needed
6. Run Query
```

### Workflow 3: Productivity Session (30 min)
```
1. Press ⌘N → Create a note of tasks
2. Press ⌘T → Open Tasks, list them
3. Press ⌘K → Command Palette
4. Type "Pomodoro" to find timer
5. Click "Start" for 25-min focus
6. Work on your SQL queries
7. After 25 min, get notification
8. Take a break
9. Press ⌘P → View Dashboard for stats
```

### Workflow 4: Query Archaeology (2 min)
```
1. Press ⌘H → Go to Query History
2. Find old query in list
3. Click "📋 Copy" button
4. Press ⌘S → SQL Editor
5. Paste and run again
6. Modify as needed
```

---

## 🎯 Next Steps After Quick Start

1. **Save Snippets** - Add your own SQL templates
2. **Organize Notes** - Use colors to categorize
3. **Track with Pomodoro** - Build focus habit
4. **Use Keyboard Shortcuts** - Speed up workflow
5. **Monitor Dashboard** - Check productivity trends
6. **Export Diagrams** - Save your ER models (future feature)

---

## 📞 Need Help?

- **Keyboard Shortcuts:** Press **⌘⇧?**
- **Command Palette:** Press **⌘K** and type what you need
- **Exit Workspace:** Click **"✕ Exit System"** button
- **Return to Portfolio:** You'll go back to the main page

---

## 🎉 You're Ready!

You now know how to use the enhanced Data OS workspace. Start with one feature and expand from there. Most importantly:

✅ Use **⌘K** for quick navigation  
✅ Press **⌘⇧?** to view shortcuts  
✅ Choose panel by **color** or **keyboard shortcut**  
✅ Enjoy the **vibrant, colorful** interface!

**Happy modeling! 🚀**

