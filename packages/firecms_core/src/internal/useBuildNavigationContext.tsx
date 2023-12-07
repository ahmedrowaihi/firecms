import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import {
    AuthController,
    CMSView,
    CMSViewsBuilder,
    DataSource,
    EntityCollection,
    EntityCollectionsBuilder,
    EntityReference,
    FireCMSPlugin,
    NavigationContext,
    TopNavigationEntry,
    TopNavigationResult,
    User,
    UserConfigurationPersistence
} from "../types";
import {
    getCollectionByPathOrAlias,
    mergeDeep,
    removeInitialAndTrailingSlashes,
    resolveCollectionPathAliases,
    resolvePermissions
} from "../util";
import { getParentReferencesFromPath } from "../util/parent_references_from_path";

type BuildNavigationContextProps<EC extends EntityCollection, UserType extends User> = {
    basePath: string,
    baseCollectionPath: string,
    authController: AuthController<UserType>;
    collections?: EC[] | EntityCollectionsBuilder<EC>;
    views?: CMSView[] | CMSViewsBuilder;
    userConfigPersistence?: UserConfigurationPersistence;
    plugins?: FireCMSPlugin[];
    dataSource: DataSource;
};

export function useBuildNavigationContext<EC extends EntityCollection, UserType extends User>({
                                                                                                                 basePath,
                                                                                                                 baseCollectionPath,
                                                                                                                 authController,
                                                                                                                 collections: baseCollections,
                                                                                                                 views: baseViews,
                                                                                                                 userConfigPersistence,
                                                                                                                 plugins,
                                                                                                                 dataSource
                                                                                                             }: BuildNavigationContextProps<EC, UserType>): NavigationContext {

    const location = useLocation();

    const [collections, setCollections] = useState<EntityCollection[] | undefined>();
    const [views, setViews] = useState<CMSView[] | undefined>();
    const [initialised, setInitialised] = useState<boolean>(false);

    const [topLevelNavigation, setTopLevelNavigation] = useState<TopNavigationResult | undefined>(undefined);
    const [navigationLoading, setNavigationLoading] = useState<boolean>(true);
    const [navigationLoadingError, setNavigationLoadingError] = useState<Error | undefined>(undefined);

    const cleanBasePath = removeInitialAndTrailingSlashes(basePath);
    const cleanBaseCollectionPath = removeInitialAndTrailingSlashes(baseCollectionPath);

    const homeUrl = cleanBasePath ? `/${cleanBasePath}` : "/";

    const fullCollectionPath = cleanBasePath ? `/${cleanBasePath}/${cleanBaseCollectionPath}` : `/${cleanBaseCollectionPath}`;

    const buildCMSUrlPath = useCallback((path: string): string => cleanBasePath ? `/${cleanBasePath}/${encodePath(path)}` : `/${encodePath(path)}`,
        [cleanBasePath]);

    const buildUrlCollectionPath = useCallback((path: string): string => `${removeInitialAndTrailingSlashes(baseCollectionPath)}/${encodePath(path)}`,
        [baseCollectionPath]);

    const computeTopNavigation = useCallback((collections: EntityCollection[], views: CMSView[]): TopNavigationResult => {
        // return (collection.editable && resolvePermissions(collection, authController, paths).editCollection) ?? DEFAULT_PERMISSIONS.editCollection;
        const navigationEntries: TopNavigationEntry[] = [
            ...(collections ?? []).map(collection => (!collection.hideFromNavigation
                ? {
                    url: buildUrlCollectionPath(collection.alias ?? collection.path),
                    type: "collection",
                    name: collection.name.trim(),
                    path: collection.alias ?? collection.path,
                    collection,
                    description: collection.description?.trim(),
                    group: collection.group?.trim()
                }
                : undefined))
                .filter(Boolean) as TopNavigationEntry[],
            ...(views ?? []).map(view =>
                !view.hideFromNavigation
                    ? ({
                        url: buildCMSUrlPath(Array.isArray(view.path) ? view.path[0] : view.path),
                        name: view.name.trim(),
                        type: "view",
                        view,
                        description: view.description?.trim(),
                        group: view.group?.trim()
                    })
                    : undefined)
                .filter(Boolean) as TopNavigationEntry[]
        ];

        const groups: string[] = Object.values(navigationEntries)
            .map(e => e.group)
            .filter(Boolean)
            .filter((value, index, array) => array.indexOf(value) === index) as string[];
        return {
            navigationEntries,
            groups
        };
    }, [buildCMSUrlPath, buildUrlCollectionPath]);

    const refreshNavigation = useCallback(async () => {

        if (authController.initialLoading)
            return;

        try {
            const [resolvedCollections = [], resolvedViews = []] = await Promise.all([
                    resolveCollections(baseCollections, authController, dataSource, plugins),
                    resolveCMSViews(baseViews, authController, dataSource)
                ]
            );

            setCollections(resolvedCollections);
            setViews(resolvedViews);
            setTopLevelNavigation(computeTopNavigation(resolvedCollections ?? [], resolvedViews));
        } catch (e) {
            console.error(e);
            setNavigationLoadingError(e as any);
        }

        setNavigationLoading(false);
        setInitialised(true);
    }, [baseCollections, authController.user, authController.initialLoading, dataSource, plugins, baseViews, computeTopNavigation]);

    useEffect(() => {
        refreshNavigation();
    }, [refreshNavigation]);

    const getCollection = useCallback(<EC extends EntityCollection>(
        pathOrAlias: string,
        entityId?: string,
        includeUserOverride = false
    ): EC | undefined => {

        if (!collections)
            return undefined;

        const baseCollection = getCollectionByPathOrAlias(removeInitialAndTrailingSlashes(pathOrAlias), collections);

        const userOverride = includeUserOverride ? userConfigPersistence?.getCollectionConfig(pathOrAlias) : undefined;

        const overriddenCollection = baseCollection ? mergeDeep(baseCollection, userOverride) : undefined;

        let result: Partial<EntityCollection> | undefined = overriddenCollection;

        if (overriddenCollection) {
            const subcollections = overriddenCollection.subcollections;
            const callbacks = overriddenCollection.callbacks;
            const permissions = overriddenCollection.permissions;
            result = {
                ...result,
                subcollections: result?.subcollections ?? subcollections,
                callbacks: result?.callbacks ?? callbacks,
                permissions: result?.permissions ?? permissions
            };
        }

        if (!result) return undefined;

        return { ...overriddenCollection, ...result } as EC;

    }, [
        basePath,
        baseCollectionPath,
        collections,
    ]);

    const getCollectionFromPaths = useCallback(<EC extends EntityCollection>(pathSegments: string[]): EC | undefined => {
        let currentCollections = collections;
        if (!currentCollections)
            throw Error("Collections have not been initialised yet");

        for (let i = 0; i < pathSegments.length; i++) {
            const pathSegment = pathSegments[i];
            const collection: EntityCollection | undefined = currentCollections!.find(c => c.alias === pathSegment || c.path === pathSegment);
            if (!collection)
                return undefined;
            currentCollections = collection.subcollections;
            if (i === pathSegments.length - 1)
                return collection as EC;
        }

        return undefined;

    }, [collections]);

    const isUrlCollectionPath = useCallback(
        (path: string): boolean => removeInitialAndTrailingSlashes(path + "/").startsWith(removeInitialAndTrailingSlashes(fullCollectionPath) + "/"),
        [fullCollectionPath]);

    const urlPathToDataPath = useCallback((path: string): string => {
        if (path.startsWith(fullCollectionPath))
            return path.replace(fullCollectionPath, "");
        throw Error("Expected path starting with " + fullCollectionPath);
    }, [fullCollectionPath]);

    const buildUrlEditCollectionPath = useCallback(({
                                                        path
                                                    }: {
            path: string
        }): string => {
            return `s/edit/${encodePath(path)}`;
        },
        []);

    const resolveAliasesFrom = useCallback((path: string): string => {
        if (!collections)
            throw Error("Collections have not been initialised yet");
        return resolveCollectionPathAliases(path, collections);
    }, [collections]);

    const state = location.state as any;
    /**
     * The location can be overridden if `base_location` is set in the
     * state field of the current location. This can happen if you open
     * a side entity, like `products`, from a different one, like `users`
     */
    const baseLocation = state && state.base_location ? state.base_location : location;

    const getAllParentCollectionsForPath = useCallback((path: string): EntityReference[] => {
        return getParentReferencesFromPath({
            path,
            collections
        });
    }, [collections]);

    return useMemo(() => ({
        collections: collections ?? [],
        views: views ?? [],
        loading: !initialised || navigationLoading,
        navigationLoadingError,
        homeUrl,
        basePath,
        baseCollectionPath,
        initialised,
        getCollection,
        getCollectionFromPaths,
        isUrlCollectionPath,
        urlPathToDataPath,
        buildUrlCollectionPath,
        buildUrlEditCollectionPath,
        buildCMSUrlPath,
        resolveAliasesFrom,
        topLevelNavigation,
        baseLocation,
        refreshNavigation,
        getParentReferencesFromPath: getAllParentCollectionsForPath
    }), [baseCollectionPath, baseLocation, basePath, buildCMSUrlPath, buildUrlCollectionPath, buildUrlEditCollectionPath, collections, getAllParentCollectionsForPath, getCollection, getCollectionFromPaths, homeUrl, initialised, isUrlCollectionPath, navigationLoading, navigationLoadingError, refreshNavigation, resolveAliasesFrom, topLevelNavigation, urlPathToDataPath, views]);
}

