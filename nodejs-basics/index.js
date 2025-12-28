import fs from 'fs';
import os from 'os';
const cpuInfo = os.cpus()

fs.writeFile('cpu.txt', JSON.stringify(cpuInfo), () => {
  if (err) {
    console.log(err)
  }
})
