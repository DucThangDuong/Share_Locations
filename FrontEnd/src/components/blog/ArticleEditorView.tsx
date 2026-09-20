import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
  type JSONContent
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import type { LookupItemDto } from '@/types/models/place.model'
import { placeService } from '@/services/placeService'
import { convertRawContentToHtml } from '@/utils/contentConverter'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  ChevronDown,
  Quote,
  Highlighter,
  Strikethrough,
  Code,
  Minus,
  Undo,
  Redo,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Send,
  ListTree,
  PanelLeftClose,
  PanelLeft,
  Heading1,
  Heading2,
  Heading3,
  Save
} from 'lucide-react'

export interface EditorOutputData {
  title: string
  summary?: string
  category: string
  categoryId?: number
  coverImg?: string
  authorName: string
  content: JSONContent | string
  htmlContent?: string
  contentJSON?: string
  readTimeMinutes?: number
  status?: number
}

export interface ArticleEditorViewProps {
  locationId?: string
  heritageId?: string
  heritageTitle?: string
  onBack?: () => void | Promise<void>
  onPublish?: (data: EditorOutputData) => void
  onSaveDraft?: (data: EditorOutputData) => void
  onSave?: (data: EditorOutputData) => void
  onCancel?: () => void
  articleId?: number
  availableCategories?: LookupItemDto[]
  initialContent?: JSONContent | string
  initialTitle?: string
  initialSummary?: string
  initialCategory?: string
  initialCategoryId?: number
  categories?: LookupItemDto[]
  initialCoverImg?: string
  authorName?: string
  authorAvatar?: string
  draftId?: string
  isManagerMode?: boolean
  hideTitleAndSummary?: boolean
  onToast?: (msg: string) => void
}

interface ToolbarBtnProps {
  onClick: () => void
  isActive?: boolean
  title: string
  children: React.ReactNode
  disabled?: boolean
}

interface TocItem {
  id: string
  level: number
  text: string
  pos: number
}

const ToolbarBtn: React.FC<ToolbarBtnProps> = ({ onClick, isActive, title, children, disabled }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${isActive
      ? 'bg-emerald-100 text-emerald-900 shadow-2xs font-bold'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
  >
    {children}
  </button>
)

const ResizableImageNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const [isResizing, setIsResizing] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentWidth = node.attrs.width || '100%'

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseDown = (direction: 'se' | 'sw') => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = containerRef.current?.offsetWidth || 300
    const parentWidth = containerRef.current?.parentElement?.offsetWidth || 800

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = direction === 'se'
        ? moveEvent.clientX - startX
        : startX - moveEvent.clientX

      const newWidth = Math.max(100, Math.min(parentWidth, startWidth + deltaX))

      if (containerRef.current) {
        containerRef.current.style.width = `${newWidth}px`
        containerRef.current.style.height = 'auto'
      }
    }

    const onMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      setIsResizing(false)

      const deltaX = direction === 'se'
        ? upEvent.clientX - startX
        : startX - upEvent.clientX

      const finalWidth = Math.max(100, Math.min(parentWidth, startWidth + deltaX))
      updateAttributes({ width: `${finalWidth}px`, height: 'auto' })
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const isShowControls = selected || isFocused || isResizing

  return (
    <NodeViewWrapper
      className="my-4 flex justify-center cursor-grab active:cursor-grabbing"
      data-drag-handle
    >
      <div
        ref={containerRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsFocused(true)
        }}
        className={`relative inline-block transition-shadow ${isShowControls ? 'ring-2 ring-emerald-600 ring-offset-2 rounded-xl' : ''
          }`}
        style={{ width: currentWidth, height: 'auto', maxWidth: '100%' }}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          className="w-full h-auto object-cover rounded-xl shadow-xs border border-slate-200 block pointer-events-auto"
          draggable="true"
        />

        {isShowControls && (
          <>
            <div
              onMouseDown={handleMouseDown('sw')}
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-800 border-2 border-white rounded-full cursor-sw-resize z-20 shadow-md ring-1 ring-black/20"
              title="Kéo để thay đổi kích thước"
            />
            <div
              onMouseDown={handleMouseDown('se')}
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-800 border-2 border-white rounded-full cursor-se-resize z-20 shadow-md ring-1 ring-black/20"
              title="Kéo để thay đổi kích thước"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}

const ResizableImage = Image.extend({
  name: 'image',
  inline: false,
  group: 'block',
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: (attributes) => ({
          width: attributes.width,
          style: `width: ${attributes.width}; max-width: 100%; height: auto;`
        })
      }
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView)
  }
})

