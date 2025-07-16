export interface TaskResult {
  success: boolean;
  summary?: string;
  details?: {
    errors?: number;
    warnings?: number;
    fixable?: number;
    [key: string]: any;
  };
}

export interface TaskFunction {
  (additionalArgs?: string[]): Promise<TaskResult | void>;
}

export interface TaskOption {
  flag: string;
  description: string;
  defaultValue?: any;
}

export interface Task {
  command: string;
  description: string;
  options?: TaskOption[];
  execute: TaskFunction;
  quiet?: boolean; // Whether this task handles its own output
}