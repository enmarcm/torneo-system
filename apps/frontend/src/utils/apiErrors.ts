type ErrorPayload = { message?: string; errors?: { message?: string }[]; fields?: Record<string, unknown> };

export const extractErrorMessage = (err: unknown, fallback = 'Algo salió mal'): string => {
  const error = err as { response?: { data?: ErrorPayload }; message?: string } | null;
  const data = error?.response?.data;
  const details = Array.isArray(data?.errors)
    ? data.errors.map((item) => item?.message).filter((message): message is string => typeof message === 'string' && !!message.trim())
    : [];
  if (details.length) return [...new Set(details)].join('. ');
  // Also display field errors from older API versions.
  if (data?.fields && (!data.message || data.message === 'Datos inválidos')) {
    const messages = Object.values(data.fields).flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((value): value is string => typeof value === 'string' && !!value.trim());
    if (messages.length) return [...new Set(messages)].join('. ');
  }
  return data?.message || error?.message || fallback;
};
