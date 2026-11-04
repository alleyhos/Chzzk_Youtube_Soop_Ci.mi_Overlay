(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const dialog = document.querySelector('#auth-dialog');
  const loginButton = document.querySelector('[data-auth-open]');
  const message = document.querySelector('#auth-message');
  const tabs = [...document.querySelectorAll('.auth-tab')];
  const forms = [...document.querySelectorAll('.auth-form')];
  const signedIn = document.querySelector('#auth-signed-in');
  const userName = document.querySelector('#auth-user-name');
  let currentUser = null;
  let activeMode = 'login';

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        nav.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', '메뉴 열기');
      }
    });
  }

  const setMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('is-visible', Boolean(text));
    message.classList.toggle('is-error', Boolean(text) && isError);
  };

  const setMode = (mode) => {
    activeMode = mode;
    setMessage('');
    tabs.forEach((tab) => {
      const active = tab.dataset.authMode === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    document.querySelector('.auth-tabs').hidden = !['login', 'signup'].includes(mode) || Boolean(currentUser);
    forms.forEach((form) => { form.hidden = form.dataset.formMode !== mode || (Boolean(currentUser) && !['delete', 'reset', 'verify'].includes(mode)); });
  };

  const openDialog = () => {
    if (!dialog) return;
    setMode(currentUser ? 'login' : activeMode);
    dialog.showModal();
  };

  const paintUser = (user, preserveMessage = false) => {
    const previousMessage = message.textContent;
    const previousError = message.classList.contains('is-error');
    currentUser = user || null;
    loginButton.textContent = currentUser ? currentUser.name : '로그인';
    loginButton.setAttribute('aria-label', currentUser ? `${currentUser.name} 계정` : '로그인');
    signedIn.hidden = !currentUser;
    userName.textContent = currentUser ? currentUser.name : '';
    document.querySelector('.auth-welcome h2').textContent = currentUser ? '반가워요.' : '다시 만나요.';
    document.querySelector('.auth-welcome > p:last-child').textContent = currentUser ? '계정이 안전하게 연결되어 있습니다.' : '계정으로 로그인하거나 새로 가입하세요.';
    setMode(activeMode);
    if (preserveMessage && previousMessage) setMessage(previousMessage, previousError);
  };

  const request = async (path, payload) => {
    const response = await fetch(path, {
      method: payload ? 'POST' : 'GET',
      credentials: 'same-origin',
      headers: payload ? { 'content-type': 'application/json' } : {},
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    return data;
  };

  loginButton?.addEventListener('click', openDialog);
  document.querySelectorAll('[data-auth-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  document.querySelectorAll('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.authMode)));
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener('close', () => loginButton?.focus());

  const submit = async (form, path, payload, successText, nextMode = null) => {
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    setMessage('잠시만 기다려 주세요.');
    try {
      const data = await request(path, payload);
      if (data.user) paintUser(data.user);
      if (nextMode) setMode(nextMode);
      setMessage(data.message || successText);
      if (data.user) window.setTimeout(() => dialog.close(), 650);
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  };

  document.querySelector('#login-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submit(form, '/api/auth/login', { email: values.get('email'), password: values.get('password') }, '로그인되었습니다.');
  });
  document.querySelector('#signup-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submit(form, '/api/auth/register', { name: values.get('name'), email: values.get('email'), password: values.get('password'), passwordConfirm: values.get('passwordConfirm'), consent: values.get('consent') === 'on' }, '인증 메일을 보냈습니다. 이메일에서 가입을 완료해 주세요.');
  });
  document.querySelector('#forgot-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submit(form, '/api/auth/forgot-password', { email: values.get('email') }, '해당 주소로 계정이 있다면 재설정 메일을 보냈습니다.');
  });
  document.querySelector('#resend-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submit(form, '/api/auth/resend-verification', { email: values.get('email') }, '인증이 필요한 계정이라면 메일을 보냈습니다.');
  });
  document.querySelector('#reset-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submit(form, '/api/auth/reset-password', { token: values.get('token'), password: values.get('password'), passwordConfirm: values.get('passwordConfirm') }, '비밀번호가 변경되었습니다. 로그인해 주세요.', 'login');
  });
  document.querySelector('#verify-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submit(form, '/api/auth/verify', { token: values.get('token') }, '이메일 인증이 완료되었습니다. 로그인해 주세요.', 'login');
  });
  document.querySelector('#auth-logout')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await request('/api/auth/logout', {});
      paintUser(null);
      setMessage('로그아웃했습니다.');
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
  document.querySelector('#delete-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!window.confirm('계정을 영구 삭제할까요?')) return;
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const values = new FormData(form);
    button.disabled = true;
    setMessage('계정을 삭제하고 있습니다.');
    try {
      await request('/api/auth/delete-account', { password: values.get('password') });
      paintUser(null);
      setMode('login');
      setMessage('계정과 저장된 로그인 정보가 삭제되었습니다.');
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  if (hashParams.has('reset')) {
    const resetForm = document.querySelector('#reset-form');
    resetForm.elements.token.value = hashParams.get('reset') || '';
    activeMode = 'reset';
    openDialog();
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  } else if (hashParams.has('verify')) {
    document.querySelector('#verify-form').elements.token.value = hashParams.get('verify') || '';
    activeMode = 'verify';
    openDialog();
    setMessage('이메일 인증을 완료하려면 아래 버튼을 눌러 주세요.');
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  }

  request('/api/auth/session').then((data) => paintUser(data.user, true)).catch(() => paintUser(null, true));
})();
