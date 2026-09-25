# Lobe під wine у WSL

Як запустити Lobe 0.11.714.2 (Windows-застосунок, Electron + Node + Python/TensorFlow)
у WSL2 з WSLg через wine. Перевірено 25.09.2026: Ubuntu 24.04, wine 9.0, WSLg.

Спосіб робочий, але з обмеженнями: потрібні три латки у файлах застосунку, навчання йде
лише на процесорі, а WSL під час довгої роботи з GUI одного разу впала. Звіт ЛР3 зроблено
не так, а у Windows Sandbox (штатний Lobe, GPU через DirectML) – див. `windows-sandbox/`.
Цей опис лишається на випадок, коли пісочниці немає (Windows Home) або потрібен Linux.

## 1. Встановлення wine

```bash
sudo dpkg --add-architecture i386          # wine32 потрібен 32-розрядний набір бібліотек
sudo apt-get update
sudo apt-get install -y --install-recommends wine64 wine32:i386 winetricks
sudo apt-get install -y osslsigncode x11-apps   # перевірка підпису; xwd для знімків вікон
```

Підпис інсталятора (файл з архіву викладача, не з офіційного сайту):

```bash
osslsigncode verify Lobe.exe    # має бути «Signature verification: ok», Microsoft Corporation
```

### Поломка взаємодії WSL з Windows

Пакет wine реєструє в `binfmt_misc` обробник для файлів `MZ` і цим витісняє WSLInterop:
`powershell.exe` та інші `.exe` Windows з WSL перестають запускатися з помилкою
`Exec format error`. Повернути:

```bash
sudo sh -c "echo ':WSLInterop:M::MZ::/init:PF' > /proc/sys/fs/binfmt_misc/register"
sudo sh -c "echo ':WSLInterop:M::MZ::/init:PF' > /etc/binfmt.d/WSLInterop.conf"   # і після перезапуску
```

## 2. Префікс і встановлення Lobe

```bash
export WINEPREFIX=$HOME/.wine-lobe
wineboot -u
wine Lobe.exe            # звичайний майстер установки: Next → Finish
```

### Шрифти

Інтерфейс Lobe показує кирилицю системним шрифтом; без шрифтів Windows замість назв
класів квадрати. Скопіювати з Windows у префікс і підмінити стандартні шрифти wine:

```bash
F=/mnt/c/Windows/Fonts
cp $F/segoeui.ttf $F/segoeuib.ttf $F/segoeuisl.ttf $F/seguisb.ttf $F/arial.ttf $F/arialbd.ttf \
   "$WINEPREFIX/drive_c/windows/Fonts/"
cat > fonts.reg <<'EOF'
REGEDIT4

[HKEY_CURRENT_USER\Software\Wine\Fonts\Replacements]
"Microsoft Sans Serif"="Segoe UI"
"MS Shell Dlg"="Segoe UI"
"MS Shell Dlg 2"="Segoe UI"
"Tahoma"="Segoe UI"
"Times New Roman"="Segoe UI"
EOF
wine regedit fonts.reg
```

## 3. Латки застосунку

Файли лежать у `$WINEPREFIX/drive_c/Program Files/Lobe/resources/app/dist/`. Перед
правкою зберегти копії `*.orig`. Файли мають закінчення рядків CRLF, тож порівнювати з
`diff -u --strip-trailing-cr`.

**Симптом:** одразу після запуску вікно «Unexpected exception … write EPIPE», Lobe
закривається. Причина – телеметрія (Application Insights) і транспорт журналу пишуть у
канали між процесами Node, які під wine рвуться.

`config/lobeConfig.js` – вимкнути телеметрію:

```diff
 function buildConfig(insightsKeys, updateStorage, updateContainer, updateUrl, powerPlatformUrl, msalClientId) {
     return {
-        insightsKeys: insightsKeys || exports.lobeConfig.insightsKeys,
+        insightsKeys: {},  // wine: телеметрія вимкнена (EPIPE у транспорті журналу)
```

