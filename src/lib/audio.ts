// Utilitários de áudio para compatibilidade com Whisper (Groq/OpenAI)
// Converte formatos não suportados (ex.: OGG) para WAV PCM 16-bit em memória

export const convertToWavIfNeeded = async (file: File): Promise<File> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const supportedExt = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];
  const isOgg = file.type === 'audio/ogg' || file.type === 'application/ogg' || ext === 'ogg';

  // Se já for suportado e não for OGG, não precisa converter
  if (supportedExt.includes(ext || '') && !isOgg) return file;

  // Converter para WAV
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

  const audioBuffer: AudioBuffer = await new Promise((resolve, reject) => {
    // Algumas versões tipadas do TS exigem callback-style
    audioCtx.decodeAudioData(
      arrayBuffer.slice(0),
      (buf) => resolve(buf),
      (err) => reject(err)
    );
  });

  const wavBuffer = encodeWav(audioBuffer);
  const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
  const wavName = file.name.replace(/\.[^./]+$/, '') + '.wav';
  return new File([wavBlob], wavName, { type: 'audio/wav' });
};

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
