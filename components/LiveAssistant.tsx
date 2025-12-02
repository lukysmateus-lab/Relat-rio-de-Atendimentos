import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, MessageSquare, Loader2, Sparkles, StopCircle } from 'lucide-react';
import { LiveClient } from '../services/liveClient';

interface LiveAssistantProps {
  onClose: () => void;
  onInsertText: (text: string) => void;
}

interface TranscriptItem {
  text: string;
  isUser: boolean;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose, onInsertText }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'disconnected'>('idle');
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const clientRef = useRef<LiveClient | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize client
    clientRef.current = new LiveClient();
    startSession();

    return () => {
      clientRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const startSession = async () => {
    if (!clientRef.current) return;
    setStatus('connecting');
    await clientRef.current.connect(
      (text, isUser) => {
        setTranscripts(prev => {
          if (!text.trim()) return prev;
          
          // Combine partials if needed, or just append
          // Basic logic: if same speaker, append to last bubble? 
          // For simplicity here, we append new items.
          return [...prev, { text, isUser }];
        });
      },
      (newStatus) => {
        if (newStatus === 'disconnected' && status !== 'error') {
            // normal disconnect
        }
        setStatus(newStatus);
      }
    );
  };

  const handleStop = () => {
    clientRef.current?.disconnect();
    onClose();
  };

  const handleInsert = () => {
    // Aggregate only the user's speech to insert into notes
    const userText = transcripts
        .filter(t => t.isUser)
        .map(t => t.text)
        .join(' ');
    
    if (userText) {
        onInsertText(userText);
    }
    handleStop();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[80vh] md:h-[600px]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Assistente de Voz IA</h3>
          </div>
          <button onClick={handleStop} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Status Bar */}
        <div className={`p-2 text-xs text-center font-medium ${
            status === 'connected' ? 'bg-green-100 text-green-700' :
            status === 'connecting' ? 'bg-blue-100 text-blue-700' :
            status === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
        }`}>
            {status === 'connected' && '● Conectado - Pode falar'}
            {status === 'connecting' && 'Conectando ao Gemini...'}
            {status === 'error' && 'Erro de conexão'}
            {status === 'idle' && 'Aguardando...'}
            {status === 'disconnected' && 'Desconectado'}
        </div>

        {/* Transcript Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
           {transcripts.length === 0 && status === 'connected' && (
               <div className="flex flex-col items-center justify-center h-full text-slate-400">
                   <Mic className="w-12 h-12 mb-3 opacity-20 animate-pulse" />
                   <p>Descreva o atendimento...</p>
                   <p className="text-xs mt-1 opacity-70">Eu vou transcrever suas notas.</p>
               </div>
           )}
           {transcripts.map((t, i) => (
             <div key={i} className={`flex ${t.isUser ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                 t.isUser 
                 ? 'bg-blue-600 text-white rounded-tr-none' 
                 : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none'
               }`}>
                 {t.text}
               </div>
             </div>
           ))}
           {status === 'connecting' && (
             <div className="flex justify-center py-4">
               <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
             </div>
           )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center gap-3">
           <button 
             onClick={handleStop}
             className="px-4 py-2.5 rounded-full border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
           >
             Cancelar
           </button>
           
           <button 
             onClick={handleInsert}
             disabled={transcripts.filter(t => t.isUser).length === 0}
             className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
           >
             <MessageSquare size={16} />
             Inserir Transcrição nas Notas
           </button>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;