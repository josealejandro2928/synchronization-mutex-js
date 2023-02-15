/* eslint-disable @typescript-eslint/no-explicit-any */
import path from "path";
import fs from "fs";
import EventEmitter from "events";
import { Mutex } from "../lib/index";

function readDDir(dir: string) {
  return new Promise((res, rej) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        return rej(err);
      }
      res(files);
    });
  });
}

function readFile(dir: string) {
  return new Promise((res, rej) => {
    fs.readFile(dir, { encoding: "utf-8" }, (err, data) => {
      if (err) {
        return rej(err);
      }
      res(data);
    });
  });
}

export function recursiveFind(
  dir: string,
  key = "",
  maxDeepLevel = 4,
  mutex: Mutex,
  done: (err: any, data: any) => any
) {
  const event = new EventEmitter();
  if (!fs.statSync(dir).isDirectory()) return done(null, [dir]);
  mutex.setMaxQueueSizeForTopic("TOPIC", 100000);
  mutex.setMaxConcurrentTaskForTopic("TOPIC", 25);

  deepTraverse(dir, key, maxDeepLevel).then(
    (res: any) => {
      done(null, res);
    },
    (err: any) => {
      done(err, null);
    }
  );
  return event;

  async function deepTraverse(dir: string, key: string, level: number): Promise<Array<string>> {
    if (level == 0) return [];
    const data: string[] = [];
    try {
      const files: string[] = (await readDDir(dir)) as string[];
      const promiseSubDir: Array<Promise<Array<string>>> = [];
      for (const file of files) {
        const fullFile = path.join(dir, file);
        promiseSubDir.push(deepTraverse(fullFile, key, level - 1));
      }
      return Promise.all(promiseSubDir).then(resultSubDir => {
        resultSubDir.map(subFiles => data.push(...subFiles));
        return data;
      });
    } catch (e: any) {
      if (e.code != "ENOTDIR") return [];
      return mutex.aquire("TOPIC", () => analyzeFile(dir, key), { timeout: 60000 });
    }
  }

  async function analyzeFile(file: any, key: any) {
    try {
      let data = "";
      data = (await readFile(file)) as string;
      if (!data.match(key)) return [];
      event.emit("new_file", dir);
      return [file];
    } catch (e) {
      return [];
    }
  }
}
