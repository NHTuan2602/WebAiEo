import { useState } from 'react';
import {
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  FileCode2,
  Headphones,
  HelpCircle,
  Lightbulb,
  Mic,
  PenTool,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
  Zap
} from 'lucide-react';
import {
  getListeningTracks,
  getReadingPassages,
  getSpeakingQuestionItems
} from '../../constants/seedData';

function countQuestionSlots(questions = []) {
  if (!Array.isArray(questions)) return 0;
  return questions.reduce((sum, q) => {
    const start = Number(q?.questionNumber ?? q?.blankNum) || 0;
    const end = Number(q?.questionEndNumber) || start;
    if (start > 0 && end > start) return sum + (end - start + 1);
    return sum + Math.max(1, Number(q?.requiredSelections) || 1);
  }, 0);
}

const GUIDE_TAB_TIPS = {
  general: {
    title: 'Bước 1: Tạo nhanh 3 PDF hoặc đặt tên & chọn chế độ thi',
    text: 'Nếu bạn đã có sẵn 3 file PDF (Listening, Reading, Writing), chỉ cần thả cả 3 vào khung "Tạo Đề Nhanh Từ 3 File PDF" ngay phía trên rồi bấm 1 nút — AI sẽ tự dựng gần như toàn bộ đề trừ Speaking! Sau đó chọn 1 chạm: Thực Chiến (100k), Mock Định Kỳ (300k), hoặc Lưu Nháp.'
  },
  listening: {
    title: 'Bước 2: Soạn Phần Nghe (Listening — 4 bài / 40 câu)',
    text: 'Mỗi Part (1–4) tương ứng 10 câu (1–10, 11–20, 21–30, 31–40). Tải PDF + Bảng Đáp Án ở tab "Tạo Tự Động (AI Ảnh / PDF)" để AI điền key 1–40 luôn. Nếu bài có Bản đồ (Map) hoặc Lưu đồ (Flow-chart), dùng ô "Gắn Hình Cho Nhóm Câu (VD: 11–16)" rồi tải file MP3 cho từng Part.'
  },
  reading: {
    title: 'Bước 3: Soạn Phần Đọc (Reading — 3 bài / 40 câu)',
    text: 'Thả 1 file PDF Reading vào tab "Tạo Tự Động (AI Ảnh / PDF)" kèm ảnh/PDF/text đáp án để AI tách đủ 3 Passage + 40 câu theo đúng số thứ tự. Bạn có thể bấm "Chia Nhanh Câu Theo Passage" hoặc "Sắp Xếp 1→40" bất kỳ lúc nào.'
  },
  writing: {
    title: 'Bước 4: Soạn Phần Viết (Writing — Task 1 & Task 2)',
    text: 'Dùng khung "AI Tạo Tự Động Writing" ngay đầu tab: thả file PDF hoặc dán ảnh chụp (Ctrl+V), AI sẽ tự chép đề Task 1, TỰ CẮT ẢNH BIỂU ĐỒ/BẢN ĐỒ đưa vào khung Task 1, và chép luôn đề Task 2! Bạn chỉ cần kiểm tra lại rồi bổ sung bài mẫu (không bắt buộc).'
  },
  speaking: {
    title: 'Bước 5: Soạn Phần Nói (Speaking — 3 phần) & Lưu Đề',
    text: 'Nhập chủ đề rồi bấm "AI Tạo Trọn Bộ 3 Part" hoặc tự nhập câu hỏi / thu âm giọng giáo viên. Giám khảo AI sẽ tự động nói lời dẫn chuẩn Cambridge (thay sẵn biến gạch chân {{part1_topic}}, {{part2_title}}, {{part3_topic}}) trước khi đọc câu hỏi. Xong bấm nút xanh "Lưu Toàn Bộ Đề Thi" ở góc trên phải!'
  }
};

