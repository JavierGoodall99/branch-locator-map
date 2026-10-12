import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="container py-5">
      <h1 className="display-5 mb-3">React + TypeScript + Vite + Bootstrap</h1>
      <p className="lead text-body-secondary">Your app is ready.</p>
      <button className="btn btn-primary" onClick={() => setCount((c) => c + 1)}>
        Count is {count}
      </button>
    </main>
  )
}

export default App
