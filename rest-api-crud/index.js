import bodyParser from "body-parser";
import express from "express";

const app = express()
const PORT = 5000;
app.use(bodyParser.json())

app.get("/", (req, res) => {
  res.json({msg:"mama Kopa"})
})


app.listen(PORT, () => {
  console.log("server is running on 5000")
})