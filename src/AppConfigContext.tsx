import React, { useContext } from "react";
import { CMSAppProps } from "./CMSAppProps";


export const AppConfigContext = React.createContext<CMSAppProps>({
        name: "",
        navigation: []
    }
);

export const useAppConfigContext = () => useContext(AppConfigContext);

interface AppConfigsProviderProps {
    cmsAppConfig: CMSAppProps;
    children: React.ReactNode;
}

export const AppConfigProvider: React.FC<AppConfigsProviderProps> = ({ children, cmsAppConfig }) => {

    return (
        <AppConfigContext.Provider
            value={cmsAppConfig}
        >
            {children}
        </AppConfigContext.Provider>
    );
};
