import { Info } from 'lucide-react';
import { BRAND_INFO } from '../../constants/brandInfo';

function getCelebrationCopy(band) {
  const num = Number(band) || 0;
  if (num === 0) {
    return 'Hệ thống chưa ghi nhận được bài nói hợp lệ cho lượt thi này. Hãy kiểm tra micro và nói trọn vẹn từng câu để AI chấm sát hơn nhé!';
  }
  if (num < 5.0) {
    return 'Ai cũng bắt đầu từ đây. Bí quyết lên band là thi thử thường xuyên để quen áp lực và phản xạ — cứ đều đặn mỗi ngày nhé!';
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
  const overallBand = attempt.overallBand ?? attempt.scores?.speaking?.band ?? 0;
  const formattedBand = Number.isFinite(Number(overallBand)) ? Number(overallBand).toFixed(1) : '0.0';
  const isSinglePart = partMode && partMode !== 'full';
  const partLabelMap = { part1: 'Part 1', part2: 'Part 2', part3: 'Part 3' };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFF5F8] dark:bg-[#191820] border border-pink-200 dark:border-[#2E2C38] rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
        <div className="flex justify-center">
          <img
            src={BRAND_INFO.avatarUrl}
            alt={BRAND_INFO.shortName}
            className="w-24 h-24 rounded-full object-cover border-2 border-pink-200 dark:border-[#34323F] bg-white shadow-md animate-bounce"
          />
        </div>

        <div className="space-y-2.5">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hoàn thành rồi! Band {formattedBand}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {getCelebrationCopy(overallBand)}
          </p>
        </div>

        {isSinglePart && (
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#23222B] border border-pink-200/80 dark:border-[#34323F] flex items-start gap-2.5 text-left text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            <span>
              Đây là bài thi nhanh một phần (<strong>{partLabelMap[partMode] || partMode}</strong>), điểm chỉ phản ánh một khía cạnh kỹ năng. Muốn biết band sát thực lực nhất, hãy làm <strong>Full Test</strong> đầy đủ nhé!
            </span>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onViewScore}
            className="w-full py-3 px-5 rounded-2xl bg-[#570DF8] hover:bg-[#490AD2] text-white text-sm font-extrabold shadow-lg shadow-indigo-900/25 transition active:scale-[0.99]"
          >
            Xem điểm của tôi
          </button>
          {onBackToHub && (
            <button
              type="button"
              onClick={onBackToHub}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Quay về Sảnh Luyện Speaking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
