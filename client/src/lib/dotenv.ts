export interface ParsedEnvEntry {
  key: string;
  value: string;
  line: number;
}

export interface ParseEnvResult {
  entries: ParsedEnvEntry[];
  errors: Array<{ line: number; message: string }>;
}

/**
 * Parses raw .env string into key-value pairs.
 * Follows standard .env specifications:
 * - Ignores comments starting with # and blank lines
 * - Handles single ('...') and double ("...") quoted values
 * - Unescapes \n, \r, \t within quoted values
 * - Normalizes keys (uppercases, validates format)
 */
export function parseDotEnv(content: string): ParseEnvResult {
  const lines = content.split(/\r?\n/);
  const entries: ParsedEnvEntry[] = [];
  const errors: Array<{ line: number; message: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;
    const trimmed = rawLine.trim();

    // Skip empty lines or comment lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      errors.push({
        line: lineNum,
        message: `Line ${lineNum}: Missing '=' delimiter (expected KEY=VALUE)`,
      });
      continue;
    }

    const rawKey = trimmed.substring(0, eqIndex).trim();
    const rawVal = trimmed.substring(eqIndex + 1).trim();

    // Validate key
    const normalizedKey = rawKey.toUpperCase();
    if (!/^[A-Z0-9_]{1,255}$/.test(normalizedKey)) {
      errors.push({
        line: lineNum,
        message: `Line ${lineNum}: Invalid key "${rawKey}". Only letters, numbers, and underscores allowed (1-255 chars).`,
      });
      continue;
    }

    // Parse value (handle quotes)
    let parsedVal = rawVal;
    if (
      (rawVal.startsWith('"') && rawVal.endsWith('"')) ||
      (rawVal.startsWith("'") && rawVal.endsWith("'"))
    ) {
      parsedVal = rawVal.slice(1, -1);
      if (rawVal.startsWith('"')) {
        // Expand escape characters for double quotes
        parsedVal = parsedVal
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"');
      }
    } else {
      // Strip trailing inline comments for unquoted values: KEY=value # comment
      const commentIndex = parsedVal.indexOf(' #');
      if (commentIndex !== -1) {
        parsedVal = parsedVal.substring(0, commentIndex).trim();
      }
    }

    entries.push({
      key: normalizedKey,
      value: parsedVal,
      line: lineNum,
    });
  }

  return { entries, errors };
}

/**
 * Serializes secrets to standard .env file format.
 */
export function stringifyDotEnv(secrets: Array<{ key: string; value: string }>): string {
  return secrets
    .map((s) => {
      const needsQuotes =
        s.value.includes('\n') ||
        s.value.includes(' ') ||
        s.value.includes('"') ||
        s.value.includes('#') ||
        s.value.trim() !== s.value;
      if (needsQuotes) {
        const escaped = s.value.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        return `${s.key}="${escaped}"`;
      }
      return `${s.key}=${s.value}`;
    })
    .join('\n');
}
