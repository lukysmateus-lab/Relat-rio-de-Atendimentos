import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  PenTool, 
  Download, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  CheckCircle, 
  School,
  User,
  Users,
  Clock,
  Phone,
  Mic // Imported Mic
} from 'lucide-react';
import { AttendanceData, RefinedContent, SignatureData } from './types';
import { refineReport } from './services/geminiService';
import { generatePDF } from './utils/pdfGenerator';
import SignaturePad from './components/SignaturePad';
import LiveAssistant from './components/LiveAssistant'; // Import LiveAssistant

const INITIAL_DATA: AttendanceData = {
  studentName: '',
  className: '',
  responsibleName: '',
  phone: '',
  requestedBy: 'Escola',
  reason: 'Acompanhamento Pedagógico',
  roughNotes: '',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
};

type Step = 'form' | 'review' | 'sign' | 'finish';
type SignatureRole = keyof SignatureData;

function App() {
  const [step, setStep] = useState<Step>('form');
  const [data, setData] = useState<AttendanceData>(INITIAL_DATA);
  const [refinedContent, setRefinedContent] = useState<RefinedContent | null>(null);
  const [signatures, setSignatures] = useState<SignatureData>({ 
    responsible: null, 
    soe: null,
    coord: null,
    aee: null,
    integral: null
  });
  const [activeSignatureTab, setActiveSignatureTab] = useState<SignatureRole>('responsible');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false); // State for voice modal

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleRefine = async () => {
    if (!data.roughNotes.trim() || !data.studentName) {
      setError("Por favor, preencha pelo menos o nome do aluno e as notas.");
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    try {
      const result = await refineReport(data);
      setRefinedContent(result);
      setStep('review');
    } catch (err) {
      setError("Falha ao conectar com a IA. Verifique sua chave de API ou tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (refinedContent) {
      generatePDF(data, refinedContent, signatures);
    }
  };

  const signatureTabs: { id: SignatureRole; label: string }[] = [
    { id: 'responsible', label: 'Responsável' },
    { id: 'soe', label: 'SOE' },
    { id: 'coord', label: 'Coordenação' },
    { id: 'aee', label: 'AEE' },
    { id: 'integral', label: 'Integral' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-xl">
            <School className="w-6 h-6" />
            <span>SOE Inteligente</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className={step === 'form' ? 'text-blue-600' : ''}>Dados</span>
            <ChevronRight size={14} />
            <span className={step === 'review' ? 'text-blue-600' : ''}>Revisão IA</span>
            <ChevronRight size={14} />
            <span className={step === 'sign' ? 'text-blue-600' : ''}>Assinaturas</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Step 1: Data Entry */}
        {step === 'form' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-800 border-b pb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Registro de Atendimento
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                {/* Identificação */}
                <div className="md:col-span-2">
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Identificação</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Estudante</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" name="studentName" value={data.studentName} onChange={handleInputChange}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-9 p-2 border"
                      placeholder="Nome completo"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Turma/Série</label>
                  <input 
                    type="text" name="className" value={data.className} onChange={handleInputChange}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                    placeholder="Ex: 9º Ano B"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" name="responsibleName" value={data.responsibleName} onChange={handleInputChange}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-9 p-2 border"
                      placeholder="Nome do Pai/Mãe/Tutor"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone(s)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" name="phone" value={data.phone} onChange={handleInputChange}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-9 p-2 border"
                      placeholder="(XX) 9XXXX-XXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                        <input 
                            type="date" name="date" value={data.date} onChange={handleInputChange}
                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                            <input 
                                type="time" name="time" value={data.time} onChange={handleInputChange}
                                className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-9 p-2 border"
                            />
                        </div>
                    </div>
                </div>

                {/* Contexto */}
                <div className="md:col-span-2 mt-2">
                   <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Contexto</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Solicitado por</label>
                  <select 
                    name="requestedBy" value={data.requestedBy} onChange={handleInputChange}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
                  >
                    <option value="Pais/Responsáveis">Pais / Responsáveis</option>
                    <option value="Educador(a)">Educador(a)</option>
                    <option value="Orientador(a) Educacional">Orientador(a) Educacional (SOE)</option>
                    <option value="Direção Pedagógica">Direção Pedagógica</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
                  <select 
                    name="reason" value={data.reason} onChange={handleInputChange}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
                  >
                    <option value="Acompanhamento Pedagógico">Acompanhamento Pedagógico</option>
                    <option value="Ocorrência Disciplinar">Ocorrência Disciplinar</option>
                    <option value="Coordenação Pedagógica">Coordenação Pedagógica</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Notas Brutas da Reunião
                    <span className="text-slate-400 text-xs font-normal ml-2">(Digite em tópicos ou use a voz)</span>
                  </label>
                  <button 
                    onClick={() => setShowVoiceAssistant(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <Mic size={14} />
                    Entrada por Voz
                  </button>
                </div>
                <textarea 
                  name="roughNotes" value={data.roughNotes} onChange={handleInputChange}
                  rows={8}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border font-mono text-sm"
                  placeholder="- mãe reclamou das notas de matemática&#10;- aluno diz que prof não explica bem&#10;- aluno muito agitado na cadeira&#10;- combinado: mãe vai acompanhar agenda&#10;- combinado: escola vai falar com professor"
                />
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end sticky bottom-6 z-20">
              <button 
                onClick={handleRefine}
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:translate-y-[-2px] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Revisar Texto
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 'review' && refinedContent && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-700">
                <Sparkles className="w-5 h-5" />
                Relatório Sugerido pela IA
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Relatório Formal</label>
                <textarea 
                  value={refinedContent.formalReport}
                  onChange={(e) => setRefinedContent({...refinedContent, formalReport: e.target.value})}
                  rows={15}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-4 border leading-relaxed text-justify text-slate-700 font-serif"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Encaminhamentos e Combinados</label>
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {refinedContent.agreements.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-blue-500 mt-2">•</span>
                      <textarea 
                        rows={2}
                        value={item}
                        onChange={(e) => {
                          const newAgreements = [...refinedContent.agreements];
                          newAgreements[idx] = e.target.value;
                          setRefinedContent({...refinedContent, agreements: newAgreements});
                        }}
                        className="flex-1 rounded border-slate-200 text-sm p-2 focus:border-blue-500 focus:outline-none border resize-none bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between sticky bottom-6 z-20">
              <button 
                onClick={() => setStep('form')}
                className="bg-white text-slate-600 px-6 py-3 rounded-full font-medium border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
              <button 
                onClick={() => setStep('sign')}
                className="bg-blue-700 text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-800 transition-all flex items-center gap-2"
              >
                Prosseguir para Assinaturas
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Signature */}
        {step === 'sign' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-800">
                <PenTool className="w-5 h-5 text-blue-600" />
                Coleta de Assinaturas
              </h2>

              <p className="text-slate-500 text-sm mb-6">Selecione quem irá assinar agora. Você pode coletar múltiplas assinaturas.</p>

              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Tabs */}
                <div className="flex md:flex-col gap-2 overflow-x-auto md:w-48 pb-2 md:pb-0">
                  {signatureTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSignatureTab(tab.id)}
                      className={`
                        flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                        ${activeSignatureTab === tab.id 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                          : 'bg-white text-slate-600 border border-transparent hover:bg-slate-50'
                        }
                      `}
                    >
                      {tab.label}
                      {signatures[tab.id] && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Pad Area */}
                <div className="flex-1 min-h-[300px] border border-slate-100 rounded-xl p-4 bg-slate-50">
                  {signatureTabs.map((tab) => (
                    <div key={tab.id} className={activeSignatureTab === tab.id ? 'block' : 'hidden'}>
                      <SignaturePad 
                        label={`Assinatura: ${tab.label}`} 
                        onSave={(img) => setSignatures(prev => ({ ...prev, [tab.id]: img }))} 
                      />
                      {signatures[tab.id] && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Assinatura capturada com sucesso!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between sticky bottom-6 z-20">
               <button 
                onClick={() => setStep('review')}
                className="bg-white text-slate-600 px-6 py-3 rounded-full font-medium border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
              <button 
                onClick={() => {
                    handleDownload();
                    setStep('finish');
                }}
                className="bg-green-600 text-white px-8 py-3 rounded-full font-medium shadow-lg shadow-green-500/30 hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Gerar PDF e Finalizar
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Finish */}
        {step === 'finish' && (
             <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500">
                 <div className="bg-green-100 p-8 rounded-full mb-6">
                    <CheckCircle className="w-20 h-20 text-green-600" />
                 </div>
                 <h2 className="text-3xl font-bold text-slate-800 mb-4">Sucesso!</h2>
                 <p className="text-slate-500 text-center max-w-md mb-10 text-lg">
                    O documento PDF foi gerado e o download iniciou.
                 </p>
                 <button 
                    onClick={() => {
                        setData(INITIAL_DATA);
                        setRefinedContent(null);
                        setSignatures({ responsible: null, soe: null, coord: null, aee: null, integral: null });
                        setStep('form');
                    }}
                    className="text-blue-600 font-semibold hover:text-blue-800 hover:underline flex items-center gap-2"
                 >
                    <ChevronLeft className="w-4 h-4" />
                    Iniciar Novo Atendimento
                 </button>
             </div>
        )}

        {/* Live Assistant Modal */}
        {showVoiceAssistant && (
            <LiveAssistant 
                onClose={() => setShowVoiceAssistant(false)}
                onInsertText={(text) => {
                    setData(prev => ({
                        ...prev,
                        roughNotes: prev.roughNotes ? prev.roughNotes + "\n" + text : text
                    }));
                    setShowVoiceAssistant(false);
                }}
            />
        )}

      </main>
    </div>
  );
}

export default App;