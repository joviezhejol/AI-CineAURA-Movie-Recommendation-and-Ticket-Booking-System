import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  joinShowRoom: (showId: string) => void;
  leaveShowRoom: (showId: string) => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  joinShowRoom: () => {},
  leaveShowRoom: () => {},
  isConnected: false
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Connect to backend via current host or port 5005
    const newSocket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinShowRoom = (showId: string) => {
    if (socket && showId) {
      socket.emit('join_show', showId);
    }
  };

  const leaveShowRoom = (showId: string) => {
    if (socket && showId) {
      socket.emit('leave_show', showId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        joinShowRoom,
        leaveShowRoom,
        isConnected
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
