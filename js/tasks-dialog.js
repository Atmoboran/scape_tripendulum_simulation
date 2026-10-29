// Tasks as a pop-up, the same shape as in the other SCAPE° exhibits: a
// full-width "Aufgaben" button with the progress on its right end, opening a
// modal with a numbered list. Items check themselves off while the visitor
// plays; the solved line under an item appears once it is done.
//   const tasks = SCAPE.taskDialog('tp-tasks');  tasks.done('id') → true once
(() => {
  const S = (window.SCAPE = window.SCAPE || {});
  S.taskDialog = (boxId) => {
    const tasks = S.tasks(document.getElementById(boxId));
    const dialog = document.getElementById('tasks-dialog');
    const openBtn = document.getElementById('tasks-open');
    const closeBtn = document.getElementById('tasks-close');
    const progress = document.getElementById('tasks-progress');
    const items = [...dialog.querySelectorAll('.quiz-item')];

    // The button carries the progress, so it says how far along the visitor
    // is without being opened.
    const update = () => {
      const done = items.filter((li) => li.classList.contains('done')).length;
      progress.textContent = t('tasks.progress', done, items.length);
      openBtn.classList.toggle('active', done === items.length);
    };
    update();

    // A click on the dimmed backdrop closes it, Esc does it for free.
    openBtn.addEventListener('click', () => {
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    });
    const close = () => { if (dialog.close) dialog.close(); else dialog.removeAttribute('open'); };
    closeBtn.addEventListener('click', close);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });

    // A freshly solved task makes the button blink once, so the visitor
    // notices it without a message over the picture.
    const done = (id) => {
      if (!tasks.done(id)) return false;
      update();
      openBtn.classList.remove('solved');
      void openBtn.offsetWidth;
      openBtn.classList.add('solved');
      return true;
    };
    return { done, isDone: tasks.isDone, reset() { tasks.reset(); update(); } };
  };
})();
