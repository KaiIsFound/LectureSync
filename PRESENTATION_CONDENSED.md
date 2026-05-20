                # LectureSync – Hệ thống hỗ trợ học tập thông minh tích hợp IoT và AI

                Kính thưa Ban giám khảo cùng toàn thể hội thi Sáng tạo Thanh thiếu niên, Nhi đồng!

                Em tên là [Tên của bạn]. Hôm nay, em xin phép được đại diện nhóm để thuyết minh về dự án LectureSync – một giải pháp toàn diện hỗ trợ học tập thông minh.

                ---

                ## I. ĐẶT VẤN ĐỀ

                Trong giờ học, chúng ta thường gặp phải những khó khăn:
                - **Áp lực ghi chép**: Thầy cô giảng nhanh, học sinh phải cắm cúi ghi bài, dễ bị mất tập trung
                - **Chất lượng ghi chép kém**: Vở ghi lộn xộn, thiếu sót, khó ôn tập sau này
                - **Phân tâm trong lớp**: Việc ghi chép thủ công chiếm mất thời gian tư duy tích cực

                LectureSync được sinh ra để giải quyết những vấn đề này — **giúp học sinh tập trung vào tư duy thay vì ghi chép**, đồng thời tạo ra tài liệu học tập chất lượng cao tự động.

                ---

                ## II. TỔNG QUAN HỆ THỐNG

                LectureSync là một nền tảng hoàn chỉnh gồm:

                1. **Thiết bị phần cứng IoT** — ESP32 với micro kỹ thuật số, truyền âm thanh trực tiếp (real-time)
                2. **Nền tảng Web App AI** — Next.js + AI (Whisper, Llama, Qwen) xử lý âm thanh và tạo tài liệu
                3. **Bốn tính năng học tập cốt lõi** — AI Notes, Flashcards, Quiz, và Chatbot hỗ trợ 24/7

                **Quy trình hoạt động:**  
                `Thu âm (Thiết bị) → Truyền trực tiếp (WebSocket) → Xử lý AI (Phiên âm + Phân tích) → Tạo tài liệu (Notes, Flashcards, Quiz, Chat)`

                ---

                ## III. HƯỚNG DẪN SỬ DỤNG

                ### **Bước 1: Chuẩn bị thiết bị**

                1. **Kết nối thiết bị ESP32** vào USB của máy tính hoặc điện thoại
                2. **Bật Wi-Fi** trên thiết bị (SSID: `esp32`, mật khẩu: `88888888`)
                3. **Mở ứng dụng LectureSync** trên trình duyệt: `https://lecturesync.vercel.app`

                ### **Bước 2: Bắt đầu ghi âm bài giảng**

                1. Vào tab **"Ghi âm"** (Record)
                2. Bật toggle **"Mic ESP32"** để kết nối thiết bị
                3. Nếu thành công, sẽ thấy **"Kết nối ✓"** và một **đèn LED xanh** trên thiết bị sáng lên
                4. Nhấn nút **"Bắt đầu ghi"** (REC) để bắt đầu thu âm

                **Mẹo**: Đặt thiết bị gần giáo viên để bắt rõ tiếng nói

                ### **Bước 3: Xem ghi chú thông minh (AI Notes)**

                Sau khi ghi âm hoàn tất, bài giảng sẽ được **phiên âm tự động** và **cấu trúc hóa** thành:
                - **Tiêu đề chính** (chủ đề bài học)
                - **Các phần chính** (chia theo đề mục)
                - **Từ khóa quan trọng** (các khái niệm cốt lõi)
                - **Công thức** (tự động trích xuất công thức toán/lý/hóa)

                Học sinh có thể **chỉnh sửa, tô đậm, hoặc bình luận** trên các ghi chú.

                ### **Bước 4: Học với Flashcards**

                1. Vào tab **"Flashcards"**
                2. Hệ thống AI tự động tạo ra các **thẻ câu hỏi-câu trả lời** từ bài giảng
                3. Nhấn **"Lật"** để xem đáp án
                4. Chọn **"Biết"** hay **"Không biết"** để ghi nhớ tiến độ
                5. Flashcards sẽ tự động sắp xếp lại dựa trên **phương pháp lặp lại ngắt quãng** (spaced repetition) — chỉ hỏi lại những thẻ mà bạn còn yếu

                ### **Bước 5: Kiểm tra kiến thức với Quiz**

                1. Vào tab **"Quiz"**
                2. AI tạo ra các **câu hỏi trắc nghiệm đa lựa chọn** bám sát nội dung bài giảng
                3. Trả lời các câu hỏi
                4. Nhấn **"Kiểm tra"** để xem kết quả
                5. Hệ thống sẽ **giải thích chi tiết** từng câu trả lời sai

                ### **Bước 6: Hỏi Chatbot AI (Trợ lý 24/7)**

                1. Vào tab **"Hỏi Đáp"** (Chat)
                2. Gõ câu hỏi bất kỳ liên quan đến bài giảng, ví dụ:
                - _"Công thức tính diện tích hình elip là gì?"_
                - _"Giải thích khái niệm photosynthesis"_
                - _"Dịch từ này sang tiếng Anh"_
                3. Chatbot sẽ **trả lời ngay lập tức** với giải thích chi tiết
                4. Bạn có thể **gửi hình ảnh bài tập** để AI phân tích và hướng dẫn

                ---

                ## IV. CÁC TÍNH NĂNG NỔI BẬT

                ### **1. Ghi chú thông minh (AI Notes)**
                - ✅ **Phiên âm tự động** tiếng Việt, Anh, Trung
                - ✅ **Cấu trúc hóa** thành các phần chính, từ khóa, công thức
                - ✅ **Tô đậm, ghi chú, bình luận** trên ghi chú
                - ✅ **Xuất PDF** để in hoặc chia sẻ

                ### **2. Flashcards thông minh**
                - ✅ **Tạo tự động** từ nội dung bài giảng
                - ✅ **Phương pháp lặp lại ngắt quãng** giúp ghi nhớ lâu dài
                - ✅ **Theo dõi tiến độ** — xem mình đã học được bao nhiêu %
                - ✅ **Flashcards riêng** cho từng môn học, từng bài

                ### **3. Quiz thương thức**
                - ✅ **Câu hỏi động** dựa trên bài giảng
                - ✅ **Chấm điểm tự động** với giải thích chi tiết
                - ✅ **Thống kê lỗi** — xem mình thường sai ở đâu
                - ✅ **Làm lại** các câu sai để cải thiện

                ### **4. Chatbot AI (Gia sư ảo)**
                - ✅ **Trả lời ngay lập tức** mọi câu hỏi về bài học
                - ✅ **Giải thích công thức** từng bước
                - ✅ **Hỗ trợ ảnh** — gửi hình bài tập để AI phân tích
                - ✅ **Có sẵn 24/7** — không cần chờ gia sư

                ### **5. Đồng bộ dữ liệu đám mây**
                - ✅ **Lưu tự động** trên cloud (Supabase)
                - ✅ **Truy cập từ bất kỳ thiết bị** (máy tính, điện thoại, tablet)
                - ✅ **Không sợ mất dữ liệu** — tất cả được sao lưu

                ---

                ## V. LỢI ÍCH VỀ HỌC TẬP

                📊 **Thống kê hiệu quả:**
                - **Tiết kiệm 70% thời gian ghi chép** → tập trung tư duy trên lớp
                - **Tăng độ hiểu bài** nhờ AI giải thích chi tiết
                - **Cải thiện ghi nhớ** nhờ Flashcards + phương pháp lặp lại
                - **Học chủ động hơn** — không phụ thuộc gia sư, tự học được

                🎯 **Đối tượng hưởng lợi:**
                - Học sinh muốn **ghi chép hiệu quả hơn**
                - Học sinh **khiếm thính** hoặc khó tiếp thu qua âm thanh
                - Học sinh **ôn thi** cần tài liệu tổng hợp nhanh
                - Những ai muốn **học thêm sau giờ** mà không cần gia sư riêng

                ---

                ## VI. TẬP PHƯƠNG THỨC SỬ DỤNG NÂNG CAO

                ### **Tạo Flashcards tùy chỉnh**
                - Ngoài flashcards tự động, bạn có thể **tạo thêm flashcards riêng**
                - Chia sẻ Flashcards với **bạn cùng lớp** để cùng ôn tập

                ### **Chia sẻ ghi chú với giáo viên**
                - Xuất ghi chú ra **PDF hoặc Markdown**
                - Gửi cho thầy cô để nhận **phản hồi**

                ### **Lập kế hoạch học tập**
                - Theo dõi **lịch sử học tập** (ngày, giờ, số ghi chú, số flashcards)
                - Đặt **mục tiêu học tập** (ví dụ: _"Học 5 flashcards mỗi ngày"_)
                - Nhận **thông báo nhắc nhở** để không quên ôn tập

                ---

                ## VII. HỖ TRỢ NGÔN NGỮ & TRUYỀN TIẾNG

                🌍 **Ngôn ngữ được hỗ trợ:**
                - Tiếng Việt (chính)
                - Tiếng Anh
                - Tiếng Trung
                - Tiếng Nhật (sắp tới)

                🔊 **Phát âm bài giảng:**
                - Nhấn nút **"🔊 Phát"** để nghe lại bài giảng gốc
                - Nghe lại **từng câu** để hiểu rõ hơn
                - Điều chỉnh **tốc độ phát** (0.75x, 1x, 1.5x, 2x)

                ---

                ## VIII. ĐỔI ĐẦU CỦA GIÁO DỤC

                LectureSync không chỉ là một ứng dụng ghi âm thông thường. Đây là:

                - ✨ **Công cụ chuyển đổi số giáo dục** — biến bài giảng truyền thống thành tài liệu AI
                - 🎓 **Nâng cao công bằng học tập** — hỗ trợ học sinh khiếm thính, học chậm, hay hoàn cảnh khó khăn
                - 🚀 **Tương lai học tập thông minh** — kết hợp giáo viên, AI, và học sinh trong một hệ sinh thái

                ---

                ## IX. HƯỚNG PHÁT TRIỂN TƯƠNG LAI

                Trong các phiên bản tới, LectureSync sẽ bổ sung:
                - 📹 **Ghi hình bài giảng** kèm AI phân tích bộ giáo trình trực quan
                - 🗣️ **Phát hiện lỗi phát âm** — hỗ trợ học sinh học ngoại ngữ
                - 🤝 **Collaboration** — học tập nhóm, chia sẻ ghi chú, làm bài tập chung
                - 📊 **Thống kê học tập** — báo cáo chi tiết về hiệu quả học tập cho phụ huynh

                ---

                ## X. KẾT LUẬN

                Em tin rằng **LectureSync sẽ là người bạn đồng hành** trong hành trình học tập của mỗi học sinh. Với khả năng:
                - 🎯 **Tiết kiệm thời gian ghi chép**
                - 🧠 **Nâng cao chất lượng ghi nhớ**
                - 💡 **Kích thích tư duy sáng tạo**
                - 🌟 **Mở ra cơ hội học tập bằng nhau**

                LectureSync hứa hẹn sẽ **biến mỗi tiết học thành một trải nghiệm hiệu quả, vui vẻ, và công bằng hơn**.

                ---

                **Em xin chân thành cảm ơn Ban giám khảo và toàn thể hội thi đã lắng nghe!**

                ---

                *Để bắt đầu sử dụng LectureSync, vui lòng truy cập: **https://lecturesync.vercel.app***
