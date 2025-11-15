'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { useToast } from '@/components/ui/use-toast'
import { Search, RefreshCw, ExternalLink, Trash2, AlertCircle, RotateCw } from 'lucide-react'

interface Website {
  _id: string
  url: string
  status: string
  statusDetails?: {
    progress?: {
      current: number
      total: number
      phase: string
    }
  }
  lastScraped?: string
  createdAt: string
  updatedAt: string
}

export function WebsiteList() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrapingWebsites, setScrapingWebsites] = useState<Set<string>>(new Set())
  const [isScrapingAll, setIsScrapingAll] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchWebsites()
  }, [])

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites')
      if (response.status === 401) {
        // Handle unauthorized access
        router.push('/sign-in')
        return
      }
      if (!response.ok) throw new Error('Failed to fetch websites')
      const data = await response.json()
      setWebsites(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch websites',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/websites/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete website')
      
      setWebsites(prev => prev.filter(site => site._id !== id))
      toast({
        title: 'Success',
        description: 'Website deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete website',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAll = async () => {
    try {
      const response = await fetch('/api/websites/delete-all', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to delete websites')
      
      const data = await response.json()
      setWebsites([])
      toast({
        title: 'Success',
        description: `Successfully deleted ${data.summary.deletedWebsites} websites`,
      })
      
      fetchWebsites()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete websites',
        variant: 'destructive',
      })
    }
  }

  const handleScrapeWebsite = async (id: string) => {
    if (scrapingWebsites.has(id)) return;
    
    try {
      setScrapingWebsites(prev => {
        const next = new Set(Array.from(prev));
        next.add(id);
        return next;
      });
      const response = await fetch(`/api/websites/scrape/${id}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start scraping');
      }
      
      toast({
        title: 'Success',
        description: 'Started scraping website',
      });
      
      // Update the website status immediately
      setWebsites(prev => prev.map(site => 
        site._id === id 
          ? { ...site, status: 'pending', statusDetails: { progress: { current: 0, total: 100, phase: 'starting' } } }
          : site
      ));
      
      // Fetch updated status after a short delay
      setTimeout(fetchWebsites, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start scraping',
        variant: 'destructive',
      });
    } finally {
      setScrapingWebsites(prev => {
        const next = new Set(Array.from(prev));
        next.delete(id);
        return next;
      });
    }
  };

  const handleScrapeAll = async () => {
    if (isScrapingAll || websites.length === 0) return;
    
    setIsScrapingAll(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      // Scrape websites sequentially with a small delay between each
      for (const website of websites) {
        try {
          const response = await fetch(`/api/websites/scrape/${website._id}`, {
            method: 'POST',
          });
          
          if (response.ok) {
            successCount++;
            // Update status optimistically
            setWebsites(prev => prev.map(site => 
              site._id === website._id 
                ? { ...site, status: 'pending', statusDetails: { progress: { current: 0, total: 100, phase: 'starting' } } }
                : site
            ));
          } else {
            failCount++;
          }
          
          // Small delay between requests to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          failCount++;
        }
      }
      
      toast({
        title: 'Scraping Initiated',
        description: `Started scraping ${successCount} website(s)${failCount > 0 ? `. ${failCount} failed.` : ''}`,
      });
      
      // Fetch updated statuses
      setTimeout(fetchWebsites, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate scraping',
        variant: 'destructive',
      });
    } finally {
      setIsScrapingAll(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'scraping':
      case 'embedding':
      case 'processing':
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getStatusDetails = (website: Website) => {
    if (!website.statusDetails) return []
    
    const details: string[] = []
    if (website.statusDetails.progress) {
      details.push(
        `Progress: ${website.statusDetails.progress.current}/${website.statusDetails.progress.total} (${website.statusDetails.progress.phase})`
      )
    }
    if (website.lastScraped) {
      details.push(`Last scraped: ${new Date(website.lastScraped).toLocaleString()}`)
    }
    return details
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredWebsites = websites.filter(site =>
    site.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search websites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button 
          onClick={fetchWebsites} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-2 transition-all duration-500 ease-in-out active:scale-95"
        >
          <RefreshCw className={`h-4 w-4 transition-all duration-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="default"
              disabled={isScrapingAll || websites.length === 0}
              className="flex items-center gap-2"
            >
              <RotateCw className={`h-4 w-4 ${isScrapingAll ? 'animate-spin' : ''}`} />
              Scrape All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Scrape All Websites</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to scrape all {websites.length} website(s)? This will start the scraping process for each website sequentially.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleScrapeAll}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Scrape All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete All</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Websites</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all websites? This will remove all website data and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {filteredWebsites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No websites found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try different search terms' : 'Start by adding some websites'}
          </p>
        </motion.div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredWebsites.map((website) => (
                  <motion.tr
                    key={website._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={website.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <span className="max-w-[200px] lg:max-w-[400px] truncate">
                            {website.url}
                          </span>
                          <ExternalLink className="h-4 w-4 shrink-0" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <HoverCard>
                        <HoverCardTrigger>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(website.status)}`}>
                            {website.status || "unknown"}
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Status Details</h4>
                            {website.statusDetails?.progress && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>{website.statusDetails.progress.phase}</span>
                                  <span>
                                    {Math.round((website.statusDetails.progress.current / website.statusDetails.progress.total) * 100)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={(website.statusDetails.progress.current / website.statusDetails.progress.total) * 100} 
                                />
                              </div>
                            )}
                            {getStatusDetails(website).map((detail, i) => (
                              <p key={i} className="text-sm text-muted-foreground">{detail}</p>
                            ))}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(website.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 group-hover:opacity-100 transition-all duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleScrapeWebsite(website._id)}
                          className="relative"
                        >
                          <RotateCw className={`h-4 w-4 ${scrapingWebsites.has(website._id) ? 'animate-spin' : ''}`} />
                          <span className="sr-only">Scrape</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="relative hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Website</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this website? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(website._id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}