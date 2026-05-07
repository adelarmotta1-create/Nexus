import React, { useState } from 'react';
import { Task, Transaction, CheckIn, TaskCategory, Goal, StudyTopic } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { BarChart3, AlertTriangle, TrendingUp, Smartphone, Brain, Moon, DollarSign, Wallet, Briefcase, List, PieChart as PieChartIcon, CheckCircle2, XCircle, Clock, Calendar, ChevronDown, Target, Trophy, Flag, GraduationCap, Plus, Edit2, Trash2 } from 'lucide-react';

interface ReportsProps {
    tasks: Task[];
    transactions: Transaction[];
    checkIns: CheckIn[];
    goals: Goal[];
    setGoals?: React.Dispatch<React.SetStateAction<Goal[]>>;
    studyTopics: StudyTopic[];
}

export const Reports: React.FC<ReportsProps> = ({ tasks, transactions, checkIns, goals, setGoals, studyTopics }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [newGoal, setNewGoal] = useState<Partial<Goal>>({});

    const handleSaveGoal = () => {
        if (!setGoals) return;
        if (!newGoal.title || !newGoal.targetValue || !newGoal.unit || !newGoal.category) return;

        if (editingGoal) {
            setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...newGoal } as Goal : g));
        } else {
            const goal: Goal = {
                ...(newGoal as Goal),
                id: Date.now().toString(),
                currentValue: newGoal.currentValue || 0,
                status: 'in_progress'
            };
            setGoals(prev => [...prev, goal]);
        }
        setIsGoalModalOpen(false);
        setEditingGoal(null);
        setNewGoal({});
    };

    const handleDeleteGoal = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!setGoals) return;
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    const openEditGoalModal = (goal: Goal, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingGoal(goal);
        setNewGoal(goal);
        setIsGoalModalOpen(true);
    };

    // --- STATISTICS CALCULATION ---

    // 1. Productivity Stats (Include ALL categories)
    const getMinutes = (cat: TaskCategory) => tasks.filter(t => t.category === cat).reduce((acc, t) => acc + t.durationMinutes, 0);

    const workMinutes = getMinutes('work');
    const studyMinutes = getMinutes('study');
    const workoutMinutes = getMinutes('workout');
    const routineMinutes = getMinutes('routine');
    const leisureMinutes = getMinutes('leisure');
    const wastedMinutes = getMinutes('wasted');
    
    // 2. Financial Stats (Today & Weekly)
    const today = new Date().toISOString().split('T')[0];
    const todayIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(today)).reduce((acc, t) => acc + t.amount, 0);
    const todayExpense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(today)).reduce((acc, t) => acc + t.amount, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    // 3. Sleep Stats
    const latestSleep = checkIns.length > 0 ? checkIns[checkIns.length - 1].sleepHours : 0;
    const avgSleep = checkIns.length > 0 ? (checkIns.reduce((acc, c) => acc + c.sleepHours, 0) / checkIns.length).toFixed(1) : 0;

    // 4. Study Progress Stats (Grouped by Subject)
    const subjects = Array.from(new Set(studyTopics.map(t => t.subject)));
    const studyProgressData = subjects.map(subject => {
        const subjectTopics = studyTopics.filter(t => t.subject === subject);
        const completed = subjectTopics.filter(t => t.completed).length;
        const total = subjectTopics.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { subject, completed, total, percentage };
    }).sort((a, b) => b.percentage - a.percentage); // Sort by highest completion first

    // --- CHART DATA ---

    // Pie Chart Data (Time Distribution) - Now inclusive
    const timeDistData = [
        { name: 'Trabalho', value: workMinutes, color: '#3b82f6' }, // Blue
        { name: 'Estudo', value: studyMinutes, color: '#8b5cf6' }, // Purple
        { name: 'Treino', value: workoutMinutes, color: '#10b981' }, // Emerald
        { name: 'Rotina', value: routineMinutes, color: '#f59e0b' }, // Amber (Lunch, Haircut etc)
        { name: 'Lazer', value: leisureMinutes, color: '#ec4899' }, // Pink
        { name: 'Ocioso', value: wastedMinutes, color: '#ef4444' }, // Red
    ].filter(d => d.value > 0);

    // Bar Chart Data (Category Hours Comparison)
    const categoryComparisonData = [
        { name: 'Trabalho', hours: parseFloat((workMinutes / 60).toFixed(1)), fill: '#3b82f6' },
        { name: 'Estudo', hours: parseFloat((studyMinutes / 60).toFixed(1)), fill: '#8b5cf6' },
        { name: 'Treino', hours: parseFloat((workoutMinutes / 60).toFixed(1)), fill: '#10b981' },
        { name: 'Rotina', hours: parseFloat((routineMinutes / 60).toFixed(1)), fill: '#f59e0b' },
        { name: 'Lazer', hours: parseFloat((leisureMinutes / 60).toFixed(1)), fill: '#ec4899' },
        { name: 'Ocioso', hours: parseFloat((wastedMinutes / 60).toFixed(1)), fill: '#ef4444' },
    ];

    // Sleep History Data
    const sleepData = checkIns.map((c, i) => ({
        day: `D${i+1}`,
        hours: c.sleepHours
    }));

    // Helper for task list styling
    const getCategoryStyle = (cat: TaskCategory) => {
        switch(cat) {
            case 'work': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'study': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'workout': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'wasted': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'leisure': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
            case 'routine': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const getCategoryLabel = (cat: string) => {
        const labels: {[key: string]: string} = {
            work: 'Trabalho', study: 'Estudo', workout: 'Treino', 
            routine: 'Rotina', leisure: 'Lazer', wasted: 'Ocioso'
        };
        return labels[cat] || cat;
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col gap-8 overflow-y-auto pb-24">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BarChart3 className="text-blue-500" /> Relatórios
                    </h1>
                    <p className="text-slate-400">Análise detalhada de performance e atividades.</p>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-slate-800 p-1 rounded-lg flex gap-1 border border-slate-700">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                        <PieChartIcon size={16} />
                        Visão Geral
                    </button>
                    <button 
                        onClick={() => setActiveTab('tasks')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                        <List size={16} />
                        Histórico de Atividades
                    </button>
                </div>
            </header>

            {/* --- TAB CONTENT: OVERVIEW --- */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                    
                    {/* --- 1. GOALS SECTION --- */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Target className="text-red-500" /> Painel de Metas & Objetivos
                            </h2>
                            <button 
                                onClick={() => { setEditingGoal(null); setNewGoal({}); setIsGoalModalOpen(true); }}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} /> Nova Meta
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {goals.length === 0 ? (
                                <div className="col-span-full text-center py-8 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50">
                                    <Trophy size={48} className="mx-auto text-slate-600 mb-2"/>
                                    <p className="text-slate-400 font-medium">Nenhuma meta definida.</p>
                                    <p className="text-sm text-slate-500">Vá ao Assistente Geral e diga: "Minha meta é..."</p>
                                </div>
                            ) : (
                                goals.map(goal => {
                                    const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                                    const isCompleted = percentage >= 100;

                                    return (
                                        <div key={goal.id} className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all group relative">
                                            {isCompleted && (
                                                <div className="absolute -top-3 -right-3 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg shadow-yellow-500/20 animate-bounce">
                                                    <Trophy size={16} fill="currentColor" />
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{goal.title}</h3>
                                                        <button onClick={(e) => openEditGoalModal(goal, e)} className="text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={14} /></button>
                                                        <button onClick={(e) => handleDeleteGoal(goal.id, e)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                                    </div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-0.5">{goal.category}</p>
                                                </div>
                                                <span className={`text-xl font-bold font-mono ${isCompleted ? 'text-yellow-500' : 'text-slate-200'}`}>
                                                    {percentage}%
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden mb-3">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-between items-end text-sm">
                                                <div>
                                                    <p className="text-slate-400 text-xs mb-0.5">Atual</p>
                                                    <p className="font-mono text-white">{goal.unit === 'R$' ? 'R$ ' : ''}{goal.currentValue.toLocaleString()}{goal.unit !== 'R$' ? ` ${goal.unit}` : ''}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-slate-400 text-xs mb-0.5">Alvo</p>
                                                    <p className="font-mono text-slate-300">{goal.unit === 'R$' ? 'R$ ' : ''}{goal.targetValue.toLocaleString()}{goal.unit !== 'R$' ? ` ${goal.unit}` : ''}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* --- 2. NEW: ACADEMIC PERFORMANCE SECTION --- */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <GraduationCap className="text-purple-500" /> Desempenho Acadêmico
                        </h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <p className="text-sm text-slate-400 mb-4">Progresso por Matéria (Tópicos Concluídos)</p>
                                {studyProgressData.slice(0, Math.ceil(studyProgressData.length / 2)).map((item) => (
                                    <div key={item.subject}>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-bold text-slate-200">{item.subject}</span>
                                            <span className="text-xs font-mono text-slate-400">{item.completed}/{item.total} ({item.percentage}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${item.percentage === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-5">
                                 <p className="text-sm text-slate-400 mb-4 lg:text-right opacity-0 lg:opacity-100">Continuação</p>
                                {studyProgressData.slice(Math.ceil(studyProgressData.length / 2)).map((item) => (
                                    <div key={item.subject}>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-bold text-slate-200">{item.subject}</span>
                                            <span className="text-xs font-mono text-slate-400">{item.completed}/{item.total} ({item.percentage}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${item.percentage === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                                                style={{ width: `${item.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {studyTopics.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500">
                                <span>Total de Tópicos: {studyTopics.length}</span>
                                <span>Concluídos: {studyTopics.filter(t => t.completed).length}</span>
                            </div>
                        )}
                    </div>

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Sono */}
                        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <p className="text-slate-400 text-xs uppercase font-bold flex items-center gap-2"><Moon size={14}/> Sono (Última Noite)</p>
                            <h2 className="text-3xl font-bold text-indigo-400 mt-2">{latestSleep}h</h2>
                            <p className="text-xs text-slate-500">Média: {avgSleep}h</p>
                        </div>

                        {/* Estudo */}
                        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <p className="text-slate-400 text-xs uppercase font-bold flex items-center gap-2"><Brain size={14}/> Estudos (Total)</p>
                            <h2 className="text-3xl font-bold text-white mt-2">{(studyMinutes / 60).toFixed(1)}h</h2>
                        </div>

                        {/* Trabalho */}
                        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <p className="text-slate-400 text-xs uppercase font-bold flex items-center gap-2"><Briefcase size={14} /> Trabalho (Total)</p>
                            <h2 className="text-3xl font-bold text-blue-400 mt-2">{(workMinutes / 60).toFixed(1)}h</h2>
                        </div>

                        {/* Dinheiro Hoje */}
                        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <p className="text-slate-400 text-xs uppercase font-bold flex items-center gap-2"><Wallet size={14}/> Caixa Diário</p>
                            <div className="mt-2">
                                <span className="text-emerald-400 font-bold block text-lg">+ R$ {todayIncome}</span>
                                <span className="text-red-400 font-bold block text-sm">- R$ {todayExpense}</span>
                            </div>
                        </div>
                    </div>

                    {/* ROW 1: Pie Chart + Financial Bar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* 1. Gráfico de Produtividade (Pizza) */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col min-h-[350px]">
                            <h3 className="text-white font-bold mb-4">Distribuição do Tempo (%)</h3>
                            <div className="flex-1 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={timeDistData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {timeDistData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <ReTooltip 
                                            contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                                            formatter={(value: number) => [`${value} min`, 'Tempo']}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Finanças (Barra Comparativa Total) */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col min-h-[350px]">
                            <h3 className="text-white font-bold mb-4">Finanças Totais (R$)</h3>
                            <div className="flex-1 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Receita', value: totalIncome, fill: '#10b981' },
                                        { name: 'Despesa', value: totalExpense, fill: '#ef4444' }
                                    ]}>
                                        <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                                        <ReTooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                            contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                                            {
                                                [
                                                    { name: 'Receita', value: totalIncome, fill: '#10b981' },
                                                    { name: 'Despesa', value: totalExpense, fill: '#ef4444' }
                                                ].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* ROW 2: Sleep + Category Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* 3. SLEEP TREND */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 min-h-[350px]">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Moon className="text-indigo-400"/> Tendência de Sono</h3>
                            <div className="w-full h-[250px] mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={sleepData}>
                                        <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" tickLine={false} axisLine={false} domain={[0, 12]}/>
                                        <ReTooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                                        <Line type="monotone" dataKey="hours" stroke="#818cf8" strokeWidth={3} dot={{r: 4, fill: '#818cf8'}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                         {/* 4. Category Hours Comparison Bar Chart */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col min-h-[350px]">
                            <h3 className="text-white font-bold mb-4">Total de Horas por Categoria</h3>
                            <div className="flex-1 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryComparisonData} layout="vertical" margin={{ left: 20 }}>
                                        <XAxis type="number" stroke="#64748b" tickLine={false} axisLine={false} />
                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={70} tickLine={false} axisLine={false} style={{fontSize: '12px', fontWeight: 'bold'}} />
                                        <ReTooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                            contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                                            formatter={(value: number) => [`${value} horas`, 'Duração']}
                                        />
                                        <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={24}>
                                            {categoryComparisonData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB CONTENT: TASKS HISTORY --- */}
            {activeTab === 'tasks' && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden animate-fade-in flex-1">
                     <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <List size={18} className="text-blue-400"/> Registro Completo de Atividades
                        </h3>
                        <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                            {tasks.length} registros
                        </span>
                     </div>
                     
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4 w-12 text-center">Status</th>
                                    <th className="p-4">Atividade</th>
                                    <th className="p-4">Categoria</th>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Início</th>
                                    <th className="p-4 text-right">Duração</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500">
                                            Nenhuma atividade registrada no cronograma.
                                        </td>
                                    </tr>
                                ) : (
                                    [...tasks].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(task => (
                                        <tr key={task.id} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="p-4 text-center">
                                                {task.completed ? (
                                                    <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded border-2 border-slate-500 mx-auto"></div>
                                                )}
                                            </td>
                                            <td className="p-4 font-medium text-slate-200">
                                                {task.title}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border ${getCategoryStyle(task.category)}`}>
                                                    {getCategoryLabel(task.category)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400 font-mono text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={12}/>
                                                    {new Date(task.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-400 font-mono text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12}/>
                                                    {task.startTime || '--:--'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right text-slate-300 font-mono">
                                                {task.durationMinutes} min
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                     </div>
                </div>
            )}

            {/* Footer Space */}
            <div className="mt-16 pt-8 border-t border-slate-800/50 flex flex-col items-center justify-center text-slate-600 gap-2 pb-8">
                <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                <p className="text-xs uppercase tracking-widest font-bold opacity-50">Nexus 360</p>
                <ChevronDown className="animate-bounce opacity-30 mt-2" size={16} />
            </div>
            {/* Goal Modal */}
            {isGoalModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-white mb-4">
                                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Título da Meta</label>
                                    <input 
                                        type="text" 
                                        value={newGoal.title || ''} 
                                        onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Ex: Passar no TAF, Juntar R$10.000..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Valor Atual</label>
                                        <input 
                                            type="number" 
                                            value={newGoal.currentValue || ''} 
                                            onChange={e => setNewGoal({...newGoal, currentValue: Number(e.target.value)})}
                                            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Valor Alvo</label>
                                        <input 
                                            type="number" 
                                            value={newGoal.targetValue || ''} 
                                            onChange={e => setNewGoal({...newGoal, targetValue: Number(e.target.value)})}
                                            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Unidade</label>
                                        <select 
                                            value={newGoal.unit || ''} 
                                            onChange={e => setNewGoal({...newGoal, unit: e.target.value})}
                                            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="R$">R$</option>
                                            <option value="kg">kg</option>
                                            <option value="km">km</option>
                                            <option value="%">%</option>
                                            <option value="aprovacoes">Aprovações</option>
                                            <option value="leads">Leads</option>
                                            <option value="unidades">Unidades</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider">Categoria</label>
                                        <select 
                                            value={newGoal.category || ''} 
                                            onChange={e => setNewGoal({...newGoal, category: e.target.value as Goal['category']})}
                                            className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="body">Corpo</option>
                                            <option value="finance">Finanças</option>
                                            <option value="career">Carreira</option>
                                            <option value="productivity">Produtividade</option>
                                            <option value="other">Outro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex gap-3">
                                <button 
                                    onClick={() => {setIsGoalModalOpen(false); setEditingGoal(null); setNewGoal({});}} 
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveGoal} 
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
                                >
                                    Salvar Meta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};