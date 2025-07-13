import Whiteboard from './components/Whiteboard.tsx'
import React from 'react';
import './App.css'
import Toolbar from './components/Toolbar.tsx'
import WebSocketProvider from './services/WebSocketProvider.tsx';


function App() {
  return (
    <>
    <React.StrictMode>
      <WebSocketProvider>
        <Toolbar/>
        <Whiteboard/>
      </WebSocketProvider>
    </React.StrictMode>
    </>
  )
}

export default App
