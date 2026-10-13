/** A content problem with its location. All of these fail the build. */
export class ContentError extends Error {
  readonly file: string;
  readonly line: number;

  constructor(file: string, line: number, message: string) {
    super(`${file}:${line}: ${message}`);
    this.name = 'ContentError';
    this.file = file;
    this.line = line;
  }
}
