"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

export default function HardwareTestPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [espIp, setEspIp] = useState("lecturesync.local");
  const wsRef = useRef<WebSocket | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamActiveRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startRecording = () => {
    if (!espIp) {
      toast.error("Vui lòng nhập IP của ESP32!");
      return;
    }

    try {
      const ws = new WebSocket(`ws://${espIp}:81`);
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        setIsRecording(true);
        streamActiveRef.current = true;
        toast.success("Đã kết nối với ESP32!");
      };

      ws.onmessage = (event) => {
        if (!streamActiveRef.current) return;
        
        if (event.data instanceof ArrayBuffer) {
          const blob = new Blob([event.data], { type: "audio/pcm" });
          audioChunksRef.current.push(blob);
          drawWaveform(new Int16Array(event.data));
          
          // Gom khoảng 2.5 giây (80 chunks x 512 mẫu) thì dịch 1 lần để tốc độ bàn thờ
          if (audioChunksRef.current.length >= 80) {
            processAudioChunks();
          }
        }
      };

      ws.onerror = () => {
        toast.error("Mất kết nối với ESP32!");
        stopRecording();
      };

      ws.onclose = () => {
        if (streamActiveRef.current) {
          toast.error("ESP32 ngắt kết nối!");
          stopRecording();
        }
      };

      wsRef.current = ws;
    } catch (e) {
      toast.error("Lỗi kết nối WebSocket!");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    streamActiveRef.current = false;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioChunksRef.current.length > 0) {
      processAudioChunks();
    }
  };

  const processAudioChunks = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    const fullBlob = new Blob(audioChunksRef.current, { type: "audio/pcm" });
    audioChunksRef.current = [];

    try {
      const arrayBuffer = await fullBlob.arrayBuffer();
      const res = await fetch("/api/hardware-audio", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: arrayBuffer,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.transcript) {
          setTranscripts((prev) => [...prev, data.transcript]);
        }
      }
    } catch (err) {
      console.error("Lỗi xử lý audio:", err);
    }
  };

  const drawWaveform = (pcmData: Int16Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 2;

    const step = Math.ceil(pcmData.length / width);
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = pcmData[i * step + j] / 32768;
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.lineTo(i, (1 + min) * (height / 2));
      ctx.lineTo(i, (1 + max) * (height / 2));
    }
    ctx.stroke();
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold mb-2 text-blue-600">Trang Test Phần Cứng ESP32</h1>
        
        <div className="flex gap-2 mb-6">
          <input 
            value={espIp} 
            onChange={(e) => setEspIp(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Nhập IP ESP32"
          />
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded text-white ${isRecording ? "bg-red-500" : "bg-blue-600"}`}
          >
            {isRecording ? "Dừng" : "Bắt đầu"}
          </button>
        </div>

        <canvas ref={canvasRef} className="w-full h-32 bg-gray-100 rounded mb-4" />

        <div className="bg-gray-900 rounded-lg p-4 h-[400px] overflow-y-auto">
          {transcripts.length === 0 ? (
            <p className="text-gray-500 italic text-center mt-10">Chưa có tín hiệu nào được gửi tới...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {transcripts.map((text, i) => (
                <div key={i} className="text-green-400 font-mono text-sm border-b border-gray-800 pb-2">
                  <span className="text-gray-500 mr-2">[{i + 1}]</span>
                  {text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
