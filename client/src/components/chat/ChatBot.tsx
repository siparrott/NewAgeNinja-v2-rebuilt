import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  text: string;
  isUser: boolean;
  loading?: boolean;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hallo! Ich bin Alex von New Age Fotografie. Wie kann ich Ihnen heute helfen? 📸", isUser: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createThread = async (): Promise<string> => {
    const response = await fetch('/api/openai/chat/thread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data.threadId;
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText;
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInputText('');
    setIsLoading(true);

    // Add loading message
    setMessages(prev => [...prev, { text: "Alex schreibt...", isUser: false, loading: true }]);

    try {
      let currentThreadId = threadId;
      if (!currentThreadId) {
        currentThreadId = await createThread();
        setThreadId(currentThreadId);
      }

      const response = await fetch('/api/openai/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          threadId: currentThreadId
        })
      });

      const data = await response.json();

      // Remove loading message and add actual response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.loading);
        return [...filtered, { text: data.response || "Entschuldigung, ich konnte Ihre Anfrage nicht bearbeiten.", isUser: false }];
      });

      // Trigger lead capture after a few messages
      setTimeout(() => {
        triggerLeadCapture();
      }, 2000);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.loading);
        return [...filtered, { text: "Entschuldigung, es gab ein technisches Problem. Bitte kontaktieren Sie uns direkt unter 0677 633 99210.", isUser: false }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const saveLeadFromChat = async () => {
    try {
      const lastUserMessage = messages.filter(msg => msg.isUser).pop();
      const response = await fetch('/api/chat/save-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadFormData,
          message: lastUserMessage?.text || 'Chat conversation',
          conversation: messages
        })
      });

      if (response.ok) {
        setMessages(prev => [...prev, { 
          text: "Vielen Dank! Ihre Kontaktdaten wurden gespeichert. Wir melden uns bald bei Ihnen!", 
          isUser: false 
        }]);
        setShowLeadForm(false);
        setLeadFormData({ name: '', email: '', phone: '' });
      }
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  const triggerLeadCapture = () => {
    if (messages.filter(msg => msg.isUser).length >= 2) {
      setMessages(prev => [...prev, { 
        text: "Ich sehe Sie sind interessiert! Möchten Sie Ihre Kontaktdaten hinterlassen, damit wir Sie direkt kontaktieren können?", 
        isUser: false 
      }]);
      setShowLeadForm(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-semibold">Alex - Photo Consultant</h3>
                  <p className="text-purple-100 text-sm">New Age Fotografie Wien</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="h-96 flex flex-col">
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${message.isUser ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg max-w-[280px] ${
                        message.isUser
                          ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          {message.text}
                        </div>
                      ) : (
                        message.text
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {showLeadForm && (
                <div className="border-t p-4 bg-purple-50">
                  <h4 className="font-semibold text-purple-800 mb-3">Kontakt hinterlassen</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Ihr Name"
                      value={leadFormData.name}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border rounded text-sm"
                    />
                    <input
                      type="email"
                      placeholder="E-Mail"
                      value={leadFormData.email}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-2 border rounded text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Telefon (optional)"
                      value={leadFormData.phone}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-2 border rounded text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveLeadFromChat}
                        className="flex-1 bg-purple-600 text-white p-2 rounded text-sm hover:bg-purple-700"
                      >
                        Senden
                      </button>
                      <button
                        onClick={() => setShowLeadForm(false)}
                        className="px-4 bg-gray-300 text-gray-700 p-2 rounded text-sm hover:bg-gray-400"
                      >
                        Später
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="p-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 rounded-full shadow-lg hover:opacity-90 transition-opacity"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
};

export default ChatBot;