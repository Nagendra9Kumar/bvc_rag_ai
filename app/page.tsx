import { auth } from '@clerk/nextjs/server'
import { HomePage } from '@/components/home-page'

export default async function Home() {
  const { userId } = await auth()
  return <HomePage isSignedIn={!!userId} />
}
