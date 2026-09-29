/**
 * «Системне програмне забезпечення» — программы лабораторных работ по
 * вариантам. ЛР 1–4 (Unix, C, gcc) собраны и прогнаны gcc на каждом
 * варианте; ЛР 5–8 написаны под QNX Neutrino 6.5 (файлы .cxx, как в
 * методичке: gcc file.cxx -lstdc++) — в QNX они здесь не запускались.
 */

// ------------------------------------------------------------- ЛР 1

export const LAB1_TASKS = [
  "Замінити всі входження символу a на b. Значення a, b вводяться із клавіатури.",
  "Знайти кількість елементів, кратних двом.",
  "Знайти кількість нулів.",
  "Знайти суму всіх елементів масиву, не рівних одиниці.",
  "Знайти середнє арифметичне максимального та мінімального елементів масиву.",
  "Знайти кількість \"0\" між символами a, b, значення яких користувач вводить з клавіатури.",
  "Поміняти місцями мінімальний та максимальний елементи.",
  "Перевірити масив на симетричність.",
  "Рядок та підрядок задані як масиви типу char. Знайти початок (позицію) входження підрядка в рядок.",
  "Виконати циклічний зсув у масиві на задану кількість позицій.",
];

const INT_INPUT = `    int a[MAXN], n;

    printf("Кількість елементів (1..%d): ", MAXN);
    if (scanf("%d", &n) != 1 || n < 1 || n > MAXN) {
        printf("Неправильна кількість елементів\\n");
        return 1;
    }
    printf("Елементи масиву через пропуск: ");
    for (int i = 0; i < n; i++)
        if (scanf("%d", &a[i]) != 1) {
            printf("Неправильне число\\n");
            return 1;
        }
`;

const PRINT_FN = `
static void print_array(const char *title, const int *a, int n)
{
    printf("%s", title);
    for (int i = 0; i < n; i++)
        printf(" %d", a[i]);
    printf("\\n");
}
`;

const READ_LINE_FN = `
/* Зчитує рядок з клавіатури у масив char без символу переведення рядка. */
static int read_line(const char *prompt, char *s, int size)
{
    printf("%s", prompt);
    if (fgets(s, size, stdin) == NULL)
        return -1;
    s[strcspn(s, "\\n")] = '\\0';
    return 0;
}
`;

const LAB1_BODY: Record<number, { includes: string; helpers: string; body: string }> = {
  1: {
    includes: "#include <stdio.h>\n#include <string.h>",
    helpers: READ_LINE_FN,
    body: `    char s[MAXN + 2], a, b;
    int replaced = 0;

    if (read_line("Масив символів: ", s, sizeof s) != 0)
        return 1;
    printf("Символ a і символ b через пропуск: ");
    if (scanf(" %c %c", &a, &b) != 2) {
        printf("Потрібно ввести два символи\\n");
        return 1;
    }
    for (int i = 0; s[i] != '\\0'; i++)
        if (s[i] == a) {
            s[i] = b;
            replaced++;
        }
    printf("Результат: %s\\n", s);
    printf("Замінено символів: %d\\n", replaced);
`,
  },
  2: {
    includes: "#include <stdio.h>",
    helpers: "",
    body: `${INT_INPUT}
    int count = 0;
    for (int i = 0; i < n; i++)
        if (a[i] % 2 == 0)
            count++;
    printf("Кількість елементів, кратних двом: %d\\n", count);
`,
  },
  3: {
    includes: "#include <stdio.h>",
    helpers: "",
    body: `${INT_INPUT}
    int count = 0;
    for (int i = 0; i < n; i++)
        if (a[i] == 0)
            count++;
    printf("Кількість нулів: %d\\n", count);
`,
  },
  4: {
    includes: "#include <stdio.h>",
    helpers: "",
    body: `${INT_INPUT}
    long sum = 0;
    for (int i = 0; i < n; i++)
        if (a[i] != 1)
            sum += a[i];
    printf("Сума елементів, не рівних одиниці: %ld\\n", sum);
`,
  },
  5: {
    includes: "#include <stdio.h>",
    helpers: "",
    body: `${INT_INPUT}
    int min = a[0], max = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] < min)
            min = a[i];
        if (a[i] > max)
            max = a[i];
    }
    printf("max = %d, min = %d\\n", max, min);
    printf("Середнє арифметичне max і min: %.2f\\n", (max + min) / 2.0);
`,
  },
  6: {
    includes: "#include <stdio.h>\n#include <string.h>",
    helpers: READ_LINE_FN,
    body: `    char s[MAXN + 2], a, b;

    if (read_line("Масив символів: ", s, sizeof s) != 0)
        return 1;
    printf("Символ a і символ b через пропуск: ");
    if (scanf(" %c %c", &a, &b) != 2) {
        printf("Потрібно ввести два символи\\n");
        return 1;
    }
    /* перші входження a і b; рахуємо '0' строго між ними */
    char *pa = strchr(s, a), *pb = strchr(s, b);
    if (pa == NULL || pb == NULL) {
        printf("Символу %c немає в масиві\\n", pa == NULL ? a : b);
        return 1;
    }
    char *from = pa < pb ? pa : pb, *to = pa < pb ? pb : pa;
    int count = 0;
    for (char *p = from + 1; p < to; p++)
        if (*p == '0')
            count++;
    printf("Кількість \\"0\\" між '%c' (позиція %d) і '%c' (позиція %d): %d\\n",
           a, (int)(pa - s) + 1, b, (int)(pb - s) + 1, count);
`,
  },
  7: {
    includes: "#include <stdio.h>",
    helpers: PRINT_FN,
    body: `${INT_INPUT}
    int imin = 0, imax = 0;
    for (int i = 1; i < n; i++) {
        if (a[i] < a[imin])
            imin = i;
        if (a[i] > a[imax])
            imax = i;
    }
    print_array("Було:", a, n);
    int t = a[imin];
    a[imin] = a[imax];
    a[imax] = t;
    printf("min = %d (позиція %d), max = %d (позиція %d)\\n", a[imax], imin + 1, a[imin], imax + 1);
    print_array("Стало:", a, n);
`,
  },
  8: {
    includes: "#include <stdio.h>",
    helpers: "",
    body: `${INT_INPUT}
    int symmetric = 1;
    for (int i = 0; i < n / 2; i++)
        if (a[i] != a[n - 1 - i]) {
            symmetric = 0;
            break;
        }
    printf(symmetric ? "Масив симетричний\\n" : "Масив не симетричний\\n");
`,
  },
  9: {
    includes: "#include <stdio.h>\n#include <string.h>",
    helpers: READ_LINE_FN,
    body: `    char s[MAXN + 2], sub[MAXN + 2];

    if (read_line("Рядок: ", s, sizeof s) != 0 || read_line("Підрядок: ", sub, sizeof sub) != 0)
        return 1;
    int n = (int)strlen(s), m = (int)strlen(sub), pos = -1;
    /* порівнюємо підрядок з кожною позицією рядка */
    for (int i = 0; m > 0 && i + m <= n && pos < 0; i++) {
        int j = 0;
        while (j < m && s[i + j] == sub[j])
            j++;
        if (j == m)
            pos = i;
    }
    if (pos < 0)
        printf("Підрядок не входить у рядок\\n");
    else
        printf("Підрядок починається з позиції %d (індекс %d)\\n", pos + 1, pos);
`,
  },
  10: {
    includes: "#include <stdio.h>",
    helpers: PRINT_FN,
    body: `${INT_INPUT}
    int k, b[MAXN];
    printf("Зсув на k позицій (k > 0 — вправо, k < 0 — вліво): ");
    if (scanf("%d", &k) != 1) {
        printf("Неправильне число\\n");
        return 1;
    }
    int s = ((k % n) + n) % n;
    for (int i = 0; i < n; i++)
        b[(i + s) % n] = a[i];
    print_array("Було:", a, n);
    print_array("Стало:", b, n);
`,
  },
};

