### MẪU THUYẾT MINH MÔ HÌNH, SẢN PHẨM

**1. Tên mô hình, sản phẩm (Ghi tên giống như trong bản đăng ký):**
LectureSync — Hệ thống hỗ trợ học tập thông minh tích hợp AI và phần cứng IoT siêu tốc

**2. Hình ảnh mô hình (kèm ảnh mô hình vào bản thuyết minh):**
*[Cần bổ sung ảnh chụp màn hình giao diện ứng dụng và ảnh thực tế mạch ESP32 + micro INMP441 hàn trên perfboard]*

**Sơ đồ kiến trúc hệ thống hiện tại:**
🎤 Micro INMP441 → (I2S Audio + Khuếch đại x5) → ⚡ ESP32 → (WebSocket Real-time) → 💻 Trình duyệt Web (Buffer 2.5s) → 🌐 Next.js Server → (Groq Whisper STT) → 📝 Transcript
🎙️ Micro trình duyệt → (Web Speech API) → 📝 Transcript
📝 Transcript → (Dual-Model AI) → 🤖 Llama 3.3 70B + DeepSeek R1 70B →
• 📋 Ghi chú thông minh
• 🃏 Flashcard tự động
• 📊 Quiz kiểm tra
• 📖 Thuật ngữ & Công thức
Tất cả dữ liệu → localStorage + Supabase → ☁️ Cloud Sync

**3. Lĩnh vực dự thi (tác giả lưu ý đăng ký đúng lĩnh vực dự thi):**
**Đồ dùng dành cho học tập**
*(Sản phẩm là sự kết hợp linh hoạt giữa đồ dùng hỗ trợ học tập thực tế (IoT) và nền tảng Trí tuệ nhân tạo (AI)).*

**4. Ý tưởng:**
Trong môi trường đại học và giáo dục hiện đại, sinh viên thường gặp khó khăn trong việc:
• Ghi chép đầy đủ nội dung bài giảng khi phải vừa nghe vừa viết.
• Tổng hợp kiến thức từ bài giảng dài thành tài liệu ôn tập hiệu quả.
• Tự đánh giá mức độ hiểu bài sau mỗi buổi học.
• Tra cứu lại nội dung bài giảng cũ một cách nhanh chóng.

LectureSync ra đời nhằm giải quyết trọn vẹn các vấn đề trên bằng cách kết hợp:
1) **Ghi âm tự động và phiên âm siêu tốc (Speech-to-Text)** — Hỗ trợ 2 phương thức: microphone máy tính hoặc thiết bị đồ dùng học tập thông minh (ESP32 + INMP441). Thiết bị IoT sử dụng giao thức truyền phát trực tiếp (WebSockets) với độ trễ bằng không, kết hợp thuật toán khuếch đại âm thanh kỹ thuật số gấp 5 lần để bắt rõ giọng giáo viên từ xa.
2) **Hệ thống AI Dual-Model** — Chạy song song 2 siêu trí tuệ nhân tạo: Llama 3.3 70B Versatile và DeepSeek R1 Distill Llama 70B. Hệ thống tự động so sánh để tạo ra: Ghi chú cấu trúc, Flashcard ôn tập (5–10 thẻ), Quiz trắc nghiệm (5 câu), Danh sách thuật ngữ, công thức và deadline.
3) **Chatbot AI đa phương thức** — Hỗ trợ hỏi đáp, giải thích bài giảng và phân tích hình ảnh (nhận diện slide/bài tập viết tay) thông qua hệ thống luân chuyển mô hình thông minh.
4) **Đồng bộ dữ liệu đám mây** — Thông qua Supabase, cho phép học sinh đăng nhập và tiếp tục học tập trên mọi thiết bị mà không sợ mất dữ liệu.

**5. Vật liệu chế tạo:**
**Phần cứng:**
| Linh kiện | Mô tả | Vai trò |
| :--- | :--- | :--- |
| **ESP32 (DevKit v1)** | Vi điều khiển WiFi + Bluetooth | Nhận âm thanh, khuếch đại số học và stream sóng âm qua mạng. |
| **INMP441** | Micro MEMS giao tiếp I2S | Thu âm thanh bài giảng chất lượng cực cao (32-bit). |
| **Mạch Perfboard & Thiếc hàn** | Bảng mạch đục lỗ | Cố định và hàn chết các linh kiện để tạo thành khối đồ dùng chắc chắn, thay thế cho dây cắm lỏng lẻo. |
| **Cáp Micro-USB** | Cáp nguồn & dữ liệu | Cấp nguồn liên tục cho hệ thống thiết bị học tập. |

**Sơ đồ đấu nối phần cứng (Hàn trực tiếp):**
* INMP441 SCK → ESP32 GPIO14
* **INMP441 WS → ESP32 GPIO25**
* INMP441 SD → ESP32 GPIO32
* INMP441 L/R → GND (chọn kênh Trái)
* INMP441 VDD → 3.3V
* INMP441 GND → GND

