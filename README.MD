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
mutex.setMaxConcurrentTaskForTopic(topic, 1); // This garanties that only one function at the same time
mutex.setMaxQueueSizeForTopic(topic, 50); // This is the value by default

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

## Examples

Consider the fallowing example of concurrency and race condition in JavaScript

```typescript
class CounterState {
  #counter = 0;
  getCounter() {
    return this.#counter;
  }

  async setCounter(val) {
    return new Promise(resolve => {
      setTimeout(() => {
        this.#counter = val;
        resolve(val);
      }, 0);
    });
  }
}
async function main() {
  let counterState = new CounterState();

  async function updateCounter() {
    await counterState.setCounter(counterState.getCounter() + 1);
  }

  Promise.all([updateCounter(), updateCounter(), updateCounter()])
    .then(() => {
      console.log("Global counter state: ", counterState.getCounter());
    })
    .catch(error => {
      console.log("error: ", error);
    });
}

main();
```

The code defines a class `CounterState` with a private field #counter initialized to 0. The `setCounter` sets its value asynchronously using a Promise that resolves to the val after a timeout of 0ms.

In the main function, an instance of CounterState is created and stored in counterState. Another async function updateCounter is defined, which increments the counter by calling setCounter with the value of getCounter plus 1. In the above example, when we run the updateCounter at the same time inside a Promise.all the final value will not be as espect (in this case 3), it will be 1. Here there is an example problem of councurrency in asynchronous programming.

By using a mutex instance you can mitigate this problem. Lets use it:

```typescript
class CounterState {
  #counter = 0;
  getCounter() {
    return this.#counter;
  }

  async setCounter(val) {
    return new Promise(resolve => {
      setTimeout(() => {
        this.#counter = val;
        resolve(val);
      }, 0);
    });
  }
}

async function main() {
  const mutex = new Mutex();
  let counterState = new CounterState();

  async function updateCounter() {
    await counterState.setCounter(counterState.getCounter() + 1);
  }

  const topic = "UPDATE_COUNTER_STATE";
  Promise.all([
    mutex.aquire(topic, updateCounter),
    mutex.aquire(topic, updateCounter),
    mutex.aquire(topic, updateCounter),
  ])
    .then(() => {
      console.log("Global counter state: ", counterState.getCounter());
    })
    .catch(error => {
      console.log("error: ", error);
    });
}

main();
```

Now after executing this code the status of the Global counter is 3. Because Mutex class only executes one function at a time. Executing a queue of pending calls only one after another in the same order as they were executed. This feature avoids the race condition state and synchronizes the access and editing of the counter variable.

The Mutex class is used to ensure that only one thread or asynchronimus callback at a time can access a shared resource.
It is important in situations where multiple concurrent function might try to modify the same data,
leading to potential race conditions or unexpected behavior. Some use cases for the Mutex class are:

1. Protecting access to shared data structures, such as arrays, linked lists, and maps, to prevent corruption from multiple threads modifying them simultaneously.

2. Synchronizing access to shared resources, such as files, sockets, and databases, to prevent data loss or corruption caused by concurrent callback accessing them simultaneously.

3. Implementing critical sections of code, where only one thread can execute at a time, to ensure that the shared state is consistent.

4. Implementing locking mechanisms in concurrent programs to prevent race conditions and ensure data consistency.

## License

MIT.
