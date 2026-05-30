import React from "react";
import { listVisits } from "../../api/visits.api.js";
import DataList from "../../components/DataList.jsx";

export default function VisitList() {
  const fetchData = React.useCallback((p) => listVisits(p), []);
  const columns = [
    { key: "visit_code", label: "Visit Code" },
    { key: "patient_name", label: "Patient", sortable: false },
    { key: "patient_code", label: "Patient Code", sortable: false },
    { key: "visit_type", label: "Type", render: v => <span className={`badge ${v === "IPD" ? "badge-blue" : "badge-green"}`}>{v}</span> },
    { key: "reported_symptoms", label: "Symptoms", sortable: false },
    { key: "created_at", label: "Date", sortable: false, render: v => v ? new Date(v).toLocaleDateString() : "-" },
  ];
  return (
    <DataList title="Visits" fetchData={fetchData} columns={columns}
      searchPlaceholder="Search visit code, patient name..." itemName="visits"
      basePath="/visits" itemKey="visit_code" />
  );
}
