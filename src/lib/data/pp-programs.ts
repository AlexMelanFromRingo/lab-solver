/**
 * «Проектний практикум» — остаточні тексти програм C# (Visual Studio,
 * .NET Framework, Windows Forms) після виконання всіх пунктів методички.
 * Логіку (вибірки, сортування, цикл енергії, класи моделей) прогнано в
 * консольному проекті dotnet; форми Windows Forms — лише в Windows.
 */

import { SIGNALS, lab4Tasks } from "@/lib/algorithms/pp";

// ------------------------------------------------------------ ЛР 1

export const PP1_CONSOLE = `using System;

namespace ConsoleApp
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.Write("U, В: ");
            double U = Convert.ToDouble( Console.ReadLine() );
            Console.Write("R, Ом: ");
            double R = Convert.ToDouble( Console.ReadLine() );
            double I = U / R;
            Console.WriteLine("I, А: " + I);
            Console.WriteLine("Для виходу натисніть Enter");
            Console.ReadLine(); //очікування натиснення Enter
        }
    }
}`;

export const PP1_FORM = `using System;
using System.Windows.Forms;

namespace WinApp
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void btnOK_Click(object sender, EventArgs e)
        {
            double U = Convert.ToDouble( txtBxU.Text );
            double R = Convert.ToDouble( txtBxR.Text );
            double I = U / R;
            txtBxOut.Text = Convert.ToString(I);
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            txtBxU.Text = Convert.ToString(2.7);
            txtBxR.Text = Convert.ToString(50);
        }
    }
}`;

// ------------------------------------------------------------ ЛР 2

/** Тело btnOK_Click: после п. 7 (без защиты) или окончательное после п. 14. */
export function pp2Click(v: number, guarded: boolean): string {
  const s = SIGNALS[v - 1];
  const fn = s.fn === "SIN" ? "Sin" : "Cos";
  const read = guarded
    ? `            // читання з TextBox
            if (!double.TryParse(txtBxA.Text, out a) ||
                !double.TryParse(txtBxB.Text, out b) )
            {   MessageBox.Show("Введіть дійсні числа a та b.");
                return;
            }
            // перевірка границь
            if (a >= b)
            {   MessageBox.Show("Неузгодженість a та b.");
                return;
            }`
    : `            a = Convert.ToDouble(txtBxA.Text); b = Convert.ToDouble(txtBxB.Text);`;
  const checkN = guarded
    ? `
            // перевірка інтервалів
            if ( n < 1 )
            {   MessageBox.Show("К-сть інтервалів повинна бути більша нуля.");
                return;
            }`
    : "";
  return `        private void btnOK_Click(object sender, EventArgs e)
        {
            double a, b;
${read}
            int n = (int)nmrcUpDnN.Value;${checkN}
            double E = 0;
            double deltaT = (b - a) / n;
            for (double t = a + deltaT / 2; t <= b; t = t + deltaT)
            {   E = E + Math.Pow(${s.u} * Math.${fn}(2 * Math.PI * ${s.f} * t + ${s.phase}), 2);
            }
            E = E * deltaT;
            txtBxOut.AppendText(
                "К-сть інтервалів: " + n + Environment.NewLine +
                "Енергія сигналу: " + E.ToString("f5") +
                Environment.NewLine);
        }`;
}

/** Строки тела метода без пустых и комментариев — L1, L2 из п. 8 и 15. */
export function bodyLines(method: string): number {
  const lines = method.split("\n");
  const inner = lines.slice(lines.findIndex((l) => l.trim() === "{") + 1, lines.length - 1);
  return inner.filter((l) => l.trim() !== "" && !l.trim().startsWith("//")).length;
}

