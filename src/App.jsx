import { supabase } from "./supabase";
import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "mustafa-sigorta-app-v7";

const currentMonthName = (() => {
  const monthNames = [
    "OCAK",
    "ŞUBAT",
    "MART",
    "NİSAN",
    "MAYIS",
    "HAZİRAN",
    "TEMMUZ",
    "AĞUSTOS",
    "EYLÜL",
    "EKİM",
    "KASIM",
    "ARALIK",
  ];
  return monthNames[new Date().getMonth()];
})();

const months = [
  "TÜMÜ",
  "OCAK",
  "ŞUBAT",
  "MART",
  "NİSAN",
  "MAYIS",
  "HAZİRAN",
  "TEMMUZ",
  "AĞUSTOS",
  "EYLÜL",
  "EKİM",
  "KASIM",
  "ARALIK",
];

const policyTypes = [
  "TRAFİK",
  "KASKO",
  "DASK",
  "KONUT",
  "SAĞLIK",
  "TAMAMLAYICI SAĞLIK",
  "MESLEKİ SORUMLULUK",
];

const companyOptions = [
  "",
  "AK",
  "ALLIANZ",
  "ANADOLU",
  "ANKARA",
  "AXA",
  "DOĞA",
  "REFERANS",
  "HDI",
  "HEPİYİ",
  "MAGDEBURGER",
  "MAPFRE",
  "NEOVA",
  "QUICK",
  "RAY",
  "SOMPO",
  "TÜRKNİPPON",
  "TÜRKİYE",
  "TÜRKİYE KATILIM",
  "UNİCO",
  "ZURICH",
  "KORU",
  "CORPUS",
  "ŞEKER",
];

const todayIso = () => new Date().toISOString().slice(0, 10);
const makeId = () =>
  "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const currency = (value) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(safeNumber(value));

const daysLeft = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  return Math.ceil((startTarget - startToday) / (1000 * 60 * 60 * 24));
};

const getNextYearSameDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + 1);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
};

const normalizePhoneForTel = (phone) => (phone || "").replace(/\s+/g, "");

const normalizePhoneForWhatsApp = (phone) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return "90" + digits.slice(1);
  return "90" + digits;
};

const formatBirthDateInput = (value) => {
  const digits = (value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "." + digits.slice(2);
  return (
    digits.slice(0, 2) + "." + digits.slice(2, 4) + "." + digits.slice(4)
  );
};

const birthDateToInputValue = (value) => {
  if (!value) return "";
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(String(value))) return String(value);
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value);
  return match[3] + "." + match[2] + "." + match[1];
};

const normalizeBirthDateForSave = (value) => {
  if (!value) return "";
  return formatBirthDateInput(value);
};

const findCustomerDefaults = (policies, customerName) => {
  const name = (customerName || "").trim().toLocaleUpperCase("tr-TR");
  if (!name) return null;

  const match = policies.find(
    (item) =>
      (item.customer || "").trim().toLocaleUpperCase("tr-TR") === name
  );

  if (!match) return null;

  return {
    relation: match.relation || "",
    phone: match.phone || "",
    identityNo: match.identityNo || "",
    birthDate: birthDateToInputValue(match.birthDate || ""),
    plate: match.plate || "",
    documentSerial: match.documentSerial || "",
  };
};

const emptyForm = () => ({
  month: currentMonthName,
  customer: "",
  relation: "",
  phone: "",
  company: "",
  policyType: "TRAFİK",
  recordType: "Poliçe",
  identityNo: "",
  birthDate: "",
  policyNo: "",
  plate: "",
  documentSerial: "",
  issueDate: todayIso(),
  startDate: todayIso(),
  endDate: getNextYearSameDate(todayIso()),
  net: "",
  gross: "",
  commission: "",
  note: "",
});

