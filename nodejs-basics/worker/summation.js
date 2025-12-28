import { parentPort, workerData } from 'worker_threads'

const n = workerData.n

let sum = 0

for (i = 0; i < n; i++){
  sum += i
}

parentPort.postMessage(sum)