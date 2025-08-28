import {create} from 'zustand';
import {ChatMessage, AIAgent} from '../types';

interface VoiceChatState {
  // 状态
  messages: ChatMessage[];
  aiAgents: AIAgent[];
  currentAgent: AIAgent | null;
  isRecording: boolean;
  isPlaying: boolean;
  isListening: boolean;
  currentMessage: string;
  
  // 操作
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  
  setAIAgents: (agents: AIAgent[]) => void;
  setCurrentAgent: (agent: AIAgent | null) => void;
  
  setRecording: (recording: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setListening: (listening: boolean) => void;
  setCurrentMessage: (message: string) => void;
  
  // 计算属性
  getMessagesBySender: (senderId: string) => ChatMessage[];
  getUnreadMessages: () => ChatMessage[];
  getLastMessage: () => ChatMessage | null;
}

export const useVoiceChatStore = create<VoiceChatState>((set, get) => ({
  // 初始状态
  messages: [],
  aiAgents: [],
  currentAgent: null,
  isRecording: false,
  isPlaying: false,
  isListening: false,
  currentMessage: '',
  
  // 消息操作
  setMessages: (messages) => set({messages}),
  addMessage: (message) =>
    set((state) => ({messages: [...state.messages, message]})),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map(m =>
        m.id === id ? {...m, ...updates} : m
      )
    })),
  clearMessages: () => set({messages: []}),
  
  // AI代理操作
  setAIAgents: (agents) => set({aiAgents: agents}),
  setCurrentAgent: (agent) => set({currentAgent: agent}),
  
  // 录音和播放状态
  setRecording: (recording) => set({isRecording: recording}),
  setPlaying: (playing) => set({isPlaying: playing}),
  setListening: (listening) => set({isListening: listening}),
  setCurrentMessage: (message) => set({currentMessage: message}),
  
  // 计算属性
  getMessagesBySender: (senderId) => {
    const {messages} = get();
    return messages.filter(m => m.senderId === senderId);
  },
  
  getUnreadMessages: () => {
    const {messages} = get();
    return messages.filter(m => !m.isRead);
  },
  
  getLastMessage: () => {
    const {messages} = get();
    return messages.length > 0 ? messages[messages.length - 1] : null;
  },
}));
