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
  PenTool,
  ShieldCheck,
  Sparkles,
  Wand2,
  X
} from 'lucide-react';
import { getListeningTracks, getReadingPassages } from '../../constants/seedData';

const GUIDE_TAB_TIPS = {
  general: {
    title: 'Bước 1: Đặt tên & Chọn kiểu thi',
    text: 'Bạn CHỈ BẮT BUỘC nhập "Tên Đề Thi". Mọi ô còn lại đều đã có sẵn giá trị mặc định. Muốn nhanh hơn nữa, hãy bấm 1 nút trong khung "Chọn Nhanh Cấu Hình" bên dưới.'
  },
  listening: {
    title: 'Bước 2: Soạn Phần Nghe (Listening)',
    text: 'Nhập audio/Transcript ở hộp trên. Ở hộp câu hỏi bên dưới có các tab riêng để bạn đỡ rối: "Tạo Tự Động (AI Ảnh)", "Đục Lỗ Tự Động ({{1}})", hoặc "Tạo Bằng Tay". Mọi câu đều có nhãn phân biệt Tự động vs Tạo bằng tay.'
  },
  reading: {
    title: 'Bước 3: Soạn Phần Đọc (Reading)',
    text: 'Dán bài đọc ở hộp trên, rồi chọn tab tạo câu hỏi tương ứng ở hộp dưới: dùng "Tạo Tự Động (AI Ảnh)" để AI tự chép bài & câu hỏi, hoặc chọn "Đục Lỗ Tự Động" / "Tạo Bằng Tay" theo nhu cầu.'
  },
  writing: {
    title: 'Bước 4: Soạn Đề Viết (Writing) & Lưu',
    text: 'Nhập đề bài cho Task 1 và Task 2. Hình ảnh biểu đồ và bài văn mẫu không bắt buộc (có thể bỏ trống). Xong rồi hãy bấm nút xanh "Lưu Toàn Bộ Đề Thi" ở góc trên bên phải.'
  }
};

