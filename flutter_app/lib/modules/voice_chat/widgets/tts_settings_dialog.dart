import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/ai_provider.dart';
import '../models/ai_models.dart';

class TTSSettingsDialog extends StatefulWidget {
  const TTSSettingsDialog({Key? key}) : super(key: key);

  @override
  State<TTSSettingsDialog> createState() => _TTSSettingsDialogState();
}

class _TTSSettingsDialogState extends State<TTSSettingsDialog> {
  @override
  void initState() {
    super.initState();
    
      context.read<AIProvider>().initializeTTSVoices();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        width: double.maxFinite,
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '语音合成设置',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            
            Consumer<AIProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '选择发音�?,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 120,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: provider.ttsVoices.length,
                        itemBuilder: (context, index) {
                          final voice = provider.ttsVoices[index];
                          final isSelected = provider.selectedVoice?.id == voice.id;
                          
                          return GestureDetector(
                            onTap: () => provider.selectVoice(voice),
                            child: Container(
                              width: 100,
                              margin: const EdgeInsets.only(right: 12),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.blue.shade100 : Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(12),
                                border: isSelected 
                                  ? Border.all(color: Colors.blue, width: 2)
                                  : null,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    voice.gender == 'female' ? Icons.person : Icons.person_outline,
                                    color: isSelected ? Colors.blue : Colors.grey,
                                    size: 24,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    voice.name,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      color: isSelected ? Colors.blue : Colors.black87,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                );
              },
            ),
            
            const SizedBox(height: 20),
            
            
              builder: (context, provider, child) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          '语�?,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '${provider.ttsSpeed}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    Slider(
                      value: provider.ttsSpeed.toDouble(),
                      min: 0,
                      max: 9,
                      divisions: 9,
                      onChanged: (value) {
                        provider.updateTTSSettings(speed: value.toInt());
                      },
                    ),
                    const SizedBox(height: 16),
                    
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          '音调',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '${provider.ttsPitch}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    Slider(
                      value: provider.ttsPitch.toDouble(),
                      min: 0,
                      max: 9,
                      divisions: 9,
                      onChanged: (value) {
                        provider.updateTTSSettings(pitch: value.toInt());
                      },
                    ),
                    const SizedBox(height: 16),
                    
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          '音量',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '${provider.ttsVolume}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    Slider(
                      value: provider.ttsVolume.toDouble(),
                      min: 0,
                      max: 15,
                      divisions: 15,
                      onChanged: (value) {
                        provider.updateTTSSettings(volume: value.toInt());
                      },
                    ),
                  ],
                );
              },
            ),
            
            const SizedBox(height: 20),
            
            
            Consumer<AIProvider>(
              builder: (context, provider, child) {
                return SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: provider.isProcessing 
                      ? null 
                      : () async {
                          final audioUrl = await provider.textToSpeech('这是一条测试语音，用于验证语音合成设置�?);
                          if (audioUrl != null) {
                            
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('语音合成成功�?)),
                            );
                          }
                        },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: provider.isProcessing
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('测试语音合成'),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
} 
