import cpuInfo from 'cpu-info';
import fs from 'fs';
const cpu = cpuInfo.cpuInfo();
const cpuInfo = {
  brand: cpu.brand(),
  model: cpu.model(),
  speed: cpu.speed(),
  // ... other properties
};
(() => {
  try {
    const fileName = 'cpuInfo.txt';
    if (fs.existsSync(fileName)) {
      const readableStream = fs.createReadStream(fileName);
      readableStream.on('data', (chunk) => {
        console.log(chunk.toString());
      });
    } else {
      const writeStream = fs.createWriteStream(fileName);
      writeStream.write(JSON.stringify(cpuInfo));
      writeStream.end();
    }
  } catch (err) {
    console.log(err);
  }
})();