// Whether store billing (Play Billing on Android, StoreKit on iOS) is live on this device (AGENTS.md "Money").
// Until it is, the setup wizard shows no priced trial offer and no Pro offers go out, because a price with
// nothing to buy behind it breaks store review and would mislead people who already have every Pro feature.

/** Flipped on when native billing ships and the store SDK is configured on this device. */
export const BILLING_LIVE = false;

let live = BILLING_LIVE;

export function billingLive(): boolean {
  return live;
}

/** Tests and the native billing setup switch this; nothing else should. */
export function setBillingLive(on: boolean): void {
  live = on;
}
