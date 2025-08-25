'use client'

import { useState, useEffect } from 'react'

interface ClientDateFormatterProps {
  date: Date
  format: 'date' | 'time'
  className?: string
}

export function ClientDateFormatter({ date, format, className }: ClientDateFormatterProps) {
  const [formattedDate, setFormattedDate] = useState<string>('')

  useEffect(() => {
    if (format === 'date') {
      setFormattedDate(date.toLocaleDateString())
    } else {
      setFormattedDate(date.toLocaleTimeString())
    }
  }, [date, format])

  if (!formattedDate) {
    // Return a placeholder during SSR to prevent hydration mismatch
    return <span className={className}>--</span>
  }

  return <span className={className}>{formattedDate}</span>
}