import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UnitUsahaPage() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/unit-usaha").then(r => setList(r.data)); }, []);
  return (
    <div className="space-y-6" data-testid="unit-page">
      <div>
        <p className="label mb-1">Struktur Usaha</p>
        <h1 className="font-heading text-3xl font-bold">6 Unit Usaha BUMDES</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {list.map((u) => (
          <Card key={u.id} data-testid={`unit-card-${u.code}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="secondary">{u.code}</Badge>
              </div>
              <h3 className="font-heading text-lg font-bold mb-2">{u.name}</h3>
              <p className="text-sm mb-3 text-muted-foreground">{u.description}</p>
              <div className="p-3 rounded-lg text-xs bg-primary/10 border border-border">
                <div className="label mb-1">Skema Bagi Hasil</div>
                <p className="text-foreground">{u.revenue_scheme}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
