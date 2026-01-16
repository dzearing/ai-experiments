import type { Meta, StoryObj } from '@storybook/react';
import {
  ProductTopicDetail,
  sampleProduct,
  sampleDrone,
  RecipeTopicDetail,
  sampleRecipe,
  SlideDeckTopicDetail,
  sampleSlideDeck,
  WhiteboardTopicDetail,
  sampleWhiteboard,
  VacationTopicDetail,
  sampleVacation,
  GitRepoTopicDetail,
  sampleRepo,
  PackageTopicDetail,
  samplePackage,
  FinanceTopicDetail,
  sampleFinance,
  WebsiteTopicDetail,
  sampleWebsites,
  LearningTopicDetail,
  sampleLearning,
  ProjectTopicDetail,
  sampleProject,
  SongIdeasTopicDetail,
  sampleSongIdeas,
  UIDesignTopicDetail,
  sampleUIDesign,
} from './topics';

/**
 * # Topic Details Page
 *
 * Detailed views for different types of topics. Topics are contextual containers
 * for organizing chats, documents, plans, and ideas around specific subjects.
 *
 * Each topic type has a unique schema and visualization appropriate to its nature:
 * - **Products**: Beautiful hero images, specs, documents, reviews
 * - **Destinations**: Maps, weather, itineraries, photos
 * - **Git Repos**: Structure, contributors, activity, README
 * - **Packages**: Dependencies, exports, source files, versions
 * - **Finance**: Budgets, transactions, goals, projections
 * - **Websites**: Bookmarks, notes, screenshots, categories
 * - **Learning Paths**: Courses, progress, certificates
 * - **Recipes**: Ingredients, phases, cooking workflow, nutrition
 * - **Projects**: Tasks, milestones, team, alerts
 * - **Song Ideas**: Hooks, lyrics, genres, moods
 * - **UI Design**: Explorations, components, tokens, references
 * - **Slide Decks**: Presentation slides, speaker notes, collaboration
 * - **Whiteboards**: Collaborative canvas with sticky notes, shapes, voting
 */

type TopicType =
  | 'product'
  | 'drone'
  | 'vacation'
  | 'git-repo'
  | 'package'
  | 'finance'
  | 'websites'
  | 'learning'
  | 'recipe'
  | 'project'
  | 'song-ideas'
  | 'ui-design'
  | 'slide-deck'
  | 'whiteboard';

interface TopicDetailsProps {
  topicType: TopicType;
}

function TopicDetailsComponent({ topicType }: TopicDetailsProps) {
  switch (topicType) {
    case 'product':
      return <ProductTopicDetail topic={sampleProduct} />;
    case 'drone':
      return <ProductTopicDetail topic={sampleDrone} />;
    case 'vacation':
      return <VacationTopicDetail topic={sampleVacation} />;
    case 'git-repo':
      return <GitRepoTopicDetail topic={sampleRepo} />;
    case 'package':
      return <PackageTopicDetail topic={samplePackage} />;
    case 'finance':
      return <FinanceTopicDetail topic={sampleFinance} />;
    case 'websites':
      return <WebsiteTopicDetail topic={sampleWebsites} />;
    case 'learning':
      return <LearningTopicDetail topic={sampleLearning} />;
    case 'recipe':
      return <RecipeTopicDetail topic={sampleRecipe} />;
    case 'project':
      return <ProjectTopicDetail topic={sampleProject} />;
    case 'song-ideas':
      return <SongIdeasTopicDetail topic={sampleSongIdeas} />;
    case 'ui-design':
      return <UIDesignTopicDetail topic={sampleUIDesign} />;
    case 'slide-deck':
      return <SlideDeckTopicDetail topic={sampleSlideDeck} />;
    case 'whiteboard':
      return <WhiteboardTopicDetail topic={sampleWhiteboard} />;
    default:
      return <div>Unknown topic type</div>;
  }
}

// ============================================
// STORYBOOK META
// ============================================

const meta: Meta<typeof TopicDetailsComponent> = {
  title: 'Example Pages/Ideate Ideas/Topic Exploration',
  component: TopicDetailsComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TopicDetailsComponent>;

export const Product: Story = {
  name: 'Product (Sony WH-1000XM5)',
  args: {
    topicType: 'product',
  },
};

export const Drone: Story = {
  name: 'Product (DJI Mini 5 Pro)',
  args: {
    topicType: 'drone',
  },
};

export const Vacation: Story = {
  name: 'Vacation (Japan Spring 2024)',
  args: {
    topicType: 'vacation',
  },
};

export const GitRepository: Story = {
  name: 'Git Repository (claude-flow)',
  args: {
    topicType: 'git-repo',
  },
};

export const Package: Story = {
  name: 'Package (@claude-flow/ui-kit)',
  args: {
    topicType: 'package',
  },
};

export const Finance: Story = {
  name: 'Finance (Renovation Fund)',
  args: {
    topicType: 'finance',
  },
};

export const Websites: Story = {
  name: 'Websites (Design Inspiration)',
  args: {
    topicType: 'websites',
  },
};

export const Learning: Story = {
  name: 'Learning (Machine Learning)',
  args: {
    topicType: 'learning',
  },
};

export const Recipe: Story = {
  name: 'Recipe (Thai Green Curry)',
  args: {
    topicType: 'recipe',
  },
};

export const Project: Story = {
  name: 'Project (Website Redesign)',
  args: {
    topicType: 'project',
  },
};

export const SongIdeas: Story = {
  name: 'Song Ideas (Midnight Muse)',
  args: {
    topicType: 'song-ideas',
  },
};

export const UIDesign: Story = {
  name: 'UI Design (Dashboard Redesign)',
  args: {
    topicType: 'ui-design',
  },
};

export const SlideDeck: Story = {
  name: 'Slide Deck (Q1 Product Strategy)',
  args: {
    topicType: 'slide-deck',
  },
};

export const Whiteboard: Story = {
  name: 'Whiteboard (Product Brainstorm)',
  args: {
    topicType: 'whiteboard',
  },
};
