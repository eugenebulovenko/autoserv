import { useState } from "react";

interface QualityCheckProps {
  check: {
    id: string;
    status: string;
    comments: string;
    check_date: string;
    work_order_id: string;
    checked_by: string;
  } | null;
  onComplete: (check: {
    id: string;
    status: string;
    comments: string;
    check_date: string;
    work_order_id: string;
    checked_by: string;
  }) => void;
}

export const QualityCheck = ({ check, onComplete }: QualityCheckProps) => {
  const [status, setStatus] = useState<string>(check?.status || "pending");
  const [comments, setComments] = useState<string>(check?.comments || "");

  const handleSubmit = () => {
    if (!check) return;
    
    const updatedCheck = {
      id: check.id,
      status: status,
      comments: comments,
      check_date: new Date().toISOString(),
      work_order_id: check.work_order_id,
      checked_by: check.checked_by
    };

    onComplete(updatedCheck);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Статус проверки</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="pending">В ожидании</option>
          <option value="passed">Прошел</option>
          <option value="failed">Не прошел</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Комментарии</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Введите комментарии к проверке..."
        />
      </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Сохранить результат проверки
      </button>
    </div>
  );
};
