/**
 * «Проектування засобів захисту інформації на ПЛІС» — генераторы VHDL для
 * лабораторных 1–4 и контрольного задания (Xilinx ISE, Spartan-3). Код
 * проверен в GHDL: анализ, элаборация и прогон стендов со сверкой.
 */

import { buildGates, parseFormula, truthTable, type Expr, type Formula } from "./schematics";

export const FORMULAS = [
  "Z=(V*K)+(notV*D)", "D=not(X+Y)*(Y+A)", "A=B+C*notB+K", "M=(L+K)*(notV+K)", "P=not((X+Z)*(Z+F))",
  "T=G+H+not(G*K)", "R=S*F*notS+notK", "C=notZ*X*(notV+D)", "N=U+Y+not(B*U)", "K=not(W*Y)+(Y*notF)",
  "V=not((X+L)*R)+L", "H=B*not(C+notB+K)", "X=notZ*N*(notN+notD)", "S=not(V*K)+(notV*D)", "P=not(X+Y)*(Y+notA)",
  "W=not(B*C+notB+K)", "R=(L*K)+notL+(notV*K)", "Y=not((X+Z)*(Z+F))", "S=G*H*not(G+K)", "T=S*F*notS+K",
  "U=V+X+(notV*D)", "K=U*Y*not(B+notU)", "C=not(W*Y)+(Y*D)", "Q=not((P+L)*R)+notL", "V=B*not(M+notB+K)",
  "Y=Z+N+(notN*notG)", "A=(U+V)*not(notC*U)", "C=not((L+Z)*(L+notF))",
];

export const formula = (v: number) => parseFormula(FORMULAS[v - 1]);

/** Выражение VHDL для формулы. */
export function vhdlExpr(e: Expr): string {
  switch (e.t) {
    case "var":
      return e.name;
    case "not":
      return e.a.t === "var" ? `not ${e.a.name}` : `not (${vhdlExpr(e.a)})`;
    case "and":
    case "or":
      return e.args.map((a) => (a.t === "and" || a.t === "or" ? `(${vhdlExpr(a)})` : vhdlExpr(a))).join(` ${e.t} `);
  }
}

const ent = (f: Formula, name: string) => `entity ${name} is
    Port ( ${f.vars.join(", ")} : in  STD_LOGIC;
           ${f.out} : out STD_LOGIC);
end ${name};`;

const HEAD = `library IEEE;
use IEEE.STD_LOGIC_1164.ALL;`;

/** ЛР 1: VHDL-модуль по формуле (потоковый стиль, параллельный оператор). */
export function lab1Vhdl(v: number): string {
  const f = formula(v);
  return `${HEAD}

-- Варіант ${v}: ${FORMULAS[v - 1]}
${ent(f, "Var" + v)}

architecture Behavioral of Var${v} is
begin
    ${f.out} <= ${vhdlExpr(f.expr)};
end Behavioral;`;
}

/** Символы схемного редактора Xilinx по вентилям из schematics.buildGates. */
const XSYM: Record<string, string> = { "7400": "nand2", "7402": "nor2", "7404": "inv", "7408": "and2", "7411": "and3", "7410": "nand3", "7427": "nor3", "7432": "or2" };

export function lab1Symbols(v: number) {
  return buildGates(formula(v)).gates.map((g) => ({ ref: g.ref.replace(/A$/, ""), sym: XSYM[g.part], inputs: g.inputs, output: g.output }));
}

// ----------------------------------------------------- ЛР 2: стилі опису

