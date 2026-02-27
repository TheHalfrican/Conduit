import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("React Error Boundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-[var(--error-screen-bg)] p-8">
          <div className="max-w-lg bg-hub-surface shadow-win-outset rounded-none">
            <div className="bg-status-error text-white font-bold px-2 py-1 text-sm">
              Something went wrong
            </div>
            <div className="p-4">
              <pre className="text-xs text-hub-text bg-white shadow-win-field rounded-none p-4 overflow-auto max-h-64 whitespace-pre-wrap font-mono">
                {this.state.error?.message}
                {"\n\n"}
                {this.state.error?.stack}
              </pre>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-4 bg-win-button-face shadow-win-button rounded-none px-4 py-1.5 text-sm font-medium text-hub-text active:shadow-win-button-pressed"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
