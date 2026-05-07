import React, { useState, useEffect } from 'react';
import { NAV_ITEMS, MOCK_TRANSACTIONS, MOCK_TASKS, MOCK_LEADS, MOCK_FUNNELS, MOCK_GOALS } from './constants';
import { NavigationTab, Transaction, WorkoutLog, Task, UserStats, TaskCategory, CheckIn, Lead, Funnel, Goal, UserProfile, Message, StudyTopic } from './types';
import { Dashboard } from './components/Dashboard';
import { Professional } from './components/Professional';
import { Productivity } from './components/Productivity';
import { Body } from './components/Body';
import { Finance } from './components/Finance';
import { Reports } from './components/Reports';
import { NexusLogo } from './components/NexusLogo';
import { LayoutGrid, Lock, ArrowRight, LogOut } from 'lucide-react';

function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

const RAW_SYLLABUS = [
    // LÍNGUA PORTUGUESA
    { s: 'LÍNGUA PORTUGUESA', t: 'Leitura e interpretação de textos literários e não literários' },
    { s: 'LÍNGUA PORTUGUESA', t: 'Sinonímia, antonímia e sentido figurado das palavras' },
    { s: 'LÍNGUA PORTUGUESA', t: 'Pontuação: emprego da vírgula, ponto, e outros' },
    { s: 'LÍNGUA PORTUGUESA', t: 'Classes de palavras: emprego de substantivo, adjetivo, pronome, advérbio' },
    { s: 'LÍNGUA PORTUGUESA', t: 'Classes de palavras (Verbos): conjugação e emprego' },
    { s: 'LÍNGUA PORTUGUESA', t: 'Concordância verbal e nominal' },
    { s: 'LÍNGUA PORTUGUESA', t: 'Regência verbal e nominal (incluindo ocorrência de crase)' },
    { s: 'LÍNGUA PORTUGUESA', t: 'Colocação pronominal' },
    { s: 'LÍNGUA PORTUGUESA', t: 'Sintaxe: termos da oração e período composto' },

    // MATEMÁTICA
    { s: 'MATEMÁTICA', t: 'Conjuntos Numéricos: Números Racionais e suas operações' },
    { s: 'MATEMÁTICA', t: 'Razão, proporção e divisão proporcional' },
    { s: 'MATEMÁTICA', t: 'Regra de três simples e composta' },
    { s: 'MATEMÁTICA', t: 'Porcentagem, Juros Simples e Compostos' },
    { s: 'MATEMÁTICA', t: 'Equações e Sistemas do 1º e 2º graus' },
    { s: 'MATEMÁTICA', t: 'Geometria Plana: Área, Perímetro e Teorema de Pitágoras' },
    { s: 'MATEMÁTICA', t: 'Geometria Espacial: Volumes de prismas, cilindros e cones' },
    { s: 'MATEMÁTICA', t: 'Trigonometria básica: triângulo retângulo' },
    { s: 'MATEMÁTICA', t: 'Análise Combinatória e Probabilidade' },

    // HISTÓRIA (História Geral e do Brasil)
    { s: 'HISTÓRIA', t: 'História Geral: Primeira Guerra Mundial e Nazifascismo' },
    { s: 'HISTÓRIA', t: 'História Geral: Segunda Guerra Mundial e Guerra Fria' },
    { s: 'HISTÓRIA', t: 'História do Brasil: Período Colonial e Economia' },
    { s: 'HISTÓRIA', t: 'História do Brasil: Primeiro e Segundo Reinados' },
    { s: 'HISTÓRIA', t: 'História do Brasil: República Velha e Era Vargas' },
    { s: 'HISTÓRIA', t: 'História do Brasil: Ditadura Militar e Redemocratização' },

    // GEOGRAFIA
    { s: 'GEOGRAFIA', t: 'Geografia do Brasil: Formação territorial e recursos naturais' },
    { s: 'GEOGRAFIA', t: 'Geografia do Brasil: Dinâmica populacional, urbanização e industrialização' },
    { s: 'GEOGRAFIA', t: 'Geografia do Brasil: Clima, relevo e hidrografia do Brasil' },
    { s: 'GEOGRAFIA', t: 'Geografia Geral: Globalização, Geopolítica e Conflitos Atuais' },
    { s: 'GEOGRAFIA', t: 'Geografia Geral: Problemas e impactos ambientais globais' },

    // FILOSOFIA
    { s: 'FILOSOFIA', t: 'Introdução à Filosofia e o pensamento Mítico-Filosófico' },
    { s: 'FILOSOFIA', t: 'A Filosofia de Sócrates, Platão e Aristóteles' },
    { s: 'FILOSOFIA', t: 'Ética e Moral ao longo da História' },
    { s: 'FILOSOFIA', t: 'Filosofia Política: Contratualistas (Hobbes, Locke, Rousseau)' },

    // SOCIOLOGIA
    { s: 'SOCIOLOGIA', t: 'O surgimento da Sociologia e seus pensadores clássicos' },
    { s: 'SOCIOLOGIA', t: 'Karl Marx, Émile Durkheim e Max Weber' },
    { s: 'SOCIOLOGIA', t: 'Estruturação Social, Cultura e Identidade' },
    { s: 'SOCIOLOGIA', t: 'Cidadania, Direitos Humanos e Movimentos Sociais' },

    // FÍSICA
    { s: 'FÍSICA', t: 'Cinemática: M.R.U. e M.R.U.V.' },
    { s: 'FÍSICA', t: 'Dinâmica: As 3 Leis de Newton' },
    { s: 'FÍSICA', t: 'Trabalho, Potência e Conservação de Energia Mecânica' },
    { s: 'FÍSICA', t: 'Termologia: Escalas termométricas e mudança de fase' },
    { s: 'FÍSICA', t: 'Eletrodinâmica: Leis de Ohm, resistores e circuitos de CC' },

    // QUÍMICA
    { s: 'QUÍMICA', t: 'Estrutura Atômica e Modelos Atômicos' },
    { s: 'QUÍMICA', t: 'Tabela Periódica e Ligações Químicas' },
    { s: 'QUÍMICA', t: 'Funções Inorgânicas: Ácidos, bases, sais e óxidos' },
    { s: 'QUÍMICA', t: 'Cálculos Químicos e Estequiometria' },
    { s: 'QUÍMICA', t: 'Termoquímica, Soluções e Química Orgânica (Noções Básicas)' },

    // BIOLOGIA
    { s: 'BIOLOGIA', t: 'Citologia: Célula, organelas e divisão celular' },
    { s: 'BIOLOGIA', t: 'Genética: 1ª e 2ª Leis de Mendel' },
    { s: 'BIOLOGIA', t: 'Ecologia: Cadeias alimentares e fluxo de energia' },
    { s: 'BIOLOGIA', t: 'Seres Vivos: Fisiologia humana e saúde reprodutiva' },

    // NOÇÕES DE ADMINISTRAÇÃO PÚBLICA
    { s: 'ADMINISTRAÇÃO PÚBLICA', t: 'Constituição Federal / 88: Direitos e deveres fundamentais (Art 5º)' },
    { s: 'ADMINISTRAÇÃO PÚBLICA', t: 'Constituição Federal / 88: Poderes da República (União, Estados, Municípios)' },
    { s: 'ADMINISTRAÇÃO PÚBLICA', t: 'Constituição Federal / 88: Administração Pública (Art 37 a 41)' },
    { s: 'ADMINISTRAÇÃO PÚBLICA', t: 'Defesa do Estado: Forças Armadas e Segurança Pública (Art 144)' },
    { s: 'ADMINISTRAÇÃO PÚBLICA', t: 'Constituição Estadual/SP: Organização dos Servidores Militares' },

    // NOÇÕES BÁSICAS DE INFORMÁTICA
    { s: 'INFORMÁTICA', t: 'Sistema Operacional: Windows 10/11 - noções de arquivos e pastas' },
    { s: 'INFORMÁTICA', t: 'Microsoft Word: Formatação de textos e documentos' },
    { s: 'INFORMÁTICA', t: 'Microsoft Excel: Fórmulas e edição de planilhas' },
    { s: 'INFORMÁTICA', t: 'Internet e ferramentas: Correio Eletrônico, Navegadores e Pesquisas' }
];