export function lab1Program(v: number): string {
  const p = LAB1_BODY[v];
  return `/* ЛР 1, варіант ${v}: ${LAB1_TASKS[v - 1]}
   Компіляція: gcc lab1.c -o lab1   Запуск: ./lab1 */
${p.includes}

#define MAXN 100
${p.helpers}
int main(void)
{
${p.body}    return 0;
}
`;
}

// ------------------------------------------------------------- ЛР 2

export const LAB2_TASKS = [
  "Визначити кількість слів, виходячи з того, що між словами є лише один пробіл. Результат вивести на екран.",
  "Підрахувати кількість цифр. Результат вивести на екран.",
  "У тексті замінити всі пунктуаційні знаки крапкою. Результат вивести на екран.",
  "Перевірити наявність у тексті заданого слова. Результат вивести на екран у вигляді повідомлення «Є/Немає».",
  "Знайти кількість рядків у файлі, які починаються із зазначеного символу. Результат записати у попередньо створений файл.",
  "Знайти найдовший рядок. Результат записати у попередньо створений файл.",
  "Замінити всі входження заданого слова А на Б. Результат записати у попередньо створений файл.",
  "Записати в існуючий файл усі перші слова рядків зчитаного файлу.",
];

/** Варианты 5–8 пишут результат в отдельный, заранее созданный файл. */
export const lab2WritesFile = (v: number) => v >= 5;

const LAB2_COMMON = `#define MAXLENGTH 2048                /* початковий розмір буфера */
#define PUNCT ",:;()-?!"               /* розділові знаки, крім крапки (перелік — з ЛР 7) */

/* Вводить рядок з клавіатури (без символу переведення рядка). */
static int ask(const char *prompt, char *buf, int size)
{
    printf("%s", prompt);
    fflush(stdout);
    if (fgets(buf, size, stdin) == NULL)
        return -1;
    buf[strcspn(buf, "\\n")] = '\\0';
    return 0;
}

/* Зчитує файл повністю примітивами open/read/close. */
static char *read_file(const char *name)
{
    int fd = open(name, O_RDONLY);
    if (fd < 0) {
        perror(name);
        return NULL;
    }
    size_t size = 0, cap = MAXLENGTH;
    char *text = malloc(cap + 1);
    ssize_t got = 0;
    while (text != NULL && (got = read(fd, text + size, cap - size)) > 0) {
        size += (size_t)got;
        if (size == cap) {
            char *bigger = realloc(text, 2 * cap + 1);
            if (bigger == NULL)
                free(text);
            text = bigger;
            cap *= 2;
        }
    }
    close(fd);
    if (text == NULL || got < 0) {
        fprintf(stderr, "Помилка читання файлу %s\\n", name);
        free(text);
        return NULL;
    }
    text[size] = '\\0';
    return text;
}
`;

const WRITE_RESULT = (flags: string, what: string) => `
/* Записує результат у ${what} (O_CREAT не вказано: файлу немає — помилка). */
static int write_result(const char *name, const char *data, size_t len)
{
    int fd = open(name, ${flags});
    if (fd < 0) {
        perror(name);
        return -1;
    }
    ssize_t put = write(fd, data, len);
    close(fd);
    if (put != (ssize_t)len) {
        fprintf(stderr, "Помилка запису у файл %s\\n", name);
        return -1;
    }
    printf("Результат записано у файл %s\\n", name);
    return 0;
}
`;

const IS_SEP = `
/* Роздільник слів: пропуск, табуляція, переведення рядка. */
static int is_space(char c)
{
    return c == ' ' || c == '\\t' || c == '\\n' || c == '\\r';
}
`;

const IS_WORD_SEP = `${IS_SEP}
/* Межа слова: пропуск або розділовий знак. */
static int is_sep(char c)
{
    return is_space(c) || c == '.' || (c != '\\0' && strchr(PUNCT, c) != NULL);
}
`;

