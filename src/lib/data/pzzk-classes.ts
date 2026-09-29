/**
 * «Програмні засоби загального користування», ЛР 4 (класи, «друзі»,
 * перевантаження операцій) і ЛР 5 (абстрактний клас, успадкування,
 * віртуальні функції) — по 15 варіантах таблиці ЛР 4. Програми зібрані
 * g++ -std=c++17 і прогнані.
 */

import { WIN_HEAD, WIN_INIT } from "./pzzk-programs";

type T = "string" | "int" | "double";

interface Attr {
  name: string;
  type: T;
  label: string;
  def: string;
  /** Значения для объектов a и b (литералы C++). */
  a: string;
  b: string;
}

interface Sub {
  cls: string;
  title: string;
  extra: Attr;
  kind: string;
}

interface Spec {
  cls: string;
  title: string;
  friend: string;
  ops: string[];
  attrs: Attr[];
  /** Объявления внутри класса (friend, операции). */
  inClass: string;
  /** Код после класса: дружественный класс или функция, внешние операции. */
  after: string;
  /** Демонстрация «дружбы» и операций в main (объекты a, b, c = копия a, d по умолчанию). */
  demo: string;
  /** Дружественный класс объявляется до сущности. */
  forward?: string;
  sub: [Sub, Sub];
  /** Значения атрибутов базы для объектов-наследников в ЛР 5, если a/b им не подходят. */
  over?: [Record<string, string>, Record<string, string>];
}

const s = (name: string, label: string, def: string, a: string, b: string): Attr => ({ name, type: "string", label, def: `"${def}"`, a: `"${a}"`, b: `"${b}"` });
const i = (name: string, label: string, def: number, a: number, b: number): Attr => ({ name, type: "int", label, def: String(def), a: String(a), b: String(b) });
const d = (name: string, label: string, def: number, a: number, b: number): Attr => ({ name, type: "double", label, def: String(def), a: String(a), b: String(b) });

const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
const cpp = (t: T) => t;
const param = (a: Attr) => (a.type === "string" ? `const string& ${a.name}` : `${cpp(a.type)} ${a.name}`);

