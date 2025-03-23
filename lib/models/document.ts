import { ObjectId } from 'mongodb'

export interface Document {
  _id?: ObjectId
  title: string
  content: string
  category: string
  userId: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface DocumentWithEmbedding extends Document {
  embedding: number[]
}
