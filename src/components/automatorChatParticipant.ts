import * as vscode from 'vscode';



/**
 * Represents a slash command for the Automator chat participant.
 */
type SlashCommand = {
    name: string;
    description: string;
    action: (stream: vscode.ChatResponseStream, args?: string) => Promise<void>;
};

/**
 * List of supported slash commands for the Automator chat participant.
 */
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
            stream.markdown('````\n' + prompt + '\n````');
            // Send prompt to LM Studio SDK and stream the real response
            try {
                const { LMStudioClient } = await import('@lmstudio/sdk');
                let model = 'llama-3.2-3b-instruct';
                let temperature = 0.7;
                const ext = vscode.extensions.getExtension('mediaprophet.copilot-automator-grok-gpt');
                if (ext?.exports?.context) {
                    const ctx = ext.exports.context;
                    model = ctx.globalState.get('llmModel', model) || model;
                    temperature = ctx.globalState.get('llmTemp', temperature) || temperature;
                }
                const client = new LMStudioClient();
                const handle = client.llm.createDynamicHandle(model);
                const prediction = handle.respond([
                    { role: 'user', content: prompt }
                ], { temperature });
                let fullResponse = '';
                for await (const fragment of prediction) {
                    if (fragment && fragment.content) {
                        fullResponse += fragment.content;
                        stream.markdown(fragment.content);
                    }
                }
                if (!fullResponse) {
                    stream.markdown('[No response from model]');
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                stream.markdown('❌ Error: ' + errorMessage);
            }
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


/**
 * Builds a prompt for the LLM using workspace context and user input.
 * @param userPrompt The user's prompt
 * @param workspaceName The workspace name
 * @param fileCount The number of files in the workspace
 * @returns The composed prompt string
 */
function buildLLMPrompt(userPrompt: string, workspaceName?: string, fileCount?: number): string {
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


/**
 * Registers the Automator chat participant handler for VS Code chat.
 * Handles slash commands, Copilot message routing, and rich output.
 * @param _context The extension context
 * @param onOutput Callback for output events
 * @returns The chat request handler
 */
export function registerAutomatorChatParticipant(_context: vscode.ExtensionContext, onOutput: (output: string) => void): vscode.ChatRequestHandler {
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
    // Register the handler with VS Code's chat participant API if needed, or return it
    // Example: context.subscriptions.push(vscode.chat.registerChatParticipant(participantId, handler));
    // For now, just return the handler for testability
    return handler;
}