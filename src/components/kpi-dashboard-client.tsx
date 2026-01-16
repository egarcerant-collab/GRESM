"use client";

import { useState, useEffect, useRef, useTransition, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calcularNumeradorGinecologia,
  calcularDenominadorGinecologia,
} from "@/lib/kpi-helpers";
import { generarInformePDF } from "@/lib/informe-riesgo-pdf";
import type { InformeDatos, DocImages } from "@/lib/types";
import JSZip from "jszip";
import type { KpiResults, User, MapData } from "@/lib/types";
import { MonthlyKpiChart } from "@/components/charts/MonthlyKpiChart";
import html2canvas from "html2canvas";
import { Loader2, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { logoutAction } from "@/app/actions";


const ColombiaMap = dynamic(() => import('@/components/charts/ColombiaMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-md"><p>Cargando mapa...</p></div>
});


/* -----------------------------------------------------------
   Archivos disponibles en /public/BASES/<año>/<MES>.xlsx
----------------------------------------------------------- */
const availableFiles: Record<string, { name: string; path: string }[]> = {
  "2025": [
    { name: "Enero", path: "/BASES/2025/ENERO.xlsx" },
    { name: "Febrero", path: "/BASES/2025/FEBRERO.xlsx" },
    { name: "Marzo", path: "/BASES/2025/MARZO.xlsx" },
    { name: "Abril", path: "/BASES/2025/ABRIL.xlsx" },
    { name: "Mayo", path: "/BASES/2025/MAYO.xlsx" },
    { name: "Junio", path: "/BASES/2025/JUNIO.xlsx" },
    { name: "Julio", path: "/BASES/2025/JULIO.xlsx" },
    { name: "Agosto", path: "/BASES/2025/AGOSTO.xlsx" },
    { name: "Septiembre", path: "/BASES/2025/SEPTIEMBRE.xlsx" },
    { name: "Octubre", path: "/BASES/2025/OCTUBRE.xlsx" },
    { name: "Noviembre", path: "/BASES/2025/NOVIEMBRE.xlsx" },
    { name: "Diciembre", path: "/BASES/2025/DICIEMBRE.xlsx" },
  ],
  "2026": [
      { name: "Diciembre", path: "/BASES/2026/DICIEMBRE.xlsx" }
  ],
};

type ChartDataItem = {
  name: string;
  [key: string]: number | string;
};

const monthNameToNumber: { [k: string]: number } = {
  ENERO: 0,
  FEBRERO: 1,
  MARZO: 2,
  ABRIL: 3,
  MAYO: 4,
  JUNIO: 5,
  JULIO: 6,
  AGOSTO: 7,
  SEPTIEMBRE: 8,
  OCTUBRE: 9,
  NOVIEMBRE: 10,
  DICIEMBRE: 11,
};

/* -----------------------------------------------------------
   Utilidades
----------------------------------------------------------- */
const cleanHeader = (h: string) =>
  String(h || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

/** Busca una columna por fragmentos (tolerante a acentos/espacios). Devuelve la CLAVE LIMPIA. */
const pickHeaderSafe = (
  rowObj: Record<string, any>,
  includes: string[]
): string => {
  const keys = Object.keys(rowObj);
  const cleanedIncludes = includes.map((f) => cleanHeader(f));
  for (const k of keys) {
    const ck = cleanHeader(k);
    if (cleanedIncludes.every((frag) => ck.includes(frag))) return ck;
  }
  return "";
};

/** Conversión robusta de fecha desde Excel/Texto/Date */
const convertirFechaExcel = (valor: any): Date | null => {
  if (valor === null || valor === undefined || valor === "") return null;

  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return new Date(Date.UTC(valor.getFullYear(), valor.getMonth(), valor.getDate()));
  }

  if (typeof valor === "string" && /^\d+(\.\d+)?$/.test(valor.trim())) {
    const n = Number(valor.trim());
    if (isFinite(n)) {
      const base = new Date(Date.UTC(1899, 11, 30)); 
      const fecha = new Date(base.getTime() + n * 86400000);
      return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
    }
  }

  if (typeof valor === "number" && isFinite(valor)) {
    const base = new Date(Date.UTC(1899, 11, 30));
    const fecha = new Date(base.getTime() + valor * 86400000);
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  }

  if (typeof valor === "string") {
    const s = valor.trim();

    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
      const [Y, M, D] = s.split("-").map((x) => parseInt(x, 10));
      return new Date(Date.UTC(Y, M - 1, D));
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [p1, p2, p3] = s.split("/").map((x) => parseInt(x, 10));
      if (p1 > 12) return new Date(Date.UTC(p3, p2 - 1, p1)); // D/M/Y
      if (p2 > 12) return new Date(Date.UTC(p3, p1 - 1, p2)); // M/D/Y
      return new Date(Date.UTC(p3, p2 - 1, p1));
    }
    if (/^\d{1,2}\.\d{1_2}\/\d{4}$/.test(s)) {
      const [p1, p2, p3] = s.split(".").map((x) => parseInt(x, 10));
      return new Date(Date.UTC(p3, p2 - 1, p1));
    }
  }

  return null;
};

const getBackgroundImage = async (): Promise<ArrayBuffer | undefined> => {
  try {
    const response = await fetch("/imagenes/IMAGENEN UNIFICADA.jpg");
    if (!response.ok) {
      console.error("Error al cargar la imagen de fondo:", response.statusText);
      return undefined;
    }
    return await response.arrayBuffer();
  } catch (e) {
    console.error("No se pudo cargar la imagen de fondo:", e);
    return undefined;
  }
};


