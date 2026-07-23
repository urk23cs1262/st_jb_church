import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Prevent Google Translate DOM mutation crashes in React
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      if (console) console.warn('GoogleTranslate: Node.removeChild parent mismatch handled', child);
      return child;
    }
    try {
      return originalRemoveChild.apply(this, arguments);
    } catch (err) {
      if (console) console.warn('GoogleTranslate: Node.removeChild error caught', err);
      return child;
    }
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) console.warn('GoogleTranslate: Node.insertBefore parent mismatch handled', referenceNode);
      return newNode;
    }
    try {
      return originalInsertBefore.apply(this, arguments);
    } catch (err) {
      if (console) console.warn('GoogleTranslate: Node.insertBefore error caught', err);
      return newNode;
    }
  };
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 max-w-md space-y-4">
            <h2 className="text-xl font-bold text-church-royal-blue">Page View Restored</h2>
            <p className="text-xs text-gray-600">The translation view updated. Tap below to reload the page view cleanly.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="btn-gold px-6 py-3 text-xs font-bold w-full rounded-xl"
            >
              Reload Page View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
