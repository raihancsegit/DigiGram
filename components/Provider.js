"use client"
import { Provider } from "react-redux";
import { store, loadState } from "@/lib/store/store";
import { useEffect } from "react";
import { login } from "@/lib/store/features/authSlice";
import { hydrateWardData } from "@/lib/store/features/wardDataSlice";

export default function ReduxProvider({ children }) {
    useEffect(() => {
        const state = loadState();
        if (state) {
            if (state.auth && state.auth.user) {
                store.dispatch(login(state.auth.user));
            }
            if (state.wardData && state.wardData.dynamicWardData) {
                store.dispatch(hydrateWardData(state.wardData.dynamicWardData));
            }
        }
    }, []);

    return <Provider store={store}>{children}</Provider>;
}