export function BuilderGuideModal({ isOpen, onClose, onJumpToTab }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] bg-white dark:bg-[#0F172B] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-[#007A7A] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold leading-tight">
                Hướng Dẫn Tạo Đề Thi Dành Cho Giáo Viên (Dễ Hiểu Từng Bước)
              </h2>
              <p className="text-xs text-teal-100 mt-0.5">
                Không cần rành công nghệ vẫn làm được trong vài phút
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition"
            aria-label="Đóng hướng dẫn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-[#314158] dark:text-slate-200">
          {/* Quick 4-step overview */}
          <div className="p-4 rounded-2xl bg-[#EDFFFD] dark:bg-teal-950/35 border border-[#B5F5F1] dark:border-teal-500/30 space-y-2.5">
            <h3 className="font-extrabold text-[#007A7A] dark:text-[#1EE1D6] flex items-center gap-2 text-sm">
              <Lightbulb className="w-4 h-4" /> Tóm tắt quy trình 4 bước (Làm lần lượt từ trái sang phải)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  onJumpToTab('general');
                  onClose();
                }}
                className="text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#B5F5F1] dark:border-slate-700 hover:border-[#007A7A] transition"
              >
                <span className="font-extrabold text-[#007A7A] dark:text-[#1EE1D6]">Tab 1 • Cài đặt chung</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Gõ Tên đề thi. Muốn làm nháp chưa cho học sinh thấy thì giữ chế độ &quot;Chỉ mình tôi (Ẩn)&quot;.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  onJumpToTab('listening');
                  onClose();
                }}
                className="text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#B5F5F1] dark:border-slate-700 hover:border-[#007A7A] transition"
              >
                <span className="font-extrabold text-blue-600 dark:text-blue-400">Tab 2 • Phần Nghe (Listening)</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Tải MP3 hoặc dán lời thoại tiếng Anh vào ô Transcript để máy tự đọc. Thêm câu hỏi hoặc quét từ ảnh.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  onJumpToTab('reading');
                  onClose();
                }}
                className="text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#B5F5F1] dark:border-slate-700 hover:border-[#007A7A] transition"
              >
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Tab 3 • Phần Đọc (Reading)</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Dán đoạn bài đọc (hoặc gửi ảnh cho AI chép chữ), sau đó thêm câu hỏi và chọn đáp án đúng.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  onJumpToTab('writing');
                  onClose();
                }}
                className="text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#B5F5F1] dark:border-slate-700 hover:border-[#007A7A] transition"
              >
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Tab 4 • Phần Viết &amp; Lưu</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Dán đề bài Writing Task 1 &amp; 2 rồi bấm nút <strong>Lưu Toàn Bộ Đề Thi</strong> màu xanh ở góc trên.
                </p>
              </button>
            </div>
          </div>

          {/* Method 1: Photo AI */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Cách Nhàn Nhất: Dùng Ảnh Đề Thi (Không Cần Gõ Tay)
            </h3>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs leading-relaxed">
              <li>
                Mở file PDF/Word hoặc sách đề thi trên màn hình. Dùng phím <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-[11px] font-bold">Windows + Shift + S</kbd> (trên Windows) để chụp vùng câu hỏi cần tạo.
              </li>
              <li>
                Mở tab <strong>Tạo Tự Động (AI Ảnh)</strong>, bấm chuột vào ô khung viền nét đứt rồi nhấn <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-[11px] font-bold">Ctrl + V</kbd> (hoặc bấm nút Chọn Ảnh từ máy).
              </li>
              <li>
                Nếu có bảng đáp án ngắn dạng chữ (VD: <code>1. garden</code>, <code>2. 115</code>), dán vào ô <em>Bảng Đáp Án</em> rồi bấm <strong>AI Đọc Ảnh &amp; Tạo Đề Ngay</strong>. Các câu sinh ra sẽ được gắn nhãn <strong>Tự động (AI Ảnh)</strong> rõ ràng.
              </li>
            </ol>
          </div>

          {/* Method 2: Cloze */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-extrabold text-[#0F172B] dark:text-white flex items-center gap-2 text-sm">
              <FileCode2 className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Cách Tạo Dạng Bài Đục Lỗ (Tab Đục Lỗ Tự Động)
            </h3>
            <p className="text-xs leading-relaxed">
              Vào tab <strong>Đục Lỗ Tự Động ({'{{1}}'})</strong>, bạn chỉ cần gõ hai dấu ngoặc nhọn quanh số thứ tự câu, ví dụ:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono">
                <div className="text-[10px] font-sans font-bold uppercase text-slate-400 mb-1">1. Bạn gõ vào ô Đục lỗ:</div>
                <code>• the {'{{1}}'} Room – seats 100</code>
              </div>
              <div className="p-3 rounded-xl bg-[#EDFFFD] dark:bg-teal-950/30 border border-[#B5F5F1] dark:border-teal-500/30">
                <div className="text-[10px] font-bold uppercase text-[#007A7A] dark:text-[#1EE1D6] mb-1">2. Học sinh sẽ nhìn thấy:</div>
                <span>• the </span>
                <span className="inline-block px-4 py-0.5 rounded-full border border-[#007A7A] bg-white dark:bg-slate-900 text-[#007A7A] font-bold">
                  1
                </span>
                <span> Room – seats 100</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Sau khi gõ xong, bấm nút <strong>Đồng Bộ Câu Hỏi</strong> màu xanh lá rồi kéo xuống điền đáp án đúng cho Câu 1, Câu 2... (Mẹo: dùng dấu <code>|</code> nếu có nhiều đáp án đúng, VD: <code>Garden | garden room</code>).
            </p>
          </div>

          {/* Checklist of non-mandatory fields */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 space-y-1.5 text-xs">
            <h3 className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4" /> Những phần KHÔNG BẮT BUỘC (Có thể bỏ trống cho đỡ rối)
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-amber-900/90 dark:text-amber-200/90">
              <li><strong>Ảnh sơ đồ / Văn bản đề dẫn phụ:</strong> Chỉ mở dùng khi bài nghe có bản đồ (Map) hoặc bài đọc có tranh minh họa.</li>
              <li><strong>File ghi âm MP3:</strong> Nếu bạn chưa tải được file nghe, chỉ cần dán đoạn văn tiếng Anh vào ô <em>Transcript</em>, khi học sinh bấm Nghe máy sẽ tự đọc to.</li>
              <li><strong>Nhiều chủ đề / nhiều bài đọc:</strong> Đề kiểm tra ngắn chỉ cần để mặc định 1 Chủ đề là đủ, không cần bấm thêm nhiều Part.</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
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
  const listeningQCount = testForm?.listening?.questions?.length || 0;
  const listeningTracks = getListeningTracks(testForm?.listening);
  const hasListeningAudioOrText = listeningTracks.some(
    tr => Boolean(tr.audioUrl || tr.transcript?.trim() || tr.clozeText?.trim())
  );
  const readingQCount = testForm?.reading?.questions?.length || 0;
  const readingPassages = getReadingPassages(testForm?.reading);
  const hasReadingContent = readingPassages.some(
    p => Boolean(p.passageText?.trim() || p.imageUrl || p.clozeText?.trim())
  );
  const hasWritingContent = Boolean(
    testForm?.writing?.task1?.prompt?.trim() || testForm?.writing?.task2?.prompt?.trim()
  );

  const steps = [
    {
      id: 'general',
      num: 1,
      label: 'Tên & Cài đặt',
      icon: Sparkles,
      done: hasTitle,
      detail: hasTitle ? 'Đã đặt tên đề' : 'Chưa nhập tên đề'
    },
    {
      id: 'listening',
      num: 2,
      label: 'Listening',
      icon: Headphones,
      done: listeningQCount > 0 || hasListeningAudioOrText,
      detail: listeningQCount > 0 ? `${listeningQCount} câu hỏi` : hasListeningAudioOrText ? 'Đã có bài nghe' : 'Chưa có câu hỏi'
    },
    {
      id: 'reading',
      num: 3,
      label: 'Reading',
      icon: BookOpen,
      done: readingQCount > 0 || hasReadingContent,
      detail: readingQCount > 0 ? `${readingQCount} câu hỏi` : hasReadingContent ? 'Đã có bài đọc' : 'Chưa có bài đọc'
    },
    {
      id: 'writing',
      num: 4,
      label: 'Writing',
      icon: PenTool,
      done: hasWritingContent,
      detail: hasWritingContent ? 'Đã nhập đề viết' : 'Chưa nhập đề bài'
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
              Trợ Lý Hướng Dẫn Tạo Đề (Làm theo 4 bước bên dưới)
            </h2>
            <p className="text-[11px] text-[#62748E] dark:text-slate-400">
              Không cần điền tất cả mọi ô — chỉ điền những phần bạn có, xong bấm Lưu ở góc trên.
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {steps.map(st => {
              const isCurrent = builderTab === st.id;
              const StepIcon = st.icon;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onJumpToTab(st.id)}
                  className={`text-left p-2.5 rounded-2xl border transition flex items-center gap-2.5 ${
                    isCurrent
                      ? 'bg-white dark:bg-slate-800 border-[#007A7A] dark:border-[#1EE1D6] ring-2 ring-[#00B2AD]/20 shadow-xs'
                      : 'bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-700/80 hover:border-[#007A7A]/60'
                  }`}
                >
                  {st.done ? (
                    <CheckCircle2 className="w-5 h-5 text-[#059271] dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-[#0F172B] dark:text-white flex items-center gap-1 truncate">
                      <StepIcon className="w-3.5 h-3.5 text-[#007A7A] dark:text-[#1EE1D6] shrink-0" />
                      <span className="truncate">{st.num}. {st.label}</span>
                    </div>
                    <div
                      className={`text-[10px] font-semibold truncate ${
                        st.done ? 'text-[#059271] dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
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
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EDFFFD] dark:bg-teal-500/20 text-[#007A7A] dark:text-[#1EE1D6] border border-[#B5F5F1] dark:border-teal-500/30 shrink-0 mt-0.5">
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
