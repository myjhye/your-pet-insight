import { Navigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'

function Home() {
  const { localePath } = useLang()
  return <Navigate to={localePath('/dog-test/personality')} replace />
}

export default Home