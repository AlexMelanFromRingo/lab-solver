/**
 * «Програмні засоби загального користування», ЛР 6 «Шаблони класів: STL» —
 * моделі ситуацій табл. варіантів. Клас-параметр: конструктор з параметрами,
 * не менше трьох закритих атрибутів, сетери й гетери, toString; дії
 * виконуються з меню багато разів у довільному порядку.
 */

import { WIN_HEAD, WIN_INIT } from "./pzzk-programs";

export interface StlVariant {
  situation: string;
  param: string;
  container: string;
  why: string;
  alternatives: string;
  code: string;
}

const head = (includes: string[]) => `#include <iostream>
#include <string>
#include <sstream>
${includes.map((x) => `#include <${x}>`).join("\n")}
${WIN_HEAD}
using namespace std;`;

const menu = (items: string[]) =>
  `        cout << "\\n${items.map((x, k) => `${k + 1} — ${x}`).join("\\n")}\\n0 — вихід\\nДія: ";
        if (!(cin >> choice))
            break;`;

export const STL: StlVariant[] = [
  {
    situation: "Касир обслуговує покупців в порядку черги, доки черга не стане порожньою. Визначити скільки грошей буде у касі після обслуговування всіх покупців, n покупців.",
    param: "Покупець, містить вартість кожного товару в чеку",
    container: "queue<Customer>",
    why: "черга FIFO: першим обслуговується той, хто першим став; інших операцій, крім «стати в кінець» і «взяти з початку», ситуація не потребує",
    alternatives: "deque або list теж дають вставку в кінець і видалення з початку за O(1), але дозволяють зайве (доступ до середини); vector видаляє з початку за O(n)",
    code: `${head(["queue", "vector"])}

// Покупець: ім'я, номер у черзі, вартості товарів у чеку
class Customer {
    string name;
    int number;
    vector<double> prices;
public:
    Customer(const string& name, int number, const vector<double>& prices) : name(name), number(number), prices(prices) {}
    string getName() const { return name; }
    int getNumber() const { return number; }
    vector<double> getPrices() const { return prices; }
    void setName(const string& v) { name = v; }
    void setNumber(int v) { number = v; }
    void setPrices(const vector<double>& v) { prices = v; }
    double total() const
    {
        double sum = 0;
        for (double p : prices)
            sum += p;
        return sum;
    }
    string toString() const
    {
        ostringstream out;
        out << "№" << number << " " << name << ", товарів: " << prices.size() << ", сума чеку: " << total();
        return out.str();
    }
};

int main()
{
${WIN_INIT}
    queue<Customer> line;
    double cash = 0;
    int served = 0, next = 1, choice;
    do {
${menu(["покупець стає в чергу", "обслужити наступного", "обслужити всіх", "показати чергу", "гроші в касі"])}
        switch (choice) {
        case 1: {
            string name;
            int n;
            cout << "Ім'я покупця: ";
            getline(cin >> ws, name);
            cout << "Кількість товарів: ";
            cin >> n;
            vector<double> prices;
            for (int k = 1; k <= n; k++) {
                double p;
                cout << "Вартість товару " << k << ": ";
                cin >> p;
                prices.push_back(p);
            }
            line.push(Customer(name, next++, prices));
            break;
        }
        case 2:
        case 3:
            if (line.empty())
                cout << "Черга порожня" << endl;
            do {
                if (line.empty())
                    break;
                cash += line.front().total();
                served++;
                cout << "Обслужено: " << line.front().toString() << endl;
                line.pop();
            } while (choice == 3);
            break;
        case 4: {
            queue<Customer> copy = line;       // черга не дає обходу — переглядаємо копію
            cout << "У черзі " << line.size() << ":" << endl;
            for (; !copy.empty(); copy.pop())
                cout << "  " << copy.front().toString() << endl;
            break;
        }
        case 5:
            cout << "Обслужено покупців: " << served << ", у касі: " << cash << " грн" << endl;
            break;
        }
    } while (choice != 0);
    return 0;
}
`,
  },
  {
    situation: "На запасній колії формується новий состав вагонів. Вагони можуть відчеплятися та причеплятися з двох сторін. Змоделюйте процес формування потягу, при цьому довжина составу обмежується тяговою потужністю локомотиву.",
    param: "Вагон",
    container: "deque<Wagon>",
    why: "дек: вагони причіплюють і відчіплюють з обох кінців за O(1)",
    alternatives: "list теж працює з обома кінцями, але без довільного доступу для перегляду составу; vector і queue не підходять — вставка/видалення з початку",
    code: `${head(["deque"])}