const initialPolicies = [
  {
    id: "1",
    month: "OCAK",
    customer: "RAMAZAN MERT YILDIZ",
    relation: "ABİM",
    phone: "05362408630",
    company: "TÜRKİYE",
    policyType: "MESLEKİ SORUMLULUK",
    recordType: "Poliçe",
    identityNo: "28598098728",
    birthDate: "12.03.1993",
    policyNo: "804605221",
    plate: "",
    documentSerial: "",
    issueDate: "2026-01-21",
    startDate: "2026-01-31",
    endDate: "2027-01-31",
    net: 3000,
    gross: 3150,
    commission: 210,
    note: "800 geldi",
  },
  {
    id: "2",
    month: "OCAK",
    customer: "ÖMER FARUK AÇIKGÖZ",
    relation: "ARKADAŞ",
    phone: "05078262726",
    company: "UNİCO",
    policyType: "TRAFİK",
    recordType: "Poliçe",
    identityNo: "38563497746",
    birthDate: "22.02.1998",
    policyNo: "188080048",
    plate: "35DA3414",
    documentSerial: "GY304485",
    issueDate: "2026-01-31",
    startDate: "2026-01-31",
    endDate: "2027-01-31",
    net: 8903.06,
    gross: 9911.33,
    commission: 623.22,
    note: "",
  },
  {
    id: "3",
    month: "ŞUBAT",
    customer: "ZEYNEP GÜNGÖR",
    relation: "KOMŞU",
    phone: "05332223344",
    company: "ALLIANZ",
    policyType: "KONUT",
    recordType: "Poliçe",
    identityNo: "12345678901",
    birthDate: "14.10.1988",
    policyNo: "44556677",
    plate: "",
    documentSerial: "",
    issueDate: "2026-02-03",
    startDate: "2026-02-05",
    endDate: "2027-02-05",
    net: 4200,
    gross: 4620,
    commission: 630,
    note: "Yıllık yenileme",
  },
  {
    id: "4",
    month: "MART",
    customer: "SİNEM ARSLAN",
    relation: "MÜŞTERİ",
    phone: "05334445566",
    company: "TÜRKNİPPON",
    policyType: "KASKO",
    recordType: "Poliçe",
    identityNo: "89012345678",
    birthDate: "30.12.1991",
    policyNo: "88889999",
    plate: "41SKO41",
    documentSerial: "KS4455",
    issueDate: "2026-03-11",
    startDate: "2026-03-15",
    endDate: "2027-03-15",
    net: 9300,
    gross: 10150,
    commission: 1023,
    note: "",
  },
  {
    id: "5",
    month: "NİSAN",
    customer: "YUSUF CAN",
    relation: "MÜŞTERİ",
    phone: "05335550101",
    company: "SOMPO",
    policyType: "TRAFİK",
    recordType: "Poliçe",
    identityNo: "24680135791",
    birthDate: "07.07.1995",
    policyNo: "45454545",
    plate: "34YCF34",
    documentSerial: "TT1010",
    issueDate: "2026-04-01",
    startDate: "2026-04-03",
    endDate: "2027-04-03",
    net: 6400,
    gross: 7080,
    commission: 512,
    note: "",
  },
];

function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 " + className
      }
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action || null}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </Card>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-2xl px-3 py-3 text-sm font-semibold " +
        (active
          ? "bg-slate-950 text-white"
          : "bg-slate-100 text-slate-600")
      }
    >
      {label}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      {children}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <Card className="p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-words font-medium text-slate-800">
        {value || "-"}
      </div>
    </Card>
  );
}

