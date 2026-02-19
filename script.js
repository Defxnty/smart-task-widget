const createStore = (initialState) => {
    let state = initialState;
    let listeners = [];
    
    return {
        getState: () => state,
        setState: (newState) => {
            state = typeof newState === 'function' ? newState(state) : newState;
            listeners.forEach(listener => listener(state));
        },
        subscribe: (listener) => {
            listeners.push(listener);
            return () => {
                listeners = listeners.filter(l => l !== listener);
            };
        }
    };
};

const useTasks = (store) => {
    const STORAGE_KEY = 'smart-tasks-v1';
    
    const loadFromStorage = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    };
    
    const saveToStorage = (tasks) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    };
    
    const initTasks = () => {
        const tasks = loadFromStorage();
        store.setState(prev => ({ ...prev, tasks }));
    };
    
    const addTask = (text) => {
        if (!text.trim()) return;
        
        const newTask = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        store.setState(prev => ({
            ...prev,
            tasks: [...prev.tasks, newTask], 
        }));
    };
    
    const toggleTask = (id) => {
        store.setState(prev => ({
            ...prev,
            tasks: prev.tasks.map(task => 
                task.id === id 
                    ? { ...task, completed: !task.completed }
                    : task
            )
        }));
    };
    
    const deleteTask = (id) => {
        store.setState(prev => ({
            ...prev,
            tasks: prev.tasks.filter(task => task.id !== id) 
        }));
    };
    
    const setFilter = (filter) => {
        store.setState(prev => ({ ...prev, filter }));
    };
    
    const getDerivedState = (state) => {
        const { tasks, filter } = state;
        
        const filteredTasks = tasks.filter(task => {
            if (filter === 'active') return !task.completed;
            if (filter === 'completed') return task.completed;
            return true;
        });
        
        const counters = {
            total: tasks.length,
            active: tasks.filter(t => !t.completed).length,
            completed: tasks.filter(t => t.completed).length
        };
        
        return { filteredTasks, counters };
    };
    
    const syncEffect = (state) => {
        saveToStorage(state.tasks);
    };
    
    return {
        initTasks,
        addTask,
        toggleTask,
        deleteTask,
        setFilter,
        getDerivedState,
        syncEffect
    };
};

const Header = () => `
    <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-white mb-1">
            <span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                ✨ Smart Tasks
            </span>
        </h1>
        <p class="text-slate-400 text-sm">Organize your day efficiently</p>
    </div>
`;

const TaskInput = () => `
    <form id="task-form" class="mb-6">
        <div class="flex gap-2">
            <input
                type="text"
                id="task-input"
                placeholder="Добавить задачу..."
                class="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                       text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500
                       focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <button
                type="submit"
                class="cursor-pointer px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 
                       text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600
                       transition-all hover:shadow-lg hover:shadow-purple-500/25 active:scale-95"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
            </button>
        </div>
    </form>
`;

const FilterBar = (currentFilter) => `
    <div class="mb-4 p-1 bg-slate-800/30 rounded-xl">
        <div class="flex justify-center gap-1">
            ${['all', 'active', 'completed'].map(filter => `
                <button
                    data-filter="${filter}"
                    class="filter-btn cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-all
                           ${currentFilter === filter ? 'active' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}"
                >
                    ${filter === 'all' ? 'Все' : filter === 'active' ? 'Активные' : 'Завершённые'}
                </button>
            `).join('')}
        </div>
    </div>
`;

const TaskItem = (task) => `
    <div class="task-enter group flex items-center gap-3 p-4 bg-slate-800/40 rounded-xl
                border border-slate-700/50 hover:border-slate-600 transition-all"
         data-task-id="${task.id}">
        <label class="relative flex items-center cursor-pointer">
            <input
                type="checkbox"
                ${task.completed ? 'checked' : ''}
                data-toggle="${task.id}"
                class="checkbox-custom w-5 h-5 rounded-md border-2 border-slate-600 
                       appearance-none cursor-pointer checked:border-transparent"
            />
            <svg class="absolute w-3 h-3 left-1 top-1 text-white pointer-events-none 
                        ${task.completed ? 'opacity-100' : 'opacity-0'}" 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
        </label>
        <span class="flex-1 text-slate-200 ${task.completed ? 'task-text-completed' : ''}">
            ${task.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </span>
        <button
            data-delete="${task.id}"
            class="cursor-pointer opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 
                   hover:bg-red-500/10 rounded-lg transition-all"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    </div>
`;

const TaskList = (tasks) => {
    if (tasks.length === 0) {
        return `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📝</div>
                <p class="text-slate-500">Нет задач для отображения</p>
            </div>
        `;
    }
    
    return `
        <div class="task-list space-y-2 max-h-80 overflow-y-auto pr-1">
            ${tasks.map(task => TaskItem(task)).join('')}
        </div>
    `;
};

const FooterStats = (counters) => `
    <div class="mt-6 pt-4 border-t border-slate-700/50">
        <div class="flex justify-center gap-6">
            <div class="text-center">
                <div class="text-2xl font-bold text-white">${counters.total}</div>
                <div class="text-xs text-slate-500">Всего</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-indigo-400">${counters.active}</div>
                <div class="text-xs text-slate-500">Активных</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-green-400">${counters.completed}</div>
                <div class="text-xs text-slate-500">Готово</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-purple-400">
                    ${counters.total > 0 ? Math.round((counters.completed / counters.total) * 100) : 0}%
                </div>
                <div class="text-xs text-slate-500">Прогресс</div>
            </div>
        </div>
    </div>
`;

const App = (state, derivedState) => `
    <div class="w-full max-w-md">
        <div class="bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl 
                    border border-slate-700/50 p-6">
            ${Header()}
            ${TaskInput()}
            ${FilterBar(state.filter)}
            ${TaskList(derivedState.filteredTasks)}
            ${FooterStats(derivedState.counters)}
        </div>
    </div>
`;

const store = createStore({
    tasks: [],
    filter: 'all',
});

const tasks = useTasks(store);

const render = () => {
    const state = store.getState();
    const derivedState = tasks.getDerivedState(state);
    
    document.getElementById('app').innerHTML = App(state, derivedState);
    
    attachEventListeners();
};

const attachEventListeners = () => {
    const form = document.getElementById('task-form');
    const input = document.getElementById('task-input');
    
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        tasks.addTask(input.value);
        input.value = '';
        input.focus();
    });
    
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            tasks.setFilter(btn.dataset.filter);
        });
    });
    
    document.querySelectorAll('[data-toggle]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            tasks.toggleTask(Number(checkbox.dataset.toggle));
        });
    });
    
    document.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            tasks.deleteTask(Number(btn.dataset.delete));
        });
    });
};

store.subscribe((state) => {
    render();
    tasks.syncEffect(state);
});

tasks.initTasks();
render();
