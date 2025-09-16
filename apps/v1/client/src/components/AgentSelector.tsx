import { useMemo } from 'react';
import { ListSelector, type ListItem } from './ui/ListSelector';
import { StockPhotoAvatar } from './StockPhotoAvatar';
import { useTheme } from '../contexts/ThemeContextV2';
import type { Persona } from '../types';

interface AgentSelectorProps {
  agents: Persona[];
  selectedAgentId?: string | null;
  onSelectAgent: (agentId: string) => void;
  showAutoCreate?: boolean;
  className?: string;
}

export function AgentSelector({
  agents,
  selectedAgentId,
  onSelectAgent,
  showAutoCreate = true,
  className = '',
}: AgentSelectorProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;

  const listItems: ListItem[] = useMemo(() => {
    const items: ListItem[] = agents.map((agent) => ({
      id: agent.id,
      label: agent.name,
      sublabel: agent.jobTitle || agent.expertise.join(', '),
      icon: (
        <StockPhotoAvatar
          seed={agent.avatarSeed || agent.id}
          size={40}
          gender={agent.avatarGender}
        />
      ),
      disabled: agent.status === 'busy',
    }));

    // Add auto-create option at the beginning if enabled
    if (showAutoCreate) {
      items.unshift({
        id: 'auto-create',
        label: 'Auto-create agent',
        sublabel: 'Analyze content and generate a specialized reviewer',
        icon: (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        ),
      });
    }

    return items;
  }, [agents, showAutoCreate]);

  return (
    <div className={className}>
      <div className={`mb-3 px-1`}>
        <h3 className={`font-medium ${styles.headingColor}`}>Select an Agent</h3>
        <p className={`text-sm ${styles.mutedText} mt-1`}>
          Choose an agent to review your work item
        </p>
      </div>
      <ListSelector
        items={listItems}
        selectedId={selectedAgentId}
        onSelect={onSelectAgent}
        emptyMessage="No agents available. Create one first or use auto-create."
      />
    </div>
  );
}