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
  return DAY_THEMES[dayIndex % DAY_THEMES.length]
}