// Вагон: номер, тип, маса з вантажем
class Wagon {
    int number;
    string type;
    double mass;                           // т
public:
    Wagon(int number, const string& type, double mass) : number(number), type(type), mass(mass) {}
    int getNumber() const { return number; }
    string getType() const { return type; }
    double getMass() const { return mass; }
    void setNumber(int v) { number = v; }
    void setType(const string& v) { type = v; }
    void setMass(double v) { mass = v; }
    string toString() const
    {
        ostringstream out;
        out << "вагон №" << number << " (" << type << ", " << mass << " т)";
        return out.str();
    }
};

double totalMass(const deque<Wagon>& train)
{
    double sum = 0;
    for (const Wagon& w : train)
        sum += w.getMass();
    return sum;
}

int main()
{
${WIN_INIT}
    deque<Wagon> train;
    double limit;
    cout << "Тягова потужність локомотива — максимальна маса составу, т: ";
    cin >> limit;
    int choice;
    do {
${menu(["причепити вагон спереду", "причепити вагон ззаду", "відчепити передній", "відчепити задній", "показати состав"])}
        switch (choice) {
        case 1:
        case 2: {
            int number;
            string type;
            double mass;
            cout << "Номер, тип (одним словом), маса: ";
            cin >> number >> type >> mass;
            if (totalMass(train) + mass > limit) {
                cout << "Локомотив не потягне: маса перевищить " << limit << " т" << endl;
                break;
            }
            if (choice == 1)
                train.push_front(Wagon(number, type, mass));
            else
                train.push_back(Wagon(number, type, mass));
            break;
        }
        case 3:
        case 4:
            if (train.empty()) {
                cout << "Состав порожній" << endl;
                break;
            }
            cout << "Відчеплено: " << (choice == 3 ? train.front() : train.back()).toString() << endl;
            if (choice == 3)
                train.pop_front();
            else
                train.pop_back();
            break;
        case 5:
            cout << "Локомотив";
            for (const Wagon& w : train)
                cout << " — " << w.toString();
            cout << endl << "Вагонів: " << train.size() << ", маса " << totalMass(train) << " з " << limit << " т" << endl;
            break;
        }
    } while (choice != 0);
    return 0;
}
`,
  },
  {
    situation: "Посудомийник миє посуд та складає його одне на одне. Кухар бере чистий посуд та накладає у нього їжу. Кожне блюдо подає окремо.",
    param: "Посуд",
    container: "stack<Dish>",
    why: "стопка посуду — стек LIFO: кухар бере верхню, щойно вимиту тарілку",
    alternatives: "vector (push_back/pop_back) чи deque дають те саме, але відкривають доступ до середини стопки, якого в ситуації немає",
    code: `${head(["stack"])}

// Посуд: номер, вид, матеріал
class Dish {
    int number;
    string kind;
    string material;
public:
    Dish(int number, const string& kind, const string& material) : number(number), kind(kind), material(material) {}
    int getNumber() const { return number; }
    string getKind() const { return kind; }
    string getMaterial() const { return material; }
    void setNumber(int v) { number = v; }
    void setKind(const string& v) { kind = v; }
    void setMaterial(const string& v) { material = v; }
    string toString() const
    {
        ostringstream out;
        out << kind << " №" << number << " (" << material << ")";
        return out.str();
    }
};

