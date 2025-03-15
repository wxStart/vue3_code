const queue = [];

let isFlushing = false;

const resolvePromise = Promise.resolve();

// 如果同时在一个组件里面跟新多个状态 job肯定是同一个
// 开启一个异步任务去执行队列里面的人物
export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    resolvePromise.then(() => {
      isFlushing = false;
      const copy = queue.slice(0);
      queue.length = 0;
      copy.forEach((job) => {
        job();
      });
      copy.length = 0;
    });
  }
}
