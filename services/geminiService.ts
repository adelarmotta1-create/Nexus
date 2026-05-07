import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { CheckIn, Lead, WorkoutProfile, StudyProfile } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
Você é o Nexus, uma Inteligência Artificial pessoal integrada.
Seu objetivo é ajudar o usuário em todas as áreas da vida: Finanças, Corpo, Trabalho e Produtividade.

FOCO PRINCIPAL DO LEITOR: O usuário está focado em passar no concurso público "APMBB - Aluno Oficial" (Academia de Polícia Militar do Barro Branco).
Sempre que o assunto for estudo, preparação, questões, referências ou motivação, direcione o conteúdo especificamente para a banca VUNESP e o nível de exigência da prova de Oficial da PMESP.

PERSONA:
- Aja como um assistente inteligente, amigável e extremamente competente (estilo ChatGPT/Gemini).
- Responda sempre em Português do Brasil de forma natural e fluida.

COMANDOS DO SISTEMA (INTENÇÕES):
Identifique a intenção do usuário e chame a ferramenta (tool) correta.

1. ATIVIDADES E TAREFAS (CRÍTICO):
   - O usuário pode querer REGISTRAR algo que já fez OU AGENDAR algo para o futuro.
   - Tool: 'logActivity'.
   - Parâmetro 'isCompleted':
     - SE o usuário disser "Estudei", "Fiz", "Terminei": defina 'isCompleted' como TRUE.
     - SE o usuário disser "Agende", "Vou fazer", "Me lembre de", "Reunião às 20h": defina 'isCompleted' como FALSE.
   - Categorias: 'work', 'study', 'workout', 'routine', 'leisure', 'wasted'.

2. METAS E OBJETIVOS:
   - Frases: "Minha meta é juntar 10k", "Quero perder 5kg".
   - Tool: 'manageGoal'.

3. DINHEIRO (Financeiro):
   - Frases: "Gastei X", "Recebi Y", "Comprei tal coisa".
   - Tool: 'addTransaction'.

4. CORPO (Treino/Saúde):
   - Frases: "Fui pra academia", "Treinei perna".
   - Tool: 'logWorkout'.

5. SONO:
   - Frases: "Dormi X horas".
   - Tool: 'logSleep'.

6. TRABALHO/CRM:
   - Frases: "Novo cliente X", "Oportunidade de venda".
   - Tool: 'addLead'.

