import { useState } from 'react'
import { Button, Container } from 'react-bootstrap'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Container as="main" className="py-5">
      <h1 className="mb-3">React + TypeScript + Vite + Bootstrap</h1>
      <p className="text-body-secondary">Your app is ready.</p>
      <Button onClick={() => setCount((c) => c + 1)}>Count is {count}</Button>
    </Container>
  )
}

export default App
