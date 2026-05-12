import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  FileText, 
  Layout, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Stethoscope, 
  ClipboardList, 
  Users, 
  Clock,
  Save,
  Trash2,
  Copy,
  Activity,
  Edit2,
  Check,
  X,
  Lock,
  Unlock,
  ShieldCheck,
  Send,
  MinusCircle,
  Heart,
  AlertTriangle,
  Fingerprint,
  Calculator,
  Zap,
  RefreshCw,
  Info,
  ChevronDown,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

const CATEGORIES = [
  { id: 'ward', name: 'Ward Rounds', icon: Stethoscope, color: 'text-blue-400' },
  { id: 'soap', name: 'Daily Notes', icon: ClipboardList, color: 'text-emerald-400' },
  { id: 'history', name: 'Admissions', icon: FileText, color: 'text-purple-400' },
  { id: 'discharge', name: 'Discharge', icon: LogOut, color: 'text-rose-400' },
  { id: 'calc', name: 'Calculators', icon: Calculator, color: 'text-orange-400' },
];

const CALCULATORS = [
  {
    id: 'bmi',
    name: 'BMI Calculator',
    fields: [
      { id: 'weight', label: 'Weight (kg)', type: 'number' },
      { id: 'height', label: 'Height (cm)', type: 'number' },
    ],
    calculate: (vals) => {
      const h = vals.height / 100;
      if (!h || !vals.weight) return null;
      const bmi = (vals.weight / (h * h)).toFixed(1);
      let status = 'Normal';
      if (bmi < 18.5) status = 'Underweight';
      else if (bmi >= 25 && bmi < 30) status = 'Overweight';
      else if (bmi >= 30) status = 'Obese';
      return { result: bmi, unit: 'kg/m²', label: status };
    }
  },
  {
    id: 'iv-rate',
    name: 'IV Flow Rate',
    fields: [
      { id: 'vol', label: 'Volume (mL)', type: 'number' },
      { id: 'time', label: 'Time (hours)', type: 'number' },
      { id: 'factor', label: 'Drop Factor', type: 'number', defaultValue: 20 },
    ],
    calculate: (vals) => {
        if (!vals.vol || !vals.time || !vals.factor) return null;
        const rate = Math.round((vals.vol * vals.factor) / (vals.time * 60));
        return { result: rate, unit: 'gtt/min' };
    }
  }
];

