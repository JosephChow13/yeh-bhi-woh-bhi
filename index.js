const cluster = require('cluster');
const process = require("process");

function startApp(opts = {}) {
  if(cluster.isMaster) {
    const os = require('os');
    for (var i = 0; i < (opts.workers || 4); i++) {
      cluster.fork();
    }
    cluster.on('exit', function(worker, code, signal) {
      console.error('worker ' + worker.process.pid + ' died');
      cluster.fork();
    });
  } else {
    const app = require("./app");
    new Promise((resolve) => app.listen(opts.port || 3000, () => console.log('Yeh Bhi Woh Bhi on port 3000!')))
      .catch(function(e) {
        const sleep = require("sleep-promise");
        console.error("Worker died - Aborting", {stack: e.stack});
        return new Promise((resolve) => resolve(cluster.worker.disconnect()))
          .then(() => sleep(opts.sleep || 250))
          .then(() => process.exit());
      });
  }
}

startApp()
