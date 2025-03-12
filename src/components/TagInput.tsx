
import { useState, useEffect, KeyboardEvent } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  autoFocus?: boolean;
}

const TagInput = ({
  value = [],
  onChange,
  placeholder = 'Add tag...',
  maxTags = 10,
  className = '',
  autoFocus = false
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState<string>('');
  
  const handleAddTag = () => {
    if (!inputValue.trim() || value.length >= maxTags) return;
    
    const newTag = inputValue.trim().toLowerCase();
    
    if (!value.includes(newTag)) {
      const newTags = [...value, newTag];
      onChange(newTags);
    }
    
    setInputValue('');
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue) {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      const newTags = [...value];
      newTags.pop();
      onChange(newTags);
    }
  };
  
  const removeTag = (index: number) => {
    const newTags = [...value];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  return (
    <div className={`bg-gray-100 dark:bg-gray-800 rounded-md p-1.5 ${className}`}>
      <div className="flex flex-wrap gap-1.5 p-1">
        {value.map((tag, index) => (
          <Badge 
            key={`${tag}-${index}`}
            variant="secondary"
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center gap-1 pl-2 pr-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 p-0.5 focus:outline-none"
              aria-label={`Remove ${tag} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        <div className="flex-1 flex items-center min-w-[120px]">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleAddTag}
            placeholder={value.length < maxTags ? placeholder : ''}
            disabled={value.length >= maxTags}
            className="border-none bg-transparent px-1 py-1 text-sm focus:ring-0 focus-visible:ring-0 w-full"
            autoFocus={autoFocus}
          />
          
          {inputValue && (
            <button
              type="button"
              onClick={handleAddTag}
              className="flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-1 
                         transition-colors duration-200 ml-1 focus:outline-none"
              aria-label="Add tag"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagInput;
