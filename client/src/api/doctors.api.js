import { http } from "./http.js";

function unwrap(res) {
  if (res && res.success === false && res.error) throw new Error(res.error.message);
  return res;
}

export async function listDoctors(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = unwrap(await http(`/api/doctors${q ? `?${q}` : ""}`));
  return { data: res.data, ...(res.meta || {}) };
}

export async function getDoctor(code) {
  return unwrap(await http(`/api/doctors/${encodeURIComponent(code)}`)).data;
}
