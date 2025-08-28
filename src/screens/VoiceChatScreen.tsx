import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useVoiceChatStore} from '../stores/voiceChatStore';
import {ChatMessage, AIAgent} from '../types';
import ChatMessageWidget from '../components/ChatMessageWidget';
import VoiceButton from '../components/VoiceButton';
import AIService from '../services/AIService';
import VoiceService from '../services/VoiceService';

const VoiceChatScreen: React.FC = () => {
  const {
    messages,
    aiAgents,
    currentAgent,
    isRecording,
    isPlaying,
    isListening,
    currentMessage,
    addMessage,
    setCurrentAgent,
    setRecording,
    setPlaying,
    setListening,
    setCurrentMessage,
  } = useVoiceChatStore();

  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeAI();
    loadMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeAI = async () => {
    try {
      // 初始化AI代理
      const agents: AIAgent[] = [
        {
          id: '1',
          name: '小助手',
          avatar: '🤖',
          personality: '友好、专业、乐于助人',
          capabilities: ['回答问题', '提供建议', '情感支持'],
          isActive: true,
        },
      ];
      setCurrentAgent(agents[0]);
    } catch (error) {
      console.error('初始化AI失败:', error);
    }
  };

  const loadMessages = async () => {
    try {
      // 加载历史消息
      const historyMessages: ChatMessage[] = [
        {
          id: '1',
          senderId: 'ai',
          senderName: '小助手',
          content: '你好！我是你的AI助手，有什么可以帮助你的吗？',
          type: 'text',
          timestamp: new Date(),
          isRead: true,
        },
      ];
      // 这里应该从store中设置消息
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'user',
      senderName: '我',
      content: inputText,
      type: 'text',
      timestamp: new Date(),
      isRead: true,
    };

    addMessage(userMessage);
    setInputText('');

    // 发送到AI服务
    try {
      const aiResponse = await AIService.sendMessage(inputText);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: 'ai',
        senderName: currentAgent?.name || 'AI助手',
        content: aiResponse,
        type: 'text',
        timestamp: new Date(),
        isRead: false,
      };
      addMessage(aiMessage);
    } catch (error) {
      console.error('AI响应失败:', error);
      Alert.alert('错误', 'AI服务暂时不可用');
    }
  };

  const handleVoiceRecord = async () => {
    try {
      if (isRecording) {
        // 停止录音
        setRecording(false);
        const audioFile = await VoiceService.stopRecording();
        
        // 语音转文字
        const text = await VoiceService.speechToText(audioFile);
        if (text) {
          setInputText(text);
        }
      } else {
        // 开始录音
        setRecording(true);
        await VoiceService.startRecording();
      }
    } catch (error) {
      console.error('语音录制失败:', error);
      Alert.alert('错误', '语音录制失败');
      setRecording(false);
    }
  };

  const handleVoicePlay = async (message: ChatMessage) => {
    if (message.type === 'voice') {
      try {
        setPlaying(true);
        await VoiceService.playAudio(message.content);
      } catch (error) {
        console.error('播放失败:', error);
        Alert.alert('错误', '音频播放失败');
      } finally {
        setPlaying(false);
      }
    } else {
      // 文字转语音
      try {
        setPlaying(true);
        await VoiceService.textToSpeech(message.content);
      } catch (error) {
        console.error('TTS失败:', error);
        Alert.alert('错误', '语音合成失败');
      } finally {
        setPlaying(false);
      }
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      '紧急求助',
      '是否要拨打紧急求助电话？',
      [
        {text: '取消', style: 'cancel'},
        {text: '拨打', onPress: () => {
          // 实现紧急求助逻辑
          console.log('拨打紧急求助电话');
        }},
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {currentAgent?.name || 'AI助手'}
        </Text>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergencyCall}>
          <Text style={styles.emergencyButtonText}>紧急求助</Text>
        </TouchableOpacity>
      </View>

      {/* 消息列表 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}>
        {messages.map(message => (
          <ChatMessageWidget
            key={message.id}
            message={message}
            onVoicePlay={() => handleVoicePlay(message)}
            isPlaying={isPlaying}
          />
        ))}
      </ScrollView>

      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入消息..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}>
          <Text style={[styles.sendButtonText, !inputText.trim() && styles.sendButtonTextDisabled]}>
            发送
          </Text>
        </TouchableOpacity>
      </View>

      {/* 语音按钮 */}
      <View style={styles.voiceContainer}>
        <VoiceButton
          isRecording={isRecording}
          onPress={handleVoiceRecord}
          disabled={isPlaying}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emergencyButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  sendButtonTextDisabled: {
    color: '#ccc',
  },
  voiceContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
  },
});

export default VoiceChatScreen;
