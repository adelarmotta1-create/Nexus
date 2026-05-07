import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { chatWithNexus } from '../services/geminiService';
import { NexusLogo } from './NexusLogo';
import { Send, Sparkles, Bot, User, ArrowUp, DollarSign, Dumbbell, Clock, Mic, Image as ImageIcon, X, Paperclip } from 'lucide-react';

interface DashboardProps {
  onCommand: (toolName: string, args: any) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const Dashboard: React.FC<DashboardProps> = ({ onCommand, messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New States for Audio/Image
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // --- AUDIO INPUT HANDLER ---
  const toggleListening = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("Seu navegador não suporta entrada de voz. Recomendamos o Google Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false; // Stop after one command/sentence
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
        setIsListening(true);
    };

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
            // AUTO-SEND: Immediately process the command without user needing to click send
            handleSend(undefined, transcript);
        }
        setIsListening(false);
    };

    recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognition.start();
  };

  // --- IMAGE UPLOAD HANDLER ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setAttachment(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || input;
    
    // Allow sending if there is text OR an attachment
    if (!textToSend.trim() && !attachment) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    // Include a visual indicator in the message list if an image was sent
    if (!textToSend.trim() && attachment) {
        userMsg.text = "📷 [Imagem enviada para análise]";
    }

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentAttachment = attachment;
    setAttachment(null); // Clear attachment immediately
    setLoading(true);

    const { text, functionCall } = await chatWithNexus(textToSend, messages, currentAttachment || undefined);

    setLoading(false);

    if (functionCall) {
        onCommand(functionCall.name, functionCall.args);
        
        const responseText = text || "Certo, comando processado.";
        
        setMessages(prev => [...prev, {
            id: Date.now().toString() + '_ai',
            role: 'model',
            text: responseText,
            timestamp: new Date()
        }]);

    } else if (text) {
        setMessages(prev => [...prev, {
            id: Date.now().toString() + '_ai',
            role: 'model',
            text: text,
            timestamp: new Date()
        }]);
    }
  };

  const SuggestionCard = ({ icon: Icon, text, onClick }: any) => (
      <button 
        onClick={onClick}
        className="flex flex-col items-start gap-2 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-all text-left group w-full"
      >
          <div className="p-2 rounded-full bg-slate-900 group-hover:bg-slate-800 text-blue-400">
            <Icon size={18} />
          </div>
          <span className="text-sm text-slate-300 font-medium">{text}</span>
      </button>
  );

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto relative">
      
      {/* Header Minimalista */}
      <header className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-slate-900 to-transparent">
        <div className="flex items-center gap-2">
            <NexusLogo size={24} />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 tracking-wider">
                NEXUS AI
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold tracking-wider">BETA</span>
        </div>
      </header>

      {/* Área Principal */}
      <div className="flex-1 overflow-y-auto pt-16 pb-32 px-4 scrollbar-hide">
        
        {/* Estado Vazio (Welcome) */}
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                <div className="w-20 h-20 mb-6 flex items-center justify-center bg-slate-800/50 rounded-3xl border border-slate-700 shadow-xl shadow-blue-900/10">
                     <NexusLogo size={48} className="drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 text-center">Como posso ajudar hoje?</h2>
                <p className="text-slate-400 text-center max-w-md mb-12">
                    Sou seu controlador geral. Posso analisar fotos de documentos, registrar gastos por voz e organizar seu dia.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <SuggestionCard 
                        icon={DollarSign} 
                        text="Gastei R$ 45,00 no almoço" 
                        onClick={() => handleSend(undefined, "Gastei R$ 45,00 no almoço")}
                    />
                    <SuggestionCard 
                        icon={ImageIcon} 
                        text="Resolver prova anterior (Foto)" 
                        onClick={() => {
                            // Trigger file upload programmatically
                            fileInputRef.current?.click();
                        }}
                    />
                    <SuggestionCard 
                        icon={Sparkles} 
                        text="Questões APMBB (História/Geografia)" 
                        onClick={() => handleSend(undefined, "Gere 3 exercícios focados no concurso da APMBB - Aluno Oficial.")}
                    />
                    <SuggestionCard 
                        icon={Mic} 
                        text="Clique para falar (Auto)" 
                        onClick={toggleListening}
                    />
                </div>
            </div>
        )}

        {/* Lista de Mensagens */}
        <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg mt-1">
                        <Bot size={16} className="text-white" />
                    </div>
                )}

                <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                        ? 'bg-slate-800 text-slate-100 rounded-tr-sm' 
                        : 'text-slate-200'}`}>
                    {msg.role === 'model' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                           {msg.text.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
                        </div>
                    ) : (
                        msg.text
                    )}
                </div>

                {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-slate-700 mt-1">
                        <User size={16} className="text-slate-300" />
                    </div>
                )}
            </div>
            ))}
            
            {loading && (
                <div className="flex gap-4 max-w-3xl mx-auto">
                     <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg mt-1">
                        <Sparkles size={16} className="text-white animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1 h-10">
                        <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Flutuante */}
      <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center">
        <form onSubmit={(e) => handleSend(e)} className="w-full max-w-3xl relative flex flex-col items-center">
            
            {/* Image Preview */}
            {attachment && (
                <div className="self-start mb-2 relative bg-slate-800 p-2 rounded-xl border border-slate-700 animate-fade-in">
                    <img src={attachment} alt="Preview" className="h-24 rounded-lg object-cover" />
                    <button 
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="relative w-full">
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />

                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Ouvindo... (Enviarei ao parar de falar)" : "Converse ou envie uma foto..."}
                    className={`w-full bg-slate-800/90 backdrop-blur-md text-white pl-12 pr-28 py-4 rounded-full border shadow-2xl focus:outline-none transition-all placeholder:text-slate-500
                        ${isListening ? 'border-red-500/50 ring-1 ring-red-500/50' : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
                    `}
                />
                
                {/* Image Upload Button */}
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute left-3 top-3 bottom-3 aspect-square text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-full transition-all flex items-center justify-center"
                    title="Anexar Imagem"
                >
                    <Paperclip size={20} />
                </button>

                {/* Right Side Buttons */}
                <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
                    {/* Mic Button */}
                    <button 
                        type="button"
                        onClick={toggleListening}
                        className={`aspect-square rounded-full transition-all flex items-center justify-center w-10 h-10
                            ${isListening 
                                ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.7)]' 
                                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                        title={isListening ? "Parar e Enviar" : "Falar"}
                    >
                        <Mic size={20} className={isListening ? "animate-bounce" : ""} />
                    </button>

                    {/* Send Button */}
                    <button 
                        type="submit" 
                        disabled={(!input.trim() && !attachment) || loading}
                        className="aspect-square bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg w-10 h-10"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ArrowUp size={20} />}
                    </button>
                </div>
            </div>
        </form>
      </div>

    </div>
  );
};