import http from 'http'

http.createServer((req, res) => {
  console.log(req.url)
  res.write("Hello World")
  res.end()
}).listen(3000)

console.log(`server lisitening on http://localhost:${3000}`)