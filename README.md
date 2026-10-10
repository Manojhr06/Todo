# TaskFlow: Smart To-Do List & Productivity Dashboard

TaskFlow is a fast, minimalist, and private productivity dashboard built with modern vanilla web technologies. It is designed to run entirely locally in your web browser with zero backend dependencies, zero telemetry, and zero subscription requirements.

---

## 🌟 Key Features

### 1. Unified Dashboard
- **Live Productivity Metrics**: Total tasks, completed tasks, pending tasks, and overdue tasks.
- **Dynamic Completion Rate**: Visual progress bar calculating the actual percentage of completed tasks.
- **My Day & Upcoming Deadlines**: Quick-access widgets summarizing tasks due today and in the next 7 days.
- **Empty States**: Context-aware guidance when there are no tasks in the current view.

### 2. Full Task Management (CRUD) & Daily Routines
- **Create & Edit Tasks**: Assign a title, rich description, priority (Low, Medium, High), category, due date, due time, tags, recurrence cadence, and optional in-app reminders.
- **Daily Recurring Reminders**: Set recurring habits or daily routine topics (Daily, Weekdays, Weekly) with a specific daily reminder time (e.g., 09:00). When completed, recurring tasks automatically advance to the next scheduled occurrence date while preserving your productivity streak.
- **Task Completion**: Instant toggle with strike-through styling and timestamp recording (`completedAt`).
- **Task Details View**: Inspect full metadata, creation and completion timestamps, recurrence cadence, and tags.
- **Batch Actions**: One-click "Clear Completed" with a confirmation dialog.
- **Safe Validation**: Prevents empty tasks and protects against malicious input strings.

### 3. Organization & Filters
- **Smart Views**:
  - **Dashboard**: High-level overview.
  - **All Tasks**: Complete task archive.
  - **My Day**: Tasks due today.
  - **Upcoming**: Scheduled future tasks.
  - **Overdue**: Urgent tasks past their due date.
  - **Completed**: Log of finished tasks.
  - **High Priority**: Urgent, high-impact items.
  - **Daily & Recurring**: Filter specifically for recurring habits and daily topic routines.
  - **Category Views**: Filter by specific category.
- **Live Search**: Instant search by task title, description, or tags with `/` keyboard shortcut.
- **Multi-criteria Toolbar**: Combine priority filtering, category filtering, and multi-mode sorting (due date, priority, creation date, title).

### 3D Visual Experience & Tactile Animations
- **Hardware-Accelerated 3D Tilt**: Interactive 3D perspective tilt physics (`perspective(1000px) rotateX/rotateY/translateZ`) on task cards and dashboard metric cards responding to cursor motion.
- **Tactile 3D Button Depth**: Realistic depressed physical button states with multi-layer box shadows on hover and active click.
- **3D Spatial Transitions**: Smooth modal popups with scale and rotation keyframes, respectful of `prefers-reduced-motion` settings.

### 4. Custom Categories
- Default categories included: **Personal**, **Work**, **Study**, **Projects**, and **Health**.
- Create custom categories with custom color indicators.
- Delete custom categories with automatic reassignment of associated tasks.

### 5. Pomodoro Focus Timer
- **Modes**: 25-minute Focus, 5-minute Short Break, and 15-minute Long Break.
- **Tab-Resilient Countdown**: Uses high-precision timestamp deltas (`Date.now()`) to ensure zero timer drift when switching tabs or minimizing the browser window.
- **Task Association**: Optionally link focus sessions to an active task.
- **Audio Chimes**: Pleasant synthesized bell chime generated using the native Web Audio API (no external audio files or network requests needed).
- **Daily Focus Tracking**: Daily session counter and all-time focus statistics stored locally.

### 6. Productivity Insights & Analytics
- **Live Metrics**: Tasks completed today, tasks completed this week, and overall completion rate.
- **7-Day Completion Bar Chart**: Generated dynamically from real completed tasks in storage.
- **Priority & Category Distributions**: Visual percentage breakdown bars showing workload distribution.

### 7. Data Persistence & Backup
- **Client-Side Storage**: Tasks, categories, timer statistics, and preferences persist in browser `localStorage`.
- **JSON Export**: Download a timestamped `.json` file backup of your entire workspace.
- **JSON Import**: Upload and validate backups with schema verification before applying changes.
- **Reset Application**: Complete factory reset option with a double-confirmation safety dialog.

