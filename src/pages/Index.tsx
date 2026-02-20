import { useState, useCallback, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

type Direction = "en-ru" | "ru-en";

export default function Index() {
  const [direction, setDirection] = useState<Direction>("en-ru");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number }>(() => {
    const todayKey = `mymemory_used_${new Date().toISOString().slice(0, 10)}`;
    return { used: parseInt(localStorage.getItem(todayKey) || "0"), limit: 50000 };
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fromLang = direction === "en-ru" ? "English" : "Русский";
  const toLang = direction === "en-ru" ? "Русский" : "English";

  const translate = useCallback(async (text: string, dir: Direction) => {
    if (!text.trim()) { setOutput(""); return; }
    setLoading(true);
    try {
      const langPair = dir === "en-ru" ? "en|ru" : "ru|en";
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}&de=allanwinst@gmail.com`
      );
      const data = await res.json();
      setOutput(data.responseData?.translatedText || "Ошибка перевода");
      const todayKey = `mymemory_used_${new Date().toISOString().slice(0, 10)}`;
      const prev = parseInt(localStorage.getItem(todayKey) || "0");
      const newUsed = prev + text.length;
      localStorage.setItem(todayKey, String(newUsed));
      setUsage({ used: newUsed, limit: 50000 });
    } catch (_e) {
      setOutput("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const todayKey = `mymemory_used_${new Date().toISOString().slice(0, 10)}`;
    const onStorage = (e: StorageEvent) => {
      if (e.key === todayKey) setUsage({ used: parseInt(e.newValue || "0"), limit: 50000 });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!input.trim()) { setOutput(""); return; }
    debounceRef.current = setTimeout(() => translate(input, direction), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, direction, translate]);

  const switchDirection = () => {
    setDirection((d) => (d === "en-ru" ? "ru-en" : "en-ru"));
    setInput(output);
    setOutput(input);
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-medium text-gray-800">Переводчик</h1>
      </div>

      {/* Language bar */}
      <div className="flex items-center border-b border-gray-200 px-4">
        {/* From lang */}
        <div className="flex-1 flex items-center gap-1 py-1">
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${direction === "en-ru" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            onClick={() => { if (direction !== "en-ru") switchDirection(); }}
          >
            English
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${direction === "ru-en" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            onClick={() => { if (direction !== "ru-en") switchDirection(); }}
          >
            Русский
          </button>
        </div>

        {/* Switch button */}
        <button
          onClick={switchDirection}
          className="mx-3 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all"
          title="Поменять языки"
        >
          <Icon name="ArrowLeftRight" size={16} />
        </button>

        {/* To lang */}
        <div className="flex-1 flex items-center gap-1 py-1">
          <span className="px-3 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600">
            {toLang}
          </span>
        </div>
      </div>

      {/* Panels */}
      <div className="flex flex-1 divide-x divide-gray-200">

        {/* Input panel */}
        <div className="flex-1 flex flex-col min-h-[320px]">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Введите текст..."
              className="w-full h-full min-h-[260px] resize-none px-6 pt-5 pb-16 text-2xl text-gray-800 placeholder-gray-300 font-light leading-snug focus:outline-none"
            />
            {input && (
              <button
                onClick={() => { setInput(""); setOutput(""); }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="X" size={16} />
              </button>
            )}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {usage.used.toLocaleString("ru")} / {usage.limit.toLocaleString("ru")} симв. сегодня
            </p>
            <p className="text-xs text-gray-300">{input.length} симв.</p>
          </div>
        </div>

        {/* Output panel */}
        <div className="flex-1 flex flex-col bg-gray-50 min-h-[320px]">
          <div className="relative flex-1 px-6 pt-5 pb-4 min-h-[260px]">
            {output && !loading && (
              <button
                onClick={copy}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name={copied ? "Check" : "Copy"} size={16} />
              </button>
            )}
            {loading ? (
              <div className="flex items-center gap-2 pt-1">
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            ) : (
              <p className={`whitespace-pre-wrap text-2xl font-light leading-snug ${output ? "text-gray-800" : "text-gray-300"}`}>
                {output || "Перевод"}
              </p>
            )}
          </div>
          <div className="px-5 py-3 border-t border-gray-100" />
        </div>
      </div>
    </div>
  );
}