int main()
{
${WIN_INIT}
    stack<Dish> clean;
    int next = 1, served = 0, choice;
    do {
${menu(["посудомийник кладе вимитий посуд", "кухар накладає страву і подає", "що зверху стопки"])}
        switch (choice) {
        case 1: {
            string kind, material;
            cout << "Вид посуду і матеріал (одним словом кожне): ";
            cin >> kind >> material;
            clean.push(Dish(next++, kind, material));
            cout << "У стопці " << clean.size() << " шт." << endl;
            break;
        }
        case 2: {
            if (clean.empty()) {
                cout << "Чистого посуду немає — треба помити" << endl;
                break;
            }
            string food;
            cout << "Страва: ";
            getline(cin >> ws, food);
            cout << "Подано: " << food << " (посуд: " << clean.top().toString() << ")" << endl;
            clean.pop();
            served++;
            break;
        }
        case 3:
            if (clean.empty())
                cout << "Стопка порожня" << endl;
            else
                cout << "Зверху: " << clean.top().toString() << ", у стопці " << clean.size() << ", подано страв: " << served << endl;
            break;
        }
    } while (choice != 0);
    return 0;
}
`,
  },
  {
    situation: "Абітурієнти подають заяви на вступ. Усі заяви формують список у порядку спадання конкурсного балу, при цьому список ніколи не сортується. Абітурієнт може анулювати заяву.",
    param: "Абітурієнт",
    container: "list<Applicant>",
    why: "список: нова заява вставляється одразу на своє місце (перед першою з меншим балом) — сортування не потрібне, вставка й анулювання за O(1) після пошуку",
    alternatives: "multiset з компаратором за балом тримає порядок сам, але його елементи незмінні; vector при вставці в середину зсуває решту — O(n)",
    code: `${head(["list", "algorithm"])}

// Абітурієнт: номер заяви, ім'я, конкурсний бал
class Applicant {
    int id;
    string name;
    double score;
public:
    Applicant(int id, const string& name, double score) : id(id), name(name), score(score) {}
    int getId() const { return id; }
    string getName() const { return name; }
    double getScore() const { return score; }
    void setId(int v) { id = v; }
    void setName(const string& v) { name = v; }
    void setScore(double v) { score = v; }
    string toString() const
    {
        ostringstream out;
        out << "заява №" << id << ": " << name << ", бал " << score;
        return out.str();
    }
};

int main()
{
${WIN_INIT}
    list<Applicant> rating;
    int next = 1, choice;
    do {
${menu(["подати заяву", "анулювати заяву", "показати список"])}
        switch (choice) {
        case 1: {
            string name;
            double score;
            cout << "Ім'я: ";
            getline(cin >> ws, name);
            cout << "Конкурсний бал: ";
            cin >> score;
            // місце — перед першим абітурієнтом з меншим балом: порядок зберігається без сортування
            auto place = find_if(rating.begin(), rating.end(), [score](const Applicant& a) { return a.getScore() < score; });
            rating.insert(place, Applicant(next, name, score));
            cout << "Прийнято заяву №" << next++ << endl;
            break;
        }
        case 2: {
            int id;
            cout << "Номер заяви: ";
            cin >> id;
            auto it = find_if(rating.begin(), rating.end(), [id](const Applicant& a) { return a.getId() == id; });
            if (it == rating.end())
                cout << "Заяви немає" << endl;
            else {
                cout << "Анульовано: " << it->toString() << endl;
                rating.erase(it);
            }
            break;
        }
        case 3: {
            int place = 1;
            for (const Applicant& a : rating)
                cout << place++ << ". " << a.toString() << endl;
            if (rating.empty())
                cout << "Список порожній" << endl;
            break;
        }
        }
    } while (choice != 0);
    return 0;
}
`,
  },
  {
    situation: "Покупець складає усі обрані товари у кошик, на касі він їх викладає на стрічку, касир «пробиває». Обрахувати суму покупки у кошику.",
    param: "Товар",
    container: "stack<Item> (кошик) і queue<Item> (стрічка)",
    why: "з кошика першим дістають покладений останнім (стек), а на стрічці касир пробиває в порядку викладання (черга)",
    alternatives: "обидва контейнери можна замінити на deque чи list, але тоді зникає обмеження доступу, яке і моделює ситуацію",
    code: `${head(["stack", "queue"])}

