import { Mutex, QueueOverFlowError, TimeoutError } from "../lib/index";

const waitForCurrentEventLoopPhase = () => new Promise(r => setImmediate(() => r(true)));

describe("Pool", () => {
  let mutex: Mutex;
  const TOPIC1 = "TOPIC1";
  const TOPIC2 = "TOPIC2";
  const delayMs = (ms = 1000) => new Promise(res => setTimeout(res, ms));

  beforeEach(() => {
    mutex = new Mutex();
  });

  test("aquire should return result of task", async () => {
    const task = () => "hello world";
    const result = await mutex.aquire(TOPIC1, () => {
      return task();
    });
    expect(result).toBe("hello world");
  });

  test("aquire should handle the error", async () => {
    const task = () => {
      throw new Error("Custom Error");
    };
    await expect(
      mutex.aquire(TOPIC1, () => {
        return task();
      })
    ).rejects.toThrow("Custom Error");
  });

  test("aquire should add a new task to the topic", async () => {
    const cb = async () => {
      await delayMs(50);
    };

    mutex.aquire(TOPIC1, cb);
    expect(mutex.getState().mapOfTasks.get(TOPIC1)?.queue.length).toBe(1);
    await waitForCurrentEventLoopPhase();
    expect(mutex.getState().mapOfTasks.get(TOPIC1)?.runningTask.size).toBe(1);
  });

  test("setMaxQueueSizeForTopic should set the max queue size for topic", () => {
    mutex.setMaxQueueSizeForTopic(TOPIC1, 10);
    expect(mutex.getState().mapOfTasks.get(TOPIC1)?.maxQueueSize).toBe(10);
  });

  test("setMaxQueueSize should set the max queue size", () => {
    mutex.setMaxQueueSize(10);
    expect(mutex.getState().maxQueueSize).toBe(10);
  });

  test("aquire should throw QueueOverFlowError when the queue size is exceeded", async () => {
    mutex.setMaxQueueSizeForTopic(TOPIC1, 1);
    const cb = jest.fn();
    mutex.aquire(TOPIC1, cb);
    await expect(mutex.aquire(TOPIC1, cb)).rejects.toThrow(QueueOverFlowError);
  });

  test("aquire should throw TimeoutError when the task timeout is exceeded", async () => {
    const cb = async () => {
      await delayMs(10);
    };
    const opts = { timeout: 1 };
    try {
      await mutex.aquire("topic", cb, opts);
      expect(1).toBe(2);
    } catch (e) {
      expect(e).toBeInstanceOf(TimeoutError);
    }
  });

  test("exec should avoid race conditions case 1", async () => {
    const data = {
      count: 0,
      increment: function () {
        this.count = this.count + 1;
      },
    };
    const spyIncrement = jest.spyOn(data, "increment");
    await Promise.all([
      mutex.aquire(TOPIC1, () => {
        data.increment();
      }),
      mutex.aquire(TOPIC1, () => {
        data.increment();
      }),
      mutex.aquire(TOPIC1, () => {
        data.increment();
      }),
    ]);
    expect(spyIncrement).toBeCalledTimes(3);
    expect(data.count).toBe(3);
  });
  test("exec should avoid race conditions case 2 simultaneous", async () => {
    const data = {
      count: 0,
      increment: function () {
        this.count = this.count + 1;
      },
    };
    mutex.setMaxConcurrentTaskForTopic(TOPIC1, 3);
    const spyIncrement = jest.spyOn(data, "increment");
    await Promise.all([
      mutex.aquire(TOPIC1, () => {
        data.increment();
      }),
      mutex.aquire(TOPIC1, () => {
        data.increment();
      }),
      mutex.aquire(TOPIC1, () => {
        data.increment();
      }),
    ]);
    expect(spyIncrement).toBeCalledTimes(3);
    expect(data.count).toBe(3);
  });

  test("exec should avoid race conditions case 3 with delay", async () => {
    const data = {
      count: 0,
      increment: async function () {
        let c = this.count;
        c += 1;
        await delayMs(10);
        this.count = c;
      },
    };
    mutex.setMaxConcurrentTaskForTopic(TOPIC1, 1);
    const spyIncrement = jest.spyOn(data, "increment");
    await Promise.all([
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
    ]);
    expect(spyIncrement).toBeCalledTimes(3);
    expect(data.count).toBe(3);

    data.count = 0;
    mutex.setMaxConcurrentTaskForTopic(TOPIC1, 3);
    await Promise.all([
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
    ]);
    expect(spyIncrement).toBeCalledTimes(6);
    expect(data.count).toBe(1);

    data.count = 0;
    mutex.setMaxConcurrentTaskForTopic(TOPIC1, 2);
    await Promise.all([
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
    ]);
    expect(spyIncrement).toBeCalledTimes(9);
    expect(data.count).toBe(2);
  });

  test("exec should avoid race conditions case 4 with delay", async () => {
    const data = {
      count: 0,
      increment: async function () {
        let c = this.count;
        c += 1;
        await delayMs(10);
        this.count = c;
      },
    };
    mutex.setMaxConcurrentTaskForTopic(TOPIC1, 1);

    await Promise.all([data.increment(), data.increment(), data.increment(), data.increment()]);

    expect(data.count).toBe(1);

    data.count = 0;
    await Promise.all([
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
    ]);
    expect(data.count).toBe(4);
  });

  test("Between different topics should not be a problem", async () => {
    const data = {
      count: 0,
      increment: async function () {
        let c = this.count;
        c += 1;
        await delayMs(10);
        this.count = c;
      },
    };
    mutex.setMaxConcurrentTaskForTopic(TOPIC1, 1);
    mutex.setMaxConcurrentTaskForTopic(TOPIC2, 1);

    await Promise.all([
      mutex.aquire(TOPIC1, async () => {
        await data.increment();
      }),
      mutex.aquire(TOPIC2, async () => {
        await data.increment();
      }),
    ]);
    expect(data.count).toBe(1);

    data.count = 0;

    await Promise.all([
      mutex
        .aquire(TOPIC1, async () => {
          await data.increment();
        })
        .then(async () => {
          await mutex.aquire(TOPIC2, async () => {
            await data.increment();
          });
        }),
    ]);
    expect(data.count).toBe(2);
  });
});
