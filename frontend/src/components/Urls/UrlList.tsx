import React from "react"
import { Box, Button, Table } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"

export interface Url {
  id: number
  url: string
  status: string
}

export interface UrlListProps {
  urls: Url[]
  onStart: (id: number) => void
  onStop: (id: number) => void
  onDelete: (id: number) => void
  onReanalyze: (id: number) => void
}

export function UrlList({ urls, onStart, onStop, onDelete, onReanalyze }: UrlListProps) {
  return (
    <Box overflowX="auto">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>URL</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {urls.map((url) => (
            <Table.Row key={url.id}>
              <Table.Cell>{url.url}</Table.Cell>
              <Table.Cell>{url.status}</Table.Cell>
              <Table.Cell>
                <Link to={`/urls/${url.id}`} style={{ textDecoration: "none" }}>
                  <Button
                    size="sm"
                    mr={2}
                    colorScheme="teal"
                    variant="outline"
                  >
                    View Details
                  </Button>
                </Link>
                <Button size="sm" mr={2} onClick={() => onStart(url.id)}>
                  Start
                </Button>
                <Button size="sm" mr={2} onClick={() => onStop(url.id)}>
                  Stop
                </Button>
                <Button size="sm" mr={2} colorScheme="red" onClick={() => onDelete(url.id)}>
                  Delete
                </Button>
                <Button size="sm" onClick={() => onReanalyze(url.id)}>
                  Reanalyze
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  )
} 