const SCRIPT_URL = 'https://viavuca-api-proxy.pavlus-uncle.workers.dev/';


async function readJsonResponse(response, fallbackMessage) {
    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        console.error('Не удалось разобрать JSON:', error);
        throw new Error(fallbackMessage || 'Ошибка ответа сервера');
    }

    return data;
}

function normalizeConfigFromServer(value) {
    if (!value) return null;

    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn('config пришёл строкой, но JSON не разобран:', error);
            return null;
        }
    }

    if (typeof value === 'object') {
        return value;
    }

    return null;
}

function getOrganizerMetaFromStorage() {
    const login = sessionStorage.getItem('organizerLogin') || localStorage.getItem('organizerLogin') || '';
    const email = sessionStorage.getItem('organizerEmail') || login;
    const name = sessionStorage.getItem('organizerName') || '';
    const role = sessionStorage.getItem('organizerRole') || 'organizer';
    const organizerId = sessionStorage.getItem('organizerId') || '';

    return {
        organizerId,
        organizerLogin: login,
        organizerEmail: email,
        organizerName: name,
        organizerRole: role
    };
}

function buildParticipantTestUrl(testId) {
    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'test_auth.html';
    return `${baseUrl}?testId=${encodeURIComponent(testId)}`;
}

function saveOrganizerProfileToStorage(profile) {
    if (!profile) return;

    sessionStorage.setItem('organizerAuth', 'true');

    if (profile.organizerId) sessionStorage.setItem('organizerId', profile.organizerId);
    if (profile.login) sessionStorage.setItem('organizerLogin', profile.login);
    if (profile.email) sessionStorage.setItem('organizerEmail', profile.email);
    if (profile.name) sessionStorage.setItem('organizerName', profile.name);
    if (profile.role) sessionStorage.setItem('organizerRole', profile.role);
}


async function saveTestToCloud(testId, config) {
    const organizer = getOrganizerMetaFromStorage();
    const testUrl = config?.testUrl || buildParticipantTestUrl(testId);

    const enrichedConfig = {
        ...(config || {}),
        testUrl,
        organizerId: config?.organizerId || organizer.organizerId,
        organizerLogin: config?.organizerLogin || organizer.organizerLogin,
        organizerEmail: config?.organizerEmail || organizer.organizerEmail,
        organizerName: config?.organizerName || organizer.organizerName,
        organizerRole: config?.organizerRole || organizer.organizerRole,
        createdBy: {
            organizerId: config?.createdBy?.organizerId || organizer.organizerId,
            login: config?.createdBy?.login || organizer.organizerLogin,
            email: config?.createdBy?.email || organizer.organizerEmail,
            name: config?.createdBy?.name || organizer.organizerName,
            role: config?.createdBy?.role || organizer.organizerRole
        }
    };

    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'createTest',
            testId,
            config: enrichedConfig,
            testUrl,
            organizerId: organizer.organizerId,
            organizerLogin: organizer.organizerLogin,
            organizerEmail: organizer.organizerEmail,
            organizerName: organizer.organizerName,
            organizerRole: organizer.organizerRole
        })
    });

    const data = await readJsonResponse(response, 'Ошибка создания теста');

    if (!data.success) {
        throw new Error(data.error || 'Ошибка создания теста');
    }

    return data;
}

async function loadTestConfig(testId, studentId = '') {
    const params = new URLSearchParams();
    params.set('testId', testId);

    if (studentId) {
        params.set('studentId', studentId);
    }

    const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
    const data = await readJsonResponse(response, 'Ошибка загрузки теста');

    if (!data.success) {
        throw new Error(data.error || 'Тест не найден');
    }

    return {
        config: normalizeConfigFromServer(data.config),
        session: data.session || null
    };
}


async function loadOrganizerTournamentLinks(organizerLogin = '') {
    const organizer = getOrganizerMetaFromStorage();
    const login = organizerLogin || organizer.organizerLogin || organizer.organizerEmail || '';

    const params = new URLSearchParams();
    params.set('action', 'loadTournamentLinks');
    params.set('organizerLogin', login);

    const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
    const data = await readJsonResponse(response, 'Ошибка загрузки турнирных ссылок');

    if (!data.success) {
        throw new Error(data.error || 'Ошибка загрузки турнирных ссылок');
    }

    return Array.isArray(data.links) ? data.links : [];
}

async function loadTournamentLinks(organizerLogin = '') {
    return loadOrganizerTournamentLinks(organizerLogin);
}


