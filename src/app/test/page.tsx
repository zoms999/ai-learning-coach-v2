'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<{status?: number; data?: unknown; error?: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: {
            learningGoal: '웹 개발자가 되어 취업하고 싶습니다',
            interests: 'React, Node.js, TypeScript',
            currentConcerns: '프로그래밍을 배우고 있지만 어떤 순서로 공부해야 할지 모르겠고, 실무에서 필요한 기술들이 무엇인지 궁금합니다.'
          }
        })
      });

      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API 테스트 페이지</h1>
      
      <button
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'API 호출 중...' : 'API 테스트'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">결과:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}