const button = document.querySelector('button');
const evtSource = new EventSource('/api/events');
const eventList = document.querySelector('ul');

evtSource.onopen = () => {
  console.log('Connection to server opened.');
};

evtSource.onmessage = e => {
  const newElement = document.createElement('li');

  newElement.textContent = `message: ${e.data}`;
  eventList.appendChild(newElement);
};

evtSource.onerror = () => {
  console.log('EventSource failed.');
};

button.onclick = () => {
  console.log('Connection closed');
  evtSource.close();
};
