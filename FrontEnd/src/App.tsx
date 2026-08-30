import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">
          React + Vite + Tailwind
        </h1>
        <p className="text-slate-600">
          Project khởi tạo thành công với TypeScript và Tailwind CSS v4.
        </p>
        <button
          onClick={() => setCount((prev) => prev + 1)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-200"
        >
          Count is {count}
        </button>
      </div>
    </div>
  )
}

export default App
