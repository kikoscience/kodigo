import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, Activity, Search, Layout, Settings, LogOut, 
  ChevronRight, ClipboardList, Users, Clock, Save, Trash2, 
  Check, X, AlertTriangle, Fingerprint, Zap, RefreshCw, 
  Menu, TrendingUp, ArrowRight, ArrowLeft, Box, Tool, 
  Plus, MessageSquare, Star, FileText, Smartphone, HardDrive,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const API_BASE = '/api';
const socket = io(window.location.origin);

// Roles for Demo Purposed
const ROLES = [
    { id: 'Requester', icon: Users, color: 'text-sky-400' },
    { id: 'Provider', icon: ShieldCheck, color: 'text-emerald-400' },
    { id: 'Staff', icon: Tool, color: 'text-orange-400' }
];

const DEPARTMENTS = ['IT', 'Engineering'];

export default function App() {
  const [activeRole, setActiveRole] = useState('Provider');
  const [activeDept, setActiveDept] = useState('IT');
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
        const [reqRes, assetRes] = await Promise.all([
            axios.get(`${API_BASE}/requests`),
            axios.get(`${API_BASE}/assets`)
        ]);
        setRequests(reqRes.data || []);
        setAssets(assetRes.data || []);
    } catch (err) {
        showToast('Offline Mode Active', 'error');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    socket.on('connect', () => console.log('⚡ Connected to Real-time Stream'));
    socket.on('db-change', (data) => {
        console.log('🔄 Data change detected:', data);
        fetchData();
        showToast(`System Updated: ${data.table}`, 'success');
    });

    // Support for external CDC monitor if available
    socket.on('cdc-change', (changes) => {
        console.log('📡 CDC Event:', changes);
        fetchData();
        showToast('Real-time Sync Active', 'success');
    });

    return () => {
        socket.off('db-change');
        socket.off('cdc-change');
    };
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => 
        (activeRole === 'Requester' ? true : r.dept === activeDept) &&
        (r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.status.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [requests, activeDept, activeRole, searchQuery]);

  const getSLAStatus = (priority, createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffHours = (now - created) / (1000 * 60 * 60);
    
    if (priority === 'High') {
        if (diffHours > 24) return 'Breached';
        if (diffHours > 20) return 'Warning';
    } else if (priority === 'Medium') {
        if (diffHours > 48) return 'Breached';
        if (diffHours > 40) return 'Warning';
    }
    return 'Within SLA';
  };

  const getSLAColor = (status) => {
    switch (status) {
        case 'Breached': return 'text-rose-500 border-rose-500/20 bg-rose-500/5';
        case 'Warning': return 'text-orange-500 border-orange-500/20 bg-orange-500/5';
        default: return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden select-none antialiased font-sans">
      
      {/* SIDEBAR - TACTICAL NAV */}
      <aside className="w-20 lg:w-64 bg-slate-950/80 border-r border-white/5 flex flex-col items-center lg:items-stretch py-6 backdrop-blur-xl z-[100]">
        <div className="px-6 mb-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="hidden lg:block">
                <h1 className="text-sm font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">AssetOS</h1>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Command Center v2.0</p>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
            {[
                { id: 'dashboard', label: 'Dashboard', icon: Layout },
                { id: 'requests', label: 'Service Feed', icon: ClipboardList },
                { id: 'assets', label: 'Inventory', icon: Box },
                { id: 'performance', label: 'Performance', icon: TrendingUp },
            ].map(item => (
                <button key={item.id} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group">
                    <item.icon className="w-5 h-5 text-slate-500 group-hover:text-sky-400" />
                    <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white">{item.label}</span>
                </button>
            ))}
        </nav>

        {/* ROLE SELECTOR (DEMO ONLY) */}
        <div className="px-4 mt-auto space-y-4 pt-6 border-t border-white/5">
            <div className="hidden lg:block mb-4">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Simulate Role</p>
                <div className="grid grid-cols-1 gap-2">
                    {ROLES.map(role => (
                        <button 
                            key={role.id} 
                            onClick={() => setActiveRole(role.id)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${activeRole === role.id ? `bg-slate-900 border-sky-500/30 ${role.color}` : 'border-transparent text-slate-600 hover:text-slate-300'}`}
                        >
                            <role.icon className="w-3.5 h-3.5" />
                            {role.id}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-8 flex items-center justify-between z-50">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-white/5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dept:</span>
                    <select 
                        value={activeDept} 
                        onChange={(e) => setActiveDept(e.target.value)}
                        className="bg-transparent text-[9px] font-black text-white uppercase tracking-widest outline-none cursor-pointer"
                    >
                        {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                    </select>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search Serial, Tag, or Issue..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-900/50 border border-white/5 rounded-full pl-10 pr-6 py-1.5 text-[11px] w-64 focus:w-80 focus:border-sky-500/30 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 h-9 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-600/20 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">New Request</span>
                </button>
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-black">JD</div>
            </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
            <AnimatePresence mode='wait'>
                {!selectedRequest ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-7xl mx-auto space-y-8"
                    >
                        {/* KPI TILES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Open Requests', val: filteredRequests.filter(r => r.status !== 'Closed').length, icon: ClipboardList, color: 'sky' },
                                { label: 'SLA Breaches', val: filteredRequests.filter(r => getSLAStatus(r.priority, r.createdAt) === 'Breached').length, icon: AlertCircle, color: 'rose' },
                                { label: 'In Progress', val: filteredRequests.filter(r => r.status === 'In Progress').length, icon: Zap, color: 'orange' },
                                { label: 'Compliance %', val: '94.2%', icon: TrendingUp, color: 'emerald' },
                            ].map((kpi, idx) => (
                                <motion.div 
                                    key={kpi.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-6 bg-slate-900/40 border border-white/5 rounded-2xl relative overflow-hidden group"
                                >
                                    <div className={`absolute top-0 right-0 p-8 bg-${kpi.color}-500/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-${kpi.color}-500/10 transition-all`} />
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{kpi.label}</p>
                                    <div className="flex items-end justify-between relative z-10">
                                        <h3 className="text-3xl font-black text-white tracking-tight">{kpi.val}</h3>
                                        <kpi.icon className={`w-8 h-8 text-${kpi.color}-500 opacity-20 group-hover:opacity-100 transition-all`} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* REQUEST FEED */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Live Service Stream</h2>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 bg-slate-900 text-[8px] font-black uppercase tracking-widest text-slate-500 rounded-lg">Sort: Priority</button>
                                    <button className="px-3 py-1 bg-slate-900 text-[8px] font-black uppercase tracking-widest text-slate-500 rounded-lg">Status: All</button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {filteredRequests.map((req, idx) => (
                                    <motion.div 
                                        key={req.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setSelectedRequest(req)}
                                        className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl hover:border-sky-500/30 cursor-pointer transition-all flex items-center gap-6 group"
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${req.priority === 'High' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-950 border-white/5 text-slate-500'}`}>
                                            {req.dept === 'IT' ? <Smartphone className="w-6 h-6" /> : <HardDrive className="w-6 h-6" />}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-sm font-bold text-white truncate">{req.title}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${getSLAColor(getSLAStatus(req.priority, req.createdAt))}`}>
                                                    {getSLAStatus(req.priority, req.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium truncate opacity-70 group-hover:opacity-100 transition-all">{req.description}</p>
                                        </div>

                                        <div className="flex items-center gap-8 px-6 border-l border-white/5">
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</p>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${req.status === 'Disputed' ? 'text-rose-400 animate-pulse' : 'text-sky-400'}`}>{req.status}</span>
                                            </div>
                                            <div className="text-right hidden md:block">
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Asset Tag</p>
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-white/5">{req.assetTag}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-sky-400 transition-all" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-5xl mx-auto"
                    >
                        {/* DETAIL VIEW */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <button 
                                    onClick={() => setSelectedRequest(null)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
                                </button>
                                <div className="flex gap-3">
                                    <span className={`px-4 py-2 bg-slate-950 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest ${selectedRequest.priority === 'High' ? 'text-rose-500' : 'text-sky-500'}`}>
                                        Priority: {selectedRequest.priority}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* MAIN CONTENT */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="p-8 bg-slate-900/60 border border-white/5 rounded-[2.5rem] relative overflow-hidden">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6 text-sky-400" /></div>
                                            <div>
                                                <h2 className="text-2xl font-black tracking-tight">{selectedRequest.title}</h2>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Request ID: {selectedRequest.id}</p>
                                            </div>
                                        </div>
                                        <p className="text-slate-300 text-lg leading-relaxed font-medium mb-8 bg-slate-950/40 p-6 rounded-3xl border border-white/5">
                                            {selectedRequest.description}
                                        </p>
                                        
                                        {/* FINDINGS PANEL */}
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                                                <Search className="w-3 h-3" /> Technical Findings
                                            </h3>
                                            <div className="space-y-3">
                                                {/* Mocked findings for demo */}
                                                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                                                    <p className="text-sm font-medium text-slate-300 italic">"Initial inspection confirms hardware failure in the power module. Replacing PSU and testing voltage stability."</p>
                                                    <div className="mt-3 flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                        <span>Logged by M. Tech</span>
                                                        <span>10:45 AM</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RESOLUTION SECTION (ONLY FOR PROVIDER/STAFF) */}
                                    {(activeRole === 'Provider' || activeRole === 'Staff') && (
                                        <div className="p-8 bg-slate-900/60 border border-white/5 rounded-[2.5rem] border-sky-500/20">
                                            <h3 className="text-lg font-black mb-6 flex items-center gap-3"><Check className="w-5 h-5 text-sky-400" /> Finalize Resolution</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Old Component SN</label>
                                                    <input type="text" placeholder="e.g. PSU-8871" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white focus:border-sky-500 outline-none" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">New Component SN</label>
                                                    <input type="text" placeholder="e.g. PSU-9902" className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white focus:border-sky-500 outline-none" />
                                                </div>
                                            </div>
                                            <textarea rows={4} placeholder="Detailed action taken..." className="w-full bg-slate-950 border border-white/5 rounded-3xl p-6 text-sm font-medium text-white mb-6 focus:border-sky-500 outline-none" />
                                            <button className="w-full h-14 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-sky-600/20 active:scale-95">
                                                Commit Resolution & Close Request
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* SIDE PANEL */}
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-900/60 border border-white/5 rounded-[2rem]">
                                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Asset Intelligence</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-600 font-black uppercase">Model</span>
                                                <span className="text-[10px] text-white font-bold">{selectedRequest.model || 'Unknown'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-600 font-black uppercase">Tag</span>
                                                <span className="text-[10px] text-sky-400 font-black">{selectedRequest.assetTag}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-600 font-black uppercase">Location</span>
                                                <span className="text-[10px] text-white font-bold">{selectedRequest.location}</span>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-white/5">
                                            <button className="w-full py-3 bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-700 transition-all">View Lifecycle History</button>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-900/60 border border-white/5 rounded-[2rem]">
                                        <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Assignment Pool</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-white/5">
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500"><Users className="w-4 h-4" /></div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-white leading-none">Mike IT Tech</p>
                                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Lead Tech</p>
                                                </div>
                                            </div>
                                        </div>
                                        {activeRole === 'Provider' && (
                                            <button className="w-full mt-4 py-3 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-sky-500/30 hover:text-sky-400 transition-all">
                                                Manage Assignment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* TOAST NOTIFICATIONS */}
        <AnimatePresence>
            {toast && (
                <motion.div 
                    initial={{ opacity: 0, y: 50, x: '-50%' }} 
                    animate={{ opacity: 1, y: 0, x: '-50%' }} 
                    exit={{ opacity: 0, y: 20, x: '-50%' }} 
                    className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] px-8 py-4 rounded-full border backdrop-blur-3xl shadow-2xl flex items-center gap-4 ${toast.type === 'error' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-sky-500/20 border-sky-500/30 text-sky-400'}`}
                >
                    {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
                </motion.div>
            )}
        </AnimatePresence>
      </main>

      {/* CREATE REQUEST MODAL (GLUE LOGIC) */}
      <AnimatePresence>
        {isCreating && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    className="w-full max-w-2xl bg-slate-900 border border-white/5 p-12 rounded-[3rem] shadow-2xl"
                >
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-3xl font-black tracking-tight">Initiate Service</h2>
                        <button onClick={() => setIsCreating(false)} className="p-4 bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                    </div>
                    <form className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Reference</label>
                                <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none">
                                    <option>Select Asset...</option>
                                    {assets.map(a => <option key={a.id} value={a.id}>{a.assetTag} - {a.model}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Priority Matrix</label>
                                <select className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white outline-none">
                                    <option value="Low">Low (Efficiency)</option>
                                    <option value="Medium">Medium (Correction)</option>
                                    <option value="High">High (Critical)</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Fault Description</label>
                            <input type="text" placeholder="Short summary of the issue..." className="w-full bg-slate-950 border border-white/5 rounded-2xl p-6 text-sm font-bold text-white outline-none" />
                        </div>
                        <textarea rows={4} placeholder="Full technical description and replication steps..." className="w-full bg-slate-950 border border-white/5 rounded-[2rem] p-6 text-sm font-medium text-white outline-none" />
                        
                        <div className="flex gap-4 pt-4">
                            <button 
                                type="button" 
                                onClick={async () => {
                                    const title = document.querySelector('input[placeholder="Short summary of the issue..."]').value;
                                    const description = document.querySelector('textarea[placeholder="Full technical description and replication steps..."]').value;
                                    const assetId = document.querySelector('select').value;
                                    const priority = document.querySelectorAll('select')[1].value;
                                    
                                    if(!title || !description || assetId === 'Select Asset...') return showToast('Please fill all fields', 'error');

                                    try {
                                        await axios.post(`${API_BASE}/requests`, {
                                            id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
                                            title,
                                            description,
                                            dept: activeDept,
                                            priority,
                                            location: 'Main Ward',
                                            requesterId: 'USR-DEMO',
                                            assetId
                                        });
                                        setIsCreating(false);
                                        showToast('Request Deployed Successfully');
                                    } catch (err) {
                                        showToast('Failed to deploy request', 'error');
                                    }
                                }}
                                className="flex-1 h-16 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-sky-600/20 active:scale-95"
                            >
                                Deploy Request
                            </button>
                            <button type="button" onClick={() => setIsCreating(false)} className="px-10 h-16 bg-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs">Abort</button>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
