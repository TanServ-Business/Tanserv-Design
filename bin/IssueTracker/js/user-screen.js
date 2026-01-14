(() => {
  const form = document.getElementById('onboarding-form');
  const modal = document.getElementById('wa-modal');
  const rolloutBtn = document.getElementById('rollout-btn');
  const proceedBtn = document.getElementById('proceed-btn');
  const status = document.getElementById('rollout-status');
  let lastFocus = null;

  function openModal() {
    if (!modal) return;
    if (status) status.textContent = '';
    lastFocus = document.activeElement;
    modal.classList.remove('is-hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    const focusTarget = rolloutBtn || proceedBtn || modal.querySelector('.modal');
    if (focusTarget) focusTarget.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('is-hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      openModal();
    });
  }

  if (rolloutBtn) {
    rolloutBtn.addEventListener('click', () => {
      closeModal();
      if (status) {
        status.textContent = 'WhatsApp updates are disabled. You can change this later in settings.';
      }
    });
  }

  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && !modal.classList.contains('is-hidden')) {
      closeModal();
    }
  });
})();
