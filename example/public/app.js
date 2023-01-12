const username = document.querySelector('input[name=username]');
const password = document.querySelector('input[name=password]');
const error = document.querySelector('.error');
const form = document.querySelector('form');

window.Login = {
  redirect(str) {
    window.location.pathname = str;
  },
  async onResponse(res) {
    if (!res.ok) {
      await Login.onError(null, res);
    } else {
      await Login.onSuccess(res);
    }
  },
  async onSuccess(res) {
    const data = await res.json();
    const redirect = data.redirect ?? '/dashboard';

    Login.redirect(redirect);
  },
  async onError(err, res = {}) {
    let text;
    const { status } = res;

    // if we have a validation problem
    if (status === 422) {
      // pluck out the error from the JSON
      const json = await res.json();
      text = json && json.error;
    } else {
      // we don't know what went wrong with the server
      text = ['An error occurred:', status, err].join(' ');
    }

    // fill it in
    error.innerHTML = text;
  }
};

form.addEventListener('submit', async e => {
  // don't actually submit the form
  e.preventDefault();

  try {
    // post some JSON
    const res = await fetch('/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    });

    await Login.onResponse(res);
  } catch (err) {
    await Login.onError(err);
  }
});
