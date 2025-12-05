"use client";

import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
};

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4
}) => {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLoader key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLoader
              key={`cell-${rowIndex}-${colIndex}`}
              className={`h-4 ${colIndex === 0 ? 'flex-1' : 'w-20'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

interface SkeletonCardProps {
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3 }) => {
  return (
    <div className="bg-white rounded-lg p-6 space-y-3">
      <SkeletonLoader className="h-6 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader key={i} className={`h-4 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  );
};

interface SkeletonStatsProps {
  count?: number;
}

export const SkeletonStats: React.FC<SkeletonStatsProps> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <SkeletonLoader className="h-4 w-20" />
              <SkeletonLoader className="h-8 w-16" />
            </div>
            <SkeletonLoader className="h-12 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};