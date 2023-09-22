import { OAuthCredential, User as FirebaseUser } from "firebase/auth";

import { AuthController, DataSource, StorageSource, User } from "firecms";
import { Role } from "./roles";
import { FirebaseApp } from "firebase/app";
import { ProjectsApi } from "../api/projects";

/**
 * @category Firebase
 */
export type FirebaseSignInProvider =
// | 'email'
    | "password"
    | "phone"
    | "anonymous"
    | "google.com"
    | "facebook.com"
    | "github.com"
    | "twitter.com"
    | "microsoft.com"
    | "apple.com";

/**
 * @category Firebase
 */
export type FirebaseSignInOption = {
    provider: FirebaseSignInProvider;
    scopes?: string[];
    customParameters?: Record<string, string>;
}

export type FireCMSBackend = {

    backendUid?: string;
    backendFirebaseApp?: FirebaseApp;
    backendApiHost: string;

    projectsApi: ProjectsApi;

    user: FirebaseUser | null;

    googleLogin: (includeGoogleAdminScopes?: boolean) => void;

    signOut: () => void;

    googleCredential?: OAuthCredential | null;
    getBackendAuthToken: () => Promise<string>;

    permissionsNotGrantedError: boolean;

    availableProjects?: string[];
    availableProjectsLoaded: boolean;
    availableProjectsLoading: boolean;
    availableProjectsError?: Error;

    authLoading: boolean;
    authProviderError?: any;
}


/**
 * @category Firebase
 */
export type FirebaseAuthController =
    AuthController<FirebaseUser> & {

    authLoading: boolean;

    setUser: (user: FirebaseUser | null) => void;

    googleLogin: () => void;

    // appleLogin: () => void;
    //
    // anonymousLogin: () => void;
    //
    // facebookLogin: () => void;
    //
    // githubLogin: () => void;
    //
    // microsoftLogin: () => void;
    //
    // twitterLogin: () => void;

    emailPasswordLogin: (email: string, password: string) => void;

    fetchSignInMethodsForEmail: (email: string) => Promise<string[]>;

    createUserWithEmailAndPassword: (email: string, password: string) => void;

    userRoles: Role[] | null;

    setUserRoles: (roles: Role[] | null) => void;

    /**
     * Skip login
     */
    skipLogin?: () => void;

};

/**
 * Implement this function to allow access to specific users.
 * You might also want to load additional data for a user asynchronously
 * and store it using the `setExtra` method in the `authController`.
 * @category Firebase
 */
export type Authenticator<UserType extends User = User> = ({ user }: {
    /**
     * Logged in user or null
     */
    user: UserType | null;

    /**
     * AuthController
     */
    authController: AuthController<UserType>;

    /**
     * Connector to your database, e.g. your Firestore database
     */
    dataSource: DataSource;

    /**
     * Used storage implementation
     */
    storageSource: StorageSource;
}) => boolean | Promise<boolean>;
