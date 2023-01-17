const first = document.querySelector('#number1');
const second = document.querySelector('#number2');
const sumWebWorkerBtn = document.querySelector('#sum-web-worker');
const sumSharedWorkerBtn = document.querySelector('#sum-shared-worker');
const avgWebWorkerBtn = document.querySelector('#avg-web-worker');

const result = document.querySelector('.result');

if (window.Worker) {
  const worker = new Worker('/web-worker.js');
  const complexWorker = new Worker('/complex-web-worker.js');
  const messageHandler = e => {
    result.textContent = `Result: ${e.data}`;
    console.log('Message received from worker');
  };

  sumWebWorkerBtn.onclick = e => {
    e.preventDefault();
    worker.postMessage({
      op: 'sum',
      args: [+first.value, +second.value]
    });
    console.log('Message posted to web worker');
  };
  avgWebWorkerBtn.onclick = e => {
    e.preventDefault();
    complexWorker.postMessage([+first.value, +second.value]);
    console.log('Message posted to web worker');
  };

  worker.onmessage = messageHandler;
  complexWorker.onmessage = messageHandler;
} else {
  console.log("Your browser doesn't support web workers.");
}

if (window.SharedWorker) {
  const worker = new SharedWorker('/shared-worker.js');

  const messageHandler = e => {
    result.textContent = `Result: ${e.data}`;
    console.log('Message received from shared worker');
  };

  sumSharedWorkerBtn.onclick = e => {
    e.preventDefault();
    worker.port.postMessage({
      op: 'sum',
      args: [+first.value, +second.value]
    });
    console.log('Message posted to shared worker');
  };

  worker.port.onmessage = messageHandler;
} else {
  console.log("Your browser doesn't support shared workers.");
}
