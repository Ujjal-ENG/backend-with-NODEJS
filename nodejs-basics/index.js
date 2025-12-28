import http from 'http'
import queryString from 'querystring'
import url from 'url'
import { Worker } from 'worker_threads'

http.createServer(async(req, res) => {

  res.write("Your request is being processed.... \n")
  const query = url.parse(req.url).query
  const n = Number(queryString.parse(query)['n'])
  const sum = await findSum(n)
  res.end(`This numbers: ${n}, sum = ${sum}`)
}).listen(3000, () => {
  console.log(`Server is listening on http://localhost:${3000}`)
})



function findSum(n) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker/summation.js', { workerData: { n } })
    
    worker.on('message', (data) => {
      resolve(data)
    })
    worker.on('error', reject)
  })
}