const LAB2_PROCESS: Record<number, { helpers: string; body: string }> = {
  1: {
    helpers: IS_SEP,
    body: `    /* слово починається там, де не-пропуск стоїть після пропуску або на початку */
    int words = 0;
    char prev = ' ';
    for (const char *p = text; *p != '\\0'; p++) {
        if (!is_space(*p) && is_space(prev))
            words++;
        prev = *p;
    }
    printf("Кількість слів: %d\\n", words);
    return 0;`,
  },
  2: {
    helpers: "",
    body: `    int digits = 0;
    for (const char *p = text; *p != '\\0'; p++)
        if (*p >= '0' && *p <= '9')
            digits++;
    printf("Кількість цифр: %d\\n", digits);
    return 0;`,
  },
  3: {
    helpers: "",
    body: `    for (char *p = text; *p != '\\0'; p++)
        if (strchr(PUNCT, *p) != NULL)
            *p = '.';
    printf("Текст після заміни:\\n");
    fflush(stdout);
    if (write(STDOUT_FILENO, text, strlen(text)) < 0)
        perror("write");
    return 0;`,
  },
  4: {
    helpers: IS_WORD_SEP,
    body: `    char word[256];
    if (ask("Слово для пошуку: ", word, sizeof word) != 0 || word[0] == '\\0')
        return 1;
    size_t len = strlen(word);
    int found = 0;
    /* порівнюємо лише цілі слова: перед і після збігу — межа слова */
    for (const char *p = text; *p != '\\0' && !found; p++)
        if ((p == text || is_sep(p[-1])) && strncmp(p, word, len) == 0 && is_sep(p[len]))
            found = 1;
    printf(found ? "Є\\n" : "Немає\\n");
    return 0;`,
  },
  5: {
    helpers: WRITE_RESULT("O_WRONLY | O_TRUNC", "попередньо створений файл"),
    body: `    char sym[16], out_name[256], out[128];
    if (ask("Символ: ", sym, sizeof sym) != 0 || sym[0] == '\\0')
        return 1;
    if (ask("Файл для результату (створений заздалегідь): ", out_name, sizeof out_name) != 0)
        return 1;
    int lines = 0;
    for (const char *p = text; *p != '\\0'; p++)
        if ((p == text || p[-1] == '\\n') && *p == sym[0])
            lines++;
    int len = snprintf(out, sizeof out, "Рядків, що починаються з '%c': %d\\n", sym[0], lines);
    printf("%s", out);
    return write_result(out_name, out, (size_t)len) == 0 ? 0 : 1;`,
  },
  6: {
    helpers: WRITE_RESULT("O_WRONLY | O_TRUNC", "попередньо створений файл"),
    body: `    char out_name[256];
    if (ask("Файл для результату (створений заздалегідь): ", out_name, sizeof out_name) != 0)
        return 1;
    const char *best = text, *line = text;
    size_t best_len = 0;
    while (*line != '\\0') {
        size_t len = strcspn(line, "\\n");
        if (len > best_len) {           /* при рівній довжині лишається перший */
            best = line;
            best_len = len;
        }
        line += len;
        if (*line == '\\n')
            line++;
    }
    printf("Найдовший рядок (%zu симв.): %.*s\\n", best_len, (int)best_len, best);
    char *out = malloc(best_len + 1);
    if (out == NULL)
        return 1;
    memcpy(out, best, best_len);
    out[best_len] = '\\n';
    int rc = write_result(out_name, out, best_len + 1);
    free(out);
    return rc == 0 ? 0 : 1;`,
  },
  7: {
    helpers: `${IS_WORD_SEP}${WRITE_RESULT("O_WRONLY | O_TRUNC", "попередньо створений файл")}`,
    body: `    char a[256], b[256], out_name[256];
    if (ask("Слово А: ", a, sizeof a) != 0 || a[0] == '\\0' || ask("Слово Б: ", b, sizeof b) != 0)
        return 1;
    if (ask("Файл для результату (створений заздалегідь): ", out_name, sizeof out_name) != 0)
        return 1;
    size_t la = strlen(a), lb = strlen(b), n = strlen(text);
    char *out = malloc(n / la * lb + n + 1);  /* з запасом на найгірший випадок */
    if (out == NULL)
        return 1;
    size_t k = 0;
    int count = 0;
    for (const char *p = text; *p != '\\0';) {
        if ((p == text || is_sep(p[-1])) && strncmp(p, a, la) == 0 && is_sep(p[la])) {
            memcpy(out + k, b, lb);
            k += lb;
            p += la;
            count++;
        } else
            out[k++] = *p++;
    }
    printf("Замінено входжень: %d\\n", count);
    int rc = write_result(out_name, out, k);
    free(out);
    return rc == 0 ? 0 : 1;`,
  },
  8: {
    helpers: `${IS_SEP}${WRITE_RESULT("O_WRONLY | O_APPEND", "існуючий файл — дописуємо в кінець")}`,
    body: `    char out_name[256];
    if (ask("Існуючий файл для запису: ", out_name, sizeof out_name) != 0)
        return 1;
    char *out = malloc(strlen(text) + 2);
    if (out == NULL)
        return 1;
    size_t k = 0;
    for (const char *line = text; line != NULL && *line != '\\0'; ) {
        const char *p = line;
        while (*p == ' ' || *p == '\\t')
            p++;
        size_t len = 0;
        while (p[len] != '\\0' && !is_space(p[len]))   /* перше слово рядка */
            len++;
        if (len > 0) {
            memcpy(out + k, p, len);
            k += len;
            out[k++] = '\\n';
        }
        line = strchr(line, '\\n');
        if (line != NULL)
            line++;
    }
    printf("Перші слова рядків:\\n%.*s", (int)k, out);
    int rc = write_result(out_name, out, k);
    free(out);
    return rc == 0 ? 0 : 1;`,
  },
};

/** Функция задания ЛР 2 — общая для ЛР 2 и ЛР 4 (её вызывает дочерний процесс). */
function lab2Task(v: number) {
  const p = LAB2_PROCESS[v];
  return `${LAB2_COMMON}${p.helpers}
/* Варіант ${v}: ${LAB2_TASKS[v - 1]} */
static int process(char *text)
{
${p.body}
}

/* Завдання ЛР 2: ім'я файлу вводиться з клавіатури. */
static int lab2_task(void)
{
    char name[256];
    if (ask("Ім'я файлу: ", name, sizeof name) != 0)
        return 1;
    char *text = read_file(name);
    if (text == NULL)
        return 1;
    int rc = process(text);
    free(text);
    return rc;
}
`;
}

const LAB2_INCLUDES = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>`;

export function lab2Program(v: number): string {
  return `/* ЛР 2, варіант ${v}. Файл читається примітивами open/read/close,
   результат ${lab2WritesFile(v) ? "пишеться примітивами open/write/close" : "виводиться на екран"}.
   Компіляція: gcc lab2.c -o lab2   Запуск: ./lab2 */
${LAB2_INCLUDES}

