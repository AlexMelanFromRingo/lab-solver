import type { GuideModule } from "./types";

/**
 * Cisco CyberOps Associate, модуль 10 (мережні сервіси): лабораторні 10.2.7
 * (DNS/UDP), 10.4.3 (TCP і UDP: FTP і TFTP) і 10.6.7 (HTTP і HTTPS) у машині
 * курсу на Ubuntu 22.04.
 */

const SRC = "Cisco CyberOps Associate (NetAcad)";

export const CISCO_M10: GuideModule[] = [
  {
    slug: "cisco-10-2-7",
    intro:
      { uk: "Захоплення обміну DNS, згенерованого командою nslookup, і перевірка за заголовками, що запити й відповіді DNS переносяться протоколом UDP на порт 53.", ru: "Захват обмена DNS, сгенерированного командой nslookup, и проверка по заголовкам, что запросы и ответы DNS переносятся протоколом UDP на порт 53." },
    guide: {
      source: `${SRC}, Lab 10.2.7 «Using Wireshark to Examine a UDP DNS Capture»`,
      goals: [
        "Записати параметри IP-конфігурації машини (IP, шлюз, DNS).",
        "Захопити обмін DNS і переконатися за заголовками, що він працює поверх UDP.",
      ],
      steps: [
        { title: "IP-конфігурація", commands: ["ip addr show enp0s3 | grep -E 'inet |ether'", "ip route | grep default", "cat /etc/resolv.conf"], body: "Машина: 10.0.2.15/24, шлюз 10.0.2.2, розв'язувач — systemd-resolved (127.0.0.53), що пересилає запити висхідному серверу." },
        {
          title: "Захоплення DNS",
          commands: ["sudo sh -c \"timeout 9 tcpdump -i enp0s3 -n -w /home/analyst/1027_dns.pcap udp port 53 & sleep 2; nslookup www.iana.org; sleep 2; wait\""],
          body: "Захоплення на enp0s3 фільтром udp port 53, запит подає nslookup. На enp0s3 видно саме пересланий запит до висхідного сервера (127.0.0.53 слухає на loopback).",
        },
        {
          title: "Аналіз у Wireshark",
          commands: ["wireshark -r /home/analyst/1027_dns.pcap &"],
          body: "Фільтр dns. У запиті заголовок User Datagram Protocol: порт джерела тимчасовий, порт призначення 53. У відповіді — навпаки: джерело 53. Обмін без встановлення з'єднання.",
        },
      ],
      report: [],
      screenshots: [
        { what: "IP-конфігурація машини", how: "ip addr, ip route, cat /etc/resolv.conf." },
        { what: "Запит nslookup і захоплення", how: "Термінал." },
        { what: "Запит DNS у Wireshark: UDP, порт 53", how: "Фільтр dns, розгорнутий UDP." },
        { what: "Відповідь DNS: джерело порт 53", how: "Той самий захват." },
      ],
      questions: [
        "На якому транспортному протоколі й порту працює DNS?",
        "Який порт джерела й призначення у запиті і у відповіді?",
        "Чому для DNS доречний UDP, а не TCP?",
      ],
    },
    findings: [
      { title: "UDP, порт 53", body: "Запит DNS інкапсульовано в UDP: клієнт надсилає його з тимчасового порту на порт 53 сервера, сервер відповідає з порту 53. У захопленні видно запит A і відповідь з IP-адресами (www.iana.org → канонічне ім'я cloudflare і адреси)." },
      { title: "Без з'єднання", body: "Обмін складається з короткого запиту й відповіді без рукостискання — це й відрізняє UDP від TCP. Для невеликих повідомлень DNS менші накладні витрати UDP доречні." },
    ],
  },
  {
    slug: "cisco-10-4-3",
    intro:
      { uk: "Два сеанси передавання файлів: FTP поверх TCP (порт 21, з рукостисканням) і TFTP поверх UDP (порт 69, без з'єднання) — порівняння транспортних протоколів за заголовками.", ru: "Два сеанса передачи файлов: FTP поверх TCP (порт 21, с рукопожатием) и TFTP поверх UDP (порт 69, без соединения) — сравнение транспортных протоколов по заголовкам." },
    guide: {
      source: `${SRC}, Lab 10.4.3 «Using Wireshark to Examine TCP and UDP Captures»`,
      goals: [
        "Захопити сеанс FTP і дослідити роботу TCP.",
        "Захопити сеанс TFTP і дослідити роботу UDP; порівняти обидва протоколи.",
      ],
      steps: [
        {
          title: "Частина 1. FTP поверх TCP",
          commands: ["sudo sh -c \"echo CyberOps-FTP-lab-Readme > /srv/ftp/Readme; timeout 12 tcpdump -i lo -n -w /home/analyst/1043_ftp.pcap tcp & sleep 1.5; curl -s ftp://127.0.0.1/Readme --user anonymous:test@example.com -o /home/analyst/Readme.dl; sleep 2\"", "wireshark -r /home/analyst/1043_ftp.pcap &"],
          body: "Замість зовнішнього ftp.cdc.gov (недоступний) — локальний сервер vsftpd машини. У Wireshark фільтр ftp: рукостискання TCP, далі привітання 220, команда USER anonymous, відповідь 331. Керувальне з'єднання — на порту 21.",
        },
        {
          title: "Частина 2. TFTP поверх UDP (Mininet)",
          commands: [
            "sudo ./lab.support.files/scripts/cyberops_topo.py",
            "H1 /home/analyst/lab.support.files/scripts/start_tftpd.sh",
            "H1 sh -c \"echo 'This file contains my tftp data.' > /srv/tftp/my_tftp_data\"",
            "H2 bash -c \"cd /tmp; touch my_tftp_data; tftp 10.0.0.11 -c get my_tftp_data; cat my_tftp_data\"",
            "H1 wireshark -r /home/analyst/1043_tftp.pcap &",
          ],
          body: "Захоплення на H1-eth0 під час передачі. Фільтр tftp: запит на читання (RRQ) my_tftp_data іде на UDP-порт 69 сервера H1, далі блоки даних і підтвердження на тимчасовому порту. Все поверх UDP, без з'єднання.",
        },
        { title: "Завершення", commands: ["quit", "sudo mn -c"] },
      ],
      report: [],
      screenshots: [
        { what: "Захоплення й завантаження FTP", how: "Термінал, curl ftp://." },
        { what: "Сеанс FTP у Wireshark: TCP, порт 21", how: "Фільтр ftp." },
        { what: "Запуск tftpd на H1 і завантаження з H2", how: "mininet CLI." },
        { what: "Сеанс TFTP у Wireshark: UDP, порт 69", how: "Фільтр tftp." },
      ],
      questions: [
        "На якому транспортному протоколі й порту працює FTP, а на якому — TFTP?",
        "Чи встановлює FTP з'єднання перед передачею? А TFTP?",
        "У чому різниця між TCP і UDP за результатами двох захоплень?",
      ],
    },
    findings: [
      { title: "FTP — TCP, порт 21", body: "Сеанс починається тристороннім рукостисканням TCP, команди (USER, тощо) передаються на порт 21 керувального з'єднання. TCP забезпечує надійну впорядковану доставку з підтвердженнями." },
      { title: "TFTP — UDP, порт 69", body: "Клієнт одразу надсилає запит на читання (RRQ) на порт 69 сервера; блоки даних і підтвердження йдуть поверх UDP без встановлення з'єднання." },
      { title: "Висновок", body: "FTP застосовує TCP для надійного передавання, TFTP — простіший і легший UDP; вибір протоколу відповідає різному призначенню." },
    ],
    errata: ["Зовнішній сервер ftp.cdc.gov із методички недоступний; у роботі використано локальний vsftpd — поля TCP ті самі."],
  },
  {
    slug: "cisco-10-6-7",
    intro:
      { uk: "Порівняння HTTP і HTTPS на прикладі переданих облікових даних: у HTTP рядок запиту з паролем читається у відкритому вигляді, у HTTPS той самий запит зашифровано засобами TLS і в захопленні не читається.", ru: "Сравнение HTTP и HTTPS на примере переданных учётных данных: в HTTP строка запроса с паролем читается в открытом виде, в HTTPS тот же запрос зашифрован средствами TLS и в захвате не читается." },
    guide: {
      source: `${SRC}, Lab 10.6.7 «Using Wireshark to Examine HTTP and HTTPS Traffic»`,
      goals: [
        "Захопити трафік HTTP і переконатися, що дані передаються у відкритому вигляді.",
        "Захопити трафік HTTPS і переконатися, що TLS шифрує дані.",
      ],
      steps: [
        {
          title: "Частина 1. HTTP (відкритий текст)",
          commands: ["sudo sh -c \"timeout 10 tcpdump -i enp0s3 -s0 -n -w /home/analyst/1067_http.pcap tcp port 80 & sleep 1.5; curl -s 'http://example.com/?username=analyst&password=cyberops123' -o /dev/null; sleep 2\"", "wireshark -r /home/analyst/1067_http.pcap &"],
          body: "Запит до example.com за HTTP з навчальними обліковими даними в рядку запиту. Фільтр http: у байтах пакета прямо читається GET /?username=analyst&password=cyberops123 HTTP/1.1 і Host. Порт призначення 80.",
        },
        {
          title: "Частина 2. HTTPS (шифрування)",
          commands: ["sudo sh -c \"timeout 10 tcpdump -i enp0s3 -s0 -n -w /home/analyst/1067_https.pcap tcp port 443 & sleep 1.5; curl -s 'https://example.com/?username=analyst&password=cyberops123' -o /dev/null; sleep 2\"", "wireshark -r /home/analyst/1067_https.pcap &"],
          body: "Той самий запит за HTTPS. Пошук рядків username/password/cyberops123 у захопленні не дає збігів. Фільтр tls: рукостискання TCP на порт 443, далі повідомлення TLS (Client Hello, Server Hello) і зашифровані дані застосунку — у байтах замість тексту випадкові дані.",
        },
      ],
      report: [],
      screenshots: [
        { what: "Захоплення HTTP і запит", how: "Термінал, curl http://." },
        { what: "Пакет HTTP у Wireshark: облікові дані у відкритому вигляді", how: "Фільтр http, байти пакета." },
        { what: "Пакет HTTPS у Wireshark: зашифровані дані TLS", how: "Фільтр tls." },
      ],
      questions: [
        "Чи видно облікові дані в захопленні HTTP? А в захопленні HTTPS?",
        "На якому порту працює HTTP, а на якому HTTPS?",
        "Чому для передавання чутливих даних слід використовувати HTTPS?",
      ],
    },
    findings: [
      { title: "HTTP — відкрито", body: "У захопленні HTTP рядок запиту разом з username=analyst і password=cyberops123 читається у відкритому вигляді безпосередньо в байтах пакета: HTTP не шифрує дані, порт 80." },
      { title: "HTTPS — зашифровано", body: "У захопленні HTTPS (порт 443) тих самих облікових даних знайти не вдалося: обмін іде поверх TLS, який шифрує дані застосунку; видно лише службові повідомлення TLS і зашифрований вміст." },
      { title: "Висновок", body: "Чутливі дані слід передавати через HTTPS. Водночас сам факт шифрування не гарантує надійності сайту — зловмисники теж користуються HTTPS." },
    ],
  },
];
