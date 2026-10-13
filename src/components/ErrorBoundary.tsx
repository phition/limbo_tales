import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('💥 [ErrorBoundary caught fatal error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (_) {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#070a12',
          color: '#ff5252',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
          fontFamily: 'monospace',
          zIndex: 999999,
          overflowY: 'auto'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#121824',
            border: '2px solid #ff525266',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 0 40px rgba(255, 82, 82, 0.2)'
          }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#ff5252', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              <span>게임 실행 중 예기치 못한 오류 발생</span>
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#cfd8e8', lineHeight: '1.5' }}>
              브라우저 환경(CORS/서드파티 쿠키 차단 등) 또는 컴포넌트 렌더링 중 오류가 발생했습니다.
            </p>
            <div style={{
              backgroundColor: '#070a12',
              border: '1px solid #ff525233',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '11px',
              color: '#ff8a80',
              overflowX: 'auto',
              maxHeight: '180px',
              whiteSpace: 'pre-wrap',
              marginBottom: '16px'
            }}>
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#00d2ff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🔄 새로고침
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#37474f',
                  color: '#fff',
                  border: '1px solid #546e7a',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🧹 저장 데이터 초기화 후 재시작
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