${lab2Task(v)}
int main(void)
{
    return lab2_task();
}
`;
}

// ------------------------------------------------------------- ЛР 3

export function lab3Program(): string {
  return `/* ЛР 3: програма ЛР 2 (./lab2) виконується як породжений процес —
   fork, exec, wait, exit.
   Компіляція: gcc lab3.c -o lab3   Запуск: ./lab3 (lab2 — у тому ж каталозі) */
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void)
{
    pid_t pid = fork();
    if (pid < 0) {
        perror("fork");
        exit(1);
    }
    if (pid == 0) {
        /* нащадок: замінює свій образ програмою ЛР 2 */
        execl("./lab2", "lab2", (char *)NULL);
        perror("execl ./lab2");   /* сюди потрапляємо лише при помилці exec */
        exit(127);
    }
    printf("Батько (PID %d): породжено нащадка, PID %d\\n", getpid(), pid);
    fflush(stdout);
    int status;
    pid_t done = wait(&status);   /* чекаємо завершення нащадка */
    if (done < 0) {
        perror("wait");
        exit(1);
    }
    if (WIFEXITED(status))
        printf("Нащадок PID %d завершився з кодом %d\\n", done, WEXITSTATUS(status));
    else if (WIFSIGNALED(status))
        printf("Нащадок PID %d завершено сигналом %d\\n", done, WTERMSIG(status));
    exit(0);
}
`;
}

// ------------------------------------------------------------- ЛР 4

export function lab4Program(v: number): string {
  return `/* ЛР 4: процеси взаємодіють сигналами SIGUSR1 і SIGUSR2.
   Перший нащадок виконує завдання ЛР 2 (варіант ${v}), другий — власну дію.
   Компіляція: gcc lab4.c -o lab4   Запуск: ./lab4 */
${LAB2_INCLUDES}
#include <signal.h>
#include <time.h>
#include <sys/types.h>
#include <sys/wait.h>

${lab2Task(v)}
static volatile sig_atomic_t got_usr1 = 0, got_usr2 = 0;

/* Обробник сигналів користувача: повідомлення + прапорець для «слухача».
   У обробнику — лише write(), вона безпечна для сигналів. */
static void on_signal(int sig)
{
    static const char m1[] = "Батько: отримано SIGUSR1 — нащадок виконав завдання ЛР 2\\n";
    static const char m2[] = "Батько: отримано SIGUSR2 — другий нащадок завершив свою дію\\n";
    if (sig == SIGUSR1)
        got_usr1 = 1;
    else
        got_usr2 = 1;
    const char *m = sig == SIGUSR1 ? m1 : m2;
    size_t len = sig == SIGUSR1 ? sizeof m1 - 1 : sizeof m2 - 1;
    ssize_t put = write(STDOUT_FILENO, m, len);
    (void)put;                        /* помилку виводу з обробника нікуди повідомити */
}

int main(void)
{
    struct sigaction sa;
    sa.sa_handler = on_signal;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    sigaction(SIGUSR1, &sa, NULL);
    sigaction(SIGUSR2, &sa, NULL);

    /* блокуємо сигнали до початку очікування: сигнал, що прийшов раніше,
       не загубиться, а дочекається sigsuspend() */
    sigset_t block, wait_mask;
    sigemptyset(&block);
    sigaddset(&block, SIGUSR1);
    sigaddset(&block, SIGUSR2);
    sigprocmask(SIG_BLOCK, &block, &wait_mask);

    printf("Батько (PID %d): запускаю нащадка із завданням ЛР 2\\n", getpid());
    fflush(stdout);
    pid_t first = fork();
    if (first < 0) {
        perror("fork");
        return 1;
    }
    if (first == 0) {
        int rc = lab2_task();
        fflush(stdout);                  /* спершу вивід, потім сигнал */
        kill(getppid(), SIGUSR1);        /* сповіщаємо батька */
        exit(rc);
    }
    while (!got_usr1)                    /* «слухач» */
        sigsuspend(&wait_mask);

    fflush(stdout);
    pid_t second = fork();
    if (second < 0) {
        perror("fork");
        return 1;
    }
    if (second == 0) {
        time_t now = time(NULL);
        printf("Другий нащадок (PID %d): поточні дата й час — %s", getpid(), ctime(&now));
        long sum = 0;
        for (long i = 1; i <= 1000000; i++)
            sum += i;
        printf("Другий нащадок: сума чисел 1..1000000 = %ld\\n", sum);
        fflush(stdout);
        kill(getppid(), SIGUSR2);
        exit(0);
    }
    while (!got_usr2)
        sigsuspend(&wait_mask);

    int status;
    waitpid(first, &status, 0);
    printf("Нащадок PID %d завершився з кодом %d\\n", first, WIFEXITED(status) ? WEXITSTATUS(status) : -1);
    waitpid(second, &status, 0);
    printf("Нащадок PID %d завершився з кодом %d\\n", second, WIFEXITED(status) ? WEXITSTATUS(status) : -1);
    printf("Батько: обидва сигнали отримано, завершую роботу\\n");
    return 0;
}
`;
}

// ------------------------------------------------------------- ЛР 5

/** Таблица 2: варианты попарно, одна строка на пару. Ключи — uname в QNX 6.5. */
export const LAB5_UNAME: { task: string; flag: string; label: string }[] = [
  { task: "Вивести тип поточної апаратної платформи", flag: "-m", label: "Hardware platform" },
  { task: "Вивести тип даної системи", flag: "-s", label: "System type" },
  { task: "Вивести ім'я даної системи", flag: "-n", label: "System (node) name" },
  { task: "Вивести тип процесорної архітектури машини", flag: "-p", label: "Processor architecture" },
  { task: "Вивести поточний рівень релізу операційної системи", flag: "-r", label: "OS release level" },
  { task: "Вивести назву реалізації операційної системи", flag: "-s", label: "OS implementation name" },
  { task: "Вивести рівень версії даного релізу операційної системи", flag: "-v", label: "OS version level" },
];

export function lab5Program(v: number): string {
  const row = LAB5_UNAME[Math.floor((v - 1) / 2)];
  const cmd = `uname ${row.flag}`;
  if (v % 2 === 1)
    return `// ЛР 5, варіант ${v}: ${row.task} — функція system()
// Компіляція: gcc lab5.cxx -lstdc++ -o lab5   Запуск: ./lab5
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv)
{
    printf("${row.label}: ");
    fflush(stdout);                  // інакше текст з'явиться після виводу команди
    int rc = system("${cmd}");  // команда виконується командним інтерпретатором
    if (rc == -1) {
        perror("system");
        return 1;
    }
    return 0;
}
`;
  return `// ЛР 5, варіант ${v}: ${row.task} — функції popen()/pclose()
// Компіляція: gcc lab5.cxx -lstdc++ -o lab5   Запуск: ./lab5
#include <stdio.h>

