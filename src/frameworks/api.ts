// api.ts
// API for managing frameworks and adding new ones from .automator/frameworks/

import * as fs from 'fs';
import * as path from 'path';


/**
 * Represents a framework definition for the Automator.
 */
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


/**
 * API for managing frameworks and adding new ones from .automator/frameworks/.
 */
export class FrameworkAPI {
  private frameworksDir: string;
  private frameworks: FrameworkDefinition[] = [];

  /**
   * Initializes the FrameworkAPI with the given base directory.
   * @param baseDir The base directory for .automator/frameworks
   */
  constructor(baseDir: string) {
    this.frameworksDir = path.join(baseDir, '.automator', 'frameworks');
    this.loadFrameworks();
  }

  /**
   * Loads all framework definitions from .automator/frameworks/.
   * Invalid files are ignored.
   */
  loadFrameworks(): void {
    this.frameworks = [];
    if (!fs.existsSync(this.frameworksDir)) return;
    const files = fs.readdirSync(this.frameworksDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const def = JSON.parse(fs.readFileSync(path.join(this.frameworksDir, file), 'utf8'));
        this.frameworks.push(def);
      } catch (e) {
        // Optionally log or notify user about invalid files
      }
    }
  }

  /**
   * Adds a new framework definition and persists it to disk.
   * @param def The framework definition
   */
  addFramework(def: FrameworkDefinition): void {
    const filePath = path.join(this.frameworksDir, `${def.name.replace(/\s+/g, '_').toLowerCase()}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(def, null, 2), 'utf8');
      this.frameworks.push(def);
    } catch (e) {
      // Optionally log or notify user about write errors
    }
  }

  /**
   * Lists all available frameworks.
   * @returns Array of framework definitions
   */
  listFrameworks(): FrameworkDefinition[] {
    return this.frameworks;
  }
}


/**
 * Example: Adds a VS Code extension framework definition to the API.
 * @param api The FrameworkAPI instance
 */
export function addVSCodeExtensionFramework(api: FrameworkAPI): void {
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
