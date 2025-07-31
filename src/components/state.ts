
/**
 * Encapsulated agent cooperation state using a singleton class.
 * Provides shared state for agent cooperation features.
 */
export class AgentCooperationState {
	private static _instance: AgentCooperationState;

	/** Number of prompts sent in the current session. */
	promptCount = 0;
	/** Maximum prompts allowed per session. */
	MAX_PROMPTS_PER_SESSION = 10;
	/** Whether agent cooperation is currently active. */
	agentCooperationActive = false;
	/** Whether agent cooperation is currently paused. */
	agentCooperationPaused = false;
	/** The current agent cooperation goal, if any. */
	agentCooperationGoal: string | undefined = undefined;
	/** The interval/timeout handle for the cooperation loop, if running. */
	agentCooperationLoop: NodeJS.Timeout | undefined = undefined;
	/** List of selected files for cooperation. */
	selectedFiles: string[] = [];
	/** Source of context for cooperation (e.g., 'editor'). */
	CONTEXT_SOURCE = 'editor';
	/** File review paths (comma-separated). */
	FILE_REVIEW_PATHS = '';
	/** Specification resource URLs (comma-separated). */
	SPEC_RESOURCE_URLS = '';

	private constructor() {}

	/**
	 * Gets the singleton instance of AgentCooperationState.
	 */
	public static get instance(): AgentCooperationState {
		if (!AgentCooperationState._instance) {
			AgentCooperationState._instance = new AgentCooperationState();
		}
		return AgentCooperationState._instance;
	}
}
