import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Bot, 
  Volume2, 
  VolumeX, 
  Upload,
  Image as ImageIcon,
  CheckCircle2, 
  BrainCircuit, 
  TrendingUp,
  ShieldAlert,
  Loader2,
  Trash2,
  FileText,
  Activity,
  ArrowRight,
  Maximize2
} from 'lucide-react';

interface GeminaAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'chat' | 'vision';
}

export interface ChatMessage {
  id: string;
  sender: 'gemina' | 'user';
  text: string;
  timestamp: string;
  isVisionResult?: boolean;
  imageUrl?: string;
}

export const GeminaAssistantModal: React.FC<GeminaAssistantModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'chat'
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'vision'>(initialTab);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'gemina',
      text: "Hello! I am Gemina AI, your institutional market analyst powered by DeepSeek. I can analyze live charts, extract prices from uploaded screenshots, calculate position risk, and provide algorithmic market structure insights. How can I assist you today?",
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  // Vision state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [visionPrompt, setVisionPrompt] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live system clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemina-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
          }))
        })
      });

      const data = await response.json();
      const reply = data.reply || 'Market analysis completed.';

      const botMsg: ChatMessage = {
        id: `gemina-${Date.now()}`,
        sender: 'gemina',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(reply);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'gemina',
        text: "I am temporarily experiencing network congestion connecting to DeepSeek. Please check your connectivity and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Image Upload & Vision Handler
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, GIF, WebP)');
      return;
    }
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeVision = async () => {
    if (!selectedImage || isAnalyzingVision) return;
    setIsAnalyzingVision(true);

    // Add user upload event into messages
    const uploadUserMsg: ChatMessage = {
      id: `user-img-${Date.now()}`,
      sender: 'user',
      text: visionPrompt ? `Analyze Screenshot: "${visionPrompt}"` : "Analyze Screenshot: Please extract all market symbols, prices, and changes.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: selectedImage
    };
    setMessages((prev) => [...prev, uploadUserMsg]);

    try {
      const res = await fetch('/api/gemina-vision-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: imageMime,
          prompt: visionPrompt || "You are Gemina, a financial data extraction expert. Read this screenshot carefully. List every instrument (symbol), price, absolute change, and percentage change. Then give a brief market summary. Format as clear bullet points."
        })
      });

      const data = await res.json();
      const analysisText = data.analysis || "Screenshot parsed successfully.";

      const botVisionMsg: ChatMessage = {
        id: `gemina-vision-${Date.now()}`,
        sender: 'gemina',
        text: analysisText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isVisionResult: true
      };

      setMessages((prev) => [...prev, botVisionMsg]);
      speakText("Screenshot analysis completed by Gemina AI.");
      setSelectedImage(null);
      setVisionPrompt('');
      setActiveTab('chat');
    } catch (err: any) {
      const errVisionMsg: ChatMessage = {
        id: `gemina-err-${Date.now()}`,
        sender: 'gemina',
        text: "Could not complete vision extraction. Please verify image clarity and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errVisionMsg]);
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  // Speech Recognition (STT)
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isVoiceActive) {
      setIsVoiceActive(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsVoiceActive(true);
      recognition.onend = () => setIsVoiceActive(false);
      recognition.onerror = () => setIsVoiceActive(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      setIsVoiceActive(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="gemina-ai-assistant-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-5xl h-[92vh] max-h-[860px] bg-[#0b0e11] text-[#d1d4dc] rounded-2xl border border-[#2a2e39] shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Top Status Bar matching Specification */}
        <div className="bg-[#1e222d] border-b border-[#2a2e39] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2962ff] to-[#7c3aed] flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base tracking-tight">
                  🤖 Gemina AI Assistant
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/40">
                  v2.0
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/60 hidden sm:inline">
                  Powered by DeepSeek
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                DeepSeek-V3 Reasoning Engine · Financial Analyst & Vision Extraction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Indicator + System Time */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0b0e11] border border-[#2a2e39] text-xs font-mono text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00bcd4] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00bcd4]"></span>
              </span>
              <span className="font-bold text-[#00bcd4]">LIVE</span>
              <span className="text-slate-500">|</span>
              <span>{currentTime}</span>
            </div>

            {/* TTS Audio Toggle */}
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              title={ttsEnabled ? "Disable AI Voice" : "Enable AI Voice"}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                ttsEnabled 
                  ? 'bg-[#121520] border-purple-500/40 text-purple-300' 
                  : 'bg-[#121520] border-[#2a2e39] text-slate-500'
              }`}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#121520] hover:bg-[#2a2e39] border border-[#2a2e39] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector Header */}
        <div className="bg-[#121520] border-b border-[#2a2e39] px-4 sm:px-6 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#2962ff] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e222d]'
              }`}
            >
              💬 DeepSeek Financial Chat
            </button>
            <button
              onClick={() => setActiveTab('vision')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'vision'
                  ? 'bg-[#7c3aed] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e222d]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Screenshot Vision Extraction</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Model: <span className="text-[#00bcd4] font-mono">deepseek-chat / vision-exp</span>
          </div>
        </div>

        {/* Modal Main Body (Split View or Tabbed Mode) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Chat Area (~70% on desktop) */}
          <div className={`flex-1 flex flex-col bg-[#0b0e11] overflow-hidden ${activeTab === 'vision' ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Quick Action Suggestion Pills */}
            <div className="px-4 py-2.5 bg-[#121520]/80 border-b border-[#2a2e39] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#00bcd4]" />
                Insights:
              </span>
              {[
                "Analyze XAUUSD structure",
                "Key S/R for EURUSD",
                "BTCUSD breakdown risk",
                "US30 momentum trend",
                "Prop Firm 1% risk rule"
              ].map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(query)}
                  className="px-2.5 py-1 rounded-md bg-[#1e222d] hover:bg-[#2a2e39] text-slate-300 hover:text-white border border-[#2a2e39] text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer"
                >
                  {query}
                </button>
              ))}
            </div>

            {/* Message History List */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2962ff] to-[#7c3aed] flex items-center justify-center text-white shrink-0 shadow-xs mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-[#2962ff] text-white rounded-tr-none'
                          : 'bg-[#1e222d] text-[#d1d4dc] border border-[#2a2e39] rounded-tl-none'
                      }`}
                    >
                      {/* Attached screenshot thumbnail if present */}
                      {msg.imageUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-white/20 max-h-48">
                          <img
                            src={msg.imageUrl}
                            alt="Uploaded Chart"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="whitespace-pre-wrap font-sans">
                        {msg.text}
                      </div>

                      <div className={`mt-2 text-[10px] text-right ${isUser ? 'text-blue-200' : 'text-slate-500'}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#1e222d] border border-[#2a2e39] flex items-center justify-center text-purple-400 shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-[#1e222d] text-slate-300 border border-[#2a2e39] rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#00bcd4] animate-ping" />
                    <span>Gemina AI is computing market structure with DeepSeek...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 bg-[#121520] border-t border-[#2a2e39]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isVoiceActive
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                      : 'bg-[#1e222d] hover:bg-[#2a2e39] text-slate-400 hover:text-white border-[#2a2e39]'
                  }`}
                  title="Voice Input"
                >
                  {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask Gemina AI about market trends, key levels, or strategy setups..."
                  disabled={isLoading}
                  className="flex-1 bg-[#1e222d] border border-[#2a2e39] focus:border-[#2962ff] text-white text-xs sm:text-sm rounded-xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="px-5 py-3 rounded-xl bg-[#2962ff] hover:bg-[#1e4bd8] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel: Screenshot Vision Analysis (~30% on desktop) */}
          <div className={`w-full md:w-80 lg:w-96 bg-[#121520] border-l border-[#2a2e39] p-4 sm:p-5 flex flex-col justify-between overflow-y-auto ${activeTab === 'chat' ? 'hidden md:flex' : 'flex'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39]">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#7c3aed]" />
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Screenshot Vision
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                  Vision API
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Upload any chart screenshot, order book, or watchlist. Gemina AI will parse all symbols, prices, percentage changes, and summarize market momentum.
              </p>

              {/* Upload Dropzone */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#7c3aed] bg-[#7c3aed]/10'
                    : 'border-[#2a2e39] hover:border-[#7c3aed]/60 bg-[#1e222d]'
                }`}
              >
                {selectedImage ? (
                  <div className="space-y-3">
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className="max-h-40 mx-auto rounded-lg object-contain border border-[#2a2e39]"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Image Ready for Analysis</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#121520] border border-[#2a2e39] flex items-center justify-center mx-auto text-[#7c3aed]">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-200">
                      Click to Upload Screenshot
                    </div>
                    <div className="text-[10px] text-slate-500">
                      PNG, JPG, GIF, WebP up to 10MB
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Custom Extraction Prompt */}
              {selectedImage && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Custom Prompt (Optional)
                  </label>
                  <input
                    type="text"
                    value={visionPrompt}
                    onChange={(e) => setVisionPrompt(e.target.value)}
                    placeholder="e.g. Focus on XAUUSD and key support zones..."
                    className="w-full bg-[#1e222d] border border-[#2a2e39] focus:border-[#7c3aed] text-white text-xs rounded-xl px-3 py-2 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#2a2e39] space-y-2">
              {selectedImage && (
                <button
                  type="button"
                  onClick={handleAnalyzeVision}
                  disabled={isAnalyzingVision}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#2962ff] hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  {isAnalyzingVision ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>DeepSeek Extracting Data...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run DeepSeek Vision Analysis</span>
                    </>
                  )}
                </button>
              )}

              {selectedImage && (
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="w-full py-2 rounded-xl bg-[#1e222d] hover:bg-[#2a2e39] text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Upload</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Aliases for seamless backward compatibility
export const TrishAssistantModal = GeminaAssistantModal;
export const StraddleAssistantModal = GeminaAssistantModal;
