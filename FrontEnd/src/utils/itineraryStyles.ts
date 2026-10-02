export interface CategoryStyle {
  bg: string
  text: string
  border: string
}

export interface DayColorTheme {
  badgeBg: string
  text: string
  lightBg: string
  border: string
}

export const getCategoryBadgeStyle = (category?: string): CategoryStyle => {
  if (!category) {
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300'
    }
  }

  const catLower = category.toLowerCase()

  if (
    catLower.includes('ẩm thực') ||
    catLower.includes('ăn') ||
    catLower.includes('quán') ||
    catLower.includes('bún') ||
    catLower.includes('phở') ||
    catLower.includes('lẩu')
  ) {
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-950',
      border: 'border-amber-300'
    }
  }

  if (
    catLower.includes('cà phê') ||
    catLower.includes('cafe') ||
    catLower.includes('trà') ||
    catLower.includes('view')
  ) {
    return {
      bg: 'bg-orange-100',
      text: 'text-orange-950',
      border: 'border-orange-300'
    }
  }

  if (
    catLower.includes('tham quan') ||
    catLower.includes('di tích') ||
    catLower.includes('lịch sử') ||
    catLower.includes('bảo tàng') ||
    catLower.includes('dinh') ||
    catLower.includes('chùa') ||
    catLower.includes('nhà thờ')
  ) {
    return {
      bg: 'bg-blue-100',
      text: 'text-blue-950',
      border: 'border-blue-300'
    }
  }

  if (
    catLower.includes('trải nghiệm') ||
    catLower.includes('hoạt động') ||
    catLower.includes('vui chơi') ||
    catLower.includes('sup') ||
    catLower.includes('thể thao') ||
    catLower.includes('trekking')
  ) {
    return {
      bg: 'bg-purple-100',
      text: 'text-purple-950',
      border: 'border-purple-300'
    }
  }

  if (
    catLower.includes('thiên nhiên') ||
    catLower.includes('sinh thái') ||
    catLower.includes('khám phá') ||
    catLower.includes('rừng') ||
    catLower.includes('biển') ||
    catLower.includes('thác') ||
    catLower.includes('hồ') ||
    catLower.includes('núi')
  ) {
    return {
      bg: 'bg-emerald-100',
      text: 'text-emerald-950',
      border: 'border-emerald-300'
    }
  }

  if (
    catLower.includes('check-in') ||
    catLower.includes('sống ảo') ||
    catLower.includes('dạo chơi') ||
    catLower.includes('hoàng hôn') ||
    catLower.includes('bình minh')
  ) {
    return {
      bg: 'bg-rose-100',
      text: 'text-rose-950',
      border: 'border-rose-300'
    }
  }

  if (
    catLower.includes('mua sắm') ||
    catLower.includes('chợ') ||
    catLower.includes('đặc sản') ||
    catLower.includes('quà')
  ) {
    return {
      bg: 'bg-teal-100',
      text: 'text-teal-950',
      border: 'border-teal-300'
    }
  }

  if (
    catLower.includes('khách sạn') ||
    catLower.includes('homestay') ||
    catLower.includes('resort') ||
    catLower.includes('nghỉ ngơi')
  ) {
    return {
      bg: 'bg-indigo-100',
      text: 'text-indigo-950',
      border: 'border-indigo-300'
    }
  }

  return {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300'
  }
}

export const DAY_THEMES: DayColorTheme[] = [
  {
    badgeBg: 'bg-emerald-800',
    text: 'text-white',
    lightBg: 'bg-emerald-50/60',
    border: 'border-emerald-200'
  },
  {
    badgeBg: 'bg-blue-800',
    text: 'text-white',
    lightBg: 'bg-blue-50/60',
    border: 'border-blue-200'
  },
  {
    badgeBg: 'bg-purple-800',
    text: 'text-white',
    lightBg: 'bg-purple-50/60',
    border: 'border-purple-200'
  },
  {
    badgeBg: 'bg-amber-700',
    text: 'text-white',
    lightBg: 'bg-amber-50/60',
    border: 'border-amber-200'
  },
  {
    badgeBg: 'bg-rose-800',
    text: 'text-white',
    lightBg: 'bg-rose-50/60',
    border: 'border-rose-200'
  },
  {
    badgeBg: 'bg-teal-800',
    text: 'text-white',
    lightBg: 'bg-teal-50/60',
    border: 'border-teal-200'
  }
]

export const getDayTheme = (dayIndex: number): DayColorTheme => {
  const safeIndex = Math.abs(typeof dayIndex === 'number' && !isNaN(dayIndex) ? dayIndex : 0);
  return DAY_THEMES[safeIndex % DAY_THEMES.length] || DAY_THEMES[0];
}

export const normalizeTimeToHHmm = (timeStr?: string | null): string => {
  if (!timeStr) return ''
  const trimmed = timeStr.trim()

  // Match 12h formats with SA/CH or AM/PM (e.g., 09:00 SA, 02:30 CH, 9:00 AM)
  const match12h = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(SA|CH|AM|PM)?$/i)
  if (match12h) {
    let hours = parseInt(match12h[1], 10)
    const minutes = match12h[2]
    const period = (match12h[3] || '').toUpperCase()

    if (period === 'CH' || period === 'PM') {
      if (hours < 12) hours += 12
    } else if (period === 'SA' || period === 'AM') {
      if (hours === 12) hours = 0
    }
    return `${String(hours).padStart(2, '0')}:${minutes}`
  }

  // Standard 24h format HH:mm or HH:mm:ss
  const match24h = trimmed.match(/^(\d{1,2}):(\d{2})/)
  if (match24h) {
    const hh = match24h[1].padStart(2, '0')
    const mm = match24h[2]
    return `${hh}:${mm}`
  }

  return ''
}

export const parseTimeToMinutes = (timeStr?: string | null): number => {
  if (!timeStr) return 99999
  const hhmm = normalizeTimeToHHmm(timeStr)
  if (!hhmm) return 99999
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
  return h * 60 + m
}

export const sortStopsByStartTime = <T extends { startTime?: string; time?: string; visitOrder?: number }>(
  stops: T[]
): T[] => {
  return [...stops].sort((a, b) => {
    const timeA = parseTimeToMinutes(a.startTime || a.time)
    const timeB = parseTimeToMinutes(b.startTime || b.time)
    if (timeA !== timeB) return timeA - timeB
    return (a.visitOrder || 0) - (b.visitOrder || 0)
  })
}
