import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
        try {
            localStorage.setItem('LAST_APP_ERROR', JSON.stringify({
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack
            }));
        } catch (e) {
            // ignore
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', background: '#ffebee', color: '#c62828', height: '100vh', overflow: 'auto' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '1rem' }}>Application Crashed</h1>
                    <p style={{ fontWeight: 'bold' }}>Error: {this.state.error?.message}</p>
                    <hr style={{ margin: '1rem 0' }} />
                    <h3>Component Stack:</h3>
                    <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.5)', padding: '1rem' }}>
                        {this.state.errorInfo?.componentStack}
                    </pre>
                    <hr style={{ margin: '1rem 0' }} />
                    <h3>Error Stack:</h3>
                    <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.5)', padding: '1rem' }}>
                        {this.state.error?.stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}