export function pp2Program(v: number): string {
  const s = SIGNALS[v - 1];
  return `using System;
using System.Windows.Forms;

namespace SignalEnergy
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            // варіант ${v}: u(t) = ${s.u}·${s.fn.toLowerCase()}(2π·${s.f}·t + ${s.phase}), a = 0, b = 1/f
            txtBxA.Text = Convert.ToString(0.0);
            txtBxB.Text = Convert.ToString(1.0 / ${s.f});
            nmrcUpDnN.Value = 2M;
            nmrcUpDnN.Maximum = 1e3M;
        }

${pp2Click(v, true)}
    }
}`;
}

// ------------------------------------------------------------ ЛР 3

export const PP3_FORM = `using System;
using System.Windows.Forms;

namespace ArraySort
{
    public partial class Form1 : Form
    {
        // кількість перестановок елементів масиву
        int countSwaps = 0;

        public Form1()
        {
            InitializeComponent();
        }

        private void btnOK_Click(object sender, EventArgs e)
        {
            // масиви до та після сортування, відповідно
            int[] unsorted, sorted;

            try
            {   // ввести (прочитати) дані з форми
                InputData(out unsorted);

                // копіювати масив поверхнево
                sorted = (int[])unsorted.Clone();

                // сортувати масив
                SortArray(sorted);
            }
            catch (Exception exn)
            {   MessageBox.Show(exn.Message, this.Text);
                return;
            }

            // вивести результат
            OutResult(unsorted, sorted);
        }

        // Form1_Load — з заготовки без змін

        // Переставити (обміняти місцями) елементи a[i] та a[j].
        void Swap(int[] a, int i, int j)
        {
            int temp = a[i];
            a[i] = a[j];
            a[j] = temp;
            countSwaps++;
        }

        // Cортувати методом вставок підмасив, отриманий з масиву а з кроком step.
        void InsertionSort(int[] a, int step)
        {
            for (int i = step; i < a.Length; i++)
            {   for (int j = i; (j >= step) && (a[j - step] > a[j]); j -= step)
                {   Swap(a, j - step, j); }
            }
        }

        // Сортувати методом вставок.
        void InsertionSort(int[] a)
        {
            InsertionSort(a, 1);
        }

        // Сортувати методом Шелла.
        void ShellSort(int[] a)
        {
            for (int step = a.Length / 2; step > 0; step /= 2)
            {   InsertionSort(a, step); }
        }

        // Ввести (прочитати) дані з форми.
        void InputData(out int[] a)
        {
            int N = (int)nmrcUpDnN.Value;
            if (N < 1)
            {   throw new ArgumentOutOfRangeException("N", "Некоректна довжина масиву!");
            }
            a = new int[N];
            switch (cmbBxArrayInitialization.SelectedIndex)
            {
                // ініціалізувати масив елементами за зростанням
                case 0:
                    for (int i = 0; i < N; i++)
                    {   a[i] = i; }
                    return;

                // ініціалізувати масив елементами за спаданням
                case 1:
                    for (int i = 0; i < N; i++)
                    {   a[i] = -i + (N - 1); }
                    return;

                // ініціалізувати масив випадковими числами
                case 2:
                    Random r = new Random();
                    for (int i = 0; i < N; i++)
                    {   a[i] = r.Next(10); }
                    return;

                default:
                    throw new ArgumentOutOfRangeException("cmbBxInit.SelectedIndex",
                        "Некоректний вибір ініціалізації масиву!");
            }
        }

        // Сортувати масив.
        void SortArray(int[] a)
        {
            switch (cmbBxSortMethod.SelectedIndex)
            {
                case 0:
                    InsertionSort(a);
                    break;
                case 1:
                    ShellSort(a);
                    break;
                default:
                    throw new ArgumentOutOfRangeException("cmbBxSortMethod.SelectedIndex",
                        "Некоректний вибір методу сортування!");
            }
        }

        // OutResult — з CodeFile3.cs без змін
    }
}`;

// ------------------------------------------------------------ ЛР 4

