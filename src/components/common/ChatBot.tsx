import React, { useState, useRef, useEffect } from 'react';
import { useKioskI18n } from '@/components/layouts/KioskLayout';
import { toast } from 'sonner';

const SYSTEM_PROMPT = 
  "You are the 'AI सहायक' (AI Assistant) for 'Smart Janseva', the Government of India Digital Services portal. " +
  "Your primary goal is to help users navigate the Smart Janseva portal, explain how to apply for services (like water, electricity, ration card, certificates), " +
  "pay bills, track complaints, and follow instructions. " +
  "DO NOT answer general knowledge questions. If a user asks something unrelated to Smart Janseva, politely redirect them to ask about " +
  "services, bills, or complaints on the platform. Keep your answers clear, concise, step-by-step, and in the language the user prefers. " +
  "If a user uploads an image, analyze it and provide relevant information about Smart Janseva services or documents.";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Optional image URL for user messages
}

export default function ChatBot({
  open,
  onClose,
  messages: externalMessages,
  setMessages: setExternalMessages,
}: {
  open: boolean;
  onClose: () => void;
  messages?: ChatMessage[];
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}) {
  const { t } = useKioskI18n();
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messages = externalMessages || localMessages;
  const setMessages = setExternalMessages || setLocalMessages;
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Hello! I am your AI Assistant (AI सहायक) for Smart Janseva. How can I help you navigate the services or resolve an issue today? You can also upload images of documents or forms for assistance.',
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 4MB for API compatibility)
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image size should be less than 4MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setSelectedImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to convert image to base64 and create a text representation
  const imageToText = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // For now, we'll just indicate that an image was uploaded
        // In a production environment, you might want to use a vision API
        resolve(`[Image uploaded: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)]`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImageFile) || isLoading) return;

    const userMessage = input.trim() || "Please analyze this image";
    const messageId = Date.now().toString() + Math.random().toString();
    
    // Create user message with image preview if available
    const userChatMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: userMessage,
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userChatMessage]);
    
    // Store input and image for API call
    const currentInput = input.trim();
    const currentImageFile = selectedImageFile;
    
    setInput('');
    clearSelectedImage();
    setIsLoading(true);

    try {
      // Prepare the message content
      let finalUserMessage = currentInput;
      
      // If there's an image, append image info to the message
      if (currentImageFile) {
        const imageInfo = await imageToText(currentImageFile);
        finalUserMessage = finalUserMessage 
          ? `${finalUserMessage}\n\n${imageInfo}`
          : imageInfo;
      }

      const chatHistory = messages
        .filter((m) => m.id !== '1')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

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
            ...chatHistory,
            { role: 'user', content: finalUserMessage },
          ],
          temperature: 0.5,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`Grok API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response format');
      }

      const text = data.choices[0].message.content;

      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now().toString() + Math.random().toString(), 
          role: 'assistant', 
          content: text 
        },
      ]);
    } catch (error) {
      console.error('Grok API Error:', error);
      
      // More specific error message
      let errorMessage = 'AI Service is currently unavailable. Please try again later.';
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          errorMessage = 'The image format is not supported. Please try a different image or ask your question without an image.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication error. Please check API configuration.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        }
      }
      
      toast.error(errorMessage);
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + Math.random().toString(),
          role: 'assistant',
          content: currentImageFile 
            ? 'Sorry, I encountered an error processing your image. You can try asking your question without an image, or try a different image format (JPG or PNG recommended).'
            : 'Sorry, I encountered an error processing your request. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-[80px] right-6 z-[2000] w-[340px] flex flex-col rounded-xl shadow-2xl overflow-hidden bg-white border" style={{ borderColor: 'rgba(14,13,11,.09)', maxHeight: '480px' }}>
      {/* Header */}
      <div className="p-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#0e5e65 0%,#1b8f99 100%)' }}>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-[0.7rem]">AI</div>
          <div>
            <div className="text-white font-extrabold text-[0.85rem]">AI सहायक</div>
            <div className="text-white/80 font-bold text-[0.6rem] tracking-wider uppercase">Smart Janseva</div>
          </div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1" aria-label={t('close')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 p-3 overflow-y-auto bg-[#fafaf9] flex flex-col gap-3" style={{ minHeight: '250px', maxHeight: '320px' }}>
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col max-w-[90%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
            {m.image && m.role === 'user' && (
              <div className="mb-1 self-end">
                <img 
                  src={m.image} 
                  alt="Uploaded" 
                  className="max-w-[150px] max-h-[150px] rounded-lg border border-gray-200 shadow-sm"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className={`${m.role === 'user' ? 'bg-[#cc5500] text-white' : 'bg-white text-[#0e0d0b] border border-[#e5e5e5]'} rounded-[12px] px-3 py-1.5 text-[0.8rem] font-semibold leading-relaxed shadow-sm break-words`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="self-start bg-white border border-[#e5e5e5] rounded-[12px] px-3 py-2 flex gap-1 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1b8f99] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#1b8f99] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#1b8f99] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
          <div className="relative">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="w-10 h-10 object-cover rounded-lg border border-gray-300"
            />
            <button
              onClick={clearSelectedImage}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
              type="button"
            >
              ×
            </button>
          </div>
          <span className="text-xs text-gray-600">Image ready to upload</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-2 border-t bg-white flex items-center gap-2" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
          disabled={isLoading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or upload image..."
          className="flex-1 min-w-0 bg-[#f5f1ea] rounded-[10px] px-3 py-2 text-[0.8rem] font-medium outline-none border border-transparent focus:border-[#1b8f99] transition-colors"
          style={{ color: '#0e0d0b' }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={(!input.trim() && !selectedImageFile) || isLoading}
          className="w-8 h-8 rounded-[10px] bg-[#0e0d0b] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-opacity hover:bg-gray-800"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}