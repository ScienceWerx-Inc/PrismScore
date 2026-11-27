/**
 * ScienceWerx Connect v1: wire types shared by every ScienceWerx app.
 * Each app keeps its own database and sign-in; apps share display-ready data
 * about the signed-in person only, matched by verified email, server to server.
 */

export const CONNECT_APPS = ['prismscore', 'istartup', 'founderfit', 'inkeep', 'inkguard'] as const;
export type ConnectApp = (typeof CONNECT_APPS)[number];

export const CONNECT_SCOPES = ['summary', 'certificates'] as const;
export type ConnectScope = (typeof CONNECT_SCOPES)[number];

/** This app's name on the Connect network. */
export const SELF_APP: ConnectApp = 'prismscore';

export const APP_DISPLAY_NAMES: Record<string, string> = {
  prismscore: 'PrismScore',
  istartup: 'iStartup Score',
  founderfit: 'FounderFit',
  inkeep: 'InkKeep',
  inkguard: 'InkGuard',
};

export interface ConnectCardLine {
  label: string;
  value: string;
}

export interface ConnectCard {
  title: string;
  headline: string;
  lines: ConnectCardLine[];
  url: string;
  updatedAt: string;
}

export type SummaryResponse =
  | { app: string; found: true; card: ConnectCard }
  | { app: string; found: false };

export type CertificateStatus = 'VALID' | 'EXPIRED' | 'REVOKED';

export interface ConnectCertificate {
  code: string;
  title: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string | null;
  status: CertificateStatus;
  verifyUrl: string;
}

export type CertificatesResponse =
  | { app: string; found: true; certificates: ConnectCertificate[] }
  | { app: string; found: false };

/** What /api/connect/peers sends this app's browser. */
export interface PeerCard extends ConnectCard {
  app: string;
  appName: string;
}

export interface PeerCertificate extends ConnectCertificate {
  app: string;
  appName: string;
}

export interface PeersResponse {
  cards: PeerCard[];
  certificates: PeerCertificate[];
  /** Peers that were asked but did not answer usably. Names only, never their errors. */
  unavailable?: string[];
  needsVerification?: boolean;
}

/** Spec limits on a card. */
export const CARD_LIMITS = { lines: 5, value: 120, label: 60, title: 120, headline: 160 } as const;
export const PEER_TIMEOUT_MS = 4000;
