import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, UserStats } from '../types';
import { CheckSquare, Square, Trash2, Plus, Clock, AlertCircle, Calendar as CalendarIcon, CalendarDays, AlertTriangle, ArrowRight, History, ChevronLeft, ChevronRight, RotateCcw, CornerDownRight, ChevronDown } from 'lucide-react';

interface ProductivityProps {
    tasks: Task[];
    stats: UserStats;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onAddTask: (task: Partial<Task>) => void;
}

export const Productivity: React.FC<ProductivityProps> = ({ tasks, stats, onToggleTask, onDeleteTask, onAddTask }) => {
    // View Mode State
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    
    // Current Date being viewed (defaults to Today)
    const [currentViewDate, setCurrentViewDate] = useState(new Date());

    // Form State
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [duration, setDuration] = useState(60);
    const [category, setCategory] = useState<TaskCategory>('work');

    // Sync form date when view date changes (helpful when clicking a day in calendar)
    useEffect(() => {
        // We update the form date whenever the viewed date changes, 
        // so adding a task defaults to the currently viewed day.
        setDate(currentViewDate.toISOString().split('T')[0]);
    }, [currentViewDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAddTask({
                title,
                startTime: time || '00:00',
                date: new Date(date).toISOString(),
                durationMinutes: duration,
                category,
                completed: false,
                xpReward: category === 'wasted' ? 0 : (duration >= 60 ? 100 : 50)
            });
            setTitle('');
            setTime('');
        }
    };

    const handleJumpToDate = (isoDate: string | Date) => {
        const targetDate = new Date(isoDate);
        // Fix timezone offset issues by setting hours to 12
        targetDate.setHours(12, 0, 0, 0);
        setCurrentViewDate(targetDate);
        setViewMode('day');
    };

    const navigateDay = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentViewDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        setCurrentViewDate(newDate);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentViewDate);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        setCurrentViewDate(newDate);
    }

    const resetToToday = () => {
        setCurrentViewDate(new Date());
        setViewMode('day');
    };

    const getCategoryColor = (cat: TaskCategory) => {
        switch(cat) {
            case 'work': return 'bg-blue-600/20 border-l-4 border-blue-500 text-blue-100';
            case 'study': return 'bg-purple-600/20 border-l-4 border-purple-500 text-purple-100';
            case 'workout': return 'bg-emerald-600/20 border-l-4 border-emerald-500 text-emerald-100';
            case 'wasted': return 'bg-red-600/20 border-l-4 border-red-500 text-red-100 opacity-60';
            case 'leisure': return 'bg-pink-600/20 border-l-4 border-pink-500 text-pink-100';
            default: return 'bg-slate-700/50 border-l-4 border-slate-500 text-slate-300';
        }
    };

    // --- Filter Logic ---
    const isViewingToday = () => {
        const today = new Date();
        return currentViewDate.getDate() === today.getDate() &&
               currentViewDate.getMonth() === today.getMonth() &&
               currentViewDate.getFullYear() === today.getFullYear();
    };

    const getFilteredTasks = () => {
        const viewDateStart = new Date(currentViewDate);
        viewDateStart.setHours(0,0,0,0);
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        return tasks.filter(task => {
            const taskDate = new Date(task.date);
            taskDate.setHours(0,0,0,0);
            
            if (viewMode === 'day') {
                // If viewing Today: Return Today's tasks AND Past Incomplete tasks
                if (isViewingToday()) {
                    return taskDate.getTime() === today.getTime() || (taskDate < today && !task.completed);
                }
                // If viewing another day: Return only that day's tasks
                return taskDate.getTime() === viewDateStart.getTime();

            } else if (viewMode === 'week') {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const endOfWeek = new Date(today);
                endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
                return taskDate >= startOfWeek && taskDate <= endOfWeek;
            } 
            // Note: Month filtering is handled separately in the Calendar Grid logic
            return true;
        }).sort((a, b) => {
            if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
            const timeA = a.startTime || '23:59';
            const timeB = b.startTime || '23:59';
            return timeA.localeCompare(timeB);
        });
    };

    const filteredTasks = getFilteredTasks();
    const pendingCount = filteredTasks.filter(t => !t.completed).length;

    // Helper to group tasks
    const todayRef = new Date();
    todayRef.setHours(0,0,0,0);

    // Split tasks for Day View logic
    const overdueTasks = (viewMode === 'day' && isViewingToday()) 
        ? filteredTasks.filter(t => new Date(t.date) < todayRef) 
        : [];
    
    const viewDateTasks = (viewMode === 'day')
        ? filteredTasks.filter(t => {
            if (isViewingToday()) return new Date(t.date) >= todayRef; // Today's tasks
            return true; // All tasks for the selected historical date
        })
        : [];

    const groupedTasks: { [key: string]: Task[] } = {};
    if (viewMode === 'week') {
        filteredTasks.forEach(task => {
            const dateKey = new Date(task.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
            if (!groupedTasks[dateKey]) groupedTasks[dateKey] = [];
            groupedTasks[dateKey].push(task);
        });
    }

    // --- CALENDAR GRID GENERATION ---
    const generateCalendarDays = () => {
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        // Add empty slots for days before the 1st
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    return (
        <div className="p-4 md:p-8 flex flex-col max-w-7xl mx-auto pb-32">
            <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <CheckSquare className="text-emerald-500" /> Cronograma
                    </h1>
                    <p className="text-slate-400">Gerenciamento de tempo Macro e Micro.</p>
                </div>

                <div className={`px-6 py-3 rounded-lg border flex items-center gap-4 shadow-lg ${pendingCount > 0 ? 'bg-amber-900/30 border-amber-500/50' : 'bg-emerald-900/30 border-emerald-500/50'}`}>
                     {pendingCount > 0 ? <AlertTriangle className="text-amber-500" size={24} /> : <CheckSquare className="text-emerald-500" size={24}/>}
                     <div>
                         <p className={`text-xs font-bold uppercase ${pendingCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>Status Atual</p>
                         <p className="text-white font-bold text-lg">{pendingCount > 0 ? `${pendingCount} Tarefas Pendentes` : 'Tudo Feito!'}</p>
                     </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Agendamento Manual */}
                <div className="md:col-span-1">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit shadow-xl sticky top-4">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-lg">
                            <Plus size={20} className="text-blue-400"/> Novo Evento
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">O que fazer?</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Reunião de Alinhamento"
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3.5 mt-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Data</label>
                                    <input 
                                        type="date" 
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3.5 mt-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Início</label>
                                    <input 
                                        type="time" 
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3.5 mt-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Duração (min)</label>
                                    <input 
                                        type="number" 
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3.5 mt-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Categoria</label>
                                    <select 
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as TaskCategory)}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3.5 mt-2 focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="work">Trabalho</option>
                                        <option value="study">Estudo</option>
                                        <option value="workout">Treino</option>
                                        <option value="routine">Rotina</option>
                                        <option value="leisure">Lazer</option>
                                        <option value="wasted">Tempo Ocioso</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-blue-900/20 mt-2">
                            Agendar
                            </button>
                        </form>
                    </div>
                </div>

                {/* Área de Visualização (Dia / Semana / Calendário) */}
                <div className="md:col-span-2 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col relative shadow-2xl min-h-[600px]">
                    
                    {/* View Switcher Tabs */}
                    <div className="flex border-b border-slate-800 bg-slate-950 sticky top-0 z-20 rounded-t-xl">
                        <button 
                            onClick={() => { setViewMode('day'); resetToToday(); }}
                            className={`flex-1 py-5 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${viewMode === 'day' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
                        >
                            <Clock size={16} /> Dia
                        </button>
                        <button 
                            onClick={() => setViewMode('week')}
                            className={`flex-1 py-5 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${viewMode === 'week' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
                        >
                            <CalendarIcon size={16} /> Semana
                        </button>
                        <button 
                            onClick={() => setViewMode('month')}
                            className={`flex-1 py-5 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${viewMode === 'month' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}
                        >
                            <CalendarDays size={16} /> Mês
                        </button>
                    </div>

                    <div className="p-6 bg-slate-900 rounded-b-xl relative flex-1">
                        
                        {/* 1. DAY VIEW */}
                        {viewMode === 'day' && (
                            <>
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                                    <button onClick={() => navigateDay('prev')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div className="text-center">
                                        <h2 className="text-xl font-bold text-white capitalize">
                                            {currentViewDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </h2>
                                        {!isViewingToday() && (
                                            <button onClick={resetToToday} className="text-xs text-blue-400 font-bold flex items-center justify-center gap-1 mt-1 hover:underline">
                                                <RotateCcw size={10} /> Voltar para Hoje
                                            </button>
                                        )}
                                    </div>
                                    <button onClick={() => navigateDay('next')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <ChevronRight size={24} />
                                    </button>
                                </div>

                                {filteredTasks.length === 0 && (
                                     <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                                        <Clock size={64} className="mb-4 opacity-30"/>
                                        <p className="text-lg font-medium">Agenda livre.</p>
                                        <p className="text-sm">Nenhuma tarefa encontrada para este dia.</p>
                                    </div>
                                )}

                                {/* OVERDUE SECTION */}
                                {overdueTasks.length > 0 && (
                                    <div className="mb-8 animate-fade-in bg-red-950/10 border border-red-900/30 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-red-500/20">
                                            <AlertCircle className="text-red-500" />
                                            <span className="text-red-400 font-bold uppercase tracking-widest text-sm">Pendentes de Dias Anteriores</span>
                                        </div>
                                        <div className="space-y-4">
                                            {overdueTasks.map((task) => (
                                                <TaskItem 
                                                    key={task.id} 
                                                    task={task} 
                                                    onToggle={onToggleTask} 
                                                    onDelete={onDeleteTask} 
                                                    getCategoryColor={getCategoryColor}
                                                    isOverdue={true}
                                                    onJumpToDate={() => handleJumpToDate(task.date)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CURRENT DAY TASKS SECTION */}
                                {viewDateTasks.length > 0 && (
                                    <div className="relative">
                                         {/* Vertical Guide Line */}
                                        <div className="absolute top-4 bottom-4 left-[3.25rem] w-px bg-slate-800 z-0"></div>
                                        
                                        <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-800 mt-4">
                                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                            <span className="text-slate-200 font-bold uppercase tracking-widest text-sm">
                                                {isViewingToday() ? 'Cronograma de Hoje' : 'Histórico do Dia'}
                                            </span>
                                        </div>

                                        <div className="space-y-2 relative z-10">
                                            {viewDateTasks.map((task) => (
                                                <TaskItem 
                                                    key={task.id} 
                                                    task={task} 
                                                    onToggle={onToggleTask} 
                                                    onDelete={onDeleteTask} 
                                                    getCategoryColor={getCategoryColor}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* 2. WEEK VIEW */}
                        {viewMode === 'week' && Object.keys(groupedTasks).map(dateKey => (
                            <div key={dateKey} className="animate-fade-in mb-8">
                                <div className="sticky top-16 bg-slate-900/95 backdrop-blur py-3 z-10 flex items-center gap-3 border-b border-slate-800 mb-4">
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                    <span className="text-slate-200 font-bold uppercase text-sm tracking-widest">{dateKey}</span>
                                </div>
                                <div className="space-y-1 pl-4 ml-1 border-l-2 border-slate-800/50">
                                    {groupedTasks[dateKey].map((task) => (
                                        <TaskItem 
                                            key={task.id} 
                                            task={task} 
                                            onToggle={onToggleTask} 
                                            onDelete={onDeleteTask} 
                                            getCategoryColor={getCategoryColor} 
                                            compact={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* 3. CALENDAR MONTH VIEW */}
                        {viewMode === 'month' && (
                             <div className="animate-fade-in flex flex-col h-full">
                                {/* Calendar Controls */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                                    <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <ChevronLeft size={24} />
                                    </button>
                                    <h2 className="text-xl font-bold text-white capitalize">
                                        {currentViewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    </h2>
                                    <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <ChevronRight size={24} />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                                        <div key={d} className="text-xs font-bold text-slate-500 uppercase py-2">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-2 auto-rows-fr flex-1">
                                    {generateCalendarDays().map((dateItem, idx) => {
                                        if (!dateItem) return <div key={`empty-${idx}`} className="bg-transparent p-2"></div>;
                                        
                                        // Check if this date is "Today"
                                        const isToday = new Date().toDateString() === dateItem.toDateString();
                                        
                                        // Find tasks for this date
                                        const dayTasks = tasks.filter(t => {
                                            const tDate = new Date(t.date);
                                            return tDate.getDate() === dateItem.getDate() && 
                                                   tDate.getMonth() === dateItem.getMonth() &&
                                                   tDate.getFullYear() === dateItem.getFullYear();
                                        });

                                        const hasPending = dayTasks.some(t => !t.completed);
                                        const hasCompleted = dayTasks.some(t => t.completed);

                                        return (
                                            <button 
                                                key={dateItem.toISOString()} 
                                                onClick={() => handleJumpToDate(dateItem)}
                                                className={`
                                                    relative p-2 rounded-xl border flex flex-col items-start justify-start min-h-[80px] transition-all hover:scale-105 group
                                                    ${isToday ? 'bg-blue-900/20 border-blue-500/50' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500'}
                                                `}
                                            >
                                                <span className={`text-sm font-bold ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
                                                    {dateItem.getDate()}
                                                </span>
                                                
                                                {/* Dots Indicator */}
                                                <div className="mt-auto flex gap-1 flex-wrap">
                                                    {hasPending && <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>}
                                                    {hasCompleted && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>}
                                                    {dayTasks.length > 0 && <span className="text-[10px] text-slate-500 ml-1">({dayTasks.length})</span>}
                                                </div>
                                                
                                                {/* Add hover effect text */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-[1px] rounded-xl transition-opacity">
                                                    <Plus size={20} className="text-white"/>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                             </div>
                        )}
                    </div>
                </div>
            </div>

             {/* Footer Space */}
            <div className="mt-16 pt-8 border-t border-slate-800/50 flex flex-col items-center justify-center text-slate-600 gap-2">
                <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                <p className="text-xs uppercase tracking-widest font-bold opacity-50">Nexus 360</p>
                <ChevronDown className="animate-bounce opacity-30 mt-2" size={16} />
            </div>
        </div>
    );
};

// Sub-component for rendering a single task row with EXPANDED view
const TaskItem = ({ task, onToggle, onDelete, getCategoryColor, compact = false, isOverdue = false, onJumpToDate }: any) => {
    if (compact) {
        return (
            <div className={`flex items-center gap-4 p-4 rounded-lg border ${getCategoryColor(task.category)} transition-all hover:brightness-110 relative group mb-2 bg-slate-800/50 w-full`}>
                <button 
                    onClick={() => onToggle(task.id)} 
                    className={`text-inherit transition-transform active:scale-90 ${task.completed ? 'opacity-50' : ''}`}
                >
                    {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold opacity-70 border border-current px-1 rounded">{task.startTime}</span>
                        <span className={`font-medium truncate ${task.completed ? 'line-through opacity-60' : ''}`}>
                            {task.title}
                        </span>
                    </div>
                </div>
                <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-inherit hover:text-red-400 transition-opacity p-2">
                    <Trash2 size={16} />
                </button>
            </div>
        )
    }

    return (
        <div className="flex group relative w-full">
            {/* Timeline Time Column */}
            <div className="flex flex-col items-center mr-6 w-14 shrink-0 pt-6">
                <span className={`text-sm font-bold font-mono mb-2 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                    {isOverdue ? <History size={16}/> : task.startTime}
                </span>
                <div className={`w-4 h-4 rounded-full border-2 z-10 transition-colors ${task.completed ? 'bg-slate-700 border-slate-600' : (isOverdue ? 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.6)]')}`}></div>
            </div>

            {/* Task Card - Expanded (FIXED HEIGHT & WIDTH) */}
            <div 
                className={`flex-1 flex items-center gap-5 p-5 h-32 mb-3 rounded-2xl border ${getCategoryColor(task.category)} transition-all hover:brightness-110 relative bg-slate-800/40 shadow-lg overflow-hidden ${isOverdue ? 'cursor-pointer hover:border-red-400 hover:shadow-red-900/20' : ''}`}
            >
                {/* Large Checkbox */}
                <div className="z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={() => onToggle(task.id)} 
                        className={`text-inherit transition-all active:scale-90 hover:scale-105 mt-1 ${task.completed ? 'opacity-40' : 'opacity-100'}`}
                    >
                        {task.completed ? <CheckSquare size={32} /> : <Square size={32} strokeWidth={1.5} />}
                    </button>
                </div>
                
                {/* Content - Clickable if Overdue */}
                <div 
                    className="flex-1 min-w-0 flex flex-col justify-between h-full py-1"
                    onClick={isOverdue ? onJumpToDate : undefined}
                >
                    {/* Title Section - Forced Max Lines */}
                    <div className="w-full pr-8">
                         <span className={`text-xl font-bold leading-tight line-clamp-2 ${task.completed ? 'line-through opacity-50 text-slate-400' : 'text-white'}`} title={task.title}>
                            {task.title}
                        </span>
                    </div>
                    
                    {/* Tags Section */}
                    <div className="flex items-center gap-4 text-sm opacity-80 mt-auto">
                         {isOverdue && <span className="text-xs font-mono text-red-300 bg-red-900/50 px-2 rounded border border-red-800">{new Date(task.date).toLocaleDateString('pt-BR')}</span>}
                        <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded text-xs font-mono"><Clock size={12}/> {task.durationMinutes} min</span>
                        <span className="uppercase tracking-widest font-bold text-[10px] border border-current px-2 py-0.5 rounded-full">{task.category}</span>
                        {!task.completed && !isOverdue && (
                            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 ml-auto animate-pulse">
                                <AlertCircle size={12}/> Pendente
                            </span>
                        )}
                         {isOverdue && (
                            <span className="ml-auto flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <CornerDownRight size={10} /> Ir para o dia
                            </span>
                        )}
                    </div>
                </div>

                {/* Delete Action */}
                <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-2 bg-slate-900/50 rounded-lg backdrop-blur-sm">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};