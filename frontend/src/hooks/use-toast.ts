type ToastType = "success" | "error" | "info";

interface ToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
}

export function toast({
  title,
  description,
  type = "info"
}: ToastOptions) {
  let prefix = "";

  if (type === "success") prefix = "SUCCESS";
  if (type === "error") prefix = "ERROR";
  if (type === "info") prefix = "INFO";

  const message = `${prefix}: ${title ?? ""} ${description ?? ""}`;

  // Simple browser alert for now
  alert(message);
}