const SUB_CODE: Record<number, string> = {
  1: `        // Кількості ненульових елементів в кожному рядку окремо.
        List<int> GetSubarray(int[,] a)
        {
            List<int> subarray = new List<int>();
            int rows = a.GetLength(0), cols = a.GetLength(1);
            for (int i = 0; i < rows; i++)
            {   int count = 0;
                for (int j = 0; j < cols; j++)
                {   countOperations++;
                    if (a[i, j] != 0) count++;
                }
                subarray.Add(count);
            }
            return subarray;
        }`,
  2: `        // Ненульові елементи по діагоналі, починаючи з [0, 0].
        List<int> GetSubarray(int[,] a)
        {
            List<int> subarray = new List<int>();
            int n = Math.Min(a.GetLength(0), a.GetLength(1));
            for (int k = 0; k < n; k++)
            {   countOperations++;
                if (a[k, k] != 0) subarray.Add(a[k, k]);
            }
            return subarray;
        }`,
  3: `        // Елементи, які більші за елемент того ж рядка в нульовому стовпці.
        List<int> GetSubarray(int[,] a)
        {
            List<int> subarray = new List<int>();
            int rows = a.GetLength(0), cols = a.GetLength(1);
            for (int i = 0; i < rows; i++)
            {   for (int j = 1; j < cols; j++)
                {   countOperations++;
                    if (a[i, j] > a[i, 0]) subarray.Add(a[i, j]);
                }
            }
            return subarray;
        }`,
  4: `        // Суми непарних елементів в кожному рядку окремо.
        List<int> GetSubarray(int[,] a)
        {
            List<int> subarray = new List<int>();
            int rows = a.GetLength(0), cols = a.GetLength(1);
            for (int i = 0; i < rows; i++)
            {   int sum = 0;
                for (int j = 0; j < cols; j++)
                {   countOperations++;
                    if (a[i, j] % 2 != 0) sum += a[i, j];
                }
                subarray.Add(sum);
            }
            return subarray;
        }`,
  5: `        // Всі елементи рядків, в яких є хоча б один нульовий елемент.
        List<int> GetSubarray(int[,] a)
        {
            List<int> subarray = new List<int>();
            int rows = a.GetLength(0), cols = a.GetLength(1);
            for (int i = 0; i < rows; i++)
            {   bool hasZero = false;
                // пошук нуля до першого знайденого
                for (int j = 0; j < cols && !hasZero; j++)
                {   countOperations++;
                    if (a[i, j] == 0) hasZero = true;
                }
                if (hasZero)
                {   for (int j = 0; j < cols; j++) subarray.Add(a[i, j]); }
            }
            return subarray;
        }`,
  6: `        // Ненульові елементи, абсолютне значення яких не перевищує 5.
        List<int> GetSubarray(int[,] a)
        {
            List<int> subarray = new List<int>();
            int rows = a.GetLength(0), cols = a.GetLength(1);
            for (int i = 0; i < rows; i++)
            {   for (int j = 0; j < cols; j++)
                {   countOperations++;
                    if (a[i, j] != 0 && Math.Abs(a[i, j]) <= 5) subarray.Add(a[i, j]);
                }
            }
            return subarray;
        }`,
  7: `        // Елементи, які менші за половину максимального елементу в масиві.
        List<int> GetSubarray(int[,] a)
        {
            List<int> subarray = new List<int>();
            int rows = a.GetLength(0), cols = a.GetLength(1);
            int max = a[0, 0];
            // перший прохід: максимум
            for (int i = 0; i < rows; i++)
            {   for (int j = 0; j < cols; j++)
                {   countOperations++;
                    if (a[i, j] > max) max = a[i, j];
                }
            }
            // другий прохід: вибірка
            for (int i = 0; i < rows; i++)
            {   for (int j = 0; j < cols; j++)
                {   countOperations++;
                    if (a[i, j] < max / 2.0) subarray.Add(a[i, j]);
                }
            }
            return subarray;
        }`,
  8: `        // Парні елементи з верхньої половини рядків масиву.
        List<int> GetSubarray(int[,] a)
        {
            List<int> subarray = new List<int>();
            int rows = a.GetLength(0), cols = a.GetLength(1);
            for (int i = 0; i < rows / 2; i++)
            {   for (int j = 0; j < cols; j++)
                {   countOperations++;
                    if (a[i, j] % 2 == 0) subarray.Add(a[i, j]);
                }
            }
            return subarray;
        }`,
};

