# Агент керування пісочницею Windows Sandbox.
# Виконує скрипти io\cmd\*.ps1 (у порядку імен) з помічниками нижче,
# результат пише в io\out\<ім'я>.txt. Кліки й введення – лише всередині пісочниці.

$ErrorActionPreference = 'Continue'
$Root    = Split-Path -Parent $PSScriptRoot
$CmdDir  = Join-Path $Root 'io\cmd'
$OutDir  = Join-Path $Root 'io\out'
$ShotDir = Join-Path $Root 'shots'
New-Item -ItemType Directory -Force $CmdDir, $OutDir, $ShotDir | Out-Null
$Utf8 = New-Object System.Text.UTF8Encoding $false

Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class W {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, int d, UIntPtr e);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc p, IntPtr l);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr h, int x, int y, int w, int hh, bool r);
  [DllImport("user32.dll")] public static extern uint SendInput(uint n, INPUT[] i, int size);
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [StructLayout(LayoutKind.Sequential)] public struct MOUSEINPUT { public int dx, dy; public uint data, flags, time; public IntPtr extra; }
  [StructLayout(LayoutKind.Sequential)] public struct KEYBDINPUT { public ushort vk, scan; public uint flags, time; public IntPtr extra; }
  [StructLayout(LayoutKind.Explicit)] public struct INPUT {
    [FieldOffset(0)] public uint type;
    [FieldOffset(8)] public MOUSEINPUT mi;
    [FieldOffset(8)] public KEYBDINPUT ki;
  }
  public static uint Key(ushort vk, ushort scan, uint flags) {
    INPUT[] a = new INPUT[1];
    a[0].type = 1; a[0].ki.vk = vk; a[0].ki.scan = scan; a[0].ki.flags = flags;
    return SendInput(1, a, Marshal.SizeOf(typeof(INPUT)));
  }
}
"@
[W]::SetProcessDPIAware() | Out-Null

# ---- вікна -----------------------------------------------------------------
function Wins {
  # видимі вікна верхнього рівня з заголовком: hwnd, процес, прямокутник
  $list = New-Object System.Collections.ArrayList
  $cb = [W+EnumProc]{
    param($h, $l)
    if ([W]::IsWindowVisible($h)) {
      $sb = New-Object System.Text.StringBuilder 512
      [W]::GetWindowText($h, $sb, 512) | Out-Null
      if ($sb.Length -gt 0) {
        $r = New-Object W+RECT; [W]::GetWindowRect($h, [ref]$r) | Out-Null
        $procId = 0; [W]::GetWindowThreadProcessId($h, [ref]$procId) | Out-Null
        $pn = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName
        [void]$list.Add([pscustomobject]@{ Hwnd = $h; Proc = $pn; Title = $sb.ToString();
          X = $r.L; Y = $r.T; W = $r.R - $r.L; H = $r.B - $r.T; Min = [W]::IsIconic($h) })
      }
    }
    return $true
  }
  [W]::EnumWindows($cb, [IntPtr]::Zero) | Out-Null
  $list
}
function Win([string]$Title) { Wins | Where-Object { $_.Title -match $Title } | Select-Object -First 1 }
function Focus([string]$Title) {
  $w = Win $Title
  if (-not $w) { throw "немає вікна '$Title'" }
  if ($w.Min) { [W]::ShowWindow($w.Hwnd, 9) | Out-Null }
  if ([W]::GetForegroundWindow() -ne $w.Hwnd) {
    # Alt «розблоковує» SetForegroundWindow для фонового процесу; F24 між натисками
    # не дає вікну сприйняти Alt як виклик меню (інакше з'їдається наступна літера)
    [W]::Key(0x12, 0, 0) | Out-Null; [W]::SetForegroundWindow($w.Hwnd) | Out-Null
    [W]::Key(0x87, 0, 0) | Out-Null; [W]::Key(0x87, 0, 2) | Out-Null; [W]::Key(0x12, 0, 2) | Out-Null
  }
  Start-Sleep -Milliseconds 300
  Win $Title
}
function Place([string]$Title, [int]$X, [int]$Y, [int]$Wd, [int]$Ht) {
  $w = Win $Title; [W]::MoveWindow($w.Hwnd, $X, $Y, $Wd, $Ht, $true) | Out-Null; Win $Title
}

