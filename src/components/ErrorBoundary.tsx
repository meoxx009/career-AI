import React, { Component, type ReactNode } from 'react';
import { ErrorState, PrimaryButton } from './DesignSystem';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      const rawMessage = this.state.error?.message || '';
      const isSafeMessage =
        Boolean(rawMessage) &&
        !rawMessage.includes('http') &&
        !rawMessage.includes('key') &&
        !rawMessage.includes('token') &&
        rawMessage.length < 150;
      const displayMessage = isSafeMessage
        ? rawMessage
        : 'An unexpected rendering error occurred while loading this view. Your drafts are preserved.';

      return (
        <div style={{ padding: '40px 16px', maxWidth: '600px', margin: '0 auto' }}>
          <ErrorState
            title="Something didn't load right"
            message={displayMessage}
            action={
              <PrimaryButton onClick={this.handleReset}>
                Reload application
              </PrimaryButton>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
