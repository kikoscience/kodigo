import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Stethoscope, Activity, Search, Layout, Settings, FileText, 
  ChevronRight, ClipboardList, Users, Clock, Save, Trash2, 
  Check, X, AlertTriangle, Zap, RefreshCw, Menu, ArrowRight, 
  Plus, MessageSquare, Star, Smartphone, Database, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const API_BASE = '/api';
const socket = io(window.location.origin);

export default function App() {
  const [templates, setTemplates] = useState([]);
  const [encodings, setEncodings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [isEncoding, setIsEncoding] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
        const [tempRes, encRes] = await Promise.all([
            axios.get(`${API_BASE}/templates`),
            axios.get(`${API_BASE}/encodings`)
        ]);
        setTemplates(tempRes.data || []);
        setEncodings(encRes.data || []);
    } catch (err) {
        showToast('System Offline', 'error');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    socket.on('db-change', (data) => {
        console.log('🔄 Real-time Update Received:', data);
        fetchData();
        showToast('Database Synced', 'success');
    });

    return () => socket.off('db-change');
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden select-none antialiased font-sans">
      
      {/* SIDEBAR - CLINICAL NAV */}
      <aside className="w-20 lg:w-64 bg-slate-950/80 border-r border-white/5 flex flex-col items-center lg:items-stretch py-6 backdrop-blur-xl z-[100]">
        <div className="px-6 mb-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div className="hidden lg:block">
                <h1 className="text-sm font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">DocPlaybook</h1>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Clinical Engine v3.0</p>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
            {[
                { id: 'dashboard', label: 'Clinical Feed', icon: Activity },
                { id: 'templates', label: 'Template Hub', icon: FileText },
                { id: 'patients', label: 'Encodings', icon: ClipboardList },
                { id: 'settings', label: 'Settings', icon: Settings },
            ].map(item => (
                <button key={item.id} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${item.id === 'dashboard' ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                    <item.icon className={`w-5 h-5 ${item.id === 'dashboard' ? 'text-rose-400' : 'text-slate-500 group-hover:text-rose-400'}`} />
                    <span className={`hidden lg:block text-[10px] font-black uppercase tracking-widest ${item.id === 'dashboard' ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>{item.label}</span>
                </button>
            ))}
        </nav>

        <div className="px-4 mt-auto pt-6 border-t border-white/5 text-center hidden lg:block">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Live Sync Active</p>
                <p className="text-[8px] text-slate-500">Connected to Clinical Node</p>
            </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-8 flex items-center justify-between z-50">
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search Templates (e.g. Cardiology, OB-GYN)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-900/50 border border-white/5 rounded-full pl-10 pr-6 py-1.5 text-[11px] w-64 focus:w-96 focus:border-rose-500/30 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsEncoding(true)}
                    className="flex items-center gap-2 px-4 h-9 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">New Encoding</span>
                </button>
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-black">DR</div>
            </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* KPI TILES */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Active Templates', val: templates.length, icon: FileText, color: 'sky' },
                        { label: 'Encodings Today', val: encodings.length, icon: Activity, color: 'rose' },
                        { label: 'Cloud Latency', val: '12ms', icon: Zap, color: 'orange' },
                        { label: 'Storage Usage', val: '84%', icon: Database, color: 'emerald' },
                    ].map((kpi, idx) => (
                        <motion.div 
                            key={kpi.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl relative overflow-hidden group"
                        >
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{kpi.label}</p>
                            <div className="flex items-end justify-between relative z-10">
                                <h3 className="text-3xl font-black text-white tracking-tight">{kpi.val}</h3>
                                <kpi.icon className={`w-8 h-8 text-${kpi.color}-500 opacity-20 group-hover:opacity-100 transition-all`} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* RECENT ACTIVITY */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Live Clinical Stream</h2>
                    <div className="space-y-3">
                        {encodings.map((enc, idx) => (
                            <motion.div 
                                key={enc.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl hover:border-rose-500/30 cursor-pointer transition-all flex items-center gap-6 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-rose-500">
                                    <Heart className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-sm font-bold text-white truncate">{enc.patientName}</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-rose-500/20 bg-rose-500/5 text-rose-500">
                                            {enc.templateName}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium truncate opacity-70 group-hover:opacity-100 transition-all">Encoded by {enc.doctorName} • {new Date(enc.createdAt).toLocaleTimeString()}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-rose-400 transition-all" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* MODAL: NEW ENCODING */}
        <AnimatePresence>
            {isEncoding && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        className="w-full max-w-2xl bg-slate-900 border border-white/5 p-12 rounded-[3rem] shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-3xl font-black tracking-tight">Clinical Encoding</h2>
                            <button onClick={() => setIsEncoding(false)} className="p-4 bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        <form className="space-y-8" onSubmit={(e) => {
                            e.preventDefault();
                            const patientName = e.target.patient.value;
                            const templateId = e.target.template.value;
                            if(!patientName || templateId === 'default') return showToast('Please fill all fields', 'error');

                            axios.post(`${API_BASE}/encodings`, {
                                id: `ENC-${Date.now()}`,
                                patientName,
                                templateId,
                                doctorName: 'Dr. Smith',
                                data: '{}'
                            }).then(() => {
                                setIsEncoding(false);
                                showToast('Encoding Finalized');
                            });
                        }}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Patient Name</label>
                                <input name="patient" type="text" placeholder="Full legal name..." className="w-full bg-slate-950 border border-white/5 rounded-2xl p-6 text-sm font-bold text-white outline-none focus:border-rose-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Medical Template</label>
                                <select name="template" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-rose-500">
                                    <option value="default">Select Template...</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 h-16 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-rose-600/20 active:scale-95">Finalize Encoding</button>
                                <button type="button" onClick={() => setIsEncoding(false)} className="px-10 h-16 bg-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs">Abort</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* TOAST */}
        <AnimatePresence>
            {toast && (
                <motion.div 
                    initial={{ opacity: 0, y: 50, x: '-50%' }} 
                    animate={{ opacity: 1, y: 0, x: '-50%' }} 
                    exit={{ opacity: 0, y: 20, x: '-50%' }} 
                    className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 rounded-full border backdrop-blur-3xl shadow-2xl flex items-center gap-4 ${toast.type === 'error' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}
                >
                    <Check className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
                </motion.div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );
}