# ---- миша й клавіатура -----------------------------------------------------
function MoveTo([int]$X, [int]$Y) { [W]::SetCursorPos($X, $Y) | Out-Null }
function Click([int]$X, [int]$Y, [switch]$Right, [switch]$Double) {
  [W]::SetCursorPos($X, $Y) | Out-Null; Start-Sleep -Milliseconds 80
  $d, $u = if ($Right) { 0x08, 0x10 } else { 0x02, 0x04 }
  $n = if ($Double) { 2 } else { 1 }
  for ($i = 0; $i -lt $n; $i++) {
    [W]::mouse_event($d, 0, 0, 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 40
    [W]::mouse_event($u, 0, 0, 0, [UIntPtr]::Zero); Start-Sleep -Milliseconds 60
  }
}
function Wheel([int]$Delta) { [W]::mouse_event(0x0800, 0, 0, $Delta, [UIntPtr]::Zero) }
function TypeText([string]$Text) {
  # юнікодне введення: кирилиця й шляхи без залежності від розкладки
  foreach ($ch in $Text.ToCharArray()) {
    [W]::Key(0, [uint16]$ch, 4) | Out-Null; [W]::Key(0, [uint16]$ch, 6) | Out-Null
    Start-Sleep -Milliseconds 15
  }
}
$VK = @{ ctrl = 0x11; alt = 0x12; shift = 0x10; win = 0x5B; enter = 0x0D; esc = 0x1B; tab = 0x09;
  space = 0x20; back = 0x08; del = 0x2E; up = 0x26; down = 0x28; left = 0x25; right = 0x27;
  home = 0x24; end = 0x23; pgup = 0x21; pgdn = 0x22; f4 = 0x73; f5 = 0x75 }
function Key([string]$Combo) {
  # 'ctrl+a', 'enter', 'alt+f4', 'shift+tab'
  $codes = @(foreach ($p in $Combo.ToLower().Split('+')) {
    if ($VK.ContainsKey($p)) { $VK[$p] } elseif ($p.Length -eq 1) { [int][char]$p.ToUpper() } else { throw "невідома клавіша $p" }
  })
  foreach ($c in $codes) { [W]::Key([uint16]$c, 0, 0) | Out-Null }
  [array]::Reverse($codes)
  foreach ($c in $codes) { [W]::Key([uint16]$c, 0, 2) | Out-Null }
}

# ---- знімки ----------------------------------------------------------------
function Shot([string]$Name, [string]$Title) {
  # без -Title – увесь екран пісочниці; з -Title – лише це вікно
  if ($Title) {
    $w = Win $Title; if (-not $w) { throw "немає вікна '$Title'" }
    $x, $y, $wd, $ht = $w.X, $w.Y, $w.W, $w.H
  } else {
    $b = [System.Windows.Forms.SystemInformation]::VirtualScreen
    $x, $y, $wd, $ht = $b.X, $b.Y, $b.Width, $b.Height
  }
  $bmp = New-Object System.Drawing.Bitmap $wd, $ht
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
  $path = Join-Path $ShotDir "$Name.png"
  New-Item -ItemType Directory -Force (Split-Path $path) | Out-Null
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose()
  "shot $Name ${wd}x$ht @ $x,$y"
}

# ---- цикл ------------------------------------------------------------------
"agent started $(Get-Date -Format s)" | Set-Content (Join-Path $Root 'io\agent.log')
$beat = [DateTime]::MinValue
while ($true) {
  if (((Get-Date) - $beat).TotalSeconds -ge 5) {
    [IO.File]::WriteAllText((Join-Path $Root 'io\alive.txt'), (Get-Date -Format s), $Utf8); $beat = Get-Date
  }
  foreach ($f in (Get-ChildItem $CmdDir -Filter *.ps1 -ErrorAction SilentlyContinue | Sort-Object Name)) {
    $code = [IO.File]::ReadAllText($f.FullName, [Text.Encoding]::UTF8)
    Remove-Item $f.FullName -Force
    $res = try { & ([scriptblock]::Create($code)) *>&1 | Out-String -Width 400 } catch { "ПОМИЛКА: $($_.Exception.Message)`n$($_.ScriptStackTrace)" }
    $tmp = Join-Path $OutDir "$($f.BaseName).tmp"
    [IO.File]::WriteAllText($tmp, "$res", $Utf8)
    Move-Item $tmp (Join-Path $OutDir "$($f.BaseName).txt") -Force
  }
  Start-Sleep -Milliseconds 250
}
