import axiosInstance from "../axios/instance";
import { getStoredAppSession, storeAppSession, type StoredAppSession } from "./appSession";
import { decodeJwtClaims } from "./jwt";

const NAME_IDENTIFIER_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

export type CartItem = {
  cartItemId: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
  imageUrl: string;
};

export interface CartSummary {
  cartId: number;
  memberId: string;
  createdDate: string;
  cartItems: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}

function resolveIdentifier(session: StoredAppSession): string | null {
  const claims = decodeJwtClaims(session.accessToken);
  if (!claims) {
    return null;
  }

  const directClaim = claims[NAME_IDENTIFIER_CLAIM];
  if (typeof directClaim === "string" && directClaim.length > 0) {
    return directClaim;
  }

  const subClaim = claims.sub;
  if (typeof subClaim === "string" && subClaim.length > 0) {
    return subClaim;
  }

  return null;
}

export function getCurrentCartIdentifier(): string | null {
  const session = getStoredAppSession();
  if (!session || !session.accessToken) {
    return null;
  }

  return resolveIdentifier(session);
}

export async function ensureCartForStoredSession(): Promise<void> {
  const session = getStoredAppSession();
  if (!session) {
    return;
  }

  if (session.cartCreated) {
    return;
  }

  if (!session.accessToken) {
    return;
  }

  const identifier = resolveIdentifier(session);
  if (!identifier) {
    return;
  }

  try {
    await axiosInstance.post(`/Cart/create-cart/${identifier}`);
    storeAppSession({
      ...session,
      cartCreated: true,
    });
  } catch (error) {
    console.warn("Failed to ensure cart for session:", error);
  }
}

export async function fetchCartForStoredSession(): Promise<CartSummary | null> {
  const identifier = getCurrentCartIdentifier();
  if (!identifier) {
    return null;
  }

  try {
    const { data } = await axiosInstance.get<CartSummary>("/Cart", {
      params: {
        memberId: identifier,
      },
    });
    return data;
  } catch (error) {
    console.warn("Failed to load cart for session:", error);
    throw error;
  }
}
