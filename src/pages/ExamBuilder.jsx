import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronLeft,
  Clock,
  EyeOff,
  FileText,
  Globe,
  Headphones,
  Image,
  Lock,
  PenTool,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Unlock,
  Upload
} from 'lucide-react';
import { getListeningTracks, getReadingPassages, normalizeExamConfig } from '../constants/seedData';
import { clearBuilderDraft } from '../utils/sessionPersistence';

export default function ExamBuilder({
  addQuestionToSkill,
  builderListeningIdx,
  builderReadingIdx,
  builderTab,
  currentUser,
  editingTest,
  handleAudioFileUpload,
  handleListeningImageUpload,
  handleReadingImageUpload,
  handleSaveTestBuilder,
  handleWritingTask1ImageUpload,
  removeQuestionFromSkill,
  setBuilderListeningIdx,
  setBuilderReadingIdx,
  setBuilderTab,
  setEditingTest,
  setTestForm,
  setView,
  setZoomedReadingImg,
  testForm,
  updateListeningTrackField,
  updateOptionInSkill,
  updateQuestionInSkill,
  updateReadingPassageField
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <button
            onClick={() => {
              clearBuilderDraft(currentUser?.username);
              setEditingTest(null);
              setView('TEACHER_DASHBOARD');
            }}
            className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Quay Lại Bảng Điều Khiển Giáo Viên
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {editingTest ? `Chỉnh Sửa Đề Thi: ${editingTest.title}` : 'Tạo & Biên Soạn Đề Thi IELTS Mới'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tùy chỉnh câu hỏi Listening (kèm file ghi âm MP3/WAV), Reading (kèm hình ảnh minh họa), Writing và quyền xem đáp án.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              clearBuilderDraft(currentUser?.username);
              setEditingTest(null);
              setView('TEACHER_DASHBOARD');
            }}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleSaveTestBuilder}
            className="bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Lưu Toàn Bộ Đề Thi
          </button>
        </div>
      </div>

      {/* Builder Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setBuilderTab('general')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            builderTab === 'general'
              ? 'bg-[#007A7A] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> 1. Thời Gian Từng Phần, Ẩn/Hiện & Thi Thử/Thi Thật
        </button>
        <button
          onClick={() => setBuilderTab('listening')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            builderTab === 'listening'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Headphones className="w-4 h-4" /> 2. Phần Listening & Chủ Đề ({getListeningTracks(testForm.listening).length > 1 ? `${getListeningTracks(testForm.listening).length} chủ đề • ` : ''}{testForm.listening?.questions?.length || 0} câu)
        </button>
        <button
          onClick={() => setBuilderTab('reading')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            builderTab === 'reading'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> 3. Phần Reading & Hình Ảnh ({testForm.reading?.questions?.length || 0} câu)
        </button>
        <button
          onClick={() => setBuilderTab('writing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
            builderTab === 'writing'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PenTool className="w-4 h-4" /> 4. Phần Writing & Bài Mẫu
        </button>
      </div>

      {/* TAB 1: GENERAL SETTINGS, VISIBILITY, ATTEMPT LIMITS, SECTION TIMERS & ANSWER PERMISSIONS */}
      {builderTab === 'general' && (() => {
        const cfg = normalizeExamConfig(testForm);
        const skillLabels = {
          listening: { name: 'Listening', icon: Headphones, color: 'text-blue-600 dark:text-blue-400' },
          reading: { name: 'Reading', icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400' },
          writing: { name: 'Writing', icon: PenTool, color: 'text-purple-600 dark:text-purple-400' }
        };
        const moveSectionOrder = (idx, dir) => {
          const nextIdx = idx + dir;
          if (nextIdx < 0 || nextIdx >= cfg.order.length) return;
          const nextOrder = [...cfg.order];
          [nextOrder[idx], nextOrder[nextIdx]] = [nextOrder[nextIdx], nextOrder[idx]];
          setTestForm(prev => ({ ...prev, sectionOrder: nextOrder }));
        };

        return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Tên Đề Thi IELTS
              </label>
              <input
                type="text"
                value={testForm.title}
                onChange={e => setTestForm({ ...testForm, title: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="VD: IELTS Academic Practice Test 05 - Cambridge Format"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Giới Hạn Số Lần Nghe Audio
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={testForm.maxAudioPlays}
                onChange={e => setTestForm({ ...testForm, maxAudioPlays: Number(e.target.value) || 1 })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Mô Tả Chi Tiết Đề Thi
            </label>
            <textarea
              rows={2}
              value={testForm.description}
              onChange={e => setTestForm({ ...testForm, description: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Mô tả nội dung các phần thi để học viên nắm rõ trước khi bắt đầu..."
            />
          </div>

          {/* Visibility & Max Attempts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Visibility Setting */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  {cfg.visibility === 'private' ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Globe className="w-4 h-4 text-emerald-500" />}
                  Chế Độ Hiển Thị Đề Thi
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Chọn <b>Chỉ mình tôi</b> khi đang soạn thảo để học viên không nhìn thấy hoặc bấm nhầm.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, visibility: 'public' }))}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    cfg.visibility === 'public'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Công khai (HS thấy)
                </button>
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, visibility: 'private' }))}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    cfg.visibility === 'private'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" /> Chỉ mình tôi (Ẩn)
                </button>
              </div>
            </div>

            {/* Attempt Limit Setting */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-500" /> Số Lần Học Viên Được Làm Bài
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Đặt <b>0</b> để ôn tập tự do không giới hạn, hoặc <b>1</b> nếu dùng để kiểm tra / thi thật.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, maxAttempts: 0 }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    cfg.maxAttempts === 0
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  ∞ Thi Thử (Nhiều lần)
                </button>
                <button
                  type="button"
                  onClick={() => setTestForm(prev => ({ ...prev, maxAttempts: 1 }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    cfg.maxAttempts === 1
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  🔒 Thi Thật (1 lần)
                </button>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Tùy chỉnh:</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={cfg.maxAttempts}
                    onChange={e => setTestForm(prev => ({ ...prev, maxAttempts: Math.max(0, Number(e.target.value) || 0) }))}
                    className="w-16 px-2.5 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Per-Skill Durations & Sequential Section Order */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Thời Gian Từng Kỹ Năng & Thứ Tự Thi Luân Phiên
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Đặt số phút riêng cho mỗi kỹ năng (VD: Reading 30p, Listening 15p) và sắp xếp thứ tự làm bài từ trên xuống dưới.
                </p>
              </div>
              <span className="text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full shrink-0">
                Tổng thời gian: {cfg.order.reduce((acc, s) => acc + cfg.durations[s], 0)} phút
              </span>
            </div>

            <div className="space-y-2.5">
              {cfg.order.map((sId, idx) => {
                const meta = skillLabels[sId];
                const IconComp = meta.icon;
                return (
                  <div
                    key={sId}
                    className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <IconComp className={`w-4 h-4 ${meta.color}`} />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">{meta.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={cfg.durations[sId]}
                          onChange={e => {
                            const mins = Math.max(1, Number(e.target.value) || 1);
                            setTestForm(prev => ({
                              ...prev,
                              sectionDurations: { ...normalizeExamConfig(prev).durations, [sId]: mins }
                            }));
                          }}
                          className="w-16 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-extrabold text-center"
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">phút</span>
                      </div>

                      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-3">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSectionOrder(idx, -1)}
                          title="Đưa lên trước"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === cfg.order.length - 1}
                          onClick={() => moveSectionOrder(idx, 1)}
                          title="Đưa xuống sau"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-100">
                <input
                  type="checkbox"
                  checked={cfg.sequentialMode}
                  onChange={e => setTestForm(prev => ({ ...prev, sequentialMode: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span>Khóa tuần tự theo từng phần (Hết giờ mới tự động sang kỹ năng kế tiếp)</span>
              </label>

              {cfg.sequentialMode && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={cfg.allowEarlyNextSection}
                    onChange={e => setTestForm(prev => ({ ...prev, allowEarlyNextSection: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Cho phép nộp sớm để sang phần sau</span>
                </label>
              )}
            </div>
          </div>

          {/* Permission Control Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 dark:from-indigo-950/50 dark:via-slate-800/80 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl ${testForm.allowViewAnswers ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-amber-300'}`}>
                {testForm.allowViewAnswers ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Quyền Xem Đáp Án Đúng Khi Xem Lại Điểm (Dành Cho Học Sinh)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-xl">
                  Khi bật tính năng này, học sinh sau khi nộp bài có thể nhìn thấy đáp án đúng của từng câu Listening, Reading và bài mẫu Writing. Nếu tắt, học sinh chỉ biết câu trả lời của mình là Đúng/Sai còn đáp án đúng sẽ bị khóa.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTestForm(prev => ({ ...prev, allowViewAnswers: !prev.allowViewAnswers }))}
              className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-sm flex-shrink-0 ${
                testForm.allowViewAnswers
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700'
              }`}
            >
              {testForm.allowViewAnswers ? (
                <>
                  <Unlock className="w-4 h-4" /> Đang Bật Cho Phép Xem Đáp Án
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Đang Khóa Đáp Án Với Học Sinh
                </>
              )}
            </button>
          </div>

          {/* Stealth Anti-Cheat Control Card (Hidden from Student UI) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50/70 to-slate-50 dark:from-rose-950/35 dark:via-slate-800/80 dark:to-slate-900 border border-rose-200 dark:border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl ${cfg.antiCheatEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {cfg.antiCheatEnabled ? <ShieldCheck className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  Chế Độ Chống Gian Lận &amp; Kiểm Tra Extension
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 dark:bg-slate-800 border border-slate-700">
                    Ẩn với học sinh
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-xl">
                  Khi bật, hệ thống đếm số lần rời tab/mất focus, khóa chuột phải &amp; copy/paste/DevTools (vẫn giữ tính năng Highlight Reading/Listening), đồng thời quét DOM và tính toàn vẹn API trình duyệt để phát hiện Extension hỗ trợ hoặc lách luật. Tắt đi nếu muốn cho học sinh luyện tập tự do. Trạng thái này hoàn toàn ẩn ở màn hình danh sách đề của học sinh.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTestForm(prev => ({ ...prev, antiCheatEnabled: !cfg.antiCheatEnabled }))}
              className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-sm flex-shrink-0 ${
                cfg.antiCheatEnabled
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {cfg.antiCheatEnabled ? (
                <>
                  <ShieldCheck className="w-4 h-4" /> Đang Bật Chống Gian Lận
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" /> Đang Tắt (Luyện Tập Tự Do)
                </>
              )}
            </button>
          </div>
        </div>
        );
      })()}

      {/* TAB 2: LISTENING BUILDER (MULTI-TOPIC LIKE READING + AUDIO + IMAGE + CONTEXT + QUESTIONS) */}
      {builderTab === 'listening' && (() => {
        const tracks = getListeningTracks(testForm.listening);
        const activeIdx = Math.min(Math.max(0, builderListeningIdx), tracks.length - 1);
        const activeTrack = tracks[activeIdx];

        const addListeningTrack = () => {
          const nextNum = tracks.length + 1;
          const newTrack = {
            id: `track-${Date.now()}`,
            title: `Chủ đề ${nextNum}: Nội dung mới`,
            audioUrl: '',
            audioFileName: '',
            imageUrl: '',
            imageFileName: '',
            contextText: '',
            transcript: ''
          };
          setTestForm(prev => ({
            ...prev,
            listening: {
              ...prev.listening,
              tracks: [...getListeningTracks(prev.listening), newTrack]
            }
          }));
          setBuilderListeningIdx(tracks.length);
        };

        const removeListeningTrack = (removeIdx) => {
          if (tracks.length <= 1) return;
          const nextTracks = tracks.filter((_, i) => i !== removeIdx);
          const first = nextTracks[0] || {};
          setTestForm(prev => ({
            ...prev,
            listening: {
              ...prev.listening,
              tracks: nextTracks,
              audioUrl: first.audioUrl || '',
              audioFileName: first.audioFileName || '',
              imageUrl: first.imageUrl || '',
              imageFileName: first.imageFileName || '',
              contextText: first.contextText || '',
              transcript: first.transcript || '',
              questions: (prev.listening?.questions || []).map(q => {
                if (typeof q.trackIdx !== 'number') return q;
                if (q.trackIdx === removeIdx) return { ...q, trackIdx: 0 };
                if (q.trackIdx > removeIdx) return { ...q, trackIdx: q.trackIdx - 1 };
                return q;
              })
            }
          }));
          setBuilderListeningIdx(Math.max(0, Math.min(activeIdx, nextTracks.length - 1)));
        };

        return (
        <div className="space-y-6">
          {/* Listening Topics, Audio & Optional Diagram Card (mirroring Reading) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Nội Dung Bài Nghe Listening ({tracks.length} Chủ Đề / Bài)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mặc định có 1 chủ đề. Bấm &quot;Thêm Chủ Đề&quot; nếu cần chia nhiều chủ đề / file ghi âm đánh số 1, 2, 3... kèm ảnh sơ đồ/đề chụp hoặc đoạn đề dẫn giống phần Reading.
                </p>
              </div>
              <button
                type="button"
                onClick={addListeningTrack}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Thêm Chủ Đề / Bài Nghe #{tracks.length + 1}
              </button>
            </div>

            {/* Numbered Topic Selector Bar (1, 2, 3...) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                {tracks.map((tr, trIdx) => (
                  <button
                    key={tr.id || trIdx}
                    type="button"
                    onClick={() => setBuilderListeningIdx(trIdx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                      trIdx === activeIdx
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-500/15'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                      trIdx === activeIdx ? 'bg-white text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}>
                      {trIdx + 1}
                    </span>
                    <span className="max-w-[160px] truncate">{tr.title || `Chủ đề ${trIdx + 1}`}</span>
                    {tr.audioUrl && <span title="Đã có file audio">🎵</span>}
                    {tr.imageUrl && <span title="Đã có ảnh minh họa">🖼️</span>}
                  </button>
                ))}
              </div>

              {tracks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeListeningTrack(activeIdx)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa Chủ Đề #{activeIdx + 1}
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tiêu Đề Chủ Đề / Bài Nghe #{activeIdx + 1}
              </label>
              <input
                type="text"
                value={activeTrack?.title || ''}
                onChange={e => updateListeningTrackField(activeIdx, { title: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder={`VD: Chủ đề ${activeIdx + 1}: Everyday Conversation / Campus Map`}
              />
            </div>

            {/* Audio Upload & URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload File Box */}
              <div className="border-2 border-dashed border-blue-200 dark:border-blue-500/40 bg-blue-50/40 dark:bg-blue-500/10 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Tải File Ghi Âm Chủ Đề #{activeIdx + 1} Từ Máy Tính
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                    Hỗ trợ MP3, WAV, OGG, M4A (Tối đa 15MB/file; nếu có nhiều file dung lượng lớn nên dùng Link URL ngoài để tránh đầy bộ nhớ trình duyệt).
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">
                    <Upload className="w-4 h-4" />
                    <span>Chọn File Ghi Âm (.mp3 / .wav)</span>
                    <input
                      key={`audio-upload-${activeIdx}`}
                      type="file"
                      accept="audio/*"
                      onChange={e => handleAudioFileUpload(e, activeIdx)}
                      className="hidden"
                    />
                  </label>

                  {activeTrack?.audioFileName && (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-500/30 text-xs">
                      <span className="font-bold text-blue-800 dark:text-blue-300 truncate">
                        🎵 {activeTrack.audioFileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateListeningTrackField(activeIdx, { audioUrl: '', audioFileName: '' })}
                        className="text-rose-600 dark:text-rose-400 hover:underline font-bold ml-2 shrink-0"
                      >
                        Xóa file
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Audio URL & Preview */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Hoặc Dán Đường Dẫn URL File Audio Chủ Đề #{activeIdx + 1} (.mp3)
                  </label>
                  <input
                    type="text"
                    value={activeTrack?.audioUrl?.startsWith('data:') ? '' : (activeTrack?.audioUrl || '')}
                    onChange={e =>
                      updateListeningTrackField(activeIdx, {
                        audioUrl: e.target.value,
                        audioFileName: e.target.value ? 'External Audio URL' : ''
                      })
                    }
                    placeholder={`https://example.com/ielts-listening-topic-${activeIdx + 1}.mp3`}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {activeTrack?.audioUrl && (
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2">
                      Nghe thử file ghi âm Chủ đề #{activeIdx + 1}:
                    </p>
                    <audio key={`preview-${activeIdx}-${activeTrack.audioUrl.slice(0, 32)}`} controls src={activeTrack.audioUrl} className="w-full h-9" />
                  </div>
                )}
              </div>
            </div>

            {/* Optional Diagram / Question Sheet Image Upload & URL (like Reading) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/40 dark:bg-blue-500/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-500/30">
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-blue-950 dark:text-blue-200 uppercase flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Ảnh Sơ Đồ / Đề Chụp Chủ Đề #{activeIdx + 1} (Tùy chọn)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dùng khi có bản đồ (Map), biểu đồ (Diagram) hoặc ảnh đề chụp riêng cho chủ đề số {activeIdx + 1} giống phần Reading.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">
                    <Upload className="w-4 h-4" />
                    <span>Tải Ảnh Chủ Đề #{activeIdx + 1}</span>
                    <input
                      key={`listening-img-upload-${activeIdx}`}
                      type="file"
                      accept="image/*"
                      onChange={e => handleListeningImageUpload(e, activeIdx)}
                      className="hidden"
                    />
                  </label>

                  {activeTrack?.imageUrl && (
                    <button
                      type="button"
                      onClick={() => updateListeningTrackField(activeIdx, { imageUrl: '', imageFileName: '' })}
                      className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl border border-rose-200 dark:border-rose-500/30 transition"
                    >
                      Xóa Ảnh
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Hoặc dán Link URL hình ảnh:
                  </label>
                  <input
                    type="text"
                    value={activeTrack?.imageUrl?.startsWith('data:') ? '' : (activeTrack?.imageUrl || '')}
                    onChange={e => updateListeningTrackField(activeIdx, { imageUrl: e.target.value })}
                    placeholder="https://example.com/listening-map.png"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 min-h-[160px]">
                {activeTrack?.imageUrl ? (
                  <img
                    src={activeTrack.imageUrl}
                    alt={`Listening Preview ${activeIdx + 1}`}
                    onClick={() => setZoomedReadingImg(activeTrack.imageUrl)}
                    className="max-h-48 object-contain rounded-lg cursor-zoom-in"
                  />
                ) : (
                  <div className="text-center text-xs text-slate-400">
                    <Image className="w-8 h-8 mx-auto mb-1.5 text-slate-300 dark:text-slate-600" />
                    <span>Chưa có hình ảnh cho Chủ đề #{activeIdx + 1}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Context / Prompt Text & Transcript */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Văn Bản Đề Dẫn / Ghi Chú Chủ Đề #{activeIdx + 1} (Tùy chọn)
                </label>
                <textarea
                  rows={4}
                  value={activeTrack?.contextText || ''}
                  onChange={e => updateListeningTrackField(activeIdx, { contextText: e.target.value })}
                  className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed font-serif focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={`VD: Questions 1–10: Complete the notes below... (Bỏ trống nếu không cần)`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Transcript Audio Chủ Đề #{activeIdx + 1} (Dùng cho AI Voice nếu không tải MP3)
                </label>
                <textarea
                  rows={4}
                  value={activeTrack?.transcript || ''}
                  onChange={e => updateListeningTrackField(activeIdx, { transcript: e.target.value })}
                  className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={`Nhập lời thoại bài nghe cho Chủ đề ${activeIdx + 1}...`}
                />
              </div>
            </div>
          </div>

          {/* Listening Questions List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Danh Sách Câu Hỏi Listening ({testForm.listening?.questions?.length || 0} câu)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thêm câu hỏi Trắc nghiệm (MCQ), Điền từ, True/False/Not Given — và gắn vào Chủ đề 1, 2, 3... tương ứng.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addQuestionToSkill('listening')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm Câu Hỏi Listening {tracks.length > 1 ? `(Chủ đề #${activeIdx + 1})` : ''}
              </button>
            </div>

            <div className="space-y-5">
              {(testForm.listening?.questions || []).map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-xs font-extrabold bg-blue-600 text-white px-3 py-1 rounded-lg">
                      Câu hỏi #{idx + 1}
                    </span>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {tracks.length > 1 && (
                        <select
                          value={typeof q.trackIdx === 'number' ? String(q.trackIdx) : ''}
                          onChange={e =>
                            updateQuestionInSkill(
                              'listening',
                              q.id,
                              'trackIdx',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 rounded-xl text-xs font-bold text-blue-800 dark:text-blue-200"
                        >
                          <option value="">Hiện ở tất cả chủ đề</option>
                          {tracks.map((tr, tIdx) => (
                            <option key={tr.id || tIdx} value={String(tIdx)}>
                              Thuộc Chủ đề {tIdx + 1} ({(tr.title || '').slice(0, 18)})
                            </option>
                          ))}
                        </select>
                      )}

                      <select
                        value={q.type}
                        onChange={e => updateQuestionInSkill('listening', q.id, 'type', e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        <option value="mcq">Trắc nghiệm 4 lựa chọn (MCQ)</option>
                        <option value="fill">Điền từ vào chỗ trống (Fill-in-blank)</option>
                        <option value="tfng">True / False / Not Given</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removeQuestionFromSkill('listening', q.id)}
                        className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Nội dung câu hỏi
                    </label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={e => updateQuestionInSkill('listening', q.id, 'question', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Nhập đề bài câu hỏi..."
                    />
                  </div>

                  {q.type === 'mcq' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-2">
                        Các phương án lựa chọn (A, B, C, D)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(q.options || []).map((opt, optIdx) => (
                          <input
                            key={optIdx}
                            type="text"
                            value={opt}
                            onChange={e => updateOptionInSkill('listening', q.id, optIdx, e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder={`Phương án ${optIdx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct Answer Field */}
                  <div className="bg-emerald-50/80 dark:bg-emerald-500/15 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                    <label className="block text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase mb-1">
                      ✅ Đáp án đúng của câu hỏi này (Dùng để chấm điểm tự động)
                    </label>
                    {q.type === 'mcq' || q.type === 'tfng' ? (
                      <select
                        value={q.correctAnswer}
                        onChange={e => updateQuestionInSkill('listening', q.id, 'correctAnswer', e.target.value)}
                        className="w-full sm:w-80 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200"
                      >
                        {(q.options || []).map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={e => updateQuestionInSkill('listening', q.id, 'correctAnswer', e.target.value)}
                          className="w-full sm:w-96 px-3.5 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200"
                          placeholder="VD: 15 | fifteen hoặc color / colour"
                        />
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                          Mẹo: Dùng dấu <code className="font-bold">|</code> hoặc <code className="font-bold">/</code> nếu chấp nhận nhiều đáp án tương đương.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        );
      })()}

      {/* TAB 3: READING BUILDER (MULTI-PASSAGE NUMBERED TOPICS + IMAGE UPLOAD + QUESTIONS CRUD) */}
      {builderTab === 'reading' && (() => {
        const passages = getReadingPassages(testForm.reading);
        const activeIdx = Math.min(Math.max(0, builderReadingIdx), passages.length - 1);
        const activePassage = passages[activeIdx];

        const addReadingPassage = () => {
          const nextNum = passages.length + 1;
          const newP = {
            id: `passage-${Date.now()}`,
            title: `Bài ${nextNum}: Chủ đề mới`,
            imageUrl: '',
            imageFileName: '',
            passageText: ''
          };
          setTestForm(prev => ({
            ...prev,
            reading: {
              ...prev.reading,
              passages: [...getReadingPassages(prev.reading), newP]
            }
          }));
          setBuilderReadingIdx(passages.length);
        };

        const removeReadingPassage = (removeIdx) => {
          if (passages.length <= 1) return;
          const nextPassages = passages.filter((_, i) => i !== removeIdx);
          const first = nextPassages[0] || {};
          setTestForm(prev => ({
            ...prev,
            reading: {
              ...prev.reading,
              passages: nextPassages,
              passageTitle: first.title || '',
              passageText: first.passageText || '',
              imageUrl: first.imageUrl || '',
              imageFileName: first.imageFileName || '',
              questions: (prev.reading?.questions || []).map(q => {
                if (typeof q.passageIdx !== 'number') return q;
                if (q.passageIdx === removeIdx) return { ...q, passageIdx: 0 };
                if (q.passageIdx > removeIdx) return { ...q, passageIdx: q.passageIdx - 1 };
                return q;
              })
            }
          }));
          setBuilderReadingIdx(Math.max(0, Math.min(activeIdx, nextPassages.length - 1)));
        };

        return (
        <div className="space-y-6">
          {/* Reading Passage & Image Upload Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#007A7A] dark:text-[#1EE1D6]" /> Nội Dung Bài Đọc Reading ({passages.length} Chủ Đề / Bài)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tạo nhiều bài đọc / chủ đề đánh số 1, 2, 3... để học sinh chuyển qua lại dễ dàng khi có nhiều ảnh hoặc nhiều đoạn đọc.
                </p>
              </div>
              <button
                type="button"
                onClick={addReadingPassage}
                className="bg-[#007A7A] hover:bg-[#065B5B] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Thêm Chủ Đề / Bài Đọc #{passages.length + 1}
              </button>
            </div>

            {/* Numbered Passage Selector Bar (1, 2, 3...) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                {passages.map((p, pIdx) => (
                  <button
                    key={p.id || pIdx}
                    type="button"
                    onClick={() => setBuilderReadingIdx(pIdx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border transition ${
                      pIdx === activeIdx
                        ? 'bg-[#007A7A] text-white border-[#007A7A] shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-[#EDFFFD] dark:hover:bg-teal-500/15'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                      pIdx === activeIdx ? 'bg-white text-[#007A7A]' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}>
                      {pIdx + 1}
                    </span>
                    <span className="max-w-[160px] truncate">{p.title || `Bài đọc ${pIdx + 1}`}</span>
                  </button>
                ))}
              </div>

              {passages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeReadingPassage(activeIdx)}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa Bài #{activeIdx + 1}
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tiêu Đề Bài Đọc / Chủ Đề #{activeIdx + 1}
              </label>
              <input
                type="text"
                value={activePassage?.title || ''}
                onChange={e => updateReadingPassageField(activeIdx, { title: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={`VD: Bài ${activeIdx + 1}: The Evolution of Urban Architecture`}
              />
            </div>

            {/* Reading Image Upload & URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/40 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 uppercase flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Ảnh Minh Họa / Đề Chụp Bài #{activeIdx + 1}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tải ảnh từ máy tính (.png, .jpg, .webp) hoặc dán link URL hình ảnh riêng cho bài đọc số {activeIdx + 1}.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">
                    <Upload className="w-4 h-4" />
                    <span>Tải Ảnh Cho Bài #{activeIdx + 1}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleReadingImageUpload(e, activeIdx)}
                      className="hidden"
                    />
                  </label>

                  {activePassage?.imageUrl && (
                    <button
                      type="button"
                      onClick={() => updateReadingPassageField(activeIdx, { imageUrl: '', imageFileName: '' })}
                      className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl border border-rose-200 dark:border-rose-500/30 transition"
                    >
                      Xóa Ảnh
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Hoặc dán Link URL hình ảnh:
                  </label>
                  <input
                    type="text"
                    value={activePassage?.imageUrl?.startsWith('data:') ? '' : (activePassage?.imageUrl || '')}
                    onChange={e => updateReadingPassageField(activeIdx, { imageUrl: e.target.value })}
                    placeholder="https://example.com/reading-diagram.png"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 min-h-[160px]">
                {activePassage?.imageUrl ? (
                  <img
                    src={activePassage.imageUrl}
                    alt={`Reading Preview ${activeIdx + 1}`}
                    onClick={() => setZoomedReadingImg(activePassage.imageUrl)}
                    className="max-h-48 object-contain rounded-lg cursor-zoom-in"
                  />
                ) : (
                  <div className="text-center text-xs text-slate-400">
                    <Image className="w-8 h-8 mx-auto mb-1.5 text-slate-300 dark:text-slate-600" />
                    <span>Chưa có hình ảnh cho Bài #{activeIdx + 1}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Passage Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nội Dung Văn Bản Bài Đọc #{activeIdx + 1} (Nếu chỉ dùng ảnh có thể bỏ trống)
              </label>
              <textarea
                rows={7}
                value={activePassage?.passageText || ''}
                onChange={e => updateReadingPassageField(activeIdx, { passageText: e.target.value })}
                className="w-full p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs leading-relaxed font-serif focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={`Nhập nội dung văn bản cho Bài đọc số ${activeIdx + 1}...`}
              />
            </div>
          </div>

          {/* Reading Questions CRUD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Danh Sách Câu Hỏi Reading ({testForm.reading?.questions?.length || 0} câu)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hỗ trợ True/False/Not Given, Trắc nghiệm (MCQ), Điền từ — và gắn câu hỏi vào Bài số 1, 2, 3... tương ứng.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addQuestionToSkill('reading')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm Câu Hỏi Reading {passages.length > 1 ? `(Bài #${activeIdx + 1})` : ''}
              </button>
            </div>

            <div className="space-y-5">
              {(testForm.reading?.questions || []).map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-xs font-extrabold bg-indigo-600 text-white px-3 py-1 rounded-lg">
                      Câu hỏi Reading #{idx + 1}
                    </span>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {passages.length > 1 && (
                        <select
                          value={typeof q.passageIdx === 'number' ? String(q.passageIdx) : ''}
                          onChange={e =>
                            updateQuestionInSkill(
                              'reading',
                              q.id,
                              'passageIdx',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-800 dark:text-indigo-200"
                        >
                          <option value="">Hiện ở tất cả bài</option>
                          {passages.map((p, pIdx) => (
                            <option key={p.id || pIdx} value={String(pIdx)}>
                              Thuộc Bài {pIdx + 1} ({(p.title || '').slice(0, 18)})
                            </option>
                          ))}
                        </select>
                      )}

                      <select
                        value={q.type}
                        onChange={e => updateQuestionInSkill('reading', q.id, 'type', e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        <option value="tfng">True / False / Not Given</option>
                        <option value="mcq">Trắc nghiệm 4 lựa chọn (MCQ)</option>
                        <option value="fill">Điền từ vào chỗ trống (Fill-in-blank)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removeQuestionFromSkill('reading', q.id)}
                        className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Nội dung câu hỏi
                    </label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={e => updateQuestionInSkill('reading', q.id, 'question', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Nhập câu hỏi Reading..."
                    />
                  </div>

                  {q.type === 'mcq' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-2">
                        Các phương án lựa chọn (A, B, C, D)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(q.options || []).map((opt, optIdx) => (
                          <input
                            key={optIdx}
                            type="text"
                            value={opt}
                            onChange={e => updateOptionInSkill('reading', q.id, optIdx, e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder={`Phương án ${optIdx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct Answer Field */}
                  <div className="bg-emerald-50/80 dark:bg-emerald-500/15 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                    <label className="block text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase mb-1">
                      ✅ Đáp án đúng của câu hỏi này
                    </label>
                    {q.type === 'mcq' || q.type === 'tfng' ? (
                      <select
                        value={q.correctAnswer}
                        onChange={e => updateQuestionInSkill('reading', q.id, 'correctAnswer', e.target.value)}
                        className="w-full sm:w-80 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200"
                      >
                        {(q.options || []).map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={e => updateQuestionInSkill('reading', q.id, 'correctAnswer', e.target.value)}
                          className="w-full sm:w-96 px-3.5 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200"
                          placeholder="VD: 15 | fifteen hoặc color / colour"
                        />
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                          Mẹo: Dùng dấu <code className="font-bold">|</code> hoặc <code className="font-bold">/</code> nếu chấp nhận nhiều đáp án tương đương.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        );
      })()}

      {/* TAB 4: WRITING BUILDER (PROMPTS, CHART IMAGE & MODEL ANSWERS) */}
      {builderTab === 'writing' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Task 1 */}
          <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Writing Academic Task 1 ( Tối thiểu 150 từ )
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Đề Bài Writing Task 1 (Prompt)</label>
              <textarea
                rows={3}
                value={testForm.writing?.task1?.prompt || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task1: { ...testForm.writing.task1, prompt: e.target.value } }
                  })
                }
                className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Task 1 Chart Image Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Hình Ảnh Biểu Đồ / Bản Đồ Writing Task 1 (Tùy chọn)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải Ảnh Biểu Đồ Task 1</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleWritingTask1ImageUpload}
                      className="hidden"
                    />
                  </label>
                  {testForm.writing?.task1?.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setTestForm(prev => ({
                          ...prev,
                          writing: { ...prev.writing, task1: { ...prev.writing.task1, imageUrl: '' } }
                        }))
                      }
                      className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>

              {testForm.writing?.task1?.imageUrl && (
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-center">
                  <img
                    src={testForm.writing.task1.imageUrl}
                    alt="Task 1 Chart Preview"
                    className="max-h-36 object-contain rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                Bài Mẫu Tham Khảo Task 1 (Hiển thị khi Giáo viên bật cho phép xem đáp án)
              </label>
              <textarea
                rows={4}
                value={testForm.writing?.task1?.modelAnswer || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task1: { ...testForm.writing.task1, modelAnswer: e.target.value } }
                  })
                }
                placeholder="Nhập bài viết mẫu Band 8.0+ cho Task 1..."
                className="w-full p-3.5 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-500/10 text-slate-900 dark:text-slate-100 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Task 2 */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Writing Academic Task 2 ( Tối thiểu 250 từ )
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Đề Bài Writing Task 2 (Prompt)</label>
              <textarea
                rows={3}
                value={testForm.writing?.task2?.prompt || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task2: { ...testForm.writing.task2, prompt: e.target.value } }
                  })
                }
                className="w-full p-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                Bài Mẫu Tham Khảo Task 2 (Hiển thị khi Giáo viên bật cho phép xem đáp án)
              </label>
              <textarea
                rows={4}
                value={testForm.writing?.task2?.modelAnswer || ''}
                onChange={e =>
                  setTestForm({
                    ...testForm,
                    writing: { ...testForm.writing, task2: { ...testForm.writing.task2, modelAnswer: e.target.value } }
                  })
                }
                placeholder="Nhập bài viết mẫu Band 8.0+ cho Task 2..."
                className="w-full p-3.5 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-500/10 text-slate-900 dark:text-slate-100 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
