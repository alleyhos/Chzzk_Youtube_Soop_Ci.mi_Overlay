(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const form = document.querySelector('#contact-form');
  const result = document.querySelector('#contact-result');

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

  const showResult = (text, isError = false) => {
    result.textContent = text;
    result.classList.toggle('is-visible', Boolean(text));
    result.classList.toggle('is-error', Boolean(text) && isError);
  };

  const status = new URLSearchParams(location.search).get('contact');
  if (status === 'sent') showResult('문의가 전달됐습니다. 남겨 주신 이메일로 답변드릴게요.');
  if (status === 'error') showResult('문의 전송에 실패했습니다. 잠시 뒤 다시 시도해 주세요.', true);
  if (status) history.replaceState(null, '', `${location.pathname}${location.hash || '#contact'}`);

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type="submit"]');
    const values = new FormData(form);
    const payload = {
      name: values.get('name'),
      email: values.get('email'),
      topic: values.get('topic'),
      message: values.get('message'),
      consent: values.get('consent') === 'on',
      website: values.get('website'),
    };
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    showResult('문의 내용을 보내고 있습니다.');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'omit',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || '문의 전송에 실패했습니다. 잠시 뒤 다시 시도해 주세요.');
      form.reset();
      showResult(data.message || '문의가 전달됐습니다. 남겨 주신 이메일로 답변드릴게요.');
    } catch (error) {
      showResult(error.message || '문의 전송에 실패했습니다. 잠시 뒤 다시 시도해 주세요.', true);
    } finally {
      button.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
})();