export const SPECS: Spec[] = [
  {
    cls: "Employee",
    title: "Співробітник",
    friend: "Керівник",
    ops: ["Порівняння за іменем (!=, ==)", "Порівняння за стажем (>)"],
    attrs: [s("name", "Ім'я", "Невідомо", "Олена", "Андрій"), s("position", "Посада", "стажист", "інженер", "аналітик"), i("experience", "Стаж, років", 0, 5, 3)],
    forward: "class Manager;",
    inClass: `    bool operator==(const Employee& o) const { return name == o.name; }
    bool operator!=(const Employee& o) const { return name != o.name; }
    bool operator>(const Employee& o) const { return experience > o.experience; }
    friend class Manager;                  // «Керівник» бачить закриті поля`,
    after: `// Дружній клас «Керівник»: працює з закритими полями співробітника напряму
class Manager {
public:
    void review(const Employee& e) const
    {
        cout << "Керівник: " << e.name << " (" << e.position << "), стаж " << e.experience << " р." << endl;
    }
    void promote(Employee& e, const string& position) const
    {
        e.position = position;             // без сетера — завдяки дружбі
        cout << "Керівник: " << e.name << " — нова посада «" << position << "»" << endl;
    }
};`,
    demo: `    Manager boss;
    boss.review(a);
    boss.promote(a, "старший інженер");
    cout << a.toString() << endl;
    cout << "a == c (за іменем): " << (a == c) << endl;
    cout << "a != b (за іменем): " << (a != b) << endl;
    cout << "a > b (за стажем): " << (a > b) << endl;`,
    sub: [
      { cls: "Developer", title: "Розробник", extra: s("language", "Мова програмування", "C++", "C++", "Python"), kind: "розробник" },
      { cls: "Accountant", title: "Бухгалтер", extra: i("reports", "Звітів за місяць", 0, 12, 7), kind: "бухгалтер" },
    ],
  },
  {
    cls: "Institution",
    title: "Навчальний заклад",
    friend: "Керівник",
    ops: ["Порівняння за назвою ==", "Порівняння за рівнем акредитації >", "Об'єднання закладів +"],
    attrs: [s("name", "Назва", "Без назви", "Технічний коледж", "Політехнічний ліцей"), i("accreditation", "Рівень акредитації", 1, 3, 2), i("students", "Кількість студентів", 0, 1200, 800)],
    forward: "class Director;",
    inClass: `    bool operator==(const Institution& o) const { return name == o.name; }
    bool operator>(const Institution& o) const { return accreditation > o.accreditation; }
    // Об'єднання: кількість студентів додається, акредитація — більша з двох, назва нова
    Institution operator+(const Institution& o) const
    {
        return Institution(name + " + " + o.name, accreditation > o.accreditation ? accreditation : o.accreditation, students + o.students);
    }
    friend class Director;                 // «Керівник»`,
    after: `// Дружній клас «Керівник закладу»
class Director {
public:
    void accredit(Institution& inst, int level) const
    {
        inst.accreditation = level;        // закрите поле — напряму
        cout << "Керівник: " << inst.name << " отримав рівень акредитації " << level << endl;
    }
};`,
    demo: `    Director head;
    head.accredit(b, 4);
    cout << "a == c (за назвою): " << (a == c) << endl;
    cout << "a > b (за акредитацією): " << (a > b) << endl;
    Institution merged = a + b;
    cout << "a + b: " << merged.toString() << endl;`,
    sub: [
      { cls: "University", title: "Університет", extra: i("faculties", "Кількість факультетів", 1, 9, 5), kind: "університет" },
      { cls: "College", title: "Коледж", extra: s("profile", "Профіль", "загальний", "технічний", "економічний"), kind: "коледж" },
    ],
  },
  {
    cls: "Stationery",
    title: "Канцелярське приладдя",
    friend: "Коробка для канцелярського приладдя",
    ops: ["Порівняння за виробником ==, !=", "Доступ до атрибуту за номером для читання [ ]"],
    attrs: [s("name", "Назва", "Без назви", "Ручка", "Олівець"), s("manufacturer", "Виробник", "невідомий", "Buromax", "Koh-i-Noor"), d("price", "Ціна, грн", 0, 25.5, 18)],
    forward: "class Box;",
    inClass: `    bool operator==(const Stationery& o) const { return manufacturer == o.manufacturer; }
    bool operator!=(const Stationery& o) const { return manufacturer != o.manufacturer; }
    // Читання атрибута за номером: 0 — назва, 1 — виробник, 2 — ціна
    string operator[](int index) const
    {
        switch (index) {
        case 0: return name;
        case 1: return manufacturer;
        case 2: {
            ostringstream out;
            out << price;
            return out.str();
        }
        default: return "немає атрибута з номером " + to_string(index);
        }
    }
    friend class Box;                      // «Коробка для канцприладдя»`,
    after: `// Дружній клас «Коробка»: рахує вміст за закритими полями
class Box {
    int count = 0;
    double total = 0;
public:
    void put(const Stationery& item)
    {
        count++;
        total += item.price;               // закрите поле ціни
        cout << "У коробку покладено: " << item.name << " (" << item.manufacturer << ")" << endl;
    }
    void report() const { cout << "У коробці " << count << " шт. на " << total << " грн" << endl; }
};`,
    demo: `    Box box;
    box.put(a);
    box.put(b);
    box.report();
    cout << "a == c (за виробником): " << (a == c) << endl;
    cout << "a != b (за виробником): " << (a != b) << endl;
    cout << "a[0] = " << a[0] << ", a[1] = " << a[1] << ", a[2] = " << a[2] << ", a[5] = " << a[5] << endl;`,
    sub: [
      { cls: "Pen", title: "Ручка", extra: s("inkColor", "Колір чорнила", "синій", "синій", "чорний"), kind: "ручка" },
      { cls: "Notebook", title: "Зошит", extra: i("pages", "Кількість аркушів", 12, 48, 96), kind: "зошит" },
    ],
    over: [{}, { name: '"Зошит"', manufacturer: '"Школярик"' }],
  },
  {
    cls: "Product",
    title: "Товар",
    friend: "Продавець",
    ops: ["Збільшення строку придатності ++ (префіксна і постфіксна форми)", "Порівняння за виробником !="],
    attrs: [s("name", "Назва", "Без назви", "Кава", "Чай"), s("manufacturer", "Виробник", "невідомий", "Lavazza", "Ahmad"), i("shelfLife", "Строк придатності, днів", 0, 180, 365), d("price", "Ціна, грн", 0, 320, 150)],
    forward: "class Seller;",
    inClass: `    Product& operator++()                  // префіксна: збільшує і повертає себе
    {
        ++shelfLife;
        return *this;
    }
    Product operator++(int)                // постфіксна: повертає копію до зміни
    {
        Product old(*this);
        ++shelfLife;
        return old;
    }
    bool operator!=(const Product& o) const { return manufacturer != o.manufacturer; }
    friend class Seller;                   // «Продавець»`,
    after: `// Дружній клас «Продавець»
class Seller {
public:
    void discount(Product& p, double percent) const
    {
        p.price *= 1 - percent / 100;      // закрите поле ціни
        cout << "Продавець: знижка " << percent << "% на " << p.name << ", нова ціна " << p.price << endl;
    }
};`,
    demo: `    Seller seller;
    seller.discount(a, 10);
    ++a;
    cout << "Після ++a: строк " << a.getShelfLife() << endl;
    Product before = a++;
    cout << "a++ повернув строк " << before.getShelfLife() << ", тепер " << a.getShelfLife() << endl;
    cout << "a != b (за виробником): " << (a != b) << endl;`,
    sub: [
      { cls: "FoodProduct", title: "Продовольчий товар", extra: i("calories", "Калорійність, ккал/100 г", 0, 250, 90), kind: "продовольчий" },
      { cls: "HouseholdProduct", title: "Господарський товар", extra: s("material", "Матеріал", "пластик", "скло", "метал"), kind: "господарський" },
    ],
    over: [{}, { name: '"Склянка"', manufacturer: '"Pasabahce"' }],
  },
  {
    cls: "Food",
    title: "Продукт харчування",
    friend: "Функція порівняння за калорійністю",
    ops: ["Зменшення терміну придатності -- (префіксна і постфіксна форми)", "Порівняння за калорійністю >"],
    attrs: [s("name", "Назва", "Без назви", "Сир", "Йогурт"), i("calories", "Калорійність, ккал/100 г", 0, 350, 90), i("shelfLife", "Термін придатності, днів", 0, 30, 14)],
    inClass: `    Food& operator--()
    {
        --shelfLife;
        return *this;
    }
    Food operator--(int)
    {
        Food old(*this);
        --shelfLife;
        return old;
    }
    bool operator>(const Food& o) const { return calories > o.calories; }
    friend int compareCalories(const Food& x, const Food& y);   // «друг»`,
    after: `// Дружня функція: -1, 0, 1 — калорійність x менша, рівна, більша за y
int compareCalories(const Food& x, const Food& y)
{
    return x.calories < y.calories ? -1 : x.calories > y.calories ? 1 : 0;
}`,
    demo: `    cout << "compareCalories(a, b) = " << compareCalories(a, b) << endl;
    --a;
    cout << "Після --a: термін " << a.getShelfLife() << endl;
    Food before = a--;
    cout << "a-- повернув " << before.getShelfLife() << ", тепер " << a.getShelfLife() << endl;
    cout << "a > b (за калорійністю): " << (a > b) << endl;`,
    sub: [
      { cls: "DairyFood", title: "Молочний продукт", extra: d("fat", "Жирність, %", 0, 45, 2.5), kind: "молочний" },
      { cls: "BakeryFood", title: "Хлібобулочний виріб", extra: i("weight", "Маса, г", 0, 400, 250), kind: "хлібобулочний" },
    ],
    over: [{}, { name: '"Батон"' }],
  },
  {
    cls: "Hero",
    title: "Герой",
    friend: "Функція порівняння за силою",
    ops: ["Порівняння за рівнем <", "Збільшення сили на задану величину +", "Зменшення сили --"],
    attrs: [s("name", "Ім'я", "Безіменний", "Лицар", "Лучник"), i("level", "Рівень", 1, 7, 4), i("strength", "Сила", 10, 80, 55)],
    inClass: `    bool operator<(const Hero& o) const { return level < o.level; }
    Hero operator+(int delta) const { return Hero(name, level, strength + delta); }
    Hero& operator--()
    {
        --strength;
        return *this;
    }
    Hero operator--(int)
    {
        Hero old(*this);
        --strength;
        return old;
    }
    friend int compareStrength(const Hero& x, const Hero& y);   // «друг»`,
    after: `// Дружня функція: різниця сили героїв
int compareStrength(const Hero& x, const Hero& y)
{
    return x.strength - y.strength;
}`,
    demo: `    cout << "compareStrength(a, b) = " << compareStrength(a, b) << endl;
    cout << "a < b (за рівнем): " << (a < b) << endl;
    Hero stronger = a + 15;
    cout << "a + 15: " << stronger.toString() << endl;
    --a;
    a--;
    cout << "Після --a і a--: сила " << a.getStrength() << endl;`,
    sub: [
      { cls: "Warrior", title: "Воїн", extra: i("armor", "Броня", 0, 40, 25), kind: "воїн" },
      { cls: "Mage", title: "Маг", extra: i("mana", "Мана", 0, 120, 90), kind: "маг" },
    ],
    over: [{}, { name: '"Чарівник"' }],
  },
  {
    cls: "Vehicle",
    title: "Транспортний засіб",
    friend: "Функція зміни опису",
    ops: ["Збільшення вартості +", "Порівняння за роком випуску >, <"],
    attrs: [s("description", "Опис", "без опису", "Автобус міський", "Мікроавтобус"), i("year", "Рік випуску", 2000, 2018, 2021), d("price", "Вартість, грн", 0, 1500000, 900000)],
    inClass: `    Vehicle operator+(double add) const { return Vehicle(description, year, price + add); }
    bool operator>(const Vehicle& o) const { return year > o.year; }
    bool operator<(const Vehicle& o) const { return year < o.year; }
    friend void changeDescription(Vehicle& v, const string& text);   // «друг»`,
    after: `// Дружня функція зміни опису
void changeDescription(Vehicle& v, const string& text)
{
    v.description = text;
}`,
    demo: `    changeDescription(a, "Автобус міський, 40 місць");
    cout << "Новий опис a: " << a.getDescription() << endl;
    Vehicle dearer = a + 50000;
    cout << "a + 50000: " << dearer.toString() << endl;
    cout << "a > b (за роком): " << (a > b) << ", a < b: " << (a < b) << endl;`,
    sub: [
      { cls: "Bus", title: "Автобус", extra: i("seats", "Місць", 0, 40, 30), kind: "автобус" },
      { cls: "Truck", title: "Вантажівка", extra: d("capacity", "Вантажопідйомність, т", 0, 10, 3.5), kind: "вантажівка" },
    ],
    over: [{}, { description: '"Вантажівка бортова"' }],
  },
  {
    cls: "User",
    title: "Користувач",
    friend: "Функція порівняння логіну та паролю з введеними",
    ops: ["Порівняння логіну ==", "Порівняння паролю !=", "Доступ до атрибуту за його назвою [ ]"],
    attrs: [s("login", "Логін", "guest", "admin", "student"), s("password", "Пароль", "", "Qwerty1", "Pa55word"), s("email", "Пошта", "-", "admin@example.com", "student@example.com")],
    inClass: `    bool operator==(const User& o) const { return login == o.login; }
    bool operator!=(const User& o) const { return password != o.password; }
    // Доступ до атрибута за назвою: "login", "password", "email"
    string operator[](const string& key) const
    {
        if (key == "login") return login;
        if (key == "password") return password;
        if (key == "email") return email;
        return "немає атрибута " + key;
    }
    friend bool checkCredentials(const User& u, const string& login, const string& password);`,
    after: `// Дружня функція: збігаються логін і пароль із введеними
bool checkCredentials(const User& u, const string& login, const string& password)
{
    return u.login == login && u.password == password;
}`,
    demo: `    string login, password;
    cout << "Логін: ";
    cin >> login;
    cout << "Пароль: ";
    cin >> password;
    cout << "checkCredentials(a, …): " << checkCredentials(a, login, password) << endl;
    cout << "a == c (логін): " << (a == c) << ", a != b (пароль): " << (a != b) << endl;
    cout << "a[\\"email\\"] = " << a["email"] << ", a[\\"phone\\"] = " << a["phone"] << endl;`,
    sub: [
      { cls: "Admin", title: "Адміністратор", extra: i("accessLevel", "Рівень доступу", 1, 10, 5), kind: "адміністратор" },
      { cls: "Guest", title: "Гість", extra: i("sessionMinutes", "Сеанс, хв", 30, 60, 15), kind: "гість" },
    ],
    over: [{}, { login: '"guest1"' }],
  },
  {
    cls: "Smartphone",
    title: "Смартфон",
    friend: "Функція порівняння за вказаним атрибутом",
    ops: ["Порівняння за назвою моделі !=, ==", "Порівняння за вартістю =="],
    attrs: [s("model", "Модель", "невідома", "Galaxy A55", "Redmi Note 13"), d("price", "Вартість, грн", 0, 15999, 9999), i("memory", "Пам'ять, ГБ", 0, 256, 128)],
    inClass: `    bool operator==(const Smartphone& o) const { return model == o.model; }
    bool operator!=(const Smartphone& o) const { return model != o.model; }
    // Друге == з тим самим операндом неможливе, тому вартість порівнюється з числом
    bool operator==(double cost) const { return price == cost; }
    friend int compareBy(const Smartphone& x, const Smartphone& y, const string& attr);`,
    after: `// Дружня функція: порівняння за вказаним атрибутом ("model", "price", "memory")
int compareBy(const Smartphone& x, const Smartphone& y, const string& attr)
{
    if (attr == "price")
        return x.price < y.price ? -1 : x.price > y.price ? 1 : 0;
    if (attr == "memory")
        return x.memory < y.memory ? -1 : x.memory > y.memory ? 1 : 0;
    return x.model.compare(y.model) < 0 ? -1 : x.model == y.model ? 0 : 1;
}`,
    demo: `    cout << "compareBy(a, b, \\"price\\") = " << compareBy(a, b, "price") << ", за \\"memory\\" = " << compareBy(a, b, "memory") << endl;
    cout << "a == c (модель): " << (a == c) << ", a != b: " << (a != b) << endl;
    cout << "a == 15999 (вартість): " << (a == 15999.0) << endl;`,
    sub: [
      { cls: "GamingPhone", title: "Ігровий смартфон", extra: i("refreshRate", "Частота екрана, Гц", 60, 144, 120), kind: "ігровий" },
      { cls: "BudgetPhone", title: "Бюджетний смартфон", extra: i("battery", "Акумулятор, мА·год", 3000, 6000, 5000), kind: "бюджетний" },
    ],
    over: [{ model: '"ROG Phone 8"' }, {}],
  },
  {
    cls: "Artist",
    title: "Митець",
    friend: "Функція редагування жанру",
    ops: ["Порівняння за ім'ям ==", "Порівняння за видом мистецтва !=", "Збільшення кількості творів ++"],
    attrs: [s("name", "Ім'я", "Невідомий", "Марія", "Тарас"), s("artType", "Вид мистецтва", "живопис", "живопис", "музика"), s("genre", "Жанр", "-", "пейзаж", "джаз"), i("works", "Кількість творів", 0, 42, 17)],
    inClass: `    bool operator==(const Artist& o) const { return name == o.name; }
    bool operator!=(const Artist& o) const { return artType != o.artType; }
    Artist& operator++()
    {
        ++works;
        return *this;
    }
    Artist operator++(int)
    {
        Artist old(*this);
        ++works;
        return old;
    }
    friend void editGenre(Artist& a, const string& genre);   // «друг»`,
    after: `// Дружня функція редагування жанру
void editGenre(Artist& a, const string& genre)
{
    a.genre = genre;
}`,
    demo: `    editGenre(a, "портрет");
    cout << "Жанр a: " << a.getGenre() << endl;
    cout << "a == c (ім'я): " << (a == c) << ", a != b (вид мистецтва): " << (a != b) << endl;
    ++a;
    a++;
    cout << "Після ++a і a++: творів " << a.getWorks() << endl;`,
    sub: [
      { cls: "Painter", title: "Художник", extra: s("technique", "Техніка", "олія", "олія", "акварель"), kind: "художник" },
      { cls: "Musician", title: "Музикант", extra: s("instrument", "Інструмент", "фортепіано", "скрипка", "гітара"), kind: "музикант" },
    ],
  },
  {
    cls: "Appliance",
    title: "Побутова техніка",
    friend: "Майстер з ремонту",
    ops: ["Порівняння за ціною <, >", "Зменшення ціни на задане число -"],
    attrs: [s("name", "Назва", "Без назви", "Пральна машина", "Холодильник"), d("price", "Ціна, грн", 0, 18000, 24000), i("warranty", "Гарантія, міс.", 0, 24, 36)],
    forward: "class RepairMaster;",
    inClass: `    bool operator<(const Appliance& o) const { return price < o.price; }
    bool operator>(const Appliance& o) const { return price > o.price; }
    Appliance operator-(double value) const { return Appliance(name, price - value, warranty); }
    friend class RepairMaster;             // «Майстер з ремонту»`,
    after: `// Дружній клас «Майстер з ремонту»
class RepairMaster {
public:
    void repair(Appliance& a) const
    {
        a.warranty += 6;                   // закрите поле гарантії
        cout << "Майстер відремонтував: " << a.name << ", гарантія продовжена до " << a.warranty << " міс." << endl;
    }
};`,
    demo: `    RepairMaster master;
    master.repair(a);
    cout << "a < b (ціна): " << (a < b) << ", a > b: " << (a > b) << endl;
    Appliance cheaper = a - 2500;
    cout << "a - 2500: " << cheaper.toString() << endl;`,
    sub: [
      { cls: "WashingMachine", title: "Пральна машина", extra: d("load", "Завантаження, кг", 5, 7, 6), kind: "пральна машина" },
      { cls: "Fridge", title: "Холодильник", extra: i("volume", "Об'єм, л", 200, 350, 300), kind: "холодильник" },
    ],
  },
  {
    cls: "Trip",
    title: "Подорож",
    friend: "Туристичне агентство",
    ops: ["Порівняння за маршрутом ==", "Порівняння за протяжністю маршруту ==", "Зменшення ціни у задану кількість разів /"],
    attrs: [s("route", "Маршрут", "не задано", "Київ – Львів", "Одеса – Ізмаїл"), i("length", "Протяжність, км", 0, 540, 230), d("price", "Ціна, грн", 0, 4800, 2600)],
    forward: "class TravelAgency;",
    inClass: `    bool operator==(const Trip& o) const { return route == o.route; }
    // Друге == з тим самим операндом неможливе, тому протяжність порівнюється з числом
    bool operator==(int km) const { return length == km; }
    Trip operator/(double k) const { return Trip(route, length, price / k); }
    friend class TravelAgency;             // «Туристичне агентство»`,
    after: `// Дружній клас «Туристичне агентство»
class TravelAgency {
public:
    void offer(const Trip& t) const
    {
        cout << "Агентство пропонує: " << t.route << ", " << t.length << " км за " << t.price << " грн" << endl;
    }
    void setPrice(Trip& t, double price) const { t.price = price; }
};`,
    demo: `    TravelAgency agency;
    agency.setPrice(a, 5200);
    agency.offer(a);
    cout << "a == c (маршрут): " << (a == c) << ", a == 540 (км): " << (a == 540) << endl;
    Trip half = a / 2;
    cout << "a / 2: " << half.toString() << endl;`,
    sub: [
      { cls: "BusTour", title: "Автобусний тур", extra: i("stops", "Зупинок", 0, 6, 3), kind: "автобусний тур" },
      { cls: "Cruise", title: "Круїз", extra: s("ship", "Судно", "-", "Дніпро", "Одеса"), kind: "круїз" },
    ],
  },
  {
    cls: "Clothing",
    title: "Одяг",
    friend: "Функція порівняння за назвою",
    ops: ["Доступ до атрибуту за номером [ ]", "Порівняння за розміром ==, != (розміри у вигляді XXS, XS, S, M, L)"],
    attrs: [s("name", "Назва", "Без назви", "Сорочка", "Куртка"), s("size", "Розмір", "M", "M", "L"), d("price", "Ціна, грн", 0, 799.5, 2499)],
    inClass: `    // Доступ до атрибута за номером: 0 — назва, 1 — розмір, 2 — ціна
    string operator[](int index) const
    {
        switch (index) {
        case 0: return name;
        case 1: return size;
        case 2: {
            ostringstream out;
            out << price;
            return out.str();
        }
        default: return "немає атрибута з номером " + to_string(index);
        }
    }
    bool operator==(const Clothing& o) const { return size == o.size; }
    bool operator!=(const Clothing& o) const { return size != o.size; }
    // Розмір лише з ряду XXS, XS, S, M, L
    static bool validSize(const string& v) { return v == "XXS" || v == "XS" || v == "S" || v == "M" || v == "L"; }
    friend int compareByName(const Clothing& x, const Clothing& y);   // «друг»`,
    after: `// Дружня функція порівняння за назвою: -1, 0, 1
int compareByName(const Clothing& x, const Clothing& y)
{
    int r = x.name.compare(y.name);
    return (r > 0) - (r < 0);
}`,
    demo: `    cout << "compareByName(a, b) = " << compareByName(a, b) << endl;
    cout << "a[0] = " << a[0] << ", a[1] = " << a[1] << ", a[2] = " << a[2] << endl;
    cout << "a == c (розмір): " << (a == c) << ", a != b: " << (a != b) << endl;
    cout << "Розмір XL допустимий: " << Clothing::validSize("XL") << endl;`,
    sub: [
      { cls: "Shirt", title: "Сорочка", extra: s("sleeve", "Рукав", "довгий", "довгий", "короткий"), kind: "сорочка" },
      { cls: "Trousers", title: "Штани", extra: i("length", "Довжина, см", 100, 104, 98), kind: "штани" },
    ],
    over: [{}, { name: '"Джинси"' }],
  },
  {
    cls: "Car",
    title: "Автомобіль",
    friend: "Функція скидання всіх значень атрибутів до значень за замовчуванням",
    ops: ["Збільшення пробігу на задану величину +", "Порівняння за виробником !=", "Зменшення вартості --"],
    attrs: [s("manufacturer", "Виробник", "невідомий", "Toyota", "Skoda"), s("model", "Модель", "-", "Corolla", "Octavia"), i("mileage", "Пробіг, км", 0, 45000, 80000), d("price", "Вартість, грн", 0, 650000, 520000)],
    inClass: `    Car operator+(int km) const { return Car(manufacturer, model, mileage + km, price); }
    bool operator!=(const Car& o) const { return manufacturer != o.manufacturer; }
    Car& operator--()                      // вартість −10 % (крок методичка не задає)
    {
        price *= 0.9;
        return *this;
    }
    Car operator--(int)
    {
        Car old(*this);
        price *= 0.9;
        return old;
    }
    friend void resetToDefault(Car& c);    // «друг»`,
    after: `// Дружня функція: скидання всіх атрибутів до значень за замовчуванням
void resetToDefault(Car& c)
{
    c.manufacturer = "невідомий";
    c.model = "-";
    c.mileage = 0;
    c.price = 0;
}`,
    demo: `    Car driven = a + 1500;
    cout << "a + 1500: " << driven.toString() << endl;
    cout << "a != b (виробник): " << (a != b) << endl;
    --a;
    cout << "Після --a: " << a.getPrice() << endl;
    resetToDefault(c);
    cout << "Після resetToDefault(c): " << c.toString() << endl;`,
    sub: [
      { cls: "ElectricCar", title: "Електромобіль", extra: i("range", "Запас ходу, км", 0, 450, 380), kind: "електромобіль" },
      { cls: "PetrolCar", title: "Бензиновий автомобіль", extra: d("engine", "Об'єм двигуна, л", 1.0, 1.8, 1.4), kind: "бензиновий" },
    ],
    over: [{ manufacturer: '"Nissan"', model: '"Leaf"' }, {}],
  },
  {
    cls: "Artwork",
    title: "Витвір мистецтва",
    friend: "Автор",
    ops: ["Порівняння за назвою ==", "Збільшення вартості у задану кількість разів *", "Порівняння за роком створення <"],
    attrs: [s("title", "Назва", "Без назви", "Соняшники", "Весна"), i("year", "Рік створення", 2000, 1998, 2015), d("price", "Вартість, грн", 0, 120000, 45000)],
    forward: "class Author;",
    inClass: `    bool operator==(const Artwork& o) const { return title == o.title; }
    Artwork operator*(double k) const { return Artwork(title, year, price * k); }
    bool operator<(const Artwork& o) const { return year < o.year; }
    friend class Author;                   // «Автор»`,
    after: `// Дружній клас «Автор»
class Author {
public:
    void rename(Artwork& w, const string& title) const
    {
        cout << "Автор перейменував «" << w.title << "» на «" << title << "»" << endl;
        w.title = title;                   // закрите поле
    }
};`,
    demo: `    Author author;
    author.rename(b, "Весна на Дніпрі");
    cout << "a == c (назва): " << (a == c) << endl;
    Artwork dearer = a * 1.5;
    cout << "a * 1.5: " << dearer.toString() << endl;
    cout << "a < b (рік): " << (a < b) << endl;`,
    sub: [
      { cls: "Painting", title: "Картина", extra: s("technique", "Техніка", "олія", "олія", "акварель"), kind: "картина" },
      { cls: "Sculpture", title: "Скульптура", extra: s("material", "Матеріал", "мармур", "бронза", "граніт"), kind: "скульптура" },
    ],
    over: [{}, { title: '"Ярослав Мудрий"' }],
  },
];