// Товар: назва, ціна, кількість
class Item {
    string name;
    double price;
    int quantity;
public:
    Item(const string& name, double price, int quantity) : name(name), price(price), quantity(quantity) {}
    string getName() const { return name; }
    double getPrice() const { return price; }
    int getQuantity() const { return quantity; }
    void setName(const string& v) { name = v; }
    void setPrice(double v) { price = v; }
    void setQuantity(int v) { quantity = v; }
    double cost() const { return price * quantity; }
    string toString() const
    {
        ostringstream out;
        out << name << ": " << quantity << " × " << price << " = " << cost();
        return out.str();
    }
};

int main()
{
${WIN_INIT}
    stack<Item> basket;
    queue<Item> belt;
    double sum = 0;
    int choice;
    do {
${menu(["покласти товар у кошик", "викласти кошик на стрічку", "касир пробиває наступний", "пробити все", "стан покупки"])}
        switch (choice) {
        case 1: {
            string name;
            double price;
            int quantity;
            cout << "Назва: ";
            getline(cin >> ws, name);
            cout << "Ціна і кількість: ";
            cin >> price >> quantity;
            basket.push(Item(name, price, quantity));
            break;
        }
        case 2:
            for (; !basket.empty(); basket.pop()) {
                cout << "На стрічку: " << basket.top().getName() << endl;
                belt.push(basket.top());
            }
            break;
        case 3:
        case 4:
            if (belt.empty())
                cout << "Стрічка порожня" << endl;
            while (!belt.empty()) {
                sum += belt.front().cost();
                cout << "Пробито: " << belt.front().toString() << endl;
                belt.pop();
                if (choice == 3)
                    break;
            }
            break;
        case 5:
            cout << "У кошику: " << basket.size() << ", на стрічці: " << belt.size() << ", сума пробитого: " << sum << " грн" << endl;
            break;
        }
    } while (choice != 0);
    return 0;
}
`,
  },
  {
    situation: "Снігуронька записує бажання дітей, які вишиковуються у чергу. Бажання можуть бути таких видів: іграшки, гаджети, одяг, смаколики. Дід Мороз виконує бажання по одному у порядку надходження. Порахувати скільки бажань кожного виду вже виконав Дід Мороз.",
    param: "Бажання",
    container: "queue<Wish> і map<string, int>",
    why: "бажання виконуються в порядку надходження — черга; лічильники за видами зручно тримати в асоціативному масиві map",
    alternatives: "замість map — масив з 4 лічильників за номером виду; замість queue — deque або list",
    code: `${head(["queue", "map"])}

// Бажання: дитина, вид, опис
class Wish {
    string child;
    string kind;
    string description;
public:
    Wish(const string& child, const string& kind, const string& description) : child(child), kind(kind), description(description) {}
    string getChild() const { return child; }
    string getKind() const { return kind; }
    string getDescription() const { return description; }
    void setChild(const string& v) { child = v; }
    void setKind(const string& v) { kind = v; }
    void setDescription(const string& v) { description = v; }
    string toString() const { return child + ": " + kind + " — " + description; }
};

