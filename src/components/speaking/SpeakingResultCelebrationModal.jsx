import { Info } from 'lucide-react';
import { BRAND_INFO } from '../../constants/brandInfo';

function getCelebrationCopy(band) {
  const num = Number(band) || 0;
  if (num === 0) {
    return 'Hệ thống chưa ghi nhận được bài nói hợp lệ cho lượt thi này. Hãy kiểm tra micro và nói trọn vẹn từng câu để AI chấm sát hơn nhé!';
  }
  if (num < 5.0) {
    return 'Ai cũng bắt đầu từ đây. Bí quyết lên band là thi thử thường xuyên để quen áp lực và phản xạ - cứ đều đặn mỗi ngày nhé!';
  }
  if (num < 6.5) {
    return 'Nền tảng phản xạ đã rất ổn định! Hãy xem kỹ transcript và gợi ý nâng cấp từ vựng bên trong để bứt phá lên Band 6.5–7.0+.';
  }
  if (num < 7.5) {
    return 'Kết quả rất tốt! Giữ vững độ trôi chảy tự nhiên và đa dạng thêm collocations học thuật để chạm mốc 7.5–8.0 nhé.';
  }
  return 'Phong độ xuất sắc chuẩn Band cao IELTS! Hãy xem lại các nhận xét chi tiết và bài ghi âm để duy trì đỉnh cao phong độ.';
}

export default function SpeakingResultCelebrationModal({
  attempt,
  partMode = 'full',
  onViewScore,
  onBackToHub
}) {
  if (!attempt) return null;
  const isApproved = Boolean(attempt.teacherGraded && typeof attempt.overallBand === 'number');
  const overallBand = attempt.overallBand ?? attempt.scores?.speaking?.band ?? 0;
  const formattedBand = Number.isFinite(Number(overallBand)) ? Number(overallBand).toFixed(1) : '0.0';
  const recordedCount = Array.isArray(attempt.speakingRecordings)
    ? attempt.speakingRecordings.filter(r => Number(r?.durationSec) > 0 || Boolean(r?.audioUrl)).length
    : 0;
  const isSinglePart = partMode && partMode !== 'full';
  const partLabelMap = { part1: 'Part 1', part2: 'Part 2', part3: 'Part 3' };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-[#2E2C38] rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
        <div className="flex justify-center">
          <img
            src={BRAND_INFO.avatarUrl}
            alt={BRAND_INFO.shortName}
            className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 bg-white shadow-md"
          />
        </div>

        <div className="space-y-2.5">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isApproved ? `Hoàn thành rồi! Band ${formattedBand}` : 'Đã nộp bài · Ms. Như đang check!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {isApproved
              ? getCelebrationCopy(overallBand)
              : `Hệ thống đã lưu an toàn ${recordedCount} file ghi âm của bạn và gửi trực tiếp cho Ms. Như duyệt & trả điểm chính thức!`}
          </p>
        </div>

        {isSinglePart && (
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-left text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <Info className="w-4 h-4 text-[#475569] dark:text-slate-400 shrink-0 mt-0.5" />
            <span>
              Bạn vừa hoàn thành phần <strong>{partLabelMap[partMode] || partMode}</strong>. Bạn có thể nghe lại bản ghi âm của mình hoặc luyện tiếp trong <strong>Daily Zone</strong>!
            </span>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onViewScore}
            className="w-full py-3 px-5 rounded-2xl bg-[#007A7A] hover:bg-[#065B5B] text-white text-sm font-extrabold shadow-lg shadow-indigo-900/25 transition active:scale-[0.99]"
          >
            {isApproved ? 'Xem điểm của tôi' : 'Xem bài đã nộp & nghe lại ghi âm'}
          </button>
          {onBackToHub && (
            <button
              type="button"
              onClick={onBackToHub}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#475569] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Quay về Daily Zone
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