export function getSidePanelKey(path: string, entityId?: string) {
    if (entityId)
        return `${removeInitialAndTrailingSlashes(path)}/${removeInitialAndTrailingSlashes(entityId)}`;
    else
        return removeInitialAndTrailingSlashes(path);
}

function encodePath(input: string) {
    return encodeURIComponent(removeInitialAndTrailingSlashes(input))
        .replaceAll("%2F", "/")
        .replaceAll("%23", "#");
}

function filterOutNotAllowedCollections(resolvedCollections: EntityCollection[], authController: AuthController<User>): EntityCollection[] {
    return resolvedCollections
        .filter((c) => {
            if (!c.permissions) return true;
            const resolvedPermissions = resolvePermissions(c, authController, [c.path], null,)
            return resolvedPermissions.read !== false;
        })
        .map((c) => {
            if (!c.subcollections) return c;
            return {
                ...c,
                subcollections: filterOutNotAllowedCollections(c.subcollections, authController)
            }
        });
}

async function resolveCollections(collections: undefined | EntityCollection[] | EntityCollectionsBuilder<any>, authController: AuthController, dataSource: DataSource, plugins?: FireCMSPlugin[]) {
    let resolvedCollections: EntityCollection[] = [];
    if (typeof collections === "function") {
        resolvedCollections = await collections({
            user: authController.user,
            authController,
            dataSource
        });
    } else if (Array.isArray(collections)) {
        resolvedCollections = collections;
    }

    resolvedCollections = filterOutNotAllowedCollections(resolvedCollections, authController);

    if (plugins) {
        plugins.forEach((plugin: FireCMSPlugin) => {
            if (plugin.collections?.injectCollections) {
                resolvedCollections = plugin.collections?.injectCollections(resolvedCollections ?? []);
            }
        });
    }
    return resolvedCollections;
}

async function resolveCMSViews(baseViews: CMSView[] | CMSViewsBuilder | undefined, authController: AuthController, dataSource: DataSource) {
    let resolvedViews: CMSView[] = [];
    if (typeof baseViews === "function") {
        resolvedViews = await baseViews({
            user: authController.user,
            authController,
            dataSource
        });
    } else if (Array.isArray(baseViews)) {
        resolvedViews = baseViews;
    }
    return resolvedViews;
}