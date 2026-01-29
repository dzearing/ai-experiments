/**
 * Recipe Topic - Cooking workflow with ingredients, phases, and tasks
 */
import { useState } from 'react';
import {
  Button,
  Chip,
  Heading,
  IconButton,
  Stack,
  Tabs,
  Text,
} from '@ui-kit/react';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { CheckIcon } from '@ui-kit/icons/CheckIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ClockIcon } from '@ui-kit/icons/ClockIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { HeartIcon } from '@ui-kit/icons/HeartIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import { type BaseTopic, styles } from '../shared';

// ============================================
// TYPES
// ============================================

interface RecipeTask {
  id: string;
  title: string;
  instruction: string;
  duration?: number;
  tip?: string;
}

interface RecipePhase {
  id: string;
  title: string;
  tasks: RecipeTask[];
}

export interface RecipeTopic extends BaseTopic {
  type: 'recipe';
  cuisine: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  heroImage?: string;
  ingredients: { item: string; amount: string; optional?: boolean }[];
  phases: RecipePhase[];
  nutrition?: { calories: number; protein: number; carbs: number; fat: number };
  variations?: string[];
  rating?: number;
  timesCooked?: number;
}

// ============================================
// SAMPLE DATA
// ============================================

export const sampleRecipe: RecipeTopic = {
  id: 'recipe-1',
  type: 'recipe',
  name: 'Thai Green Curry',
  description: 'Authentic Thai green curry with chicken, coconut milk, and fresh vegetables. Rich, creamy, and perfectly spiced.',
  cuisine: 'Thai',
  servings: 4,
  prepTime: 20,
  cookTime: 25,
  difficulty: 'medium',
  tags: ['thai', 'curry', 'chicken', 'spicy', 'coconut'],
  heroImage: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
  ingredients: [
    { item: 'Chicken breast', amount: '500g' },
    { item: 'Coconut milk', amount: '400ml' },
    { item: 'Green curry paste', amount: '3 tbsp' },
    { item: 'Thai basil', amount: '1 cup' },
    { item: 'Bamboo shoots', amount: '1 can' },
    { item: 'Fish sauce', amount: '2 tbsp' },
    { item: 'Palm sugar', amount: '1 tbsp' },
    { item: 'Kaffir lime leaves', amount: '4 leaves', optional: true },
    { item: 'Thai eggplant', amount: '6 pieces', optional: true },
  ],
  phases: [
    {
      id: 'prepare',
      title: 'Prepare Thai Green Curry',
      tasks: [
        { id: 'task-1', title: 'Cut chicken', instruction: 'Cut chicken into bite-sized pieces and set aside.', duration: 5 },
        { id: 'task-2', title: 'Heat wok', instruction: 'Heat a wok over medium-high heat. Add 1/2 cup coconut milk and cook until oil separates.', duration: 3, tip: 'Use full-fat coconut milk for the creamiest curry' },
        { id: 'task-3', title: 'Bloom curry paste', instruction: 'Add curry paste and stir-fry until fragrant, about 2 minutes.', duration: 2, tip: 'Adjust curry paste amount based on your spice preference' },
        { id: 'task-4', title: 'Cook chicken', instruction: 'Add chicken and cook until no longer pink on the outside.', duration: 5 },
        { id: 'task-5', title: 'Simmer', instruction: 'Pour in remaining coconut milk, bamboo shoots, and eggplant. Simmer for 10 minutes.', duration: 10 },
        { id: 'task-6', title: 'Season', instruction: 'Season with fish sauce and palm sugar. Add kaffir lime leaves and Thai basil.', duration: 2, tip: 'Fresh Thai basil makes a huge difference - don\'t skip it' },
        { id: 'task-7', title: 'Plate & serve', instruction: 'Serve hot over jasmine rice.', duration: 1 },
      ]
    }
  ],
  nutrition: { calories: 420, protein: 32, carbs: 18, fat: 28 },
  rating: 4.8,
  timesCooked: 12,
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-18'),
  chatCount: 3,
  documentCount: 0,
  ideaCount: 2,
};

// ============================================
// COMPONENT
// ============================================

