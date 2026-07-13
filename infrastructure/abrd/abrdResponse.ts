export type AbrdApiResponse<T> = {
  success?: boolean;
  data?: T;
  items?: T;
};

export function unwrapAbrdData<T>(payload: AbrdApiResponse<T> | T): T {
  if (payload !== null && typeof payload === "object" && "data" in payload) {
    const wrapped = payload as AbrdApiResponse<T>;
    if (wrapped.data !== undefined) {
      return wrapped.data;
    }
  }

  return payload as T;
}

export function extractAbrdListItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const data = unwrapAbrdData(payload as AbrdApiResponse<T[] | { items?: T[] }>);

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object" && "items" in data) {
    const items = (data as { items?: T[] }).items;
    if (Array.isArray(items)) {
      return items;
    }
  }

  return [];
}
