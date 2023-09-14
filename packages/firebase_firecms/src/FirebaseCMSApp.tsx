import React from "react";
import { GoogleAuthProvider } from "firebase/auth";
import { BrowserRouter } from "react-router-dom";
import { useInitialiseFirebase } from "./hooks/useInitialiseFirebase";

import {
    CenteredView,
    CircularProgressCenter,
    FireCMS,
    ModeControllerProvider,
    NavigationRoutes,
    Scaffold,
    SideDialogs,
    SnackbarProvider,
    useBrowserTitleAndIcon,
    useBuildLocalConfigurationPersistence,
    useBuildModeController
} from "firecms";

import { FirebaseCMSAppProps } from "./FirebaseCMSAppProps";
import { useFirebaseAuthController } from "./hooks/useFirebaseAuthController";
import { useFirestoreDataSource } from "./hooks/useFirestoreDataSource";
import { useFirebaseStorageSource } from "./hooks/useFirebaseStorageSource";
import { useInitializeAppCheck } from "./hooks/useInitializeAppCheck";
import { FirebaseLoginView } from "./components/FirebaseLoginView";
import { FirebaseAuthController } from "./types/auth";
import { useValidateAuthenticator } from "./hooks/useValidateAuthenticator";

const DEFAULT_SIGN_IN_OPTIONS = [
    GoogleAuthProvider.PROVIDER_ID
];

/**
 * This is the default implementation of a FireCMS app using the Firebase services
 * as a backend.
 * You can use this component as a full app, by specifying collections and
 * entity collections.
 *
 * This component is in charge of initialising Firebase, with the given
 * configuration object.
 *
 * If you are building a larger app and need finer control, you can use
 * {@link FireCMS}, {@link Scaffold}, {@link SideDialogs}
 * and {@link NavigationRoutes} instead.
 *
 * @param props
 * @constructor
 * @category Firebase
 */
export function FirebaseCMSApp({
                                   name,
                                   logo,
                                   logoDark,
                                   toolbarExtraWidget,
                                   authentication,
                                   collections,
                                   views,
                                   textSearchController,
                                   allowSkipLogin,
                                   signInOptions = DEFAULT_SIGN_IN_OPTIONS,
                                   firebaseConfig,
                                   onFirebaseInit,
                                   appCheckOptions,
                                   dateTimeFormat,
                                   locale,
                                   HomePage,
                                   basePath,
                                   baseCollectionPath,
                                   LoginView,
                                   onAnalyticsEvent,
                                   fields = {},
                                   plugins,
                                   autoOpenDrawer,
                                   firestoreIndexesBuilder
                               }: FirebaseCMSAppProps) {

    /**
     * Update the browser title and icon
     */
    useBrowserTitleAndIcon(name, logo);

    const {
        firebaseApp,
        firebaseConfigLoading,
        configError
    } = useInitialiseFirebase({
        onFirebaseInit,
        firebaseConfig
    });

    const {
        appCheckLoading,
        getAppCheckToken
    } = useInitializeAppCheck({
        firebaseApp,
        options: appCheckOptions
    });

    /**
     * Controller for managing authentication
     */
    const authController: FirebaseAuthController = useFirebaseAuthController({
        firebaseApp,
        signInOptions
    });

    /**
     * Controller for saving some user preferences locally.
     */
    const userConfigPersistence = useBuildLocalConfigurationPersistence();

    /**
     * Controller in charge of fetching and persisting data
     */
    const dataSource = useFirestoreDataSource({
        firebaseApp,
        textSearchController,
        firestoreIndexesBuilder
    });

    /**
     * Controller used for saving and fetching files in storage
     */
    const storageSource = useFirebaseStorageSource({
        firebaseApp
    });

    /**
     * Validate authenticator
     */
    const {
        authLoading,
        canAccessMainView,
        notAllowedError
    } = useValidateAuthenticator({
        authController,
        authentication,
        getAppCheckToken,
        appCheckForceRefresh: (appCheckOptions && appCheckOptions.forceRefresh) ? appCheckOptions.forceRefresh! : false,
        dataSource,
        storageSource
    });

    /**
     * Controller used to manage the dark or light color mode
     */
    const modeController = useBuildModeController();

    if (configError) {
        return <CenteredView fullScreen={true}>{configError}</CenteredView>;
    }

    if (firebaseConfigLoading || !firebaseApp || appCheckLoading) {
        return <>
            <CircularProgressCenter/>
        </>;
    }

    return (
        <BrowserRouter basename={basePath}>
            <SnackbarProvider>
                <ModeControllerProvider
                    value={modeController}>
                    <FireCMS
                        collections={collections}
                        views={views}
                        authController={authController}
                        userConfigPersistence={userConfigPersistence}
                        dateTimeFormat={dateTimeFormat}
                        dataSource={dataSource}
                        storageSource={storageSource}
                        entityLinkBuilder={({ entity }) => `https://console.firebase.google.com/project/${firebaseApp.options.projectId}/firestore/data/${entity.path}/${entity.id}`}
                        locale={locale}
                        basePath={basePath}
                        baseCollectionPath={baseCollectionPath}
                        onAnalyticsEvent={onAnalyticsEvent}
                        plugins={plugins}
                        fields={fields}>
                        {({
                              context,
                              loading
                          }) => {

                            // return <MultiSelect/>;
                            let component;
                            if (loading || authLoading) {
                                component = <CircularProgressCenter size={"large"}/>;
                            } else {
                                const usedLogo = modeController.mode === "dark" && logoDark ? logoDark : logo;
                                if (!canAccessMainView) {
                                    const LoginViewUsed = LoginView ?? FirebaseLoginView;
                                    component = (
                                        <LoginViewUsed
                                            logo={usedLogo}
                                            allowSkipLogin={allowSkipLogin}
                                            signInOptions={signInOptions ?? DEFAULT_SIGN_IN_OPTIONS}
                                            firebaseApp={firebaseApp}
                                            authController={authController}
                                            notAllowedError={notAllowedError}/>
                                    );
                                } else {
                                    component = (
                                        <Scaffold
                                            name={name}
                                            logo={usedLogo}
                                            fireCMSAppBarComponentProps={{
                                                endAdornment: toolbarExtraWidget
                                            }}
                                            autoOpenDrawer={autoOpenDrawer}>
                                            <NavigationRoutes
                                                HomePage={HomePage}/>
                                            <SideDialogs/>
                                        </Scaffold>
                                    );
                                }
                            }

                            return component;
                        }}
                    </FireCMS>
                </ModeControllerProvider>
            </SnackbarProvider>
        </BrowserRouter>
    );
}
