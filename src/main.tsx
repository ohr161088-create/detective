import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReceiptDetectiveWeb } from './features/receipt-detective/ReceiptDetectiveWeb';
import './styles.css';

const rootElement = document.getElementById('root');

if (rootElement == null) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ReceiptDetectiveWeb />
  </React.StrictMode>,
);
