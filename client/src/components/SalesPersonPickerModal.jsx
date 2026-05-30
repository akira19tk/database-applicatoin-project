import React from "react";
import { listSalesPersons } from "../api/salesPersons.api.js";
import ListPickerModal from "./ListPickerModal.jsx";

const COLUMNS = [
  { key: "code", label: "Code" },
  { key: "name", label: "Name" },
  { key: "start_work_date", label: "Start Date", render: (v) => v ? v.slice(0, 10) : "-" },
];

export default function SalesPersonPickerModal({ isOpen, onClose, onSelect, initialSearch }) {
  const fetchData = React.useCallback((params) => listSalesPersons(params), []);

  const handleSelect = (row) => {
    onSelect(row.code, row.name);
  };

  return (
    <ListPickerModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={handleSelect}
      title="Select Sales Person"
      fetchData={fetchData}
      columns={COLUMNS}
      initialSearch={initialSearch}
    />
  );
}