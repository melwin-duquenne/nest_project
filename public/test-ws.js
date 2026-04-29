let socket;

function log(msg) {
  const li = document.createElement('li');
  li.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  document.getElementById('events').prepend(li);
}

function connect() {
  const token = document.getElementById('token').value;
  socket = io('/notifications', { auth: { token } });
  socket.on('connect', function () { log('Connecté : ' + socket.id); });
  socket.on('disconnect', function () { log('Déconnecté'); });
  socket.on('task:assigned', function (data) { log('TÂCHE ASSIGNÉE : ' + JSON.stringify(data)); });
}

function joinProject() {
  const projectId = document.getElementById('projectId').value;
  socket.emit('join:project', projectId, function (ack) { log('Rejoint projet ' + ack.joined); });
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('btn-connect').addEventListener('click', connect);
  document.getElementById('btn-join').addEventListener('click', joinProject);
});
