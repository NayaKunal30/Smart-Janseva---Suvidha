import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceAssistantProps {
  onSendMessage: (msg: string) => void;
  onReceiveResponse: (msg: string) => void;
}

const SYSTEM_PROMPT = 
  "You are the 'AI सहायक' (AI Assistant) for 'Smart Janseva', the Government of India Digital Services portal. " +
  "Your primary goal is to help users navigate the Smart Janseva portal, explain how to apply for services (like water, electricity, ration card, certificates), " +
  "pay bills, track complaints, and follow instructions. " +
  "DO NOT answer general knowledge questions. Keep your answers clear, concise, step-by-step, and in the language the user prefers.";

export default function VoiceAssistant({ onSendMessage, onReceiveResponse }: VoiceAssistantProps) {
  const { isSpeaking, setIsSpeaking } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const callbacksRef = useRef({ onSendMessage, onReceiveResponse, setIsSpeaking });
  useEffect(() => {
    callbacksRef.current = { onSendMessage, onReceiveResponse, setIsSpeaking };
  }, [onSendMessage, onReceiveResponse, setIsSpeaking]);

  const initRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onresult = async (event: any) => {
          const text = event.results[0][0].transcript;
          callbacksRef.current.onSendMessage(text);

          try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${import.meta.env.VITE_GROK_API_KEY || ''}`,
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  { role: 'user', content: text },
                ],
                temperature: 0.5,
                max_tokens: 1024,
              }),
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            const reply = data.choices[0].message.content;
            
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              callbacksRef.current.setIsSpeaking(false);
              const cleanTextForSpeech = reply.replace(/[*#`_]/g, '');
              const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech);
              utterance.lang = 'en-IN'; 
              utterance.onstart = () => callbacksRef.current.setIsSpeaking(true);
              utterance.onend = () => callbacksRef.current.setIsSpeaking(false);
              utterance.onerror = () => callbacksRef.current.setIsSpeaking(false);
              window.speechSynthesis.speak(utterance);
            }
            callbacksRef.current.onReceiveResponse(reply);
          } catch (error) {
            console.error('Voice Assistant API Error:', error);
            callbacksRef.current.onReceiveResponse("Sorry, I encountered an error processing your voice request.");
            callbacksRef.current.setIsSpeaking(false);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            toast.error("Microphone error: " + event.error);
          }
        };

        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        return recognition;
      }
    }
    return null;
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    const recognition = initRecognition();
    if (!recognition) {
      toast.error('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error("speech error", e);
      }
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <div className="flex items-center gap-2">
      {isSpeaking && (
        <button
          type="button"
          onClick={stopSpeaking}
          className="rounded-xl flex items-center justify-center transition-all bg-orange-50 hover:bg-orange-100"
          style={{
            border: '1.5px solid rgba(204,85,0,.3)',
            boxShadow: '0 4px 18px rgba(14,13,11,.05)',
            height: '48px',
            width: '48px',
          }}
          title="Stop Assistant Voice"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#cc5500' }}>
            <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
          </svg>
        </button>
      )}
      
        <button
          type="button"
          onClick={toggleListening}
          className={`rounded-xl flex items-center justify-center transition-all ${isListening ? 'animate-pulse scale-105' : 'hover:scale-105'}`}
          style={{
            background: isListening ? '#fef2f2' : 'white',
            border: `2px solid ${isListening ? '#ef4444' : 'rgba(14,13,11,.09)'}`,
            boxShadow: '0 8px 32px rgba(14,13,11,.08)',
            height: '40px',
            width: '40px',
          }}
          title="Voice Input (AI सहायक)"
        >
          {isListening ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          ) : (
            <svg width="24" height="24" viewBox="0 0 47.964 47.965" fill="currentColor" style={{ color: '#0e0d0b' }}>
              <path d="M23.982,35.268c5.531,0,10.033-4.635,10.033-10.332V10.333C34.015,4.635,29.513,0,23.982,0 c-5.532,0-10.032,4.635-10.032,10.333v14.604C13.951,30.633,18.451,35.268,23.982,35.268z M29.22,24.938 c0,2.974-2.35,5.395-5.238,5.395s-5.238-2.42-5.238-5.395V10.333c0-2.974,2.35-5.395,5.238-5.395s5.238,2.42,5.238,5.395V24.938z" />
              <path d="M40.125,29.994c0-1.361-1.222-2.469-2.72-2.469c-1.5,0-2.721,1.107-2.721,2.469c0,4.042-3.621,7.329-8.074,7.329h-5.257 c-4.453,0-8.074-3.287-8.074-7.329c0-1.361-1.221-2.469-2.721-2.469c-1.499,0-2.719,1.107-2.719,2.469 c0,6.736,6.014,12.221,13.424,12.266v0.766h-5.944c-1.499,0-2.72,1.107-2.72,2.47s1.221,2.47,2.72,2.47h17.325 c1.5,0,2.721-1.107,2.721-2.47s-1.221-2.47-2.721-2.47h-5.942V42.26C34.111,42.215,40.125,36.73,40.125,29.994z"/>
            </svg>
          )}
        </button>
    </div>
  );
}