**Phần mềm:**
* **Next.js 16.2.6 (React 19)**: Xây dựng nền tảng Full-stack và xử lý luồng âm thanh theo thời gian thực (Truy cập tại: **https://lecture-sync-beta.vercel.app/**).
* **Supabase**: Quản trị cơ sở dữ liệu và xác thực người dùng.
* **Groq API (Whisper Large V3)**: Phiên âm siêu tốc không độ trễ.
* **OpenRouter / Gemini API**: Cung cấp năng lực suy luận ngôn ngữ và thị giác máy tính cho AI Chatbot.

**6. Cách sử dụng vận hành:**
**Phương thức 1: Ghi âm qua trình duyệt (Laptop/Điện thoại)**
• Truy cập hệ thống tại địa chỉ: **https://lecture-sync-beta.vercel.app/**
• Đăng nhập và nhấn "Bắt đầu ngay" → vào trang Ghi Âm.
• Chọn ngôn ngữ giảng dạy và nhấn biểu tượng Microphone.
• Hệ thống sẽ tự động chạy song song 2 AI model, tạo ghi chú, flashcard, quiz khi kết thúc.

**Phương thức 2: Ghi âm qua Thiết bị học tập IoT (ESP32)**
• Đấu nối mạch, hàn cố định lên perfboard và cấp nguồn cho ESP32.
• Vi điều khiển sẽ tự động áp dụng thuật toán Khuếch đại kỹ thuật số (x5) vào sóng âm I2S và tạo luồng chờ WebSockets (Port 81).
• Mở web **https://lecture-sync-beta.vercel.app/**, bật công tắc **"Mic ESP32"** và nhấn nút Microphone.
• Trình duyệt sẽ kết nối trực tiếp đến phần cứng, gom âm thanh thành các gói nhỏ 2.5 giây và đẩy thẳng lên Server để dịch theo thời gian thực.
• Server tích hợp Màng lọc Ảo giác (Hallucination Filter) để tự động nhận diện và chặn các chuỗi văn bản rác khi tĩnh lặng.

**Các tính năng hậu kỳ:**
• **Trang Ghi chú:** Xem cấu trúc bài học, thuật ngữ, công thức.
• **Trang Ôn tập:** Ôn luyện Flashcard theo phương pháp Lặp lại ngắt quãng (Spaced Repetition) và làm bài kiểm tra.
• **Trang Phân tích:** Theo dõi biểu đồ tốc độ nói (WPM), thống kê từ lấp, và đánh giá điểm rõ ràng (Clarity Score).
• **Trang Chat AI:** Gia sư riêng giải đáp thắc mắc về bài học.

**7. Tính mới, tính sáng tạo, khả năng áp dụng:**
**Tính mới:**
• **Biến IoT thành đồ dùng học tập siêu tốc Zero-Latency:** Đi đầu trong việc loại bỏ độ trễ của giao thức HTTP cũ. Âm thanh được bắn trực tiếp qua WebSocket và phân tích theo chu kỳ 2.5 giây, cho tốc độ phiên âm nhanh bằng tốc độ người nói.
• **Hệ thống AI Dual-Model:** Ứng dụng mô hình suy luận sâu (DeepSeek R1) kết hợp với mô hình phản hồi nhanh (Llama 3.3) để đảm bảo độ chính xác tuyệt đối trong việc tạo tài liệu.
• **Khuếch đại tín hiệu kỹ thuật số:** Xử lý triệt để bài toán micro không đủ nhạy trong không gian phòng học lớn.

**Tính sáng tạo:**
• Giải thích thuật ngữ tự động mỗi 30 giây ngay trong lúc giảng viên đang nói.
• Bộ lọc rác AI (Hallucination Filter) giải quyết triệt để điểm yếu của công nghệ Whisper khi đối mặt với sự tĩnh lặng.
• Đồng bộ Offline-First, giúp nền tảng web hoạt động hoàn hảo cả khi sóng WiFi của trường học chập chờn.
• Hệ thống phần cứng nhỏ gọn, hàn chết chắc chắn, dễ dàng bỏ vào balo học sinh như một món đồ dùng học tập thường ngày.

**Khả năng áp dụng:**
• Học sinh / Sinh viên: Tiết kiệm tối đa thời gian chép bài trên lớp.
• Hỗ trợ tuyệt vời cho nhóm học sinh khiếm thính hoặc tiếp thu chậm tiếp cận bài giảng.
• Dễ dàng nhân rộng, triển khai nhờ sử dụng 100% tài nguyên đám mây và phần cứng giá siêu rẻ.

**8. Ý nghĩa mô hình, sản phẩm:**
• **Định hình lại đồ dùng học tập:** Kết hợp phần cứng IoT và Web App thành một "bút ghi chép AI" vô hình trong lớp học. Chuyển đổi trạng thái của học sinh từ "Cắm cúi ghi chép, nghe không kịp" sang "Tập trung tư duy, để AI lo tài liệu".
• **Dân chủ hóa công cụ giáo dục:** Đưa sức mạnh của Trí tuệ nhân tạo đắt tiền đến tay mọi học sinh Việt Nam thông qua kiến trúc tối ưu chi phí hoàn toàn miễn phí.
• **Hướng tới Smart Classroom:** Minh chứng thực tế cho tiềm năng đưa vạn vật kết nối vào không gian học tập thực tế, hướng tới kỷ nguyên lớp học thông minh.