export function lab2Styles(v: number): { ifStyle: string; caseStyle: string; flow: string; struct: string; tb: string } {
  const f = formula(v);
  const n = f.vars.length;
  const rows = truthTable(f);
  const ifStyle = `${HEAD}

-- Поведінковий стиль (if), варіант ${v}: ${FORMULAS[v - 1]}
${ent(f, "Var" + v + "_if")}

architecture Behavioral of Var${v}_if is
begin
    process (${f.vars.join(", ")})
    begin
        if (${vhdlExpr(f.expr)}) = '1' then
            ${f.out} <= '1';
        else
            ${f.out} <= '0';
        end if;
    end process;
end Behavioral;`;
  const caseStyle = `${HEAD}

-- Поведінковий стиль (case) за таблицею істинності, варіант ${v}
${ent(f, "Var" + v + "_case")}

architecture Behavioral of Var${v}_case is
begin
    process (${f.vars.join(", ")})
        variable inp : STD_LOGIC_VECTOR(${n - 1} downto 0);
    begin
        inp := ${f.vars.join(" & ")};
        case inp is
${rows.map((r) => `            when "${r.inputs.join("")}" => ${f.out} <= '${r.out}';`).join("\n")}
            when others => ${f.out} <= '0';
        end case;
    end process;
end Behavioral;`;
  const flow = `${HEAD}

-- Потоковий стиль, варіант ${v}
${ent(f, "Var" + v + "_flow")}

architecture Dataflow of Var${v}_flow is
begin
    ${f.out} <= ${vhdlExpr(f.expr)};
end Dataflow;`;
  const { gates } = buildGates(f);
  const kinds = [...new Set(gates.map((g) => XSYM[g.part]))];
  const GATE: Record<string, { ins: number; op: string }> = {
    inv: { ins: 1, op: "not a" },
    and2: { ins: 2, op: "a and b" },
    or2: { ins: 2, op: "a or b" },
    nand2: { ins: 2, op: "not (a and b)" },
    nor2: { ins: 2, op: "not (a or b)" },
    and3: { ins: 3, op: "a and b and c" },
    nand3: { ins: 3, op: "not (a and b and c)" },
    nor3: { ins: 3, op: "not (a or b or c)" },
  };
  const pins = (k: number) => ["a", "b", "c"].slice(0, k);
  const gateEntities = kinds
    .map(
      (k) => `${HEAD}
entity g_${k} is
    Port ( ${pins(GATE[k].ins).join(", ")} : in STD_LOGIC; y : out STD_LOGIC);
end g_${k};
architecture F of g_${k} is
begin
    y <= ${GATE[k].op};
end F;`,
    )
    .join("\n\n");
  const internal = gates.map((g) => g.output).filter((o) => o !== f.out);
  const struct = `-- Структурний стиль, варіант ${v}: елементи — окремі сутності, з'єднані сигналами
${gateEntities}

${HEAD}
${ent(f, "Var" + v + "_struct")}

architecture Structural of Var${v}_struct is
${kinds.map((k) => `    component g_${k}\n        Port ( ${pins(GATE[k].ins).join(", ")} : in STD_LOGIC; y : out STD_LOGIC);\n    end component;`).join("\n")}
${internal.length ? `    signal ${internal.join(", ")} : STD_LOGIC;\n` : ""}begin
${gates.map((g) => `    ${g.ref.replace(/A$/, "")}: g_${XSYM[g.part]} port map (${[...g.inputs, g.output].join(", ")});`).join("\n")}
end Structural;`;
  const tb = `${HEAD}

-- VHDL Test Bench: входи перебирають усі ${1 << n} комбінацій (як двійковий лічильник)
entity tb_Var${v} is
end tb_Var${v};

architecture behavior of tb_Var${v} is
    component Var${v}_flow
        Port ( ${f.vars.join(", ")} : in STD_LOGIC; ${f.out} : out STD_LOGIC);
    end component;
    signal ${f.vars.join(", ")} : STD_LOGIC := '0';
    signal ${f.out} : STD_LOGIC;
begin
    uut: Var${v}_flow port map (${[...f.vars, f.out].join(", ")});

${f.vars.map((x, k) => `    ${x} <= not ${x} after ${10 * (1 << (n - 1 - k))} ns;`).join("\n")}
end behavior;`;
  return { ifStyle, caseStyle, flow, struct, tb };
}

// ------------------------------------------------ ЛР 3: тригери і регістри

