let socket;

export function initializeSocket() {
  socket = io('http://localhost:3000');

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('serverChanges', (changes) => {
    console.log('Received changes from server:', changes);
    // Apply server changes
    handleServerChanges(changes);
  });
}

export function sendChangesToServer(changes) {
  console.log('Sending changes to server:', changes);
  socket.emit('clientChanges', changes);
}

function handleServerChanges(changes) {
  // Process and apply server changes
  console.log('Applying changes from server:', changes);
  // TODO: Implement the actual update logic
}