int main(int argc, char **argv)
{
    char line[256];
    FILE *p = popen("${cmd}", "r");  // вивід команди читаємо як файл
    if (p == NULL) {
        perror("popen");
        return 1;
    }
    while (fgets(line, sizeof(line), p) != NULL)
        printf("${row.label}: %s", line);
    if (pclose(p) == -1) {
        perror("pclose");
        return 1;
    }
    return 0;
}
`;
}

/** Таблица 3: команда скрипта и меняет ли он сам файл. */
export const LAB5_SCRIPTS: { task: string; cmd: string; edits: boolean }[] = [
  { task: "Вивести вміст файла на стандартний пристрій виводу", cmd: `cat "$1"`, edits: false },
  {
    task: "Вивести вміст файла на стандартний пристрій виводу в зворотному порядку",
    cmd: `# tac є в таблиці 1, але в довіднику утиліт QNX 6.5 його немає — тоді sed
tac "$1" 2>/dev/null || sed -n '1!G;h;$p' "$1"`,
    edits: false,
  },
  { task: "Видалити перший рядок з файла", cmd: `sed -i '1d' "$1"`, edits: true },
  { task: "Відобразити та вивести на стандартний пристрій виводу рядки файла, що починаються з ABC", cmd: `grep '^ABC' "$1"`, edits: false },
  { task: "Відобразити та вивести на стандартний пристрій виводу рядки файла, що містять ABC", cmd: `grep 'ABC' "$1"`, edits: false },
  { task: "Відобразити та вивести на стандартний пристрій виводу рядки файла, що містять цифри", cmd: `grep '[0-9]' "$1"`, edits: false },
  { task: "Видалити порожні рядки з файла", cmd: `sed -i '/^$/d' "$1"`, edits: true },
  { task: "Видалити перший рядок з файла", cmd: `sed -i '1d' "$1"`, edits: true },
  { task: "Замінити рядки ABC на CBA", cmd: `sed -i 's/ABC/CBA/g' "$1"`, edits: true },
  { task: "Вивести сьомий рядок з файлу", cmd: `sed -n '7p;7q' "$1"`, edits: false },
];

export function lab5Script(v: number): string {
  const s = LAB5_SCRIPTS[v - 1];
  return `#!/bin/sh
