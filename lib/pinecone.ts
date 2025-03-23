import { Pinecone } from '@pinecone-database/pinecone'

if (!process.env.PINECONE_API_KEY) {
  throw new Error('Missing Pinecone API key')
}

// Initialize Pinecone client with the configuration for the newer SDK version
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
})

// Connect to the specific index with exact configuration
export const pineconeIndex = pinecone.index('bvc-rag-index')

export default pinecone
