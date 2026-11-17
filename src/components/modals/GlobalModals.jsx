import { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Edit,
  Key,
  Loader2,
  Plus,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  UserPlus,
  X
} from 'lucide-react';
import { DEFAULT_VOCAB_TEXT, VOCAB_PRESETS } from '../../constants/seedData';
import { compressAvatarImageFile, normalizeRoomObject, parseBulkStudentsText, parseRawVocabText } from '../../utils/examHelpers';
import UserAvatarBadge from '../../components/common/UserAvatarBadge';
import AnimalPilotAvatar from '../../components/common/AnimalPilotAvatar';
import TeacherGradingModal from './TeacherGradingModal';

export default function GlobalModals({
  addStudentMode,
  aiApiKey,
  aiGradingStep,
  apiTestState,
  bulkStudentsText,
  currentRoomPin,
  currentUser,
  customVocabInput,
  customVocabTopics = [],
  dispatchSyncAction,
  editingStudentAccount,
  editingTargetUser,
  globalToast,
  gradingAttempt,
  gradingScores,
  handleChangeCrewColor,
  handleCreateRoom,
  handleDeleteCustomVocabTopic,
  handleResetStudentPassword,
  handleSaveCustomVocabTopic,
  handleSaveNewStudents,
  handleTeacherAIGrade,
  handleTeacherAIGradeSpeaking,
  handleTestGeminiKey,
  handleUpdateUserAvatar,
  handleUpdateUserProfileFields,
  isGradingAI,
  myAccessoryId = 'crown',
  myAnimalId = 'cat',
  myCrewColor,
  newRoomForm,
  newStudentForm,
  recalculateObjectiveScores,
  saveTeacherGrading,
  setAddStudentMode,
  setAiApiKey,
  setApiTestState,
  setBulkStudentsText,
  setCustomVocabInput,
  setEditingStudentAccount,
  setEditingTargetUser,
  setGradingAttempt,
  setGradingScores,
  setNewRoomForm,
  setNewStudentForm,
  setRoomsDb,
  setShowAddStudentModal,
  setShowApiKeyModal,
  setShowAvatarModal,
  setShowCreateRoomModal,
  setShowVocabModal,
  setStudentPasswordDraft,
  setZoomedReadingImg,
  showAddStudentModal,
  showApiKeyModal,
  showAvatarModal,
  showCreateRoomModal,
  showToast,
  showVocabModal,
  studentPasswordDraft,
  zoomedReadingImg
}) {
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopicLabel, setNewTopicLabel] = useState('');
  const [newTopicText, setNewTopicText] = useState('');

  return (
    <>
    {/* AI Key Configuration Modal (Strictly Teacher Only) */}
    {showApiKeyModal && currentUser?.role === 'teacher' && (
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Cấu Hình Google Gemini API Key
            </h3>
            <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Google Gemini API Key (Chỉ dành cho Giáo viên)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={aiApiKey}
                  onChange={e => {
                    setAiApiKey(e.target.value);
                    if (apiTestState.ok !== null) setApiTestState({ testing: false, ok: null, message: '', model: '' });
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleTestGeminiKey(aiApiKey)}
                  disabled={apiTestState.testing}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-60 shrink-0"
                >
                  {apiTestState.testing ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang thử...</>
                  ) : (
                    <><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Kiểm Tra Key</>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Tạo Key miễn phí tại <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">Google AI Studio</a>. Hệ thống tự động dò model khả dụng mới nhất (Gemini 2.5 Flash / 2.0 Flash...) cho API Key của bạn.
              </p>
            </div>

            {apiTestState.ok !== null && (
              <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                apiTestState.ok
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
              }`}>
                {apiTestState.ok ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{apiTestState.ok ? 'Key hoạt động bình thường!' : 'Không thể xác thực API Key'}</p>
                  <p className="mt-0.5 text-[11px] opacity-90">{apiTestState.message}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = (aiApiKey || '').trim();
                  setAiApiKey(trimmed);
                  localStorage.setItem('ielts_ai_key', trimmed);
                  setShowApiKeyModal(false);
                  showToast(trimmed ? 'Đã lưu Google Gemini API Key!' : 'Đã xóa API Key (sẽ dùng bộ chấm tích hợp).');
                }}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Shared Modal: Edit Account Info / Role / Target Band & Study Goal */}
    {editingTargetUser && (currentUser?.role === 'teacher' || editingTargetUser.username === currentUser?.username) && (
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleUpdateUserProfileFields(editingTargetUser.username, {
              name: editingTargetUser.name,
              role: editingTargetUser.role,
              targetBand: editingTargetUser.targetBand,
              studyGoal: editingTargetUser.studyGoal,
              avatarUrl: editingTargetUser.avatarUrl
            });
            setEditingTargetUser(null);
          }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" />
              {editingTargetUser.username === currentUser?.username ? 'Chỉnh Sửa Mục Tiêu & Hồ Sơ' : 'Chỉnh Sửa Thông Tin Tài Khoản'}
            </h3>
            <button type="button" onClick={() => setEditingTargetUser(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
              <UserAvatarBadge user={editingTargetUser} sizeClass="w-12 h-12" textClass="text-base" rounded="rounded-2xl" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Ảnh Đại Diện (@{editingTargetUser.username})</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <label className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer transition inline-flex items-center gap-1">
                    <Upload className="w-3 h-3" /> {editingTargetUser.avatarUrl ? 'Đổi ảnh' : 'Tải ảnh'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const compressed = await compressAvatarImageFile(file, 160);
                          setEditingTargetUser(prev => (prev ? { ...prev, avatarUrl: compressed } : prev));
                        } catch (err) {
                          showToast(err.message || 'Không thể xử lý ảnh này!', 'error');
                        }
                      }}
                    />
                  </label>
                  {editingTargetUser.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingTargetUser(prev => (prev ? { ...prev, avatarUrl: '' } : prev))}
                      className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-[11px] font-bold hover:bg-rose-100 transition"
                    >
                      Gỡ ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tên hiển thị (@{editingTargetUser.username})
              </label>
              <input
                type="text"
                value={editingTargetUser.name}
                onChange={e => setEditingTargetUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {currentUser?.role === 'teacher' && editingTargetUser.username !== currentUser?.username && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vai trò tài khoản
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingTargetUser(prev => ({ ...prev, role: 'student' }))}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      (editingTargetUser.role || 'student') === 'student'
                        ? 'bg-white dark:bg-slate-900 text-[#007A7A] dark:text-[#1EE1D6] shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Học viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTargetUser(prev => ({ ...prev, role: 'teacher' }))}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      editingTargetUser.role === 'teacher'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Giáo viên
                  </button>
                </div>
              </div>
            )}

            {editingTargetUser.role !== 'teacher' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target IELTS Band (4.0 – 9.0)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[6.0, 6.5, 7.0, 7.5, 8.0, 8.5].map(bandVal => (
                    <button
                      key={bandVal}
                      type="button"
                      onClick={() => setEditingTargetUser(prev => ({ ...prev, targetBand: bandVal }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                        Number(editingTargetUser.targetBand) === bandVal
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {bandVal.toFixed(1)}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="4.0"
                  max="9.0"
                  value={editingTargetUser.targetBand}
                  onChange={e => setEditingTargetUser(prev => ({ ...prev, targetBand: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {editingTargetUser.role === 'teacher'
                  ? 'Giới thiệu chuyên môn / Khẩu hiệu giảng dạy'
                  : 'Ghi chú mục tiêu học tập / Kỳ thi'}
              </label>
              <input
                type="text"
                value={editingTargetUser.studyGoal || ''}
                onChange={e => setEditingTargetUser(prev => ({ ...prev, studyGoal: e.target.value }))}
                placeholder={
                  editingTargetUser.role === 'teacher'
                    ? 'VD: Chuyên sâu IELTS 4 kỹ năng • Practice makes perfect.'
                    : 'VD: Thi IELTS Academic tháng 12 - Ưu tiên Reading 8.0'
                }
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTargetUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Lưu Thay Đổi
              </button>
            </div>
          </div>
        </form>
      </div>
    )}

    {/* Zoomed Reading Passage Image Lightbox */}
    {zoomedReadingImg && (
      <div
        onClick={() => setZoomedReadingImg('')}
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-4"
      >
        <div className="max-w-5xl w-full flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setZoomedReadingImg('')}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700"
          >
            <X className="w-4 h-4" /> Đóng ảnh
          </button>
        </div>
        <img
          src={zoomedReadingImg}
          alt="Zoomed Reading Passage"
          onClick={e => e.stopPropagation()}
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl bg-white dark:bg-slate-900 p-2"
        />
      </div>
    )}

    {/* Teacher Create Game Room Modal */}
    {showCreateRoomModal && currentUser?.role === 'teacher' && (
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <form onSubmit={handleCreateRoom} className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Rocket className="w-4 h-4 text-emerald-500" /> Tạo Phòng Đấu Từ Vựng Mới
            </h3>
            <button type="button" onClick={() => setShowCreateRoomModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên phòng đấu</label>
              <input
                type="text"
                value={newRoomForm.name}
                onChange={e => setNewRoomForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Phòng Ôn Từ Vựng Band 7.0"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mã PIN (Để trống = Tự tạo)</label>
                <input
                  type="text"
                  value={newRoomForm.pin}
                  onChange={e => setNewRoomForm(prev => ({ ...prev, pin: e.target.value }))}
                  placeholder="6 số ngẫu nhiên"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu phòng</label>
                <input
                  type="text"
                  value={newRoomForm.pass}
                  onChange={e => setNewRoomForm(prev => ({ ...prev, pass: e.target.value }))}
                  placeholder="ielts"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Số từ mỗi vòng</label>
                <select
                  value={newRoomForm.roundSize || 4}
                  onChange={e => setNewRoomForm(prev => ({ ...prev, roundSize: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {[2, 3, 4, 5, 6, 8].map(n => (
                    <option key={n} value={n}>{n} từ / vòng</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tốc độ giới hạn giờ</label>
                <select
                  value={newRoomForm.speedMode || 'normal'}
                  onChange={e => setNewRoomForm(prev => ({ ...prev, speedMode: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="relaxed">Chậm rãi (+6 giây/từ)</option>
                  <option value="normal">Tốc độ chuẩn</option>
                  <option value="turbo">Siêu tốc (-5 giây/từ)</option>
                </select>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(newRoomForm.shufflePerPlayer)}
                onChange={e => setNewRoomForm(prev => ({ ...prev, shufflePerPlayer: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded accent-emerald-600"
              />
              <div>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Đảo thứ tự từ riêng cho từng học sinh</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {newRoomForm.shufflePerPlayer
                    ? 'Đang BẬT: Mỗi học sinh gặp thứ tự câu khác nhau (hạn chế nhìn bài nhau).'
                    : 'Đang TẮT: Tất cả cùng làm chung một bộ câu hỏi — ai trả lời nhanh nhất được điểm cao hơn.'}
                </p>
              </div>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateRoomModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Phòng & Mở Lobby
              </button>
            </div>
          </div>
        </form>
      </div>
    )}

    {/* Teacher Vocab Modal for Game */}
    {showVocabModal && (() => {
      const rawLines = customVocabInput.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      const parsedPreview = parseRawVocabText(customVocabInput);
      const badLinesCount = Math.max(0, rawLines.length - parsedPreview.length);
      const newTopicParsedCount = parseRawVocabText(newTopicText).length;
      const closeVocabModal = () => {
        setShowNewTopicForm(false);
        setShowVocabModal(false);
      };
      return (
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Sửa Bộ Từ Vựng Game 3 Vòng (Phòng {currentRoomPin})
            </h3>
            <button type="button" onClick={closeVocabModal} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick-Load IELTS Topic Presets + Teacher Custom Topics + Add "+" Button */}
          <div className="mb-3">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Nạp nhanh bộ từ vựng mẫu theo chủ đề IELTS:
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.entries(VOCAB_PRESETS).map(([presetKey, preset]) => (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => {
                    setCustomVocabInput(preset.text);
                    showToast(`Đã nạp bộ từ vựng "${preset.label}"! Bấm Lưu để áp dụng.`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/15 hover:bg-purple-100 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[11px] font-bold transition"
                >
                  + {preset.label}
                </button>
              ))}
              {customVocabTopics.map(topic => (
                <div
                  key={topic.id}
                  className="inline-flex items-center rounded-lg bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/30 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCustomVocabInput(topic.text);
                      showToast(`Đã nạp chủ đề "${topic.label}"! Bấm Lưu để áp dụng.`);
                    }}
                    className="px-2.5 py-1 hover:bg-teal-100 dark:hover:bg-teal-500/25 text-[#007A7A] dark:text-[#1EE1D6] text-[11px] font-bold transition"
                  >
                    + {topic.label}
                  </button>
                  {handleDeleteCustomVocabTopic && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomVocabTopic(topic)}
                      className="px-1.5 py-1 text-teal-600/70 hover:text-rose-600 dark:text-teal-300/70 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition"
                      title={`Xóa chủ đề "${topic.label}"`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowNewTopicForm(prev => {
                    const next = !prev;
                    if (next && !newTopicText.trim()) {
                      setNewTopicText(customVocabInput || '');
                    }
                    return next;
                  });
                }}
                className={`w-7 h-7 rounded-lg border-2 border-dashed flex items-center justify-center transition ${
                  showNewTopicForm
                    ? 'bg-[#007A7A] border-[#007A7A] text-white'
                    : 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-400 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/25'
                }`}
                title="Thêm chủ đề từ vựng mới (+)"
                aria-label="Thêm chủ đề từ vựng mới"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewTopicForm(prev => {
                    const next = !prev;
                    if (next && !newTopicText.trim()) {
                      setNewTopicText(customVocabInput || '');
                    }
                    return next;
                  });
                }}
                className="text-[11px] font-bold text-[#007A7A] dark:text-[#1EE1D6] hover:underline px-1"
              >
                {showNewTopicForm ? 'Đóng form thêm' : 'Thêm chủ đề'}
              </button>
            </div>
          </div>

          {/* Inline Custom Topic Creator Panel */}
          {showNewTopicForm && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Tạo Chủ Đề Từ Vựng Mới (Lưu Dùng Lâu Dài)
                </p>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setNewTopicText(customVocabInput || '')}
                    className="font-bold text-indigo-600 dark:text-indigo-300 hover:underline"
                  >
                    Lấy từ đang soạn ở dưới
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTopicText('')}
                    className="font-semibold text-slate-500 dark:text-slate-400 hover:underline"
                  >
                    Xóa trắng
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={newTopicLabel}
                onChange={e => setNewTopicLabel(e.target.value)}
                placeholder="Nhập tên chủ đề mới (VD: Kinh tế & Việc làm, Du lịch & Văn hóa...)"
                className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-emerald-300 dark:border-emerald-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <textarea
                rows={4}
                value={newTopicText}
                onChange={e => setNewTopicText(e.target.value)}
                placeholder="Dán danh sách từ mới theo định dạng: TỪ | Nghĩa tiếng Việt | /IPA/ | Câu ví dụ..."
                className="w-full p-2.5 font-mono text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-emerald-300 dark:border-emerald-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  Nhận diện hợp lệ: {newTopicParsedCount} từ
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTopicForm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanLabel = newTopicLabel.trim();
                      if (!cleanLabel) {
                        showToast('Vui lòng nhập tên chủ đề mới!', 'error');
                        return;
                      }
                      if (newTopicParsedCount < 1) {
                        showToast('Vui lòng nhập ít nhất 1 dòng từ vựng hợp lệ (TỪ | Nghĩa)!', 'error');
                        return;
                      }
                      const saved = handleSaveCustomVocabTopic?.({ label: cleanLabel, text: newTopicText });
                      if (saved !== false) {
                        setCustomVocabInput(newTopicText);
                        setNewTopicLabel('');
                        setNewTopicText('');
                        setShowNewTopicForm(false);
                      }
                    }}
                    className="px-3.5 py-1.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Lưu Chủ Đề Mới
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live Format Validation Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mb-2">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" /> Hợp lệ: {parsedPreview.length} từ
            </span>
            {badLinesCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> {badLinesCount} dòng thiếu dấu | hoặc trùng từ
              </span>
            ) : (
              <span className="text-slate-400">Định dạng: TỪ | Nghĩa tiếng Việt | /IPA/ | Ví dụ</span>
            )}
          </div>

          <textarea
            rows={9}
            value={customVocabInput}
            onChange={e => setCustomVocabInput(e.target.value)}
            className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none mb-4"
            placeholder="TỪ | Nghĩa tiếng Việt | /Phiên âm/ | Ví dụ câu..."
          />

          <div className="flex justify-between items-center flex-wrap gap-2">
            <button
              onClick={() => setCustomVocabInput(DEFAULT_VOCAB_TEXT)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
            >
              Khôi phục 12 từ mặc định
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeVocabModal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (parsedPreview.length < 3) {
                    alert('Vui lòng nhập tối thiểu 3 từ vựng!');
                    return;
                  }
                  setRoomsDb(prev => ({
                    ...prev,
                    [currentRoomPin]: {
                      ...normalizeRoomObject(prev[currentRoomPin], currentRoomPin),
                      rawVocab: customVocabInput
                    }
                  }));
                  dispatchSyncAction('UPSERT_ROOM', {
                    pin: currentRoomPin,
                    updates: { rawVocab: customVocabInput }
                  });
                  closeVocabModal();
                  showToast(`Đã lưu ${parsedPreview.length} từ vựng cho phòng ${currentRoomPin}!`);
                }}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow"
              >
                Lưu & Cập Nhật
              </button>
            </div>
          </div>
        </div>
      </div>
      );
    })()}

    {/* Teacher Add / Bulk Import Account Modal */}
    {showAddStudentModal && currentUser?.role === 'teacher' && (() => {
      const bulkParsedCount = parseBulkStudentsText(bulkStudentsText).length;
      const isCreatingTeacher = (newStudentForm.role || 'student') === 'teacher';
      return (
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <form onSubmit={handleSaveNewStudents} className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#007A7A] dark:text-[#1EE1D6]" /> Tạo Tài Khoản Mới
            </h3>
            <button type="button" onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
            <button
              type="button"
              onClick={() => setAddStudentMode('single')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                addStudentMode === 'single' ? 'bg-white dark:bg-slate-900 text-[#007A7A] dark:text-[#1EE1D6] shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tạo 1 Tài Khoản
            </button>
            <button
              type="button"
              onClick={() => setAddStudentMode('bulk')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                addStudentMode === 'bulk' ? 'bg-white dark:bg-slate-900 text-[#007A7A] dark:text-[#1EE1D6] shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Nhập Hàng Loạt Học Viên ({bulkParsedCount})
            </button>
          </div>

          {addStudentMode === 'single' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Loại tài khoản</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setNewStudentForm(prev => ({ ...prev, role: 'student' }))}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      !isCreatingTeacher ? 'bg-white dark:bg-slate-900 text-[#007A7A] dark:text-[#1EE1D6] shadow-sm' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Tài khoản Học viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStudentForm(prev => ({ ...prev, role: 'teacher' }))}
                    className={`py-2 rounded-lg text-xs font-bold transition ${
                      isCreatingTeacher ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Tài khoản Giáo viên
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập</label>
                  <input
                    type="text"
                    value={newStudentForm.username}
                    onChange={e => setNewStudentForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder={isCreatingTeacher ? 'VD: teacher_lan' : 'VD: hocsinh_04'}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu ban đầu</label>
                  <input
                    type="text"
                    value={newStudentForm.password}
                    onChange={e => setNewStudentForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                    required
                  />
                </div>
              </div>
              <div className={`grid ${isCreatingTeacher ? 'grid-cols-1' : 'grid-cols-3'} gap-3`}>
                <div className={isCreatingTeacher ? '' : 'col-span-2'}>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    value={newStudentForm.name}
                    onChange={e => setNewStudentForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={isCreatingTeacher ? 'VD: Cô Ms. Như / Cô Ngọc Lan' : 'VD: Nguyễn Minh Khôi'}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                {!isCreatingTeacher && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Band</label>
                    <select
                      value={newStudentForm.targetBand}
                      onChange={e => setNewStudentForm(prev => ({ ...prev, targetBand: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(b => (
                        <option key={b} value={b}>Band {b}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {isCreatingTeacher && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Tài khoản Giáo viên có toàn quyền tạo đề thi, chấm bài và tạo/quản lý các tài khoản khác.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mỗi dòng 1 học viên theo định dạng: <code className="font-bold text-indigo-600 dark:text-indigo-300">username | Họ tên | mật khẩu | TargetBand</code>
              </p>
              <textarea
                rows={6}
                value={bulkStudentsText}
                onChange={e => setBulkStudentsText(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Nhận diện hợp lệ: {bulkParsedCount} tài khoản học viên
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-5">
            <button
              type="button"
              onClick={() => setShowAddStudentModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-[#007A7A] hover:bg-[#065B5B] text-white rounded-xl shadow flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Tạo Tài Khoản
            </button>
          </div>
        </form>
      </div>
      );
    })()}

    {/* Teacher Reset Account Password Modal */}
    {editingStudentAccount && currentUser?.role === 'teacher' && (
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <form onSubmit={handleResetStudentPassword} className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" /> Đặt Lại Mật Khẩu Tài Khoản
            </h3>
            <button type="button" onClick={() => setEditingStudentAccount(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Tài khoản: <b className="text-slate-900 dark:text-white">{editingStudentAccount.name}</b> (<code className="font-mono">@{editingStudentAccount.username}</code>)
          </p>
          {currentUser?.isSuperAdmin && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
              Quyền Quản Trị Hệ Thống: Có thể đặt lại mật khẩu mới cho mọi Giáo viên &amp; Học viên (tự động đăng xuất phiên cũ).
            </div>
          )}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu mới</label>
            <input
              type="text"
              value={studentPasswordDraft}
              onChange={e => setStudentPasswordDraft(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingStudentAccount(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow"
            >
              Lưu Mật Khẩu
            </button>
          </div>
        </form>
      </div>
    )}
    {/* Account Avatar Upload & In-Game Head Preview Modal */}
    {showAvatarModal && currentUser && (
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-500" /> Ảnh Đại Diện & Nhân Vật Game
            </h3>
            <button
              type="button"
              onClick={() => setShowAvatarModal(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center text-center">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">Avatar Tài Khoản</p>
              <UserAvatarBadge user={currentUser} sizeClass="w-20 h-20" textClass="text-2xl" rounded="rounded-2xl" />
            </div>
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col items-center text-center">
              <p className="text-[11px] font-bold text-cyan-300 mb-2">Phi Thuyền Thú Cưng</p>
              <AnimalPilotAvatar
                animalId={myAnimalId}
                accessoryId={myAccessoryId}
                colorId={currentUser.avatarUrl ? 'avatar' : myCrewColor}
                avatarUrl={currentUser.avatarUrl}
                size={68}
                animate={true}
                onShip={true}
              />
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Tải ảnh khuôn mặt lên để dùng làm Avatar tài khoản và mở khóa tùy chọn <b>Đầu Avatar</b> trên phi hành gia trong Sảnh Chờ &amp; Bảng Đua Top.
          </p>

          <div className="space-y-2.5">
            <label className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold cursor-pointer transition flex items-center justify-center gap-2 shadow-sm">
              <Upload className="w-4 h-4" />
              <span>{currentUser.avatarUrl ? 'Chọn Ảnh Khác' : 'Tải Ảnh Khuôn Mặt Lên'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    const compressed = await compressAvatarImageFile(file, 160);
                    handleUpdateUserAvatar(compressed);
                  } catch (err) {
                    showToast(err.message || 'Không thể xử lý ảnh này!', 'error');
                  }
                }}
              />
            </label>

            {currentUser.avatarUrl && (
              <div className="flex items-center gap-2">
                {myCrewColor !== 'avatar' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleChangeCrewColor('avatar');
                      showToast('Đã chọn đầu Avatar làm nhân vật Game!');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition"
                  >
                    Đặt làm nhân vật Game
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleUpdateUserAvatar('')}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold transition"
                >
                  Gỡ Ảnh Avatar
                </button>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Teacher Grading Modal (Listening, Reading, Writing & Speaking) */}
    {currentUser?.role === 'teacher' && (
      <TeacherGradingModal
        aiGradingStep={aiGradingStep}
        gradingAttempt={gradingAttempt}
        gradingScores={gradingScores}
        handleTeacherAIGrade={handleTeacherAIGrade}
        handleTeacherAIGradeSpeaking={handleTeacherAIGradeSpeaking}
        isGradingAI={isGradingAI}
        recalculateObjectiveScores={recalculateObjectiveScores}
        saveTeacherGrading={saveTeacherGrading}
        setGradingAttempt={setGradingAttempt}
        setGradingScores={setGradingScores}
      />
    )}

    {/* Global Floating Toast */}
    {globalToast.visible && (
      <div className={`fixed bottom-6 right-6 z-50 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2 max-w-md ${
        globalToast.type === 'error'
          ? 'bg-rose-900 dark:bg-rose-950 border-rose-500'
          : 'bg-slate-900 dark:bg-slate-800 border-slate-700'
      }`}>
        {globalToast.type === 'error' ? (
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
        ) : (
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span>{globalToast.text}</span>
      </div>
    )}
    </>
  );
}
