import React, { useState } from "react"
import { Box, Container, Heading, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { UrlForm, UrlFormValues } from "@/components/Urls/UrlForm"
import { UrlList, Url } from "@/components/Urls/UrlList"

export const Route = createFileRoute("/_layout/urls")({
  component: UrlsDashboard,
})

function UrlsDashboard() {
  // Local state for demonstration; replace with API integration later
  const [urls, setUrls] = useState<Url[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddUrl = (values: UrlFormValues) => {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setUrls((prev) => [
        { id: Date.now(), url: values.url, status: "queued" },
        ...prev,
      ])
      setIsSubmitting(false)
    }, 500)
  }

  const handleStart = (id: number) => {
    setUrls((prev) => prev.map((u) => u.id === id ? { ...u, status: "queued" } : u))
  }
  const handleStop = (id: number) => {
    setUrls((prev) => prev.map((u) => u.id === id ? { ...u, status: "stopped" } : u))
  }
  const handleDelete = (id: number) => {
    setUrls((prev) => prev.filter((u) => u.id !== id))
  }
  const handleReanalyze = (id: number) => {
    setUrls((prev) => prev.map((u) => u.id === id ? { ...u, status: "queued" } : u))
  }

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={8} alignItems="stretch">
        <Heading as="h1" size="lg">
          Website Crawler Dashboard
        </Heading>
        {/* URL Submission Form */}
        <Box>
          <UrlForm onSubmit={handleAddUrl} isLoading={isSubmitting} />
        </Box>
        {/* URL List/Dashboard */}
        <Box>
          <UrlList
            urls={urls}
            onStart={handleStart}
            onStop={handleStop}
            onDelete={handleDelete}
            onReanalyze={handleReanalyze}
          />
        </Box>
      </VStack>
    </Container>
  )
} 