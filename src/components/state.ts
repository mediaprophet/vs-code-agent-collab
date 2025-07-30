
// Encapsulated agent cooperation state using a singleton class
export class AgentCooperationState {
	private static _instance: AgentCooperationState;

	promptCount = 0;
	MAX_PROMPTS_PER_SESSION = 10;
	agentCooperationActive = false;
	agentCooperationPaused = false;
	agentCooperationGoal: string | undefined = undefined;
	agentCooperationLoop: NodeJS.Timeout | undefined = undefined;
	selectedFiles: string[] = [];
	CONTEXT_SOURCE = 'editor';
	FILE_REVIEW_PATHS = '';
	SPEC_RESOURCE_URLS = '';

	private constructor() {}

	public static get instance(): AgentCooperationState {
		if (!AgentCooperationState._instance) {
			AgentCooperationState._instance = new AgentCooperationState();
		}
		return AgentCooperationState._instance;
	}
}
