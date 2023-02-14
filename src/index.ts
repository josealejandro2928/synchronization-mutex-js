import { Mutex } from "../lib";

const mutex = new Mutex();
const TOPIC = "TOPIC";

mutex.setMaxConcurrentTask(4);
mutex.setMaxQueueSize(10);

mutex
  .aquire(TOPIC, () => {
    for (let i = 0; i < 10000; i++);
    return 100;
  })
  .then(res => console.log("resolve 1: ", res));

mutex
  .aquire(TOPIC, () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  })
  .then(res => console.log("resolve 2: ", res));
mutex
  .aquire(TOPIC, () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  })
  .then(res => console.log("resolve 3: ", res));

mutex
  .aquire(TOPIC, () => {
    return 20;
  })
  .then(res => console.log("resolve 4: ", res));
