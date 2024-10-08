import axios from 'axios';
import { showAlert } from './alerts';
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.status === 200) {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    if (res.status === 200) {
      location.assign('/');
      setTimeout(() => {
        //making a delay to assign the location properly
        location.reload(true);
      }, 1000);
    }
  } catch (err) {
    showAlert('error', 'something went wrong, Please try again.');
  }
};
