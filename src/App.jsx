import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { 
<<<<<<< HEAD
<<<<<<< HEAD
  ShieldCheck, Activity, Search, Layout, Settings, LogOut, 
  ChevronRight, ClipboardList, Users, Clock, Save, Trash2, 
  Check, X, AlertTriangle, Fingerprint, Zap, RefreshCw, 
  Menu, TrendingUp, ArrowRight, ArrowLeft, Box, Wrench, 
  Plus, MessageSquare, Star, FileText, Smartphone, HardDrive,
  AlertCircle
=======
=======
>>>>>>> parent of d2ed359f (real time)
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
  Menu,
  TrendingUp,
  Award,
  ArrowRight,
  ArrowLeft
<<<<<<< HEAD
>>>>>>> parent of d2ed359f (real time)
=======
>>>>>>> parent of d2ed359f (real time)
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

<<<<<<< HEAD
<<<<<<< HEAD
// Roles for Demo Purposed
const ROLES = [
    { id: 'Requester', icon: Users, color: 'text-sky-400' },
    { id: 'Provider', icon: ShieldCheck, color: 'text-emerald-400' },
    { id: 'Staff', icon: Wrench, color: 'text-orange-400' }
=======
const CATEGORIES = [
  { id: 'ward', name: 'Pathways', icon: ClipboardList, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { id: 'calc', name: 'Calculators', icon: Calculator, color: 'text-orange-400', bg: 'bg-orange-500/10' },
>>>>>>> parent of d2ed359f (real time)
=======
const CATEGORIES = [
  { id: 'ward', name: 'Pathways', icon: ClipboardList, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { id: 'calc', name: 'Calculators', icon: Calculator, color: 'text-orange-400', bg: 'bg-orange-500/10' },
>>>>>>> parent of d2ed359f (real time)
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
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 overflow-hidden select-none antialiased medical-gradient">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[250] px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border backdrop-blur-3xl ${toast.type === 'error' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-sky-500/20 border-sky-500/30 text-sky-400'}`}>
            {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <header className="bg-slate-950/60 backdrop-blur-3xl border-b border-white/5 shrink-0 z-50">
        <div className="max-w-[1600px] mx-auto px-5 h-14 flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                    <div className="w-8 h-8 bg-sky-500 rounded-xl shadow-lg shadow-sky-500/30 flex items-center justify-center"><Heart className="w-4 h-4 text-white fill-current" /></div>
                    <h1 className="text-sm font-black tracking-tight hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 uppercase">DocPlaybook</h1>
                </div>
                <nav className="hidden xl:flex items-center gap-1">
                    {CATEGORIES.map((cat) => (
                        <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedProtocol(null); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 relative group ${selectedCategory === cat.id ? 'text-sky-400 bg-sky-500/5' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
                            <cat.icon className={`w-3.5 h-3.5 ${selectedCategory === cat.id ? 'text-sky-400' : 'group-hover:text-sky-300'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{cat.name}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-1 max-w-xs relative group hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-1.5 pl-10 pr-4 focus:outline-none focus:border-sky-500/30 text-[11px] transition-all shadow-inner" />
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-900/50 rounded-xl border border-white/5">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isAdminMode ? 'text-orange-400' : 'text-slate-600'}`}>{isAdminMode ? 'Admin' : 'View'}</span>
                    <button onClick={() => setIsAdminMode(!isAdminMode)} className={`w-8 h-4 rounded-full relative transition-all ${isAdminMode ? 'bg-orange-500/30' : 'bg-slate-800'}`}>
                        <motion.div animate={{ x: isAdminMode ? 18 : 2 }} className={`w-2.5 h-2.5 rounded-full mt-0.5 shadow-lg ${isAdminMode ? 'bg-orange-400' : 'bg-slate-600'}`} />
                    </button>
                </div>
                {isAdminMode && (
                    <button onClick={() => selectedCategory === 'ward' ? setIsCreatingProtocol(true) : setIsCreating(true)} className="px-4 h-8 bg-sky-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/10"><Plus className="w-3.5 h-3.5" /></button>
                )}
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden p-2 bg-slate-900 rounded-xl text-slate-400"><Menu className="w-4 h-4" /></button>
            </div>
        </div>
      </header>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] xl:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed right-0 top-0 bottom-0 w-[320px] bg-slate-950 border-l border-white/5 z-[70] xl:hidden shadow-2xl flex flex-col">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Navigation Hub</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-slate-900 rounded-2xl text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                <div className="mb-8">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-sky-400 transition-colors" />
                    <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm" />
                  </div>
                </div>
                {isAdminMode && (
                  <button onClick={() => { setIsMobileMenuOpen(false); selectedCategory === 'ward' ? setIsCreatingProtocol(true) : setIsCreating(true); }} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-sky-600 text-white shadow-2xl shadow-sky-600/20 active:scale-95 transition-all mb-4">
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add New Entry</span>
                  </button>
                )}
                {CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedProtocol(null); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-300 ${selectedCategory === cat.id ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}>
                    <cat.icon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{cat.name}</span>
                  </button>
                ))}
              </div>
              <div className="p-8 border-t border-white/5 bg-slate-950/80">
                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-3xl border border-white/5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isAdminMode ? 'text-orange-400' : 'text-slate-600'}`}>{isAdminMode ? 'Admin Active' : 'View Mode'}</span>
                  <button onClick={() => setIsAdminMode(!isAdminMode)} className={`w-10 h-5 rounded-full relative transition-all ${isAdminMode ? 'bg-orange-500/30' : 'bg-slate-700'}`}>
                    <motion.div animate={{ x: isAdminMode ? 22 : 3 }} className={`w-3.5 h-3.5 rounded-full mt-0.5 shadow-md ${isAdminMode ? 'bg-orange-400' : 'bg-slate-500'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth custom-scrollbar">
          <div className="max-w-[1400px] mx-auto relative pb-16">
            
            {selectedCategory === 'calc' ? (
                /* CALCULATORS */
                <div className="space-y-16">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h2 className="text-4xl font-black flex items-center gap-5 leading-none tracking-tight"><div className="p-4 bg-orange-500/10 rounded-3xl"><Calculator className="w-10 h-10 text-orange-400" /></div>Clinical Calculators</h2>
                        <p className="text-slate-500 text-lg mt-4 font-medium pl-1">Validated bedside tools for rapid assessment</p>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {CALCULATORS.map(calc => (
                            <motion.div whileHover={{ y: -8 }} key={calc.id} className="glass-card p-10 bg-slate-900/10 hover:border-orange-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 bg-orange-500/5 blur-3xl rounded-full -mr-10 -mt-10" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-10 flex items-center gap-4 text-slate-400"><div className="w-2 h-2 rounded-full bg-orange-500" />{calc.name}</h3>
                                <div className="space-y-8 relative z-10">
                                    {calc.fields.map(f => (
                                        <div key={f.id} className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">{f.label}</label>
                                            <input type={f.type} placeholder={f.defaultValue} className="w-full bg-slate-950/80 border border-white/5 rounded-2xl p-5 focus:outline-none focus:border-orange-500/50 text-white font-bold text-lg transition-all" onChange={(e) => setCalcValues({ ...calcValues, [`${calc.id}_${f.id}`]: parseFloat(e.target.value) || f.defaultValue })} />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-12 p-8 bg-orange-500/10 rounded-[2rem] border border-orange-500/10 flex items-center justify-between relative z-10">
                                    <div><p className="text-[10px] font-black text-orange-500/70 uppercase tracking-[0.2em] mb-2">Calculated Result</p>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-5xl font-black text-white text-glow">{calc.calculate(Object.fromEntries(Object.entries(calcValues).filter(([k]) => k.startsWith(calc.id)).map(([k, v]) => [k.replace(`${calc.id}_`, ''), v])))?.result || '--'}</span>
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{calc.calculate(Object.fromEntries(Object.entries(calcValues).filter(([k]) => k.startsWith(calc.id)).map(([k, v]) => [k.replace(`${calc.id}_`, ''), v])))?.unit}</span>
                                        </div>
                                    </div>
                                    <div className="text-right"><p className="text-sm font-black text-orange-400 uppercase tracking-widest bg-orange-500/20 px-4 py-2 rounded-full">{calc.calculate(Object.fromEntries(Object.entries(calcValues).filter(([k]) => k.startsWith(calc.id)).map(([k, v]) => [k.replace(`${calc.id}_`, ''), v])))?.label}</p></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : selectedCategory === 'ward' && !selectedProtocol ? (
                /* DASHBOARD + PLAYBOOK */                <>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid grid-cols-1 xl:grid-cols-3 gap-5">
                        <div className="xl:col-span-2 glass-card p-5 medical-gradient flex flex-col justify-between group overflow-hidden relative rounded-xl border border-white/5">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 text-sky-400 mb-2"><ShieldCheck className="w-3.5 h-3.5" /><span className="text-[8px] font-black uppercase tracking-widest">Protocol Hub</span></div>
                                <h2 className="text-xl font-black leading-tight tracking-tight text-white">Precision Care Hub</h2>
                            </div>
                            <div className="mt-4 flex items-center gap-5 relative z-10 pt-3 border-t border-white/5">
                                <div className="flex flex-col"><span className="text-xl font-black text-white">{protocols.length}</span><span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Conditions</span></div>
                                <div className="flex flex-col"><span className="text-xl font-black text-white">{templates.length}</span><span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Templates</span></div>
                            </div>
                        </div>
                        <div className="glass-card p-5 flex flex-col justify-between border-white/5 bg-slate-900/40 rounded-xl">
                             <h3 className="text-sm font-black mb-1 flex items-center gap-2 text-slate-300"><Award className="w-4 h-4 text-emerald-400" />Status</h3>
                             <p className="text-[10px] text-slate-500 font-medium">System Active</p>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <AnimatePresence mode='popLayout'>
                            {filteredProtocols.map((p, idx) => (
                                <motion.div 
                                    key={p.id} 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    transition={{ delay: idx * 0.02 }}
                                    onClick={() => setSelectedProtocol(p)} 
                                    className="glass-card p-4 group cursor-pointer border-l-2 border-l-sky-500/40 rounded-xl bg-slate-900/20 hover:bg-slate-900/40 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-sky-500/10 transition-colors"><Stethoscope className="w-4 h-4 text-sky-400" /></div>
                                        <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-full text-[7px] font-black border border-sky-500/20 uppercase">{(p.days || []).length} Days</span>
                                    </div>
                                    <h3 className="text-sm font-black mb-1 group-hover:text-sky-400 transition-colors line-clamp-1">{p.diagnosis}</h3>
                                    <p className="text-slate-500 text-[11px] mb-4 line-clamp-2 font-medium leading-relaxed">{p.description}</p>
                                    <div className="flex items-center justify-between text-[8px] text-slate-600 pt-3 border-t border-white/5 uppercase font-black">
                                        <span>View Pathway</span>
                                        <ChevronRight className="w-3 h-3 text-sky-500" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </>
            ) : selectedProtocol ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
                        <div className="space-y-3">
                            <button onClick={() => setSelectedProtocol(null)} className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 text-white rounded-lg shadow-lg shadow-sky-600/10 active:scale-95 transition-all w-fit">
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Back</span>
                            </button>
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-black text-white tracking-tight">{selectedProtocol.diagnosis}</h2>
                                {isAdminMode && <button onClick={() => handleDeleteProtocol(selectedProtocol.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleCopy((selectedProtocol.days || []).map(d => `Day ${d.dayNumber}:\n${d.note}`).join('\n\n'), 'all')} className="h-9 px-4 bg-slate-800 text-slate-300 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">Copy Course</button>
                            {isAdminMode && <button onClick={() => handleAddDayToProtocol(selectedProtocol.id)} className="h-9 px-4 bg-sky-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-sky-500 transition-all">Add Day</button>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 relative pb-16">
                        <div className="absolute left-[27px] top-6 bottom-6 w-px bg-white/5 hidden md:block" />
                        {(selectedProtocol.days || []).map((day) => (
                            <div key={day.id} className="relative md:pl-16 group">
                                <div className="absolute left-[23px] top-9 w-2 h-2 rounded-full bg-slate-800 border-2 border-slate-700 z-10 hidden md:block group-hover:border-sky-500 transition-colors" />
                                <div className="glass-card p-4 md:p-5 border-white/5 bg-slate-900/10 rounded-xl">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                        <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-xl font-black text-sky-400">{day.dayNumber}</div><h4 className="font-black text-lg text-white">Day {day.dayNumber}</h4></div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleCopy(day.note, day.id)} className={`h-8 px-4 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${copyStatus === day.id ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 text-slate-500 border-white/5 hover:border-sky-500/30'}`}>Copy</button>
                                            <button onClick={() => setDraftingDay({ protocolId: selectedProtocol.id, dayId: day.id, note: day.note, dayNumber: day.dayNumber, isMasterEdit: isAdminMode, variables: extractVariables(day.note) })} className={`h-8 px-4 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${isAdminMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-sky-600 text-white hover:bg-sky-500'}`}>{isAdminMode ? 'Edit' : 'Personalize'}</button>
                                            {isAdminMode && <button onClick={() => handleRemoveDayFromProtocol(selectedProtocol.id, day.id)} className="w-8 h-8 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center"><MinusCircle className="w-4 h-4" /></button>}
                                        </div>
                                    </div>
                                    <div className="bg-[#020617]/80 rounded-xl p-4 border border-white/5 text-slate-300 text-base leading-relaxed whitespace-pre-wrap font-medium">{day.note}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ) : (
                /* QUICK TEMPLATES */
                <>
                    <div className="mb-12 flex justify-between items-center"><h2 className="text-3xl font-black tracking-tight">Clinical Templates <span className="text-slate-700 mx-2">/</span> <span className="text-slate-500 text-lg font-bold">{filteredTemplates.length} Found</span></h2></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        <AnimatePresence mode='popLayout'>
                            {filteredTemplates.map((template) => (
                                <motion.div 
                                    key={template.id} 
                                    layout 
                                    initial={{ opacity: 0, scale: 0.9 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    className="glass-card glass-card-hover p-10 group cursor-pointer bg-slate-900/10 active:scale-[0.98] border-t-4 border-t-purple-500/30" 
                                    onClick={() => setEditingTemplate(template)}
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="p-4 rounded-2xl bg-slate-900 group-hover:bg-purple-500/10 transition-colors"><FileText className="w-8 h-8 text-purple-400" /></div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                            <button onClick={(e) => { e.stopPropagation(); handleCopy(template.content, template.id); }} className="p-3 hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-90">{copyStatus === template.id ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }} className="p-3 hover:bg-rose-500/10 rounded-xl text-rose-500 transition-all active:scale-90"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                    <h3 className="font-black text-xl mb-4 group-hover:text-purple-400 transition-colors leading-tight tracking-tight">{template.title}</h3>
                                    <p className="text-slate-500 text-base line-clamp-5 leading-relaxed font-medium group-hover:text-slate-300 transition-colors duration-500">{template.content}</p>
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
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-3xl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative w-full max-w-xs glass-card p-8 border border-white/10 shadow-2xl ${securityLock.type === 'delete' ? 'border-rose-500/30' : 'border-orange-500/30'}`}>
              <div className="text-center space-y-8">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${securityLock.type === 'delete' ? 'bg-rose-500/10 text-rose-500' : 'bg-orange-500/10 text-orange-500'}`}>{securityLock.type === 'delete' ? <AlertTriangle className="w-8 h-8" /> : <Fingerprint className="w-8 h-8" />}</div>
                <div><h2 className="text-xl font-black uppercase tracking-tight">Authorization</h2><p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.3em] mt-1">Confirm code to proceed</p></div>
                <div className="p-6 bg-[#020617] rounded-xl border border-white/5"><div className="text-4xl font-black tracking-[0.3em] text-white tabular-nums text-glow">{securityLock.code}</div></div>
                <div className="space-y-4">
                    <input autoFocus type="tel" maxLength={6} placeholder="••••••" value={securityLock.input} onChange={(e) => setSecurityLock({ ...securityLock, input: e.target.value })} className="w-full bg-[#020617] border border-white/10 rounded-xl py-4 text-center text-3xl font-black tracking-[0.3em] focus:border-sky-500/50 text-white shadow-inner" />
                    <div className="flex gap-3">
                        <button disabled={securityLock.input !== securityLock.code} onClick={() => { securityLock.action(); setSecurityLock(null); }} className={`flex-1 h-11 font-black uppercase tracking-widest text-[9px] rounded-xl transition-all ${securityLock.input === securityLock.code ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/10' : 'bg-slate-900 text-slate-700'}`}>Verify</button>
                        <button onClick={() => setSecurityLock(null)} className="px-6 h-11 bg-slate-900 text-slate-500 rounded-xl font-black uppercase tracking-widest text-[9px]">Abort</button>
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isCreatingProtocol && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-3xl">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-xl glass-card bg-slate-900/60 p-8 border-white/5">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-lg font-black flex items-center gap-3 tracking-tight uppercase"><Plus className="w-5 h-5 text-sky-400" />New Condition</h2>
                    <button onClick={() => setIsCreatingProtocol(false)} className="p-2 bg-slate-800 rounded-lg text-slate-500"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleCreateProtocol} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Diagnosis</label><input name="diagnosis" required className="w-full bg-[#020617] border border-white/10 rounded-lg py-3 px-5 focus:border-sky-500/50 text-white font-bold text-lg" placeholder="e.g. Pneumonia" /></div>
                        <div className="space-y-2"><label className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Clinical Summary</label><input name="description" required className="w-full bg-[#020617] border border-white/10 rounded-lg py-3 px-5 focus:border-sky-500/50 text-white font-bold text-sm" placeholder="Care pathway..." /></div>
                    </div>
                    <div className="space-y-2"><label className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Day 1 Note Template</label><textarea name="initialDayNote" required rows={4} className="w-full bg-[#020617] border border-white/10 rounded-lg py-4 px-5 focus:border-sky-500/50 text-white font-medium text-base leading-relaxed" placeholder="Plan content..." /></div>
                    <div className="flex gap-4 pt-4"><button type="submit" className="flex-1 h-11 bg-sky-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-sky-600/10">Initialize Condition</button><button type="button" onClick={() => setIsCreatingProtocol(false)} className="px-8 h-11 bg-slate-800 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Cancel</button></div>
                </form>
            </motion.div>
          </div>
        )}

        {(editingTemplate || isCreating) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-3xl">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 20 }} className="relative w-full max-w-4xl glass-card bg-slate-900/60 p-16 border-white/5">
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-4xl font-black flex items-center gap-6 tracking-tight uppercase"><div className="p-4 bg-purple-500/10 rounded-3xl"><FileText className="w-8 h-8 text-purple-400" /></div>{editingTemplate ? 'Edit Template' : 'New Template'}</h2>
                    <button onClick={() => { setEditingTemplate(null); setIsCreating(false); }} className="p-4 bg-slate-800 rounded-3xl text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSaveTemplate} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">Template Title</label><input name="title" defaultValue={editingTemplate?.title} required className="w-full bg-[#020617] border border-white/10 rounded-[2rem] py-6 px-10 focus:border-purple-500/50 text-white font-bold text-2xl shadow-inner" placeholder="e.g. SOAP Note" /></div>
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">Category</label>
                            <select name="category" defaultValue={editingTemplate?.category || selectedCategory} className="w-full bg-[#020617] border border-white/10 rounded-[2rem] py-6 px-10 focus:border-purple-500/50 text-white font-bold text-lg shadow-inner appearance-none">
                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">Template Content</label><textarea name="content" defaultValue={editingTemplate?.content} required rows={10} className="w-full bg-[#020617] border border-white/10 rounded-[3rem] py-8 px-10 focus:border-purple-500/50 text-white font-medium text-xl leading-relaxed shadow-inner" placeholder="Type template content..." /></div>
                    <div className="flex gap-6 pt-10"><button type="submit" className="flex-1 py-8 bg-purple-600 hover:bg-purple-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-purple-600/30 transition-all active:scale-95 text-[10px] flex items-center justify-center gap-4"><Save className="w-6 h-6" />Save Template</button><button type="button" onClick={() => { setEditingTemplate(null); setIsCreating(false); }} className="px-14 btn-secondary py-8 rounded-[2rem]">Cancel</button></div>
                </form>
            </motion.div>
          </div>
        )}

        {draftingDay && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#020617]/98 backdrop-blur-3xl">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className={`relative w-full max-w-4xl glass-card p-6 border border-white/10 overflow-y-auto max-h-[90vh] shadow-2xl ${draftingDay.isMasterEdit ? 'bg-slate-900 border-orange-500/30' : 'bg-slate-900 border-sky-500/30'}`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                    <div className={`p-3 rounded-xl shadow-lg ${draftingDay.isMasterEdit ? 'bg-orange-500/10 text-orange-400' : 'bg-sky-500/10 text-sky-400'}`}>{draftingDay.isMasterEdit ? <Edit2 className="w-6 h-6" /> : <Send className="w-6 h-6" />}</div>
                    <div><h2 className="text-xl font-black uppercase tracking-tight">{draftingDay.isMasterEdit ? 'Edit Protocol' : 'Personalize Note'}</h2><p className="text-slate-600 text-[8px] font-black uppercase tracking-widest mt-1">Refining clinical documentation</p></div>
                </div>
                <button onClick={() => setDraftingDay(null)} className="p-2 bg-slate-800 rounded-lg text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {!draftingDay.isMasterEdit && Object.keys(draftingDay.variables || {}).length > 0 && (
                    <div className="space-y-8 bg-[#020617]/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                        <div className="flex items-center gap-3 mb-2"><Zap className="w-4 h-4 text-sky-400" /><h3 className="text-[9px] font-black uppercase tracking-widest text-slate-200">Patient Details</h3></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {Object.keys(draftingDay.variables).map(key => (
                                <div key={key} className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">{key.replace(/_/g, ' ')}</label>
                                    <input type="text" placeholder={`...`} value={draftingDay.variables[key]} onChange={(e) => setDraftingDay({ ...draftingDay, variables: { ...draftingDay.variables, [key]: e.target.value } })} className="w-full bg-[#020617] border border-white/10 rounded-lg py-2.5 px-4 focus:border-sky-500/50 text-white font-bold text-sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className={`space-y-6 ${draftingDay.isMasterEdit || Object.keys(draftingDay.variables || {}).length === 0 ? 'lg:col-span-2' : ''}`}>
                    <form onSubmit={handleSaveDraftOrMaster} className="space-y-8">
                        <div className="relative group">
                            <textarea 
                                name="note" 
                                value={draftingDay.isMasterEdit ? draftingDay.note : (draftingDay.manualNote !== undefined ? draftingDay.manualNote : processedDraftNote)} 
                                onChange={(e) => { 
                                    if (draftingDay.isMasterEdit) {
                                        setDraftingDay({ ...draftingDay, note: e.target.value }); 
                                    } else {
                                        setDraftingDay({ ...draftingDay, manualNote: e.target.value });
                                    }
                                }} 
                                required 
                                rows={10} 
                                className={`w-full bg-[#020617] border rounded-2xl py-6 px-6 focus:outline-none text-slate-300 text-base leading-relaxed font-medium transition-all shadow-inner ${draftingDay.isMasterEdit ? 'border-orange-500/40 focus:border-orange-400' : 'border-white/5 focus:border-sky-400'}`} 
                            />
                            {!draftingDay.isMasterEdit && <div className="absolute top-4 right-6 px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-[7px] font-black uppercase tracking-widest backdrop-blur-xl">Preview Mode</div>}
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button type="submit" className={`flex-1 h-11 font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 whitespace-nowrap min-w-[200px] ${draftingDay.isMasterEdit ? 'bg-orange-600 text-white shadow-orange-600/10' : 'bg-sky-600 text-white shadow-sky-600/10'}`}>{draftingDay.isMasterEdit ? <Save className="w-5 h-5" /> : <Copy className="w-5 h-5" />}{draftingDay.isMasterEdit ? 'Commit Changes' : 'Finalize & Copy'}</button>
                            <button type="button" onClick={() => setDraftingDay(null)} className="px-10 h-11 bg-slate-800 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[9px] flex-none">Discard</button>
                        </div>
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
