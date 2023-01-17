onmessage = async e => {
  console.log('Worker: Message received from main script');

  if (Worker) {
    const worker1 = new Worker('/web-worker.js');
    const worker2 = new Worker('/web-worker.js');

    worker1.onmessage = ({ data }) =>
      worker2.postMessage({
        op: 'divide',
        args: [data, e.data.length]
      });

    worker2.onmessage = ({ data }) => {
      if (isNaN(+data)) {
        postMessage('Please write two numbers');
      } else {
        console.log('Worker: Posting message back to main script');
        postMessage(+data);
      }
    };

    worker1.postMessage({
      op: 'sum',
      args: e.data
    });
  } else {
    console.log("Your browser doesn't support web workers.");
  }
};