int main()
{
${WIN_INIT}
    const string KINDS[] = { "іграшки", "гаджети", "одяг", "смаколики" };
    queue<Wish> wishes;
    map<string, int> done;
    int choice;
    do {
${menu(["Снігуронька записує бажання", "Дід Мороз виконує наступне", "скільки виконано за видами", "скільки бажань чекає"])}
        switch (choice) {
        case 1: {
            string child, description;
            int kind;
            cout << "Ім'я дитини: ";
            getline(cin >> ws, child);
            cout << "Вид: 1 — іграшки, 2 — гаджети, 3 — одяг, 4 — смаколики: ";
            cin >> kind;
            if (kind < 1 || kind > 4) {
                cout << "Немає такого виду" << endl;
                break;
            }
            cout << "Бажання: ";
            getline(cin >> ws, description);
            wishes.push(Wish(child, KINDS[kind - 1], description));
            break;
        }
        case 2:
            if (wishes.empty()) {
                cout << "Усі бажання виконано" << endl;
                break;
            }
            cout << "Виконано: " << wishes.front().toString() << endl;
            done[wishes.front().getKind()]++;
            wishes.pop();
            break;
        case 3:
            for (const string& k : KINDS)
                cout << k << ": " << done[k] << endl;
            break;
        case 4:
            cout << "У черзі бажань: " << wishes.size() << endl;
            break;
        }
    } while (choice != 0);
    return 0;
}
`,
  },
  {
    situation: "Фотограф шикує дітей у колону по одному таким чином, щоб усіх було видно у кадрі. Нетерплячі діти можуть виходити з колони.",
    param: "Дитина",
    container: "multiset<Child>",
    why: "щоб усіх було видно, колона впорядкована за зростом (нижчі попереду); multiset тримає порядок сам при кожному додаванні, дозволяє однаковий зріст і видалення з будь-якого місця",
    alternatives: "list з вставкою на своє місце (як у варіанті 4) або vector з сортуванням після кожного додавання — повільніше",
    code: `${head(["set", "algorithm"])}

// Дитина: ім'я, зріст, вік
class Child {
    string name;
    int height;                            // см
    int age;
public:
    Child(const string& name, int height, int age) : name(name), height(height), age(age) {}
    string getName() const { return name; }
    int getHeight() const { return height; }
    int getAge() const { return age; }
    void setName(const string& v) { name = v; }
    void setHeight(int v) { height = v; }
    void setAge(int v) { age = v; }
    string toString() const
    {
        ostringstream out;
        out << name << " (" << height << " см, " << age << " р.)";
        return out.str();
    }
    bool operator<(const Child& o) const { return height < o.height; }   // нижчі — попереду
};

int main()
{
${WIN_INIT}
    multiset<Child> column;
    int choice;
    do {
${menu(["дитина стає в колону", "дитина виходить з колони", "показати колону"])}
        switch (choice) {
        case 1: {
            string name;
            int height, age;
            cout << "Ім'я: ";
            getline(cin >> ws, name);
            cout << "Зріст (см) і вік: ";
            cin >> height >> age;
            column.insert(Child(name, height, age));
            break;
        }
        case 2: {
            string name;
            cout << "Хто виходить: ";
            getline(cin >> ws, name);
            auto it = find_if(column.begin(), column.end(), [&name](const Child& c) { return c.getName() == name; });
            if (it == column.end())
                cout << "Такої дитини в колоні немає" << endl;
            else {
                cout << "Вийшов(ла): " << it->toString() << endl;
                column.erase(it);
            }
            break;
        }
        case 3: {
            int place = 1;
            for (const Child& c : column)
                cout << place++ << ". " << c.toString() << endl;
            if (column.empty())
                cout << "Колона порожня" << endl;
            break;
        }
        }
    } while (choice != 0);
    return 0;
}
`,
  },
  {
    situation: "Пацієнти записуються на прийом, утворюючи чергу. Лікар приймає з черги пацієнтів, записуючи хто в нього був на прийомі, і в кінці роботи видає підсумок скільки чоловіків та скільки жінок було на прийомі та імена прийнятих пацієнтів.",
    param: "Пацієнт",
    container: "queue<Patient> (черга) і vector<Patient> (журнал прийому)",
    why: "запис на прийом — черга FIFO; журнал лікаря лише доповнюється в кінці й переглядається — vector",
    alternatives: "журнал можна вести в list; для черги — deque",
    code: `${head(["queue", "vector"])}

