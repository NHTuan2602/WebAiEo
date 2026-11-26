import { Component } from 'react';
import ServerMaintenanceOverlay from './ServerMaintenanceOverlay';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[AppErrorBoundary] Unhandled React error:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ServerMaintenanceOverlay
          mode="crash"
          isCrash={true}
          onRetry={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
        />
      );
    }
    return this.props.children;
  }
}
