import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { ToggleButton } from '../components/ui/ToggleButton';

interface DebugResponse {
  timestamp: string;
  request: {
    query: string;
    model?: string;
    tools?: string[];
    options?: any;
  };
  response: {
    text?: string;
    json?: any;
    error?: string;
    tokenUsage?: {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    };
    toolExecutions?: any[];
  };
  duration: number;
}

export function DebugClaude() {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [query, setQuery] = useState('');
  const [model, setModel] = useState('claude-opus-4-20250514');
  const [enabledTools, setEnabledTools] = useState({
    search: false,
    read: false,
    write: false,
    bash: false,
  });
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<DebugResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'json' | 'tools'>('request');
  const [mockMode, setMockMode] = useState(() => {
    const saved = localStorage.getItem('mockMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Listen for mock mode changes
  useEffect(() => {
    const handleMockModeChange = (event: CustomEvent) => {
      setMockMode(event.detail);
    };

    window.addEventListener('mockModeChanged', handleMockModeChange as EventListener);
    return () => {
      window.removeEventListener('mockModeChanged', handleMockModeChange as EventListener);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    const startTime = Date.now();

    const tools = Object.entries(enabledTools)
      .filter(([_, enabled]) => enabled)
      .map(([tool]) => tool);

    const requestData = {
      query,
      model,
      tools,
      mockMode,
    };

    // Create initial response with request data
    const debugResponse: DebugResponse = {
      timestamp: new Date().toLocaleTimeString(),
      request: { query, model, tools, options: requestData },
      response: { text: 'Loading...', error: null },
      duration: 0,
    };

    // Add to responses immediately so user can see the request
    setResponses([debugResponse, ...responses]);
    setActiveTab('request'); // Show request tab immediately

    try {
      const response = await fetch('http://localhost:3000/api/claude/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update the response with actual data
      debugResponse.response = data;
      debugResponse.duration = Date.now() - startTime;
      
      // Update the responses array
      setResponses(current => [
        { ...debugResponse },
        ...current.slice(1)
      ]);
      
      // Switch to response tab if successful
      if (!data.error) {
        setActiveTab('response');
      }
      
      setQuery('');
    } catch (error) {
      console.error('Debug request failed:', error);
      
      // Update with error
      debugResponse.response = { 
        error: error instanceof Error 
          ? `${error.message}. Make sure the server is running on http://localhost:3000` 
          : 'Unknown error' 
      };
      debugResponse.duration = Date.now() - startTime;
      
      // Update the responses array
      setResponses(current => [
        { ...debugResponse },
        ...current.slice(1)
      ]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Query Form */}
      <div className={`${styles.cardBg} ${styles.cardBorder} ${styles.borderRadius} p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${styles.headingColor}`}>Claude Debug Interface</h2>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${mockMode ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
              {mockMode ? 'Mock Mode' : 'Live Mode'}
            </span>
            <div className={`w-2 h-2 rounded-full ${mockMode ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${styles.headingColor} mb-2`}>
              Query
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full px-4 py-3 ${styles.inputBg} ${styles.inputBorder} ${styles.inputText} ${styles.borderRadius} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              rows={4}
              placeholder="Enter your query for Claude..."
              disabled={loading}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${styles.headingColor} mb-2`}>
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`w-full px-4 py-2 ${styles.inputBg} ${styles.inputBorder} ${styles.inputText} ${styles.borderRadius} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={loading}
            >
              <option value="claude-opus-4-20250514">Claude 4 Opus</option>
              <option value="claude-sonnet-4-20250514">Claude 4 Sonnet</option>
              <option value="claude-3-7-opus-20241029">Claude 3.7 Opus</option>
              <option value="claude-3-7-sonnet-20241029">Claude 3.7 Sonnet</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${styles.headingColor} mb-2`}>
              Tools
            </label>
            <div className="flex gap-4">
              {Object.entries(enabledTools).map(([tool, enabled]) => (
                <ToggleButton
                  key={tool}
                  checked={enabled}
                  onChange={(checked) => setEnabledTools(prev => ({ ...prev, [tool]: checked }))}
                  label={tool}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !query.trim()}
            variant="primary"
            fullWidth
            size="lg"
          >
            {loading ? 'Sending...' : 'Send Query'}
          </Button>
        </form>
      </div>

      {/* Responses */}
      {responses.length > 0 && (
        <div className={`${styles.cardBg} ${styles.cardBorder} ${styles.borderRadius} p-6`}>
          <h3 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Responses</h3>
          
          <div className="space-y-4">
            {responses.map((response, index) => (
              <div 
                key={index} 
                className={`${styles.sidebarBg} ${styles.borderRadius} p-4 border ${styles.sidebarBorder} relative`}
              >
                {/* Remove button */}
                <IconButton
                  onClick={() => setResponses(responses.filter((_, i) => i !== index))}
                  variant="ghost"
                  size="sm"
                  aria-label="Remove response"
                  className="absolute top-2 right-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </IconButton>

                <div className="flex justify-between items-center mb-3 pr-8">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {response.timestamp} • {response.duration}ms
                  </span>
                  <div className="flex gap-2 items-center">
                    {response.duration === 0 && (
                      <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                        Loading...
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 ${styles.borderRadius} ${styles.primaryButton} ${styles.primaryButtonText}`}>
                      {response.request.model}
                    </span>
                  </div>
                </div>

                <div className={`text-sm text-gray-700 dark:text-gray-300 mb-3`}>
                  <span className="font-medium">Query:</span> {response.request.query}
                </div>

                {/* Response Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-3">
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setActiveTab('request')}
                      variant="ghost"
                      size="sm"
                      className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'request'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Request
                    </Button>
                    <Button
                      onClick={() => setActiveTab('response')}
                      variant="ghost"
                      size="sm"
                      className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'response'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Response
                    </Button>
                    {response.response.json && (
                      <Button
                        onClick={() => setActiveTab('json')}
                        variant="ghost"
                        size="sm"
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'json'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        JSON
                      </Button>
                    )}
                    {response.response.toolExecutions && (
                      <Button
                        onClick={() => setActiveTab('tools')}
                        variant="ghost"
                        size="sm"
                        className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'tools'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        Tools
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tab Content */}
                <div className={`${styles.inputBg} ${styles.borderRadius} p-3 max-h-64 overflow-auto`}>
                  {response.response.error ? (
                    <pre className="text-red-500 dark:text-red-400 text-sm whitespace-pre-wrap font-mono">
                      Error: {response.response.error}
                    </pre>
                  ) : (
                    <>
                      {activeTab === 'request' && (
                        <pre className={`text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono`}>
                          {JSON.stringify({
                            endpoint: 'http://localhost:3000/api/claude/debug',
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: {
                              query: response.request.query,
                              model: response.request.model,
                              tools: response.request.tools,
                              mockMode: response.request.options?.mockMode
                            }
                          }, null, 2)}
                        </pre>
                      )}
                      {activeTab === 'response' && (
                        <pre className={`text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono`}>
                          {JSON.stringify(response.response, null, 2)}
                        </pre>
                      )}
                      {activeTab === 'json' && response.response.json && (
                        <pre className={`text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono`}>
                          {JSON.stringify(response.response.json, null, 2)}
                        </pre>
                      )}
                      {activeTab === 'tools' && response.response.toolExecutions && (
                        <pre className={`text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono`}>
                          {JSON.stringify(response.response.toolExecutions, null, 2)}
                        </pre>
                      )}
                    </>
                  )}
                </div>

                {response.response.tokenUsage && (
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 flex gap-4">
                    <span>Input: {response.response.tokenUsage.inputTokens} tokens</span>
                    <span>Output: {response.response.tokenUsage.outputTokens} tokens</span>
                    <span>Total: {response.response.tokenUsage.totalTokens} tokens</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}