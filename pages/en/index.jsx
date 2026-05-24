import { useEffect } from 'react'
import { useLang } from '../../lib/LangContext'
import HomeComponent from '../index'

// Set lang synchronously so LangContext picks it up on fresh page load
if (typeof window !== 'undefined') {
  localStorage.setItem('gmap_lang', 'en')
}

export default function EnHome() {
  const { lang, setLang } = useLang()
  useEffect(() => {
    if (lang !== 'en') setLang('en')
  }, [lang, setLang])
  return <HomeComponent />
}
