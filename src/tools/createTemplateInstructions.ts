// createTemplateInstructions.ts
// Tool to generate a template instruction file for automation jobs

import * as fs from 'fs';
import * as path from 'path';

export function createTemplateInstructions(targetDir: string, fileName: string = 'template-instruction.json') {
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
  fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf8');
  return filePath;
}
