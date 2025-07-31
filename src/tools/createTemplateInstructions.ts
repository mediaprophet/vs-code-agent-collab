
// createTemplateInstructions.ts
// Tool to generate a template instruction file for automation jobs

import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates a template instruction file for automation jobs.
 * @param targetDir The target directory to save the file
 * @param fileName The file name (default: 'template-instruction.json')
 * @returns The path to the created template file
 */
export function createTemplateInstructions(targetDir: string, fileName: string = 'template-instruction.json'): string {
  const template = {
    goal: "Describe the main goal for the automation job.",
    steps: [
      {
        description: "Describe the first step.",
        command: "",
        parameters: {}
      }
    ],
    notes: "Add any additional notes or requirements here."
  };
  const filePath = path.join(targetDir, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf8');
    return filePath;
  } catch (err) {
    // Optionally log or notify user
    return '';
  }
}
