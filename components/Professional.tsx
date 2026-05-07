import React, { useState, useEffect, useRef } from 'react';
import { Lead, Funnel, FunnelStage } from '../types';
import { analyzeCRM } from '../services/geminiService';
import { TrendingUp, Users, DollarSign, Brain, MoreHorizontal, Plus, X, Save, MapPin, Instagram, Phone, Building2, User, LayoutGrid, List as ListIcon, GripVertical, Settings, Trash2, ChevronDown, Edit3, Map as MapIcon, Globe2, Loader2 } from 'lucide-react';
import L from 'leaflet';

interface ProfessionalProps {
    leads: Lead[];
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
    funnels: Funnel[];
    setFunnels: React.Dispatch<React.SetStateAction<Funnel[]>>;
}

export const Professional: React.FC<ProfessionalProps> = ({ leads, setLeads, funnels, setFunnels }) => {
  // Data State
  const [activeFunnelId, setActiveFunnelId] = useState<string>(funnels[0]?.id || 'default');

  // View & UX State
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showFunnelModal, setShowFunnelModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'map'>('kanban');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // -- MAP REFS --
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // -- FUNNEL EDITING STATE --
  const [editingFunnel, setEditingFunnel] = useState<Partial<Funnel> | null>(null);
  const [showFunnelDropdown, setShowFunnelDropdown] = useState(false);

  // -- CLIENT FORM STATE --
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null); // Track if we are editing an existing lead
  const [clientFormData, setClientFormData] = useState<Partial<Lead>>({
    name: '',
    company: '',
    cpfCnpj: '',
    instagram: '',
    phone: '',
    zipCode: '',
    address: '',
    number: '',
    state: '',
    location: '', // city
    value: 0,
    status: '',
    probability: 10,
    nextAction: 'Iniciar contato'
  });

  const activeFunnel = funnels.find(f => f.id === activeFunnelId) || funnels[0];
  const activeLeads = leads.filter(l => l.funnelId === activeFunnelId);

  // Default status when opening form
  useEffect(() => {
    if (activeFunnel && !clientFormData.status && !editingLeadId) {
        setClientFormData(prev => ({ ...prev, status: activeFunnel.stages[0].id }));
    }
  }, [activeFunnelId, activeFunnel, editingLeadId]);

  // --- MAP INITIALIZATION ---
  useEffect(() => {
      // Only initialize map if viewMode is 'map'
      if (viewMode !== 'map') return;

      // Cleanup previous map instance if it exists
      if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
      }

      // Small timeout to allow DOM to render the container
      const timer = setTimeout(() => {
          if (mapContainerRef.current && leads.length > 0) {
              // Default center (Brazil approx)
              const map = L.map(mapContainerRef.current).setView([-14.2350, -51.9253], 3);
              
              L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                  subdomains: 'abcd',
                  maxZoom: 19
              }).addTo(map);

              // Add markers for leads with coordinates
              const bounds = L.latLngBounds([]);
              let hasMarkers = false;

              leads.forEach(lead => {
                  if (lead.lat && lead.lng) {
                      hasMarkers = true;
                      const latLng = L.latLng(lead.lat, lead.lng);
                      bounds.extend(latLng);

                      const markerColor = lead.status === 'closed' ? '#10b981' : (lead.status === 'lost' ? '#ef4444' : '#3b82f6');
                      
                      // Custom simple dot icon
                      const customIcon = L.divIcon({
                          className: 'custom-div-icon',
                          html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${markerColor};"></div>`,
                          iconSize: [12, 12],
                          iconAnchor: [6, 6]
                      });

                      L.marker(latLng, { icon: customIcon })
                        .addTo(map)
                        .bindPopup(`
                            <div style="min-width: 150px;">
                                <strong style="font-size: 14px; color: #fff;">${lead.name}</strong><br/>
                                <span style="color: #94a3b8; font-size: 12px;">${lead.company}</span><br/>
                                <div style="margin-top: 5px; font-weight: bold; color: ${markerColor}">${activeFunnel.stages.find(s => s.id === lead.status)?.name || lead.status}</div>
                                <div style="font-size: 11px; color: #cbd5e1; margin-top: 5px;">${lead.location} - ${lead.state}</div>
                            </div>
                        `);
                  }
              });

              if (hasMarkers) {
                  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
              }

              mapInstanceRef.current = map;
          }
      }, 100);

      return () => {
          clearTimeout(timer);
          if (mapInstanceRef.current) {
              mapInstanceRef.current.remove();
              mapInstanceRef.current = null;
          }
      };
  }, [leads, activeFunnelId, viewMode]); // Re-render map when leads change or view mode switches to map


  // --- FUNNEL MANAGEMENT ---

  const handleCreateFunnel = () => {
      setEditingFunnel({
          id: '',
          name: 'Novo Funil',
          stages: [
              { id: 'stage_1', name: 'Início', color: 'border-blue-500/50' },
              { id: 'stage_2', name: 'Fim', color: 'border-emerald-500/50' }
          ]
      });
      setShowFunnelModal(true);
      setShowFunnelDropdown(false);
  };

  const handleEditFunnel = () => {
      setEditingFunnel(JSON.parse(JSON.stringify(activeFunnel))); // Deep copy
      setShowFunnelModal(true);
      setShowFunnelDropdown(false);
  };

  const handleDeleteFunnel = () => {
      if (funnels.length <= 1) {
          alert("Você precisa ter pelo menos um funil.");
          return;
      }
      if (confirm(`Tem certeza que deseja excluir o funil "${activeFunnel.name}"? Todos os leads deste funil serão ocultados.`)) {
          const newFunnels = funnels.filter(f => f.id !== activeFunnelId);
          setFunnels(newFunnels);
          setActiveFunnelId(newFunnels[0].id);
          setShowFunnelDropdown(false);
      }
  };

  const handleSaveFunnel = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingFunnel || !editingFunnel.name) return;

      if (editingFunnel.id) {
          // Edit existing
          setFunnels(prev => prev.map(f => f.id === editingFunnel.id ? editingFunnel as Funnel : f));
      } else {
          // Create new
          const newId = `funnel_${Date.now()}`;
          const newFunnel = { ...editingFunnel, id: newId } as Funnel;
          setFunnels(prev => [...prev, newFunnel]);
          setActiveFunnelId(newId);
      }
      setShowFunnelModal(false);
      setEditingFunnel(null);
  };

  const updateStage = (index: number, field: keyof FunnelStage, value: string) => {
      if (!editingFunnel || !editingFunnel.stages) return;
      const newStages = [...editingFunnel.stages];
      newStages[index] = { ...newStages[index], [field]: value };
      setEditingFunnel({ ...editingFunnel, stages: newStages });
  };

  const addStage = () => {
      if (!editingFunnel || !editingFunnel.stages) return;
      const newStage: FunnelStage = {
          id: `stage_${Date.now()}`,
          name: 'Nova Etapa',
          color: 'border-slate-500/50'
      };
      setEditingFunnel({ ...editingFunnel, stages: [...editingFunnel.stages, newStage] });
  };

  const removeStage = (index: number) => {
      if (!editingFunnel || !editingFunnel.stages) return;
      if (editingFunnel.stages.length <= 1) return;
      const newStages = editingFunnel.stages.filter((_, i) => i !== index);
      setEditingFunnel({ ...editingFunnel, stages: newStages });
  };

  const toggleMapMode = () => {
      if (viewMode === 'map') {
          setViewMode('kanban');
      } else {
          setViewMode('map');
      }
  };

  // --- CLIENT MANAGEMENT ---

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeCRM(activeLeads);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  const openNewClientModal = () => {
      setEditingLeadId(null);
      setClientFormData({
          name: '', company: '', cpfCnpj: '', instagram: '', phone: '', 
          zipCode: '', address: '', number: '', state: '', location: '',
          value: 0, status: activeFunnel.stages[0].id, probability: 10, nextAction: 'Iniciar contato'
      });
      setShowClientForm(true);
  };

  const openEditClientModal = (lead: Lead) => {
      setEditingLeadId(lead.id);
      setClientFormData({ ...lead });
      setShowClientForm(true);
  };

  // Geocoding Service (Nominatim OpenStreetMap)
  const getCoordinates = async (address: string, city: string, state: string, zip: string) => {
    try {
        const query = `${address}, ${city}, ${state}, Brazil`;
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        return null;
    } catch (error) {
        console.error("Geocoding failed", error);
        return null;
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!clientFormData.name) return;

      setIsGeocoding(true);
      
      // Attempt Geocode if address data is present
      let coords = { lat: clientFormData.lat, lng: clientFormData.lng };
      if ((clientFormData.address || clientFormData.location) && (!clientFormData.lat || !clientFormData.lng)) {
           const result = await getCoordinates(
               clientFormData.address || '', 
               clientFormData.location || '', 
               clientFormData.state || '',
               clientFormData.zipCode || ''
           );
           if (result) coords = result;
      }

      const leadDataToSave = {
          ...clientFormData,
          ...coords,
          value: Number(clientFormData.value) || 0,
          probability: Number(clientFormData.probability) || 0
      };

      if (editingLeadId) {
          // UPDATE EXISTING LEAD
          setLeads(prevLeads => prevLeads.map(lead => {
              if (lead.id === editingLeadId) {
                  return { ...lead, ...leadDataToSave } as Lead;
              }
              return lead;
          }));
      } else {
          // CREATE NEW LEAD
          const newClient: Lead = {
              id: Date.now().toString(),
              funnelId: activeFunnelId,
              name: clientFormData.name || 'Cliente Sem Nome',
              company: clientFormData.company || 'N/A',
              status: clientFormData.status || activeFunnel.stages[0].id,
              value: Number(clientFormData.value) || 0,
              probability: Number(clientFormData.probability) || 0,
              lastContact: new Date().toISOString().split('T')[0],
              nextAction: clientFormData.nextAction || 'Definir próximos passos',
              cpfCnpj: clientFormData.cpfCnpj,
              instagram: clientFormData.instagram,
              phone: clientFormData.phone,
              state: clientFormData.state,
              location: clientFormData.location,
              zipCode: clientFormData.zipCode,
              address: clientFormData.address,
              number: clientFormData.number,
              lat: coords.lat,
              lng: coords.lng
          };
          setLeads([...leads, newClient]);
      }

      setIsGeocoding(false);
      setShowClientForm(false);
      setEditingLeadId(null);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedLeadId(id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
      e.preventDefault();
      if (!draggedLeadId) return;

      setLeads(prevLeads => prevLeads.map(lead => {
          if (lead.id === draggedLeadId) {
              return { ...lead, status: newStatus };
          }
          return lead;
      }));
      setDraggedLeadId(null);
  };

  const getStatusLabel = (statusId: string) => {
      const stage = activeFunnel.stages.find(s => s.id === statusId);
      return stage ? stage.name : statusId;
  };
  
  const getStatusColor = (statusId: string) => {
      const stage = activeFunnel.stages.find(s => s.id === statusId);
      if (!stage) return 'bg-slate-700 text-slate-300 border border-slate-600';
      
      const borderColor = stage.color; // e.g. border-blue-500/50
      const bgColor = stage.color.replace('border-', 'bg-').replace('/50', '/10');
      const textColor = stage.color.replace('border-', 'text-').replace('/50', '-400').replace('-500', ''); 
      
      return `${bgColor} ${textColor} border ${borderColor}`;
  };

  const totalPipeline = activeLeads.reduce((acc, lead) => acc + lead.value, 0);
  const weightedPipeline = activeLeads.reduce((acc, lead) => acc + (lead.value * (lead.probability / 100)), 0);

  // Stats for Map Report
  const leadsByState = leads.reduce((acc, lead) => {
      if (lead.state) {
          const upperState = lead.state.toUpperCase().trim();
          acc[upperState] = (acc[upperState] || 0) + 1;
      }
      return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 md:p-8 h-full flex flex-col relative overflow-hidden" onClick={() => setShowFunnelDropdown(false)}>
      
      {/* HEADER WITH FUNNEL SELECTOR AND LINEAR ACTIONS */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 z-20">
        
        {/* 1. TITLE & FUNNEL SELECTOR */}
        <div className="flex flex-col gap-1 min-w-fit shrink-0">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                CRM
                <span className="text-slate-600">/</span>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={() => setShowFunnelDropdown(!showFunnelDropdown)}
                        className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        {activeFunnel.name}
                        <ChevronDown size={20} className={`transition-transform ${showFunnelDropdown ? 'rotate-180' : ''}`}/>
                    </button>
                    
                    {/* Funnel Dropdown */}
                    {showFunnelDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
                            <div className="p-2 border-b border-slate-700">
                                <p className="text-xs font-bold text-slate-500 uppercase px-2 py-1">Meus Funis</p>
                                {funnels.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => { setActiveFunnelId(f.id); setShowFunnelDropdown(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between items-center ${activeFunnelId === f.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                    >
                                        {f.name}
                                        {activeFunnelId === f.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </button>
                                ))}
                            </div>
                            <div className="p-2 space-y-1">
                                <button onClick={handleCreateFunnel} className="w-full text-left px-3 py-2 rounded-lg text-sm text-emerald-400 hover:bg-slate-700 flex items-center gap-2">
                                    <Plus size={14}/> Criar Novo Funil
                                </button>
                                <button onClick={handleEditFunnel} className="w-full text-left px-3 py-2 rounded-lg text-sm text-blue-400 hover:bg-slate-700 flex items-center gap-2">
                                    <Edit3 size={14}/> Editar Atual
                                </button>
                                <button onClick={handleDeleteFunnel} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2">
                                    <Trash2 size={14}/> Excluir Atual
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </h1>
            <p className="text-slate-400 text-sm">Gerencie seu pipeline de vendas</p>
        </div>

        {/* 2. BUTTONS TOOLBAR (COMPACT & LINEAR) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            
            {/* View Toggles - ULTRA COMPACT (KEPT SMALL) - HIDE WHEN MAP IS ACTIVE */}
            {viewMode !== 'map' && (
                <div className="bg-slate-800 p-0.5 rounded-md border border-slate-700 flex flex-shrink-0 animate-fade-in">
                    <button 
                        onClick={() => setViewMode('kanban')}
                        className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-white'}`}
                        title="Visão de Funil"
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-white'}`}
                        title="Visão de Lista"
                    >
                        <ListIcon size={16} />
                    </button>
                </div>
            )}

            {/* AUDITORIA (INCREASED SIZE) */}
            <button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-50 whitespace-nowrap flex-shrink-0 shadow-lg shadow-indigo-900/20"
            >
                <Brain size={16} /> {analyzing ? 'Analisando...' : 'Auditoria IA'}
            </button>

             {/* NOVO CLIENTE (INCREASED SIZE) */}
            <button 
                onClick={openNewClientModal}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg text-white font-medium text-sm transition-all shadow-lg shadow-emerald-900/20 whitespace-nowrap flex-shrink-0"
            >
                <Plus size={16} /> Novo Cliente
            </button>

            {/* MAPA (INCREASED SIZE) - Changes to Back button when Map is active */}
            <button 
                onClick={toggleMapMode}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all shadow-lg whitespace-nowrap flex-shrink-0 ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-blue-900/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'}`}
            >
                 {viewMode === 'map' ? (
                    <>
                        <LayoutGrid size={16} /> Voltar ao Pipeline
                    </>
                 ) : (
                    <>
                        <MapIcon size={16} /> Mapa
                    </>
                 )}
            </button>
        </div>

      </header>

      {/* KPI Cards - HIDDEN IN MAP MODE */}
      {viewMode !== 'map' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 flex-shrink-0 animate-fade-in">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                    <span className="text-slate-400 text-xs font-medium uppercase">Pipeline Total</span>
                    <p className="text-xl font-bold text-white">${totalPipeline.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><DollarSign size={20} /></div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                    <span className="text-slate-400 text-xs font-medium uppercase">Ponderado</span>
                    <p className="text-xl font-bold text-white">${weightedPipeline.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><TrendingUp size={20} /></div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                    <span className="text-slate-400 text-xs font-medium uppercase">Leads Ativos</span>
                    <p className="text-xl font-bold text-white">{activeLeads.length}</p>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Users size={20} /></div>
            </div>
        </div>
      )}

      {aiAnalysis && (
        <div className="mb-6 bg-indigo-900/20 border border-indigo-500/50 p-4 rounded-xl animate-fade-in flex-shrink-0">
            <h3 className="text-indigo-400 font-bold mb-1 flex items-center gap-2"><Brain size={16}/> Insight Estratégico</h3>
            <p className="text-slate-200 text-sm">{aiAnalysis}</p>
        </div>
      )}

       {/* SCROLLABLE CONTENT CONTAINER */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
          
          {/* --- KANBAN FUNNEL VIEW --- */}
          {viewMode === 'kanban' && (
              <div className="overflow-x-auto pb-4 mb-8">
                  <div className="flex gap-4 min-w-[1400px] h-[500px]">
                      {activeFunnel.stages.map(stage => {
                          const colLeads = activeLeads.filter(l => l.status === stage.id);
                          const colValue = colLeads.reduce((acc, l) => acc + l.value, 0);

                          return (
                              <div 
                                key={stage.id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, stage.id)}
                                className={`flex-1 min-w-[240px] bg-slate-800/50 rounded-xl border-t-4 ${stage.color} border-x border-b border-slate-700 flex flex-col h-full`}
                              >
                                  {/* Column Header */}
                                  <div className="p-3 border-b border-slate-700 bg-slate-800 rounded-t-lg group relative">
                                      <div className="flex justify-between items-center mb-1">
                                          <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide truncate" title={stage.name}>{stage.name}</h3>
                                          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{colLeads.length}</span>
                                      </div>
                                      <p className="text-xs text-slate-500 font-mono">R$ {colValue.toLocaleString()}</p>
                                  </div>

                                  {/* Drop Zone / List */}
                                  <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                                      {colLeads.map(lead => (
                                          <div
                                            key={lead.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, lead.id)}
                                            onClick={() => openEditClientModal(lead)}
                                            className={`
                                                bg-slate-800 p-4 rounded-lg border border-slate-600 shadow-sm cursor-pointer 
                                                hover:border-blue-400 hover:shadow-lg hover:shadow-blue-900/10 transition-all group relative
                                                ${draggedLeadId === lead.id ? 'opacity-50 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
                                            `}
                                          >
                                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Edit3 size={12} className="text-slate-500 hover:text-blue-400" />
                                              </div>

                                              <div className="flex justify-between items-start mb-2 pr-4">
                                                  <h4 className="font-bold text-white text-sm">{lead.name}</h4>
                                              </div>
                                              
                                              <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                                                  <Building2 size={12}/> {lead.company}
                                              </div>

                                              <div className="flex justify-between items-end">
                                                  <div>
                                                      <p className="text-[10px] text-slate-500 uppercase font-bold">Valor</p>
                                                      <p className="text-emerald-400 font-mono text-sm font-medium">R$ {lead.value.toLocaleString()}</p>
                                                  </div>
                                                  {lead.probability > 0 && (
                                                      <div className="text-right">
                                                          <p className="text-[10px] text-slate-500 uppercase font-bold">Prob.</p>
                                                          <p className={`text-sm font-medium ${lead.probability > 70 ? 'text-green-400' : lead.probability > 30 ? 'text-amber-400' : 'text-red-400'}`}>
                                                              {lead.probability}%
                                                          </p>
                                                      </div>
                                                  )}
                                              </div>
                                              
                                              {/* Action / Next Step */}
                                              <div className="mt-3 pt-2 border-t border-slate-700/50">
                                                  <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                                                      <TrendingUp size={10} /> {lead.nextAction}
                                                  </p>
                                              </div>
                                          </div>
                                      ))}
                                      {colLeads.length === 0 && (
                                          <div className="h-24 border-2 border-dashed border-slate-700/50 rounded-lg flex items-center justify-center text-slate-600 text-xs">
                                              Arraste para cá
                                          </div>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* --- LIST VIEW --- */}
          {viewMode === 'list' && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                                <th className="p-4">Lead / Empresa</th>
                                <th className="p-4">Contato</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4">Probabilidade</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {activeLeads.map((lead) => (
                                <tr key={lead.id} onClick={() => openEditClientModal(lead)} className="hover:bg-slate-700/30 transition-colors group cursor-pointer">
                                    <td className="p-4">
                                        <p className="font-bold text-white flex items-center gap-2">{lead.name}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Building2 size={10} /> {lead.company}
                                        </p>
                                        {lead.location && <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={8} /> {lead.location} - {lead.state}</p>}
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            {lead.phone && <p className="text-xs text-slate-300 flex items-center gap-1"><Phone size={10} /> {lead.phone}</p>}
                                            {lead.instagram && <p className="text-xs text-slate-300 flex items-center gap-1"><Instagram size={10} /> {lead.instagram}</p>}
                                            {lead.cpfCnpj && <p className="text-[10px] text-slate-500">Doc: {lead.cpfCnpj}</p>}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center justify-center border whitespace-nowrap ${getStatusColor(lead.status).replace('border ', '')}`}>
                                            {getStatusLabel(lead.status)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300 font-mono">${lead.value.toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${lead.probability}%` }}></div>
                                            </div>
                                            <span className="text-xs text-slate-400">{lead.probability}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-slate-500 hover:text-white p-2">
                                            <Edit3 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {/* --- MAP SECTION (Dedicated View) --- */}
          {viewMode === 'map' && (
              <section className="animate-fade-in space-y-6">
                  <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                      <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                  <MapIcon className="text-blue-500" /> Clientes pelo Mapa
                              </h2>
                              <p className="text-sm text-slate-400">Distribuição geográfica dos seus leads e clientes.</p>
                          </div>
                      </div>
                      
                      <div className="h-[600px] w-full relative bg-slate-900">
                          <div ref={mapContainerRef} className="h-full w-full z-10" />
                          
                          {leads.filter(l => l.lat).length === 0 && (
                              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                                  <div className="text-center p-6 max-w-md">
                                      <Globe2 size={48} className="mx-auto text-slate-600 mb-4" />
                                      <h3 className="text-lg font-bold text-white">Mapa Vazio</h3>
                                      <p className="text-slate-400 text-sm mt-2">Cadastre clientes com Endereço e CEP para visualizá-los aqui.</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* State Report Section */}
                   <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <MapPin size={14} /> Detalhamento por Região
                      </h3>
                      
                      {Object.keys(leadsByState).length === 0 ? (
                          <div className="text-slate-500 text-sm italic py-2">
                              Nenhum dado de localização disponível.
                          </div>
                      ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {Object.entries(leadsByState)
                                .sort((a, b) => (b[1] as number) - (a[1] as number))
                                .map(([state, count]) => (
                                  <div key={state} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col items-center justify-center hover:border-blue-500/50 transition-colors group">
                                      <span className="font-bold text-2xl text-white mb-1 group-hover:text-blue-400 transition-colors">{state}</span>
                                      <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                          {count} {count === 1 ? 'Cliente' : 'Clientes'}
                                      </span>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </section>
          )}

          {/* Footer Space */}
            <div className="mt-16 pt-8 border-t border-slate-800/50 flex flex-col items-center justify-center text-slate-600 gap-2 pb-8">
                <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                <p className="text-xs uppercase tracking-widest font-bold opacity-50">Nexus 360</p>
                <ChevronDown className="animate-bounce opacity-30 mt-2" size={16} />
            </div>

      </div>

      {/* MODAL: CLIENT FORM (CREATE / EDIT) */}
      {showClientForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                  <header className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          {editingLeadId ? <Edit3 className="text-blue-500" /> : <Plus className="text-emerald-500" />}
                          {editingLeadId ? 'Editar Cliente' : 'Cadastro de Novo Cliente'}
                      </h2>
                      <button onClick={() => setShowClientForm(false)} className="text-slate-400 hover:text-white">
                          <X size={24} />
                      </button>
                  </header>
                  
                  <form onSubmit={handleSaveClient} className="p-6 space-y-6">
                      {/* Dados Principais */}
                      <div className="space-y-4">
                          <h3 className="text-sm uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
                              <User size={14} /> Informações Básicas
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs text-slate-400 mb-1">Nome Completo *</label>
                                  <input 
                                    required
                                    type="text" 
                                    value={clientFormData.name} 
                                    onChange={e => setClientFormData({...clientFormData, name: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                    placeholder="Ex: João Silva"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs text-slate-400 mb-1">Empresa</label>
                                  <input 
                                    type="text" 
                                    value={clientFormData.company} 
                                    onChange={e => setClientFormData({...clientFormData, company: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                    placeholder="Ex: Minha Empresa Ltda"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs text-slate-400 mb-1">CPF ou CNPJ</label>
                                  <input 
                                    type="text" 
                                    value={clientFormData.cpfCnpj} 
                                    onChange={e => setClientFormData({...clientFormData, cpfCnpj: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                    placeholder="000.000.000-00"
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Contato e Localização */}
                      <div className="space-y-4 pt-4 border-t border-slate-800">
                          <h3 className="text-sm uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
                              <MapPin size={14} /> Contato & Localização
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                  <label className="block text-xs text-slate-400 mb-1">Telefone</label>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 text-slate-500" size={16} />
                                    <input 
                                        type="text" 
                                        value={clientFormData.phone} 
                                        onChange={e => setClientFormData({...clientFormData, phone: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="(00) 00000-0000"
                                    />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs text-slate-400 mb-1">Instagram da Empresa</label>
                                  <div className="relative">
                                    <Instagram className="absolute left-3 top-3.5 text-slate-500" size={16} />
                                    <input 
                                        type="text" 
                                        value={clientFormData.instagram} 
                                        onChange={e => setClientFormData({...clientFormData, instagram: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="@usuario"
                                    />
                                  </div>
                              </div>
                              
                              {/* FULL ADDRESS FIELDS */}
                              <div className="md:col-span-2 grid grid-cols-4 gap-4">
                                  <div className="col-span-1">
                                      <label className="block text-xs text-slate-400 mb-1">CEP</label>
                                      <input 
                                        type="text" 
                                        value={clientFormData.zipCode} 
                                        onChange={e => setClientFormData({...clientFormData, zipCode: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="00000-000"
                                      />
                                  </div>
                                  <div className="col-span-3">
                                      <label className="block text-xs text-slate-400 mb-1">Endereço (Rua/Av)</label>
                                      <input 
                                        type="text" 
                                        value={clientFormData.address} 
                                        onChange={e => setClientFormData({...clientFormData, address: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="Rua Exemplo"
                                      />
                                  </div>
                              </div>

                              <div className="md:col-span-2 grid grid-cols-4 gap-4">
                                  <div className="col-span-1">
                                      <label className="block text-xs text-slate-400 mb-1">Número</label>
                                      <input 
                                        type="text" 
                                        value={clientFormData.number} 
                                        onChange={e => setClientFormData({...clientFormData, number: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="123"
                                      />
                                  </div>
                                  <div className="col-span-2">
                                      <label className="block text-xs text-slate-400 mb-1">Cidade</label>
                                      <input 
                                        type="text" 
                                        value={clientFormData.location} 
                                        onChange={e => setClientFormData({...clientFormData, location: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="Cidade"
                                      />
                                  </div>
                                   <div className="col-span-1">
                                      <label className="block text-xs text-slate-400 mb-1">Estado (UF)</label>
                                      <input 
                                        type="text" 
                                        value={clientFormData.state} 
                                        onChange={e => setClientFormData({...clientFormData, state: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="SP"
                                        maxLength={2}
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>

                       {/* Dados do Pipeline (Opcionais para cadastro rápido) */}
                       <div className="space-y-4 pt-4 border-t border-slate-800">
                          <h3 className="text-sm uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
                              <TrendingUp size={14} /> Dados do Pipeline ({activeFunnel.name})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Valor Potencial ($)</label>
                                    <input 
                                        type="number" 
                                        value={clientFormData.value} 
                                        onChange={e => setClientFormData({...clientFormData, value: Number(e.target.value)})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Fase do Pipeline</label>
                                    <select 
                                        value={clientFormData.status} 
                                        onChange={e => setClientFormData({...clientFormData, status: e.target.value as any})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                    >
                                        {activeFunnel.stages.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Probabilidade (%)</label>
                                    <input 
                                        type="number" 
                                        value={clientFormData.probability} 
                                        onChange={e => setClientFormData({...clientFormData, probability: Number(e.target.value)})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                          </div>
                          <div>
                                <label className="block text-xs text-slate-400 mb-1">Próxima Ação</label>
                                <input 
                                    type="text" 
                                    value={clientFormData.nextAction} 
                                    onChange={e => setClientFormData({...clientFormData, nextAction: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                    placeholder="Ex: Ligar amanhã"
                                />
                          </div>
                       </div>

                      <div className="pt-6 flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => setShowClientForm(false)}
                            className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            disabled={isGeocoding}
                            className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                          >
                            {isGeocoding ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                            {isGeocoding ? 'Localizando Endereço...' : (editingLeadId ? 'Atualizar Cliente' : 'Salvar Cliente')}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL: FUNNEL MANAGER (CREATE/EDIT) */}
      {showFunnelModal && editingFunnel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                   <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Settings className="text-blue-500" /> {editingFunnel.id ? 'Editar Funil e Fases' : 'Novo Funil'}
                      </h2>
                      <button onClick={() => setShowFunnelModal(false)} className="text-slate-400 hover:text-white">
                          <X size={24} />
                      </button>
                  </header>

                  <form onSubmit={handleSaveFunnel} className="p-6 space-y-6">
                      <div>
                          <label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Nome do Funil</label>
                          <input 
                             required
                             type="text"
                             value={editingFunnel.name}
                             onChange={(e) => setEditingFunnel({...editingFunnel, name: e.target.value})}
                             className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                             placeholder="Ex: Vendas B2B"
                          />
                      </div>

                      <div className="space-y-3">
                          <div className="flex justify-between items-center">
                              <label className="block text-xs text-slate-400 uppercase font-bold">Fases do Funil (Edite os nomes aqui)</label>
                              <button type="button" onClick={addStage} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                                  <Plus size={12}/> Adicionar Fase
                              </button>
                          </div>
                          
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {editingFunnel.stages?.map((stage, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                      <div className="cursor-grab text-slate-600"><GripVertical size={16}/></div>
                                      <input 
                                         type="text"
                                         value={stage.name}
                                         onChange={(e) => updateStage(idx, 'name', e.target.value)}
                                         className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                         placeholder="Nome da Fase"
                                      />
                                      <select
                                          value={stage.color}
                                          onChange={(e) => updateStage(idx, 'color', e.target.value)}
                                          className="w-8 h-9 bg-slate-800 border border-slate-700 rounded text-transparent focus:outline-none cursor-pointer"
                                          style={{backgroundColor: stage.color.replace('border-', '').replace('/50', '').replace('500', '500')}} // Rough preview
                                      >
                                          <option value="border-slate-500/50" className="text-black">Cinza</option>
                                          <option value="border-blue-500/50" className="text-blue-500">Azul</option>
                                          <option value="border-emerald-500/50" className="text-emerald-500">Verde</option>
                                          <option value="border-purple-500/50" className="text-purple-500">Roxo</option>
                                          <option value="border-amber-500/50" className="text-amber-500">Amarelo</option>
                                          <option value="border-red-500/50" className="text-red-500">Vermelho</option>
                                          <option value="border-pink-500/50" className="text-pink-500">Rosa</option>
                                          <option value="border-cyan-500/50" className="text-cyan-500">Ciano</option>
                                      </select>
                                      <button 
                                        type="button" 
                                        onClick={() => removeStage(idx)}
                                        className="text-slate-500 hover:text-red-400 p-2"
                                        disabled={editingFunnel.stages!.length <= 1}
                                      >
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg">
                          Salvar Configuração
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};