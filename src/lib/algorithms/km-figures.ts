/**
 * Рисунки к КМ ЛР6: схема контекстов Cisco IOS (рис. 6.1) с командами
 * переходов и полигон варианта (маршрутизатор 1841 и ПК: Ethernet и консоль).
 */

import { netDrawing, type Drawing, type DrawItem } from "@/lib/drawing";

export function iosContexts(x: number): Drawing {
  const r = `Router${x}`;
  const items: DrawItem[] = [];
  const box = (bx: number, by: number, title: string, prompt: string) => {
    items.push({ k: "rect", x: bx, y: by, w: 220, h: 46, bold: true });
    items.push({ k: "text", x: bx + 110, y: by + 18, text: title, anchor: "middle", size: 11, bold: true, plain: true });
    items.push({ k: "text", x: bx + 110, y: by + 35, text: prompt, anchor: "middle", size: 11, plain: true });
  };
  box(30, 20, "Користувацький (User EXEC)", `${r}>`);
  box(30, 140, "Привілейований (Privileged EXEC)", `${r}#`);
  box(30, 260, "Глобальна конфігурація", `${r}(config)#`);
  const subs = [
    { y: 180, title: "Конфігурація інтерфейсу", prompt: `${r}(config-if)#`, cmd: "interface FastEthernet0/0" },
    { y: 260, title: "Конфігурація маршрутизації", prompt: `${r}(config-router)#`, cmd: "router rip" },
    { y: 340, title: "Конфігурація лінії", prompt: `${r}(config-line)#`, cmd: "line console 0" },
  ];
  subs.forEach((s) => box(470, s.y, s.title, s.prompt));
  const arrow = (pts: [number, number][], text: string, tx: number, ty: number, dashed = false, anchor: "start" | "end" | "middle" = "start") => {
    items.push({ k: "line", pts, arrow: true, dashed });
    items.push({ k: "text", x: tx, y: ty, text, size: 10, anchor, plain: true });
  };
  arrow([[80, 66], [80, 138]], "enable", 86, 106);
  arrow([[220, 138], [220, 68]], "disable", 226, 106);
  arrow([[80, 186], [80, 258]], "configure terminal", 86, 226);
  arrow([[220, 258], [220, 188]], "exit", 226, 226);
  subs.forEach((s, i) => {
    const y = s.y + 23;
    arrow([[250, 283 + (i - 1) * 8], [468, y]], s.cmd, 300, (283 + (i - 1) * 8 + y) / 2 - (i === 0 ? 10 : i === 2 ? -14 : 6));
  });
  // end / Ctrl+Z — из любого контекста конфигурации сразу в привилегированный
  arrow([[580, 178], [580, 150], [252, 150]], "end, Ctrl+Z — з будь-якого контексту конфігурації", 416, 144, true, "middle");
  items.push({ k: "text", x: 30, y: 350, text: "exit — на рівень вище:", size: 10, plain: true });
  items.push({ k: "text", x: 30, y: 364, text: "з (config-…)# у (config)#, з (config)# у #", size: 10, plain: true });
  return { w: 700, h: 420, items };
}

export function kmLab6Net(x: number): Drawing {
  return netDrawing(
    [
      { id: "r", kind: "router", x: 420, y: 60, name: `Router${x} (1841)`, lines: [`Fa0/0 192.168.${x}.1/24`], side: "right" },
      { id: "pc", kind: "pc", x: 120, y: 170, name: `PC${x}`, lines: [`192.168.${x}.2/24`], side: "left" },
    ],
    [{ a: "r", b: "pc", label: "Ethernet (Copper Cross-Over)" }],
    620,
    220,
  );
}

/** Полигон ЛР6 с консольным кабелем RS232 → Console отдельной пунктирной линией. */
export function kmLab6Figure(x: number): Drawing {
  const d = kmLab6Net(x);
  d.items.unshift({ k: "line", pts: [[134, 176], [440, 176], [440, 72]], dashed: true });
  d.items.push({ k: "text", x: 290, y: 192, text: "консоль: RS232 → Console", size: 9.5, anchor: "middle", plain: true });
  return d;
}
