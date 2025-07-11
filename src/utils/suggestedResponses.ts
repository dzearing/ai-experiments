/**
 * Analyzes a message to determine if it's asking for permission or presenting options,
 * and generates appropriate suggested responses.
 */
export function generateSuggestedResponses(content: string): string[] | undefined {
  const lowerContent = content.toLowerCase();
  
  // Plan mode - check for plan execution questions
  if (
    lowerContent.includes('would you like me to proceed') ||
    lowerContent.includes('do you want me to proceed') ||
    lowerContent.includes('should i proceed with') ||
    lowerContent.includes('shall i proceed with') ||
    lowerContent.includes('proceed with making') ||
    lowerContent.includes('proceed with these')
  ) {
    return ['Yes, proceed with the plan', 'No, let me review more', 'Make some changes first'];
  }
  
  // Permission requests
  if (
    lowerContent.includes('could you grant') ||
    lowerContent.includes('can i have permission') ||
    lowerContent.includes('may i') ||
    lowerContent.includes('would you like me to') ||
    lowerContent.includes('should i') ||
    lowerContent.includes('shall i')
  ) {
    return ['Yes, please proceed', 'No, not right now', 'Tell me more first'];
  }
  
  // Yes/No questions
  if (
    lowerContent.includes('is this correct?') ||
    lowerContent.includes('does this look right?') ||
    lowerContent.includes('is that okay?') ||
    lowerContent.includes('do you agree?') ||
    lowerContent.includes('sound good?')
  ) {
    return ['Yes', 'No', 'Mostly, but...'];
  }
  
  // Options presented
  if (
    lowerContent.includes('which would you prefer') ||
    lowerContent.includes('which option') ||
    lowerContent.includes('what would you like')
  ) {
    // Try to extract numbered options
    const optionMatches = content.match(/(\d+)\.\s+([^.?!]+)/g);
    if (optionMatches && optionMatches.length > 1) {
      return optionMatches.slice(0, 4).map(match => {
        const num = match.match(/^(\d+)/)?.[1];
        return `Option ${num}`;
      });
    }
  }
  
  // Continue/Stop questions
  if (
    lowerContent.includes('should i continue') ||
    lowerContent.includes('shall i proceed') ||
    lowerContent.includes('want me to continue')
  ) {
    return ['Continue', 'Stop here', 'Show me what you have so far'];
  }
  
  // Help requests
  if (
    lowerContent.includes('how can i help') ||
    lowerContent.includes('what would you like me to do') ||
    lowerContent.includes('what can i do for you')
  ) {
    return ['Explain the code', 'Fix the issue', 'Add a feature', 'Review for improvements'];
  }
  
  // File/Directory questions
  if (
    lowerContent.includes('which file') ||
    lowerContent.includes('which directory') ||
    lowerContent.includes('where should')
  ) {
    return ['Show me the options', 'Use the default', 'I\'ll specify'];
  }
  
  // No clear question detected
  return undefined;
}