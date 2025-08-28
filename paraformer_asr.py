import os
import sys
import io
import time
import wave
import numpy as np
import torch
import pyaudio
from modelscope.pipelines import pipeline
from modelscope.utils.constant import Tasks
if sys.platform == "win32":
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
device = "cuda:0" if torch.cuda.is_available() else "cpu"
print(f"使用设备: {device.upper()}")
model_name = 'iic/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-pytorch'
print(f"加载模型: {model_name}...")
try:
    asr_pipeline = pipeline(
        task=Tasks.auto_speech_recognition,
        model=model_name,
        device=device
    )
    print("模型加载成功!")
except Exception as e:
    print(f"模型加载失败: {str(e)}")
    sys.exit(1)
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 1024
SILENCE_THRESHOLD = 500
SILENCE_DURATION = 1.5
MIN_SPEECH_DURATION = 0.5
def record_audio(duration=None):
    try:
        p = pyaudio.PyAudio()
        stream = p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK
        )
        frames = []
        silent_chunks = 0
        speech_detected = False
        start_time = time.time()
        print("\n开始录�?.. (按Ctrl+C停止)")
        try:
            while True:
                data = stream.read(CHUNK)
                frames.append(data)
                audio_data = np.frombuffer(data, dtype=np.int16)
                rms = np.sqrt(np.mean(audio_data ** 2))
                if rms > SILENCE_THRESHOLD:
                    silent_chunks = 0
                    speech_detected = True
                else:
                    silent_chunks += 1
                level = min(int(rms / 50), 50)
                print(f"\r音频电平: [{'�? * level}{' ' * (50 - level)}]", end='', flush=True)
                if duration is not None and (time.time() - start_time) >= duration:
                    break
                if duration is None and speech_detected:
                    if silent_chunks > SILENCE_DURATION * (RATE / CHUNK):
                        break
                    if (time.time() - start_time) < MIN_SPEECH_DURATION:
                        silent_chunks = 0
        except KeyboardInterrupt:
            print("\n用户中断录制")
        finally:
            print("\n停止录音")
            stream.stop_stream()
            stream.close()
            p.terminate()
            if len(frames) == 0:
                print("录音为空，跳过保�?)
                return None, 0
            temp_file = "temp_recording.wav"
            wf = wave.open(temp_file, 'wb')
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(p.get_sample_size(FORMAT))
            wf.setframerate(RATE)
            wf.writeframes(b''.join(frames))
            wf.close()
            record_duration = time.time() - start_time
            if record_duration < 0.5:
                print(f"录音过短({record_duration:.2f}�?，请重试")
                try:
                    os.remove(temp_file)
                except:
                    pass
                return None, 0
            return temp_file, record_duration
    except Exception as e:
        print(f"录音失败: {str(e)}")
        return None, 0
def transcribe_audio(audio_path):
    if not audio_path or not os.path.exists(audio_path):
        return None, 0
    try:
        start_time = time.time()
        result = asr_pipeline(audio_in=audio_path, param_dict={"decoding_model": "normal"})
        text = result.get('text', '')
        elapsed = time.time() - start_time
        return text, elapsed
    except Exception as e:
        print(f"识别错误: {str(e)}")
        return None, 0
def real_time_asr():
    print("=" * 70)
    print(f"{'中文实时语音识别系统':^70}")
    print(f"{'基于Paraformer模型':^70}")
    print(f"{'按回车开始录音，按Ctrl+C退出系�?:^70}")
    print("=" * 70)
    try:
        while True:
            try:
                input("按回车键开始说�?..")
            except UnicodeDecodeError:
                if hasattr(sys.stdin, 'buffer') and hasattr(sys.stdin.buffer, 'in_waiting'):
                    sys.stdin.buffer.read(sys.stdin.buffer.in_waiting)
                print("输入编码问题，请重试...")
                continue
            audio_file, record_duration = record_audio()
            if not audio_file:
                print("录音失败，请重试")
                continue
            print("开始识�?..")
            transcription, process_time = transcribe_audio(audio_file)
            rtf = process_time / record_duration if record_duration > 0 else 0
            print("\n" + "=" * 70)
            print(f"录音时长: {record_duration:.2f}�?)
            print(f"处理时间: {process_time:.2f}�?(RTF: {rtf:.2f})")
            print(f"识别结果:")
            print("-" * 70)
            print(transcription if transcription else "未识别到有效内容")
            print("=" * 70)
            try:
                os.remove(audio_file)
            except:
                pass
            if device.startswith('cuda'):
                mem_used = torch.cuda.memory_allocated(0) / 1024 ** 2
                mem_total = torch.cuda.get_device_properties(0).total_memory / 1024 ** 2
                print(f"GPU内存使用: {mem_used:.2f}/{mem_total:.2f} MB")
            print("\n准备下一次识�?..\n")
    except KeyboardInterrupt:
        print("\n退出系�?)
if __name__ == "__main__":
    real_time_asr()
