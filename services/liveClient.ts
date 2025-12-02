import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Audio encoding/decoding helpers
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export class LiveClient {
  private ai: GoogleGenAI;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private sessionPromise: Promise<any> | null = null;
  private isActive = false;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(
    onTranscription: (text: string, isUser: boolean) => void,
    onStatusChange: (status: 'connected' | 'disconnected' | 'error') => void
  ) {
    try {
      // Input: 16kHz for speech recognition
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Output: 24kHz for playback
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          // System instruction to guide the AI to act as a helper for taking notes
          systemInstruction: "Você é um assistente escolar que ajuda a registrar atendimentos. Ouça o relato do orientador, faça perguntas breves se algo não estiver claro, e ajude a organizar as ideias. Seja conciso.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      };

      this.sessionPromise = this.ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            onStatusChange('connected');
            this.isActive = true;
            this.startAudioInput(stream);
          },
          onmessage: async (message: LiveServerMessage) => {
             this.handleMessage(message, onTranscription);
          },
          onclose: () => {
            onStatusChange('disconnected');
            this.isActive = false;
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            onStatusChange('error');
            this.isActive = false;
          }
        }
      });

    } catch (error) {
      console.error("Connection failed", error);
      onStatusChange('error');
    }
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.inputContext || !this.sessionPromise) return;

    this.source = this.inputContext.createMediaStreamSource(stream);
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isActive) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const int16Data = float32ToInt16(inputData);
      const base64Data = arrayBufferToBase64(int16Data.buffer);

      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Data
          }
        });
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage, onTranscription: (text: string, isUser: boolean) => void) {
    // Handle Audio Output
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputContext) {
      const audioBytes = base64ToUint8Array(audioData);
      const audioBuffer = await this.decodeAudioData(audioBytes, this.outputContext);
      
      this.playAudio(audioBuffer);
    }

    // Handle Transcriptions
    const userTranscript = message.serverContent?.inputTranscription?.text;
    if (userTranscript) {
      onTranscription(userTranscript, true);
    }

    const modelTranscript = message.serverContent?.outputTranscription?.text;
    if (modelTranscript) {
       onTranscription(modelTranscript, false);
    }
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const int16 = new Int16Array(data.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
    }
    
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    return buffer;
  }

  private playAudio(buffer: AudioBuffer) {
    if (!this.outputContext) return;

    const source = this.outputContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputContext.destination);
    
    const currentTime = this.outputContext.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
  }

  disconnect() {
    this.isActive = false;
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.inputContext) {
      this.inputContext.close();
      this.inputContext = null;
    }
    if (this.outputContext) {
      this.outputContext.close();
      this.outputContext = null;
    }
    // Attempt to close session handled by cutting connection on refresh/close
  }
}