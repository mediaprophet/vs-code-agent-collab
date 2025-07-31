// api.ts
// API for managing frameworks and adding new ones from .automator/frameworks/

import * as fs from 'fs';
import * as path from 'path';

export interface FrameworkDefinition {
  name: string;
  version?: string;
  description?: string;
  packages?: string[];
  apis?: string[];
  configFiles?: string[];
  boilerplate?: string;
  docs?: string[];
  platforms?: string[];
  scripts?: string[];
  customInstructions?: string;
}

export class FrameworkAPI {
  private frameworksDir: string;
  private frameworks: FrameworkDefinition[] = [];

  constructor(baseDir: string) {
    this.frameworksDir = path.join(baseDir, '.automator', 'frameworks');
    this.loadFrameworks();
  }

  // Load all framework definitions from .automator/frameworks/
  loadFrameworks() {
    this.frameworks = [];
    if (!fs.existsSync(this.frameworksDir)) return;
    const files = fs.readdirSync(this.frameworksDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const def = JSON.parse(fs.readFileSync(path.join(this.frameworksDir, file), 'utf8'));
        this.frameworks.push(def);
      } catch (e) {
        // Ignore invalid files
      }
    }
  }

  // Add a new framework definition
  addFramework(def: FrameworkDefinition): void {
    const filePath = path.join(this.frameworksDir, `${def.name.replace(/\s+/g, '_').toLowerCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(def, null, 2), 'utf8');
    this.frameworks.push(def);
  }

  // List all available frameworks
  listFrameworks(): FrameworkDefinition[] {
    return this.frameworks;
  }
}

// Example: Add a VS Code extension framework definition
export function addVSCodeExtensionFramework(api: FrameworkAPI) {
  const vscodeFramework: FrameworkDefinition = {
    name: 'VS Code Extension',
    version: '1.x',
    description: 'Framework for building Visual Studio Code extensions using the VS Code Extension API and TypeScript.',
    packages: ['vscode', '@types/vscode'],
    apis: ['VS Code Extension API'],
    configFiles: ['package.json', 'tsconfig.json', 'vscodeignore'],
    boilerplate: 'extension.ts template',
    docs: ['https://code.visualstudio.com/api'],
    platforms: ['VS Code'],
    scripts: ['npm run compile', 'npm run watch'],
    customInstructions: 'Set up extension manifest and commands.'
  };
  api.addFramework(vscodeFramework);
}
