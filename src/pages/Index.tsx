import { useState, useCallback, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

type Direction = "en-ru" | "ru-en";

const LABELS: Record<Direction, { from: string; to: string }> = {
  "en-ru": { from: "English", to: "Русский" },
  "ru-en": { from: "Русский", to: "English" },
};

export default function Index() {
  const [direction, setDirection] = useState<Direction>("en-ru");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translate = useCallback(async (text: string, dir: Direction) => {
    if (!text.trim()) { setOutput(""); return; }
    setLoading(true);
    try {
      const langPair = dir === "en-ru" ? "en|ru" : "ru|en";
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
      );
      const data = await res.json();
      setOutput(data.responseData?.translatedText || "Ошибка перевода");
    } catch {
      setOutput("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!input.trim()) { setOutput(""); return; }
    debounceRef.current = setTimeout(() => translate(input, direction), 600);
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

  const labels = LABELS[direction];

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">

        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Переводчик</h1>
          <p className="text-sm text-gray-400 mt-1">English ↔ Русский</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{labels.from}</span>
            <button
              onClick={switchDirection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-all duration-200 hover:text-gray-800"
            >
              <Icon name="ArrowLeftRight" size={13} />
              Сменить
            </button>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{labels.to}</span>
          </div>

          <div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-2 md:divide-y-0 md:divide-x">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Введите текст..."
                rows={7}
                className="w-full resize-none px-5 py-4 text-gray-800 placeholder-gray-300 text-base leading-relaxed focus:outline-none bg-transparent"
              />
              {input && (
                <button
                  onClick={() => { setInput(""); setOutput(""); }}
                  className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-col bg-gray-50/60 min-h-[196px]">
              <div className="flex-1 w-full px-5 pt-4 pb-2 text-base leading-relaxed">
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-300 pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                ) : (
                  <p className={`whitespace-pre-wrap ${output ? "text-gray-800" : "text-gray-300"}`}>{output || "Перевод появится здесь"}</p>
                )}
              </div>
              {output && !loading && (
                <div className="flex justify-end px-3 pb-3">
                  <button
                    onClick={copy}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-200"
                  >
                    <Icon name={copied ? "Check" : "Copy"} size={13} />
                    {copied ? "Скопировано" : "Копировать"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end">
            <p className="text-xs text-gray-300">Перевод происходит автоматически</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">MyMemory Translation API</p>
      </div>
    </div>
  );
}