// Пацієнт: ім'я, стать, вік
class Patient {
    string name;
    char gender;                           // 'M' — чоловік, 'F' — жінка (кирилична літера в char не вміщується)
    int age;
public:
    Patient(const string& name, char gender, int age) : name(name), gender(gender), age(age) {}
    string getName() const { return name; }
    char getGender() const { return gender; }
    int getAge() const { return age; }
    void setName(const string& v) { name = v; }
    void setGender(char v) { gender = v; }
    void setAge(int v) { age = v; }
    string toString() const
    {
        ostringstream out;
        out << name << ", " << (gender == 'M' ? "чоловік" : "жінка") << ", " << age << " р.";
        return out.str();
    }
};

int main()
{
${WIN_INIT}
    queue<Patient> waiting;
    vector<Patient> seen;
    int choice;
    do {
${menu(["записати пацієнта", "лікар приймає наступного", "підсумок прийому", "скільки чекає"])}
        switch (choice) {
        case 1: {
            string name;
            char gender;
            int age;
            cout << "Ім'я: ";
            getline(cin >> ws, name);
            cout << "Стать (M — чоловік, F — жінка) і вік: ";
            cin >> gender >> age;
            waiting.push(Patient(name, gender == 'm' ? 'M' : gender == 'f' ? 'F' : gender, age));
            break;
        }
        case 2:
            if (waiting.empty()) {
                cout << "Черга порожня" << endl;
                break;
            }
            cout << "Прийнято: " << waiting.front().toString() << endl;
            seen.push_back(waiting.front());
            waiting.pop();
            break;
        case 3: {
            int men = 0, women = 0;
            for (const Patient& p : seen)
                (p.getGender() == 'M' ? men : women)++;
            cout << "На прийомі: чоловіків " << men << ", жінок " << women << endl;
            for (const Patient& p : seen)
                cout << "  " << p.getName() << endl;
            break;
        }
        case 4:
            cout << "У черзі: " << waiting.size() << endl;
            break;
        }
    } while (choice != 0);
    return 0;
}
`,
  },
  {
    situation: "Протягом тижня людина складає брудний одяг у корзину, на дно якої може вміщуватися лише одна річ. У кінці тижня всі речі витягають і рахують кількість білих та кольорових, визначають скільки разів треба запустити пральну машину, якщо за один раз можна випрати не більше семи речей, біле і кольорове прати разом не можна.",
    param: "Одяг",
    container: "stack<Garment>",
    why: "корзина, на дно якої вміщується лише одна річ, — стек: речі дістають у зворотному порядку, зверху",
    alternatives: "vector або deque з роботою лише з кінця; для підрахунку порядок неважливий, але модель — саме стек",
    code: `${head(["stack"])}

// Річ: назва, колір (білий/кольоровий), тканина
class Garment {
    string name;
    bool white;
    string fabric;
public:
    Garment(const string& name, bool white, const string& fabric) : name(name), white(white), fabric(fabric) {}
    string getName() const { return name; }
    bool isWhite() const { return white; }
    string getFabric() const { return fabric; }
    void setName(const string& v) { name = v; }
    void setWhite(bool v) { white = v; }
    void setFabric(const string& v) { fabric = v; }
    string toString() const { return name + " (" + (white ? "біле" : "кольорове") + ", " + fabric + ")"; }
};

