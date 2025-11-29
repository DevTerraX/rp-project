const chat = document.getElementById('chat');

window.pushMessage = (type, text) => {
  const div = document.createElement('div');
  div.className = `msg ${type}`;
  div.innerText = text;
  chat.prepend(div);
  setTimeout(() => div.remove(), 5500);
};
