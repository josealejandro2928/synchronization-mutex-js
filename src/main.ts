import { Mutex } from "../lib/index";

const mutex = new Mutex();

let globalCounter = 0;

const delayMs = (ms = 1000) => new Promise(res => setTimeout(res, ms));

async function executionOne(delay = 100) {
  let currentCounter = globalCounter;
  await delayMs(delay);
  currentCounter++;
  globalCounter = currentCounter;
  return globalCounter;
}

async function main() {
  mutex.setMaxConcurrentTaskForTopic("globalCounter", 1);
  mutex.setMaxQueueSizeForTopic("globalCounter", 10);
  mutex.getState().eventEmitter.once(`TASK_HAS_FINISHED:topic::globalCounter`, () => {
    console.log("Hereeeeee687464134563");
  });

  await Promise.all([
    mutex
      .aquire(
        "globalCounter",
        async () => {
          return await executionOne(1);
        },
        { timeout: 2000 }
      )
      .then(res => {
        console.log("globalCounter from One: " + res);
        console.log("State of the mutex: ", mutex.getState());
      })
      .catch((er: any) => console.error("*****Error:*****", er)),
    mutex
      .aquire("globalCounter", async () => {
        return await executionOne(1);
      })
      .then(res => {
        console.log("globalCounter from Two: " + res);
        console.log("State of the mutex: ", mutex.getState());
      })
      .catch((er: any) => console.error(er)),

    mutex
      .aquire("globalCounter", async () => {
        let current = globalCounter;
        current *= 2;
        globalCounter = current;
        return current;
      })
      .then(res => {
        console.log("globalCounter from Three: " + res);
        console.log("State of the mutex: ", mutex.getState());
      })
      .catch((er: any) => console.error("Error in Three", er)),

    mutex
      .aquire("globalCounter", async () => {
        let current = globalCounter;
        current *= 2;
        globalCounter = current;
        return current;
      })
      .then(res => {
        console.log("globalCounter from Four: " + res);
        console.log("State of the mutex: ", mutex.getState());
      })
      .catch((er: any) => console.error("Error in Four", er)),
  ]);

  console.log("State of the mutex: ", mutex.getState());
  console.log("State of the globalCounter : ", globalCounter);
}

main();
