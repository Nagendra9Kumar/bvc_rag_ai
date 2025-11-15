import { Pinecone } from '@pinecone-database/pinecone'

// Check if we're in a build environment
const isBuild = process.env.NODE_ENV === 'production' && !process.env.PINECONE_API_KEY

let pinecone: Pinecone
let pineconeIndex: any

if (isBuild) {
  // During build time, create mock instances
  pinecone = {} as Pinecone
  pineconeIndex = {}
} else {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('Missing Pinecone API key')
  }

  // Initialize Pinecone client with the configuration for the newer SDK version
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  })

  // Connect to the specific index with exact configuration
  pineconeIndex = pinecone.index(process.env.PINECONE_INDEX || 'default-index')
}

export { pineconeIndex }
export default pinecone
