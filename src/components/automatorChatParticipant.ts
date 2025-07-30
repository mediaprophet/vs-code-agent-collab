import * as vscode from 'vscode';


type SlashCommand = {
    name: string;
    description: string;
    action: (stream: vscode.ChatResponseStream, args?: string) => Promise<void>;
};

const SLASH_COMMANDS: SlashCommand[] = [
    {
        name: 'run',
        description: 'Run the automator',
        action: async (stream) => {
            await vscode.commands.executeCommand('copilot-automator.start');
            stream.markdown('🚀 Automator started.');
        }
    },
    {
        name: 'pause',
        description: 'Pause the automator',
        action: async (stream) => {
            await vscode.commands.executeCommand('copilot-automator.pause');
            stream.markdown('⏸️ Automator paused.');
        }
    },
    {
        name: 'resume',
        description: 'Resume the automator',
        action: async (stream) => {
            await vscode.commands.executeCommand('copilot-automator.resume');
            stream.markdown('▶️ Automator resumed.');
        }
    },
    {
        name: 'stop',
        description: 'Stop the automator',
        action: async (stream) => {
            await vscode.commands.executeCommand('copilot-automator.stop');
            stream.markdown('🛑 Automator stopped.');
        }
    },
    {
        name: 'refreshModels',
        description: 'Refresh the list of LLM models',
        action: async (stream) => {
            await vscode.commands.executeCommand('copilot-automator.refreshModels');
            stream.markdown('🔄 LLM models refreshed.');
        }
    },
    {
        name: 'selectModel',
        description: 'Select an LLM model',
        action: async (stream) => {
            const modelKey = await vscode.window.showInputBox({ prompt: 'Enter model key to select:' });
            if (modelKey) {
                await vscode.commands.executeCommand('copilot-automator.selectModel', modelKey);
                stream.markdown(`✅ Model selected: \`${modelKey}\``);
            } else {
                stream.markdown('⚠️ No model key provided.');
            }
        }
    },
    {
        name: 'localai',
        description: 'Send prompt to local LLM (LM Studio)',
        action: async (stream, args) => {
            if (!args) {
                stream.markdown('⚠️ Usage: /localai <prompt>');
                return;
            }
            // Gather context
            const folders = vscode.workspace.workspaceFolders;
            const workspaceName = folders && folders.length > 0 ? folders[0].name : undefined;
            const files = folders && folders.length > 0 ? await vscode.workspace.findFiles('**/*') : [];
            const fileCount = files.length;
            // Compose prompt using buildLLMPrompt
            const prompt = buildLLMPrompt(args, workspaceName, fileCount);
            stream.progress('Composed prompt for local LLM:');
            stream.markdown('```\n' + prompt + '\n```');
            // TODO: Send prompt to LM Studio SDK and stream the real response
        }
    },
    {
        name: 'exportHistory',
        description: 'Export chat history to a file',
        action: async (stream) => {
            const uri = await vscode.window.showSaveDialog({ filters: { 'Text': ['txt'] }, saveLabel: 'Export Chat History' });
            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from('Chat history export (demo)'));
                stream.markdown('💾 Chat history exported.');
            } else {
                stream.markdown('⚠️ Export cancelled.');
            }
        }
    },
    {
        name: 'log',
        description: 'Log a message to the Automator log',
        action: async (stream, args) => {
            if (!args) {
                stream.markdown('⚠️ Usage: /log <message>');
                return;
            }
            stream.markdown('📝 Log entry: ' + args);
        }
    },
    {
        name: 'feedback',
        description: 'Send feedback about the Automator',
        action: async (stream, args) => {
            if (!args) {
                stream.markdown('⚠️ Usage: /feedback <your feedback>');
                return;
            }
            stream.markdown('🙏 Thank you for your feedback!');
        }
    }
];

// Example function to build a prompt using prompt-tsx
function buildLLMPrompt(userPrompt: string, workspaceName?: string, fileCount?: number) {
    let prompt = 'You are a helpful coding assistant for VS Code.';
    if (workspaceName) {
        prompt += ` The current workspace is **${workspaceName}**.`;
    }
    if (fileCount !== undefined) {
        prompt += ` There are ${fileCount} files in the workspace.`;
    }
    prompt += `\n**User request:** ${userPrompt}`;
    return prompt;
}

export function registerAutomatorChatParticipant(context: vscode.ExtensionContext, onOutput: (output: string) => void) {
    const participantId = 'copilot-automator.chat';
    const handler: vscode.ChatRequestHandler = async (
        request: vscode.ChatRequest,
        _chatContext: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        _token: vscode.CancellationToken
    ) => {
        // Slash command support (with argument parsing)
        if (request.command) {
            const [, ...cmdArgs] = request.prompt.trim().split(' ');
            const cmd = SLASH_COMMANDS.find(c => c.name.toLowerCase() === request.command?.toLowerCase());
            if (cmd) {
                await cmd.action(stream, cmdArgs.join(' '));
                onOutput(`[Automator Action]: /${cmd.name} ${cmdArgs.join(' ')}`);
                return;
            } else {
                stream.markdown(`❓ Unknown command: /${request.command}`);
                onOutput(`[Automator Action]: Unknown command /${request.command}`);
                return;
            }
        }

        // Bracketed command filtering: only send to Copilot if wrapped in <ToCopilot>...</ToCopilot>
        const userInput = request.prompt;
        const toCopilotMatch = userInput.match(/<ToCopilot>([\s\S]*?)<\/ToCopilot>/);
        let output = '';
        if (toCopilotMatch) {
            const copilotMsg = toCopilotMatch[1].trim();
            // Here you would send copilotMsg to Copilot chat (if API available)
            output = `🔗 Sent to Copilot: ${copilotMsg}`;
        } else {
            output = `Copilot Automator: You said: ${userInput}`;
        }

        // Rich output: show workspace folder and file count
        const folders = vscode.workspace.workspaceFolders;
        if (folders && folders.length > 0) {
            const files = await vscode.workspace.findFiles('**/*');
            output += `\n\n**Workspace:** ${folders[0].name}  \nFiles: ${files.length}`;
        }

        // Example: add a code block and a button
        stream.markdown(output);
        stream.markdown('```typescript\n// Example code block\nconsole.log("Hello from Automator!");\n```');
        stream.button({
            command: 'workbench.action.showCommands',
            title: 'Show Command Palette'
        });

        // Example: file tree (demo)
        if (folders && folders.length > 0) {
            stream.filetree([
                {
                    name: folders[0].name,
                    children: [
                        { name: 'README.md' },
                        { name: 'src', children: [{ name: 'index.ts' }] }
                    ]
                }
            ], folders[0].uri);
        }

        onOutput(output);
    };

    const participant = vscode.chat.createChatParticipant(participantId, handler);
    participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'images', 'robot-icon.png');

    // Register slash commands for chat UI
    if ((participant as any).commands !== undefined) {
        (participant as any).commands = SLASH_COMMANDS.map(cmd => ({
            name: cmd.name,
            description: cmd.description
        }));
    }
}