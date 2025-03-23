import { ObjectId } from 'mongodb'

export interface Feedback {
  _id?: ObjectId
  userId: string
  questionId: string
  rating: number
  comment?: string
  createdAt: Date
}
