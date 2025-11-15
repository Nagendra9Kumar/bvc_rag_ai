# Environment Setup Guide

This guide will help you set up all the required environment variables for the BVC RAG AI application.

## Required API Keys

### 1. MongoDB (Database)
- **Variable**: `MONGODB_URI`
- **Get it from**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Format**: `mongodb+srv://username:password@cluster.mongodb.net/database`
- **Local Development**: `mongodb://localhost:27017/bvc_rag_ai`

### 2. Pinecone (Vector Database)
- **Variables**: 
  - `PINECONE_API_KEY`
  - `PINECONE_INDEX`
- **Get it from**: [Pinecone](https://www.pinecone.io/)
- **Steps**:
  1. Sign up at https://www.pinecone.io/
  2. Create a new project
  3. Get your API key from the dashboard
  4. Create an index (recommended name: `bvc-rag-index`)
  5. Use dimension: 1024 (for BAAI/bge-large-en-v1.5 embeddings)

### 3. HuggingFace (Embeddings)
- **Variable**: `HUGGING_FACE_API_KEY` or `HUGGINGFACE_API_KEY`
- **Get it from**: [HuggingFace](https://huggingface.co/)
- **Steps**:
  1. Sign up at https://huggingface.co/
  2. Go to Settings → Access Tokens
  3. Create a new token with `read` permissions
  4. Copy the token

### 4. OpenRouter (LLM)
- **Variable**: `OPENROUTER_API_KEY`
- **Get it from**: [OpenRouter](https://openrouter.ai/)
- **Steps**:
  1. Sign up at https://openrouter.ai/
  2. Go to Keys section
  3. Create a new API key
  4. Add credits to your account

### 5. Google AI (Optional - for Gemini)
- **Variable**: `GOOGLE_API_KEY`
- **Get it from**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Steps**:
  1. Visit https://makersuite.google.com/app/apikey
  2. Create a new API key
  3. Copy the key

### 6. Clerk (Authentication)
- **Variables**:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- **Get it from**: [Clerk](https://clerk.com/)
- **Steps**:
  1. Sign up at https://clerk.com/
  2. Create a new application
  3. Copy the publishable key and secret key from the dashboard

## Setup Instructions

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in all the required API keys

3. Verify your setup by running:
   ```bash
   pnpm run dev
   ```

## Troubleshooting

### 401 Authentication Error
If you see a 401 error, it means one of your API keys is missing or invalid:
- Check that all required environment variables are set in `.env.local`
- Verify that your API keys are correct and not expired
- Make sure there are no extra spaces or quotes around your keys

### MongoDB Connection Error
- Ensure your MongoDB URI is correct
- Check that your IP address is whitelisted in MongoDB Atlas
- Verify database credentials

### Pinecone Index Error
- Make sure your Pinecone index exists
- Verify the index dimension matches the embedding model (1024 for bge-large-en-v1.5)
- Check that the index name in `.env.local` matches the actual index name

## Free Tier Options

All services offer free tiers that should be sufficient for development:

- **MongoDB Atlas**: 512 MB free
- **Pinecone**: 1 index, 100k vectors free
- **HuggingFace**: Free inference API
- **OpenRouter**: Pay-as-you-go (requires adding credits)
- **Google AI**: Free quota available
- **Clerk**: 10,000 MAUs free

## Security Notes

- Never commit `.env.local` to version control
- Keep your API keys secret
- Rotate keys if they are exposed
- Use different keys for development and production
