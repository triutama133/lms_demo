"use client";

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'gray' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Memuat...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-slate-500 ${className}`}>
      <LoadingSpinner size="lg" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText = 'Memproses...',
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {loading && <LoadingSpinner size="sm" color="white" className="mr-2" />}
      {loading ? loadingText : children}
    </button>
  );
};