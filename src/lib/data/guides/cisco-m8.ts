import type { GuideModule } from "./types";

/**
 * Cisco CyberOps Associate, модуль 8 (ARP): лабораторна 8.2.8 у машині курсу на
 * Ubuntu 22.04 з топологією Mininet.
 */

const SRC = "Cisco CyberOps Associate (NetAcad)";

export const CISCO_M8: GuideModule[] = [
  {
    slug: "cisco-8-2-8",
    intro:
      { uk: "Поля заголовку кадру Ethernet II і захоплення кадрів ping у своїй і віддаленій мережі з хоста H3: у локальну мережу кадр адресується самому одержувачу, у віддалену — шлюзу. Трафік знімається tcpdump і відкривається у Wireshark.", ru: "Поля заголовка кадра Ethernet II и захват кадров ping в своей и удалённой сети с хоста H3: в локальную сеть кадр адресуется самому получателю, в удалённую — шлюзу. Трафик снимается tcpdump и открывается в Wireshark." },
    guide: {
      source: `${SRC}, Lab 8.2.8 «Using Wireshark to Examine Ethernet Frames»`,
      goals: [
        "Дослідити поля заголовку кадру Ethernet II (адреси призначення й джерела, тип).",
        "Захопити у Wireshark кадри локального й віддаленого трафіку і за заголовками визначити MAC-адреси.",
      ],
      steps: [
        {
          title: "Частина 1. Поля Ethernet II",
          body:
            "Кадр Ethernet II: преамбула (8 Б), адреса призначення (6 Б), адреса джерела (6 Б), тип (2 Б), дані (46–1500 Б), " +
            "FCS (4 Б). Преамбулу й FCS обробляє мережна карта, у захопленні їх не видно. Перші 3 октети MAC — OUI (виробник), " +
            "останні 3 — серійний номер. Тип: 0x0800 — IPv4, 0x0806 — ARP. У першому кадрі ARP-запиту адреса призначення — " +
            "широкомовна ff:ff:ff:ff:ff:ff: MAC шлюзу ще невідома, тож запит іде всім вузлам сегмента.",
        },
        {
          title: "Розгортання Mininet",
          commands: ["sudo ./lab.support.files/scripts/cyberops_topo.py"],
          body: "Пароль cyberops. Створюються H1–H4, R1, s1; R1 маршрутизує 10.0.0.0/24 (R1-eth1) і 172.16.0.0/12 (R1-eth2). З'являється командний рядок mininet>.",
        },
        {
          title: "Налаштування H3",
          commands: ["H3 ip address", "H3 route -n"],
          body: "H3-eth0: 10.0.0.13/24, шлюз за замовчуванням 10.0.0.1. Локальна ціль — H1 (10.0.0.11), віддалена — H4 (172.16.0.40). MAC шлюзу — на інтерфейсі R1-eth1 (10.0.0.1).",
        },
        {
          title: "Захоплення локального трафіку (H3 → H1)",
          commands: [
            "H3 bash -c \"ip neigh flush all; nohup timeout 7 tcpdump -i H3-eth0 -w /home/analyst/8228_local.pcap >/dev/null 2>&1 & sleep 1.5; ping -c 4 10.0.0.11; sleep 2\"",
            "H3 wireshark -r /home/analyst/8228_local.pcap &",
          ],
          body: "Кеш ARP очищається, щоб у захопленні був ARP-запит. У Wireshark — фільтр не потрібен: спершу ARP who-has/reply, далі ICMP. У кадрі ICMP-запиту адреса призначення Ethernet — MAC H1 (кадр іде прямо одержувачу).",
        },
        {
          title: "Захоплення віддаленого трафіку (H3 → H4)",
          commands: [
            "H3 bash -c \"ip neigh flush all; nohup timeout 7 tcpdump -i H3-eth0 -w /home/analyst/8228_remote.pcap >/dev/null 2>&1 & sleep 1.5; ping -c 4 172.16.0.40; sleep 2\"",
            "H3 wireshark -r /home/analyst/8228_remote.pcap &",
          ],
          body: "H4 поза мережею 10.0.0.0/24, тому ARP-запит іде на шлюз (who-has 10.0.0.1), а в кадрі ICMP-запиту адреса призначення Ethernet — MAC R1-eth1, а не H4. Відповіді приходять із TTL 63 (минули один маршрутизатор).",
        },
        {
          title: "Завершення",
          commands: ["quit", "sudo mn -c"],
        },
      ],
      report: [],
      screenshots: [
        { what: "Топологія Mininet і таблиця маршрутизації R1", how: "Вивід сценарію cyberops_topo.py." },
        { what: "Адреси й маршрути H3", how: "H3 ip address, H3 route -n." },
        { what: "Локальний захват: ARP і кадр ICMP з Ethernet II (dst = MAC H1)", how: "Wireshark, 8228_local.pcap." },
        { what: "Віддалений захват: кадр ICMP з Ethernet II (dst = MAC шлюзу)", how: "Wireshark, 8228_remote.pcap." },
        { what: "Зупинка й очищення Mininet", how: "quit, sudo mn -c." },
      ],
      questions: [
        "Яка адреса призначення у першому (ARP) кадрі і чому вона широкомовна?",
        "Яка MAC-адреса джерела і яка частина адреси визначає OUI, а яка — серійний номер?",
        "Яка MAC-адреса призначення в ICMP-запиті до локального H1 і до віддаленого H4? Чим вони відрізняються?",
      ],
    },
    findings: [
      { title: "ARP-запит", body: "Адреса призначення — ff:ff:ff:ff:ff:ff (broadcast): вузол ще не знає MAC потрібного адресата, тож питає всіх. Тип кадру 0x0806 (ARP). OUI — перші 3 октети MAC, серійний номер — останні 3." },
      { title: "Локальна мережа", body: "У кадрі ICMP до H1 адреса джерела Ethernet — MAC H3-eth0, адреса призначення — MAC H1-eth0: хости в одній мережі, кадр адресовано безпосередньо одержувачу. IP-адреси: 10.0.0.13 → 10.0.0.11." },
      { title: "Віддалена мережа", body: "У кадрі ICMP до H4 IP-адреси 10.0.0.13 → 172.16.0.40, але адреса призначення Ethernet — MAC інтерфейсу R1-eth1 (шлюз), бо 172.16.0.40 поза мережею 10.0.0.0/24. MAC шлюзу H3 дізнався запитом ARP who-has 10.0.0.1. TTL у відповідях — 63 (пройдено один маршрутизатор)." },
      { title: "Висновок", body: "IP-адреси наскрізні й на шляху не змінюються, а MAC-адреси діють лише в межах сегмента: у своїй мережі кадр адресується одержувачу, у віддалену — шлюзу." },
    ],
    errata: [
      "MAC-адреси інтерфейсів Mininet генеруються випадково під час кожного запуску — у вас вони будуть інші.",
      "Методичка передбачає Wireshark у xterm H3; захоплення зручно робити tcpdump у файл і відкривати файл у Wireshark — результат той самий.",
    ],
  },
];
