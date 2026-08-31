import React from 'react'

export const HeroBanner: React.FC = () => {
  return (
    <header className="relative w-full h-[55vh] md:h-[70vh] overflow-hidden mx-auto max-w-[1440px] md:mt-4 md:rounded-3xl shadow-md">
      <img
        alt="Phong cảnh Việt Nam"
        className="w-full h-full object-cover scale-105 transform transition-transform duration-[25s] hover:scale-100"
        src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1920&auto=format&fit=crop"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10"></div>
      <div className="absolute inset-0 flex items-center justify-center text-center px-4">
        <h1
          className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-bold tracking-tight leading-tight max-w-5xl"
          style={{ textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}
        >
          Mỗi chuyến đi là <br />
          <span className="italic font-normal text-secondary-container">một điều kỳ diệu</span>
        </h1>
      </div>
    </header>
  )
}
