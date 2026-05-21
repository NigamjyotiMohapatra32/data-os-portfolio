# Data OS Portfolio - Nigamjyoti Mohapatra

An interactive, immersive portfolio for a Data Engineer / Data Modeler featuring a dedicated "Launch Data OS" button that opens a fully functional data workspace.

## 🚀 Features

### Portfolio Landing Page
- ✨ Boot sequence animation
- 📊 Career pipeline visualization
- 🎯 Skills & projects showcase
- 💻 Interactive SQL playground
- 🎨 Dark theme with neon accents (cyberpunk mode available)
- 📱 Fully responsive design

### Data OS Workspace (`/workspace`)
- ⚡ **Boot Animation** - System startup sequence (2.5 seconds)
- 🎨 **Enhanced UI** - Vibrant glassmorphic design with gradient backgrounds
- 📐 **ER Diagram Canvas** - Fully draggable/drawable entity-relationship diagramming
  - Add entities dynamically
  - Draw relationships (1:N, M:N, 1:1)
  - Visual connection labels
  - Delete entities
- 🔍 **SQL Editor** - Interactive SQL compiler with syntax highlighting
  - Pre-built SQL templates
  - Query execution simulation
  - Results table rendering
  - Execution time tracking
- ⏰ **Real-time Clock Widget** - Live time, date, timezone display
- ✓ **Tasks Widget** - Full task management with progress tracking
  - Add/complete/delete tasks
  - Progress percentage
  - Task status indicators
- 🍅 **Pomodoro Timer** - 25-minute focus sessions with circular progress
  - Start/pause/reset controls
  - Session counter
  - Completion notifications
- 📝 **Colorful Notes Panel** - Sticky notes with 7 color themes
  - Create and organize notes
  - Color-coded by theme
  - Delete functionality
  - Responsive grid layout
- ⏱️ **Query History** - Track all executed queries
  - Copy to clipboard functionality
  - Timestamp tracking
  - Clear all history option
- 📌 **Saved Snippets** - SQL code snippet library
  - Save frequently used SQL
  - Copy and reuse snippets
  - Syntax highlighting
- 📊 **Performance Dashboard** - Real-time metrics visualization
  - 6 key metrics with trends (Queries Today, Avg Query Time, Models Created, Data Processed, Uptime, CPU Usage)
  - Recent activity timeline
  - Colorful metric cards with gradients
- ⌘K **Command Palette** - Quick navigation and panel switching
  - Fuzzy search filtering
  - Arrow key navigation
  - Press ⌘K to open
- ⌨️ **Keyboard Shortcuts** - Full shortcut reference
  - Press ⌘⇧? to open shortcuts modal
  - Quick access guides
- 🔔 **Toast Notifications** - Real-time feedback system
  - Success, error, and info messages
  - Auto-dismiss after 3 seconds
  - Smooth animations
- 📊 **Quick Stats Widget** - Session metrics
  - Models Built counter
  - Queries Executed counter
  - Productivity Score
- 🚪 **Exit System Button** - Return to portfolio homepage

## 📋 Project Structure

