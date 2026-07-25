import { Component, type ReactNode } from 'react'

interface WorldBoundaryProps {
  children: ReactNode
  fallback: ReactNode
  onError?: (error: Error) => void
}

interface WorldBoundaryState {
  hasError: boolean
}

export class WorldBoundary extends Component<WorldBoundaryProps, WorldBoundaryState> {
  state: WorldBoundaryState = { hasError: false }

  static getDerivedStateFromError(): WorldBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error)
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
