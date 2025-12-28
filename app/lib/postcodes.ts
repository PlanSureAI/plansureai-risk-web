const POSTCODES_IO_BASE = "https://api.postcodes.io";

export type PostcodeResult = {
  postcode: string;
  latitude: number;
  longitude: number;
  country: string;
  nhs_ha: string | null;
  admin_district: string | null;
  admin_county: string | null;
  admin_ward: string | null;
  parish: string | null;
  parliamentary_constituency: string | null;
  nuts: string | null;
  codes: Record<string, string | null>;
};

type PostcodesIoSuccess<T> = { status: 200; result: T };
type PostcodesIoError = { status: number; error: string };

async function fetchPostcodesIo<T>(path: string): Promise<T> {
  const res = await fetch(`${POSTCODES_IO_BASE}${path}`);
  const data = (await res.json()) as PostcodesIoSuccess<T> | PostcodesIoError;

  if (data.status !== 200) {
    const errorData = data as PostcodesIoError;
    throw new Error(errorData.error || "Postcode lookup failed");
  }

  return (data as PostcodesIoSuccess<T>).result;
}

/**
 * Validate a UK postcode. Returns true/false.
 */
export async function validatePostcode(postcode: string): Promise<boolean> {
  const path = `/postcodes/${encodeURIComponent(postcode.trim())}/validate`;
  return fetchPostcodesIo<boolean>(path);
}

/**
 * Lookup a postcode and return full geographic data.
 */
export async function lookupPostcode(
  postcode: string
): Promise<PostcodeResult> {
  const path = `/postcodes/${encodeURIComponent(postcode.trim())}`;
  return fetchPostcodesIo<PostcodeResult>(path);
}