### 8. Accessibility & Dark Mode
- **System-Aware Dark Mode**: Handcrafted dark theme with high contrast (WCAG AA compliant) and zero theme flash on page load.
- **Keyboard Shortcuts**:
  - <kbd>N</kbd>: Create new task (disabled while typing in inputs)
  - <kbd>/</kbd>: Focus search box
  - <kbd>Esc</kbd>: Close active modal or drawer
  - <kbd>Ctrl</kbd> + <kbd>Enter</kbd>: Submit active modal form
  - <kbd>?</kbd>: Open shortcuts cheat sheet
- **Accessible HTML5**: Semantic landmarks, visible `:focus-visible` rings, ARIA roles, and screen-reader status announcements.

---

## 🛠️ Technology Stack

TaskFlow requires **no build tools**, **no Node.js**, **no frameworks**, and **no server dependencies**:
- **HTML5**: Semantic layout (`header`, `main`, `aside`, `nav`, `section`, `dialog`).
- **CSS3**: Custom design system, CSS variables, CSS Grid, Flexbox, and responsive media queries.
- **Vanilla JavaScript (ES6+)**: Modular application architecture, event delegation, and Web Audio API synthesis.
- **Storage**: Browser `localStorage` API.
- **Icons**: Crisp inline SVG icons for instant offline rendering.

---

## 📁 File Structure

```text
TaskFlow/
├── index.html        # Main semantic HTML5 application structure and dialogs
├── styles.css        # Complete CSS design tokens, light/dark themes, and responsive rules
├── script.js         # Core application logic, CRUD, filtering, timer, persistence & shortcuts
└── README.md         # Documentation, usage guide, and architecture overview
```

---

## 🚀 Quick Start: How to Run This

TaskFlow requires **no build tools, no Node.js installations, and no server configuration**. You can run it immediately using any of the methods below:

### Method 1: Run Live on the Web (GitHub Pages)
You can deploy TaskFlow on GitHub Pages for free with two clicks:
1. On GitHub, navigate to **Settings** -> **Pages**.
2. Under **Build and deployment** -> **Branch**, select `main` and root `/ (root)`.
3. Click **Save**.
4. GitHub will provide a live URL in seconds:
   ```text
   https://manojhr06.github.io/Todo/
   ```

---

### Method 2: Clone from GitHub & Open Directly (Local)
1. Clone the repository to your machine:
   ```bash
   git clone https://github.com/Manojhr06/Todo.git
   cd Todo
   ```
2. Double-click `index.html` to open it in Chrome, Edge, Firefox, or Safari.
3. The app opens immediately and runs 100% offline.

---

### Method 3: Run via Local Terminal Server
If you prefer running on `localhost`:

**Using Python (built into most systems):**
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

**Using Node / npx:**
```bash
npx serve .
```

**Using PowerShell (Windows):**
```powershell
Start-Process "index.html"
```

---

### Method 4: Run with VS Code Live Server
1. Open the project in VS Code:
   ```bash
   code .
   ```
2. Right-click `index.html` and click **"Open with Live Server"** (or click **"Go Live"** in the bottom status bar).
3. The application will launch at `http://127.0.0.1:5500/index.html`.

---

## 💾 How `localStorage` Works

TaskFlow saves your data directly inside your browser's private `localStorage` space under the following keys:
- `taskflow_tasks`: Array of task objects.
- `taskflow_categories`: Array of active categories.
- `taskflow_theme`: Current theme preference (`light` or `dark`).
- `taskflow_focus_stats`: Pomodoro session logs and counters.
- `taskflow_preferences`: User settings (e.g. chime sound toggle).

### Key Storage Characteristics:
- **No Remote Transmission**: Your data never leaves your computer. No cookies or server pings are sent.
- **Browser-Specific**: `localStorage` is tied to the specific browser and profile you use. If you open TaskFlow in Edge, tasks saved in Chrome will not appear automatically.
- **Private/Incognito Windows**: Browsers erase `localStorage` when an Incognito or Private browsing window is closed.

---

