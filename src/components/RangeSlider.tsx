
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  displayValue?: boolean;
  displayUnit?: string;
  className?: string;
}

const RangeSlider = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  displayValue = true,
  displayUnit = '',
  className
}: RangeSliderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const rangeRef = useRef<HTMLDivElement>(null);
  
  // Calculate percentage for styling
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Update progress bar width as value changes
  useEffect(() => {
    if (rangeRef.current) {
      rangeRef.current.style.setProperty('--range-progress', `${percentage}%`);
    }
  }, [percentage]);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {(label || displayValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <label className="text-sm font-medium text-muted-foreground">
              {label}
            </label>
          )}
          {displayValue && (
            <span className="text-sm bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">
              {value}{displayUnit}
            </span>
          )}
        </div>
      )}
      
      <div
        ref={rangeRef}
        className={cn(
          "relative h-6 w-full touch-none select-none rounded-lg",
          isDragging ? "cursor-grabbing" : "cursor-pointer"
        )}
      >
        {/* Track background */}
        <div className="absolute inset-0 h-1.5 top-1/2 -translate-y-1/2 rounded-full bg-secondary/40"></div>
        
        {/* Filled track */}
        <div 
          className="absolute h-1.5 top-1/2 -translate-y-1/2 left-0 rounded-full bg-primary transition-all duration-100"
          style={{ width: `${percentage}%` }}
        ></div>
        
        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-primary shadow-sm border border-primary/30",
            "transition-all duration-100",
            isDragging ? "scale-110 ring-2 ring-primary/20" : "scale-100",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          )}
          style={{ left: `${percentage}%` }}
          tabIndex={0}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-orientation="horizontal"
        ></div>
        
        {/* Native range input (invisible but handles interactions) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onBlur={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
};

export default RangeSlider;
