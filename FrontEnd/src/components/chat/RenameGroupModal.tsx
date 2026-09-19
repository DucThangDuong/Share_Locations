import React, { useState, useEffect, useRef } from 'react'
import { X, Pencil, Loader2 } from 'lucide-react'

interface RenameGroupModalProps {
  isOpen: boolean
  currentTitle: string
  onClose: () => void
  onSave: (newName: string) => Promise<void>
}

export const RenameGroupModal: React.FC<RenameGroupModalProps> = ({
  isOpen,
  currentTitle,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(currentTitle)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName(currentTitle)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isOpen, currentTitle])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === currentTitle) {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      await onSave(trimmed)
      onClose()
    } catch (err) {
      console.error('Failed to rename group:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Pencil className="w-4 h-4 text-[#0084FF]" />
            <h2>Đổi tên đoạn chat</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-500">
            Mọi người trong đoạn chat đều sẽ thấy tên mới này khi bạn thay đổi.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tên đoạn chat
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên mới cho nhóm..."
              maxLength={100}
              className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#0084FF] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-5 py-2 text-xs font-semibold bg-[#0084FF] hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RenameGroupModal
