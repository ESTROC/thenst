"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
          <div className="mb-6 rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            We encountered an unexpected error. This has been logged, and we're working to fix it.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={this.handleReset} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 max-w-2xl overflow-auto rounded-lg bg-muted p-4 text-left font-mono text-xs text-muted-foreground">
              <p className="mb-2 font-bold text-destructive">Error Details (Dev Only):</p>
              {this.state.error?.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
