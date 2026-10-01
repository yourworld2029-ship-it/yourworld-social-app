import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/video/$videoId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/video/$videoId"!</div>
}
