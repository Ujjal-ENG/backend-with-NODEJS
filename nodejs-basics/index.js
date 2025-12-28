import http from 'http'
import queryString from 'querystring'
import url from 'url'

http.createServer((req, res) => {

  res.write("Your request is being processed.... \n")
  const query = url.parse(req.url).query
  const n = Number(queryString.parse(query)['n'])
  findSum(n, (sum) => {
   res.end(`The sum is: ${sum} \n`)
 })
  
}).listen(3000, () => {
  console.log(`Server is listening on http://localhost:${3000}`)
})


function findSum(n, sumCallBack) {
  let sum = 0;
  function add(i, cb) {
    sum += i
    if (i == n) {
      return cb(sum)
    }
    setImmediate(add.bind(null,i+1,cb))
  }

  add(1,sumCallBack)
}