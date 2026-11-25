import {
  DAILY_WRITING_T2_QUESTION_TYPES,
  DAILY_WRITING_T2_TOPICS,
  getTask2QuestionType,
  getTask2Topic,
  isKnownTask2QuestionType,
  isKnownTask2Topic
} from '../../constants/seedData';

export default function WritingTask2FilterBar({
  list = [],
  selectedTopic = 'all',
  selectedQuestionType = 'all',
  onSelectTopic,
  onSelectQuestionType
}) {
  const task2QuestionTypeScope = selectedTopic === 'all'
    ? list
    : list.filter(test => selectedTopic === '__unclassified__'
      ? !isKnownTask2Topic(getTask2Topic(test))
      : getTask2Topic(test) === selectedTopic);
  const unclassifiedTask2TopicCount = list.filter(test => !isKnownTask2Topic(getTask2Topic(test))).length;
  const unclassifiedTask2QuestionTypeCount = task2QuestionTypeScope.filter(
    test => !isKnownTask2QuestionType(getTask2QuestionType(test))
  ).length;

  return (
    <div className="bg-white dark:bg-[#0F172B] border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-extrabold text-[#334155] dark:text-slate-300">Chọn chủ đề:</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={selectedTopic === 'all'}
            onClick={() => onSelectTopic?.('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              selectedTopic === 'all'
                ? 'bg-[#007A7A] text-white border-[#007A7A]'
                : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
            }`}
          >
            Tất cả ({list.length})
          </button>
          {DAILY_WRITING_T2_TOPICS.map(topic => {
            const topicCount = list.filter(test => getTask2Topic(test) === topic.id).length;
            return (
              <button
                key={topic.id}
                type="button"
                aria-pressed={selectedTopic === topic.id}
                onClick={() => onSelectTopic?.(topic.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  selectedTopic === topic.id
                    ? 'bg-[#0F172B] dark:bg-white text-white dark:text-[#0F172B] border-[#0F172B] dark:border-white'
                    : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                }`}
              >
                {topic.label} ({topicCount})
              </button>
            );
          })}
          {unclassifiedTask2TopicCount > 0 && (
            <button
              type="button"
              aria-pressed={selectedTopic === '__unclassified__'}
              onClick={() => onSelectTopic?.('__unclassified__')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                selectedTopic === '__unclassified__'
                  ? 'bg-[#0F172B] dark:bg-white text-white dark:text-[#0F172B] border-[#0F172B] dark:border-white'
                  : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
              }`}
            >
              Chưa gắn chủ đề ({unclassifiedTask2TopicCount})
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-extrabold text-[#334155] dark:text-slate-300">Chọn dạng bài:</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={selectedQuestionType === 'all'}
            onClick={() => onSelectQuestionType?.('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              selectedQuestionType === 'all'
                ? 'bg-[#007A7A] text-white border-[#007A7A]'
                : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
            }`}
          >
            Tất cả ({task2QuestionTypeScope.length})
          </button>
          {DAILY_WRITING_T2_QUESTION_TYPES.map(questionType => {
            const questionTypeCount = task2QuestionTypeScope.filter(
              test => getTask2QuestionType(test) === questionType.id
            ).length;
            return (
              <button
                key={questionType.id}
                type="button"
                aria-pressed={selectedQuestionType === questionType.id}
                onClick={() => onSelectQuestionType?.(questionType.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  selectedQuestionType === questionType.id
                    ? 'bg-[#0F172B] dark:bg-white text-white dark:text-[#0F172B] border-[#0F172B] dark:border-white'
                    : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
                }`}
              >
                {questionType.label} ({questionTypeCount})
              </button>
            );
          })}
          {unclassifiedTask2QuestionTypeCount > 0 && (
            <button
              type="button"
              aria-pressed={selectedQuestionType === '__unclassified__'}
              onClick={() => onSelectQuestionType?.('__unclassified__')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                selectedQuestionType === '__unclassified__'
                  ? 'bg-[#0F172B] dark:bg-white text-white dark:text-[#0F172B] border-[#0F172B] dark:border-white'
                  : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#334155] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#007A7A]'
              }`}
            >
              Chưa chọn dạng bài ({unclassifiedTask2QuestionTypeCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
