# synchronization-mutex-js

The synchronization-mutex-js package provides a `Mutex` class. A Mutex (short for mutual exclusion) is a synchronization mechanism used to coordinate access to shared resources. The Mutex class has a method aquire which adds a task to the queue for a given topic and will only execute a certain number of tasks at a time (the number of maxConcurrentTask), with a default value of 1. If the task takes longer than the defined timeout, a TimeoutError will be thrown. The class also has a method setMaxQueueSizeForTopic to set the max queue size for incoming tasks for a given topic.

## Installation

```sh
npm install synchronization-mutex-js --save
```

or using yarn

```sh
npm install synchronization-mutex-js --save
```

## Usage

```typescript
const { Mutex } = require("synchronization-mutex-js");

const mutex = new Mutex();
const topic = "Some unique topic";

// Set the maximum queue size for a given topic
mutex.setMaxQueueSizeForTopic(topic, 50); // This is the value by default
mutex.setMaxConcurrentTaskForTopic(topic, 1); // This garanties that only one function at the same time

function someFunction() {
  // Some function that accsess to shared resources or global variables
}

// Aquire a new task for a given topic
mutex.aquire(
  topic,
  () => {
    // task to be executed
    someFunction();
  },
  { timeout: 3000 }
);
```

## API

`aquire(topic: string, cb: (...params: any[]) => any, opts: ITaskOption = {})`

Adds a task to the queue for a given topic. The task will be a function cb, and it'll return a promise. The task will be executed in in **asynchronous order** and only the number of **maxConcurrentTask** configured by the topic or global will be the number of functions that will run at the same time. By default the maxConcurrentTask = 1. Which garantees that only one task at the same time will be access execute. The opts parameter is an optional object that can contain the following properties:

1.  timeout: A number that represents the maximum time in milliseconds that the task should take to resolve. If the task takes longer than this, a `TimeoutError` will be thrown.

`setMaxQueueSizeForTopic(topic: string, maxQueueSize = 50)`

Sets the maximum queue size for a given topic. For a given queue of some topic if a new task enters and the length of the queue has reached the maxQueueSize, an error will be thrown. Default is 50 pending task per queue.

`setMaxQueueSize(maxQueueSize = 50)`

An integer that represents the queue size of the imcoming tasks. It is general for all queues of topics. If a new task enters and the length of the queue has reached the maxQueueSize, an error will be thrown. Default is 50 for all new tasks. You can specify for every topics a queueSize variable.

`setMaxConcurrentTaskForTopic(topic: string, maxConcurrentTask = 1)`

The amount of allowed concurrent functions to be execute at the same time. By default is one.

## Error
`QueueOverFlowError`
Thrown when the queue size exceeds the maximum of pending task for a given topic.

`TimeoutError`
Thrown when a task takes longer than its specified timeout to resolve.

## License
MIT.
