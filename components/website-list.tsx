"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Trash2, RefreshCw, ExternalLink } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

interface Website {
  _id: string;
  url: string;
  lastScraped: Date | null;
  status: "active" | "pending" | "error" | "unknown";
  createdAt: Date;
  updatedAt: Date;
}

export function WebsiteList() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchWebsites = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/websites");

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch websites");
        } else {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to fetch websites");
        }
      }

      const data = await response.json();
      setWebsites(data);
    } catch (error) {
      console.error("Error fetching websites:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load websites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();

    // Set up auto-refresh interval (every 30 seconds)
    const interval_id = setInterval(fetchWebsites, 30000);

    // Clean up interval on unmount
    return () => clearInterval(interval_id);
  }, []);

  const triggerScrape = async (_id: string) => {
    try {
      const response = await fetch(`/api/websites/scrape/${_id}`, {
        method: "POST",
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to initiate scraping");
        } else {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to initiate scraping");
        }
      }

      toast({
        title: "Success",
        description: "Website scraping initiated",
      });
      fetchWebsites();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initiate scraping",
        variant: "destructive",
      });
    }
  };

  const deleteWebsite = async (_id: string) => {
    try {
      const response = await fetch(`/api/websites/${_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete website");
        } else {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to delete website");
        }
      }

      // Delete associated chunks in Pinecone and MongoDB
      await fetch(`/api/websites/chunks/${_id}`, {
        method: "DELETE",
      });

      toast({
        title: "Success",
        description: "Website and its chunks deleted successfully",
      });
      fetchWebsites();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete website",
        variant: "destructive",
      });
    }
  };

  const scrapeAllWebsites = async () => {
    try {
      // First, confirm with the user
      if (!confirm("This will delete ALL existing scraped data and re-scrape all websites. Continue?")) {
        return;
      }

      toast({
        title: "Processing",
        description: "Deleting existing data and initiating scraping for all websites...",
      });

      // 1. Delete all vectors from Pinecone first
      const deleteAllResponse = await fetch(`/api/websites/chunks/all`, {
        method: "DELETE",
      });

      if (!deleteAllResponse.ok) {
        const contentType = deleteAllResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await deleteAllResponse.json();
          throw new Error(errorData.error || "Failed to delete existing data");
        } else {
          const errorText = await deleteAllResponse.text();
          throw new Error(errorText || "Failed to delete existing data");
        }
      }

      // 2. Then initiate the scrape-all process
      const response = await fetch(`/api/websites/scrape-all`, {
        method: "POST",
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to scrape all websites");
        } else {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to scrape all websites");
        }
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Processing ${result.count || 'all'} websites for scraping. This may take some time.`,
      });
      
      fetchWebsites();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to scrape all websites",
        variant: "destructive",
      });
    }
  };

 

  if (loading && websites.length === 0) {
    return <div className="flex justify-center p-4">Loading websites...</div>;
  }

  if (!loading && websites.length === 0) {
    return (
      <div className="text-center py-6">
        No websites added yet. Add your first website above.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Scraped</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {websites.map((website, index) => (
            <TableRow key={website._id || `website-${index}`}>
              <TableCell>
                <a
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-500 hover:underline"
                >
                  {website.url && website.url.length > 30
                    ? website.url.substring(0, 30) + "..."
                    : website.url || "N/A"}
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    website.status === "active"
                      ? "bg-green-100 text-green-800"
                      : website.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {website.status || "unknown"}
                </span>
              </TableCell>
              <TableCell>
                {website.lastScraped
                  ? new Date(website.lastScraped).toLocaleString()
                  : "Never"}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    website.status === "active"
                      ? toast({
                          title: "Info",
                          description: "This website is already active.",
                        })
                      : triggerScrape(website._id)
                  }
                  disabled={website.status === "pending"}
                  title={
                    website.status === "active"
                      ? "Website is active"
                      : "Scrape website"
                  }
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                {/* Add the new Delete & Scrape button */}
               
                
                {/* Existing delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      title="Delete website"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete the website and all its scraped data.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteWebsite(website._id)}
                        className="bg-red-500 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end space-x-2">
        <Button onClick={fetchWebsites} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
        <Button onClick={scrapeAllWebsites} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Scrape All
        </Button>
      </div>
    </div>
  );
}