import { useEffect, useState } from 'react';
import { useNavigate } from '@ui-kit/router';
import { Button, Input, Modal, Spinner, Textarea } from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaces, type WorkspaceMetadata } from '../contexts/WorkspaceContext';
import { WorkspaceCard } from '../components/WorkspaceCard';
import styles from './Workspaces.module.css';

export function Workspaces() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    workspaces,
    isLoading,
    error,
    fetchWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspaces();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceMetadata | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Redirect if not authenticated (wait for auth to load first)
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  // Fetch workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormError(null);
    setSelectedWorkspace(null);
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      setFormError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await createWorkspace(formName.trim(), formDescription.trim());
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedWorkspace || !formName.trim()) {
      setFormError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await updateWorkspace(selectedWorkspace.id, {
        name: formName.trim(),
        description: formDescription.trim(),
      });

      if (!result) {
        throw new Error('Failed to update workspace');
      }

      setShowEditModal(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkspace) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const success = await deleteWorkspace(selectedWorkspace.id);

      if (!success) {
        throw new Error('Failed to delete workspace');
      }

      setShowDeleteModal(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (workspace: WorkspaceMetadata) => {
    setSelectedWorkspace(workspace);
    setFormName(workspace.name);
    setFormDescription(workspace.description);
    setFormError(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (workspace: WorkspaceMetadata) => {
    setSelectedWorkspace(workspace);
    setFormError(null);
    setShowDeleteModal(true);
  };

  if (!user) return null;

  return (
    <div className={styles.workspaces}>
      <div className={styles.container}>
        {/* Header */}
        <section className={styles.header}>
          <div>
            <h1>Workspaces</h1>
            <p className={styles.subtitle}>
              Organize your documents, notes, and projects
            </p>
          </div>
          <Button icon={<AddIcon />} onClick={() => setShowCreateModal(true)}>
            New Workspace
          </Button>
        </section>

        {/* Error State */}
        {error && (
          <div className={styles.errorBanner}>
            {error}
            <Button size="sm" variant="ghost" onClick={fetchWorkspaces}>
              Retry
            </Button>
          </div>
        )}

        {/* Workspaces List */}
        <section className={styles.section}>
          {isLoading ? (
            <div className={styles.loading}>
              <Spinner />
            </div>
          ) : workspaces.length === 0 ? (
            <EmptyState
              icon={<FolderIcon />}
              title="No workspaces yet"
              description="Create your first workspace to organize your documents"
              action={
                <Button icon={<AddIcon />} onClick={() => setShowCreateModal(true)}>
                  Create Workspace
                </Button>
              }
            />
          ) : (
            <div className={styles.workspaceGrid}>
              {workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onClick={() => navigate(`/workspace/${workspace.id}`)}
                  onEdit={() => openEditModal(workspace)}
                  onDelete={() => openDeleteModal(workspace)}
                  showActions={workspace.ownerId === user.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }}>
        <div className={styles.modalContent}>
          <h2>Create Workspace</h2>
          <div className={styles.formFields}>
            <div className={styles.field}>
              <label htmlFor="create-name">Name</label>
              <Input
                id="create-name"
                placeholder="My Workspace"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="create-description">Description (optional)</label>
              <Textarea
                id="create-description"
                placeholder="A brief description of this workspace"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          {formError && <p className={styles.formError}>{formError}</p>}
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!formName.trim() || isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }}>
        <div className={styles.modalContent}>
          <h2>Edit Workspace</h2>
          <div className={styles.formFields}>
            <div className={styles.field}>
              <label htmlFor="edit-name">Name</label>
              <Input
                id="edit-name"
                placeholder="My Workspace"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="edit-description">Description (optional)</label>
              <Textarea
                id="edit-description"
                placeholder="A brief description of this workspace"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          {formError && <p className={styles.formError}>{formError}</p>}
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => { setShowEditModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEdit}
              disabled={!formName.trim() || isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); resetForm(); }}>
        <div className={styles.modalContent}>
          <h2>Delete Workspace</h2>
          <p className={styles.deleteWarning}>
            Are you sure you want to delete <strong>{selectedWorkspace?.name}</strong>?
            This action cannot be undone.
          </p>
          {formError && <p className={styles.formError}>{formError}</p>}
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>{icon}</div>
      <h3 className={styles.emptyStateTitle}>{title}</h3>
      <p className={styles.emptyStateDescription}>{description}</p>
      {action && <div className={styles.emptyStateAction}>{action}</div>}
    </div>
  );
}
