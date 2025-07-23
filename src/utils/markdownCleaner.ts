/**
 * MarkdownCleaner - Component for cleaning raw Markdown text
 * Extracts only the most important content by identifying headers and their content
 */

export function cleanMarkdown(rawMarkdown: string): string {
  if (!rawMarkdown || typeof rawMarkdown !== 'string') {
    return '';
  }

  const lines = rawMarkdown.split('\n');
  const cleanedBlocks: string[] = [];
  let currentBlock: string[] = [];
  let isInValidSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for Atx-style headers (# ## ###)
    const atxMatch = trimmedLine.match(/^(#{1,3})\s+(.+)/);
    
    // Check for Setext-style headers (underlined with = or -)
    let setextMatch = false;
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && (nextLine.match(/^=+$/) || nextLine.match(/^-+$/))) {
        setextMatch = true;
      }
    }

    // If we found a header (either style)
    if (atxMatch || setextMatch) {
      // Save previous block if it was valid
      if (isInValidSection && currentBlock.length > 0) {
        cleanedBlocks.push(currentBlock.join('\n').trim());
      }

      // Start new block
      currentBlock = [];
      isInValidSection = true;

      if (atxMatch) {
        // Atx-style header
        currentBlock.push(line);
      } else if (setextMatch) {
        // Setext-style header
        currentBlock.push(line);
        if (i < lines.length - 1) {
          currentBlock.push(lines[i + 1]); // Add the underline
          i++; // Skip the underline in next iteration
        }
      }
    } else if (isInValidSection) {
      // Add content under header
      currentBlock.push(line);
    }
  }

  // Don't forget the last block
  if (isInValidSection && currentBlock.length > 0) {
    cleanedBlocks.push(currentBlock.join('\n').trim());
  }

  // Join all valid blocks
  const result = cleanedBlocks.join('\n\n').trim();
  
  // If no headers were found, return a portion of the original content
  // to avoid completely losing potentially valuable information
  if (result.length === 0) {
    // Return first 2000 characters if no headers found
    return rawMarkdown.substring(0, 2000).trim();
  }

  return result;
}