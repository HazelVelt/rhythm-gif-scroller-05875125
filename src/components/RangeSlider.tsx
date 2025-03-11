
import React from 'react';
import { Slider } from '@/components/ui/slider';

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
  displayUnit?: string;
  displayValue?: number;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  label,
  displayUnit = '',
  displayValue
}) => {
  // Handle slider change
  const handleSliderChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  // Format the value for display
  const formattedValue = typeof displayValue === 'number' 
    ? displayValue 
    : value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-medium">
          {formattedValue}{displayUnit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={handleSliderChange}
        className="cursor-pointer"
      />
    </div>
  );
};

export default RangeSlider;
