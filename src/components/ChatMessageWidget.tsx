import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ChatMessage} from '../types';

interface ChatMessageWidgetProps {
  message: ChatMessage;
  onVoicePlay: () => void;
  isPlaying: boolean;
}

const ChatMessageWidget: React.FC<ChatMessageWidgetProps> = ({
  message,
  onVoicePlay,
  isPlaying,
}) => {
  const isUser = message.senderId === 'user';
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'voice':
        return (
          <TouchableOpacity
            style={[styles.voiceContent, isUser ? styles.userVoiceContent : styles.aiVoiceContent]}
            onPress={onVoicePlay}
            disabled={isPlaying}>
            <Icon
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={20}
              color={isUser ? 'white' : '#007AFF'}
            />
            <Text style={[styles.voiceText, isUser ? styles.userVoiceText : styles.aiVoiceText]}>
              {isPlaying ? '播放中...' : '点击播放'}
            </Text>
          </TouchableOpacity>
        );
      
      case 'image':
        return (
          <View style={[styles.imageContent, isUser ? styles.userImageContent : styles.aiImageContent]}>
            <Icon name="image" size={24} color={isUser ? 'white' : '#007AFF'} />
            <Text style={[styles.imageText, isUser ? styles.userImageText : styles.aiImageText]}>
              图片消息
            </Text>
          </View>
        );
      
      default:
        return (
          <Text style={[styles.textContent, isUser ? styles.userTextContent : styles.aiTextContent]}>
            {message.content}
          </Text>
        );
    }
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Icon name="android" size={20} color="#007AFF" />
          </View>
        </View>
      )}
      
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}>
        {!isUser && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}
        
        {renderMessageContent()}
        
        <View style={[styles.timeContainer, isUser ? styles.userTimeContainer : styles.aiTimeContainer]}>
          <Text style={styles.timeText}>{formatTime(message.timestamp)}</Text>
          {isUser && (
            <Icon
              name={message.isRead ? 'done-all' : 'done'}
              size={16}
              color={message.isRead ? '#4CAF50' : '#999'}
            />
          )}
        </View>
      </View>
      
      {isUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.userAvatar}>
            <Icon name="person" size={20} color="white" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    maxWidth: '70%',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 4,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userTextContent: {
    backgroundColor: '#007AFF',
    color: 'white',
    borderBottomRightRadius: 4,
  },
  aiTextContent: {
    backgroundColor: '#f0f0f0',
    color: '#333',
    borderBottomLeftRadius: 4,
  },
  voiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 120,
  },
  userVoiceContent: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  aiVoiceContent: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  voiceText: {
    marginLeft: 8,
    fontSize: 14,
  },
  userVoiceText: {
    color: 'white',
  },
  aiVoiceText: {
    color: '#333',
  },
  imageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 120,
  },
  userImageContent: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  aiImageContent: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  imageText: {
    marginLeft: 8,
    fontSize: 14,
  },
  userImageText: {
    color: 'white',
  },
  aiImageText: {
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  userTimeContainer: {
    justifyContent: 'flex-end',
    marginRight: 4,
  },
  aiTimeContainer: {
    justifyContent: 'flex-start',
    marginLeft: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ChatMessageWidget;
