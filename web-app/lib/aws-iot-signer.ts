import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";

interface SignedUrlParams {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export async function getSignedIoTWebSocketUrl({
  endpoint,
  region,
  accessKeyId,
  secretAccessKey,
}: SignedUrlParams): Promise<string> {
  const url = new URL(`wss://${endpoint}/mqtt`);

  const request = new HttpRequest({
    method: "GET",
    protocol: "wss:",
    hostname: url.hostname,
    path: url.pathname,
    headers: {
      host: url.hostname,
    },
  });

  const signer = new SignatureV4({
    service: "iotdevicegateway",
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    sha256: Sha256,
  });

  const signed = await signer.presign(request, {
    expiresIn: 300,
  });
  const signedUrl = new URL(`wss://${signed.hostname}${signed.path}`);
  
  if (signed.query) {
    Object.entries(signed.query).forEach(([key, value]) => {
      signedUrl.searchParams.set(key, value as string);
    });
  }

  return signedUrl.toString();
}
