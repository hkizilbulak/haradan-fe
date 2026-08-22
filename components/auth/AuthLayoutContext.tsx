import React, { createContext, useContext } from 'react';

export type AuthMobileLayout = 'sheet' | 'glass';

type AuthLayoutContextValue = {
  isMobile: boolean;
  mobileLayout: AuthMobileLayout;
  isGlass: boolean;
};

const AuthLayoutContext = createContext<AuthLayoutContextValue>({
  isMobile: false,
  mobileLayout: 'sheet',
  isGlass: false,
});

export function AuthLayoutContextProvider({
  isMobile,
  mobileLayout,
  children,
}: {
  isMobile: boolean;
  mobileLayout: AuthMobileLayout;
  children: React.ReactNode;
}) {
  return (
    <AuthLayoutContext.Provider
      value={{
        isMobile,
        mobileLayout,
        isGlass: isMobile && mobileLayout === 'glass',
      }}
    >
      {children}
    </AuthLayoutContext.Provider>
  );
}

export function useAuthLayout(): AuthLayoutContextValue {
  return useContext(AuthLayoutContext);
}
