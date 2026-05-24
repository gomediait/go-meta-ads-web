import { useEffect } from 'react'
import { useLang } from '../../lib/LangContext'
import HomeComponent from '../index'

// Set lang synchronously so LangContext picks it up on fresh page load
if (typeof window !== 'undefined') {
  localStorage.setItem('gmap_lang', 'vi')
}

export default function ViHome() {
  const { lang, setLang } = useLang()
  useEffect(() => {
    if (lang !== 'vi') setLang('vi')
  }, [lang, setLang])
  return <HomeComponent />
}
