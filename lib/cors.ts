import { NextRequest } from 'next/server';

const allowedOrigins = [
  'https://bvc-rag.vercel.app',
  'https://bvcai.nagendragubbala.me',
  'https://www.bvc-rag.vercel.app'
];

export function corsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isProdOrigin = origin && allowedOrigins.includes(origin);
  const isDev = process.env.NODE_ENV === 'development';

  return {
    'Access-Control-Allow-Origin': isDev ? '*' : (isProdOrigin ? origin : allowedOrigins[0]),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}