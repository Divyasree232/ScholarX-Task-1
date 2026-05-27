import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Database, TrendingUp, Cpu, Award } from 'lucide-react';

const COLORS = ['#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#14b8a6'];

const AnalyticsDashboard = ({ stats }) => {
  if (!stats || stats.total_documents === 0) {
    return (
      <div className="w-full glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <Database className="w-12 h-12 text-slate-500 animate-pulse" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-300">No Analytics Available Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Once you upload and classify some documents, the real-time AI analytics will activate here!
          </p>
        </div>
      </div>
    );
  }

  // 1. Calculate overall stats
  const totalDocs = stats.total_documents;
  
  // Find highest category
  let topCat = "N/A";
  let topCatCount = 0;
  let totalConfSum = 0;
  
  stats.category_distribution?.forEach(cat => {
    totalConfSum += cat.avg_confidence * cat.count;
    if (cat.count > topCatCount) {
      topCatCount = cat.count;
      topCat = cat.category;
    }
  });

  const avgConfidence = totalDocs > 0 ? (totalConfSum / totalDocs) : 0;

  // Render stats cards
  const statCards = [
    {
      title: "Total Classified",
      value: totalDocs,
      subtitle: "Documents processed",
      icon: Database,
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "Top Category",
      value: topCat.split('/')[0], // simplify category display
      subtitle: `${topCatCount} matches`,
      icon: Cpu,
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "Average Confidence",
      value: `${(avgConfidence * 100).toFixed(1)}%`,
      subtitle: "Prediction score",
      icon: Award,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "System Reliability",
      value: totalDocs > 0 ? "High" : "Optimal",
      subtitle: "Active real-time learning",
      icon: TrendingUp,
      color: "from-teal-500 to-emerald-500"
    }
  ];

  // Map SQLite timeline results to nice labels
  const timelineData = stats.upload_trends?.map(t => {
    // simple date formating MM/DD
    const dateObj = new Date(t.date);
    const dateStr = isNaN(dateObj.getTime()) ? t.date : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: dateStr,
      uploads: t.count
    };
  }) || [];

  // Map category distributions
  const categoryData = stats.category_distribution?.map(cat => ({
    name: cat.category,
    value: cat.count,
    confidence: (cat.avg_confidence * 100).toFixed(1)
  })) || [];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between h-28 hover:scale-[1.02] transition-all">
              {/* Subtle back glowing accent */}
              <div className={`absolute -right-8 -top-8 w-20 h-20 bg-gradient-to-br ${card.color} opacity-10 rounded-full filter blur-xl`}></div>
              
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">{card.value}</h3>
                <p className="text-[10px] text-slate-500 font-medium">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown (Pie) */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800/80 pb-3 mb-2">Category Breakdown</h3>
          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Total</span>
              <span className="text-lg font-black text-white">{totalDocs}</span>
            </div>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-1.5 pt-2">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <span className="text-[10px] text-slate-400 font-medium truncate" title={cat.name}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Volume Distributions (Bar) */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800/80 pb-3 mb-2">Confidence by Document Class</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 9 }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => val.split('/')[0]} 
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                />
                <Bar dataKey="confidence" name="Avg Confidence (%)" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upload Timeline (Area) */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-300 border-b border-slate-800/80 pb-3 mb-2">Upload Activity Trends</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="uploads" name="Uploads" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
