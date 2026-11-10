/**
 * Recursively cleans an object by removing any keys whose value is undefined,
 * preventing Firestore errors like:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    // Preserve Dates or special Firebase FieldValues/Timestamps
    if (data instanceof Date || (data as any)?.toMillis || (data as any)?._methodName) {
      return data;
    }
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return data;
}