const CH_CODE: Record<number, string> = {
  1: `        // Середнє значення елементів (NaN — вибірка порожня).
        double ProcessSubarray(List<int> a)
        {
            if (a.Count == 0) return double.NaN;
            double sum = 0;
            foreach (int x in a) sum += x;
            return sum / a.Count;
        }`,
  2: `        // Максимальний елемент (NaN — вибірка порожня).
        double ProcessSubarray(List<int> a)
        {
            if (a.Count == 0) return double.NaN;
            int max = a[0];
            foreach (int x in a)
            {   if (x > max) max = x; }
            return max;
        }`,
  3: `        // Сума квадратів елементів.
        double ProcessSubarray(List<int> a)
        {
            double sum = 0;
            foreach (int x in a) sum += (double)x * x;
            return sum;
        }`,
  4: `        // Кількість парних елементів.
        double ProcessSubarray(List<int> a)
        {
            int count = 0;
            foreach (int x in a)
            {   if (x % 2 == 0) count++; }
            return count;
        }`,
};

export const pp4Methods = (v: number) => {
  const t = lab4Tasks(v);
  return { sub: SUB_CODE[t.sub], ch: CH_CODE[t.ch] };
};

export function pp4Program(v: number): string {
  const m = pp4Methods(v);
  return `// Доповнення класу Form1 проекту Array2D, варіант ${v}
        // кількість виконаних операцій (перевірених елементів) при отриманні вибірки
        int countOperations = 0;

${m.sub}

${m.ch}

        private void btnOK_Click(object sender, EventArgs e)
        {
            // вхідний масив
            int[,] a;
            // вибірка з масиву
            List<int> subarray;
            // числова характеристика масиву
            double subarrayCharacteristic;
            countOperations = 0;
            try
            {   // ввести (прочитати) дані з форми
                InputData(out a);
                // отримати вибірку з масиву
                subarray = GetSubarray(a);
                // обчислити характеристику вибірки з масиву
                subarrayCharacteristic = ProcessSubarray(subarray);
            }
            catch (Exception exn)
            {   MessageBox.Show(exn.Message, this.Text);
                return;
            }
            // вивести результат
            OutResult(a, subarray, subarrayCharacteristic);
        }

        // В кінці OutResult (після виведення характеристики) дописати:
        //     txtBxCount.Text = countOperations.ToString();`;
}

// ------------------------------------------------------------ ЛР 5

export const PP5_FILES = `// ---------- Lamp.cs
using System;

namespace ConsoleApp
{
    class Lamp
    {
        // Напруга на лампі, В.
        double voltage = 0;
        public double Voltage
        {   get { return voltage; }
            set { voltage = Math.Abs(value); }
        }

        // Лампа справна?
        bool isGoodState = true;
        public bool IsGoodState
        {   get { return isGoodState; }
        }

        // Пошкодити лампу.
        public void Damage()
        {   isGoodState = false;
        }
    }
}

// ---------- LensKit.cs
namespace ConsoleApp
{
    class LensKit
    {
        // Лінзовий комплект справний?
        bool isGoodState = true;
        public bool IsGoodState
        {   get { return isGoodState; }
        }

        // Пошкодити лінзовий комплект.
        public void Damage()
        {   isGoodState = false;
        }
    }
}

// ---------- Program.cs
using System;

namespace ConsoleApp
{
    class Program
    {
        static void Main(string[] args)
        {
            Lamp lamp1 = new Lamp(); // створення лампи lamp1
            Console.WriteLine("Напруга на lamp1 (за промовчанням), В: " + lamp1.Voltage);
            lamp1.Voltage = 11.2;
            Console.WriteLine("Напруга на lamp1, В: " + lamp1.Voltage);

            LensKit lensKit1 = new LensKit();
            lensKit1.Damage();
            Console.WriteLine("ЛК lensKit1 справний: " + lensKit1.IsGoodState);

            // п. 15: посилальний тип — після присвоювання обидві змінні вказують на один об'єкт
            Lamp lamp2 = new Lamp();
            Console.WriteLine("створення lamp2: lamp1 = " + lamp1.Voltage + ", lamp2 = " + lamp2.Voltage);
            lamp2.Voltage = 5;
            Console.WriteLine("запис x в lamp2: lamp1 = " + lamp1.Voltage + ", lamp2 = " + lamp2.Voltage);
            lamp1 = lamp2;
            Console.WriteLine("lamp1 = lamp2: lamp1 = " + lamp1.Voltage + ", lamp2 = " + lamp2.Voltage);
            lamp1.Voltage = 7;
            Console.WriteLine("запис y в lamp1: lamp1 = " + lamp1.Voltage + ", lamp2 = " + lamp2.Voltage);

            Console.ReadLine();
        }
    }
}`;

