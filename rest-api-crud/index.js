import bodyParser from "body-parser";
import express from "express";

const app = express()

const PORT = 5000;


app.unsubscribe(bodyParser.json())


app.listen(PORT, () => {
  console.log("server is running on 5000")
})