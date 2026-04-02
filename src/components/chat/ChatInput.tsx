/**
 * Chat Input Component
 *
 * Message input area with send button and image attachment.
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff, ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string, image?: File) => void;
  isDisabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({
  onSend,
  isDisabled = false,
  placeholder = 'Type a message...',
  maxLength = 500,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        // TODO: Show error toast
        console.error('Image must be smaller than 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    if ((message.trim() || selectedImage) && !isDisabled) {
      onSend(message.trim(), selectedImage || undefined);
      setMessage('');
      clearImage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording with Web Speech API
  };

  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars < 50;

  const canSend = (message.trim() || selectedImage) && !isDisabled;

  return (
    <div className="flex flex-col gap-2">
      {/* Image preview - hidden for now
      {imagePreview && (
        <div className="relative inline-block w-20 h-20">
          <img
            src={imagePreview}
            alt="Selected"
            className="w-full h-full rounded-lg object-cover border"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      */}

      <div className="flex items-end gap-2 rounded-2xl border bg-card p-2">
        {/* Hidden file input - hidden for now
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageSelect}
          className="hidden"
        />
        */}

        {/* Image attachment button - hidden for now
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className="shrink-0"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
        */}

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0"
          rows={1}
        />

        <div className="flex gap-1">
          {/* Voice recording button - hidden for now
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleRecording}
            disabled={isDisabled}
            className={cn(
              'shrink-0',
              isRecording && 'text-destructive'
            )}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          */}

          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isNearLimit && (
        <span className={cn(
          'text-caption text-right',
          remainingChars < 20 ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {remainingChars} characters remaining
        </span>
      )}
    </div>
  );
}
