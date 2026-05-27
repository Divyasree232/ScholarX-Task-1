import React, { useState } from 'react';
import { ShieldCheck, Cpu, Play, Award, HelpCircle, Activity } from 'lucide-react';
import { trainModel } from '../api';

const ModelExplorer = ({ performanceData, onRetrainSuccess }) => {
  const [training, setTraining] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'classes'
  
  const handleRetrain = async () => {
    setTraining(true);
    try {
      const data = await trainModel();
      if (data.success) {
        onRetrainSuccess(data.performance);
      }
    } catch (err) {
      console.error("Retraining failed:", err);
      alert("Failed to retrain models. Check Flask backend logs.");
    } finally {
      setTraining(false);
    }
  };

  const getMetricColor = (val) => {
    if (val >= 0.9) return "text-emerald-400";
    if (val >= 0.75) return "text-indigo-400";
    return "text-amber-400";
  };

  return (
    <div className="w-full space-y-6">
      {/* Retrain Action Console */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Glow */}
        <div className="absolute left-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-xl"></div>
        
        <div className="flex items-center space-x-3.5 z-10 text-center sm:text-left flex-col sm:flex-row">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 flex-shrink-0">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 text-base">Model Retraining Engine</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Regenerate synthetic training assets and retrain all three algorithms simultaneously.
            </p>
          </div>
        </div>

        <button
          onClick={handleRetrain}
          disabled={training}
          className={`py-2.5 px-6 font-bold text-sm rounded-xl text-white flex items-center justify-center space-x-2 shadow-lg transition-all z-10 whitespace-nowrap ${
            training
              ? 'bg-slate-800 border border-slate-700 cursor-not-allowed text-slate-500'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/10 hover:shadow-blue-500/20'
          }`}
        >
          {training ? (
            <>
              <Activity className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Training Pipeline Active...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Retrain All Models</span>
            </>
          )}
        </button>
      </div>

      {/* Model Cards Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {performanceData && Object.entries(performanceData).map(([name, metrics]) => (
          <div key={name} className="glass-card rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
            <div className="absolute -right-8 -bottom-8 w-20 h-20 bg-indigo-500/5 group-hover:bg-indigo-500/10 rounded-full filter blur-xl transition-all"></div>
            
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <h4 className="font-extrabold text-slate-200 text-sm tracking-wide">{name}</h4>
                <div className="p-1 rounded-md bg-slate-900 border border-slate-800 text-indigo-400">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Accuracy Display */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Validation Accuracy</span>
                  <span className={`font-black ${getMetricColor(metrics.accuracy)}`}>{(metrics.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900/60 border border-slate-800/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" 
                    style={{ width: `${metrics.accuracy * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Specs table */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900">
                <div className="text-center p-2 bg-slate-900/30 border border-slate-900 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">Precision</span>
                  <span className="text-xs font-black text-slate-300 mt-1 block">{(metrics.precision * 100).toFixed(0)}%</span>
                </div>
                <div className="text-center p-2 bg-slate-900/30 border border-slate-900 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">Recall</span>
                  <span className="text-xs font-black text-slate-300 mt-1 block">{(metrics.recall * 100).toFixed(0)}%</span>
                </div>
                <div className="text-center p-2 bg-slate-900/30 border border-slate-900 rounded-lg">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">F1-Score</span>
                  <span className="text-xs font-black text-slate-300 mt-1 block">{(metrics.f1 * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 text-[10px] text-emerald-400 mt-4 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Model loaded & fully optimized</span>
            </div>
          </div>
        ))}
      </div>

      {/* Classwise Metrics Tab View */}
      {performanceData && (
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-slate-300">Category-Specific Evaluation Metrics</h3>
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button 
                onClick={() => setActiveTab('summary')}
                className={`py-1 px-3 rounded-md font-semibold transition-all ${activeTab === 'summary' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Category Highlights
              </button>
              <button 
                onClick={() => setActiveTab('classes')}
                className={`py-1 px-3 rounded-md font-semibold transition-all ${activeTab === 'classes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Full Performance Table
              </button>
            </div>
          </div>

          {activeTab === 'summary' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {Object.keys(Object.values(performanceData)[0].category_metrics || {}).map((catName) => {
                // Get average score across models
                let maxF1 = 0;
                let topModel = "";
                Object.entries(performanceData).forEach(([modelName, data]) => {
                  const f1 = data.category_metrics?.[catName]?.f1 || 0;
                  if (f1 > maxF1) {
                    maxF1 = f1;
                    topModel = modelName;
                  }
                });

                return (
                  <div key={catName} className="p-3 bg-slate-900/60 border border-slate-800/60 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-400 truncate" title={catName}>{catName}</h5>
                      <div className="flex justify-between items-baseline mt-2">
                        <span className="text-xs text-slate-500 font-bold">Top F1-Score:</span>
                        <span className="text-base font-black text-indigo-400">{(maxF1 * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 font-semibold truncate mt-1">Best model: {topModel}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Document Category</th>
                    <th className="py-2.5 px-3">Algorithm Model</th>
                    <th className="py-2.5 px-3 text-center">Precision</th>
                    <th className="py-2.5 px-3 text-center">Recall</th>
                    <th className="py-2.5 px-3 text-center">F1-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/80 text-slate-300">
                  {Object.keys(Object.values(performanceData)[0].category_metrics || {}).map((catName) => (
                    <React.Fragment key={catName}>
                      {Object.entries(performanceData).map(([modelName, data], idx) => {
                        const m = data.category_metrics?.[catName] || { precision: 0, recall: 0, f1: 0 };
                        return (
                          <tr key={`${catName}-${modelName}`} className="hover:bg-slate-900/10">
                            {idx === 0 ? (
                              <td className="py-2 px-3 font-bold text-slate-200 border-r border-slate-900/80" rowSpan={3}>
                                {catName}
                              </td>
                            ) : null}
                            <td className="py-2 px-3 text-slate-400 font-medium">{modelName}</td>
                            <td className="py-2 px-3 text-center font-semibold">{(m.precision * 100).toFixed(0)}%</td>
                            <td className="py-2 px-3 text-center font-semibold">{(m.recall * 100).toFixed(0)}%</td>
                            <td className="py-2 px-3 text-center font-bold text-indigo-400">{(m.f1 * 100).toFixed(0)}%</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelExplorer;