export function lab3Vhdl(odd: boolean): { latch: string; dff: string; structural: string; behavioral: string; tb: string; ucf: string } {
  const latch = `${HEAD}

-- «Прозорий» D-тригер зі статичним входом C: поки C = '1', Q повторює D
entity D_latch is
    Port ( D, C : in STD_LOGIC; Q : out STD_LOGIC);
end D_latch;

architecture Behavioral of D_latch is
begin
    process (D, C)
    begin
        if C = '1' then
            Q <= D;
        end if;
    end process;
end Behavioral;`;
  const dff = `${HEAD}

-- «Непрозорий» D-тригер з динамічним входом Clk і асинхронним скиданням
entity D_ff is
    Port ( D, Clk, Rst : in STD_LOGIC; Q : out STD_LOGIC);
end D_ff;

architecture Behavioral of D_ff is
begin
    process (Clk, Rst)
    begin
        if Rst = '1' then
            Q <= '0';
        elsif rising_edge(Clk) then
            Q <= D;
        end if;
    end process;
end Behavioral;`;
  if (odd) {
    const structural = `${HEAD}

-- 2-розрядний регістр з паралельним занесенням — структурний стиль (два D_ff)
entity RG2_struct is
    Port ( D : in STD_LOGIC_VECTOR(1 downto 0); Clk, Rst : in STD_LOGIC;
           Q : out STD_LOGIC_VECTOR(1 downto 0));
end RG2_struct;

architecture Structural of RG2_struct is
    component D_ff
        Port ( D, Clk, Rst : in STD_LOGIC; Q : out STD_LOGIC);
    end component;
begin
    T0: D_ff port map (D(0), Clk, Rst, Q(0));
    T1: D_ff port map (D(1), Clk, Rst, Q(1));
end Structural;`;
    const behavioral = `${HEAD}

-- 2-розрядний регістр з паралельним занесенням — поведінковий стиль
entity RG2_beh is
    Port ( D : in STD_LOGIC_VECTOR(1 downto 0); Clk, Rst : in STD_LOGIC;
           Q : out STD_LOGIC_VECTOR(1 downto 0));
end RG2_beh;

architecture Behavioral of RG2_beh is
begin
    process (Clk, Rst)
    begin
        if Rst = '1' then
            Q <= "00";
        elsif rising_edge(Clk) then
            Q <= D;                       -- обидва розряди записуються одночасно
        end if;
    end process;
end Behavioral;`;
    const tb = `${HEAD}

entity tb_RG2 is
end tb_RG2;

architecture behavior of tb_RG2 is
    component RG2_struct
        Port ( D : in STD_LOGIC_VECTOR(1 downto 0); Clk, Rst : in STD_LOGIC;
               Q : out STD_LOGIC_VECTOR(1 downto 0));
    end component;
    signal D : STD_LOGIC_VECTOR(1 downto 0) := "00";
    signal Clk : STD_LOGIC := '0';
    signal Rst : STD_LOGIC := '1';
    signal Q : STD_LOGIC_VECTOR(1 downto 0);
begin
    uut: RG2_struct port map (D, Clk, Rst, Q);
    Clk <= not Clk after 20 ns;                               -- період 40 нс
    Rst <= '0' after 30 ns;
    D <= "01" after 50 ns, "10" after 130 ns, "11" after 210 ns, "00" after 290 ns;
end behavior;`;
    const ucf = `# Spartan-3 Starter Kit: такт — кнопка, дані — перемикачі, виходи — світлодіоди
NET "Clk"  LOC = "L14";   # BTN3 (ручний такт)
NET "Clk"  CLOCK_DEDICATED_ROUTE = FALSE;
NET "Rst"  LOC = "M13";   # BTN0
NET "D<0>" LOC = "F12";   # SW0
NET "D<1>" LOC = "G12";   # SW1
NET "Q<0>" LOC = "K12";   # LD0
NET "Q<1>" LOC = "P14";   # LD1`;
    return { latch, dff, structural, behavioral, tb, ucf };
  }
  const structural = `${HEAD}

-- 3-розрядний зсувний регістр з послідовним занесенням (зі сторони старшого розряду) — структурний стиль
entity RG3_struct is
    Port ( Din, Clk, Rst : in STD_LOGIC;
           Q : out STD_LOGIC_VECTOR(2 downto 0));
end RG3_struct;

architecture Structural of RG3_struct is
    component D_ff
        Port ( D, Clk, Rst : in STD_LOGIC; Q : out STD_LOGIC);
    end component;
    signal q_int : STD_LOGIC_VECTOR(2 downto 0);
begin
    T2: D_ff port map (Din,      Clk, Rst, q_int(2));   -- новий біт — у старший розряд
    T1: D_ff port map (q_int(2), Clk, Rst, q_int(1));
    T0: D_ff port map (q_int(1), Clk, Rst, q_int(0));
    Q <= q_int;
end Structural;`;
  const behavioral = `${HEAD}

-- 3-розрядний зсувний регістр з послідовним занесенням — поведінковий стиль
entity RG3_beh is
    Port ( Din, Clk, Rst : in STD_LOGIC;
           Q : out STD_LOGIC_VECTOR(2 downto 0));
end RG3_beh;

architecture Behavioral of RG3_beh is
    signal q_int : STD_LOGIC_VECTOR(2 downto 0);
begin
    process (Clk, Rst)
    begin
        if Rst = '1' then
            q_int <= "000";
        elsif rising_edge(Clk) then
            q_int <= Din & q_int(2 downto 1);   -- зсув вправо, Din — у старший розряд
        end if;
    end process;
    Q <= q_int;
end Behavioral;`;
  const tb = `${HEAD}

entity tb_RG3 is
end tb_RG3;

architecture behavior of tb_RG3 is
    component RG3_struct
        Port ( Din, Clk, Rst : in STD_LOGIC; Q : out STD_LOGIC_VECTOR(2 downto 0));
    end component;
    signal Din : STD_LOGIC := '0';
    signal Clk : STD_LOGIC := '0';
    signal Rst : STD_LOGIC := '1';
    signal Q : STD_LOGIC_VECTOR(2 downto 0);
begin
    uut: RG3_struct port map (Din, Clk, Rst, Q);
    Clk <= not Clk after 20 ns;                               -- період 40 нс
    Rst <= '0' after 30 ns;
    Din <= '1' after 50 ns, '0' after 90 ns, '1' after 130 ns, '1' after 170 ns, '0' after 210 ns;
end behavior;`;
  const ucf = `# Spartan-3 Starter Kit: такт — кнопка, послідовний вхід — перемикач, виходи — світлодіоди
NET "Clk"  LOC = "L14";   # BTN3 (ручний такт)
NET "Clk"  CLOCK_DEDICATED_ROUTE = FALSE;
NET "Rst"  LOC = "M13";   # BTN0
NET "Din"  LOC = "F12";   # SW0
NET "Q<0>" LOC = "K12";   # LD0
NET "Q<1>" LOC = "P14";   # LD1
NET "Q<2>" LOC = "L12";   # LD2`;
  return { latch, dff, structural, behavioral, tb, ucf };
}