/* -----------------------------------------------------------
   Componente
----------------------------------------------------------- */
export function KpiDashboardClient({ user }: { user: Omit<User, 'password'>}) {
  const [isLoggingOut, startTransition] = useTransition();

  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [months, setMonths] = useState<{ name: string; path: string }[]>(availableFiles["2025"] || []);
  const [selectedFile, setSelectedFile] = useState<string>("");

  const [kpiResult, setKpiResult] = useState<number | null>(null);
  const [gestantesControlResult, setGestantesControlResult] = useState<number | null>(null);
  const [controlPercentageResult, setControlPercentageResult] = useState<number | null>(null);
  const [examenesVihCompletosResult, setExamenesVihCompletosResult] = useState<number | null>(null);
  const [resultadoTamizajeVihResult, setResultadoTamizajeVihResult] = useState<number | null>(null);
  const [examenesSifilisCompletosResult, setExamenesSifilisCompletosResult] = useState<number | null>(null);
  const [resultadoTamizajeSifilisResult, setResultadoTamizajeSifilisResult] = useState<number | null>(null);

  const [toxoplasmaValidosResult, setToxoplasmaValidosResult] = useState<number | null>(null);
  const [resultadoToxoplasmaResult, setResultadoToxoplasmaResult] = useState<number | null>(null);
  const [examenesHbCompletosResult, setExamenesHbCompletosResult] = useState<number | null>(null);
  const [resultadoTamizajeHbResult, setResultadoTamizajeHbResult] = useState<number | null>(null);
  const [chagasResultadosValidosResult, setChagasResultadosValidosResult] = useState<number | null>(null);
  const [resultadoChagasResult, setResultadoChagasResult] = useState<number | null>(null);
  const [ecografiasValidasResult, setEcografiasValidasResult] = useState<number | null>(null);
  const [resultadoEcografiasResult, setResultadoEcografiasResult] = useState<number | null>(null);
  const [nutricionResult, setNutricionResult] = useState<number | null>(null);
  const [resultadoNutricionResult, setResultadoNutricionResult] = useState<number | null>(null);
  const [odontologiaResult, setOdontologiaResult] = useState<number | null>(null);
  const [resultadoOdontologiaResult, setResultadoOdontologiaResult] = useState<number | null>(null);
  const [ginecologiaResult, setGinecologiaResult] = useState<number | null>(null);
  const [denominadorGinecologiaResult, setDenominadorGinecologiaResult] = useState<number | null>(null);
  const [porcentajeGinecologiaResult, setPorcentajeGinecologiaResult] = useState<number | null>(null);
  const [controlesEnMes, setControlesEnMes] = useState<number | null>(null);
  const [controlesFueraMes, setControlesFueraMes] = useState<number | null>(null);
  const [resultadoSinControlMes, setResultadoSinControlMes] = useState<number | null>(null);
  const [controlesPrenatalesAdecuados, setControlesPrenatalesAdecuados] = useState<number | null>(null);
  const [totalGestantesEgMayor32, setTotalGestantesEgMayor32] = useState<number | null>(null);
  const [porcentajeControlesAdecuados, setPorcentajeControlesAdecuados] = useState<number | null>(null);
  
  const [captacionOportunaDocs, setCaptacionOportunaDocs] = useState<string[]>([]);
  const [vihCompletoDocs, setVihCompletoDocs] = useState<string[]>([]);
  const [sifilisCompletoDocs, setSifilisCompletoDocs] = useState<string[]>([]);
  const [toxoplasmaValidoDocs, setToxoplasmaValidoDocs] = useState<string[]>([]);
  const [hbCompletoDocs, setHbCompletoDocs] = useState<string[]>([]);
  const [chagasValidoDocs, setChagasValidoDocs] = useState<string[]>([]);
  const [ecografiasValidasDocs, setEcografiasValidasDocs] = useState<string[]>([]);
  const [nutricionDocs, setNutricionDocs] = useState<string[]>([]);
  const [odontologiaDocs, setOdontologiaDocs] = useState<string[]>([]);
  const [ginecologiaDocs, setGinecologiaDocs] = useState<string[]>([]);
  const [controlesAdecuadosDocs, setControlesAdecuadosDocs] = useState<string[]>([]);


  const [departments, setDepartments] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [ipsList, setIpsList] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");
  const [selectedIps, setSelectedIps] = useState<string>("");

  const [allData, setAllData] = useState<any[]>([]);
  const [filterData, setFilterData] = useState<any[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [mapData, setMapData] = useState<MapData[]>([]);
  const [selectedMapKpi, setSelectedMapKpi] = useState<string>("controlPercentageResult");

  useEffect(() => {
    if (hasCalculated) calculateKpi();
  }, [selectedDepartment, selectedMunicipality, selectedIps]); // eslint-disable-line

  const resetAll = () => {
    setAllData([]);
    setError(null);
    setHasCalculated(false);
    setDepartments([]);
    setMunicipalities([]);
    setIpsList([]);
    setSelectedDepartment("");
    setSelectedMunicipality("");
    setSelectedIps("");
    setMapData([]);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setMonths(availableFiles[year] || []);
    setSelectedFile("");
    resetAll();
    setChartData([]);
  };

  const handleFileChange = (value: string) => {
    setSelectedFile(value);
    resetAll();
  };

  const handleLogout = () => {
    startTransition(() => {
        logoutAction();
    });
  };

  /* -----------------------------------------------------------
     Cálculo principal
  ----------------------------------------------------------- */
  const calculateKpi = async (isInitialRun = false) => {
    try {
      if (!selectedFile) {
        setError("Por favor, selecciona un mes/archivo para analizar.");
        return;
      }

      setIsLoading(true);
      setError(null);

      // Reset KPIs
      setKpiResult(null);
      setGestantesControlResult(null);
      setControlPercentageResult(null);
      setExamenesVihCompletosResult(null);
      setResultadoTamizajeVihResult(null);
      setExamenesSifilisCompletosResult(null);
      setResultadoTamizajeSifilisResult(null);
      setToxoplasmaValidosResult(null);
      setResultadoToxoplasmaResult(null);
      setExamenesHbCompletosResult(null);
      setResultadoTamizajeHbResult(null);
      setChagasResultadosValidosResult(null);
      setResultadoChagasResult(null);
      setEcografiasValidasResult(null);
      setResultadoEcografiasResult(null);
      setNutricionResult(null);
      setResultadoNutricionResult(null);
      setOdontologiaResult(null);
      setResultadoOdontologiaResult(null);
      setGinecologiaResult(null);
      setDenominadorGinecologiaResult(null);
      setPorcentajeGinecologiaResult(null);
      setControlesEnMes(null);
      setControlesFueraMes(null);
      setResultadoSinControlMes(null);
      setControlesPrenatalesAdecuados(null);
      setTotalGestantesEgMayor32(null);
      setPorcentajeControlesAdecuados(null);

      // Reset desglose
      setCaptacionOportunaDocs([]);
      setVihCompletoDocs([]);
      setSifilisCompletoDocs([]);
      setToxoplasmaValidoDocs([]);
      setHbCompletoDocs([]);
      setChagasValidoDocs([]);
      setEcografiasValidasDocs([]);
      setNutricionDocs([]);
      setOdontologiaDocs([]);
      setGinecologiaDocs([]);
      setControlesAdecuadosDocs([]);


      if (isInitialRun) setHasCalculated(false);

      let jsonData = allData;

      if (isInitialRun || allData.length === 0 || selectedFile !== allData[0]?.__sourcePath) {
        const response = await fetch(selectedFile);
        if (!response.ok) throw new Error(`No se pudo leer el archivo (${response.status}).`);

        const buf = await response.arrayBuffer();

        let workbook = XLSX.read(buf, { type: "array", cellDates: true, raw: true });
        let sheetName = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[sheetName];
        let rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rows || rows.length === 0) {
          workbook = XLSX.read(buf, { type: "array", cellDates: true, raw: false });
          sheetName = workbook.SheetNames[0];
          worksheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        }

        rows.forEach((r: any) => (r.__sourcePath = selectedFile));
        jsonData = rows;
        setAllData(rows);
      }

      if (!jsonData.length) {
        setError("El archivo está vacío o con formato no reconocido.");
        return;
      }

      const originalHeaders: Record<string, string> = {};
      const firstRow: any = {};
      for (const k in jsonData[0]) {
        const ck = cleanHeader(k);
        originalHeaders[ck] = k;
        firstRow[ck] = jsonData[0][k];
      }

      const deptKey = pickHeaderSafe(firstRow, ["departamento", "residencia"]) ||
        pickHeaderSafe(firstRow, ["departamento"]);
      const muniKey = pickHeaderSafe(firstRow, ["municipio", "residencia"]) ||
        pickHeaderSafe(firstRow, ["municipio"]);
      const ipsKey = pickHeaderSafe(firstRow, ["ips", "primaria"]) ||
        pickHeaderSafe(firstRow, ["nombre", "ips"]);

      const controlIdKey = pickHeaderSafe(firstRow, ["identificacion"]);
      const captacionKey = pickHeaderSafe(firstRow, ["edad", "gest", "inicio", "control"]);
      const vih1Key = pickHeaderSafe(firstRow, ["vih", "primer", "tamiz"]);
      const vih2Key = pickHeaderSafe(firstRow, ["vih", "segundo", "tamiz"]);
      const vih3Key = pickHeaderSafe(firstRow, ["vih", "tercer", "tamiz"]);
      const sif1Key = pickHeaderSafe(firstRow, ["sifilis", "primera"]);
      const sif2Key = pickHeaderSafe(firstRow, ["sifilis", "segunda"]);
      const sif3Key = pickHeaderSafe(firstRow, ["sifilis", "tercera"]);
      const toxoKey = pickHeaderSafe(firstRow, ["toxoplasma"]);
      const hbResKey = pickHeaderSafe(firstRow, ["hepatitis", "b", "resultado"]);
      const hbFechaKey = pickHeaderSafe(firstRow, ["hepatitis", "b", "fecha"]);
      const chagasKey = pickHeaderSafe(firstRow, ["chagas"]);
      const eco1Key = pickHeaderSafe(firstRow, ["ecografia", "translucencia"]);
      const eco2Key = pickHeaderSafe(firstRow, ["ecografia", "anomalias"]);
      const eco3Key = pickHeaderSafe(firstRow, ["ecografia", "otras"]);
      const nutriKey = pickHeaderSafe(firstRow, ["nutricion"]);
      const odontoKey = pickHeaderSafe(firstRow, ["odontolog"]);
      const fechaControlKey =
        pickHeaderSafe(firstRow, ["ultimo", "control", "prenatal"]) ||
        pickHeaderSafe(firstRow, ["fecha", "control"]) ||
        pickHeaderSafe(firstRow, ["fecha", "atencion"]);
      const totalControlesKey = pickHeaderSafe(firstRow, ["numero", "total", "controles", "prenatales"]);
      const edadGestacionalKey = pickHeaderSafe(firstRow, ["edad", "gestacional", "actual"]);


      const missing: string[] = [];
      if (!controlIdKey) missing.push("identificación");
      if (!captacionKey) missing.push("captación (edad_gest_inicio_control)");
      if (!fechaControlKey) missing.push("fecha de último control prenatal");
      if (missing.length) {
        setError(
          `No se encontraron columnas requeridas: ${missing.join(
            ", "
          )}. Verifica encabezados en el XLSX.`
        );
        return;
      }
      
      const departmentsInData = new Set<string>();
      if (isInitialRun) {
        const sets = { depts: new Set<string>(), munis: new Set<string>(), ips: new Set<string>() };
        const relation: any[] = [];

        jsonData.forEach((row: any) => {
          const d = String(row[originalHeaders[deptKey]] || "").trim().toUpperCase();
          const m = String(row[originalHeaders[muniKey]] || "").trim().toUpperCase();
          const i = String(row[originalHeaders[ipsKey]] || "").trim().toUpperCase();
          if (d) {
            sets.depts.add(d);
            departmentsInData.add(d);
          }
          if (m) sets.munis.add(m);
          if (i) sets.ips.add(i);
          if (d && m && i) relation.push({ dept: d, muni: m, ips: i });
        });

        setDepartments(Array.from(sets.depts).sort());
        setMunicipalities(Array.from(sets.munis).sort());
        setIpsList(Array.from(sets.ips).sort());
        setFilterData(relation);
      }
      
      const filteredData = jsonData.filter((row: any) => {
        const d = String(row[originalHeaders[deptKey]] || "").trim().toUpperCase();
        const m = String(row[originalHeaders[muniKey]] || "").trim().toUpperCase();
        const i = String(row[originalHeaders[ipsKey]] || "").trim().toUpperCase();
        const deptMatch = !selectedDepartment || d === selectedDepartment;
        const muniMatch = !selectedMunicipality || m === selectedMunicipality;
        const ipsMatch = !selectedIps || i === selectedIps;
        return deptMatch && muniMatch && ipsMatch;
      });

      if (!filteredData.length) {
        setError("El filtro aplicado no tiene registros.");
        return;
      }

      const cleanedData = filteredData.map((row: any) => {
        const o: Record<string, any> = {};
        for (const k in row) o[cleanHeader(k)] = row[k];
        return o;
      });

      let captacionCount = 0;
      let controlCount = 0;
      let sinDatosVihCount = 0;
      let sinDatosSifilisCount = 0;
      let sinDatosToxoplasmaCount = 0;
      let sinDatosHbCount = 0;
      let sinDatosChagasCount = 0;
      let sinDatosEcografiaCount = 0;
      let sinDatosNutricionCount = 0;
      let sinDatosOdontologiaCount = 0;
      let inPeriodCount = 0;
      let outOfPeriodCount = 0;
      let controlesAdecuadosCount = 0;
      let totalEgMayores32Count = 0;

      const tempCaptacionDocs: string[] = [];
      const tempVihDocs: string[] = [];
      const tempSifilisDocs: string[] = [];
      const tempToxoDocs: string[] = [];
      const tempHbDocs: string[] = [];
      const tempChagasDocs: string[] = [];
      const tempEcoDocs: string[] = [];
      const tempNutriDocs: string[] = [];
      const tempOdontoDocs: string[] = [];
      const tempGinecoDocs: string[] = [];
      const tempCtrlAdqDocs: string[] = [];

      const totalRegistros = cleanedData.length;

      const fileMonthName =
        selectedFile.split("/").pop()?.split(".")[0]?.toUpperCase().trim() || "";
      const monthIdx = monthNameToNumber[fileMonthName];
      const yearFromPath = selectedFile.match(/\/(\d{4})\//)?.[1];
      const yearNumber = selectedYear ? parseInt(selectedYear, 10) : yearFromPath ? parseInt(yearFromPath, 10) : NaN;

      const { numerador: numeradorGine, documentos: ginecoDocsList } = calcularNumeradorGinecologia(filteredData, true);
      const denomGine = calcularDenominadorGinecologia(filteredData);
      setGinecologiaResult(numeradorGine);
      setDenominadorGinecologiaResult(denomGine);
      setPorcentajeGinecologiaResult(denomGine > 0 ? (numeradorGine / denomGine) * 100 : 0);
      setGinecologiaDocs(ginecoDocsList);

      cleanedData.forEach((row: any) => {
        const docId = String(row[controlIdKey] ?? "N/A");
        
        const controlVal = row[controlIdKey];
        if (controlVal !== undefined && controlVal !== "") controlCount++;

        const capVal = row[captacionKey];
        const capNum = typeof capVal === "number" ? capVal : parseFloat(String(capVal).replace(",", "."));
        if (!isNaN(capNum) && capNum < 10) {
            captacionCount++;
            tempCaptacionDocs.push(docId);
        }

        if (!isNaN(yearNumber) && monthIdx !== undefined && fechaControlKey) {
          const rawFecha = row[fechaControlKey];
          const d = convertirFechaExcel(rawFecha);
          if (d && !isNaN(d.getTime())) {
            if (d.getUTCFullYear() === yearNumber && d.getUTCMonth() === monthIdx) inPeriodCount++;
            else outOfPeriodCount++;
          }
        }
        
        if(totalControlesKey && edadGestacionalKey){
          const edadGestacionalVal = row[edadGestacionalKey];
          const edadGestacionalNum = typeof edadGestacionalVal === "number" ? edadGestacionalVal : parseInt(String(edadGestacionalVal), 10);
          
          if (!isNaN(edadGestacionalNum) && edadGestacionalNum >= 32) {
              totalEgMayores32Count++;
              
              const totalControlesVal = row[totalControlesKey];
              const totalControlesNum = typeof totalControlesVal === "number" ? totalControlesVal : parseInt(String(totalControlesVal), 10);

              if(!isNaN(totalControlesNum) && totalControlesNum >= 4){
                controlesAdecuadosCount++;
                tempCtrlAdqDocs.push(docId);
              }
          }
        }


        const vih1 = String(row[vih1Key] ?? "").toLowerCase();
        const vih2 = String(row[vih2Key] ?? "").toLowerCase();
        const vih3 = String(row[vih3Key] ?? "").toLowerCase();
        if (vih1.includes("sin datos") && vih2.includes("sin datos") && vih3.includes("sin datos")) {
            sinDatosVihCount++;
        } else {
            tempVihDocs.push(docId);
        }

        const s1 = String(row[sif1Key] ?? "").toLowerCase();
        const s2 = String(row[sif2Key] ?? "").toLowerCase();
        const s3 = String(row[sif3Key] ?? "").toLowerCase();
        if (s1.includes("sin datos") && s2.includes("sin datos") && s3.includes("sin datos")) {
            sinDatosSifilisCount++;
        } else {
            tempSifilisDocs.push(docId);
        }

        const toxo = String(row[toxoKey] ?? "").toLowerCase();
        if (toxo.includes("sin datos")) {
            sinDatosToxoplasmaCount++;
        } else {
            tempToxoDocs.push(docId);
        }

        const hbRes = String(row[hbResKey] ?? "").toLowerCase();
        const hbF = row[hbFechaKey];
        if (hbRes.includes("sin datos") && !(hbF === undefined || hbF === "")) {
            sinDatosHbCount++;
        } else {
            tempHbDocs.push(docId);
        }

        const ch = String(row[chagasKey] ?? "").toLowerCase();
        if (ch.includes("sin datos")) {
            sinDatosChagasCount++;
        } else {
            tempChagasDocs.push(docId);
        }

        const e1 = String(row[eco1Key] ?? "").toLowerCase();
        const e2 = String(row[eco2Key] ?? "").toLowerCase();
        const e3 = String(row[eco3Key] ?? "").toLowerCase();
        if (e1.includes("sin datos") && e2.includes("sin datos") && e3.includes("sin datos")) {
            sinDatosEcografiaCount++;
        } else {
            tempEcoDocs.push(docId);
        }

        const ntr = String(row[nutriKey] ?? "").toLowerCase();
        if (ntr.includes("sin datos")) {
            sinDatosNutricionCount++;
        } else {
            tempNutriDocs.push(docId);
        }

        const odo = String(row[odontoKey] ?? "").toLowerCase();
        if (odo.includes("sin datos")) {
            sinDatosOdontologiaCount++;
        } else {
            tempOdontoDocs.push(docId);
        }
      });
      
      setCaptacionOportunaDocs(tempCaptacionDocs);
      setVihCompletoDocs(tempVihDocs);
      setSifilisCompletoDocs(tempSifilisDocs);
      setToxoplasmaValidoDocs(tempToxoDocs);
      setHbCompletoDocs(tempHbDocs);
      setChagasValidoDocs(tempChagasDocs);
      setEcografiasValidasDocs(tempEcoDocs);
      setNutricionDocs(tempNutriDocs);
      setOdontologiaDocs(tempOdontoDocs);
      setControlesAdecuadosDocs(tempCtrlAdqDocs);

      setKpiResult(captacionCount);
      setGestantesControlResult(controlCount);
      setControlesEnMes(inPeriodCount);
      setControlesFueraMes(outOfPeriodCount);

      if (controlCount > 0) {
        setResultadoSinControlMes((outOfPeriodCount / controlCount) * 100);
      } else {
        setResultadoSinControlMes(0);
      }
      
      setControlesPrenatalesAdecuados(controlesAdecuadosCount);
      setTotalGestantesEgMayor32(totalEgMayores32Count);
      if(totalEgMayores32Count > 0) {
        setPorcentajeControlesAdecuados((controlesAdecuadosCount / totalEgMayores32Count) * 100);
      } else {
        setPorcentajeControlesAdecuados(0);
      }

      const examVih = totalRegistros - sinDatosVihCount;
      const examSif = totalRegistros - sinDatosSifilisCount;
      const toxoVal = totalRegistros - sinDatosToxoplasmaCount;
      const hbComp = totalRegistros - sinDatosHbCount;
      const chVal = totalRegistros - sinDatosChagasCount;
      const ecoVal = totalRegistros - sinDatosEcografiaCount;
      const nutVal = totalRegistros - sinDatosNutricionCount;
      const odoVal = totalRegistros - sinDatosOdontologiaCount;

      setExamenesVihCompletosResult(examVih);
      setExamenesSifilisCompletosResult(examSif);
      setToxoplasmaValidosResult(toxoVal);
      setExamenesHbCompletosResult(hbComp);
      setChagasResultadosValidosResult(chVal);
      setEcografiasValidasResult(ecoVal);
      setNutricionResult(nutVal);
      setOdontologiaResult(odoVal);

      if (controlCount > 0) {
        setControlPercentageResult((captacionCount / controlCount) * 100);
        setResultadoTamizajeVihResult((examVih / controlCount) * 100);
        setResultadoTamizajeSifilisResult((examSif / controlCount) * 100);
        setResultadoToxoplasmaResult((toxoVal / controlCount) * 100);
        setResultadoTamizajeHbResult((hbComp / controlCount) * 100);
        setResultadoChagasResult((chVal / controlCount) * 100);
        setResultadoEcografiasResult((ecoVal / controlCount) * 100);
        setResultadoNutricionResult((nutVal / controlCount) * 100);
        setResultadoOdontologiaResult((odoVal / controlCount) * 100);
      } else {
        setControlPercentageResult(0);
        setResultadoTamizajeVihResult(0);
        setResultadoTamizajeSifilisResult(0);
        setResultadoToxoplasmaResult(0);
        setResultadoTamizajeHbResult(0);
        setResultadoChagasResult(0);
        setResultadoEcografiasResult(0);
        setResultadoNutricionResult(0);
        setResultadoOdontologiaResult(0);
        setResultadoSinControlMes(0);
      }

      // Calcular datos para el mapa
      const kpiByDept: { [key: string]: { [key: string]: { total: number; count: number } } } = {};

      jsonData.forEach((row: any) => {
        const dept = String(row[originalHeaders[deptKey]] || "").trim().toUpperCase();
        if (!dept) return;

        if (!kpiByDept[dept]) kpiByDept[dept] = {};
        
        const kpiValues = {
          controlPercentageResult: !isNaN(parseFloat(row[originalHeaders[captacionKey]])) && parseFloat(row[originalHeaders[captacionKey]]) < 10 ? 1 : 0,
          resultadoTamizajeVihResult: !String(row[originalHeaders[vih1Key]] || '').toLowerCase().includes('sin datos') ? 1 : 0,
          resultadoTamizajeSifilisResult: !String(row[originalHeaders[sif1Key]] || '').toLowerCase().includes('sin datos') ? 1 : 0,
          resultadoToxoplasmaResult: !String(row[originalHeaders[toxoKey]] || '').toLowerCase().includes('sin datos') ? 1 : 0,
          resultadoTamizajeHbResult: !String(row[originalHeaders[hbResKey]] || '').toLowerCase().includes('sin datos') ? 1 : 0,
          resultadoChagasResult: !String(row[originalHeaders[chagasKey]] || '').toLowerCase().includes('sin datos') ? 1 : 0,
          resultadoEcografiasResult: !String(row[originalHeaders[eco1Key]] || '').toLowerCase().includes('sin datos') ? 1 : 0,
          resultadoNutricionResult: !String(row[originalHeaders[nutriKey]] || '').toLowerCase().includes('sin datos') ? 1 : 0,
          resultadoOdontologiaResult: !String(row[originalHeaders[odontoKey]] || '').toLowerCase().includes('sin datos') ? 1 : 0,
          porcentajeGinecologiaResult: (String(row[originalHeaders[pickHeaderSafe(firstRow, ["clasificacion", "riesgo"])]] || '').toLowerCase() === "alto_riesgo_obstetrico" && !String(row[originalHeaders[pickHeaderSafe(firstRow, ["atencion", "especializada", "ginecolog"])]] || '').toLowerCase().includes("sin datos")) ? 1 : 0,
          porcentajeControlesAdecuados: (parseInt(String(row[originalHeaders[edadGestacionalKey]] || '0')) >= 32 && parseInt(String(row[originalHeaders[totalControlesKey]] || '0')) >= 4) ? 1 : 0,
        };

        Object.entries(kpiValues).forEach(([kpiKey, kpiValue]) => {
            if (!kpiByDept[dept][kpiKey]) kpiByDept[dept][kpiKey] = { total: 0, count: 0 };
            kpiByDept[dept][kpiKey].total += kpiValue;
            kpiByDept[dept][kpiKey].count++;
        });
      });
      
      const newMapData: MapData[] = Object.entries(kpiByDept).map(([dept, kpis]) => {
          const values: { [key: string]: number } = {};
          Object.entries(kpis).forEach(([kpiKey, data]) => {
              values[kpiKey] = data.count > 0 ? (data.total / data.count) * 100 : 0;
          });
          return {
              department: dept,
              ...values,
          };
      });

      setMapData(newMapData);


      setHasCalculated(true);
    } catch (e: any) {
      console.error(e);
      setAllData([]);
      setError(
        e?.message ||
          "Ocurrió un error al leer o procesar el archivo. Revisa el formato y encabezados."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* -----------------------------------------------------------
     Gráficos anuales
  ----------------------------------------------------------- */
  const handleGenerateChart = async () => {
    if (!selectedYear || !availableFiles[selectedYear]?.length) {
      setChartData([]);
      return;
    }
    setIsChartLoading(true);

    const results = await Promise.all(
      availableFiles[selectedYear].map(async (mf) => {
        try {
          const resp = await fetch(mf.path);
          if (!resp.ok) return null;
          const buf = await resp.arrayBuffer();
          const wb = XLSX.read(buf, { type: "array", raw: true, cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
          if (!json.length) {
            return {
              name: mf.name,
              "Captación Oportuna": 0,
              "Tamizaje VIH": 0,
              "Tamizaje Sífilis": 0,
              "Tamizaje Toxoplasma": 0,
              "Tamizaje Hepatitis B": 0,
              "Tamizaje Chagas": 0,
              "Ecografías": 0,
              "Nutrición": 0,
              "Odontología": 0,
            } as ChartDataItem;
          }

          const first: any = {};
          for (const k in json[0]) first[cleanHeader(k)] = json[0][k];

          const controlKey = pickHeaderSafe(first, ["identificacion"]);
          const captKey = pickHeaderSafe(first, ["edad", "gest", "inicio", "control"]);
          const vih1Key = pickHeaderSafe(first, ["vih", "primer", "tamiz"]);
          const vih2Key = pickHeaderSafe(first, ["vih", "segundo", "tamiz"]);
          const vih3Key = pickHeaderSafe(first, ["vih", "tercer", "tamiz"]);
          const sif1Key = pickHeaderSafe(first, ["sifilis", "primera"]);
          const sif2Key = pickHeaderSafe(first, ["sifilis", "segunda"]);
          const sif3Key = pickHeaderSafe(first, ["sifilis", "tercera"]);
          const toxoKey = pickHeaderSafe(first, ["toxoplasma"]);
          const hbResKey = pickHeaderSafe(first, ["hepatitis", "b", "resultado"]);
          const hbFechaKey = pickHeaderSafe(first, ["hepatitis", "b", "fecha"]);
          const chKey = pickHeaderSafe(first, ["chagas"]);
          const eco1Key = pickHeaderSafe(first, ["ecografia", "translucencia"]);
          const eco2Key = pickHeaderSafe(first, ["ecografia", "anomalias"]);
          const eco3Key = pickHeaderSafe(first, ["ecografia", "otras"]);
          const nutKey = pickHeaderSafe(first, ["nutricion"]);
          const odoKey = pickHeaderSafe(first, ["odontolog"]);

          let control = 0,
            cap = 0,
            sVih = 0,
            sSif = 0,
            sTox = 0,
            sHb = 0,
            sCh = 0,
            sEco = 0,
            sNut = 0,
            sOdo = 0;

          json.forEach((r: any) => {
            const cr: any = {};
            for (const k in r) cr[cleanHeader(k)] = r[k];

            if (cr[controlKey]) control++;
            const cv = cr[captKey];
            const ncv = typeof cv === "number" ? cv : parseFloat(String(cv).replace(",", "."));
            if (!isNaN(ncv) && ncv < 10) cap++;

            if (
              String(cr[vih1Key] ?? "").toLowerCase().includes("sin datos") &&
              String(cr[vih2Key] ?? "").toLowerCase().includes("sin datos") &&
              String(cr[vih3Key] ?? "").toLowerCase().includes("sin datos")
            )
              sVih++;
            if (
              String(cr[sif1Key] ?? "").toLowerCase().includes("sin datos") &&
              String(cr[sif2Key] ?? "").toLowerCase().includes("sin datos") &&
              String(cr[sif3Key] ?? "").toLowerCase().includes("sin datos")
            )
              sSif++;
            if (String(cr[toxoKey] ?? "").toLowerCase().includes("sin datos")) sTox++;
            if (
              String(cr[hbResKey] ?? "").toLowerCase().includes("sin datos") &&
              cr[hbFechaKey]
            )
              sHb++;
            if (String(cr[chKey] ?? "").toLowerCase().includes("sin datos")) sCh++;
            if (
              String(cr[eco1Key] ?? "").toLowerCase().includes("sin datos") &&
              String(cr[eco2Key] ?? "").toLowerCase().includes("sin datos") &&
              String(cr[eco3Key] ?? "").toLowerCase().includes("sin datos")
            )
              sEco++;
            if (String(cr[nutKey] ?? "").toLowerCase().includes("sin datos")) sNut++;
            if (String(cr[odoKey] ?? "").toLowerCase().includes("sin datos")) sOdo++;
          });

          const total = json.length;
          const vih = total - sVih;
          const sif = total - sSif;
          const tox = total - sTox;
          const hb = total - sHb;
          const ch = total - sCh;
          const eco = total - sEco;
          const nut = total - sNut;
          const odo = total - sOdo;

          const item: ChartDataItem = {
            name: mf.name,
            "Captación Oportuna": control > 0 ? (cap / control) * 100 : 0,
            "Tamizaje VIH": control > 0 ? (vih / control) * 100 : 0,
            "Tamizaje Sífilis": control > 0 ? (sif / control) * 100 : 0,
            "Tamizaje Toxoplasma": control > 0 ? (tox / control) * 100 : 0,
            "Tamizaje Hepatitis B": control > 0 ? (hb / control) * 100 : 0,
            "Tamizaje Chagas": control > 0 ? (ch / control) * 100 : 0,
            Ecografías: control > 0 ? (eco / control) * 100 : 0,
            Nutrición: control > 0 ? (nut / control) * 100 : 0,
            Odontología: control > 0 ? (odo / control) * 100 : 0,
          };
          return item;
        } catch (e) {
          console.error("Error procesando", mf.name, e);
          return null;
        }
      })
    );

    setChartData(results.filter(Boolean) as ChartDataItem[]);
    setIsChartLoading(false);
  };
  

  const prepararDatosParaInforme = (
    kpiData: Partial<KpiResults>,
    entidad: string,
    analisisAnual?: string,
    inasistentes?: any[]
  ): InformeDatos => ({
    encabezado: {
      proceso: "Seguimiento a la Gestión del Riesgo en Salud",
      formato: "Informe de Evaluación de Indicadores",
      entidad: entidad,
      vigencia: selectedFile.split("/").pop()?.split(".")[0] || "N/A",
      lugarFecha: `VALLEDUPAR, ${new Date().toLocaleDateString("es-CO")}`,
    },
    referencia:
      "Análisis de indicadores de gestantes basado en el archivo cargado.",
    analisisResumido: [
      `Total de gestantes en control: ${kpiData.gestantesControlResult}`,
      `Gestantes con captación oportuna: ${kpiData.kpiResult} (${kpiData.controlPercentageResult?.toFixed(
        2
      )}%)`,
    ],
    datosAExtraer: [
      { label: "Gestantes en Control", valor: String(kpiData.gestantesControlResult) },
      { label: "Captación Oportuna (< 10 sem)", valor: String(kpiData.kpiResult) },
      { label: "% Captación Oportuna", valor: `${kpiData.controlPercentageResult?.toFixed(2)}%` },
      { label: "Exámenes VIH Completos", valor: String(kpiData.examenesVihCompletosResult) },
      { label: "% Tamizaje VIH", valor: `${kpiData.resultadoTamizajeVihResult?.toFixed(2)}%` },
      { label: "Exámenes Sífilis Completos", valor: String(kpiData.examenesSifilisCompletosResult) },
      { label: "% Tamizaje Sífilis", valor: `${kpiData.resultadoTamizajeSifilisResult?.toFixed(2)}%` },
    ],
    analisisAnual,
    hallazgosCalidad: [
      "Asegurar la orden y realización oportuna de ecografías: Se debe garantizar la toma de ecografías clave según la edad gestacional (semana 11-14 para tamizaje de aneuploidías, semana 18-24 para detalle anatómico, y de tercer trimestre según criterio médico), registrando fecha de orden, toma e interpretación.",
      "Normalizar el registro de pruebas serológicas: Unificar el registro de todas las pruebas infecciosas (VIH, Sífilis, Hepatitis B, Toxoplasma, Chagas) en campos estructurados, asegurando que cada prueba tenga su fecha y resultado correspondiente.",
      "Promover y documentar la realización de citología: Verificar y registrar la toma de citología cervicouterina reciente según la normativa vigente. Si no se cuenta con un resultado actualizado, se debe ordenar y realizar seguimiento a su toma.",
      "Registrar de manera oportuna la aplicación de vacunas: Documentar la aplicación de las vacunas de Tdap (tétanos, difteria y tos ferina acelular) e Influenza en los trimestres correspondientes, incluyendo la fecha de aplicación.",
      "Garantizar y registrar la entrega de suplementos: Dejar constancia de la formulación y entrega de micronutrientes esenciales como ácido fólico, sulfato ferroso y calcio, de acuerdo con la edad gestacional.",
      "Actualizar los desenlaces obstétricos: Registrar sistemáticamente el desenlace del embarazo (parto, aborto, etc.), incluyendo la fecha, edad gestacional al momento del evento, y datos del recién nacido si aplica.",
      "Fortalecer la captación temprana de gestantes: Implementar y reforzar estrategias de búsqueda activa comunitaria para identificar e ingresar a las gestantes al programa de control prenatal antes de la semana 10, que es el periodo ideal.",
    ],
    recomendaciones: [
        "Diseñar y aplicar los procesos de evaluación de calidad de la atención en salud.",
        "Implementar las acciones de mejora que permitan fortalecer la demanda inducida institucional.",
        "Implementar la tamización con pruebas rápidas treponémicas en los puntos de atención que no disponen de laboratorio.",
        "Garantizar la atención especializada por ginecología para las gestantes clasificadas con alto riesgo, según la Resolución 3280 de 2018.",
      ],
    observaciones: [
      "Se solicitan las historias clínicas de las gestantes que, según la base de datos, no cumplen con los criterios de calidad para la atención.",
      "Aplicar los correctivos necesarios para el mejoramiento continuo de la calidad de la atención y el registro.",
    ],
    inasistentes,
    firma: user ? {
        nombre: user.fullName || user.username,
        cargo: user.cargo || '',
        imagen: user.signature,
    } : undefined,
  });

  const handleGeneratePdf = async () => {
    if (kpiResult === null) return;
    setIsLoading(true);

    const currentKpis: KpiResults = {
      kpiResult,
      gestantesControlResult,
      controlPercentageResult,
      examenesVihCompletosResult,
      resultadoTamizajeVihResult,
      examenesSifilisCompletosResult,
      resultadoTamizajeSifilisResult,
      toxoplasmaValidosResult,
      resultadoToxoplasmaResult,
      examenesHbCompletosResult,
      resultadoTamizajeHbResult,
      chagasResultadosValidosResult,
      resultadoChagasResult,
      ecografiasValidasResult,
      resultadoEcografiasResult,
      nutricionResult,
      resultadoNutricionResult,
      odontologiaResult,
      resultadoOdontologiaResult,
      ginecologiaResult,
      denominadorGinecologiaResult,
      porcentajeGinecologiaResult,
    };

    try {
      const bg = await getBackgroundImage();
      const images: DocImages = bg ? { background: bg } : {};
      const datos = prepararDatosParaInforme(currentKpis, selectedIps || "Consolidado General");
      await generarInformePDF(datos, images);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateAnnualPdf = async () => {
    if (!chartContainerRef.current) return;
    setIsLoading(true);
    try {
        const canvas = await html2canvas(chartContainerRef.current, {
            scale: 2,
        });
        const chartImgData = canvas.toDataURL('image/png');

        const bg = await getBackgroundImage();
        const images: DocImages = {
            ...(bg && { background: bg }),
            charts: [{ id: 'annual', dataUrl: chartImgData }]
        };
        
        const datos = prepararDatosParaInforme({}, selectedIps || "Consolidado General", "Análisis placeholder para el informe anual.");
        await generarInformePDF(datos, images, `Informe_Anual_${selectedYear}.pdf`);

    } catch (e) {
        console.error("Error al generar el PDF anual:", e);
        setError("No se pudo generar el PDF con el análisis anual.");
    } finally {
        setIsLoading(false);
    }
  };


  const calculateKpiForFilter = async (
    department: string,
    municipality: string,
    ips: string
  ): Promise<{kpis: KpiResults, inasistentes: any[]}> =>
    new Promise(async (resolve) => {
      const emptyResult = {kpis: {} as KpiResults, inasistentes: []};
      if (!allData.length || !selectedFile) return resolve(emptyResult);
      
      const fileMonthName = selectedFile.split("/").pop()?.split(".")[0]?.toUpperCase().trim() || "";
      const monthIdx = monthNameToNumber[fileMonthName];
      const yearFromPath = selectedFile.match(/\/(\d{4})\//)?.[1];
      const yearNumber = selectedYear ? parseInt(selectedYear, 10) : yearFromPath ? parseInt(yearFromPath, 10) : NaN;


      if(isNaN(yearNumber) || monthIdx === undefined) return resolve(emptyResult);

      const orig: Record<string, string> = {};
      const first: any = {};
      for (const k in allData[0]) {
        const ck = cleanHeader(k);
        orig[ck] = k;
        first[ck] = allData[0][k];
      }

      const deptKey = pickHeaderSafe(first, ["departamento"]);
      const muniKey = pickHeaderSafe(first, ["municipio"]);
      const ipsKey = pickHeaderSafe(first, ["ips"]);

      const rows = allData.filter((row) => {
        const d = String(row[orig[deptKey]] || "").trim().toUpperCase();
        const m = String(row[orig[muniKey]] || "").trim().toUpperCase();
        const i = String(row[orig[ipsKey]] || "").trim().toUpperCase();
        const dm = !department || d === department;
        const mm = !municipality || m === municipality;
        const im = !ips || i === ips;
        return dm && mm && im;
      });

      if (!rows.length) return resolve(emptyResult);

      const cleaned = rows.map((r) => {
        const o: any = {};
        for (const k in r) o[cleanHeader(k)] = r[k];
        return o;
      });

      const controlKey = pickHeaderSafe(cleaned[0], ["identificacion"]);
      const captKey = pickHeaderSafe(cleaned[0], ["edad", "gest", "inicio", "control"]);
      const vih1Key = pickHeaderSafe(cleaned[0], ["vih", "primer", "tamiz"]);
      const vih2Key = pickHeaderSafe(cleaned[0], ["vih", "segundo", "tamiz"]);
      const vih3Key = pickHeaderSafe(cleaned[0], ["vih", "tercer", "tamiz"]);
      const sif1Key = pickHeaderSafe(cleaned[0], ["sifilis", "primera"]);
      const sif2Key = pickHeaderSafe(cleaned[0], ["sifilis", "segunda"]);
      const sif3Key = pickHeaderSafe(cleaned[0], ["sifilis", "tercera"]);
      const toxoKey = pickHeaderSafe(cleaned[0], ["toxoplasma"]);
      const hbResKey = pickHeaderSafe(cleaned[0], ["hepatitis", "b", "resultado"]);
      const hbFechaKey = pickHeaderSafe(cleaned[0], ["hepatitis", "b", "fecha"]);
      const chKey = pickHeaderSafe(cleaned[0], ["chagas"]);
      const eco1Key = pickHeaderSafe(cleaned[0], ["ecografia", "translucencia"]);
      const eco2Key = pickHeaderSafe(cleaned[0], ["ecografia", "anomalias"]);
      const eco3Key = pickHeaderSafe(cleaned[0], ["ecografia", "otras"]);
      const nutKey = pickHeaderSafe(cleaned[0], ["nutricion"]);
      const odoKey = pickHeaderSafe(cleaned[0], ["odontolog"]);
      const fechaControlKey = pickHeaderSafe(cleaned[0], ["ultimo", "control", "prenatal"]);

      const inasistenteTipoIdKey = pickHeaderSafe(first, ["tipo", "documento", "identidad"]);
      const inasistenteIdKey = pickHeaderSafe(first, ["no", "identificacion"]);
      const inasistenteTelKey = pickHeaderSafe(first, ["telefono", "usuaria"]);
      const inasistenteDirKey = pickHeaderSafe(first, ["direccion"]);
      const inasistenteAsentamientoKey = pickHeaderSafe(first, ["asentamiento", "rancheria", "comunidad"]);

      let cap = 0,
        control = 0,
        sVih = 0,
        sSif = 0,
        sTox = 0,
        sHb = 0,
        sCh = 0,
        sEco = 0,
        sNut = 0,
        sOdo = 0;
      
      const inasistentes: any[] = [];

      cleaned.forEach((row, index) => {
        if (row[controlKey] !== undefined && row[controlKey] !== "") control++;
        const v = row[captKey];
        const nv = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
        if (!isNaN(nv) && nv < 10) cap++;

        const rawFecha = row[fechaControlKey];
        const d = convertirFechaExcel(rawFecha);
        if (d && !isNaN(d.getTime())) {
          if (yearNumber && (d.getUTCFullYear() !== yearNumber || d.getUTCMonth() !== monthIdx)) {
            inasistentes.push({
                tipo_id: rows[index][orig[inasistenteTipoIdKey]] || "",
                id: rows[index][orig[inasistenteIdKey]] || "",
                tel: rows[index][orig[inasistenteTelKey]] || "",
                dir: rows[index][orig[inasistenteDirKey]] || "",
                asentamiento: rows[index][orig[inasistenteAsentamientoKey]] || "",
            });
          }
        }

        if (
          String(row[vih1Key] ?? "").toLowerCase().includes("sin datos") &&
          String(row[vih2Key] ?? "").toLowerCase().includes("sin datos") &&
          String(row[vih3Key] ?? "").toLowerCase().includes("sin datos")
        )
          sVih++;
        if (
          String(row[sif1Key] ?? "").toLowerCase().includes("sin datos") &&
          String(row[sif2Key] ?? "").toLowerCase().includes("sin datos") &&
          String(row[sif3Key] ?? "").toLowerCase().includes("sin datos")
        )
          sSif++;
        if (String(row[toxoKey] ?? "").toLowerCase().includes("sin datos")) sTox++;
        if (
          String(row[hbResKey] ?? "").toLowerCase().includes("sin datos") &&
          row[hbFechaKey]
        )
          sHb++;
        if (String(row[chKey] ?? "").toLowerCase().includes("sin datos")) sCh++;
        if (
          String(row[eco1Key] ?? "").toLowerCase().includes("sin datos") &&
          String(row[eco2Key] ?? "").toLowerCase().includes("sin datos") &&
          String(row[eco3Key] ?? "").toLowerCase().includes("sin datos")
        )
          sEco++;
        if (String(row[nutKey] ?? "").toLowerCase().includes("sin datos")) sNut++;
        if (String(row[odoKey] ?? "").toLowerCase().includes("sin datos")) sOdo++;
      });

      const total = cleaned.length;
      const vih = total - sVih;
      const sif = total - sSif;
      const tox = total - sTox;
      const hb = total - sHb;
      const ch = total - sCh;
      const eco = total - sEco;
      const nut = total - sNut;
      const odo = total - sOdo;

      const {numerador} = calcularNumeradorGinecologia(rows);
      const denominador = calcularDenominadorGinecologia(rows);

      resolve({
        kpis: {
          kpiResult: cap,
          gestantesControlResult: control,
          controlPercentageResult: control > 0 ? (cap / control) * 100 : 0,
          examenesVihCompletosResult: vih,
          resultadoTamizajeVihResult: control > 0 ? (vih / control) * 100 : 0,
          examenesSifilisCompletosResult: sif,
          resultadoTamizajeSifilisResult: control > 0 ? (sif / control) * 100 : 0,
          toxoplasmaValidosResult: tox,
          resultadoToxoplasmaResult: control > 0 ? (tox / control) * 100 : 0,
          examenesHbCompletosResult: hb,
          resultadoTamizajeHbResult: control > 0 ? (hb / control) * 100 : 0,
          chagasResultadosValidosResult: ch,
          resultadoChagasResult: control > 0 ? (ch / control) * 100 : 0,
          ecografiasValidasResult: eco,
          resultadoEcografiasResult: control > 0 ? (eco / control) * 100 : 0,
          nutricionResult: nut,
          resultadoNutricionResult: control > 0 ? (nut / control) * 100 : 0,
          odontologiaResult: odo,
          resultadoOdontologiaResult: control > 0 ? (odo / control) * 100 : 0,
          ginecologiaResult: numerador,
          denominadorGinecologiaResult: denominador,
          porcentajeGinecologiaResult:
            denominador > 0 ? (numerador / denominador) * 100 : 0,
        },
        inasistentes
      });
    });

  const handleGeneratePdfsEnMasa = async () => {
    if (!allData.length || !filterData.length) {
      setError("Primero calcula los indicadores para cargar los datos.");
      return;
    }
    setIsLoading(true);
    const zip = new JSZip();

    const bg = await getBackgroundImage();
    const images = bg ? { background: bg } : {};
    
    // Filtra las entradas únicas basadas en los filtros de departamento y municipio seleccionados.
    const filteredEntries = filterData.filter(entry => {
        const deptMatch = !selectedDepartment || entry.dept === selectedDepartment;
        const muniMatch = !selectedMunicipality || entry.muni === selectedMunicipality;
        return deptMatch && muniMatch;
    });

    const uniqueEntries = Array.from(
      new Map(
        filteredEntries.map((i) => [`${i.dept}-${i.muni}-${i.ips}`, i])
      ).values()
    );

    for (const entry of uniqueEntries) {
        const { dept, muni, ips } = entry;
        if (!ips) continue;

        const { kpis, inasistentes } = await calculateKpiForFilter(dept, muni, ips);
        if (Object.keys(kpis).length === 0) continue;

        const entidad = `${ips} (MUNICIPIO: ${muni})`;
        const datos = prepararDatosParaInforme(kpis, entidad, undefined, inasistentes);
        const blob = await generarInformePDF(datos, images, "", true);
        if (blob) zip.file(`Informe_Riesgo_${muni.replace(/\s/g, "_")}_${ips.replace(/\s/g, "_")}.pdf`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Informes_por_IPS_${new Date().toISOString().slice(0, 10)}.zip`);
    setIsLoading(false);
  };

  const handleDownloadConsolidatedXls = async () => {
    if (!allData.length || !filterData.length) {
      setError("Primero calcula los indicadores de un mes para generar el consolidado.");
      return;
    }
    setIsLoading(true);
  
    const consolidated: any[] = [];
    const uniqueEntries = Array.from(
      new Map(
        filterData.map((i) => [`${i.dept}-${i.muni}-${i.ips}`, i])
      ).values()
    );
  
    for (const entry of uniqueEntries) {
      const { dept, muni, ips } = entry;
      if (!ips) continue;
      const { kpis } = await calculateKpiForFilter(dept, muni, ips);
      if (Object.keys(kpis).length === 0) continue;

      consolidated.push({
        DEPARTAMENTO: dept,
        MUNICIPIO: muni,
        IPS: ips,
        "Gestantes en Control": kpis.gestantesControlResult,
        "Captación Oportuna (< 10 sem)": kpis.kpiResult,
        "% Captación Oportuna": kpis.controlPercentageResult,
        "Exámenes VIH Completos": kpis.examenesVihCompletosResult,
        "% Tamizaje VIH": kpis.resultadoTamizajeVihResult,
        "Exámenes Sífilis Completos": kpis.examenesSifilisCompletosResult,
        "% Tamizaje Sífilis": kpis.resultadoTamizajeSifilisResult,
        "Toxoplasma Válidos": kpis.toxoplasmaValidosResult,
        "% Tamizaje Toxoplasma": kpis.resultadoToxoplasmaResult,
        "Exámenes Hepatitis B Completos": kpis.examenesHbCompletosResult,
        "% Tamizaje Hepatitis B": kpis.resultadoTamizajeHbResult,
        "Chagas Válidos": kpis.chagasResultadosValidosResult,
        "% Tamizaje Chagas": kpis.resultadoChagasResult,
        "Ecografías Válidas": kpis.ecografiasValidasResult,
        "% Ecografías": kpis.resultadoEcografiasResult,
        "Consultas Nutrición": kpis.nutricionResult,
        "% Nutrición": kpis.resultadoNutricionResult,
        "Consultas Odontología": kpis.odontologiaResult,
        "% Odontología": kpis.resultadoOdontologiaResult,
        "Gestantes Alto Riesgo con Ginecología": kpis.ginecologiaResult,
        "Total Gestantes Alto Riesgo": kpis.denominadorGinecologiaResult,
        "% Cobertura Ginecología (Alto Riesgo)": kpis.porcentajeGinecologiaResult,
      });
    }
  
    const ws = XLSX.utils.json_to_sheet(consolidated);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consolidado Indicadores");
  
    const pctCols = ["F", "H", "J", "L", "N", "P", "R", "T", "W"];
    for (let i = 2; i <= consolidated.length + 1; i++) {
      pctCols.forEach((col) => {
        const ref = `${col}${i}`;
        if (ws[ref] && ws[ref].v !== null && typeof ws[ref].v === 'number') {
          ws[ref].z = "0.00%";
          ws[ref].v = ws[ref].v / 100;
        }
      });
    }
  
    const xls = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([xls], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
  
    const monthName = selectedFile.split("/").pop()?.split(".")[0] || "Mes";
    saveAs(blob, `Consolidado_Indicadores_${monthName}_${selectedYear || "N/A"}.xlsx`);
    setIsLoading(false);
  };
  
  const handleDownloadBreakdownCsv = () => {
    if (!hasCalculated) {
      setError("Primero debes calcular los indicadores.");
      return;
    }

    const breakdownData = [
      ...captacionOportunaDocs.map(doc => ({ Indicador: "Captación Oportuna", Documento: doc })),
      ...controlesAdecuadosDocs.map(doc => ({ Indicador: "Controles Prenatales Adecuados", Documento: doc })),
      ...vihCompletoDocs.map(doc => ({ Indicador: "Exámenes VIH Completos", Documento: doc })),
      ...sifilisCompletoDocs.map(doc => ({ Indicador: "Exámenes Sífilis Completos", Documento: doc })),
      ...toxoplasmaValidoDocs.map(doc => ({ Indicador: "Toxoplasma Válidos", Documento: doc })),
      ...hbCompletoDocs.map(doc => ({ Indicador: "Exámenes HB Completos", Documento: doc })),
      ...chagasValidoDocs.map(doc => ({ Indicador: "Chagas Válidos", Documento: doc })),
      ...ecografiasValidasDocs.map(doc => ({ Indicador: "Ecografías Válidas", Documento: doc })),
      ...nutricionDocs.map(doc => ({ Indicador: "Consultas Nutrición", Documento: doc })),
      ...odontologiaDocs.map(doc => ({ Indicador: "Consultas Odontología", Documento: doc })),
      ...ginecologiaDocs.map(doc => ({ Indicador: "Ginecología Alto Riesgo", Documento: doc })),
    ];

    if (breakdownData.length === 0) {
      setError("No hay datos de desglose para descargar.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(breakdownData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Desglose Numeradores");

    const csvOutput = XLSX.write(wb, { bookType: "csv", type: "string" });
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    
    const monthName = selectedFile.split("/").pop()?.split(".")[0] || "Mes";
    saveAs(blob, `Desglose_Numeradores_${monthName}_${selectedYear || "N/A"}.csv`);
  };

  /* -----------------------------------------------------------
     UI
  ----------------------------------------------------------- */

  const chartGroups = [
    { title: "Resumen Mensual de Captación", dataKey: "Captación Oportuna", color: "hsl(var(--chart-1))" },
    { title: "Resumen Mensual de Tamizaje VIH", dataKey: "Tamizaje VIH", color: "hsl(var(--chart-2))" },
    { title: "Resumen Mensual de Tamizaje Sífilis", dataKey: "Tamizaje Sífilis", color: "hsl(var(--chart-3))" },
    { title: "Resumen Mensual de Tamizaje Toxoplasma", dataKey: "Tamizaje Toxoplasma", color: "hsl(var(--chart-4))" },
    { title: "Resumen Mensual de Tamizaje Hepatitis B", dataKey: "Tamizaje Hepatitis B", color: "hsl(var(--chart-5))" },
    { title: "Resumen Mensual de Tamizaje Chagas", dataKey: "Tamizaje Chagas", color: "hsl(var(--chart-1))" },
    { title: "Resumen Mensual de Ecografías", dataKey: "Ecografías", color: "hsl(var(--chart-2))" },
    { title: "Resumen Mensual de Nutrición", dataKey: "Nutrición", color: "hsl(var(--chart-3))" },
    { title: "Resumen Mensual de Odontología", dataKey: "Odontología", color: "hsl(var(--chart-4))" },
  ];

  const kpiGroups = [
    {
      title: "Indicadores de Captación",
      kpis: [
        {
          id: 'captacionOportuna',
          title: "Captación Oportuna",
          value: kpiResult,
          docs: captacionOportunaDocs,
          description: "Gestantes con control antes de la semana 10.",
        },
        {
          title: "Gestantes en Control",
          value: gestantesControlResult,
          description: "Total de gestantes registradas en el periodo.",
        },
        {
          title: "Control de Gestantes",
          value: controlPercentageResult,
          isPercentage: true,
          description: "Porcentaje de captación sobre el total de gestantes.",
        },
      ],
    },
    {
      title: "Controles de Gestantes Insistentes",
      kpis: [
        {
          title: "Controles en el Mes",
          value: controlesEnMes,
          description: "Total de controles realizados en el mes seleccionado.",
        },
        {
          title: "Gestantes en Control",
          value: gestantesControlResult,
          description: "Total de gestantes registradas en el periodo.",
        },
        {
          title: "Resultado Gestantes sin Control del Mes",
          value: resultadoSinControlMes,
          isPercentage: true,
          description: "Porcentaje de gestantes sin control en el mes.",
        },
      ],
    },
    {
      title: "Indicadores de Controles Prenatales Adecuados",
      kpis: [
        {
          id: 'controlesAdecuados',
          title: "Controles Prenatales Adecuados (>= 4 y EG >= 32)",
          value: controlesPrenatalesAdecuados,
          docs: controlesAdecuadosDocs,
          description: "Gestantes con 4+ controles y 32+ semanas de gestación.",
        },
        {
          title: "Total Gestantes con EG >= 32 semanas",
          value: totalGestantesEgMayor32,
          description: "Total de gestantes con una edad gestacional de 32 semanas o más.",
        },
        {
          title: "% Controles Prenatales Adecuados",
          value: porcentajeControlesAdecuados,
          isPercentage: true,
          description: "Porcentaje de gestantes con controles adecuados.",
        },
      ],
    },
    {
      title: "Indicadores de Tamizaje VIH",
      kpis: [
        {
          id: 'vihCompleto',
          title: "Exámenes VIH Completos",
          value: examenesVihCompletosResult,
          docs: vihCompletoDocs,
          description: "Total de gestantes con tamizaje de VIH completo.",
        },
        {
          title: "Gestantes en Control",
          value: gestantesControlResult,
          description: "Total de gestantes registradas en el periodo.",
        },
        {
          title: "Resultado Tamizaje VIH",
          value: resultadoTamizajeVihResult,
          isPercentage: true,
          description: "Porcentaje de cobertura del tamizaje de VIH.",
        },
      ],
    },
    {
      title: "Indicadores de Tamizaje Sífilis",
      kpis: [
        {
          id: 'sifilisCompleto',
          title: "Exámenes Sífilis Completos",
          value: examenesSifilisCompletosResult,
          docs: sifilisCompletoDocs,
          description: "Total de gestantes con tamizaje de Sífilis completo.",
        },
        {
          title: "Gestantes en Control",
          value: gestantesControlResult,
          description: "Total de gestantes registradas en el periodo.",
        },
        {
          title: "Resultado Tamizaje Sífilis",
          value: resultadoTamizajeSifilisResult,
          isPercentage: true,
          description: "Porcentaje de cobertura del tamizaje de Sífilis.",
        },
      ],
    },
    {
      title: "Indicadores de Tamizaje Toxoplasma",
      kpis: [
        {
          id: 'toxoValido',
          title: "Toxoplasma Válidos",
          value: toxoplasmaValidosResult,
          docs: toxoplasmaValidoDocs,
          description: "Total de gestantes con tamizaje de Toxoplasma válido.",
        },
        {
          title: "Gestantes en Control",
          value: gestantesControlResult,
          description: "Total de gestantes registradas en el periodo.",
        },
        {
          title: "Resultado de Toxoplasma",
          value: resultadoToxoplasmaResult,
          isPercentage: true,
          description: "Porcentaje de cobertura del tamizaje de Toxoplasma.",
        },
      ],
    },
    {
      title: "Indicadores de Tamizaje Hepatitis B",
      kpis: [
        {
          id: 'hbCompleto',
          title: "Exámenes HB Completos",
          value: examenesHbCompletosResult,
          docs: hbCompletoDocs,
          description: "Total de gestantes con tamizaje de Hepatitis B completo.",
        },
        {
          title: "Gestantes en Control",
          value: gestantesControlResult,
          description: "Total de gestantes registradas en el periodo.",
        },
        {
          title: "Resultado Tamizaje HB",
          value: resultadoTamizajeHbResult,
          isPercentage: true,
          description: "Porcentaje de cobertura del tamizaje de Hepatitis B.",
        },
      ],
    },
    {
      title: "Indicadores de Tamizaje Chagas",
      kpis: [
        {
          id: 'chagasValido',
          title: "Chagas Resultados Válidos",
          value: chagasResultadosValidosResult,
          docs: chagasValidoDocs,
          description: "Total de gestantes con tamizaje de Chagas válido.",
        },
        {
          title: "Gestantes en Control",
          value: gestantesControlResult,
          description: "Total de gestantes registradas en el periodo.",
        },
        {
          title: "Resultado Chagas",
          value: resultadoChagasResult,
          isPercentage: true,
          description: "Porcentaje de cobertura del tamizaje de Chagas.",
        },
      ],
    },
    {
      title: "Indicadores de Ecografías",
      kpis: [
        {
          id: 'ecosValidas',
          title: "Ecografías Válidas",
          value: ecografiasValidasResult,
          docs: ecografiasValidasDocs,
          description: "Total de gestantes con ecografías obstétricas válidas.",
        },
        {
          title: "Gestantes en Control",
          value: gestantesControlResult,
          description: "Total de gestantes registradas en el periodo.",
        },
        {
          title: "Resultado Ecografías",
          value: resultadoEcografiasResult,
          isPercentage: true,
          description: "Porcentaje de cobertura de ecografías.",
        },
      ],
    },
    {
      title: "Indicadores de Nutrición",
      kpis: [
        {
          id: 'nutricion',
          title: "Consultas Nutrición",
          value: nutricionResult,
          docs: nutricionDocs,
          description: "Total de gestantes con consulta de nutrición y dietética.",
        },
        {
          title: "Gestantes en Control",
          value: gestantesControlResult,
          description: "Total de gestantes registradas en el periodo.",
        },
        {
          title: "Resultado Nutrición",
          value: resultadoNutricionResult,
          isPercentage: true,
          description: "Porcentaje de cobertura de la consulta de nutrición.",
        },
      ],
    },
    {
      title: "Indicadores de Odontología",
      kpis: [
        {
          id: 'odontologia',
          title: "Consultas Odontología",
          value: odontologiaResult,
          docs: odontologiaDocs,
          description: "Total de gestantes con consulta de odontología.",
        },
        {
          title: "Gestantes en Control",
          value: gestantesControlResult,
          description: "Total de gestantes registradas en el periodo.",
        },
        {
          title: "Resultado Odontología",
          value: resultadoOdontologiaResult,
          isPercentage: true,
          description: "Porcentaje de cobertura de la consulta de odontología.",
        },
      ],
    },
    {
      title: "Indicadores de Ginecología (Alto Riesgo)",
      kpis: [
        {
          id: 'ginecologia',
          title: "Gestantes Alto Riesgo con Ginecología",
          value: ginecologiaResult,
          docs: ginecologiaDocs,
          description: "Gestantes de alto riesgo con consulta de ginecología.",
        },
        {
          title: "Total Gestantes Alto Riesgo",
          value: denominadorGinecologiaResult,
          description: "Total de gestantes clasificadas con alto riesgo obstétrico.",
        },
        {
          title: "Cobertura Ginecología (Alto Riesgo)",
          value: porcentajeGinecologiaResult,
          isPercentage: true,
          description: "Porcentaje de cobertura de ginecología para alto riesgo.",
        },
      ],
    },
  ];

  const mapKpiOptions = [
    { value: 'controlPercentageResult', label: '% Captación Oportuna' },
    { value: 'resultadoTamizajeVihResult', label: '% Tamizaje VIH' },
    { value: 'resultadoTamizajeSifilisResult', label: '% Tamizaje Sífilis' },
    { value: 'resultadoToxoplasmaResult', label: '% Tamizaje Toxoplasma' },
    { value: 'resultadoTamizajeHbResult', label: '% Tamizaje Hepatitis B' },
    { value: 'resultadoChagasResult', label: '% Tamizaje Chagas' },
    { value: 'resultadoEcografiasResult', label: '% Ecografías' },
    { value: 'resultadoNutricionResult', label: '% Nutrición' },
    { value: 'resultadoOdontologiaResult', label: '% Odontología' },
    { value: 'porcentajeGinecologiaResult', label: '% Ginecología (Alto Riesgo)' },
    { value: 'porcentajeControlesAdecuados', label: '% Controles Prenatales Adecuados' },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold tracking-tight text-primary flex-grow">Indicadores Gestantes</CardTitle>
                <CardDescription className="text-left">
                  Bienvenido, {user?.fullName || user?.username}. Has iniciado sesión como {user?.role}.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {user?.role === 'admin' && (
                    <Button asChild variant="outline">
                        <Link href="/admin">Administración</Link>
                    </Button>
                )}
                <Button onClick={handleLogout} variant="ghost" size="icon" disabled={isLoggingOut}>
                  {isLoggingOut ? <Loader2 className="h-6 w-6 animate-spin" /> : <LogOut className="h-6 w-6" />}
                  <span className="sr-only">Cerrar Sesión</span>
                </Button>
              </div>
            </div>
             {user?.role === 'admin' && (
                <Alert className="mt-4">
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Modo Administrador</AlertTitle>
                  <AlertDescription>
                    Tienes permisos para gestionar usuarios.
                  </AlertDescription>
                </Alert>
              )}
          </CardHeader>

          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="year-selector">Selecciona un año</Label>
                <Select onValueChange={handleYearChange} value={selectedYear}>
                  <SelectTrigger id="year-selector" className="w-full">
                    <SelectValue placeholder="Elige un año..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(availableFiles).map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="excel-file">Selecciona un mes</Label>
                <Select onValueChange={handleFileChange} value={selectedFile} disabled={!selectedYear}>
                  <SelectTrigger id="excel-file" className="w-full">
                    <SelectValue placeholder="Elige un mes..." />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.path} value={m.path}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-2">
              <Button
                onClick={handleGenerateChart}
                className="flex-1"
                disabled={isChartLoading || !selectedYear}
              >
                {isChartLoading ? "Generando Gráficos..." : "Generar Gráficos de Vigencia"}
              </Button>
              <Button
                onClick={() => calculateKpi(true)}
                className="flex-1"
                disabled={isLoading || !selectedFile}
              >
                {isLoading ? "Calculando..." : "Calcular Indicadores del Mes"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        {isChartLoading && <p className="text-center mt-4">Cargando datos para gráficos...</p>}

        {chartData.length > 0 && !isChartLoading && (
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Resumen Gráfico Anual ({selectedYear})</CardTitle>
                    <CardDescription>
                        Visualización del comportamiento de cada indicador a lo largo del año.
                    </CardDescription>
                </CardHeader>
                <CardContent ref={chartContainerRef}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {chartGroups.map((info, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <h3 className="text-lg font-semibold text-center">{info.title}</h3>
                            <MonthlyKpiChart data={chartData} dataKey={info.dataKey} fillColor={info.color} />
                        </div>
                    ))}
                  </div>
                </CardContent>
            </Card>
        )}

        {hasCalculated && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Mapa de Indicadores</CardTitle>
              <CardDescription>Visualización geográfica de los indicadores por departamento.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1.5 mb-4">
                <Label htmlFor="map-kpi-selector">Selecciona un Indicador para el Mapa</Label>
                <Select onValueChange={setSelectedMapKpi} value={selectedMapKpi}>
                  <SelectTrigger id="map-kpi-selector" className="w-full md:w-1/3">
                    <SelectValue placeholder="Elige un indicador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mapKpiOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[500px] w-full bg-muted rounded-md">
                <ColombiaMap data={mapData} dataKey={selectedMapKpi} />
              </div>
            </CardContent>
          </Card>
        )}


        {hasCalculated && (
          <>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Filtros de Datos</CardTitle>
                <CardDescription>Refina los resultados por departamento, municipio o IPS.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="department-filter">Departamento</Label>
                    <Select
                      onValueChange={(v) => {
                        const nv = v === "todos" ? "" : v;
                        setSelectedDepartment(nv);
                        setSelectedMunicipality("");
                        setSelectedIps("");

                        const mun = new Set<string>();
                        const ips = new Set<string>();
                        (nv ? filterData.filter((d) => d.dept === nv) : filterData).forEach((d) => {
                          mun.add(d.muni);
                          ips.add(d.ips);
                        });
                        setMunicipalities(Array.from(mun).sort());
                        setIpsList(Array.from(ips).sort());
                      }}
                      value={selectedDepartment}
                      disabled={departments.length === 0}
                    >
                      <SelectTrigger id="department-filter">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="municipality-filter">Municipio</Label>
                    <Select
                      onValueChange={(v) => {
                        const nm = v === "todos" ? "" : v;
                        setSelectedMunicipality(nm);
                        setSelectedIps("");

                        const ips = new Set<string>();
                        (nm
                          ? filterData.filter((d) => d.muni === nm)
                          : filterData.filter((d) => !selectedDepartment || d.dept === selectedDepartment)
                        ).forEach((d) => ips.add(d.ips));
                        setIpsList(Array.from(ips).sort());
                      }}
                      value={selectedMunicipality}
                      disabled={municipalities.length === 0}
                    >
                      <SelectTrigger id="municipality-filter">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {municipalities.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="ips-filter">IPS Primaria</Label>
                    <Select
                      onValueChange={(v) => setSelectedIps(v === "todos" ? "" : v)}
                      value={selectedIps}
                      disabled={ipsList.length === 0}
                    >
                      <SelectTrigger id="ips-filter">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        {ipsList.map((i) => (
                          <SelectItem key={i} value={i}>
                            {i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              </CardContent>
            </Card>

            {kpiGroups.map((group, idx) => (
              <Card key={idx} className="mt-6 w-full">
                <CardHeader>
                  <CardTitle>{group.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  {group.kpis.map((kpi: any, kidx: number) => {
                    if (kpi.value === null || kpi.value === undefined) return null;
                    return (
                      <Alert key={kidx} className="flex flex-col justify-between">
                        <AlertTitle>{kpi.title}</AlertTitle>
                        <AlertDescription>
                          <p className="text-3xl font-bold text-primary">
                            {kpi.isPercentage ? `${Number(kpi.value).toFixed(2)}%` : kpi.value}
                          </p>
                          {kpi.description && (
                            <p className="text-sm text-muted-foreground mt-1">{kpi.description}</p>
                          )}
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                </CardContent>
              </Card>
            ))}

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Acciones y Descargas</CardTitle>
                <CardDescription>Genera informes y descarga datos consolidados.</CardDescription>
              </CardHeader>
              <CardFooter className="flex-wrap justify-start gap-4">
                <Button onClick={handleGeneratePdf} className="flex-1 min-w-[200px]" variant="outline" disabled={isLoading}>
                  Generar Informe PDF (Actual)
                </Button>
                <Button
                  onClick={handleGeneratePdfsEnMasa}
                  className="flex-1 min-w-[200px]"
                  variant="outline"
                  disabled={isLoading || !hasCalculated}
                >
                  {isLoading ? "Generando..." : "Generar Informe de TODA la RED"}
                </Button>
                <Button
                  onClick={handleDownloadConsolidatedXls}
                  className="flex-1 min-w-[200px]"
                  variant="outline"
                  disabled={isLoading || !hasCalculated}
                >
                  {isLoading ? "Generando..." : "Descargar Consolidado (XLSX)"}
                </Button>
                <Button
                  onClick={handleDownloadBreakdownCsv}
                  className="flex-1 min-w-[200px]"
                  variant="outline"
                  disabled={isLoading || !hasCalculated}
                >
                  {isLoading ? "Generando..." : "Descargar Desglose (CSV)"}
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
