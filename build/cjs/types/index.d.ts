import { EventEmitterCustom } from "./event-emitter";
interface ITask {
    fn: (...args: any[]) => any;
    opts: ITaskOption;
    onResolveCb: (err: any, data: any) => any;
    finished: boolean;
}
interface ITaskOption {
    timeout?: number | null | undefined;
}
interface IQueueTask {
    queue: Array<ITask>;
    runningTask: Set<ITask>;
    maxQueueSize: number;
    maxConcurrentTask: number;
}
export declare class QueueOverFlowError extends Error {
    constructor(topic: string);
}
export declare class TimeoutError extends Error {
    constructor(task: ITask);
}
export declare class Mutex {
    private eventEmitter;
    private mapOfTasks;
    private maxConcurrentTask;
    private maxQueueSize;
    private TASK_HAS_FINISHED;
    private defaultOps;
    constructor();
    aquire(topic: string, cb: (...params: any[]) => any, opts?: ITaskOption): Promise<any>;
    private addNewTaskToTopic;
    /**
     *
     * @param topic A unique indentifier of process to aquire
     * @param maxQueueSize An integer that represents the queue size of the imcoming tasks
     * For a given queue of subject if a new task enters and the length of the queue reaches x.
     * An error will be thrown. Default is 100 for all new tasks.
     * @return void
     */
    setMaxQueueSizeForTopic(topic: string, maxQueueSize?: number): void;
    /**
     * @param maxQueueSize An integer that represents the queue size of the imcoming tasks
     * general for all queues of subject if a new task enters and the length of the queue reaches x.
     * An error will be thrown. Default is 100 for all new tasks. You can specify for every topics a queueSize variable
     */
    setMaxQueueSize(maxQueueSize?: number): void;
    /**
     * @param maxConcurrentTask The amount of allowed concurrent process globally.
     * You can specify for every topics a maxConcurrentTask variable
     */
    setMaxConcurrentTask(maxConcurrentTask?: number): void;
    /**
     *
     * @param topic A unique indentifier of process to aquire
     * @param maxConcurrentTask The amount of allowed concurrent process
     * By default is One,
     */
    setMaxConcurrentTaskForTopic(topic: string, maxConcurrentTask?: number): void;
    private enqueue;
    getState(): {
        eventEmitter: EventEmitterCustom;
        mapOfTasks: Map<string, IQueueTask>;
        maxConcurrentTask: number;
        maxQueueSize: number;
    };
}
export {};
