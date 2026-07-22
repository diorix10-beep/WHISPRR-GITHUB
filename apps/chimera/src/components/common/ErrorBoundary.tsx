import { Component, type ReactNode } from 'react';
import { RefreshCw, RotateCcw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log technical error details silently to background monitoring
    console.error('[Production Error Boundary Catch]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-md w-full text-center bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-3xl p-8 shadow-xl space-y-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-warm-900 dark:text-warm-50">
                Something went wrong
              </h1>
              <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
                We could not load this section properly. Please try again or return to the home workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} /> Try Again
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 py-2.5 px-3 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-750 text-warm-900 dark:text-warm-100 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} /> Refresh Page
                </button>

                <button
                  onClick={() => { window.location.href = '/'; }}
                  className="flex-1 py-2.5 px-3 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-750 text-warm-900 dark:text-warm-100 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Home size={14} /> Return Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