`main/main.js` – не вважати EPIPE фатальною помилкою:

```diff
 process.on('uncaughtException', error => {
+    // wine: канали між процесами Node рвуться (EPIPE) — це не привід закривати застосунок
+    if (error && (error.code === 'EPIPE' || /EPIPE/.test(String(error.message)))) {
+        log.warn(`wine: ignored ${error.message}`);
+        return;
+    }
     handleFatalError(`Unexpected exception`, error);
 });
```

**Симптом:** заставка висить, у журналі `Start: Timed out` для серверного процесу.
Причина – дочірній процес запускається, але IPC-повідомлення `ready` до головного не
доходить.

`utils/process.js` – у `ProcessFactory.start`, одразу після
`process.once('error', onStartError);`:

```diff
             process.once('error', onStartError);
+            // wine: IPC-повідомлення «ready» від дочірнього процесу не доходить; вважаємо процес запущеним через 20 с
+            const wineReady = setTimeout(() => {
+                if (process) {
+                    this.log.info(`${prefix}: Start: wine fallback ready`);
+                    if (startTimer) { clearTimeout(startTimer); }
+                    const p = process;
+                    p.removeAllListeners();
+                    if (onExit) { p.once('exit', (code, signal) => onExit(code, signal)); }
+                    resolve(p);
+                }
+            }, 20000);
             process.once('message', (message) => {
+                clearTimeout(wineReady);
                 this.log.info(`${prefix}: Start: Received ${JSON.stringify(message)}`);
```

## 4. Запуск

**Симптом:** `Lobe.backend.exe` падає з «int divide by zero» / «divide by zero in 64-bit
code» у `directml.dll`. DirectML і CUDA під wine не працюють; вимкнути їх, і TensorFlow
перейде на процесор (у журналі `Featurizer created via CPU`).

```bash
#!/bin/sh
export WINEPREFIX=$HOME/.wine-lobe WINEDEBUG=-all DISPLAY=:0
export WINEDLLOVERRIDES="nvcuda=d;d3d12=d;d3d12core=d" CUDA_VISIBLE_DEVICES=-1 DML_VISIBLE_DEVICES=-1
wineserver -k 2>/dev/null; sleep 3
cd "$WINEPREFIX/drive_c/Program Files/Lobe" && wine Lobe.exe --disable-gpu --no-sandbox
```

Журнали Lobe: `$WINEPREFIX/drive_c/users/$USER/AppData/Roaming/Lobe/logs/<сесія>/`
(`main.log`, `server.log`, `backend.log`, `backend.err.log`).

## 5. Що ще варто знати

* Навчання на процесорі: MobileNetV2 – близько 30 с на 160 зображень, ResNet50V2 – до
  хвилини. Перше вікно Lobe відкривається 1–2 хв (латка чекає 20 с на кожен процес).
* Падіння точності після донавчання в режимі Optimize for Speed (у wine 84 % → 51 %)
  – не вада wine: у штатному Lobe на Windows те саме (91 % → 34 %).
* Керування з WSL: `xdotool` (кліки, введення), `import -window <id>` (знімок одного
  вікна, без решти робочого столу). Кирилиця через `xdotool type` у діалоги wine
  вводиться ненадійно – краще тримати ASCII-копії шляхів. Діалог відкриття у вкладці
  Use дозволяє вибрати лише один файл.
* Знімки й проміжні файли не тримати в `/tmp`: WSL під час падіння його очищує.

## 6. Прибирання

```bash
wineserver -k; rm -rf ~/.wine-lobe
sudo apt-get purge -y 'wine*' winetricks osslsigncode x11-apps && sudo apt-get autoremove -y --purge
sudo apt-get purge -y $(dpkg -l | awk '$4=="i386" {print $2}') && sudo dpkg --remove-architecture i386
```

`/etc/binfmt.d/WSLInterop.conf` можна лишити: без wine він нічому не заважає і
відновлює WSLInterop після перезапуску.