const MODAL_SECTIONS = [
  { id: 'all', label: '📖 Xem Tất Cả' },
  { id: 'quick3pdf', label: '⚡ Tạo Nhanh 3 PDF' },
  { id: 'modes', label: '🏛️ Chế Độ & Giá' },
  { id: 'listening', label: '🎧 Listening (4 bài)' },
  { id: 'reading', label: '📚 Reading (3 bài)' },
  { id: 'writing', label: '✍️ Writing (T1–T2)' },
  { id: 'speaking', label: '🎙️ Speaking AI' },
  { id: 'faq', label: '🛠️ Mẹo & Sửa Lỗi' }
];

export function BuilderGuideModal({ isOpen, onClose, onJumpToTab }) {
  const [activeSection, setActiveSection] = useState('all');
  if (!isOpen) return null;

  const showSection = (id) => activeSection === 'all' || activeSection === id;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="builder-guide-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0F172B] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#007A7A] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <div>
              <h2 id="builder-guide-modal-title" className="text-base sm:text-lg font-extrabold leading-tight">
                Cẩm Nang Tạo Đề Thi IELTS Chi Tiết (Chuẩn Computer-Delivered 4 Kỹ Năng)
              </h2>
              <p className="text-xs text-teal-100 mt-0.5">
                Hướng dẫn đầy đủ từ A–Z: Tạo nhanh 3 PDF, Bảng đáp án, Map/Flow-chart, Writing tự cắt biểu đồ &amp; Giám khảo Speaking AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition shrink-0"
            aria-label="Đóng hướng dẫn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Filter Bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 shrink-0">
          {MODAL_SECTIONS.map(sec => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                activeSection === sec.id
                  ? 'bg-[#007A7A] text-white border-[#007A7A]'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-[#314158] dark:text-slate-200">
          {/* 1. QUICK 3-PDF FLOW */}
          {showSection('quick3pdf') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#EDFFFD] dark:bg-teal-950/35 border border-[#B5F5F1] dark:border-teal-500/35 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-[#007A7A] dark:text-[#1EE1D6] flex items-center gap-2 text-sm sm:text-base">
                  <Zap className="w-4 h-4" /> 1. Cách Nhanh Nhất: Tạo Full Đề Trong 2 Phút Với 3 File PDF
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onJumpToTab('general');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#007A7A] text-white text-xs font-bold hover:bg-[#065B5B]"
                >
                  Đi tới Khung 3 PDF →
                </button>
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs leading-relaxed">
                <li>
                  Ở ngay đầu màn hình <strong>Tạo Đề Thi</strong> (mục <strong>Tạo Đề Nhanh Từ 3 File PDF</strong>), thả lần lượt:
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-700 dark:text-slate-300">
                    <li><b>Cột 1 — PDF Listening:</b> Chứa đề nghe 4 Part (1–40) + đính kèm ảnh/PDF/chữ Bảng Đáp Án (nếu có).</li>
                    <li><b>Cột 2 — PDF Reading:</b> Chứa đủ 3 Passage (1–40) + đính kèm Bảng Đáp Án (nếu có).</li>
                    <li><b>Cột 3 — PDF / Ảnh Writing:</b> Chứa Task 1 (kèm biểu đồ) và Task 2 — AI sẽ <b>tự tách đề và tự cắt hình biểu đồ Task 1</b>!</li>
                  </ul>
                </li>
                <li>
                  Bấm <strong>⚡ Tự Động Tạo Cả 3 Phần (L + R + W) Ngay</strong>. AI chạy tuần tự từng kỹ năng, hiện tiến độ xanh <code>✓</code> và tự điền thẳng vào 3 tab Listening, Reading, Writing.
                </li>
                <li>
                  Chuyển sang <strong>Tab 2 (Listening)</strong> để gắn file <strong>MP3/WAV</strong> (và gắn ảnh Map/Flow-chart nếu bài có bản đồ), kiểm tra nhanh đáp án ở <strong>Tab 3 (Reading)</strong> &amp; ảnh biểu đồ ở <strong>Tab 4 (Writing)</strong>.
                </li>
                <li>
                  Qua <strong>Tab 5 (Speaking)</strong> để tạo 3 Part bằng AI hoặc nhập câu hỏi riêng, rồi bấm <strong>Lưu Toàn Bộ Đề Thi</strong> ở góc trên phải!
                </li>
              </ol>
            </div>
          )}

          {/* 2. EXAM MODES & STRUCTURE */}
          {showSection('modes') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-[#0F172B] dark:text-white flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> 2. Chuẩn Cấu Trúc Đề &amp; Phân Loại (Tab 1)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onJumpToTab('general');
                    onClose();
                  }}
                  className="text-xs font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline"
                >
                  Mở Tab 1 →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/60 space-y-1">
                  <p className="font-extrabold text-[#007A7A] dark:text-teal-300">🏛️ Thực Chiến Thi Thật (100.000đ)</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Đủ 4 kỹ năng liên hoàn (L: 4 bài/40 câu · R: 3 bài/40 câu · W: 2 bài · S: 3 phần). Thi 1 lượt duy nhất, áp dụng mua lẻ 100k hoặc trừ 1 lượt Combo 3/5/8/10 đề. Nộp xong chờ Ms. Như duyệt điểm.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 space-y-1">
                  <p className="font-extrabold text-amber-700 dark:text-amber-300">🏆 Mock Test Định Kỳ (300.000đ)</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Kỳ thi định kỳ 3 tháng/lần của trung tâm, hiển thị ở tab riêng. Không dùng chung lượt Combo, chống gian lận &amp; giám khảo AI đọc đề ẩn chữ.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 space-y-1">
                  <p className="font-extrabold text-indigo-700 dark:text-indigo-300">☀️ Daily Zone (Miễn Phí)</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Bài luyện từng kỹ năng (Reading SHW 1–14, Listening, Writing tách riêng W1/W2, Daily Speaking / Forecast). Học viên làm lại nhiều lần, đặt Mật khẩu Team hoặc giao riêng từng lớp.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <b>Mẹo bảo mật &amp; quản lý lớp:</b> Nếu đang soạn dở, giữ chế độ <b>🔒 Lưu Nháp (Chỉ mình tôi thấy)</b>. Khi hoàn chỉnh mới chuyển sang <b>Công khai</b> và chọn <b>Tất cả học viên</b> hoặc tích chọn riêng từng lớp + đặt Mật khẩu phòng thi nếu cần.
              </p>
            </div>
          )}

          {/* 3. LISTENING GUIDE */}
          {showSection('listening') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-blue-800 dark:text-blue-300 flex items-center gap-2 text-sm">
                  <Headphones className="w-4 h-4" /> 3. Tab Listening — 4 Part / 40 Câu, Bản Đồ, Lưu Đồ &amp; Bảng Đáp Án
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onJumpToTab('listening');
                    onClose();
                  }}
                  className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline"
                >
                  Mở Tab 2 Listening →
                </button>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-xs leading-relaxed">
                <li>
                  <b>Tải PDF + Bảng Đáp Án cùng lúc:</b> Trong tab <b>Tạo Tự Động (AI Ảnh / PDF)</b> có 2 ô cạnh nhau: bên trái chọn PDF đề nghe, bên phải thả <b>Ảnh chụp Excel / PDF đáp án</b> hoặc dán thẳng danh sách <code>1\tB</code> rồi bấm <b>Điền Key (1–40)</b> — hệ thống tự khớp đáp án cho cả 40 câu (bỏ qua các cột ghi chú dạng bài).
                </li>
                <li>
                  <b>Gắn ảnh Bản đồ (Map) / Lưu đồ (Flow-chart) cho nhóm câu bất kỳ (VD: Câu 11–16 hoặc 15–20):</b> Vào tab <b>Tạo Bằng Tay</b> → khung <b>Gắn Hình Bản Đồ / Lưu Đồ Cho Nhóm Câu</b> → nhập <code>Từ câu 15 đến câu 20</code>, chọn ảnh bản đồ (hoặc dán <code>Ctrl+V</code>) và tích chọn <b>Chuyển sang Ma Trận Chữ Cái A–I</b> để hiển thị y hệt màn hình thi máy Cambridge (bản đồ bên trái, bảng tick tròn A–I bên phải)!
                </li>
                <li>
                  <b>5 Mẫu Giao Diện Chuẩn Cambridge (1 chạm):</b> Tạo nhanh Form/Note Completion, Table Completion (kẻ khung 4 cột), Flow-chart kèm Hộp từ A–H (xếp cạnh nhau 2 cột chuẩn thi máy), Trắc nghiệm A/B/C và Nối thông tin (Matching Dropdown).
                </li>
                <li>
                  <b>File Audio MP3/WAV:</b> Tải 1 file tổng cho cả bài hoặc tải riêng từng Part 1–4. Nếu chưa có MP3, dán lời thoại tiếng Anh vào ô <b>Transcript</b> để hệ thống tự phát giọng đọc.
                </li>
                <li>
                  <b>Xếp thứ tự ảnh bị đảo:</b> Khi tải nhiều ảnh chụp Listening, hệ thống tự sắp theo tên số (1, 2, 10...) và có nút mũi tên <b>↑ / ↓</b> chỉnh thứ tự + nút <b>Sắp xếp 1→40</b>.
                </li>
              </ul>
            </div>
          )}

          {/* 4. READING GUIDE */}
          {showSection('reading') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-indigo-800 dark:text-indigo-300 flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4" /> 4. Tab Reading — 3 Passage / 40 Câu &amp; Cú Pháp Đục Lỗ
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onJumpToTab('reading');
                    onClose();
                  }}
                  className="text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
                >
                  Mở Tab 3 Reading →
                </button>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-xs leading-relaxed">
                <li>
                  <b>Tạo toàn bộ 3 bài đọc từ 1 file PDF:</b> Vào tab <b>Tạo Tự Động (AI Ảnh / PDF)</b>, chọn PDF Reading + đính kèm Bảng Đáp Án. AI tự chia Passage 1 (1–13), Passage 2 (14–26), Passage 3 (27–40) và tự nhận diện đúng dạng bài (True/False/Not Given, Yes/No/Not Given, Matching Headings, Matching Info ma trận, Summary có/không hộp từ A–I, MCQ).
                </li>
                <li>
                  <b>Hoặc ghép nhiều ảnh chụp màn hình:</b> Chuyển sang tab <b>Ghép Ảnh Chụp Màn Hình</b>, dùng <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-bold">Win+Shift+S</kbd> + <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-bold">Ctrl+V</kbd> nhiều ảnh liên tiếp để AI ghép hoàn chỉnh.
                </li>
                <li>
                  <b>Cú pháp Đục lỗ <code>{'{{1}}'}</code> &amp; nhiều đáp án đúng:</b> Trong tab <b>Đục Lỗ Tự Động</b>, viết <code>the {'{{1}}'} Room – seats 100</code> rồi bấm <b>Đồng Bộ Câu Hỏi</b>. Khi nhập đáp án đúng, dùng dấu gạch đứng <code>|</code> để chấp nhận nhiều cách viết (VD: <code>15 | fifteen | 15%</code>).
                </li>
                <li>
                  <b>Chia nhanh câu vào 3 Passage:</b> Nếu câu hỏi bị dồn chung vào Passage 1, bấm nút <b>Chia Nhanh Câu Theo Passage</b> ngay đầu Tab Reading (tự tách 1–13, 14–26, 27–40 chỉ trong 1 giây).
                </li>
              </ul>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono">
                  <div className="text-[11px] font-sans font-bold uppercase text-slate-400 mb-1">Cú pháp bạn gõ:</div>
                  <code>• the {'{{1}}'} Room – seats {'{{2}}'}</code>
                </div>
                <div className="p-2.5 rounded-xl bg-[#EDFFFD] dark:bg-teal-950/30 border border-[#B5F5F1] dark:border-teal-500/30">
                  <div className="text-[11px] font-bold uppercase text-[#007A7A] dark:text-[#1EE1D6] mb-1">Học sinh thấy khi thi:</div>
                  <span>• the </span>
                  <span className="inline-block px-3 py-0.5 rounded-full border border-[#007A7A] bg-white dark:bg-slate-900 text-[#007A7A] font-bold">1</span>
                  <span> Room – seats </span>
                  <span className="inline-block px-3 py-0.5 rounded-full border border-[#007A7A] bg-white dark:bg-slate-900 text-[#007A7A] font-bold">2</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. WRITING GUIDE */}
          {showSection('writing') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-sm">
                  <PenTool className="w-4 h-4" /> 5. Tab Writing — Tự Động Tách Đề &amp; Cắt Ảnh Biểu Đồ Task 1
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onJumpToTab('writing');
                    onClose();
                  }}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                >
                  Mở Tab 4 Writing →
                </button>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-xs leading-relaxed">
                <li>
                  <b>Tự động tạo từ PDF hoặc Ảnh chụp (Google Docs / Cambridge):</b> Ngay đầu Tab 4 Writing có khung <b>AI Tạo Tự Động Writing</b>. Thả file <b>.PDF</b> hoặc chụp dán <code>Ctrl+V</code> — AI tự điền đề <b>Task 1</b> (tối thiểu 150 từ), <b>tự khoanh &amp; cắt sắc nét hình biểu đồ / bản đồ / quy trình</b> đưa vào ô Ảnh Task 1, và điền đề <b>Task 2</b> (tối thiểu 250 từ).
                </li>
                <li>
                  <b>Tùy chỉnh ảnh biểu đồ nhanh:</b> Sau khi AI cắt xong, có sẵn nút chuyển nhanh giữa <b>Ảnh biểu đồ tự cắt</b> và <b>Dùng cả trang gốc</b> (hoặc tải file ảnh riêng nếu muốn).
                </li>
                <li>
                  <b>Bài mẫu tham khảo (không bắt buộc):</b> Chỉ hiển thị cho học sinh khi đề bật quyền <i>Cho phép xem đáp án sau khi nộp</i>.
                </li>
              </ul>
            </div>
          )}

          {/* 6. SPEAKING GUIDE */}
          {showSection('speaking') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-rose-800 dark:text-rose-300 flex items-center gap-2 text-sm">
                  <Mic className="w-4 h-4" /> 6. Tab Speaking — 3 Phần &amp; Kịch Bản Lời Dẫn Giám Khảo AI
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onJumpToTab('speaking');
                    onClose();
                  }}
                  className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline"
                >
                  Mở Tab 5 Speaking →
                </button>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-xs leading-relaxed">
                <li>
                  <b>Tạo nhanh cả 3 Part bằng AI:</b> Gõ chủ đề (VD: <i>Sustainable Cities &amp; Modern Education</i>) rồi bấm <b>AI Tạo Bộ Câu Hỏi</b> để sinh đủ Part 1 (4 câu), Part 2 (Cue Card + 4 ý <i>You should say</i>) và Part 3 (4 câu thảo luận sâu).
                </li>
                <li>
                  <b>Giám khảo AI nói lời dẫn chuẩn Cambridge trước mỗi Part:</b> Hệ thống tự động phát lời dẫn chuẩn cho cả <b>đề lẻ</b> và <b>Mock Test / Thực Chiến</b>, tự thay thế phần gạch chân theo từng đề bằng biến <code>{'{{part1_topic}}'}</code>, <code>{'{{part2_title}}'}</code>, <code>{'{{part3_topic}}'}</code>. Bạn có thể xem trước &amp; tùy chỉnh câu chữ ở cuối Tab 5.
                </li>
                <li>
                  <b>Ghi âm giọng giáo viên (tùy chọn):</b> Mỗi câu hỏi đều có nút <b>Thu âm trực tiếp</b> hoặc <b>Tải file MP3</b> nếu Ms. Như muốn học viên nghe giọng thật thay vì giọng AI tiếng Anh.
                </li>
              </ul>
            </div>
          )}

          {/* 7. NON-MANDATORY & TROUBLESHOOTING */}
          {showSection('faq') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/75 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-500/35 space-y-2 text-xs">
              <h3 className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4" /> 7. Mẹo Nhanh &amp; Những Phần KHÔNG BẮT BUỘC
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-amber-950/90 dark:text-amber-200/90 leading-relaxed">
                <li>
                  <b>Những phần có thể bỏ trống:</b> Ảnh minh họa bài đọc (khi đã có chữ), Bài văn mẫu Writing, Audio ghi âm Speaking từng câu (máy tự đọc tiếng Anh chuẩn + lời dẫn giám khảo), Gợi ý ôn tập.
                </li>
                <li>
                  <b>Cần sửa nhanh 1 câu sau khi AI trích xuất:</b> Chuyển qua tab <b>Tất Cả Câu Hỏi</b> → sửa trực tiếp đề câu hỏi, đổi dạng câu hoặc tick lại đáp án đúng, bấm <b>Sắp xếp 1→40</b> nếu số câu chưa đúng thứ tự.
                </li>
                <li>
                  <b>Bản nháp tự động lưu cục bộ:</b> Khi đang soạn dở, hệ thống tự giữ nháp trên máy; chỉ khi bạn bấm <b>Lưu Toàn Bộ Đề Thi</b> (nút xanh góc trên phải) thì đề mới đồng bộ lên server.
                </li>
                <li className="flex items-start gap-1.5 list-none -ml-5 pt-1">
                  <Camera className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700 dark:text-amber-300" />
                  <span>
                    <b>Mẹo chụp ảnh siêu nét:</b> Phóng to PDF lên 125–150% trước khi bấm <code>Win+Shift+S</code> rồi dán <code>Ctrl+V</code> vào ô AI để OCR đọc chính xác 100% số liệu &amp; chữ in nhỏ.
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <FileCode2 className="w-3.5 h-3.5 text-[#007A7A]" />
            <span>Mẹo: Bấm các nút &quot;Mở Tab...&quot; ở từng mục để nhảy thẳng tới đúng chỗ cần thao tác.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold transition"
          >
            Đã Hiểu, Đóng Hướng Dẫn
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BuilderGuideBanner({
  builderTab,
  onJumpToTab,
  onLoadSampleTemplate,
  onOpenGuideModal,
  testForm
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('lexiprep_builder_guide_collapsed') === '1';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('lexiprep_builder_guide_collapsed', next ? '1' : '0');
      } catch {
        // Ignore storage restrictions
      }
      return next;
    });
  };

  const hasTitle = Boolean(String(testForm?.title || '').trim());
  const listeningSlotCount = countQuestionSlots(testForm?.listening?.questions);
  const listeningTracks = getListeningTracks(testForm?.listening);
  const hasListeningAudioOrText = listeningTracks.some(
    tr => Boolean(tr.audioUrl || tr.transcript?.trim() || tr.clozeText?.trim())
  );
  const readingSlotCount = countQuestionSlots(testForm?.reading?.questions);
  const readingPassages = getReadingPassages(testForm?.reading);
  const hasReadingContent = readingPassages.some(
    p => Boolean(p.passageText?.trim() || p.imageUrl || p.clozeText?.trim())
  );
  const hasTask1 = Boolean(testForm?.writing?.task1?.prompt?.trim());
  const hasTask1Img = Boolean(testForm?.writing?.task1?.imageUrl);
  const hasTask2 = Boolean(testForm?.writing?.task2?.prompt?.trim());
  const hasWritingContent = hasTask1 || hasTask2;
  const speakingItems = getSpeakingQuestionItems(testForm?.speaking, 'all');
  const hasSpeakingContent = speakingItems.length > 0;

  const writingDetail = hasTask1 && hasTask2
    ? `T1${hasTask1Img ? '+Ảnh' : ''} & T2`
    : hasTask1
    ? `Task 1${hasTask1Img ? '+Ảnh' : ''}`
    : hasTask2
    ? 'Đã nhập Task 2'
    : 'Chưa nhập đề viết';

  const steps = [
    {
      id: 'general',
      num: 1,
      label: 'Tên & 3 PDF',
      icon: Sparkles,
      done: hasTitle,
      detail: hasTitle ? 'Đã đặt tên đề' : 'Chưa nhập tên đề'
    },
    {
      id: 'listening',
      num: 2,
      label: 'Listening',
      icon: Headphones,
      done: listeningSlotCount > 0 || hasListeningAudioOrText,
      detail: listeningSlotCount > 0 ? `${listeningTracks.length} bài · ${listeningSlotCount}/40 câu` : hasListeningAudioOrText ? 'Đã có bài nghe' : 'Chưa có câu hỏi'
    },
    {
      id: 'reading',
      num: 3,
      label: 'Reading',
      icon: BookOpen,
      done: readingSlotCount > 0 || hasReadingContent,
      detail: readingSlotCount > 0 ? `${readingPassages.length} bài · ${readingSlotCount}/40 câu` : hasReadingContent ? 'Đã có bài đọc' : 'Chưa có bài đọc'
    },
    {
      id: 'writing',
      num: 4,
      label: 'Writing',
      icon: PenTool,
      done: hasWritingContent,
      detail: writingDetail
    },
    {
      id: 'speaking',
      num: 5,
      label: 'Speaking',
      icon: Mic,
      done: hasSpeakingContent,
      detail: hasSpeakingContent ? `3 phần · ${speakingItems.length} câu` : 'Chưa có câu hỏi'
    }
  ];

  const activeTip = GUIDE_TAB_TIPS[builderTab] || GUIDE_TAB_TIPS.general;

  return (
    <div className="mb-6 bg-gradient-to-r from-[#EDFFFD] via-white to-sky-50/70 dark:from-[#06282B]/70 dark:via-slate-900 dark:to-slate-900 rounded-3xl border border-[#B5F5F1] dark:border-teal-500/35 p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#007A7A] text-white flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-[#0F172B] dark:text-white">
              Trợ Lý Hướng Dẫn Tạo Đề (Quy trình 5 bước chuẩn 4 Kỹ Năng IELTS)
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400">
              Mẹo nhanh: Dùng khung <b>Tạo Nhanh 3 PDF</b> ở Bước 1 để AI dựng cùng lúc Listening, Reading và Writing (tự cắt ảnh biểu đồ)!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLoadSampleTemplate}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 transition flex items-center gap-1.5 shadow-xs"
            title="Điền sẵn 1 bộ khung đề mẫu để bạn xem cấu trúc và sửa lại chữ cho dễ"
          >
            <Wand2 className="w-3.5 h-3.5" /> Nạp Đề Mẫu Để Tập Sửa
          </button>

          <button
            type="button"
            onClick={onOpenGuideModal}
            className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#007A7A] hover:bg-[#065B5B] text-white transition flex items-center gap-1.5 shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Xem Hướng Dẫn Chi Tiết
          </button>

          <button
            type="button"
            onClick={toggleCollapsed}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
            title={collapsed ? 'Mở rộng thanh hướng dẫn' : 'Thu gọn thanh hướng dẫn'}
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            <span>{collapsed ? 'Mở' : 'Gọn'}</span>
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {steps.map(st => {
              const isCurrent = builderTab === st.id;
              const StepIcon = st.icon;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onJumpToTab(st.id)}
                  className={`text-left p-2.5 rounded-2xl border transition flex items-center gap-2 ${
                    isCurrent
                      ? 'bg-white dark:bg-slate-800 border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#00B2AD]/20 shadow-xs'
                      : 'bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-700/80 hover:border-[#007A7A]/60'
                  }`}
                >
                  {st.done ? (
                    <CheckCircle2 className="w-4 h-4 text-[#059271] dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-[#0F172B] dark:text-white flex items-center gap-1 truncate">
                      <StepIcon className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6] shrink-0" />
                      <span className="truncate">{st.num}. {st.label}</span>
                    </div>
                    <div
                      className={`text-[11px] font-semibold truncate ${
                        st.done ? 'text-[#059271] dark:text-emerald-400' : 'text-[#475569] dark:text-slate-400'
                      }`}
                    >
                      {st.detail}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 text-xs flex items-start gap-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EDFFFD] dark:bg-teal-500/20 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 shrink-0 mt-0.5">
              Mẹo Bước Này
            </span>
            <p className="text-[#314158] dark:text-slate-300 leading-relaxed">
              <strong className="text-[#0F172B] dark:text-white">{activeTip.title}:</strong> {activeTip.text}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
