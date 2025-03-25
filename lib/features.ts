import { MessageSquare, BookOpen, Brain } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Feature {
  title: string
  description: string
  icon: LucideIcon
}

export const features: Feature[] = [
  {
    title: "Chat with AI",
    description: "Get instant answers to your questions about BVC Engineering College.",
    icon: MessageSquare,
  },
  // ... other features
]