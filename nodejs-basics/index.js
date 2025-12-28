const startTime = process.hrtime();
for (let i = 0; i < 1e6; i++) {
  // Simulate some work
  Math.sqrt(i);
}
const endTime = process.hrtime(startTime);
console.log(`Execution time: ${endTime[0]}s ${endTime[1] / 1e6}ms`);