// ------------------------------------------------------------ ЛР 6

export const PP6_FILES = `// ---------- LightSignal.cs
using ConsoleApp;   // класи Lamp і LensKit з проекту ConsoleApp

namespace WindowsFormsApp
{
    class LightSignal
    {
        // Лампа.
        public Lamp Lamp { get; private set; }

        // Лінзовий комплект.
        public LensKit LensKit { get; private set; }

        // Номінальна напруга на лампі (денний режим живлення), В.
        const double voltageNominalDayMode = 11.5;
        // Нижня границя напруги на лампі (денний режим живлення), В.
        const double voltageMinDayMode = voltageNominalDayMode - 1;
        // Верхня границя напруги на лампі (денний режим живлення), В.
        const double voltageMaxDayMode = voltageNominalDayMode + 0.5;

        // Видимість сигнального вогню в нормі?
        public bool IsVisible
        {   get
            {   bool isVoltageLowerMin = Lamp.Voltage < voltageMinDayMode;
                bool isVoltageGreaterMax = Lamp.Voltage > voltageMaxDayMode;
                bool isVoltageWithinAllowedLimitsDayMode = !isVoltageLowerMin && !isVoltageGreaterMax;
                return isVoltageWithinAllowedLimitsDayMode && Lamp.IsGoodState && LensKit.IsGoodState;
            }
        }

        // Замінити лампу.
        public void ReplaceLamp(double voltage)
        {   Lamp = new Lamp();
            Lamp.Voltage = voltage;
        }

        // Створити сигнальний вогонь.
        public LightSignal()
        {   Lamp = new Lamp();
            LensKit = new LensKit();
        }
    }
}

// ---------- Form1.cs (доповнення)
using ConsoleApp;
...
    public partial class Form1 : Form
    {
        LightSignal lightSignal = new LightSignal();
        ...
        private void btnOK_Click(object sender, EventArgs e)
        {   ParseDataUpdateForm(lightSignal);
            OutputOfResult(lightSignal);
        }
        ...
    }`;

// ------------------------------------------------------------ ЛР 7

