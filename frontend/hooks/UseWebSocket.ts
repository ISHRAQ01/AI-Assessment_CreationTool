import { useEffect, useState, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  assignmentId: string;
  questionPaperId?: string;
  status: string;
  error?: string;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  lastMessage: WebSocketMessage | null;
  isConnected: boolean;
  sendMessage: (data: any) => void;
  reconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setSocket(ws);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data);
          setLastMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
      ws.onclose = (event) => {
        console.log(`WebSocket disconnected (code: ${event.code})`);
        setIsConnected(false);
        setSocket(null);
        
        // Auto-reconnect after 3 seconds (unless closed intentionally)
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
    }
  }, [wsUrl]);

  const sendMessage = useCallback((data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    if (socket) {
      socket.close();
    }
    connect();
  }, [socket, connect]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  return { socket, lastMessage, isConnected, sendMessage, reconnect };
}