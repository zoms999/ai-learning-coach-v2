'use client';

interface LoadingIndicatorProps {
  type?: 'dots' | 'spinner' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingIndicator({ 
  type = 'dots', 
  size = 'md',
  message = 'AI가 답변을 생성하고 있습니다...'
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const dotSizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  if (type === 'spinner') {
    return (
      <div className="flex items-center space-x-2">
        <div className={`${sizeClasses[size]} border-2 border-blue-600 border-t-transparent rounded-full animate-spin`} />
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className="flex items-center space-x-2">
        <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`} />
        {message && <span className="text-sm text-gray-600 animate-pulse">{message}</span>}
      </div>
    );
  }

  // Default: dots
  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-1">
        <div className={`${dotSizeClasses[size]} bg-blue-600 rounded-full animate-bounce`}></div>
        <div 
          className={`${dotSizeClasses[size]} bg-blue-600 rounded-full animate-bounce`}
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div 
          className={`${dotSizeClasses[size]} bg-blue-600 rounded-full animate-bounce`}
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
}

// 타이핑 인디케이터 컴포넌트
export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg max-w-fit">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div 
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div 
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
      <span className="text-xs text-gray-500">AI가 입력 중...</span>
    </div>
  );
}