export function RecipeTopicDetail({ topic }: { topic: RecipeTopic }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [servings, setServings] = useState(topic.servings);

  // Phase-based cooking workflow state
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['ingredients']));
  const [showCompletedPhases, setShowCompletedPhases] = useState(false);

  const difficultyColors: Record<string, 'success' | 'warning' | 'error'> = {
    easy: 'success',
    medium: 'warning',
    hard: 'error',
  };

  // Get count of checked tasks in a phase
  const getCheckedTaskCount = (phaseId: string) => {
    const phase = topic.phases.find(p => p.id === phaseId);
    if (!phase) return 0;

    return phase.tasks.filter(t => checkedTasks.has(t.id)).length;
  };

  // Toggle individual ingredient
  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  // Toggle individual task
  const toggleTask = (taskId: string) => {
    const newChecked = new Set(checkedTasks);
    if (newChecked.has(taskId)) {
      newChecked.delete(taskId);
    } else {
      newChecked.add(taskId);
    }
    setCheckedTasks(newChecked);
  };

  // Complete entire phase (check all items and collapse)
  const completePhase = (phaseId: string) => {
    const newCompleted = new Set(completedPhases);
    const newExpanded = new Set(expandedPhases);

    if (phaseId === 'ingredients') {
      // Check all ingredients
      const allIndexes = new Set(topic.ingredients.map((_, i) => i));
      setCheckedIngredients(allIndexes);
    } else {
      // Check all tasks in the phase
      const phase = topic.phases.find(p => p.id === phaseId);
      if (phase) {
        const newCheckedTasks = new Set(checkedTasks);
        phase.tasks.forEach(t => newCheckedTasks.add(t.id));
        setCheckedTasks(newCheckedTasks);
      }
    }

    newCompleted.add(phaseId);
    newExpanded.delete(phaseId);

    // Auto-expand next phase
    if (phaseId === 'ingredients' && topic.phases.length > 0) {
      newExpanded.add(topic.phases[0].id);
    } else {
      const phaseIndex = topic.phases.findIndex(p => p.id === phaseId);
      if (phaseIndex >= 0 && phaseIndex < topic.phases.length - 1) {
        newExpanded.add(topic.phases[phaseIndex + 1].id);
      }
    }

    setCompletedPhases(newCompleted);
    setExpandedPhases(newExpanded);
  };

  // Uncomplete a phase (uncheck and expand)
  const uncompletePhase = (phaseId: string) => {
    const newCompleted = new Set(completedPhases);
    const newExpanded = new Set(expandedPhases);

    newCompleted.delete(phaseId);
    newExpanded.add(phaseId);

    if (phaseId === 'ingredients') {
      setCheckedIngredients(new Set());
    } else {
      // Uncheck all tasks in the phase
      const phase = topic.phases.find(p => p.id === phaseId);
      if (phase) {
        const newCheckedTasks = new Set(checkedTasks);
        phase.tasks.forEach(t => newCheckedTasks.delete(t.id));
        setCheckedTasks(newCheckedTasks);
      }
    }

    setCompletedPhases(newCompleted);
    setExpandedPhases(newExpanded);
  };

  // Total task count (ingredients + all tasks from phases)
  const totalTaskCount = topic.ingredients.length + topic.phases.reduce((sum, p) => sum + p.tasks.length, 0);

  // Completed task count (checked ingredients + checked tasks)
  const completedTaskCount = checkedIngredients.size + checkedTasks.size;

  // Toggle phase expansion
  const togglePhaseExpanded = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        {topic.heroImage ? (
          <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
            <div className={styles.heroActions}>
              <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this recipe</Button>
              <IconButton variant="ghost" icon={<EditIcon />} aria-label="Edit topic" className={styles.heroActionButton} />
              <IconButton variant="ghost" icon={<ShareIcon />} aria-label="Share" className={styles.heroActionButton} />
            </div>
            <div className={styles.heroOverlay}>
              <div className={styles.heroTags}>
                {topic.tags.map(tag => (
                  <span key={tag} className={styles.heroTag}>#{tag}</span>
                ))}
              </div>
              <Heading level={1} size={1} className={styles.heroTitle}>{topic.name}</Heading>
              <div className={styles.recipeQuickInfo}>
                <span className={styles.recipeInfoItem}>
                  <ClockIcon /> {topic.prepTime + topic.cookTime} min
                </span>
                <span className={styles.recipeInfoItem}>
                  <UsersIcon /> {topic.servings} servings
                </span>
                <Chip variant={difficultyColors[topic.difficulty]} size="sm">{topic.difficulty}</Chip>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.heroPlaceholder}>
            <ImageIcon className={styles.heroPlaceholderIcon} />
            <Heading level={1} size={2}>{topic.name}</Heading>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className={styles.recipeStats}>
        {topic.rating && (
          <div className={styles.recipeStat}>
            <StarIcon className={styles.recipeStatIcon} />
            <span className={styles.recipeStatValue}>{topic.rating}</span>
            <span className={styles.recipeStatLabel}>rating</span>
          </div>
        )}
        {topic.timesCooked !== undefined && (
          <div className={styles.recipeStat}>
            <span className={styles.recipeStatValue}>{topic.timesCooked}</span>
            <span className={styles.recipeStatLabel}>times cooked</span>
          </div>
        )}
        <div className={styles.recipeStat}>
          <span className={styles.recipeStatValue}>{topic.prepTime}</span>
          <span className={styles.recipeStatLabel}>min prep</span>
        </div>
        <div className={styles.recipeStat}>
          <span className={styles.recipeStatValue}>{topic.cookTime}</span>
          <span className={styles.recipeStatLabel}>min cook</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
        items={[
          { value: 'overview', label: 'Overview', content: null },
          { value: 'ingredients', label: 'Ingredients', content: null },
          { value: 'steps', label: 'Steps', content: null },
          { value: 'nutrition', label: 'Nutrition', content: null },
        ]}
        className={styles.tabs}
      />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.recipeOverview}>
            <Text className={styles.description}>{topic.description}</Text>

            {/* Two Column Layout */}
            <div className={styles.recipeOverviewColumns}>
              {/* Left Column - Phased Workflow */}
              <div className={styles.recipeOverviewLeft}>
                {/* Completed Phases Summary */}
                {completedPhases.size > 0 && (
                  <div className={`${styles.completedSummary} ${showCompletedPhases ? styles.expanded : ''} surface success`}>
                    <button
                      className={styles.completedSummaryHeader}
                      onClick={() => setShowCompletedPhases(!showCompletedPhases)}
                      aria-expanded={showCompletedPhases}
                    >
                      <div className={styles.completedSummaryLeft}>
                        <CheckCircleIcon className={styles.completedIcon} />
                        <Text weight="semibold">{completedPhases.size} phase{completedPhases.size > 1 ? 's' : ''} completed</Text>
                      </div>
                      <ChevronDownIcon className={styles.completedSummaryChevron} />
                    </button>
                    {showCompletedPhases && (
                      <div className={styles.phaseContent}>
                        <div className={styles.ingredientsChecklist}>
                          {completedPhases.has('ingredients') && (
                            <button
                              className={`${styles.ingredientCheckItem} ${styles.checked} surface success`}
                              onClick={() => uncompletePhase('ingredients')}
                            >
                              <div className={`${styles.ingredientCheckbox} ${styles.checked}`}>
                                <CheckIcon className={styles.checkIconSmall} />
                              </div>
                              <span className={styles.ingredientName}>Gather Ingredients</span>
                            </button>
                          )}
                          {topic.phases.map((phase) => {
                            if (!completedPhases.has(phase.id)) return null;

                            return (
                              <button
                                key={phase.id}
                                className={`${styles.ingredientCheckItem} ${styles.checked} surface success`}
                                onClick={() => uncompletePhase(phase.id)}
                              >
                                <div className={`${styles.ingredientCheckbox} ${styles.checked}`}>
                                  <CheckIcon className={styles.checkIconSmall} />
                                </div>
                                <span className={styles.ingredientName}>{phase.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Phase 1: Gather Ingredients (only show if not completed) */}
                {!completedPhases.has('ingredients') && (
                  <div className={styles.recipePhase}>
                    <div className={styles.phaseHeader}>
                      <button
                        className={styles.phaseCheckbox}
                        onClick={() => completePhase('ingredients')}
                        aria-label="Mark all ingredients as gathered"
                      />
                      <button
                        className={styles.phaseExpandArea}
                        onClick={() => togglePhaseExpanded('ingredients')}
                        aria-expanded={expandedPhases.has('ingredients')}
                      >
                        <div className={styles.phaseTitle}>
                          <Text weight="semibold" size="lg">Gather Ingredients</Text>
                          <Text size="sm" color="soft">{checkedIngredients.size}/{topic.ingredients.length} items</Text>
                        </div>
                        <ChevronDownIcon className={`${styles.phaseChevron} ${expandedPhases.has('ingredients') ? styles.expanded : ''}`} />
                      </button>
                    </div>

                    {expandedPhases.has('ingredients') && (
                      <div className={styles.phaseContent}>
                        <div className={styles.ingredientsChecklist}>
                          {topic.ingredients.map((ing, i) => (
                            <button
                              key={i}
                              className={`${styles.ingredientCheckItem} ${checkedIngredients.has(i) ? `${styles.checked} surface success` : ''} ${ing.optional ? styles.optional : ''}`}
                              onClick={() => toggleIngredient(i)}
                            >
                              <div className={`${styles.ingredientCheckbox} ${checkedIngredients.has(i) ? styles.checked : ''}`}>
                                {checkedIngredients.has(i) && <CheckIcon className={styles.checkIconSmall} />}
                              </div>
                              <span className={styles.ingredientName}>{ing.item}</span>
                              <span className={styles.ingredientAmount}>{ing.amount}</span>
                              {ing.optional && <Chip size="sm" variant="default">optional</Chip>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cooking Phases (only show non-completed) */}
                {topic.phases.map((phase) => {
                  const isCompleted = completedPhases.has(phase.id);
                  const isExpanded = expandedPhases.has(phase.id);
                  const checkedCount = getCheckedTaskCount(phase.id);

                  if (isCompleted) return null;

                  return (
                    <div key={phase.id} className={styles.recipePhase}>
                      <div className={styles.phaseHeader}>
                        <button
                          className={styles.phaseCheckbox}
                          onClick={() => completePhase(phase.id)}
                          aria-label={`Mark ${phase.title} as complete`}
                        />
                        <button
                          className={styles.phaseExpandArea}
                          onClick={() => togglePhaseExpanded(phase.id)}
                          aria-expanded={isExpanded}
                        >
                          <div className={styles.phaseTitle}>
                            <Text weight="semibold">{phase.title}</Text>
                            <Text size="sm" color="soft">{checkedCount}/{phase.tasks.length} tasks</Text>
                          </div>
                          <ChevronDownIcon className={`${styles.phaseChevron} ${isExpanded ? styles.expanded : ''}`} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className={styles.phaseContent}>
                          <div className={styles.ingredientsChecklist}>
                            {phase.tasks.map((task) => (
                              <button
                                key={task.id}
                                className={`${styles.ingredientCheckItem} ${styles.taskItem} ${checkedTasks.has(task.id) ? `${styles.checked} surface success` : ''}`}
                                onClick={() => toggleTask(task.id)}
                              >
                                <div className={`${styles.ingredientCheckbox} ${checkedTasks.has(task.id) ? styles.checked : ''}`}>
                                  {checkedTasks.has(task.id) && <CheckIcon className={styles.checkIconSmall} />}
                                </div>
                                <div className={styles.taskContent}>
                                  <span className={styles.ingredientName}>{task.title}</span>
                                  {task.tip && <span className={styles.taskTip}>{task.tip}</span>}
                                </div>
                                {task.duration && <span className={styles.ingredientAmount}>{task.duration} min</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>

              {/* Right Column - Chat and Info */}
              <div className={styles.recipeOverviewRight}>
                {/* Ask About This Recipe Card */}
                <div className={styles.recipeChatCard}>
                  <div className={styles.recipeChatHeader}>
                    <ChatIcon className={styles.recipeChatIcon} />
                    <Stack direction="vertical" gap="none">
                      <Text weight="medium">Cooking Assistant</Text>
                      <Text size="sm" color="soft">Ask questions or let AI guide you through each step</Text>
                    </Stack>
                  </div>
                  <Button variant="primary" icon={<ChatIcon />} className={styles.recipeChatButton}>
                    Start Cooking Chat
                  </Button>
                </div>

                {/* Progress Summary */}
                <div className={styles.progressCard}>
                  <Heading level={3} size={5}>Progress</Heading>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(completedTaskCount / totalTaskCount) * 100}%` }}
                    />
                  </div>
                  <Text size="sm" color="soft">
                    {completedTaskCount} of {totalTaskCount} tasks complete
                  </Text>
                </div>

                {/* Nutrition Summary */}
                {topic.nutrition && (
                  <div className={styles.nutritionCard}>
                    <Heading level={3} size={5}>Nutrition per serving</Heading>
                    <div className={styles.nutritionGrid}>
                      <div className={styles.nutritionItem}>
                        <Text size="lg" weight="bold">{topic.nutrition.calories}</Text>
                        <Text size="xs" color="soft">calories</Text>
                      </div>
                      <div className={styles.nutritionItem}>
                        <Text size="lg" weight="bold">{topic.nutrition.protein}g</Text>
                        <Text size="xs" color="soft">protein</Text>
                      </div>
                      <div className={styles.nutritionItem}>
                        <Text size="lg" weight="bold">{topic.nutrition.carbs}g</Text>
                        <Text size="xs" color="soft">carbs</Text>
                      </div>
                      <div className={styles.nutritionItem}>
                        <Text size="lg" weight="bold">{topic.nutrition.fat}g</Text>
                        <Text size="xs" color="soft">fat</Text>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className={styles.recipeActions}>
                  <Button variant="default" icon={<ShareIcon />} size="sm">Share</Button>
                  <Button variant="ghost" icon={<HeartIcon />} size="sm">Save</Button>
                  <Button variant="ghost" icon={<EditIcon />} size="sm">Edit</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className={styles.ingredientsSection}>
            <div className={styles.servingsAdjuster}>
              <Text weight="medium">Servings:</Text>
              <div className={styles.servingsControls}>
                <IconButton
                  variant="ghost"
                  icon={<span>-</span>}
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  aria-label="Decrease servings"
                />
                <span className={styles.servingsValue}>{servings}</span>
                <IconButton
                  variant="ghost"
                  icon={<span>+</span>}
                  onClick={() => setServings(servings + 1)}
                  aria-label="Increase servings"
                />
              </div>
            </div>

            <div className={styles.ingredientsList}>
              {topic.ingredients.map((ing, i) => (
                <div key={i} className={`${styles.ingredientItem} ${ing.optional ? styles.optional : ''}`}>
                  <input type="checkbox" />
                  <span className={styles.ingredientAmount}>{ing.amount}</span>
                  <span className={styles.ingredientName}>{ing.item}</span>
                  {ing.optional && <Chip size="sm" variant="default">optional</Chip>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'steps' && (
          <div className={styles.stepsList}>
            {topic.phases.map((phase, phaseIndex) => (
              <div key={phase.id} className={styles.phaseSection}>
                <Heading level={3} size={5} className={styles.phaseSectionTitle}>{phase.title}</Heading>
                {phase.tasks.map((task, taskIndex) => (
                  <div key={task.id} className={styles.stepItem}>
                    <div className={styles.stepNumber}>{phaseIndex + 1}.{taskIndex + 1}</div>
                    <Stack direction="vertical" gap="none" className={styles.stepContent}>
                      <Text weight="medium">{task.title}</Text>
                      <Text size="sm" color="soft">{task.instruction}</Text>
                      {task.duration && (
                        <Text size="sm" color="soft" className={styles.stepDuration}>
                          <ClockIcon /> {task.duration} min
                        </Text>
                      )}
                    </Stack>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'nutrition' && topic.nutrition && (
          <div className={styles.nutritionSection}>
            <Text size="sm" color="soft" className={styles.nutritionNote}>
              Per serving ({topic.servings} servings total)
            </Text>
            <div className={styles.nutritionGrid}>
              <div className={styles.nutritionItem}>
                <span className={styles.nutritionValue}>{topic.nutrition.calories}</span>
                <span className={styles.nutritionLabel}>Calories</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutritionValue}>{topic.nutrition.protein}g</span>
                <span className={styles.nutritionLabel}>Protein</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutritionValue}>{topic.nutrition.carbs}g</span>
                <span className={styles.nutritionLabel}>Carbs</span>
              </div>
              <div className={styles.nutritionItem}>
                <span className={styles.nutritionValue}>{topic.nutrition.fat}g</span>
                <span className={styles.nutritionLabel}>Fat</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
