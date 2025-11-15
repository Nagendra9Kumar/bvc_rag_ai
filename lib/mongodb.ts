import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || ''
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Check if we're in a build environment
const isBuild = process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI

if (isBuild) {
  // During build time, create a mock promise that will never be called
  clientPromise = Promise.reject(new Error('MongoDB URI not configured'))
} else {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to .env.local')
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof global & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
}

export default clientPromise
