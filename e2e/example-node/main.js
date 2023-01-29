/* eslint-disable @typescript-eslint/no-var-requires */
const { Mutex } = require("synchronization-mutex-js")

const mutex = new Mutex();

class CounterState {
  #counter = 0;
  getCounter() {
    return this.#counter;
  }


  async setCounter(val) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.#counter = val;
        resolve(val);
      }, 0)
    })
  }
}




async function main() {

  let counterState = new CounterState();

  async function updateCounter() {
    await counterState.setCounter(counterState.getCounter() + 1);
  }

  Promise.all([
    updateCounter(),
    updateCounter(),
    updateCounter()
  ]).then(() => {
    console.log("Global counter state: ", counterState.getCounter());
  }).catch((error) => {
    console.log("error: ", error)
  })

  const topic = "UPDATE_COUNTER_STATE"
  Promise.all([
    mutex.aquire(topic, updateCounter),
    mutex.aquire(topic, updateCounter),
    mutex.aquire(topic, updateCounter),
  ]).then(() => {
    console.log("Global counter state: ", counterState.getCounter());
  }).catch((error) => {
    console.log("error: ", error)
  })

}

main();
