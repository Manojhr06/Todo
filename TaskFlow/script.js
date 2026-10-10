/**
 * ============================================================================
 * TASKFLOW — SMART TO-DO LIST & PRODUCTIVITY DASHBOARD
 * Modern, private, offline-first task management in Vanilla JavaScript.
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. DEFAULT DATA & CONSTANTS
     ========================================================================== */
  const STORAGE_KEYS = {
    TASKS: 'taskflow_tasks',
    CATEGORIES: 'taskflow_categories',
    THEME: 'taskflow_theme',
    FOCUS_STATS: 'taskflow_focus_stats',
    PREFERENCES: 'taskflow_preferences'
  };

  const DEFAULT_CATEGORIES = [
    { id: 'cat_personal', name: 'Personal', color: '#2563eb', isCustom: false },
    { id: 'cat_work', name: 'Work', color: '#0891b2', isCustom: false },
    { id: 'cat_study', name: 'Study', color: '#7c3aed', isCustom: false },
    { id: 'cat_projects', name: 'Projects', color: '#059669', isCustom: false },
    { id: 'cat_health', name: 'Health', color: '#d97706', isCustom: false }
  ];

  const INITIAL_TASKS = [
    {
      id: 'task_welcome_1',
      title: 'Welcome to TaskFlow! Organize your first project',
      description: 'Explore the dashboard, try adding your own tasks, or start a Pomodoro session in the Focus Timer tab.',
      priority: 'high',
      category: 'Projects',
      dueDate: getTodayDateString(),
      dueTime: '17:00',
      tags: ['getting-started', 'productivity'],
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      hasReminder: false,
      reminderTime: '',
      reminderFired: false
    },
    {
      id: 'task_welcome_2',
      title: 'Review today\'s priority goals',
      description: 'Break big projects into small actionable steps and set due dates to stay focused.',
      priority: 'medium',
      category: 'Work',
      dueDate: getTodayDateString(),
      dueTime: '19:00',
      tags: ['daily'],
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      hasReminder: false,
      reminderTime: '',
      reminderFired: false
    },
    {
      id: 'task_welcome_3',
      title: 'Schedule upcoming weekly workout routine',
      description: 'Keep a healthy balance between work and life.',
      priority: 'low',
      category: 'Health',
      dueDate: getOffsetDateString(2),
      dueTime: '08:30',
      tags: ['wellness'],
      completed: true,
      createdAt: getOffsetDateString(-1),
      completedAt: new Date().toISOString(),
      hasReminder: false,
      reminderTime: '',
      reminderFired: false
    }
  ];

  const POMODORO_MODES = {
    'focus': { name: 'Focus Session', minutes: 25 },
    'short-break': { name: 'Short Break', minutes: 5 },
    'long-break': { name: 'Long Break', minutes: 15 }
  };

  /* ==========================================================================
     2. APPLICATION STATE
     ========================================================================== */
  const AppState = {
    tasks: [],
    categories: [],
    currentView: 'dashboard',
    activeCategoryFilter: null,
    searchQuery: '',
    filterPriority: 'all',
    filterCategory: 'all',
    sortBy: 'due-asc',
    
    // Focus Timer State
    timer: {
      mode: 'focus',
      durationSeconds: 25 * 60,
      remainingSeconds: 25 * 60,
      isRunning: false,
      intervalId: null,
      targetEndTime: null,
      activeTaskId: '',
      soundEnabled: true
    },
    
    focusStats: {
      todayDate: getTodayDateString(),
      todaySessions: 0,
      todayMinutes: 0,
      allTimeSessions: 0,
      allTimeMinutes: 0,
      history: []
    },

    activeModal: null,
    pendingConfirmAction: null
  };

  /* ==========================================================================
     3. UTILITY FUNCTIONS
     ========================================================================== */
  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getOffsetDateString(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function generateUniqueId(prefix = 'task') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateFriendly(dateStr) {
    if (!dateStr) return '';
    const today = getTodayDateString();
    const tomorrow = getOffsetDateString(1);
    const yesterday = getOffsetDateString(-1);

    if (dateStr === today) return 'Today';
    if (dateStr === tomorrow) return 'Tomorrow';
    if (dateStr === yesterday) return 'Yesterday';

    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  }

  function formatDateTimeFriendly(isoStr) {
    if (!isoStr) return 'None';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return isoStr;
    }
  }

  function isTaskOverdue(task) {
    if (!task || task.completed || !task.dueDate) return false;
    const today = getTodayDateString();
    return task.dueDate < today;
  }

  function isTaskDueToday(task) {
    if (!task || !task.dueDate) return false;
    const today = getTodayDateString();
    return task.dueDate === today;
  }

  /* ==========================================================================
     4. PERSISTENCE LAYER (localStorage)
     ========================================================================== */
  const StorageService = {
    load() {
      try {
        // Load Tasks
        const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
        if (savedTasks) {
          AppState.tasks = JSON.parse(savedTasks);
        } else {
          AppState.tasks = INITIAL_TASKS;
          this.saveTasks();
        }

        // Load Categories
        const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (savedCategories) {
          AppState.categories = JSON.parse(savedCategories);
        } else {
          AppState.categories = DEFAULT_CATEGORIES;
          this.saveCategories();
        }

        // Load Focus Stats
        const savedStats = localStorage.getItem(STORAGE_KEYS.FOCUS_STATS);
        if (savedStats) {
          const stats = JSON.parse(savedStats);
          const today = getTodayDateString();
          if (stats.todayDate !== today) {
            stats.todayDate = today;
            stats.todaySessions = 0;
            stats.todayMinutes = 0;
          }
          AppState.focusStats = stats;
        }

        // Load Preferences
        const savedPrefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          if (typeof prefs.soundEnabled === 'boolean') {
            AppState.timer.soundEnabled = prefs.soundEnabled;
          }
        }
      } catch (err) {
        console.warn('Could not read from localStorage, using fallback defaults:', err);
        AppState.tasks = INITIAL_TASKS;
        AppState.categories = DEFAULT_CATEGORIES;
      }
    },

    saveTasks() {
      try {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(AppState.tasks));
      } catch (err) {
        console.error('Failed to save tasks to localStorage:', err);
      }
    },

    saveCategories() {
      try {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(AppState.categories));
      } catch (err) {
        console.error('Failed to save categories to localStorage:', err);
      }
    },

    saveFocusStats() {
      try {
        localStorage.setItem(STORAGE_KEYS.FOCUS_STATS, JSON.stringify(AppState.focusStats));
      } catch (err) {
        console.error('Failed to save focus stats to localStorage:', err);
      }
    },

    savePreferences() {
      try {
        const prefs = { soundEnabled: AppState.timer.soundEnabled };
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
      } catch (err) {
        console.error('Failed to save preferences to localStorage:', err);
      }
    },

    exportData() {
      const backupData = {
        app: 'TaskFlow',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: AppState.tasks,
        categories: AppState.categories,
        focusStats: AppState.focusStats,
        preferences: {
          soundEnabled: AppState.timer.soundEnabled,
          theme: document.documentElement.getAttribute('data-theme') || 'light'
        }
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `taskflow-backup-${getTodayDateString()}.json`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      ToastService.show('Backup downloaded successfully', 'success');
    },

    importData(file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid JSON structure.');
          }

          if (!Array.isArray(parsed.tasks)) {
            throw new Error('Missing tasks array in backup data.');
          }

          // Validate tasks format
          const validTasks = parsed.tasks.map((t, idx) => ({
            id: t.id || generateUniqueId(`imported_${idx}`),
            title: String(t.title || 'Untitled Task').trim(),
            description: String(t.description || ''),
            priority: ['low', 'medium', 'high'].includes(t.priority) ? t.priority : 'medium',
            category: String(t.category || 'Personal'),
            dueDate: t.dueDate || '',
            dueTime: t.dueTime || '',
            tags: Array.isArray(t.tags) ? t.tags.map(String) : [],
            completed: Boolean(t.completed),
            createdAt: t.createdAt || new Date().toISOString(),
            completedAt: t.completedAt || null,
            hasReminder: Boolean(t.hasReminder),
            reminderTime: t.reminderTime || '',
            reminderFired: Boolean(t.reminderFired)
          })).filter(t => t.title.length > 0);

          let validCategories = DEFAULT_CATEGORIES;
          if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
            validCategories = parsed.categories.map((c, idx) => ({
              id: c.id || `cat_imported_${idx}`,
              name: String(c.name || 'Category').trim(),
              color: c.color || '#2563eb',
              isCustom: Boolean(c.isCustom)
            })).filter(c => c.name.length > 0);
          }

          // Prompt confirmation before replacing
          ModalService.confirm(
            'Import & Replace Data',
            `Found ${validTasks.length} task(s) and ${validCategories.length} category(ies). Do you want to replace current data with this backup?`,
            () => {
              AppState.tasks = validTasks;
              AppState.categories = validCategories;
              if (parsed.focusStats && typeof parsed.focusStats === 'object') {
                AppState.focusStats = parsed.focusStats;
              }
              StorageService.saveTasks();
              StorageService.saveCategories();
              StorageService.saveFocusStats();
              renderAll();
              ToastService.show(`Successfully imported ${validTasks.length} tasks!`, 'success');
            }
          );
        } catch (err) {
          ToastService.show('Failed to import: ' + err.message, 'danger');
        }
      };
      reader.readAsText(file);
    },

    resetAll() {
      ModalService.confirm(
        'Reset Application',
        'Are you sure you want to delete all tasks, categories, and statistics? This action cannot be undone.',
        () => {
          localStorage.removeItem(STORAGE_KEYS.TASKS);
          localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
          localStorage.removeItem(STORAGE_KEYS.FOCUS_STATS);
          AppState.tasks = [];
          AppState.categories = DEFAULT_CATEGORIES;
          AppState.focusStats = {
            todayDate: getTodayDateString(),
            todaySessions: 0,
            todayMinutes: 0,
            allTimeSessions: 0,
            allTimeMinutes: 0,
            history: []
          };
          StorageService.saveTasks();
          StorageService.saveCategories();
          StorageService.saveFocusStats();
          renderAll();
          ToastService.show('Application has been reset to defaults', 'info');
        }
      );
    }
  };

  /* ==========================================================================
     5. TOAST NOTIFICATION SERVICE
     ========================================================================== */
  const ToastService = {
    container: null,

    init() {
      this.container = document.getElementById('toastContainer');
    },

    show(message, type = 'info', duration = 3500) {
      if (!this.container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.setAttribute('role', 'status');

      let iconSvg = '';
      if (type === 'success') {
        iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      } else if (type === 'danger') {
        iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
      } else if (type === 'warning') {
        iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      } else {
        iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
      }

      toast.innerHTML = `
        <span class="toast-icon">${iconSvg}</span>
        <span class="toast-message"></span>
        <button class="toast-close-btn" aria-label="Dismiss notification">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      // Safe text injection
      toast.querySelector('.toast-message').textContent = message;

      const closeBtn = toast.querySelector('.toast-close-btn');
      const dismiss = () => {
        toast.classList.add('toast-hiding');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 200);
      };

      closeBtn.addEventListener('click', dismiss);
      this.container.appendChild(toast);

      setTimeout(dismiss, duration);
    }
  };

  /* ==========================================================================
     6. SYNTHETIC AUDIO CHIME (WEB AUDIO API - ZERO EXTERNAL ASSETS)
     ========================================================================== */
  const AudioService = {
    audioCtx: null,

    initAudioContext() {
      if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    },

    playChime() {
      if (!AppState.timer.soundEnabled) return;
      try {
        this.initAudioContext();
        if (!this.audioCtx) return;

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Elegant two-tone bell chime
        const playTone = (freq, start, duration) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + duration);
        };

        playTone(587.33, now, 0.8);        // D5
        playTone(880.00, now + 0.15, 1.2); // A5
      } catch (e) {
        console.warn('Audio chime playback blocked or unavailable:', e);
      }
    }
  };

  /* ==========================================================================
     7. MODAL DIALOG MANAGEMENT
     ========================================================================== */
  const ModalService = {
    open(modalBackdropId) {
      const modal = document.getElementById(modalBackdropId);
      if (!modal) return;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      AppState.activeModal = modal;

      // Autofocus first meaningful input
      const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, select, button.btn-primary');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 50);
      }
    },

    close(modalBackdropId) {
      const modal = document.getElementById(modalBackdropId);
      if (!modal) return;
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      if (AppState.activeModal === modal) {
        AppState.activeModal = null;
      }
    },

    closeActive() {
      if (AppState.activeModal) {
        this.close(AppState.activeModal.id);
      }
    },

    confirm(title, message, onConfirmCallback) {
      const modal = document.getElementById('confirmModalBackdrop');
      document.getElementById('confirmDialogTitle').textContent = title;
      document.getElementById('confirmDialogMessage').textContent = message;
      AppState.pendingConfirmAction = onConfirmCallback;
      this.open('confirmModalBackdrop');
    }
  };

  /* ==========================================================================
     8. TASK OPERATIONS (CRUD)
     ========================================================================== */
  const TaskManager = {
    createTask(taskData) {
      const title = String(taskData.title || '').trim();
      if (!title) {
        return { success: false, error: 'Task title is required.' };
      }

      const newTask = {
        id: generateUniqueId('task'),
        title: title,
        description: String(taskData.description || '').trim(),
        priority: taskData.priority || 'medium',
        category: taskData.category || 'Personal',
        dueDate: taskData.dueDate || '',
        dueTime: taskData.dueTime || '',
        tags: Array.isArray(taskData.tags) ? taskData.tags : [],
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        hasReminder: Boolean(taskData.hasReminder),
        reminderTime: taskData.reminderTime || '',
        reminderFired: false
      };

      AppState.tasks.unshift(newTask);
      StorageService.saveTasks();
      renderAll();
      ToastService.show('Task created successfully', 'success');
      return { success: true, task: newTask };
    },

    updateTask(taskId, updateData) {
      const taskIndex = AppState.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        return { success: false, error: 'Task not found.' };
      }

      const title = String(updateData.title || '').trim();
      if (!title) {
        return { success: false, error: 'Task title cannot be empty.' };
      }

      const existing = AppState.tasks[taskIndex];
      const updatedTask = {
        ...existing,
        title: title,
        description: String(updateData.description || '').trim(),
        priority: updateData.priority || existing.priority,
        category: updateData.category || existing.category,
        dueDate: updateData.dueDate !== undefined ? updateData.dueDate : existing.dueDate,
        dueTime: updateData.dueTime !== undefined ? updateData.dueTime : existing.dueTime,
        tags: Array.isArray(updateData.tags) ? updateData.tags : existing.tags,
        hasReminder: updateData.hasReminder !== undefined ? Boolean(updateData.hasReminder) : existing.hasReminder,
        reminderTime: updateData.reminderTime !== undefined ? updateData.reminderTime : existing.reminderTime
      };

      AppState.tasks[taskIndex] = updatedTask;
      StorageService.saveTasks();
      renderAll();
      ToastService.show('Task updated', 'success');
      return { success: true, task: updatedTask };
    },

    deleteTask(taskId) {
      const task = AppState.tasks.find(t => t.id === taskId);
      if (!task) return;

      ModalService.confirm(
        'Delete Task',
        `Are you sure you want to permanently delete "${task.title}"?`,
        () => {
          AppState.tasks = AppState.tasks.filter(t => t.id !== taskId);
          StorageService.saveTasks();
          renderAll();
          ToastService.show('Task deleted', 'info');
          ModalService.close('detailModalBackdrop');
        }
      );
    },

    toggleComplete(taskId) {
      const task = AppState.tasks.find(t => t.id === taskId);
      if (!task) return;

      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;

      StorageService.saveTasks();
      renderAll();

      if (task.completed) {
        ToastService.show('Task marked as completed', 'success');
      } else {
        ToastService.show('Task reopened', 'info');
      }
    },

    clearCompleted() {
      const completedCount = AppState.tasks.filter(t => t.completed).length;
      if (completedCount === 0) {
        ToastService.show('No completed tasks to clear', 'info');
        return;
      }

      ModalService.confirm(
        'Clear Completed Tasks',
        `Are you sure you want to remove all ${completedCount} completed task(s)?`,
        () => {
          AppState.tasks = AppState.tasks.filter(t => !t.completed);
          StorageService.saveTasks();
          renderAll();
          ToastService.show(`Cleared ${completedCount} completed task(s)`, 'info');
        }
      );
    }
  };

  /* ==========================================================================
     9. CATEGORY OPERATIONS
     ========================================================================== */
  const CategoryManager = {
    addCategory(name, color = '#2563eb') {
      const cleanName = String(name || '').trim();
      if (!cleanName) return { success: false, error: 'Category name is required' };

      const exists = AppState.categories.some(
        c => c.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (exists) return { success: false, error: 'A category with this name already exists' };

      const newCat = {
        id: generateUniqueId('cat'),
        name: cleanName,
        color: color,
        isCustom: true
      };

      AppState.categories.push(newCat);
      StorageService.saveCategories();
      renderCategoriesUI();
      renderCategorySelects();
      ToastService.show(`Category "${cleanName}" created`, 'success');
      return { success: true, category: newCat };
    },

    deleteCategory(categoryId) {
      const cat = AppState.categories.find(c => c.id === categoryId);
      if (!cat) return;
      if (!cat.isCustom) {
        ToastService.show('Default categories cannot be deleted', 'warning');
        return;
      }

      ModalService.confirm(
        'Delete Category',
        `Delete "${cat.name}"? Tasks assigned to this category will be reassigned to "Personal".`,
        () => {
          // Reassign tasks
          AppState.tasks.forEach(t => {
            if (t.category === cat.name) {
              t.category = 'Personal';
            }
          });
          AppState.categories = AppState.categories.filter(c => c.id !== categoryId);
          StorageService.saveCategories();
          StorageService.saveTasks();
          
          if (AppState.currentView === `category-${cat.id}`) {
            NavigationService.switchView('all');
          } else {
            renderAll();
          }
          ToastService.show(`Category "${cat.name}" removed`, 'info');
        }
      );
    },

    getColorForCategory(catName) {
      const cat = AppState.categories.find(c => c.name.toLowerCase() === String(catName).toLowerCase());
      return cat ? cat.color : '#2563eb';
    }
  };

  /* ==========================================================================
     10. FILTERING & SORTING ENGINE
     ========================================================================== */
  const FilterEngine = {
    getFilteredTasks() {
      const view = AppState.currentView;
      const query = AppState.searchQuery.trim().toLowerCase();
      const priority = AppState.filterPriority;
      const category = AppState.filterCategory;
      const today = getTodayDateString();

      return AppState.tasks.filter(task => {
        // 1. Primary View Filter
        if (view === 'today') {
          if (task.dueDate !== today) return false;
        } else if (view === 'upcoming') {
          if (!task.dueDate || task.dueDate <= today || task.completed) return false;
        } else if (view === 'overdue') {
          if (!task.dueDate || task.dueDate >= today || task.completed) return false;
        } else if (view === 'completed') {
          if (!task.completed) return false;
        } else if (view === 'high-priority') {
          if (task.priority !== 'high' || task.completed) return false;
        } else if (view.startsWith('category-')) {
          const catId = view.replace('category-', '');
          const cat = AppState.categories.find(c => c.id === catId);
          if (!cat || task.category.toLowerCase() !== cat.name.toLowerCase()) return false;
        }

        // 2. Toolbar Priority Filter
        if (priority !== 'all' && task.priority !== priority) {
          return false;
        }

        // 3. Toolbar Category Filter
        if (category !== 'all' && task.category.toLowerCase() !== category.toLowerCase()) {
          return false;
        }

        // 4. Global Search Query Filter (Title, Description, Tags)
        if (query) {
          const matchTitle = task.title.toLowerCase().includes(query);
          const matchDesc = task.description.toLowerCase().includes(query);
          const matchTag = task.tags.some(tag => tag.toLowerCase().includes(query));
          if (!matchTitle && !matchDesc && !matchTag) return false;
        }

        return true;
      });
    },

    getSortedTasks(tasks) {
      const sortBy = AppState.sortBy;
      const priorityWeights = { high: 3, medium: 2, low: 1 };

      return [...tasks].sort((a, b) => {
        // Always place completed tasks below active tasks unless in completed view
        if (AppState.currentView !== 'completed' && a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        switch (sortBy) {
          case 'due-asc':
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate) || (a.dueTime || '').localeCompare(b.dueTime || '');

          case 'due-desc':
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return b.dueDate.localeCompare(a.dueDate) || (b.dueTime || '').localeCompare(a.dueTime || '');

          case 'priority-desc':
            return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);

          case 'created-desc':
            return new Date(b.createdAt) - new Date(a.createdAt);

          case 'created-asc':
            return new Date(a.createdAt) - new Date(b.createdAt);

          case 'title-asc':
            return a.title.localeCompare(b.title);

          default:
            return 0;
        }
      });
    },

    getCounts() {
      const today = getTodayDateString();
      const all = AppState.tasks.length;
      const completed = AppState.tasks.filter(t => t.completed).length;
      const pending = all - completed;
      const overdue = AppState.tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today).length;
      const dueToday = AppState.tasks.filter(t => t.dueDate === today).length;
      const upcoming = AppState.tasks.filter(t => !t.completed && t.dueDate && t.dueDate > today).length;
      const highPriority = AppState.tasks.filter(t => !t.completed && t.priority === 'high').length;

      return { all, completed, pending, overdue, dueToday, upcoming, highPriority };
    }
  };

  /* ==========================================================================
     11. POMODORO FOCUS TIMER ENGINE
     ========================================================================== */
  const FocusTimer = {
    init() {
      this.updateDisplay();
      this.populateTaskSelect();
    },

    setMode(modeKey) {
      if (!POMODORO_MODES[modeKey]) return;
      this.pause();
      AppState.timer.mode = modeKey;
      AppState.timer.durationSeconds = POMODORO_MODES[modeKey].minutes * 60;
      AppState.timer.remainingSeconds = AppState.timer.durationSeconds;
      this.updateDisplay();

      // Update UI Tabs
      document.querySelectorAll('.timer-tab').forEach(tab => {
        const isCurrent = tab.getAttribute('data-mode') === modeKey;
        tab.classList.toggle('active', isCurrent);
        tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });

      const statusLabels = {
        'focus': 'Ready to Focus',
        'short-break': 'Short Break Time',
        'long-break': 'Long Break Time'
      };
      document.getElementById('timerStatusLabel').textContent = statusLabels[modeKey];
    },

    start() {
      if (AppState.timer.isRunning) return;

      AudioService.initAudioContext();
      AppState.timer.isRunning = true;
      AppState.timer.targetEndTime = Date.now() + (AppState.timer.remainingSeconds * 1000);

      this.updateToggleBtn(true);
      document.getElementById('sidebarTimerDot').classList.add('active');

      // Clear any prior interval
      if (AppState.timer.intervalId) clearInterval(AppState.timer.intervalId);

      // High-resolution interval resilient against tab suspension
      AppState.timer.intervalId = setInterval(() => {
        const now = Date.now();
        const diffMs = AppState.timer.targetEndTime - now;
        const remaining = Math.max(0, Math.ceil(diffMs / 1000));

        AppState.timer.remainingSeconds = remaining;
        this.updateDisplay();

        if (remaining <= 0) {
          this.completeSession();
        }
      }, 250);
    },

    pause() {
      if (!AppState.timer.isRunning) return;
      AppState.timer.isRunning = false;
      if (AppState.timer.intervalId) {
        clearInterval(AppState.timer.intervalId);
        AppState.timer.intervalId = null;
      }
      this.updateToggleBtn(false);
      document.getElementById('sidebarTimerDot').classList.remove('active');
      document.title = 'TaskFlow — Smart Productivity & Tasks';
    },

    toggle() {
      if (AppState.timer.isRunning) {
        this.pause();
      } else {
        this.start();
      }
    },

    reset() {
      this.pause();
      AppState.timer.remainingSeconds = AppState.timer.durationSeconds;
      this.updateDisplay();
    },

    completeSession() {
      this.pause();
      AppState.timer.remainingSeconds = 0;
      this.updateDisplay();

      // Audio & In-App Announcement
      AudioService.playChime();

      const currentMode = AppState.timer.mode;
      const isFocus = currentMode === 'focus';
      const durationMin = POMODORO_MODES[currentMode].minutes;

      if (isFocus) {
        AppState.focusStats.todaySessions += 1;
        AppState.focusStats.todayMinutes += durationMin;
        AppState.focusStats.allTimeSessions += 1;
        AppState.focusStats.allTimeMinutes += durationMin;

        AppState.focusStats.history.push({
          timestamp: new Date().toISOString(),
          duration: durationMin,
          mode: 'focus',
          taskId: AppState.timer.activeTaskId || null
        });

        StorageService.saveFocusStats();
        renderTimerStats();
        renderDashboardStats();
        renderInsightsView();

        ToastService.show('Focus session completed! Great work.', 'success');
      } else {
        ToastService.show('Break completed! Ready to focus again?', 'info');
      }

      // Auto transition to appropriate mode
      if (isFocus) {
        const nextMode = (AppState.focusStats.todaySessions % 4 === 0) ? 'long-break' : 'short-break';
        this.setMode(nextMode);
      } else {
        this.setMode('focus');
      }
    },

    updateDisplay() {
      const totalSec = AppState.timer.remainingSeconds;
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      const displayEl = document.getElementById('timerDisplay');
      if (displayEl) displayEl.textContent = formatted;

      // Update page title when running
      if (AppState.timer.isRunning) {
        document.title = `(${formatted}) ${POMODORO_MODES[AppState.timer.mode].name} — TaskFlow`;
      }

      // Circular Ring Progress
      const ring = document.getElementById('timerProgressRing');
      if (ring) {
        const circumference = 2 * Math.PI * 124; // r=124 => ~779.11
        const percent = totalSec / AppState.timer.durationSeconds;
        const offset = circumference * (1 - percent);
        ring.style.strokeDashoffset = offset;
      }
    },

    updateToggleBtn(isRunning) {
      const toggleText = document.getElementById('timerToggleText');
      const playIcon = document.getElementById('timerPlayIcon');
      const pauseIcon = document.getElementById('timerPauseIcon');

      if (isRunning) {
        toggleText.textContent = 'Pause';
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
      } else {
        toggleText.textContent = 'Start';
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
      }
    },

    populateTaskSelect() {
      const select = document.getElementById('timerTaskSelect');
      if (!select) return;

      const currentVal = select.value;
      select.innerHTML = '<option value="">-- No specific task --</option>';

      const pendingTasks = AppState.tasks.filter(t => !t.completed);
      pendingTasks.forEach(task => {
        const opt = document.createElement('option');
        opt.value = task.id;
        opt.textContent = task.title;
        if (task.id === currentVal) opt.selected = true;
        select.appendChild(opt);
      });
    }
  };

  /* ==========================================================================
     12. NAVIGATION & VIEW SWITCHING
     ========================================================================== */
  const NavigationService = {
    viewMeta: {
      'dashboard': { title: 'Dashboard', subtitle: 'Overview of your productivity and upcoming tasks' },
      'all': { title: 'All Tasks', subtitle: 'Complete list of your organized tasks' },
      'today': { title: 'My Day', subtitle: 'Tasks scheduled for today' },
      'upcoming': { title: 'Upcoming', subtitle: 'Tasks scheduled for future dates' },
      'overdue': { title: 'Overdue', subtitle: 'Tasks that require immediate attention' },
      'completed': { title: 'Completed Tasks', subtitle: 'Archive of finished tasks' },
      'high-priority': { title: 'High Priority', subtitle: 'Urgent and critical tasks' },
      'timer': { title: 'Focus Timer', subtitle: 'Distraction-free Pomodoro session tracking' },
      'insights': { title: 'Productivity Insights', subtitle: 'Historical trends, stats, and task breakdown' },
      'settings': { title: 'Settings & Backup', subtitle: 'Manage categories, import/export data, and storage' }
    },

    switchView(viewId) {
      AppState.currentView = viewId;

      // Close mobile sidebar if open
      closeMobileSidebar();

      // Update sidebar nav items active class
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        const itemView = item.getAttribute('data-view');
        item.classList.toggle('active', itemView === viewId);
      });

      // Show/Hide Content View Panels
      document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      let targetPanelId = 'view-tasks';
      if (viewId === 'dashboard') targetPanelId = 'view-dashboard';
      else if (viewId === 'timer') targetPanelId = 'view-timer';
      else if (viewId === 'insights') targetPanelId = 'view-insights';
      else if (viewId === 'settings') targetPanelId = 'view-settings';

      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) targetPanel.classList.add('active');

      // Update Header Titles
      const titleEl = document.getElementById('pageTitle');
      const subtitleEl = document.getElementById('pageSubtitle');

      if (viewId.startsWith('category-')) {
        const catId = viewId.replace('category-', '');
        const cat = AppState.categories.find(c => c.id === catId);
        const catName = cat ? cat.name : 'Category';
        titleEl.textContent = catName;
        subtitleEl.textContent = `Tasks assigned to the "${catName}" category`;
      } else {
        const meta = this.viewMeta[viewId] || { title: 'Tasks', subtitle: '' };
        titleEl.textContent = meta.title;
        subtitleEl.textContent = meta.subtitle;
      }

      // Re-render corresponding views
      if (viewId === 'dashboard') {
        renderDashboardStats();
      } else if (viewId === 'insights') {
        renderInsightsView();
      } else if (viewId === 'settings') {
        renderSettingsCategories();
      } else if (viewId === 'timer') {
        FocusTimer.populateTaskSelect();
        renderTimerStats();
      } else {
        renderTasksView();
      }

      updateSidebarBadges();
    }
  };

  /* ==========================================================================
     13. RENDERING PIPELINE
     ========================================================================== */
  function renderAll() {
    updateSidebarBadges();
    renderCategoriesUI();
    renderCategorySelects();
    renderDashboardStats();
    renderTasksView();
    renderInsightsView();
    renderSettingsCategories();
    renderTimerStats();
    FocusTimer.populateTaskSelect();
  }

  function updateSidebarBadges() {
    const counts = FilterEngine.getCounts();
    setElementText('badge-all', counts.all);
    setElementText('badge-today', counts.dueToday);
    setElementText('badge-upcoming', counts.upcoming);
    setElementText('badge-overdue', counts.overdue);
    setElementText('badge-completed', counts.completed);
    setElementText('badge-high-priority', counts.highPriority);

    // Update Category Counts
    AppState.categories.forEach(cat => {
      const badge = document.getElementById(`badge-cat-${cat.id}`);
      if (badge) {
        const count = AppState.tasks.filter(t => t.category.toLowerCase() === cat.name.toLowerCase()).length;
        badge.textContent = count;
      }
    });
  }

  function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* Render Categories in Sidebar */
  function renderCategoriesUI() {
    const navList = document.getElementById('categoryNavList');
    if (!navList) return;

    navList.innerHTML = '';
    AppState.categories.forEach(cat => {
      const li = document.createElement('li');
      const count = AppState.tasks.filter(t => t.category.toLowerCase() === cat.name.toLowerCase()).length;
      const isActive = AppState.currentView === `category-${cat.id}`;

      li.innerHTML = `
        <button class="nav-item ${isActive ? 'active' : ''}" data-view="category-${cat.id}" id="nav-cat-${cat.id}">
          <span class="category-dot" style="background-color: ${cat.color};"></span>
          <span class="nav-label"></span>
          <span class="nav-badge" id="badge-cat-${cat.id}">${count}</span>
        </button>
      `;

      li.querySelector('.nav-label').textContent = cat.name;

      li.querySelector('button').addEventListener('click', () => {
        NavigationService.switchView(`category-${cat.id}`);
      });

      navList.appendChild(li);
    });
  }

  /* Render Category options in Task Form & Toolbar dropdowns */
  function renderCategorySelects() {
    const selects = [
      document.getElementById('taskCategoryInput'),
      document.getElementById('filterCategory')
    ];

    selects.forEach(select => {
      if (!select) return;
      const currentVal = select.value;
      const isFilter = select.id === 'filterCategory';

      select.innerHTML = '';
      if (isFilter) {
        const allOpt = document.createElement('option');
        allOpt.value = 'all';
        allOpt.textContent = 'All Categories';
        select.appendChild(allOpt);
      }

      AppState.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        if (cat.name === currentVal) opt.selected = true;
        select.appendChild(opt);
      });
    });
  }

  /* Render Dashboard Statistics & Cards */
  function renderDashboardStats() {
    const counts = FilterEngine.getCounts();
    setElementText('dashTotalTasks', counts.all);
    setElementText('dashCompletedTasks', counts.completed);
    setElementText('dashPendingTasks', counts.pending);
    setElementText('dashOverdueTasks', counts.overdue);

    // Productivity rate
    const rate = counts.all > 0 ? Math.round((counts.completed / counts.all) * 100) : 0;
    setElementText('dashCompletionRate', `${rate}%`);
    
    const progressFill = document.getElementById('dashProgressFill');
    if (progressFill) progressFill.style.width = `${rate}%`;

    const summaryEl = document.getElementById('dashProductivitySummary');
    if (summaryEl) {
      if (counts.all === 0) {
        summaryEl.textContent = 'No tasks added yet. Start your journey by creating a task!';
      } else if (counts.overdue > 0) {
        summaryEl.textContent = `You have ${counts.overdue} overdue task(s) needing attention today.`;
      } else {
        summaryEl.textContent = `You have completed ${counts.completed} of ${counts.all} total tasks (${rate}% overall completion).`;
      }
    }

    setElementText('dashFocusSessionsCount', AppState.focusStats.todaySessions);
    setElementText('dashDueTodayCount', counts.dueToday);

    // Render Mini Lists in Dashboard
    renderDashboardMiniLists();
  }

  function renderDashboardMiniLists() {
    const today = getTodayDateString();
    
    // 1. My Day Mini List
    const todayTasks = AppState.tasks.filter(t => t.dueDate === today);
    const todayContainer = document.getElementById('dashTodayTasksList');
    setElementText('dashMyDayCount', `${todayTasks.length} task${todayTasks.length === 1 ? '' : 's'}`);
    
    if (todayContainer) {
      todayContainer.innerHTML = '';
      if (todayTasks.length === 0) {
        todayContainer.innerHTML = '<div class="dash-empty-notice">No tasks scheduled for today. Take a break or plan ahead!</div>';
      } else {
        todayTasks.slice(0, 5).forEach(task => {
          todayContainer.appendChild(createMiniTaskRow(task));
        });
      }
    }

    // 2. Upcoming Deadlines Mini List (Next 7 days, excluding today)
    const upcomingTasks = AppState.tasks
      .filter(t => !t.completed && t.dueDate && t.dueDate > today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const upcomingContainer = document.getElementById('dashUpcomingTasksList');
    if (upcomingContainer) {
      upcomingContainer.innerHTML = '';
      if (upcomingTasks.length === 0) {
        upcomingContainer.innerHTML = '<div class="dash-empty-notice">No upcoming deadlines scheduled for the next 7 days.</div>';
      } else {
        upcomingTasks.slice(0, 5).forEach(task => {
          upcomingContainer.appendChild(createMiniTaskRow(task));
        });
      }
    }
  }

  function createMiniTaskRow(task) {
    const row = document.createElement('div');
    row.className = `task-item priority-${task.priority} ${task.completed ? 'is-completed' : ''}`;
    
    const catColor = CategoryManager.getColorForCategory(task.category);

    row.innerHTML = `
      <button class="task-checkbox-btn" aria-label="Toggle task completion">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
      <div class="task-main">
        <div class="task-header-row">
          <span class="task-title"></span>
        </div>
        <div class="task-meta-row">
          <span class="badge category-badge">
            <span class="category-dot" style="background-color: ${catColor};"></span>
            ${escapeHtml(task.category)}
          </span>
          ${task.dueDate ? `<span class="badge date-badge ${isTaskOverdue(task) ? 'is-overdue' : ''}">${formatDateFriendly(task.dueDate)}</span>` : ''}
        </div>
      </div>
    `;

    row.querySelector('.task-title').textContent = task.title;

    row.querySelector('.task-checkbox-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      TaskManager.toggleComplete(task.id);
    });

    row.querySelector('.task-main').addEventListener('click', () => {
      openTaskDetailModal(task.id);
    });

    return row;
  }

  /* Render Main Task List View */
  function renderTasksView() {
    const taskListEl = document.getElementById('taskList');
    const emptyStateEl = document.getElementById('tasksEmptyState');
    if (!taskListEl || !emptyStateEl) return;

    taskListEl.innerHTML = '';

    const filtered = FilterEngine.getFilteredTasks();
    const sorted = FilterEngine.getSortedTasks(filtered);

    // Active filter banner check
    const isSearching = Boolean(AppState.searchQuery.trim());
    const isFiltered = AppState.filterPriority !== 'all' || AppState.filterCategory !== 'all';
    const filterBanner = document.getElementById('filterStatusBanner');
    const filterStatusText = document.getElementById('filterStatusText');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    if (isSearching || isFiltered) {
      if (filterBanner) {
        filterBanner.style.display = 'flex';
        let statusMsg = `Showing ${sorted.length} matching task${sorted.length === 1 ? '' : 's'}`;
        if (isSearching) statusMsg += ` for "${AppState.searchQuery}"`;
        filterStatusText.textContent = statusMsg;
      }
      if (resetFiltersBtn) resetFiltersBtn.style.display = 'inline-flex';
    } else {
      if (filterBanner) filterBanner.style.display = 'none';
      if (resetFiltersBtn) resetFiltersBtn.style.display = 'none';
    }

    if (sorted.length === 0) {
      emptyStateEl.style.display = 'block';
      const emptyTitle = document.getElementById('emptyStateTitle');
      const emptyDesc = document.getElementById('emptyStateDesc');

      if (isSearching || isFiltered) {
        emptyTitle.textContent = 'No matching tasks found';
        emptyDesc.textContent = 'Try adjusting your search query, priority, or category filters.';
      } else if (AppState.currentView === 'completed') {
        emptyTitle.textContent = 'No completed tasks yet';
        emptyDesc.textContent = 'Mark tasks as done to see them archived here.';
      } else if (AppState.currentView === 'overdue') {
        emptyTitle.textContent = 'No overdue tasks';
        emptyDesc.textContent = 'You are all caught up on your deadlines!';
      } else if (AppState.currentView === 'today') {
        emptyTitle.textContent = 'Nothing due today';
        emptyDesc.textContent = 'Plan tasks for today to focus your efforts.';
      } else {
        emptyTitle.textContent = 'No tasks in this list';
        emptyDesc.textContent = 'Create your first task to get organized!';
      }
    } else {
      emptyStateEl.style.display = 'none';
      sorted.forEach(task => {
        taskListEl.appendChild(createTaskCard(task));
      });
    }
  }

  function createTaskCard(task) {
    const li = document.createElement('li');
    li.className = `task-item priority-${task.priority} ${task.completed ? 'is-completed' : ''}`;
    li.setAttribute('data-task-id', task.id);

    const catColor = CategoryManager.getColorForCategory(task.category);
    const overdue = isTaskOverdue(task);
    const dueToday = isTaskDueToday(task);

    let dateBadgeClass = 'badge date-badge';
    if (overdue) dateBadgeClass += ' is-overdue';
    else if (dueToday) dateBadgeClass += ' is-today';

    li.innerHTML = `
      <button class="task-checkbox-btn" aria-label="${task.completed ? 'Reopen task' : 'Mark task completed'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>

      <div class="task-main" role="button" tabindex="0" aria-label="View task details">
        <div class="task-header-row">
          <span class="task-title"></span>
        </div>
        ${task.description ? `<p class="task-desc-preview"></p>` : ''}
        
        <div class="task-meta-row">
          <span class="badge priority-${task.priority}">
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>

          <span class="badge category-badge">
            <span class="category-dot" style="background-color: ${catColor};"></span>
            ${escapeHtml(task.category)}
          </span>

          ${task.dueDate ? `
            <span class="${dateBadgeClass}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${formatDateFriendly(task.dueDate)}${task.dueTime ? ' at ' + task.dueTime : ''}
            </span>
          ` : ''}

          ${task.hasReminder ? `
            <span class="badge reminder-badge" title="Reminder set">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 01-3.46 0"></path>
              </svg>
              Reminder
            </span>
          ` : ''}

          ${task.tags && task.tags.length > 0 ? task.tags.map(t => `
            <span class="badge tag-badge">#${escapeHtml(t)}</span>
          `).join('') : ''}
        </div>
      </div>

      <div class="task-actions">
        <button class="icon-button-subtle task-edit-btn" aria-label="Edit task" title="Edit Task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="icon-button-subtle task-delete-btn" aria-label="Delete task" title="Delete Task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Strict Safe Text Injection
    li.querySelector('.task-title').textContent = task.title;
    const descPreview = li.querySelector('.task-desc-preview');
    if (descPreview && task.description) {
      descPreview.textContent = task.description;
    }

    // Event Handlers
    li.querySelector('.task-checkbox-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      TaskManager.toggleComplete(task.id);
    });

    li.querySelector('.task-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openTaskEditModal(task.id);
    });

    li.querySelector('.task-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      TaskManager.deleteTask(task.id);
    });

    const mainClick = li.querySelector('.task-main');
    mainClick.addEventListener('click', () => openTaskDetailModal(task.id));
    mainClick.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openTaskDetailModal(task.id);
      }
    });

    return li;
  }

  /* Render Insights & Analytics View */
  function renderInsightsView() {
    const today = getTodayDateString();
    const completedTasks = AppState.tasks.filter(t => t.completed);
    
    // 1. Completed Today
    const completedToday = completedTasks.filter(t => {
      if (!t.completedAt) return false;
      return t.completedAt.startsWith(today);
    }).length;
    setElementText('insightsCompletedToday', completedToday);

    // 2. Completed This Week (past 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const completedWeek = completedTasks.filter(t => {
      if (!t.completedAt) return false;
      return new Date(t.completedAt) >= sevenDaysAgo;
    }).length;
    setElementText('insightsCompletedWeek', completedWeek);

    // 3. Completion Rate
    const totalCount = AppState.tasks.length;
    const rate = totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;
    setElementText('insightsRate', `${rate}%`);

    // 4. Focus Sessions Completed
    setElementText('insightsFocusDone', AppState.focusStats.allTimeSessions);

    // 5. 7-Day Completion Bar Chart
    renderCompletionChart();

    // 6. Breakdowns
    renderBreakdowns();
  }

  function renderCompletionChart() {
    const chartBars = document.getElementById('completionChartBars');
    if (!chartBars) return;

    chartBars.innerHTML = '';
    const daysData = [];

    // Calculate actual task completion count per day for the last 7 calendar days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });

      const count = AppState.tasks.filter(t => {
        return t.completed && t.completedAt && t.completedAt.startsWith(dateStr);
      }).length;

      daysData.push({ dateStr, dayName, count });
    }

    const maxCount = Math.max(1, ...daysData.map(d => d.count));

    daysData.forEach(item => {
      const col = document.createElement('div');
      col.className = 'chart-bar-col';
      const heightPercent = Math.max(4, Math.round((item.count / maxCount) * 100));

      col.innerHTML = `
        <span class="chart-bar-val">${item.count}</span>
        <div class="chart-bar-wrapper">
          <div class="chart-bar-fill" style="height: ${heightPercent}%;"></div>
        </div>
        <span class="chart-bar-label">${item.dayName}</span>
      `;
      chartBars.appendChild(col);
    });
  }

  function renderBreakdowns() {
    // Priority Breakdown
    const priorityList = document.getElementById('priorityBreakdownList');
    if (priorityList) {
      priorityList.innerHTML = '';
      const total = AppState.tasks.length || 1;
      const priorities = [
        { key: 'high', name: 'High Priority', color: 'var(--priority-high)' },
        { key: 'medium', name: 'Medium Priority', color: 'var(--priority-medium)' },
        { key: 'low', name: 'Low Priority', color: 'var(--priority-low)' }
      ];

      priorities.forEach(p => {
        const count = AppState.tasks.filter(t => t.priority === p.key).length;
        const pct = Math.round((count / total) * 100);

        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `
          <div class="breakdown-header">
            <span class="breakdown-label">${p.name}</span>
            <span class="breakdown-count">${count} (${pct}%)</span>
          </div>
          <div class="breakdown-bar-track">
            <div class="breakdown-bar-fill" style="width: ${pct}%; background-color: ${p.color};"></div>
          </div>
        `;
        priorityList.appendChild(row);
      });
    }

    // Category Breakdown
    const catList = document.getElementById('categoryBreakdownList');
    if (catList) {
      catList.innerHTML = '';
      const total = AppState.tasks.length || 1;

      AppState.categories.forEach(cat => {
        const count = AppState.tasks.filter(t => t.category.toLowerCase() === cat.name.toLowerCase()).length;
        const pct = Math.round((count / total) * 100);

        const row = document.createElement('div');
        row.className = 'breakdown-row';
        row.innerHTML = `
          <div class="breakdown-header">
            <span class="breakdown-label">
              <span class="category-dot" style="background-color: ${cat.color};"></span>
              <span class="cat-name"></span>
            </span>
            <span class="breakdown-count">${count} (${pct}%)</span>
          </div>
          <div class="breakdown-bar-track">
            <div class="breakdown-bar-fill" style="width: ${pct}%; background-color: ${cat.color};"></div>
          </div>
        `;
        row.querySelector('.cat-name').textContent = cat.name;
        catList.appendChild(row);
      });
    }
  }

  /* Render Settings Categories Manager */
  function renderSettingsCategories() {
    const list = document.getElementById('settingsCategoriesList');
    if (!list) return;

    list.innerHTML = '';
    AppState.categories.forEach(cat => {
      const item = document.createElement('div');
      item.className = 'category-manage-item';
      const taskCount = AppState.tasks.filter(t => t.category.toLowerCase() === cat.name.toLowerCase()).length;

      item.innerHTML = `
        <div class="cat-item-left">
          <span class="category-dot" style="background-color: ${cat.color}; width: 12px; height: 12px;"></span>
          <span class="cat-item-name"></span>
          <span class="badge-pill">${taskCount} tasks</span>
        </div>
        <div class="cat-item-right">
          ${cat.isCustom ? `
            <button class="btn btn-ghost btn-sm text-danger cat-del-btn" aria-label="Delete category">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
              <span>Delete</span>
            </button>
          ` : `
            <span class="badge-pill">Default</span>
          `}
        </div>
      `;

      item.querySelector('.cat-item-name').textContent = cat.name;

      const delBtn = item.querySelector('.cat-del-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          CategoryManager.deleteCategory(cat.id);
        });
      }

      list.appendChild(item);
    });
  }

  /* Render Timer Stats in Pomodoro View */
  function renderTimerStats() {
    setElementText('timerTodaySessions', AppState.focusStats.todaySessions);
    setElementText('timerTodayMinutes', `${AppState.focusStats.todayMinutes}m`);
    setElementText('timerTotalSessions', AppState.focusStats.allTimeSessions);
  }

  /* ==========================================================================
     14. MODAL DIALOG CONTROLLERS
     ========================================================================== */
  function openTaskCreateModal() {
    document.getElementById('taskModalTitle').textContent = 'Create New Task';
    document.getElementById('taskIdInput').value = '';
    document.getElementById('taskTitleInput').value = '';
    document.getElementById('taskDescInput').value = '';
    document.getElementById('taskPriorityInput').value = 'medium';
    
    // Default category matching current view or Personal
    let defaultCat = 'Personal';
    if (AppState.currentView.startsWith('category-')) {
      const catId = AppState.currentView.replace('category-', '');
      const currentCat = AppState.categories.find(c => c.id === catId);
      if (currentCat) defaultCat = currentCat.name;
    }
    document.getElementById('taskCategoryInput').value = defaultCat;

    // Default due date to today if on My Day
    if (AppState.currentView === 'today') {
      document.getElementById('taskDueDateInput').value = getTodayDateString();
    } else {
      document.getElementById('taskDueDateInput').value = '';
    }
    document.getElementById('taskDueTimeInput').value = '';
    document.getElementById('taskTagsInput').value = '';
    
    const reminderCheck = document.getElementById('taskHasReminder');
    reminderCheck.checked = false;
    document.getElementById('reminderInputsContainer').style.display = 'none';
    document.getElementById('taskReminderInput').value = '';

    document.getElementById('taskTitleError').textContent = '';
    ModalService.open('taskModalBackdrop');
  }

  function openTaskEditModal(taskId) {
    const task = AppState.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('taskModalTitle').textContent = 'Edit Task';
    document.getElementById('taskIdInput').value = task.id;
    document.getElementById('taskTitleInput').value = task.title;
    document.getElementById('taskDescInput').value = task.description;
    document.getElementById('taskPriorityInput').value = task.priority;
    document.getElementById('taskCategoryInput').value = task.category;
    document.getElementById('taskDueDateInput').value = task.dueDate || '';
    document.getElementById('taskDueTimeInput').value = task.dueTime || '';
    document.getElementById('taskTagsInput').value = task.tags ? task.tags.join(', ') : '';
    
    const reminderCheck = document.getElementById('taskHasReminder');
    reminderCheck.checked = Boolean(task.hasReminder);
    document.getElementById('reminderInputsContainer').style.display = task.hasReminder ? 'flex' : 'none';
    document.getElementById('taskReminderInput').value = task.reminderTime || '';

    document.getElementById('taskTitleError').textContent = '';
    ModalService.open('taskModalBackdrop');
  }

  function openTaskDetailModal(taskId) {
    const task = AppState.tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('detailModalBackdrop');
    document.getElementById('detailModalTitle').textContent = task.title;
    
    const descEl = document.getElementById('detailModalDesc');
    descEl.textContent = task.description || 'No description provided.';

    // Priority badge
    const pBadge = document.getElementById('detailPriorityBadge');
    pBadge.className = `badge priority-${task.priority}`;
    pBadge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

    // Category badge
    const cBadge = document.getElementById('detailCategoryBadge');
    cBadge.textContent = task.category;

    // Status badge
    const sBadge = document.getElementById('detailStatusBadge');
    sBadge.className = `badge ${task.completed ? 'status-badge-completed' : 'status-badge-pending'}`;
    sBadge.textContent = task.completed ? 'Completed' : 'Pending';

    // Due date
    const dueEl = document.getElementById('detailDueDateValue');
    if (task.dueDate) {
      dueEl.textContent = `${formatDateFriendly(task.dueDate)}${task.dueTime ? ' at ' + task.dueTime : ''}`;
    } else {
      dueEl.textContent = 'None';
    }

    // Reminder
    const remEl = document.getElementById('detailReminderValue');
    remEl.textContent = task.hasReminder && task.reminderTime ? formatDateTimeFriendly(task.reminderTime) : 'None';

    // Timestamps
    document.getElementById('detailCreatedValue').textContent = formatDateTimeFriendly(task.createdAt);
    document.getElementById('detailCompletedValue').textContent = task.completed ? formatDateTimeFriendly(task.completedAt) : 'In progress';

    // Tags
    const tagsList = document.getElementById('detailTagsList');
    tagsList.innerHTML = '';
    if (task.tags && task.tags.length > 0) {
      task.tags.forEach(t => {
        const chip = document.createElement('span');
        chip.className = 'badge tag-badge';
        chip.textContent = `#${t}`;
        tagsList.appendChild(chip);
      });
      document.getElementById('detailTagsSection').style.display = 'block';
    } else {
      document.getElementById('detailTagsSection').style.display = 'none';
    }

    // Toggle button text
    const toggleBtnText = document.getElementById('detailToggleStatusText');
    toggleBtnText.textContent = task.completed ? 'Reopen Task' : 'Mark Completed';

    // Attach actions
    const toggleBtn = document.getElementById('detailToggleStatusBtn');
    toggleBtn.onclick = () => {
      TaskManager.toggleComplete(task.id);
      openTaskDetailModal(task.id);
    };

    const editBtn = document.getElementById('detailEditBtn');
    editBtn.onclick = () => {
      ModalService.close('detailModalBackdrop');
      openTaskEditModal(task.id);
    };

    const deleteBtn = document.getElementById('detailDeleteBtn');
    deleteBtn.onclick = () => {
      TaskManager.deleteTask(task.id);
    };

    ModalService.open('detailModalBackdrop');
  }

  function openCategoryCreateModal() {
    document.getElementById('categoryNameInput').value = '';
    document.getElementById('categoryNameError').textContent = '';
    document.getElementById('categoryColorInput').value = '#2563eb';

    // Reset active swatch
    document.querySelectorAll('.swatch-btn').forEach(btn => {
      const isDefault = btn.getAttribute('data-color') === '#2563eb';
      btn.classList.toggle('active', isDefault);
      btn.setAttribute('aria-checked', isDefault ? 'true' : 'false');
    });

    ModalService.open('categoryModalBackdrop');
  }

  /* ==========================================================================
     15. PERIODIC IN-APP REMINDER CHECKER
     ========================================================================== */
  function startReminderChecker() {
    setInterval(() => {
      const now = new Date();
      AppState.tasks.forEach(task => {
        if (!task.completed && task.hasReminder && task.reminderTime && !task.reminderFired) {
          const reminderDate = new Date(task.reminderTime);
          if (reminderDate <= now) {
            task.reminderFired = true;
            StorageService.saveTasks();
            AudioService.playChime();
            ToastService.show(`Reminder: "${task.title}" is due!`, 'warning', 6000);
          }
        }
      });
    }, 15000); // Check every 15 seconds
  }

  /* ==========================================================================
     16. EVENT LISTENERS & WIRING
     ========================================================================== */
  function setupEventListeners() {
    // 1. Navigation switching
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if (view) NavigationService.switchView(view);
      });
    });

    // Brand link
    document.getElementById('brandLink').addEventListener('click', (e) => {
      e.preventDefault();
      NavigationService.switchView('dashboard');
    });

    // Dashboard jump buttons
    document.getElementById('dashGoToMyDayBtn').addEventListener('click', () => {
      NavigationService.switchView('today');
    });
    document.getElementById('dashGoToUpcomingBtn').addEventListener('click', () => {
      NavigationService.switchView('upcoming');
    });

    // 2. New Task Triggers
    const openAddModal = () => openTaskCreateModal();
    document.getElementById('sidebarNewTaskBtn').addEventListener('click', openAddModal);
    document.getElementById('headerNewTaskBtn').addEventListener('click', openAddModal);
    document.getElementById('emptyStateActionBtn').addEventListener('click', openAddModal);

    // 3. Task Form Submit
    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const taskId = document.getElementById('taskIdInput').value;
      const title = document.getElementById('taskTitleInput').value.trim();
      const errorEl = document.getElementById('taskTitleError');

      if (!title) {
        errorEl.textContent = 'Please enter a task title.';
        document.getElementById('taskTitleInput').focus();
        return;
      }
      errorEl.textContent = '';

      const tagsRaw = document.getElementById('taskTagsInput').value;
      const tags = tagsRaw
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(t => t.length > 0);

      const hasReminder = document.getElementById('taskHasReminder').checked;
      const reminderTime = hasReminder ? document.getElementById('taskReminderInput').value : '';

      const formData = {
        title: title,
        description: document.getElementById('taskDescInput').value,
        priority: document.getElementById('taskPriorityInput').value,
        category: document.getElementById('taskCategoryInput').value,
        dueDate: document.getElementById('taskDueDateInput').value,
        dueTime: document.getElementById('taskDueTimeInput').value,
        tags: tags,
        hasReminder: hasReminder,
        reminderTime: reminderTime
      };

      let result;
      if (taskId) {
        result = TaskManager.updateTask(taskId, formData);
      } else {
        result = TaskManager.createTask(formData);
      }

      if (result.success) {
        ModalService.close('taskModalBackdrop');
      } else {
        errorEl.textContent = result.error || 'Failed to save task.';
      }
    });

    // Reminder toggle inside Task Form
    document.getElementById('taskHasReminder').addEventListener('change', (e) => {
      document.getElementById('reminderInputsContainer').style.display = e.target.checked ? 'flex' : 'none';
    });

    // Cancel / Close task modal
    document.getElementById('closeTaskModalBtn').addEventListener('click', () => ModalService.close('taskModalBackdrop'));
    document.getElementById('cancelTaskModalBtn').addEventListener('click', () => ModalService.close('taskModalBackdrop'));

    // Task Detail modal close
    document.getElementById('closeDetailModalBtn').addEventListener('click', () => ModalService.close('detailModalBackdrop'));

    // 4. Custom Category Modal
    const openCatModal = () => openCategoryCreateModal();
    document.getElementById('addCategoryBtn').addEventListener('click', openCatModal);
    document.getElementById('settingsAddCategoryBtn').addEventListener('click', openCatModal);
    document.getElementById('closeCategoryModalBtn').addEventListener('click', () => ModalService.close('categoryModalBackdrop'));
    document.getElementById('cancelCategoryModalBtn').addEventListener('click', () => ModalService.close('categoryModalBackdrop'));

    // Category Color Swatches
    document.querySelectorAll('.swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.swatch-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        document.getElementById('categoryColorInput').value = btn.getAttribute('data-color');
      });
    });

    // Category Form Submit
    document.getElementById('categoryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('categoryNameInput').value.trim();
      const color = document.getElementById('categoryColorInput').value;
      const errorEl = document.getElementById('categoryNameError');

      if (!name) {
        errorEl.textContent = 'Category name is required.';
        return;
      }

      const res = CategoryManager.addCategory(name, color);
      if (res.success) {
        ModalService.close('categoryModalBackdrop');
      } else {
        errorEl.textContent = res.error;
      }
    });

    // 5. Confirmation Modal
    document.getElementById('confirmProceedBtn').addEventListener('click', () => {
      if (typeof AppState.pendingConfirmAction === 'function') {
        const action = AppState.pendingConfirmAction;
        AppState.pendingConfirmAction = null;
        action();
      }
      ModalService.close('confirmModalBackdrop');
    });
    document.getElementById('confirmCancelBtn').addEventListener('click', () => ModalService.close('confirmModalBackdrop'));
    document.getElementById('closeConfirmModalBtn').addEventListener('click', () => ModalService.close('confirmModalBackdrop'));

    // 6. Global Search
    const searchInput = document.getElementById('globalSearchInput');
    const clearSearchBtn = document.getElementById('searchClearBtn');

    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      clearSearchBtn.style.display = e.target.value ? 'flex' : 'none';
      if (AppState.currentView === 'dashboard' || AppState.currentView === 'timer' || AppState.currentView === 'insights' || AppState.currentView === 'settings') {
        NavigationService.switchView('all');
      } else {
        renderTasksView();
      }
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      AppState.searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderTasksView();
      searchInput.focus();
    });

    // 7. Toolbar Filters & Sort
    document.getElementById('filterPriority').addEventListener('change', (e) => {
      AppState.filterPriority = e.target.value;
      renderTasksView();
    });

    document.getElementById('filterCategory').addEventListener('change', (e) => {
      AppState.filterCategory = e.target.value;
      renderTasksView();
    });

    document.getElementById('sortTasksBy').addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      renderTasksView();
    });

    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
      AppState.searchQuery = '';
      AppState.filterPriority = 'all';
      AppState.filterCategory = 'all';
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      document.getElementById('filterPriority').value = 'all';
      document.getElementById('filterCategory').value = 'all';
      renderTasksView();
    });

    document.getElementById('dismissFilterBannerBtn').addEventListener('click', () => {
      document.getElementById('resetFiltersBtn').click();
    });

    // Batch Clear Completed
    document.getElementById('clearCompletedBtn').addEventListener('click', () => {
      TaskManager.clearCompleted();
    });

    // 8. Pomodoro Focus Timer
    document.getElementById('tabFocus').addEventListener('click', () => FocusTimer.setMode('focus'));
    document.getElementById('tabShortBreak').addEventListener('click', () => FocusTimer.setMode('short-break'));
    document.getElementById('tabLongBreak').addEventListener('click', () => FocusTimer.setMode('long-break'));

    document.getElementById('timerToggleBtn').addEventListener('click', () => FocusTimer.toggle());
    document.getElementById('timerResetBtn').addEventListener('click', () => FocusTimer.reset());

    document.getElementById('timerTaskSelect').addEventListener('change', (e) => {
      AppState.timer.activeTaskId = e.target.value;
      const task = AppState.tasks.find(t => t.id === e.target.value);
      const activeTaskNameEl = document.getElementById('timerActiveTaskName');
      activeTaskNameEl.textContent = task ? `Focusing on: ${task.title}` : '';
    });

    // Sound toggle
    document.getElementById('timerSoundToggleBtn').addEventListener('click', () => {
      AppState.timer.soundEnabled = !AppState.timer.soundEnabled;
      StorageService.savePreferences();
      updateSoundButtonUI();
      ToastService.show(`Audio chimes ${AppState.timer.soundEnabled ? 'enabled' : 'disabled'}`, 'info');
    });

    // 9. Theme Toggle
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEYS.THEME, next);
      ToastService.show(`Switched to ${next} theme`, 'info');
    });

    // 10. Data Backup / Restore / Reset
    document.getElementById('exportDataBtn').addEventListener('click', () => StorageService.exportData());
    
    const fileInput = document.getElementById('importFileInput');
    document.getElementById('importDataBtn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        StorageService.importData(e.target.files[0]);
        fileInput.value = '';
      }
    });

    document.getElementById('resetAppBtn').addEventListener('click', () => StorageService.resetAll());

    // 11. Mobile Drawer Navigation
    document.getElementById('mobileMenuBtn').addEventListener('click', openMobileSidebar);
    document.getElementById('closeSidebarBtn').addEventListener('click', closeMobileSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeMobileSidebar);

    // 12. Keyboard Shortcuts Dialog
    document.getElementById('shortcutsBtn').addEventListener('click', () => ModalService.open('shortcutsModalBackdrop'));
    document.getElementById('closeShortcutsModalBtn').addEventListener('click', () => ModalService.close('shortcutsModalBackdrop'));
    document.getElementById('dismissShortcutsBtn').addEventListener('click', () => ModalService.close('shortcutsModalBackdrop'));

    // Global Keydown Handler
    window.addEventListener('keydown', handleGlobalKeydown);

    // Click outside backdrop to dismiss modal
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          ModalService.close(backdrop.id);
        }
      });
    });
  }

  function openMobileSidebar() {
    document.getElementById('sidebar').classList.add('mobile-open');
    document.getElementById('sidebarOverlay').classList.add('active');
  }

  function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  }

  function updateSoundButtonUI() {
    const onIcon = document.getElementById('soundOnIcon');
    const offIcon = document.getElementById('soundOffIcon');
    const text = document.getElementById('soundStatusText');
    if (AppState.timer.soundEnabled) {
      onIcon.style.display = 'block';
      offIcon.style.display = 'none';
      text.textContent = 'Chime On';
    } else {
      onIcon.style.display = 'none';
      offIcon.style.display = 'block';
      text.textContent = 'Chime Off';
    }
  }

  /* Global Keyboard Shortcuts (N, /, Esc, ?, Ctrl+Enter) */
  function handleGlobalKeydown(e) {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    const isTyping = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

    // 1. Escape: Close any open modal
    if (e.key === 'Escape') {
      if (AppState.activeModal) {
        ModalService.closeActive();
      } else {
        closeMobileSidebar();
      }
      return;
    }

    // 2. Ctrl+Enter or Cmd+Enter: Submit active modal form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (AppState.activeModal) {
        const submitBtn = AppState.activeModal.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.click();
          e.preventDefault();
        }
      }
      return;
    }

    // Do not trigger single-key navigation shortcuts while actively editing text
    if (isTyping) return;

    // 3. 'N' key: Open new task modal
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      openTaskCreateModal();
      return;
    }

    // 4. '/' key: Focus search input
    if (e.key === '/') {
      e.preventDefault();
      const search = document.getElementById('globalSearchInput');
      if (search) search.focus();
      return;
    }

    // 5. '?' key: Open keyboard shortcuts modal
    if (e.key === '?') {
      e.preventDefault();
      ModalService.open('shortcutsModalBackdrop');
      return;
    }
  }

  /* ==========================================================================
     17. BOOTSTRAP INITIALIZATION
     ========================================================================== */
  function init() {
    ToastService.init();
    StorageService.load();
    FocusTimer.init();
    updateSoundButtonUI();
    renderAll();
    setupEventListeners();
    startReminderChecker();
    console.log('TaskFlow initialized successfully.');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for testing, browser console debugging, and extensibility
  window.TaskFlow = {
    AppState,
    TaskManager,
    CategoryManager,
    FocusTimer,
    StorageService,
    NavigationService,
    ModalService,
    ToastService,
    FilterEngine
  };

})();
