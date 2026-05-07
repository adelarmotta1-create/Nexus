import { NavigationTab, Task, Funnel, Goal, Transaction } from "./types";
import { LayoutDashboard, Clock, Briefcase, Activity, DollarSign, BarChart3, CheckSquare } from 'lucide-react';

export const NAV_ITEMS: { id: NavigationTab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Comando', icon: LayoutDashboard },
  { id: 'productivity', label: 'Produtividade', icon: CheckSquare },
  { id: 'professional', label: 'CRM', icon: Briefcase },
  { id: 'body', label: 'Corpo', icon: Activity },
  { id: 'finance', label: 'Finanças', icon: DollarSign },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

export const MOCK_FUNNELS: Funnel[] = [
  {
    id: 'default',
    name: 'Vendas Geral',
    stages: [
      { id: 'lead', name: 'Novos Leads', color: 'border-blue-500/50' },
      { id: 'contact', name: 'Em Contato', color: 'border-cyan-500/50' },
      { id: 'proposal', name: 'Proposta Enviada', color: 'border-purple-500/50' },
      { id: 'negotiation', name: 'Em Negociação', color: 'border-amber-500/50' },
      { id: 'closed', name: 'Fechado / Ganho', color: 'border-emerald-500/50' },
      { id: 'followup', name: 'Follow-up', color: 'border-pink-500/50' },
      { id: 'lost', name: 'Perdido', color: 'border-red-500/50' },
    ]
  },
  {
    id: 'partnership',
    name: 'Parcerias',
    stages: [
      { id: 'prospect', name: 'Prospecção', color: 'border-blue-500/50' },
      { id: 'meeting', name: 'Reunião', color: 'border-yellow-500/50' },
      { id: 'signed', name: 'Assinado', color: 'border-green-500/50' }
    ]
  }
];

export const MOCK_LEADS = [
  { id: '1', funnelId: 'default', name: 'João Silva', company: 'Acme Inc.', status: 'proposal', value: 15000, probability: 60, lastContact: '2023-10-25', nextAction: 'Enviar contrato atualizado', phone: '11 99999-9999', state: 'SP', location: 'São Paulo', lat: -23.5505, lng: -46.6333 },
  { id: '2', funnelId: 'default', name: 'Maria Souza', company: 'Globex Corp', status: 'negotiation', value: 45000, probability: 80, lastContact: '2023-10-26', nextAction: 'Finalizar precificação', phone: '21 98888-8888', state: 'RJ', location: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  { id: '3', funnelId: 'default', name: 'Pedro Santos', company: 'Soylent Corp', status: 'lead', value: 5000, probability: 20, lastContact: '2023-10-20', nextAction: 'Chamada inicial de descoberta', instagram: '@soylent', state: 'MG', location: 'Belo Horizonte', lat: -19.9167, lng: -43.9345 },
  { id: '4', funnelId: 'partnership', name: 'Influencer X', company: 'InstaBrand', status: 'meeting', value: 0, probability: 50, lastContact: '2023-10-28', nextAction: 'Almoço de negócios', phone: '11 88888-8888' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'income', category: 'Salário', amount: 5000, date: '2023-10-01' },
  { id: '2', type: 'expense', category: 'Aluguel', amount: 1200, date: '2023-10-02' },
  { id: '3', type: 'expense', category: 'Mercado', amount: 450, date: '2023-10-05' },
  { id: '4', type: 'income', category: 'Freelance', amount: 800, date: '2023-10-10' },
];

export const MOCK_TASKS: Task[] = [
    { id: '1', title: 'Leitura Matinal', completed: true, category: 'study', startTime: '06:00', durationMinutes: 60, xpReward: 50, date: new Date().toISOString() },
    { id: '2', title: 'Deep Work: Projeto Nexus', completed: true, category: 'work', startTime: '08:00', durationMinutes: 120, xpReward: 100, date: new Date().toISOString() },
    { id: '3', title: 'Instagram / Reels', completed: true, category: 'wasted', startTime: '10:15', durationMinutes: 45, xpReward: 0, date: new Date().toISOString() },
    { id: '4', title: 'Reunião de Vendas', completed: false, category: 'work', startTime: '14:00', durationMinutes: 60, xpReward: 80, date: new Date().toISOString() },
    { id: '5', title: 'Treino de Força', completed: false, category: 'workout', startTime: '18:00', durationMinutes: 90, xpReward: 120, date: new Date().toISOString() },
];

export const MOCK_GOALS: Goal[] = [
    { id: '1', title: 'Juntar R$ 50.000', description: 'Reserva de emergência e investimentos.', currentValue: 15400, targetValue: 50000, unit: 'R$', category: 'finance', deadline: '2024-12-31', status: 'in_progress' },
    { id: '2', title: 'Atingir 80kg', description: 'Meta de peso corporal com massa magra.', currentValue: 86, targetValue: 80, unit: 'kg', category: 'body', deadline: '2024-06-30', status: 'in_progress' },
    { id: '3', title: 'Ler 12 Livros', description: 'Desenvolvimento pessoal e técnico.', currentValue: 3, targetValue: 12, unit: 'un', category: 'productivity', status: 'in_progress' },
];