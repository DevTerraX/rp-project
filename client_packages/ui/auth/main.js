const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const errorBox = document.getElementById('error');

function switchTab(tab) {
  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  } else {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
  }
  setAuthError('');
}

tabLogin.onclick = () => switchTab('login');
tabRegister.onclick = () => switchTab('register');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const login = document.getElementById('login-login').value.trim();
  const pass = document.getElementById('login-pass').value;
  mp.trigger('ui:auth:loginSubmit', login, pass);
});

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const login = document.getElementById('reg-login').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  mp.trigger('ui:auth:registerSubmit', login, pass, pass2);
});

window.setAuthError = (msg) => {
  if (!msg) {
    errorBox.style.display = 'none';
    errorBox.innerText = '';
    return;
  }
  errorBox.style.display = 'block';
  errorBox.innerText = msg;
};

window.prefillLogin = (login) => {
  document.getElementById('login-login').value = login || '';
  document.getElementById('reg-login').value = login || '';
};

// default state
switchTab('login');
