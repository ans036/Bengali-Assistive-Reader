import os, io, torch, numpy as np
import re
from TTS.utils.synthesizer import Synthesizer
from scipy.io.wavfile import write as scipy_wav_write
import wave, contextlib

# Global sampling rate for TTS output
DEFAULT_SAMPLING_RATE = 22050

class TextToSpeechEngine:
    def __init__(self, models):
        self.models = models

    def infer_from_text(self, input_text, lang, speaker_name):
        synthesizer = self.models.get(lang)
        if synthesizer is None:
            raise ValueError(f"No synthesizer found for language: {lang}")
        # Generate the waveform using the TTS engine.
        return synthesizer.tts(input_text, speaker_name=speaker_name)

def init_tts_engine():
    os.makedirs('models/v1/bn/fastpitch/', exist_ok=True)
    lang = "bn"
    device = "cuda" if torch.cuda.is_available() else "cpu"
    bn_model = Synthesizer(
        tts_checkpoint="models/v1/bn/fastpitch/best_model_fp.pth",
        tts_config_path="models/config_fp.json",
        tts_speakers_file="models/v1/bn/fastpitch/speakers.pth",
        tts_languages_file=None,
        vocoder_checkpoint="models/v1/bn/hifigan/best_model.pth",
        vocoder_config="models/config.json",
        use_cuda=device == "cuda",
    )
    bn_model.tts_model.to(device)
    if hasattr(bn_model, "vocoder"):
        bn_model.vocoder.to(device)
    elif hasattr(bn_model, "vocoder_model"):
        bn_model.vocoder_model.to(device)
    if bn_model.speaker_manager is not None and bn_model.speaker_manager.embedding_function is not None:
        bn_model.speaker_manager.embedding_function.to(device)
    models = {lang: bn_model}
    return TextToSpeechEngine(models)

def convert_digits_to_bengali(txt):
    mapping = {
        "0": "০",
        "1": "১",
        "2": "২",
        "3": "৩",
        "4": "৪",
        "5": "৫",
        "6": "৬",
        "7": "৭",
        "8": "৮",
        "9": "৯"
    }
    for en_digit, bn_digit in mapping.items():
        txt = txt.replace(en_digit, bn_digit)
    return txt

def sanitize_text(txt):
    # Replace newlines with space and remove extra spaces
    txt = " ".join(txt.replace("\n", " ").split())
    # Remove underscores (which are not in the vocabulary)
    txt = txt.replace("_", "")
    # Convert any English digits to Bengali digits
    txt = convert_digits_to_bengali(txt)
    return txt

def generate_word_level_tts(paragraphs, tts_engine, base_folder="tts_word_segments"):
    """
    Processes each sentence in every paragraph:
      - Sanitizes the sentence text.
      - Generates the TTS WAV file.
      - Splits the sentence into words.
      - Computes word-level timing relative to the sentence duration.
    """
    if not os.path.exists(base_folder):
        os.makedirs(base_folder)
    sentence_meta = []
    global_sentence_index = 0
    for p_obj in paragraphs:
        p_idx = p_obj['paragraph_idx']
        for s_obj in p_obj['sentences']:
            s_idx = s_obj["sentence_idx"]
            sentence_id = s_obj["sentence_id"]
            # Sanitize the sentence text
            txt = sanitize_text(s_obj['text'])
            if not txt or len(txt) < 1:
                continue  # Skip empty or too short sentences
            filename_wav = f"{base_folder}/sent_{global_sentence_index}.wav"
            try:
                raw_audio = tts_engine.infer_from_text(txt, "bn", "male")
                # Convert to numpy array and squeeze extra dimensions if any
                wav_array = np.array(raw_audio)
                wav_array = np.squeeze(wav_array)
                # Convert float waveform (assumed in [-1,1]) to int16 PCM
                audio_int16 = (wav_array * 32767).astype(np.int16)
                scipy_wav_write(filename_wav, DEFAULT_SAMPLING_RATE, audio_int16)
            except Exception as e:
                print(f"TTS inference failed for sentence: '{txt}'. Error: {str(e)}")
                continue  # Skip this sentence and proceed with the next
            with contextlib.closing(wave.open(filename_wav, 'rb')) as wf:
                frames = wf.getnframes()
                duration_ms = int((frames / DEFAULT_SAMPLING_RATE) * 1000)
            words = txt.split()
            total_chars = sum(len(w) for w in words) or 1
            current_start = 0
            local_word_info = []
            for w_i, w_text in enumerate(words):
                portion = int((len(w_text) / total_chars) * duration_ms)
                local_word_info.append({
                    'paragraph_idx': p_idx,
                    'sentence_idx': s_idx,
                    'word_idx': w_i,
                    'word_text': w_text,
                    'rel_start_ms': current_start,
                    'rel_end_ms': current_start + portion
                })
                current_start += portion
            trailing_pause_ms = 500 if any(c in txt for c in ['?', '!', '।']) else 300
            sentence_meta.append({
                'paragraph_idx': p_idx,
                'sentence_idx': s_idx,
                'sentence_id': sentence_id,
                'text': txt,
                'file_path': filename_wav,
                'pause_ms': trailing_pause_ms,
                'words_info': local_word_info
            })
            global_sentence_index += 1
    return sentence_meta

