"use client";
import { useState, useEffect } from "react";

export default function HardwareTestPage() {
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [status, setStatus] = useState("Đang chờ dữ liệu...");

  useEffect(() => {
    // Gọi API mỗi 2 giây để lấy dữ liệu mới nhất từ mạch ESP32 gửi lên
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/hardware-audio");
        const data = await res.json();
        
        if (data.transcripts && data.transcripts.length > 0) {
          setTranscripts(data.transcripts);
          setStatus("Đang nhận dữ liệu từ phần cứng liên tục 🟢");
        }
      } catch (err) {
        console.error("Lỗi:", err);
        setStatus("Lỗi kết nối tới Server 🔴");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold mb-2 text-blue-600">Trang Test Phần Cứng ESP32</h1>
        <p className="text-gray-500 mb-6">Trang này dùng để theo dõi tín hiệu gửi từ ESP32 qua mạng LAN</p>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status.includes("🟢") ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}></div>
          <span className="font-medium text-blue-900">{status}</span>
        </div>

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
