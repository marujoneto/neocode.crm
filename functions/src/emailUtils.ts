/**
 * Email template parsing and variable substitution utilities
 */

// Parse a template string and replace variables with their values
export function parseTemplate(
  template: string,
  variables: Record<string, string> = {},
): string {
  let result = template;

  // Replace all variables in the format {{variableName}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    result = result.replace(regex, value);
  });

  // Remove any remaining variables that weren't provided
  result = result.replace(/\{\{\s*[\w\.]+\s*\}\}/g, "");

  return result;
}

// Extract variables from a template string
export function extractVariables(template: string): string[] {
  const variables: string[] = [];
  const regex = /\{\{\s*([\w\.]+)\s*\}\}/g;
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

// Generate a test email with sample data
export function generateTestEmail(
  template: string,
  variables: string[],
): string {
  const sampleData: Record<string, string> = {};

  variables.forEach((variable) => {
    sampleData[variable] = `[Sample ${variable}]`;
  });

  return parseTemplate(template, sampleData);
}
