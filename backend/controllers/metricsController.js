import { getMetricsSummary } from "../services/metricsService.js";

export const getMetrics = async (req, res) => {
  try {
    const summary = await getMetricsSummary();
    return res.status(200).json(summary);
  } catch (error) {
    console.error("METRICS ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate metrics summary",
    });
  }
};