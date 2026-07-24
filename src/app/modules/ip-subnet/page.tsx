"use client";

import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { Card, CardBody } from "@/components/ui/card";
import { NumberField, TextField } from "@/components/ui/field";
import { InfoNote } from "@/components/ui/info-note";
import { OutputBlock } from "@/components/ui/output-block";
import { modules } from "@/lib/modules";
import { subnetInfo } from "@/lib/algorithms/ip-subnet";

const mod = modules.find((m) => m.slug === "ip-subnet")!;

export default function IpSubnetPage() {
  const [ip, setIp] = useState("107.214.175.68");
  const [prefix, setPrefix] = useState(19);

  const result = useMemo(() => {
    try {
      return { ok: true as const, data: subnetInfo(ip, prefix) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [ip, prefix]);

  return (
    <div>
      <ModuleHeader module={mod} />
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        <InfoNote>
          Сеть = IP AND маска; адрес хоста = IP AND (NOT маска) — хостовая часть с нулями вместо
          сетевых бит (может дополняться нулями спереди, как в примере методички); первый хост =
          сеть+1, последний = broadcast−1, broadcast = сеть OR (NOT маска); число узлов =
          2^(32−преф.)−2. Поля по умолчанию — реальный проверочный пример из отчёта (значения
          сошлись полностью).
        </InfoNote>

        <Card>
          <CardBody className="pt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Полный IP-адрес" value={ip} onChange={(e) => setIp(e.target.value)} />
              <NumberField label="Префикс (/N)" value={prefix} onChange={(e) => setPrefix(Number(e.target.value))} min={0} max={32} />
            </div>

            {result.ok ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <OutputBlock label="Маска" value={`${result.data.mask} (/${result.data.prefix})`} />
                <OutputBlock label="Адрес сети" value={`${result.data.network}/${result.data.prefix}`} />
                <OutputBlock label="Адрес хоста (хостовая часть)" value={result.data.hostPart} />
                <OutputBlock label="Число узлов" value={String(result.data.hostCount)} />
                <OutputBlock label="Первый хост" value={result.data.firstHost} />
                <OutputBlock label="Последний хост" value={result.data.lastHost} />
                <OutputBlock label="Широковещательный адрес (broadcast)" value={result.data.broadcast} className="sm:col-span-2" />
              </div>
            ) : (
              <p className="text-sm text-codes">{result.error}</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
