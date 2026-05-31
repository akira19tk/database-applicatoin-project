import React from "react";
import { toast } from "react-toastify";
import { listDoctors, deleteDoctor } from "../../api/doctors.api.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal } from "../../components/Modal.jsx";

export default function DoctorList() {
  const fetchData = React.useCallback((p) => listDoctors(p), []);
  const [confirm, setConfirm] = React.useState({ open: false, code: null });
  const [refresh, setRefresh] = React.useState(0);

  const handleDelete = (code) => setConfirm({ open: true, code });

  const confirmDelete = async () => {
    try {
      await deleteDoctor(confirm.code);
      setConfirm({ open: false, code: null });
      setRefresh(r => r + 1);
      toast.success("Doctor deleted.");
    } catch (e) { toast.error(String(e.message)); }
  };

  const columns = [
    { key: "doctor_code", label: "Code" },
    { key: "doctor_name", label: "Name" },
    { key: "gender", label: "Gender" },
    { key: "specialty", label: "Specialty" },
    { key: "department_name", label: "Department", sortable: false },
  ];

  return (
    <>
      <ConfirmModal isOpen={confirm.open} onClose={() => setConfirm({ open: false, code: null })}
        onConfirm={confirmDelete} closeOnConfirm={false} title="Delete Doctor"
        message="Are you sure you want to delete this doctor?" confirmText="Delete" />
      <DataList title="Doctors" fetchData={fetchData} columns={columns}
        searchPlaceholder="Search code, name, specialty..." itemName="doctors"
        basePath="/doctors" itemKey="doctor_code" onDelete={handleDelete} refreshTrigger={refresh} />
    </>
  );
}