/** Ожидаемые Q после каждого фронта для стендов ЛР 3 (фронты на 20, 60, 100, … нс). */
export function lab3Expected(odd: boolean): { t: number; q: string }[] {
  const out: { t: number; q: string }[] = [];
  let q = 0;
  for (let t = 20; t <= 300; t += 40) {
    const rst = t < 30;
    if (odd) {
      const d = t >= 290 ? 0 : t >= 210 ? 3 : t >= 130 ? 2 : t >= 50 ? 1 : 0;
      q = rst ? 0 : d;
      out.push({ t, q: q.toString(2).padStart(2, "0") });
    } else {
      const din = t >= 210 ? 0 : t >= 130 ? 1 : t >= 90 ? 0 : t >= 50 ? 1 : 0;
      q = rst ? 0 : (din << 2) | (q >> 1);
      out.push({ t, q: q.toString(2).padStart(3, "0") });
    }
  }
  return out;
}

// ------------------------------------- ЛР 4: універсальні регістр і лічильник

export interface RgVariant {
  n: number;
  rst: boolean;
  en: boolean;
  clk: boolean;
  load: boolean;
  direct: boolean;
  mhz: number;
  hex: string;
}

const P = true;
const I = false;
/** Табл. «Завдання для лабораторної роботи RG і CT»: true — прямий, false — інверсний. */
export const RG: RgVariant[] = [
  [8, P, I, I, P, I, 2, "4F"], [12, I, P, P, I, P, 10, "3A8"], [10, P, I, I, P, I, 5, "2B7"], [6, I, P, P, I, P, 20, "3E"],
  [8, P, I, I, P, I, 8, "7B"], [12, P, I, P, I, P, 4, "6D5"], [10, I, P, P, P, I, 2, "1F9"], [6, P, I, I, P, P, 10, "2C"],
  [8, I, P, P, I, P, 5, "4F"], [12, P, I, I, P, I, 20, "3A8"], [10, P, I, P, I, P, 8, "2B7"], [6, I, P, P, P, I, 4, "3E"],
  [8, P, I, I, P, P, 2, "7B"], [12, I, P, P, I, P, 10, "6D5"], [10, P, I, I, P, I, 5, "1F9"], [6, P, P, P, I, P, 20, "2C"],
  [8, I, P, P, P, I, 8, "4F"], [12, P, I, I, P, P, 4, "3A8"], [10, I, P, P, I, P, 2, "2B7"], [6, P, I, I, P, I, 10, "3E"],
  [14, I, P, P, I, P, 5, "7B"], [8, P, I, I, P, I, 20, "6D5"],
].map(([n, rst, en, clk, load, direct, mhz, hex]) => ({ n, rst, en, clk, load, direct, mhz, hex }) as RgVariant);

