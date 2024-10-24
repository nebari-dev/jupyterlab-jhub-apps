interface IPathWidget {
  /**
   * The context object associated with the widget.
   * Contains the metadata and information about the widget.
   */
  context: {
    /**
     * The path of the current document or resource associated with the widget.
     * Typically represents the file path or location of the notebook or document.
     */
    path: string;
  };
}

export const hasContextPath = (widget: any): widget is IPathWidget => {
  return widget && widget.context && typeof widget.context.path === 'string';
};

export function buildQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
}

export function coerceBooleanString(value: any): 'true' | 'false' {
  if (value === undefined) {
    return 'true';
  }

  if (
    typeof value === 'string' &&
    ['true', 'false'].includes(value.toLowerCase())
  ) {
    return value.toLowerCase() as 'true' | 'false';
  }

  console.warn(`Invalid value: ${value}. Defaulting to 'true'.`);
  return 'true';
}
