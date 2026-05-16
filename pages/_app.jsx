import '../styles/globals.css'
import { LangProvider } from '../lib/LangContext'

export default function App({ Component, pageProps }) {
  return (
    <LangProvider>
      <Component {...pageProps} />
    </LangProvider>
  )
}
