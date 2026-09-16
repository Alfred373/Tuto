'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './question-composer.module.css';
import { submitQuestionAction } from '@/features/solve/actions';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for client upload

interface QuestionComposerProps {
  onSubmit?: (text: string, image: File | null, subject: string | null) => void;
}

export function QuestionComposer({ onSubmit }: QuestionComposerProps) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Processing...');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg('File is too large. Max allowed size is 5MB.');
      return;
    }
    
    setImage(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
          break;
        }
      }
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() && !image) {
      setErrorMsg('Please type a question or upload an image of your handwritten notes.');
      return;
    }

    if (onSubmit) {
      onSubmit(text.trim(), image, selectedSubject);
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setProcessingStatus(image ? 'Reading handwritten notes with Gemini...' : 'Analyzing question...');

    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (image) formData.append('image', image);
      if (selectedSubject) formData.append('subject', selectedSubject);

      const result = await submitQuestionAction(formData);

      if (result.ok) {
        setProcessingStatus('Generating step-by-step solution with DeepSeek...');
        router.push(`/solve/${result.submissionId}`);
      } else {
        setErrorMsg(result.error);
        setIsProcessing(false);
      }
    } catch {
      setErrorMsg('An unexpected error occurred while processing. Please try again.');
      setIsProcessing(false);
    }
  };

  const subjects = [
    { id: 'math', label: 'Math', icon: <MathIcon /> },
    { id: 'calculus', label: 'Calculus', icon: <CalculusIcon /> },
    { id: 'chemistry', label: 'Chemistry', icon: <ChemistryIcon /> },
    { id: 'biology', label: 'Biology', icon: <BiologyIcon /> },
    { id: 'business', label: 'Business', icon: <BusinessIcon /> },
    { id: 'social', label: 'Social Science', icon: <SocialIcon /> },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.composerShell} onPaste={handlePaste}>
        {/* Text Input Row */}
        <form onSubmit={handleSubmit} className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.textInput}
            placeholder="Type or upload your question"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isProcessing}
          />
          <div className={styles.divider}></div>
          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={(!text.trim() && !image) || isProcessing}
            aria-label="Submit Question"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </form>

        {errorMsg && (
          <div className={styles.errorMessage}>{errorMsg}</div>
        )}

        {isProcessing ? (
          <div className={styles.processingCard}>
            <div className={styles.spinner}></div>
            <p className={styles.processingTitle}>AI Tutor is at work</p>
            <p className={styles.processingSubtitle}>{processingStatus}</p>
          </div>
        ) : (
          <>
            {/* Dropzone */}
            <div 
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''} ${image ? styles.dropzoneImagePreview : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !image && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/jpeg, image/png, image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    if (file) handleFile(file);
                  }
                }}
              />

              {image && previewUrl ? (
                <>
                  <img src={previewUrl} alt="Question preview" className={styles.previewImage} />
                  <button 
                    type="button"
                    className={styles.removeImageBtn} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    aria-label="Remove image"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.iconWrapper}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                      <path d="M12 2v4m0 0v4m0-4h4m-4 0H8" stroke="currentColor" />
                    </svg>
                  </div>
                  <p className={styles.dropzoneText}>
                    Drag Image or <strong>Click Here</strong> to upload handwritten notes
                  </p>
                  <p className={styles.shortcutText}>
                    Command <span className={styles.keyBadge}>⌘</span> + <span className={styles.keyBadge}>V</span> to paste
                  </p>
                </>
              )}
            </div>

            {/* Subjects Row */}
            <div className={styles.subjectRow}>
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  className={`${styles.subjectBtn} ${selectedSubject === sub.id ? styles.subjectBtnActive : ''}`}
                  onClick={() => setSelectedSubject(selectedSubject === sub.id ? null : sub.id)}
                >
                  <div className={styles.subjectIcon}>
                    {sub.icon}
                  </div>
                  <span className={styles.subjectLabel}>{sub.label}</span>
                </button>
              ))}
              <button type="button" className={styles.moreBtn}>
                MORE &gt;
              </button>
            </div>

            {/* Prominent Action Button */}
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.processBtn}
                onClick={() => handleSubmit()}
                disabled={(!text.trim() && !image) || isProcessing}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Start Processing
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Icons
function MathIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8l16 0" />
      <path d="M12 4l0 16" />
      <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
    </svg>
  );
}

function CalculusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9c0-4.97-4.03-9-9-9" />
      <path d="M3 12h18" />
      <path d="M12 3v18" />
    </svg>
  );
}

function ChemistryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6" />
      <path d="M10 3v5c0 1.5-.5 2-1.5 3l-2.5 3c-1.5 1.5-1.5 3 0 4h12c1.5-1 1.5-2.5 0-4l-2.5-3c-1-1-1.5-1.5-1.5-3V3" />
      <path d="M14 14h-4" />
    </svg>
  );
}

function BiologyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M12 12c3-3 6-3 8-1" />
      <path d="M12 12c-3-3-6-3-8-1" />
      <path d="M12 16c3-3 6-3 8-1" />
      <path d="M12 16c-3-3-6-3-8-1" />
    </svg>
  );
}

function BusinessIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

function SocialIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M18 21v-2a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v2" />
    </svg>
  );
}