export interface ArticleEditorRef {
  getHtmlContent: () => string
  getJsonContent: () => JSONContent
  handlePublish: () => Promise<void>
}



const COVER_PRESETS = [
  { label: 'Huế cố đô', url: 'https://images.unsplash.com/photo-1569271532956-3fb81a207115?w=1000&h=600&fit=crop&auto=format' },
  { label: 'Đà Nẵng biển', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1000&h=600&fit=crop&auto=format' },
  { label: 'Hội An phố cổ', url: 'https://images.unsplash.com/photo-1527997921830-de1cf1f9b430?w=1000&h=600&fit=crop&auto=format' },
  { label: 'Vũng Tàu', url: 'https://images.unsplash.com/photo-1718942900279-4711345169d3?w=1000&h=600&fit=crop&auto=format' },
  { label: 'Nha Trang', url: 'https://images.unsplash.com/photo-1763703686284-b63557b08a86?w=1000&h=600&fit=crop&auto=format' },
  { label: 'Chợ đêm ẩm thực', url: 'https://images.unsplash.com/photo-1509072619873-adb3dc289b50?w=1000&h=600&fit=crop&auto=format' }
]

const parseInitialContent = (content?: unknown) => {
  if (!content) return ''
  if (typeof content === 'object') {
    if ('ops' in (content as Record<string, unknown>)) return convertRawContentToHtml(content as object)
    return content
  }
  if (typeof content === 'string') {
    const trimmed = content.trim()
    if (trimmed.startsWith('{"ops"') || trimmed.startsWith('{"ops":') || trimmed.startsWith('{"ops" :')) {
      return convertRawContentToHtml(trimmed)
    }
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && parsed.ops) return convertRawContentToHtml(parsed)
      return parsed
    } catch {
      return content
    }
  }
  return ''
}

