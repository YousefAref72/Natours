// This file is mainly responsible for getting data outa the web page
import '@babel/polyfill';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';


const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');
const bookingBtn = document.getElementById('book-tour');

loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});

updateDataForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData();

  form.append('name',document.getElementById('name').value);
  form.append('email',document.getElementById('email').value);
  form.append('photo',document.getElementById('photo').files[0]);

  updateSettings(form, 'data');
});

updatePasswordForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  document.querySelector('.btn--save-password').textContent = 'Updating...';
  const currentPassword = document.getElementById('password-current').value;
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('password-confirm').value;
  await updateSettings(
    { currentPassword, password, passwordConfirm },
    'password',
  );
  document.querySelector('.btn--save-password').textContent = 'save password';

  document.getElementById('password-current').value = '';
  document.getElementById('password').value = '';
  document.getElementById('password-confirm').value = '';
});
logoutBtn?.addEventListener('click', logout);

bookingBtn?.addEventListener('click',e=>{
  e.target.textContent = 'Processing...';
  const {tourId} = e.target.dataset;
  bookTour(tourId);
})