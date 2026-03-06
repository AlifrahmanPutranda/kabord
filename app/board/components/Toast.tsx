'use client';

interface Props {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: Props) {
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}
