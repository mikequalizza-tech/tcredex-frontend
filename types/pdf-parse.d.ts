declare module 'pdf-parse' {
  interface PdfParseOptions {
    pagerender?: (pageData: any) => any;
    max?: number;
    version?: string;
  }

  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }

  function pdf(data: Buffer | Uint8Array | ArrayBuffer, options?: PdfParseOptions): Promise<PdfParseResult>;

  export default pdf;
}
