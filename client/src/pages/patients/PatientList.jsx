import React from "react";
import { toast } from "react-toastify";
import { listPatients, deletePatient } from "../../api/patients.api.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal } from "../../components/Modal.jsx";

export default function PatientList() {
  const fetchData = React.useCallback((p) => listPatients(p), []);
  const [confirm, setConfirm] = React.useState({ open: false, code: null });
  const [refresh, setRefresh] = React.useState(0);

  const handleDelete = (code) => setConfirm({ open: true, code });

  const confirmDelete = async () => {
    try {
      await deletePatient(confirm.code);
      setConfirm({ open: false, code: null });
      setRefresh(r => r + 1);
      toast.success("Patient deleted.");
    } catch (e) { toast.error(String(e.message)); }
  };

  const columns = [
    { key: "patient_code", label: "Code" },
    { key: "patient_name", label: "Name" },
    { key: "gender", label: "Gender" },
    { key: "date_of_birth", label: "Date of Birth", render: v => v ? new Date(v).toLocaleDateString() : "-" },
    { key: "blood_type_full", label: "Blood Type", sortable: false },
  ];

  return (
    <>
      <ConfirmModal isOpen={confirm.open} onClose={() => setConfirm({ open: false, code: null })}
        onConfirm={confirmDelete} closeOnConfirm={false} title="Delete Patient"
        message="Are you sure you want to delete this patient?" confirmText="Delete" />
      <DataList title="Patients" fetchData={fetchData} columns={columns}
        searchPlaceholder="Search code or name..." itemName="patients"
        basePath="/patients" itemKey="patient_code" onDelete={handleDelete} refreshTrigger={refresh} />
    </>
  );
}
