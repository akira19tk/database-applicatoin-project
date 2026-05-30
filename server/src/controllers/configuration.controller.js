import { getConfig } from "../services/configuration.service.js";

export async function handleGetConfig(req, res) {
  try {
    const { key } = req.params;
    const result = await getConfig(key);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(404).json({ success: false, error: { message: err.message } });
  }
}