const lvl = (active: boolean) => (active ? "'1'" : "'0'");
const inact = (active: boolean) => (active ? "'0'" : "'1'");

export const periodNs = (mhz: number) => 1000 / mhz;

export function lab4Vhdl(v: number): { rg: string; ct: string; tbRg: string; tbCt: string; ucf: string } {
  const r = RG[v - 1];
  const edge = r.clk ? "rising_edge(Clk)" : "falling_edge(Clk)";
  const n1 = r.n - 1;
  const note = `-- Варіант ${v}: N = ${r.n}; Rst ${r.rst ? "прямий" : "інверсний"}, En ${r.en ? "прямий" : "інверсний"}, Clk ${r.clk ? "прямий (передній фронт)" : "інверсний (задній фронт)"}, Load ${r.load ? "прямий" : "інверсний"}, Direct ${r.direct ? "прямий" : "інверсний"}`;
  const rg = `${HEAD}

${note}
-- Універсальний регістр: скидання, паралельне занесення, зсув вправо/вліво з послідовним входом
entity URG${v} is
    Port ( Clk, Rst, En, Load, Direct, SerIn : in STD_LOGIC;
           D : in  STD_LOGIC_VECTOR(${n1} downto 0);
           Q : out STD_LOGIC_VECTOR(${n1} downto 0));
end URG${v};

architecture Behavioral of URG${v} is
    signal q_int : STD_LOGIC_VECTOR(${n1} downto 0);
begin
    process (Clk, Rst)
    begin
        if Rst = ${lvl(r.rst)} then                    -- асинхронне скидання
            q_int <= (others => '0');
        elsif ${edge} then
            if En = ${lvl(r.en)} then
                if Load = ${lvl(r.load)} then             -- паралельне занесення
                    q_int <= D;
                elsif Direct = ${lvl(r.direct)} then      -- зсув вправо (до молодших розрядів)
                    q_int <= SerIn & q_int(${n1} downto 1);
                else                                     -- зсув вліво (до старших розрядів)
                    q_int <= q_int(${n1 - 1} downto 0) & SerIn;
                end if;
            end if;
        end if;
    end process;
    Q <= q_int;
end Behavioral;`;
  const ct = `${HEAD}
use IEEE.NUMERIC_STD.ALL;

${note}
-- Універсальний лічильник: скидання, паралельне занесення, пряма і зворотна лічба
entity UCT${v} is
    Port ( Clk, Rst, En, Load, Direct : in STD_LOGIC;
           D : in  STD_LOGIC_VECTOR(${n1} downto 0);
           Q : out STD_LOGIC_VECTOR(${n1} downto 0));
end UCT${v};

architecture Behavioral of UCT${v} is
    signal cnt : unsigned(${n1} downto 0);
begin
    process (Clk, Rst)
    begin
        if Rst = ${lvl(r.rst)} then
            cnt <= (others => '0');
        elsif ${edge} then
            if En = ${lvl(r.en)} then
                if Load = ${lvl(r.load)} then
                    cnt <= unsigned(D);
                elsif Direct = ${lvl(r.direct)} then      -- пряма лічба (+1)
                    cnt <= cnt + 1;
                else                                     -- зворотна лічба (−1)
                    cnt <= cnt - 1;
                end if;
            end if;
        end if;
    end process;
    Q <= std_logic_vector(cnt);
end Behavioral;`;
  const T = periodNs(r.mhz);
  const init = parseInt(r.hex, 16) & ((1 << r.n) - 1);   // у варіанті 22 значення 6D5 не вміщується у 8 розрядів
  const dInit = `std_logic_vector(to_unsigned(${init}, ${r.n}))`;
  const tb = (unit: string) => `${HEAD}
use IEEE.NUMERIC_STD.ALL;

-- Стенд: такт ${r.mhz} МГц (період ${T} нс); скидання, занесення ${init.toString(16).toUpperCase()}₁₆ = ${init}, 4 такти в одному напрямку, 4 — в іншому
entity tb_${unit}${v} is
end tb_${unit}${v};

architecture behavior of tb_${unit}${v} is
    component ${unit}${v}
        Port ( Clk, Rst, En, Load, Direct${unit === "URG" ? ", SerIn" : ""} : in STD_LOGIC;
               D : in  STD_LOGIC_VECTOR(${n1} downto 0);
               Q : out STD_LOGIC_VECTOR(${n1} downto 0));
    end component;
    constant T : time := ${T} ns;
    signal Clk : STD_LOGIC := ${r.clk ? "'0'" : "'1'"};
    signal Rst : STD_LOGIC := ${lvl(r.rst)};
    signal En : STD_LOGIC := ${lvl(r.en)};
    signal Load : STD_LOGIC := ${inact(r.load)};
    signal Direct : STD_LOGIC := ${lvl(r.direct)};
${unit === "URG" ? "    signal SerIn : STD_LOGIC := '1';\n" : ""}    signal D : STD_LOGIC_VECTOR(${n1} downto 0) := ${dInit};
    signal Q : STD_LOGIC_VECTOR(${n1} downto 0);
begin
    uut: ${unit}${v} port map (Clk, Rst, En, Load, Direct${unit === "URG" ? ", SerIn" : ""}, D, Q);
    Clk <= not Clk after T / 2;
    Rst <= ${inact(r.rst)} after T / 4;                     -- скидання знімається до першого фронту
    Load <= ${lvl(r.load)} after T / 4, ${inact(r.load)} after T + T / 4;   -- занесення на першому фронті
    Direct <= ${inact(r.direct)} after 5 * T + T / 4;       -- з 6-го фронту — інший напрямок
    En <= ${inact(r.en)} after 9 * T + T / 4;               -- з 10-го фронту — заборона
end behavior;`;
  const ucf = `# Spartan-3 Starter Kit (UG130): такт і керування — кнопки й перемикачі, молодші розряди Q — світлодіоди
NET "Clk"    LOC = "L14";   # BTN3 (ручний такт; для ${r.mhz} МГц — від генератора T9 через дільник)
NET "Clk"    CLOCK_DEDICATED_ROUTE = FALSE;
NET "Rst"    LOC = "M13";   # BTN0
NET "Load"   LOC = "M14";   # BTN1
NET "En"     LOC = "K13";   # SW7
NET "Direct" LOC = "K14";   # SW6
${[0, 1, 2, 3, 4, 5].slice(0, Math.min(6, r.n)).map((k) => `NET "D<${k}>"   LOC = "${["F12", "G12", "H14", "H13", "J14", "J13"][k]}";   # SW${k}`).join("\n")}
${[0, 1, 2, 3, 4, 5, 6, 7].slice(0, Math.min(8, r.n)).map((k) => `NET "Q<${k}>"   LOC = "${["K12", "P14", "L12", "N14", "P13", "N12", "P12", "P11"][k]}";   # LD${k}`).join("\n")}`;
  return { rg, ct, tbRg: tb("URG"), tbCt: tb("UCT"), ucf };
}

/** Ожидаемые значения Q по фронтам стенда ЛР 4 (регистр и счётчик). */
export function lab4Expected(v: number) {
  const r = RG[v - 1];
  const mask = (1 << r.n) - 1;
  const init = parseInt(r.hex, 16) & mask;
  let rg = 0;
  let ct = 0;
  const rows: { k: number; mode: string; rg: number; ct: number }[] = [];
  for (let k = 1; k <= 10; k++) {
    let mode: string;
    if (k === 1) {
      rg = init;
      ct = init;
      mode = "занесення";
    } else if (k <= 5) {
      rg = ((1 << (r.n - 1)) | (rg >> 1)) & mask;
      ct = (ct + 1) & mask;
      mode = "вправо / +1";
    } else if (k <= 9) {
      rg = ((rg << 1) | 1) & mask;
      ct = (ct - 1) & mask;
      mode = "вліво / −1";
    } else mode = "En неактивний";
    rows.push({ k, mode, rg, ct });
  }
  return { init, rows };
}

// ------------------------------------------------- контрольне: обчислювач

export interface CpuVariant {
  n: number;
  m: number;
  k: number;
  ops: string[];
}

/** Таблиця варіантів контрольного завдання (KontrZavdan_PZZI_PLIS_2021). */
export const CPU: CpuVariant[] = [
  [17, 14, 6, "NAnd,*,-,→"], [19, 16, 7, "←,+,*,XOr"], [11, 18, 7, "Not Op1,And,+,*,XOr"], [12, 19, 8, "Not Op2,-,+,*,XOr"],
  [13, 22, 9, "Not Op2,And,+,*,NOr"], [14, 14, 6, "NAnd,+,*,←"], [15, 16, 7, "→,-,*,XOr"], [16, 18, 7, "Not Op2,And,+,*,XOr"],
  [17, 19, 8, "Not Op1,-,+,*,XOr"], [12, 22, 9, "Not Op1,And,+,-,NOr"], [17, 14, 6, "←,*,-,Or"], [18, 16, 7, "→,+,*,XOr"],
  [15, 17, 7, "Not Op1,And,+,*,XOr"], [16, 20, 8, "Not Op1,-,+,*,XOr"], [17, 22, 9, "Not Op2,NAnd,+,*,XOr"], [18, 12, 5, "NAnd,+,-,←"],
  [19, 14, 5, "Not Op2,NAnd,+,*,Or"], [17, 20, 8, "Not Op1,NAnd,+,*,XOr"], [18, 16, 6, "→,+,*,XOr"], [19, 18, 7, "Not Op2,NAnd,+,*,XOr"],
  [15, 19, 8, "Not Op1,NOr,-,*,XOr"], [16, 17, 7, "And,+,*,←"],
].map(([n, m, k, ops]) => ({ n, m, k, ops: (ops as string).split(",").map((s) => s.trim()) }) as CpuVariant);

const bitsFor = (x: number) => Math.max(1, Math.ceil(Math.log2(x)));

export function cpuLayout(v: number) {
  const c = CPU[v - 1];
  return { ...c, opBits: c.m - 2 * c.k, needBits: bitsFor(c.ops.length), pcBits: bitsFor(c.n) };
}

/** Результат операции на K битах (как в ALP). */
export function aluOp(op: string, a: number, b: number, k: number): number {
  const mask = (1 << k) - 1;
  switch (op) {
    case "NAnd":
      return ~(a & b) & mask;
    case "And":
      return a & b;
    case "Or":
      return a | b;
    case "NOr":
      return ~(a | b) & mask;
    case "XOr":
      return a ^ b;
    case "+":
      return (a + b) & mask;
    case "-":
      return (a - b) & mask;
    case "*":
      return (a * b) & mask;
    case "←":
      return b >= k ? 0 : (a << b) & mask;
    case "→":
      return b >= k ? 0 : a >> b;
    case "Not Op1":
      return ~a & mask;
    case "Not Op2":
      return ~b & mask;
  }
  throw new Error(op);
}

/** Тестова програма: команди по черзі перебирають операції, операнди — з простого ряду. */
export function cpuProgram(v: number) {
  const c = cpuLayout(v);
  const mask = (1 << c.k) - 1;
  return Array.from({ length: c.n }, (_, i) => {
    const code = i % c.ops.length;
    const op = c.ops[code];
    const a = (5 + 7 * i) & mask;
    const b = op === "←" || op === "→" ? (i % 3) + 1 : (3 + 5 * i) & mask;
    return { i, code, op, a, b, y: aluOp(op, a, b, c.k) };
  });
}

const vhdlOp = (op: string, k: number) => {
  switch (op) {
    case "NAnd":
      return "std_logic_vector(not (op1 and op2))";
    case "And":
      return "std_logic_vector(op1 and op2)";
    case "Or":
      return "std_logic_vector(op1 or op2)";
    case "NOr":
      return "std_logic_vector(not (op1 or op2))";
    case "XOr":
      return "std_logic_vector(op1 xor op2)";
    case "+":
      return "std_logic_vector(op1 + op2)";
    case "-":
      return "std_logic_vector(op1 - op2)";
    case "*":
      return `std_logic_vector(resize(op1 * op2, ${k}))`;
    case "←":
      return "std_logic_vector(shift_left(op1, to_integer(op2)))";
    case "→":
      return "std_logic_vector(shift_right(op1, to_integer(op2)))";
    case "Not Op1":
      return "std_logic_vector(not op1)";
    case "Not Op2":
      return "std_logic_vector(not op2)";
  }
  throw new Error(op);
};

const bin = (x: number, w: number) => x.toString(2).padStart(w, "0");

export function cpuVhdl(v: number): { top: string; tb: string } {
  const c = cpuLayout(v);
  const prog = cpuProgram(v);
  const { m, k, opBits, pcBits, n } = c;
  const top = `${HEAD}
use IEEE.NUMERIC_STD.ALL;

-- Спрощений обчислювач, варіант ${v}: N = ${n} команд, M = ${m}, K = ${k}, код операції — ${opBits} розр.
-- Формат команди: [${m - 1}:${2 * k}] КОп, [${2 * k - 1}:${k}] Op1, [${k - 1}:0] Op2
-- Коди операцій: ${c.ops.map((o, i) => `${bin(i, opBits)} — ${o}`).join("; ")}
entity CPU${v} is
    Port ( Clk, Rst : in  STD_LOGIC;
           Y        : out STD_LOGIC_VECTOR(${k - 1} downto 0));
end CPU${v};

architecture Behavioral of CPU${v} is
    type rom_type is array (0 to ${n - 1}) of STD_LOGIC_VECTOR(${m - 1} downto 0);
    constant ROM : rom_type := (
${prog.map((p) => `        "${bin(p.code, opBits)}${bin(p.a, k)}${bin(p.b, k)}"${p.i < n - 1 ? "," : " "}   -- ${p.i}: ${p.op} ${p.a}, ${p.b}`).join("\n")}
    );
    type state_type is (FETCH, EXEC, NEXT_ADDR);        -- 3 такти на команду
    signal state : state_type;
    signal pc    : unsigned(${pcBits - 1} downto 0);
    signal ir    : STD_LOGIC_VECTOR(${m - 1} downto 0);
    signal res   : STD_LOGIC_VECTOR(${k - 1} downto 0);

    -- ALP: результат операції над беззнаковими K-розрядними операндами
    function alp(kop : STD_LOGIC_VECTOR; op1, op2 : unsigned) return STD_LOGIC_VECTOR is
    begin
        case to_integer(unsigned(kop)) is
${c.ops.map((o, i) => `            when ${i} => return ${vhdlOp(o, k)};   -- ${o}`).join("\n")}
            when others => return (${k - 1} downto 0 => '0');
        end case;
    end function;
begin
    process (Clk, Rst)
    begin
        if Rst = '1' then
            state <= FETCH;
            pc <= (others => '0');
            res <= (others => '0');
        elsif rising_edge(Clk) then
            case state is
                when FETCH =>                          -- 1: вибірка команди з ROM
                    ir <= ROM(to_integer(pc));
                    state <= EXEC;
                when EXEC =>                           -- 2: дешифрація і виконання в ALP
                    res <= alp(ir(${m - 1} downto ${2 * k}), unsigned(ir(${2 * k - 1} downto ${k})), unsigned(ir(${k - 1} downto 0)));
                    state <= NEXT_ADDR;
                when NEXT_ADDR =>                      -- 3: адреса наступної команди
                    if pc = ${n - 1} then
                        pc <= (others => '0');
                    else
                        pc <= pc + 1;
                    end if;
                    state <= FETCH;
            end case;
        end if;
    end process;
    Y <= res;
end Behavioral;`;
  const tb = `${HEAD}

-- Стенд: такт 20 нс, вся програма — 3·${n} = ${3 * n} тактів (${3 * n * 20} нс)
entity tb_CPU${v} is
end tb_CPU${v};

architecture behavior of tb_CPU${v} is
    component CPU${v}
        Port ( Clk, Rst : in STD_LOGIC; Y : out STD_LOGIC_VECTOR(${k - 1} downto 0));
    end component;
    signal Clk : STD_LOGIC := '0';
    signal Rst : STD_LOGIC := '1';
    signal Y   : STD_LOGIC_VECTOR(${k - 1} downto 0);
begin
    uut: CPU${v} port map (Clk, Rst, Y);
    Clk <= not Clk after 10 ns;
    Rst <= '0' after 15 ns;
end behavior;`;
  return { top, tb };
}