export const PP7_FILES = `// ---------- Transmitter.cs
namespace RailwayTrackCircuit
{
    class Transmitter
    {
        // true — сигнал на виході передавача присутній
        public bool IsSignalAvailable { get; set; }
    }
}

// ---------- Receiver.cs
namespace RailwayTrackCircuit
{
    class Receiver
    {
        // true — сигнал на вході приймача присутній
        public bool IsSignalAvailable { get; set; }
    }
}

// ---------- RailLine.cs — поля, властивості й конструктор з CodeFile3.cs

// ---------- TrackCircuit.cs
namespace RailwayTrackCircuit
{
    abstract class TrackCircuit
    {
        protected Transmitter transmitter;
        protected RailLine railLine;
        protected Receiver receiver;

        // Координата шунта, м.
        public abstract double ShuntCoordinate { get; set; }
    }
}

// ---------- TrackCircuitDCImpulse.cs — елементи з CodeFile3.cs
namespace RailwayTrackCircuit
{
    class TrackCircuitDCImpulse : TrackCircuit
    {
        // ballastResistanceMin, railLengthMax, BallastResistance, shuntCoordinate,
        // ShuntCoordinate (override), UpdateSignalAtReceiver, IsSignalAvailableAtReceiver,
        // конструктор TrackCircuitDCImpulse(double, double)
    }
}

// ---------- Form1.cs (доповнення)
        TrackCircuitDCImpulse trackCircuitDCImpulse = new TrackCircuitDCImpulse(0, 2000);

        private void btnOK_Click(object sender, EventArgs e)
        {   ParseDataUpdateForm(trackCircuitDCImpulse);
            OutputOfResult(trackCircuitDCImpulse);
        }`;

// ------------------------------------------------------------ ЛР 8

export const PP8_FILES = `// ---------- IRelayCoil.cs
namespace ElectromagneticRelay
{
    interface IRelayCoil
    {
        // Напруга на обмотці, В.
        double CoilVoltage { get; set; }
    }
}

// ---------- IRelayNeutral.cs
namespace ElectromagneticRelay
{
    enum ClosedContactNeutral { Тиловий, Фронтовий };

    interface IRelayNeutral : IRelayCoil
    {
        // Замкнутий контакт.
        ClosedContactNeutral ClosedContact { get; }
    }
}

// ---------- IRelayPolarized.cs
namespace ElectromagneticRelay
{
    enum ClosedContactPolarized { Нормальний, Переведений };

    interface IRelayPolarized : IRelayCoil
    {
        // Замкнутий контакт.
        ClosedContactPolarized ClosedContact { get; }
    }
}

// ---------- RelayKSh1_280.cs — елементи з CodeFile4.cs; ім'я поля тут латиницею
using System;

namespace ElectromagneticRelay
{
    class RelayKSh1_280 : IRelayNeutral, IRelayPolarized
    {
        const double dropOutVoltageNeutral = 1.4;    // відпускання, В
        const double pickUpVoltageNeutral = 6.5;     // спрацьовування, В
        const double flipVoltagePolarized = -3.9;    // перекидання, В
        const double normalVoltagePolarized = 3.9;   // повернення в нормальне положення, В

        double coilVoltage;
        public double CoilVoltage
        {   get { return coilVoltage; }
            set
            {   coilVoltage = value;
                if (Math.Abs(CoilVoltage) <= dropOutVoltageNeutral)
                {   closedContactNeutral = ClosedContactNeutral.Тиловий; }
                if (Math.Abs(CoilVoltage) >= pickUpVoltageNeutral)
                {   closedContactNeutral = ClosedContactNeutral.Фронтовий; }
                if (CoilVoltage <= flipVoltagePolarized)
                {   closedContactPolarized = ClosedContactPolarized.Переведений; }
                if (CoilVoltage >= normalVoltagePolarized)
                {   closedContactPolarized = ClosedContactPolarized.Нормальний; }
            }
        }

        ClosedContactNeutral closedContactNeutral = ClosedContactNeutral.Тиловий;
        ClosedContactNeutral IRelayNeutral.ClosedContact
        {   get { return closedContactNeutral; }
        }
        public ClosedContactNeutral ClosedContactNeutral
        {   get { IRelayNeutral obj = this; return obj.ClosedContact; }
        }

        ClosedContactPolarized closedContactPolarized = ClosedContactPolarized.Нормальний;
        ClosedContactPolarized IRelayPolarized.ClosedContact
        {   get { return closedContactPolarized; }
        }
        public ClosedContactPolarized ClosedContactPolarized
        {   get { IRelayPolarized obj = this; return obj.ClosedContact; }
        }
    }
}

// ---------- Form1.cs (доповнення)
        RelayKSh1_280 kSh1_280 = new RelayKSh1_280();`;
