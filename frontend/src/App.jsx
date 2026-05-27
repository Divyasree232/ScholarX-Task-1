import React, { useState, useEffect } from 'react';
import { Layers, History, BarChart3, Binary, BrainCircuit, RefreshCw, Cpu } from 'lucide-react';
import { getStatus, getHistory, getStats, getModelInfo } from './api';

import UploadSection from './components/UploadSection';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DocumentHistory from './components/DocumentHistory';
import ModelExplorer from './components/ModelExplorer';

function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'analytics', 'history', 'models'
  const [activeModel, setActiveModel] = useState('Logistic Regression');
  const [backendReady, setBackendReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  
  // Data States
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  const fetchAppData = async () => {
    try {
      const statusRes = await getStatus();
      if (statusRes.success) {
        setBackendReady(true);
      }
      
      const [historyRes, statsRes, perfRes] = await Promise.all([
        getHistory(),
        getStats(),
        getModelInfo()
      ]);

      if (historyRes.success) setHistory(historyRes.documents);
      if (statsRes.success) setStats(statsRes.stats);
      if (perfRes.success) setPerformanceData(perfRes.performance);
      
    } catch (err) {
      console.error("Error loading application datasets:", err);
      setBackendReady(false);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const handleUpdate = () => {
    fetchAppData();
  };

  const tabs = [
    { id: 'upload', name: 'Classifier Console', icon: BrainCircuit },
    { id: 'analytics', name: 'AI Analytics', icon: BarChart3 },
    { id: 'history', name: 'Document Logs', icon: History },
    { id: 'models', name: 'Model Engine', icon: Binary },
  ];

  return (
    <div className="min-h-screen cyber-bg text-slate-100 flex flex-col relative overflow-hidden">
      
      {/* Dynamic Cyber Auras in Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] glow-purple rounded-full z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] glow-blue rounded-full z-0 pointer-events-none"></div>

      {/* Header section */}
      <header className="border-b border-slate-900 bg-slate-950/65 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-5.5 h-5.5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white leading-none tracking-tight flex items-center space-x-1.5">
              <span>DocuMind</span>
              <span className="text-[10px] py-0.5 px-1.5 font-bold bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-md tracking-wider">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Smart Document Classifier Console</p>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="flex items-center space-x-4">
          
          {/* Active Model Selector */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl py-1 px-3">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="bg-transparent text-xs text-slate-300 border-none font-bold focus:outline-none cursor-pointer pr-4"
            >
              <option value="Logistic Regression">Logistic Regression (LGR)</option>
              <option value="SVM">Support Vector Machine (SVM)</option>
              <option value="Naive Bayes">Naive Bayes (NBY)</option>
            </select>
          </div>

          {/* Connection Status indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${backendReady ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wide hidden md:inline">
              {backendReady ? 'SERVER ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* Reload State button */}
          <button 
            onClick={fetchAppData} 
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80 rounded-xl transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Core Section */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible space-x-2 md:space-x-0 md:space-y-2 border-b md:border-b-0 border-slate-900 pb-4 md:pb-0 h-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 py-3 px-4 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 w-full ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/5'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-900/40'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}

          {/* Model Selector for Mobile (below tabs) */}
          <div className="sm:hidden w-full flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 mt-2">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="bg-transparent text-xs text-slate-300 border-none font-bold focus:outline-none cursor-pointer w-full"
            >
              <option value="Logistic Regression">LGR Model</option>
              <option value="SVM">SVM Model</option>
              <option value="Naive Bayes">NBY Model</option>
            </select>
          </div>
        </div>

        {/* Dynamic Display Panel */}
        <div className="md:col-span-3 space-y-6">
          {loadingStatus ? (
            <div className="w-full glass-card rounded-2xl p-12 flex flex-col items-center justify-center space-y-4 border border-slate-900">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-semibold animate-pulse">Initializing analytics engine & loading history...</p>
            </div>
          ) : (
            <>
              {activeTab === 'upload' && (
                <div className="space-y-6 animate-slide-up">
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-white">Classifier Console</h2>
                    <p className="text-xs text-slate-400">
                      Upload document files or paste raw texts to classify categories using AI.
                    </p>
                  </div>
                  <UploadSection 
                    activeModel={activeModel} 
                    onClassificationSuccess={handleUpdate} 
                  />
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6 animate-slide-up">
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-white">AI Analytics Center</h2>
                    <p className="text-xs text-slate-400">
                      Real-time breakdown of classified documents, system accuracy, and user activity.
                    </p>
                  </div>
                  <AnalyticsDashboard stats={stats} />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6 animate-slide-up">
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-white">Document Logs</h2>
                    <p className="text-xs text-slate-400">
                      Explore historical records, search documents, and inspect NLP extraction details.
                    </p>
                  </div>
                  <DocumentHistory 
                    documents={history} 
                    onUpdate={handleUpdate} 
                  />
                </div>
              )}

              {activeTab === 'models' && (
                <div className="space-y-6 animate-slide-up">
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-white">ML Model Engine</h2>
                    <p className="text-xs text-slate-400">
                      Compare accuracy, precision, and f1-scores for Naive Bayes, SVM, and Logistic Regression.
                    </p>
                  </div>
                  <ModelExplorer 
                    performanceData={performanceData} 
                    onRetrainSuccess={(newPerf) => {
                      setPerformanceData(newPerf);
                      handleUpdate();
                    }} 
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-4 px-6 text-center text-[10px] text-slate-600 font-semibold mt-auto relative z-10">
        © 2026 DocuMind AI Document Classifier. Built with React, Tailwind, and Flask ML algorithms.
      </footer>
    </div>
  );
}

export default App;
