"use client";

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

const websiteSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL")
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "URL must start with http:// or https://",
    }),
})

type WebsiteFormValues = z.infer<typeof websiteSchema>

export function WebsiteForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<WebsiteFormValues>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      url: "",
    },
  })
  
  async function onSubmit(data: WebsiteFormValues) {
    setIsSubmitting(true)
    try {
      // Derive a name from the URL (e.g., extract domain name)
      const url = new URL(data.url);
      const hostnameParts = url.hostname.split('.');
      // Use the domain name without TLD as the website name
      const name = hostnameParts.length >= 2 ? 
        hostnameParts[hostnameParts.length - 2].charAt(0).toUpperCase() + 
        hostnameParts[hostnameParts.length - 2].slice(1) : 
        url.hostname;
  
      const response = await fetch("/api/websites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Include the derived name in the request
        body: JSON.stringify({
          url: data.url
        }),
      })
  
      if (!response.ok) {
        // Check for duplicate URL (typically returns 409 Conflict)
        if (response.status === 409) {
          toast({
            title: "Website Already Exists",
            description: "This website URL already exists",
            variant: "default",
          });
          return;
        }
        
        // Check the content type before trying to parse as JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          // Check if error message contains keywords indicating the URL already exists
          const errorMessage = errorData.message || errorData.error || "";
          if (errorMessage.toLowerCase().includes("already exists") || 
              errorMessage.toLowerCase().includes("duplicate") ||
              errorMessage.toLowerCase().includes("already added")) {
            toast({
              title: "Website Already Exists",
              description: "This website URL has already been added",
              variant: "default",
            });
            return;
          }
          throw new Error(errorMessage || "Failed to add website");
        } else {
          // Handle plain text error responses
          const errorText = await response.text();
          // Check if error text contains keywords indicating the URL already exists
          if (errorText.toLowerCase().includes("already exists") ||
              errorText.toLowerCase().includes("duplicate") ||
              errorText.toLowerCase().includes("already added")) {
            toast({
              title: "Website Already Exists",
              description: "This website URL has already been added",
              variant: "default",
            });
            return;
          }
          throw new Error(errorText || "Failed to add website");
        }
      }
  
      toast({
        title: "Success",
        description: "Website added successfully",
      })
      
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error adding website:", error)
      
      // Only handle non-duplicate errors here since duplicates are handled directly above
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add website",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.edu" {...field} />
              </FormControl>
              <FormDescription>
                Enter the full URL including https://
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Website"}
        </Button>
      </form>
    </Form>
  )
}