export const ArticleEditorView = forwardRef<ArticleEditorRef, ArticleEditorViewProps>(({
  onPublish,
  onSaveDraft,
  onSave,
  onCancel: _onCancel,
  initialContent,
  initialTitle = '',
  initialSummary = '',
  initialCategory,
  initialCategoryId,
  categories,
  availableCategories,
  initialCoverImg = '',
  authorName: propAuthor = '',
  draftId: initialDraftId,
  articleId: _propArticleId,
  isManagerMode = false,
  hideTitleAndSummary = false,
  onToast
}, ref) => {
  const [categoriesList, setCategoriesList] = useState<LookupItemDto[]>(categories || availableCategories || [])
  const [title, setTitle] = useState(initialTitle)
  const [summary, setSummary] = useState(initialSummary)
  const [category, setCategory] = useState<string>(initialCategory || 'Di tích lịch sử - Văn hóa')
  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategoryId)
  const [coverImg, setCoverImg] = useState(initialCoverImg)
  const [showCoverModal, setShowCoverModal] = useState(false)
  const [showTocSidebar, setShowTocSidebar] = useState(true)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeHeadingPos, setActiveHeadingPos] = useState<number | null>(null)
  const [_draftId, setDraftId] = useState<string | undefined>(initialDraftId)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [localToast, setLocalToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    if (onToast) {
      onToast(msg)
    }
    setLocalToast({ msg, type })
    setTimeout(() => setLocalToast(null), 3000)
  }

  const updateToc = useCallback((editorInstance: any) => {
    if (!editorInstance) return
    const items: TocItem[] = []
    editorInstance.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading') {
        const text = node.textContent.trim()
        if (text) {
          items.push({
            id: `toc-${pos}`,
            level: node.attrs.level || 1,
            text,
            pos
          })
        }
      }
    })
    setTocItems(items)
  }, [])

  const updateActiveHeading = useCallback((ed: any) => {
    if (!ed) return
    const currentPos = ed.state.selection.from
    let currentActive: number | null = null
    ed.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading') {
        if (pos <= currentPos) {
          currentActive = pos
        }
      }
    })
    setActiveHeadingPos(currentActive)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true }
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Bắt đầu viết cẩm nang du lịch của bạn... Nhập nội dung bài viết, tạo tiêu đề hoặc tải ảnh.'
      }),
      ResizableImage.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color
    ],
    content: parseInitialContent(initialContent),
    onSelectionUpdate: ({ editor: ed }) => {
      updateActiveHeading(ed)
    },
    onUpdate: ({ editor: ed }) => {
      updateToc(ed)
      updateActiveHeading(ed)
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor outline-none min-h-[420px] text-slate-800 text-base leading-relaxed focus:outline-none'
      }
    }
  })

  useEffect(() => {
    if (editor) {
      updateToc(editor)
      updateActiveHeading(editor)
    }
  }, [editor, updateToc, updateActiveHeading])

  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories)
      return
    }
    let isMounted = true
    placeService.getFilterOptions()
      .then((res) => {
        if (isMounted && res.success && res.data?.categories) {
          setCategoriesList(res.data.categories)
        }
      })
      .catch(() => { })
    return () => {
      isMounted = false
    }
  }, [categories])

  useEffect(() => {
    if (initialTitle !== undefined) setTitle(initialTitle)
  }, [initialTitle])

  useEffect(() => {
    if (initialSummary !== undefined) setSummary(initialSummary)
  }, [initialSummary])

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    if (initialCategoryId !== undefined) setCategoryId(initialCategoryId)
  }, [initialCategoryId])

  useEffect(() => {
    if (initialCoverImg) setCoverImg(initialCoverImg)
  }, [initialCoverImg])

  useEffect(() => {
    if (editor && initialContent !== undefined) {
      editor.commands.setContent(parseInitialContent(initialContent))
    }
  }, [editor, initialContent])

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value)
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto'
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`
    }
  }

  const handleJumpToHeading = (pos: number) => {
    if (!editor) return
    editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run()
    setActiveHeadingPos(pos)
  }

  const handleApplyHeading = (level: 1 | 2 | 3) => {
    if (!editor) return
    editor.chain().focus().toggleHeading({ level }).run()
  }

  const handleSetParagraph = () => {
    if (!editor) return
    editor.chain().focus().setParagraph().run()
  }

  const handlePublish = async () => {
    if (!title.trim()) {
      showNotification('Vui lòng nhập tiêu đề bài viết cẩm nang!', 'error')
      return
    }

    setIsPublishing(true)
    try {
      const matchedCat = categoriesList.find((c) => c.name === category || c.id === categoryId)
      const resolvedCatId = matchedCat?.id || categoryId || 1
      const resolvedCatName = matchedCat?.name || category || 'Di tích lịch sử - Văn hóa'

      const wordCount = editor?.getText().trim().split(/\s+/).filter(Boolean).length || 0
      const data: EditorOutputData = {
        title: title.trim(),
        summary: summary.trim() || title.trim(),
        category: resolvedCatName,
        categoryId: resolvedCatId,
        coverImg: coverImg.trim() || initialCoverImg,
        authorName: propAuthor,
        content: editor?.getJSON() || {},
        htmlContent: editor?.getHTML() || '',
        contentJSON: JSON.stringify(editor?.getJSON() || {}),
        readTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
        status: 1
      }

      if (onPublish) onPublish(data)
      if (onSave) onSave(data)
      showNotification('Công bố thành công!', 'success')
    } catch {
      showNotification('Có lỗi xảy ra khi xuất bản bài viết.', 'error')
    } finally {
      setIsPublishing(false)
    }
  }

  useImperativeHandle(ref, () => ({
    getHtmlContent: () => editor?.getHTML() || '',
    getJsonContent: () => editor?.getJSON() || {},
    handlePublish
  }))

  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Kích thước ảnh không được vượt quá 5MB.', 'error')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      editor.chain().focus().setImage({ src: base64, alt: file.name }).run()
      showNotification('Đã chèn hình ảnh vào bài viết!')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [editor])

  const handleCoverFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Kích thước ảnh bìa không được vượt quá 5MB.', 'error')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setCoverImg(base64)
      showNotification('Đã cập nhật ảnh bìa bài viết!')
      setShowCoverModal(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const triggerImageUpload = useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const addLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Nhập URL liên kết:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      showNotification('Vui lòng nhập tiêu đề để lưu bản nháp!', 'error')
      return
    }

    setIsSaving(true)
    try {
      const matchedCat = categoriesList.find((c) => c.name === category || c.id === categoryId)
      const resolvedCatId = matchedCat?.id || categoryId || 1
      const resolvedCatName = matchedCat?.name || category || 'Di tích lịch sử - Văn hóa'
      const newDraftId = `draft-${Date.now()}`
      setDraftId(newDraftId)
      const wordCount = editor?.getText().trim().split(/\s+/).filter(Boolean).length || 0
      if (onSaveDraft) {
        onSaveDraft({
          title: title.trim(),
          summary: summary.trim() || title.trim(),
          category: resolvedCatName,
          categoryId: resolvedCatId,
          coverImg: coverImg.trim() || initialCoverImg,
          authorName: propAuthor,
          content: editor?.getJSON() || {},
          htmlContent: editor?.getHTML() || '',
          contentJSON: JSON.stringify(editor?.getJSON() || {}),
          readTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
          status: 0
        })
      }
      showNotification('Đã lưu bản nháp cẩm nang!')
    } catch {
      showNotification('Không thể lưu bản nháp lúc này.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (!editor) return null

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverFileChange}
        className="hidden"
      />

      {localToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 border ${localToast.type === 'error'
          ? 'bg-rose-900 text-white border-rose-700'
          : 'bg-slate-900 text-white border-slate-700'
          }`}>
          {localToast.type === 'error' ? (
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          )}
          <span>{localToast.msg}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="min-h-13 flex flex-wrap items-center px-4 py-2 justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowTocSidebar(!showTocSidebar)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${showTocSidebar
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                }`}
              title="Bật/tắt thanh điều hướng mục lục (Navigation Pane)"
            >
              {showTocSidebar ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
              <span>Mục lục</span>
              {tocItems.length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-800 text-white text-[10px] rounded-full font-bold">
                  {tocItems.length}
                </span>
              )}
            </button>

            <div className="w-px h-6 bg-slate-200 mx-0.5 shrink-0 hidden sm:block" />

            <div className="flex items-center gap-1.5 shrink-0">
              <Tag size={14} className="text-emerald-800 shrink-0" />
              <select
                value={category}
                onChange={(e) => {
                  const selectedName = e.target.value
                  const matched = categoriesList.find((c) => c.name === selectedName)
                  setCategory(selectedName)
                  if (matched) setCategoryId(matched.id)
                }}
                className="font-bold px-2.5 py-1.5 bg-slate-50 text-emerald-950 border border-slate-200 rounded-xl text-xs outline-none cursor-pointer shadow-2xs hover:border-emerald-300"
              >
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCoverModal(!showCoverModal)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <ImageIcon size={13} className="text-emerald-700" />
                <span>{coverImg ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'}</span>
                {coverImg && (
                  <img
                    src={coverImg}
                    alt="Cover thumbnail"
                    className="w-4 h-4 rounded object-cover ml-1 border border-slate-300"
                  />
                )}
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {showCoverModal && (
                <div className="absolute top-full left-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3.5 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-800">Cài đặt ảnh bìa bài viết</span>
                    <button
                      type="button"
                      onClick={() => setShowCoverModal(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                  >
                    <Upload size={13} />
                    <span>Tải ảnh từ máy tính</span>
                  </button>

                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Hoặc chọn ảnh gợi ý nhanh:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {COVER_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setCoverImg(p.url)
                            setShowCoverModal(false)
                            showNotification(`Đã chọn ảnh bìa: ${p.label}`)
                          }}
                          className="group relative rounded-lg overflow-hidden border border-slate-200 text-left cursor-pointer aspect-[16/10]"
                        >
                          <img src={p.url} alt={p.label} className="w-full h-full object-cover group-hover:brightness-90" />
                          <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-semibold px-1 py-0.5 truncate text-center">
                            {p.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isManagerMode && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving || isPublishing}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu nháp'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving || isPublishing}
              className="px-4 py-1.5 bg-emerald-800 text-white text-xs font-bold rounded-xl hover:bg-emerald-900 transition-colors cursor-pointer disabled:opacity-50 shadow-xs flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>{isPublishing ? 'Đang xuất bản...' : isManagerMode ? 'Lưu nội dung' : 'Công bố'}</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center gap-1.5">
          <div className="bg-white p-0.5 rounded-xl flex items-center gap-0.5 border border-slate-200/80 shadow-2xs shrink-0">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSetParagraph}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${editor.isActive('paragraph') && !editor.isActive('heading')
                ? 'bg-slate-900 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
              title="Đoạn văn bản thường (Normal Text)"
            >
              Văn bản
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleApplyHeading(1)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${editor.isActive('heading', { level: 1 })
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
                }`}
              title="Heading 1: Tiêu đề mục chính (Tự động làm mục lục)"
            >
              <Heading1 size={13} />
              <span>Tiêu đề 1</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleApplyHeading(2)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${editor.isActive('heading', { level: 2 })
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
                }`}
              title="Heading 2: Tiêu đề mục phụ (Tự động làm mục lục)"
            >
              <Heading2 size={13} />
              <span>Tiêu đề 2</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleApplyHeading(3)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${editor.isActive('heading', { level: 3 })
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
                }`}
              title="Heading 3: Tiểu mục chi tiết (Tự động làm mục lục)"
            >
              <Heading3 size={13} />
              <span>Tiểu mục</span>
            </button>
          </div>

          <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

          <div className="flex items-center gap-0.5 shrink-0 bg-white p-0.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="In đậm (Ctrl+B)">
              <Bold className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="In nghiêng (Ctrl+I)">
              <Italic className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Gạch chân (Ctrl+U)">
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Gạch ngang chữ">
              <Strikethrough className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight({ color: '#FEF08A' }).run()} isActive={editor.isActive('highlight')} title="Bôi sáng (Highlight)">
              <Highlighter className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Code inline">
              <Code className="w-4 h-4" />
            </ToolbarBtn>
          </div>

          <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

          <div className="flex items-center gap-0.5 shrink-0 bg-white p-0.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Danh sách gạch đầu dòng">
              <List className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Danh sách đánh số">
              <ListOrdered className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Checklist công việc / lịch trình">
              <CheckSquare className="w-4 h-4" />
            </ToolbarBtn>
          </div>

          <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

          <div className="flex items-center gap-0.5 shrink-0 bg-white p-0.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Căn trái">
              <AlignLeft className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Căn giữa">
              <AlignCenter className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Căn phải">
              <AlignRight className="w-4 h-4" />
            </ToolbarBtn>
          </div>

          <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

          <div className="flex items-center gap-0.5 shrink-0 bg-white p-0.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Trích dẫn / Khung ghi chú">
              <Quote className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường phân cách">
              <Minus className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={triggerImageUpload} title="Chèn hình ảnh">
              <ImageIcon className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={addLink} isActive={editor.isActive('link')} title="Chèn liên kết">
              <LinkIcon className="w-4 h-4" />
            </ToolbarBtn>
          </div>

          <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

          <div className="flex items-center gap-0.5 shrink-0 bg-white p-0.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Hoàn tác (Ctrl+Z)">
              <Undo className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Làm lại (Ctrl+Y)">
              <Redo className="w-4 h-4" />
            </ToolbarBtn>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 py-8 gap-6 items-start">
        {showTocSidebar && (
          <aside className="w-72 shrink-0 hidden lg:block sticky top-32 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListTree size={16} className="text-emerald-800" />
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">Điều hướng mục lục</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTocSidebar(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                title="Đóng thanh mục lục"
              >
                <X size={13} />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <nav className="space-y-1 text-xs max-h-[320px] overflow-y-auto no-scrollbar">
                {tocItems.map((item) => {
                  const isActive = activeHeadingPos === item.pos
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleJumpToHeading(item.pos)}
                      className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-start gap-2 cursor-pointer ${isActive
                        ? 'bg-emerald-100 text-emerald-950 font-bold ring-1 ring-emerald-300'
                        : item.level === 1
                          ? 'font-bold text-slate-900 bg-slate-50 hover:bg-slate-100'
                          : item.level === 2
                            ? 'pl-4 text-slate-700 hover:bg-slate-100 font-medium'
                            : 'pl-6 text-slate-500 text-[11px] hover:bg-slate-100'
                        }`}
                    >
                      <span className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 mt-0.5 ${item.level === 1
                        ? 'bg-emerald-800 text-white'
                        : item.level === 2
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-500'
                        }`}>
                        H{item.level}
                      </span>
                      <span className="line-clamp-2 leading-snug">{item.text}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0 flex justify-center">
          <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-10 space-y-6">
            {!hideTitleAndSummary && (
              <div className="space-y-4 pb-4 border-b border-slate-100">
                {coverImg && (
                  <div className="relative rounded-2xl overflow-hidden aspect-[21/9] w-full max-h-[280px] bg-slate-100 border border-slate-200 group">
                    <img
                      src={coverImg}
                      alt="Ảnh bìa bài viết"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCoverModal(true)}
                        className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-slate-100"
                      >
                        Đổi ảnh bìa
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImg('')}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-red-700"
                      >
                        Xóa ảnh bìa
                      </button>
                    </div>
                  </div>
                )}

                <textarea
                  ref={titleTextareaRef}
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Nhập tiêu đề cẩm nang du lịch (ví dụ: Top 5 Món Ăn Truyền Thống Đốn Tim Gen Z...)"
                  rows={1}
                  className="w-full bg-transparent text-slate-900 text-2xl sm:text-3xl font-black leading-snug placeholder:text-slate-300 outline-none border-none caret-emerald-800 resize-none break-words overflow-hidden"
                />

                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Mô tả tóm tắt ngắn về bài viết (1–2 câu thu hút người đọc)..."
                  rows={2}
                  className="w-full bg-slate-50 p-3 rounded-xl text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 outline-none border border-slate-200 focus:border-emerald-600 focus:bg-white resize-none transition-all break-words"
                />
              </div>
            )}

            <div className="tiptap-wrapper min-h-[420px]">
              <EditorContent editor={editor} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
})

export default ArticleEditorView
