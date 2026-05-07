import React, { useState, useEffect, useRef } from 'react';
import { WorkoutProfile, WorkoutLog, Task, StudyTopic } from '../types';
import { generateWorkoutPlan, generateStudyContent } from '../services/geminiService';
import { Activity, Dumbbell, Zap, RotateCcw, CheckCircle, History, ChevronDown, Brain, BookMarked, CheckSquare, Square, Lightbulb, ChevronLeft, ChevronRight, BookOpen, Flame, TrendingUp, Calendar, Play, AlertTriangle, Eye, XCircle, Film, Timer, SkipForward, X, ImageOff, GraduationCap, ArrowRight, UploadCloud, Cpu, Trophy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BodyProps {
    workoutLogs: WorkoutLog[];
    tasks: Task[];
    studyTopics: StudyTopic[];
    onToggleTopic: (id: string) => void;
    onUpdateTopic?: (id: string, updates: Partial<StudyTopic>) => void;
    onLogWorkout?: (log: WorkoutLog) => void;
}

const WEEK_DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// --- ONE PUNCH MAN x TAF APMBB PROTOCOL ---
const CALISTHENICS_LEVELS: any = {
    1: {
        title: "Nível 1: Aprendiz do Barro Branco",
        description: "Adaptação para o TAF. Foco em consistência.",
        rest: "1-2 min entre exercícios",
        exercises: [
            { 
                name: "1. Flexão (Apoio de Frente)", 
                reps: "20 repetições", 
                demoUrl: "https://media.tenor.com/gI-8qCUEko8AAAAC/pushup.gif",
                mistakes: ["Quadril caindo", "Cotovelos para fora"]
            },
            { 
                name: "2. Abdominal Remador", 
                reps: "20 repetições", 
                demoUrl: "https://media.tenor.com/F_N9_X7Y5QAAAAAC/v-up-crunch.gif",
                mistakes: ["Não passar o cotovelo da linha dos joelhos", "Bater as costas com força"]
            },
            { 
                name: "3. Agachamento Livre", 
                reps: "20 repetições", 
                demoUrl: "https://media.tenor.com/2Xy-g-o8A40AAAAC/squat-exercise.gif",
                mistakes: ["Calcanhar fora do chão", "Joelho valgo (para dentro)"]
            },
            { 
                name: "4. Corrida Contínua", 
                reps: "2 km", 
                demoUrl: "https://media.tenor.com/l7ZtIfwW-sEAAAAC/running-run.gif",
                mistakes: ["Correr muito rápido no início", "Pisada de calcanhar brusca"]
            }
        ]
    },
    2: {
        title: "Nível 2: Cadete em Formação",
        description: "Aumento de volume base. Corpo ganhando resistência.",
        rest: "1-2 min entre exercícios",
        exercises: [
            { name: "1. Flexão (Apoio de Frente)", reps: "40 repetições", demoUrl: "https://media.tenor.com/gI-8qCUEko8AAAAC/pushup.gif" },
            { name: "2. Abdominal Remador", reps: "40 repetições", demoUrl: "https://media.tenor.com/F_N9_X7Y5QAAAAAC/v-up-crunch.gif" },
            { name: "3. Agachamento Livre", reps: "40 repetições", demoUrl: "https://media.tenor.com/2Xy-g-o8A40AAAAC/squat-exercise.gif" },
            { name: "4. Corrida Contínua", reps: "4 km", demoUrl: "https://media.tenor.com/l7ZtIfwW-sEAAAAC/running-run.gif" }
        ]
    },
    3: { 
        title: "Nível 3: Padrão Oficial PMESP",
        description: "Mais da metade do caminho, simulando esforço real do TAF.",
        rest: "1-2 min entre exercícios",
        exercises: [
            { name: "1. Flexão (Apoio de Frente)", reps: "60 repetições", demoUrl: "https://media.tenor.com/gI-8qCUEko8AAAAC/pushup.gif" },
            { name: "2. Abdominal Remador", reps: "60 repetições", demoUrl: "https://media.tenor.com/F_N9_X7Y5QAAAAAC/v-up-crunch.gif" },
            { name: "3. Agachamento Livre", reps: "60 repetições", demoUrl: "https://media.tenor.com/2Xy-g-o8A40AAAAC/squat-exercise.gif" },
            { name: "4. Corrida Contínua", reps: "6 km", demoUrl: "https://media.tenor.com/l7ZtIfwW-sEAAAAC/running-run.gif" }
        ]
    },
    4: { 
        title: "Nível 4: Elite Aspirante",
        description: "Condicionamento avançado e resiliência psicológica.",
        rest: "1-2 min entre exercícios",
        exercises: [
            { name: "1. Flexão (Apoio de Frente)", reps: "80 repetições", demoUrl: "https://media.tenor.com/gI-8qCUEko8AAAAC/pushup.gif" },
            { name: "2. Abdominal Remador", reps: "80 repetições", demoUrl: "https://media.tenor.com/F_N9_X7Y5QAAAAAC/v-up-crunch.gif" },
            { name: "3. Agachamento Livre", reps: "80 repetições", demoUrl: "https://media.tenor.com/2Xy-g-o8A40AAAAC/squat-exercise.gif" },
            { name: "4. Corrida Contínua", reps: "8 km", demoUrl: "https://media.tenor.com/l7ZtIfwW-sEAAAAC/running-run.gif" }
        ]
    },
    5: { 
        title: "Nível 5: O Protocolo Saitama TAF",
        description: "100 flexões, 100 abdominais, 100 agachamentos, 10km todo dia.",
        rest: "Sem dor, sem ganho.",
        exercises: [
            { name: "1. Flexão (Apoio de Frente)", reps: "100 repetições", demoUrl: "https://media.tenor.com/gI-8qCUEko8AAAAC/pushup.gif" },
            { name: "2. Abdominal Remador", reps: "100 repetições", demoUrl: "https://media.tenor.com/F_N9_X7Y5QAAAAAC/v-up-crunch.gif" },
            { name: "3. Agachamento", reps: "100 repetições", demoUrl: "https://media.tenor.com/2Xy-g-o8A40AAAAC/squat-exercise.gif" },
            { name: "4. Corrida Intensa", reps: "10 km", demoUrl: "https://media.tenor.com/l7ZtIfwW-sEAAAAC/running-run.gif" }
        ]
    }
};

// --- SAFE IMAGE COMPONENT ---
const SafeImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
    const [error, setError] = useState(false);
    
    if (!src || error) {
        return (
            <div className={`flex flex-col items-center justify-center bg-slate-900 text-slate-500 border border-slate-700 ${className}`}>
                <ImageOff size={32} className="mb-2 opacity-50"/>
                <span className="text-xs text-center px-4">
                    Visualização indisponível
                </span>
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className={className} 
            onError={() => setError(true)}
        />
    );
};

export const Body: React.FC<BodyProps> = ({ workoutLogs, tasks, studyTopics, onToggleTopic, onUpdateTopic, onLogWorkout }) => {
  const [activeTab, setActiveTab] = useState<'body' | 'mind'>('body');
  const [loading, setLoading] = useState(false);
  
  // -- TUTOR STATE --
  const [activeTutorTopic, setActiveTutorTopic] = useState<StudyTopic | null>(null);
  const [tutorState, setTutorState] = useState<'content' | 'quiz' | 'loading'>('loading');
  const [tutorContent, setTutorContent] = useState<string>('');
  const [tutorQuestions, setTutorQuestions] = useState<{q: string; options: string[]; answer: number}[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // --- WORKOUT STATE ---
  const [calisthenicsLevel, setCalisthenicsLevel] = useState<number>(1);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null); 
  const [workoutProfile, setWorkoutProfile] = useState<WorkoutProfile | null>(null);
  const [aiWorkoutPlan, setAiWorkoutPlan] = useState<any>(null);
  
  // --- TRAINING MODE STATE ---
  const [isTraining, setIsTraining] = useState(false);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [sessionTimer, setSessionTimer] = useState(0); 
  const [exerciseLogs, setExerciseLogs] = useState<{[idx: number]: {reps: string, time: string}}>({});
  const sessionIntervalRef = useRef<number | null>(null);

  // --- STUDY STATE ---
  const [currentModule, setCurrentModule] = useState<number>(1);

  // --- HANDLERS ---
  const toggleExerciseDetails = (name: string) => {
    setExpandedExercise(prev => prev === name ? null : name);
  };

  const handleGenerateWorkout = async () => {
    setLoading(true);
    const profile = workoutProfile || {
        sex: "Não informado",
        age: 25,
        weight: 70,
        goal: "conditioning",
        limitations: "Nenhuma"
    };
    const plan = await generateWorkoutPlan(profile as WorkoutProfile);
    setAiWorkoutPlan(plan);
    setLoading(false);
  };

  // --- TRAINING LOGIC ---
  const startTraining = () => {
      setIsTraining(true);
      setCurrentExIndex(0);
      setSessionTimer(0);
      setExerciseLogs({});
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = window.setInterval(() => {
          setSessionTimer(t => t + 1);
      }, 1000);
  };

  const endTraining = (completed: boolean) => {
      if (sessionIntervalRef.current) {
          clearInterval(sessionIntervalRef.current);
          sessionIntervalRef.current = null;
      }
      setIsTraining(false);
      
      if (completed && onLogWorkout) {
          const minutes = Math.floor(sessionTimer / 60);
          const routine = CALISTHENICS_LEVELS[calisthenicsLevel];
          let details = `Treino Nível ${calisthenicsLevel} (${minutes} min)\n`;
          routine.exercises.forEach((ex: any, idx: number) => {
              const log = exerciseLogs[idx];
              if (log) {
                  details += `- ${ex.name}: ${log.reps ? log.reps : '[não informado]'} | Tempo: ${log.time ? log.time : '[não informado]'}\n`;
              } else {
                  details += `- ${ex.name}: [pulou]\n`;
              }
          });

          onLogWorkout({
              id: Date.now().toString(),
              description: details.trim(),
              date: new Date().toISOString()
          });
          alert(`Treino finalizado! +100 XP`);
      }
  };

  const nextExercise = () => {
      const routine = CALISTHENICS_LEVELS[calisthenicsLevel];
      if (currentExIndex < routine.exercises.length - 1) {
          setCurrentExIndex(prev => prev + 1);
      } else {
          endTraining(true); // Finish
      }
  };

  const prevExercise = () => {
      if (currentExIndex > 0) {
          setCurrentExIndex(prev => prev - 1);
      }
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
  };

  // --- TUTOR HANDLERS ---
  const handleOpenTutor = async (topic: StudyTopic) => {
      setActiveTutorTopic(topic);
      setTutorState('loading');
      setQuizFinished(false);
      setQuizScore(0);
      setCurrentQuestionIdx(0);
      setSelectedOption(null);

      // Check cache first
      if (topic.cachedContent && topic.cachedQuestions) {
          setTutorContent(topic.cachedContent);
          setTutorQuestions(topic.cachedQuestions);
          setTutorState('content');
          return;
      }

      // Generate
      const data = await generateStudyContent(topic.subject, topic.topic);
      if (data && data.content) {
          setTutorContent(data.content);
          setTutorQuestions(data.questions || []);
          if (onUpdateTopic) {
              onUpdateTopic(topic.id, { cachedContent: data.content, cachedQuestions: data.questions });
          }
          setTutorState('content');
      } else {
           setTutorContent("Ocorreu um erro ao gerar o conteúdo. Tente novamente.");
           setTutorQuestions([]);
           setTutorState('content');
      }
  };

  const handleAnswerQuestion = () => {
      if (selectedOption === null) return;
      const currentQ = tutorQuestions[currentQuestionIdx];
      if (selectedOption === currentQ.answer) {
          setQuizScore(prev => prev + 1);
      }
      
      if (currentQuestionIdx < tutorQuestions.length - 1) {
          setCurrentQuestionIdx(prev => prev + 1);
          setSelectedOption(null);
      } else {
          setQuizFinished(true);
      }
  };

  const closeTutor = () => {
      setActiveTutorTopic(null);
  };

  // --- STUDY HANDLERS ---
  const uniqueSubjects: string[] = Array.from(new Set(studyTopics.map(t => t.subject)));

  const studyLogs = tasks.filter(t => t.category === 'study' && t.completed).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currentRoutine = CALISTHENICS_LEVELS[calisthenicsLevel];
  const todayName = WEEK_DAYS[new Date().getDay()];

  // Helper to get Subject Color
  const getSubjectColor = (subject: string) => {
      const s = subject.toUpperCase();
      if (s.includes('MATEMÁTICA') || s.includes('FÍSICA')) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      if (s.includes('HISTÓRIA') || s.includes('FILOSOFIA') || s.includes('SOCIOLOGIA')) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      if (s.includes('PORTUGUÊS') || s.includes('ING') || s.includes('REDAÇÃO')) return 'text-pink-400 border-pink-500/30 bg-pink-500/10';
      if (s.includes('BIOLOGIA') || s.includes('QUÍMICA')) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
  };

  // --- RENDER TRAINING MODE ---
  if (isTraining) {
      const ex = currentRoutine.exercises[currentExIndex];
      const progress = ((currentExIndex + 1) / currentRoutine.exercises.length) * 100;

      return (
          <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-fade-in">
              {/* Header */}
              <div className="p-4 flex justify-between items-center bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center animate-pulse">
                          <Timer className="text-white" />
                      </div>
                      <div>
                          <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Tempo Decorrido</p>
                          <p className="text-2xl font-mono font-bold text-white">{formatTime(sessionTimer)}</p>
                      </div>
                  </div>
                  <button onClick={() => endTraining(false)} className="bg-slate-800 p-2 rounded-full text-slate-400 hover:text-white hover:bg-red-900/50 transition-colors">
                      <X size={24} />
                  </button>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto">
                  <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{width: `${progress}%`}}></div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8 flex-1">
                      <div className="flex-1 bg-black rounded-2xl border border-slate-700 overflow-hidden relative shadow-2xl flex items-center justify-center aspect-video md:aspect-auto">
                          <SafeImage 
                              src={ex.demoUrl} 
                              alt={ex.name} 
                              className="w-full h-full object-contain"
                          />
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-white font-bold border border-white/10">
                              {currentExIndex + 1} / {currentRoutine.exercises.length}
                          </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-center gap-6">
                          <div>
                              <h2 className="text-3xl md:text-5xl font-black text-white mb-2">{ex.name}</h2>
                              <div className="flex flex-wrap gap-4 text-lg">
                                  <span className="bg-emerald-900/30 text-emerald-400 px-4 py-2 rounded-lg font-bold border border-emerald-500/20">{ex.reps}</span>
                                  <span className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg font-mono">Descanso: {currentRoutine.rest}</span>
                              </div>
                          </div>

                          {ex.mistakes && (
                              <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl">
                                  <h4 className="text-red-400 font-bold text-sm uppercase mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Atenção aos Erros</h4>
                                  <ul className="list-disc pl-4 space-y-1 text-slate-300 text-sm">
                                      {ex.mistakes.map((m: string, i: number) => <li key={i}>{m}</li>)}
                                  </ul>
                              </div>
                          )}
                          
                          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mt-4">
                              <h4 className="text-emerald-400 font-bold text-sm uppercase mb-3">Seu Desempenho</h4>
                              <div className="flex gap-4">
                                  <div className="flex-1">
                                      <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Repetições/Distância</label>
                                      <input 
                                          type="text" 
                                          placeholder="Ex: 50 reps" 
                                          value={exerciseLogs[currentExIndex]?.reps || ''}
                                          onChange={(e) => setExerciseLogs(prev => ({...prev, [currentExIndex]: {...prev[currentExIndex], reps: e.target.value}}))}
                                          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                                      />
                                  </div>
                                  <div className="flex-1">
                                      <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Tempo Gasto</label>
                                      <input 
                                          type="text" 
                                          placeholder="Ex: 2 min" 
                                          value={exerciseLogs[currentExIndex]?.time || ''}
                                          onChange={(e) => setExerciseLogs(prev => ({...prev, [currentExIndex]: {...prev[currentExIndex], time: e.target.value}}))}
                                          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                                      />
                                  </div>
                              </div>
                          </div>

                          <div className="flex gap-4 mt-auto pt-8">
                              <button 
                                onClick={prevExercise}
                                disabled={currentExIndex === 0}
                                className="px-6 py-4 rounded-xl font-bold bg-slate-800 text-slate-400 disabled:opacity-30 hover:bg-slate-700 transition-all flex-1"
                              >
                                  <ChevronLeft /> Anterior
                              </button>

                              <button 
                                onClick={nextExercise}
                                className="px-6 py-4 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition-all flex-[2] flex items-center justify-center gap-2 text-lg"
                              >
                                  {currentExIndex === currentRoutine.exercises.length - 1 ? (
                                      <>Finalizar Treino <CheckCircle size={24} /></>
                                  ) : (
                                      <>Próximo <ChevronRight size={24} /></>
                                  )}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER NORMAL MODE ---
  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        <div className="flex w-full gap-4 md:gap-8 h-32 md:h-40 shrink-0">
            <button 
                onClick={() => setActiveTab('body')}
                className={`flex-1 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 group relative overflow-hidden ${
                    activeTab === 'body' 
                    ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                }`}
            >
                {activeTab === 'body' && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>}
                <Dumbbell size={32} className={`transition-transform duration-300 ${activeTab === 'body' ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                <div>
                    <span className={`text-2xl md:text-3xl font-black uppercase tracking-widest block ${activeTab === 'body' ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'}`}>CORPO</span>
                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] block text-center ${activeTab === 'body' ? 'text-emerald-200' : 'text-slate-600'}`}>Protocolo TAF APMBB</span>
                </div>
            </button>

            <button 
                onClick={() => setActiveTab('mind')}
                className={`flex-1 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 group relative overflow-hidden ${
                    activeTab === 'mind' 
                    ? 'bg-purple-600 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.3)]' 
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                }`}
            >
                {activeTab === 'mind' && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>}
                <Brain size={32} className={`transition-transform duration-300 ${activeTab === 'mind' ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-purple-400'}`} />
                <div>
                    <span className={`text-2xl md:text-3xl font-black uppercase tracking-widest block ${activeTab === 'mind' ? 'text-white' : 'text-slate-500 group-hover:text-purple-400'}`}>MENTE</span>
                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] block text-center ${activeTab === 'mind' ? 'text-purple-200' : 'text-slate-600'}`}>Cognição & Estudo</span>
                </div>
            </button>
        </div>

        {/* --- BODY TAB CONTENT --- */}
        {activeTab === 'body' && (
            <div className="flex flex-col gap-8 animate-fade-in flex-1">
                <div className="w-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                    <div className="bg-emerald-900/40 p-6 border-b border-emerald-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Flame className="text-emerald-500" fill="currentColor" />
                                <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Protocolo Progressivo</h3>
                            </div>
                            <h2 className="text-3xl font-black text-white">{currentRoutine.title}</h2>
                            <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
                                <Activity size={14} /> Full Body • 30-40 Minutos • Visual 3D Incluso
                            </p>
                            <p className="text-slate-400 text-xs mt-2 italic border-l-2 border-slate-600 pl-2">
                                {currentRoutine.description}
                            </p>
                        </div>
                        
                        <div className="flex items-center bg-slate-900/50 rounded-lg p-1 border border-slate-700">
                            <button 
                                onClick={() => setCalisthenicsLevel(prev => Math.max(1, prev - 1))}
                                disabled={calisthenicsLevel === 1}
                                className="p-3 hover:bg-emerald-600/20 rounded-md disabled:opacity-30 transition-colors text-white"
                            >
                                <ChevronLeft />
                            </button>
                            <div className="px-4 text-center">
                                <span className="block text-xs text-slate-500 uppercase font-bold">Nível</span>
                                <span className="block text-xl font-bold text-emerald-400">{calisthenicsLevel}</span>
                            </div>
                            <button 
                                onClick={() => setCalisthenicsLevel(prev => Math.min(5, prev + 1))}
                                disabled={calisthenicsLevel === 5}
                                className="p-3 hover:bg-emerald-600/20 rounded-md disabled:opacity-30 transition-colors text-white"
                            >
                                <ChevronRight />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-700 p-2 rounded-lg text-emerald-400">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <span className="block text-xs text-slate-400 uppercase font-bold">Treino de Hoje</span>
                                    <span className="text-lg font-bold text-white capitalize">{todayName}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-slate-400 uppercase font-bold">Descanso Sugerido</span>
                                <span className="text-emerald-400 font-mono font-bold">{currentRoutine.rest}</span>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            {currentRoutine.exercises.map((ex: any, idx: number) => {
                                const isExpanded = expandedExercise === ex.name;
                                return (
                                    <div key={idx} className={`bg-slate-900/50 rounded-xl border transition-all overflow-hidden ${isExpanded ? 'border-emerald-500 shadow-lg shadow-emerald-900/20' : 'border-slate-700 hover:border-emerald-500/30'}`}>
                                        <div 
                                            onClick={() => toggleExerciseDetails(ex.name)}
                                            className="p-4 flex items-center justify-between cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${isExpanded ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold text-lg ${isExpanded ? 'text-emerald-400' : 'text-white'}`}>{ex.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">{ex.reps}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${isExpanded ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                                                {isExpanded ? <ChevronDown size={14} /> : <Film size={14} />}
                                                {isExpanded ? 'Fechar' : 'Ver Execução (GIF)'}
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="p-4 pt-0 border-t border-slate-700/50 bg-slate-800/30 animate-fade-in">
                                                <div className="grid grid-cols-1 gap-6 mt-4">
                                                    <div className="rounded-lg overflow-hidden border border-slate-600 bg-black flex items-center justify-center relative aspect-video w-full shadow-2xl">
                                                        <SafeImage 
                                                            src={ex.demoUrl} 
                                                            alt={ex.name} 
                                                            className="w-full h-full object-contain bg-slate-900"
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h5 className="text-red-400 font-bold text-sm flex items-center gap-2 mb-2">
                                                                <XCircle size={16} /> O que NÃO fazer (Erros Comuns)
                                                            </h5>
                                                            <ul className="space-y-2">
                                                                {ex.mistakes?.map((mistake: string, mIdx: number) => (
                                                                    <li key={mIdx} className="flex items-start gap-2 text-sm text-slate-300 bg-red-900/10 p-2 rounded border border-red-500/10">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                                                                        {mistake}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700 flex justify-center">
                            <button 
                                onClick={startTraining}
                                className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95 animate-pulse"
                            >
                                <Play fill="currentColor" size={20} /> Iniciar Treino (40 min)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <History size={18} className="text-emerald-400" /> Histórico de Treinos
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {workoutLogs.length === 0 && <p className="text-sm text-slate-500">Nenhum treino registrado via Chat ainda.</p>}
                        {workoutLogs.slice().reverse().map(log => (
                            <div key={log.id} className="border-l-2 border-emerald-500 pl-3 py-1">
                                <p className="text-white font-medium text-sm">{log.description}</p>
                                <p className="text-xs text-slate-500">{new Date(log.date).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- MIND TAB CONTENT (ORGANIZED BY SUBJECT) --- */}
        {activeTab === 'mind' && (
            <div className="flex flex-col gap-6 animate-fade-in flex-1">
                
                {/* 1. MODULE CONTROLLER */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center justify-between shadow-lg">
                     <button 
                        onClick={() => setCurrentModule(prev => Math.max(1, prev - 1))}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                        disabled={currentModule === 1}
                     >
                         <ChevronLeft size={20} />
                     </button>
                     <div className="text-center">
                         <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block mb-1">Conteúdo Programático</span>
                         <h2 className="text-2xl font-black text-white">MÓDULO {currentModule}</h2>
                     </div>
                     <button 
                        onClick={() => setCurrentModule(prev => prev + 1)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                     >
                         <ChevronRight size={20} />
                     </button>
                </div>

                {/* 2. SUBJECTS GRID (ALL SUBJECTS) */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {uniqueSubjects.map(subject => {
                        // Find content for this subject in the current module
                        const allTopicsForSubject = studyTopics.filter(t => t.subject === subject);
                        const topicIndex = currentModule - 1;
                        const specificTopic = allTopicsForSubject[topicIndex];
                        
                        // Calculate Progress
                        const totalTopics = allTopicsForSubject.length;
                        const completedTopics = allTopicsForSubject.filter(t => t.completed).length;
                        const percent = Math.round((completedTopics / totalTopics) * 100);

                        // If no topic exists for this module (e.g. module 20 but subject only has 10 topics)
                        const isFinished = !specificTopic;
                        
                        const colorClass = getSubjectColor(subject);

                        return (
                            <div key={subject} className={`bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg transition-all hover:border-purple-500/30 hover:shadow-purple-900/10 group flex flex-col h-full`}>
                                {/* Subject Header */}
                                <div className={`p-4 border-b border-slate-700 flex justify-between items-center ${colorClass.replace('text-', 'bg-').split(' ')[2] || 'bg-slate-900/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg border ${colorClass.split(' ')[1] || 'border-slate-600'} ${colorClass.split(' ')[2] || 'bg-slate-900'}`}>
                                            <BookMarked size={18} className={colorClass.split(' ')[0]} />
                                        </div>
                                        <h3 className="text-md font-bold text-white tracking-wide truncate max-w-[150px]" title={subject}>{subject}</h3>
                                    </div>
                                    <div className="text-right">
                                         <span className="text-xs font-mono text-slate-400 block">{percent}%</span>
                                         <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
                                            <div className={`h-full ${percent === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{width: `${percent}%`}}></div>
                                         </div>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="p-5 flex-1 flex flex-col justify-center">
                                    {isFinished ? (
                                        <div className="flex flex-col items-center justify-center py-2 text-slate-500">
                                            <CheckCircle className="mb-2 opacity-50 text-emerald-500" size={28} />
                                            <p className="font-medium text-sm text-center">Matéria Concluída</p>
                                        </div>
                                    ) : (
                                        <div className={`w-full text-left p-4 rounded-xl border transition-all group flex flex-col gap-3 
                                                ${specificTopic.completed 
                                                    ? 'bg-purple-900/10 border-purple-500/20' 
                                                    : 'bg-slate-700/20 border-slate-600/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3 w-full" onClick={() => onToggleTopic(specificTopic.id)}>
                                                <button className={`mt-0.5 transition-all outline-none ${specificTopic.completed ? 'text-purple-400' : 'text-slate-500 group-hover:text-purple-400'}`}>
                                                    {specificTopic.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </button>
                                                <div className="flex-1 cursor-pointer">
                                                    <span className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">
                                                        Tópico do Módulo {currentModule}
                                                    </span>
                                                    <span className={`text-sm font-medium transition-colors leading-relaxed line-clamp-3 ${specificTopic.completed ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-200'}`}>
                                                        {specificTopic.topic}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleOpenTutor(specificTopic); }}
                                                className="w-full mt-2 bg-slate-800 hover:bg-purple-600/20 text-purple-400 border border-slate-700 hover:border-purple-500/50 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all outline-none"
                                            >
                                                <Cpu size={14} /> Estudar com IA
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                { !isFinished && (
                                    <div className="px-4 py-2 bg-slate-900/30 border-t border-slate-700 text-[10px] text-slate-500 flex justify-between">
                                        <span>Total: {totalTopics} tópicos</span>
                                        {specificTopic.completed && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10}/> Concluído</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* TUTOR MODAL */}
                {activeTutorTopic && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-8">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl h-full flex flex-col shadow-2xl overflow-hidden animate-fade-in relative">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-800 bg-slate-900/50">
                                <div>
                                    <p className="text-xs uppercase tracking-widest font-bold text-purple-500 mb-1 flex items-center gap-2">
                                        <Cpu size={14} /> IA TUTORA NEXUS
                                    </p>
                                    <h2 className="text-white font-bold text-xl md:text-2xl">{activeTutorTopic.subject}: {activeTutorTopic.topic}</h2>
                                </div>
                                <button onClick={closeTutor} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
                                {tutorState === 'loading' && (
                                    <div className="flex flex-col items-center justify-center h-full text-purple-400">
                                        <Cpu size={64} className="animate-pulse mb-6 opacity-80" />
                                        <h3 className="text-2xl font-black mb-2 text-white">Gerando Conteúdo...</h3>
                                        <p className="text-slate-400 font-medium">Buscando referências APMBB / VUNESP</p>
                                    </div>
                                )}
                                
                                {tutorState === 'content' && !quizFinished && tutorContent && (
                                    <div className="max-w-3xl mx-auto flex flex-col gap-8">
                                        {/* Content View */}
                                        {currentQuestionIdx === 0 && (
                                            <div className="prose prose-invert prose-purple max-w-none 
                                                prose-headings:text-purple-300 prose-a:text-purple-400 
                                                prose-strong:text-white prose-strong:font-bold prose-code:text-emerald-300">
                                                <ReactMarkdown>{tutorContent}</ReactMarkdown>
                                            </div>
                                        )}

                                        {/* Quiz View */}
                                        {tutorQuestions.length > 0 && (
                                            <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                        <Brain className="text-purple-500" /> Fixação VUNESP
                                                    </h3>
                                                    <span className="text-xs font-mono bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30">
                                                        Questão {currentQuestionIdx + 1} / {tutorQuestions.length}
                                                    </span>
                                                </div>
                                                
                                                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl mb-6 shadow-inner">
                                                    <p className="text-white text-lg font-medium leading-relaxed">
                                                        {tutorQuestions[currentQuestionIdx]?.q}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    {tutorQuestions[currentQuestionIdx]?.options.map((opt, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => setSelectedOption(idx)}
                                                            className={`p-4 rounded-xl border text-left transition-all font-medium
                                                                ${selectedOption === idx 
                                                                    ? 'bg-purple-600/20 border-purple-500 text-white' 
                                                                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'}
                                                            `}
                                                        >
                                                            <span className="inline-block w-8 text-slate-500 font-bold">{String.fromCharCode(65 + idx)})</span> {opt}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button 
                                                    onClick={handleAnswerQuestion}
                                                    disabled={selectedOption === null}
                                                    className="mt-8 bg-purple-600 disabled:opacity-30 disabled:hover:bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    {currentQuestionIdx < tutorQuestions.length - 1 ? 'Próxima Questão' : 'Finalizar Estudo'} <ArrowRight size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {quizFinished && (
                                     <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center max-w-lg mx-auto">
                                        <div className="w-24 h-24 bg-emerald-900/30 border border-emerald-500/50 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/20">
                                            <Trophy size={40} className="text-emerald-400" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white mb-2">Módulo Concluído!</h2>
                                        <p className="text-lg text-slate-400 mb-8">
                                            Seu desempenho: <strong className="text-purple-400">{quizScore} / {tutorQuestions.length} corretas</strong>
                                        </p>
                                        
                                        <button 
                                            onClick={() => {
                                                if (!activeTutorTopic.completed) onToggleTopic(activeTutorTopic.id);
                                                closeTutor();
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 w-full rounded-xl transition-colors shadow-lg"
                                        >
                                            Marcar como Concluído e Sair
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="mt-8 pt-8 border-t border-slate-800/50 flex flex-col items-center justify-center text-slate-600 gap-2 pb-8">
            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            <p className="text-xs uppercase tracking-widest font-bold opacity-50">Nexus 360</p>
            <ChevronDown className="animate-bounce opacity-30 mt-2" size={16} />
        </div>
    </div>
  );
};