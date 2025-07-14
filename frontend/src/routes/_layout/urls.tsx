import React from "react"
import { Box, Container, Heading, VStack } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UrlForm, UrlFormValues } from "@/components/Urls/UrlForm"
import { UrlList } from "@/components/Urls/UrlList"
import { UrlsService, type CrawledURL } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/urls")({
  component: UrlsDashboard,
})

function UrlsDashboard() {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Fetch URLs
  const { data: urls = [], isLoading } = useQuery({
    queryKey: ["urls"],
    queryFn: () => UrlsService.listUrls(),
  })

  // Add URL
  const addUrlMutation = useMutation({
    mutationFn: (values: UrlFormValues) =>
      UrlsService.addUrl({ url: values.url }),
    onSuccess: () => {
      showSuccessToast("URL added!")
      queryClient.invalidateQueries({ queryKey: ["urls"] })
    },
    onError: (err: any) => {
      showErrorToast(err?.body?.detail || "Failed to add URL")
    },
  })

  // Start/Stop/Delete/Reanalyze Mutations
  const startMutation = useMutation({
    mutationFn: (id: number) => UrlsService.startCrawl({ id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["urls"] }),
  })
  const stopMutation = useMutation({
    mutationFn: (id: number) => UrlsService.stopCrawl({ id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["urls"] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => UrlsService.bulkDeleteUrls({ requestBody: [id] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["urls"] }),
  })
  const reanalyzeMutation = useMutation({
    mutationFn: (id: number) => UrlsService.bulkReanalyzeUrls({ requestBody: [id] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["urls"] }),
  })

  // Handlers
  const handleAddUrl = (values: UrlFormValues) => addUrlMutation.mutate(values)
  const handleStart = (id: number) => startMutation.mutate(id)
  const handleStop = (id: number) => stopMutation.mutate(id)
  const handleDelete = (id: number) => deleteMutation.mutate(id)
  const handleReanalyze = (id: number) => reanalyzeMutation.mutate(id)

  // Map backend data to UrlList format if needed
  const urlListData = (urls as CrawledURL[]).map((u) => ({
    id: u.id!,
    url: u.url,
    status: u.status,
  }))

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={8} alignItems="stretch">
        <Heading as="h1" size="lg">
          Website Crawler Dashboard
        </Heading>
        <Box>
          <UrlForm onSubmit={handleAddUrl} isLoading={addUrlMutation.isPending} />
        </Box>
        <Box>
          <UrlList
            urls={urlListData}
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