```
├── index.html                 # Entry point
├── index.jsx                 # React entry
├── App.jsx                   # Router setup
├── vite.config.js           # Build configuration
├── package.json             # Dependencies
├── styles.css               # Global styles
│
├── pages/
│   ├── Portfolio.jsx        # Landing page
│   └── Workspace.jsx        # Data OS interface
│
└── components/
    ├── HeroSection.jsx
    ├── AboutSection.jsx
    ├── SkillsSection.jsx
    ├── ProjectsSection.jsx
    ├── TimelineSection.jsx
    ├── SQLPlayground.jsx
    ├── ContactSection.jsx
    ├── Navigation.jsx
    ├── BootScreen.jsx
    ├── BackgroundCanvas.jsx
    │
    └── workspace/
        ├── BootAnimation.jsx
        ├── EnhancedWorkspace.jsx     (✨ Main container)
        ├── EnhancedSidebar.jsx       (✨ New colorful sidebar)
        ├── EnhancedWorkspace.css     (Workspace styles)
        ├── Header.jsx
        ├── ERDiagramCanvas.jsx
        ├── SQLEditor.jsx
        ├── ClockWidget.jsx
        ├── TasksWidget.jsx
        ├── PomodoroTimer.jsx         (✨ NEW - Focus timer)
        ├── NotesPanel.jsx            (✨ NEW - Sticky notes)
        ├── QueryHistory.jsx          (✨ NEW - Query tracking)
        ├── SavedSnippets.jsx         (✨ NEW - Code snippets)
        ├── PerformanceDashboard.jsx  (✨ NEW - Metrics & stats)
        ├── CommandPalette.jsx        (✨ NEW - Quick navigation)
        ├── KeyboardShortcuts.jsx     (✨ NEW - Shortcuts reference)
        └── Toast.jsx                 (✨ NEW - Notifications)
```

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js 16+ installed
- npm or yarn

### 2. Installation

```bash
# Navigate to the project directory
cd path/to/project

# Install dependencies
npm install
```

### 3. Development Server

```bash
# Start dev server (http://localhost:3000)
npm run dev
```

The app will open automatically in your browser.

### 4. Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 How to Use

### Landing Page
1. **Scroll through sections** - Explore about, skills, projects, timeline
2. **Click "Launch Data OS"** button in hero section
3. **Watch boot sequence** - 2.5 second system startup animation
4. **Enter workspace** - Full interactive data modeling environment

### Workspace Features

#### ER Diagram Canvas
- Click **"+ Add Entity"** to create new tables
- **Drag entities** to reposition them
- **Relationships** drawn automatically between connected entities
- **Delete button** on each entity to remove it
- Visual feedback with hover effects and connection labels

#### SQL Editor
- Select **pre-built templates** or write custom SQL
- Click **"▶ Run Query"** to execute
- View **results in table format**
- See **execution time** for each query

#### Tasks Widget
- Type task and press Enter or click **"Add"**
- Click checkbox to **mark complete**
- Click **"✕"** to delete task
- **Progress bar** shows overall completion percentage

#### Clock Widget
- Real-time **HH:MM:SS** display
- Current **date and timezone** (IST)
- Updates every second

### Pomodoro Timer
- Click **"▶ Start"** to begin 25-minute focus session
- Click **"⏸ Pause"** to pause the timer
- Click **"🔄 Reset"** to restart
- Receive **toast notification** when session completes
- Counter shows **sessions completed**

### Notes Panel
- Type **note title** and content
- Click colored circles to choose **7 vibrant colors**
- Click **"+ Add"** to save note
- View notes in **responsive grid layout**
- Click **"✕"** to delete note

### Query History
- Every SQL query is **automatically tracked**
- Click **"📋 Copy"** to copy query to clipboard
- Click **"Clear"** button to delete all history
- Timestamps show when queries were executed

### Saved Snippets
- Type **snippet name** and SQL code
- Click **"+ Save Snippet"** to store
- Click **"Copy"** button to reuse snippets
- View syntax-highlighted code preview

### Performance Dashboard
- View **6 real-time metrics** with color gradients
- Check **recent activity timeline**
- Track productivity with **trend indicators**
- All data updates in real-time

