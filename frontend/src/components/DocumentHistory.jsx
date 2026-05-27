import React, { useState } from 'react';
import { Search, Filter, Calendar, FileCode, CheckCircle2, ChevronRight, ChevronDown, Trash2, FileSignature, Copy, Check } from 'lucide-react';
import { deleteDocument } from '../api';

const DocumentHistory = ({ documents, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const categories = [
    "Invoice/Financial",
    "Resume/CV",
    "Legal Contract",
    "Scientific Paper",
    "Business Proposal"
  ];

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this document record?")) {
      try {
        const res = await deleteDocument(id);
        if (res.success) {
          onUpdate();
        }
      } catch (err) {
        console.error("Failed to delete document:", err);
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedDocId(expandedDocId === id ? null : id);
  };

  const getMimeIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (mimeType?.includes('word') || mimeType?.includes('officedocument')) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (mimeType?.includes('image')) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.extracted_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory ? doc.predicted_category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      {/* Filters card */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 border border-slate-800/80">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search document name or content..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all"
          />
        </div>
        {/* Category filter */}
        <div className="w-full md:w-64 relative">
          <Filter className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 text-sm transition-all appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="absolute right-3.5 top-3 pointer-events-none text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl border border-slate-800/80">
            <FileCode className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">No document records found matching filters.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isExpanded = expandedDocId === doc.id;
            const formattedDate = new Date(doc.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            const sizeStr = doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "Manual Entry";

            return (
              <div 
                key={doc.id} 
                className={`glass-card rounded-xl border transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-indigo-500/40 ring-1 ring-indigo-500/10' : 'border-slate-800/60'
                }`}
              >
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(doc.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/20 transition-all select-none"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 border rounded-lg flex-shrink-0 ${getMimeIcon(doc.mime_type)}`}>
                      <FileSignature className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-200 text-sm truncate max-w-xs md:max-w-md">{doc.filename}</h4>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formattedDate}</span>
                        </span>
                        <span>•</span>
                        <span>{sizeStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-md">
                        {doc.predicted_category}
                      </span>
                      <p className="text-xs text-slate-400 font-bold mt-1">{(doc.confidence * 100).toFixed(1)}% match</p>
                    </div>
                    
                    <button 
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/40 p-5 space-y-5 animate-slide-up">
                    
                    {/* Stat Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Active Classification Model details */}
                      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/50 space-y-2">
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">CLASSIFIER CONFIG</span>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-300 font-semibold">Active Algorithm:</p>
                          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md inline-block">
                            {doc.model_used}
                          </span>
                        </div>
                      </div>

                      {/* Multi-model comparison probabilities */}
                      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/50 space-y-2 md:col-span-2">
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">ALGORITHM PROBABILITIES</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {doc.all_predictions && Object.entries(doc.all_predictions).map(([name, data]) => (
                            <div key={name} className="p-2 bg-slate-950/50 rounded-lg border border-slate-800/60 flex flex-col justify-between">
                              <span className="text-[10px] text-slate-400 truncate">{name}</span>
                              <div className="flex justify-between items-baseline mt-1">
                                <span className="text-[10px] text-slate-500 font-bold truncate max-w-[65px]">{data.prediction.split('/')[0]}</span>
                                <span className="text-xs font-black text-indigo-400">{(data.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* NLP keywords */}
                    {doc.keywords && doc.keywords.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">INFLUENTIAL KEYWORDS</span>
                        <div className="flex flex-wrap gap-2">
                          {doc.keywords.map((kw, idx) => (
                            <span 
                              key={idx} 
                              className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg hover:border-slate-700 cursor-default select-none flex items-center space-x-1"
                              title={`TFIDF value: ${kw.score.toFixed(4)}`}
                            >
                              <span>#{kw.word}</span>
                              <span className="text-[9px] text-indigo-400 font-bold">({kw.score.toFixed(2)})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extracted text console */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">EXTRACTED TEXT CONTENT</span>
                        <button
                          onClick={() => handleCopyText(doc.extracted_text, doc.id)}
                          className="text-slate-400 hover:text-slate-200 text-xs flex items-center space-x-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg"
                        >
                          {copiedId === doc.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="w-full bg-slate-950 border border-slate-900 rounded-xl p-4 max-h-56 overflow-y-auto text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed">
                        {doc.extracted_text}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DocumentHistory;
