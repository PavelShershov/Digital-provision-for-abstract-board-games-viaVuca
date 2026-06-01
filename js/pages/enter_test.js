const enterBtn = document.getElementById('enterBtn');
    const testCodeInput = document.getElementById('testCode');
    const errorMsg = document.getElementById('errorMsg');

    async function checkTestIdExists(testId) {
        try {
            await loadTestConfig(testId);
            return true;
        } catch (e) {
            console.error('Тест не найден:', e);
            return false;
        }
    }

    enterBtn.addEventListener('click', async () => {
        let code = testCodeInput.value.trim();

        if (!code) {
            errorMsg.innerText = 'Введите код теста';
            return;
        }

        let testId = code;

        if (!code.startsWith('test_')) {
            testId = 'test_' + code;
        }

        errorMsg.innerText = '';
        enterBtn.disabled = true;
        enterBtn.innerHTML = '<span class="loader"></span> Проверка...';

        const exists = await checkTestIdExists(testId);

        if (exists) {
            window.location.href = `test_auth.html?testId=${encodeURIComponent(testId)}`;
        } else {
            errorMsg.innerText = `Тест с кодом "${testId}" не найден. Проверьте правильность ввода.`;
            enterBtn.disabled = false;
            enterBtn.innerText = 'Перейти к тесту';
        }
    });

    testCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enterBtn.click();
    });
