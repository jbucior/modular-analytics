import { Auth } from '@firebase/auth';
import { FirebaseOptions } from '@firebase/app';

export type InitializeParams = IAnonymousInitializeParams | IAuthenticatedInitializeParams;

interface IAnonymousInitializeParams {
  firebaseConfig: FirebaseOptions,
  forceSignInAnonymously: true,
  firebaseAppName?: string,
}

interface IAuthenticatedInitializeParams {
  firebaseAuth: Auth,
  forceSignInAnonymously: false,
  firebaseAppName?: string,
}

export interface IAnalytics {
  initialize(params: InitializeParams): Promise<void>,
  trackEvent(eventName: string, properties: Record<string, unknown>, modules?: string[]): Promise<any[]>,
  setGlobalProperties(property: string, value: Record<string, unknown> | string): void,
}
