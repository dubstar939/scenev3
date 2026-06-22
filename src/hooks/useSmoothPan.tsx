import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

interface SmoothPanProps {
  center: [number, number];
  zoom?: number;
  duration?: number;
  easing?: 'easeOutCubic' | 'linear' | 'easeInOut';
}

/**
 * Easing functions for smooth animations
 */
const easings = {
  linear: (t: number) => t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
};

/**
 * Hook for smooth map camera transitions with inertial panning
 */
const useSmoothPan = ({ center, zoom, duration = 1000, easing = 'easeOutCubic' }: SmoothPanProps) => {
  const map = useMap();
  const animationRef = useRef<number | null>(null);
  const startRef = useRef<{ time: number; start: [number, number] } | null>(null);

  useEffect(() => {
    if (!map) return;

    const startPoint = map.getCenter();
    const startLat = startPoint.lat;
    const startLng = startPoint.lng;
    const endLat = center[0];
    const endLng = center[1];

    const deltaLat = endLat - startLat;
    const deltaLng = endLng - startLng;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easings[easing](progress);

      const currentLat = startLat + deltaLat * easedProgress;
      const currentLng = startLng + deltaLng * easedProgress;

      map.setView([currentLat, currentLng], zoom || map.getZoom(), {
        animate: false,
        duration: 0,
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure final position is exact
        map.setView(center, zoom || map.getZoom(), {
          animate: false,
        });
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [center, zoom, duration, easing, map]);

  return null;
};

/**
 * Component wrapper for smooth panning functionality
 */
const SmoothPanComponent: React.FC<SmoothPanProps> = ({ center, zoom, duration, easing }) => {
  useSmoothPan({ center, zoom, duration, easing });
  return null;
};

export default SmoothPanComponent;
