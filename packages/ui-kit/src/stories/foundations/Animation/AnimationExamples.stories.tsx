import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import './AnimationExamples.stories.css';

const meta: Meta = {
  title: 'Foundations/Animation/Examples',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Real-world examples of animation patterns using our design system tokens.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Loading States Example
const LoadingStatesDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="loading-states-demo">
      <h3>Loading States</h3>
      <div className="loading-examples">
        <div className="loading-example">
          <h4>Skeleton Screen</h4>
          <div className="skeleton-card">
            <div className="skeleton-avatar pulse" />
            <div className="skeleton-content">
              <div className="skeleton-line pulse" style={{ width: '80%' }} />
              <div className="skeleton-line pulse" style={{ width: '60%' }} />
              <div className="skeleton-line pulse" style={{ width: '70%' }} />
            </div>
          </div>
        </div>

        <div className="loading-example">
          <h4>Spinner</h4>
          <div className="spinner-container">
            <div className="spinner" />
            <p>Loading content...</p>
          </div>
        </div>

        <div className="loading-example">
          <h4>Progress Bar</h4>
          <button onClick={simulateLoading} disabled={loading} className="trigger-button">
            {loading ? 'Loading...' : 'Start Loading'}
          </button>
          <div className="progress-bar">
            <div className={`progress-fill ${loading ? 'loading' : ''}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Micro-interactions Example
const MicroInteractionsDemo: React.FC = () => {
  const [liked, setLiked] = useState(false);
  const [savedItems, setSavedItems] = useState<number[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (id: number) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSave = (id: number) => {
    setSavedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="micro-interactions-demo">
      <h3>Micro-interactions</h3>
      <div className="micro-examples">
        <div className="micro-example">
          <h4>Like Button</h4>
          <button 
            className={`like-button ${liked ? 'liked' : ''}`}
            onClick={() => setLiked(!liked)}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <svg viewBox="0 0 24 24" className="like-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="like-burst" />
          </button>
        </div>

        <div className="micro-example">
          <h4>Save Animation</h4>
          <div className="save-items">
            {[1, 2, 3].map(id => (
              <button
                key={id}
                className={`save-button ${savedItems.includes(id) ? 'saved' : ''}`}
                onClick={() => toggleSave(id)}
              >
                <svg viewBox="0 0 24 24" className="save-icon">
                  <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
                <span>Save</span>
              </button>
            ))}
          </div>
        </div>

        <div className="micro-example">
          <h4>Copy Feedback</h4>
          <div className="copy-items">
            {[1, 2, 3].map(id => (
              <button
                key={id}
                className="copy-button"
                onClick={() => handleCopy(id)}
              >
                <span className={`copy-text ${copiedId === id ? 'copied' : ''}`}>
                  {copiedId === id ? 'Copied!' : 'Copy to clipboard'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Page Transitions Example
const PageTransitionsDemo: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [previousPage, setPreviousPage] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [useForwardAnimation, setUseForwardAnimation] = useState(true);
  const pages = ['Home', 'About', 'Services', 'Contact'];

  // Track navigation history for browser back/forward
  useEffect(() => {
    // Push initial state
    window.history.replaceState({ page: currentPage }, '', `#page-${currentPage}`);

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.page === 'number') {
        const newPage = event.state.page;
        setPreviousPage(currentPage);
        setIsTransitioning(true);
        setCurrentPage(newPage);
        
        // Reset transitioning state after animation completes
        setTimeout(() => {
          setIsTransitioning(false);
          setPreviousPage(-1);
        }, 500); // duration-slow10 (400ms) + buffer
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage]);

  const navigateToPage = (index: number) => {
    if (index === currentPage || isTransitioning) return;

    setPreviousPage(currentPage);
    setIsTransitioning(true);
    setCurrentPage(index);
    
    // Push to browser history
    window.history.pushState({ page: index }, '', `#page-${index}`);

    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
      setPreviousPage(-1);
    }, 500); // duration-slow10 (400ms) + buffer
  };

  // Mock content for each page
  const pageContent = {
    Home: {
      subtitle: 'Welcome to our animated experience',
      items: ['Explore our features', 'Learn about animations', 'Discover smooth transitions']
    },
    About: {
      subtitle: 'Crafting beautiful user experiences',
      items: ['Founded in 2024', 'Design-focused team', 'Innovation at heart']
    },
    Services: {
      subtitle: 'What we offer',
      items: ['UI/UX Design', 'Animation Systems', 'Component Libraries']
    },
    Contact: {
      subtitle: 'Get in touch',
      items: ['hello@example.com', '+1 (555) 123-4567', 'San Francisco, CA']
    }
  };

  return (
    <div className="page-transitions-demo">
      <h3>Page Transitions</h3>
      <div className="demo-controls">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={useForwardAnimation}
            onChange={(e) => setUseForwardAnimation(e.target.checked)}
            className="toggle-input"
          />
          <span>Forward animation (checked = right-to-left, unchecked = left-to-right)</span>
        </label>
      </div>
      <p className="demo-description">
        {useForwardAnimation 
          ? 'Forward: New content enters from RIGHT → Old content exits to LEFT'
          : 'Backward: New content enters from LEFT → Old content exits to RIGHT'}
      </p>
      
      <div className="page-nav">
        {pages.map((page, index) => (
          <button
            key={page}
            className={`nav-button ${currentPage === index ? 'active' : ''}`}
            onClick={() => navigateToPage(index)}
            disabled={isTransitioning}
          >
            {page}
          </button>
        ))}
      </div>
      
      <div className="page-container">
        {pages.map((page, index) => {
          const content = pageContent[page as keyof typeof pageContent];
          const isActive = currentPage === index;
          const isExiting = previousPage === index && isTransitioning;
          
          // Determine classes for this page
          let pageClasses = 'page-content';
          
          if (isActive) {
            pageClasses += ' active';
            if (isTransitioning) {
              // This is the entering page
              pageClasses += useForwardAnimation ? ' entering-from-right' : ' entering-from-left';
            }
          } else if (isExiting) {
            // This page is exiting
            pageClasses += ' exiting';
            pageClasses += useForwardAnimation ? ' exiting-to-left' : ' exiting-to-right';
          }
          
          return (
            <div
              key={page}
              className={pageClasses}
              style={{
                '--stagger-base': 'var(--delay-stagger)',
              } as React.CSSProperties}
            >
              <h2 className="page-title">{page}</h2>
              
              <div className="page-content-wrapper">
                <p className="page-subtitle">{content.subtitle}</p>
                
                <div className="page-items">
                  {content.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex} 
                      className="page-item"
                    >
                      <span className="item-icon">→</span>
                      <span className="item-text">{item}</span>
                    </div>
                  ))}
                </div>
                
                <div className="page-footer">
                  <button className="page-action">Learn More</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="animation-info">
        <p><strong>Animation Details:</strong></p>
        <ul>
          <li>When checked: Content enters from right, old content exits to left</li>
          <li>When unchecked: Content enters from left, old content exits to right</li>
          <li>Header animates first, content follows with stagger delay</li>
          <li>Browser history integration enables back/forward button support</li>
        </ul>
      </div>
    </div>
  );
};

