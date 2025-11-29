const form = document.getElementById('char-form');
const errorBox = document.getElementById('error');

function setCharError(msg) {
  if (!msg) {
    errorBox.style.display = 'none';
    errorBox.innerText = '';
    return;
  }
  errorBox.style.display = 'block';
  errorBox.innerText = msg;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const first = document.getElementById('first-name').value.trim();
  const last = document.getElementById('last-name').value.trim();
  if (first.length < 2 || last.length < 2) return setCharError('Имя и фамилия недопустимы.');
  setCharError('');
  mp.trigger('ui:char:createSubmit', first, last);
});

window.setCharError = setCharError;
window.prefillName = (login) => {
  if (login) document.getElementById('first-name').value = login;
};
