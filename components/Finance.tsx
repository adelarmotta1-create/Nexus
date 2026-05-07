import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../types';
import { getFinancialActionPlan } from '../services/geminiService';
import { DollarSign, PieChart as PieIcon, TrendingUp, ChevronDown, Plus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#f43f5e', '#8b5cf6'];

interface FinanceProps {
    transactions: Transaction[];
    onAddTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
}

export const Finance: React.FC<FinanceProps> = ({ transactions, onAddTransaction }) => {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({ type: 'expense', category: '', amount: '' });
  
  // Calculate basic stats
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const savings = income - expense;
  
  // Group expenses for chart
  const expensesByCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as any);
  
  const chartData = Object.keys(expensesByCategory).map(key => ({ 
      name: key, 
      value: expensesByCategory[key],
      percentageOfIncome: income > 0 ? ((expensesByCategory[key] / income) * 100).toFixed(1) : 0,
      percentageOfExpense: expense > 0 ? ((expensesByCategory[key] / expense) * 100).toFixed(1) : 0
  }));

  const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
              <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-lg">
                  <p className="font-bold text-white mb-1">{data.name}</p>
                  <p className="text-red-400 font-medium">R$ {data.value.toLocaleString()}</p>
                  <p className="text-slate-400 text-sm mt-1">{data.percentageOfIncome}% da Renda Total</p>
                  <p className="text-slate-500 text-sm">{data.percentageOfExpense}% das Despesas</p>
              </div>
          );
      }
      return null;
  };

  const handleGetAdvice = async () => {
    setLoading(true);
    const res = await getFinancialActionPlan(income, expense, expensesByCategory);
    setAdvice(res);
    setLoading(false);
  };

  const handleAddSubmit = () => {
      if (!newTx.category || !newTx.amount) return;
      onAddTransaction({
          type: newTx.type as 'income' | 'expense',
          category: newTx.category,
          amount: Number(newTx.amount)
      });
      setIsModalOpen(false);
      setNewTx({ type: 'expense', category: '', amount: '' });
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar relative">
       <header className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-white">Comando Financeiro</h1>
                <p className="text-slate-400">Fluxo de Caixa e Alocação de Ativos</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl flex items-center gap-2 transition-colors font-bold shadow-lg shadow-emerald-900/20">
                <Plus size={20} /> <span className="hidden md:inline">Adicionar Registro</span>
            </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-sm">Receita Total</p>
                <h3 className="text-3xl font-bold mt-1 text-emerald-400">R$ {income.toLocaleString()}</h3>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-sm">Total de Despesas</p>
                <h3 className="text-3xl font-bold mt-1 text-red-400">R$ {expense.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 mt-1">{income > 0 ? ((expense / income) * 100).toFixed(1) : 0}% da renda consumida</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors" onClick={handleGetAdvice}>
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-400 text-sm">Caixa para Guardar</p>
                        <h3 className="text-3xl font-bold mt-1 text-blue-400">R$ {Math.max(0, savings).toLocaleString()}</h3>
                    </div>
                    <TrendingUp className="text-blue-500" />
                 </div>
                 <p className="text-xs text-blue-300 mt-2 flex items-center gap-1">
                    {loading ? 'Analisando plano...' : 'Gerar Plano de Ação c/ IA'}
                 </p>
            </div>
        </div>

        {advice && (
             <div className="bg-blue-900/20 border border-blue-500/50 p-6 rounded-xl animate-fade-in">
                <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2 text-xl">
                    <BrainIcon /> Plano de Ação Nexus
                </h3>
                <div className="prose prose-invert prose-blue max-w-none prose-p:leading-relaxed">
                    <ReactMarkdown>{advice}</ReactMarkdown>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><PieIcon size={18}/> Detalhamento de Despesas (%)</h3>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend formatter={(value, entry: any) => <span className="text-slate-300">{value} ({entry.payload.percentageOfIncome}% da Renda)</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mx-auto w-full flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4">Transações Recentes</h3>
                <div className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                    {transactions.slice().reverse().map((t, idx) => (
                        <div key={t.id || idx} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    <DollarSign size={16} />
                                </div>
                                <div>
                                    <p className="text-white font-medium">{t.category}</p>
                                    <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                {t.type === 'income' ? '+' : '-'} R$ {t.amount}
                            </span>
                        </div>
                    ))}
                    {transactions.length === 0 && <p className="text-slate-500 text-center py-4">Nenhuma transação. Comece adicionando suas receitas ou despesas essenciais do mês.</p>}
                </div>
            </div>
        </div>

        {/* Modal Adicionar Transação */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative animate-fade-in">
                    <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
                    <h2 className="text-xl font-bold text-white mb-6">Novo Registro</h2>
                    
                    <div className="flex gap-2 mb-6">
                        <button 
                            onClick={() => setNewTx({...newTx, type: 'income'})}
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors border ${newTx.type === 'income' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                        >
                            Receita (+)
                        </button>
                        <button 
                            onClick={() => setNewTx({...newTx, type: 'expense'})}
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors border ${newTx.type === 'expense' ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                        >
                            Despesa (-)
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Categoria</label>
                            <input 
                                type="text"
                                placeholder={newTx.type === 'income' ? 'Ex: Salário, Bônus...' : 'Ex: Casa, Imprevisto, Mercado...'}
                                value={newTx.category}
                                onChange={(e) => setNewTx({...newTx, category: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Valor (R$)</label>
                            <input 
                                type="number"
                                placeholder="0.00"
                                value={newTx.amount}
                                onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleAddSubmit}
                        className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
                    >
                        Salvar Transação
                    </button>
                </div>
            </div>
        )}

        {/* Footer Space */}
        <div className="mt-16 pt-8 border-t border-slate-800/50 flex flex-col items-center justify-center text-slate-600 gap-2 pb-8">
            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            <p className="text-xs uppercase tracking-widest font-bold opacity-50">Nexus 360</p>
            <ChevronDown className="animate-bounce opacity-30 mt-2" size={16} />
        </div>
    </div>
  );
};

const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.97-3.465"/><path d="M18 18a4 4 0 0 0 1.97-3.465"/></svg>
);