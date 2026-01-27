import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('서버에 연결할 수 없습니다'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      <header className="text-center mb-12 animate-fade-in-down">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          🐾 YourPetInsight
        </h1>
        <p className="text-slate-400 text-lg">반려동물을 위한 인사이트</p>
      </header>

      <main className="w-full max-w-xl">
        <div className="card animate-fade-in-up">
          <h2 className="text-xl font-semibold mb-4 text-slate-100">서버 상태</h2>
          <p className="text-slate-400 p-4 bg-primary-500/10 rounded-lg border-l-4 border-primary-500">
            {message || '로딩 중...'}
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
