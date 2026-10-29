export class MissingConfigError extends Error {
  constructor(public readonly names: string[]) {
    super(`환경 변수가 없습니다: ${names.join(", ")}`);
  }
}

export function requireEnv(...names: string[]): Record<string, string> {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) throw new MissingConfigError(missing);
  return Object.fromEntries(names.map((name) => [name, process.env[name] as string]));
}
