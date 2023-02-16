import { performance } from "perf_hooks";
import { Mutex } from "../lib";
import { recursiveFind } from "./recursive-search";
import path from "path";

const mutex = new Mutex();

const start = performance.now();
let counter = 0;
// const rootPath = path.resolve("tests", "files");
const rootPath = "/mnt/DATA/11-CV,APPLICATIONS AND MORE";
recursiveFind(rootPath, "Hello", 5, mutex, (err, files) => {
  const delay = performance.now() - start;
  console.log("Error: ", err);
  console.log("Files: ", files);
  console.log("Delay: ", delay);
}).on("new_file", () => {
  console.log("New file found: ", ++counter);
});

const TOPIC = "TOPIC";
mutex.setMaxConcurrentTaskForTopic(TOPIC, 20);

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

console.log("This is the first");