// Modal and Dialog Example
const ModalDialogDemo: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="modal-dialog-demo">
      <h3>Modal & Dialog Animations</h3>
      <div className="modal-triggers">
        <button onClick={() => setModalOpen(true)} className="trigger-button">
          Open Modal
        </button>
        <button onClick={() => setDialogOpen(true)} className="trigger-button">
          Open Dialog
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Modal Title</h2>
            <p>This modal slides up from the bottom with a fade effect.</p>
            <div className="modal-actions">
              <button onClick={() => setModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog */}
      {dialogOpen && (
        <div className="dialog-overlay" onClick={() => setDialogOpen(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <h3>Confirm Action</h3>
            <p>Are you sure you want to proceed?</p>
            <div className="dialog-actions">
              <button onClick={() => setDialogOpen(false)}>Cancel</button>
              <button className="primary" onClick={() => setDialogOpen(false)}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// List Animations Example
const ListAnimationsDemo: React.FC = () => {
  const [items, setItems] = useState([1, 2, 3]);
  const [showList, setShowList] = useState(true);

  const addItem = () => {
    setItems(prev => [...prev, prev.length + 1]);
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item !== id));
  };

  return (
    <div className="list-animations-demo">
      <h3>List Animations</h3>
      <div className="list-controls">
        <button onClick={() => setShowList(!showList)} className="trigger-button">
          {showList ? 'Hide' : 'Show'} List
        </button>
        <button onClick={addItem} className="trigger-button">
          Add Item
        </button>
      </div>
      
      {showList && (
        <div className="animated-list">
          {items.map((item, index) => (
            <div
              key={item}
              className="list-item"
              style={{ '--index': index } as React.CSSProperties}
            >
              <span>Item {item}</span>
              <button
                className="remove-button"
                onClick={() => removeItem(item)}
                aria-label={`Remove item ${item}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Gesture Feedback Example
const GestureFeedbackDemo: React.FC = () => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [swipedItems, setSwipedItems] = useState<number[]>([]);

  const handleSwipe = (id: number) => {
    setSwipedItems(prev => [...prev, id]);
    setTimeout(() => {
      setSwipedItems(prev => prev.filter(item => item !== id));
    }, 300);
  };

  return (
    <div className="gesture-feedback-demo">
      <h3>Gesture Feedback</h3>
      <div className="gesture-examples">
        <div className="gesture-example">
          <h4>Swipe Actions</h4>
          <div className="swipe-list">
            {[1, 2, 3].map(id => (
              <div
                key={id}
                className={`swipe-item ${swipedItems.includes(id) ? 'swiped' : ''}`}
                onClick={() => handleSwipe(id)}
              >
                <span>Swipe to delete</span>
                <div className="swipe-action">Delete</div>
              </div>
            ))}
          </div>
        </div>

        <div className="gesture-example">
          <h4>Drag Feedback</h4>
          <div className="drag-list">
            {[1, 2, 3].map(id => (
              <div
                key={id}
                className={`drag-item ${draggedItem === id ? 'dragging' : ''}`}
                onMouseDown={() => setDraggedItem(id)}
                onMouseUp={() => setDraggedItem(null)}
                onMouseLeave={() => setDraggedItem(null)}
              >
                <span className="drag-handle">⋮⋮</span>
                <span>Draggable Item {id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoadingStates: Story = {
  render: () => <LoadingStatesDemo />,
};

export const MicroInteractions: Story = {
  render: () => <MicroInteractionsDemo />,
};

export const PageTransitions: Story = {
  render: () => <PageTransitionsDemo />,
};

export const ModalAndDialog: Story = {
  render: () => <ModalDialogDemo />,
};

export const ListAnimations: Story = {
  render: () => <ListAnimationsDemo />,
};

export const GestureFeedback: Story = {
  render: () => <GestureFeedbackDemo />,
};