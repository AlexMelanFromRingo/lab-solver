import type { GuideModule } from "./types";

/**
 * Cisco CyberOps Associate, модуль 4 (операційна система Linux): лабораторні
 * 4.2.6, 4.2.7, 4.3.4, 4.4.4, 4.5.4. Методички писані під машину на Arch Linux, а
 * курс роздає Cybersecurity LabVM Workstation на Ubuntu 22.04 — команди ті самі,
 * але шляхи, версії й поведінка служб відрізняються; це зібрано в errata.
 */

const SRC = "Cisco CyberOps Associate (NetAcad)";
const UBUNTU = "Машина курсу — Cybersecurity LabVM Workstation (Ubuntu 22.04), а не Arch Linux з методички; користувач analyst, пароль sudo cyberops.";

export const CISCO_M4: GuideModule[] = [
  {
    slug: "cisco-4-2-6",
    intro:
      { uk: "Текстові редактори Linux: SciTE і nano, приховані конфігураційні файли в домашньому каталозі і в /etc, зміна кольору запрошення в .bashrc і nginx на іншому порту і каталозі.", ru: "Текстовые редакторы Linux: SciTE и nano, скрытые конфигурационные файлы в домашнем каталоге и в /etc, смена цвета приглашения в .bashrc и nginx на другом порту и каталоге." },
    guide: {
      source: `${SRC}, Lab 4.2.6 «Working with Text Files in the CLI»`,
      goals: ["Ознайомитися з графічним і консольним редакторами Linux.", "Знаходити й змінювати конфігураційні файли програм і служб."],
      steps: [
        { title: "SciTE", body: `Menu > CyberOps > SciTE Text Editor; набрати текст, зберегти як space.txt у домашньому каталозі, відкрити знову через File > Open (вибрати фільтр All Files), потім запустити з термінала. ${UBUNTU}`, commands: ["ls", "scite space.txt"] },
        { title: "nano", body: "Той самий файл у консольному редакторі; Ctrl+G — довідка, Ctrl+X — вихід.", commands: ["nano space.txt"] },
        { title: "Конфігураційні файли", body: "Приховані файли в домашньому каталозі й системні в /etc.", commands: ["ls -l", "ls -la", "cat .bashrc", "ls /etc", "cat /etc/bash.bashrc"] },
        { title: "Колір запрошення", body: "У .bashrc у рядку PS1 змінити код кольору 32 (зелений) на 31 у SciTE (Search > Replace; у діалозі відкриття — All Files і Ctrl+H для прихованих), потім на 33 у nano (Ctrl+\\ — заміна). Нова оболонка покаже новий колір.", commands: ["nano .bashrc", "bash"] },
        { title: "nginx", body: "У файлі конфігурації змінити порт і каталог сторінок (не прибирати крапку з комою), запустити, відкрити сторінку, зупинити.", commands: ["sudo nano -l /etc/nginx/custom_server.conf", "sudo nginx -c custom_server.conf", "sudo tail /var/log/nginx/error.log", "sudo pkill nginx"] },
      ],
      report: [],
      screenshots: [
        { what: "Діалог File > Open з фільтром All Source і з All Files", how: "SciTE." },
        { what: "Термінал без запрошення, поки працює SciTE", how: "Запуск scite з термінала." },
        { what: "Довгий рядок у nano і довідка Ctrl+G", how: "nano space.txt." },
        { what: "Червоне й жовте запрошення, старе вікно — зелене", how: "Після зміни .bashrc." },
        { what: "Сторінка на 127.0.0.1:8080 і помилка favicon.ico в журналі", how: "Firefox; sudo tail /var/log/nginx/error.log." },
      ],
      questions: [
        "Ви змогли відразу знайти space.txt у діалозі File > Open?",
        "Чому підказка не відображається в терміналі, поки працює SciTE?",
        "Який символ використовує nano, щоб показати, що рядок продовжується за межами екрана?",
        "Чому конфігураційні файли користувацьких застосунків зберігаються в домашньому каталозі, а не в /etc?",
        "Чи змінило колір вікно термінала, яке вже було відкрите?",
        "Яке повідомлення про помилку малось на увазі під час відкриття сторінки nginx?",
        "Чи з'являється веб-сторінка після зупинки nginx?",
        "Чи можна редагувати конфігураційний файл nginx у SciTE?",
      ],
    },
    findings: [
      { title: "space.txt у File > Open", body: "Ні: діалог відкрито в правильному каталозі, але вибрано фільтр All Source (лише вихідні тексти програм), .txt до нього не належить; з фільтром All Files файл видно." },
      { title: "Запрошення не видно", body: "Оболонка запустила SciTE на передньому плані й чекає його завершення; Ctrl+C перериває програму. Щоб термінал лишався вільним, команду закінчують символом &." },
      { title: "Продовження рядка в nano", body: "У nano 6.2 — символ > праворуч (і < ліворуч після End); у старих версіях з методички — $. Довідка закривається Ctrl+X, а не q." },
      { title: "Домашній каталог проти /etc", body: "Налаштування конкретного користувача: у кожного свої, і змінювати їх можна без прав адміністратора; /etc — для всієї системи, туди пише лише root. ~/.bashrc доповнює або перевизначає /etc/bash.bashrc." },
      { title: "Уже відкрите вікно", body: "Ні: оболонка читає .bashrc лише під час запуску; нове значення в старому вікні — після source ~/.bashrc або нової оболонки." },
      { title: "Помилка nginx", body: "Браузер сам запитує /favicon.ico, а в каталозі сторінок його немає: open() …/favicon.ico failed (2: No such file or directory). Показу сторінки це не заважає." },
      { title: "Після зупинки", body: "Ні: браузер не може встановити з'єднання, порт ніхто не слухає (ss -ltn | grep 8080 нічого не знаходить)." },
      { title: "nginx у SciTE", body: "Так, але з правами root: файл належить root з правами rw-r--r--.", },
    ],
    errata: [
      "Меню — Menu > CyberOps; nano 6.2 позначає продовження рядка символом >, а не $.",
      "Файл конфігурації в машині називається custom_server.conf, а не custom_configuration.conf (порт у ньому 81).",
      "Помилку favicon.ico nginx в Ubuntu пише не в термінал, а в /var/log/nginx/error.log.",
      "Запустити SciTE від root: sudo scite /etc/nginx/custom_server.conf.",
    ],
  },
  {
    slug: "cisco-4-2-7",
    intro:
      { uk: "Командний рядок Linux: man, переходи за каталогами абсолютними і відносними шляхами, ~ . .., перенаправлення > і >>, приховані файли, cp, rm, mv.", ru: "Командная строка Linux: man, переходы по каталогам абсолютными и относительными путями, ~ . .., перенаправление > и >>, скрытые файлы, cp, rm, mv." },
    guide: {
      source: `${SRC}, Lab 4.2.7 «Getting Familiar with the Linux Shell»`,
      goals: ["Керувати файлами й каталогами з командного рядка Linux і виконувати основні завдання адміністрування."],
      steps: [
        { title: "Довідка", body: UBUNTU, commands: ["man man", "man cp", "man pwd"] },
        { title: "Каталоги", body: "Створити три каталоги, переходити абсолютними й відносними шляхами.", commands: ["pwd", "cd /home/analyst", "ls -l", "mkdir cyops_folder1 cyops_folder2 cyops_folder3", "cd /home/analyst/cyops_folder3", "cd ~", "mkdir /home/analyst/cyops_folder3/cyops_folder4", "ls -la /home/analyst/cyops_folder3", "cd .", "cd .."] },
        { title: "Перенаправлення", body: "> перезаписує файл, >> дописує в кінець.", commands: ['echo "This is a message echoed to the terminal by echo."', 'echo "This is a message echoed to the terminal by echo." > some_text_file.txt', "cat some_text_file.txt", 'echo "This is another line of text. It will be APPENDED to the output file." >> some_text_file.txt'] },
        { title: "Приховані файли", body: "Порівняти кількість записів.", commands: ["ls -l", "ls -la", "man ls"] },
        { title: "Копіювання, видалення, переміщення", commands: ["cp some_text_file.txt cyops_folder2/", "rm some_text_file.txt", "rm -r cyops_folder1", "mv cyops_folder2/some_text_file.txt ."] },
      ],
      report: [],
      screenshots: [
        { what: "Сторінка man man з розділами", how: "Термінал." },
        { what: "Переходи cd ~, cd ., cd .. з pwd", how: "Термінал." },
        { what: "Файл після > і після >>", how: "cat some_text_file.txt." },
        { what: "ls -l проти ls -la", how: "Домашній каталог." },
      ],
      questions: [
        "Назвіть кілька розділів сторінки man.",
        "Яка функція команди cp? Яку команду слід використати для інформації про pwd?",
        "Який каталог поточний після pwd? Після cd /home/analyst/cyops_folder3?",
        "Що відбувається після cd ~ і чому?",
        "Що відбувається після cd . і cd ..?",
        "Чи очікувався результат echo з >? Що сталося з файлом після другого > і після >>?",
        "Скільки записів показує ls -l і ls -la? Чи можна приховати каталог крапкою?",
        "Яку команду використали, щоб перемістити файл назад у домашній каталог?",
      ],
    },
    findings: [
      { title: "Розділи man", body: "NAME, SYNOPSIS, DESCRIPTION, OPTIONS, EXIT STATUS, ENVIRONMENT, FILES, SEE ALSO, EXAMPLES тощо; секції довідки 1 — команди, 2 — системні виклики, 3 — бібліотечні функції, 8 — адміністрування." },
      { title: "cp і pwd", body: "cp копіює файли й каталоги (SOURCE → DEST або кілька файлів у каталог); про pwd — man pwd." },
      { title: "Поточні каталоги", body: "/home/analyst; після cd у підкаталог — /home/analyst/cyops_folder3. cd ~ повертає в домашній каталог: ~ позначає домашній каталог користувача." },
      { title: ". і ..", body: "cd . нічого не змінює (поточний каталог), cd .. — на рівень вище; у корені / лишаємось у /." },
      { title: "> і >>", body: "З > на екран нічого не виводиться — вивід у файл, файл створюється автоматично; повторний > перезаписує вміст, >> дописує в кінець." },
      { title: "Приховані файли", body: "ls -la показує на кілька десятків записів більше: файли й каталоги з крапкою на початку (.bashrc, .profile, .bash_logout, .cache, .config, .local, .mozilla) і записи . та ..; так, крапка приховує й каталоги (man ls: -a, --all do not ignore entries starting with .)." },
      { title: "Переміщення", body: "mv cyops_folder2/some_text_file.txt . — крапка означає поточний каталог; на відміну від cp, файл зникає зі старого місця. rm -r потрібен, бо каталог видаляється з усім вмістом." },
    ],
    errata: ["У домашньому каталозі машини є Documents і немає space.txt — кількість записів у ls відрізняється від методички."],
  },
  {
    slug: "cisco-4-3-4",
    intro:
      { uk: "Сервери в Linux: ps -elf і дерево процесів, nginx з головним і робочими процесами, netstat -tunap з прив'язкою портів до процесів і перевірка служб Telnet на портах 80, 22 і 68.", ru: "Серверы в Linux: ps -elf и дерево процессов, nginx с главным и рабочими процессами, netstat -tunap с привязкой портов к процессам и проверка служб Telnet на портах 80, 22 и 68." },
    guide: {
      source: `${SRC}, Lab 4.3.4 «Linux Servers»`,
      goals: ["Знаходити серверні програми за допомогою ps і netstat.", "Перевіряти TCP-служби підключенням через Telnet."],
      steps: [
        { title: "Процеси", body: UBUNTU, commands: ["sudo ps -elf", "sudo /usr/sbin/nginx", "sudo ps -ejH"] },
        { title: "netstat", body: "Порти, що слухаються, і їхні процеси.", commands: ["netstat", "sudo netstat -tunap", "sudo ps -elf | grep <PID nginx>"] },
        { title: "Telnet", body: "Після підключення ввести довільний рядок і Enter.", commands: ["telnet 127.0.0.1 80", "telnet 127.0.0.1 22", "telnet 127.0.0.1 68"] },
        { title: "Прибрати за собою", commands: ["sudo /usr/sbin/nginx -s quit"] },
      ],
      report: [],
      screenshots: [
        { what: "sudo ps -elf і дерево sudo ps -ejH з nginx", how: "Термінал." },
        { what: "sudo netstat -tunap", how: "nginx на порту 80." },
        { what: "Відповіді на порту 80 (400 Bad Request), 22 (рядок SSH) і 68 (Connection refused)", how: "telnet." },
      ],
      questions: [
        "Чому було необхідно запустити ps з правами root?",
        "Як ps показує ієрархію процесів?",
        "У чому полягає дія опцій -t, -u, -n, -a, -p команди netstat? Чи важливий порядок опцій?",
        "Які протокол рівня 4, стан і PID процесу на порту 80? Яка служба зазвичай працює на TCP 80?",
        "Як обґрунтувати, що процес — nginx? Що таке nginx і яка його функція?",
        "Робочий процес належить іншому користувачеві, а його батько — головний nginx. Що це означає?",
        "Чому в останньому рядку відображається grep?",
        "Чому помилка на порту 80 була надіслана як веб-сторінка?",
        "Що відбувається при підключенні до порту 68?",
        "Які переваги netstat? Які переваги Telnet і чи це безпечно?",
      ],
    },
    findings: [
      { title: "ps з root", body: "Без прав root частина відомостей про чужі процеси закрита, а з hidepid на /proc користувач бачить лише свої; sudo гарантує повний список." },
      { title: "Ієрархія", body: "Відступом у стовпці CMD під батьківським процесом; PGID і SID показують групу й сеанс (у процесів nginx вони дорівнюють PID головного)." },
      { title: "Опції netstat", body: "-t TCP, -u UDP, -n числові адреси й порти, -a усі сокети (і LISTEN, і з'єднання), -p PID/програма (повністю — з root). Порядок не важливий: diff виводів -tunap і -pantu порожній." },
      { title: "Порт 80", body: "TCP, LISTEN, PID головного процесу nginx; на TCP 80 зазвичай веб-сервер (HTTP)." },
      { title: "nginx і робочі процеси", body: "У рядку ps для того самого PID — nginx: master process /usr/sbin/nginx. nginx — вільний HTTP-сервер, зворотний проксі, балансувальник, кеш і поштовий проксі. Головний процес працює від root (порт < 1024, конфігурація), робочі — від непривілейованого користувача (www-data в Ubuntu): розділення привілеїв, загальна практика." },
      { title: "grep у виводі", body: "Команди конвеєра запускаються одночасно, і рядок команди grep сам містить шукане число." },
      { title: "Telnet", body: "Порт 80: nginx розбирає будь-які дані як HTTP і відповідає 400 Bad Request з HTML-сторінкою (видно й версію в заголовку Server). Порт 22: сервер одразу шле рядок SSH-2.0-OpenSSH… і на сміття відповідає Invalid SSH identification string. Порт 68: Connection refused — DHCP-клієнт слухає лише UDP 68, а Telnet працює поверх TCP." },
      { title: "Переваги", body: "netstat — усі сокети з процесами одним поглядом (у нових системах — ss з тими самими опціями). Telnet — ручна перевірка будь-якого TCP-порту й текстових протоколів; для віддаленого керування небезпечний: усе, з паролем, іде відкритим текстом, використовують SSH." },
    ],
    errata: ["Номери процесів, версії і користувач робочих процесів nginx (www-data замість http) інші, ніж у методичці; локальних з'єднань ELK, як у методичці, у машині за замовчуванням немає."],
  },
  {
    slug: "cisco-4-4-4",
    intro:
      { uk: "Журнали Linux: розбір записів вебсервера і системи, пошук журналів nginx як на незнайомій машині (man, процеси, /etc, /var/log), tail -f і journalctl. У Ubuntu частина шляхів не така, як у методичці.", ru: "Журналы Linux: разбор записей веб-сервера и системы, поиск журналов nginx как на незнакомой машине (man, процессы, /etc, /var/log), tail -f и journalctl. В Ubuntu часть путей не такая, как в методичке." },
    guide: {
      source: `${SRC}, Lab 4.4.4 «Locating Log Files»`,
      goals: ["Ознайомитися з розташуванням і форматом журналів Linux.", "Знаходити журнали невідомої служби й стежити за ними в реальному часі командами tail і journalctl."],
      steps: [
        { title: "Записи журналів", body: UBUNTU, commands: ["cat /var/log/logstash-tutorial.log", "sudo more /var/log/syslog"] },
        { title: "Пошук журналів nginx", body: "Документація, процес, конфігурація, каталог журналів.", commands: ["man nginx", "ps ax | grep nginx", "sudo /usr/sbin/nginx", "ls -l /etc/nginx/", "less /etc/nginx/nginx.conf", "ls -l /var/log/", "ls -l /var/log/nginx/"] },
        { title: "tail", body: "Відкрити 127.0.0.1 у Firefox і оновлювати сторінку.", commands: ["sudo tail /var/log/nginx/access.log", "sudo tail -n 5 /var/log/nginx/access.log", "sudo tail -f /var/log/nginx/access.log"] },
        { title: "journalctl", commands: ["journalctl", "sudo journalctl", "sudo journalctl -b", "sudo journalctl --list-boots", "sudo journalctl -b -1", 'sudo journalctl --since "2 hours ago"', "sudo journalctl -u nginx.service", "sudo journalctl -f", "sudo journalctl -u nginx.service -f"] },
      ],
      report: [],
      screenshots: [
        { what: "Зразок журналу доступу і syslog", how: "cat, sudo more." },
        { what: "Розділ FILES у man nginx і шляхи журналів у nginx.conf", how: "man nginx, less." },
        { what: "tail -f з новими записами поруч із браузером", how: "Два вікна поруч." },
        { what: "journalctl -b, --list-boots, -u nginx.service -f", how: "Термінал." },
      ],
      questions: [
        "На підставі запису журналу помилок Apache опишіть, що сталося.",
        "Чи вважаються рядки logstash-tutorial.log веб-транзакцією і чому формат інший?",
        "Чи можна з наведених записів дізнатися про повільну мережу 19 травня о 4:20?",
        "Як запустити journalctl, щоб переглянути всі записи журналу?",
      ],
    },
    findings: [
      { title: "Запис Apache", body: "Процес Apache зареєстрував помилку модуля core: клієнт 209.165.200.230 запитав favicon.ico, якого немає в каталозі сайту — відсутній значок, загрози немає." },
      { title: "Журнал доступу", body: "Так, кожен рядок — один HTTP-запит (адреса, час, метод і ресурс, код, розмір, Referer, User-Agent) у форматі combined; формат інший, бо це журнал іншого призначення — його задає програма та її налаштування." },
      { title: "19 травня", body: "Ні: у записах методички лише 20 і 22 березня; перемикання enp0s3 (link down/up) могло б пояснити повільну мережу, але це інша дата." },
      { title: "Усі записи journalctl", body: "Від root (sudo journalctl) або додати користувача до групи systemd-journal чи adm (sudo usermod -aG systemd-journal analyst) і увійти знову." },
    ],
    errata: [
      "У Ubuntu немає /var/log/messages — загальні повідомлення rsyslog пише в /var/log/syslog (читається через sudo).",
      "У nginx.conf Ubuntu шляхи журналів задано явно (/var/log/nginx/access.log і error.log), а помилки йдуть у файл, а не в журнал systemd — тому помилки favicon.ico в journalctl не буде; її видно в sudo tail -f /var/log/nginx/error.log з конфігурацією custom_server.conf (порт 81).",
      "sudo journalctl -b -2 може повідомити, що такого завантаження немає: у свіжій машині лише два завантаження — дивіться --list-boots і -b -1.",
      "Якщо годинник основного комп'ютера в місцевому часі, VirtualBox віддає його гостю як UTC, і перші записи завантаження отримують мітки з майбутнього, поки VBoxService не виправить час, — тоді --since захоплює їх за будь-якого інтервалу. Живий приклад того, чому годинник має бути синхронізований.",
      "journalctl -u nginx.service показує лише запуски через systemd; nginx, запущений вручну, туди не потрапляє.",
    ],
  },
  {
    slug: "cisco-4-5-4",
    intro:
      { uk: "Файлова система Linux і права: lsblk і mount, ручне монтування другого диска, rwx і вісімковий запис, chmod і chown, типи файлів у /dev, символьне і жорстке посилання.", ru: "Файловая система Linux и права: lsblk и mount, ручное монтирование второго диска, rwx и восьмеричная запись, chmod и chown, типы файлов в /dev, символьная и жёсткая ссылки." },
    guide: {
      source: `${SRC}, Lab 4.5.4 «Navigating the Linux Filesystem and Permission Settings»`,
      goals: ["Ознайомитися з файловими системами, монтуванням, правами доступу і спеціальними типами файлів Linux."],
      steps: [
        { title: "Файлові системи", body: UBUNTU, commands: ["lsblk", "mount", "mount | grep sda2", "cd /", "ls -l"] },
        { title: "Монтування", commands: ["ls -l ~/second_drive/", "sudo mount /dev/sdb1 ~/second_drive/", "ls -l second_drive/", "mount | grep /dev/sd", "sudo umount /dev/sdb1"] },
        { title: "Права файлів", commands: ["cd ~/lab.support.files/scripts", "ls -l", "touch /mnt/myNewFile.txt", "ls -ld /mnt", "sudo touch /mnt/myNewFile.txt", "sudo mount /dev/sdb1 ~/second_drive/", "cd ~/second_drive", "ls -l", "sudo chmod 665 myFile.txt", "sudo chown analyst myFile.txt", "echo test >> myFile.txt", "cat myFile.txt"] },
        { title: "Права каталогів і типи файлів", commands: ["ls -l ~/lab.support.files", "ls -l /dev/"] },
        { title: "Посилання", commands: ['echo "symbolic" > file1.txt', 'echo "hard" > file2.txt', "ln -s file1.txt file1symbolic", "ln file2.txt file2hard", "ls -l", "mv file1.txt file1new.txt", "mv file2.txt file2new.txt", "cat file1symbolic", "cat file2hard", "ls -li"] },
      ],
      report: [],
      screenshots: [
        { what: "lsblk і mount | grep sda2", how: "Термінал." },
        { what: "second_drive до і після монтування", how: "ls -l." },
        { what: "Permission denied для touch /mnt і права /mnt", how: "touch, ls -ld." },
        { what: "chmod, chown і дописування в myFile.txt", how: "Змонтований second_drive." },
        { what: "Посилання до й після перейменування, ls -li", how: "Домашній каталог." },
      ],
      questions: [
        "Який результат виводить ls -l у корені і де фізично зберігаються ці файли?",
        "Чому /dev/sdb1 не відображається у виводі?",
        "Чому каталог second_drive після монтування не порожній і де фізично зберігаються файли?",
        "Хто власник cyops.mn і що означають права -rw-r--r--?",
        "Чому файл у /mnt не створено і як виконати touch?",
        "Які права на myFile.txt, чи змінилися вони після chmod 665? Яка команда дасть rwxrwxrwx?",
        "Чи успішне дописування після chown?",
        "У чому різниця між початком рядка для malware і mininet_services?",
        "Що станеться з file2hard, якщо змінити текст у file2new.txt?",
      ],
    },
    findings: [
      { title: "Корінь", body: "Каталоги верхнього рівня і посилання bin, lib, sbin на /usr; фізично — на кореневому розділі першого диска (у цій машині /dev/sda2), крім віртуальних /proc, /sys, /dev, /run, які ядро формує в пам'яті." },
      { title: "sdb1", body: "Не змонтований — його файли не входять у дерево каталогів. Після mount каталог second_drive стає коренем файлової системи sdb1 (lost+found, myFile.txt), власний вміст каталогу на час монтування прихований; після umount файли нікуди не зникають." },
      { title: "-rw-r--r--", body: "Звичайний файл; власник читає й пише, група й інші лише читають, виконання немає ні в кого. Власник і група — стовпці 3 і 4." },
      { title: "/mnt", body: "Каталог належить root з drwxr-xr-x: писати може лише root, analyst має r-x. Виконати: sudo touch /mnt/myNewFile.txt." },
      { title: "myFile.txt", body: "Файл на диску вже має права 665 (rw-rw-r-x), тому chmod 665 нічого не змінює; rwxrwxrwx — chmod 777. Власник показаний числом (UID 1000), бо такого користувача в системі немає. Після chown analyst дописування успішне — власник має право запису; без цього — Permission denied." },
      { title: "malware і mininet_services", body: "d — каталог, - — файл; біт x у файлу — право запуску, у каталогу — право увійти й звертатися до файлів у ньому." },
      { title: "Посилання", body: "Символьне зберігає ім'я (розмір 9 байтів = довжина «file1.txt») і ламається після перейменування; жорстке — друге ім'я того самого inode (лічильник посилань 2), працює далі. Зміни у file2new.txt видно через file2hard — це той самий файл (якщо редактор пише в наявний файл, як nano)." },
    ],
    errata: [
      "Коренева файлова система — /dev/sda2, а не /dev/sda1 (перший розділ 1 МБ службовий), тому mount | grep sda1 нічого не виводить; оптичного приводу sr0 немає.",
      "myFile.txt на другому диску вже має права й вміст, які методичка отримує лише в кінці частини 2.",
      "Біля пристроїв у /dev може стояти рік замість часу — файли створено, поки годинник машини йшов уперед (див. 4.4.4).",
    ],
  },
];
