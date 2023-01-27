"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutex = exports.TimeoutError = exports.QueueOverFlowError = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const event_emitter_1 = require("./event-emitter");
class QueueOverFlowError extends Error {
    constructor(topic) {
        super(`Queue out of range in this moment for topic: ${topic}, the task is rejected`);
    }
}
exports.QueueOverFlowError = QueueOverFlowError;
class TimeoutError extends Error {
    constructor(task) {
        super("Timeout: This excecution has been reached the timeout condition:" + task.opts.timeout + " ms");
    }
}
exports.TimeoutError = TimeoutError;
class Mutex {
    constructor() {
        this.maxConcurrentTask = 1;
        this.maxQueueSize = 50;
        this.TASK_HAS_FINISHED = "TASK_HAS_FINISHED";
        this.defaultOps = {
            timeout: 3 * 10 * 1000, // default timeout for the task;
        };
        this.eventEmitter = new event_emitter_1.EventEmitterCustom();
        this.mapOfTasks = new Map();
        this.maxConcurrentTask = 1;
    }
    aquire(topic, cb, opts = {}) {
        return new Promise((resolve, reject) => {
            const options = Object.assign(Object.assign({}, this.defaultOps), opts);
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
        var _a, _b, _c;
        if (!this.mapOfTasks.has(topic)) {
            this.mapOfTasks.set(topic, {
                queue: [task],
                runningTask: new Set(),
                maxConcurrentTask: this.maxConcurrentTask,
                maxQueueSize: this.maxQueueSize,
            });
        }
        else {
            if (((_a = this.mapOfTasks.get(topic)) === null || _a === void 0 ? void 0 : _a.queue.length) >=
                ((_b = this.mapOfTasks.get(topic)) === null || _b === void 0 ? void 0 : _b.maxQueueSize)) {
                throw new QueueOverFlowError(topic);
            }
            (_c = this.mapOfTasks.get(topic)) === null || _c === void 0 ? void 0 : _c.queue.push(task);
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
    enqueue(key) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
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
                    signal === null || signal === void 0 ? void 0 : signal.addEventListener("abort", abortHandler);
                    Promise.resolve(task.fn())
                        .then((result) => {
                        signal === null || signal === void 0 ? void 0 : signal.removeEventListener("abort", abortHandler);
                        resolve(result);
                    })
                        .catch((error) => {
                        signal === null || signal === void 0 ? void 0 : signal.removeEventListener("abort", abortHandler);
                        reject(error);
                    });
                });
            };
            const queueTask = (_a = this.mapOfTasks) === null || _a === void 0 ? void 0 : _a.get(key);
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
                const result = yield executorTask(currentTask, signal);
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
        });
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
exports.Mutex = Mutex;
//# sourceMappingURL=index.js.map