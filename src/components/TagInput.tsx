
import { useState, useEffect, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
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
    <div className={`glass rounded-lg p-2 ${className}`}>
      <div className="flex flex-wrap gap-2 p-1">
        {value.map((tag, index) => (
          <Badge 
            key={`${tag}-${index}`}
            variant="secondary"
            className="bg-accent text-accent-foreground animate-fade-in flex items-center gap-1 pl-3 pr-2"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 rounded-full hover:bg-secondary/80 p-0.5 focus:outline-none focus:ring-1 focus:ring-primary/20"
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
              className="flex items-center justify-center rounded-full hover:bg-secondary/40 p-1 
                         transition-colors duration-200 ml-1 focus:outline-none focus:ring-1 focus:ring-primary/20"
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
