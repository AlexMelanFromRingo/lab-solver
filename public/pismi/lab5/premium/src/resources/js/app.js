import './bootstrap';

import Alpine from 'alpinejs';
import Swal from 'sweetalert2';

window.Alpine = Alpine;
window.Swal = Swal;

Alpine.start();

// Підтвердження видалення запису діалогом SweetAlert2.
// Кольори діалогу беруться з CSS-змінних сторінки (--accent, --dialog-bg,
// --dialog-ink), тому він збігається з оформленням сайту.
window.confirmDelete = function (form, name) {
    const css = getComputedStyle(document.documentElement);
    const pick = (variable, fallback) => css.getPropertyValue(variable).trim() || fallback;

    // Назву запису вставляємо як текст, а не як HTML
    const body = document.createElement('div');
    const title = document.createElement('b');
    title.textContent = name;
    body.append('Буде видалено ', title, '. Відновити запис не вийде.');

    Swal.fire({
        title: 'Видалити запис?',
        html: body,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Так, видалити',
        cancelButtonText: 'Скасувати',
        confirmButtonColor: pick('--accent', '#db2777'),
        background: pick('--dialog-bg', '#ffffff'),
        color: pick('--dialog-ink', '#545454'),
    }).then((result) => {
        if (result.isConfirmed) {
            form.submit();
        }
    });
};
