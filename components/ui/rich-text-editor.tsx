"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, Underline, List, ListOrdered, Quote } from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const formatText = (type: string) => {
    switch (type) {
      case "bold":
        insertText("**", "**")
        break
      case "italic":
        insertText("*", "*")
        break
      case "underline":
        insertText("<u>", "</u>")
        break
      case "quote":
        insertText("> ")
        break
      case "list":
        insertText("- ")
        break
      case "numbered":
        insertText("1. ")
        break
    }
  }

  const renderPreview = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>")
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic">$1</blockquote>')
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/^(\d+)\. (.+)$/gm, "<li>$1. $2</li>")
      .replace(/\n/g, "<br>")
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
        <Button type="button" variant="ghost" size="sm" onClick={() => formatText("bold")} className="h-8 w-8 p-0">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => formatText("italic")} className="h-8 w-8 p-0">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => formatText("underline")} className="h-8 w-8 p-0">
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button type="button" variant="ghost" size="sm" onClick={() => formatText("quote")} className="h-8 w-8 p-0">
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => formatText("list")} className="h-8 w-8 p-0">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => formatText("numbered")} className="h-8 w-8 p-0">
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="ml-auto">
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsPreview(!isPreview)} className="text-xs">
            {isPreview ? "Edit" : "Preview"}
          </Button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="min-h-[200px]">
        {isPreview ? (
          <div className="p-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderPreview(value) }} />
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[200px] border-0 resize-none focus-visible:ring-0 rounded-none"
          />
        )}
      </div>
    </div>
  )
}
