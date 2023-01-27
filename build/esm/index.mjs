/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitterCustom } from "./event-emitter";
export class QueueOverFlowError extends Error {
    constructor(topic) {
        super(`Queue out of range in this moment for topic: ${topic}, the task is rejected`);
    }
}
export class TimeoutError extends Error {
    constructor(task) {
        super("Timeout: This excecution has been reached the timeout condition:" + task.opts.timeout + " ms");
    }
}
export class Mutex {
    eventEmitter;
    mapOfTasks;
    maxConcurrentTask = 1;
    maxQueueSize = 50;
    TASK_HAS_FINISHED = "TASK_HAS_FINISHED";
    defaultOps = {
        timeout: 3 * 10 * 1000, // default timeout for the task;
    };
    constructor() {
        this.eventEmitter = new EventEmitterCustom();
        this.mapOfTasks = new Map();
        this.maxConcurrentTask = 1;
    }
    /**
     *
     * @param topic
     * @param cb
     * @param opts
     * @returns Promise<any>
     * Adds a task to the queue for a given topic. The task will be a function cb, and it'll return a promise. The task will be executed in in asynchronous order
     * an only the number of maxConcurrentTask configured by the topic or global will be the number of task that will run at the same time.
     * By default the maxConcurrentTask = 1. Which garantees that only one task at the same time will be access to shared resources
     * The opts parameter is an optional object that can contain the following properties:
     *   timeout: a number that represents the maximum time in milliseconds that the task should take to resolve.
     *   If the task takes longer than this, a TimeoutError will be thrown.
     */
    aquire(topic, cb, opts = {}) {
        return new Promise((resolve, reject) => {
            const options = { ...this.defaultOps, ...opts };
            const newTask = {
                fn: cb,
                opts: options,
                onResolveCb: function (err, data) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(data);
                    }
                },
                finished: false,
            };
            this.addNewTaskToTopic(topic, newTask);
            this.enqueue(topic);
        });
    }
    addNewTaskToTopic(topic, task) {
        if (!this.mapOfTasks.has(topic)) {
            this.mapOfTasks.set(topic, {
                queue: [task],
                runningTask: new Set(),
                maxConcurrentTask: this.maxConcurrentTask,
                maxQueueSize: this.maxQueueSize,
            });
        }
        else {
            if (this.mapOfTasks.get(topic)?.queue.length >=
                this.mapOfTasks.get(topic)?.maxQueueSize) {
                throw new QueueOverFlowError(topic);
            }
            this.mapOfTasks.get(topic)?.queue.push(task);
        }
    }
    /**
     *
     * @param topic A unique indentifier of process to aquire
     * @param maxQueueSize An integer that represents the queue size of the imcoming tasks
     * For a given queue of subject if a new task enters and the length of the queue reaches x.
     * An error will be thrown. Default is 100 for all new tasks.
     * @return void
     */
    setMaxQueueSizeForTopic(topic, maxQueueSize = 50) {
        if (maxQueueSize <= 0)
            throw Error("maxQueueSize should be a positive integer > 0");
        if (!this.mapOfTasks.has(topic)) {
            this.mapOfTasks.set(topic, {
                queue: [],
                runningTask: new Set(),
                maxConcurrentTask: this.maxConcurrentTask,
                maxQueueSize: maxQueueSize,
            });
        }
        else {
            this.mapOfTasks.get(topic).maxQueueSize = maxQueueSize;
        }
    }
    /**
     * @param maxQueueSize An integer that represents the queue size of the imcoming tasks
     * general for all queues of subject if a new task enters and the length of the queue reaches x.
     * An error will be thrown. Default is 100 for all new tasks. You can specify for every topics a queueSize variable
     */
    setMaxQueueSize(maxQueueSize = 50) {
        this.maxQueueSize = maxQueueSize;
    }
    /**
     * @param maxConcurrentTask The amount of allowed concurrent process globally.
     * You can specify for every topics a maxConcurrentTask variable
     */
    setMaxConcurrentTask(maxConcurrentTask = 1) {
        this.maxConcurrentTask = maxConcurrentTask;
    }
    /**
     *
     * @param topic A unique indentifier of process to aquire
     * @param maxConcurrentTask The amount of allowed concurrent process
     * By default is One,
     */
    setMaxConcurrentTaskForTopic(topic, maxConcurrentTask = 1) {
        if (maxConcurrentTask <= 0)
            throw Error("maxConcurrentTask should be a positive integer > 0");
        if (!this.mapOfTasks.has(topic)) {
            this.mapOfTasks.set(topic, {
                queue: [],
                runningTask: new Set(),
                maxConcurrentTask: maxConcurrentTask,
                maxQueueSize: this.maxQueueSize,
            });
        }
        else {
            this.mapOfTasks.get(topic).maxConcurrentTask = maxConcurrentTask;
        }
    }
    async enqueue(key) {
        ////////////////////// function definitions ///////////////////////////
        let timerId = null;
        const topic = `${this.TASK_HAS_FINISHED}:topic::${key}`;
        const finalizeTask = (task) => {
            clearTimeout(timerId);
            if (task.finished)
                return;
            task.finished = true;
            this.eventEmitter.emit(topic, null);
        };
        const executorTask = (task, signal) => {
            return new Promise((resolve, reject) => {
                const abortHandler = () => {
                    clearTimeout(timerId);
                    reject(new TimeoutError(task));
                };
                signal?.addEventListener("abort", abortHandler);
                Promise.resolve(task.fn())
                    .then((result) => {
                    signal?.removeEventListener("abort", abortHandler);
                    resolve(result);
                })
                    .catch((error) => {
                    signal?.removeEventListener("abort", abortHandler);
                    reject(error);
                });
            });
        };
        const queueTask = this.mapOfTasks?.get(key);
        if (!queueTask)
            throw new Error("Fatal error");
        if (queueTask.runningTask.size >= queueTask.maxConcurrentTask) {
            this.eventEmitter.once(topic, () => {
                this.enqueue(key);
            });
            return;
        }
        const currentTask = queueTask.queue.shift();
        if (!currentTask)
            return;
        queueTask.runningTask.add(currentTask);
        const controller = new AbortController();
        const signal = controller.signal;
        if (currentTask.opts.timeout != null) {
            timerId = setTimeout(() => {
                controller.abort();
            }, currentTask.opts.timeout);
        }
        try {
            const result = await executorTask(currentTask, signal);
            queueTask.runningTask.delete(currentTask);
            currentTask.onResolveCb(null, result);
        }
        catch (err) {
            queueTask.runningTask.delete(currentTask);
            currentTask.onResolveCb(err, null);
        }
        finally {
            finalizeTask(currentTask);
        }
    }
    getState() {
        return {
            eventEmitter: this.eventEmitter,
            mapOfTasks: this.mapOfTasks,
            maxConcurrentTask: this.maxConcurrentTask,
            maxQueueSize: this.maxQueueSize,
        };
    }
}
//# sourceMappingURL=index.js.map