function toStringBody(attrs: Attr[]) {
  return attrs.map((a, k) => `${k ? "\", " : "\""}${a.label}: " << ${a.name}`).join(" << ");
}

function members(p: Spec, access: "private" | "protected") {
  const { cls, attrs } = p;
  const fields = attrs.map((a) => `    ${cpp(a.type).padEnd(7)}${a.name};`.padEnd(32) + `// ${a.label}`).join("\n");
  const init = (f: (a: Attr) => string) => attrs.map((a) => `${a.name}(${f(a)})`).join(", ");
  const getters = attrs.map((a) => `    ${cpp(a.type)} get${cap(a.name)}() const { return ${a.name}; }`).join("\n");
  const setters = attrs
    .map((a) =>
      cls === "Clothing" && a.name === "size"
        ? `    void setSize(const string& v) { if (validSize(v)) size = v; }`
        : `    void set${cap(a.name)}(${param(a).replace(a.name, "v")}) { ${a.name} = v; }`,
    )
    .join("\n");
  return { fields, init, getters, setters, access };
}

export function lab4Program(v: number): string {
  const p = SPECS[v - 1];
  const m = members(p, "private");
  const { cls, attrs } = p;
  const call = (k: "a" | "b") => attrs.map((a) => a[k]).join(", ");
  return `// ЛР 4, варіант ${v}: сутність «${p.title}», «друг» — ${p.friend.toLowerCase()}.
// Операції: ${p.ops.join("; ")}.
#include <iostream>
#include <string>
#include <sstream>
${WIN_HEAD}
using namespace std;
${p.forward ? `\n${p.forward}\n` : ""}
class ${cls} {
${m.fields}
public:
    ${cls}() : ${m.init((a) => a.def)}
    {
        cout << "Конструктор за замовчуванням: " << toString() << endl;
    }
    ${cls}(${attrs.map(param).join(", ")})
        : ${m.init((a) => a.name)}
    {
        cout << "Конструктор з параметрами: " << toString() << endl;
    }
    ${cls}(const ${cls}& other) : ${m.init((a) => `other.${a.name}`)}
    {
        cout << "Конструктор копіювання: " << toString() << endl;
    }
    ~${cls}()
    {
        cout << "Деструктор: " << toString() << endl;
    }

${m.getters}

${m.setters}

    string toString() const
    {
        ostringstream out;
        out.precision(10);                 // великі суми без експоненти
        out << ${toStringBody(attrs)};
        return out.str();
    }

${p.inClass}
};

${p.after}

int main()
{
${WIN_INIT}
    cout << boolalpha;
    cout << "-- Конструктори" << endl;
    ${cls} d;                              // за замовчуванням
    ${cls} a(${call("a")});
    ${cls} b(${call("b")});
    ${cls} c(a);                           // копіювання

    cout << "\\n-- Сетери і гетери" << endl;
${attrs.map((x) => `    d.set${cap(x.name)}(${x.b});`).join("\n")}
${attrs.map((x) => `    cout << "${x.label}: " << d.get${cap(x.name)}() << endl;`).join("\n")}

    cout << "\\n-- «Друг» і операції" << endl;
${p.demo}

    cout << "\\n-- Кінець main: деструктори" << endl;
    return 0;
}
`;
}

