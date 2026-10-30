import { Component } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { BenchDataProvider } from './hooks/BenchDataProvider.jsx';
import { ThemeProvider } from './hooks/ThemeProvider.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';

class ApplicationErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-error">
          <h1>BenchFlow could not start</h1>
          <p>{this.state.error.message}</p>
          <p>
            Clear the saved <code>bench-flow:</code> browser data and reload to restore the demo
            workspace.
          </p>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <ApplicationErrorBoundary>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <BenchDataProvider>
            <AppRoutes />
          </BenchDataProvider>
        </BrowserRouter>
      </ApplicationErrorBoundary>
    </ThemeProvider>
  );
}
