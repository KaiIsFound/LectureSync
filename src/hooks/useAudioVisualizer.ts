'use client';

import { useRef, useCallback, useState } from 'react';

interface AudioVisualizerResult {
  frequencyData: Uint8Array | null;
  isActive: boolean;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  getFrequencyData: () => Uint8Array | null;
}

export function useAudioVisualizer(): AudioVisualizerResult {
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // ★ Start Recording with MediaRecorder
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.start(500); // capture chunks every 500ms
      mediaRecorderRef.current = mediaRecorder;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      setIsActive(true);
    } catch (err) {
      console.error('Failed to start audio visualizer:', err);
    }
  }, []);

  const stop = useCallback(() => {
    return new Promise<Blob | null>((resolve) => {
      let recordedBlob: Blob | null = null;
      const cleanup = () => {
        if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
        if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
        analyserRef.current = null;
        dataArrayRef.current = null;
        setIsActive(false);
      };

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          recordedBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          cleanup();
          resolve(recordedBlob);
        };
        mediaRecorderRef.current.stop();
      } else {
        cleanup();
        resolve(null);
      }
    });
  }, []);

  const getFrequencyData = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      return dataArrayRef.current;
    }
    return null;
  }, []);

  return {
    frequencyData: dataArrayRef.current,
    isActive,
    start,
    stop,
    getFrequencyData,
  };
}
