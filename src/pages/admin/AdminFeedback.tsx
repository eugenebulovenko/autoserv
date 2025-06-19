import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Feedback {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError("Ошибка загрузки обращений");
        setLoading(false);
        return;
      }
      setFeedbacks(data || []);
      setLoading(false);
    };
    fetchFeedbacks();
  }, []);

  // Фильтрация на клиенте
  const filteredFeedbacks = feedbacks.filter((f) => {
    // Фильтр по поиску (по всем текстовым полям)
    const searchLower = search.toLowerCase();
    const matchesText =
      f.name.toLowerCase().includes(searchLower) ||
      f.email.toLowerCase().includes(searchLower) ||
      (f.phone || "").toLowerCase().includes(searchLower) ||
      f.message.toLowerCase().includes(searchLower);

    // Фильтр по дате
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(f.created_at) >= new Date(dateFrom);
    }
    if (dateTo) {
      // Включительно до конца дня
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(f.created_at) <= toDate;
    }

    return matchesText && matchesDate;
  });

  return (
    <>
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold mb-6">Обращения в обратную связь</h1>

          {/* Фильтры */}
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="search">Поиск</label>
              <input
                id="search"
                type="text"
                className="border rounded px-3 py-2 w-48"
                placeholder="Имя, email, телефон, сообщение"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="dateFrom">Дата от</label>
              <input
                id="dateFrom"
                type="date"
                className="border rounded px-3 py-2"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="dateTo">Дата до</label>
              <input
                id="dateTo"
                type="date"
                className="border rounded px-3 py-2"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div>Загрузка...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : filteredFeedbacks.length === 0 ? (
            <div>Нет обращений</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded shadow">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">Дата</th>
                    <th className="px-4 py-2 border">Имя</th>
                    <th className="px-4 py-2 border">Email</th>
                    <th className="px-4 py-2 border">Телефон</th>
                    <th className="px-4 py-2 border">Сообщение</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedbacks.map((f) => (
                    <tr key={f.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 border whitespace-nowrap text-xs text-gray-700">{new Date(f.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 border">{f.name}</td>
                      <td className="px-4 py-2 border">{f.email}</td>
                      <td className="px-4 py-2 border">{f.phone}</td>
                      <td className="px-4 py-2 border max-w-xs break-words">{f.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminFeedback;
