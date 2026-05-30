import { http } from "./http.js";

export async function getConfig(key) {
  const res = await http(`/api/config/${encodeURIComponent(key)}`);
  return res.data.value;
}
