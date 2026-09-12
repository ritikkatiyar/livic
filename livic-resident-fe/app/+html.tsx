import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import { Breakpoints, DarkColors, SansFont } from '@/src/theme/Theme';

export default function HTML({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Preconnect to API and AI services */}
        <link rel="preconnect" href="https://tenantappbackend.onrender.com" />
        <link rel="preconnect" href="https://ai-service-ws9z.onrender.com" />
        <link rel="dns-prefetch" href="https://tenantappbackend.onrender.com" />
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          @font-face {
            font-family: 'Inter';
            src: local('-apple-system'), local('BlinkMacSystemFont'), local('SF Pro Text'), local('SF Pro Display'), local('Helvetica Neue'), local('Helvetica');
          }
          html, body, #root {
            background-color: ${DarkColors.background};
            min-height: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          @media (min-width: ${Breakpoints.desktop}px) {
            [data-responsive-layout="mobile"],
            [data-mobile-header="true"],
            [data-bottom-nav="true"] {
              display: none !important;
            }
          }
          @media (max-width: ${Breakpoints.desktop - 1}px) {
            [data-responsive-layout="desktop"] {
              display: none !important;
            }
            [data-mobile-header="true"],
            .mobile-header-container {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              z-index: 9999 !important;
            }
            [data-bottom-nav="true"],
            .mobile-bottom-nav-container {
              position: fixed !important;
              bottom: 20px !important;
              left: 0 !important;
              right: 0 !important;
              z-index: 9999 !important;
            }
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