### Keyboard Shortcuts
- **⌘K** - Open Command Palette for quick navigation
- **⌘⇧?** - Show keyboard shortcuts reference
- **↑↓** - Navigate in lists and command palette
- **⏎** - Select item from lists
- **Esc** - Close modals and dialogs
- **Tab** - Switch between panels
- **⌘D** - Go to ER Diagram
- **⌘S** - Go to SQL Editor
- **⌘T** - Go to Tasks
- **⌘N** - Go to Notes
- **⌘H** - Go to History
- **⌘/** - Go to Snippets
- **⌘P** - Go to Dashboard

### Navigation
- **Left Sidebar** - 7 colored buttons for each panel
  - 🔵 ER Diagram (Cyan #22d3ee)
  - 🟢 SQL Editor (Emerald #34d399)
  - 🟡 Tasks (Amber #fbbf24)
  - 🟣 Notes (Purple #a78bfa)
  - 🩷 History (Pink #f472b6)
  - 🌿 Snippets (Teal #06d6a0)
  - 🔴 Dashboard (Magenta #ff006e)
- **Top Header** - System status and live metrics
- **Right Sidebar** - Clock, Pomodoro timer, and quick stats
- **⌨ Shortcuts button** - Quick access to keyboard shortcuts
- **✕ Exit System** button - Return to portfolio homepage

## 🎨 Customization

### Colors & Theme
Edit `styles.css` to modify color variables:
```css
:root {
  --c-cyan: #22d3ee;      /* Primary accent */
  --c-lime: #34d399;      /* Success color */
  --c-violet: #a78bfa;    /* Secondary accent */
  --c-rose: #f472b6;      /* Danger color */
}

body.cyber {
  --c-cyan: #00fff0;      /* Cyberpunk cyan */
  --c-violet: #ff00ff;    /* Cyberpunk magenta */
  /* ... more cyberpunk colors */
}
```

### Content Updates
- **Portfolio content** - Edit components in `components/`
- **ER Diagram defaults** - Modify `ERDiagramCanvas.jsx`
- **SQL templates** - Update `SQLEditor.jsx`

## 🔧 Key Components Explained

### ERDiagramCanvas.jsx
- State management for entities and relations
- Mouse event handlers for drag-and-drop
- SVG rendering for connections
- Dynamic entity creation/deletion

### SQLEditor.jsx
- SQL template system
- Query execution simulation
- Results table generation
- Execution timing

### BootAnimation.jsx
- Sequential message display
- Progress bar animation
- 2.5 second duration

## 📱 Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚀 Performance
- **Initial load** < 2s
- **Workspace boot** 2.5s
- **Smooth 60fps** animations
- **Optimized Canvas** rendering

## 📝 Notes
- **Frontend** runs standalone for the portfolio; **workspace auth** requires the Express API (or dev-only offline login — see `.env.example`)
- **Express API** (`backend/`) handles auth, notes, jobs, contact, and analytics via Firebase
- **Python API** (`backend/python/`) powers resume scoring, SQL formatting, and DDL generation
- Workspace quick stats persist for the browser session (`sessionStorage`); notes/jobs sync when the API is available
- ER diagrams and SQL execution remain client-side simulations unless you connect a database backend

## ✨ Recently Added (Phase 2 - Productivity Enhanced)
- ✅ Pomodoro Timer with circular progress visualization
- ✅ Color-coded Notes Panel with 7 vibrant themes
- ✅ Query History tracking with copy functionality
- ✅ Saved Snippets library for SQL code reuse
- ✅ Performance Dashboard with 6 key metrics
- ✅ Command Palette for quick navigation (⌘K)
- ✅ Keyboard Shortcuts reference (⌘⇧?)
- ✅ Toast notification system (success/error/info)
- ✅ Enhanced UI with glassmorphism and gradients
- ✅ 7-color sidebar with icon indicators

## 🎯 Next Steps (Optional Enhancements)
- Add real SQL execution backend
- Persist ER diagrams to Firestore/localStorage
- Export diagrams as PNG/SVG images
- Add more SQL templates and examples
- Create mobile-optimized responsive layout
- Add database schema import from SQL
- Implement collaborative features
- Add undo/redo functionality
- Create custom color themes for notes

## 📞 Contact
Email: nigamjob32@gmail.com
Phone: +91 7008 667 185
Location: Bengaluru, India

---

Built with React + Vite + Tailwind CSS
Interactive Data Modeling Environment