int main()
{
${WIN_INIT}
    const int LOAD = 7;                    // речей за одне прання
    stack<Garment> basket;
    int choice;
    do {
${menu(["покласти річ у корзину", "кінець тижня: розібрати корзину", "що зверху корзини"])}
        switch (choice) {
        case 1: {
            string name, fabric;
            int white;
            cout << "Назва і тканина (одним словом кожне): ";
            cin >> name >> fabric;
            cout << "Біла? (1 — так, 0 — кольорова): ";
            cin >> white;
            basket.push(Garment(name, white == 1, fabric));
            break;
        }
        case 2: {
            int whites = 0, colored = 0;
            for (; !basket.empty(); basket.pop()) {
                cout << "Дістали: " << basket.top().toString() << endl;
                (basket.top().isWhite() ? whites : colored)++;
            }
            // біле й кольорове окремо: округлення вгору за кожною групою
            int runs = (whites + LOAD - 1) / LOAD + (colored + LOAD - 1) / LOAD;
            cout << "Білих: " << whites << ", кольорових: " << colored << ", запусків пральної машини: " << runs << endl;
            break;
        }
        case 3:
            if (basket.empty())
                cout << "Корзина порожня" << endl;
            else
                cout << "Зверху: " << basket.top().toString() << ", речей: " << basket.size() << endl;
            break;
        }
    } while (choice != 0);
    return 0;
}
`,
  },
  {
    situation: "Студенти двох груп здають домашні завдання, викладач їх перевіряє в порядку надходження. Змоделювати процес подачі на перевірку та перевірку завдання, у будь-який час можна дізнатися кількість перевірених робіт у кожній групі.",
    param: "Завдання",
    container: "queue<Homework> і map<string, int>",
    why: "перевірка в порядку надходження незалежно від групи — одна черга FIFO; лічильники перевірених — асоціативний масив за назвою групи",
    alternatives: "дві черги (по групі) порушили б загальний порядок надходження; замість map — два лічильники",
    code: `${head(["queue", "map"])}

// Завдання: студент, група, назва роботи
class Homework {
    string student;
    string group;
    string title;
public:
    Homework(const string& student, const string& group, const string& title) : student(student), group(group), title(title) {}
    string getStudent() const { return student; }
    string getGroup() const { return group; }
    string getTitle() const { return title; }
    void setStudent(const string& v) { student = v; }
    void setGroup(const string& v) { group = v; }
    void setTitle(const string& v) { title = v; }
    string toString() const { return student + " (" + group + "): " + title; }
};

int main()
{
${WIN_INIT}
    string groups[2];
    cout << "Назви двох груп: ";
    cin >> groups[0] >> groups[1];
    queue<Homework> pending;
    map<string, int> checked;
    int choice;
    do {
${menu(["студент здає завдання", "викладач перевіряє наступне", "перевірено по групах", "чекають перевірки"])}
        switch (choice) {
        case 1: {
            string student, title;
            int g;
            cout << "Студент: ";
            getline(cin >> ws, student);
            cout << "Група: 1 — " << groups[0] << ", 2 — " << groups[1] << ": ";
            cin >> g;
            if (g != 1 && g != 2) {
                cout << "Немає такої групи" << endl;
                break;
            }
            cout << "Назва роботи: ";
            getline(cin >> ws, title);
            pending.push(Homework(student, groups[g - 1], title));
            break;
        }
        case 2:
            if (pending.empty()) {
                cout << "Усе перевірено" << endl;
                break;
            }
            cout << "Перевірено: " << pending.front().toString() << endl;
            checked[pending.front().getGroup()]++;
            pending.pop();
            break;
        case 3:
            for (const string& g : groups)
                cout << g << ": " << checked[g] << endl;
            break;
        case 4:
            cout << "Чекають: " << pending.size() << endl;
            break;
        }
    } while (choice != 0);
    return 0;
}
`,
  },
];

export const lab6Program = (v: number) => `// ЛР 6, варіант ${v}: ${STL[v - 1].situation}
// Контейнер: ${STL[v - 1].container} — ${STL[v - 1].why}.
${STL[v - 1].code}`;
