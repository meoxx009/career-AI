const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

document.querySelectorAll('[data-toast]').forEach((button) => {
  button.addEventListener('click', () => showToast(button.dataset.toast));
});

['demoButton', 'startButton', 'footerStart'].forEach((id) => {
  document.querySelector(`#${id}`)?.addEventListener('click', () => {
    document.querySelector('#paths')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Synthetic Rahul demo opened — no real student data used.');
  });
});

document.querySelectorAll('.task-action').forEach((button) => {
  button.addEventListener('click', () => {
    const row = button.closest('.week-row');
    const ring = row?.querySelector('.status-ring');
    if (ring && button.textContent.includes('Mark')) {
      ring.classList.remove('empty');
      button.textContent = 'Task complete';
      showToast('Saved in the fictional demo roadmap.');
    } else {
      showToast(button.dataset.toast || 'This is a preview interaction.');
    }
  });
});