function PolicyRow({ policy, onOpen }) {
  const expiryDays = daysLeft(policy.endDate);

  return (
    <button
      onClick={() => onOpen(policy)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {policy.customer || "İsimsiz kayıt"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {policy.policyType} • {policy.company || "Şirket yok"}
          </div>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {policy.month}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-600">
        <div>
          <div className="text-slate-400">Net</div>
          <div className="font-medium text-slate-800">
            {currency(policy.net)}
          </div>
        </div>
        <div>
          <div className="text-slate-400">Komisyon</div>
          <div className="font-medium text-slate-800">
            {currency(policy.commission)}
          </div>
        </div>
        <div>
          <div className="text-slate-400">Bitiş</div>
          <div
            className={
              "font-medium " +
              (expiryDays !== null && expiryDays <= 14
                ? "text-orange-500"
                : "text-slate-800")
            }
          >
            {policy.endDate || "-"}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState("anasayfa");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [search, setSearch] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [autoEndDate, setAutoEndDate] = useState(true);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [form, setForm] = useState(emptyForm());

  const [policies, setPolicies] = useState([]);

  useEffect(() => {
  loadPolicies();
}, []);

async function loadPolicies() {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Veri çekme hatası:", error);
    return;
  }

  const mappedData = (data || []).map((item) => ({
    id: item.id,
    month: item.month ?? "",
    customer: item.customer ?? "",
    relation: item.relation ?? "",
    phone: item.phone ?? "",
    company: item.company ?? "",
    policyType: item.policy_type ?? "",
    recordType: item.record_type ?? "",
    identityNo: item.identity_no ?? "",
    birthDate: item.birth_date ?? "",
    policyNo: item.policy_no ?? "",
    plate: item.plate ?? "",
    documentSerial: item.document_serial ?? "",
    issueDate: item.issue_date ?? "",
    startDate: item.start_date ?? "",
    endDate: item.end_date ?? "",
    net: item.net ?? 0,
    gross: item.gross ?? 0,
    commission: item.commission ?? 0,
    note: item.note ?? "",
    createdAt: item.created_at ?? "",
  }));

  console.log("Mapped policies:", mappedData);
  setPolicies(mappedData);
}
  

  const dashboard = useMemo(() => {
    const monthFiltered = policies.filter((p) => p.month === selectedMonth);
    const totalNet = monthFiltered.reduce((sum, p) => sum + safeNumber(p.net), 0);
    const totalGross = monthFiltered.reduce(
      (sum, p) => sum + safeNumber(p.gross),
      0
    );
    const totalCommission = monthFiltered.reduce(
      (sum, p) => sum + safeNumber(p.commission),
      0
    );

    const expiringSoon = monthFiltered.filter((p) => {
      const d = daysLeft(p.endDate);
      return d !== null && d >= 0 && d <= 15;
    });

    const counts = {};
    monthFiltered.forEach((p) => {
      counts[p.policyType] = (counts[p.policyType] || 0) + 1;
    });

    const topTypes = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      totalNet,
      totalGross,
      totalCommission,
      expiringSoon,
      topTypes,
      monthFilteredCount: monthFiltered.length,
    };
  }, [policies, selectedMonth]);

  const renewals = useMemo(() => {
    return policies
      .map((p) => ({ ...p, remainingDays: daysLeft(p.endDate) }))
      .filter((p) => p.remainingDays !== null && p.remainingDays >= 0)
      .sort((a, b) => a.remainingDays - b.remainingDays)
      .slice(0, 15);
  }, [policies]);

  const portfolioCustomers = useMemo(() => {
    const grouped = {};

    policies.forEach((p) => {
      const key = (p.customer || "").trim();
      if (!key) return;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    return Object.entries(grouped)
      .map(([customer, items]) => ({
        customer,
        items,
        phone: items[0] ? items[0].phone : "",
        plate: items.find((x) => x.plate)?.plate || "",
      }))
      .sort((a, b) => a.customer.localeCompare(b.customer, "tr"));
  }, [policies]);

  const resetFormState = () => {
    setEditingId(null);
    setAutoEndDate(true);
    setCustomerSuggestions([]);
    setForm(emptyForm());
  };

  const handleStartDateChange = (value) => {
    setForm((prev) => ({
      ...prev,
      startDate: value,
      endDate: autoEndDate ? getNextYearSameDate(value) : prev.endDate,
    }));
  };

  const handleEndDateChange = (value) => {
    setAutoEndDate(false);
    setForm((prev) => ({ ...prev, endDate: value }));
  };

  const handleCustomerChange = (value) => {
    setForm((prev) => ({ ...prev, customer: value }));

    const query = value.trim().toLocaleUpperCase("tr-TR");
    if (!query) {
      setCustomerSuggestions([]);
      return;
    }

    const suggestions = [
      ...new Set(
        policies
          .map((item) => item.customer)
          .filter(Boolean)
          .filter((name) =>
            name.toLocaleUpperCase("tr-TR").includes(query)
          )
      ),
    ].slice(0, 6);

    setCustomerSuggestions(suggestions);
  };

  const applyExistingCustomerData = (customerName) => {
    const defaults = findCustomerDefaults(policies, customerName);

    setCustomerSuggestions([]);
    setForm((prev) => ({
      ...prev,
      customer: customerName,
      relation: defaults?.relation || prev.relation,
      phone: defaults?.phone || prev.phone,
      identityNo: defaults?.identityNo || prev.identityNo,
      birthDate: defaults?.birthDate || prev.birthDate,
      plate: defaults?.plate || prev.plate,
      documentSerial: defaults?.documentSerial || prev.documentSerial,
    }));
  };

  const startEdit = (policy) => {
    setEditingId(policy.id);
    setAutoEndDate(false);
    setCustomerSuggestions([]);

    setForm({
      month: policy.month || currentMonthName,
      customer: policy.customer || "",
      relation: policy.relation || "",
      phone: policy.phone || "",
      company: policy.company || "",
      policyType: policy.policyType || "TRAFİK",
      recordType: policy.recordType || "Poliçe",
      identityNo: policy.identityNo || "",
      birthDate: birthDateToInputValue(policy.birthDate || ""),
      policyNo: policy.policyNo || "",
      plate: policy.plate || "",
      documentSerial: policy.documentSerial || "",
      issueDate: policy.issueDate || todayIso(),
      startDate: policy.startDate || todayIso(),
      endDate: policy.endDate || "",
      net: policy.net ?? "",
      gross: policy.gross ?? "",
      commission: policy.commission ?? "",
      note: policy.note || "",
    });

    setSelectedPolicy(null);
    setTab("ekle");
  };

  const handleSave = async () => {
  if (!form.customer.trim()) return;

  const payload = {
    month: form.month,
    customer: form.customer.trim(),
    relation: form.relation.trim(),
    phone: form.phone.trim(),
    company: form.company.trim(),
    policy_type: form.policyType.trim(),
    record_type: form.recordType.trim() || "Poliçe",
    identity_no: form.identityNo.trim(),
    birth_date: normalizeBirthDateForSave(form.birthDate.trim()),
    policy_no: form.policyNo.trim(),
    plate: form.plate.trim().toUpperCase(),
    document_serial: form.documentSerial.trim(),
    issue_date: form.issueDate || null,
    start_date: form.startDate || null,
    end_date: form.endDate || null,
    net: toNumberOrNull(form.net),
    gross: toNumberOrNull(form.gross),
    commission: toNumberOrNull(form.commission),
    note: form.note.trim(),
  };

  if (editingId) {
    const { error } = await supabase
      .from("policies")
      .update(payload)
      .eq("id", editingId);

    if (error) {
      console.error("Güncelleme hatası:", error);
      alert("Güncelleme sırasında hata oluştu.");
      return;
    }
  } else {
    const { error } = await supabase
      .from("policies")
      .insert([payload]);

    if (error) {
      console.error("Kayıt hatası:", error);
      alert("Kayıt sırasında hata oluştu.");
      return;
    }
  }

  await loadPolicies();
  resetFormState();
  setTab("liste");
};

  const handleDelete = (id) => {
    setPolicies((prev) => prev.filter((item) => item.id !== id));

    if (selectedPolicy && selectedPolicy.id === id) {
      setSelectedPolicy(null);
    }

    if (editingId === id) {
      resetFormState();
    }

    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <div className="bg-slate-950 px-5 pb-6 pt-10 text-white">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Mustafa Can Yıldız
          </div>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Sigorta Takip</h1>
              <p className="mt-1 text-sm text-slate-300">
                Mobil uyumlu poliçe takip uygulaması
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <div className="text-xs text-slate-300">Kayıt</div>
              <div className="text-lg font-semibold">{policies.length}</div>
            </div>
          </div>
        </div>

        <div className="-mt-4 flex-1 rounded-t-[28px] bg-slate-100 px-4 pb-28 pt-5">
          {tab === "anasayfa" && (
            <div>
              <SectionTitle title="Özet" subtitle={`${selectedMonth} ayı özeti`} />

              <Card className="mb-4 p-3">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Özet ay seçimi
                </div>
                <select
                  className="field"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months
                    .filter((m) => m !== "TÜMÜ")
                    .map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                </select>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Toplam Net"
                  value={currency(dashboard.totalNet)}
                />
                <StatCard
                  label="Toplam Komisyon"
                  value={currency(dashboard.totalCommission)}
                />
                <StatCard
                  label="Toplam Brüt"
                  value={currency(dashboard.totalGross)}
                />
                <StatCard
                  label="Yaklaşan Bitiş"
                  value={String(dashboard.expiringSoon.length)}
                  sub="15 gün ve altı"
                />
                <StatCard
                  label="Kayıt Sayısı"
                  value={String(dashboard.monthFilteredCount)}
                  sub={`${selectedMonth} kayıtları`}
                />
              </div>

              <div className="mt-6">
                <SectionTitle title="En çok kesilen branşlar" />
                <div className="space-y-3">
                  {dashboard.topTypes.map(([type, count]) => {
                    const ratio = Math.max(
                      12,
                      Math.round((count / Math.max(1, policies.length)) * 100)
                    );

                    return (
                      <Card key={type} className="p-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-800">
                            {type}
                          </span>
                          <span className="text-slate-500">{count} kayıt</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-slate-900"
                            style={{ width: ratio + "%" }}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <SectionTitle
                  title="Müşteri portföy kartları"
                  subtitle="Bir müşterinin tüm poliçelerini tek ekranda gör"
                />

                <div className="space-y-3">
                  {portfolioCustomers.slice(0, 8).map((item) => (
                    <button
                      key={item.customer}
                      onClick={() => setSelectedCustomer(item)}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {item.customer}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {item.phone || item.plate || "Kayıtlı müşteri"}
                          </div>
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                          {item.items.length} poliçe
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {[...new Set(item.items.map((x) => x.policyType))]
                          .slice(0, 4)
                          .map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-slate-100 px-2 py-1 text-xs"
                            >
                              {t}
                            </span>
                          ))}
                      </div>
                    </button>
                  ))}

                  {portfolioCustomers.length === 0 && (
                    <Card className="p-5 text-center text-sm text-slate-500">
                      Henüz müşteri portföyü oluşmadı.
                    </Card>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <SectionTitle
                  title="Yaklaşan yenilemeler"
                  subtitle="Önümüzdeki kayıtlar"
                />

                <div className="space-y-3">
                  {renewals
                    .filter((item) => item.month === selectedMonth)
                    .slice(0, 5)
                    .map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">
                              {item.customer}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.policyType} •{" "}
                              {item.plate || item.company || "-"}
                            </div>
                          </div>
                          <div
                            className={
                              "rounded-full px-3 py-1 text-xs font-semibold " +
                              (item.remainingDays <= 15
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-700")
                            }
                          >
                            {item.remainingDays} gün
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          )}

          {tab === "liste" && (
            <div>
              <SectionTitle
                title="Poliçe listesi"
                subtitle="Arama ve aya göre filtre"
              />

              <Card className="p-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Müşteri, plaka, şirket ara"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <div className="mt-3">
                  <select
                    className="field"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>

              <div className="mt-4 space-y-3">
                {filtered.map((policy) => (
                  <PolicyRow
                    key={policy.id}
                    policy={policy}
                    onOpen={setSelectedPolicy}
                  />
                ))}

                {filtered.length === 0 && (
                  <Card className="p-5 text-center text-sm text-slate-500">
                    Kayıt bulunamadı.
                  </Card>
                )}
              </div>
            </div>
          )}

          {tab === "ekle" && (
            <div>
              <SectionTitle
                title={editingId ? "Kaydı düzenle" : "Yeni poliçe ekle"}
                subtitle={
                  editingId
                    ? "Yanlış bilgileri düzeltip güncelleyebilirsin"
                    : "Formu doldurup kaydedebilirsin"
                }
                action={
                  editingId ? (
                    <button
                      onClick={resetFormState}
                      className="rounded-2xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      İptal
                    </button>
                  ) : null
                }
              />

              <Card className="p-4">
                <div className="grid grid-cols-1 gap-3">
                  <Field label="Müşteri">
                    <div className="relative">
                      <input
                        className="field"
                        value={form.customer}
                        onChange={(e) => handleCustomerChange(e.target.value)}
                        placeholder="Müşteri adı yaz"
                      />

                      {customerSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-10 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                          {customerSuggestions.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => applyExistingCustomerData(name)}
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Ay">
                      <select
                        className="field"
                        value={form.month}
                        onChange={(e) =>
                          setForm({ ...form, month: e.target.value })
                        }
                      >
                        {months
                          .filter((m) => m !== "TÜMÜ")
                          .map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                      </select>
                    </Field>

                    <Field label="Poliçe türü">
                      <select
                        className="field"
                        value={form.policyType}
                        onChange={(e) =>
                          setForm({ ...form, policyType: e.target.value })
                        }
                      >
                        {policyTypes.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Telefon">
                    <input
                      className="field"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="TC Kimlik / Vergi No">
                    <input
                      className="field"
                      value={form.identityNo}
                      onChange={(e) =>
                        setForm({ ...form, identityNo: e.target.value })
                      }
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Doğum Tarihi">
                      <input
                        className="field"
                        inputMode="numeric"
                        placeholder="GG.AA.YYYY"
                        maxLength={10}
                        value={birthDateToInputValue(form.birthDate)}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            birthDate: formatBirthDateInput(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field label="Belge Seri No">
                      <input
                        className="field"
                        value={form.documentSerial}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            documentSerial: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Şirket">
                      <select
                        className="field"
                        value={form.company}
                        onChange={(e) =>
                          setForm({ ...form, company: e.target.value })
                        }
                      >
                        {companyOptions.map((c) => (
                          <option key={c} value={c}>
                            {c || "Seç"}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Plaka">
                      <input
                        className="field"
                        value={form.plate}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            plate: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Başlangıç">
                      <input
                        type="date"
                        className="field"
                        value={form.startDate}
                        onChange={(e) =>
                          handleStartDateChange(e.target.value)
                        }
                      />
                    </Field>

                    <Field label="Bitiş">
                      <input
                        type="date"
                        className="field"
                        value={form.endDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
                    Bitiş tarihi başlangıç tarihine göre otomatik olarak 1 yıl
                    sonrası gelir. İstersen bitiş tarihini elle değiştirerek
                    farklı tarih verebilirsin.
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
                    Doğum tarihine rakam yazman yeterli. Uygulama otomatik olarak
                    GG.AA.YYYY formatına çevirir. Daha önce kayıtlı bir müşteri
                    seçersen telefon, TC ve doğum tarihi otomatik doldurulur.
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Net">
                      <input
                        type="number"
                        className="field"
                        value={form.net}
                        onChange={(e) =>
                          setForm({ ...form, net: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Brüt">
                      <input
                        type="number"
                        className="field"
                        value={form.gross}
                        onChange={(e) =>
                          setForm({ ...form, gross: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Komisyon">
                      <input
                        type="number"
                        className="field"
                        value={form.commission}
                        onChange={(e) =>
                          setForm({ ...form, commission: e.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Not">
                    <textarea
                      className="field min-h-[90px] resize-none"
                      value={form.note}
                      onChange={(e) =>
                        setForm({ ...form, note: e.target.value })
                      }
                    />
                  </Field>

                  <button
                    onClick={handleSave}
                    className="mt-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                  >
                    {editingId ? "Kaydı güncelle" : "Poliçeyi kaydet"}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {tab === "yenileme" && (
            <div>
              <SectionTitle
                title="Yenileme takibi"
                subtitle="Bitiş tarihi yaklaşan poliçeler"
              />

              <div className="space-y-3">
                {renewals.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {item.customer}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.policyType} • {item.endDate}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {item.plate || item.company || item.phone || "-"}
                        </div>
                      </div>

                      <div
                        className={
                          "rounded-2xl px-3 py-2 text-center text-xs font-semibold " +
                          (item.remainingDays <= 15
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-700")
                        }
                      >
                        <div>{item.remainingDays}</div>
                        <div>gün</div>
                      </div>
                    </div>
                  </Card>
                ))}

                {renewals.length === 0 && (
                  <Card className="p-5 text-center text-sm text-slate-500">
                    Yaklaşan yenileme görünmüyor.
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-slate-200 bg-white px-3 py-3">
          <div className="grid grid-cols-4 gap-2">
            <TabButton
              active={tab === "anasayfa"}
              onClick={() => setTab("anasayfa")}
              label="Ana"
            />
            <TabButton
              active={tab === "liste"}
              onClick={() => setTab("liste")}
              label="Liste"
            />
            <TabButton
              active={tab === "ekle"}
              onClick={() => setTab("ekle")}
              label="Ekle"
            />
            <TabButton
              active={tab === "yenileme"}
              onClick={() => setTab("yenileme")}
              label="Yenile"
            />
          </div>
        </div>

        {selectedPolicy && (
          <div className="fixed inset-0 z-20 flex items-end bg-black/40 p-3">
            <div className="max-h-[85vh] w-full overflow-y-auto rounded-[28px] bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {selectedPolicy.customer}
                  </div>
                  <div className="text-sm text-slate-500">
                    {selectedPolicy.policyType} •{" "}
                    {selectedPolicy.company || "Şirket yok"}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPolicy(null)}
                  className="rounded-full bg-slate-100 px-3 py-2 text-sm"
                >
                  Kapat
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Telefon" value={selectedPolicy.phone} />
                <Info label="Plaka" value={selectedPolicy.plate} />
                <Info label="Başlangıç" value={selectedPolicy.startDate} />
                <Info label="Bitiş" value={selectedPolicy.endDate} />
                <Info label="Net" value={currency(selectedPolicy.net)} />
                <Info
                  label="Komisyon"
                  value={currency(selectedPolicy.commission)}
                />
                <Info label="Poliçe No" value={selectedPolicy.policyNo} />
                <Info
                  label="TC / Vergi No"
                  value={selectedPolicy.identityNo}
                />
              </div>

              {selectedPolicy.note && (
                <Card className="mt-4 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Not
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    {selectedPolicy.note}
                  </div>
                </Card>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <a
                  href={
                    selectedPolicy.phone
                      ? "tel:" + normalizePhoneForTel(selectedPolicy.phone)
                      : undefined
                  }
                  onClick={(e) => {
                    if (!selectedPolicy.phone) e.preventDefault();
                  }}
                  className={
                    "rounded-2xl px-4 py-3 text-center text-sm font-semibold " +
                    (selectedPolicy.phone
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-slate-100 text-slate-400")
                  }
                >
                  Ara
                </a>

                <a
                  href={
                    selectedPolicy.phone
                      ? "https://wa.me/" +
                        normalizePhoneForWhatsApp(selectedPolicy.phone)
                      : undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    if (!selectedPolicy.phone) e.preventDefault();
                  }}
                  className={
                    "rounded-2xl px-4 py-3 text-center text-sm font-semibold " +
                    (selectedPolicy.phone
                      ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                      : "bg-slate-100 text-slate-400")
                  }
                >
                  WhatsApp
                </a>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={() => startEdit(selectedPolicy)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  Düzenle
                </button>

                <button
                  onClick={() => setDeleteTarget(selectedPolicy)}
                  className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-xl">
              <div className="text-lg font-bold text-slate-900">Kaydı sil</div>
              <div className="mt-2 text-sm text-slate-600">
                <span className="font-semibold">{deleteTarget.customer}</span>{" "}
                kaydını silmek üzeresin. Bu işlem geri alınmaz.
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Vazgeç
                </button>

                <button
                  onClick={() => handleDelete(deleteTarget.id)}
                  className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Evet, sil
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedCustomer && (
          <div className="fixed inset-0 z-30 flex items-end bg-black/40 p-3">
            <div className="max-h-[85vh] w-full overflow-y-auto rounded-[28px] bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {selectedCustomer.customer}
                  </div>
                  <div className="text-sm text-slate-500">
                    {selectedCustomer.phone ||
                      selectedCustomer.plate ||
                      "Müşteri portföy kartı"}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-full bg-slate-100 px-3 py-2 text-sm"
                >
                  Kapat
                </button>
              </div>

              <div className="space-y-3">
                {selectedCustomer.items.map((policy) => (
                  <button
                    key={policy.id}
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSelectedPolicy(policy);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {policy.policyType}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {policy.company || "Şirket yok"} •{" "}
                          {policy.plate || policy.identityNo || "-"}
                        </div>
                      </div>

                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {policy.month}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <div className="text-slate-400">Net</div>
                        <div className="font-medium text-slate-800">
                          {currency(policy.net)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Komisyon</div>
                        <div className="font-medium text-slate-800">
                          {currency(policy.commission)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .field {
          width: 100%;
          border-radius: 16px;
          border: 1px solid rgb(226 232 240);
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          background: white;
        }
        .field:focus {
          border-color: rgb(15 23 42);
        }
      `}</style>
    </div>
  );
}