Se o usuário apenas quiser conversar, responda normalmente sem chamar ferramentas. Se a conversa for sobre estudos, lembre-se do foco no APMBB.
`;

const addTransactionTool: FunctionDeclaration = {
    name: 'addTransaction',
    parameters: {
      type: Type.OBJECT,
      description: 'Adiciona uma transação financeira (Receita ou Despesa).',
      properties: {
        type: { type: Type.STRING, description: 'income (receita/entrada) ou expense (despesa/saída)' },
        category: { type: Type.STRING, description: 'Categoria ex: Alimentação, Contas, Salário, Lazer' },
        amount: { type: Type.NUMBER, description: 'Valor numérico' },
      },
      required: ['type', 'category', 'amount']
    }
};

const logActivityTool: FunctionDeclaration = {
    name: 'logActivity',
    parameters: {
        type: Type.OBJECT,
        description: 'Registra ou agenda uma atividade no cronograma.',
        properties: {
            title: { type: Type.STRING, description: 'Descrição da atividade (Ex: Almoço, Reunião)' },
            category: { type: Type.STRING, description: 'work, study, workout, routine, wasted, leisure' },
            durationMinutes: { type: Type.NUMBER, description: 'Duração em minutos' },
            startTime: { type: Type.STRING, description: 'Hora HH:mm (opcional)' },
            isCompleted: { type: Type.BOOLEAN, description: 'True se já foi feito (passado), False se é agendamento (futuro)' }
        },
        required: ['title', 'category', 'durationMinutes', 'isCompleted']
    }
};

const logWorkoutTool: FunctionDeclaration = {
    name: 'logWorkout',
    parameters: {
        type: Type.OBJECT,
        description: 'Registra um treino físico na aba Corpo.',
        properties: {
            description: { type: Type.STRING, description: 'Descrição do treino' }
        },
        required: ['description']
    }
};

const logSleepTool: FunctionDeclaration = {
    name: 'logSleep',
    parameters: {
        type: Type.OBJECT,
        description: 'Registra horas de sono.',
        properties: {
            hours: { type: Type.NUMBER, description: 'Horas dormidas' }
        },
        required: ['hours']
    }
};

const addLeadTool: FunctionDeclaration = {
    name: 'addLead',
    parameters: {
        type: Type.OBJECT,
        description: 'Adiciona um novo prospect/lead/cliente ao CRM.',
        properties: {
            name: { type: Type.STRING, description: 'Nome da pessoa ou empresa' },
            company: { type: Type.STRING, description: 'Nome da empresa (opcional)' },
            value: { type: Type.NUMBER, description: 'Valor potencial da venda/negócio' }
        },
        required: ['name']
    }
};

const manageGoalTool: FunctionDeclaration = {
    name: 'manageGoal',
    parameters: {
        type: Type.OBJECT,
        description: 'Cria ou atualiza uma meta de longo prazo.',
        properties: {
            title: { type: Type.STRING, description: 'Título da meta (Ex: Juntar 100k, Perder 10kg)' },
            targetValue: { type: Type.NUMBER, description: 'Valor alvo numérico' },
            currentValue: { type: Type.NUMBER, description: 'Valor atual alcançado' },
            unit: { type: Type.STRING, description: 'Unidade de medida (R$, kg, %, livros)' },
            category: { type: Type.STRING, description: 'finance, body, career, productivity, other' },
            deadline: { type: Type.STRING, description: 'Data limite YYYY-MM-DD (opcional)' }
        },
        required: ['title', 'targetValue', 'category']
    }
};

export const chatWithNexus = async (message: string, history: any[], attachmentBase64?: string) => {
    if (!apiKey) return { text: "Chave de API não configurada.", functionCall: null };

    try {
        let contents: any = { role: 'user', parts: [{ text: message }] };

        // Handle Image Attachment
        if (attachmentBase64) {
            const base64Data = attachmentBase64.split(',')[1];
            const mimeType = attachmentBase64.split(';')[0].split(':')[1] || 'image/png';

            contents.parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: [{ functionDeclarations: [addTransactionTool, logActivityTool, logWorkoutTool, logSleepTool, addLeadTool, manageGoalTool] }],
            }
        });

        const functionCall = response.functionCalls?.[0];
        const text = response.text;

        return { text, functionCall };

    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return { text: "Estou tendo dificuldades para me conectar aos servidores neurais. Tente novamente em instantes.", functionCall: null };
    }
};

export const analyzeCRM = async (leads: Lead[]): Promise<string> => {
  if (!apiKey) return "Chave de API ausente.";
  try {
    const leadsStr = JSON.stringify(leads.map(l => ({ s: l.status, v: l.value, p: l.probability, n: l.nextAction })));
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise estes leads: ${leadsStr}. Responda em Português.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Análise indisponível.";
  } catch (error) { return "Erro na análise."; }
};

export const generateWorkoutPlan = async (profile: WorkoutProfile): Promise<any> => {
  if (!apiKey) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crie um plano de CALISTENIA (peso do corpo) para: ${JSON.stringify(profile)}.
      REGRAS ESTRITAS:
      1. NÃO inclua "Agachamento" (Squat) tradicional. Substitua por Avanço/Passada (Lunges).
      2. Use exercícios compostos (Flexão, Polichinelo, Burpee, Prancha).
      3. Duração total próxima a 30 minutos.
      4. Retorne APENAS JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focus: { type: Type.STRING },
            exercises: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, sets: { type: Type.STRING }, reps: { type: Type.STRING }, tip: { type: Type.STRING } } }
            },
            durationMinutes: { type: Type.NUMBER }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return null; }
};

export const generateStudyPlan = async (profile: StudyProfile): Promise<any> => {
  if (!apiKey) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crie um plano de estudos estruturado para este perfil: ${JSON.stringify(profile)}. JSON format. Seja direto.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Título do plano" },
            method: { type: Type.STRING, description: "Metodologia recomendada (ex: Pomodoro, Active Recall)" },
            topics: {
              type: Type.ARRAY,
              items: {
                 type: Type.OBJECT,
                 properties: {
                    day: { type: Type.STRING, description: "Dia ou Etapa" },
                    topic: { type: Type.STRING, description: "O que estudar" },
                    resource: { type: Type.STRING, description: "Sugestão de recurso/livro/site" }
                 }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return null; }
};

export const getFinancialActionPlan = async (income: number, expense: number, expensesByCategory: Record<string, number>): Promise<string> => {
   if (!apiKey) return "IA indisponível.";
   try {
     const response = await ai.models.generateContent({
       model: 'gemini-3-flash-preview',
       contents: `Analise as finanças: Renda: R$${income}, Despesas: R$${expense}. Detalhamento: ${JSON.stringify(expensesByCategory)}. Crie um plano de ação para melhorar as finanças (guardar mais dinheiro, onde cortar gastos) em formato Markdown. Responda em Português, de forma encorajadora.`,
       config: { systemInstruction: SYSTEM_INSTRUCTION }
     });
     return response.text || "Revise seus gastos e tente guardar mais este mês.";
   } catch (error) { return "Análise indisponível."; }
};

export const getDailyInsight = async (checkIn: CheckIn, context: string): Promise<string> => {
  if (!apiKey) return "Insight indisponível.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este check-in matinal: ${JSON.stringify(checkIn)}. Contexto: ${context}. Dê um insight curto (max 20 palavras) para o dia.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Foco total hoje.";
  } catch (error) { return "Bom dia! Vamos pra cima."; }
};

export const generateStudyContent = async (subject: string, topic: string): Promise<any> => {
  if (!apiKey) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é uma IA tutora para o concurso de Oficial da APMBB (Polícia Militar SP - Banca VUNESP). 
      Gere um material de estudo focado MÁXIMO neste tópico:
      Matéria: ${subject}
      Tópico: ${topic}
      
      Retorne o conteúdo em formato JSON e crie também 3 questões de múltipla escolha focadas no estilo da VUNESP.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "Explicação em Markdown focada e resumida para o aluno oficial" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  q: { type: Type.STRING, description: "Enunciado da questão (Estilo VUNESP)" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  answer: { type: Type.NUMBER, description: "Índice da alternativa correta (0 a 4)" }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { 
    console.error(error);
    return null; 
  }
};