import { useContext } from "react";
import { NavigationContext } from "../types";
import { NavigationContextInstance } from "../contexts/NavigationContext";

/**
 * Use this hook to get the navigation of the app.
 * This controller provides the resolved collections for the CMS as well
 * as utility methods.
 *
 * @group Hooks and utilities
 */
export const useNavigationContext = (): NavigationContext => useContext(NavigationContextInstance);
