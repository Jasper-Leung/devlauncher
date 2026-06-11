import React from 'react'
import { ToastMessage } from '../hooks/useToast'
import './Toast.css'

export function Toast({ message }: { message: ToastMessage; onClose?: () => void }) {
  return (
    <div className="toast-container">
      <div className={`toast ${message.type}`}>
        <div className="toast-message">{message.message}</div>
      </div>
    </div>
  )
}
