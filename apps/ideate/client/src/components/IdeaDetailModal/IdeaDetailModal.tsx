import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@ui-kit/router';
import { Modal, Button, Input, Textarea, Select, Spinner, Chip } from '@ui-kit/react';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { TrashIcon } from '@ui-kit/icons/TrashIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { useIdeas } from '../../contexts/IdeasContext';
import type { IdeaStatus } from '../../types/idea';
import styles from './IdeaDetailModal.module.css';

interface IdeaDetailModalProps {
  ideaId: string | null;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'exploring', label: 'Exploring' },
  { value: 'executing', label: 'Executing' },
  { value: 'archived', label: 'Archived' },
];

const RATING_OPTIONS = [
  { value: '1', label: '1 - Low' },
  { value: '2', label: '2 - Medium' },
  { value: '3', label: '3 - High' },
  { value: '4', label: '4 - Critical' },
];

export function IdeaDetailModal({ ideaId, onClose }: IdeaDetailModalProps) {
  const navigate = useNavigate();
  const { ideas, updateIdea, deleteIdea, moveIdea, updateRating } = useIdeas();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<IdeaStatus>('new');
  const [rating, setRating] = useState<1 | 2 | 3 | 4>(2);
  const [tags, setTags] = useState('');

  const idea = ideas.find(i => i.id === ideaId);

  // Sync form state with idea
  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setSummary(idea.summary);
      setStatus(idea.status);
      setRating(idea.rating);
      setTags(idea.tags.join(', '));
    }
  }, [idea]);

  const handleSave = useCallback(async () => {
    if (!idea) return;

    setIsLoading(true);
    try {
      const tagList = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Handle status change
      if (status !== idea.status) {
        await moveIdea(idea.id, status);
      }

      // Handle rating change
      if (rating !== idea.rating) {
        await updateRating(idea.id, rating);
      }

      // Handle other updates
      if (title !== idea.title || summary !== idea.summary ||
          JSON.stringify(tagList) !== JSON.stringify(idea.tags)) {
        await updateIdea(idea.id, {
          title: title.trim(),
          summary: summary.trim(),
          tags: tagList,
        });
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update idea:', error);
    } finally {
      setIsLoading(false);
    }
  }, [idea, title, summary, status, rating, tags, moveIdea, updateRating, updateIdea]);

  const handleDelete = useCallback(async () => {
    if (!idea) return;

    setIsDeleting(true);
    try {
      await deleteIdea(idea.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete idea:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [idea, deleteIdea, onClose]);

  const handleOpenChat = useCallback(() => {
    if (idea?.execution?.chatRoomId) {
      navigate(`/chat/${idea.execution.chatRoomId}`);
      onClose();
    }
  }, [idea, navigate, onClose]);

  const handleCancel = useCallback(() => {
    if (idea) {
      setTitle(idea.title);
      setSummary(idea.summary);
      setStatus(idea.status);
      setRating(idea.rating);
      setTags(idea.tags.join(', '));
    }
    setIsEditing(false);
  }, [idea]);

  if (!ideaId) return null;

  return (
    <Modal open={!!ideaId} onClose={onClose} size="md">
      <div className={styles.modal}>
        {!idea ? (
          <div className={styles.loading}>
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.badges}>
                  {idea.source === 'ai' && (
                    <Chip variant="info">AI Generated</Chip>
                  )}
                  <Chip variant="default">{idea.status}</Chip>
                </div>
                <div className={styles.actions}>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      icon={<EditIcon />}
                      onClick={() => setIsEditing(true)}
                      aria-label="Edit"
                    />
                  )}
                  <Button
                    variant="ghost"
                    icon={<TrashIcon />}
                    onClick={handleDelete}
                    disabled={isDeleting}
                    aria-label="Delete"
                  />
                </div>
              </div>
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.titleInput}
                  disabled={isLoading}
                />
              ) : (
                <h2 className={styles.title}>{idea.title}</h2>
              )}
            </header>

            <div className={styles.body}>
              {/* Summary */}
              <div className={styles.section}>
                <label className={styles.label}>Summary</label>
                {isEditing ? (
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={4}
                    disabled={isLoading}
                  />
                ) : (
                  <p className={styles.summary}>{idea.summary}</p>
                )}
              </div>

              {/* Status & Rating */}
              {isEditing && (
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Status</label>
                    <Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as IdeaStatus)}
                      options={STATUS_OPTIONS}
                      disabled={isLoading}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Rating</label>
                    <Select
                      value={String(rating)}
                      onChange={(e) => setRating(Number(e.target.value) as 1 | 2 | 3 | 4)}
                      options={RATING_OPTIONS}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className={styles.section}>
                <label className={styles.label}>Tags</label>
                {isEditing ? (
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="tag1, tag2, ..."
                    disabled={isLoading}
                  />
                ) : (
                  <div className={styles.tags}>
                    {idea.tags.map((tag, index) => (
                      <Chip key={index} variant="default">{tag}</Chip>
                    ))}
                    {idea.tags.length === 0 && (
                      <span className={styles.noTags}>No tags</span>
                    )}
                  </div>
                )}
              </div>

              {/* Rating display (view mode) */}
              {!isEditing && (
                <div className={styles.section}>
                  <label className={styles.label}>Rating</label>
                  <div className={styles.ratingDots}>
                    {[1, 2, 3, 4].map((dot) => (
                      <span
                        key={dot}
                        className={`${styles.dot} ${dot <= idea.rating ? styles.filled : ''}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Status */}
              {idea.status === 'executing' && idea.execution && (
                <div className={styles.section}>
                  <label className={styles.label}>Execution Progress</label>
                  <div className={styles.execution}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${idea.execution.progressPercent}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {idea.execution.progressPercent}%
                    </span>
                    {idea.execution.waitingForFeedback && (
                      <Chip variant="warning">Waiting for feedback</Chip>
                    )}
                  </div>
                  {idea.execution.chatRoomId && (
                    <Button
                      variant="outline"
                      icon={<ChatIcon />}
                      onClick={handleOpenChat}
                      className={styles.chatButton}
                    >
                      Open Chat Room
                    </Button>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className={styles.metadata}>
                <span>Created: {new Date(idea.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(idea.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <footer className={styles.footer}>
              {isEditing ? (
                <>
                  <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={isLoading}>
                    {isLoading ? <Spinner size="sm" /> : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
              )}
            </footer>
          </>
        )}
      </div>
    </Modal>
  );
}
