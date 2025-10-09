// Utilitários de áudio para compatibilidade com Whisper (Groq/OpenAI)
// Converte formatos não suportados (ex.: OGG) para WAV PCM 16-bit em memória

export const convertToWavIfNeeded = async (file: File): Promise<File> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const supportedExt = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];
  const isOgg = file.type === 'audio/ogg' || file.type === 'application/ogg' || ext === 'ogg';
  const isVideo = file.type.startsWith('video/');

  // Converter vídeos e OGG (Groq não aceita vídeos, OpenAI aceita)
  const needsConversion = isVideo || (isOgg && !supportedExt.includes(ext || ''));
  
  // Se não precisa conversão, retornar
  if (!needsConversion) return file;

  // Converter para WAV
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Para vídeos, extrair áudio; para OGG, decodificar diretamente
  const audioBuffer: AudioBuffer = await (async () => {
    if (isVideo) {
      return await extractAudioFromVideo(file, audioCtx);
    } else {
      const arrayBuffer = await file.arrayBuffer();
      return await new Promise<AudioBuffer>((resolve, reject) => {
        audioCtx.decodeAudioData(
          arrayBuffer.slice(0),
          (buf) => resolve(buf),
          (err) => reject(err)
        );
      });
    }
  })();

  const wavBuffer = encodeWav(audioBuffer);
  const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
  const wavName = file.name.replace(/\.[^./]+$/, '') + '.wav';
  return new File([wavBlob], wavName, { type: 'audio/wav' });
};

// Extrai áudio de arquivo de vídeo usando MediaElementSource
async function extractAudioFromVideo(file: File, audioCtx: AudioContext): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';
    
    const url = URL.createObjectURL(file);
    video.src = url;
    
    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        if (!duration || isNaN(duration)) {
          URL.revokeObjectURL(url);
          reject(new Error('Vídeo sem trilha de áudio ou inválido'));
          return;
        }
        
        // Criar source e destination para capturar o áudio
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        
        // Usar MediaRecorder para gravar o áudio
        const mediaRecorder = new MediaRecorder(dest.stream, { 
          mimeType: 'audio/webm;codecs=opus' 
        });
        
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        mediaRecorder.onstop = async () => {
          URL.revokeObjectURL(url);
          try {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const buffer = await audioCtx.decodeAudioData(arrayBuffer);
            resolve(buffer);
          } catch (err) {
            reject(err);
          }
        };
        
        mediaRecorder.start();
        video.play();
        
        // Parar gravação quando terminar
        video.onended = () => {
          mediaRecorder.stop();
        };
        
        // Fallback: parar após a duração + 1s
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, (duration + 1) * 1000);
        
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erro ao carregar vídeo'));
    };
  });
}

// Codifica AudioBuffer para WAV PCM 16-bit little-endian
function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;

  // Interleave canais
  const interleaved = interleave(audioBuffer);

  // 16-bit PCM
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = interleaved.length * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM data
  floatTo16BitPCM(view, 44, interleaved);

  return buffer;
}

function interleave(audioBuffer: AudioBuffer): Float32Array {
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const result = new Float32Array(length * numChannels);
  const channels: Float32Array[] = [];

  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }

  let offset = 0;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      result[offset++] = channels[c][i];
    }
  }

  return result;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
