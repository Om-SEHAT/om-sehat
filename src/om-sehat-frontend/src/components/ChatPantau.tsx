import { useRef, useState, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import '../styles/chat-enhanced-v2.css'; // Updated to use the new enhanced styles
import { geminiChat } from '../utils/gemini';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  imageUrl?: string;
}

const ChatPantauWindow = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [placeholder, setPlaceholder] = useState('Ketik pesan Anda... (Ctrl+Enter untuk mengirim)');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom system instruction for Gemini Vision
  const SYSTEM_INSTRUCTION =
    'You are Om SAPA, an AI health assistant. If an image is provided, analyze it for medical context and respond in Bahasa Indonesia. If no image, answer as a health assistant.';

  // Scroll to bottom when messages change
  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  // Focus textarea when component mounts
  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 500);
  }, []);

  // Handle scroll position in messages container
  // useEffect(() => {
  //   const messagesContainer = messagesContainerRef.current;
  //   if (!messagesContainer) return;

  //   const handleScroll = () => {
  //     const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
  //     const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
  //     setShowScrollButton(!isNearBottom);
  //   };

  //   messagesContainer.addEventListener('scroll', handleScroll);
  //   return () => messagesContainer.removeEventListener('scroll', handleScroll);
  // }, []);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Create placeholders that change periodically
  useEffect(() => {
    const placeholders = [
      'Ketik pesan Anda... (Ctrl+Enter untuk mengirim)',
      'Tanyakan tentang gejala Anda...',
      'Bagaimana perasaan Anda hari ini?',
      'Ada pertanyaan kesehatan?'
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % placeholders.length;
      setPlaceholder(placeholders[index]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Initialize chat with welcome message when component mounts
  useEffect(() => {
    // For local testing, just show a static welcome message
    setMessages([
      {
        id: Date.now().toString(),
        text: "Halo! Selamat datang di Om Sapa. Silakan mulai percakapan.",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  }, []);

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !imageFile) return;

    // Create a blob URL for the image if present
    let imageUrl: string | undefined = undefined;
    if (imageFile) {
      imageUrl = URL.createObjectURL(imageFile);
    }

    // Add user message to chat (with imageUrl if present)
    const userMessage: Message & { imageUrl?: string } = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
      imageUrl,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    // Reset file input and image state immediately after sending
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    try {
      setIsTyping(true);
      // Pass system instruction to geminiChat
      const data = await geminiChat(
        [...messages, userMessage],
        imageFile,
        SYSTEM_INSTRUCTION
      );
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.text || 'No response from Gemini.',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle textarea input and auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Handle key presses in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Om SAPA</h2>
        <p>AI Asisten Kesehatan Profesional</p>
      </div>

      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.text}
            isUser={message.sender === 'user'}
            timestamp={message.timestamp}
            imageUrl={message.imageUrl || undefined}
          />
        ))}
        {(isLoading || isTyping) && (
          <div className="message bot-message">
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {showScrollButton && (
          <button
            className="scroll-to-bottom"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}
      </div>

      {/* Image preview if selected */}
      {imageFile && (
        <div className="flex items-center gap-2 mb-2">
          <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-16 h-16 object-cover rounded border" />
          <button onClick={handleRemoveImage} className="text-xs text-red-500 hover:underline">Hapus</button>
        </div>
      )}

      <div className="message-input-container flex items-end gap-2">
        <div className="message-textarea-wrapper flex-1">
          <textarea
            ref={textareaRef}
            className="message-textarea"
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
          />
        </div>
        {/* Image upload button */}
        <button
          type="button"
          className="p-2 rounded hover:bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center"
          onClick={handleImageButtonClick}
          title="Upload gambar"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 10-2.828-2.828z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
        <button
          className="send-button ml-2"
          onClick={handleSendMessage}
          disabled={(!newMessage.trim() && !imageFile) || isLoading}
          title="Kirim pesan"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};


// PatientData interface and mock data
interface PatientData {
  user: {
    id: string;
    name: string;
    email: string;
    gender: string;
    nationality: string;
    age: string;
  };
  current_session: {
    session_id: string;
    weight: number;
    height: number;
    heartrate: number;
    bodytemp: number;
    prediagnosis: string;
    doctor_diagnosis: string;
    created_at: string;
  };
  history_sessions: Array<{
    session_id: string;
    weight: number;
    height: number;
    heartrate: number;
    bodytemp: number;
    prediagnosis: string;
    doctor_diagnosis: string;
    created_at: string;
  }>;
}

const mockPatientData: PatientData = {
  user: {
    id: '1',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    gender: 'Laki-laki',
    nationality: 'Indonesia',
    age: '35',
  },
  current_session: {
    session_id: 'sess-123',
    weight: 70,
    height: 172,
    heartrate: 78,
    bodytemp: 36.7,
    prediagnosis: 'Demam ringan dan batuk.',
    doctor_diagnosis: '',
    created_at: '2025-06-28T10:00:00Z',
  },
  history_sessions: [
    {
      session_id: 'sess-122',
      weight: 70,
      height: 172,
      heartrate: 80,
      bodytemp: 36.5,
      prediagnosis: 'Sakit kepala ringan.',
      doctor_diagnosis: 'Migrain',
      created_at: '2025-06-20T09:00:00Z',
    },
    {
      session_id: 'sess-121',
      weight: 69,
      height: 172,
      heartrate: 76,
      bodytemp: 36.6,
      prediagnosis: 'Tidak ada keluhan.',
      doctor_diagnosis: 'Sehat',
      created_at: '2025-06-10T08:00:00Z',
    },
  ],
};

function PatientInfoPanel() {
  const [diagnosis, setDiagnosis] = useState(mockPatientData.current_session.doctor_diagnosis || '');
  const patientData = mockPatientData;
  return (
    <div className="patient-info mt-6 bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
      <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        Data Pasien Saat Ini
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="patient-detail-item">
          <div className="text-gray-500">Nama</div>
          <div className="font-medium text-gray-800">{patientData.user.name}</div>
        </div>
        <div className="patient-detail-item">
          <div className="text-gray-500">Gender</div>
          <div className="font-medium text-gray-800">{patientData.user.gender}</div>
        </div>
        <div className="patient-detail-item">
          <div className="text-gray-500">Usia</div>
          <div className="font-medium text-gray-800">{patientData.user.age}</div>
        </div>
        <div className="patient-detail-item">
          <div className="text-gray-500">Nationality</div>
          <div className="font-medium text-gray-800">{patientData.user.nationality}</div>
        </div>
      </div>
      <div className="mt-4">
        <h5 className="text-base font-medium text-gray-700 mb-2">Vital Signs</h5>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="patient-vital-item">
            <div className="text-gray-500">Berat Badan</div>
            <div className="font-medium text-gray-800">{patientData.current_session.weight} kg</div>
          </div>
          <div className="patient-vital-item">
            <div className="text-gray-500">Tinggi Badan</div>
            <div className="font-medium text-gray-800">{patientData.current_session.height} cm</div>
          </div>
          <div className="patient-vital-item">
            <div className="text-gray-500">Detak Jantung</div>
            <div className="font-medium text-gray-800">{patientData.current_session.heartrate} bpm</div>
          </div>
          <div className="patient-vital-item">
            <div className="text-gray-500">Suhu Tubuh</div>
            <div className="font-medium text-gray-800">{patientData.current_session.bodytemp}°C</div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h5 className="text-base font-medium text-gray-700 mb-2">Pre-Diagnosis</h5>
        <div className="bg-gray-50 p-3 rounded text-gray-800 text-sm border border-gray-100">
          {patientData.current_session.prediagnosis || "Tidak ada pre-diagnosis"}
        </div>
      </div>
      <div className="mt-4">
        <h5 className="text-base font-medium text-gray-700 mb-2">Diagnosis Dokter</h5>
        <div className="diagnosis-input-container">
          <textarea
            className="diagnosis-input w-full p-3 rounded bg-white text-gray-800 text-sm border border-blue-200"
            placeholder="Masukkan diagnosis untuk pasien ini..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

const ChatPantau = () => {
  return (
    <div
      className="flex flex-row min-h-screen h-full max-w-4xl mx-auto px-4 md:px-6 lg:px-0 w-full md:w-[90vw] lg:w-[70vw]"
    >
      <div className="flex-shrink-0 flex-grow-0 basis-2/6 min-w-0 bg-transparent hidden md:block pt-6 pr-5">
        <PatientInfoPanel />
      </div>
      <div className="flex flex-col flex-grow basis-4/6 min-w-0 w-full md:w-auto">
        <ChatPantauWindow />
      </div>
      {/* Responsive: show patient info above chat on mobile */}
      <div className="block md:hidden w-full pt-4">
        <PatientInfoPanel />
      </div>
    </div>
  );
}

export default ChatPantau;