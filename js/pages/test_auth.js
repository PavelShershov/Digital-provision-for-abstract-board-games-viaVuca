const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('testId');

    if (!testId) {
        document.getElementById('errorMsg').innerText = 'Неверная ссылка. Обратитесь к организатору.';
        document.getElementById('startTestBtn').disabled = true;
    }

    document.getElementById('startTestBtn').addEventListener('click', async () => {
        const name = document.getElementById('studentName').value.trim();
        const email = document.getElementById('studentEmail').value.trim();

        if (!name || !email) {
            document.getElementById('errorMsg').innerText = 'Заполните все поля';
            return;
        }

        const btn = document.getElementById('startTestBtn');
        const originalText = btn.innerText;

        btn.innerHTML = '<span class="loader"></span> Загрузка...';
        btn.disabled = true;

        try {
            const studentId = 'student_' + Math.random().toString(36).substr(2, 8);

            await registerStudent(testId, studentId, name, email);

            sessionStorage.setItem('testId', testId);
            sessionStorage.setItem('studentId', studentId);
            sessionStorage.setItem('studentName', name);

            window.location.href = `turnir.html?testId=${testId}&studentId=${studentId}`;
        } catch (error) {
            document.getElementById('errorMsg').innerText = error.message || 'Ошибка регистрации. Попробуйте ещё раз.';
            btn.innerHTML = originalText;
            btn.disabled = false;
            console.error(error);
        }
    });

    document.getElementById('studentName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('startTestBtn').click();
    });

    document.getElementById('studentEmail').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('startTestBtn').click();
    });