async function registerStudent(testId, studentId, name, email) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'registerStudent',
            testId,
            studentId,
            name,
            email
        })
    });

    const data = await readJsonResponse(response, 'Ошибка регистрации ученика');

    if (!data.success) {
        throw new Error(data.error || 'Ошибка регистрации ученика');
    }

    return data;
}

async function saveStudentAnswer(testId, studentId, questionIndex, answer, isCorrect) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'saveAnswer',
            testId,
            studentId,
            questionIndex,
            taskIndex: questionIndex,
            answer,
            isCorrect,
            correct: isCorrect
        })
    });

    const data = await readJsonResponse(response, 'Ошибка сохранения ответа');

    if (!data.success) {
        throw new Error(data.error || 'Ошибка сохранения ответа');
    }

    return data;
}

async function saveStudentSession(testId, studentId, sessionData) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'saveSession',
            testId,
            studentId,
            sessionData,
            session: sessionData
        })
    });

    const data = await readJsonResponse(response, 'Ошибка сохранения сессии');

    if (!data.success) {
        throw new Error(data.error || 'Ошибка сохранения сессии');
    }

    return data;
}

async function saveStudentFinalResult(testId, studentId, finalResult) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'saveFinalResult',
            testId,
            studentId,
            finalResult,
            result: finalResult,
            correctCount: finalResult?.correctCount,
            totalTasks: finalResult?.totalTasks,
            percent: finalResult?.percent,
            scoreEnabled: finalResult?.scoreEnabled,
            score: finalResult?.score,
            maxScore: finalResult?.maxScore
        })
    });

    const data = await readJsonResponse(response, 'Ошибка сохранения итогового результата');

    if (!data.success) {
        throw new Error(data.error || 'Ошибка сохранения итогового результата');
    }

    return data;
}

async function saveFinalResult(testId, studentId, finalResult) {
    return saveStudentFinalResult(testId, studentId, finalResult);
}


async function checkOrganizer(login, password) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'checkOrganizer',
            login,
            password
        })
    });

    const data = await readJsonResponse(response, 'Ошибка проверки организатора');

    if (data.error && data.valid !== false) {
        console.error('Ошибка checkOrganizer:', data.error);
        throw new Error(data.error);
    }

    if (data.valid === true && data.profile) {
        saveOrganizerProfileToStorage(data.profile);
    }

    return data.valid === true;
}

async function getOrganizerProfile(login) {
    if (!login) {
        throw new Error('Логин организатора не передан');
    }

    const params = new URLSearchParams();
    params.set('action', 'getOrganizerProfile');
    params.set('login', login);

    const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
    const data = await readJsonResponse(response, 'Ошибка загрузки профиля');

    if (!data.success) {
        throw new Error(data.error || 'Профиль организатора не найден');
    }

    if (data.profile) {
        saveOrganizerProfileToStorage(data.profile);
    }

    return data.profile || null;
}

async function sendLoginCode(email) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'sendLoginCode',
            email
        })
    });

    const data = await readJsonResponse(response, 'Ошибка отправки кода');

    if (data.error) {
        console.error('Ошибка sendLoginCode:', data.error);

        return {
            success: false,
            error: data.error
        };
    }

    return data;
}

async function verifyLoginCode(email, code) {
    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'verifyLoginCode',
            email,
            code
        })
    });

    const data = await readJsonResponse(response, 'Ошибка проверки кода');

    if (data.error && data.valid !== false) {
        console.error('Ошибка verifyLoginCode:', data.error);
        throw new Error(data.error);
    }

    if (data.valid === true) {
        if (data.profile) {
            saveOrganizerProfileToStorage(data.profile);
        } else if (data.login) {
            sessionStorage.setItem('organizerAuth', 'true');
            sessionStorage.setItem('organizerLogin', data.login);
        } else {
            sessionStorage.setItem('organizerAuth', 'true');
            sessionStorage.setItem('organizerLogin', email);
        }
    }

    return data.valid === true;
}


window.saveTestToCloud = saveTestToCloud;
window.loadTestConfig = loadTestConfig;
window.loadOrganizerTournamentLinks = loadOrganizerTournamentLinks;
window.loadTournamentLinks = loadTournamentLinks;
window.registerStudent = registerStudent;
window.saveStudentAnswer = saveStudentAnswer;
window.saveStudentSession = saveStudentSession;
window.saveStudentFinalResult = saveStudentFinalResult;
window.saveFinalResult = saveFinalResult;
window.checkOrganizer = checkOrganizer;
window.getOrganizerProfile = getOrganizerProfile;
window.sendLoginCode = sendLoginCode;
window.verifyLoginCode = verifyLoginCode;
