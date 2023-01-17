onmessage = async e => {
  console.log('Worker: Message received from main script');

  const res = await fetch('/api/math', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(e.data)
  });

  const result = await res.text();

  if (isNaN(+result)) {
    postMessage('Please write two numbers');
  } else {
    console.log('Worker: Posting message back to main script');
    postMessage(+result);
  }
};
