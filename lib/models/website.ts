import { ObjectId } from 'mongodb'

export interface Website {
  _id?: ObjectId
  url: string
  status: string
  lastScraped?: Date
  createdAt: Date
  updatedAt: Date
  createdBy: string
}