def combine_word_level_segments(sentence_meta, output_file="combined_audio.wav"):
    """
    Combines all generated sentence WAV files into one output WAV file.
    Computes absolute timestamps (in seconds) for every word, every sentence (with sentence_id),
    and aggregates paragraph boundaries.
    
    Returns:
      - output_file: path of combined audio.
      - metadata: an object with keys "words", "sentences", and "paragraphs".
    """
    combined_frames = bytearray()
    current_start_ms = 0
    sample_rate = DEFAULT_SAMPLING_RATE
    words_data = []
    sentences_data = []
    paragraphs_data = {}
    for sdata in sentence_meta:
        with wave.open(sdata['file_path'], 'rb') as wf:
            frames = wf.readframes(wf.getnframes())
            seg_duration_ms = int((wf.getnframes() / sample_rate) * 1000)
        sentence_start_ms = current_start_ms
        sentence_end_ms = current_start_ms + seg_duration_ms
        for w_info in sdata['words_info']:
            absolute_start = (current_start_ms + w_info['rel_start_ms']) / 1000.0
            absolute_end = (current_start_ms + w_info['rel_end_ms']) / 1000.0
            words_data.append({
                'paragraph_idx': w_info['paragraph_idx'],
                'sentence_idx': w_info['sentence_idx'],
                'word_idx': w_info['word_idx'],
                'start_time_sec': absolute_start,
                'end_time_sec': absolute_end,
                'text': w_info['word_text']
            })
        sentences_data.append({
            'paragraph_idx': sdata['paragraph_idx'],
            'sentence_idx': sdata['sentence_idx'],
            'sentence_id': sdata['sentence_id'],
            'start_time_sec': sentence_start_ms / 1000.0,
            'end_time_sec': sentence_end_ms / 1000.0,
            'text': sdata['text']
        })
        p_idx = sdata['paragraph_idx']
        if p_idx in paragraphs_data:
            paragraphs_data[p_idx]['end_time_sec'] = sentence_end_ms / 1000.0
            paragraphs_data[p_idx]['text'] += " " + sdata['text']
        else:
            paragraphs_data[p_idx] = {
                'paragraph_idx': p_idx,
                'start_time_sec': sentence_start_ms / 1000.0,
                'end_time_sec': sentence_end_ms / 1000.0,
                'text': sdata['text']
            }
        combined_frames.extend(frames)
        current_start_ms += seg_duration_ms
        pause_ms = sdata['pause_ms']
        num_silence_frames = int((pause_ms / 1000) * sample_rate)
        silence = (0).to_bytes(2, byteorder='little', signed=True) * num_silence_frames
        combined_frames.extend(silence)
        current_start_ms += pause_ms
    paragraphs_list = [paragraphs_data[k] for k in sorted(paragraphs_data.keys())]
    with wave.open(output_file, 'wb') as wf_out:
        wf_out.setnchannels(1)
        wf_out.setsampwidth(2)
        wf_out.setframerate(sample_rate)
        wf_out.writeframes(combined_frames)
    metadata = {
        'words': words_data,
        'sentences': sentences_data,
        'paragraphs': paragraphs_list
    }
    return output_file, metadata
