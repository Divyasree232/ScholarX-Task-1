import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { uploadDocument, classifyText } from '../api';

const UploadSection = ({ activeModel, onClassificationSuccess }) => {
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'text'
  const [file, setFile] = useState(null);
  const [manualText, setManualText] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await uploadDocument(file, activeModel);
      if (data.success) {
        setResult(data);
        onClassificationSuccess();
      } else {
        setError(data.error || "Failed to classify document");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTextClassification = async (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await classifyText(manualText, activeModel);
      if (data.success) {
        setResult(data);
        onClassificationSuccess();
      } else {
        setError(data.error || "Failed to classify text");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setManualText('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
      {/* Decorative top gradient border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
      
      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-900/80 p-1 rounded-xl mb-6 border border-slate-800 max-w-xs">
        <button
          onClick={() => { setActiveTab('file'); resetForm(); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'file'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>
        <button
          onClick={() => { setActiveTab('text'); resetForm(); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === 'text'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paste Text</span>
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
              isDragActive
                ? 'border-blue-500 bg-blue-500/5'
                : file 
                  ? 'border-emerald-500 bg-emerald-500/5' 
                  : 'border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-900/60'
            }`}
          >
            {/* Visual glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
              className="hidden"
            />
            
            {file ? (
              <div className="text-center space-y-3 z-10">
                <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-semibold text-slate-200 truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); resetForm(); }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 z-10">
                <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-300">Drag & drop your document here</p>
                  <p className="text-sm text-slate-500">or click to browse from files</p>
                </div>
                <p className="text-xs text-slate-600">Supports PDF, DOCX, TXT, PNG, JPG, JPEG (Max 16MB)</p>
              </div>
            )}
          </div>

          {file && !result && !loading && (
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold rounded-xl text-white flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-blue-500/10"
            >
              <Sparkles className="w-5 h-5" />
              <span>Classify Document</span>
            </button>
          )}
        </form>
      )}

      {/* Manual Text Tab */}
      {activeTab === 'text' && (
        <form onSubmit={handleTextClassification} className="space-y-4">
          <div>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste raw text here to test the NLP model directly..."
              rows={6}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            ></textarea>
          </div>
          
          {manualText.trim() && !result && !loading && (
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold rounded-xl text-white flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-purple-500/10"
            >
              <Sparkles className="w-5 h-5" />
              <span>Classify Raw Text</span>
            </button>
          )}
        </form>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-8 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <Layers className="w-5 h-5 text-indigo-400 absolute top-3.5 left-3.5 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-300">Extracting & Classifying...</p>
            <p className="text-xs text-slate-500">Applying NLP text pre-processing and running ML algorithms</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-3 text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Classification Failed</h4>
            <p className="text-xs text-rose-400/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="mt-6 border-t border-slate-800/80 pt-6 animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase">Classification Result</h3>
            <button
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800/50 rounded-xl relative overflow-hidden">
            {/* Soft decorative background glow */}
            <div className="absolute -right-12 -bottom-12 w-28 h-28 bg-indigo-500/10 rounded-full filter blur-xl"></div>
            
            <div className="space-y-1 z-10">
              <span className="text-xs text-indigo-400 font-semibold tracking-wide">PREDICTED CATEGORY</span>
              <h2 className="text-xl font-bold text-white leading-tight">{result.prediction}</h2>
            </div>
            
            <div className="text-right z-10">
              <span className="text-xs text-slate-400 font-semibold tracking-wide">CONFIDENCE SCORE</span>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {(result.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Model distribution stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Confidence breakdown */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-400">Model Confidence Distribution</h4>
              <div className="space-y-2">
                {result.confidence_distribution?.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{item.category}</span>
                      <span className="text-slate-400">{(item.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${
                          idx === 0 ? 'from-blue-500 to-indigo-500' : idx === 1 ? 'from-indigo-600 to-purple-600' : 'from-slate-600 to-slate-500'
                        }`} 
                        style={{ width: `${item.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyword Extraction */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 space-y-3">
              <h4 className="text-xs font-bold text-slate-400">Extracted Key NLP Tokens</h4>
              {result.keywords && result.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {result.keywords.map((kw, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-lg flex items-center space-x-1 hover:border-indigo-400/40 hover:bg-indigo-500/15 cursor-default transition-all"
                      title={`TF-IDF Score: ${kw.score.toFixed(4)}`}
                    >
                      <span>#{kw.word}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic pt-2">No key tokens could be isolated.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSection;