export default function App() {
  const [templates, setTemplates] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ward');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [draftingDay, setDraftingDay] = useState(null); 
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingProtocol, setIsCreatingProtocol] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [securityLock, setSecurityLock] = useState(null);
  const [calcValues, setCalcValues] = useState({});
  const [toast, setToast] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
        const [protoRes, tempRes] = await Promise.all([
            axios.get(`${API_BASE}/protocols`),
            axios.get(`${API_BASE}/templates`)
        ]);
        setProtocols(protoRes.data || []);
        setTemplates(tempRes.data || []);
    } catch (err) {
        showToast('System Offline', 'error');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTemplates = templates.filter(t => 
    (t.category === selectedCategory || selectedCategory === 'all') &&
    (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredProtocols = protocols.filter(p => 
    p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const initiateSecurityCheck = (type, action) => {
    setSecurityLock({ type, action, code: Math.floor(100000 + Math.random() * 900000).toString(), input: '' });
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
    showToast('Copied to clipboard');
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = { id: editingTemplate ? editingTemplate.id : Date.now().toString(), title: formData.get('title'), category: formData.get('category'), content: formData.get('content'), lastUsed: 'Just now' };
    const action = async () => {
        try {
            await axios.post(`${API_BASE}/templates`, data);
            await fetchData();
            setEditingTemplate(null);
            setIsCreating(false);
            showToast('Template saved');
        } catch (err) { showToast('Save failed', 'error'); }
    };
    action();
  };

  const handleDeleteTemplate = (id) => {
    const action = async () => {
        try {
            await axios.delete(`${API_BASE}/templates/${id}`);
            await fetchData();
            showToast('Template removed');
        } catch (err) { showToast('Delete failed', 'error'); }
    };
    initiateSecurityCheck('delete', action);
  };

  const handleAddDayToProtocol = async (protoId) => {
    const targetProto = protocols.find(p => p.id === protoId);
    if (!targetProto) return;
    const existingDays = targetProto.days || [];
    const nextDayNum = existingDays.length + 1;
    const newDay = { id: Date.now().toString(), dayNumber: nextDayNum, note: `Plan for Day ${nextDayNum}...` };
    const updatedProto = { ...targetProto, days: [...existingDays, newDay] };
    try {
        await axios.post(`${API_BASE}/protocols`, updatedProto);
        await fetchData();
        const freshProto = (await axios.get(`${API_BASE}/protocols`)).data.find(p => p.id === protoId);
        setSelectedProtocol(freshProto);
        showToast('Day added');
    } catch (err) { showToast('Action failed', 'error'); }
  };

  const handleRemoveDayFromProtocol = (protoId, dayId) => {
    const action = async () => {
        const targetProto = protocols.find(p => p.id === protoId);
        const filteredDays = (targetProto.days || []).filter(d => d.id !== dayId);
        const reindexedDays = filteredDays.map((d, idx) => ({ ...d, dayNumber: idx + 1 }));
        const updatedProto = { ...targetProto, days: reindexedDays };
        try {
            await axios.post(`${API_BASE}/protocols`, updatedProto);
            await fetchData();
            setSelectedProtocol(updatedProto);
            showToast('Day removed');
        } catch (err) { showToast('Action failed', 'error'); }
    };
    initiateSecurityCheck('delete', action);
  };

  const handleSaveDraftOrMaster = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newNote = formData.get('note');
    if (draftingDay.isMasterEdit) {
      const action = async () => {
          const targetProto = protocols.find(p => p.id === draftingDay.protocolId);
          const updatedDays = (targetProto.days || []).map(d => d.id === draftingDay.dayId ? { ...d, note: newNote } : d);
          const updatedProto = { ...targetProto, days: updatedDays };
          try {
              await axios.post(`${API_BASE}/protocols`, updatedProto);
              await fetchData();
              setSelectedProtocol(updatedProto);
              showToast('Official guide updated');
          } catch (err) { showToast('Update failed', 'error'); }
      };
      action();
    } else {
      handleCopy(newNote, 'draft-copy');
    }
    setDraftingDay(null);
  };

  const handleCreateProtocol = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProtocol = { 
        id: Date.now().toString(), 
        diagnosis: formData.get('diagnosis'), 
        description: formData.get('description'), 
        days: [{ id: Date.now().toString() + '-1', dayNumber: 1, note: formData.get('initialDayNote') }] 
    };
    try {
        await axios.post(`${API_BASE}/protocols`, newProtocol);
        await fetchData();
        setIsCreatingProtocol(false);
        showToast('Condition added to playbook');
    } catch (err) { 
        showToast('Failed to save condition', 'error'); 
    }
  };

  const handleDeleteProtocol = (id) => {
    const action = async () => {
        try {
            await axios.delete(`${API_BASE}/protocols/${id}`);
            await fetchData();
            setSelectedProtocol(null);
            showToast('Condition removed');
        } catch (err) { showToast('Delete failed', 'error'); }
    };
    initiateSecurityCheck('delete', action);
  };

  const processedDraftNote = useMemo(() => {
    if (!draftingDay) return '';
    let text = draftingDay.note;
    if (draftingDay.variables) {
      Object.entries(draftingDay.variables).forEach(([key, val]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        text = text.replace(regex, val || `[${key}]`);
      });
    }
    return text;
  }, [draftingDay]);

  const extractVariables = (text) => {
    const matches = text.matchAll(/\{\{(.*?)\}\}/g);
    const vars = {};
    for (const match of matches) vars[match[1]] = '';
    return vars;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none antialiased">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl ${toast.type === 'error' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'}`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <header className="bg-slate-900/60 backdrop-blur-2xl border-b border-slate-800 shrink-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pr-6 border-r border-slate-800">
                    <div className="p-2 bg-medical-500 rounded-xl shadow-lg shadow-medical-500/20"><Heart className="w-5 h-5 text-white fill-current" /></div>
                    <h1 className="text-lg font-black tracking-tight hidden sm:block">DocPlaybook</h1>
                </div>
                <nav className="hidden lg:flex items-center gap-1">
                    {CATEGORIES.map((cat) => (
                        <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedProtocol(null); }} className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all relative ${selectedCategory === cat.id ? 'text-medical-400' : 'text-slate-400 hover:text-slate-200'}`}>
                            <cat.icon className="w-4 h-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">{cat.name}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-1 max-w-md relative group hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Search playbook..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-medical-500/50 text-sm transition-all shadow-inner" />
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-950/50 rounded-xl border border-slate-800">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isAdminMode ? 'text-orange-400' : 'text-slate-500'}`}>{isAdminMode ? 'Admin Mode' : 'View Mode'}</span>
                    <button onClick={() => setIsAdminMode(!isAdminMode)} className={`w-9 h-4.5 rounded-full relative transition-colors ${isAdminMode ? 'bg-orange-500/30' : 'bg-slate-700'}`}>
                        <motion.div animate={{ x: isAdminMode ? 20 : 2 }} className={`w-3 h-3 rounded-full mt-0.5 shadow-sm ${isAdminMode ? 'bg-orange-400' : 'bg-slate-500'}`} />
                    </button>
                </div>
                <button onClick={fetchData} title="Refresh Data" className="p-2.5 text-slate-500 hover:text-medical-400 transition-all active:scale-90"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
                {isAdminMode && (
                    <button onClick={() => selectedCategory === 'ward' ? setIsCreatingProtocol(true) : setIsCreating(true)} className="btn-primary text-[10px] font-black uppercase tracking-widest px-5 h-10 flex items-center gap-2 shadow-lg shadow-medical-500/10"><Plus className="w-4 h-4" />Add New</button>
                )}
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2.5 text-slate-500"><Menu className="w-5 h-5" /></button>
            </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-12 scroll-smooth bg-slate-950">
          <div className="max-w-[1400px] mx-auto relative pb-20">
            
            {selectedCategory === 'calc' ? (
                /* CALCULATORS */
                <div className="space-y-12">
                    <div><h2 className="text-3xl font-black flex items-center gap-4"><Calculator className="w-9 h-9 text-orange-400" />Clinical Calculators</h2><p className="text-slate-400 text-lg mt-2 font-medium">Quick tools for the medical team</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {CALCULATORS.map(calc => (
                            <div key={calc.id} className="glass-card p-8 border-slate-800 bg-slate-900/10 hover:border-orange-500/30 transition-all">
                                <h3 className="text-base font-black uppercase tracking-widest mb-8 flex items-center gap-3 text-slate-100"><Zap className="w-5 h-5 text-orange-400" />{calc.name}</h3>
                                <div className="space-y-6">
                                    {calc.fields.map(f => (
                                        <div key={f.id} className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{f.label}</label>
                                            <input type={f.type} placeholder={f.defaultValue} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 focus:outline-none focus:border-orange-500/50 text-white font-bold" onChange={(e) => setCalcValues({ ...calcValues, [`${calc.id}_${f.id}`]: parseFloat(e.target.value) || f.defaultValue })} />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-10 p-6 bg-orange-500/5 rounded-2xl border border-orange-500/10 flex items-center justify-between">
                                    <div><p className="text-[10px] font-black text-orange-500/70 uppercase tracking-widest mb-1">Result</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white">{calc.calculate(Object.fromEntries(Object.entries(calcValues).filter(([k]) => k.startsWith(calc.id)).map(([k, v]) => [k.replace(`${calc.id}_`, ''), v])))?.result || '--'}</span>
                                            <span className="text-xs font-bold text-slate-500">{calc.calculate(Object.fromEntries(Object.entries(calcValues).filter(([k]) => k.startsWith(calc.id)).map(([k, v]) => [k.replace(`${calc.id}_`, ''), v])))?.unit}</span>
                                        </div>
                                    </div>
                                    <div className="text-right"><p className="text-sm font-black text-orange-400 uppercase tracking-widest">{calc.calculate(Object.fromEntries(Object.entries(calcValues).filter(([k]) => k.startsWith(calc.id)).map(([k, v]) => [k.replace(`${calc.id}_`, ''), v])))?.label}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : selectedCategory === 'ward' && !selectedProtocol ? (
                /* CONDITION PLAYBOOK */
                <>
                    <div className="mb-10">
                        <h2 className="text-3xl font-black flex items-center gap-4"><ShieldCheck className="w-9 h-9 text-emerald-400" />Medical Playbook</h2>
                        <p className="text-slate-400 text-lg mt-2 font-medium">Verified treatment courses and daily care plans</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredProtocols.map((p) => (
                            <motion.div key={p.id} onClick={() => setSelectedProtocol(p)} className="glass-card p-8 group hover:border-medical-500 transition-all cursor-pointer border-t-4 border-t-emerald-500/40 bg-slate-900/10 active:scale-[0.98]">
                                <div className="flex justify-between items-start mb-6"><h3 className="text-2xl font-black leading-tight group-hover:text-medical-400 transition-colors">{p.diagnosis}</h3><span className="px-3 py-1 bg-medical-500/10 text-medical-400 rounded-full text-[10px] font-black border border-medical-500/20 uppercase tracking-widest">{(p.days || []).length} Days</span></div>
                                <p className="text-slate-400 text-base mb-8 line-clamp-2 leading-relaxed font-medium">{p.description}</p>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-6 border-t border-slate-800 uppercase font-black tracking-widest"><span className="flex items-center gap-2"><Stethoscope className="w-4 h-4" />View Daily Plan</span><div className="p-2.5 rounded-xl bg-slate-800 group-hover:bg-medical-500 transition-all"><ChevronRight className="w-4 h-4 text-slate-100" /></div></div>
                            </motion.div>
                        ))}
                    </div>
                </>
            ) : selectedProtocol ? (
                /* DAILY COURSE */
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between border-b border-slate-800 pb-12 gap-10">
                        <div className="space-y-6">
                            <button onClick={() => setSelectedProtocol(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-100 transition-colors group">
                                <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Back to Directory</span>
                            </button>
                            <div>
                                <div className="flex items-center gap-2 text-emerald-400 mb-3"><ShieldCheck className="w-5 h-5" /><span className="text-[11px] font-black uppercase tracking-[0.2em]">Verified Clinical Guide</span></div>
                                <div className="flex items-center gap-4">
                                    <h2 className="text-5xl font-black text-slate-50 tracking-tight leading-none">{selectedProtocol.diagnosis}</h2>
                                    {isAdminMode && <button onClick={() => handleDeleteProtocol(selectedProtocol.id)} title="Remove Condition" className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all active:scale-90"><Trash2 className="w-5 h-5" /></button>}
                                </div>
                                <p className="text-slate-400 text-xl max-w-4xl font-medium leading-relaxed mt-4">{selectedProtocol.description}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 shrink-0 pb-2">
                            <button onClick={() => handleCopy((selectedProtocol.days || []).map(d => `Day ${d.dayNumber}:\n${d.note}`).join('\n\n'), 'all')} className={`btn-secondary flex items-center gap-3 border-slate-700 transition-all text-xs font-black uppercase tracking-widest px-8 py-4 h-14 ${copyStatus === 'all' ? 'text-emerald-400 border-emerald-500/50' : ''}`}>{copyStatus === 'all' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}Copy Full Course</button>
                            {isAdminMode && <button onClick={() => handleAddDayToProtocol(selectedProtocol.id)} className="btn-primary flex items-center gap-3 shadow-2xl shadow-medical-500/20 text-xs font-black uppercase tracking-widest px-8 py-4 h-14 active:scale-95"><Plus className="w-5 h-5" />Add Next Day</button>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-12 relative pb-20">
                        <div className="absolute left-[47px] top-10 bottom-10 w-px bg-slate-800/50 hidden md:block" />
                        {(selectedProtocol.days || []).map((day) => (
                            <div key={day.id} className="relative md:pl-28 group">
                                <div className="absolute left-[39px] top-12 w-4 h-4 rounded-full bg-slate-950 border-4 border-slate-800 z-10 hidden md:block" />
                                <div className="glass-card p-10 border-slate-800/60 hover:border-medical-500/20 transition-all duration-300">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-8">
                                        <div className="flex items-center gap-5"><div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl font-black text-medical-400">{day.dayNumber}</div><h4 className="font-black text-3xl text-slate-100 tracking-tight">Day {day.dayNumber} Management</h4></div>
                                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                            <button onClick={() => handleCopy(day.note, day.id)} title="Copy Day Plan" className={`flex-1 sm:flex-none h-14 px-6 sm:px-8 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest border active:scale-95 whitespace-nowrap ${copyStatus === day.id ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>{copyStatus === day.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}Copy Note</button>
                                            <button onClick={() => setDraftingDay({ protocolId: selectedProtocol.id, dayId: day.id, note: day.note, dayNumber: day.dayNumber, isMasterEdit: isAdminMode, variables: extractVariables(day.note) })} className={`flex-1 sm:flex-none h-14 px-6 sm:px-8 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest border active:scale-95 whitespace-nowrap ${isAdminMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-medical-500/10 text-medical-400 border-medical-500/30'}`}>{isAdminMode ? <Edit2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}{isAdminMode ? 'Edit Guide' : 'Personalize'}</button>
                                            {isAdminMode && <button onClick={() => handleRemoveDayFromProtocol(selectedProtocol.id, day.id)} className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl hover:bg-rose-500/20 transition-all flex items-center justify-center border border-rose-500/20 active:scale-90 shrink-0"><MinusCircle className="w-5 h-5" /></button>}
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/80 rounded-3xl p-8 border border-slate-800/40 text-slate-200 text-xl leading-relaxed whitespace-pre-wrap font-medium">{day.note}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ) : (
                /* QUICK TEMPLATES */
                <>
                    <div className="mb-10 flex justify-between items-center"><h2 className="text-3xl font-black">Note Templates</h2><p className="text-slate-500 text-sm font-black uppercase tracking-widest">{filteredTemplates.length} Ready</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        <AnimatePresence mode='popLayout'>
                            {filteredTemplates.map((template) => (
                                <motion.div key={template.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 group hover:border-medical-400/50 transition-all cursor-pointer bg-slate-900/10 active:scale-[0.98]" onClick={() => setEditingTemplate(template)}>
                                    <div className="flex justify-between items-start mb-6"><div className="p-3.5 rounded-2xl bg-slate-800 group-hover:bg-medical-500/10 transition-colors"><FileText className="w-7 h-7 text-medical-400" /></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); handleCopy(template.content, template.id); }} className="p-2.5 hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-90">{copyStatus === template.id ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}</button><button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }} className="p-2.5 hover:bg-rose-500/10 rounded-xl text-rose-500 transition-all active:scale-90"><Trash2 className="w-5 h-5" /></button></div></div>
                                    <h3 className="font-black text-xl mb-3 group-hover:text-medical-400 transition-colors leading-tight">{template.title}</h3>
                                    <p className="text-slate-400 text-base line-clamp-4 leading-relaxed font-medium">{template.content}</p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </>
            )}
          </div>
        </div>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {securityLock && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`relative w-full max-w-md glass-card p-12 border-2 ${securityLock.type === 'delete' ? 'border-rose-500/30' : 'border-orange-500/30'}`}>
              <div className="text-center space-y-10">
                <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${securityLock.type === 'delete' ? 'bg-rose-500/10 text-rose-500' : 'bg-orange-500/10 text-orange-500'}`}>{securityLock.type === 'delete' ? <AlertTriangle className="w-12 h-12" /> : <Fingerprint className="w-12 h-12" />}</div>
                <div><h2 className="text-3xl font-black uppercase tracking-tight">Security Check</h2><p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-2">Required to modify master data</p></div>
                <div className="p-10 bg-slate-950 rounded-[32px] border border-slate-800/50"><div className="text-6xl font-black tracking-[0.3em] text-white tabular-nums">{securityLock.code}</div></div>
                <div className="space-y-6"><input autoFocus type="tel" maxLength={6} placeholder="••••••" value={securityLock.input} onChange={(e) => setSecurityLock({ ...securityLock, input: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-6 text-center text-5xl font-black tracking-[0.5em] focus:border-medical-500/50 text-white" /><div className="flex gap-4"><button disabled={securityLock.input !== securityLock.code} onClick={() => { securityLock.action(); setSecurityLock(null); }} className={`flex-1 py-6 font-black uppercase tracking-widest text-xs rounded-3xl transition-all ${securityLock.input === securityLock.code ? 'bg-medical-600 text-white shadow-2xl shadow-medical-500/40' : 'bg-slate-800 text-slate-600'}`}>Confirm</button><button onClick={() => setSecurityLock(null)} className="px-10 bg-slate-900 text-slate-500 rounded-3xl font-black uppercase tracking-widest text-xs h-20">Cancel</button></div></div>
              </div>
            </motion.div>
          </div>
        )}

        {isCreatingProtocol && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl glass-card bg-slate-900 p-12 border-slate-700">
                <h2 className="text-3xl font-black mb-10 flex items-center gap-4 uppercase tracking-tight"><Plus className="w-8 h-8 text-medical-400" />New Playbook Entry</h2>
                <form onSubmit={handleCreateProtocol} className="space-y-8">
                    <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Medical Condition</label><input name="diagnosis" required className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-5 px-8 focus:border-medical-500/50 text-white font-bold text-xl" placeholder="e.g. Dengue Fever" /></div>
                    <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Clinical Summary</label><input name="description" required className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-5 px-8 focus:border-medical-500/50 text-white font-bold" placeholder="Brief info about this care plan..." /></div>
                    <div className="space-y-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Initial Day 1 Care Plan</label><textarea name="initialDayNote" required rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-5 px-8 focus:border-medical-500/50 text-white font-bold" placeholder="Orders for the first day... Use {{variables}} for smart fields." /></div>
                    <div className="flex gap-4 pt-6"><button type="submit" className="flex-1 btn-primary py-6 font-black uppercase tracking-widest text-xs h-18">Save Condition</button><button type="button" onClick={() => setIsCreatingProtocol(false)} className="px-12 btn-secondary py-6 font-black uppercase tracking-widest text-xs h-18">Cancel</button></div>
                </form>
            </motion.div>
          </div>
        )}

        {draftingDay && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className={`relative w-full max-w-[1300px] glass-card p-12 border-2 overflow-y-auto max-h-[95vh] ${draftingDay.isMasterEdit ? 'bg-slate-900 border-orange-500/40' : 'bg-slate-900 border-medical-500/40'}`}>
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-8">
                    <div className={`p-5 rounded-[32px] ${draftingDay.isMasterEdit ? 'bg-orange-500/10 text-orange-400' : 'bg-medical-500/10 text-medical-400'}`}>{draftingDay.isMasterEdit ? <Edit2 className="w-10 h-10" /> : <Send className="w-10 h-10" />}</div>
                    <div><h2 className="text-4xl font-black uppercase tracking-tight">{draftingDay.isMasterEdit ? 'Edit Master Guide' : 'Create Patient Note'}</h2><p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-2">{draftingDay.isMasterEdit ? 'Updating the official ward course' : 'Fill in the blanks to generate your daily note'}</p></div>
                </div>
                <button onClick={() => setDraftingDay(null)} className="p-4 bg-slate-800 rounded-3xl text-slate-500 hover:text-white transition-all"><X className="w-8 h-8" /></button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {!draftingDay.isMasterEdit && Object.keys(draftingDay.variables || {}).length > 0 && (
                    <div className="space-y-12 bg-slate-950/50 p-12 rounded-[48px] border border-slate-800 shadow-inner">
                        <div className="flex items-center gap-4 mb-6"><Zap className="w-6 h-6 text-medical-400" /><h3 className="text-base font-black uppercase tracking-widest text-slate-100">Patient Details</h3></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {Object.keys(draftingDay.variables).map(key => (
                                <div key={key} className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{key.replace(/_/g, ' ')}</label>
                                    <input type="text" placeholder={`Enter ${key}...`} value={draftingDay.variables[key]} onChange={(e) => setDraftingDay({ ...draftingDay, variables: { ...draftingDay.variables, [key]: e.target.value } })} className="w-full bg-slate-900 border border-slate-800 rounded-3xl py-5 px-8 focus:border-medical-500/50 text-white font-bold text-lg shadow-sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className={`space-y-8 ${draftingDay.isMasterEdit ? 'lg:col-span-2' : ''}`}>
                    <form onSubmit={handleSaveDraftOrMaster} className="space-y-10">
                        <textarea name="note" value={draftingDay.isMasterEdit ? draftingDay.note : processedDraftNote} onChange={(e) => { if (draftingDay.isMasterEdit) setDraftingDay({ ...draftingDay, note: e.target.value }); }} required rows={12} readOnly={!draftingDay.isMasterEdit && Object.keys(draftingDay.variables || {}).length > 0} className={`w-full bg-slate-950 border rounded-[40px] py-10 px-10 focus:outline-none text-slate-200 text-2xl leading-relaxed font-medium transition-all shadow-inner ${draftingDay.isMasterEdit ? 'border-orange-500/40 focus:border-orange-400' : 'border-slate-800 focus:border-medical-400'}`} />
                        <div className="flex flex-wrap gap-6"><button type="submit" className={`flex-1 py-7 font-black uppercase tracking-widest text-xs rounded-[32px] flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 whitespace-nowrap min-w-[200px] ${draftingDay.isMasterEdit ? 'bg-orange-600 text-white shadow-orange-500/20' : 'bg-medical-600 text-white shadow-medical-500/30'}`}>{draftingDay.isMasterEdit ? <Save className="w-6 h-6" /> : <Copy className="w-6 h-6" />}{draftingDay.isMasterEdit ? 'Save to Playbook' : 'Copy Finished Note'}</button><button type="button" onClick={() => setDraftingDay(null)} className="px-12 bg-slate-800 text-slate-400 rounded-[32px] font-black uppercase tracking-widest text-xs py-7 active:scale-95 flex-1 min-w-[150px]">Discard</button></div>
                    </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