## 📦 How to Export and Import Backups

### Exporting Data:
1. In the sidebar, click **Settings & Backup**.
2. Under **Export Local Backup**, click **Export JSON**.
3. Your browser will download a file named `taskflow-backup-YYYY-MM-DD.json`.
4. Store this file in a safe location or transfer it to another computer.

### Importing Data:
1. In the sidebar, click **Settings & Backup**.
2. Under **Import Backup**, click **Import JSON**.
3. Select your previously exported `.json` file.
4. TaskFlow will validate the file format and show a confirmation prompt with the number of tasks found.
5. Click **Confirm** to restore your workspace.

---

## ⚠️ Known Limitations

1. **No Cloud Synchronization**: Because TaskFlow is completely serverless and private, tasks do not sync in real-time between your phone and computer. Use the **Export JSON** feature to migrate your tasks across devices.
2. **In-App Reminders Require Open Tab**: In-app notifications and sound alerts trigger while the TaskFlow browser tab is open. Because there is no background server worker or external notification service, reminders will not trigger if your browser is closed.
3. **Browser Cache Clearing**: Clearing your browser history and site data will remove `localStorage`. It is recommended to periodically export a JSON backup of important tasks.

---

## 🌐 Custom Domain & Production Hosting

### Option A: Deploy on Netlify (Recommended)

1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** -> **Import an existing project**.
3. Select **GitHub** and authorize access to your repository: `https://github.com/Manojhr06/Todo`.
4. Configure site settings:
   - **Branch to deploy**: `main`
   - **Base directory**: (leave blank / root)
   - **Build command**: (leave blank)
   - **Publish directory**: `.` (or leave as root)
5. Click **Deploy Todo**.
6. **Custom Domain on Netlify**:
   - In your Netlify site overview, go to **Site configuration** -> **Domain management**.
   - Click **Add a domain** and type your custom domain (e.g. `todo.yourdomain.com`).
   - Follow Netlify's DNS guidance (add a CNAME pointing to `<your-site-name>.netlify.app` or configure Netlify DNS).
   - Netlify will automatically provision a free Let's Encrypt SSL certificate.

### Option B: Deploy on GitHub Pages

To publish TaskFlow on a custom domain (e.g., `tasks.yourdomain.com` or `yourdomain.com`) using GitHub Pages:

#### Step 1: Add your CNAME File
Create a single-line file named `CNAME` in the repository root containing your domain:
```text
tasks.yourdomain.com
```

#### Step 2: Configure DNS Records
In your DNS provider (Cloudflare, Namecheap, GoDaddy, Route53, etc.):
- **For Subdomains** (`tasks.yourdomain.com`):
  - Type: `CNAME`
  - Host/Name: `tasks`
  - Target/Value: `<username>.github.io`
- **For Apex Domains** (`yourdomain.com`):
  - Type: `A`
  - Target/Value:
    - `185.199.108.153`
    - `185.199.109.153`
    - `185.199.110.153`
    - `185.199.111.153`

#### Step 3: Enable in GitHub Repository Settings
1. Go to your repository on GitHub: `https://github.com/Manojhr06/Todo`
2. Navigate to **Settings** -> **Pages**.
3. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
4. In **Custom domain**, enter your domain name and click **Save**.
5. Check **Enforce HTTPS** to ensure free automated SSL encryption.

---

## 🛡️ Production Design & Legal Compliance Standards

TaskFlow strictly adheres to clean, production-grade utility principles:
- **No Vibe Slop**: Zero purple gradients, zero pill-shaped buttons, zero fake customer counters, zero fake social proof, and zero scroll choreography.
- **No AI Tags or AI Slop**: Free of "Made with AI" labels, synthetic stock photos, or generated filler copy.
- **Strict Typographic Standards**: Crisp system typography, zero emoji interface icons (replaced with precise inline SVGs), and zero decorative em dashes.
- **SVG Favicon**: Embedded vector favicon (`favicon.svg`) rendering crisp marks on all display densities.
- **Legal Infrastructure**: Dedicated [Privacy Policy](privacy.html) and [Terms and Conditions](terms.html) pages accessible from all application surfaces.

---

## 📄 License

Open source and free to use for personal and commercial productivity.
