declare module "midtrans-client" {
  class Snap {
    constructor(opts: { isProduction: boolean; serverKey: string; clientKey: string });
    createTransaction(payload: Record<string, unknown>): Promise<{ token: string; redirect_url: string }>;
  }
  class CoreApi {
    constructor(opts: { isProduction: boolean; serverKey: string; clientKey: string });
    charge(payload: Record<string, unknown>): Promise<unknown>;
  }
  const midtransClient: { Snap: typeof Snap; CoreApi: typeof CoreApi };
  export default midtransClient;
}