# ЛР 5, скрипт, варіант ${v}: ${s.task}
# Запуск: chmod +rx lab5.sh; ./lab5.sh example.txt
if [ $# -ne 1 ]; then
    echo "Usage: $0 file"
    exit 1
fi
if [ ! -f "$1" ]; then
    echo "No such file: $1"
    exit 1
fi
${s.cmd}${s.edits ? `\necho "File $1 after the script:"\ncat "$1"` : ""}
`;
}

// ------------------------------------------------------------- ЛР 6

export function lab6Program(): string {
  return `// ЛР 6: інверсія пріоритетів і їх наслідування (QNX Neutrino).
// Програма методички з виправленнями; ключ -d додає до кожного кроку
// статичний і поточний пріоритет потоку — вивід «2[13:13]», як у прикладі.
// Компіляція: gcc lab6.cxx -lstdc++ -o lab6
// Запуск: ./lab6, ./lab6 -m, ./lab6 -s (з -d — з пріоритетами, -t 5 — 10^5 повторів)
#include <stdlib.h>
#include <stdio.h>
#include <iostream>
#include <string.h>
#include <unistd.h>
#include <stdint.h>
#include <pthread.h>
#include <semaphore.h>
#include <sched.h>
#include <time.h>
#include <math.h>
using namespace std;

const int THRNUM = 3, NCKL = 10, LINOUT = 5, BUFLEN = THRNUM * NCKL + 1;

// Робота потоку: навантаження на процесор
inline void workfun(long n) {
    for (long i = 0; i < n; i++) {
        volatile double f = sqrt(1. + sqrt((double)rand()));
        (void)f;
    }
}

char buf[BUFLEN];
int prio[BUFLEN][2];                  // [статичний, поточний] пріоритет на кожному кроці
volatile unsigned ind = 0, nfin = 0;
long nrep = 1000;
bool bmutex = false, bsemaphore = false, bdebug = false;
static pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
static sem_t semaphore, semfinal;

// Потоки 0 і 2 захоплюють спільний ресурс (м'ютекс або семафор), потік 1 — ні
void *thrfunc(void *p) {
    int t = (int)(intptr_t)p;
    if (t != 1) {
        if (bmutex) pthread_mutex_lock(&mutex);
        if (bsemaphore) sem_wait(&semaphore);
    }
    struct timespec tv;
    tv.tv_sec = 0;
    tv.tv_nsec = 1000000L;            // 1 мс: даємо стартувати решті потоків
    nanosleep(&tv, NULL);
    for (int i = 0; i < NCKL; i++) {
        if (bdebug) {
            struct sched_param param;
            int policy;
            pthread_getschedparam(pthread_self(), &policy, &param);
            prio[ind][0] = param.sched_priority;      // заданий (статичний)
#ifdef __QNXNTO__
            prio[ind][1] = param.sched_curpriority;   // поточний, з урахуванням наслідування
#else
            prio[ind][1] = param.sched_priority;
#endif
        }
        buf[ind++] = t + '0';
        workfun(nrep);
    }
    if (t != 1) {
        if (bmutex) pthread_mutex_unlock(&mutex);
        if (bsemaphore) sem_post(&semaphore);
    }
    if (++nfin == THRNUM) sem_post(&semfinal);
    return NULL;
}

int main(int argc, char *argv[]) {
    cout << "inverse test, QNX API, vers.1.05L" << endl;
    int c = 0;
    while ((c = getopt(argc, argv, "hmsdt:")) != -1)
        switch (c) {
        case 'h':
            cout << "\\t" << argv[0] << " [ h | { m | s } | d | t value ]" << endl;
            exit(EXIT_SUCCESS);
        case 'm': bmutex = true; break;
        case 's': bsemaphore = true; break;
        case 'd': bdebug = true; break;
        case 't':
            nrep = 1;
            for (int i = 0; i < atoi(optarg); i++) nrep *= 10;
            break;
        default: exit(EXIT_FAILURE);
        }
    sem_init(&semaphore, 0, 1);
    sem_init(&semfinal, 0, 0);          // до створення потоків: вони стартують одразу
    cout << "repeating number = " << nrep;
    if (bdebug) cout << ", debug level = 1";
    if (bmutex) cout << ", lock on mutex";
    if (bsemaphore) cout << ", lock on semaphore";
    cout << endl;

    struct sched_param param;
    int policy;
    pthread_getschedparam(pthread_self(), &policy, &param);
    for (int i = 0; i < THRNUM; i++) {
        pthread_attr_t attr;
        pthread_t tid;
        struct sched_param tparam = param;
        tparam.sched_priority = param.sched_priority + i + 1;   // 11, 12, 13 при батькові 10
        pthread_attr_init(&attr);
        pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
        pthread_attr_setinheritsched(&attr, PTHREAD_EXPLICIT_SCHED);
        pthread_attr_setschedpolicy(&attr, SCHED_RR);
        pthread_attr_setschedparam(&attr, &tparam);
        int err = pthread_create(&tid, &attr, &thrfunc, (void *)(intptr_t)i);
        pthread_attr_destroy(&attr);
        if (err != 0) {
            cerr << "pthread_create: " << strerror(err) << endl;
            exit(EXIT_FAILURE);
        }
    }
    sem_wait(&semfinal);
    buf[ind] = '\\0';
    if (!bdebug)
        cout << buf << endl;
    else
        for (unsigned i = 0; i < ind; i++)
            cout << buf[i] << "[" << prio[i][0] << ":" << prio[i][1] << "]"
                 << ((i + 1) % LINOUT == 0 || i + 1 == ind ? "\\n" : " ");
    exit(EXIT_SUCCESS);
}
`;
}

// ------------------------------------------------------------- ЛР 7

export const LAB7_TASKS = [
  "Видалення з рядка послідовностей з двох та більше пробілів",
  "Приведення символів рядка до нижнього регістру",
  "Запис символів рядка в зворотному порядку",
  "Знаходження кількості слів, коротших за перше",
  "Перевірка рядка на симетричність",
  "Знаходження кількості цифр",
  "Знаходження кількості розділових знаків (крапка, кома, двокрапка, крапка з комою, круглі дужки, тире, знак питання, знак оклику)",
  "Знаходження кількості символів латинського алфавіту",
  "Знаходження кількості слів, довжина яких не перевищує значення, переданого разом з рядком",
  "Перевірка чи збігається кількість відкритих і закритих круглих дужок у рядку",
];

type ReplyKind = "string" | "count" | "flag" | "pair";

const LAB7_SERVER: Record<number, { kind: ReplyKind; fn: string; clientOut: string }> = {
  1: {
    kind: "string",
    fn: `// Послідовність з двох і більше пропусків замінюється одним пропуском
void process(const char *in, char *out) {
    int k = 0;
    for (int i = 0; in[i]; i++)
        if (in[i] != ' ' || i == 0 || in[i - 1] != ' ') out[k++] = in[i];
    out[k] = '\\0';
}`,
    clientOut: `printf("Client thread: message <%s> has received\\n", reply);`,
  },
  2: {
    kind: "string",
    fn: `void process(const char *in, char *out) {
    int i = 0;
    for (; in[i]; i++) out[i] = tolower((unsigned char)in[i]);
    out[i] = '\\0';
}`,
    clientOut: `printf("Client thread: message <%s> has received\\n", reply);`,
  },
  3: {
    kind: "string",
    fn: `void process(const char *in, char *out) {
    int n = strlen(in);
    for (int i = 0; i < n; i++) out[i] = in[n - 1 - i];
    out[n] = '\\0';
}`,
    clientOut: `printf("Client thread: message <%s> has received\\n", reply);`,
  },
  4: {
    kind: "count",
    fn: `// Слова — послідовності символів між пропусками
int process(const char *s) {
    int first = -1, count = 0, i = 0;
    while (s[i]) {
        while (s[i] == ' ') i++;
        if (!s[i]) break;
        int len = 0;
        while (s[i] && s[i] != ' ') { i++; len++; }
        if (first < 0) first = len;
        else if (len < first) count++;
    }
    return count;
}`,
    clientOut: `printf("Client thread: message <Count of words shorter than the first: %d> has received\\n", reply);`,
  },
  5: {
    kind: "flag",
    fn: `// Рядок симетричний, якщо читається однаково з обох кінців
int process(const char *s) {
    int n = strlen(s);
    for (int i = 0; i < n / 2; i++)
        if (s[i] != s[n - 1 - i]) return 0;
    return 1;
}`,
    clientOut: `printf("Client thread: message <The string is %s> has received\\n", reply ? "symmetric" : "not symmetric");`,
  },
  6: {
    kind: "count",
    fn: `int process(const char *s) {
    int count = 0;
    for (int i = 0; s[i]; i++)
        if (isdigit((unsigned char)s[i])) count++;
    return count;
}`,
    clientOut: `printf("Client thread: message <Count of digits: %d> has received\\n", reply);`,
  },
  7: {
    kind: "count",
    fn: `// Розділові знаки з таблиці 1: . , : ; ( ) - ? !
int process(const char *s) {
    int count = 0;
    for (int i = 0; s[i]; i++)
        if (strchr(".,:;()-?!", s[i])) count++;
    return count;
}`,
    clientOut: `printf("Client thread: message <Count of punctuation marks: %d> has received\\n", reply);`,
  },
  8: {
    kind: "count",
    fn: `int process(const char *s) {
    int count = 0;
    for (int i = 0; s[i]; i++)
        if ((s[i] >= 'a' && s[i] <= 'z') || (s[i] >= 'A' && s[i] <= 'Z')) count++;
    return count;
}`,
    clientOut: `printf("Client thread: message <Count of Latin letters: %d> has received\\n", reply);`,
  },
  9: {
    kind: "count",
    fn: `// Слова — послідовності символів між пропусками
int process(const char *s, int limit) {
    int count = 0, i = 0;
    while (s[i]) {
        while (s[i] == ' ') i++;
        if (!s[i]) break;
        int len = 0;
        while (s[i] && s[i] != ' ') { i++; len++; }
        if (len <= limit) count++;
    }
    return count;
}`,
    clientOut: `printf("Client thread: message <Count of words not longer than %d: %d> has received\\n", msg.limit, reply);`,
  },
  10: {
    kind: "pair",
    fn: `// Порівнюється лише кількість «(» і «)», вкладеність не перевіряється
void process(const char *s, int *open, int *close) {
    *open = *close = 0;
    for (int i = 0; s[i]; i++) {
        if (s[i] == '(') ++*open;
        if (s[i] == ')') ++*close;
    }
}`,
    clientOut: `printf("Client thread: message <'(' - %d, ')' - %d: %s> has received\\n", reply[0], reply[1], reply[0] == reply[1] ? "counts match" : "counts differ");`,
  },
};

export function lab7Program(v: number): string {
  const s = LAB7_SERVER[v];
  const withLimit = v === 9;
  const replyDecl =
    s.kind === "string" ? "char reply[MSGLEN];" : s.kind === "pair" ? "int reply[2];" : "int reply = 0;";
  const serverWork =
    s.kind === "string"
      ? `char result[MSGLEN];
    process(receive_buf, result);
    MsgReply(rcvid, EOK, result, strlen(result) + 1);   // відповідь розблоковує клієнта`
      : s.kind === "pair"
        ? `int result[2];
    process(receive_buf, &result[0], &result[1]);
    MsgReply(rcvid, EOK, result, sizeof(result));`
        : withLimit
          ? `int k = process(msg.text, msg.limit);
    MsgReply(rcvid, EOK, &k, sizeof(k));`
          : `int k = process(receive_buf);
    MsgReply(rcvid, EOK, &k, sizeof(k));`;
  const receive = withLimit
    ? `request msg;                          // рядок разом із граничною довжиною слова
    int rcvid = MsgReceive(chid, &msg, sizeof(msg), NULL);
    if (rcvid == -1) {
        perror("MsgReceive");
        return NULL;
    }
    msg.text[MSGLEN - 1] = '\\0';
    printf("Server thread: message <%s>, limit %d has received\\n", msg.text, msg.limit);`
    : `char receive_buf[MSGLEN];               // буфер для прийому повідомлення
    int rcvid = MsgReceive(chid, receive_buf, sizeof(receive_buf), NULL);
    if (rcvid == -1) {
        perror("MsgReceive");
        return NULL;
    }
    receive_buf[MSGLEN - 1] = '\\0';
    printf("Server thread: message <%s> has received\\n", receive_buf);`;
  const send = withLimit
    ? `request msg;
    printf("Enter a string: ");
    fflush(stdout);
    if (fgets(msg.text, MSGLEN, stdin) == NULL) msg.text[0] = '\\0';
    msg.text[strcspn(msg.text, "\\n")] = '\\0';
    printf("Enter max word length: ");
    fflush(stdout);
    if (scanf("%d", &msg.limit) != 1) msg.limit = 0;
    int coid = ConnectAttach(0, getpid(), chid, _NTO_SIDE_CHANNEL, 0);   // 0 — ND_LOCAL_NODE
    if (coid == -1) {
        perror("ConnectAttach");
        return NULL;
    }
    ${replyDecl}
    if (MsgSend(coid, &msg, sizeof(msg), &reply, sizeof(reply)) == -1)   // SEND -> REPLY
        perror("MsgSend");
    else
        ${s.clientOut}`
    : `char send_buf[MSGLEN];                  // буфер для повідомлення
    printf("Enter a string: ");
    fflush(stdout);
    if (fgets(send_buf, sizeof(send_buf), stdin) == NULL) send_buf[0] = '\\0';
    send_buf[strcspn(send_buf, "\\n")] = '\\0';
    int coid = ConnectAttach(0, getpid(), chid, _NTO_SIDE_CHANNEL, 0);   // 0 — ND_LOCAL_NODE
    if (coid == -1) {
        perror("ConnectAttach");
        return NULL;
    }
    ${replyDecl}
    if (MsgSend(coid, send_buf, strlen(send_buf) + 1, ${s.kind === "count" || s.kind === "flag" ? "&reply" : "reply"}, sizeof(reply)) == -1)   // SEND -> REPLY
        perror("MsgSend");
    else
        ${s.clientOut}`;
  return `// ЛР 7, варіант ${v}: ${LAB7_TASKS[v - 1]}
// Клієнт і сервер — потоки одного процесу, як у прикладі методички.
// Компіляція: gcc lab7.cxx -lstdc++ -o lab7   Запуск: ./lab7
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <errno.h>
#include <pthread.h>
#include <unistd.h>
#include <sys/neutrino.h>

#define MSGLEN 256

int chid;                                  // ідентифікатор каналу сервера
${withLimit ? "\nstruct request {\n    int limit;\n    char text[MSGLEN];\n};\n" : ""}
${s.fn}

// Потік-сервер: RECEIVE -> обробка -> відповідь -> знову готовий
void *server(void *) {
    printf(".:SERVER:.\\n");
    ${receive}
    ${serverWork}
    return NULL;
}

// Потік-клієнт: зчитує рядок з клавіатури і надсилає серверу
void *client(void *) {
    printf(".:CLIENT:.\\n");
    ${send}
    ConnectDetach(coid);                     // знищення з'єднання
    return NULL;
}

int main() {
    pthread_t server_tid, client_tid;
    chid = ChannelCreate(0);                 // канал — до запуску потоків
    if (chid == -1) {
        perror("ChannelCreate");
        return 1;
    }
    pthread_create(&server_tid, NULL, &server, NULL);
    pthread_create(&client_tid, NULL, &client, NULL);
    pthread_join(client_tid, NULL);
    pthread_join(server_tid, NULL);
    ChannelDestroy(chid);                    // знищення каналу
    return 0;
}
`;
}

