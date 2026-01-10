/**
 * Extracted metadata from a markdown document.
 */
export interface DocumentMetadata {
  /** Title extracted from H1 heading. */
  title: string;

  /** Summary extracted from ## Summary section. */
  summary: string;

  /** Tags extracted from Tags: line. */
  tags: string[];

  /** Description content after --- separator. */
  description: string;
}
