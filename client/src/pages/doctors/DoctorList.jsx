import React from "react";
import { listDoctors } from "../../api/doctors.api.js";
import DataList from "../../components/DataList.jsx";

export default function DoctorList() {
  const fetchData = React.useCallback((p) => listDoctors(p), []);
  const columns = [
    { key: "doctor_code", label: "Code" },
    { key: "doctor_name", label: "Name" },
    { key: "gender", label: "Gender" },
    { key: "specialty", label: "Specialty" },
    { key: "department_name", label: "Department", sortable: false },
  ];
  return (
    <DataList title="Doctors" fetchData={fetchData} columns={columns}
      searchPlaceholder="Search code, name, specialty..." itemName="doctors"
      basePath="/doctors" itemKey="doctor_code" />
  );
}