// ------------------------------------------------------------- ЛР 8

export const LAB8_TASKS = [
  "Відносний, одноразовий",
  "Абсолютний одноразовий з повідомленням сигналом",
  "Абсолютний одноразовий з повідомленням імпульсом",
  "Абсолютний одноразовий з повідомленням від запуску потоку",
  "Відносний періодичний",
  "Абсолютний періодичний з повідомленням сигналом",
];

const PULSE_HEAD = `#define MY_PULSE_CODE _PULSE_CODE_MINAVAIL

typedef union {
    struct _pulse pulse;
} my_message_t;
`;

const PULSE_SETUP = `    int chid = ChannelCreate(0);
    int coid = ConnectAttach(ND_LOCAL_NODE, 0, chid, _NTO_SIDE_CHANNEL, 0);
    SIGEV_PULSE_INIT(&event, coid, getprio(0), MY_PULSE_CODE, 0);   // сповіщення імпульсом
    timer_create(CLOCK_REALTIME, &event, &timer_id);`;

const PULSE_CLEANUP = `    timer_delete(timer_id);
    ConnectDetach(coid);
    ChannelDestroy(chid);`;

const SIGNAL_SETUP = `    struct sigaction act;                    // обробник сигналу SIGALRM
    act.sa_handler = on_alarm;
    sigemptyset(&act.sa_mask);
    act.sa_flags = 0;
    sigaction(SIGALRM, &act, NULL);
    sigset_t block, wait_mask;               // до sigsuspend() сигнал чекає в черзі
    sigemptyset(&block);
    sigaddset(&block, SIGALRM);
    sigprocmask(SIG_BLOCK, &block, &wait_mask);
    SIGEV_SIGNAL_INIT(&event, SIGALRM);      // сповіщення сигналом
    timer_create(CLOCK_REALTIME, &event, &timer_id);`;

