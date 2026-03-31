"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Lang = "en" | "ur";

const LangContext = createContext<{
  lang: Lang;
  toggle: () => void;
  t: (en: string, ur: string) => string;
}>({
  lang: "en",
  toggle: () => {},
  t: (en) => en,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang;
    if (saved === "ur") setLang("ur");
  }, []);

  function toggle() {
    const next = lang === "en" ? "ur" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  }

  function t(en: string, ur: string) {
    return lang === "ur" ? ur : en;
  }

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      <div dir={lang === "ur" ? "rtl" : "ltr"}>{children}</div>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
