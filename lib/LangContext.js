import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './i18n'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('vi')

  // Load từ localStorage khi mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gmap_lang')
      if (saved === 'en' || saved === 'vi') setLangState(saved)
    } catch (e) {}
  }, [])

  // Lưu vào localStorage mỗi khi đổi ngôn ngữ + dispatch event để LiveCounter biết
  const setLang = (l) => {
    setLangState(l)
    try {
      localStorage.setItem('gmap_lang', l)
      window.dispatchEvent(new Event('storage'))
    } catch (e) {}
  }

  const t = translations[lang] || translations.vi
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