const ABS_START = (delay: number) => `    struct timespec now;
    clock_gettime(CLOCK_REALTIME, &now);
    time_t when = now.tv_sec + ${delay};         // абсолютний момент: секунди від 01.01.1970
    itime.it_value.tv_sec = when;
    itime.it_value.tv_nsec = 0;`;

const LAB8_BODY: Record<number, { head: string; main: string }> = {
  1: {
    head: PULSE_HEAD,
    main: `${PULSE_SETUP}
    itime.it_value.tv_sec = 3;               // через 3 с від поточного моменту
    itime.it_value.tv_nsec = 0;
    itime.it_interval.tv_sec = 0;            // нульовий інтервал — таймер одноразовий
    itime.it_interval.tv_nsec = 0;
    stamp("Relative one-shot timer (3 s) started");
    timer_settime(timer_id, 0, &itime, NULL);   // 0 — відносний час
    // потік блокований у MsgReceive, доки таймер не надішле імпульс
    int rcvid = MsgReceive(chid, &msg, sizeof(msg), NULL);
    if (rcvid == 0 && msg.pulse.code == MY_PULSE_CODE)
        stamp("Pulse received");
${PULSE_CLEANUP}`,
  },
  2: {
    head: `volatile sig_atomic_t fired = 0;

void on_alarm(int signo) {
    fired = 1;
}
`,
    main: `${SIGNAL_SETUP}
${ABS_START(5)}
    itime.it_interval.tv_sec = 0;            // одноразовий
    itime.it_interval.tv_nsec = 0;
    printf("Absolute one-shot timer set to %s", ctime(&when));
    timer_settime(timer_id, TIMER_ABSTIME, &itime, NULL);
    while (!fired)
        sigsuspend(&wait_mask);
    stamp("Signal SIGALRM received");
    timer_delete(timer_id);`,
  },
  3: {
    head: PULSE_HEAD,
    main: `${PULSE_SETUP}
${ABS_START(5)}
    itime.it_interval.tv_sec = 0;            // одноразовий
    itime.it_interval.tv_nsec = 0;
    printf("Absolute one-shot timer set to %s", ctime(&when));
    timer_settime(timer_id, TIMER_ABSTIME, &itime, NULL);
    int rcvid = MsgReceive(chid, &msg, sizeof(msg), NULL);
    if (rcvid == 0 && msg.pulse.code == MY_PULSE_CODE)
        stamp("Pulse received");
${PULSE_CLEANUP}`,
  },
  4: {
    head: `sem_t done;

// Функція потоку, який створюється при спрацюванні таймера
void notify(union sigval value) {
    stamp("Thread started by the timer");
    sem_post(&done);
}
`,
    main: `    sem_init(&done, 0, 0);
    SIGEV_THREAD_INIT(&event, notify, NULL, NULL);   // сповіщення запуском потоку
    timer_create(CLOCK_REALTIME, &event, &timer_id);
${ABS_START(5)}
    itime.it_interval.tv_sec = 0;            // одноразовий
    itime.it_interval.tv_nsec = 0;
    printf("Absolute one-shot timer set to %s", ctime(&when));
    timer_settime(timer_id, TIMER_ABSTIME, &itime, NULL);
    sem_wait(&done);                         // головний потік чекає на потік таймера
    timer_delete(timer_id);`,
  },
  5: {
    head: PULSE_HEAD,
    main: `${PULSE_SETUP}
    itime.it_value.tv_sec = 1;               // перше спрацювання через 1 с
    itime.it_value.tv_nsec = 0;
    itime.it_interval.tv_sec = 2;            // далі кожні 2 с
    itime.it_interval.tv_nsec = 0;
    timer_settime(timer_id, 0, &itime, NULL);   // 0 — відносний час
    stamp("Relative periodic timer (1 s, then every 2 s) started");
    for (int tick = 1; tick <= 5; ) {
        int rcvid = MsgReceive(chid, &msg, sizeof(msg), NULL);
        if (rcvid == 0 && msg.pulse.code == MY_PULSE_CODE) {
            char what[32];
            sprintf(what, "Tick %d", tick++);
            stamp(what);
        }
    }
${PULSE_CLEANUP}`,
  },
  6: {
    head: `volatile sig_atomic_t ticks = 0;

void on_alarm(int signo) {
    ticks++;
}
`,
    main: `${SIGNAL_SETUP}
${ABS_START(3)}
    itime.it_interval.tv_sec = 1;            // далі кожну секунду
    itime.it_interval.tv_nsec = 0;
    printf("Absolute periodic timer: first tick at %s", ctime(&when));
    timer_settime(timer_id, TIMER_ABSTIME, &itime, NULL);
    for (int shown = 0; shown < 5; ) {
        sigsuspend(&wait_mask);
        while (shown < ticks && shown < 5) {
            char what[32];
            sprintf(what, "Signal %d received", ++shown);
            stamp(what);
        }
    }
    timer_delete(timer_id);`,
  },
};

export function lab8Program(v: number): string {
  const b = LAB8_BODY[v];
  const pulse = v === 1 || v === 3 || v === 5;
  const includes = [
    "#include <stdio.h>",
    "#include <stdlib.h>",
    "#include <time.h>",
    ...(pulse ? ["#include <sched.h>", "#include <sys/netmgr.h>", "#include <sys/neutrino.h>"] : []),
    "#include <signal.h>",
    "#include <sys/siginfo.h>",
    ...(v === 4 ? ["#include <pthread.h>", "#include <semaphore.h>"] : []),
  ];
  return `// ЛР 8, варіант ${v}: таймер — ${LAB8_TASKS[v - 1].toLowerCase()}
// Компіляція: gcc lab8.cxx -lstdc++ -o lab8   Запуск: ./lab8
${includes.join("\n")}

// Виводить повідомлення з поточним часом (до мілісекунд)
void stamp(const char *what) {
    struct timespec ts;
    char hms[16];
    clock_gettime(CLOCK_REALTIME, &ts);
    strftime(hms, sizeof(hms), "%H:%M:%S", localtime(&ts.tv_sec));
    printf("%s at %s.%03ld\\n", what, hms, ts.tv_nsec / 1000000);
}

${b.head}
int main() {
    struct sigevent event;
    struct itimerspec itime;
    timer_t timer_id;${pulse ? "\n    my_message_t msg;" : ""}

${b.main}
    return 0;
}
`;
}