const NexusOS: React.FC<{ user: UserProfile; onLogout: () => void }> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const k = (suffix: string) => `nexus_${user.id}_${suffix}`;

  const [userStats, setUserStats] = useStickyState<UserStats>({ xp: 1250, level: 2, streak: 5 }, k('stats'));
  const [messages, setMessages] = useStickyState<Message[]>([], k('chat_memory'));
  const [transactions, setTransactions] = useStickyState<Transaction[]>(MOCK_TRANSACTIONS, k('transactions'));
  const [workoutLogs, setWorkoutLogs] = useStickyState<WorkoutLog[]>([], k('logs'));
  const [tasks, setTasks] = useStickyState<Task[]>(MOCK_TASKS, k('tasks'));
  const [checkIns, setCheckIns] = useStickyState<CheckIn[]>([], k('checkins'));
  const [goals, setGoals] = useStickyState<Goal[]>(MOCK_GOALS, k('goals'));
  const [funnels, setFunnels] = useStickyState<Funnel[]>(MOCK_FUNNELS, k('funnels'));
  const [leads, setLeads] = useStickyState<Lead[]>(MOCK_LEADS, k('leads'));

  const [studyTopics, setStudyTopics] = useState<StudyTopic[]>(() => {
      const saved = localStorage.getItem('nexus_study_topics_apmbb_v1');
      if (saved) return JSON.parse(saved);
      return RAW_SYLLABUS.map((item, index) => ({
          id: `topic_${index}`,
          subject: item.s,
          topic: item.t,
          completed: false
      }));
  });

  useEffect(() => {
      localStorage.setItem('nexus_study_topics_apmbb_v1', JSON.stringify(studyTopics));
  }, [studyTopics]);

  const toggleStudyTopic = (id: string) => {
      setStudyTopics(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleUpdateTopic = (id: string, updates: Partial<StudyTopic>) => {
      setStudyTopics(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleLogWorkout = (log: WorkoutLog) => {
      setWorkoutLogs(prev => [...prev, log]);
      const taskLog: Task = {
          id: 'wo_' + Date.now(),
          title: 'Treino: ' + log.description,
          completed: true,
          category: 'workout',
          startTime: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
          durationMinutes: 45,
          xpReward: 100,
          date: new Date().toISOString()
      };
      setTasks(prev => [...prev, taskLog]);
      setUserStats(prev => ({ ...prev, xp: prev.xp + 100 }));
  };

  const handleCommand = (toolName: string, args: any) => {
      if (toolName === 'addTransaction') {
          setTransactions(prev => [...prev, { id: Date.now().toString(), type: args.type, category: args.category, amount: Number(args.amount), date: new Date().toISOString() }]);
      } else if (toolName === 'logActivity') {
          setTasks(prev => [...prev, {
              id: Date.now().toString(),
              title: args.title,
              completed: args.isCompleted === true,
              category: args.category,
              startTime: args.startTime,
              durationMinutes: Number(args.durationMinutes) || 30,
              xpReward: 50,
              date: new Date().toISOString()
          }]);
      } else if (toolName === 'logWorkout') {
          handleLogWorkout({ id: Date.now().toString(), description: args.description, date: new Date().toISOString() });
      }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onCommand={handleCommand} messages={messages} setMessages={setMessages} />;
      case 'productivity': return <Productivity tasks={tasks} stats={userStats} onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? {...t, completed: !t.completed} : t))} onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))} onAddTask={(t) => setTasks(prev => [...prev, { ...t, id: Date.now().toString() } as Task])} />;
      case 'professional': return <Professional leads={leads} setLeads={setLeads} funnels={funnels} setFunnels={setFunnels} />;
      case 'body': return <Body workoutLogs={workoutLogs} tasks={tasks} studyTopics={studyTopics} onToggleTopic={toggleStudyTopic} onUpdateTopic={handleUpdateTopic} onLogWorkout={handleLogWorkout} />;
      case 'finance': return <Finance transactions={transactions} onAddTransaction={(t) => setTransactions(prev => [...prev, { ...t, id: Date.now().toString(), date: new Date().toISOString() } as Transaction])} />;
      case 'reports': return <Reports tasks={tasks} transactions={transactions} checkIns={checkIns} goals={goals} setGoals={setGoals} studyTopics={studyTopics} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-50 overflow-hidden animate-fade-in">
      <aside className="w-20 md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between hidden md:flex z-50">
        <div>
          <div className="p-6 flex items-center gap-3">
             <NexusLogo size={40} className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
             <div className="hidden md:block">
                <span className="font-bold text-xl tracking-widest text-white block leading-none">NEXUS</span>
                <span className="text-sm font-bold text-blue-500 tracking-[0.3em] block leading-none ml-0.5 mt-1">ACADEMY</span>
             </div>
          </div>
          <nav className="mt-6 px-3 space-y-2">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>
                        <Icon size={20} />
                        <span className="font-medium hidden md:block">{item.label}</span>
                    </button>
                );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
            <div onClick={onLogout} className="bg-slate-900 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">{user.name.charAt(0)}</div>
                <div className="hidden md:block overflow-hidden flex-1">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-xs text-slate-500">Nível {userStats.level}</p>
                </div>
                 <LogOut size={16} className="text-slate-600" />
            </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 flex justify-around p-3 z-50">
         {NAV_ITEMS.slice(0, 5).map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setActiveTab(item.id)} className={`p-2 rounded-lg ${activeTab === item.id ? 'text-blue-500' : 'text-slate-500'}`}><Icon size={24} /></button> })}
         <button onClick={() => setActiveTab('reports')} className={`p-2 rounded-lg ${activeTab === 'reports' ? 'text-blue-500' : 'text-slate-500'}`}><LayoutGrid size={24} /></button>
      </nav>

      <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0 custom-scrollbar">
        <div className="relative z-10 max-w-7xl mx-auto h-full">{renderContent()}</div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useStickyState<UserProfile | null>(null, 'nexus_active_profile');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
        setUserProfile({ id: 'user_1', name: 'Alex Merc', email: 'alex@nexus.ai', joinedDate: new Date().toISOString() });
        setIsLoggingIn(false);
    }, 1500);
  };

  if (!userProfile) {
      return (
          <div className="flex h-screen bg-slate-900 items-center justify-center p-4">
              <div className="max-w-md w-full bg-slate-800 rounded-3xl border border-slate-700 p-8 text-center">
                    <div className="mb-8 flex flex-col items-center">
                        <NexusLogo size={64} />
                        <h2 className="text-4xl font-black text-white mt-4">NEXUS</h2>
                    </div>
                    <button onClick={handleGoogleLogin} disabled={isLoggingIn} className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3">
                        {isLoggingIn ? 'Conectando...' : 'Entrar no Sistema'}
                    </button>
              </div>
          </div>
      )
  }

  return <NexusOS user={userProfile} onLogout={() => setUserProfile(null)} />;
};

export default App;