export function lab5Program(v: number): string {
  const p = SPECS[v - 1];
  const m = members(p, "protected");
  const { cls, attrs } = p;
  const subs = p.sub.map((sub) => {
    const all = [...attrs, sub.extra];
    return `// Нащадок «${sub.title}»: додатковий атрибут і власні версії віртуальних методів
class ${sub.cls} : public ${cls} {
    ${cpp(sub.extra.type).padEnd(7)}${sub.extra.name};             // ${sub.extra.label}
public:
    ${sub.cls}(${all.map(param).join(", ")})
        : ${cls}(${attrs.map((a) => a.name).join(", ")}), ${sub.extra.name}(${sub.extra.name})
    {
        cout << "Конструктор ${sub.title.toLowerCase()}" << endl;
    }
    ~${sub.cls}() override { cout << "Деструктор ${sub.title.toLowerCase()}" << endl; }

    ${cpp(sub.extra.type)} get${cap(sub.extra.name)}() const { return ${sub.extra.name}; }
    void set${cap(sub.extra.name)}(${param(sub.extra).replace(sub.extra.name, "v")}) { ${sub.extra.name} = v; }

    string kind() const override { return "${sub.kind}"; }
    string toString() const override
    {
        ostringstream out;
        out.precision(10);
        out << ${cls}::toString() << ", ${sub.extra.label}: " << ${sub.extra.name};
        return out.str();
    }
    // Не віртуальний: при виклику через вказівник на базовий клас не спрацює
    void info() const { cout << "info() класу ${sub.cls}" << endl; }
};`;
  });
  return `// ЛР 5, варіант ${v}: абстрактний клас «${p.title}» з ЛР 4 і нащадки
// «${p.sub[0].title}», «${p.sub[1].title}»; пізнє зв'язування через віртуальні функції.
#include <iostream>
#include <string>
#include <sstream>
${WIN_HEAD}
using namespace std;

// Абстрактний базовий клас: має чисто віртуальну функцію kind()
class ${cls} {
protected:                                 // доступні нащадкам
${m.fields}
public:
    ${cls}(${attrs.map(param).join(", ")})
        : ${m.init((a) => a.name)}
    {
        cout << "Конструктор базового класу" << endl;
    }
    virtual ~${cls}()                      // віртуальний: delete через базовий вказівник
    {
        cout << "Деструктор базового класу" << endl;
    }

${m.getters}

${m.setters.replace(/validSize\(v\)/, "v == \"XXS\" || v == \"XS\" || v == \"S\" || v == \"M\" || v == \"L\"")}

    virtual string kind() const = 0;       // чисто віртуальна — клас абстрактний
    virtual string toString() const
    {
        ostringstream out;
        out.precision(10);                 // великі суми без експоненти
        out << ${toStringBody(attrs)};
        return out.str();
    }
    // Звичайний метод — раннє (статичне) зв'язування
    void info() const { cout << "info() класу ${cls}" << endl; }
};

${subs.join("\n\n")}

int main()
{
${WIN_INIT}
    const int N = 2;
    // Масив вказівників на абстрактний клас — об'єктів самого ${cls} створити не можна
    ${cls}* items[N] = {
        new ${p.sub[0].cls}(${[...attrs.map((a) => p.over?.[0][a.name] ?? a.a), p.sub[0].extra.a].join(", ")}),
        new ${p.sub[1].cls}(${[...attrs.map((a) => p.over?.[1][a.name] ?? a.b), p.sub[1].extra.b].join(", ")}),
    };

    cout << "\\n-- Пізнє зв'язування: викликаються методи нащадків" << endl;
    for (int k = 0; k < N; k++)
        cout << items[k]->kind() << ": " << items[k]->toString() << endl;

    cout << "\\n-- Раннє зв'язування: info() не віртуальний" << endl;
    items[0]->info();                      // через вказівник на базовий — версія ${cls}
    static_cast<${p.sub[0].cls}*>(items[0])->info();   // через тип нащадка — його версія

    cout << "\\n-- Сетер і гетер через базовий вказівник" << endl;
    items[1]->set${cap(attrs[0].name)}(${p.over?.[1][attrs[0].name] ?? attrs[0].b});
    cout << items[1]->get${cap(attrs[0].name)}() << endl;

    cout << "\\n-- Видалення: спрацьовують деструктори нащадка і бази" << endl;
    for (int k = 0; k < N; k++)
        delete items[k];
    return 0;
}
`;
}

export const LAB4_ROWS = SPECS.map((p, k) => [k + 1, p.title, p.friend, p.ops.join("; ")]);
