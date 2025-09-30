"use client";

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  showSkeleton = true,
  className = '',
  priority = false,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      setHasError(true);
    }
  };

  if (hasError && !fallbackSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && showSkeleton && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse rounded ${className}`} />
      )}
      <Image
        {...props}
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
};

// Specialized component for logos
interface LogoImageProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
  size?: 'sm' | 'md' | 'lg';
}

export const LogoImage: React.FC<LogoImageProps> = ({
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const dimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 }
  };

  return (
    <OptimizedImage
      {...props}
      {...dimensions[size]}
      className={`${sizeClasses[size]} object-contain ${className}`}
      priority={true} // Logos should load with high priority
    />
  );
};

// Specialized component for avatars
interface AvatarImageProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallbackInitials?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  size = 'md',
  className = '',
  fallbackInitials,
  alt = 'Avatar',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const dimensions = {
    xs: { width: 24, height: 24 },
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 }
  };

  const [hasError, setHasError] = useState(false);

  if (hasError && fallbackInitials) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
        {fallbackInitials.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      {...props}
      {...dimensions[size]}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
    />
  );
};