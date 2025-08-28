import React, {useEffect, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface VoiceButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({
  isRecording,
  onPress,
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // 开始录音时的动画
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 脉冲动画
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      // 停止录音时的动画
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording, scaleAnim, pulseAnim]);

  const getButtonIcon = () => {
    if (disabled) return 'mic-off';
    if (isRecording) return 'stop';
    return 'mic';
  };

  const getButtonColor = () => {
    if (disabled) return '#ccc';
    if (isRecording) return '#ff3b30';
    return '#007AFF';
  };

  const getButtonText = () => {
    if (disabled) return '不可用';
    if (isRecording) return '停止录音';
    return '按住录音';
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [
              {scale: scaleAnim},
              {scale: isRecording ? pulseAnim : 1},
            ],
          },
        ]}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: getButtonColor(),
            },
            disabled && styles.disabledButton,
          ]}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.8}>
          <Icon name={getButtonIcon()} size={32} color="white" />
        </TouchableOpacity>
      </Animated.View>
      
      <Text style={[styles.buttonText, disabled && styles.disabledText]}>
        {getButtonText()}
      </Text>
      
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>录音中...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  buttonContainer: {
    marginBottom: 8,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  disabledText: {
    color: '#999',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff3b30',
    borderRadius: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  recordingText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
});

export default VoiceButton;
